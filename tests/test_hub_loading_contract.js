'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '');

function localReferences(attribute, extension) {
  const pattern = new RegExp(`${attribute}=["']([^"']+\\${extension}(?:\\?[^"']*)?)["']`, 'g');
  return [...html.matchAll(pattern)]
    .map((match) => match[1])
    .filter((url) => !/^https?:/i.test(url));
}

const scripts = localReferences('src', '.js');
const styles = localReferences('href', '.css');
assert(scripts.length <= 5, `Hub không được nạp sẵn quá 5 JS cục bộ; hiện có ${scripts.length}`);
assert(styles.length <= 6, `Hub không được nạp sẵn quá 6 CSS cục bộ; hiện có ${styles.length}`);

for (const forbidden of [
  'assets/hepatotoxicity.js',
  'assets/pregnancy_lactation.js',
  'assets/injectable_guide.js',
  'assets/pharmacovigilance_integration.js',
  'assets/prescription-check.js',
  'assets/inpatient-order-review.js',
  'assets/petct-tool.js'
]) {
  assert(!scripts.some((url) => url.split('?')[0] === forbidden), `${forbidden} phải được lazy-load`);
}

const shell = fs.readFileSync(path.join(root, 'assets/platform-shell.js'), 'utf8');
for (const contract of [
  'requestIdleCallback', 'saveData', 'effectiveType', 'beforeinstallprompt',
  'vpmed:shell-ready', 'vpmed:feature-open', 'vpmed:calculation-complete',
  'vpmed:data-version-changed', 'resourceLoads',
  'Promise.all(bundle.scripts.map(loadScript))', "schedulePrefetch('dose')"
]) {
  assert(shell.includes(contract), `Platform Shell thiếu contract ${contract}`);
}

for (const page of ['index.html', 'tai-khoan.html', 'cong-cu-duoc-lam-sang.html']) {
  const source = fs.readFileSync(path.join(root, page), 'utf8');
  assert(source.includes('@supabase/supabase-js@2.112.3'), `${page} chưa pin supabase-js`);
  assert(source.includes('integrity="sha384-l8ah+VgaWtk1mvOe9VC+OirC6qHFF4yH7l7mKRidV9MSti3E9F463bMp6ZVN4kuC"'), `${page} thiếu SRI Supabase`);
}

console.log('Hub loading contract tests: OK');
