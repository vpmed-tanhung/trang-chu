# Phát hành v5.1 và chặn cập nhật tự động

Ngày cập nhật: 21/08/2026

- Phát hành v5.1 (build `2026.08.21.34`), nhưng giữ footer ở v5.0 trong trạng thái chờ.
- Khi phát hiện bản mới, ứng dụng chỉ hiện thông báo và nút “Cập nhật”.
- Không đổi số phiên bản ở footer, không tải lại trang và không đánh dấu đã cập nhật trước khi người dùng bấm nút.
- Chỉ sau khi bấm “Cập nhật” và trang xác nhận đúng build, footer mới đổi sang v5.1 và ghi nhớ trạng thái trên thiết bị.
- Dùng khóa lưu trữ mới để không bị dữ liệu “đã xem” sai từ cơ chế cũ làm tự nhảy phiên bản.
- Thêm kiểm thử mô phỏng trình duyệt để khóa hành vi cập nhật thủ công này.
