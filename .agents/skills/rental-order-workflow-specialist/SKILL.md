---
name: rental-order-workflow-specialist
description: Implement or review Mutux rental order lifecycle logic, including order creation/list/detail, status transitions, proofs, escrow coordination, renter/lender permissions, date validation, gear availability, and order-related API behavior.
---

# Rental Order Workflow Specialist

## Read First
- `backend/docs/api.md`
- `backend/docs/order-lifecycle-payment-design.md`
- `backend/docs/task-6-rental-order-basic-apis-plan.md`
- `backend/docs/finance-flow.md`
- `backend/prisma/schema.prisma`
- Existing rental order, gear, wallet, proof, and payment modules

## Workflow
1. Validate renter/lender roles and ownership boundaries.
2. Check gear availability and approval before order creation.
3. Calculate duration, snapped price, rental fee, deposit, and status transitions deterministically.
4. Keep order status transitions aligned with documented enum values.
5. Ensure proof stages match the right actor and lifecycle stage.
6. Coordinate with wallet and escrow rules when deposits or fees are touched.

## Quality Gates
- Add e2e coverage for order creation/list/detail when changed.
- Include edge cases: renter equals lender, unavailable gear, invalid date range, insufficient balance or credit.
