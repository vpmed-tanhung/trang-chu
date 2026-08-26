# Sửa bố cục Y lệnh nội trú ở lần mở đầu — 22/08/2026

## Hiện tượng trong video

- Lần đầu mở “Phân tích y lệnh nội trú”, form bị xếp dọc và thiếu bố cục tải ảnh/kết quả hai cột.
- Sau khi mở “Rà soát đơn thuốc BHYT” rồi quay lại, bố cục mới hiển thị đúng.

## Nguyên nhân và sửa lỗi

Mô-đun Y lệnh nội trú dùng các class bố cục `rx-*` được định nghĩa trong `prescription-check.css`, nhưng bundle lazy-load ban đầu chỉ nạp `inpatient-order-review.css`. Bundle `inpatient-order` nay nạp stylesheet dùng chung trước stylesheet riêng của mô-đun, nên lần mở đầu đã có đầy đủ bố cục.

Phiên bản: `5.4.5` — build `2026.08.22.44`.
