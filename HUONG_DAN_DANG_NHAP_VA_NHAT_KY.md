# Hệ thống tài khoản khoa/phòng VPMED

Phiên bản này có một hệ thống tài khoản **mới và độc lập** tại `tai-khoan.html`. Hai công cụ Nhi khoa và thuốc tiêm chạy trực tiếp trong `index.html`; không còn phụ thuộc trang công cụ dược lâm sàng cũ hoặc giao diện quản trị của trang đó.

## Quy trình hoạt động

1. Đại diện khoa/phòng đăng ký tại `https://hotrolamsang.io.vn/tai-khoan.html`.
2. Người đăng ký chỉ nhập tên khoa/phòng/đơn vị, email dùng chung của đơn vị và mật khẩu; không nhập họ tên hoặc chức danh cá nhân.
3. Chỉ email kết thúc chính xác bằng `@vpmed.vn` được chấp nhận.
4. Sau khi xác nhận email, tài khoản vẫn ở trạng thái **chờ duyệt** và chưa thể vào trang chủ.
5. Admin đăng nhập, mở menu tên người dùng ở góc phải → **Quản trị tài khoản** → chọn **Duyệt** hoặc **Từ chối**.
6. Chỉ tài khoản có trạng thái `approved` mới được truy cập `index.html`.

## 1. Cài đặt Supabase mới

Trong Supabase, mở **SQL Editor → New query**, dán toàn bộ nội dung `supabase/renal_lookup_audit.sql` rồi bấm **Run**. File này tạo:

- Hồ sơ tài khoản khoa/phòng và giới hạn email `@vpmed.vn` ở phía cơ sở dữ liệu.
- Trạng thái `pending`, `approved`, `rejected`.
- Quyền admin duyệt hoặc thu hồi tài khoản.
- Nhật ký khoa/phòng thực hiện tra cứu liều thận.
- RLS để tài khoản chưa được duyệt không thể tự cấp quyền hoặc đọc danh sách tài khoản.

Nếu dự án đã chạy bản SQL cũ có cột `doctor_name` / `doctor_email`, chạy thêm một lần `supabase/chuyen_danh_tinh_nhan_vien.sql`. Nếu đã dùng bản cài mới thì bỏ qua bước này.

Nếu dự án đang hoạt động như hiện tại, chạy thêm một lần `supabase/chuyen_tai_khoan_theo_khoa_phong.sql` **trước khi tải mã website mới**. File này giữ nguyên admin, tài khoản và lịch sử đang có; chỉ bổ sung loại tài khoản khoa/phòng và cách ghi nhận đơn vị.

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

## 4. Duyệt tài khoản khoa/phòng

Trong trang quản trị:

- **Duyệt**: cho phép tài khoản truy cập trang chủ.
- **Từ chối**: chặn tài khoản đăng nhập vào hệ thống.
- **Thu hồi**: đưa tài khoản đã duyệt về trạng thái chờ duyệt.
- Tab **Nhật ký tra cứu liều thận**: xem khoa/phòng nào đã thực hiện tra cứu, thời gian, thuốc và kết quả CrCl/eGFR.

Admin không nên duyệt nếu chưa đối chiếu email và khoa/phòng đăng ký. Mỗi khoa/phòng chỉ có một tài khoản dùng chung.

## 5. Dữ liệu nhật ký

Nhật ký Supabase hiển thị **khoa/phòng sử dụng**, mã người bệnh trên HIS, thời gian, thuốc, CrCl/eGFR và gợi ý liều. Không hiển thị tên cá nhân trong báo cáo dùng chung. Không nhập hoặc lưu họ tên người bệnh, ngày sinh, cân nặng, chiều cao hay creatinine thô trong lịch sử dùng chung.

Để bật lịch sử dùng chung trên dự án đã cài đặt trước đó, chạy thêm một lần file:

`supabase/lich_su_tra_cuu_dung_chung.sql`

Nếu giao diện báo **“Kết quả đã tính nhưng chưa lưu được vào lịch sử chung”**, chạy file sửa chữa tổng hợp:

`supabase/sua_loi_ghi_nhat_ky.sql`

File này không xóa tài khoản hoặc lịch sử. Nó bổ sung các cột còn thiếu, gỡ ràng buộc `NOT NULL` của cột định danh đời cũ, cài lại trigger tự điền khoa/phòng và khôi phục policy `INSERT` cho tài khoản đã duyệt.

Sau khi chạy:

- Mọi tài khoản có trạng thái `approved` cùng xem được tối đa 500 lượt tra cứu gần nhất trên trang tính liều suy thận.
- Danh sách tự làm mới mỗi 30 giây và có nút **Làm mới**.
- Người dùng thường chỉ được xem và thêm lượt tra cứu của chính thao tác tính liều; không có quyền xóa.
- Admin có thêm nút **Xuất CSV**, **Xóa** từng dòng và **Xóa toàn bộ**.
- Khi xóa toàn bộ, admin phải nhập đúng cụm `XOA LICH SU` để xác nhận.

Nếu tài khoản đã có `role = admin`, `status = approved` nhưng thao tác xóa vẫn báo lỗi, chạy một lần `supabase/sua_quyen_xoa_admin.sql`, sau đó tải phiên bản website mới và nhấn `Ctrl + F5`. File này cấp quyền `DELETE` ở cấp bảng nhưng RLS chỉ cho hồ sơ admin đã duyệt thực sự xóa; người dùng thường vẫn bị Supabase chặn.

Supabase là nguồn lịch sử chung duy nhất. File Apps Script cũ không cần triển khai và không được nạp trong `index.html`, tránh hai nguồn dữ liệu bị trùng hoặc lệch.

## 6. Các file mới cần tải đủ lên GitHub

- `tai-khoan.html`
- `assets/vpmed-auth.css`
- `assets/vpmed-auth-page.js`
- `assets/vpmed-access.css`
- `assets/vpmed-access.js`
- `assets/vpmed-renal-audit.js`
- `supabase/lich_su_tra_cuu_dung_chung.sql`
- `supabase/sua_quyen_xoa_admin.sql` (chỉ dùng khi cần sửa quyền xóa)
- `supabase/chuyen_tai_khoan_theo_khoa_phong.sql` (bắt buộc với dự án hiện tại)
- `index.html` đã cập nhật

Phải tải đúng cả cấu trúc thư mục. Nếu chỉ thay `index.html` mà thiếu các file trong `assets/`, giao diện tài khoản sẽ không hoạt động đúng.
