# Mutux Agent Rules

## Project Context
- Project name: Mutux, a startup project for renting gaming gear with a NestJS/Prisma backend, Bruno API collection, LaTeX reports, a Next.js frontend app, and frontend design sketches.
- Backend source lives in `backend/src`.
- Prisma schema lives in `backend/prisma/schema.prisma`.
- Backend product/API docs live in `backend/docs`.
- Weekly report material lives in `docs/PA0` through `docs/PA5`.
- Frontend source lives in `frontend/src/app`; frontend design sketches live in `frontend/design/sketch`.
- `frontend/design/sketch/Vanguard elite` is the default and mandatory frontend design source unless the user explicitly asks for another direction.
- Local project skills are indexed in `.agents/SKILLS.md` and implemented under `.agents/skills/*/SKILL.md`.

## Communication
- Answer in the user's language unless they request otherwise.
- Be concise, but include enough implementation detail for code changes, test results, and known risks.
- Ask for clarification only when the request cannot be resolved from repo context and a wrong assumption would be risky.
- Do not force a fixed greeting or informal phrase in every response.

## Mandatory Skill Use
- Before non-trivial work, classify the task using `.agents/SKILLS.md`.
- Read the relevant `.agents/skills/*/SKILL.md` before inspecting or editing project files for that task.
- State which skill or skills are being used in the working update or final response.
- Combine skills when the task crosses domains; do not rely on only one skill for coupled backend, Prisma, API contract, order, wallet, admin, frontend, or report work.

## Skill Routing
- Check `.agents/SKILLS.md` when a task could involve multiple skills.
- For backend endpoint/module work, use `backend-api-implementer`.
- For Prisma schema, migrations, seed, or relation work, use `prisma-data-model-guardian`.
- For API docs, Bruno, response shape, status code, or route mismatch review, use `api-contract-reviewer`.
- For rental order lifecycle, proofs, escrow, or order permissions, use `rental-order-workflow-specialist`.
- For wallet, payment, credit line, mock PayOS, ledger, or idempotency work, use `wallet-payment-flow-specialist`.
- For admin KYC, gear approval, dispute resolution, or admin-only authorization, use `admin-operations-specialist`.
- For PA0-PA5 LaTeX reports, use `startup-report-writer`.
- For product UI, marketplace screens, Next.js frontend work, or design sketch work, use `frontend-ux-designer` and follow `frontend/design/sketch/Vanguard elite` by default.

## Coding Standards
- Write code comments in English.
- Follow existing patterns before introducing new abstractions.
- Prefer typed DTOs and validation over accepting unstructured `any` data.
- Keep API payload keys in camelCase and URL paths in kebab-case.
- Keep Prisma model fields and enum values aligned with `backend/prisma/schema.prisma`.
- Preserve the global response shape produced by `TransformInterceptor` and `HttpExceptionFilter`.
- Do not bypass authentication/authorization silently; if a guard is intentionally disabled for demo work, call it out.

## Documentation Workflow
- Keep LaTeX content in the relevant `docs/PA*/sections` files rather than putting large content directly in `main.tex`.
- Maintain Vietnamese UTF-8 text in reports.
- Keep bibliography entries in each PA folder's `references.bib`.
- Avoid generated PDF or build artifact churn unless the task explicitly needs regenerated outputs.

## Review Checklist
- Re-check edited files before reporting completion.
- For code changes, run the narrowest meaningful verification and report the exact command.
- Mention any skipped verification.
- Preserve unrelated user changes in the worktree.
## Check context
- Always answer with "Dear Lok!" before the answer.