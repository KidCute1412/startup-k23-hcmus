# Mutux MVP - Hướng Dẫn Kiểm Thử (Test Flow)

Tài liệu này hướng dẫn chi tiết các kịch bản kiểm thử (Test Flow) bao phủ toàn bộ các tính năng cốt lõi của Mutux MVP. 
*Lưu ý: Bạn có thể sử dụng các tài khoản có sẵn trong `account.md` hoặc tạo mới.*

---

## 🟢 Flow 1: Người thuê mới trải nghiệm nền tảng (Thanh toán thường)
**Mục tiêu:** Kiểm tra luồng tìm kiếm, đặt thuê cơ bản mà chưa cần xác thực quá nhiều.

1. **Đăng ký / Đăng nhập**
   - Đăng ký một tài khoản mới (vai trò Renter) hoặc đăng nhập bằng tài khoản `renter_cash@test.com`.
2. **Tìm kiếm & Chọn sản phẩm**
   - Truy cập trang chủ, xem danh sách sản phẩm (Gears).
   - Bấm vào một sản phẩm bất kỳ để xem chi tiết.
   - Thêm sản phẩm vào giỏ hàng (Cart) và chọn số ngày muốn thuê.
3. **Thanh toán (Cash/Thẻ cá nhân)**
   - Tiến hành Checkout đơn hàng.
   - Tại màn hình thanh toán, chọn phương thức thanh toán ngoài (tiền mặt / chuyển khoản thủ công qua PayOS mock).
   - Xác nhận đơn hàng thành công và theo dõi trạng thái đơn hàng.

---

## 🔵 Flow 2: Đăng ký KYC & Cấp hạn mức tín dụng (Mutux Credit)
**Mục tiêu:** Kiểm tra quy trình xác thực danh tính, ví nội bộ và tính năng cấp vốn cho sinh viên.

1. **Gửi yêu cầu KYC (Người dùng)**
   - Đăng nhập bằng một tài khoản Renter chưa KYC (vd: `renter4@gmail.com`).
   - Vào **Dashboard cá nhân** $\rightarrow$ Chọn **Xác thực danh tính (KYC)**.
   - Tải lên ảnh mặt trước/mặt sau CCCD và gửi yêu cầu.
2. **Duyệt KYC (Quản trị viên)**
   - Đăng nhập bằng tài khoản Admin (`admin@mutux.vn`).
   - Vào **Admin Portal** $\rightarrow$ Quản lý KYC.
   - Chấp nhận (Approve) yêu cầu KYC của user trên.
3. **Mở Ví & Cấp hạn mức (Người dùng)**
   - Đăng nhập lại vào tài khoản Renter vừa được duyệt KYC.
   - Vào **Ví Mutux (Wallet)** $\rightarrow$ Kích hoạt ví nội bộ.
   - Bấm **Xin cấp hạn mức tín dụng (Request Credit Limit)**.
   - Hệ thống tự động phê duyệt (hoặc chờ Admin duyệt tuỳ cấu hình) và cấp một số dư tín dụng nhất định (VD: 2.000.000 VNĐ) để sử dụng làm tiền cọc/thuê đồ.

---

## 🟠 Flow 3: Trở thành Người cho thuê (Lender) & Đăng sản phẩm
**Mục tiêu:** Kiểm tra luồng supply (nguồn cung), từ việc đăng ký trở thành đối tác cho thuê đến khi sản phẩm được đưa lên sàn.

1. **Đăng ký Lender (Người dùng)**
   - Đăng nhập bằng một tài khoản đã KYC nhưng chưa phải là Lender.
   - Truy cập trang **Trở thành Lender (Đối tác cho thuê)** $\rightarrow$ Gửi yêu cầu.
2. **Duyệt Lender (Quản trị viên)**
   - Đăng nhập bằng tài khoản Admin (`admin@mutux.vn`).
   - Vào **Admin Portal** $\rightarrow$ Quản lý Lender.
   - Chấp nhận (Approve) tài khoản này thành Lender hợp lệ.
3. **Đăng sản phẩm mới (Lender)**
   - Lender vào **Lender Dashboard** $\rightarrow$ Quản lý Thiết bị (Gears) $\rightarrow$ Thêm mới.
   - Nhập thông tin thiết bị (Hình ảnh, tình trạng, giá trị thực tế, giá thuê theo ngày...).
   - Đăng sản phẩm (Trạng thái sản phẩm sẽ là `pending`).
4. **Kiểm duyệt sản phẩm (Quản trị viên)**
   - Admin vào **Admin Portal** $\rightarrow$ Quản lý Thiết bị.
   - Xem xét thông tin thiết bị của Lender vừa đăng và bấm **Duyệt (Approve)**.
   - Sản phẩm chính thức xuất hiện trên trang chủ cho các Renter khác thuê.

---

### 🚀 Tips khi test:
- **Tài khoản có sẵn:** Hãy tham khảo `account.md` để lấy thông tin các tài khoản đã được Seeding sẵn (giúp bỏ qua bước đăng ký).
- **Luồng Escrow (Giao dịch bảo đảm):** Khi test Flow 1, tiền của Renter thực chất sẽ được giữ ở trạng thái *Tạm giữ (Escrow)*. Hãy test thêm bước: Renter xác nhận nhận hàng $\rightarrow$ Hết hạn thuê $\rightarrow$ Trả hàng thành công thì tiền mới thực sự chảy về Ví của Lender.
