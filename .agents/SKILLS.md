# Mutux Skill Index

Use this as the table of contents for local Mutux skills. Each skill has a focused `SKILL.md`; detailed workflow belongs in those files, not here.

## Selection Rules
- Use the most specific skill first, then combine with `backend-api-implementer` when implementation touches NestJS route/module code.
- Use `prisma-data-model-guardian` before implementation when a task changes or depends on model shape, enum values, relations, seed data, or SQL scripts.
- Use `api-contract-reviewer` after any implementation that changes API behavior, response shape, docs, or Bruno requests.
- For backend endpoint work backed by model changes, use `backend-api-implementer`, `prisma-data-model-guardian`, and then `api-contract-reviewer`.
- Use both `rental-order-workflow-specialist` and `wallet-payment-flow-specialist` for order flows that lock, release, debit, refund, or compensate money.
- Use `admin-operations-specialist` with `wallet-payment-flow-specialist` or `rental-order-workflow-specialist` when admin actions resolve disputes, approve state transitions, or cause financial/order side effects.
- Use `frontend-ux-designer` for frontend app, marketplace UI, responsive UX, or design sketch work; default to `frontend/design/sketch/Vanguard elite` unless the user explicitly names another direction.

## Backend
- `skills/backend-api-implementer/SKILL.md`: endpoints, modules, controllers, services, repositories, DTOs, guards.
- `skills/prisma-data-model-guardian/SKILL.md`: schema, relations, enums, migrations, seed, SQL init, database integrity.
- `skills/api-contract-reviewer/SKILL.md`: code/docs/Bruno consistency, response shape, auth, status codes, pagination.
- `skills/rental-order-workflow-specialist/SKILL.md`: rental orders, proofs, status transitions, escrow coordination, permissions.
- `skills/wallet-payment-flow-specialist/SKILL.md`: renter wallet, credit line, lender wallet, mock PayOS, ledger, idempotency.
- `skills/admin-operations-specialist/SKILL.md`: KYC approval, gear approval, dispute resolution, admin authorization.

## Product And Docs
- `skills/startup-report-writer/SKILL.md`: PA0-PA5 Vietnamese LaTeX reports, citations, bibliography.
- `skills/frontend-ux-designer/SKILL.md`: marketplace UX, product screens, responsive UI, Next.js frontend app, design sketches, default Vanguard Elite direction.
