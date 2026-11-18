VPMED — GHI CHÚ CẬP NHẬT HỆ THỐNG (cập nhật gần nhất: 18/11/2026, bản 5.8.10)

Tài liệu này tóm tắt các thay đổi đang có hiệu lực trên website, viết theo đúng
những gì mã nguồn hiện triển khai. Xem chi tiết kỹ thuật/lịch sử đầy đủ trong
thư mục docs/changelog/.

ĐIỂM MỚI TRONG BẢN 5.8.10
- Trình duyệt kiểm tra bản web mới khi mở trang có mạng và dùng bản đã lưu khi
  ngoại tuyến. Tab đang mở tiếp tục hoạt động tới lần điều hướng tiếp theo.
- Chuyên mục Tương tác thuốc trong Bản tin Dược hiển thị 37 cặp từ bảng Excel
  đã nhập và ghi số lượng ngay bên cạnh tên chuyên mục.

ĐIỂM MỚI TRONG BẢN 5.8.5
- Cảnh giác dược tự lấy dữ liệu mới khi mở công cụ. Lượt cập nhật dữ liệu
  định kỳ không hiển thị lời nhắc cập nhật ứng dụng hay tải lại trang.
- Lời nhắc chỉ hiện cho bản phát hành lớn được đánh dấu bằng tùy chọn
  --manual-activation trong scripts/bump_app_version.py.

ĐIỂM MỚI TRONG BẢN 5.8.2
- Trang chủ Khoa Dược có các mục Thông tin thuốc, Hướng dẫn sử dụng và
  Bản tin Dược. Các bản tin đã chuyển từ kho cũ được đưa vào mục Bản tin Dược.
- Nút Xem PDF mở tài liệu trong tab mới của trình duyệt. Màn hình loading
  toàn trang đã được bỏ.
- Tài khoản quản trị và email Khoa Dược được đăng, chỉnh sửa nội dung trang
  chủ, tài liệu và bản tin. Tài khoản các khoa/phòng khác đã được duyệt có
  quyền xem nội dung và sử dụng các công cụ được cấp quyền.
- GitHub Actions cập nhật dữ liệu Cảnh giác dược hằng ngày. Lịch đặt lúc
  06:07, 06:37 và 07:17 theo giờ Việt Nam. Các lượt sau bỏ qua bước lấy dữ
  liệu nếu dữ liệu trong ngày đã được cập nhật thành công.


1. HỆ THỐNG TÀI KHOẢN KHOA/PHÒNG
- Đăng nhập, đăng ký và quản trị tài khoản tại tai-khoan.html.
- Chỉ chấp nhận email công vụ @vpmed.vn; mỗi khoa/phòng đăng ký một tài khoản
  dùng chung, không dùng họ tên hoặc chức danh cá nhân.
- Tài khoản mới ở trạng thái "chờ duyệt". Admin có thể duyệt, từ chối, thu hồi
  hoặc xóa vĩnh viễn tài khoản ở bất kỳ trạng thái nào. Tài khoản bị xóa phải
  đăng ký lại từ đầu và chờ duyệt lại.
- Chỉ tài khoản đã duyệt mới vào được trang chủ; tài khoản chờ duyệt không còn
  được chuyển sang trang công cụ cũ.
- Trang quản trị tách thành 3 mục riêng: (1) Tài khoản khoa/phòng — chỉ hiển
  thị tài khoản không có quyền admin; (2) Tài khoản quản trị — chỉ hiển thị
  tài khoản có role = admin; (3) Nhật ký tra cứu liều thận.
- Nhật ký tra cứu liều suy thận dùng chung qua Supabase: mọi tài khoản đã
  duyệt xem được, chỉ admin xóa và xuất báo cáo CSV. Lịch sử chỉ hiển thị
  khoa/phòng sử dụng, không hiển thị danh tính cá nhân và không lưu họ tên
  bệnh nhân.


2. HIỆU CHỈNH LIỀU THEO CHỨC NĂNG THẬN (CrCl & eGFR)
- Công cụ chọn đúng thuốc và lấy cùng một hồ sơ dữ liệu cho tính liều và tra
  cứu thông tin thuốc.
- CrCl theo công thức Cockcroft–Gault: sau khi tính, hệ thống tự chọn đúng
  khoảng CrCl của bệnh nhân và hiển thị một gợi ý cụ thể; toàn bộ các khoảng
  CrCl khác vẫn hiển thị để đối chiếu. Hệ thống hiển thị rõ cân nặng dùng
  trong công thức; áp dụng cân nặng hiệu chỉnh (AdjBW) khi cân nặng thực tế
  >120% cân nặng lý tưởng (IBW) và cảnh báo cần đối chiếu quy ước của bệnh
  viện/tờ hướng dẫn sử dụng (HDSD) từng thuốc.
- eGFR theo công thức CKD-EPI 2021 (không dùng hệ số chủng tộc). Phân loại
  G1–G5 theo eGFR là phân tầng hỗ trợ hiệu chỉnh liều, không phải chẩn đoán
  giai đoạn bệnh thận mạn — chẩn đoán CKD cần thêm bằng chứng tổn thương thận
  và tình trạng kéo dài ≥3 tháng theo Quyết định 2388/QĐ-BYT ngày 24/6/2024.
- Nếu có nhập chiều cao, hệ thống quy đổi eGFR chuẩn hóa 1,73 m² sang mL/phút
  theo diện tích da (BSA, công thức Mosteller) để hỗ trợ đánh giá liều ở
  người có kích thước cơ thể khác trung bình.
- CrCl (Cockcroft–Gault) vẫn là chỉ số chọn ngưỡng liều khi tờ HDSD quy định
  theo CrCl; eGFR dùng để đánh giá CKD và hỗ trợ liều khi nguồn thuốc quy
  định theo eGFR.
- Vancomycin, aminoglycosid và colistin KHÔNG được cho liều duy trì đơn giản
  chỉ dựa vào CrCl; hệ thống bắt buộc theo dõi nồng độ thuốc (TDM)/AUC và
  không tự động lặp lại một lịch liều cố định.
- Với bệnh nhân tổn thương thận cấp (AKI), đang lọc máu ngắt quãng (IHD) hoặc
  lọc máu liên tục (CRRT), hệ thống KHÔNG áp một khoảng CrCl tĩnh cho các
  nhóm thuốc nguy cơ cao này; thay vào đó hiển thị cảnh báo cần đánh giá động
  và hội chẩn/phác đồ lọc máu riêng.
- Nguồn ưu tiên: tờ HDSD đúng chế phẩm trên hệ thống của Cục Quản lý Dược;
  quy trình của Hội đồng Thuốc & Điều trị bệnh viện; tài liệu tham khảo năm
  2020 chỉ là tài liệu nền. Trước khi áp dụng chính thức, Khoa Dược cần đối
  chiếu số đăng ký và tờ HDSD hiện hành của từng biệt dược đang lưu hành tại
  bệnh viện.


3. PHÂN TÍCH Y LỆNH NỘI TRÚ — KHỐI AN TOÀN THẬN (20/08/2026)
- Màn hình Phân tích y lệnh nội trú (#inpatient-order) có khối nhập dữ liệu
  thận riêng: tuổi, giới tính sinh học, cân nặng, chiều cao, creatinine
  (nhận cả đơn vị mg/dL và µmol/L). Hệ thống tự tính CrCl và eGFR ngay trên
  trình duyệt, không cần dược sĩ tự tính tay hay nhập lại giá trị đã xác minh.
- Hệ thống chỉ tự chọn dải liều cục bộ khi dược sĩ xác nhận creatinine tương
  đối ổn định; với AKI/IHD/CRRT áp dụng cảnh báo riêng như mô tả ở mục 2.
- Sau khi AI nhận diện thuốc trong ảnh y lệnh, hệ thống đối chiếu thêm với cơ
  sở dữ liệu chỉnh liều thận cục bộ của VPMED — dải liều hiển thị có thể độc
  lập với phần diễn giải của AI và luôn kèm nguồn dữ liệu để dược sĩ so sánh.
- Dữ liệu thận do dược sĩ nhập được gửi kèm để AI phân tích trong đúng bối
  cảnh lâm sàng, không kèm họ tên hay mã số bệnh nhân.
- Đây là công cụ hỗ trợ tra cứu và đối chiếu, không thay thế đánh giá lâm
  sàng và quyết định của bác sĩ/dược sĩ lâm sàng.


4. LƯU Ý TRIỂN KHAI (chạy trong Supabase SQL Editor, đúng thứ tự nếu là lần
   đầu nâng cấp từ bản cũ hơn)
- Dự án mới cài đặt: chạy supabase/lich_su_tra_cuu_dung_chung.sql một lần.
- Quyền xóa tài khoản: chạy supabase/them_quyen_admin_xoa_tai_khoan.sql một
  lần. Cơ chế xóa vĩnh viễn dùng hàm admin_delete_user; nếu SQL này đã chạy ở
  bản trước thì không cần chạy lại khi nâng cấp lên bản phân cấp tài khoản
  mới.
- Nếu admin đã duyệt vẫn không xóa được lịch sử tra cứu: chạy
  supabase/sua_quyen_xoa_admin.sql rồi tải lại bản mã mới.
- Dự án đang chạy từ bản cũ: chạy supabase/chuyen_tai_khoan_theo_khoa_phong.sql
  trước khi tải mã website mới.
- Nếu hiện dòng cảnh báo đỏ "Kết quả đã tính nhưng chưa lưu được vào lịch sử
  chung": chạy supabase/sua_loi_ghi_nhat_ky.sql một lần.
- Xem thêm HUONG_DAN_DANG_NHAP_VA_NHAT_KY.md trước khi triển khai cho khoa/
  phòng mới.
