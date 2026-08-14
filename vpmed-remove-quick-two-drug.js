/* VPMED - Xóa khung "Kiểm tra nhanh / Nhập hai thuốc cần kiểm tra"
   Không sửa assets/unified.js, không đụng dữ liệu, không ảnh hưởng tính liều.
*/
(function () {
  function removeQuickTwoDrugPanel() {
    try {
      var view = document.getElementById('view-interactions');
      if (!view) return;

      var sections = Array.prototype.slice.call(view.querySelectorAll('section.section-card'));
      sections.forEach(function (section) {
        var text = (section.textContent || '').toLowerCase();
        var hasQuickTitle = text.indexOf('kiểm tra nhanh') !== -1 || text.indexOf('kiem tra nhanh') !== -1;
        var hasTwoDrugTitle = text.indexOf('nhập hai thuốc cần kiểm tra') !== -1 || text.indexOf('nhap hai thuoc can kiem tra') !== -1;

        if (hasQuickTitle && hasTwoDrugTitle) {
          section.remove();
        }
      });
    } catch (e) {
      console.warn('Không xóa được khung kiểm tra nhanh:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeQuickTwoDrugPanel);
  } else {
    removeQuickTwoDrugPanel();
  }

  document.addEventListener('click', function () {
    setTimeout(removeQuickTwoDrugPanel, 50);
  });
})();
