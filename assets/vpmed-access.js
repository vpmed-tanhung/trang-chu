(function(){
  'use strict';
  var SUPABASE_URL='https://jaswtdcgrfbygmdxvumu.supabase.co';
  var SUPABASE_KEY='sb_publishable_O6LzzHIKE9nWoSxhLQNlsw_shxEqdLC';
  var OFFLINE_ACCESS_KEY='vpmed_verified_offline_access_v1';
  var OFFLINE_ACCESS_MAX_AGE=12*60*60*1000;
  var account=document.getElementById('homeUserAccount');
  function authUrl(){var next=(location.pathname.split('/').pop()||'index.html')+location.search+location.hash;return 'tai-khoan.html?next='+encodeURIComponent(next);}
  function redirect(){location.replace(authUrl());}
  function readOfflineAccess(){
    try{
      var snapshot=JSON.parse(localStorage.getItem(OFFLINE_ACCESS_KEY)||'null');
      if(!snapshot||snapshot.status!=='approved'||!snapshot.verifiedAt)return null;
      if(Date.now()-Number(snapshot.verifiedAt)>OFFLINE_ACCESS_MAX_AGE)return null;
      return snapshot;
    }catch(error){return null;}
  }
  function revealOfflineAccess(force){
    if(navigator.onLine&&!force)return false;
    var snapshot=readOfflineAccess();
    if(!snapshot||!account)return false;
    var displayName=snapshot.displayName||snapshot.email||'Tài khoản đã xác minh';
    var detail=(snapshot.role==='admin'?'Quản trị viên':'Tài khoản khoa/phòng')+' · ngoại tuyến';
    var avatarOffline=document.getElementById('homeUserAvatar');
    var nameOffline=document.getElementById('homeUserName');
    var metaOffline=document.getElementById('homeUserMeta');
    var menuNameOffline=document.getElementById('homeUserMenuName');
    var menuDetailOffline=document.getElementById('homeUserMenuDetail');
    if(avatarOffline)avatarOffline.textContent=String(displayName).trim().split(/\s+/).slice(-2).map(function(part){return part[0]||'';}).join('').toUpperCase()||'NV';
    if(nameOffline)nameOffline.textContent=displayName;
    if(metaOffline)metaOffline.textContent=detail;
    if(menuNameOffline)menuNameOffline.textContent=displayName;
    if(menuDetailOffline)menuDetailOffline.textContent=detail;
    var passwordButton=document.getElementById('homeChangePassword');
    if(passwordButton){passwordButton.disabled=true;passwordButton.title='Cần kết nối mạng để đổi mật khẩu';}
    var logoutButton=document.getElementById('homeUserLogout');
    if(logoutButton)logoutButton.addEventListener('click',function(){try{localStorage.removeItem(OFFLINE_ACCESS_KEY);}catch(error){}location.replace('tai-khoan.html');},{once:true});
    account.hidden=false;
    document.documentElement.classList.remove('vpmed-auth-checking');
    window.VPMED_AUTH_OFFLINE={profile:snapshot,verifiedAt:snapshot.verifiedAt};
    window.dispatchEvent(new CustomEvent('vpmed-auth-offline',{detail:window.VPMED_AUTH_OFFLINE}));
    return true;
  }
  if(!account){redirect();return;}
  if(!window.supabase){if(!revealOfflineAccess())redirect();return;}
  var client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  var trigger=document.getElementById('homeUserTrigger'),menu=document.getElementById('homeUserMenu');
  var avatar=document.getElementById('homeUserAvatar'),nameEl=document.getElementById('homeUserName'),metaEl=document.getElementById('homeUserMeta');
  var menuName=document.getElementById('homeUserMenuName'),menuDetail=document.getElementById('homeUserMenuDetail');
  var logout=document.getElementById('homeUserLogout'),adminLink=document.getElementById('homeAdminLink'),changePassword=document.getElementById('homeChangePassword');
  var passwordModal=document.getElementById('passwordChangeModal'),passwordForm=document.getElementById('passwordChangeForm'),passwordMessage=document.getElementById('passwordChangeMessage');
  var currentUser=null,passwordRedirectPending=false;
  var routed=false,accessCheckBusy=false,accessCheckTimer=null,authCheckDegraded=false;
  function initials(value){var parts=String(value||'').trim().split(/\s+/).filter(Boolean);if(!parts.length)return 'KP';return ((parts[0][0]||'')+(parts.length>1?(parts[parts.length-1][0]||''):'')).toUpperCase();}
  function closeMenu(){menu.hidden=true;trigger.setAttribute('aria-expanded','false');}
  function setPasswordMessage(message,type){passwordMessage.textContent=message||'';passwordMessage.className='password-change-message'+(type==='success'?' success':'');}
  function openPasswordModal(){closeMenu();passwordForm.reset();setPasswordMessage('');passwordModal.hidden=false;document.body.classList.add('password-modal-open');window.setTimeout(function(){document.getElementById('currentPassword').focus();},0);}
  function closePasswordModal(){passwordModal.hidden=true;document.body.classList.remove('password-modal-open');passwordForm.reset();setPasswordMessage('');}
  function reveal(user,profile){
    if(routed)return;routed=true;
    currentUser=user;
    var data=user.user_metadata||{};var workplace=profile.workplace||data.department||data.workplace||profile.full_name||'';var isDepartment=profile.account_type==='department'||profile.job_title==='Tài khoản khoa/phòng';var displayName=(profile.role==='admin'&&!isDepartment)?(profile.full_name||user.email):(workplace||profile.full_name||user.email||'Khoa/phòng');var detail=profile.role==='admin'?'Quản trị viên':'Tài khoản khoa/phòng';
    avatar.textContent=initials(displayName);nameEl.textContent=displayName;metaEl.textContent=detail;menuName.textContent=displayName;menuDetail.textContent=detail+'\n'+(profile.email||user.email||'');
    if(adminLink)adminLink.hidden=profile.role!=='admin';account.hidden=false;document.documentElement.classList.remove('vpmed-auth-checking');
    try{localStorage.setItem(OFFLINE_ACCESS_KEY,JSON.stringify({id:user.id,email:user.email||'',displayName:displayName,role:profile.role||'user',status:profile.status,verifiedAt:Date.now()}));}catch(error){}
    window.VPMED_AUTH={client:client,user:user,profile:profile};window.dispatchEvent(new CustomEvent('vpmed-auth-ready',{detail:window.VPMED_AUTH}));
    client.rpc('touch_my_last_login').then(function(){});
  }
  async function forceDeletedLogout(){
    if(accessCheckTimer){window.clearInterval(accessCheckTimer);accessCheckTimer=null;}
    try{await client.auth.signOut({scope:'local'});}catch(error){}
    location.replace('tai-khoan.html?account_deleted=1');
  }
  async function verifyStillApproved(){
    if(accessCheckBusy||!currentUser)return;
    accessCheckBusy=true;
    try{
      var result=await client.from('profiles').select('id,status').eq('id',currentUser.id).maybeSingle();
      if(result.error){
        if(!authCheckDegraded){
          authCheckDegraded=true;
          window.VPMED_PLATFORM?.toast('Tạm thời chưa xác minh lại được quyền truy cập. Chỉ dùng dữ liệu ngoại tuyến và đối chiếu lại khi có mạng.',{tone:'warning',persistent:true});
        }
        return;
      }
      if(authCheckDegraded){
        authCheckDegraded=false;
        window.VPMED_PLATFORM?.toast('Đã xác minh lại quyền truy cập với máy chủ.',{tone:'info'});
      }
      if(!result.data){await forceDeletedLogout();return;}
      if(result.data.status!=='approved'){redirect();return;}
    }finally{accessCheckBusy=false;}
  }
  function startAccessWatch(){
    if(accessCheckTimer)window.clearInterval(accessCheckTimer);
    accessCheckTimer=window.setInterval(verifyStillApproved,10000);
  }
  async function applyVerifiedUser(user){
    if(!user){if(!revealOfflineAccess(true))redirect();return;}
    var result=await client.from('profiles').select('id,email,full_name,job_title,workplace,account_type,role,status').eq('id',user.id).maybeSingle();
    if(result.error){if(!revealOfflineAccess(true))redirect();return;}
    if(!result.data){await forceDeletedLogout();return;}
    if(result.data.status!=='approved'){redirect();return;}
    reveal(user,result.data);startAccessWatch();
  }
  async function verifyIdentityAndApply(){
    var verified=await client.auth.getUser();
    if(verified.error||!verified.data||!verified.data.user){
      if(!revealOfflineAccess(true))redirect();
      return;
    }
    await applyVerifiedUser(verified.data.user);
  }
  trigger.addEventListener('click',function(){var open=menu.hidden;menu.hidden=!open;trigger.setAttribute('aria-expanded',open?'true':'false');});
  document.addEventListener('click',function(event){if(!account.contains(event.target))closeMenu();});
  changePassword.addEventListener('click',openPasswordModal);
  document.querySelectorAll('[data-close-password-modal]').forEach(function(button){button.addEventListener('click',closePasswordModal);});
  document.querySelectorAll('[data-toggle-home-password]').forEach(function(button){button.addEventListener('click',function(){var input=document.getElementById(button.dataset.toggleHomePassword);var visible=input.type==='text';input.type=visible?'password':'text';button.textContent=visible?'Hiện':'Ẩn';});});
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!passwordModal.hidden)closePasswordModal();});
  passwordForm.addEventListener('submit',async function(event){
    event.preventDefault();setPasswordMessage('');
    var current=document.getElementById('currentPassword').value;
    var next=document.getElementById('newPassword').value;
    var confirmNext=document.getElementById('confirmNewPassword').value;
    if(!current){setPasswordMessage('Vui lòng nhập mật khẩu hiện tại.');return;}
    if(next.length<8){setPasswordMessage('Mật khẩu mới cần có ít nhất 8 ký tự.');return;}
    if(next!==confirmNext){setPasswordMessage('Hai mật khẩu mới chưa khớp nhau.');return;}
    if(next===current){setPasswordMessage('Mật khẩu mới phải khác mật khẩu hiện tại.');return;}
    var submit=passwordForm.querySelector('[type="submit"]');submit.disabled=true;submit.textContent='Đang cập nhật…';
    var verified=await client.auth.signInWithPassword({email:currentUser.email,password:current});
    if(verified.error){submit.disabled=false;submit.textContent='Cập nhật mật khẩu';setPasswordMessage('Mật khẩu hiện tại không đúng.');return;}
    var updated=await client.auth.updateUser({password:next});
    if(updated.error){submit.disabled=false;submit.textContent='Cập nhật mật khẩu';setPasswordMessage('Chưa đổi được mật khẩu. Vui lòng thử lại.');return;}
    setPasswordMessage('Đã đổi mật khẩu. Đang quay lại đăng nhập…','success');
    window.setTimeout(async function(){passwordRedirectPending=true;await client.auth.signOut();location.replace('tai-khoan.html?password_reset=success');},900);
  });
  logout.addEventListener('click',async function(){logout.disabled=true;if(accessCheckTimer)window.clearInterval(accessCheckTimer);await client.auth.signOut();location.replace('tai-khoan.html');});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')verifyStillApproved();});
  window.addEventListener('focus',verifyStillApproved);
  verifyIdentityAndApply().catch(function(){if(!revealOfflineAccess(true))redirect();});
  client.auth.onAuthStateChange(function(event){if(event==='SIGNED_OUT'&&!passwordRedirectPending)redirect();else if(!routed&&event==='SIGNED_IN')setTimeout(verifyIdentityAndApply,0);});
})();
