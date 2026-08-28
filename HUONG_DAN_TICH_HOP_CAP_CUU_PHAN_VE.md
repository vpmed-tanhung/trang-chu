# Tích hợp module Cấp cứu phản vệ

Bản dự án trong gói ZIP đã được tích hợp sẵn. Nếu cần chép thủ công vào một bản khác, thực hiện đúng các vị trí sau:

1. Chép `cap-cuu-phan-ve.html` vào thư mục gốc, cùng cấp với `index.html`.
2. Chép `assets/navy-theme.css` vào thư mục `assets/`.
3. Trong `<head>` của `index.html`, nạp `assets/navy-theme.css` **sau** `assets/platform-shell.css`. File này chỉ giữ bố cục thẻ 2 cột và hiệu ứng nhấp nháy; bảng màu sáng gốc không bị thay đổi.
4. Trong `index.html`:
   - Liên kết menu có class `nav-emergency` mở `cap-cuu-phan-ve.html`.
   - Card trang chủ có class `feature-card emergency-feature` mở cùng module.
5. Trong `sw.js`, thêm `assets/navy-theme.css` và `cap-cuu-phan-ve.html` vào `APP_SHELL` để hai tài nguyên sẵn sàng cho cơ chế cache của hệ thống.

Các vị trí chỉnh sửa trong `index.html` đã có chú thích `Module mới`; toàn bộ module/dữ liệu cũ được giữ nguyên.
