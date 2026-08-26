(function serviceMedicinesModule(){
  'use strict';

  const data=Array.isArray(window.VPMED_SERVICE_MEDICINES_20260818)?window.VPMED_SERVICE_MEDICINES_20260818:[];
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const norm=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();

  function typeClass(type){
    if(type==='Mỹ phẩm')return 'type-cosmetic';
    if(type==='Thiết bị y tế')return 'type-device';
    if(type==='Thực phẩm bảo vệ sức khỏe')return 'type-supplement';
    return 'type-drug';
  }

  function populateFilters(){
    const typeSelect=$('#serviceType');
    const routeSelect=$('#serviceRoute');
    if(typeSelect){
      const types=[...new Set(data.map(item=>item.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
      typeSelect.innerHTML='<option value="">Tất cả loại</option>'+types.map(type=>`<option value="${esc(type)}">${esc(type)}</option>`).join('');
    }
    if(routeSelect){
      const routes=[...new Set(data.map(item=>item.route).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
      routeSelect.innerHTML='<option value="">Tất cả đường dùng</option>'+routes.map(route=>`<option value="${esc(route)}">${esc(route)}</option>`).join('');
    }
  }

  function filteredItems(){
    const q=norm($('#serviceSearch')?.value||'');
    const type=$('#serviceType')?.value||'';
    const route=$('#serviceRoute')?.value||'';
    return data.filter(item=>{
      if(type&&item.type!==type)return false;
      if(route&&item.route!==route)return false;
      if(!q)return true;
      return norm([item.name,item.active,item.route,item.strength,item.type].join(' ')).includes(q);
    });
  }

  function render(){
    const body=$('#serviceRows');
    if(!body)return;
    const items=filteredItems();
    body.innerHTML=items.length?items.map(item=>`
      <tr>
        <td><span class="service-name">${esc(item.name)}</span></td>
        <td class="service-active">${esc(item.active)}</td>
        <td>${esc(item.route)}</td>
        <td>${esc(item.strength)}</td>
        <td><span class="service-badge ${typeClass(item.type)}">${esc(item.type)}</span></td>
      </tr>`).join(''):'<tr><td colspan="5" class="service-empty">Không tìm thấy mặt hàng phù hợp.</td></tr>';
  }

  function clearFilters(){
    const search=$('#serviceSearch');
    const type=$('#serviceType');
    const route=$('#serviceRoute');
    if(search)search.value='';
    if(type)type.value='';
    if(route)route.value='';
    render();
    search?.focus();
  }

  function init(){
    if(!$('#view-service-medicines'))return;
    populateFilters();
    render();
    ['#serviceSearch','#serviceType','#serviceRoute'].forEach(selector=>$(selector)?.addEventListener(selector==='#serviceSearch'?'input':'change',render));
    $('#serviceClear')?.addEventListener('click',clearFilters);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
