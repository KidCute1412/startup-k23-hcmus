import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const concurrency = 8;
const timeoutMs = 12_000;
const maxAttempts = 2;

type MediaRow = {
  id: string;
  gear_id: string;
  type: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
};

type AuditResult = {
  url: string;
  ok: boolean;
  status: number | null;
  contentType: string | null;
  finalUrl: string | null;
  error?: string;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const expectedContentType = (mediaType: string) =>
  mediaType.toLowerCase() === 'video' ? 'video/' : 'image/';

const normalizeAssetId = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'images.unsplash.com') return parsed.pathname;
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
};

const fetchWithTimeout = async (url: string, method: 'HEAD' | 'GET') => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: method === 'GET' ? { Range: 'bytes=0-1023' } : undefined,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const inspectUrl = async (url: string): Promise<AuditResult> => {
  let lastError = 'Unknown request failure';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let response = await fetchWithTimeout(url, 'HEAD');
      if (
        response.status === 403 ||
        response.status === 405 ||
        response.status >= 500
      ) {
        response = await fetchWithTimeout(url, 'GET');
      }

      const contentType = response.headers.get('content-type');
      return {
        url,
        ok: response.ok,
        status: response.status,
        contentType,
        finalUrl: response.url,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    url,
    ok: false,
    status: null,
    contentType: null,
    finalUrl: null,
    error: lastError,
  };
};

const mapWithConcurrency = async <T, R>(
  values: T[],
  worker: (value: T) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  const runners = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (nextIndex < values.length) {
        const currentIndex = nextIndex++;
        results[currentIndex] = await worker(values[currentIndex]);
      }
    },
  );

  await Promise.all(runners);
  return results;
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const media = (await prisma.gearMedia.findMany({
    orderBy: [{ gear_id: 'asc' }, { sort_order: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      gear_id: true,
      type: true,
      url: true,
      is_primary: true,
      sort_order: true,
    },
  })) as MediaRow[];

  if (media.length === 0) {
    console.log('No gear media rows found.');
    return;
  }

  const uniqueUrls = [...new Set(media.map((item) => item.url))];
  console.log(
    `Auditing ${media.length} media rows across ${uniqueUrls.length} unique URLs...`,
  );

  const resultList = await mapWithConcurrency(uniqueUrls, inspectUrl);
  const resultByUrl = new Map(resultList.map((result) => [result.url, result]));

  const invalidRows = media.filter((item) => {
    const result = resultByUrl.get(item.url);
    return (
      !result?.ok ||
      !result.contentType
        ?.toLowerCase()
        .startsWith(expectedContentType(item.type))
    );
  });

  const photoIdGroups = new Map<string, MediaRow[]>();
  for (const item of media) {
    const assetId = normalizeAssetId(item.url);
    photoIdGroups.set(assetId, [...(photoIdGroups.get(assetId) ?? []), item]);
  }

  const duplicateSources = [...photoIdGroups.entries()]
    .filter(([, rows]) => rows.length > 1)
    .sort((left, right) => right[1].length - left[1].length);

  const gearGroups = new Map<string, MediaRow[]>();
  for (const item of media) {
    gearGroups.set(item.gear_id, [
      ...(gearGroups.get(item.gear_id) ?? []),
      item,
    ]);
  }
  const missingPrimary = [...gearGroups.entries()].filter(
    ([, rows]) => rows.filter((row) => row.is_primary).length !== 1,
  );
  const repeatedWithinGear = [...gearGroups.entries()].filter(([, rows]) => {
    const assetIds = rows.map((row) => normalizeAssetId(row.url));
    return new Set(assetIds).size !== assetIds.length;
  });

  for (const row of invalidRows) {
    const result = resultByUrl.get(row.url);
    console.error(
      [
        `BROKEN media=${row.id}`,
        `gear=${row.gear_id}`,
        `status=${result?.status ?? 'request-failed'}`,
        `content-type=${result?.contentType ?? 'missing'}`,
        `url=${row.url}`,
        result?.error ? `error=${result.error}` : null,
      ]
        .filter(Boolean)
        .join(' '),
    );
  }

  console.log(`Media rows: ${media.length}`);
  console.log(`Unique URLs: ${uniqueUrls.length}`);
  console.log(`Unique source assets: ${photoIdGroups.size}`);
  console.log(`Reused source assets: ${duplicateSources.length}`);
  console.log(`Invalid media rows: ${invalidRows.length}`);
  console.log(`Gears with invalid primary count: ${missingPrimary.length}`);
  console.log(`Gears repeating the same source: ${repeatedWithinGear.length}`);

  if (
    invalidRows.length > 0 ||
    missingPrimary.length > 0 ||
    repeatedWithinGear.length > 0
  ) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
