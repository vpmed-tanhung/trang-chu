const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps-script', 'inpatient-order-review.gs'),
  'utf8'
);

const responses = [
  {
    code: 429,
    body: {
      error: {
        message: 'Quota exceeded for this model',
        details: [{ retryDelay: '52.1s' }]
      }
    }
  },
  { code: 503, body: { error: { message: 'This model is experiencing high demand' } } },
  {
    code: 200,
    body: { candidates: [{ content: { parts: [{ text: '{"drugs":[]}' }] } }] }
  }
];
const requestedModels = [];
const sandbox = {
  console,
  PropertiesService: {
    getScriptProperties() {
      return { getProperty() { return 'test-key'; } };
    }
  },
  UrlFetchApp: {
    fetch(url) {
      requestedModels.push(String(url).match(/models\/([^:]+):generateContent/)[1]);
      const next = responses.shift();
      return {
        getResponseCode() { return next.code; },
        getContentText() { return JSON.stringify(next.body); }
      };
    }
  }
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const result = sandbox.requestGemini('instructions', [{ text: 'input' }], 100);
assert.strictEqual(result, '{"drugs":[]}');
assert.deepStrictEqual(requestedModels, [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
]);
assert.strictEqual(responses.length, 0, 'Mỗi model chỉ được gọi một lần; dừng ngay khi có kết quả');

const quotaError = sandbox.buildGeminiErrorResponse(
  'gemini-3.6-flash: Quota exceeded; retryDelay=53s | model dự phòng: high demand'
);
assert.strictEqual(quotaError.ok, false);
assert.strictEqual(quotaError.errorCode, 'AI_QUOTA');
assert.strictEqual(quotaError.retryAfterSeconds, 53);
assert.ok(!quotaError.message.includes('gemini-3.6-flash'));
assert.ok(!quotaError.message.includes('Quota exceeded'));

console.log('Inpatient Gemini fallback and compact error tests: OK');
