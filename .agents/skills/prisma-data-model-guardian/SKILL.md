---
name: prisma-data-model-guardian
description: Maintain Mutux Prisma schema, relations, enums, mapped table names, indexes, seed data, migrations, and database integrity. Use when changing backend/prisma/schema.prisma, backend/prisma/seed.ts, SQL init scripts, or any code whose correctness depends on Prisma model shape.
---

# Prisma Data Model Guardian

## Read First
- `backend/prisma/schema.prisma`
- `backend/docs/schema.md`
- `backend/prisma/seed.ts`
- `backend/scripts/init_schema.sql`
- Code that queries the affected models under `backend/src/modules`

## Workflow
1. Check existing model names, mapped table names, enum values, indexes, relation names, and delete behavior.
2. Preserve compatibility with documented API fields and business flows.
3. Treat financial, order, and wallet records as ledger-like data; avoid destructive updates unless explicitly required.
4. Update seed data if required for local demo flows.
5. Note migration impact and any data backfill requirements.

## Quality Gates
- Run Prisma validation/generation when schema changes.
- Run backend tests that touch affected models.
- For wallet/order schema changes, include at least one workflow-level verification path.
