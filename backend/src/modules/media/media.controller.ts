import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { MEDIA_MULTER_OPTIONS } from './media-storage';
import { MediaUploadLimitFilter } from './media-upload-limit.filter';
import { MediaService } from './media.service';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseFilters(MediaUploadLimitFilter)
  @UseInterceptors(FileInterceptor('file', MEDIA_MULTER_OPTIONS))
  upload(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({
        error: 'FILE_REQUIRED',
        message: 'A file is required',
      });
    }

    return {
      url: this.mediaService.getUploadedFileUrl(request.user.id, file.filename),
    };
  }
}
