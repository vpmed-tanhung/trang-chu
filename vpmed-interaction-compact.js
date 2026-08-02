/* VPMED - Giữ giao diện kiểm tra tương tác nhiều thuốc ở dạng gọn.
   Mục tiêu:
   - Không đụng assets/unified.js.
   - Không tạo 8 ô thuốc sau khi reset/tải lại.
   - Chỉ giữ 1 ô dán danh sách thuốc như giao diện gọn.
*/
(function () {
  const SECTION_ID = 'vpmed-multidrug-compact-section';
  const TEXTAREA_ID = 'vpmedMultiDrugTextarea';
  const RESULT_ID = 'vpmedMultiDrugResult';

  function norm(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function getInteractions() {
    return window.VPMED_INTERACTIONS || window.INTERACTIONS || window.interactions || [];
  }

  function getDrugNamesFromText(text) {
    return String(text || '')
      .split(/\n|,|;|\+/)
      .map(s => s.trim())
      .filter(Boolean)
      .filter((v, i, arr) => arr.findIndex(x => norm(x) === norm(v)) === i);
  }

  function interactionText(item) {
    return [
      item.name,
      item.pair,
      item.drugs,
      item.drug1,
      item.drug2,
      item.a,
      item.b,
      item.active1,
      item.active2,
      item.active,
      item.other,
      item.consequence,
      item.level,
      item.note,
      item.management,
      item.mechanism
    ].filter(Boolean).join(' ');
  }

  function isPairMatch(item, a, b) {
    const t = norm(interactionText(item));
    const na = norm(a);
    const nb = norm(b);
    if (!na || !nb || !t) return false;
    return t.includes(na) && t.includes(nb);
  }

  function resultHtml(matches, totalPairs) {
    if (!matches.length) {
      return `
        <div class="vpmed-md-empty">
          <b>Chưa ghi nhận cặp chống chỉ định trong dữ liệu hiện có.</b><br>
          Cần tiếp tục đánh giá lâm sàng, liều dùng, chức năng thận/gan và nguồn cập nhật trước khi kết luận an toàn.
        </div>`;
    }

    const rows = matches.map((m, idx) => {
      const i = m.item || {};
      const title = i.name || i.pair || `${m.a} + ${m.b}`;
      const level = i.level || i.severity || 'Cần rà soát';
      const consequence = i.consequence || i.effect || i.note || '';
      const management = i.management || i.recommendation || i.handle || i.action || '';
      const mechanism = i.mechanism || i.reason || '';
      return `
        <div class="vpmed-md-hit">
          <div class="vpmed-md-hit-title">#${idx + 1} ${escapeHtml(title)}</div>
          <div><b>Mức độ:</b> ${escapeHtml(level)}</div>
          ${consequence ? `<div><b>Hậu quả:</b> ${escapeHtml(consequence)}</div>` : ''}
          ${mechanism ? `<div><b>Cơ chế:</b> ${escapeHtml(mechanism)}</div>` : ''}
          ${management ? `<div><b>Xử trí:</b> ${escapeHtml(management)}</div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="vpmed-md-summary">
        Phát hiện <b>${matches.length}</b> cảnh báo trong <b>${totalPairs}</b> cặp đã ghép.
      </div>
      ${rows}`;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function checkAll() {
    const ta = document.getElementById(TEXTAREA_ID);
    const result = document.getElementById(RESULT_ID);
    if (!ta || !result) return;

    const drugs = getDrugNamesFromText(ta.value);
    if (drugs.length < 2) {
      result.innerHTML = 'Nhập ít nhất 2 thuốc rồi bấm <b>Kiểm tra tất cả</b>.';
      return;
    }

    const data = getInteractions();
    const matches = [];
    let totalPairs = 0;

    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        totalPairs++;
        const a = drugs[i];
        const b = drugs[j];
        data.forEach(item => {
          if (isPairMatch(item, a, b)) matches.push({ a, b, item });
        });
      }
    }

    result.innerHTML = resultHtml(matches, totalPairs);
  }

  function clearAll() {
    const ta = document.getElementById(TEXTAREA_ID);
    const result = document.getElementById(RESULT_ID);
    if (ta) ta.value = '';
    if (result) result.innerHTML = 'Nhập ít nhất 2 thuốc rồi bấm <b>Kiểm tra tất cả</b>.';
  }

  function addDrugLine() {
    const ta = document.getElementById(TEXTAREA_ID);
    if (!ta) return;
    ta.focus();
    if (ta.value.trim()) {
      if (!ta.value.endsWith('\n')) ta.value += '\n';
    }
  }

  function buildCompactSection() {
    return `
      <section class="section-card" id="${SECTION_ID}">
        <div class="section-heading">
          <div>
            <span class="kicker">KIỂM TRA NHIỀU THUỐC</span>
            <h2>Nhập danh sách thuốc đang dùng</h2>
            <p>Hệ thống tự ghép từng cặp thuốc để rà soát tương tác/chống chỉ định trong dữ liệu hiện có.</p>
          </div>
        </div>

        <div class="vpmed-md-actions">
          <button type="button" class="btn btn-soft" id="vpmedMdAdd">+ Thêm thuốc</button>
          <button type="button" class="btn btn-primary" id="vpmedMdCheck">Kiểm tra tất cả</button>
          <button type="button" class="btn btn-soft" id="vpmedMdClear">Xóa danh sách</button>
        </div>

        <label class="search-wide vpmed-md-label">
          Dán nhanh nhiều thuốc <small>(mỗi dòng hoặc cách nhau bằng dấu phẩy)</small>
          <textarea id="${TEXTAREA_ID}" rows="4" placeholder="Ví dụ:
Ceftriaxone
Calci clorid
Warfarin"></textarea>
        </label>

        <div class="result" id="${RESULT_ID}">Nhập ít nhất 2 thuốc rồi bấm <b>Kiểm tra tất cả</b>.</div>
      </section>`;
  }

  function applyStyles() {
    if (document.getElementById('vpmed-md-compact-style')) return;
    const style = document.createElement('style');
    style.id = 'vpmed-md-compact-style';
    style.textContent = `
      #${SECTION_ID} textarea {
        width: 100%;
        min-height: 96px;
        resize: vertical;
        border: 1px solid #b9d3e8;
        border-radius: 14px;
        padding: 14px;
        font: inherit;
        background: #fff;
        box-sizing: border-box;
      }
      .vpmed-md-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin: 16px 0 14px;
      }
      .vpmed-md-label small {
        color: #64748b;
        font-weight: 500;
      }
      .vpmed-md-empty {
        line-height: 1.55;
      }
      .vpmed-md-summary {
        padding: 12px 14px;
        margin-bottom: 10px;
        border-radius: 12px;
        background: #ecfeff;
        border: 1px solid #a5f3fc;
      }
      .vpmed-md-hit {
        padding: 12px 14px;
        margin: 10px 0;
        border: 1px solid #dbeafe;
        border-radius: 14px;
        background: #ffffff;
        line-height: 1.55;
      }
      .vpmed-md-hit-title {
        font-weight: 800;
        color: #075985;
        margin-bottom: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  function removeOldMultiDrugPanels(view) {
    // Xóa các panel do bản trước tạo ra để không quay lại 8 ô sau reset/tải lại.
    const candidates = Array.prototype.slice.call(view.querySelectorAll('section.section-card'));
    candidates.forEach(section => {
      const text = (section.textContent || '').toLowerCase();
      const hasMulti = text.includes('kiểm tra nhiều thuốc') || text.includes('kiem tra nhieu thuoc');
      const hasList = text.includes('nhập danh sách thuốc đang dùng') || text.includes('nhap danh sach thuoc dang dung');
      if (hasMulti || hasList) section.remove();
    });
  }

  function mount() {
    const view = document.getElementById('view-interactions');
    if (!view) return;

    applyStyles();

    // Nếu đã có section compact đúng rồi thì chỉ gắn lại event.
    const existing = document.getElementById(SECTION_ID);
    if (existing) {
      bindEvents();
      return;
    }

    removeOldMultiDrugPanels(view);

    const title = view.querySelector('.page-title');
    if (title) {
      title.insertAdjacentHTML('afterend', buildCompactSection());
    } else {
      view.insertAdjacentHTML('afterbegin', buildCompactSection());
    }

    bindEvents();
  }

  function bindEvents() {
    const add = document.getElementById('vpmedMdAdd');
    const check = document.getElementById('vpmedMdCheck');
    const clear = document.getElementById('vpmedMdClear');

    if (add && !add.dataset.bound) {
      add.dataset.bound = '1';
      add.addEventListener('click', addDrugLine);
    }
    if (check && !check.dataset.bound) {
      check.dataset.bound = '1';
      check.addEventListener('click', checkAll);
    }
    if (clear && !clear.dataset.bound) {
      clear.dataset.bound = '1';
      clear.addEventListener('click', clearAll);
    }
  }

  function scheduleMount() {
    setTimeout(mount, 30);
    setTimeout(mount, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleMount);
  } else {
    scheduleMount();
  }

  document.addEventListener('click', scheduleMount);
})();
