# Sửa tốc độ mở mô-đun và thông báo tải lại dữ liệu — 22/08/2026

## Hiện tượng

- Mở mô-đun nặng có thể phải chờ 2–3 giây và thẻ công cụ hiện vòng quay.
- Thông báo “Dữ liệu y khoa trên máy chủ đã có phiên bản mới” có thể xuất hiện lại dù dữ liệu trên máy đã đúng phiên bản.

## Nguyên nhân

- Các tệp JavaScript của mô-đun được tải nối tiếp, tạo chuỗi chờ mạng dài.
- Mỗi yêu cầu dữ liệu cùng gọi kiểm tra phiên bản máy chủ thay vì dùng chung một lần kiểm tra.
- Khi Service Worker khởi động lại, biến phiên bản tạm thời lấy phiên bản ứng dụng trước khi đọc phiên bản dữ liệu đã lưu, dẫn đến so sánh sai.

## Thay đổi

- Tải song song tài nguyên của mô-đun nhưng giữ nguyên thứ tự thực thi JavaScript.
- Dùng chung Promise khi nhiều mô-đun yêu cầu cùng một tài nguyên.
- Làm ấm trước bộ tài nguyên liều thận khi trình duyệt rảnh và kết nối đủ nhanh.
- Khôi phục phiên bản dữ liệu đã lưu trước mọi lần so sánh với máy chủ.
- Gộp các lần kiểm tra phiên bản đồng thời và giới hạn kiểm tra nền tối đa một lần mỗi 5 phút.
- Khi dữ liệu thật sự đổi ở trang chủ, tự tải lại đúng một lần. Nếu người dùng đã vào mô-đun, chỉ hiện một lời nhắc để tránh mất dữ liệu đang nhập.
- Điều hướng trực tuyến ưu tiên bản HTML mới trên máy chủ; bộ nhớ đệm vẫn được dùng làm phương án ngoại tuyến.

## Phiên bản

- Giao diện: `5.4.2`
- Build: `2026.08.22.41`
