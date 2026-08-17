(function(){
  'use strict';
  var SUPABASE_URL='https://jaswtdcgrfbygmdxvumu.supabase.co';
  var SUPABASE_KEY='sb_publishable_O6LzzHIKE9nWoSxhLQNlsw_shxEqdLC';
  var account=document.getElementById('homeUserAccount');
  function authUrl(){var next=(location.pathname.split('/').pop()||'index.html')+location.search+location.hash;return 'tai-khoan.html?next='+encodeURIComponent(next);}
  function redirect(){location.replace(authUrl());}
  if(!account||!window.supabase){redirect();return;}
  var client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  var trigger=document.getElementById('homeUserTrigger'),menu=document.getElementById('homeUserMenu');
  var avatar=document.getElementById('homeUserAvatar'),nameEl=document.getElementById('homeUserName'),metaEl=document.getElementById('homeUserMeta');
  var menuName=document.getElementById('homeUserMenuName'),menuDetail=document.getElementById('homeUserMenuDetail');
  var logout=document.getElementById('homeUserLogout'),adminLink=document.getElementById('homeAdminLink'),changePassword=document.getElementById('homeChangePassword');
  var passwordModal=document.getElementById('passwordChangeModal'),passwordForm=document.getElementById('passwordChangeForm'),passwordMessage=document.getElementById('passwordChangeMessage');
  var currentUser=null,passwordRedirectPending=false;
  var routed=false,accessCheckBusy=false,accessCheckTimer=null;
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
      if(result.error)return;
      if(!result.data){await forceDeletedLogout();return;}
      if(result.data.status!=='approved'){redirect();return;}
    }finally{accessCheckBusy=false;}
  }
  function startAccessWatch(){
    if(accessCheckTimer)window.clearInterval(accessCheckTimer);
    accessCheckTimer=window.setInterval(verifyStillApproved,10000);
  }
  async function applySession(session){
    if(!session||!session.user){redirect();return;}
    var result=await client.from('profiles').select('id,email,full_name,job_title,workplace,account_type,role,status').eq('id',session.user.id).maybeSingle();
    if(result.error){redirect();return;}
    if(!result.data){await forceDeletedLogout();return;}
    if(result.data.status!=='approved'){redirect();return;}
    reveal(session.user,result.data);startAccessWatch();
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
  client.auth.getSession().then(function(result){applySession(result.data&&result.data.session);}).catch(redirect);
  client.auth.onAuthStateChange(function(event,session){if(event==='SIGNED_OUT'&&!passwordRedirectPending)redirect();else if(!routed&&event==='SIGNED_IN')setTimeout(function(){applySession(session);},0);});
})();
