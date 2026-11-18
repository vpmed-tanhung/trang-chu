/* Giữ nguyên khu vực quản trị cũ, kiểm tra quyền mail trước khi mở. */
(async () => {
  'use strict';
  const root=document.getElementById('clinical-admin');
  const login=()=>location.replace('tai-khoan.html?next='+encodeURIComponent('cap-nhat-du-lieu.html'));
  try {
    if(!window.supabase){root.textContent='Không tải được thư viện đăng nhập. Vui lòng tải lại trang.';return;}
    const client=window.supabase.createClient('https://jaswtdcgrfbygmdxvumu.supabase.co','sb_publishable_O6LzzHIKE9nWoSxhLQNlsw_shxEqdLC');
    const identity=await client.auth.getUser();
    if(identity.error||!identity.data?.user){login();return;}
    const permission=await client.rpc('can_edit_pharmacy_content');
    if(permission.error||permission.data!==true){location.replace('index.html#home');return;}
    window.VPMED_ADMIN_GUARD=Object.freeze({async canEdit(){
      const verified=await client.auth.getUser();
      if(verified.error||!verified.data?.user)return false;
      const current=await client.rpc('can_edit_pharmacy_content');
      return !current.error&&current.data===true;
    }});
    const script=document.createElement('script');
    script.src='clinical-update-secure-client.js?v=20261117-preserve-admin-v1';
    script.onerror=()=>{root.textContent='Chưa tải được khu vực quản trị. Vui lòng tải lại trang.';};
    document.body.append(script);
    client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')login();});
  } catch(error) {root.textContent='Chưa xác minh được quyền truy cập. Vui lòng kiểm tra kết nối và tải lại trang.';}
})();
