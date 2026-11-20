/* Biên tập nội dung trang chủ qua quyền được xác nhận trên Supabase. */
(() => {
  'use strict';

  const home = document.getElementById('view-home');
  const masthead = home.querySelector('.home-masthead-inner');
  const quickInfo = home.querySelector('.home-quick-panel');
  const functions = document.getElementById('chuc-nang');
  const contact = document.getElementById('lien-he');
  const prioritySections = ['cong-cu-lam-sang', 'danh-muc-tai-lieu', 'ban-tin'].map(id => document.getElementById(id));
  const phoneLayout = window.matchMedia('(max-width: 720px)');

  function arrangeHome() {
    const focused = document.activeElement;
    const anchor = phoneLayout.matches ? functions : contact;
    prioritySections.forEach(section => home.insertBefore(section, anchor));
    if (phoneLayout.matches) home.insertBefore(quickInfo, functions);
    else masthead.append(quickInfo);
    if (focused && document.activeElement !== focused) focused.focus({preventScroll: true});
  }

  if (phoneLayout.matches) arrangeHome();
  phoneLayout.addEventListener('change', arrangeHome);

  const toolsSection = prioritySections[0];
  const toolsToggle = toolsSection.querySelector('.home-tools-toggle');
  toolsSection.classList.add('home-tools-collapsible');
  toolsToggle.hidden = false;
  toolsToggle.addEventListener('click', () => {
    const expanded = toolsSection.classList.toggle('home-tools-expanded');
    toolsToggle.setAttribute('aria-expanded', String(expanded));
    toolsToggle.textContent = expanded ? 'Thu gọn công cụ' : 'Xem tất cả công cụ';
  });

  const groups = {
    intro: [['heroTitle','Tiêu đề giới thiệu',240],['heroLead','Nội dung giới thiệu',1800]],
    quick: [['summerHours','Giờ làm việc mùa hè',80],['winterHours','Giờ làm việc mùa đông',80],['workingDays','Ngày làm việc',100],['location','Vị trí khoa',240],['headName','Trưởng khoa',150],['phone','Điện thoại trực thường trú',40]],
    functions: [['functionsTitle','Tiêu đề phần chức năng',150],['functionsLead','Giới thiệu chức năng',1200]],
    organization: [['organizationTitle','Tiêu đề cơ cấu tổ chức',150],['organizationLead','Giới thiệu cơ cấu',1200]],
    headings: [['toolsTitle','Tiêu đề công cụ lâm sàng',150],['toolsLead','Giới thiệu công cụ',800],['libraryTitle','Tiêu đề thư viện tài liệu',150],['bulletinTitle','Tiêu đề bản tin',150]],
    contact: [['contactTitle','Tên đơn vị liên hệ',200],['address','Địa chỉ',500],['contactEmail','Email liên hệ',200],['hotline','Số tổng đài',40],['phone','Điện thoại trực thường trú',40],['contactPerson','Người liên hệ',150]]
  };
  for(let i=1;i<=6;i++) groups.functions.push([`function${i}Title`,`Nhiệm vụ ${i} · Tên`,180],[`function${i}Body`,`Nhiệm vụ ${i} · Nội dung`,1600]);
  for(let i=1;i<=4;i++) groups.organization.push([`unit${i}Title`,`Đơn vị ${i} · Tên`,180],[`unit${i}Body`,`Đơn vị ${i} · Nội dung`,1600]);
  const specs=new Map(Object.values(groups).flat().map(spec=>[spec[0],spec]));
  const defaults={};
  document.querySelectorAll('[data-home-content]').forEach(el=>{if(specs.has(el.dataset.homeContent))defaults[el.dataset.homeContent]=el.textContent;});
  const dialog=document.getElementById('home-content-dialog');
  const form=document.getElementById('home-content-form');
  const section=document.getElementById('home-content-group');
  const fields=document.getElementById('home-content-fields');
  const message=document.getElementById('home-content-message');
  let auth=null, saved={}, draft={}, revision=0, loaded=false, busy=false, activeGroup='intro', sequence=0;
  const permitted=()=>auth?.canEditContent===true && auth?.profile?.status==='approved';
  function syncControls() {
    document.querySelectorAll('[data-home-edit]').forEach(button=>{button.hidden=!permitted() || !loaded;});
    if(!permitted() && dialog.open && !busy)dialog.close();
  }
  function applyContent() {
    const content={...defaults,...saved};
    document.querySelectorAll('[data-home-content]').forEach(el=>{
      const value=content[el.dataset.homeContent];
      if(typeof value==='string' && specs.has(el.dataset.homeContent)) el.textContent=value;
    });
    for(const [selector,key] of [['[data-home-phone]','phone'],['[data-home-hotline]','hotline']]) {
      document.querySelectorAll(selector).forEach(el=>el.href='tel:'+String(content[key]).replace(/[^+\d]/g,''));
    }
    document.querySelectorAll('[data-home-email]').forEach(el=>el.href='mailto:'+content.contactEmail);
  }
  async function loadContent() {
    if(!auth?.client || dialog.open)return;
    const current=++sequence;
    try {
      const result=await auth.client.from('pharmacy_site_content').select('content,revision').eq('id','homepage').single();
      if(current!==sequence)return;
      if(result.error)throw result.error;
      saved=Object.fromEntries(Object.entries(result.data.content||{}).filter(([key,value])=>specs.has(key)&&typeof value==='string'));
      revision=result.data.revision; loaded=true; applyContent();
    } catch(error) {
      loaded=false;
      if(permitted())window.VPMED_PLATFORM?.toast('Chưa tải được nội dung để chỉnh sửa. Vui lòng tải lại trang.',{tone:'warning'});
    } finally {if(current===sequence)syncControls();}
  }
  function collectDraft() {
    fields.querySelectorAll('[data-home-input]').forEach(input=>{draft[input.dataset.homeInput]=input.value.trim();});
  }
  function renderFields() {
    fields.replaceChildren();
    for(const [key,label,max] of groups[activeGroup]) {
      const wrap=document.createElement('label');wrap.textContent=label;
      const input=document.createElement('textarea');
      input.dataset.homeInput=key;input.id='home-field-'+key;input.maxLength=max;input.required=true;
      input.rows=/Body$|Lead$|address/.test(key)?3:2;
      input.value=draft[key]??saved[key]??defaults[key]??'';
      wrap.append(input);fields.append(wrap);
    }
  }
  function openEditor(group) {
    if(!permitted()||!loaded||busy)return;
    draft={};activeGroup=groups[group]?group:'intro';section.value=activeGroup;message.textContent='';renderFields();dialog.showModal();
  }
  function setBusy(value) {
    busy=value;dialog.querySelectorAll('button,textarea,select').forEach(el=>el.disabled=value);
    document.getElementById('home-content-save').textContent=value?'Đang lưu…':'Lưu thay đổi';
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!permitted()||busy||!form.reportValidity())return;
    collectDraft();message.textContent='';
    for(const [key,value] of Object.entries(draft)) {
      if(!value || value.length>specs.get(key)[2]) {message.textContent='Vui lòng nhập đầy đủ nội dung trong giới hạn cho phép.';return;}
      if(key==='contactEmail'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){message.textContent='Email liên hệ chưa hợp lệ.';return;}
      if(['phone','hotline'].includes(key)&&(!/^[+\d\s().-]+$/.test(value)||value.replace(/\D/g,'').length<8)){message.textContent='Số điện thoại chưa hợp lệ.';return;}
    }
    setBusy(true);
    try {
      const result=await auth.client.from('pharmacy_site_content').update({content:{...saved,...draft}})
        .eq('id','homepage').eq('revision',revision).select('content,revision').single();
      if(result.error)throw result.error;
      saved=result.data.content;revision=result.data.revision;applyContent();dialog.close();
      window.VPMED_PLATFORM?.toast('Đã cập nhật nội dung.',{tone:'info'});
    } catch(error) {
      message.textContent=error.code==='PGRST116'?'Nội dung đã được cập nhật ở phiên khác. Đóng hộp thoại và tải lại trang trước khi sửa tiếp.':error.code==='42501'?'Tài khoản chưa có quyền biên tập nội dung.':'Chưa lưu được nội dung. Kiểm tra kết nối và thử lại.';
    } finally {setBusy(false);}
  });
  section.addEventListener('change',()=>{collectDraft();activeGroup=section.value;renderFields();});
  document.querySelectorAll('[data-home-edit]').forEach(button=>button.addEventListener('click',()=>openEditor(button.dataset.homeEdit)));
  document.querySelectorAll('[data-home-close]').forEach(button=>button.addEventListener('click',()=>{if(!busy)dialog.close();}));
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  function applyAuth(detail) {auth=detail;syncControls();loadContent();}
  window.addEventListener('vpmed-auth-ready',event=>applyAuth(event.detail));
  window.addEventListener('vpmed-content-permissions-changed',event=>{auth=event.detail;syncControls();});
  window.addEventListener('vpmed-auth-offline',()=>{auth=null;sequence++;loaded=false;syncControls();});
  window.addEventListener('online',loadContent);
  if(window.VPMED_AUTH)applyAuth(window.VPMED_AUTH);else syncControls();
})();
