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
Hệ thống sử dụng cơ chế **Single JWT Token** đơn giản cho MVP:
- Hạn dùng token dài (ví dụ: 30 ngày) lưu ở local storage hoặc cookie.
- Truyền qua header ở mỗi request cần xác thực:
  ```http
  Authorization: Bearer <jwt_token>
  ```

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

## 3. Danh sách APIs Tinh gọn (26 Endpoints)

### 3.1 Auth & Users (5 APIs)

#### [POST] `/auth/register` (Đăng ký)
* **Body**:
  ```json
  {
    "email": "user@example.com",
    "phone": "0987654321",
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
* **Success (200)**: Trả về token duy nhất dùng cho 30 ngày.
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
      "user": { "id": "uuid", "email": "user@example.com", "role": "renter" }
    }
  }
  ```

#### [POST] `/auth/logout` (Đăng xuất)
* **Success (200)**: `{"success": true}`.

#### [GET] `/users/me` (Lấy thông tin cá nhân)
* **Headers**: `Authorization: Bearer <token>`
* **Success (200)**: Trả về thông tin chi tiết user (bao gồm cả trạng thái `kycStatus` và `cccd`).

#### [POST] `/users/me/kyc` (Gửi hồ sơ KYC)
* **Headers**: `Authorization: Bearer <token>`
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

### 3.2 Gears & Catalog (5 APIs)

#### [GET] `/categories` (Danh sách danh mục)
* **Success (200)**: Mảng phẳng các danh mục gear (có chứa `id` và `parentId` để vẽ cây danh mục).

#### [GET] `/gears` (Tìm kiếm / Lọc danh sách thiết bị công khai)
* **Query Params**: `page`, `limit`, `search`, `categoryId`, `minPrice`, `maxPrice`
* **Success (200)**: Trả về danh sách gears kèm theo đối tượng phân trang `meta`.

#### [GET] `/gears/:id` (Chi tiết thiết bị)
* **Success (200)**: Thông tin chi tiết thiết bị kèm danh sách hình ảnh (`media`) và danh sách các đánh giá (`reviews`) đã có của thiết bị đó.

#### [POST] `/gears` (Lender đăng thiết bị mới)
* **Headers**: `Authorization: Bearer <token>` (Phải là user đã duyệt KYC)
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
* **Headers**: `Authorization: Bearer <token>`
* **Body**: Truyền các trường cần cập nhật hoặc đổi trạng thái `status` sang `delisted` để gỡ thiết bị.
* **Success (200)**: Cập nhật thành công. Chỉ lender sở hữu gear được sửa; sửa gear đã `approved` sẽ đưa gear về `pending` để duyệt lại.

---

### 3.3 Wallets (4 APIs)

#### [GET] `/wallets/renter` (Thông tin ví ảo của Renter)
* **Headers**: `Authorization: Bearer <token>`
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
* **Headers**: `Authorization: Bearer <token>`
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
* **Headers**: `Authorization: Bearer <token>`
* **Success (200)**: Trả về hạn mức khả dụng (`displayBalance`), hạn mức bị khóa (`lockedBalance`), dư nợ (`outstandingDebt`). Ví này chỉ dùng để bảo đảm cọc khi `depositType = credit_line`.

#### [GET] `/wallets/lender` (Thông tin Ví thu nhập ảo & Yêu cầu rút tiền - Lender)
* **Headers**: `Authorization: Bearer <token>`
* **Mô tả**: Trả về số dư thu nhập ảo của lender. Với MVP demo, withdraw chỉ ghi nhận request/trạng thái, không chuyển khoản ngân hàng thật.
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
* **Headers**: `Authorization: Bearer <token>`
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
* **Headers**: `Authorization: Bearer <token>`
* **Actor**: chỉ lender của order; renter hoặc user khác nhận `403 FORBIDDEN`.
* **Transition**: `pending_confirm` → `confirmed`.
* **Escrow**: gọi `EscrowService.lock(orderId)` trước khi đổi trạng thái. Chỉ khi lock thành công mới cập nhật order; lock tạo `EscrowWallet` ở trạng thái `locked`.
* **Errors**:
  - `400 INVALID_TRANSITION` nếu order không còn ở `pending_confirm`; escrow không được gọi cho transition không hợp lệ.
  - Lỗi từ escrow, ví dụ `400 INSUFFICIENT_CASH`, được trả nguyên trạng và order vẫn ở `pending_confirm`.
* **Success (200)**: trả về order với `status = confirmed`.

#### [PATCH] `/rental-orders/:id/ship` (Lender xác nhận đã giao hàng)
* **Headers**: `Authorization: Bearer <token>`
* **Actor**: chỉ lender của order.
* **Transition**: `confirmed` → `delivering`.
* **Side effect**: cập nhật `lender_shipped_at` bằng thời điểm hiện tại.
* **Success (200)**: trả về order với `status = delivering`.

#### [PATCH] `/rental-orders/:id/cancel` (Renter hủy yêu cầu thuê)
* **Headers**: `Authorization: Bearer <token>`
* **Actor**: chỉ renter của order.
* **Transition**: `pending_confirm` → `cancelled`.
* **Success (200)**: trả về order với `status = cancelled`.

#### [PATCH] `/rental-orders/:id/confirm-receipt` (Renter xác nhận đã nhận hàng)
* **Headers**: `Authorization: Bearer <token>`
* **Actor**: chỉ renter của order.
* **Transition**: `delivering` → `active`.
* **Side effect**: cập nhật `renter_received_at` bằng thời điểm hiện tại.
* **Success (200)**: trả về order với `status = active`.

#### [PATCH] `/rental-orders/:id/return` (Renter xác nhận đã gửi trả)
* **Headers**: `Authorization: Bearer <token>`
* **Actor**: chỉ renter của order; lender hoặc user khác nhận `403 FORBIDDEN`.
* **Transition**: `active` → `returning`.
* **Side effect**: cập nhật `renter_returned_at` bằng thời điểm hiện tại.
* **Success (200)**: trả về order với `status = returning`.

#### [PATCH] `/rental-orders/:id/confirm-return` (Lender xác nhận đã nhận lại gear)
* **Headers**: `Authorization: Bearer <token>`
* **Actor**: chỉ lender của order.
* **Transition**: `returning` → `completed`.
* **Side effect**: cập nhật `lender_received_back_at` bằng thời điểm hiện tại. Việc gọi `EscrowService.release()` được kích hoạt ở W3.1, chưa thuộc endpoint trong task này.
* **Success (200)**: trả về order với `status = completed`.

Với năm endpoint không gọi escrow, nếu trạng thái hiện tại không đúng trạng thái nguồn thì API trả `400 INVALID_TRANSITION`. Mọi endpoint trả `404 NOT_FOUND` khi order không tồn tại và dùng response wrapper toàn cục `{ "success": true, "data": ... }` hoặc `{ "success": false, "error": ... }`.

---

### 3.5 Rental Proofs (2 APIs)
*Tải hình ảnh/video bằng chứng qua 4 mốc bàn giao giúp tránh tranh chấp.*

#### [POST] `/rental-orders/:id/proofs` (Tải lên bằng chứng)
* **Headers**: `Authorization: Bearer <token>`
* **Body**:
  ```json
  {
    "stage": "pre_shipment", // "pre_shipment" | "post_received" | "pre_return" | "post_returned"
    "proofType": "image",
    "fileUrl": "https://...",
    "note": "Hộp đầy đủ cáp và keycap"
  }
  ```
* **Success (201)**: Ghi nhận bằng chứng bàn giao thành công.

#### [GET] `/rental-orders/:id/proofs` (Xem bằng chứng đơn hàng)
* **Success (200)**: Trả về toàn bộ danh sách ảnh/video bàn giao đã tải lên của đơn hàng đó.

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
* **Headers**: `Authorization: Bearer <token>`
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
* **Headers**: `Authorization: Bearer <token>`
* **Body**:
  ```json
  {
    "rentalOrderId": "uuid",
    "reason": "device_damaged",
    "description": "Bàn phím bị nứt góc nhôm",
    "evidences": [
      { "mediaType": "image", "url": "https://..." }
    ]
  }
  ```
* **Success (210)**: Tạo tranh chấp thành công, đơn hàng đổi trạng thái sang `disputed`.

#### [POST] `/reviews` (Đánh giá sau khi hoàn thành đơn thuê)
* **Headers**: `Authorization: Bearer <token>`
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
* **Headers**: `Authorization: Bearer <token>`
* **Success (200)**: Trả về danh sách thông báo mới nhất.

#### [POST] `/media/upload` (Upload hình ảnh / video)
* **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
* **Body (Form-data)**: `file` (Binary)
* **Success (201)**: Trả về link CDN/Cloud của ảnh/video (`{"success": true, "data": {"url": "https://..."}}`).

---

### 3.9 Admin Operations
*Tất cả endpoint yêu cầu JWT có `role = admin`; thiếu token trả `401`, role khác trả `403 ADMIN_ONLY`.*

#### [POST] `/admin/kyc/:id/approve`
* **Headers**: `Authorization: Bearer <token>` (Admin)
* **Success (201)**: Chuyển KYC `pending` sang `verified`, lưu admin review và thời điểm review. Gọi lại trên KYC đã `verified` là idempotent.

#### [POST] `/admin/kyc/:id/reject`
* **Headers**: `Authorization: Bearer <token>` (Admin)
* **Body**:
  ```json
  { "reason": "Thông tin không khớp với ảnh chân dung" }
  ```
* **Success (201)**: Chuyển KYC `pending` sang `rejected`, lưu lý do và admin review. User phải gửi lại KYC trước khi có thể được duyệt khác trạng thái.

#### [POST] `/admin/gears/:id/approve`
* **Headers**: `Authorization: Bearer <token>` (Admin)
* **Success (201)**: Chuyển gear `pending` sang `approved`, lưu `approvedBy` và `approvedAt`. Gear chỉ xuất hiện ở catalog công khai khi đồng thời `approved` và `available`; gọi approve lặp lại không đổi timestamp.

#### [POST] `/admin/gears/:id/reject`
* **Headers**: `Authorization: Bearer <token>` (Admin)
* **Success (201)**: Chuyển gear `pending` hoặc `approved` sang `rejected`, lưu admin review và loại gear khỏi catalog công khai.

#### [POST] `/admin/disputes/:id/resolve` (Giải quyết tranh chấp đơn thuê)
* **Headers**: `Authorization: Bearer <token>` (Admin)
* **Mô tả**: Quyết định số tiền khấu trừ từ khoản cọc của Renter để đền bù cho Lender.
* **Body**:
  ```json
  {
    "resolutionType": "deposit_deduct", // "deposit_deduct", "refund", "no_action"
    "deductAmount": 1500000, // Số tiền cọc khấu trừ đền bù cho Lender
    "resolutionNote": "Khấu trừ 1.500.000đ do làm nứt vỏ nhôm"
  }
  ```
* **Success (200)**: Tranh chấp đã được xử lý xong, hệ thống tự động mở khóa / phân bổ cọc trong escrow và chuyển đơn thuê về trạng thái `completed`.
