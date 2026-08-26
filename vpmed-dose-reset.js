/* VPMED - Thêm nút reset cho mục tính liều kháng sinh.
   Không sửa assets/unified.js.
*/
(function () {
  function resetDoseForm() {
    const ids = ['patientCode', 'age', 'wt', 'ht', 'sex', 'scr', 'drug'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const dialysis = document.getElementById('dialysis');
    if (dialysis) {
      dialysis.checked = false;
      dialysis.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const output = document.getElementById('output');
    if (output) {
      output.className = 'empty-state';
      output.innerHTML = '<div>🧪</div><b>Chưa có kết quả</b><span>Nhập tuổi, cân nặng, creatinine và chọn kháng sinh để bắt đầu.</span>';
    }

    const first = document.getElementById('patientCode');
    if (first) first.focus();
  }

  function mountResetButton() {
    const calc = document.getElementById('calc');
    if (!calc || document.getElementById('doseResetBtn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'doseResetBtn';
    btn.className = 'btn btn-soft full';
    btn.textContent = 'Reset / nhập ca mới';
    btn.style.marginTop = '10px';
    btn.addEventListener('click', resetDoseForm);

    calc.insertAdjacentElement('afterend', btn);
  }

  function scheduleMount() {
    setTimeout(mountResetButton, 50);
    setTimeout(mountResetButton, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleMount);
  } else {
    scheduleMount();
  }

  document.addEventListener('click', scheduleMount);
})();
