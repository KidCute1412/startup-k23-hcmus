import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Set Global Route Prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  app.enableCors();

  // Wire Validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out non-dto defined properties
      transform: true, // Converts types automatically
      forbidNonWhitelisted: true,
    }),
  );

  // Wire Global Custom Filters & Interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}
void bootstrap().catch((error: unknown) => {
  console.error('Application bootstrap failed', error);
  process.exitCode = 1;
});
