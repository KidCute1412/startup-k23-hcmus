# Mutux Pitch Deck

Deck pitching Beamer cho dự án Mutux, sử dụng Cookie theme và LuaLaTeX.
Nội dung được rút gọn còn khoảng 40--70 từ mỗi slide, phù hợp thuyết trình ngắn.

## Cấu trúc file

- `main.tex`: Preamble, cấu hình theme và các lệnh `\input`.
- `sections/01-van-de.tex`: Vấn đề nhóm đang giải quyết.
- `sections/02-co-hoi-khoi-nghiep.tex`: Vì sao vấn đề đáng để khởi nghiệp.
- `sections/03-san-pham-dich-vu.tex`: Sản phẩm và dịch vụ.
- `sections/04-khach-hang-muc-tieu.tex`: Khách hàng mục tiêu.
- `sections/05-diem-khac-biet.tex`: Điểm khác biệt.
- `sections/06-tiep-can-thi-truong.tex`: Cách tiếp cận thị trường.
- `sections/07-mo-hinh-kiem-tien.tex`: Mô hình kiếm tiền.
- `sections/08-goi-von-va-su-dung-von.tex`: Nhu cầu gọi vốn và sử dụng vốn.
- `sections/09-doi-ngu.tex`: Năng lực đội ngũ.
- `sections/10-prototype-va-minh-chung.tex`: Prototype, demo và minh chứng triển khai.

Khi chỉnh nội dung, nên sửa file trong `sections/` thay vì đặt thêm slide trực tiếp vào `main.tex`.

## Nội dung

Deck gồm các phần:

- Vấn đề và cơ hội khởi nghiệp.
- Sản phẩm, khách hàng và điểm khác biệt.
- Chiến lược tiếp cận thị trường.
- Mô hình doanh thu và nhu cầu gọi vốn.
- Đội ngũ, prototype và kế hoạch triển khai.

## Build Không Cần Perl

Cookie Beamer theme phải được cài trong TeX distribution hoặc đặt trên `TEXINPUTS`.
Từ PowerShell, chạy:

```powershell
cd docs\slide
lualatex -interaction=nonstopmode main.tex
lualatex -interaction=nonstopmode main.tex
```

Deck hiện không sử dụng citation hoặc `\printbibliography`, nên không cần chạy `biber`.
File kết quả là `docs/slide/main.pdf`.

## Phụ Thuộc

- LuaLaTeX và các package Beamer, TikZ, BibLaTeX.
- Cookie theme, cụ thể là `beamerthemecookie.sty`.
- Không cần Perl nếu build bằng hai lệnh `lualatex` ở trên.

Các ảnh prototype được tham chiếu từ `../PA2/img/mvp/` để tái sử dụng tài nguyên hiện có của repository.
