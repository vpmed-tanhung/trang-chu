'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/prescription-check.css'),'utf8');

const actions=html.match(/<div class="rx-prescription-actions"[\s\S]*?<\/div>/);
assert(actions,'Thiếu cụm thao tác đơn thuốc gọn');
assert(actions[0].includes('id="rxCheckPrescription"'),'Thiếu nút phân tích đơn thuốc');
assert(actions[0].includes('<b>Phân tích đơn thuốc</b>'),'Nút chính phải ghi đúng “Phân tích đơn thuốc”');
assert(actions[0].includes('id="rxResetPrescription"'),'Nút Đơn mới phải nằm cùng cụm thao tác');
assert(!html.includes('Kiểm tra toàn bộ lượt khám'),'Phải bỏ nhãn thanh hành động cũ');
assert(!actions[0].includes('<small>'),'Cụm nút gọn không được giữ dòng mô tả dài');
assert(css.includes('.rx-prescription-actions{display:flex'),'Thiếu bố cục ngang của cụm nút');
assert(css.includes('min-height:46px'),'Nút phải có chiều cao gọn');

console.log('Prescription compact action layout tests: OK');
