# Lunch Ledger

"Hãy xây dựng bộ khung ứng dụng Web Quản lý nợ bữa ăn 'LunchDebt' bằng Next.js/React, Tailwind CSS, Lucide Icons và shadcn/ui.

Yêu cầu Responsive hoàn hảo giữa Desktop và iPhone:

Cấu hình Mobile-first trên iPhone:

Thẻ viewport: width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover.

Hỗ trợ vùng tai thỏ & thanh Home iOS: pt-[env(safe-area-inset-top)] và pb-[env(safe-area-inset-bottom)].

Toàn bộ font-size của <input> và <select> tối thiểu 16px (text-base) để chống tự động zoom trên iOS Safari.

Hệ thống Menu đa nền tảng:

Trên Desktop (màn hình >= 768px):

Sử dụng Sidebar cố định bên trái (Left Sidebar) gồm: Logo ứng dụng, các menu items: Trang chủ (/), Tạo bữa ăn (/admin/meals/new), Sổ công nợ (/admin/debt), Bảng kê theo ngày (/admin/daily), Quản lý thành viên (/admin/members).

Trên iPhone / Mobile (màn hình < 768px):

Top Header: Hiển thị tiêu đề trang và nút Hamburger [☰] mở Side Drawer (Sheet) chứa thông tin phụ.

Bottom Navigation Bar: Thanh điều hướng cố định sát đáy màn hình chuẩn phong cách iOS gồm 4 nút bấm lớn (chiều cao tối thiểu 48px, dễ chạm ngón tay cái):

[🏠 Trang chủ]

[➕ Tạo bữa] (Nút nổi bật ở giữa)

[💳 Sổ nợ]

[📅 Lịch sử]

Hãy viết code cho Layout Responsive này kèm theme màu sắc hiện đại, tinh tế (Modern Clean UI)."

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3aec29ae-8ef6-4626-b0fe-cbd49cc8c531).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
