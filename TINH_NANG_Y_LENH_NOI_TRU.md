# Phân tích y lệnh dùng thuốc nội trú

Tính năng được mở từ thẻ **Phân tích y lệnh nội trú** trên trang chủ hoặc đường dẫn `#inpatient-order`.

## Chức năng đã có

- Tải ảnh y lệnh/bệnh án của cùng một bệnh nhân, cùng một đợt y lệnh — **không giới hạn số lượng ảnh**.
- Gửi ảnh tới AI (mặc định Gemini, có thể đổi sang Claude) qua proxy Apps Script để phân tích, thay vì
  OCR cục bộ như module Rà soát đơn thuốc BHYT.
- Với mỗi thuốc trong y lệnh: đối chiếu **liều dùng** với liều khuyến cáo, mô tả **cách dùng**, tính
  **tốc độ truyền** (mL/giờ hoặc giọt/phút) cho thuốc đường tĩnh mạch khi y lệnh có đủ dữ liệu.
- Rà soát **tương tác thuốc** giữa tất cả các thuốc cùng có trong y lệnh đang phân tích, phân loại theo
  3 mức: chống chỉ định, nghiêm trọng cần theo dõi, cần lưu ý.
- Khi bệnh án có dữ liệu chức năng thận (creatinine, CrCl, eGFR) hoặc tiền sử suy thận: cảnh báo riêng
  cho từng thuốc cần hiệu chỉnh, kèm **phương pháp hiệu chỉnh tham khảo** (không tự chốt liều cuối).
- Liệt kê rõ phần AI đọc không chắc chắn để dược sĩ xác minh thủ công thay vì suy đoán số liệu.

## Phạm vi không xử lý (có chủ đích)

- Không tính cách pha loãng, chọn dung môi hay thể tích pha chế dịch truyền — thuộc phạm vi công cụ
  **Pha & Bảo quản Thuốc Tiêm** đã có sẵn.
- Không chẩn đoán bệnh, không kê đơn hoặc tự quyết định ngừng/đổi thuốc thay bác sĩ.
- Không xét tương tác với thuốc ngoài y lệnh đang phân tích.

## Quy tắc riêng tư — khác với module Rà soát đơn thuốc BHYT

Đây là **ngoại lệ có chủ đích** so với nguyên tắc "không gửi dữ liệu ra ngoài" của các module OCR cục bộ
khác trong hệ thống, vì việc tính liều/tốc độ truyền/tương tác dựa trên UpToDate và Dược thư Quốc gia cần
suy luận lâm sàng vượt quá khả năng đối chiếu dữ liệu tĩnh cục bộ.

- Ảnh y lệnh được gửi tới AI (Gemini/Claude) qua proxy Apps Script để phân tích. Giao diện bắt buộc người
  dùng tick xác nhận **đã che/xóa thông tin định danh bệnh nhân** (họ tên, số thẻ BHYT, địa chỉ, số điện
  thoại) trước khi cho phép bấm phân tích.
- API key AI chỉ lưu trong Script Properties phía Apps Script, không bao giờ xuất hiện trong code client.
- Ảnh được nén/resize phía trình duyệt trước khi gửi để giảm dung lượng truyền đi.
- Kết quả và ảnh không được ghi log hay lưu trữ lâu dài phía proxy; chỉ xử lý trong bộ nhớ của request.
- Nút **Đơn mới** xóa toàn bộ ảnh, kết quả và trạng thái xác nhận trên trình duyệt để bắt đầu lượt kế tiếp.

## Nguồn dữ liệu và thứ tự ưu tiên

1. **UpToDate** — ưu tiên cho liều, thận trọng, hiệu chỉnh theo thận.
2. **Dược thư Quốc gia Việt Nam** hiện hành — ưu tiên cho quy định/khuyến cáo áp dụng trong nước.
3. **Phác đồ/hướng dẫn điều trị của Bộ Y tế** liên quan đến bệnh lý ghi trong bệnh án.

System prompt đầy đủ: [`docs/ai-prompts/y-lenh-noi-tru-system-prompt.md`](docs/ai-prompts/y-lenh-noi-tru-system-prompt.md).
Backend proxy: [`apps-script/inpatient-order-review.gs`](apps-script/inpatient-order-review.gs).
`WEB_APP_URL` trong `assets/inpatient-order-review.js` đã được cấu hình tới Apps Script Web App triển khai ngày 19/08/2026.

## Giới hạn an toàn

- Kết quả là hỗ trợ rà soát nhanh, **không phải kết luận lâm sàng cuối cùng**; mọi cảnh báo cần được dược
  sĩ hoặc bác sĩ có chuyên môn xem xét trong bối cảnh lâm sàng cụ thể trước khi áp dụng.
- Không giới hạn cứng số lượng ảnh trong code, nhưng Apps Script Web App giới hạn kích thước request và
  thời gian chạy — quá nhiều ảnh độ phân giải cao trong một lượt có thể khiến yêu cầu thất bại.
- AI có thể đọc sai chữ viết tay mờ hoặc thiếu ngữ cảnh; mọi nội dung không chắc chắn phải được liệt kê
  rõ trong kết quả để dược sĩ xác minh, không được tự suy đoán thay.
