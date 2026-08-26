# Cập nhật an toàn thận — Phân tích y lệnh nội trú (20/08/2026)

## Điểm thay đổi

- Thêm khối nhập dữ liệu thận có cấu trúc ngay trong màn hình phân tích y lệnh nội trú.
- Tính kiểm chứng CrCl Cockcroft–Gault, eGFR CKD-EPI 2021 và eGFR không chuẩn hóa BSA.
- Hỗ trợ creatinine theo mg/dL hoặc µmol/L; bố cục gọn, ghép giá trị và đơn vị trên cùng một dòng.
- Bỏ hai trường không cần thiết: thời điểm lấy creatinine và CrCl đã xác minh; hệ thống tự tính CrCl.
- Hiển thị rõ cân nặng dùng trong Cockcroft–Gault; áp AdjBW khi cân nặng >120% IBW và cảnh báo cần
  đối chiếu quy ước bệnh viện/HDSD.
- Chỉ tự chọn dải liều khi dược sĩ xác nhận creatinine tương đối ổn định.
- AKI, IHD và CRRT được chặn khỏi luồng chọn dải CrCl tĩnh; thay bằng cảnh báo đánh giá động/phác đồ lọc.
- Đối chiếu thuốc AI nhận diện với cơ sở dữ liệu chỉnh liều thận cục bộ và hiển thị gợi ý kèm nguồn.
- Gửi dữ liệu thận đã kiểm chứng qua trường `note` đã có của backend để AI phân tích trong đúng bối cảnh.
- Mở rộng system prompt: tách liều nạp/liều duy trì, theo dõi, thời điểm đánh giá lại và độ ưu tiên.

## Kiểm thử

- Thêm test thuần cho chuyển đổi đơn vị creatinine, hệ số giới tính, AdjBW, AKI, IHD và quy đổi eGFR
  theo BSA.
- Cập nhật test tích hợp để đảm bảo đủ trường nhập, phép tính cục bộ và dữ liệu gửi backend.

## Lưu ý triển khai

- Cập nhật frontend là đủ để sử dụng phép tính và đối chiếu liều cục bộ.
- Cần dán lại `apps-script/inpatient-order-review.gs` và tạo phiên bản triển khai Apps Script mới để nhận
  đầy đủ các field AI mới: `suggestedRegimen`, `loadingDoseNote`, `monitoring`.
