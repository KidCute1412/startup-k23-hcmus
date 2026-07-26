import { BadRequestException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { parse, resolve } from 'path';
import type { AuthenticatedRequest } from '../../common/types/authentication';

export const MEDIA_MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function getUploadsRoot(): string {
  const configuredRoot = process.env.UPLOADS_DIR?.trim();
  return resolve(configuredRoot || resolve(process.cwd(), 'uploads'));
}

export function assertSafeUploadUserId(userId: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new BadRequestException({
      error: 'INVALID_UPLOAD_OWNER',
      message: 'Authenticated user id cannot be used as an upload path',
    });
  }
  return userId;
}

export function sanitizeImageFileName(
  originalName: string,
  mimeType: string,
): string {
  const originalStem = parse(originalName)
    .name.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const stem = originalStem || 'image';
  const extension = EXTENSION_BY_MIME_TYPE[mimeType];

  if (!extension) {
    throw unsupportedFileType();
  }

  return `${Date.now()}-${stem}${extension}`;
}

export function imageFileFilter(
  _request: AuthenticatedRequest,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ACCEPTED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    callback(unsupportedFileType(), false);
    return;
  }
  callback(null, true);
}

export const MEDIA_MULTER_OPTIONS: MulterOptions = {
  storage: diskStorage({
    destination: (request: AuthenticatedRequest, _file, callback) => {
      try {
        const userId = assertSafeUploadUserId(request.user.id);
        const destination = resolve(getUploadsRoot(), userId);
        mkdirSync(destination, { recursive: true });
        callback(null, destination);
      } catch (error) {
        callback(error as Error, '');
      }
    },
    filename: (_request, file, callback) => {
      try {
        callback(null, sanitizeImageFileName(file.originalname, file.mimetype));
      } catch (error) {
        callback(error as Error, '');
      }
    },
  }),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MEDIA_MAX_FILE_SIZE,
    files: 1,
  },
};

export function configureStaticUploads(app: NestExpressApplication): void {
  const uploadsRoot = getUploadsRoot();
  mkdirSync(uploadsRoot, { recursive: true });
  app.useStaticAssets(uploadsRoot, {
    prefix: '/uploads/',
    index: false,
  });
}

function unsupportedFileType(): BadRequestException {
  return new BadRequestException({
    error: 'UNSUPPORTED_FILE_TYPE',
    message: 'Only JPEG, PNG, and WEBP images are supported',
  });
}
