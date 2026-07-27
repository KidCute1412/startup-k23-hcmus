# Báo cáo Tài chính PA4 - Mutux (Phần của Head of Finance)

---

## 1. Mô hình doanh thu của dự án
Mutux vận hành theo mô hình trung gian kết nối (Marketplace) kết hợp dịch vụ bảo vệ thanh toán (Escrow). Thay vì phụ thuộc hoàn toàn vào phí thuê thiết bị – phần doanh thu vốn dĩ thuộc về đối tác cho thuê – Mutux đa dạng hóa nguồn doanh thu thông qua các giao dịch B2C, các dịch vụ dành cho đối tác B2B và các chương trình hợp tác với đối tác thanh toán. Mô hình này giúp tối ưu hóa biên lợi nhuận thông qua việc khai thác luồng giao dịch từ cả hai phía cung và cầu.

## 2. Các nguồn doanh thu dự kiến
**Nguồn doanh thu cơ sở (từ Giao dịch B2C):**
*   **Phí nền tảng (Take Rate):** Đây là nguồn thu chủ lực của Mutux. Hệ thống sẽ tự động trích xuất hoa hồng **30%** trên tổng giá trị tiền thuê của mỗi giao dịch thành công.

**Nguồn doanh thu Dịch vụ (Theo lộ trình 2 giai đoạn):**
*   **Dịch vụ Hỗ trợ tiền cọc (Deposit Advance Service):** Trong giai đoạn đầu, Mutux triển khai cơ chế hỗ trợ ứng trước tiền cọc cho một số khách hàng đáp ứng điều kiện xác minh danh tính (eKYC) và tiêu chí đánh giá nội bộ. Nền tảng thu **phí dịch vụ là 30.000 VNĐ** cho mỗi tháng người dùng sử dụng tiền cọc để nạp vào ví. Dịch vụ này sử dụng mô hình hợp tác với các đối tác tài chính (BNPL như MoMo, Fundiin) để giảm áp lực vốn lưu động và mở rộng khả năng phục vụ. Mutux không trực tiếp cung cấp dịch vụ tín dụng. Trong giai đoạn đầu, nền tảng chỉ đóng vai trò kết nối người dùng với đối tác BNPL hoặc các tổ chức tài chính. Mutux thu hoa hồng giới thiệu hoặc phí dịch vụ từ đối tác. Đối với rủi ro hỏng hóc/mất mát thiết bị, Mutux áp dụng cơ chế Giữ tiền Escrow + Định danh eKYC + Trừ trực tiếp tiền cọc/ví đối soát nếu xảy ra tranh chấp.

**Nguồn doanh thu mở rộng (từ Đối tác B2B - Triển khai sau 1 năm):**
*   **Phí quảng cáo và Đẩy tin (Featured Listings):** Nhằm tối ưu hóa khả năng bán hàng cho các shop gaming gear, Mutux thu phí để hiển thị ưu tiên sản phẩm của họ trên trang chủ hoặc khi người dùng tìm kiếm. 
*   **Hoa hồng bán chéo (Cross-selling):** Đóng vai trò như một kênh "Dùng thử trước khi mua", Mutux sẽ nhận hoa hồng môi giới khi người thuê quyết định "mua đứt" thiết bị sau quá trình trải nghiệm.

## 3. Các nhóm chi phí chính
Để vận hành và phát triển nền tảng, cơ cấu chi phí của Mutux được phân bổ cho 12 tháng đầu tiên như sau:

| Hạng mục chi phí | Mức dự kiến (VNĐ) | Phân bổ |
| :--- | ---: | :--- |
| **Marketing (CAC, Khuyến mãi)** | 120.000.000 | Ads mạng xã hội, voucher giải quyết Cold-start. |
| **Phát triển Sản phẩm (Tech/R&D)** | 30.000.000 | Phát triển tính năng Escrow, tích hợp eKYC, PayOS. |
| **Hạ tầng Công nghệ (Server, API)** | 100.000.000 | Phí Cloud Server, OTP, API đối soát, Domain name,... |
| **Vận hành & Nhân sự (Operations)** | 180.000.000 | Đội ngũ thiết kế, tạo sản phẩm, đội ngũ CSKH và giải quyết tranh chấp. |
| **Tư vấn Pháp lý** | 30.000.000 | Soạn thảo hợp đồng điện tử, quy định bảo mật. |
| **Quỹ Dự phòng** | 20.000.000 | Dự phòng rủi ro tài sản và thanh khoản. |
| **TỔNG CHI PHÍ DỰ KIẾN (NĂM 1)** | **480.000.000** | |

## 4. Dự kiến doanh thu và chi phí trong giai đoạn đầu (12 tháng đầu)
Các số liệu dự phóng tài chính trong năm đầu tiên được xây dựng dựa trên nguyên tắc thận trọng (Conservative approach).

**Cơ sở logic của các giả định tài chính:**
*   **Giá trị đơn thuê trung bình (AOV - Average Order Value):** Dựa trên khảo sát giá thuê thiết bị gaming phổ biến (30.000đ - 200.000đ/ngày), lấy trung bình là **50.000 VNĐ / 1 ngày** và hành vi thuê thường kéo dài 2-3 ngày dịp cuối tuần, AOV được ước tính ở mức an toàn là **150.000 VNĐ/đơn**.
*   **Lãi gộp cơ sở (Gross Margin):** Mức tiền cọc trung bình được giả định khoảng **2.000.000 VNĐ**, tương ứng với giá trị của các thiết bị gaming phổ biến (bàn phím cơ, chuột gaming, tai nghe, tay cầm...) trên nền tảng. 
    - Phí mở ví là **30.000 VNĐ / 1 tháng** và người thuê được sử dụng trong mức tiền cọc cho phép. Tỉ lệ phần trăm chia giữa Dịch vụ hỗ trợ tiền cọc (Deposit Advance Service) và Mutux là **50%** vậy nên lợi nhuận thu được là **15.000 VNĐ / 1 tháng / 1 user**. Tỉ lệ người sử dụng ví là **30%** người thuê thực tế, còn lại sẽ là người dùng tiền họ tự nạp.
    - Doanh thu từ đơn thuê sẽ chiếm **30%** trên giá trị đơn thuê. Giả sử với **AOV** = 150.000 VNĐ thì lợi nhuận mỗi đơn Mutux nhận được là **45.000 VNĐ**.


## Kịch bản startup khả thi trong năm đầu:
* Quý 1:
Mục tiêu bao gồm: hoàn thành MVP, triển khai website, có tổng 50 sản phẩm trên nền tảng, khoảng 10 đối tác. Marketing trong các khu vực trường học, tìm các đối tác từ các shop gear lớn nhỏ sẵn sàng sử dụng nền tảng.

Các chỉ số bao gồm:
    - Số người dùng đăng ký: 500
    - Số người thuê thực tế: 150
    - Số người mở ví: 50
    - Tổng đơn thuê: 150
    - Tổng giá trị giao dịch trên nền tảng: 45.000.000
    - Tổng doanh thu nhờ mở ví (GMW): 1.500.000
    - Tổng giao dịch quý (GMW): 46.000.000


* Quý 2:
Mục tiêu bao gồm: Tăng trưởng số lượng người dùng và đối tác, đẩy mạnh Marketing ra bên ngoài, bắt đầu sử dụng các kênh như facebook, tiktok

Các chỉ số bao gồm:
    - Số người dùng đăng ký mới: 1500
    - Tổng người dùng tích lũy : 2000
    - Số người thuê thực tế: 350
    - Số người mở ví: 100
    - Tổng đơn thuê: 600
    - Tổng giá trị giao dịch trên nền tảng: 90.000.000
    - Tổng doanh thu nhờ mở ví: 3.000.000
    - Tổng giao dịch quý (GMW): 93.000.000

* Quý 3:
Mục tiêu bao gồm: Tăng trưởng số lượng người dùng và đối tác, đẩy mạnh Marketing ra bên ngoài, bắt đầu hợp tác các gaming cafe, các shop gear, có thể mở rộng mời các đội tuyển game chuyên nghiệp sử dụng cũng như thực hiện marketing

Các chỉ số bao gồm:
    - Số người dùng đăng ký mới: 3000
    - Tổng người dùng tích lũy : 5000
    - Số người thuê thực tế: 900
    - Số người mở ví: 300
    - Tổng đơn thuê: 1800
    - Tổng giá trị giao dịch trên nền tảng: 270.000.000
    - Tổng doanh thu nhờ mở ví: 9.000.000
    - Tổng giao dịch quý (GMW): 279.000.000

* Quý 4:
Mục tiêu bao gồm: Tăng trưởng số lượng người dùng và đối tác, đẩy mạnh Marketing, mở rộng các kênh chính thống, bắt đầu dần triển khai thử các tính năng đẩy sản phẩm của các đối tác yêu cầu. Mở rộng social commerce, tiktok, các trường đại học và giới trẻ hơn nữa. Sử dụng các khẩu hiệu marketing, các hình thức quảng bá cho đại trà người sử dụng hơn nữa.

Các chỉ số bao gồm:
    - Số người dùng đăng ký mới: 5000
    - Tổng người dùng tích lũy : 10000
    - Số người thuê thực tế: 2000
    - Số người mở ví: 600
    - Tổng đơn thuê: 4500
    - Tổng giao dịch nhờ mở ví: 18.000.000
    - Tổng giá trị giao dịch trên nền tảng: 675.000.000
    - Tổng giao dịch quý (GMW): 693.000.000

* Tổng kết năm đầu:
    - Số người dùng: 10.000
    - Số người thuê thực tế: 2000
    - Số người dùng ví: 600
    - Tổng đơn thuê: 7050
    - Tổng doanh thu cả năm: 1.111.200.000

**Doanh thu theo từng quý và cả năm sau khi chia tiền với các bên**
| Giai đoạn | GMV | Doanh thu thuê | Doanh thu mở ví | Doanh thu tổng |
| :--- | ---: | ---: | ---: | ---: |
| **Quý 1** | 46.200.000 | 13.500.000 | 750.000 | **14.250.000** |
| **Quý 2** | 93.000.000 | 27.000.000 | 1.500.000 | **28.500.000** |
| **Quý 3** | 279.000.000 | 81.000.000 | 4.500.000 | **85.500.000** |
| **Quý 4** | 693.000.000 | 202.500.000 | 9.000.000 | **211.500.000** |
| **CẢ NĂM** | 1.111.200.000 | 324.000.000 | 15.750.000 | **339.750.000** |

**Cash Flow - dòng chảy tiền qua từng Quý**

| Quarter | Thu | Chi | Net Burn | Cash Flow | Cash Drain |
| ------- | --: | --: | --------:| --------: |  --------: |
| Q1      |  15 | 120 |   -105   |      -105 |       -105 |
| Q2      |  29 | 120 |   -91    |       -91 |       -196 |
| Q3      |  85 | 120 |   -35    |       -35 |       -231 |
| Q4      | 211 | 120 |   +91    |       +91 |       -140 |


Bắt đầu từ năm thứ 2, các doanh thu tăng theo số lượng người dùng, số lượng đơn hàng. Các nguồn thu mới như nhận quảng cáo trên nền tảng, đẩy các bài đăng gaming gear, phí hoa hồng mua luôn sản phẩm sau khi thuê. Dù vậy doanh thu chính vẫn đến từ số lượng đơn thuê.



**Tổng kết tài chính Năm 1:** 
Tổng chi phí vận hành trong năm đầu tiên của Mutux được ước tính khoảng 480 triệu đồng. Tuy nhiên, doanh nghiệp dự kiến tạo ra khoảng 340 triệu đồng doanh thu trong cùng giai đoạn. Do đó, khoản thiếu hụt dòng tiền tích lũy (Funding Gap) vào khoảng 156 triệu đồng.

Để đảm bảo doanh nghiệp có đủ dòng tiền duy trì hoạt động liên tục, xử lý các rủi ro phát sinh và không bị gián đoạn trong giai đoạn đầu, Mutux dự kiến chuẩn bị nguồn vốn khoảng **250–300 triệu đồng**. Nguồn vốn này có thể đến từ vốn tự có của nhóm sáng lập, các chương trình hỗ trợ khởi nghiệp hoặc vòng gọi vốn Pre-seed. Chi tiết các thông số:
    - Burn rate: Ta có *Gross Bur*n hay chi phí mỗi tháng là 480/12 = 40 triệu, *Net Burn* sau khi đã bù doanh thu theo từng quý đã được tính theo bảng trên.
    - Vậy nên nhu cầu tìm kiếm nhà đầu tư để tăng hoặc có vốn làm runway trong ít nhất 2 năm tương đương **~300 triệu**. Với 2 năm đầu làm nền tảng thì Mutux có thể chạm đến điểm hòa vốn và bắt đầu lời. Từ đó bứt phá và chiếm lĩnh thị trường cho thuê gaming gear và phát triển thêm.

**Điểm hòa vốn (Break-even):** 
Đặt mục tiêu đạt được vào khoảng **năm thứ 2 (tháng 13 - 15)** theo tốc độ tăng trưởng hiện tại. Mục tiêu năm 2 sẽ đạt được ít nhất 50,000 sử dụng và 10,000 giao dịch trên sàn. Lộ trình này hoàn toàn phù hợp với vòng đời của một Startup Marketplace. Khi lượng người dùng thường xuyên đi vào ổn định ở năm thứ 2, chi phí thu hút khách hàng (CAC) sẽ giảm dần. Khi đó, mức doanh thu kỳ vọng sẽ đủ để bù đắp chi phí vận hành hàng tháng theo kịch bản tài chính của dự án (ước tính dao động khoảng 80 - 100 triệu VNĐ/tháng).

## 5. Nhu cầu gọi vốn
Dựa trên bài toán dự phóng dòng tiền và khoản lỗ dự kiến, mức thiếu hụt dòng tiền lớn nhất của Mutux trong 12 tháng đầu là ~205 triệu VNĐ (xuất hiện ở Quý 3 trước khi đạt gỡ vốn vào kết thúc Quý 4, hoàn vốn vào năm 2). Mutux có nhu cầu gọi vốn **12.000 USD** (tương đương khoảng hơn **300 triệu VNĐ**) cho vòng gọi vốn Tiền hạt giống (Pre-Seed).

Khoản đầu tư được sử dụng để rút ngắn thời gian mở rộng thị trường, phát triển sản phẩm và gia tăng tốc độ thu hút người dùng trong giai đoạn đầu. Mục tiêu của vòng gọi vốn đầu tiên không chỉ giúp doanh nghiệp duy trì hoạt động mà còn tạo điều kiện để đạt điểm hòa vốn sớm hơn thông qua việc mở rộng quy mô giao dịch. Khoản vốn đóng vai trò là (runway) an toàn cho ít nhất 18 tháng, cũng như dự phòng nguồn lực mở rộng sản phẩm và ứng phó rủi ro.

## 6. Mục đích sử dụng vốn

- Vượt qua rào cản Cold-start: Bù đắp chi phí thu hút người dùng (CAC) ban đầu, kích cầu giao dịch thông qua các chương trình trợ giá/voucher. Tận dụng tối đa người dùng sinh viên thông qua các hoạt động trong các trường đại học, các CLB

- Hoàn thiện hạ tầng công nghệ lõi: Tích hợp sâu cổng thanh toán tự động Escrow, eKYC xác thực danh tính và kết nối API mượt mà với đối tác tài chính BNPL (MoMo/Fundiin).

- Duy trì bộ máy vận hành nhẹ (Lean Operations): Đảm bảo chi phí nhân sự core, chăm sóc khách hàng và giải quyết tranh chấp trong suốt 12 tháng đầu.

## 7. Kế hoạch sử dụng vốn theo từng hạng mục
Nguồn vốn 12.000 USD ~300 triệu sẽ được phân bổ và giải ngân tuân thủ chặt chẽ theo tỷ lệ sau:
*   **90 triệu (30%)**:  *Marketing & Thu hút khách hàng (CAC):* Thực hiện các chiến dịch Digital Marketing, phát hành mã khuyến mãi trợ giá cho giao dịch đầu tiên (chấp nhận bù lỗ đơn đầu để tối ưu người dùng), thực hiện các chiến dịch marketing trong các trường đại học, các CLB.
*   **80 triệu (26.6%)**: *Phát triển Sản phẩm & Hạ tầng (Tech & Infrastructure)* - Tối ưu hóa hạ tầng điện toán đám mây, tích hợp các đối tác thanh toán và định danh điện tử, đồng thời phát triển thêm tính năng quản lý tồn kho cho B2B.
*   **90 triệu (30%)**: *Vận hành & Nhân sự (Operations):* Trang trải chi phí văn phòng, phụ cấp/lương cơ bản cho Team sáng lập & phát triển nền tảng.Duy trì bộ phận CSKH, tiếp nhận thiết bị và xử lý tranh chấp khi phát sinh sự cố.
*   **20 triệu (6.7%)**: Tư vấn pháp lý bản quyền, điều khoản dịch vụ, hợp đồng điện tử,...
*   **20 triệu (6.7%)**: Quỹ dự phòng rủi ro nợ xấu/hỏng hóc thiết bị và rủi ro thanh khoản.
