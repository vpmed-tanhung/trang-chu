'use strict';

const assert = require('assert');
const {
  classifyIcdIssue,
  buildResultSummaryHtml,
  buildMissingIcdHtml,
  buildInpatientBhytHtml
} = require('../assets/prescription-result-model.js');

const missing = classifyIcdIssue({isMissing: true, related: false});
assert.deepStrictEqual(
  {key: missing.key, status: missing.status, eyebrow: missing.eyebrow},
  {key: 'missing', status: 'Thiếu mã bệnh', eyebrow: 'Thiếu mã bệnh BHYT'},
  'Ca chưa có chẩn đoán phải được phân loại là thiếu mã bệnh'
);

const related = classifyIcdIssue({isMissing: false, related: true});
assert.deepStrictEqual(
  {key: related.key, status: related.status, eyebrow: related.eyebrow},
  {key: 'suboptimal', status: 'Mã bệnh chưa thật sự phù hợp', eyebrow: 'Mã bệnh chưa thật sự phù hợp'},
  'Ca đã có chẩn đoán liên quan phải được phân loại là mã bệnh chưa thật sự phù hợp'
);
assert.match(related.explanation, /Đã có chẩn đoán liên quan/i);

const summary = buildResultSummaryHtml({interactions: 2, icdIssues: 3, checked: 7});
const summaryItems = [...summary.matchAll(/<div><b>(\d+)<\/b><span>([^<]+)<\/span><\/div>/g)]
  .map((match) => ({value: Number(match[1]), label: match[2]}));
assert.deepStrictEqual(summaryItems, [
  {value: 2, label: 'Tương tác'},
  {value: 3, label: 'Mã bệnh'},
  {value: 7, label: 'Đã đối chiếu'}
], 'Kết quả phải có đúng ba thống kê hành vi theo đúng thứ tự');

const missingHtml = buildMissingIcdHtml({
  isMissing: true,
  drug: {name: 'Ceftriaxone <tiêm>'},
  mappings: [{term: 'Viêm phổi', codes: ['J18.9']}],
  allowed: []
}, {icdLabel: (code) => `${code} – Viêm phổi`});
assert.match(missingHtml, /data-icd-status="missing"/);
assert.match(missingHtml, /Ceftriaxone &lt;tiêm&gt;: Thiếu mã bệnh/);
assert.match(missingHtml, /J18\.9 – Viêm phổi/);
assert.doesNotMatch(missingHtml, /<button|data-rx-add-code/i, 'Gợi ý ICD chỉ cung cấp thông tin, không tự thêm mã');

const inpatientHtml = buildInpatientBhytHtml({
  related: true,
  drug: {name: 'Meropenem'}
});
assert.match(inpatientHtml, /data-icd-status="suboptimal"/);
assert.match(inpatientHtml, /Meropenem: Mã bệnh chưa thật sự phù hợp/);
assert.match(inpatientHtml, /Đã có chẩn đoán liên quan nhưng mã hiện tại chưa khớp/);
assert.doesNotMatch(inpatientHtml, /Thiếu mã bệnh\.<\/p>/, 'Không được gắn nhãn thiếu mã cho ca đã có chẩn đoán liên quan');

console.log('OK: prescription result behavior verified');

