VPMED TÂN HƯNG – CẬP NHẬT LẬP KẾ HOẠCH LIỀU PET/CT TỐI ĐA 12 CA
Ngày: 02/08/2026

NỘI DUNG ĐÃ SỬA
- Dùng tổng xạ đặt tại thời điểm thuốc về đến bệnh viện làm mốc tính.
- Cho nhập giờ tiêm thực tế riêng cho từng bệnh nhân.
- Cho nhập đường huyết và đánh dấu bệnh nhân tiểu đường theo từng ca.
- Khi đánh dấu tiểu đường, liều mục tiêu của ca được cộng đúng 1 mCi.
- Giới hạn danh sách tối đa 12 ca.
- Chia phần dư theo công thức Excel:
  Phần dư trung bình = (Tổng xạ đặt - Tổng liều mục tiêu) / Số ca.
- Các ca từ ca 2 được làm tròn lên 0,1 mCi; ca 1 nhận phần chênh lệch còn lại để tổng phân bổ đúng bằng tổng xạ đặt.
- Tính bù phân rã riêng theo thời gian từ lúc thuốc về viện đến giờ tiêm của từng ca.
- Thay bảng cũ bằng bảng theo dõi: Liều nhập, Cân nặng, Tiểu đường, Đường huyết, Liều dùng, Dự kiến tiêm, Dự kiến chụp, Liều cần và Còn.
- Tự động tính Liều TB, Số BN, Tổng cân và tổng cuối cột Liều nhập.
- Giờ chụp được tự động tính từ giờ tiêm và thời gian từ tiêm đến chụp.
- Chu kỳ bán rã mặc định của bảng nhiều ca là 110 phút để kết quả khớp công thức trong file Excel.
- Tính ngược Liều cần/Còn từ ca cuối về ca đầu, sau đó quy đổi về mốc nhận thuốc.
- Hiển thị cảnh báo ĐỦ/THIẾU và đánh dấu số âm trong cột Liều cần/Còn.
- Không sử dụng số liệu trong ảnh minh họa.
- Không thay đổi phần tính đơn bệnh nhân.

CÔNG THỨC KIỂM TRA ĐỦ THUỐC
- Liều dùng ca i = Cân nặng ca i x Hệ số liều; cộng 1 mCi nếu đánh dấu tiểu đường.
- Thời gian chờ ca i = Giờ tiêm ca i - Giờ thuốc về viện.
- Liều tối thiểu tại viện ca i = Liều mục tiêu ca i x 2^(Thời gian chờ / Chu kỳ bán rã).
- Tổng tối thiểu tại viện = Tổng liều tối thiểu của tất cả ca.
- Kết luận đủ khi Tổng xạ đặt >= Tổng tối thiểu tại viện.
- Liều cần ca cuối = Liều dùng ca cuối.
- Liều cần ca hiện tại = Liều dùng ca hiện tại + Liều cần ca sau x 2^((Giờ tiêm ca sau - Giờ tiêm ca hiện tại) / Chu kỳ bán rã).
- Liều cần tại mốc nhận = Liều cần ca đầu x 2^((Giờ tiêm ca đầu - Giờ nhận) / Chu kỳ bán rã).
- Còn = Liều cần - Liều dùng.

FILE ĐƯỢC SỬA/THÊM
- index.html
- assets/style.css
- assets/petct_batch_calculator.js
- tests/test_petct_batch_calculator.js

KIỂM TRA TỰ ĐỘNG
- Chạy: node tests/test_petct_batch_calculator.js
- Bộ kiểm tra gồm lịch 5 ca với các khoảng 1–2 phút, 20 phút và 40 phút; giới hạn 12 ca; cách chia dư; giờ tiêm sai thứ tự và giờ tiêm trước lúc thuốc về viện.

TRIỂN KHAI
- Tải nguyên cấu trúc thư mục trang-chu-khoa-duoc-main lên repository GitHub trang-chu-khoa-duoc.
- Commit thay đổi và chờ GitHub Pages phát hành lại.
- Mở mục Tính liều PET/CT – Y học hạt nhân và kiểm tra bằng dữ liệu đã được bệnh viện phê duyệt.
