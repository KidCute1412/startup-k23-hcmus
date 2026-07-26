import type { AuthenticatedRequest } from '../../common/types/authentication';
import {
  MEDIA_MAX_FILE_SIZE,
  MEDIA_MULTER_OPTIONS,
  imageFileFilter,
  sanitizeImageFileName,
} from './media-storage';

describe('media upload configuration', () => {
  const request = {} as AuthenticatedRequest;

  it.each(['image/jpeg', 'image/png', 'image/webp'])(
    'accepts the supported MIME type %s',
    (mimetype) => {
      const callback = jest.fn();
      imageFileFilter(request, { mimetype } as Express.Multer.File, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    },
  );

  it('rejects unsupported MIME types with UNSUPPORTED_FILE_TYPE', () => {
    const callback = jest.fn();
    imageFileFilter(
      request,
      { mimetype: 'application/pdf' } as Express.Multer.File,
      callback,
    );

    const [error, accepted] = callback.mock.calls[0] as [
      { response: { error: string } },
      boolean,
    ];
    expect(accepted).toBe(false);
    expect(error.response.error).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('configures the upload limit at exactly 5MB', () => {
    expect(MEDIA_MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(MEDIA_MULTER_OPTIONS.limits?.fileSize).toBe(MEDIA_MAX_FILE_SIZE);
  });

  it('sanitizes the original name and derives extension from MIME type', () => {
    const fileName = sanitizeImageFileName(
      '../../Ảnh sản phẩm<script>.html',
      'image/webp',
    );

    expect(fileName).toMatch(/^\d+-Anh-san-pham-script\.webp$/);
  });
});
