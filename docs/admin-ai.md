# Admin AI Copilot — VPMED Tân Hưng

Trang vận hành: https://hotrolamsang.io.vn/admin-ai.html

1. Đăng nhập tài khoản Admin cá nhân hiện có.
2. Kết nối model ngoài chưa được kích hoạt. Sau khi Admin cho phép phạm vi dữ liệu gửi đến Google Gemini và cập nhật riêng Edge Function admin-ai, cấu hình GEMINI_API_KEY tại Supabase. Không dán khóa vào chat hay repository.
3. Tải Excel lên trang quản trị. Máy chủ đọc XLS/XLSX, kiểm tra cấu trúc, hợp nhất phạm vi A, so sánh với danh mục đang dùng và giữ các dòng thiếu thông tin.
4. Mở tác vụ, đối chiếu nguồn và thay đổi, bấm duyệt. Tài khoản cần xác thực TOTP hai bước. GitHub Actions chỉ nhận bản được duyệt, kiểm tra lại hash danh mục nền, chạy kiểm thử và ghi commit; Supabase chỉ đánh dấu đã phát hành khi hash trên website khớp.

Kết nối model ngoài hiện chưa được kích hoạt: máy chủ đang dùng bộ chuẩn hóa/quét/tổng hợp xác định, chưa gửi dữ liệu tới Gemini. Chờ Admin cho phép rõ nguồn dữ liệu và nơi nhận trước khi bật bản có AI.

## Lịch máy chủ

- Supabase Cron kiểm tra hàng đợi mỗi phút, tối đa một tác vụ mỗi lượt; thử lại tối đa ba lần.
- Quét trường patient_code mỗi giờ; trigger giữ riêng ngay bản ghi mới sai định dạng.
- Báo cáo tuần: thứ Hai từ 07:00, kỳ tuần trước. Báo cáo tháng: ngày 1 từ 07:00, kỳ tháng trước. Múi giờ Asia/Ho_Chi_Minh.
- Tổng hợp feedback OCR: thứ Hai từ 08:00. Chỉ dùng feedback Admin xác nhận.
- Theo dõi nguồn văn bản đã đăng ký hằng ngày từ 06:00. Không khẳng định đã tìm được mọi văn bản mới của Bộ Y tế.
- GitHub Actions kiểm tra bản danh mục đã được duyệt mỗi 10 phút. Lịch GitHub có thể trễ; không bảo đảm cập nhật tức thì.

## Ranh giới chuyên môn và dữ liệu

- AI chỉ đề xuất, không tự điền hoạt chất/hàm lượng/liều/tương tác thiếu nguồn. AI không có công cụ SQL, duyệt hay xuất bản.
- File đầu vào nằm trong bucket riêng, bảng nội bộ ở schema admin_ai có RLS và chặn truy cập trực tiếp. Cổng Edge kiểm tra JWT; nội dung xuất bản còn kiểm tra GitHub OIDC đúng repository, nhánh và workflow.
- Phê duyệt buộc gắn với hash nội dung, Admin hiện tại, phiên còn hiệu lực và aal2. Danh mục nền thay đổi thì phải xử lý/duyệt lại.
- Mã HIS chỉ được kiểm tra định dạng ASCII chữ số, giữ nguyên chuỗi/số 0 đầu. Chưa kết nối registry HIS nên không xác nhận mã có thực; không coi đây là ẩn danh hoàn chỉnh hoặc chứng nhận HIPAA.
- Ẩn bản ghi sai định dạng khỏi lịch sử dùng chung; Admin cá nhân xem và mở lại sau xác minh. Không xóa dữ liệu gốc. Nội dung tự do trong các trường khác chưa được chứng nhận loại sạch định danh.
- Không gửi mã HIS, họ tên, email, ảnh người bệnh, nội dung result_summary hoặc tên thuốc mới chưa đối chiếu cho model. Báo cáo dùng số liệu tổng hợp; tên khoa được thay bằng mã K# trước khi gửi AI.
- Hiện log thống kê chỉ bao phủ renal_lookup_logs; chưa có sự kiện tương tác chung, DOT/DDD hoặc mọi module. Số dòng log không phải số bệnh nhân.
- Theo dõi sửa/xóa tên thuốc trong module rà soát đơn, có thể gồm dữ liệu nhập thủ công: chỉ gửi loại thao tác; tối đa 10 mẫu mỗi lần mở trang, cách nhau ít nhất 2 giây. Chưa coi là lỗi OCR chuẩn. Module nội trú hiện chỉ có endpoint nhận feedback, chưa có bộ ca chuẩn hoặc độ chính xác được kiểm chứng.
- Văn bản được duyệt lưu vào kho tài liệu tham chiếu. Không tự sửa máy tính liều, tương tác hoặc điều kiện BHYT. Đề xuất prompt OCR không tự kích hoạt khi chưa kiểm thử bộ ca chuẩn.

## Mã nguồn và phục hồi

- Backend: supabase/functions/admin-ai. Các file SQL ghi lại các bước cài đặt đã thực hiện; không chạy lại toàn bộ trên hệ thống đang dùng.
- Publisher: scripts/admin_ai_publish.py; .github/workflows/admin-ai-publish.yml. Chỉ ghi hai file danh mục cố định, dữ liệu phiên bản và checksum. Không force push, không tự hợp nhất thay đổi lâm sàng khi danh mục nền đã khác.
- Tạm dừng lịch: đặt admin_ai.settings.enabled=false và tắt workflow Admin AI trong GitHub. Dừng lịch không thu hồi quyền hoặc xóa dữ liệu.
- Khôi phục dữ liệu: tạo bản đảo commit danh mục, kiểm tra và thẩm định trước khi phát hành lại; không reset nhánh chính.
- Kiểm thử: node tests/test_admin_ai_core.js; python -m pytest -q; các kiểm thử JavaScript hiện có; python scripts/update_sha256sums.py --check.
- SheetJS CE 0.20.3 được vendoring từ CDN chính thức; giấy phép LICENSE-SheetJS.txt đi kèm. Không dùng bản npm xlsx cũ.
- pg_net báo extension_in_public vì phiên bản extension không hỗ trợ chuyển schema. Các hàm gọi mạng nội bộ không cấp quyền cho trình duyệt. Tham chiếu: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
