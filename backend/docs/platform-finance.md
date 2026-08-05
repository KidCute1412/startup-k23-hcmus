# Platform fee settlement

At lender confirmation, the renter's full rental fee is debited and held in the
platform settlement ledger. It is neither available lender income nor available
platform revenue yet. At final settlement, the renter refund is paid first and
the remaining rental fee is split with the rate snapshot stored on that order.

The default rate is 30% platform / 70% lender. Platform revenue is rounded down
to whole VND; the lender receives the remainder. Deposits and deposit-based
compensation are escrow flows and are never platform revenue.

For every order: `gross rental fee = renter refund + rental hold (before final
settlement) + platform revenue + lender payable`. `platform_wallets` and the
immutable `platform_ledger_transactions` table are the reconciliation source of
truth. Dashboard revenue sums only `platform_revenue` entries.
