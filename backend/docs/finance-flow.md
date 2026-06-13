# Mutux – Mô hình tài chính

## Tổng quan

Mutux hỗ trợ 2 hình thức đặt cọc:

1. **Cọc truyền thống (Traditional Deposit)** – người thuê thanh toán tiền cọc bằng tiền thật.
2. **Cọc trả sau (Credit Line)** – người thuê dùng hạn mức tín dụng được cấp bởi đối tác tài chính.

Trong cả hai trường hợp:

```text
rental_fee     = tiền thuê
deposit_amount = tiền cọc
```

Tiền thuê luôn được thanh toán bằng tiền thật.

---

# 1. Cọc truyền thống

## Tổng quan

Người thuê thanh toán cả tiền thuê và tiền cọc bằng tiền thật.

Mutux giữ tiền cọc trong `escrow_wallets` cho đến khi đơn thuê kết thúc.

---

## Vai trò các bảng

| Bảng             | Vai trò                                            |
| ---------------- | -------------------------------------------------- |
| `payments`       | Ghi nhận thanh toán tiền thuê, tiền cọc, hoàn tiền |
| `escrow_wallets` | Giữ tiền cọc thật của renter                       |
| `lender_wallets` | Số dư doanh thu của lender                         |

---

## 1. Thanh toán tiền thuê và tiền cọc

Ví dụ:

```text
rental_fee = 500.000đ
deposit_amount = 2.000.000đ
```

Tạo payment:

```text
payments.type = rental_fee
payments.amount = 500.000
payments.status = success
```

```text
payments.type = deposit
payments.amount = 2.000.000
payments.status = success
```

Tạo escrow:

```text
escrow_wallets.rental_order_id = rental_order_id
escrow_wallets.amount = 2.000.000
escrow_wallets.source = renter_cash
escrow_wallets.status = locked
```

Dòng tiền:

```text
Renter
   │
   ├─ rental_fee
   └─ deposit_amount
        ▼
      Mutux
        │
        ▼
  escrow_wallets
```

---

## 2. Đơn hoàn thành bình thường

Khi:

```text
rental_orders.status = completed
```

Giải phóng escrow:

```text
escrow_wallets.status = released
escrow_wallets.released_at = now()
```

Hoàn tiền cọc:

```text
payments.type = refund
payments.user_id = renter_id
payments.amount = 2.000.000
payments.status = success
```

Cộng doanh thu cho lender:

```text
lender_wallets.balance += rental_orders.rental_fee
```

Ví dụ:

```text
lender_wallets.balance += 500.000
```

---

## 3. Gear hư hoặc mất

Ví dụ:

```text
deposit_amount = 2.000.000
deduct_amount = 1.500.000
```

Đánh dấu escrow:

```text
escrow_wallets.status = compensated
```

Chuyển tiền bồi thường:

```text
lender_wallets.balance += 1.500.000
```

Hoàn phần còn lại:

```text
payments.type = refund
payments.user_id = renter_id
payments.amount = 500.000
payments.status = success
```

Đồng thời cộng tiền thuê:

```text
lender_wallets.balance += rental_orders.rental_fee
```

---

# 2. Cọc trả sau (Credit Line)

## Tổng quan

Người thuê không cần nộp tiền cọc bằng tiền thật.

Thay vào đó hệ thống khóa một phần hạn mức tín dụng do đối tác tài chính cấp.

Khoản cọc này vẫn được quản lý thông qua:

```text
escrow_wallets
```

giống như cọc truyền thống, chỉ khác nguồn tiền là hạn mức tín dụng thay vì tiền thật.

---

## Các bên tham gia

| Bên            | Vai trò                              |
| -------------- | ------------------------------------ |
| Credit Partner | Cấp hạn mức tín dụng và thu hồi nợ   |
| Renter         | Dùng hạn mức để đặt cọc              |
| Lender         | Nhận tiền thuê và tiền bồi thường    |
| Mutux          | Quản lý đơn thuê và xử lý tranh chấp |

---

## Ví Mutux (`mutux_wallets`)

```text
total_limit      = 5.000.000
display_balance  = 5.000.000
locked_balance   = 0
outstanding_debt = 0
```

Trong đó:

```text
display_balance + locked_balance ≤ total_limit
```

---

## Vai trò các bảng

| Bảng                  | Vai trò                                         |
| --------------------- | ----------------------------------------------- |
| `mutux_wallets`       | State hiện tại của hạn mức tín dụng             |
| `escrow_wallets`      | Quản lý khoản cọc được khóa từ hạn mức tín dụng |
| `credit_transactions` | Audit log các biến động tín dụng                |
| `lender_wallets`      | Số dư doanh thu của lender                      |

---

## 1. Thanh toán tiền thuê

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

---

## 2. Khóa tiền cọc

Ví dụ:

```text
deposit_amount = 2.000.000đ
```

Khi đơn được xác nhận:

```text
display_balance -= 2.000.000
locked_balance  += 2.000.000
```

Tạo escrow:

```text
escrow_wallets.rental_order_id = rental_order_id
escrow_wallets.amount = 2.000.000
escrow_wallets.source = credit_line
escrow_wallets.status = locked
```

Ý nghĩa:

```text
Mutux đang giữ khoản bảo lãnh trị giá 2.000.000đ
được đảm bảo bằng hạn mức tín dụng.
```

---

## 3. Đơn hoàn thành bình thường

Khi:

```text
rental_orders.status = completed
```

Mở khóa hạn mức:

```text
display_balance += 2.000.000
locked_balance  -= 2.000.000
```

Giải phóng escrow:

```text
escrow_wallets.status = released
escrow_wallets.released_at = now()
```

Cộng doanh thu cho lender:

```text
lender_wallets.balance += rental_orders.rental_fee
```

---

## 4. Gear hư hoặc mất

Ví dụ:

```text
deposit_amount = 2.000.000
```

Chuyển khoản bảo lãnh thành nợ:

```text
locked_balance   -= 2.000.000
outstanding_debt += 2.000.000
```

Đánh dấu escrow:

```text
escrow_wallets.status = compensated
```

Credit Partner sẽ thu hồi khoản nợ này ngoài hệ thống.

Bồi thường cho lender:

```text
lender_wallets.balance += deposit_amount
lender_wallets.balance += rental_orders.rental_fee
```

---

# Tóm tắt

```text
Traditional Deposit
-------------------
Renter trả rental_fee + deposit
        ↓
      Mutux
        ↓
  escrow_wallets
        ↓
released / compensated
        ↓
Hoàn cọc hoặc bồi thường

Credit Line
-----------
Renter trả rental_fee
        ↓
Mutux khóa hạn mức tín dụng
        ↓
escrow_wallets
(source = credit_line)
        ↓
released / compensated
        ↓
Mở khóa hoặc phát sinh nợ

Lender
------
Doanh thu → lender_wallets
        ↓
Rút tiền
        ↓
Mutux trừ phí nền tảng
        ↓
Chuyển khoản ngân hàng
```
