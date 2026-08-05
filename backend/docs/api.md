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


### Role and lender capability
- UserRole now contains only `renter` and `admin`. Regular users are renters by default.
- Lending permission is controlled by `users.lender_enabled` and returned as `lenderEnabled` / `lenderEnabledAt` in auth and account responses.
- Lender-sensitive APIs such as `POST /gears`, `GET /gears/mine`, and `GET/POST /wallets/lender` require `lenderEnabled = true`.
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

### 3.1 Auth & Account

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
* **Success (200)**: Trả về DTO camelCase an toàn gồm `id`, `email`, `phone`, `fullName`, `dob`, `cccd`, `avatarUrl`, `bio`, `rating`, `totalReviews`, `role`, `kycStatus`, `kycRejectionReason`, `createdAt`, `updatedAt`.
* **KYC status**: `unverified` khi user chưa gửi đủ hồ sơ; sau khi gửi dùng `pending`, `verified`, hoặc `rejected`.
* **Data safety**: Không bao giờ trả `password_hash`, `hashedRefreshToken` hoặc metadata review nội bộ.

#### [POST] `/users/me/lender-upgrade`
* **Authentication**: `accessToken` cookie; user must be `role = renter` and KYC verified.
* **Behavior**: returns existing approved/pending state idempotently; rejected users may submit a new request.
* **Body**: `{ "reason": "Optional lender business context" }`

#### [GET] `/users/me/lender-upgrade`
* **Authentication**: `accessToken` cookie.
* **Success (200)**: current lender upgrade request, approved enabled state, or `null` when no request exists.

#### Admin lender upgrade review
* `GET /admin/lender-upgrade-requests?status=pending&page=1&limit=10`
* `POST /admin/lender-upgrade-requests/:id/approve` enables lender capability and creates a lender wallet idempotently.
* `POST /admin/lender-upgrade-requests/:id/reject` requires `reviewNote` and does not enable lender capability.

#### [PATCH] `/users/me` (Cập nhật hồ sơ)
* **Authentication**: `accessToken` cookie và `Origin` hợp lệ.
* **Body**: Cho phép gửi một phần của `{ "fullName", "phone", "dob", "bio", "avatarUrl" }`. `dob` dùng `YYYY-MM-DD`; `avatarUrl` phải là ảnh do chính user upload qua `/media/upload`.
* **Success (200)**: Trả lại DTO user an toàn như `GET /users/me`.

#### [DELETE] `/users/me` (Đóng tài khoản)
* **Authentication**: `accessToken` cookie và `Origin` hợp lệ.
* **Body**: `{ "password": "CurrentPassword123" }`.
* **Behavior**: Soft-close bằng `is_active = false`, thu hồi refresh token và xóa cookie. Lịch sử tài chính/đơn thuê được giữ lại.
* **Errors**: `401` nếu mật khẩu sai; `409 ACCOUNT_HAS_ACTIVE_OBLIGATIONS` khi còn đơn chưa kết thúc, tranh chấp mở, tiền/hạn mức đang khóa, dư nợ hoặc withdrawal đang xử lý.
* **Success (200)**: `{ "success": true, "data": { "closed": true } }`.

#### Address book
* `GET /users/me/addresses`: danh sách địa chỉ của user, địa chỉ mặc định đứng đầu.
* `POST /users/me/addresses`: tạo địa chỉ; body gồm `receiverName`, `phone`, `detailAddress`, `ward`, `district`, `province`, `isDefault`.
* `PATCH /users/me/addresses/:addressId`: cập nhật các trường được gửi.
* `DELETE /users/me/addresses/:addressId`: xóa địa chỉ; nếu xóa mặc định thì địa chỉ cũ nhất còn lại được chọn thay thế.
* `PATCH /users/me/addresses/:addressId/default`: đặt địa chỉ mặc định.
* **Ownership**: `userId` luôn lấy từ JWT. ID không thuộc user hiện tại trả `404`.
* **Invariant**: Thao tác default khóa row user và chạy transaction để chỉ có tối đa một default address.

#### [POST] `/users/me/kyc` (Gửi hồ sơ KYC)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Body**:
  ```json
  {
    "cccd": "012345678912",
    "frontCardUrl": "/uploads/current-user-id/front.jpg",
    "backCardUrl": "/uploads/current-user-id/back.jpg",
    "portraitUrl": "/uploads/current-user-id/portrait.jpg",
    "creditConsentAccepted": true
  }
  ```
* **File ownership**: Cả ba URL phải là URL ImgBB do chính user nhận được từ `/media/upload`.
* **Credit consent**: Renter phải gửi `creditConsentAccepted: true`; lender có thể bỏ qua trường này.
* **Transitions**: Cho phép user chưa submit hoặc đã bị reject gửi hồ sơ. Hồ sơ `pending` hoặc `verified` không thể gửi đè.
* **Success (200)**: Trạng thái KYC cập nhật về `pending`, xóa audit/rejection cũ và chờ Admin duyệt thủ công.

---

### 3.2 Gears & Catalog (6 APIs)

> **Public catalog contract (authoritative)**
>
> `GET /categories` returns `{ id, parentId, name, slug, description }[]` in
> camelCase. Root categories have `parentId: null`.
>
> `GET /gears` only exposes approved, available gear. Query parameters:
>
> - `page`: integer, default `1`, minimum `1`.
> - `limit`: integer, default `10`, range `1..100`.
> - `search`: trimmed string, maximum 100 characters; blank is ignored.
> - `categoryId`: optional UUID; a parent selection recursively includes all
>   descendant categories.
> - `minPrice`, `maxPrice`: non-negative numbers applied to
>   `rentPricePerDay`; an inverted range returns `400 VALIDATION_ERROR`.
> - `sort`: `relevance`, `newest`, `priceAsc`, `priceDesc`, or `ratingDesc`.
>
> Sort defaults to `relevance` with a search and `newest` otherwise. Every
> order uses `createdAt DESC, id DESC` tie-breakers. Search performs substring
> matching on name, brand, model, and description. For three or more
> characters it also uses indexed PostgreSQL `pg_trgm` typo matching on name,
> brand, and model; queries shorter than three characters use substring only.
> Relevance is the greatest name/brand/model similarity.
>
> The list envelope is:
>
> ```json
> {
>   "success": true,
>   "data": [],
>   "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
> }
> ```
>
> A summary contains `id`, `lenderId`, `categoryId`, `name`, `brand`, `model`,
> `description`, `specifications`, `value`, `rentPricePerDay`, `status`,
> `approvalStatus`, `createdAt`, `updatedAt`, safe `category`, ordered `media`,
> gear-only `rating`/`reviewCount`, and safe `lender`. Category is
> `{ id, parentId, name, slug, description }`; media is
> `{ id, type, url, isPrimary, sortOrder }`; lender is
> `{ id, fullName, avatarUrl, rating, totalReviews }`. Password, refresh-token,
> email, phone, address, CCCD, and KYC fields are never public.
>
> `GET /gears/:id` uses the same contract and adds `serialNumber` plus reviews
> ordered newest first. Reviews are gear-targeted only and use
> `{ id, rating, comment, createdAt, reviewer: { id, fullName, avatarUrl } }`.
> Unapproved or unavailable gear returns `404`.

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
* **Authentication**: `accessToken` cookie; chỉ role `renter`.
* **Mô tả**: Trả về số dư ví ảo dùng để thanh toán phí thuê, lock cọc truyền thống và nhận refund trong môi trường demo. Đây là ví tiêu dùng nội bộ, **không hỗ trợ rút tiền trong MVP**.
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
* **Authentication**: `accessToken` cookie (and valid `Origin`); chỉ role `renter`.
* **Mô tả**: Tạo top-up intent để nạp tiền vào ví ảo. Với MVP demo, PayOS chỉ được mô phỏng ở mức checkout/callback shape, không xử lý tiền thật.
* **Body**:
  ```json
  {
    "amount": 500000,
    "method": "payos"
  }
  ```
* **Success (201)**:
  ```json
  {
    "success": true,
    "data": {
      "topupId": "uuid",
      "orderCode": 1785500000123456,
      "amount": 500000,
      "status": "pending",
      "paymentInstructions": {
        "bankCode": "MB",
        "accountNumber": "999988886666",
        "accountName": "MUTUX DEMO",
        "transferContent": "MUTUX 1785500000123456"
      }
    }
  }
  ```

#### [GET] `/wallets/mutux` (Thông tin Ví trả sau / Credit Line - Renter)
* **Authentication**: `accessToken` cookie; chỉ role `renter`.
* **Success (200)**: Trả về hạn mức khả dụng (`displayBalance`), hạn mức bị khóa (`lockedBalance`), dư nợ (`outstandingDebt`), tổng hạn mức (`totalLimit`) và trạng thái (`status`). Ví này chỉ dùng để bảo đảm cọc khi `depositType = credit_line`.
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
* **Authentication**: `accessToken` cookie; yêu cầu tài khoản `renter` có `lenderEnabled = true`.
* **Query Params**: `page` (default: 1), `limit` (default: 20)
* **Mô tả**: Trả về số dư doanh thu ảo của lender kèm danh sách giao dịch phân trang. Với MVP demo, withdraw là thao tác rút doanh thu demo: chỉ ghi nhận request/trạng thái và ledger nội bộ, không chuyển khoản ngân hàng thật.
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
  - **Authentication**: `accessToken` cookie (and valid `Origin`); yêu cầu tài khoản `renter` có `lenderEnabled = true`.
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

### 3.4 Rental Orders (10 APIs)

#### State-transition matrix (Lean MVP)

Đây là ma trận duy nhất được implementation chấp nhận. Tất cả transition khóa row order và chạy trong `prisma.$transaction`; actor sai luôn nhận `403 FORBIDDEN`.

| Action / endpoint | Actor | Source | Proof bắt buộc | Side effect nguyên tử | Target |
| --- | --- | --- | --- | --- | --- |
| Tạo order `POST /rental-orders` | renter | — | — | Không chạm ví | `pending_confirm` |
| `PATCH /:id/confirm` | lender | `pending_confirm` | — | Debit rental fee, lock cọc, tạo escrow, snapshot phí/doanh thu | `confirmed` |
| `PATCH /:id/ship` | lender | `confirmed` | `pre_shipment` của lender | Giao đúng hạn: ghi `lender_shipped_at`; giao trễ: hoàn tiền renter, giải phóng cọc | `delivering` hoặc `cancelled` |
| `PATCH /:id/cancel` | renter | `pending_confirm` | — | Không chạm ví/escrow | `cancelled` |
| `PATCH /:id/confirm-receipt` | renter | `delivering` | batch `post_received` của renter trong body | Ghi `renter_received_at` | `active` |
| `PATCH /:id/return` | renter | `active` | batch `pre_return` của renter trong body | Ghi `renter_returned_at` | `returning` |
| `POST /disputes` | renter hoặc lender của order | renter: `delivering`/`active`/`returning`; lender: `returning` | — | Tạo dispute/evidence | `disputed` |
| `PATCH /:id/confirm-return` | lender | `returning` | `pre_return` của renter và `post_returned` của lender | Release cọc, settle lender, ghi `lender_received_back_at` | `completed` |
| `POST /admin/disputes/:id/resolve` | admin | `disputed` | — | Release/compensate escrow và resolve dispute | `completed` |

**Idempotency**: retry cùng action sau khi transaction trước đã commit và order đang đúng target trả `200` với state hiện tại, không chạy lại timestamp hoặc side effect ví/escrow/ledger. Riêng tạo dispute retry trả lại dispute `open`/`under_review` đang có. Trạng thái khác source/target trả `400 INVALID_TRANSITION`; riêng cancel ngoài `pending_confirm`/`cancelled` trả `400 CANCEL_NOT_ALLOWED`.

**Deadline**: `ship_deadline_at` là `23:59:59.999` giờ Việt Nam của ngày trước `start_date`; `return_deadline_at` là `23:59:59.999` giờ Việt Nam của `end_date`. Giao trễ tự động hoàn `rental_fee` về ví renter, giải phóng cọc và chuyển order thành `cancelled` với `cancelled_reason = late_delivery_refund`. Trả trễ vẫn được phép chuyển sang `returning`, lender có thể mở dispute để Admin phân xử.

#### [POST] `/rental-orders` (Tạo yêu cầu thuê thiết bị - Renter)
* **Authentication**: `accessToken` cookie (and valid `Origin`); chỉ role `renter`.
* **Body**:
  ```json
  {
    "gearId": "uuid",
    "startDate": "2026-06-15",
    "endDate": "2026-06-20",
    "depositType": "credit_line", // "credit_line" (hạn mức Ví Mutux) hoặc "traditional" (lock từ ví ảo renter)
    "addressId": "40000000-0000-0000-0000-000000000001"
  }
  ```
* **Success (201)**: Tạo order ở trạng thái `pending_confirm` chờ Lender xác nhận.
* **Business rules**:
  - `gear.approval_status` phải là `approved` và gear phải đang `available`; nếu không trả `400 GEAR_NOT_AVAILABLE`.
  - `startDate` phải nhỏ hơn `endDate`; nếu không trả `400 INVALID_DATE_RANGE`.
  - `startDate` không được trước ngày hiện tại theo timezone business cố định `Asia/Ho_Chi_Minh`; nếu vi phạm trả `400 START_DATE_IN_PAST`. Date-only được so sánh độc lập timezone máy chạy.
  - Response lưu `ship_deadline_at` và `return_deadline_at` theo UTC, tương ứng các mốc cuối ngày ở `Asia/Ho_Chi_Minh`.
  - Chỉ các order `pending_confirm`, `confirmed`, `delivering`, `active`, `returning`, `disputed` chặn lịch trùng. `cancelled` và `completed` không chặn khoảng thuê mới; overlap trả `409 GEAR_UNAVAILABLE_FOR_PERIOD`.
  - `lenderId` luôn được lấy từ `gear.lender_id`, không nhận từ request body.
  - `duration_days = endDate - startDate` theo khoảng ngày nửa mở `[startDate, endDate)`; `rentalFee = snappedRentPricePerDay × durationDays`.
  - `snappedRentPricePerDay` lưu lại giá `rent_price_per_day` tại thời điểm tạo order. `depositAmount` lấy `gear.value`, hoặc `rentalFee × 2` khi gear chưa có `value`.
* **Response data**: gồm `status = pending_confirm`, `lender_id`, `duration_days`, `snapped_rent_price_per_day`, `rental_fee` và `deposit_amount` đã được server tính toán.

#### [GET] `/rental-orders` (Danh sách đơn thuê của tôi)
* **Query Params**: `role` (renter hoặc lender), `status`, `page`, `limit`
* **Auth scope**: renter chỉ xem order có `renter_id = req.user.id`; lender chỉ xem order có `lender_id = req.user.id`; admin xem tất cả order. Ownership được quyết định từ JWT, không tin `role` do client gửi.
* **Success (200)**: Trả về `{ "success": true, "data": [...], "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 } }`. Có thể lọc `status` (ví dụ `?status=confirmed&page=1&limit=10`).

#### [GET] `/rental-orders/financial-summary` (Tóm tắt nghĩa vụ tài chính pending)
* **Actor**: renter hiện tại.
* **Success (200)**: Trả về số dư khả dụng, tổng nghĩa vụ tiền mặt từ các order
  `pending_confirm`, tổng tiền cọc hạn mức Mutux đang chờ và số lượng order
  pending. Đây là dữ liệu hiển thị; kiểm tra quyết định vẫn
  được thực hiện lại trong transaction tạo order có khóa wallet.
* **Concurrency**: API có thể hơi stale giữa lúc tải và lúc submit; backend không
  dùng response này để bỏ qua bước kiểm tra transaction.

#### [GET] `/rental-orders/:id` (Chi tiết đơn thuê)
* **Success (200)**: Trả về chi tiết đơn, thông tin người thuê, người cho thuê, thiết bị và thông tin khiếu nại/tranh chấp đính kèm (nếu đơn hàng đang ở trạng thái `disputed`).
* **Authorization**: chỉ renter, lender liên quan hoặc admin được xem; user khác nhận `403 FORBIDDEN`.

#### [PATCH] `/rental-orders/:id/confirm` (Lender xác nhận đơn)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ lender của order; renter hoặc user khác nhận `403 FORBIDDEN`.
* **Transition**: `pending_confirm` → `confirmed`.
* **Escrow**: orchestration gọi `EscrowService.lock(orderId, tx)` và đổi status trong cùng transaction. Chỉ khi toàn bộ debit/lock/ledger/escrow thành công order mới được cập nhật; mọi lỗi rollback cả tiền lẫn status.
  - `traditional`: debit `rental_fee` từ ví renter và chuyển `deposit_amount` sang `locked_balance` của ví renter.
  - `credit_line`: debit `rental_fee` từ ví renter, giảm `mutux_wallets.display_balance`, tăng `mutux_wallets.locked_balance` và ghi `credit_transactions(type = deposit_lock)` cho tiền cọc.
* **Errors**:
  - `400 INVALID_TRANSITION` nếu order không ở `pending_confirm` hoặc `confirmed`; escrow không được gọi cho transition không hợp lệ.
  - `400 INSUFFICIENT_CASH` nếu ví renter không đủ trả `rental_fee` và phần cọc tiền mặt (nếu dùng `traditional`).
  - `400 INSUFFICIENT_CREDIT` nếu ví hạn mức không tồn tại, không active, hết hạn hoặc không đủ `deposit_amount`.
  - `400 ESCROW_LOCK_INCONSISTENT` nếu order `pending_confirm` đã có escrow/ledger không khớp; API không tự sửa hoặc debit thêm và order giữ nguyên để đối soát.
  - Lỗi từ escrow được trả nguyên trạng; mọi cập nhật ví, credit ledger và escrow đều rollback, order vẫn ở `pending_confirm`.
* **Success (200)**: trả về order với `status = confirmed`. Order được snapshot `platform_fee` và `lender_income` dựa trên platform fee rate 15%. Retry khi đã `confirmed` là no-op `200`.

#### [PATCH] `/rental-orders/:id/ship` (Lender xác nhận đã giao hàng)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ lender của order.
* **Transition**: `confirmed` → `delivering`.
* **Proof gate**: bắt buộc đã có `pre_shipment` do lender upload; thiếu proof trả `400 PROOF_REQUIRED` và order vẫn `confirmed`.
* **Side effect**: cập nhật `lender_shipped_at` bằng thời điểm hiện tại.
* **Late shipment**: nếu quá `ship_deadline_at`, hệ thống không giao order; trong cùng transaction hoàn `rental_fee` về ví renter, mở khóa cọc, ghi ledger `late_delivery_refund`, cập nhật `cancelled_reason = late_delivery_refund` và trả order `cancelled`.
* **Success (200)**: trả về order với `status = delivering`; retry khi đã `delivering` không đổi timestamp.

#### [PATCH] `/rental-orders/:id/cancel` (Renter hủy yêu cầu thuê)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ renter của order.
* **Transition**: `pending_confirm` → `cancelled`.
* **Money rule**: `pending_confirm` chưa lock tiền, vì vậy cancel chỉ đổi status và tuyệt đối không gọi ví/escrow/refund.
* **Errors**: từ `confirmed` trở đi trả `400 CANCEL_NOT_ALLOWED`. Sprint 3 không có cancel-after-payment hoặc auto-refund.
* **Success (200)**: trả về order với `status = cancelled`; retry khi đã `cancelled` là no-op.

#### [PATCH] `/rental-orders/:id/confirm-receipt` (Renter xác nhận đã nhận hàng)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ renter của order.
* **Body bắt buộc**: `{ "fileUrls": ["/uploads/.../received-1.jpg", "/uploads/.../received-2.jpg"], "note": "..." }`. Ảnh được kiểm tra quyền sở hữu và lưu thành proof `post_received` trong cùng transaction với transition.
* **Transition**: `delivering` → `active`.
* **Side effect**: cập nhật `renter_received_at` bằng thời điểm hiện tại; thiếu ảnh hoặc stage đã gửi trước đó trả `400 PROOF_REQUIRED` / `400 PROOF_STAGE_ALREADY_SUBMITTED`.
* **Success (200)**: trả về order với `status = active`.

#### [PATCH] `/rental-orders/:id/return` (Renter xác nhận đã gửi trả)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ renter của order; lender hoặc user khác nhận `403 FORBIDDEN`.
* **Body bắt buộc**: `{ "fileUrls": ["/uploads/.../return-1.jpg", "/uploads/.../return-2.jpg"], "note": "..." }`. Ảnh được lưu thành proof `pre_return` trong cùng transaction với transition.
* **Transition**: `active` → `returning`.
* **Side effect**: cập nhật `renter_returned_at` bằng thời điểm hiện tại; không thể gửi lại proof của cùng một stage.
* **Success (200)**: trả về order với `status = returning`.

#### [PATCH] `/rental-orders/:id/confirm-return` (Lender xác nhận đã nhận lại gear)
* **Authentication**: `accessToken` cookie (and valid `Origin` for state changes).
* **Actor**: chỉ lender của order.
* **Transition**: `returning` → `completed`.
* **Proof gate**: bắt buộc đồng thời có `pre_return` do renter upload và `post_returned` do lender upload; thiếu một trong hai trả `400 PROOF_REQUIRED`, không settlement.
* **Escrow**: orchestration gọi `EscrowService.release(orderId, tx)` trong cùng transaction để giải phóng cọc, cộng doanh thu cho lender, cập nhật trạng thái escrow thành `released`. Chỉ sau settlement thành công order mới chuyển `completed`.
  - `traditional`: mở khóa `locked_balance` của ví renter (balance không đổi), cộng `lenderIncome` vào ví lender.
  - `credit_line`: giảm `locked_balance` của MutuxWallet, tính lại `display_balance` theo invariant, cộng `lenderIncome` vào ví lender.
  - Phí nền tảng: `platformFee = rentalFee × 15%`, `lenderIncome = rentalFee - platformFee`, snapshot trên order tại thời điểm confirm.
* **Errors**:
  - `400 ESCROW_INVALID_STATUS` nếu escrow không ở trạng thái `locked`.
  - `400 LENDER_WALLET_NOT_FOUND` hoặc lỗi settlement khác làm rollback toàn bộ; order giữ `returning`, escrow và các ví giữ nguyên.
  - `400 SETTLEMENT_STATE_INCONSISTENT` nếu ledger lender đã tồn tại nhưng escrow vẫn `locked`; API không cho order chuyển `completed` và yêu cầu đối soát thủ công.
* **Side effect**: cập nhật `lender_received_back_at`, tạo `LenderWalletTransaction(type='income')`.
* **Success (200)**: trả về order với `status = completed`; retry khi đã `completed` không settlement lần hai.

Ngoài retry ở đúng target, status sai trả `400 INVALID_TRANSITION` (hoặc `CANCEL_NOT_ALLOWED` cho cancel). Mọi endpoint trả `404 NOT_FOUND` khi order không tồn tại và dùng response wrapper toàn cục `{ "success": true, "data": ... }` hoặc `{ "success": false, "error": ... }`.

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

* **File ownership**: `fileUrl` phải là URL ImgBB do chính caller nhận từ `POST /media/upload`. URL ngoài hệ thống hoặc URL không hợp lệ trả `400 INVALID_FILE_URL`.
* **Authorization**: chỉ renter/lender của order được tạo proof; user khác trả `403 FORBIDDEN`.
* **Errors**:
  - `400 INVALID_PROOF_STAGE`: sai actor hoặc trạng thái order cho stage.
  - `400 INVALID_FILE_URL`: URL không thuộc thư mục upload của caller.
  - `403 FORBIDDEN`: caller không phải participant của order.
  - `404 NOT_FOUND`: order không tồn tại.
  - `400 PROOF_STAGE_ALREADY_SUBMITTED`: stage này đã có proof; mỗi stage chỉ được gửi một batch duy nhất.
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

#### [POST] `/rental-orders/:id/proofs/batch` (Tạo nhiều bằng chứng trong một giai đoạn)
* **Body**: `{ "stage": "pre_shipment", "fileUrls": ["/uploads/.../front.jpg", "/uploads/.../back.jpg"], "note": "..." }`.
* **Rule**: tối đa 10 ảnh, chỉ actor đúng stage được gửi và mỗi stage của một order chỉ được submit một lần.

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
    "success": true,
    "data": {
      "orderCode": 123456,
      "amount": 500000,
      "reference": "MOCK-PAYOS-REF-001"
    }
  }
  ```
* **Signature**: HMAC-SHA256 của JSON deterministic (object keys được sắp xếp tăng dần ở mọi cấp), gửi qua header `x-payos-signature`. Secret lấy từ `PAYOS_WEBHOOK_SECRET`; body không chứa `signature`.
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

### 3.7 Disputes (1 API)

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
  - Renter có thể khiếu nại ở `delivering`, `active` hoặc `returning`; lender chỉ có thể khiếu nại ở `returning`.
  - Việc tạo dispute, evidence và chuyển order sang `disputed` chạy trong cùng transaction. Order được khóa để hai request đồng thời không thể cùng tạo dispute đang hoạt động.
  - Retry/concurrent request cho cùng order trả lại dispute `open`/`under_review` đã tồn tại, không tạo evidence hoặc dispute thứ hai.
* **Errors**:
  - `400 DISPUTE_NOT_ALLOWED_AT_THIS_STAGE` nếu order không ở stage cho phép theo actor.
  - `400 INVALID_FILE_URL` nếu evidence không phải ảnh local thuộc người gọi.
  - `403 FORBIDDEN` nếu người gọi không phải participant.
  - `404 NOT_FOUND` nếu order không tồn tại.
* **Success (201)**: Tạo tranh chấp cùng evidence thành công, server trả dữ liệu camelCase và order đổi sang `disputed`. Retry trả cùng dispute hiện hữu.

#### [POST] `/disputes/:id/evidence` (Bên còn lại gửi bằng chứng phản hồi)
* **Body**: `{ "description": "Mô tả phản hồi của lender", "evidences": [{ "mediaType": "image", "url": "/uploads/{currentUserId}/{uploadedFile}.jpg" }] }`. `description` tối đa 2.000 ký tự và được lưu riêng với mô tả khiếu nại ban đầu.
* **Rule**: chỉ bên không tạo dispute được gửi một lần, tối đa 5 ảnh, trong vòng 3 ngày kể từ `createdAt`; URL phải là ảnh do chính người gửi upload.
* **Success (201)**: trả dispute cùng toàn bộ evidence và `responseDeadlineAt`.

---

### 3.8 Notifications & Media (2 APIs)

#### [GET] `/notifications` (Lấy danh sách thông báo của tôi)
* **Authentication**: `accessToken` cookie.
* **Success (200)**: Trả về danh sách thông báo mới nhất.

#### [POST] `/media/upload` (Upload hình ảnh lên ImgBB)
* **Authentication**: `accessToken` cookie; `Content-Type: multipart/form-data`; valid `Origin` required.
* **Body (Form-data)**: `file` (Binary)
* **MIME types**: `image/jpeg`, `image/png`, `image/webp`.
* **Kích thước tối đa**: 5MB.
* **Lưu trữ**: Backend nhận file tạm, upload lên ImgBB, xóa file tạm và trả về URL ImgBB. URL này được dùng để lưu vào các bảng nghiệp vụ.
* **Success (201)**:
  ```json
  {
    "success": true,
    "data": {
      "url": "https://i.ibb.co/example/gear-front.jpg"
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

#### [GET] `/admin/dashboard/analytics`

Returns database-backed admin dashboard analytics. Requires an admin session.
Optional query parameters: `from`, `to` (ISO date strings) and `granularity=day|week`.
The default range is the previous 30 days through now. The response contains
timeline activity, rental orders by status, and admin queue distributions.

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

#### [GET] `/admin/disputes` (Lấy danh sách tranh chấp - Admin Queue)
* **Authentication**: `accessToken` cookie, admin role.
* **Query Params**:
  - `status`: `open` | `under_review` | `resolved` | `closed` (tùy chọn).
  - `page`: mặc định `1`.
  - `limit`: mặc định `10`, tối đa `100`.
* **Success (200)**: Danh sách tranh chấp kèm chi tiết đơn thuê, thông tin Renter, Lender, Gear và danh sách bằng chứng ảnh.
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "rentalOrderId": "uuid",
        "reportedBy": "uuid",
        "reporterRole": "renter",
        "reason": "device_damaged",
        "description": "Bàn phím bị nứt góc",
        "status": "open",
        "resolvedBy": null,
        "resolutionNote": null,
        "resolutionType": null,
        "deductAmount": null,
        "createdAt": "2026-07-29T10:15:00.000Z",
        "resolvedAt": null,
        "evidences": [],
        "rentalOrder": {
          "id": "uuid",
          "orderCode": "ORD-2026-8812",
          "status": "disputed",
          "depositAmount": 3500000,
          "totalRentFee": 360000,
          "renter": { "id": "uuid", "fullName": "Nguyễn Văn An", "email": "an@gmail.com" },
          "lender": { "id": "uuid", "fullName": "Trần Minh Hoàng", "email": "hoang@gmail.com" },
          "gear": { "id": "uuid", "name": "Bàn phím cơ Keychron Q1 Pro", "mediaUrls": ["/uploads/..."] }
        }
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```
* **Errors**: `400` khi status hoặc pagination không hợp lệ; `403 ADMIN_ONLY` nếu người dùng không phải admin.

#### [POST] `/admin/disputes/:id/resolve` (Giải quyết tranh chấp đơn thuê)
* **Authentication**: `accessToken` cookie, admin role, and valid `Origin`.
* **Mô tả**: Admin quyết định renter được hoàn tiền thuê, lender được bồi thường từ tiền cọc, hoặc không bên nào được bồi thường. Hệ thống settlement và chuyển order về `completed` trong cùng transaction nguyên tử (`prisma.$transaction`).
* **Body**:
  ```json
  {
    "resolutionType": "lender_compensation", // "renter_compensation" | "lender_compensation" | "no_action"
    "deductAmount": 1500000, // renter_compensation: tối đa rental_fee; lender_compensation: tối đa deposit_amount
    "resolutionNote": "Khấu trừ 1.500.000đ do làm nứt vỏ nhôm"
  }
  ```
* **Validation**:
  - `renter_compensation` bắt buộc có `deductAmount` là số nguyên dương và không vượt quá `rental_fee`.
  - `lender_compensation` bắt buộc có `deductAmount` là số nguyên dương và không vượt quá tiền cọc.
  - `no_action` không được gửi `deductAmount`; chỉ release cọc theo settlement thông thường.
  - `resolutionNote` là tùy chọn, tối đa 2.000 ký tự.
* **Behavior theo resolutionType & Số dư kỳ vọng**:
  - **`renter_compensation`**:
    - Gọi `EscrowService.compensateRenter(orderId, tx)`.
    - Renter nhận lại `deductAmount` vào ví renter và được giải phóng tiền cọc.
    - Cọc trả sau được mở khóa và ghi `CreditTransaction(type = deposit_release)`.
    - Lender không nhận `lenderIncome` từ đơn này.
    - Escrow status chuyển sang `renter_compensated`.
  - **`no_action`**:
    - Gọi `EscrowService.release(orderId, tx)`.
    - Cọc truyền thống (`renter_cash`): Renter `locked_balance` giảm đúng `escrow.amount` (mở khóa cọc). Số dư `balance` không đổi.
    - Cọc trả sau (`credit_line`): Mutux credit wallet `locked_balance` giảm `escrow.amount`, `display_balance` tăng lại `escrow.amount` tương ứng. Ghi `CreditTransaction(type = deposit_release)`.
    - Lender: `balance` tăng thêm `lenderIncome` (`rental_fee` trừ 15% phí sàn), ghi `LenderWalletTransaction(type = income)`.
    - Escrow status chuyển sang `released`.
  - **`lender_compensation` (với `deductAmount = X`)**:
    - Gọi `EscrowService.compensate(orderId, X, tx)`.
    - Cọc truyền thống (`renter_cash`): Renter `balance` giảm X, `locked_balance` giảm `escrow.amount` (phần cọc còn lại `escrow.amount - X` được mở khóa). Ghi `RenterWalletTransaction(type = compensation)`.
    - Cọc trả sau (`credit_line`): Mutux credit wallet `outstanding_debt` tăng X, `locked_balance` giảm `escrow.amount`, `display_balance` tính lại bằng `total_limit - locked_balance - outstanding_debt`. Ghi `CreditTransaction(type = compensation)`.
    - Lender: `balance` tăng thêm `lenderIncome + X` (nhận đủ doanh thu thuê + tiền đền bù X), ghi `LenderWalletTransaction(type = income)` và `LenderWalletTransaction(type = compensation)`.
     - Escrow status chuyển sang `compensated`.
  - Các giá trị cũ `refund` và `deposit_deduct` vẫn được đọc để tương thích dữ liệu cũ; request mới phải dùng các giá trị settlement mới.
* **Idempotency**:
  - Áp dụng ở tầng W3.5a: Kiểm tra `dispute.status === 'resolved'` trước khi thực thi settlement.
  - Khi gọi lại endpoint với `dispute.status` đã ở trạng thái `resolved`, API trả về 200 kèm record dispute đã giải quyết và `EscrowService` KHÔNG được gọi lần thứ hai (số dư ví, escrow và ledger hoàn toàn không thay đổi).
* **Errors & Atomicity**:
  - `400 DEDUCT_EXCEEDS_DEPOSIT` nếu `deductAmount > escrow.amount`. Record dispute KHÔNG được cập nhật (transaction rollback).
  - `400 INVALID_DISPUTE_STATUS` nếu dispute không ở `under_review` (hoặc `resolved` cho idempotency).
  - `400 INVALID_ORDER_STATUS` nếu order liên quan không ở `disputed`.
  - `403 ADMIN_ONLY` nếu user đã đăng nhập nhưng không phải admin.
  - `404 NOT_FOUND` nếu dispute không tồn tại.
* **Success (200)**: Tranh chấp được đánh dấu `resolved`, escrow được release/compensate, đơn thuê chuyển về `completed`, và response dùng camelCase.

# Credit limit APIs (MVP)

Renters must send `creditConsentAccepted: true` to `POST /users/me/kyc`.
Approving a renter KYC atomically grants the 3,000,000 VND tier. Credit tiers
are fixed at 3,000,000, 5,000,000 and 10,000,000 VND.

- `GET /wallets/mutux` returns a camelCase wallet snapshot. A renter without a
  grant receives `200` with `granted: false` and `status: "not_granted"`.
- `POST /wallets/mutux/debt/repay` repays all outstanding debt from the renter
  wallet. Errors: `CREDIT_WALLET_NOT_FOUND`, `NO_OUTSTANDING_DEBT`,
  `INSUFFICIENT_RENTER_BALANCE`, and `WALLET_INACTIVE`.
- `POST /credit-limit-requests` accepts
  `{ "requestedLimit": 5000000, "consentAccepted": true }`.
- `GET /credit-limit-requests/me` returns `{ active, history }`.
- `POST /credit-limit-requests/:id/cancel` cancels an owned pending request.
- Admin endpoints under `/admin/credit-limit-requests` support paginated list,
  `review`, `approve`, and `reject`. Approval must equal the requested tier.

The backend requires 3 completed orders for 5,000,000 and 10 for 10,000,000,
  and blocks increases for debt, an open/under-review dispute, or any
  `lender_compensation` resolution. It rechecks this policy at approval.
# Cart and batch checkout

All routes require authentication and renter role (`403 RENTER_ONLY`).

- `GET /cart` returns or lazily creates the renter cart.
- `PUT /cart/items/:gearId` with `{ startDate, endDate }` creates or updates
  the unique gear item.
- `DELETE /cart/items/:itemId` removes an owned item.
- `DELETE /cart` clears items while retaining the cart.
- `POST /rental-orders/batch` accepts `cartItemIds`, `depositType`, and
  `addressId`; it returns
  `{ orders, removedCartItemIds }` with status 201.

Cart quotes and availability use database values. Batch checkout locks rows,
creates one `pending_confirm` order per selected item, and removes only those
items atomically. Errors include `GEAR_NOT_FOUND`, `CART_ITEM_NOT_FOUND`,
`INVALID_DATE_RANGE`, `GEAR_NOT_AVAILABLE`, `CANNOT_RENT_OWN_GEAR`, and
  `GEAR_UNAVAILABLE_FOR_PERIOD`.

The selected address must belong to the authenticated renter. The backend
copies the receiver and formatted address into the order snapshot, so later
address-book edits do not change existing orders. An unknown or foreign
`addressId` returns `404 ADDRESS_NOT_FOUND`.

Before either single or batch order creation commits, the backend recalculates
the current database prices and validates the renter's aggregate financial
capacity, including all existing `pending_confirm` orders. A `traditional`
deposit requires available renter-wallet cash for the rental fee plus deposit.
A `credit_line` deposit requires renter-wallet cash for the rental fee and
Mutux available credit for the deposit. The renter wallet row is locked with
`FOR UPDATE` while this check and order creation run, so concurrent checkout
requests for the same renter are serialized. Failures return
`400 INSUFFICIENT_CASH`, `400 INSUFFICIENT_CREDIT`, or `400 WALLET_INACTIVE`;
the transaction creates no orders and removes no cart items. Insufficient
financial-capacity errors include `error.details` with available amount,
pending commitment, current-order requirement, total required amount and
shortfall. This is a checkout-time eligibility check only: no funds are held
while the order is `pending_confirm`, and the lender-confirm transition checks
and locks the wallets again atomically. A credit wallet with a non-null
`expiredAt <= now` is not granted for new credit-line checkouts and is rejected
with `INSUFFICIENT_CREDIT` at both checkout and lender confirmation.

### Admin dispute state machine

Disputes follow `open -> under_review -> resolved -> closed`.

- `POST /admin/disputes/:id/start-review`: admin-only; accepts `open`, records reviewer identity/time, and is idempotent for `under_review`.
- `POST /admin/disputes/:id/resolve`: admin-only; accepts only `under_review`, performs escrow release/compensation atomically, completes the rental order, and records settlement metadata.
- `POST /admin/disputes/:id/close`: admin-only; accepts only `resolved`, records close identity/time/note, and performs no financial operation.
- Repeating an already completed transition is idempotent; invalid current statuses return `400 INVALID_DISPUTE_STATUS`.

`GET /admin/disputes` accepts optional `status`, `page`, `limit`, `sortBy=createdAt|status`, and `sortOrder=asc|desc`. Responses include pagination metadata, transition audit data, and available next actions.
