# Đăng nhập nhân viên bệnh viện và nhật ký tra cứu liều thận

Phiên bản này chỉ cho phép đăng ký bằng email bệnh viện thuộc miền **`@vpmed.vn`**. Khi đăng ký, người dùng bắt buộc nhập:

- Họ và tên.
- Chức danh/vị trí công tác.
- Khoa/phòng/bộ phận công tác.
- Email và mật khẩu.

Tài khoản mới vẫn ở trạng thái **chờ duyệt**. Quản trị viên duyệt tài khoản trong mục **Quản trị hệ thống**.

## 1. Tạo bảng nhật ký trên Supabase

1. Đăng nhập Supabase và mở dự án `vpmed-clinpharm` (`jaswtdcgrfbygmdxvumu`).
2. Mở **SQL Editor** → **New query**.
3. Sao chép toàn bộ nội dung file `supabase/renal_lookup_audit.sql`, dán vào SQL Editor và bấm **Run**.
4. Kết quả phải báo chạy thành công, không có lỗi màu đỏ.

File cài đặt tạo bảng `profiles`, trigger tự sinh hồ sơ khi nhân viên đăng ký, quyền duyệt tài khoản và bảng nhật ký. Đây là file cài đặt một lần dành cho dự án Supabase mới.

Nếu đã chạy file cài đặt trước khi bổ sung trường chức danh, chạy thêm một lần file `supabase/bo_sung_chuc_danh.sql`.

## 2. Cấu hình email đăng ký

Trong Supabase, mở **Authentication → Providers → Email**:

- Bật đăng ký bằng email.
- Nên bật xác nhận email trước khi đăng nhập.
- Trong **URL Configuration**, thêm địa chỉ website GitHub Pages vào danh sách Redirect URLs để chức năng quên mật khẩu hoạt động.

Mã nguồn kiểm tra chính xác đuôi `@vpmed.vn` ở cả giao diện và cơ sở dữ liệu. Ví dụ hợp lệ: `ten@vpmed.vn`. Các miền gần giống như `@example-vpmed.vn` hoặc `@vpmed.vn.example.com` đều bị từ chối.

## 3. Chọn tài khoản quản trị đầu tiên

Sau khi đăng ký một tài khoản, chạy câu lệnh sau trong SQL Editor và thay email mẫu bằng email thật:

```sql
update public.profiles
set status = 'approved', role = 'admin', approved_at = now()
where email = 'email-quan-tri@vpmed.vn';
```

Đăng xuất rồi đăng nhập lại. Menu sẽ có thêm:

- **Quản trị hệ thống**: duyệt/từ chối tài khoản.
- **Nhật ký tra cứu liều**: xem người tra cứu, chức danh, khoa/phòng/bộ phận, email, thời gian, thuốc/module, CrCl/eGFR và kết quả liên quan.

## 4. Phạm vi dữ liệu được lưu

Nhật ký ghi nhận ba loại thao tác:

- Đánh giá chức năng thận CrCl/eGFR.
- Hiệu chỉnh liều kháng sinh theo CrCl.
- Tính liều Colistin ở các chế độ chức năng thận/lọc máu.

Hệ thống **không lưu** họ tên bệnh nhân, mã bệnh án, ngày sinh, cân nặng, chiều cao hoặc creatinine thô. Danh tính người tra cứu được chụp từ hồ sơ đã duyệt ở phía Supabase, nên trình duyệt không thể tự nhận là người khác.

## 5. Đưa website lên GitHub Pages

Sau khi chạy SQL thành công, tải toàn bộ cấu trúc thư mục này lên nhánh đang dùng cho GitHub Pages. Không đổi đường dẫn các file trong `assets/cong-cu-modules/`.

Nếu bảng nhật ký chưa được tạo hoặc policy Supabase bị lỗi, công cụ vẫn hiển thị kết quả tính toán nhưng sẽ hiện cảnh báo đỏ rằng lượt tra cứu chưa được ghi nhận.
