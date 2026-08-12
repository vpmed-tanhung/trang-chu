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
  var statusEl=document.getElementById('homeUserStatus'),logout=document.getElementById('homeUserLogout'),adminLink=document.getElementById('homeAdminLink');
  var routed=false;
  function initials(value){var parts=String(value||'').trim().split(/\s+/).filter(Boolean);if(!parts.length)return 'NV';return ((parts[0][0]||'')+(parts.length>1?(parts[parts.length-1][0]||''):'')).toUpperCase();}
  function closeMenu(){menu.hidden=true;trigger.setAttribute('aria-expanded','false');}
  function reveal(user,profile){
    if(routed)return;routed=true;
    var data=user.user_metadata||{};var fullName=profile.full_name||data.full_name||user.email||'Người dùng';var jobTitle=profile.job_title||data.job_title||'Nhân viên bệnh viện';var workplace=profile.workplace||data.department||data.workplace||'';var detail=[jobTitle,workplace].filter(Boolean).join(' · ');
    avatar.textContent=initials(fullName);nameEl.textContent=fullName;metaEl.textContent=detail||'Nhân viên bệnh viện';menuName.textContent=fullName;menuDetail.textContent=(detail?detail+'\n':'')+(profile.email||user.email||'');statusEl.textContent='Tài khoản đã được duyệt';
    if(adminLink)adminLink.hidden=profile.role!=='admin';account.hidden=false;document.documentElement.classList.remove('vpmed-auth-checking');
    window.VPMED_AUTH={client:client,user:user,profile:profile};window.dispatchEvent(new CustomEvent('vpmed-auth-ready',{detail:window.VPMED_AUTH}));
    client.rpc('touch_my_last_login').then(function(){});
  }
  async function applySession(session){
    if(!session||!session.user){redirect();return;}
    var result=await client.from('profiles').select('id,email,full_name,job_title,workplace,role,status').eq('id',session.user.id).maybeSingle();
    if(result.error||!result.data||result.data.status!=='approved'){redirect();return;}
    reveal(session.user,result.data);
  }
  trigger.addEventListener('click',function(){var open=menu.hidden;menu.hidden=!open;trigger.setAttribute('aria-expanded',open?'true':'false');});
  document.addEventListener('click',function(event){if(!account.contains(event.target))closeMenu();});
  logout.addEventListener('click',async function(){logout.disabled=true;await client.auth.signOut();location.replace('tai-khoan.html');});
  client.auth.getSession().then(function(result){applySession(result.data&&result.data.session);}).catch(redirect);
  client.auth.onAuthStateChange(function(event,session){if(event==='SIGNED_OUT')redirect();else if(!routed&&event==='SIGNED_IN')setTimeout(function(){applySession(session);},0);});
})();
