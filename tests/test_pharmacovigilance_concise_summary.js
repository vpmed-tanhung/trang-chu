'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const windowStub = {};
const sandbox = {window: windowStub, console};
const source = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'pharmacovigilance_auto_editor.js'),
  'utf8'
);
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const longSummary = [
  'Thuốc thử nghiệm là một sản phẩm đã được sử dụng trong nhiều năm.',
  'Bài nguồn trình bày lịch sử phát triển và nhiều thông tin nền khác.',
  'Phần tiếp theo mô tả quy trình quản lý tại nhiều quốc gia khác nhau.',
  'Cơ quan quản lý kết luận có nguy cơ tổn thương gan hiếm gặp liên quan đến thuốc thử nghiệm.',
  'Tính đến nay đã ghi nhận tổng số 11 ca nghi ngờ, trong đó 2 ca phải nhập viện.',
  'Khuyến cáo ngừng thuốc và đánh giá chức năng gan khi xuất hiện triệu chứng nghi ngờ.'
].join(' ');

const edited = windowStub.VPMED_PHARMACOVIGILANCE_AUTO_EDIT({
  id: 'auto-long',
  auto: true,
  autoEdited: true,
  url: 'https://example.test/source',
  title: 'Cảnh báo tổn thương gan liên quan thuốc thử nghiệm',
  summary: longSummary,
  quick: 'Khuyến cáo ngừng thuốc và đánh giá chức năng gan khi nghi ngờ.',
  risk: ['Nguy cơ tổn thương gan hiếm gặp.'],
  signs: ['Theo dõi vàng da.'],
  action: ['Ngừng thuốc khi nghi ngờ.'],
  monitor: ['Kiểm tra chức năng gan.']
});

assert.ok(edited.summary.length <= 420, 'Tóm tắt hiển thị không được vượt quá 420 ký tự');
assert.ok(edited.summary.includes('11 ca nghi ngờ'), 'Phải giữ số liệu quan trọng nằm cuối bài');
assert.ok(!edited.summary.includes('lịch sử phát triển'), 'Không được bê phần thông tin nền vào tóm tắt');
assert.ok(!edited.summary.includes('quy trình quản lý'), 'Không được chép tuần tự toàn bộ bài nguồn');
assert.strictEqual(edited.source_url, edited.url, 'Phải giữ liên kết tới bài nguồn đầy đủ');

console.log('Pharmacovigilance concise-summary tests: OK');
