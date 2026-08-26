const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Sandbox tối thiểu: module tự thoát sớm ở bind() vì không có #ioUploadInput,
// nhưng export vẫn chạy nên severityMeta luôn khả dụng để test thuần.
class FakeElement {
  constructor(){ this.hidden=true; this.innerHTML=''; this.disabled=true; this.checked=false; this.value=''; }
  addEventListener(){}
  querySelectorAll(){ return []; }
}
const documentStub = {
  readyState: 'complete',
  addEventListener(){},
  querySelector(){ return null; } // #ioUploadInput không tồn tại -> bind() thoát sớm
};

const code = fs.readFileSync(path.join(__dirname, '..', 'assets', 'inpatient-order-review.js'), 'utf8');
const sandbox = { document: documentStub, window: {}, URL: { createObjectURL(){return '';}, revokeObjectURL(){} }, module: { exports: {} }, console };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const { severityMeta } = sandbox.window.__inpatientOrderReviewTestHooks || sandbox.module.exports;
assert.ok(severityMeta, 'severityMeta phải được export để test');

assert.strictEqual(severityMeta('chống chỉ định').cls, 'io-sev-cc');
assert.strictEqual(severityMeta('Chống chỉ định tuyệt đối').label, 'Chống chỉ định');
assert.strictEqual(severityMeta('nghiêm trọng cần theo dõi').cls, 'io-sev-nt');
assert.strictEqual(severityMeta('cần lưu ý').cls, 'io-sev-lu');
assert.strictEqual(severityMeta('').cls, 'io-sev-lu', 'Giá trị rỗng/không rõ phải rơi về mức thấp nhất, không mặc định thành chống chỉ định');
assert.strictEqual(severityMeta(undefined).cls, 'io-sev-lu');

console.log('Inpatient order severity mapping tests: OK');
