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
- Có khối **Ưu tiên an toàn thận** tinh gọn để dược sĩ nhập tình trạng thận, tuổi, giới tính sinh học,
  cân nặng, chiều cao và creatinine + đơn vị; hệ thống tự tính CrCl/eGFR.
- Tính kiểm chứng ngay trên trình duyệt: **CrCl Cockcroft–Gault**, **eGFR CKD-EPI 2021** và eGFR không
  chuẩn hóa BSA khi có chiều cao. Nếu cân nặng >120% IBW, hiển thị rõ việc dùng AdjBW và cảnh báo phải
  đối chiếu quy ước của bệnh viện/HDSD thuốc.
- Chỉ tự chọn dải liều cục bộ khi dược sĩ xác nhận creatinine tương đối ổn định. Với **AKI**, **IHD** hoặc
  **CRRT**, hệ thống chủ động chặn việc áp một dải CrCl tĩnh và chuyển sang cảnh báo/phác đồ riêng.
- Sau khi AI nhận diện thuốc, hệ thống đối chiếu thêm với `VPMED_GET_RENAL_DOSE`/cơ sở dữ liệu chỉnh liều
  thận cục bộ. Vì vậy dải liều có thể hiển thị độc lập với phần diễn giải của AI, kèm nguồn dữ liệu.
- Dữ liệu thận do dược sĩ nhập được gửi kèm trường `note` mà backend hiện tại đã hỗ trợ; không gửi họ tên
  hoặc mã người bệnh.
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

1. **HDSD/SPC đã phê duyệt** của đúng hoạt chất, hàm lượng, dạng bào chế và đường dùng.
2. **Quy trình/phác đồ chỉnh liều đã được bệnh viện phê duyệt**.
3. **Dược thư Quốc gia Việt Nam** hiện hành và hướng dẫn Bộ Y tế.
4. Hướng dẫn chuyên ngành phù hợp: KDIGO cho nguyên tắc đánh giá chức năng thận;
   UpToDate/Sanford/Renal Drug Handbook khi có nội dung phù hợp và đã đối chiếu.

Nguyên tắc thiết kế lớp an toàn thận được rà soát với:

- [KDIGO 2024 CKD Guideline](https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf),
  mục 4.2: eGFR có thể dùng cho đa số tình huống; cần tăng độ chính xác với thuốc khoảng điều trị hẹp,
  xem xét eGFR không chuẩn hóa BSA ở thể trạng cực đoan và điều chỉnh khi thông số chưa ở trạng thái ổn định.
- [NIDDK — Determining Drug Dosing in Adults with CKD](https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/ckd-drug-dosing-providers):
  không có một công thức duy nhất cho mọi nhãn thuốc; cần đối chiếu đúng ngưỡng dùng trong nguồn liều và
  cân nhắc bỏ chuẩn hóa BSA khi kích thước cơ thể khác nhiều so với trung bình.

System prompt đầy đủ: [`docs/ai-prompts/y-lenh-noi-tru-system-prompt.md`](docs/ai-prompts/y-lenh-noi-tru-system-prompt.md).
Backend proxy: [`apps-script/inpatient-order-review.gs`](apps-script/inpatient-order-review.gs).
`WEB_APP_URL` trong `assets/inpatient-order-review.js` đang trỏ tới Apps Script Web App triển khai ngày
19/08/2026. Lớp tính/đối chiếu thận cục bộ hoạt động ngay sau khi cập nhật frontend. Để áp dụng system
prompt và các field JSON mới (`suggestedRegimen`, `loadingDoseNote`, `monitoring`), cần cập nhật file
`apps-script/inpatient-order-review.gs` trong dự án Apps Script và tạo phiên bản triển khai mới.

## Giới hạn an toàn

- Kết quả là hỗ trợ rà soát nhanh, **không phải kết luận lâm sàng cuối cùng**; mọi cảnh báo cần được dược
  sĩ hoặc bác sĩ có chuyên môn xem xét trong bối cảnh lâm sàng cụ thể trước khi áp dụng.
- Không giới hạn cứng số lượng ảnh trong code, nhưng Apps Script Web App giới hạn kích thước request và
  thời gian chạy — quá nhiều ảnh độ phân giải cao trong một lượt có thể khiến yêu cầu thất bại.
- AI có thể đọc sai chữ viết tay mờ hoặc thiếu ngữ cảnh; mọi nội dung không chắc chắn phải được liệt kê
  rõ trong kết quả để dược sĩ xác minh, không được tự suy đoán thay.
- Không dùng CrCl/eGFR tính từ một SCr đơn lẻ để chốt liều khi AKI/SCr đang tăng hoặc giảm. Cần xem xu
  hướng SCr, lượng nước tiểu, tình trạng dịch, mức thuốc/TDM và đánh giá lại theo diễn biến.
- IHD/CRRT cần phác đồ riêng theo phương thức, cường độ lọc, lịch lọc, thời điểm dùng thuốc và chức năng
  thận tồn dư. Không suy diễn liều IHD/CRRT từ dải CrCl của người bệnh không lọc máu.
