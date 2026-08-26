CẬP NHẬT PHA/TRUYỀN KHÁNG SINH - 09/07/2026

Đã bổ sung:
1. assets/infusion_guide_update_20260709.js
   - Tự động cập nhật tab "Pha truyền" cho danh mục VPMED_DRUGS.
   - Bổ sung tương hợp, tiêm bắp, tiêm TM trực tiếp, truyền TM, khoảng cách, ổn định sau pha, ADR và cảnh báo đỏ.

2. data/infusion_guide_20260709.json
   - File dữ liệu nguồn để kiểm tra/đối chiếu về sau.

3. index.html
   - Đã gắn script mới ngay sau assets/clinical_details_v3.js và trước assets/unified.js.

Lưu ý an toàn:
- Dữ liệu được chuẩn hóa từ ảnh tài liệu pha/truyền kháng sinh người dùng cung cấp.
- Khi dùng chính thức phải đối chiếu tờ HDSD đúng biệt dược/số đăng ký và quy trình nội bộ bệnh viện.
- Script cố tình không áp dụng dữ liệu truyền tĩnh mạch cho thuốc đường uống.

Các cảnh báo chính đã đưa vào:
- Không tiêm TM trực tiếp: Vancomycin, Voriconazole, Caspofungin, Amikacin, Gentamicin, Imipenem/Cilastatin.
- Ổn định ngắn: Meropenem 2h, Imipenem/Cilastatin 4h, Ertapenem 6h, TMP/SMX 2h.
- Vancomycin: truyền chậm tối thiểu 60 phút.
- Voriconazole: tốc độ truyền tuyệt đối ≤ 3 mg/kg/giờ.
- Metronidazole: tránh ánh sáng tuyệt đối, không giữ lạnh.
- Moxifloxacin: không giữ lạnh.
