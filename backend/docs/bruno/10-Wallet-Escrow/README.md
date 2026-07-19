# Wallet Escrow Acceptance Bruno Flow

Run these requests in order.

Required environment variables:

- `baseUrl`: API base URL, for example `http://localhost:8080/api/v1`.
- `token`: JWT for a renter user. Collection auth sends `Authorization: Bearer {{token}}`.
- `PAYOS_WEBHOOK_SECRET`: must match backend `PAYOS_WEBHOOK_SECRET`. If omitted, request 04 uses `test-secret`.

Flow:

1. `01 Topup Checkout Amount Zero` verifies amount `0` returns `400`.
2. `02 Create Topup Checkout` creates a pending top-up and stores `topupId`, `topupOrderCode`, `topupAmount`.
3. `03 PayOS Webhook Invalid Signature` verifies bad HMAC returns `401 INVALID_SIGNATURE`.
4. `04 PayOS Webhook Valid Signature` signs the payload, completes the top-up, and stores `completedTopupId`.
5. `05 PayOS Webhook Duplicate Same Payload` resends the same payload/signature and should not credit again.
6. `06 Simulate Success Already Successful` calls simulate-success again and should return the existing successful top-up.

Escrow lock is service-level only in the current backend code unless an HTTP route such as `POST /escrow/orders/:orderId/lock` is added. Until that route exists, use `npm run test -- escrow.service.spec.ts` for insufficient cash, success, idempotency, and concurrency coverage.
