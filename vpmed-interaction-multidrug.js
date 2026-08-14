/* VPMED - Multi-drug interaction checker
 * File bổ sung độc lập, không sửa assets/unified.js.
 * Gắn sau assets/unified.js trong index.html.
 */
(function () {
  'use strict';

  const MAX_INITIAL_ROWS = 8;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
  }

  function norm(value) {
    return String(value == null ? '' : value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9+\-/ ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getInteractions() {
    return Array.isArray(window.VPMED_INTERACTIONS) ? window.VPMED_INTERACTIONS : [];
  }

  function getDrugs() {
    const sources = [window.VPMED_DRUGS, window.VPMED_APPROVED_DRUGS, window.VPMED_CLINICAL_DRUGS];
    return sources.find(Array.isArray) || [];
  }

  function splitDrugNames(text) {
    return String(text || '')
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  function drugAliasesFromInput(name) {
    const n = norm(name);
    if (!n) return [];
    const aliases = new Set([n]);
    getDrugs().forEach(d => {
      const values = [d.brand, d.brandName, d.name, d.drugName, d.active, d.activeIngredient, d.hoatChat, d.tenThuoc, d.tenBietDuoc]
        .filter(Boolean)
        .map(norm);
      if (values.some(v => v && (v === n || v.includes(n) || n.includes(v)))) {
        values.forEach(v => v && aliases.add(v));
      }
    });
    return Array.from(aliases);
  }

  function interactionText(item) {
    return [
      item.name, item.title, item.pair,
      item.drug1, item.drug2, item.active1, item.active2,
      item.a, item.b, item.first, item.second,
      Array.isArray(item.drugs) ? item.drugs.join(' ') : '',
      Array.isArray(item.actives) ? item.actives.join(' ') : ''
    ].filter(Boolean).join(' ');
  }

  function getPairTokens(item) {
    const directPairs = [
      [item.drug1, item.drug2],
      [item.active1, item.active2],
      [item.a, item.b],
      [item.first, item.second]
    ].filter(p => p[0] && p[1]);

    if (directPairs.length) {
      return directPairs.map(p => p.map(norm));
    }

    const arr = Array.isArray(item.drugs) ? item.drugs : (Array.isArray(item.actives) ? item.actives : null);
    if (arr && arr.length >= 2) {
      return [[norm(arr[0]), norm(arr[1])]];
    }

    const name = String(item.name || item.title || item.pair || '');
    const parts = name.split(/\s+[+–—-]\s+|\s+\/\s+|\s+với\s+|\s+va\s+|\s+và\s+/i).map(norm).filter(Boolean);
    if (parts.length >= 2) return [[parts[0], parts[1]]];

    return [];
  }

  function aliasesMatch(aliases, token) {
    const t = norm(token);
    if (!t) return false;
    return aliases.some(a => a === t || a.includes(t) || t.includes(a));
  }

  function itemMatchesPair(item, aliasesA, aliasesB) {
    const pairs = getPairTokens(item);
    if (pairs.length) {
      return pairs.some(([x, y]) =>
        (aliasesMatch(aliasesA, x) && aliasesMatch(aliasesB, y)) ||
        (aliasesMatch(aliasesA, y) && aliasesMatch(aliasesB, x))
      );
    }

    const text = norm(interactionText(item));
    const hitA = aliasesA.some(a => text.includes(a));
    const hitB = aliasesB.some(a => text.includes(a));
    return hitA && hitB;
  }

  function severityLabel(item) {
    const raw = String(item.level || item.severity || item.mucDo || item.status || item.type || '').trim();
    if (raw) return raw;
    const text = norm([item.name, item.title, item.consequence, item.management, item.note].filter(Boolean).join(' '));
    if (text.includes('chong chi dinh')) return 'Chống chỉ định';
    if (text.includes('tranh phoi hop') || text.includes('uu tien tranh')) return 'Ưu tiên tránh phối hợp';
    return 'Cần rà soát';
  }

  function makeResultRow(pair, item) {
    const severity = severityLabel(item);
    const consequence = item.consequence || item.hauQua || item.effect || item.risk || item.note || item.description || 'Cần kiểm tra và xử trí theo nguồn.';
    const management = item.management || item.xuTri || item.recommendation || item.action || item.note2 || '';
    const source = item.source || item.reference || item.ref || 'QD 5948/QĐ-BYT / dữ liệu hệ thống';
    return `<tr>
      <td><b>${esc(pair[0])}</b><br><span>+</span><br><b>${esc(pair[1])}</b></td>
      <td><span class="vpmed-md-badge">${esc(severity)}</span></td>
      <td>${esc(consequence)}</td>
      <td>${esc(management || 'Rà soát chỉ định, cân nhắc thay thế hoặc theo dõi sát theo mức độ nguy cơ.')}</td>
      <td>${esc(source)}</td>
    </tr>`;
  }

  function collectInputDrugs(root) {
    const values = Array.from(root.querySelectorAll('.vpmed-md-drug-input'))
      .map(el => el.value.trim())
      .filter(Boolean);
    const bulk = splitDrugNames(root.querySelector('#vpmedMultiDrugBulk')?.value || '');
    const merged = [];
    [...values, ...bulk].forEach(v => {
      if (!merged.some(x => norm(x) === norm(v))) merged.push(v);
    });
    return merged;
  }

  function checkMultiDrug(root) {
    const resultBox = root.querySelector('#vpmedMultiDrugResult');
    const drugs = collectInputDrugs(root);
    if (drugs.length < 2) {
      resultBox.innerHTML = '<div class="vpmed-md-empty">Nhập tối thiểu 2 thuốc để kiểm tra tương tác.</div>';
      return;
    }

    const interactions = getInteractions();
    const rows = [];
    const seen = new Set();
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const a = drugs[i], b = drugs[j];
        const aliasesA = drugAliasesFromInput(a);
        const aliasesB = drugAliasesFromInput(b);
        interactions.forEach(item => {
          if (itemMatchesPair(item, aliasesA, aliasesB)) {
            const key = `${norm(a)}|${norm(b)}|${norm(item.name || item.title || interactionText(item))}`;
            if (!seen.has(key)) {
              seen.add(key);
              rows.push(makeResultRow([a, b], item));
            }
          }
        });
      }
    }

    if (!rows.length) {
      resultBox.innerHTML = `<div class="vpmed-md-empty"><b>Chưa ghi nhận cặp chống chỉ định trong dữ liệu hiện có.</b><br>Cần tiếp tục đánh giá lâm sàng, liều dùng, chức năng thận/gan và nguồn cập nhật trước khi kết luận an toàn.</div>`;
      return;
    }

    resultBox.innerHTML = `<div class="vpmed-md-summary">Phát hiện <b>${rows.length}</b> cảnh báo từ <b>${drugs.length}</b> thuốc đã nhập.</div>
      <div class="vpmed-md-table-wrap"><table class="vpmed-md-table">
      <thead><tr><th>Cặp thuốc</th><th>Mức độ</th><th>Nguy cơ/hậu quả</th><th>Khuyến nghị xử trí</th><th>Nguồn</th></tr></thead>
      <tbody>${rows.join('')}</tbody></table></div>`;
  }

  function addDrugRow(root, value = '') {
    const list = root.querySelector('#vpmedMultiDrugRows');
    const count = list.querySelectorAll('.vpmed-md-row').length + 1;
    const row = document.createElement('div');
    row.className = 'vpmed-md-row';
    row.innerHTML = `<label>Thuốc ${count}<input class="vpmed-md-drug-input" type="text" placeholder="Ví dụ: Ceftriaxone, Calci clorid..." value="${esc(value)}"></label><button type="button" class="vpmed-md-remove" title="Xóa thuốc">×</button>`;
    row.querySelector('.vpmed-md-remove').onclick = () => row.remove();
    list.appendChild(row);
  }

  function renderMultiDrugPanel() {
    const view = document.querySelector('#view-interactions') || document.querySelector('[data-view="interactions"]') || document.querySelector('.interactions-view');
    if (!view || view.querySelector('#vpmedMultiDrugPanel')) return;

    const card = document.createElement('section');
    card.className = 'section-card vpmed-md-card';
    card.id = 'vpmedMultiDrugPanel';
    card.innerHTML = `<div class="section-heading"><div><span class="kicker">Kiểm tra nhiều thuốc</span><h2>Nhập danh sách thuốc đang dùng</h2><p>Hệ thống tự ghép từng cặp thuốc để rà soát tương tác/chống chỉ định trong dữ liệu hiện có.</p></div></div>
      <div class="vpmed-md-grid" id="vpmedMultiDrugRows"></div>
      <div class="vpmed-md-actions"><button type="button" class="btn btn-soft" id="vpmedAddDrugBtn">+ Thêm thuốc</button><button type="button" class="btn btn-primary" id="vpmedCheckMultiDrugBtn">Kiểm tra tất cả</button><button type="button" class="btn btn-soft" id="vpmedClearMultiDrugBtn">Xóa danh sách</button></div>
      <label class="vpmed-md-bulk-label">Dán nhanh nhiều thuốc <small>(mỗi dòng hoặc cách nhau bằng dấu phẩy)</small><textarea id="vpmedMultiDrugBulk" placeholder="Ví dụ:\nCeftriaxone\nCalci clorid\nWarfarin\nAmiodarone"></textarea></label>
      <div id="vpmedMultiDrugResult" class="vpmed-md-result"><div class="vpmed-md-empty">Nhập ít nhất 2 thuốc rồi bấm <b>Kiểm tra tất cả</b>.</div></div>`;

    const firstCard = view.querySelector('.section-card');
    if (firstCard && firstCard.parentNode) firstCard.parentNode.insertBefore(card, firstCard);
    else view.prepend(card);

    for (let i = 0; i < MAX_INITIAL_ROWS; i++) addDrugRow(card);
    card.querySelector('#vpmedAddDrugBtn').onclick = () => addDrugRow(card);
    card.querySelector('#vpmedCheckMultiDrugBtn').onclick = () => checkMultiDrug(card);
    card.querySelector('#vpmedClearMultiDrugBtn').onclick = () => {
      card.querySelectorAll('.vpmed-md-drug-input').forEach(el => el.value = '');
      card.querySelector('#vpmedMultiDrugBulk').value = '';
      card.querySelector('#vpmedMultiDrugResult').innerHTML = '<div class="vpmed-md-empty">Đã xóa danh sách. Nhập thuốc mới để kiểm tra.</div>';
    };
  }

  function injectStyle() {
    if (document.getElementById('vpmedMultiDrugStyle')) return;
    const style = document.createElement('style');
    style.id = 'vpmedMultiDrugStyle';
    style.textContent = `
      .vpmed-md-card{margin-top:18px;border:1px solid #bfdbfe;background:#fff;border-radius:22px;padding:26px;box-shadow:0 18px 45px rgba(15,23,42,.08)}
      .vpmed-md-card .section-heading{margin-bottom:18px}.vpmed-md-card h2{margin:4px 0 6px;color:#004477}.vpmed-md-card p{margin:0;color:#48627f}
      .vpmed-md-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:16px 0}.vpmed-md-row{display:flex;gap:8px;align-items:end}.vpmed-md-row label{flex:1;font-weight:700;color:#14324b}.vpmed-md-row input{width:100%;border:1px solid #bcd0e5;border-radius:14px;padding:13px 14px;margin-top:6px;font-size:15px}.vpmed-md-remove{border:0;background:#fee2e2;color:#991b1b;border-radius:12px;width:42px;height:42px;font-size:22px;font-weight:800;cursor:pointer}.vpmed-md-actions{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 16px}.vpmed-md-bulk-label{display:block;font-weight:700;color:#14324b}.vpmed-md-bulk-label small{font-weight:500;color:#64748b}.vpmed-md-bulk-label textarea{width:100%;min-height:88px;border:1px solid #bcd0e5;border-radius:16px;padding:13px 14px;margin-top:7px;font-size:15px;resize:vertical}.vpmed-md-result{margin-top:16px}.vpmed-md-empty{border:1px dashed #bcd0e5;background:#f8fbff;border-radius:16px;padding:18px;color:#334155}.vpmed-md-summary{background:#ecfdf5;border:1px solid #99f6e4;border-left:6px solid #0f8b7e;border-radius:16px;padding:14px 16px;margin-bottom:12px;color:#064e3b}.vpmed-md-table-wrap{overflow:auto;border:1px solid #d9e6f2;border-radius:18px}.vpmed-md-table{width:100%;border-collapse:collapse;background:#fff}.vpmed-md-table th,.vpmed-md-table td{padding:13px 14px;border-bottom:1px solid #e5eef8;text-align:left;vertical-align:top}.vpmed-md-table th{background:#eaf6ff;color:#004477}.vpmed-md-badge{display:inline-block;background:#fee2e2;color:#991b1b;border-radius:999px;padding:5px 10px;font-weight:800;font-size:13px}@media(max-width:760px){.vpmed-md-grid{grid-template-columns:1fr}.vpmed-md-card{padding:18px}.vpmed-md-row{align-items:center}}`;
    document.head.appendChild(style);
  }

  function boot() {
    injectStyle();
    renderMultiDrugPanel();
    document.addEventListener('click', function () {
      setTimeout(renderMultiDrugPanel, 80);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
