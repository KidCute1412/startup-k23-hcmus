import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { JwtPayload } from '../../common/types/authentication';

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

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        full_name: dto.fullName,
      },
      select: { id: true, email: true, full_name: true },
    });

    return { id: user.id, email: user.email, fullName: user.full_name };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.verifyRefreshToken(userId, refreshToken);
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(dto.oldPassword, user.password_hash))) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: await bcrypt.hash(dto.newPassword, 10),
        hashedRefreshToken: null,
      },
    });
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            'fallbackRefreshSecretTokenForWeek1Dev',
        },
      );
      await this.verifyRefreshToken(payload.id, refreshToken);
      await this.updateRefreshToken(payload.id, null);
    } catch {
      // Logout is idempotent. The controller still clears an expired or invalid cookie.
    }
  }
}
