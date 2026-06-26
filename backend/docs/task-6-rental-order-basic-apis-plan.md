# TASK 6: Implement Basic Rental Order Creation and Retrieval APIs

> Status: Planning  
> Scope: Backend API foundation for rental order creation and user order history  
> Updated: 2026-06-26

---

## 1. Mục tiêu

Task 6 xây dựng các API cơ bản cho luồng đặt thuê và xem lịch sử đơn thuê. Đây là nền móng để các task sau có thể triển khai payment, escrow, proof, dispute và settlement.

Các API cần có:

```http
POST /api/v1/rental-orders
GET  /api/v1/rental-orders
```

Kết quả mong muốn:

- Renter tạo được đơn thuê mới.
- Đơn thuê được lưu vào DB với trạng thái ban đầu `pending_confirm`.
- User đang đăng nhập xem được danh sách đơn thuê liên quan đến chính mình.
- API danh sách hỗ trợ lọc theo vai trò của user trong đơn: `renter` hoặc `lender`.

---

## 2. Nguồn sự thật hiện có trong repo

### 2.1 Prisma schema

File chính:

- [backend/prisma/schema.prisma](../prisma/schema.prisma)

Schema đã có sẵn model `RentalOrder`, không cần đổi schema cho task này nếu giữ scope basic.

Các field liên quan trong `RentalOrder`:

```text
id
order_code
renter_id
gear_id
lender_id
start_date
end_date
duration_days
snapped_rent_price_per_day
rental_fee
deposit_amount
deposit_type
status
shipping_address
shipping_name
shipping_phone
created_at
updated_at
```

Các enum đã có:

```text
OrderStatusType:
- pending_confirm
- confirmed
- delivering
- active
- returning
- completed
- cancelled
- disputed

DepositTypeEnum:
- traditional
- credit_line
```

### 2.2 API docs hiện có

File API tổng quan:

- [backend/docs/api.md](./api.md)

Mục rental orders trong API docs hiện đã định nghĩa:

```http
POST /rental-orders
GET  /rental-orders
GET  /rental-orders/:id
```

Task này chỉ implement phần basic:

```http
POST /rental-orders
GET  /rental-orders
```

### 2.3 Bruno collection hiện có

Các request mẫu:

- [backend/docs/bruno/04-Rental-Orders/Create Rental Order.bru](./bruno/04-Rental-Orders/Create%20Rental%20Order.bru)
- [backend/docs/bruno/04-Rental-Orders/Get Rental Orders.bru](./bruno/04-Rental-Orders/Get%20Rental%20Orders.bru)

Body mẫu của `POST /rental-orders`:

```json
{
  "gearId": "uuid",
  "startDate": "2026-06-15",
  "endDate": "2026-06-20",
  "depositType": "credit_line",
  "shippingAddress": "123 Đường ABC, Quận 1, TP. HCM",
  "shippingName": "Nguyễn Văn A",
  "shippingPhone": "0987654321"
}
```

---

## 3. Phạm vi Task 6

### 3.1 Trong scope

- Tạo module backend mới cho rental orders.
- Implement API tạo đơn thuê.
- Implement API lấy danh sách đơn thuê của user đang đăng nhập.
- Validate dữ liệu đầu vào.
- Validate logic ngày thuê.
- Tính các field bắt buộc để lưu `RentalOrder`.
- Dùng JWT để xác định user hiện tại.

### 3.2 Ngoài scope

Các phần sau không thuộc Task 6 basic, sẽ để task sau:

- Accept / reject order bởi lender.
- Payment thật hoặc payment mock.
- Lock cọc vào escrow.
- Debit ví renter.
- Credit line transaction.
- Upload proof.
- Dispute.
- Review.
- Notification.
- `GET /rental-orders/:id` nếu không được yêu cầu thêm trong task này.

---

## 4. API chi tiết

## 4.1 `POST /api/v1/rental-orders`

### Mục đích

Renter tạo yêu cầu thuê thiết bị.

### Auth

Bắt buộc JWT:

```http
Authorization: Bearer <jwt_token>
```

User hiện tại lấy từ `req.user.id`, theo pattern đang dùng trong:

- [backend/src/common/guards/jwt-auth.guard.ts](../src/common/guards/jwt-auth.guard.ts)
- [backend/src/modules/auth/strategies/jwt.strategy.ts](../src/modules/auth/strategies/jwt.strategy.ts)
- [backend/src/modules/users/users.controller.ts](../src/modules/users/users.controller.ts)

### Request body

```json
{
  "gearId": "uuid",
  "startDate": "2026-06-27",
  "endDate": "2026-06-30",
  "depositType": "traditional",
  "shippingAddress": "123 Đường ABC, Quận 1, TP. HCM",
  "shippingName": "Nguyễn Văn A",
  "shippingPhone": "0987654321"
}
```

### Validation shape

DTO cần validate:

| Field | Rule |
| --- | --- |
| `gearId` | UUID, required |
| `startDate` | date string, required |
| `endDate` | date string, required |
| `depositType` | enum `traditional` hoặc `credit_line`, required |
| `shippingAddress` | string non-empty, required |
| `shippingName` | string non-empty, required |
| `shippingPhone` | string non-empty, required |

### Validation nghiệp vụ

Service validate:

1. `startDate >= ngày mai`
2. `endDate > startDate`
3. `gearId` phải tồn tại

Nếu sai logic ngày tháng, trả HTTP `400`.

Ví dụ invalid:

```json
{
  "gearId": "uuid",
  "startDate": "2026-06-26",
  "endDate": "2026-06-25",
  "depositType": "traditional",
  "shippingAddress": "123 Đường ABC",
  "shippingName": "Nguyễn Văn A",
  "shippingPhone": "0987654321"
}
```

### Data mapping khi tạo order

Khi tạo order, backend tự suy ra các field DB:

| DB field | Nguồn / công thức |
| --- | --- |
| `order_code` | Generate trong service, ví dụ `RO-<timestamp>-<suffix>` |
| `renter_id` | `req.user.id` |
| `gear_id` | `body.gearId` |
| `lender_id` | `gear.lender_id` |
| `start_date` | normalized `body.startDate` |
| `end_date` | normalized `body.endDate` |
| `duration_days` | inclusive rental days = `endDate - startDate + 1` |
| `snapped_rent_price_per_day` | `gear.rent_price_per_day` |
| `rental_fee` | `duration_days * snapped_rent_price_per_day` |
| `deposit_amount` | `gear.value` |
| `deposit_type` | `body.depositType` |
| `status` | `pending_confirm` |
| `shipping_address` | `body.shippingAddress` |
| `shipping_name` | `body.shippingName` |
| `shipping_phone` | `body.shippingPhone` |

### Success response

HTTP `201`.

Do global interceptor đang wrap response, shape runtime sẽ là:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_code": "RO-...",
    "renter_id": "uuid",
    "gear_id": "uuid",
    "lender_id": "uuid",
    "start_date": "2026-06-27T00:00:00.000Z",
    "end_date": "2026-06-30T00:00:00.000Z",
    "duration_days": 4,
    "rental_fee": "...",
    "deposit_amount": "...",
    "deposit_type": "traditional",
    "status": "pending_confirm"
  }
}
```

---

## 4.2 `GET /api/v1/rental-orders`

### Mục đích

Lấy danh sách đơn thuê liên quan đến user đang đăng nhập.

### Auth

Bắt buộc JWT:

```http
Authorization: Bearer <jwt_token>
```

### Query params

Task 6 yêu cầu filter theo `role`:

```http
GET /api/v1/rental-orders?role=renter
GET /api/v1/rental-orders?role=lender
```

| Query | Rule |
| --- | --- |
| `role` | required, enum `renter` hoặc `lender` |

### Query behavior

Nếu:

```http
role=renter
```

thì query:

```text
where renter_id = currentUserId
```

Nếu:

```http
role=lender
```

thì query:

```text
where lender_id = currentUserId
```

Kết quả nên sort mới nhất trước:

```text
orderBy created_at desc
```

### Success response

HTTP `200`.

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_code": "RO-...",
      "renter_id": "uuid",
      "gear_id": "uuid",
      "lender_id": "uuid",
      "start_date": "2026-06-27T00:00:00.000Z",
      "end_date": "2026-06-30T00:00:00.000Z",
      "duration_days": 4,
      "rental_fee": "...",
      "deposit_amount": "...",
      "deposit_type": "traditional",
      "status": "pending_confirm"
    }
  ]
}
```

---

## 5. Thiết kế module

Tạo folder:

```text
backend/src/modules/rental-orders/
```

Cấu trúc đề xuất:

```text
rental-orders/
├── dto/
│   ├── create-rental-order.dto.ts
│   └── get-rental-orders-query.dto.ts
├── rental-orders.controller.ts
├── rental-orders.module.ts
├── rental-orders.repository.ts
└── rental-orders.service.ts
```

Đăng ký module trong:

- [backend/src/app.module.ts](../src/app.module.ts)

---

## 6. Trách nhiệm từng lớp

### 6.1 Controller

File:

```text
backend/src/modules/rental-orders/rental-orders.controller.ts
```

Trách nhiệm:

- Định nghĩa route `rental-orders`.
- Gắn `JwtAuthGuard` cho cả `POST` và `GET`.
- Nhận DTO body/query.
- Lấy `req.user.id`.
- Gọi service.

Pseudo-code:

```ts
@Controller('rental-orders')
export class RentalOrdersController {
  constructor(private readonly rentalOrdersService: RentalOrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: any, @Body() dto: CreateRentalOrderDto) {
    return this.rentalOrdersService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findMine(@Req() req: any, @Query() query: GetRentalOrdersQueryDto) {
    return this.rentalOrdersService.findMine(req.user.id, query.role);
  }
}
```

### 6.2 Service

File:

```text
backend/src/modules/rental-orders/rental-orders.service.ts
```

Trách nhiệm:

- Validate business rules.
- Normalize date-only input.
- Tính `duration_days`, `rental_fee`, `deposit_amount`.
- Generate `order_code`.
- Gọi repository để đọc gear và tạo/list order.

Business rules chính:

```text
startDate >= tomorrow
endDate > startDate
```

### 6.3 Repository

File:

```text
backend/src/modules/rental-orders/rental-orders.repository.ts
```

Trách nhiệm:

- Chứa Prisma query.
- `findGearById(gearId)`
- `create(data)`
- `findMine(userId, role)`

Query list:

```ts
where: role === 'renter'
  ? { renter_id: userId }
  : { lender_id: userId }
```

---

## 7. Reuse convention hiện có

Task này nên bám theo convention hiện tại của project:

| Convention | File tham chiếu |
| --- | --- |
| Global route prefix `api/v1` | [backend/src/main.ts](../src/main.ts) |
| Global `ValidationPipe` | [backend/src/main.ts](../src/main.ts) |
| Response wrapper `{ success, data }` | [backend/src/common/interceptors/transform.interceptor.ts](../src/common/interceptors/transform.interceptor.ts) |
| Error wrapper `{ success, error }` | [backend/src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts) |
| JWT guard | [backend/src/common/guards/jwt-auth.guard.ts](../src/common/guards/jwt-auth.guard.ts) |
| `req.user` shape | [backend/src/modules/auth/strategies/jwt.strategy.ts](../src/modules/auth/strategies/jwt.strategy.ts) |
| Controller/service/repository pattern | [backend/src/modules/gears/](../src/modules/gears/) |

---

## 8. Lưu ý implementation

### 8.1 Date handling

Nên normalize input date theo date-only để tránh lệch giờ do timezone.

Ví dụ:

```ts
const parseDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);
```

Ngày mai nên tính theo date-only:

```ts
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setUTCDate(today.getUTCDate() + 1);
```

### 8.2 Duration days

Dùng inclusive duration:

```text
duration_days = diffDays(endDate, startDate) + 1
```

Ví dụ:

```text
startDate = 2026-06-27
endDate   = 2026-06-30
=> duration_days = 4
```

### 8.3 Deposit amount

Vì `rental_orders.deposit_amount` là required, service cần luôn có giá trị.

Đề xuất:

```text
deposit_amount = gear.value
```

Nếu `gear.value` null thì nên trả `400` hoặc fallback `0`. Với business rental thực tế, nên ưu tiên trả `400` để tránh tạo order không có cọc hợp lệ.

### 8.4 Gear availability

Task 6 chưa yêu cầu kiểm tra lịch trùng hoặc trạng thái gear. Có thể giữ basic:

- Chỉ check gear tồn tại.

Nếu muốn chặt hơn ở task sau:

- gear phải `status = available`
- gear phải `approval_status = approved`
- không có order active/confirmed trùng ngày

---

## 9. Acceptance criteria mapping

| Acceptance criteria | Cách đáp ứng |
| --- | --- |
| `POST /rental-orders` thành công, lưu dữ liệu đúng vào DB, HTTP 201 | Controller POST + service calculate + repository create |
| Trả lỗi 400 nếu dữ liệu ngày tháng sai logic | Service throw `BadRequestException` cho `startDate < tomorrow` hoặc `endDate <= startDate` |
| `GET /rental-orders` trả đúng danh sách đơn hàng của tài khoản test | Repository filter bằng `renter_id` hoặc `lender_id` theo `req.user.id` |

---

## 10. Verification plan

### 10.1 Build/test

Chạy trong `backend`:

```bash
npm run build
npm test
```

Nếu có test e2e phù hợp:

```bash
npm run test:e2e
```

### 10.2 Test create order thành công

Request:

```http
POST /api/v1/rental-orders
Authorization: Bearer <renter_token>
Content-Type: application/json
```

Body:

```json
{
  "gearId": "30000000-0000-0000-0000-000000000001",
  "startDate": "2026-06-27",
  "endDate": "2026-06-30",
  "depositType": "traditional",
  "shippingAddress": "123 Đường ABC, Quận 1, TP. HCM",
  "shippingName": "Nguyễn Văn A",
  "shippingPhone": "0987654321"
}
```

Expected:

```text
HTTP 201
status = pending_confirm
renter_id = current user id
gear_id = body.gearId
lender_id = gear.lender_id
duration_days = 4
```

### 10.3 Test invalid date

Case 1:

```text
startDate = today
```

Expected:

```text
HTTP 400
```

Case 2:

```text
endDate <= startDate
```

Expected:

```text
HTTP 400
```

### 10.4 Test list renter orders

Request:

```http
GET /api/v1/rental-orders?role=renter
Authorization: Bearer <renter_token>
```

Expected:

```text
HTTP 200
Tất cả item có renter_id = current user id
```

### 10.5 Test list lender orders

Request:

```http
GET /api/v1/rental-orders?role=lender
Authorization: Bearer <lender_token>
```

Expected:

```text
HTTP 200
Tất cả item có lender_id = current user id
```

---

## 11. Checklist implementation

### Module/files

- [ ] Tạo `backend/src/modules/rental-orders/rental-orders.module.ts`
- [ ] Tạo `backend/src/modules/rental-orders/rental-orders.controller.ts`
- [ ] Tạo `backend/src/modules/rental-orders/rental-orders.service.ts`
- [ ] Tạo `backend/src/modules/rental-orders/rental-orders.repository.ts`
- [ ] Tạo `backend/src/modules/rental-orders/dto/create-rental-order.dto.ts`
- [ ] Tạo `backend/src/modules/rental-orders/dto/get-rental-orders-query.dto.ts`
- [ ] Import `RentalOrdersModule` vào `backend/src/app.module.ts`

### API behavior

- [ ] `POST /api/v1/rental-orders` bắt JWT
- [ ] `POST /api/v1/rental-orders` validate body
- [ ] `POST /api/v1/rental-orders` validate `startDate >= tomorrow`
- [ ] `POST /api/v1/rental-orders` validate `endDate > startDate`
- [ ] `POST /api/v1/rental-orders` tạo order `pending_confirm`
- [ ] `GET /api/v1/rental-orders?role=renter` trả order theo `renter_id`
- [ ] `GET /api/v1/rental-orders?role=lender` trả order theo `lender_id`

### Verification

- [ ] Build pass
- [ ] Tests pass hoặc ghi rõ test nào chưa pass và lý do
- [ ] Bruno/manual request create order pass
- [ ] Bruno/manual request invalid date trả 400
- [ ] Bruno/manual request list orders đúng user hiện tại

---

## 12. Kết luận

Task 6 không cần thay đổi database schema vì `RentalOrder`, `OrderStatusType` và `DepositTypeEnum` đã có sẵn. Việc cần làm chính là thêm service/controller/repository layer để expose hai API basic:

```http
POST /api/v1/rental-orders
GET  /api/v1/rental-orders?role=renter|lender
```

Implementation nên giữ scope nhỏ, chưa kéo payment/escrow vào task này. Order sau khi tạo chỉ ở trạng thái `pending_confirm`, làm nền cho các bước confirm, payment, escrow và lifecycle ở task sau.
