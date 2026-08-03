import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ACCESS_TOKEN_COOKIE } from '../../src/modules/auth/auth-cookie';
import type { App } from 'supertest/types';
import { configureStaticUploads } from '../../src/modules/media/media-storage';

export const INTEGRATION_FRONTEND_ORIGIN = 'http://localhost:3000';

// Integration tests must not depend on the external ImgBB service. Keep the
// production upload path intact and mock only ImgBB's HTTP response here.
let imgbbMockInstalled = false;

export async function createIntegrationApp(): Promise<{
  app: INestApplication<App>;
  prisma: PrismaService;
}> {
  if (!imgbbMockInstalled) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { url: 'https://i.ibb.co/integration/proof.jpg' },
        }),
    });
    imgbbMockInstalled = true;
  }
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const nestExpressApp =
    moduleFixture.createNestApplication<NestExpressApplication>({
      rawBody: true,
    });
  const app: INestApplication<App> = nestExpressApp;
  app.setGlobalPrefix('api/v1');
  configureStaticUploads(nestExpressApp);
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
