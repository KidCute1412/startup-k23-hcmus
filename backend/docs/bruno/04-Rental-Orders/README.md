# Rental order transition flow

Use `rentalOrderId` for the happy path and a separate untouched `cancelOrderId` for cancel. Each state-changing request requires `Origin: http://localhost:3000` and the correct logged-in cookie.

1. Renter creates an order (`pending_confirm`).
2. Lender runs **Confirm Rental Order**. Retry is safe and does not debit/lock twice.
3. Lender uploads media, sets `proofStage = pre_shipment`, then runs **Upload Proof**.
4. Lender runs **Ship Rental Order** (`delivering`).
5. Renter runs **Confirm Rental Receipt** (`active`).
6. Renter runs **Return Rental Order** (`returning`).
7. Renter uploads media, sets `proofStage = pre_return`, then runs **Upload Proof**.
8. Lender uploads media, sets `proofStage = post_returned`, then runs **Upload Proof**.
9. Lender runs **Confirm Rental Return**. Settlement and `completed` commit atomically; retry does not settle twice.

Cancel is a separate branch: renter runs **Cancel Rental Order** only for `cancelOrderId` in `pending_confirm`. It does not touch wallet/escrow. From `confirmed` onward the expected error is `400 CANCEL_NOT_ALLOWED`.

Negative proof checks:

- Run ship before step 3: expect `400 PROOF_REQUIRED`.
- Run confirm-return with either step 7 or 8 missing: expect `400 PROOF_REQUIRED`, order stays `returning`, escrow stays locked.
