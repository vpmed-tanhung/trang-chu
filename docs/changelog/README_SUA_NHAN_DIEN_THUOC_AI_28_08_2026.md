# Sửa an toàn nhận diện thuốc AI — 28/08/2026

Phiên bản: **5.5.3** — build **2026.08.28.52**.

## Lỗi đã sửa

Luồng cũ gửi ảnh cho AI và nhận toàn bộ kết quả phân tích trong một lượt. Khi AI đọc được tên biệt dược
nhưng tự suy diễn sai hoạt chất, giao diện vẫn hiển thị nguyên kết luận liều do không có bước kiểm tra chéo.

## Cơ chế mới

1. Lượt AI thứ nhất chỉ chép nguyên văn tên thuốc và dòng y lệnh; không được phân tích hay đoán hoạt chất.
2. Mã chương trình đối chiếu tên vừa đọc với `assets/inpatient_medicines_20260707.js`, là danh mục thuốc
   nội trú đã có sẵn trong ứng dụng.
3. Chỉ khớp chính xác và duy nhất mới được khóa `catalogId`, hoạt chất, hàm lượng và đường dùng.
4. Lượt AI thứ hai chỉ phân tích dựa trên danh sách định danh đã khóa.
5. Apps Script kiểm tra lại `catalogId` và hoạt chất trước khi trả kết quả.
6. Trình duyệt kiểm tra lại lần cuối. Nếu không khớp/không tìm thấy/mơ hồ, hệ thống khóa đánh giá liều,
   tốc độ truyền, hiệu chỉnh thận và tương tác; yêu cầu dược sĩ xác minh thủ công.

Không có bảng ánh xạ biệt dược viết tay trong module nhận diện mới và không dùng nội dung hội thoại để
điền dữ liệu thuốc.

## Triển khai bắt buộc

1. Đưa toàn bộ mã web của bản này lên GitHub như các lần cập nhật trước.
2. Mở dự án Google Apps Script đang phục vụ URL `/exec` của web.
3. Thay nội dung phần xử lý y lệnh bằng toàn bộ file `apps-script/inpatient-order-review.gs` trong bản này.
4. Chọn **Deploy → Manage deployments → Edit → New version → Deploy** để cập nhật đúng deployment cũ,
   nhờ đó URL `/exec` đang cấu hình trên web không thay đổi.
5. Mở web và bấm cập nhật lên v5.5.3; kiểm tra lại một y lệnh có biệt dược trong danh mục.

Nếu chỉ cập nhật GitHub mà chưa redeploy Apps Script, lớp kiểm tra ở trình duyệt vẫn khóa được kết quả
sai hoạt chất, nhưng luồng phân tích hai lượt chỉ hoạt động đầy đủ sau bước 4.
