import { BadRequestException, Injectable } from '@nestjs/common';
import { realpath, stat } from 'fs/promises';
import { basename, extname, relative, resolve, sep } from 'path';
import { assertSafeUploadUserId, getUploadsRoot } from './media-storage';

@Injectable()
export class MediaService {
  getUploadedFileUrl(userId: string, fileName: string): string {
    const safeUserId = assertSafeUploadUserId(userId);
    if (basename(fileName) !== fileName) {
      throw this.invalidFileUrl();
    }
    return `/uploads/${safeUserId}/${fileName}`;
  }

  async assertOwnedImageFile(userId: string, fileUrl: string): Promise<string> {
    const safeUserId = assertSafeUploadUserId(userId);
    const expectedPrefix = `/uploads/${safeUserId}/`;

    if (
      !fileUrl.startsWith(expectedPrefix) ||
      fileUrl.includes('?') ||
      fileUrl.includes('#')
    ) {
      throw this.invalidFileUrl();
    }

    const fileName = fileUrl.slice(expectedPrefix.length);
    if (
      !fileName ||
      basename(fileName) !== fileName ||
      !['.jpg', '.png', '.webp'].includes(extname(fileName).toLowerCase())
    ) {
      throw this.invalidFileUrl();
    }

    const userDirectory = resolve(getUploadsRoot(), safeUserId);
    const candidatePath = resolve(userDirectory, fileName);
    if (!this.isInsideDirectory(userDirectory, candidatePath)) {
      throw this.invalidFileUrl();
    }

    try {
      const [directoryRealPath, fileRealPath, fileStat] = await Promise.all([
        realpath(userDirectory),
        realpath(candidatePath),
        stat(candidatePath),
      ]);
      if (
        !fileStat.isFile() ||
        !this.isInsideDirectory(directoryRealPath, fileRealPath)
      ) {
        throw this.invalidFileUrl();
      }
    } catch {
      throw this.invalidFileUrl();
    }

    return `/uploads/${safeUserId}/${fileName}`;
  }

  private isInsideDirectory(directory: string, candidate: string): boolean {
    const relativePath = relative(directory, candidate);
    return (
      relativePath.length > 0 &&
      relativePath !== '..' &&
      !relativePath.startsWith(`..${sep}`)
    );
  }

  private invalidFileUrl(): BadRequestException {
    return new BadRequestException({
      error: 'INVALID_FILE_URL',
      message: 'fileUrl must reference an image uploaded by the current user',
    });
  }
}
