# Credit limit request flow

The MVP uses fixed tiers of 3, 5, and 10 million VND. A renter accepts credit
terms during KYC submission; the timestamp is stored on `User`. Admin KYC
approval grants the 3 million tier atomically and records one `limit_granted`
ledger with `refType = kyc_verification` and `refId = userId`.

For an increase, the renter accepts a consent snapshot and requests exactly one
higher tier. Five million requires three completed rentals; ten million
requires ten. A renter may move directly from 3 to 10 million. Legacy limits
are preserved and can only move to the next configured larger tier.

Requests move through:

`pending -> under_review -> approved`

or `pending|under_review -> rejected`, and an owner may move `pending ->
cancelled`. Only one pending/under-review request is allowed per renter.

Policy is evaluated at creation and approval. Debt, open/under-review disputes,
and any dispute resolved with `deposit_deduct` block approval. Admin approval
must equal the requested tier. The wallet, request, and `limit_adjustment`
ledger are updated in one transaction; locked balance and debt are preserved.
Repeated approval with the same result is idempotent, while a different result
returns `APPROVAL_RESULT_MISMATCH`.

Credit does not expire in MVP. Full debt repayment is supported from the renter
wallet; partial repayment is deferred. `CreditPartner` is metadata and has no
runtime decision role.
