# Mutux – Mô hình tài chính

## Tổng quan

Mutux không giữ tiền thật của user. Thay vào đó, hệ thống cấp cho user một **hạn mức tín dụng** (Ví Mutux) do đối tác tài chính bảo lãnh — dùng để đặt cọc thuê gear thay cho tiền mặt.

---

## Các bên tham gia

| Bên                | Vai trò                                                     |
| ------------------ | ----------------------------------------------------------- |
| **Credit Partner** | Cấp hạn mức tín dụng, thu hồi nợ khi phát sinh              |
| **Renter**         | Dùng hạn mức để đặt cọc, thanh toán phí thuê bằng tiền thật |
| **Lender**         | Nhận phí thuê, nhận bồi thường nếu gear bị hư/mất           |
| **Mutux**          | Trung gian giữ escrow, xử lý dispute                        |

---

## Ví Mutux (`mutux_wallets`)

```text
total_limit      = 5.000.000đ   ← hạn mức được cấp
display_balance  = 5.000.000đ   ← số dư khả dụng (user thấy)
locked_balance   = 0đ           ← đang bị khoá cho đơn thuê
outstanding_debt = 0đ           ← nợ phát sinh (gear hư/mất)
```

> `display_balance + locked_balance ≤ total_limit` luôn đúng.
> `outstanding_debt` là nợ riêng, credit partner sẽ thu hồi ngoài luồng.

---

## Luồng tiền theo kịch bản

### Kịch bản 1 — Thuê & trả bình thường

```text
[Lock cọc 2tr]
  display_balance  5tr → 3tr
  locked_balance    0  → 2tr

[Trả gear OK]
  display_balance  3tr → 5tr
  locked_balance   2tr → 0
  outstanding_debt      = 0
```

### Kịch bản 2 — Gear hư / mất → bồi thường

```text
[Lock cọc 2tr]
  display_balance  5tr → 3tr
  locked_balance    0  → 2tr

[Bồi thường 2tr]
  locked_balance   2tr → 0
  outstanding_debt  0  → 2tr
  display_balance       = 3tr
```

---

## Vai trò từng bảng

| Bảng                   | Vai trò                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `mutux_wallets`        | State hiện tại của ví (số dư, nợ)                                       |
| `credit_usages`        | State machine của từng lần lock cọc (`locked → released / compensated`) |
| `escrow_wallets`       | Container giữ tiền cọc cho từng đơn hàng                                |
| `credit_transactions`  | Ledger ghi mọi biến động (audit log, không dùng để tính state)          |
| `lender_wallets`       | Số dư doanh thu của người cho thuê                                      |

---

## Phí thuê — tách biệt hoàn toàn với cọc

Phí thuê (`rental_fee`) được thanh toán bằng **tiền thật** (MoMo, VNPay, bank transfer) — không dùng hạn mức Ví Mutux.

Hạn mức chỉ dùng cho **tiền cọc**.

---

## Quy trình dòng tiền

### 1. Renter đặt thuê gear

Renter cần thanh toán:

```text
Tiền thuê  = rental_fee
Tiền cọc   = deposit_amount
```

Trong đó:

```text
rental_fee     → tiền thật
deposit_amount → hạn mức Ví Mutux
```

---

### 2. Thanh toán tiền thuê

Ví dụ:

```text
rental_fee = 500.000đ
```

Tạo payment:

```text
payments.type = rental_fee
payments.user_id = renter_id
payments.amount = 500.000
payments.method = momo / vnpay / bank_transfer
payments.status = success
```

Dòng tiền:

```text
Renter
   │
   ▼
Mutux
```

Mutux nhận tiền thuê trước.

---

### 3. Khóa tiền cọc

Ví dụ:

```text
deposit_amount = 2.000.000đ
```

Khi đơn được xác nhận:

```text
display_balance -= 2.000.000
locked_balance  += 2.000.000
```

Tạo:

```text
credit_usages.status = locked
credit_usages.locked_amount = 2.000.000
```

---

### 4. Đơn hoàn thành bình thường

Khi:

```text
rental_orders.status = completed
```

Mở khóa cọc:

```text
display_balance += 2.000.000
locked_balance  -= 2.000.000

credit_usages.status = released
```

Đồng thời cộng doanh thu cho lender:

```text
lender_wallets.balance += rental_orders.rental_fee
```

Ví dụ:

```text
lender_wallets.balance += 500.000
```

---

### 5. Gear hư hoặc mất

Khi dispute xác nhận bồi thường:

```text
locked_balance   -= 2.000.000
outstanding_debt += 2.000.000

credit_usages.status = compensated
```

Credit Partner sẽ thu hồi khoản nợ này ngoài hệ thống.

---

### 6. Lender rút tiền

Mutux lấy phí nền tảng từ config nào đó? 

Ví dụ:

```text
lender_wallets.balance = 500.000
fee_rate = 10%
```

Tính:

```text
platform_fee = 50.000
payout_amount = 450.000
```

Tạo payment:

```text
payments.type = withdrawal
payments.user_id = lender_id
payments.amount = 450.000
payments.method = bank_transfer
payments.status = pending
```

Khi chuyển khoản thành công:

```text
payments.status = success

lender_wallets.balance -= 500.000
lender_wallets.total_withdrawn += 450.000
```

---

## Tóm tắt dòng tiền

```text
Renter
 ├─ Thanh toán rental_fee bằng tiền thật
 │
 └─ Khóa deposit bằng Ví Mutux
          │
          ▼
        Mutux
          │
          ├─ Hoàn cọc nếu trả gear bình thường
          │
          ├─ Chuyển thành nợ nếu gear hư/mất
          │
          └─ Cộng rental_fee vào lender_wallets
                        │
                        ▼
                   Lender
                        │
                        └─ Rút tiền
                               │
                               ├─ Mutux trừ platform fee
                               └─ Chuyển khoản phần còn lại
```
