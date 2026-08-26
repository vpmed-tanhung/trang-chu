# Quyền admin xóa tài khoản

Đã bổ sung nút **Xóa tài khoản** trong `tai-khoan.html#admin`. Admin có thể xóa tài khoản ở mọi trạng thái, kể cả tài khoản đã duyệt và tài khoản admin.

## Triển khai

1. Mở **Supabase → SQL Editor**.
2. Chạy toàn bộ `supabase/them_quyen_admin_xoa_tai_khoan.sql` đúng **một lần**.
3. Deploy lại toàn bộ source web trong gói này.
4. Đăng nhập admin → **Quản trị tài khoản** → **Xóa tài khoản**.

Sau khi xóa, tài khoản bị xóa khỏi Supabase Auth và `profiles`; email đó chỉ dùng lại được bằng cách đăng ký lại từ đầu và chờ duyệt lại. Nhật ký cũ vẫn được giữ, với `user_id = NULL`. Web kiểm tra lại quyền mỗi 10 giây và khi quay lại tab; profile đã bị xóa sẽ bị đăng xuất local và đưa về trang đăng nhập. Policy `clinical_content` cũng yêu cầu profile còn tồn tại và đang `approved`.
