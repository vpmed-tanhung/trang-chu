# Hệ thống tài khoản nhân viên VPMED

Phiên bản này có một hệ thống tài khoản **mới và độc lập** tại `tai-khoan.html`. Trang tài khoản không chuyển người dùng đến `cong-cu-duoc-lam-sang.html` và không dùng giao diện quản trị của trang đó.

## Quy trình hoạt động

1. Nhân viên đăng ký tại `https://hotrolamsang.io.vn/tai-khoan.html`.
2. Người đăng ký phải nhập họ tên, chức danh/vị trí công tác, khoa/phòng/đơn vị, email và mật khẩu.
3. Chỉ email kết thúc chính xác bằng `@vpmed.vn` được chấp nhận.
4. Sau khi xác nhận email, tài khoản vẫn ở trạng thái **chờ duyệt** và chưa thể vào trang chủ.
5. Admin đăng nhập, mở menu tên người dùng ở góc phải → **Quản trị tài khoản** → chọn **Duyệt** hoặc **Từ chối**.
6. Chỉ tài khoản có trạng thái `approved` mới được truy cập `index.html`.

## 1. Cài đặt Supabase mới

Trong Supabase, mở **SQL Editor → New query**, dán toàn bộ nội dung `supabase/renal_lookup_audit.sql` rồi bấm **Run**. File này tạo:

- Hồ sơ nhân viên và giới hạn email `@vpmed.vn` ở phía cơ sở dữ liệu.
- Trạng thái `pending`, `approved`, `rejected`.
- Quyền admin duyệt hoặc thu hồi tài khoản.
- Nhật ký người thực hiện tra cứu liều thận.
- RLS để người chưa được duyệt không thể tự cấp quyền hoặc đọc danh sách nhân viên.

Nếu dự án đã chạy bản SQL cũ có cột `doctor_name` / `doctor_email`, chạy thêm một lần `supabase/chuyen_danh_tinh_nhan_vien.sql`. Nếu đã dùng bản cài mới thì bỏ qua bước này.

## 2. Cấu hình email và địa chỉ chuyển hướng

Trong **Authentication → Sign In / Providers → Email**:

- Bật đăng ký bằng email.
- Bật xác nhận email.

Trong **Authentication → URL Configuration**:

- Site URL: `https://hotrolamsang.io.vn`
- Redirect URL: `https://hotrolamsang.io.vn/**`

## 3. Tạo admin đầu tiên

Đăng ký tài khoản của bạn trước, sau đó chạy câu lệnh dưới đây và thay đúng email admin:

```sql
update public.profiles
set status = 'approved',
    role = 'admin',
    approved_at = now(),
    updated_at = now()
where email = 'email-quan-tri@vpmed.vn';
```

Đăng xuất và đăng nhập lại. Ở góc phải trang chủ sẽ có tên admin. Bấm vào tên → **Quản trị tài khoản**.

## 4. Duyệt nhân viên

Trong trang quản trị:

- **Duyệt**: cho phép tài khoản truy cập trang chủ.
- **Từ chối**: chặn tài khoản đăng nhập vào hệ thống.
- **Thu hồi**: đưa tài khoản đã duyệt về trạng thái chờ duyệt.
- Tab **Nhật ký tra cứu liều thận**: xem nhân viên nào đã thực hiện tra cứu, thời gian, chức danh, đơn vị, thuốc và kết quả CrCl/eGFR.

Admin không nên duyệt tài khoản nếu chưa đối chiếu người đăng ký là nhân viên bệnh viện.

## 5. Dữ liệu nhật ký

Nhật ký Supabase chỉ ghi danh tính **nhân viên thực hiện tra cứu** từ hồ sơ đã được duyệt. Nhật ký không gửi họ tên bệnh nhân, mã bệnh nhân, ngày sinh, cân nặng, chiều cao hoặc creatinine thô.

Lịch sử có mã bệnh nhân hiển thị trong công cụ chỉ nằm trên thiết bị đang sử dụng và có thể xóa tại chỗ.

## 6. Các file mới cần tải đủ lên GitHub

- `tai-khoan.html`
- `assets/vpmed-auth.css`
- `assets/vpmed-auth-page.js`
- `assets/vpmed-access.css`
- `assets/vpmed-access.js`
- `assets/vpmed-renal-audit.js`
- `index.html` đã cập nhật

Phải tải đúng cả cấu trúc thư mục. Nếu chỉ thay `index.html` mà thiếu các file trong `assets/`, giao diện tài khoản sẽ không hoạt động đúng.
