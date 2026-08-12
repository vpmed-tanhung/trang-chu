(function(){
  'use strict';

  var SUPABASE_URL='https://jaswtdcgrfbygmdxvumu.supabase.co';
  var SUPABASE_KEY='sb_publishable_O6LzzHIKE9nWoSxhLQNlsw_shxEqdLC';
  var EMAIL_PATTERN=/^[^@\s]+@vpmed\.vn$/i;
  var views={
    login:document.getElementById('viewLogin'),register:document.getElementById('viewRegister'),
    forgot:document.getElementById('viewForgot'),reset:document.getElementById('viewReset'),
    registered:document.getElementById('viewRegistered'),pending:document.getElementById('viewPending'),
    rejected:document.getElementById('viewRejected')
  };
  var loader=document.getElementById('authLoader');
  var card=document.getElementById('authCard');
  var adminShell=document.getElementById('adminShell');
  var recoveryMode=false;
  var currentSession=null;
  var currentProfile=null;
  var allProfiles=[];
  var allAudit=[];

  function showFatal(message){
    loader.innerHTML='<div class="status-icon rejected">!</div><strong>Không thể kết nối hệ thống tài khoản</strong><span>'+escapeHtml(message)+'</span>';
    document.documentElement.classList.remove('auth-loading');
  }
  if(!window.supabase){showFatal('Thư viện xác thực chưa tải được. Hãy kiểm tra kết nối mạng và tải lại trang.');return;}
  var client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

  function escapeHtml(value){return String(value==null?'':value).replace(/[&<>'"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch];});}
  function normalizeEmail(value){return String(value||'').trim().toLowerCase();}
  function isHospitalEmail(value){return EMAIL_PATTERN.test(normalizeEmail(value));}
  function initials(value){
    var parts=String(value||'').trim().split(/\s+/).filter(Boolean);
    if(!parts.length)return 'KP';
    return ((parts[0][0]||'')+(parts.length>1?(parts[parts.length-1][0]||''):'')).toUpperCase();
  }
  function setMessage(id,message,type){var el=document.getElementById(id);if(!el)return;el.textContent=message||'';el.className='form-message'+(type==='success'?' success':'');}
  function setBusy(form,busy){var button=form&&form.querySelector('button[type="submit"]');if(button){button.disabled=!!busy;button.dataset.original=button.dataset.original||button.textContent;button.textContent=busy?'Đang xử lý…':button.dataset.original;}}
  function errorText(error,fallback){
    var value=String((error&&error.message)||'').toLowerCase();
    if(value.includes('invalid login credentials'))return 'Email hoặc mật khẩu không đúng.';
    if(value.includes('email not confirmed'))return 'Bạn cần xác nhận email trước khi đăng nhập.';
    if(value.includes('already registered')||value.includes('user already'))return 'Email này đã được đăng ký.';
    if(value.includes('password'))return 'Mật khẩu chưa hợp lệ hoặc chưa đủ 8 ký tự.';
    if(value.includes('rate limit'))return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.';
    return fallback||'Có lỗi xảy ra. Vui lòng thử lại.';
  }
  function showView(name){
    Object.keys(views).forEach(function(key){views[key].hidden=key!==name;});
    loader.hidden=true;card.hidden=false;adminShell.hidden=true;
    document.body.classList.remove('admin-mode');document.documentElement.classList.remove('auth-loading');
    window.scrollTo(0,0);
  }
  function safeNext(){
    var value=new URLSearchParams(window.location.search).get('next')||'index.html';
    if(/^https?:/i.test(value)||value.startsWith('//')||value.includes('\\'))return 'index.html';
    value=value.replace(/^\/+/, '');
    return value&&/^[a-z0-9_./?#=&%-]+$/i.test(value)?value:'index.html';
  }
  function goToMain(){window.location.replace(safeNext());}
  function profileSummary(profile){
    var department=profile.workplace||profile.full_name||'Khoa/phòng chưa cập nhật';
    return '<b>'+escapeHtml(department)+'</b><br>Tài khoản khoa/phòng<br>'+escapeHtml(profile.email||'');
  }
  async function fetchProfile(userId,attempt){
    var result=await client.from('profiles').select('id,email,full_name,job_title,workplace,account_type,role,status,created_at,updated_at,last_login_at').eq('id',userId).maybeSingle();
    if(!result.error&&result.data)return result.data;
    if((attempt||0)<2){await new Promise(function(resolve){setTimeout(resolve,500);});return fetchProfile(userId,(attempt||0)+1);}
    throw result.error||new Error('Không tìm thấy hồ sơ nhân viên.');
  }
  async function routeSession(session){
    currentSession=session||null;
    if(recoveryMode){showView('reset');return;}
    if(!session||!session.user){currentProfile=null;showView('login');return;}
    try{
      var profile=await fetchProfile(session.user.id,0);currentProfile=profile;
      if(profile.status==='approved'){
        if(profile.role==='admin'&&window.location.hash==='#admin'){await showAdmin();return;}
        goToMain();return;
      }
      if(profile.status==='rejected'){
        document.getElementById('rejectedProfile').innerHTML=profileSummary(profile);showView('rejected');return;
      }
      document.getElementById('pendingProfile').innerHTML=profileSummary(profile);showView('pending');
    }catch(error){
      showFatal('Chưa đọc được hồ sơ nhân viên. Hãy kiểm tra đã chạy tệp SQL cài đặt Supabase.');
    }
  }

  document.querySelectorAll('[data-view]').forEach(function(button){button.addEventListener('click',function(){showView(button.dataset.view);});});
  document.querySelectorAll('[data-toggle-password]').forEach(function(button){button.addEventListener('click',function(){var input=document.getElementById(button.dataset.togglePassword);var visible=input.type==='text';input.type=visible?'password':'text';button.textContent=visible?'Hiện':'Ẩn';button.setAttribute('aria-label',visible?'Hiện mật khẩu':'Ẩn mật khẩu');});});
  document.querySelectorAll('[data-sign-out]').forEach(function(button){button.addEventListener('click',async function(){button.disabled=true;await client.auth.signOut();window.location.replace('tai-khoan.html');});});

  document.getElementById('loginForm').addEventListener('submit',async function(event){
    event.preventDefault();var form=event.currentTarget;setMessage('loginMessage','');
    var email=normalizeEmail(document.getElementById('loginEmail').value);var password=document.getElementById('loginPassword').value;
    if(!isHospitalEmail(email)){setMessage('loginMessage','Chỉ chấp nhận email bệnh viện @vpmed.vn.');return;}
    if(!password){setMessage('loginMessage','Vui lòng nhập mật khẩu.');return;}
    setBusy(form,true);
    var result=await client.auth.signInWithPassword({email:email,password:password});
    setBusy(form,false);
    if(result.error){setMessage('loginMessage',errorText(result.error));return;}
    await routeSession(result.data.session);
  });

  document.getElementById('registerForm').addEventListener('submit',async function(event){
    event.preventDefault();var form=event.currentTarget;setMessage('registerMessage','');
    var department=document.getElementById('registerDepartment').value.trim();
    var email=normalizeEmail(document.getElementById('registerEmail').value);
    var password=document.getElementById('registerPassword').value;
    var confirmPassword=document.getElementById('registerPasswordConfirm').value;
    if(department.length<3){setMessage('registerMessage','Vui lòng nhập đầy đủ tên khoa/phòng/đơn vị.');return;}
    if(!isHospitalEmail(email)){setMessage('registerMessage','Chỉ chấp nhận email bệnh viện @vpmed.vn.');return;}
    if(password.length<8){setMessage('registerMessage','Mật khẩu cần có ít nhất 8 ký tự.');return;}
    if(password!==confirmPassword){setMessage('registerMessage','Hai mật khẩu chưa khớp nhau.');return;}
    setBusy(form,true);
    var redirectUrl=window.location.origin+window.location.pathname;
    var result=await client.auth.signUp({
      email:email,password:password,
      options:{emailRedirectTo:redirectUrl,data:{account_type:'department',full_name:department,job_title:'Tài khoản khoa/phòng',department:department,workplace:department}}
    });
    setBusy(form,false);
    if(result.error){setMessage('registerMessage',errorText(result.error,'Không thể tạo tài khoản. Vui lòng thử lại.'));return;}
    form.reset();showView('registered');
  });

  document.getElementById('forgotForm').addEventListener('submit',async function(event){
    event.preventDefault();var form=event.currentTarget;var email=normalizeEmail(document.getElementById('forgotEmail').value);setMessage('forgotMessage','');
    if(!isHospitalEmail(email)){setMessage('forgotMessage','Chỉ chấp nhận email bệnh viện @vpmed.vn.');return;}
    setBusy(form,true);var result=await client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+window.location.pathname});setBusy(form,false);
    if(result.error){setMessage('forgotMessage',errorText(result.error));return;}
    setMessage('forgotMessage','Đã gửi liên kết. Vui lòng kiểm tra hộp thư bệnh viện.','success');
  });

  document.getElementById('resetForm').addEventListener('submit',async function(event){
    event.preventDefault();var form=event.currentTarget;var password=document.getElementById('resetPassword').value;var confirmPassword=document.getElementById('resetPasswordConfirm').value;setMessage('resetMessage','');
    if(password.length<8){setMessage('resetMessage','Mật khẩu cần có ít nhất 8 ký tự.');return;}
    if(password!==confirmPassword){setMessage('resetMessage','Hai mật khẩu chưa khớp nhau.');return;}
    setBusy(form,true);var result=await client.auth.updateUser({password:password});setBusy(form,false);
    if(result.error){setMessage('resetMessage',errorText(result.error));return;}
    recoveryMode=false;setMessage('resetMessage','Đã cập nhật mật khẩu. Đang chuyển về trang chính…','success');setTimeout(goToMain,800);
  });

  document.getElementById('pendingRefresh').addEventListener('click',async function(){var button=this;button.disabled=true;button.textContent='Đang kiểm tra…';try{var profile=await fetchProfile(currentSession.user.id,0);currentProfile=profile;if(profile.status==='approved'){goToMain();return;}if(profile.status==='rejected'){document.getElementById('rejectedProfile').innerHTML=profileSummary(profile);showView('rejected');return;}document.getElementById('pendingProfile').innerHTML=profileSummary(profile);}finally{button.disabled=false;button.textContent='Kiểm tra lại trạng thái';}});

  function statusLabel(status){return status==='approved'?'Đã duyệt':status==='rejected'?'Từ chối':'Chờ duyệt';}
  function formatDate(value){if(!value)return '—';try{return new Date(value).toLocaleString('vi-VN');}catch(error){return value;}}
  function renderStats(){
    document.getElementById('statPending').textContent=allProfiles.filter(function(x){return x.status==='pending';}).length;
    document.getElementById('statApproved').textContent=allProfiles.filter(function(x){return x.status==='approved';}).length;
    document.getElementById('statRejected').textContent=allProfiles.filter(function(x){return x.status==='rejected';}).length;
    document.getElementById('statTotal').textContent=allProfiles.length;
  }
  function renderUsers(){
    var query=String(document.getElementById('userSearch').value||'').trim().toLowerCase();var status=document.getElementById('userStatus').value;
    var rows=allProfiles.filter(function(profile){var hay=[profile.email,profile.workplace,profile.full_name].join(' ').toLowerCase();return (!status||profile.status===status)&&(!query||hay.includes(query));});
    var list=document.getElementById('userList');
    if(!rows.length){list.innerHTML='<div class="empty-admin">Không có tài khoản phù hợp bộ lọc.</div>';return;}
    list.innerHTML=rows.map(function(profile){
      var self=currentProfile&&profile.id===currentProfile.id;
      var department=profile.workplace||profile.full_name||'Chưa cập nhật';
      var accountLabel=profile.role==='admin'?'Quản trị viên':(profile.account_type==='department'?'Tài khoản khoa/phòng':'Tài khoản cũ');
      return '<article class="user-row" data-user-id="'+escapeHtml(profile.id)+'">'+
        '<div class="user-identity"><span class="user-avatar">'+escapeHtml(initials(department))+'</span><div><b>'+escapeHtml(department)+'</b><span>'+escapeHtml(profile.email)+(profile.role==='admin'?' · Quản trị viên':'')+'</span></div></div>'+
        '<div class="user-work"><b>'+escapeHtml(accountLabel)+'</b><span>Lịch sử ghi nhận: '+escapeHtml(department)+'</span></div>'+
        '<span class="status-badge '+escapeHtml(profile.status)+'">'+statusLabel(profile.status)+'</span>'+
        '<div class="user-actions">'+
          (profile.status!=='approved'?'<button class="approve-action" data-set-status="approved">Duyệt</button>':'')+
          (!self&&profile.status!=='rejected'?'<button class="reject-action" data-set-status="rejected">Từ chối</button>':'')+
          (!self&&profile.status==='approved'?'<button class="pending-action" data-set-status="pending">Thu hồi</button>':'')+
        '</div></article>';
    }).join('');
    list.querySelectorAll('[data-set-status]').forEach(function(button){button.addEventListener('click',async function(){var row=button.closest('[data-user-id]');await setUserStatus(row.dataset.userId,button.dataset.setStatus,button);});});
  }
  async function loadProfiles(){
    setMessage('adminMessage','');var result=await client.from('profiles').select('id,email,full_name,job_title,workplace,account_type,role,status,created_at,updated_at,last_login_at').order('created_at',{ascending:false});
    if(result.error){setMessage('adminMessage','Không tải được danh sách tài khoản: '+errorText(result.error));return;}
    allProfiles=result.data||[];renderStats();renderUsers();
  }
  async function setUserStatus(userId,status,button){
    var action=status==='approved'?'duyệt':status==='rejected'?'từ chối':'thu hồi quyền truy cập của';
    var profile=allProfiles.find(function(x){return x.id===userId;});
    var department=profile&&(profile.workplace||profile.full_name||profile.email);
    if(!profile||!window.confirm('Xác nhận '+action+' tài khoản '+department+'?'))return;
    button.disabled=true;var result=await client.rpc('admin_set_profile_status',{target_user_id:userId,new_status:status});button.disabled=false;
    if(result.error){setMessage('adminMessage','Không cập nhật được tài khoản: '+errorText(result.error));return;}
    setMessage('adminMessage','Đã cập nhật trạng thái tài khoản '+department+'.','success');await loadProfiles();
  }
  async function loadAudit(){
    var body=document.getElementById('auditRows');body.innerHTML='<tr><td colspan="6">Đang tải nhật ký…</td></tr>';
    var result=await client.from('renal_lookup_logs').select('*').order('created_at',{ascending:false}).limit(500);
    if(result.error){body.innerHTML='<tr><td colspan="6">Không tải được nhật ký. Kiểm tra quyền admin và tệp SQL.</td></tr>';return;}
    allAudit=result.data||[];renderAudit();
  }
  function renderAudit(){
    var query=String(document.getElementById('auditSearch').value||'').trim().toLowerCase();var rows=allAudit.filter(function(item){return !query||[item.department,item.drug_name,item.result_summary].join(' ').toLowerCase().includes(query);});
    var body=document.getElementById('auditRows');
    if(!rows.length){body.innerHTML='<tr><td colspan="6">Chưa có nhật ký phù hợp.</td></tr>';return;}
    body.innerHTML=rows.map(function(item){return '<tr><td>'+escapeHtml(formatDate(item.created_at))+'</td><td><b>'+escapeHtml(item.patient_code||'—')+'</b></td><td><b>'+escapeHtml(item.department||'Chưa cập nhật')+'</b></td><td>'+escapeHtml(item.drug_name||'Đánh giá chức năng thận')+'</td><td><b>CrCl: '+escapeHtml(item.crcl_ml_min==null?'—':item.crcl_ml_min)+' mL/ph</b><small>eGFR: '+escapeHtml(item.egfr_ml_min_1_73m2==null?'—':item.egfr_ml_min_1_73m2)+'</small></td><td>'+escapeHtml(item.result_summary||item.renal_band||'—')+'</td></tr>';}).join('');
  }
  async function showAdmin(){
    card.hidden=true;adminShell.hidden=false;document.body.classList.add('admin-mode');document.documentElement.classList.remove('auth-loading');
    document.getElementById('adminIdentity').textContent=(currentProfile.full_name||currentProfile.email)+' · Admin';await loadProfiles();
  }
  document.getElementById('userSearch').addEventListener('input',renderUsers);document.getElementById('userStatus').addEventListener('change',renderUsers);
  document.getElementById('adminReload').addEventListener('click',loadProfiles);document.getElementById('auditReload').addEventListener('click',loadAudit);document.getElementById('auditSearch').addEventListener('input',renderAudit);
  document.querySelectorAll('[data-admin-tab]').forEach(function(button){button.addEventListener('click',function(){document.querySelectorAll('[data-admin-tab]').forEach(function(x){x.classList.toggle('active',x===button);});document.getElementById('adminUsers').classList.toggle('active',button.dataset.adminTab==='users');document.getElementById('adminAudit').classList.toggle('active',button.dataset.adminTab==='audit');if(button.dataset.adminTab==='audit'&&!allAudit.length)loadAudit();});});

  client.auth.onAuthStateChange(function(event,session){
    if(event==='PASSWORD_RECOVERY'){recoveryMode=true;currentSession=session;setTimeout(function(){showView('reset');},0);return;}
    if(event==='SIGNED_OUT'){currentSession=null;currentProfile=null;setTimeout(function(){showView('login');},0);}
  });
  client.auth.getSession().then(function(result){routeSession(result.data&&result.data.session);}).catch(function(){showFatal('Không thể kiểm tra phiên đăng nhập.');});
})();
