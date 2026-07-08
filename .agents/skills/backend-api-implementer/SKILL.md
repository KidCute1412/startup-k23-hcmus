---
name: backend-api-implementer
description: Implement or change Mutux NestJS backend APIs, modules, controllers, services, repositories, DTOs, guards, validation, and route behavior. Use for endpoint work under backend/src, especially when matching backend/docs/api.md, Prisma models, global response wrappers, or Bruno requests.
---

# Backend API Implementer

## Read First
- `backend/docs/api.md`
- `backend/prisma/schema.prisma`
- Existing module files under `backend/src/modules/<domain>` when present; if the module does not exist yet, read the closest established modules such as `auth`, `gears`, `users`, or `categories` plus relevant docs.
- `backend/src/main.ts`
- `backend/src/common/interceptors/transform.interceptor.ts`
- `backend/src/common/filters/http-exception.filter.ts`

## Workflow
1. Confirm the route path, method, request body, query parameters, auth requirement, and response shape from docs.
2. Follow the existing `controller` -> `service` -> `repository` module pattern.
3. Add DTO classes with `class-validator` instead of accepting `any`.
4. Keep JSON payload keys camelCase at API boundaries; map to Prisma snake_case fields intentionally.
5. Use guards for protected endpoints and call out any temporary demo bypass.
6. Update or add Bruno requests under `backend/docs/bruno` when endpoint behavior changes.

## Quality Gates
- From `backend`, run `npm run lint` after implementation when code style or TypeScript files changed. It currently runs with `--fix`, so in review or plan-only work list it as follow-up verification rather than executing it.
- Run `npm run test` for service/repository behavior changes.
- Run `npm run test:e2e` when routes, guards, or module wiring changed.
