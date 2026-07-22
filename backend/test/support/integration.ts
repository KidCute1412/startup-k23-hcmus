import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ACCESS_TOKEN_COOKIE } from '../../src/modules/auth/auth-cookie';
import type { App } from 'supertest/types';

export const INTEGRATION_FRONTEND_ORIGIN = 'http://localhost:3000';

export async function createIntegrationApp(): Promise<{
  app: INestApplication<App>;
  prisma: PrismaService;
}> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication<INestApplication<App>>({
    rawBody: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export function createFixtureIds() {
  const ids: string[] = [];
  return {
    ids,
    newId: () => {
      const id = randomUUID();
      ids.push(id);
      return id;
    },
  };
}

export function createJwt(id: string, role: string) {
  return new JwtService().sign(
    { id, email: `${role}@integration.test`, role },
    {
      secret: process.env.JWT_SECRET ?? 'integration-test-secret',
      expiresIn: '15m',
    },
  );
}

export function createAccessTokenCookie(token: string) {
  return `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}`;
}
