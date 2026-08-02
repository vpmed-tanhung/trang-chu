/*
  VPMED - Home admin tile only
  Chỉ hiển thị thẻ "Cập nhật dữ liệu chuyên môn" ở TRANG CHỦ.
  Khi mở các ứng dụng chính, thẻ này sẽ tự ẩn để không gây thừa giao diện.
*/
(function(){
  'use strict';

  const TILE_ID = 'clinicalAdminEntry';
  const WRAP_ID = 'clinicalAdminEntryWrap';

  function isAdminPage(){ return /cap-nhat-du-lieu\.html/i.test(location.pathname); }
  function isHome(){
    const h = (location.hash || '').replace('#','').trim().toLowerCase();
    return !h || h === 'home' || h === 'trang-chu';
  }

  function addStyles(){
    if(document.getElementById('vpmedAdminTileStyle')) return;
    const st = document.createElement('style');
    st.id = 'vpmedAdminTileStyle';
    st.textContent = `
      .vpmed-admin-tile{display:flex!important;align-items:flex-start;gap:14px;text-decoration:none!important;color:inherit!important;background:linear-gradient(135deg,#f0fdfa 0%,#eff6ff 55%,#ffffff 100%);border:1px solid #bfe7e1;border-radius:22px;padding:18px;box-shadow:0 14px 34px rgba(15,118,110,.10);min-height:110px;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;box-sizing:border-box;position:relative;overflow:hidden}
      .vpmed-admin-tile:before{content:"";position:absolute;right:-36px;top:-36px;width:120px;height:120px;border-radius:999px;background:rgba(15,118,110,.08)}
      .vpmed-admin-tile:hover{transform:translateY(-3px);box-shadow:0 18px 42px rgba(15,118,110,.18);border-color:#14b8a6}
      .vpmed-admin-icon{width:72px;height:52px;border-radius:16px;background:#fff;display:grid;place-items:center;box-shadow:0 10px 20px rgba(15,118,110,.14);flex:0 0 auto;padding:6px;border:1px solid #dbeafe}.vpmed-admin-icon img{max-width:100%;max-height:100%;object-fit:contain;display:block}
      .vpmed-admin-body{position:relative;z-index:1}.vpmed-admin-title{font-size:17px;font-weight:900;color:#075985;margin-bottom:7px;line-height:1.25}.vpmed-admin-desc{font-size:13px;line-height:1.5;color:#475569;margin-bottom:12px}.vpmed-admin-pill{display:inline-flex;align-items:center;border-radius:999px;background:#dcfce7;color:#166534;border:1px solid #86efac;padding:6px 10px;font-size:12px;font-weight:900}.vpmed-admin-entry-wrap{max-width:1180px;margin:22px auto;padding:0 16px}.vpmed-admin-grid-host .vpmed-admin-tile{margin:0}
      @media(max-width:720px){.vpmed-admin-tile{min-height:auto;padding:15px}.vpmed-admin-icon{width:64px;height:46px;border-radius:14px}}
    `;
    document.head.appendChild(st);
  }

  function removeTile(){
    const tile = document.getElementById(TILE_ID);
    if(tile) tile.remove();
    const wrap = document.getElementById(WRAP_ID);
    if(wrap) wrap.remove();
  }

  function createTile(){
    const a = document.createElement('a');
    a.id = TILE_ID;
    a.href = 'cap-nhat-du-lieu.html';
    a.className = 'vpmed-admin-tile';
    a.innerHTML = `
      <div class="vpmed-admin-icon"><img src="assets/logo-vpmed.png" alt="VPMED"></div>
      <div class="vpmed-admin-body">
        <div class="vpmed-admin-title">Cập nhật dữ liệu chuyên môn</div>
        <div class="vpmed-admin-desc">Khu vực nghiệp vụ dành cho nhân viên Khoa Dược cập nhật, đối chiếu và quản lý dữ liệu chuyên môn.</div>
        <span class="vpmed-admin-pill">Đăng nhập</span>
      </div>`;
    return a;
  }

  function findHomeGrid(){
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
    const h = headings.find(x => /ứng dụng chính|ung dung chinh|chọn công cụ|chon cong cu|công cụ cần sử dụng|cong cu can su dung/i.test((x.textContent||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')));
    if(h){
      const section = h.closest('section,.section,.container,main,article,div') || h.parentElement;
      const grid = section && section.querySelector('.app-grid,.apps-grid,.tools-grid,.tool-grid,.module-grid,.home-grid,.cards,.grid');
      if(grid && grid.offsetParent !== null) return grid;
    }
    return Array.from(document.querySelectorAll('.app-grid,.apps-grid,.tools-grid,.tool-grid,.module-grid,.home-grid,.cards,.grid'))
      .find(el => el.offsetParent !== null && el.children.length >= 2) || null;
  }

  function render(){
    if(isAdminPage() || !isHome()) { removeTile(); return; }
    addStyles();
    if(document.getElementById(TILE_ID)) return;
    const tile = createTile();
    const grid = findHomeGrid();
    if(grid){
      grid.appendChild(tile);
      grid.classList.add('vpmed-admin-grid-host');
    }else{
      const wrap = document.createElement('section');
      wrap.id = WRAP_ID;
      wrap.className = 'vpmed-admin-entry-wrap';
      wrap.appendChild(tile);
      const main = document.querySelector('main') || document.querySelector('.container') || document.body;
      main.appendChild(wrap);
    }
  }

  function scheduleRender(){ setTimeout(render, 80); setTimeout(render, 500); }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleRender); else scheduleRender();
  window.addEventListener('hashchange', scheduleRender);
  window.addEventListener('popstate', scheduleRender);
  document.addEventListener('click', () => setTimeout(render, 250), true);
})();
