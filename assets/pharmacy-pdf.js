/* Mở PDF trong tab đã được trình duyệt tạo từ liên kết của thư viện. */
(async () => {
  'use strict';
  const status = document.getElementById('library-pdf-status');
  const id = location.hash.slice(1);
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
    status.textContent = 'Liên kết tài liệu không hợp lệ.';
    return;
  }
  try {
    const client = window.VPMED_PUBLIC_LIBRARY_CLIENT;
    const record = await client.from('pharmacy_documents').select('storage_path').eq('id',id).maybeSingle();
    if (record.error) throw record.error;
    if (!record.data) {
      status.textContent = 'Tài liệu không còn hoặc tài khoản hiện tại chưa có quyền xem.';
      return;
    }
    const pdf = await client.storage.from('pharmacy-pdfs').createSignedUrl(record.data.storage_path,3600);
    if (pdf.error || !pdf.data?.signedUrl) throw pdf.error || new Error('Missing PDF URL');
    location.replace(pdf.data.signedUrl);
  } catch (error) {
    status.textContent = 'Chưa mở được PDF. Vui lòng kiểm tra kết nối rồi tải lại tab này.';
  }
})();
