---
name: api-contract-reviewer
description: Review Mutux API contract consistency between backend code, backend/docs/api.md, global response/error format, DTOs, status codes, auth guards, pagination, and backend/docs/bruno requests. Use for API reviews, contract drift checks, or documentation/Bruno synchronization.
---

# API Contract Reviewer

## Read First
- `backend/docs/api.md`
- `backend/docs/bruno`
- Relevant controllers and DTOs under `backend/src/modules`
- `backend/src/common/interceptors/transform.interceptor.ts`
- `backend/src/common/filters/http-exception.filter.ts`

## Workflow
1. Compare each route method, path, body, query, auth guard, and response status.
2. Check that success responses fit the global `{ success, data }` wrapper.
3. Check that errors fit the global `{ success: false, error: { code, message } }` wrapper.
4. Verify pagination uses `data` plus `meta` consistently.
5. Flag mismatches between docs, Bruno request files, and controller implementation.

## Quality Gates
- Prefer e2e tests or Bruno/manual request verification for changed endpoints.
- Do not mark a contract as correct from docs alone; compare with implementation.
