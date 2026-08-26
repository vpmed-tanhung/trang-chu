# Gói nâng cấp web theo hướng thực hành lâm sàng – VPMED Tân Hưng

Ngày tạo: 04/07/2026

## Mục tiêu

Gói này bổ sung module **Quản trị dữ liệu thực hành lâm sàng** cho website GitHub Pages hiện tại. Module giúp Khoa Dược:

- Cập nhật thuốc mới theo hồ sơ thuốc riêng.
- Ghi liều chuẩn, liều theo CrCl, HD, CRRT.
- Ghi cảnh báo độc gan, độc thận, ADR, tương tác, chống chỉ định.
- Gắn nguồn tham khảo cho từng nội dung.
- Quản lý trạng thái: bản nháp, đã rà soát, đã duyệt, cần cập nhật, tham khảo.
- Xuất/nhập JSON để đưa dữ liệu lên GitHub Pages.
- Lưu nhật ký cập nhật để phục vụ rà soát nội bộ và trình HĐT&ĐT.

## Các file trong gói

```text
cap-nhat-du-lieu.html
clinical-update-module.js
data/clinical_sources.json
data/drug_schema.json
data/clinical_drug_template.json
data/update_log.json
HUONG_DAN_CHEN_VAO_WEB.txt
README_TRIEN_KHAI.md
```

## Cách triển khai nhanh trên GitHub Pages

1. Giải nén toàn bộ gói này.
2. Copy các file sau vào thư mục gốc repository `trang-chu-khoa-duoc`:
   - `cap-nhat-du-lieu.html`
   - `clinical-update-module.js`
   - thư mục `data/`
3. Mở file `index.html` của website hiện tại.
4. Trước thẻ `</body>`, thêm dòng:

```html
<script src="clinical-update-module.js"></script>
```

5. Commit và push lên GitHub.
6. Truy cập:

```text
https://vpmed-tanhung.github.io/trang-chu-khoa-duoc/cap-nhat-du-lieu.html
```

Hoặc vào trang chủ, module sẽ tự thêm nút **Cập nhật dữ liệu chuyên môn** nếu script đã được chèn.

## Lưu ý quan trọng

GitHub Pages là website tĩnh. Vì vậy dữ liệu nhập trong module chỉ lưu trên trình duyệt của máy đang dùng. Khi muốn công bố dữ liệu chính thức, cần:

1. Nhập/sửa dữ liệu.
2. Bấm **Xuất JSON**.
3. Đưa file JSON đã xuất vào thư mục `data/` của repository.
4. Commit/push lên GitHub.

Nếu bệnh viện muốn cập nhật trực tiếp không cần GitHub, cần nâng cấp sang một trong hai hướng:

- Google Sheets + Apps Script làm API trung gian.
- Backend riêng: Node.js/NestJS + PostgreSQL + đăng nhập nội bộ.

## Nguyên tắc nguồn chuyên môn

Thứ tự ưu tiên được cấu hình trong `data/clinical_sources.json`:

1. Tờ hướng dẫn sử dụng đã được Cục Quản lý Dược – Bộ Y tế phê duyệt.
2. Hướng dẫn chẩn đoán/điều trị và tài liệu chuyên môn của Bộ Y tế/Cục Quản lý Khám, chữa bệnh.
3. Quyết định 5948/QĐ-BYT về tương tác thuốc chống chỉ định.
4. Quyết định 29/QĐ-BYT về giám sát ADR.
5. Quyết định 2388/QĐ-BYT năm 2024 về bệnh thận mạn.
6. Thông tư 21/2013/TT-BYT về Hội đồng Thuốc và Điều trị.
7. Nguồn quốc tế chỉ dùng bổ sung khi nguồn trong nước chưa đủ chi tiết.

## Khuyến nghị vận hành

Không để dữ liệu mới hiển thị là “đã duyệt” nếu chưa được DSLS/trưởng khoa/HĐT&ĐT rà soát. Với dữ liệu thay đổi liều, chống chỉ định hoặc tương tác nghiêm trọng, nên để trạng thái “Đã rà soát” hoặc “Chờ duyệt” trước khi áp dụng chính thức.
