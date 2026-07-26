import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(PayloadTooLargeException)
export class MediaUploadLimitFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size must not exceed 5MB',
      },
    });
  }
}
