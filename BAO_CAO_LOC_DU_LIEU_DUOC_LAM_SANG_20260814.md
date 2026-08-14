# Báo cáo lọc dữ liệu Dược lâm sàng theo kho nội trú

Ngày rà soát: **14/08/2026**

## Phạm vi

- Nguồn kho: `sources/danh_muc_thuoc_kho_noi_tru_20260814.xls` (bản gốc đính kèm, đổi tên để dùng an toàn trong dự án).
- 406 dòng tồn kho, chuẩn hóa thành 308 thuốc duy nhất.
- Tiêu chí **Tính liều kháng sinh Nhi**: 11 hoạt chất, tương ứng 21 thuốc đang có trong kho.
- Tiêu chí **Pha & Bảo quản Thuốc Tiêm**: 149 thuốc tiêm/truyền duy nhất.

## Nguyên tắc nguồn

1. Liều Nhi khoa chỉ lấy từ bảng liều trực tiếp của UCSF Benioff Children’s Hospitals; bảng Sơ sinh được tách theo PMA và PNA.
2. Nội dung pha, bảo quản và tương kỵ thuốc tiêm được tách từ bộ dữ liệu 428 thuốc trong ZIP công cụ gốc; không giữ lại trang hoặc giao diện của công cụ đó.
3. Thuốc tiêm được phân thành ba mức:
   - **Đúng tên + hàm lượng:** khớp tên sản phẩm và hàm lượng/nồng độ.
   - **Tham khảo cùng hoạt chất + hàm lượng:** khác tên sản phẩm; bắt buộc đối chiếu lại tờ HDSD đúng chế phẩm.
   - **Chưa có nội dung khớp:** chỉ giữ dữ liệu kho, không suy diễn hướng dẫn từ hàm lượng khác.

## Kết quả thuốc tiêm

- 44 thuốc khớp đúng tên sản phẩm và hàm lượng/nồng độ.
- 30 thuốc có nội dung tham khảo cùng hoạt chất và hàm lượng/nồng độ nhưng khác tên sản phẩm.
- 75 thuốc chưa có nội dung khớp; công cụ chỉ hiển thị thông tin kho và cảnh báo đối chiếu.

## Nguồn Nhi khoa trực tiếp

- [Pediatric Antimicrobial Dosing at Benioff Children’s Hospitals](https://idmp.ucsf.edu/pediatric-antimicrobial-dosing-benioff-childrens-hospitals)
- [Neonatal Antimicrobial Dosing at Benioff Children’s Hospitals](https://idmp.ucsf.edu/neonatal-antimicrobial-dosing-benioff-childrens-hospitals)

## Nguồn nội dung thuốc tiêm

- Mảng dữ liệu 428 thuốc trong ZIP công cụ gốc do người dùng cung cấp.
- Chỉ phần nội dung thuốc được tách ra; trang `cong-cu-duoc-lam-sang.html` và các module giao diện của trang này không được đưa vào dự án.

## Cảnh báo triển khai

Công cụ chỉ hỗ trợ tra cứu. Trước khi đưa vào sử dụng chính thức, Hội đồng Thuốc & Điều trị/Dược lâm sàng cần duyệt quy tắc liều, điều kiện bảo quản, quy trình vô khuẩn và các trường hợp hiệu chỉnh theo thận, gan, lọc máu, ECMO, bỏng hoặc TDM.
