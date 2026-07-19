import {
  Controller,
  Get,
  Body,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateData: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.id, {
      phone: updateData.phone,
      full_name: updateData.fullName,
      avatar_url: updateData.avatarUrl,
      bio: updateData.bio,
      address: updateData.address,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/kyc')
  async submitKyc(
    @Req() req: AuthenticatedRequest,
    @Body() body: SubmitKycDto,
  ) {
    return this.usersService.update(req.user.id, {
      cccd: body.cccd,
      kyc_status: 'pending',
    });
  }
}
