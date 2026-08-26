(function(){
  'use strict';
  const data=Array.isArray(window.VPMED_INJECTABLES)?window.VPMED_INJECTABLES:[];
  const root=document.getElementById('injectableGuide');
  if(!root)return;
  const input=root.querySelector('#injectableSearch');
  const clear=root.querySelector('#injectableClear');
  const suggestions=root.querySelector('#injectableSuggestions');
  const output=root.querySelector('#injectableOutput');
  let visible=[];
  let activeIndex=-1;

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const norm=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();
  const guideRows=data.filter(item=>item.reference);
  const cold=guideRows.filter(item=>item.reference.cold).length;
  const light=guideRows.filter(item=>item.reference.light).length;
  const incompat=guideRows.filter(item=>item.reference.incompatibilities).length;

  function welcome(){
    output.innerHTML=`<div class="injectable-welcome">
      <div class="injectable-welcome-icon" aria-hidden="true">💉</div>
      <h2>Tra Cứu Thuốc Tiêm</h2>
      <p>Nhập tên biệt dược, hoạt chất, hàm lượng hoặc mã thuốc để tra cứu hướng dẫn pha và bảo quản.</p>
      <div class="injectable-stats">
        <div class="injectable-stat"><strong>${data.length}</strong><span>Thuốc tiêm</span></div>
        <div class="injectable-stat is-cold"><strong>${cold}</strong><span>Có mốc 2–8°C</span></div>
        <div class="injectable-stat is-light"><strong>${light}</strong><span>Tránh ánh sáng</span></div>
        <div class="injectable-stat is-incompat"><strong>${incompat}</strong><span>Có tương kỵ</span></div>
      </div>
    </div>`;
  }

  function routeLabel(route){
    const labels={TTM:'Truyền tĩnh mạch',TM:'Tiêm tĩnh mạch',TB:'Tiêm bắp',TDD:'Tiêm dưới da'};
    return labels[route]||route;
  }

  function badges(item){
    const ref=item.reference;
    const rows=[`<span class="injectable-badge">${esc(item.duongDung||'Đường tiêm')}</span>`];
    if(ref){
      rows.push(item.matchType==='exact'?'<span class="injectable-badge is-verified">Đúng tên + hàm lượng</span>':'<span class="injectable-badge is-reference">Tham khảo cùng hoạt chất + hàm lượng</span>');
      if(ref.cold)rows.push('<span class="injectable-badge is-cold">❄ Có mốc 2–8°C</span>');
      if(ref.light)rows.push('<span class="injectable-badge is-light">☀ Tránh ánh sáng</span>');
      if(ref.incompatibilities)rows.push('<span class="injectable-badge is-incompat">⚠ Có tương kỵ</span>');
    }
    return rows.join('');
  }

  function row(label,value,cls=''){
    if(!value)return'';
    return `<div class="injectable-row ${cls}"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
  }

  function renderItem(item){
    const ref=item.reference;
    const scopeWarning=ref&&item.matchType==='active_reference'?'<div class="injectable-reference-warning"><b>Lưu ý:</b> Nội dung dưới đây lấy từ thuốc cùng hoạt chất và hàm lượng/nồng độ trong bộ dữ liệu gốc, nhưng khác tên sản phẩm. Phải đối chiếu tờ hướng dẫn sử dụng của đúng chế phẩm trước khi áp dụng.</div>':'';
    const referenceContent=ref?`${scopeWarning}<dl class="injectable-sections">
      ${row('Dạng bào chế',ref.dosageForm)}
      ${row('Đường dùng',Array.isArray(ref.routes)?ref.routes.map(routeLabel).join(' · '):'')}
      ${row('Hướng dẫn pha và sử dụng',ref.reconstitution)}
      ${row('Bảo quản',ref.storage,'is-storage')}
      ${row('Tương kỵ',ref.incompatibilities,'is-warning')}
      ${row('Chú ý đặc biệt',ref.notes)}
    </dl>
    <div class="injectable-source-note"><b>Nội dung lấy từ hồ sơ trong bộ dữ liệu gốc:</b> ${esc(ref.tradeName)} · ${esc(ref.activeIngredient)} · ${esc(ref.strength)}${ref.manufacturer?` · ${esc(ref.manufacturer)}`:''}. Phải kiểm tra lại tờ hướng dẫn sử dụng của đúng chế phẩm, hàm lượng và dạng bào chế trước khi áp dụng.</div>`:
    `<div class="injectable-missing"><h3>Chưa có hướng dẫn pha/bảo quản đã đối chiếu</h3><p>Thuốc này có trong kho nội trú nhưng chưa tìm được hồ sơ nguồn phù hợp đủ chắc chắn. Không tự suy diễn từ thuốc cùng hoạt chất hoặc khác hàm lượng; hãy tra tờ hướng dẫn sử dụng của đúng chế phẩm.</p></div>`;
    output.innerHTML=`<div class="injectable-result-count">Đang hiển thị 1 thuốc trong danh mục ${data.length} thuốc tiêm kho nội trú</div>
      <article class="injectable-card">
        <header class="injectable-card-head">
          <div class="injectable-card-top"><div><h2>${esc(item.tenThuoc)}</h2><div class="injectable-meta">${esc(item.hoatChat)}${item.hamLuong?` · ${esc(item.hamLuong)}`:''}</div></div><span class="injectable-code">${esc(item.maThuoc)}</span></div>
          <div class="injectable-badges">${badges(item)}</div>
        </header>
        <div class="injectable-stock-grid">
          <div class="injectable-stock-item"><span>Hàm lượng</span><b>${esc(item.hamLuong||'—')}</b></div>
          <div class="injectable-stock-item"><span>Đường dùng</span><b>${esc(item.duongDung||'—')}</b></div>
          <div class="injectable-stock-item"><span>Quy cách</span><b>${esc(item.quyCach||'—')}</b></div>
        </div>
        ${referenceContent}
      </article>`;
  }

  function search(query){
    const key=norm(query);
    if(!key)return[];
    return data.map(item=>{
      const fields=[item.tenThuoc,item.hoatChat,item.hamLuong,item.maThuoc,item.duongDung];
      const haystack=norm(fields.join(' '));
      let score=haystack.includes(key)?20:0;
      if(norm(item.tenThuoc).startsWith(key))score+=50;
      else if(norm(item.tenThuoc).includes(key))score+=35;
      if(norm(item.hoatChat).startsWith(key))score+=28;
      if(norm(item.maThuoc)===key)score+=80;
      return {item,score};
    }).filter(row=>row.score>0).sort((a,b)=>b.score-a.score||String(a.item.tenThuoc).localeCompare(String(b.item.tenThuoc),'vi')).map(row=>row.item);
  }

  function renderSuggestions(){
    const query=input.value.trim();
    clear.hidden=!query;
    if(!query){suggestions.hidden=true;visible=[];activeIndex=-1;welcome();return;}
    visible=search(query).slice(0,14);
    activeIndex=-1;
    suggestions.innerHTML=visible.length?visible.map(item=>`<button type="button" class="injectable-option ${item.reference?'has-guide':''}" data-id="${item.id}"><b>${esc(item.tenThuoc)}</b><small>${esc(item.hoatChat)} · ${esc(item.hamLuong)}</small><span class="injectable-option-code">${item.matchType==='exact'?'Đúng chế phẩm':item.matchType==='active_reference'?'Cùng hoạt chất':esc(item.maThuoc)}</span></button>`).join(''):'<div class="injectable-empty-option">Không tìm thấy thuốc phù hợp trong kho nội trú.</div>';
    suggestions.hidden=false;
  }

  function select(item){
    if(!item)return;
    input.value=item.tenThuoc;
    clear.hidden=false;
    suggestions.hidden=true;
    renderItem(item);
    output.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function setActive(next){
    const options=[...suggestions.querySelectorAll('.injectable-option')];
    if(!options.length)return;
    activeIndex=(next+options.length)%options.length;
    options.forEach((option,index)=>option.classList.toggle('is-active',index===activeIndex));
    options[activeIndex].scrollIntoView({block:'nearest'});
  }

  input.addEventListener('input',renderSuggestions);
  input.addEventListener('focus',()=>{if(input.value.trim())renderSuggestions()});
  input.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();setActive(activeIndex+1)}
    else if(event.key==='ArrowUp'){event.preventDefault();setActive(activeIndex-1)}
    else if(event.key==='Enter'){event.preventDefault();select(visible[activeIndex>=0?activeIndex:0])}
    else if(event.key==='Escape'){suggestions.hidden=true}
  });
  suggestions.addEventListener('mousedown',event=>{
    const option=event.target.closest('.injectable-option');
    if(!option)return;
    event.preventDefault();
    select(data.find(item=>String(item.id)===option.dataset.id));
  });
  clear.addEventListener('click',()=>{input.value='';clear.hidden=true;suggestions.hidden=true;welcome();input.focus()});
  document.addEventListener('click',event=>{if(!root.querySelector('.injectable-search-wrap').contains(event.target))suggestions.hidden=true});
  welcome();
})();
