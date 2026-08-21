const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets', 'cong-cu-modules', 'core-nav.js'), 'utf8');
const start = source.indexOf('function computeRenalCore');
const end = source.indexOf('\nwindow.computeRenalCore', start);
assert.ok(start >= 0 && end > start, 'Phải tìm thấy engine tính thận dùng chung');

const sandbox = { module: { exports: null } };
vm.createContext(sandbox);
vm.runInContext(`${source.slice(start, end)}\nmodule.exports = computeRenalCore;`, sandbox);
const computeRenalCore = sandbox.module.exports;

assert.strictEqual(
  computeRenalCore(17, 'male', 170, 60, 1),
  null,
  'CKD-EPI/Cockcroft-Gault phải chặn tuổi dưới 18'
);

const adult = computeRenalCore(65, 'male', 190, 100, 1);
assert.ok(adult && adult.crcl > 0 && adult.egfr > 0);
assert.ok(adult.egfrAbsolute > 0, 'Phải trả eGFR không chuẩn hóa BSA');
assert.ok(
  Math.abs(adult.egfrAbsolute - adult.egfr * adult.bsa / 1.73) < 1e-10,
  'eGFR không chuẩn hóa phải bằng eGFR chuẩn hóa × BSA / 1,73'
);
assert.ok(!Object.prototype.hasOwnProperty.call(adult, 'cgStage'), 'CrCl không được gắn nhóm G');
assert.ok(!Object.prototype.hasOwnProperty.call(adult, 'worse'), 'Không được trộn CrCl/eGFR thành giá trị thấp hơn');
assert.ok(!Object.prototype.hasOwnProperty.call(adult, 'renalInterp'), 'Không được diễn giải chung từ CrCl/eGFR');

assert.ok(!source.includes('Math.min(crcl, egfr)'), 'Không được lấy min(CrCl, eGFR)');
assert.ok(source.includes("age<18||age>120"), 'Mọi luồng dùng engine phải bắt buộc tuổi người lớn');
assert.ok(source.includes('Kết quả tách biệt — không trộn CrCl với eGFR'));

const html = fs.readFileSync(path.join(root, 'cong-cu-duoc-lam-sang.html'), 'utf8');
assert.ok(html.includes('id="rn-age" placeholder="65" min="18" max="120"'));
assert.ok(html.includes('id="abx-age" placeholder="65" min="18" max="120"'));
assert.ok(html.includes('id="rn-egfr-absolute-val"'));
assert.ok(html.includes('id="abx-egfr-absolute-val"'));
assert.ok(html.includes('CrCl không có phân độ G1–G5'));
assert.ok(!html.includes('Bảng phân loại mức độ suy thận theo CrCl'));
assert.ok(!html.includes('Suy thận vừa — CKD G3'));

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const unified = fs.readFileSync(path.join(root, 'assets', 'unified.js'), 'utf8');
assert.ok(index.includes('id="age" type="number" min="18" max="120"'));
assert.ok(unified.includes('CKD-EPI/Cockcroft–Gault trong công cụ này chỉ dành cho người lớn'));

console.log('Renal result separation tests: OK');
