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
- `sections/06-ke-hoach-kinh-doanh.tex`: Kế hoạch kinh doanh, cold-start, vận hành và rủi ro.
- `sections/06-tiep-can-thi-truong.tex`: Cách tiếp cận thị trường.
- `sections/07-marketing.tex`: Kế hoạch marketing B2B2C supply-first.
- `sections/08-mo-hinh-kiem-tien.tex`: Mô hình kiếm tiền.
- `sections/09-goi-von-va-su-dung-von.tex`: Nhu cầu gọi vốn và sử dụng vốn.
- `sections/10-doi-ngu.tex`: Năng lực đội ngũ.
- `sections/11-prototype-va-minh-chung.tex`: Prototype, demo và minh chứng triển khai.

Khi chỉnh nội dung, nên sửa file trong `sections/` thay vì đặt thêm slide trực tiếp vào `main.tex`.

## Nội dung

Deck gồm các phần:

- Vấn đề và cơ hội khởi nghiệp.
- Sản phẩm, khách hàng và điểm khác biệt.
- Chiến lược tiếp cận thị trường và kế hoạch marketing.
- Mô hình doanh thu và nhu cầu gọi vốn (số liệu đồng bộ với `docs/PA6`).
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

- LuaLaTeX và các package Beamer, TikZ, pgfplots, BibLaTeX.
- Cookie theme, cụ thể là `beamerthemecookie.sty`.
- Font Fira Sans và Fira Mono (package `fira` trong TeX distribution). Theme mặc
  định dùng Noto Sans, nhưng font này thường không có sẵn trong MiKTeX nên deck
  sẽ rơi về TeX Gyre Heros. Khi build bằng LuaLaTeX/XeLaTeX, `main.tex` chủ động
  dùng Fira Sans Medium cho phần thân bài và Fira Sans SemiBold cho chữ đậm,
  giúp nét chữ rõ hơn mà vẫn đủ gọn cho các tiêu đề dài. Nếu máy không
  có Fira, deck vẫn build được và tự quay về font dự phòng của theme.
- Deck build được bằng cả `lualatex` và `pdflatex`. Khối đặt font trong
  `main.tex` chỉ chạy khi có `fontspec` (LuaLaTeX/XeLaTeX); với `pdflatex` thì
  theme tự dùng package `FiraSans`. Khi thêm lệnh font mới vào `main.tex`, phải
  giữ nguyên bọc `\\ifdefined\\setmainfont`, nếu không `pdflatex` sẽ lỗi
  `Undefined control sequence` ngay ở preamble.
- Không cần Perl nếu build bằng hai lệnh `lualatex` ở trên.

Các ảnh prototype được tham chiếu từ `../PA2/img/mvp/` để tái sử dụng tài nguyên hiện có của repository.
