import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  accessTokenClearCookieOptions,
  ACCESS_TOKEN_COOKIE,
  refreshTokenClearCookieOptions,
  REFRESH_TOKEN_COOKIE,
} from '../auth/auth-cookie';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { CloseAccountDto } from './dto/close-account.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateData: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateData);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async closeAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CloseAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.usersService.closeAccount(req.user.id, dto);
    res.clearCookie(ACCESS_TOKEN_COOKIE, accessTokenClearCookieOptions);
    res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenClearCookieOptions);
    return result;
  }

  @Post('me/kyc')
  @HttpCode(HttpStatus.OK)
  submitKyc(@Req() req: AuthenticatedRequest, @Body() body: SubmitKycDto) {
    return this.usersService.submitKyc(req.user.id, body);
  }

  @Get('me/addresses')
  listAddresses(@Req() req: AuthenticatedRequest) {
    return this.usersService.listAddresses(req.user.id);
  }

  @Post('me/addresses')
  @HttpCode(HttpStatus.CREATED)
  createAddress(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(req.user.id, dto);
  }

  @Patch('me/addresses/:addressId')
  updateAddress(
    @Req() req: AuthenticatedRequest,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(req.user.id, addressId, dto);
  }

  @Delete('me/addresses/:addressId')
  @HttpCode(HttpStatus.OK)
  deleteAddress(
    @Req() req: AuthenticatedRequest,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
  ) {
    return this.usersService.deleteAddress(req.user.id, addressId);
  }

  @Patch('me/addresses/:addressId/default')
  setDefaultAddress(
    @Req() req: AuthenticatedRequest,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
  ) {
    return this.usersService.setDefaultAddress(req.user.id, addressId);
  }
}
