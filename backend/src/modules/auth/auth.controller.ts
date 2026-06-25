import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // Scaffold method for user registration
    return { message: 'Register placeholder' };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Scaffold method for user login
    return { accessToken: 'access_token_placeholder', refreshToken: 'refresh_token_placeholder' };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: any) {
    // Scaffold method for refreshing tokens
    return { accessToken: 'new_access_token_placeholder', refreshToken: 'new_refresh_token_placeholder' };
  }

  @Post('logout')
  async logout() {
    // Scaffold method for user logout
    return { message: 'Logout placeholder' };
  }
}
