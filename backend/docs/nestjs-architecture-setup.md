# NestJS Architecture and Initial Setup Guide

This document outlines the suggested architecture organization and initial setup steps for NestJS, tailored to the requirements of the project.

---

## 🏗️ 1. Proposed Project Directory Structure

NestJS is designed around **Modules**. To follow the requested `Controller - Service - Repository` structure, we recommend a **Modular Layered Architecture**. Each feature module (e.g., `auth`, `users`, `gears`) encapsulates its own controllers, services, and repositories.

Here is the proposed folder layout under `backend/`:

```text
backend/
├── src/
│   ├── app.module.ts              # Root application module
│   ├── main.ts                    # Application entry point
│   │
│   ├── common/                    # Shared resources (guards, interceptors, filters, decorators)
│   │   ├── decorators/            # Custom decorators (e.g., @GetUser())
│   │   ├── filters/               # Custom exception filters
│   │   │   └── http-exception.filter.ts  # Standardizes all error responses
│   │   ├── guards/                # Guards for routes
│   │   │   └── jwt-auth.guard.ts  # Decodes & verifies JWT tokens
│   │   ├── interceptors/          # Response modifiers
│   │   │   └── transform.interceptor.ts  # Wraps successful responses
│   │   └── pipes/                 # Custom pipes
│   │
│   ├── config/                    # Config modules & validation schemas (Joi)
│   │   └── database.config.ts     # Config schema for database
│   │
│   ├── prisma/                    # Prisma DB connection module and service
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   └── modules/                   # Feature Modules (Core Business Logic)
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── strategies/        # JWT Passport Strategy
│       │   │   └── jwt.strategy.ts
│       │   └── dto/               # LoginDto, RegisterDto
│       │
│       ├── users/                 # Manage users accounts
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   └── users.repository.ts
│       │
│       └── gears/                 # Manage gear catalog
│           ├── gears.module.ts
│           ├── gears.controller.ts
│           ├── gears.service.ts
│           └── gears.repository.ts
│
├── prisma/                        # Prisma migration folder
│   ├── schema.prisma              # Prisma schema definition
│   └── seed.ts                    # DB seeding scripts
│
├── .env.example                   # Environment variable template
├── .env                           # Environment variables (ignored by Git)
├── tsconfig.json
├── package.json
└── README.md                      # Instructions on how to run & setup the project
```

> [!TIP]
> Introducing a dedicated `*.repository.ts` file within each module separates database queries (ORM-specific code) from business logic (`*.service.ts`), making it easy to swap database libraries or write unit tests.

---

## 🛠️ 2. Step-by-Step Initial Setup Guide

### Step 2.1: Initialize NestJS inside the `backend` folder

If the `backend` folder is already initialized or empty, you can run the NestJS CLI inside it:

```bash
# Install Nest CLI globally if you haven't already
npm i -g @nestjs/cli

# Alternatively, initialize directly using npx inside the backend folder:
npx -y @nestjs/cli new . --package-manager npm
```

### Step 2.2: Install Required Dependencies

Run these commands to install critical libraries for **Validation**, **Prisma/PostgreSQL**, **JWT Authentication**, and **Hashing**:

```bash
# 1. Config & Validation
npm i @nestjs/config class-validator class-transformer

# 2. Database (Prisma ORM)
npm i @prisma/client
npm i -D prisma

# 3. Authentication & Security
npm i @nestjs/jwt passport @nestjs/passport passport-jwt bcrypt
npm i -D @types/passport-jwt @types/bcrypt
```

### Step 2.3: Initialize Prisma Database Client

Run this to create the Prisma schema file:

```bash
npx prisma init
```

This creates a `prisma/schema.prisma` file. You can configure your PostgreSQL connection string in the generated `.env` file.

### Step 2.4: Apply Prisma schema and seed the database

Before running the commands below, make sure your `DATABASE_URL` is set in the project's `.env` and your database server is running.

Run the following commands to generate the Prisma client, apply the schema to the database, and seed initial data from `prisma/seed.ts`:

```bash
# Generate the Prisma client (required after editing schema.prisma)
npx prisma generate

# Create and apply a migration (development):
npx prisma migrate dev --name init

# Alternatively, push the schema directly (no migration history, use for quick dev setups):
npx prisma db push

# Run the TypeScript seed script directly (requires ts-node installed)
npx ts-node prisma/seed.ts
# or
npx prisma db seed

# Optional: open Prisma Studio to inspect seeded data
npx prisma studio
```

If you prefer to run the seed step through an npm script, add a script to `package.json` such as:

```json
"scripts": {
  "prisma:seed": "ts-node prisma/seed.ts"
}
```

Then run:

```bash
npm run prisma:seed
```

Note: If your seed file is compiled JavaScript (for example, `dist/prisma/seed.js`), run it with `node` instead of `ts-node`.

---

## 📜 3. Implementing Core Boilerplate Requirements

### 3.1 Standardizing API Responses

According to `api.md` and the acceptance criteria in `tasks-week1.md`, error responses must be standardized as:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description details"
  }
}
```

#### A. Global Error Filter (`src/common/filters/http-exception.filter.ts`)

Create this file to intercept all HTTP Exceptions (e.g., `BadRequestException`, `UnauthorizedException`) and format them correctly:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      message =
        typeof exceptionResponse === 'object'
          ? exceptionResponse.message || exception.message
          : exceptionResponse;

      // Map HTTP status to custom error codes if desired, or default to status name
      errorCode =
        typeof exceptionResponse === 'object' && exceptionResponse.error
          ? exceptionResponse.error.toUpperCase().replace(/\s+/g, '_')
          : HttpStatus[status];
    } else {
      // Log generic errors for server administration
      console.error(exception);
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: Array.isArray(message) ? message.join(', ') : message,
      },
    });
  }
}
```

#### B. Global Success Transformation Interceptor

To automate wrapping standard successful outcomes inside `{"success": true, "data": ...}`:

Create `src/common/interceptors/transform.interceptor.ts`:

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: data || null,
      })),
    );
  }
}
```

---

### 3.2 Prisma Service Config (`src/prisma/prisma.service.ts`)

Wrap Prisma Client inside a NestJS service to handle connections cleanly:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

### 3.3 Registering Filters, Pipes, and Interceptors Globally (`src/main.ts`)

Update your `main.ts` file to wire these utilities:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set Global Route Prefix (e.g. /api/v1)
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  app.enableCors();

  // Wire Validation globally for body payload validations (Task 2 DTO validates)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out non-dto defined properties
      transform: true, // Converts types automatically (e.g. string to number in pagination)
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
bootstrap();
```

---

### 3.4 Setting up Passport JWT Auth Guard (`src/common/guards/jwt-auth.guard.ts`)

Create a custom JWT Guard extending the standard passport-jwt strategy:

```typescript
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add custom authentication override here (e.g. public routes metadata) if needed
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException('Invalid or expired authentication token')
      );
    }
    return user;
  }
}
```

Then, design your `JwtStrategy` under `src/modules/auth/strategies/jwt.strategy.ts` extracting the bearer token:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallbackSecretTokenForWeek1Dev',
    });
  }

  async validate(payload: any) {
    // This value is injected into request.user
    return { id: payload.id, email: payload.email, role: payload.role };
  }
}
```
