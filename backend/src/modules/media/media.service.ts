import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { readFile, realpath, stat, unlink } from 'fs/promises';
import { basename, extname, relative, resolve, sep } from 'path';
import { ACCEPTED_IMAGE_MIME_TYPES, assertSafeUploadUserId, getUploadsRoot } from './media-storage';

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
    const apiKey = process.env.IMGBB_API_KEY?.trim();
    const uploadUrl =
      process.env.IMGBB_UPLOAD_URL || 'https://api.imgbb.com/1/upload';
    if (!apiKey) {
      await this.removeTempFile(file.path);
      throw new ServiceUnavailableException({ error: 'IMGBB_NOT_CONFIGURED', message: 'ImgBB chưa được cấu hình. Vui lòng thiết lập IMGBB_API_KEY.' });
    }
    if (!ACCEPTED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      await this.removeTempFile(file.path);
      throw new BadRequestException({ error: 'UNSUPPORTED_FILE_TYPE', message: 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WEBP.' });
    }
    try {
      const base64Image = (await readFile(file.path)).toString('base64');
      const formData = new FormData();
      formData.append('image', base64Image);
      const response = await fetch(`${uploadUrl}?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'ImgBB từ chối xác thực API key.' : `ImgBB trả về HTTP ${response.status}.`);
      const url = ((await response.json()) as { data?: { url?: string } }).data
        ?.url;
      if (!url || !this.isImgBbUrl(url)) throw new Error('ImgBB trả về URL ảnh không hợp lệ.');
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException({
        error: message.includes('fetch') ? 'IMGBB_NETWORK_ERROR' : 'IMGBB_UPLOAD_FAILED',
        message: `Tải ảnh lên ImgBB thất bại: ${message}`,
      });
    } finally {
      await this.removeTempFile(file.path);
    }
  }

  private async removeTempFile(filePath: string): Promise<void> {
    try { await unlink(filePath); } catch { /* already removed */ }
  }

  isImgBbUrl(fileUrl: string): boolean {
    try {
      const url = new URL(fileUrl);
      return (
        url.protocol === 'https:' &&
        (url.hostname === 'i.ibb.co' || url.hostname === 'ibb.co') &&
        url.pathname.length > 1 &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
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
