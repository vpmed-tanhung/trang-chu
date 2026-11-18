/* Thông tin thuốc, hướng dẫn sử dụng và bản tin dùng chung tài khoản VPMED. */
(() => {
  'use strict';
  const TABLE = 'pharmacy_documents';
  const BUCKET = 'pharmacy-pdfs';
  const MAX_BYTES = 20 * 1024 * 1024;
  const PAGE_SIZE = 6;
  const KINDS = {
    drug: {title:'Thông tin thuốc', categories:['Thông tin thuốc','Tờ hướng dẫn sử dụng thuốc','Cảnh báo an toàn']},
    guide: {title:'Hướng dẫn sử dụng', categories:['Hướng dẫn sử dụng','Quy trình thao tác','Hướng dẫn phần mềm']},
    bulletin: {title:'Bản tin Dược', categories:['Cảnh báo an toàn','Tương tác thuốc','Thông báo nội bộ','Bản tin Dược']}
  };
  let auth = null, records = [], loading = false, loadError = '', loadSequence = 0;
  let uploadBusy = false, uploadKind = 'bulletin', fileSequence = 0, selectedFile = null, editingRecord = null;
  const panels = new Map();
  const uploadDialog = document.getElementById('library-upload-dialog');
  const uploadForm = document.getElementById('library-upload-form');
  const fileInput = document.getElementById('library-pdf-file');
  const previewButton = document.getElementById('library-preview-button');
  const formStatus = document.getElementById('library-upload-status');
  const $ = (id) => document.getElementById(id);
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
  const isAdmin = () => auth?.canEditContent === true && auth?.profile?.status === 'approved';
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const button = (text, className, action) => {
    const element = node('button', className, text);
    element.type = 'button';
    element.addEventListener('click', action);
    return element;
  };
  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh'});
  }
  function monthKey(value) {
    return new Date(value).toLocaleDateString('sv-SE', {timeZone:'Asia/Ho_Chi_Minh'}).slice(0,7);
  }
  function documentDate(record) {
    return record.document_date || record.created_at;
  }
  function errorMessage(error) {
    if (['42P01','PGRST205'].includes(error?.code)) return 'Thư mục tài liệu chưa được khởi tạo. Vui lòng liên hệ quản trị viên.';
    if (error?.code === 'CONFLICT') return 'Tài liệu đã được cập nhật ở phiên khác. Làm mới danh sách trước khi sửa tiếp.';
    if (['42501','PGRST301'].includes(error?.code) || error?.status === 403) return 'Tài khoản chưa có quyền biên tập nội dung.';
    return 'Không kết nối được kho tài liệu. Vui lòng kiểm tra mạng và thử lại.';
  }
  function updateAdminControls() {
    document.querySelectorAll('[data-library-upload]').forEach((element) => {element.hidden = !isAdmin();});
  }
  async function refresh() {
    if (!auth?.client) return;
    const sequence = ++loadSequence;
    loading = true; loadError = ''; renderAll();
    try {
      const all = [];
      for (let offset = 0; ; offset += 200) {
        const result = await auth.client.from(TABLE)
          .select('id,kind,title,summary,category,file_name,file_size,storage_path,created_at,document_date,keywords,author,revision,updated_at')
          .order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+199);
        if (sequence !== loadSequence) return;
        if (result.error) throw result.error;
        all.push(...result.data);
        if (result.data.length < 200) break;
      }
      records = all.sort((a,b) => new Date(documentDate(b)) - new Date(documentDate(a)));
    } catch (error) {
      if (sequence === loadSequence) loadError = errorMessage(error);
    } finally {
      if (sequence === loadSequence) { loading = false; renderAll(); }
    }
  }
  function emptyState(container, title, message, retry = false) {
    const state = node('div','library-empty');
    state.append(node('b','',title));
    if (message) state.append(node('p','',message));
    if (retry) state.append(button('Thử lại','btn btn-soft',refresh));
    container.replaceChildren(state);
  }
  function matching(panel) {
    const query = normalize(panel.query.value.trim());
    return records.filter((record) => record.kind === panel.kind &&
      (!query || normalize([record.title,record.summary,record.keywords,record.category,record.file_name].join(' ')).includes(query)) &&
      (!panel.category.value || record.category === panel.category.value) &&
      (!panel.month || monthKey(documentDate(record)) === panel.month));
  }
  function renderItem(record) {
    const article = node('article','library-item');
    const copy = node('div','library-item-copy');
    copy.append(button(record.title,'library-item-title',() => openPdf(record)));
    const meta = node('div','library-item-meta');
    meta.append(node('span','library-category',record.category),node('time','',formatDate(documentDate(record))),
      node('span','',(record.file_size/1024/1024).toLocaleString('vi-VN',{maximumFractionDigits:1})+' MB'));
    if (record.author) meta.append(node('span','',record.author));
    copy.append(meta);
    if (record.summary) copy.append(node('p','',record.summary));
    const actions = node('div','library-item-actions');
    actions.append(button('Xem PDF','btn btn-soft',() => openPdf(record)));
    if (isAdmin()) {
      actions.append(button('Chỉnh sửa','btn btn-soft',() => openUpload(record.kind,record)));
      actions.append(button('Xóa','btn btn-danger-soft',(event) => removeRecord(record,event.currentTarget)));
    }
    article.append(node('span','library-file-icon','PDF'),copy,actions);
    return article;
  }
  function renderPanel(panel) {
    panel.root.setAttribute('aria-busy',String(loading));
    panel.refresh.disabled = loading;
    panel.pagination.hidden = true;
    if (loading) { panel.count.textContent = 'Đang tải…'; emptyState(panel.list,'Đang tải tài liệu…'); return; }
    if (loadError) { panel.count.textContent = ''; emptyState(panel.list,'Chưa tải được tài liệu',loadError,true); return; }
    if (!auth) { panel.count.textContent = ''; emptyState(panel.list,'Đang xác minh tài khoản…'); return; }
    const entries = matching(panel);
    panel.page = Math.min(panel.page,Math.max(1,Math.ceil(entries.length/PAGE_SIZE)));
    panel.count.textContent = entries.length+' tài liệu'+(panel.month ? ' · Tháng '+panel.month.slice(5)+'/'+panel.month.slice(0,4) : '');
    panel.clearMonth.hidden = !panel.month;
    if (!entries.length) {
      const hasFilters = panel.query.value.trim() || panel.category.value || panel.month;
      emptyState(panel.list, hasFilters ? 'Không tìm thấy tài liệu' : 'Chưa có tài liệu',
        hasFilters ? 'Thử từ khóa hoặc bộ lọc khác.' : 'Tài liệu mới sẽ xuất hiện tại đây.');
      return;
    }
    panel.list.replaceChildren(...entries.slice((panel.page-1)*PAGE_SIZE,panel.page*PAGE_SIZE).map(renderItem));
    const pages = Math.ceil(entries.length/PAGE_SIZE);
    panel.pagination.hidden = pages <= 1;
    panel.label.textContent = `Trang ${panel.page} / ${pages}`;
    panel.previous.disabled = panel.page <= 1;
    panel.next.disabled = panel.page >= pages;
  }
  function renderSidebar() {
    const entries = records.filter((record) => record.kind === 'bulletin');
    const categories = $('library-bulletin-categories'), recent = $('library-bulletin-recent'), archives = $('library-bulletin-archives');
    categories.replaceChildren(); recent.replaceChildren(); archives.replaceChildren();
    if (loading || loadError || !auth) return;
    const counts = new Map();
    for (const record of entries) counts.set(record.category,(counts.get(record.category)||0)+1);
    for (const category of [...new Set([...KINDS.bulletin.categories,...counts.keys()])]) {
      const item = node('li');
      const link = button('','library-filter-link',() => {
        const panel = panels.get('bulletin'); panel.category.value = category; panel.page = 1; renderPanel(panel);
      });
      link.append(node('span','',category),node('span','',String(counts.get(category)||0)));
      item.append(link); categories.append(item);
    }
    for (const record of entries.slice(0,5)) {
      const item = node('li'); item.append(button(record.title,'',() => openPdf(record))); recent.append(item);
    }
    const months = new Map();
    for (const record of entries) {const key = monthKey(documentDate(record)); months.set(key,(months.get(key)||0)+1);}
    for (const [month,count] of [...months.entries()].sort((a,b) => b[0].localeCompare(a[0]))) {
      const item = node('li');
      item.append(button(`Tháng ${month.slice(5)}/${month.slice(0,4)} (${count})`,'',() => {
        const panel = panels.get('bulletin'); panel.month = month; panel.page = 1; renderPanel(panel);
      }));
      archives.append(item);
    }
    if (!entries.length) { recent.append(node('li','','Chưa có bản tin.')); archives.append(node('li','','Chưa có bản tin.')); }
  }
  function renderAll() {
    for (const panel of panels.values()) {
      const current = panel.category.value;
      const options = [...new Set([...KINDS[panel.kind].categories,...records.filter(r=>r.kind===panel.kind).map(r=>r.category)])];
      panel.category.replaceChildren(new Option('Tất cả chuyên mục',''),...options.map(value => new Option(value,value)));
      panel.category.value = current;
      renderPanel(panel);
    }
    for (const kind of ['drug','guide']) {
      const count = document.querySelector(`[data-library-count="${kind}"]`);
      if (count) count.textContent = loading ? 'Đang tải…' : loadError ? 'Chưa tải được số liệu' : !auth ? 'Đang xác minh tài khoản…' : records.filter(r=>r.kind===kind).length+' tài liệu';
    }
    renderSidebar(); updateAdminControls();
  }
  function openUpload(kind,record = null) {
    if (!isAdmin() || !KINDS[kind]) return;
    uploadKind = kind; editingRecord = record; selectedFile = null; fileSequence++; uploadForm.reset(); formStatus.textContent = ''; previewButton.disabled = !record;
    $('library-upload-title').textContent = record ? 'Chỉnh sửa · '+KINDS[kind].title : kind === 'bulletin' ? 'Tải PDF bản tin' : 'Thêm PDF · '+KINDS[kind].title;
    $('library-upload-category').replaceChildren(...[...new Set([...KINDS[kind].categories,...(record?[record.category]:[])])].map(value => new Option(value,value)));
    fileInput.required = !record;
    $('library-file-label').textContent = record ? 'Thay PDF (không bắt buộc)' : 'Tệp PDF';
    $('library-upload-submit').textContent = record ? 'Lưu thay đổi' : 'Đăng tài liệu';
    if(record) {
      $('library-upload-name').value=record.title;
      $('library-upload-summary').value=record.summary||'';
      $('library-upload-category').value=record.category;
    }
    uploadDialog.showModal();
  }
  async function validatePdf(file) {
    if (!file || !/\.pdf$/i.test(file.name)) throw new Error('Vui lòng chọn tệp PDF.');
    if (!file.size || file.size > MAX_BYTES) throw new Error('Tệp PDF phải lớn hơn 0 và không quá 20 MB.');
    const header = new TextDecoder().decode(await file.slice(0,5).arrayBuffer());
    if (header !== '%PDF-') throw new Error('Nội dung tệp không phải PDF hợp lệ.');
  }
  fileInput.addEventListener('change',async () => {
    const sequence = ++fileSequence, file = fileInput.files[0];
    selectedFile = null; previewButton.disabled = !editingRecord; formStatus.textContent = '';
    if (!file) return;
    try {
      await validatePdf(file);
      if (sequence !== fileSequence) return;
      selectedFile = file; previewButton.disabled = false;
      if (!$('library-upload-name').value.trim()) $('library-upload-name').value = file.name.replace(/\.pdf$/i,'').slice(0,240);
    } catch(error) {if (sequence === fileSequence) {fileInput.value=''; formStatus.textContent=error.message;}}
  });
  function setUploadBusy(value) {
    uploadBusy = value;
    uploadDialog.querySelectorAll('input,select,textarea,button').forEach(element => {element.disabled=value;});
    previewButton.disabled = value || (!selectedFile && !editingRecord);
    $('library-upload-submit').textContent = value ? 'Đang lưu…' : editingRecord ? 'Lưu thay đổi' : 'Đăng tài liệu';
  }
  uploadForm.addEventListener('submit',async (event) => {
    event.preventDefault();
    if (uploadBusy || !isAdmin() || !uploadForm.reportValidity()) return;
    const file = fileInput.files[0], title = $('library-upload-name').value.trim(), record = editingRecord;
    if (!title) {formStatus.textContent='Vui lòng nhập tiêu đề.'; return;}
    let uploadedPath = '', saved = false;
    setUploadBusy(true); formStatus.textContent = '';
    try {
      const values={title,summary:$('library-upload-summary').value.trim(),category:$('library-upload-category').value};
      if(file || !record) {
        await validatePdf(file);
        const path=`${uploadKind}/${crypto.randomUUID()}.pdf`;
        const result=await auth.client.storage.from(BUCKET).upload(path,file,{contentType:'application/pdf',cacheControl:'3600',upsert:false});
        if(result.error)throw result.error;
        uploadedPath=path;
        Object.assign(values,{file_name:file.name.slice(0,255),file_size:file.size,storage_path:path});
      }
      let result;
      if(record) {
        result=await auth.client.from(TABLE).update(values).eq('id',record.id).eq('revision',record.revision).select('id');
        if(result.error)throw result.error;
        if(!result.data?.length)throw {code:'CONFLICT'};
      } else {
        result=await auth.client.from(TABLE).insert({...values,id:crypto.randomUUID(),kind:uploadKind,created_by:auth.user.id});
        if(result.error)throw result.error;
      }
      saved = true;
      uploadDialog.close();
      const panel = panels.get(uploadKind); panel.page=1; panel.query.value=''; panel.category.value=''; panel.month='';
      await refresh();
      let oldFileCleanupError=false;
      if(record && uploadedPath) {
        try {const cleanup=await auth.client.storage.from(BUCKET).remove([record.storage_path]);oldFileCleanupError=!!cleanup.error;}
        catch(error) {oldFileCleanupError=true;}
      }
      window.VPMED_PLATFORM?.toast(oldFileCleanupError ? 'Đã cập nhật tài liệu. Cần kiểm tra lại tệp PDF cũ trong kho.' : record ? 'Đã cập nhật tài liệu.' : 'Đã đăng tài liệu.',{tone:oldFileCleanupError?'warning':'info'});
    } catch(error) {
      let cleanupFailed = false;
      if (uploadedPath && !saved) {
        try {const cleanup=await auth.client.storage.from(BUCKET).remove([uploadedPath]); cleanupFailed=!!cleanup.error;}
        catch(cleanupError) {cleanupFailed=true;}
      }
      formStatus.textContent = error instanceof Error && /^Vui lòng|^Tệp PDF|^Nội dung tệp/.test(error.message) ? error.message : errorMessage(error);
      if (cleanupFailed) formStatus.textContent+=' Tệp đã tải lên nhưng chưa đăng được; vui lòng báo quản trị viên kiểm tra tệp lưu trữ.';
    } finally {setUploadBusy(false);}
  });
  uploadDialog.addEventListener('cancel',(event) => {if(uploadBusy) event.preventDefault();});
  uploadDialog.addEventListener('close',() => {selectedFile=null; editingRecord=null; fileSequence++; uploadForm.reset();});
  async function removeRecord(record,trigger) {
    if (!isAdmin() || !window.confirm(`Xóa tài liệu “${record.title}”?`)) return;
    trigger.disabled = true;
    try {
      const result = await auth.client.from(TABLE).delete().eq('id',record.id).select('id');
      if (result.error) throw result.error;
      if (!result.data?.length) throw {code:'42501'};
      let cleanupError;
      try {const cleanup=await auth.client.storage.from(BUCKET).remove([record.storage_path]); cleanupError=cleanup.error;}
      catch(error) {cleanupError=error;}
      await refresh();
      window.VPMED_PLATFORM?.toast(cleanupError ? 'Đã gỡ tài liệu. Tệp lưu trữ cần được quản trị viên kiểm tra lại.' : 'Đã xóa tài liệu.',{tone:cleanupError?'warning':'info'});
    } catch(error) {window.VPMED_PLATFORM?.toast(errorMessage(error),{tone:'error'}); trigger.disabled=false;}
  }
  function reportPdfError(message) {
    if (uploadDialog.open) {
      formStatus.textContent = message;
    } else {
      window.VPMED_PLATFORM?.toast(message, {tone:'error'});
    }
  }
  async function openPdf(source) {
    // Open during the click so the signed URL request does not trigger a popup block.
    const tab = window.open('about:blank','_blank');
    if (!tab) {
      reportPdfError('Trình duyệt đã chặn tab mới. Cho phép mở tab rồi bấm lại.');
      return;
    }
    tab.opener = null;
    let localUrl;
    try {
      if (source instanceof File) {
        const pdf = source.slice(0,source.size,'application/pdf');
        localUrl = URL.createObjectURL(pdf);
        tab.location.replace(localUrl);

        // Keep the preview URL usable until its browser tab is closed.
        const previewUrl = localUrl;
        const watcher = window.setInterval(() => {
          if (!tab.closed) return;
          window.clearInterval(watcher);
          URL.revokeObjectURL(previewUrl);
        }, 10000);
        return;
      }

      const result = await auth.client.storage.from(BUCKET).createSignedUrl(source.storage_path,3600);
      if (tab.closed) return;
      if (result.error || !result.data?.signedUrl) throw result.error || new Error('Missing PDF URL');
      tab.location.replace(result.data.signedUrl);
    } catch (error) {
      if (localUrl) URL.revokeObjectURL(localUrl);
      if (tab.closed) return;
      tab.close();
      reportPdfError('Chưa mở được PDF. Vui lòng thử lại.');
    }
  }
  function initPanels() {
    document.querySelectorAll('[data-documents-kind]').forEach(root => {
      const part=(name)=>root.querySelector(`[data-library-${name}]`);
      const panel={root,kind:root.dataset.documentsKind,page:1,month:'',query:part('query'),category:part('category'),
        list:part('list'),count:part('result-count'),refresh:part('refresh'),pagination:part('pagination'),
        previous:part('previous'),next:part('next'),label:part('page-label'),clearMonth:part('clear-month')};
      panels.set(panel.kind,panel);
      panel.query.addEventListener('input',()=>{panel.page=1;renderPanel(panel);});
      panel.category.addEventListener('change',()=>{panel.page=1;renderPanel(panel);});
      panel.refresh.addEventListener('click',refresh);
      panel.clearMonth.addEventListener('click',()=>{panel.month='';panel.page=1;renderPanel(panel);});
      panel.previous.addEventListener('click',()=>{panel.page--;renderPanel(panel);});
      panel.next.addEventListener('click',()=>{panel.page++;renderPanel(panel);});
    });
  }
  initPanels();
  document.querySelectorAll('[data-library-upload]').forEach(element => element.addEventListener('click',()=>openUpload(element.dataset.libraryUpload)));
  document.querySelectorAll('[data-library-close]').forEach(element => element.addEventListener('click',()=> {
    const dialog=element.closest('dialog'); if (!uploadBusy) dialog.close();
  }));
  previewButton.addEventListener('click',()=>{if(selectedFile)openPdf(selectedFile);else if(editingRecord)openPdf(editingRecord);});
  function applyAuth(detail) {auth=detail;updateAdminControls();refresh();}
  window.addEventListener('vpmed-auth-ready',event=>applyAuth(event.detail));
  window.addEventListener('vpmed-content-permissions-changed',event=>{
    auth=event.detail;renderAll();if(!isAdmin() && uploadDialog.open && !uploadBusy)uploadDialog.close();
  });
  window.addEventListener('vpmed-auth-offline',()=>{
    auth=null; records=[]; loadSequence++; loading=false; loadError='Cần kết nối mạng để xem kho tài liệu.';renderAll();
  });
  window.addEventListener('online',()=>{if(auth)refresh();});
  if(window.VPMED_AUTH) applyAuth(window.VPMED_AUTH); else renderAll();
})();
