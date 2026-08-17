# Cập nhật phân cấp tài khoản - 17/08/2026

Trang quản trị tài khoản đã được tách thành 3 mục:

1. **Tài khoản các khoa/phòng**: chỉ hiển thị tài khoản không có quyền admin.
2. **Tài khoản quản trị**: chỉ hiển thị tài khoản có `role = admin`.
3. **Nhật ký tra cứu liều thận**: giữ nguyên chức năng hiện tại.

Các thao tác Duyệt / Từ chối / Thu hồi / Xóa tài khoản vẫn giữ nguyên. Cơ chế xóa vĩnh viễn và chặn phiên cũ sử dụng hàm `admin_delete_user` từ bản cập nhật trước, vì vậy không cần chạy thêm SQL nếu SQL cấp quyền xóa đã được cài đặt.
