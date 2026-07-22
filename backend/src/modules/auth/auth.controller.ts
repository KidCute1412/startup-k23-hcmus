import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type {
  AuthenticatedRequest,
  RefreshAuthenticatedRequest,
} from '../../common/types/authentication';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  ACCESS_TOKEN_COOKIE,
  accessTokenClearCookieOptions,
  accessTokenCookieOptions,
  getRefreshTokenFromRequest,
  REFRESH_TOKEN_COOKIE,
  refreshTokenClearCookieOptions,
  refreshTokenCookieOptions,
} from './auth-cookie';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      result.accessToken,
      accessTokenCookieOptions,
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      refreshTokenCookieOptions,
    );
    return { user: result.user };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: RefreshAuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refresh(
      req.user.id,
      req.user.refreshToken,
    );
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      accessTokenCookieOptions,
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      refreshTokenCookieOptions,
    );
    return null;
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.changePassword(req.user.id, dto);
    res.clearCookie(ACCESS_TOKEN_COOKIE, accessTokenClearCookieOptions);
    res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenClearCookieOptions);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(getRefreshTokenFromRequest(req));
    res.clearCookie(ACCESS_TOKEN_COOKIE, accessTokenClearCookieOptions);
    res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenClearCookieOptions);
  }
}
