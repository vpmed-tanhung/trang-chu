BẢN SỬA ICD-10 & THUỐC NỘI TRÚ – KIỂM SOÁT DỮ LIỆU V3
Ngày: 10/07/2026

1. LỖI ĐÃ PHÁT HIỆN TRONG BẢN V2
- File icd10_bhyt_enrichment_20260710.js chứa 62 quy tắc theo nhóm/biểu thức rộng.
- 62 quy tắc này khớp toàn bộ 309 thuốc/khoản mục, kể cả các nhóm rất khác nhau.
- Vì vậy nhiều thuốc khác hoạt chất nhận cùng liều/chỉ định/chống chỉ định/ICD-10. Ví dụ statin, aspirin, clopidogrel, acenocoumarol và fenofibrat bị gom chung một hồ sơ tim mạch.
- Đây là nguyên nhân xuất hiện ICD nhồi máu cơ tim, rung nhĩ, huyết khối tĩnh mạch ở Atoris dù không phải chỉ định mặc định trực tiếp của atorvastatin.

2. SỬA GIAO DIỆN
- Bỏ hoàn toàn 3 khung thừa trong hồ sơ thuốc:
  + Nguyên tắc chống xuất toán.
  + Thông tin chế phẩm.
  + Mức dữ liệu/Nguồn dạng khung lớn.
- Nguồn chuyên môn chuyển thành mục thu gọn “Nguồn chuyên môn đã đối chiếu”.
- ICD-10 gợi ý được thu gọn thành chip: TÊN CHỈ ĐỊNH + MÃ ICD.
- Chi tiết mã nằm trong mục đóng/mở, không còn hiển thị hàng chục thẻ lớn.

3. KIỂM SOÁT GÁN GHÉP
- Gỡ file quy tắc nhóm rộng khỏi chuỗi chạy của index.html và khỏi gói web.
- Không còn suy ra chỉ định/ICD từ tên nhóm thuốc hoặc từ khóa chung.
- Chỉ khớp hồ sơ khi hoạt chất, biệt dược hoặc SĐK trùng chính xác.
- Thuốc chưa có hồ sơ xác minh sẽ hiện rõ “không hiển thị nội dung suy đoán”, thay vì nhận dữ liệu của thuốc khác.

4. ATORIS 10MG – SĐK VN-18272-14
- Đã tách hồ sơ atorvastatin khỏi aspirin, clopidogrel, acenocoumarol và fenofibrat.
- ICD-10 chỉ gợi ý:
  + E78.0 – Tăng cholesterol máu đơn thuần.
  + E78.2 – Tăng lipid máu hỗn hợp.
  + E78.5 – Tăng lipid máu chưa xác định rõ.
- Không còn tự gán nhồi máu cơ tim, rung nhĩ, đột quỵ hoặc huyết khối tĩnh mạch cho Atoris.
- SĐK/tên chế phẩm được đối chiếu từ danh mục Cục Quản lý Dược; nội dung chuyên môn atorvastatin phải tiếp tục ưu tiên HDSD đúng chế phẩm đang lưu hành khi bệnh viện có bản chính thức.

5. HỒ SƠ ĐƯỢC TÁCH RIÊNG TRONG ĐỢT SỬA NÀY
- Atorvastatin.
- Aspirin/acetylsalicylic acid.
- Clopidogrel.
- Acenocoumarol.
- Fenofibrat.
- Rosuvastatin.
- Lovastatin.
- Aciclovir kem 5%.
- Acyclovir thuốc mỡ mắt 3%.
- Spiramycin + metronidazol dùng trong răng–miệng.
- Ofloxacin thuốc mỡ mắt.
- Polygynax đặt âm đạo.
- Cefazolin.

6. KẾT QUẢ RÀ SOÁT PHẠM VI DỮ LIỆU
- Tổng danh mục: 309 thuốc/khoản mục.
- 14 khoản mục khớp hồ sơ được tách riêng theo hoạt chất/biệt dược/SĐK trong đợt này.
- 32 khoản mục khớp chính xác hồ sơ chuyên môn nội bộ hiện có, chủ yếu kháng sinh/kháng nấm/kháng virus.
- 263 khoản mục chưa có tờ HDSD/monograph đúng hoạt chất-SĐK được nhập đầy đủ vào nguồn dữ liệu. Bản V3 không tiếp tục gán hồ sơ nhóm cho các thuốc này.
- Rà soát trùng chỉ định trên 46 khoản mục có hồ sơ: không phát hiện hai hoạt chất thực sự khác nhau bị nhận cùng một hồ sơ chỉ định; các trường hợp giống nhau còn lại là cùng hoạt chất nhưng cách ghi muối/hàm lượng khác nhau.
- Danh sách chi tiết nằm trong: BAO_CAO_RASOAT_DU_LIEU_THUOC_ICD10_10_07_2026.csv

7. FILE ĐƯỢC THAY ĐỔI/THÊM
- assets/icd10_bhyt_lookup.js
- assets/icd10_verified_profiles_20260710.js
- assets/style.css
- index.html
- BAO_CAO_RASOAT_DU_LIEU_THUOC_ICD10_10_07_2026.csv

8. NGUYÊN TẮC CHUYÊN MÔN
- Tờ HDSD của đúng chế phẩm/SĐK là nguồn ưu tiên để xác minh liều, chỉ định, chống chỉ định, cách dùng, pha truyền và tương tác.
- Dược thư Quốc gia Việt Nam lần xuất bản thứ ba và hướng dẫn chẩn đoán, điều trị của Bộ Y tế dùng để đối chiếu theo hoạt chất/bệnh.
- Quyết định 5948/QĐ-BYT dùng để kiểm tra các cặp tương tác chống chỉ định trong thực hành lâm sàng.
- Mã ICD chỉ được chọn theo chẩn đoán thực tế đã ghi trong bệnh án. Không chọn mã chỉ vì thuốc có thể được dùng để dự phòng một biến cố.
- Không coi bản V3 là đã xác minh đủ 309 thuốc. Các thuốc chưa có nguồn đúng SĐK được chủ động khóa nội dung suy đoán để bảo đảm an toàn.
