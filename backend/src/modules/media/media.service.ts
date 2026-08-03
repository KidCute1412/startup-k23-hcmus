import { BadRequestException, Injectable } from '@nestjs/common';
import { readFile, realpath, stat, unlink } from 'fs/promises';
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

  async uploadToImgBB(file: Express.Multer.File): Promise<string> {
    const apiKey = process.env.IMGBB_API_KEY || '1247eb3808ba7657106ecd9d71b8a0cb';
    const uploadUrl = process.env.IMGBB_UPLOAD_URL || 'https://api.imgbb.com/1/upload';
    try {
      const base64Image = (await readFile(file.path)).toString('base64');
      const formData = new FormData();
      formData.append('image', base64Image);
      const response = await fetch(`${uploadUrl}?key=${apiKey}`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(await response.text());
      const url = (await response.json() as { data?: { url?: string } }).data?.url;
      if (!url || !this.isImgBbUrl(url)) throw new Error('ImgBB returned an invalid image URL');
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException({ error: 'IMGBB_UPLOAD_FAILED', message: `Tải ảnh lên ImgBB thất bại: ${message}` });
    } finally {
      try { await unlink(file.path); } catch { /* already removed */ }
    }
  }

  isImgBbUrl(fileUrl: string): boolean {
    try {
      const url = new URL(fileUrl);
      return url.protocol === 'https:' && (url.hostname === 'i.ibb.co' || url.hostname === 'ibb.co') && url.pathname.length > 1 && !url.username && !url.password;
    } catch { return false; }
  }

  async assertOwnedImageFile(userId: string, fileUrl: string): Promise<string> {
    if (this.isImgBbUrl(fileUrl)) return fileUrl;
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
