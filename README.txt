BẢN CẬP NHẬT HỆ THỐNG TÀI KHOẢN KHOA/PHÒNG VPMED
- Trang đăng nhập, đăng ký và quản trị mới: tai-khoan.html.
- Chỉ chấp nhận email @vpmed.vn; mỗi khoa/phòng đăng ký một tài khoản dùng chung, không dùng họ tên hoặc chức danh cá nhân.
- Tài khoản mới ở trạng thái chờ duyệt; admin được duyệt, từ chối, thu hồi hoặc xóa vĩnh viễn tài khoản ở mọi trạng thái.
- Chỉ tài khoản đã duyệt mới vào được trang chủ. Tài khoản chờ duyệt không còn được chuyển sang trang công cụ cũ.
- Lịch sử dùng chung hiển thị khoa/phòng sử dụng; không hiển thị danh tính cá nhân và không lưu họ tên bệnh nhân.
- Lịch sử tính liều suy thận được dùng chung qua Supabase: mọi tài khoản đã duyệt được xem, chỉ admin được xóa và xuất báo cáo CSV.
- Với dự án đã cài đặt, chạy thêm supabase/lich_su_tra_cuu_dung_chung.sql một lần.
- Quyền xóa tài khoản: chạy một lần supabase/them_quyen_admin_xoa_tai_khoan.sql. Tài khoản bị xóa phải đăng ký lại từ đầu và chờ duyệt lại mới dùng được web.
- Nếu admin đã duyệt vẫn không xóa được lịch sử tra cứu, chạy supabase/sua_quyen_xoa_admin.sql và tải bản mã mới.
- Với dự án hiện tại, chạy supabase/chuyen_tai_khoan_theo_khoa_phong.sql trước khi tải mã website mới.
- Nếu hiện dòng đỏ “Kết quả đã tính nhưng chưa lưu được vào lịch sử chung”, chạy một lần supabase/sua_loi_ghi_nhat_ky.sql trong Supabase SQL Editor.
- Xem HUONG_DAN_DANG_NHAP_VA_NHAT_KY.md trước khi triển khai.

BẢN CẬP NHẬT HIỆU CHỈNH LIỀU THEO CrCl
- Công cụ chọn đúng thuốc và lấy cùng một hồ sơ dữ liệu.
- Sau khi tính Cockcroft–Gault, hệ thống tự chọn đúng khoảng CrCl của bệnh nhân và hiển thị một gợi ý cụ thể.
- Toàn bộ các khoảng CrCl vẫn được hiển thị để đối chiếu.
- Vancomycin, aminoglycosid và colistin không được cho liều duy trì đơn giản chỉ dựa vào CrCl; hệ thống yêu cầu TDM/thuật toán riêng.
- Nguồn ưu tiên: tờ HDSD đúng chế phẩm trên hệ thống Cục Quản lý Dược; quy trình HĐT&ĐT; tài liệu năm 2020 chỉ là tài liệu nền.
- Trước khi sử dụng chính thức, Khoa Dược cần đối chiếu số đăng ký và tờ HDSD của từng biệt dược đang lưu hành tại bệnh viện.


CẬP NHẬT ĐÁNH GIÁ CHỨC NĂNG THẬN THEO CrCl
- Sau khi tính Cockcroft–Gault, hệ thống hiển thị phân tầng cảnh báo màu: bảo tồn, giảm nhẹ, giảm trung bình, giảm nặng, rất nặng.
- Đây là phân tầng hỗ trợ hiệu chỉnh liều, không phải chẩn đoán giai đoạn bệnh thận mạn. Phân giai đoạn CKD cần eGFR, dấu hiệu tổn thương thận và thời gian kéo dài >=3 tháng theo Quyết định 2388/QĐ-BYT ngày 24/6/2024.

CẬP NHẬT eGFR:
- Tính eGFR bằng công thức CKD-EPI 2021 không dùng hệ số chủng tộc.
- Phân loại G1, G2, G3a, G3b, G4, G5 theo eGFR.
- Nếu nhập chiều cao, hệ thống quy đổi eGFR chuẩn hóa 1,73 m² sang mL/phút theo BSA để hỗ trợ đánh giá liều ở người có kích thước cơ thể khác trung bình.
- CrCl Cockcroft–Gault vẫn là chỉ số chọn ngưỡng liều khi tờ thông tin thuốc quy định theo CrCl; eGFR dùng cho đánh giá CKD và có thể hỗ trợ liều khi nguồn thuốc quy định theo eGFR.
