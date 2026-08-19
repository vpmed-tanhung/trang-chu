'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/prescription-check.js'),'utf8');

// Khóa cấu trúc hiển thị theo yêu cầu: điểm số, đúng 3 thống kê và 4 nhóm nguồn ở cuối.
assert(/id="rxScore"/.test(html),'Thiếu trường Điểm số kết quả rà soát');
const initialSummary=html.match(/id="rxSummary">([\s\S]*?)<\/div><\/div>\s*<div class="rx-result-body"/);
assert(initialSummary,'Không tìm thấy khối thống kê kết quả');
for(const label of ['Tương tác','Mã bệnh','Đã đối chiếu'])assert(initialSummary[1].includes(`<span>${label}</span>`),`Thiếu thống kê ${label}`);

const footer=html.match(/id="rxRuleVersion"[\s\S]*?<\/div><div class="rx-result-actions"/);
assert(footer,'Không tìm thấy danh mục nguồn đối chiếu cuối kết quả');
for(const label of ['Tương tác','ICD-10','Kê đơn','BHYT'])assert(footer[0].includes(`<b>${label}</b>`),`Thiếu nhóm nguồn ${label}`);

assert(js.includes('<div><b>${interactions.length}</b><span>Tương tác</span></div><div><b>${icdIssueCount}</b><span>Mã bệnh</span></div><div><b>${state.drugs.length}</b><span>Đã đối chiếu</span></div>'),'Renderer đã thay đổi cấu trúc 3 thống kê');
assert(js.includes('rx-alert-missing-icd'),'Thiếu khung cảnh báo thuốc/mã bệnh gợi ý');
assert(!js.includes('data-rx-add-code'),'Phần gợi ý không được có thao tác thêm mã bệnh');
assert(!js.includes('addSuggestedCode'),'Không được tồn tại hàm thêm mã bệnh từ phần gợi ý');

assert(js.includes("const status=related?'mã bệnh chưa thật sự phù hợp':'thiếu mã bệnh'"),'Phải phân biệt thiếu mã bệnh với mã bệnh đã có nhưng chưa thật sự phù hợp');
assert(js.includes("const eyebrow=related?'Mã bệnh chưa thật sự phù hợp':'Thiếu mã bệnh BHYT'"),'Thiếu nhãn trạng thái ICD phân biệt rõ');
assert(!js.includes('chưa có mã bệnh phù hợp'),'Không được dùng câu chung chung “chưa có mã bệnh phù hợp”');
assert(!js.includes('Thuốc cần bổ sung/đối chiếu mã bệnh:'),'Phải bỏ đoạn thừa “Thuốc cần bổ sung/đối chiếu mã bệnh”');
assert(js.includes('isClinicalTextRelated'),'Phải kiểm tra chẩn đoán liên quan trước khi dùng nhãn “mã bệnh chưa thật sự phù hợp”');

console.log('OK: prescription result structure locked');
