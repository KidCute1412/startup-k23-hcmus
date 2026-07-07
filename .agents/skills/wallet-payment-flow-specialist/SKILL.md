---
name: wallet-payment-flow-specialist
description: Implement or review Mutux wallet and payment flows, including renter virtual wallet, Mutux credit line, lender wallet, top-ups, mock PayOS webhook, escrow release, ledger records, balance updates, idempotency, and financial consistency.
---

# Wallet Payment Flow Specialist

## Read First
- `backend/docs/finance-flow.md`
- `backend/docs/order-lifecycle-payment-design.md`
- `backend/docs/api.md`
- `backend/prisma/schema.prisma`
- Wallet, payment, rental order, and escrow code

## Workflow
1. Treat balance updates and transaction records as one atomic business operation.
2. Keep idempotency for webhook and simulated success endpoints.
3. Distinguish renter virtual wallet, Mutux credit line, lender income wallet, payments, and escrow records.
4. Never update only a visible balance without a corresponding transaction or payment record when the schema supports one.
5. Check decimal money handling and avoid floating-point assumptions.
6. Keep demo/mock PayOS behavior explicit and separate from real payment gateway behavior.

## Quality Gates
- Add tests for balance-before/balance-after correctness.
- Include duplicate webhook or repeated simulate-success verification.
- Include insufficient funds/credit checks where relevant.
