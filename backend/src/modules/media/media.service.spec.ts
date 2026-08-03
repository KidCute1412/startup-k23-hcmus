import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let uploadsRoot: string;
  let originalUploadsDir: string | undefined;
  let service: MediaService;
  const ownerId = '10000000-0000-0000-0000-000000000001';
  const otherUserId = '10000000-0000-0000-0000-000000000002';
  const fileName = '1710000000000-proof.jpg';

  beforeEach(() => {
    originalUploadsDir = process.env.UPLOADS_DIR;
    uploadsRoot = mkdtempSync(join(tmpdir(), 'mutux-media-unit-'));
    process.env.UPLOADS_DIR = uploadsRoot;
    mkdirSync(join(uploadsRoot, ownerId), { recursive: true });
    writeFileSync(join(uploadsRoot, ownerId, fileName), 'image');
    service = new MediaService();
  });

  afterEach(() => {
    if (originalUploadsDir === undefined) {
      delete process.env.UPLOADS_DIR;
    } else {
      process.env.UPLOADS_DIR = originalUploadsDir;
    }
    rmSync(uploadsRoot, { recursive: true, force: true });
  });

  it('accepts an existing image inside the caller upload directory', async () => {
    await expect(
      service.assertOwnedImageFile(ownerId, `/uploads/${ownerId}/${fileName}`),
    ).resolves.toBe(`/uploads/${ownerId}/${fileName}`);
  });

  it('accepts ImgBB URLs returned by the upload endpoint', async () => {
    const url = 'https://i.ibb.co/abc123/avatar.jpg';

    await expect(service.assertOwnedImageFile(ownerId, url)).resolves.toBe(url);
  });

  it('rejects a file uploaded by another user', async () => {
    await expect(
      service.assertOwnedImageFile(
        otherUserId,
        `/uploads/${ownerId}/${fileName}`,
      ),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'INVALID_FILE_URL' },
    });
  });

  it.each([
    'https://example.com/proof.jpg',
    'https://evil-ibb.co/abc/proof.jpg',
    `/uploads/${ownerId}/../proof.jpg`,
    `/uploads/${ownerId}/missing.jpg`,
  ])('rejects an external, traversing, or missing URL: %s', async (fileUrl) => {
    await expect(
      service.assertOwnedImageFile(ownerId, fileUrl),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'INVALID_FILE_URL' },
    });
  });
});
