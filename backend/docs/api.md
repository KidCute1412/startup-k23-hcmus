# Mutux – RESTful API Specification (MVP Optimized)

Tài liệu này đặc tả toàn bộ hệ thống RESTful API được thiết kế tinh gọn (Lean MVP) cho ứng dụng **Mutux** dựa trên thiết kế cơ sở dữ liệu (ERD) và luồng tài chính tối giản.

## Tài liệu liên quan

- [Task 6 – Basic Rental Order APIs Plan](./task-6-rental-order-basic-apis-plan.md): kế hoạch implement chi tiết cho `POST /api/v1/rental-orders` và `GET /api/v1/rental-orders`.

---

## 1. Quy chuẩn chung (Global Standards)

### Base URL
```text
https://api.mutux.vn/api/v1 || http://localhost:8080/api/v1
```

### Casing Convention
- **URL Paths**: Kebab-case (Ví dụ: `/api/v1/rental-orders`, `/api/v1/admin/users`)
- **JSON Payload Keys**: CamelCase (Ví dụ: `rentalFee`, `lenderId`, `createdAt`)
- **Query Parameters**: CamelCase (Ví dụ: `?page=1&limit=10&categoryId=uuid`)

### Authentication
Hệ thống dùng cặp **Access Token + Refresh Token** hoàn toàn trong cookie `HttpOnly`; frontend không lưu token, không nhận token trong JSON và không gửi header `Authorization`. `accessToken` có `Path=/api/v1`, hết hạn 15 phút; `refreshToken` có `Path=/api/v1/auth`, hết hạn 7 ngày. Cả hai cookie dùng `SameSite=Lax` và chỉ có cờ `Secure` ở production.

Mọi request được bảo vệ xác thực qua cookie `accessToken`. Với `POST`, `PUT`, `PATCH`, hoặc `DELETE` có access cookie, client phải gửi `Origin` khớp một giá trị trong `FRONTEND_URL` (mặc định `http://localhost:3000`), nếu không server trả `403`.

### Pagination (Phân trang)
Các API danh sách sử dụng phương thức phân trang Offset:
- **Query parameters**: `page` (mặc định: 1), `limit` (mặc định: 10)
- **Response Structure**: Dữ liệu danh sách nằm trong mảng `data` kèm theo đối tượng `meta` ở cùng cấp.

---

## 2. Cấu trúc Response toàn cục (Global Response Format)

### 2.1 Success Response Schema (Thành công)
HTTP Status: `200` hoặc `201`.
```json
{
  "success": true,
  "message": "Thông điệp thành công (tùy chọn)",
  "data": {} // Có thể là Object, Mảng, hoặc null
}
```

### 2.2 Error Response Schema (Thất bại)
HTTP Status: `400`, `401`, `403`, `404`, `422`, `500`.
```json
{
  "success": false,
  "error": {
    "code": "MÃ_LỖI_HỆ_THỐNG",
    "message": "Thông điệp mô tả lỗi chi tiết bằng tiếng Việt",
    "details": {} // Lỗi chi tiết (như validation lỗi trường nào)
  }
}
```

#### Mã lỗi phổ biến:
- `VALIDATION_ERROR` (400): Dữ liệu đầu vào sai định dạng.
- `UNAUTHORIZED` (401): Chưa đăng nhập hoặc token sai/hết hạn.
- `FORBIDDEN` (403): Sai quyền hạn (ví dụ: Renter cố đăng thiết bị).
- `NOT_FOUND` (404): Không tìm thấy tài nguyên.
- `UNPROCESSABLE_ENTITY` (422): Sai logic nghiệp vụ (ví dụ: Ví Mutux hết hạn mức).

---

## 3. Danh sách APIs Tinh gọn

### 3.1 Auth & Users (5 APIs)

#### [POST] `/auth/register` (Đăng ký)
* **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "fullName": "Nguyễn Văn A"
  }
  ```
* **Success (201)**: Trả về thông tin user mới đăng ký.

#### [POST] `/auth/login` (Đăng nhập)
* **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123"
  }
  ```
* **Success (200)**: Server đặt cả `accessToken` và `refreshToken` qua `Set-Cookie`; JSON không chứa token.
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "user@example.com", "role": "renter" }
    }
  }
  ```

#### [POST] `/auth/refresh`
* **Cookie**: `refreshToken` được trình duyệt tự động gửi; frontend phải dùng `credentials: 'include'`.
* **Success (200)**: Xoay cả hai cookie qua `Set-Cookie`; `data` là `null`.

#### [POST] `/auth/change-password`
* **Authentication**: `accessToken` cookie; request phải có `Origin` hợp lệ.
* **Body**: `{ "oldPassword": "SecurePassword123", "newPassword": "SecurePassword456" }`
* **Success (200)**: Đổi mật khẩu, thu hồi refresh token đang tồn tại và xóa cookie.

#### [POST] `/auth/logout` (Đăng xuất)
* **Cookie**: `accessToken` và `refreshToken` (nếu có). Endpoint idempotent, luôn xóa cả hai cookie trên trình duyệt và thu hồi session tương ứng khi refresh cookie hợp lệ.
* **Success (200)**: `{"success": true}`.

#### [GET] `/users/me` (Lấy thông tin cá nhân)
* **Authentication**: `accessToken` cookie.
* **Success (200)**: Trả về thông tin chi tiết user (bao gồm cả trạng thái `kycStatus` và `cccd`).

#### [POST] `/users/me/kyc` (Gửi hồ sơ KYC)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Body**:
  ```json
  {
    "cccd": "012345678912",
    "frontCardUrl": "https://...",
    "backCardUrl": "https://...",
    "portraitUrl": "https://..."
  }
  ```
* **Success (200)**: Trạng thái KYC cập nhật về `pending`, chờ Admin duyệt thủ công.

---

### 3.2 Gears & Catalog (6 APIs)

#### [GET] `/categories` (Danh sách danh mục)
* **Success (200)**: Mảng phẳng các danh mục gear (có chứa `id` và `parentId` để vẽ cây danh mục).

#### [GET] `/gears` (Tìm kiếm / Lọc danh sách thiết bị công khai)
* **Query Params**: `page`, `limit`, `search`, `categoryId`, `minPrice`, `maxPrice`
* **Success (200)**: Trả về danh sách gears kèm theo đối tượng phân trang `meta`.

#### [GET] `/gears/:id` (Chi tiết thiết bị)
* **Success (200)**: Thông tin chi tiết thiết bị kèm danh sách hình ảnh (`media`) và danh sách các đánh giá (`reviews`) đã có của thiết bị đó.

#### [GET] `/gears/mine` (Danh sách thiết bị của lender)
* **Authentication**: `accessToken` cookie.
* **Query Params**: `page` (mặc định `1`), `limit` (mặc định `10`, tối đa `100`).
* **Ownership**: `lenderId` luôn lấy từ JWT; endpoint không nhận lender ID từ client.
* **Success (200)**: Trả về tất cả gear thuộc lender đang đăng nhập, bao gồm gear `pending`, `rejected`, `approved` hoặc có status `delisted`.
  ```json
  {
    "success": true,
    "data": [],
    "meta": {
      "total": 0,
      "page": 1,
      "limit": 10,
      "totalPages": 0
    }
  }
  ```

#### [POST] `/gears` (Lender đăng thiết bị mới)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes; requires verified KYC).
* **Body**:
  ```json
  {
    "categoryId": "uuid",
    "name": "Bàn phím cơ Keychron Q1 Pro",
    "brand": "Keychron",
    "model": "Q1 Pro",
    "serialNumber": "KC-Q1P-992",
    "description": "Bàn phím vỏ nhôm nguyên khối...",
    "specifications": { "layout": "75%", "switchType": "Banana" },
    "value": 4500000,
    "rentPricePerDay": 80000
  }
  ```
* **Success (201)**: Thiết bị được tạo ở trạng thái `pending` (chờ Admin duyệt). `lenderId` luôn lấy từ JWT và lender phải có KYC `verified`.

#### [PATCH] `/gears/:id` (Lender cập nhật hoặc gỡ thiết bị)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Body**: Truyền các trường cần cập nhật hoặc đổi trạng thái `status` sang `delisted` để gỡ thiết bị.
* **Success (200)**: Cập nhật thành công. Chỉ lender sở hữu gear được sửa; sửa gear đã `approved` sẽ đưa gear về `pending` để duyệt lại.

---

### 3.3 Wallets (5 APIs)

#### [GET] `/wallets/renter` (Thông tin ví ảo của Renter)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Mô tả**: Trả về số dư ví ảo dùng để thanh toán phí thuê, lock cọc truyền thống và nhận refund trong môi trường demo.
* **Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "availableBalance": 1500000,
      "lockedBalance": 500000,
      "currency": "VND"
    }
  }
  ```

#### [POST] `/wallets/topups/checkout` (Tạo phiên nạp tiền ví ảo - PayOS mock)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Mô tả**: Tạo top-up intent để nạp tiền vào ví ảo. Với MVP demo, PayOS chỉ được mô phỏng ở mức checkout/callback shape, không xử lý tiền thật.
* **Body**:
  ```json
  {
    "amount": 500000,
    "method": "payos"
  }
  ```
* **Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "topupId": "uuid",
      "checkoutUrl": "http://localhost:3000/mock-payos?topupId=uuid",
      "status": "pending"
    }
  }
  ```

#### [GET] `/wallets/mutux` (Thông tin Ví trả sau / Credit Line - Renter)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Success (200)**: Trả về hạn mức khả dụng (`displayBalance`), hạn mức bị khóa (`lockedBalance`), dư nợ (`outstandingDebt`), tổng hạn mức (`totalLimit`), trạng thái (`status`). Ví này chỉ dùng để bảo đảm cọc khi `depositType = credit_line`.
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "userId": "uuid",
      "totalLimit": 5000000,
      "displayBalance": 3000000,
      "lockedBalance": 1000000,
      "outstandingDebt": 1000000,
      "status": "active"
    }
  }
  ```
  > `displayBalance` luôn được tính theo invariant: `displayBalance = totalLimit - lockedBalance - outstandingDebt`.

#### [GET] `/wallets/lender` (Thông tin Ví thu nhập ảo & Yêu cầu rút tiền - Lender)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Query Params**: `page` (default: 1), `limit` (default: 20)
* **Mô tả**: Trả về số dư thu nhập ảo của lender kèm danh sách giao dịch phân trang. Với MVP demo, withdraw chỉ ghi nhận request/trạng thái, không chuyển khoản ngân hàng thật.
* **Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "balance": 5000000,
      "totalWithdrawn": 1000000,
      "status": "active",
      "transactions": {
        "data": [
          {
            "id": "uuid",
            "type": "income",
            "amount": 280500,
            "balanceBefore": 4719500,
            "balanceAfter": 5000000,
            "note": "Income for order MX-2024-0001",
            "createdAt": "2026-07-01T12:00:00Z"
          }
        ],
        "meta": {
          "total": 1,
          "page": 1,
          "limit": 20,
          "totalPages": 1
        }
      }
    }
  }
  ```
* **Trường hợp Yêu cầu rút tiền (POST `/wallets/lender/withdraw`):**
  - **Body**:
    ```json
    {
      "amount": 500000,
      "bankCode": "VCB",
      "accountNumber": "1012345678",
      "accountHolder": "NGUYEN VAN B"
    }
    ```
  - **Success (200)**: Trả về trạng thái yêu cầu rút tiền là `pending`.

---

### 3.4 Rental Orders (9 APIs)

#### [POST] `/rental-orders` (Tạo yêu cầu thuê thiết bị - Renter)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Body**:
  ```json
  {
    "gearId": "uuid",
    "startDate": "2026-06-15",
    "endDate": "2026-06-20",
    "depositType": "credit_line", // "credit_line" (hạn mức Ví Mutux) hoặc "traditional" (lock từ ví ảo renter)
    "shippingAddress": "123 Đường ABC, Quận 1, TP. HCM",
    "shippingName": "Nguyễn Văn A",
    "shippingPhone": "0987654321"
  }
  ```
* **Success (201)**: Tạo order ở trạng thái `pending_confirm` chờ Lender xác nhận.
* **Business rules**:
  - `gear.approval_status` phải là `approved` và gear phải đang `available`; nếu không trả `400 GEAR_NOT_AVAILABLE`.
  - `startDate` phải nhỏ hơn `endDate`; nếu không trả `400 INVALID_DATE_RANGE`.
  - Không được có order khác cùng gear, có status khác `cancelled`/`completed`, bị giao nhau trong khoảng thuê; nếu không trả `409 GEAR_UNAVAILABLE_FOR_PERIOD`.
  - `lenderId` luôn được lấy từ `gear.lender_id`, không nhận từ request body.
  - `duration_days = endDate - startDate` theo khoảng ngày nửa mở `[startDate, endDate)`; `rentalFee = snappedRentPricePerDay × durationDays`.
  - `snappedRentPricePerDay` lưu lại giá `rent_price_per_day` tại thời điểm tạo order. `depositAmount` lấy `gear.value`, hoặc `rentalFee × 2` khi gear chưa có `value`.
* **Response data**: gồm `status = pending_confirm`, `lender_id`, `duration_days`, `snapped_rent_price_per_day`, `rental_fee` và `deposit_amount` đã được server tính toán.

#### [GET] `/rental-orders` (Danh sách đơn thuê của tôi)
* **Query Params**: `role` (renter hoặc lender), `status`, `page`, `limit`
* **Auth scope**: renter chỉ xem order có `renter_id = req.user.id`; lender chỉ xem order có `lender_id = req.user.id`; admin xem tất cả order. Ownership được quyết định từ JWT, không tin `role` do client gửi.
* **Success (200)**: Trả về `{ "success": true, "data": [...], "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 } }`. Có thể lọc `status` (ví dụ `?status=confirmed&page=1&limit=10`).

#### [GET] `/rental-orders/:id` (Chi tiết đơn thuê)
* **Success (200)**: Trả về chi tiết đơn, thông tin người thuê, người cho thuê, thiết bị và thông tin khiếu nại/tranh chấp đính kèm (nếu đơn hàng đang ở trạng thái `disputed`).
* **Authorization**: chỉ renter, lender liên quan hoặc admin được xem; user khác nhận `403 FORBIDDEN`.

#### [PATCH] `/rental-orders/:id/confirm` (Lender xác nhận đơn)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ lender của order; renter hoặc user khác nhận `403 FORBIDDEN`.
* **Transition**: `pending_confirm` → `confirmed`.
* **Escrow**: gọi `EscrowService.lock(orderId)` trước khi đổi trạng thái. Chỉ khi lock thành công mới cập nhật order; lock tạo `EscrowWallet` ở trạng thái `locked`.
  - `traditional`: debit `rental_fee` từ ví renter và chuyển `deposit_amount` sang `locked_balance` của ví renter.
  - `credit_line`: debit `rental_fee` từ ví renter, giảm `mutux_wallets.display_balance`, tăng `mutux_wallets.locked_balance` và ghi `credit_transactions(type = deposit_lock)` cho tiền cọc.
* **Errors**:
  - `400 INVALID_TRANSITION` nếu order không còn ở `pending_confirm`; escrow không được gọi cho transition không hợp lệ.
  - `400 INSUFFICIENT_CASH` nếu ví renter không đủ trả `rental_fee` và phần cọc tiền mặt (nếu dùng `traditional`).
  - `400 INSUFFICIENT_CREDIT` nếu ví hạn mức không tồn tại, không active, hết hạn hoặc không đủ `deposit_amount`.
  - Lỗi từ escrow được trả nguyên trạng; mọi cập nhật ví, credit ledger và escrow đều rollback, order vẫn ở `pending_confirm`.
* **Success (200)**: trả về order với `status = confirmed`. Order được snapshot `platform_fee` và `lender_income` dựa trên platform fee rate 15%.

#### [PATCH] `/rental-orders/:id/ship` (Lender xác nhận đã giao hàng)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ lender của order.
* **Transition**: `confirmed` → `delivering`.
* **Side effect**: cập nhật `lender_shipped_at` bằng thời điểm hiện tại.
* **Success (200)**: trả về order với `status = delivering`.

#### [PATCH] `/rental-orders/:id/cancel` (Renter hủy yêu cầu thuê)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ renter của order.
* **Transition**: `pending_confirm` → `cancelled`.
* **Success (200)**: trả về order với `status = cancelled`.

#### [PATCH] `/rental-orders/:id/confirm-receipt` (Renter xác nhận đã nhận hàng)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ renter của order.
* **Transition**: `delivering` → `active`.
* **Side effect**: cập nhật `renter_received_at` bằng thời điểm hiện tại.
* **Success (200)**: trả về order với `status = active`.

#### [PATCH] `/rental-orders/:id/return` (Renter xác nhận đã gửi trả)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ renter của order; lender hoặc user khác nhận `403 FORBIDDEN`.
* **Transition**: `active` → `returning`.
* **Side effect**: cập nhật `renter_returned_at` bằng thời điểm hiện tại.
* **Success (200)**: trả về order với `status = returning`.

#### [PATCH] `/rental-orders/:id/confirm-return` (Lender xác nhận đã nhận lại gear)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ lender của order.
* **Transition**: `returning` → `completed`.
* **Escrow**: gọi `EscrowService.release(orderId)` trong cùng transaction để giải phóng cọc, cộng doanh thu cho lender, cập nhật trạng thái escrow thành `released`.
  - `traditional`: mở khóa `locked_balance` của ví renter (balance không đổi), cộng `lenderIncome` vào ví lender.
  - `credit_line`: giảm `locked_balance` của MutuxWallet, tính lại `display_balance` theo invariant, cộng `lenderIncome` vào ví lender.
  - Phí nền tảng: `platformFee = rentalFee × 15%`, `lenderIncome = rentalFee - platformFee`, snapshot trên order tại thời điểm confirm.
* **Errors**:
  - `400 ESCROW_INVALID_STATUS` nếu escrow không ở trạng thái `locked`.
* **Side effect**: cập nhật `lender_received_back_at`, tạo `LenderWalletTransaction(type='income')`.
* **Success (200)**: trả về order với `status = completed`.

Với năm endpoint không gọi escrow, nếu trạng thái hiện tại không đúng trạng thái nguồn thì API trả `400 INVALID_TRANSITION`. Mọi endpoint trả `404 NOT_FOUND` khi order không tồn tại và dùng response wrapper toàn cục `{ "success": true, "data": ... }` hoặc `{ "success": false, "error": ... }`.

---

### 3.5 Rental Proofs (2 APIs)
*Gắn ảnh đã upload local qua 4 mốc bàn giao giúp tránh tranh chấp.*

#### [POST] `/rental-orders/:id/proofs` (Tạo bằng chứng)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Body**:
  ```json
  {
    "stage": "pre_shipment", // "pre_shipment" | "post_received" | "pre_return" | "post_returned"
    "fileUrl": "/uploads/user-uuid/1753500000000-gear-front.jpg",
    "note": "Hộp đầy đủ cáp và keycap"
  }
  ```
* **Server-derived fields**: `uploadedBy` lấy từ access token, `rentalOrderId` lấy từ path và `proofType` luôn là `image`; client không được truyền các field này.
* **Stage rules**:

  | `stage` | Actor bắt buộc | Trạng thái order bắt buộc |
  | --- | --- | --- |
  | `pre_shipment` | lender của order | `confirmed` |
  | `post_received` | renter của order | `active` |
  | `pre_return` | renter của order | `returning` |
  | `post_returned` | lender của order | `returning` |

* **File ownership**: `fileUrl` phải đúng dạng `/uploads/{currentUserId}/{fileName}` do chính caller nhận từ `POST /media/upload`, phải là file ảnh còn tồn tại trong thư mục upload của caller. URL ngoài, path traversal, file không tồn tại hoặc file của participant khác đều trả `400 INVALID_FILE_URL`.
* **Authorization**: chỉ renter/lender của order được tạo proof; user khác trả `403 FORBIDDEN`.
* **Errors**:
  - `400 INVALID_PROOF_STAGE`: sai actor hoặc trạng thái order cho stage.
  - `400 INVALID_FILE_URL`: URL không thuộc thư mục upload của caller.
  - `403 FORBIDDEN`: caller không phải participant của order.
  - `404 NOT_FOUND`: order không tồn tại.
* **Success (201)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "rentalOrderId": "uuid",
      "uploadedBy": "uuid",
      "stage": "pre_shipment",
      "proofType": "image",
      "fileUrl": "/uploads/user-uuid/1753500000000-gear-front.jpg",
      "note": "Hộp đầy đủ cáp và keycap",
      "uploadedAt": "2026-07-26T10:00:00.000Z"
    }
  }
  ```

#### [GET] `/rental-orders/:id/proofs` (Xem bằng chứng đơn hàng)
* **Authentication**: `accessToken` cookie.
* **Authorization**: chỉ renter/lender của order được xem; user khác trả `403 FORBIDDEN`.
* **Success (200)**: Trả về toàn bộ danh sách ảnh bàn giao, sắp xếp theo `uploadedAt` tăng dần.

---

### 3.6 Payments & Mock Webhook (2 APIs)

#### [POST] `/payments/webhook/payos` (Webhook mock nhận kết quả top-up ví ảo - Public API)
* **Mô tả**: Nhận callback theo shape PayOS để xác nhận top-up ví ảo. Đây là flow demo, không xử lý tiền thật. Webhook/callback hợp lệ sẽ cộng số dư vào `/wallets/renter` và ghi ledger nội bộ.
* **Auth**: none
* **Body mẫu**:
  ```json
  {
    "code": "00",
    "desc": "success",
    "success": true,
    "data": {
      "orderCode": 123456,
      "amount": 500000,
      "description": "TOPUP-123456",
      "reference": "MOCK-PAYOS-REF-001",
      "paymentLinkId": "mock-payment-link-id",
      "code": "00",
      "desc": "Thành công"
    },
    "signature": "mock-signature"
  }
  ```
* **Success (200)**:
  ```json
  {
    "success": true,
    "message": "Top-up processed"
  }
  ```

#### [POST] `/wallets/topups/:id/simulate-success` (Local helper để giả lập webhook top-up)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Mô tả**: Endpoint tiện ích cho demo/local. Khi gọi sẽ giả lập callback thành công cho top-up pending, cộng số dư ví ảo và đảm bảo idempotency. Không expose endpoint này ở production.
* **Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "topupId": "uuid",
      "status": "success",
      "walletBalance": 1500000
    }
  }
  ```

> Lưu ý: API cũ `POST /payments/checkout` với `rentalOrderId/paymentType` không còn là flow chính cho MVP demo. Order payment được xử lý bằng debit/lock ví nội bộ, không charge gateway trực tiếp.

---

### 3.7 Disputes & Reviews (2 APIs)

#### [POST] `/disputes` (Gửi khiếu nại tranh chấp - Renter hoặc Lender)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Body**:
  ```json
  {
    "rentalOrderId": "uuid",
    "reason": "device_damaged",
    "description": "Bàn phím bị nứt góc nhôm",
    "evidences": [
      { "mediaType": "image", "url": "/uploads/{currentUserId}/{uploadedFile}.jpg" }
    ]
  }
  ```
* **Evidence**: Tối đa 5 ảnh. Mỗi URL phải là ảnh local còn tồn tại do chính người gọi upload qua `/media/upload`; URL ngoài hệ thống hoặc của user khác trả `400 INVALID_FILE_URL`.
* **Business rules**:
  - Chỉ renter hoặc lender của order được gửi; `reporterRole` do server suy ra, không nhận từ client.
  - Order phải ở `active` hoặc `returning`.
  - Việc tạo dispute, evidence và chuyển order sang `disputed` chạy trong cùng transaction. Order được khóa để hai request đồng thời không thể cùng tạo dispute đang hoạt động.
* **Errors**:
  - `400 DISPUTE_NOT_ALLOWED_AT_THIS_STAGE` nếu order không ở `active` / `returning`.
  - `400 INVALID_FILE_URL` nếu evidence không phải ảnh local thuộc người gọi.
  - `403 FORBIDDEN` nếu người gọi không phải participant.
  - `404 NOT_FOUND` nếu order không tồn tại.
  - `409 DISPUTE_ALREADY_OPEN` nếu order đã có dispute `open` / `under_review`.
* **Success (201)**: Tạo tranh chấp cùng evidence thành công, server trả dữ liệu camelCase và order đổi sang `disputed`.

#### [POST] `/reviews` (Đánh giá sau khi hoàn thành đơn thuê)
* **Authentication**: `accessToken` cookie and valid `Origin`.
* **Body**:
  ```json
  {
    "rentalOrderId": "uuid",
    "targetId": "uuid", // ID thiết bị hoặc ID người dùng đối phương
    "targetType": "gear", // "gear" | "lender" | "renter"
    "rating": 5,
    "comment": "Rất tốt"
  }
  ```
* **Success (201)**: Ghi nhận đánh giá thành công.

---

### 3.8 Notifications & Media (2 APIs)

#### [GET] `/notifications` (Lấy danh sách thông báo của tôi)
* **Authentication**: `accessToken` cookie.
* **Success (200)**: Trả về danh sách thông báo mới nhất.

#### [POST] `/media/upload` (Upload hình ảnh local)
* **Authentication**: `accessToken` cookie; `Content-Type: multipart/form-data`; valid `Origin` required.
* **Body (Form-data)**: `file` (Binary)
* **MIME types**: `image/jpeg`, `image/png`, `image/webp`.
* **Kích thước tối đa**: 5MB.
* **Lưu trữ MVP**: `uploads/{userId}/{timestamp}-{sanitizedFileName}`; static file được serve công khai từ `/uploads/`.
* **Success (201)**:
  ```json
  {
    "success": true,
    "data": {
      "url": "/uploads/user-uuid/1753500000000-gear-front.jpg"
    }
  }
  ```
* **Errors**:
  - `400 UNSUPPORTED_FILE_TYPE`: file không phải JPEG/PNG/WEBP.
  - `400 FILE_TOO_LARGE`: file lớn hơn 5MB.
  - `400 FILE_REQUIRED`: không có field multipart `file`.

---

### 3.9 Admin Operations
*Tất cả endpoint admin yêu cầu access cookie có `role = admin`; thiếu hoặc hết hạn cookie trả `401`, role khác trả `403 ADMIN_ONLY`.*

#### [GET] `/admin/kyc`
* **Authentication**: `accessToken` cookie, admin role.
* **Query Params**:
  - `status`: `pending` | `verified` | `rejected`, mặc định `pending`.
  - `page`: mặc định `1`.
  - `limit`: mặc định `10`, tối đa `100`.
* **Success (200)**: Danh sách hồ sơ KYC an toàn, có thông tin nhận diện và audit nhưng không chứa password hoặc refresh token.
  ```json
  {
    "success": true,
    "data": [],
    "meta": {
      "total": 0,
      "page": 1,
      "limit": 10,
      "totalPages": 0
    }
  }
  ```
* **Errors**: `400` khi status hoặc pagination không hợp lệ.

#### [GET] `/admin/gears`
* **Authentication**: `accessToken` cookie, admin role.
* **Query Params**:
  - `approvalStatus`: `pending` | `approved` | `rejected`, mặc định `pending`.
  - `page`: mặc định `1`.
  - `limit`: mặc định `10`, tối đa `100`.
* **Success (200)**: Danh sách gear theo trạng thái duyệt, cùng cấu trúc pagination như queue KYC.
* **Errors**: `400` khi approvalStatus hoặc pagination không hợp lệ.

#### [POST] `/admin/kyc/:id/approve`
* **Authentication**: `accessToken` cookie, admin role, and valid `Origin`.
* **Success (201)**: Chuyển KYC `pending` sang `verified`, xóa rejection reason và lưu admin review/thời điểm review. Gọi lại trên KYC đã `verified` là idempotent và không đổi audit timestamp.
* **Errors**: `404` khi User ID không tồn tại; `409 INVALID_KYC_STATUS` cho transition không hợp lệ.

#### [POST] `/admin/kyc/:id/reject`
* **Authentication**: `accessToken` cookie, admin role, and valid `Origin`.
* **Body**:
  ```json
  { "reason": "Thông tin không khớp với ảnh chân dung" }
  ```
* **Success (201)**: Chuyển KYC `pending` sang `rejected`, lưu lý do và admin review. Gọi lại trên KYC đã `rejected` là idempotent. User phải gửi lại KYC trước khi có thể được duyệt khác trạng thái.
* **Errors**: `404` khi User ID không tồn tại; `409 INVALID_KYC_STATUS` cho transition không hợp lệ.

#### [POST] `/admin/gears/:id/approve`
* **Authentication**: `accessToken` cookie, admin role, and valid `Origin`.
* **Success (201)**: Chuyển gear `pending` sang `approved`, lưu `approvedBy` và `approvedAt`. Gear chỉ xuất hiện ở catalog công khai khi đồng thời `approved` và `available`; gọi approve lặp lại không đổi timestamp.
* **Errors**: `404` khi gear không tồn tại; `409 INVALID_GEAR_APPROVAL_STATUS` cho transition không hợp lệ.

#### [POST] `/admin/gears/:id/reject`
* **Authentication**: `accessToken` cookie, admin role, and valid `Origin`.
* **Success (201)**: Chuyển gear `pending` hoặc `approved` sang `rejected`, lưu admin review và loại gear khỏi catalog công khai. Gọi lại trên gear đã `rejected` là idempotent.
* **Errors**: `404` khi gear không tồn tại.

#### [POST] `/admin/disputes/:id/resolve` (Giải quyết tranh chấp đơn thuê)
* **Authentication**: `accessToken` cookie, admin role, and valid `Origin`.
* **Mô tả**: Quyết định số tiền khấu trừ từ khoản cọc của Renter để đền bù cho Lender. Hệ thống tự động gọi `EscrowService.compensate()` hoặc `release()` và chuyển order về `completed` trong cùng transaction.
* **Body**:
  ```json
  {
    "resolutionType": "deposit_deduct", // "deposit_deduct" | "refund"
    "deductAmount": 1500000, // Số tiền cọc khấu trừ đền bù cho Lender (chỉ dùng khi resolutionType = deposit_deduct)
    "resolutionNote": "Khấu trừ 1.500.000đ do làm nứt vỏ nhôm"
  }
  ```
* **Validation**:
  - `deposit_deduct` bắt buộc có `deductAmount` là số nguyên dương.
  - `refund` không được gửi `deductAmount`.
  - `resolutionNote` là tùy chọn, tối đa 2.000 ký tự.
* **Behavior theo resolutionType**:
  - `deposit_deduct`: gọi `EscrowService.compensate(orderId, deductAmount)` — khấu trừ tiền cọc, bồi thường cho lender.
  - `refund`: gọi `EscrowService.release(orderId)` — hoàn toàn bộ cọc.
* **Errors**:
  - `400 DEDUCT_EXCEEDS_DEPOSIT` nếu `deductAmount > escrow.amount`.
  - `400 INVALID_DISPUTE_STATUS` nếu dispute không còn ở trạng thái `open` / `under_review`.
  - `400 INVALID_ORDER_STATUS` nếu order liên quan không ở `disputed`.
  - `403 ADMIN_ONLY` nếu user đã đăng nhập nhưng không phải admin.
  - `404 NOT_FOUND` nếu dispute không tồn tại.
* **Success (200)**: Tranh chấp được đánh dấu `resolved`, escrow được release/compensate, đơn thuê chuyển về `completed`, và response dùng camelCase. Gọi lại một dispute đã `resolved` trả nguyên resolution đã lưu mà không thay đổi audit fields, số dư, escrow hoặc ledger.
