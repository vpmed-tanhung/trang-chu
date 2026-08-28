'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const theme = fs.readFileSync(path.join(root, 'assets', 'navy-theme.css'), 'utf8');
const shell = fs.readFileSync(path.join(root, 'assets', 'platform-shell.js'), 'utf8');
const moduleHtml = fs.readFileSync(path.join(root, 'cap-cuu-phan-ve.html'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

assert(index.includes('class="nav-emergency" data-view="cap-cuu-phan-ve"'),
  'Menu chính phải mở module Cấp cứu phản vệ bằng điều hướng nội bộ');
assert(index.includes('class="feature-card emergency-feature" data-open="cap-cuu-phan-ve"'),
  'Trang chủ phải mở card Cấp cứu phản vệ bằng platform shell');
assert(index.includes('id="view-cap-cuu-phan-ve"'),
  'Phải có view nội bộ cho module Cấp cứu phản vệ');
assert(index.includes('data-feature-frame="cap-cuu-phan-ve"'),
  'View phản vệ phải có khung module được quản lý bởi platform shell');
const anaphylaxisView = index.split('id="view-cap-cuu-phan-ve"', 2)[1].split('</section>', 1)[0];
assert(anaphylaxisView.includes('class="back-home-btn" data-go="home"'),
  'View phản vệ phải có nút quay về dùng chung như các module khác');
assert(shell.includes("'cap-cuu-phan-ve':"),
  'Platform shell phải đăng ký bundle Cấp cứu phản vệ');
assert(shell.includes("frame: 'cap-cuu-phan-ve.html?v=20260828-integrated-layout-v2'"),
  'Module phản vệ phải được nạp lười trong view nội bộ');
assert(index.includes('class="clinical-tool-frame anaphylaxis-frame"') && index.includes('scrolling="no"'),
  'Khung phản vệ phải tắt thanh cuộn riêng');
assert(shell.includes("data.type === 'vpmed:feature-frame-height'") && shell.includes("frame.style.height = `${height + 2}px`"),
  'Platform shell phải tự giãn khung phản vệ theo chiều cao nội dung');
assert(moduleHtml.includes("postHostMessage('vpmed:feature-frame-height'") && moduleHtml.includes('startEmbeddedBridge()'),
  'Module phản vệ phải đồng bộ chiều cao với trang chính');
assert(moduleHtml.includes('html.vpmed-embedded .system-back{display:none}'),
  'Khi nhúng phải ẩn nút Trang chủ bị lặp bên trong module');
assert(moduleHtml.includes('function openModuleDialog(dialog)') && !moduleHtml.includes("$('#assessDialog').showModal()"),
  'Hộp thoại trong khung tự giãn phải được đặt theo vùng đang nhìn thấy');
assert(moduleHtml.includes('data-vpmed-home'),
  'Nút Trang chủ trong module phải có hook điều hướng nội bộ');
assert(moduleHtml.includes("platform.openFeature('home',{source:'anaphylaxis-back'})"),
  'Nút Trang chủ phải chuyển view qua platform shell, không tải lại index.html');
const orderedModules = [
  'Cấp cứu phản vệ',
  'Phân tích y lệnh nội trú',
  'Rà soát đơn thuốc BHYT',
  'Kiểm tra tương tác thuốc',
  'Tính liều kháng sinh & CrCl/eGFR',
  'Tính liều kháng sinh Nhi',
  'Danh mục kháng sinh nội trú',
  'Kháng sinh theo bệnh lý',
  'Pha &amp; Bảo quản Thuốc Tiêm',
  'Cảnh giác dược',
  'Thuốc dùng khi có thai & cho con bú',
  'Thuốc có nguy cơ gây độc gan',
  'ICD-10 & BHYT theo thuốc nội trú',
  'Tính liều PET/CT – Y học hạt nhân',
  'Nguồn dữ liệu hệ thống'
];
let previousPosition = -1;
for (const title of orderedModules) {
  const position = index.indexOf(`<b>${title}</b>`);
  assert(position > previousPosition, `Thứ tự module chưa đúng tại: ${title}`);
  previousPosition = position;
}
assert(index.indexOf('assets/navy-theme.css') > index.indexOf('assets/platform-shell.css'),
  'Theme Navy phải được nạp cuối để đồng bộ các module hiện có');

assert(theme.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'),
  'Lưới module desktop phải có 2 cột');
assert(theme.includes('#view-home .feature-grid{grid-template-columns:1fr!important}'),
  'Lưới module mobile phải thu về 1 cột');
assert(theme.includes('grid-template-areas:"icon title badge arrow" "icon description description arrow"'),
  'Thẻ phải giữ đúng cấu trúc icon, nội dung, badge và mũi tên');
assert(theme.includes('@keyframes vpmed-anaphylaxis-pulse'),
  'Card Cấp cứu phản vệ phải có hiệu ứng nhấp nháy cảnh báo');
assert(theme.includes('animation:vpmed-anaphylaxis-pulse 1.35s ease-in-out infinite'),
  'Hiệu ứng cảnh báo phải được áp dụng cho card Cấp cứu phản vệ');
assert(!theme.includes('body{') && !theme.includes('linear-gradient(145deg,#050d19'),
  'Không được ghi đè bảng màu sáng gốc bằng nền Navy tối');

assert(moduleHtml.includes("if(w<=30)return .3;return .5"),
  'Trẻ đúng 30 kg phải nhận liều 0,3 mg; chỉ trên 30 kg mới chuyển 0,5 mg');
assert(moduleHtml.includes("const active=(state.grade==='II'||state.grade==='III')&&currentDose"),
  'Nút IM chỉ được mở ở độ II hoặc III');
assert(moduleHtml.includes("if(c.g==='IV'&&lastGrade!=='IV')"),
  'Độ IV phải tự động chuyển sang quy trình ngừng tuần hoàn');
assert(moduleHtml.includes('ĐÃ KHÓA — KHÔNG TIÊM IM'),
  'Độ IV phải hiển thị trạng thái khóa IM');
assert(moduleHtml.includes('Adrenalin IV/IO'),
  'Quy trình độ IV phải có Adrenalin IV/IO');
assert(moduleHtml.includes('href="index.html#home"'),
  'Module phải có liên kết dự phòng quay lại hệ thống chính');
assert(!moduleHtml.includes('ONLINE · NGUỒN TRỰC TIẾP'),
  'Phải xóa nhãn ONLINE · NGUỒN TRỰC TIẾP');
assert(!moduleHtml.includes('Phân độ · Adrenalin IM · Đánh giá lại · Ngừng tuần hoàn · Timeline'),
  'Phải xóa dòng mô tả dưới tiêu đề module');
assert(!moduleHtml.includes('>↑ Menu</button>'),
  'Không được còn nút nổi ↑ Menu trong module');
assert(moduleHtml.includes('id="printReport" class="print-report"'),
  'Phần in phải có phiếu ghi nhận ca cấp cứu riêng');
assert(moduleHtml.includes('PHIẾU GHI NHẬN CA CẤP CỨU'),
  'Phiếu in phải có tiêu đề báo cáo ca cấp cứu');
assert(moduleHtml.includes('function preparePrintReport()'),
  'Dữ liệu ca cấp cứu phải được đưa vào phiếu trước khi in');
assert(moduleHtml.includes("window.addEventListener('beforeprint',preparePrintReport)"),
  'In bằng phím tắt cũng phải cập nhật dữ liệu phiếu');
assert(moduleHtml.includes('https://vbpl.vn/boyte/Pages/vbpq-van-ban-goc.aspx?ItemID=128248'),
  'Phiếu phải dẫn trực tiếp đến nguồn TT51 của Cơ sở dữ liệu quốc gia về VBQPPL');

for (const cached of [
  "'./assets/navy-theme.css?v=20260828-original-colors-pulse-v2'",
  "'./cap-cuu-phan-ve.html?v=20260828-integrated-layout-v2'"
]) {
  assert(worker.includes(cached), `Service worker thiếu tài nguyên ${cached}`);
}

console.log('Anaphylaxis module integration tests: OK');
