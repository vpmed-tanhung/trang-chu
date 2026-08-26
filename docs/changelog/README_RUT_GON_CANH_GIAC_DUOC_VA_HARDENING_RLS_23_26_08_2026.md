# Rút gọn bản tin cảnh giác dược & hardening RLS/Supabase — 23–26/08/2026

## 1. Rút gọn bản tin cảnh giác dược (23/08/2026)

- Bản tin cảnh giác dược tự động hiển thị dạng rút gọn, chỉ giữ ý chính.
- Nội dung đầy đủ vẫn truy cập được qua liên kết Nguồn của từng bản tin.
- Không thay đổi dữ liệu cảnh báo gốc, chỉ thay đổi cách hiển thị.

Phiên bản: `5.5.0` — build `2026.08.23.49`.

## 2. Hardening RLS / Supabase (26/08/2026)

Bổ sung 2 file SQL mới trong `supabase/`, **ảnh hưởng trực tiếp đến phân quyền
truy cập dữ liệu**, cần chạy đúng thứ tự sau các file cài đặt/nâng cấp nghiệp
vụ và **trước khi đưa vào production**:

1. `toi_uu_rls.sql`
   - Tối ưu lại các policy RLS trên `profiles` và `renal_lookup_logs`.
   - Không mở rộng phạm vi truy cập hiện có, không xóa dữ liệu.

2. `bao_mat_security_definer.sql` (chạy **cuối cùng**)
   - Đặt `search_path` rỗng cho các hàm trigger nội bộ.
   - Thu hồi quyền EXECUTE mặc định của PUBLIC/anon/authenticated trên các
     hàm SECURITY DEFINER và trigger nhạy cảm; chỉ cấp lại quyền cần thiết
     cho `authenticated` đối với các RPC được client gọi.
   - Không xóa dữ liệu, tài khoản hoặc policy RLS.

**Lưu ý triển khai:** hai file trên đã được thêm vào quy trình chuẩn tại
`supabase/README.md`. Cần review thủ công và xác minh lại bằng Database
Advisors / RLS Tester trên đúng dự án Supabase trước khi áp dụng, vì đây là
thay đổi liên quan trực tiếp đến quyền truy cập dữ liệu.
