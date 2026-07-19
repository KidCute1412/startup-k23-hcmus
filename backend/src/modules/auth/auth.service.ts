import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { id: userId, email, role };

    const accessTokenSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'fallbackSecretTokenForWeek1Dev';
    const refreshTokenSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'fallbackRefreshSecretTokenForWeek1Dev';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessTokenSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshTokenSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const hashedRefreshToken = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  async verifyRefreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access denied / Token invalid');
    }

    const isMatched = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!isMatched) {
      throw new UnauthorizedException('Access denied / Token mismatch');
    }

    return user;
  }
}
