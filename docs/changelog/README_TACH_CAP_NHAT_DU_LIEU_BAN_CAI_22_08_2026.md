# Tách cập nhật dữ liệu giữa bản cài và tab web — 22/08/2026

## Mục tiêu

- Bản cài PWA trên desktop/điện thoại và tab web có trạng thái cập nhật độc lập.
- Bản cài không hiện yêu cầu cập nhật chỉ vì mã giao diện hoặc mã chức năng của website thay đổi.
- Chỉ hiện banner cập nhật lớn khi `clinicalDataVersion` (phiên bản nguồn dữ liệu chuyên môn) thay đổi.
- Không thay đổi nội dung của bất kỳ tệp dữ liệu tra cứu nào trong bản phát hành này.

## Thay đổi kỹ thuật

- Gắn ngữ cảnh `installed` cho `start_url` của PWA và nhận diện thêm bằng `display-mode: standalone`/`navigator.standalone`.
- Tách cache dữ liệu chuyên môn thành hai namespace `web` và `installed`.
- Tách mốc dữ liệu đã chấp nhận của bản cài khỏi trạng thái build của tab web.
- Bản cài gửi yêu cầu áp dụng phiên bản dữ liệu mới chỉ sau khi người dùng bấm **Cập nhật ngay**.
- Các bản build chỉ thay đổi mã nguồn không tạo banner cập nhật trong bản cài.

## Dữ liệu

`clinicalDataVersion` giữ nguyên: `sha256-e55470b6ef301c7734460d58`.

Vì vậy bản v5.4.6 không làm thay đổi kết quả hay nội dung tra cứu hiện có.
