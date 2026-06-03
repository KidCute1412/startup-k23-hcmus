# Báo Cáo Đồ Án Khởi Nghiệp (K23 HCMUS)

Dự án này là khung sườn báo cáo LaTeX được cấu trúc theo dạng modular (mô-đun) cho 6 tuần thực hiện đồ án (từ tuần `PA0` đến `PA5`).

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
startup-k23-hcmus/
├── PA0/ - PA5/             # Thư mục báo cáo từng tuần
│   ├── sections/          # Các chương/mục con
│   │   ├── section1.tex   # Giới thiệu
│   │   └── section2.tex   # Cạnh tranh
│   ├── main.tex           # File cấu hình chính, import các section
│   └── references.bib     # Danh mục tài liệu tham khảo từng tuần
├── shared/
│   └── templates/
│       └── report_template.tex # File template mẫu dùng chung
└── .vscode/
    └── settings.json      # Cấu hình auto-compile & dọn dẹp file phụ trợ
```

---

## 🛠️ Cài Đặt và Cấu Hình Môi Trường (Local Setup)

Để biên dịch và chỉnh sửa báo cáo LaTeX mượt mà ngay trên máy tính của bạn, hãy thực hiện các bước sau:

### Bước 1: Cài đặt Bộ Trình dịch MiKTeX
1. Tải bộ cài đặt MiKTeX tương ứng với hệ điều hành của bạn từ trang chủ: [miktex.org/download](https://miktex.org/download).
2. Chạy file cài đặt, chọn các tùy chọn mặc định (Nên chọn **"Install missing packages on-the-fly: Ask me first"** hoặc **"Yes"** để MiKTeX tự động cài đặt các thư viện mới khi cần thiết).

### Bước 2: Cài đặt và cấu hình VS Code
1. Cài đặt extension **LaTeX Workshop** từ VS Code Marketplace.
2. Dự án đã được tích hợp sẵn file cấu hình biên dịch tự động trong thư mục `.vscode/settings.json`. File này giúp:
   - Biên dịch tự động mỗi khi bạn lưu file (`Ctrl + S`).
   - Tự động dọn dẹp các file phụ trợ sinh ra trong quá trình biên dịch (như `.aux`, `.log`, `.out`, `.toc`,...) để giữ thư mục làm việc luôn sạch sẽ.

---

## ✍️ Hướng Dẫn Cách Làm Việc (Workflow)

### 1. Cách viết nội dung báo cáo
* Không viết trực tiếp nội dung dài vào file `main.tex`. 
* Hãy viết vào các file con trong thư mục `sections/` tương ứng (ví dụ: `PA0/sections/section1.tex`).
* Khi lưu (`Ctrl + S`) ở file con, hệ thống sẽ tự nhận biết và biên dịch file `main.tex` cha để xuất ra file PDF nhờ vào dòng lệnh **Magic Comment** ở đầu file con:
  ```latex
  % !TeX root = ../main.tex
  ```

### 2. Cách xem file PDF trực quan trên VS Code
* Nhấn tổ hợp phím **`Ctrl + Alt + V`** (hoặc click vào biểu tượng kính lúp góc trên bên phải VS Code) để mở trình xem PDF ngay cạnh cửa sổ code. 
* Trình xem này sẽ tự động làm mới (reload) mỗi khi bạn lưu bài viết mới.

### 3. Trích dẫn tài liệu tham khảo (Bibliography)
* Khai báo danh sách tài liệu tham khảo vào file `references.bib` của tuần đó theo cấu trúc chuẩn BibTeX.
* Trích dẫn tài liệu trong bài viết bằng lệnh: `\cite{tên_khóa}` (Ví dụ: `\cite{einstein1905}`).
* Để hiển thị danh mục tài liệu tham khảo mà không cần dùng lệnh `\cite`, thêm lệnh `\nocite{*}` vào trước dòng `\bibliographystyle`.

---

## ⚠️ Một Số Lưu Ý Quan Trọng
1. **Tiếng Việt**: Dự án đã tích hợp gói hỗ trợ tiếng Việt (`babel` với tùy chọn `vietnamese` và font `T5`). Hãy viết nội dung bằng mã UTF-8 thông thường.
2. **Bookmark PDF**: Dự án sử dụng gói `bookmark` thay thế cho `hyperref` để quản lý các đề mục PDF mượt mà và không sinh cảnh báo cập nhật file `.out`.