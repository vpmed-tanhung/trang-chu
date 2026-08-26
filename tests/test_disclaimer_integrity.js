'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath));
}

function extract(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  assert(start >= 0, `Không tìm thấy mốc bắt đầu: ${startMarker}`);
  const end = text.indexOf(endMarker, start);
  assert(end >= 0, `Không tìm thấy mốc kết thúc: ${endMarker}`);
  return text.slice(start, end + endMarker.length);
}

assert.strictEqual(
  sha256(read('assets/disclaimer-gate.js')),
  '80f573e9d0031b33003a0d57415989b9cf58228718d5985e91bdf30d74e202b6',
  'Không được thay đổi logic Tuyên bố trách nhiệm đã duyệt'
);
assert.strictEqual(
  sha256(read('assets/disclaimer-gate.css')),
  'fb54e8ba18eac7ba489165d59736bc6295b353387c7fed70e7754f3150e0f1b8',
  'Không được thay đổi giao diện Tuyên bố trách nhiệm đã duyệt'
);

const html = read('index.html').toString('utf8');
const modal = extract(
  html,
  '<div class="disclaimer-gate" id="disclaimerGate" hidden>',
  '  </section>\n</div>'
);
const compactReminder = extract(
  html,
  '    <section class="home-responsibility-note home-responsibility-note--compact"',
  '    </section>'
);

assert.strictEqual(
  sha256(modal),
  '7948daecccf6bb69395248057089a4cf7630e4e4fd96659e54f8d03337312ddd',
  'Không được thay đổi nội dung modal Tuyên bố trách nhiệm đã duyệt'
);
assert.strictEqual(
  sha256(compactReminder),
  'd5472dd0e84e524f910fa54d424ce6c467b1865cefe03bd4ceb9eb5c2425416c',
  'Không được thay đổi thanh nhắc Tuyên bố trách nhiệm đã duyệt'
);

console.log('Disclaimer integrity tests: OK');
