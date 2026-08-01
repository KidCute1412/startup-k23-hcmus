# Payments happy path

Run `Create Checkout` and then `IPN Webhook` after authenticating as a renter.

The checkout stores `topupId`, numeric `topupOrderCode`, `topupAmount`, and `topupTransferContent` as Bruno environment variables. The webhook represents the external mock PayOS provider: it signs deterministic, recursively key-sorted JSON with `PAYOS_WEBHOOK_SECRET` and sends the HMAC through `x-payos-signature`.

This is a demo integration only. The browser uses the authenticated `simulate-success` helper for the demo control and never calls the public provider webhook.
