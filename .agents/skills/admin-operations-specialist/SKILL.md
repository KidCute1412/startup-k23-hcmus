---
name: admin-operations-specialist
description: Implement or review Mutux admin operations such as KYC approval, gear approval, dispute resolution, moderation, admin-only authorization, resolver identity, status transitions, and admin API contract behavior.
---

# Admin Operations Specialist

## Read First
- `backend/docs/api.md`
- `backend/docs/schema.md`
- `backend/prisma/schema.prisma`
- Auth guards/strategies under `backend/src/common/guards` and `backend/src/modules/auth`
- User, gear, dispute, wallet, and rental order modules

## Workflow
1. Verify the endpoint is admin-only and cannot be called by renter/lender users.
2. Keep approval status values aligned with Prisma enums and API docs.
3. For dispute resolution, verify order ownership, current order status, escrow state, and financial side effects.
4. Record resolver/admin identity when schema supports it.
5. Avoid irreversible state changes without checking the current state transition is valid.

## Quality Gates
- Add e2e tests for admin-only access.
- Include negative cases for non-admin users and invalid current statuses.
