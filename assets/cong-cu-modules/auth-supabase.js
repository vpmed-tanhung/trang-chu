
(function(){
  'use strict';

  var SUPABASE_URL = 'https://jaswtdcgrfbygmdxvumu.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_O6LzzHIKE9nWoSxhLQNlsw_shxEqdLC';
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  var CURRENT_USER = null;
  var IN_RECOVERY_FLOW = false;
  var CURRENT_PROFILE = null;
  var ALLOWED_EMAIL_DOMAIN = 'vpmed.vn';

  function $(id){ return document.getElementById(id); }

  function showAuthPane(name){
    document.querySelectorAll('.auth-pane').forEach(function(p){p.classList.remove('active');});
    var el = $('AUTH-PANE-' + name);
    if(el) el.classList.add('active');
  }

  function setMsg(id, type, text){
    var el = $(id);
    if(!el) return;
    el.className = 'auth-msg show ' + type;
    el.textContent = text;
  }
  function clearMsg(id){
    var el = $(id);
    if(!el) return;
    el.className = 'auth-msg';
    el.textContent = '';
  }

  function friendlyAuthError(msg){
    if(!msg) return 'Đã xảy ra lỗi. Vui lòng thử lại.';
    if(/Invalid login credentials/i.test(msg)) return 'Email hoặc mật khẩu không đúng.';
    if(/User already registered/i.test(msg)) return 'Email này đã được đăng ký.';
    if(/Password should be at least/i.test(msg)) return 'Mật khẩu tối thiểu 6 ký tự.';
    if(/rate limit/i.test(msg)) return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.';
    return msg;
  }

  function isAllowedHospitalEmail(email){
    return /^[^@\s]+@vpmed\.vn$/i.test(String(email || '').trim());
  }

  /* ---------- Password show/hide toggles ---------- */
  document.querySelectorAll('.auth-pw-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var input = $(btn.dataset.target);
      if(!input) return;
      if(input.type === 'password'){ input.type = 'text'; btn.textContent = '🙈'; }
      else { input.type = 'password'; btn.textContent = '👁️'; }
    });
  });

  /* ---------- Switch panes ---------- */
  $('GO-REGISTER').addEventListener('click', function(){ clearMsg('LOGIN-MSG'); clearMsg('REGISTER-MSG'); showAuthPane('REGISTER'); });
  $('GO-LOGIN').addEventListener('click', function(){ clearMsg('LOGIN-MSG'); clearMsg('REGISTER-MSG'); showAuthPane('LOGIN'); });
  $('GO-FORGOT').addEventListener('click', function(){ clearMsg('LOGIN-MSG'); clearMsg('FORGOT-MSG'); showAuthPane('FORGOT'); });
  $('GO-LOGIN-2').addEventListener('click', function(){ clearMsg('FORGOT-MSG'); showAuthPane('LOGIN'); });

  /* ---------- Fetch / apply profile after auth ---------- */
  function applyGateForProfile(profile){
    CURRENT_PROFILE = profile;
    if(IN_RECOVERY_FLOW) return; // đang trong luồng đặt lại mật khẩu, không chuyển màn hình
    if(!profile){
      // No profile row yet (trigger race) — treat as pending
      $('PENDING-ICO').textContent = '⏳';
      $('PENDING-TITLE').textContent = 'Đang khởi tạo tài khoản…';
      $('PENDING-TXT').textContent = 'Vui lòng đợi trong giây lát rồi tải lại trang.';
      document.body.classList.remove('authed');
      showAuthPane('PENDING');
      return;
    }
    if(!isAllowedHospitalEmail(profile.email)){
      document.body.classList.remove('authed');
      $('PENDING-ICO').textContent = '⛔';
      $('PENDING-TITLE').textContent = 'Email không thuộc bệnh viện';
      $('PENDING-TXT').textContent = 'Hệ thống chỉ chấp nhận tài khoản sử dụng email @' + ALLOWED_EMAIL_DOMAIN + '.';
      showAuthPane('PENDING');
      return;
    }
    if(profile.status === 'approved'){
      document.body.classList.add('authed');
      var tbu = $('TB-USER');
      if(tbu){
        tbu.style.display='';
        tbu.textContent = (profile.full_name || profile.email) + (profile.workplace ? ' · ' + profile.workplace : '') + (profile.role==='admin' ? ' · Admin' : '');
      }
      if(profile.role === 'admin'){
        $('NAV-ADMIN').style.display = '';
        $('NAV-ADMIN-LBL').style.display = '';
        $('NAV-AUDIT').style.display = '';
      } else {
        $('NAV-ADMIN').style.display = 'none';
        $('NAV-ADMIN-LBL').style.display = 'none';
        $('NAV-AUDIT').style.display = 'none';
      }
      // Update last login timestamp (best-effort)
      sb.rpc('touch_my_last_login').then(function(){});
      // Chỉ tải nội dung từ clinical_content SAU KHI đã xác nhận phiên đăng nhập hợp lệ (tránh lỗi RLS do gọi quá sớm)
      if(typeof refreshAbbreviationsFromServer === 'function') refreshAbbreviationsFromServer();
    } else if(profile.status === 'rejected'){
      document.body.classList.remove('authed');
      $('PENDING-ICO').textContent = '⛔';
      $('PENDING-TITLE').textContent = 'Tài khoản không được duyệt';
      $('PENDING-TXT').textContent = 'Yêu cầu đăng ký của bạn đã bị từ chối. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.';
      showAuthPane('PENDING');
    } else {
      document.body.classList.remove('authed');
      $('PENDING-ICO').textContent = '⏳';
      $('PENDING-TITLE').textContent = 'Tài khoản đang chờ duyệt';
      $('PENDING-TXT').textContent = 'Tài khoản của bạn đã đăng ký thành công và đang chờ quản trị viên kích hoạt. Vui lòng quay lại sau.';
      showAuthPane('PENDING');
    }
  }

  function loadProfileAndGate(user){
    CURRENT_USER = user;
    sb.from('profiles').select('*').eq('id', user.id).maybeSingle().then(function(res){
      if(res.error){ console.error(res.error); }
      applyGateForProfile(res.data || null);
    });
  }

  function checkSession(){
    sb.auth.getSession().then(function(res){
      var session = res.data && res.data.session;
      if(session && session.user){
        loadProfileAndGate(session.user);
      } else {
        document.body.classList.remove('authed');
        showAuthPane('LOGIN');
      }
    });
  }

  /* ---------- Login ---------- */
  $('LOGIN-FORM').addEventListener('submit', function(e){
    e.preventDefault();
    clearMsg('LOGIN-MSG');
    var email = $('LOGIN-EMAIL').value.trim();
    var pw = $('LOGIN-PW').value;
    if(!isAllowedHospitalEmail(email)){
      setMsg('LOGIN-MSG','err','Vui lòng đăng nhập bằng email bệnh viện @' + ALLOWED_EMAIL_DOMAIN + '.');
      return;
    }
    var btn = $('LOGIN-BTN');
    btn.disabled = true; btn.textContent = 'Đang đăng nhập…';
    sb.auth.signInWithPassword({ email: email, password: pw }).then(function(res){
      btn.disabled = false; btn.textContent = 'Đăng nhập';
      if(res.error){ setMsg('LOGIN-MSG','err', friendlyAuthError(res.error.message)); return; }
      loadProfileAndGate(res.data.user);
    }).catch(function(err){
      btn.disabled = false; btn.textContent = 'Đăng nhập';
      setMsg('LOGIN-MSG','err', friendlyAuthError(err && err.message));
    });
  });

  /* ---------- Register ---------- */
  $('REGISTER-FORM').addEventListener('submit', function(e){
    e.preventDefault();
    clearMsg('REGISTER-MSG');
    var name = $('REG-NAME').value.trim();
    var email = $('REG-EMAIL').value.trim();
    var department = $('REG-DEPARTMENT').value.trim();
    var pw = $('REG-PW').value;
    var pw2 = $('REG-PW2').value;
    if(name.length < 2){ setMsg('REGISTER-MSG','err','Vui lòng nhập đầy đủ họ tên bác sĩ.'); return; }
    if(department.length < 2){ setMsg('REGISTER-MSG','err','Vui lòng nhập khoa/phòng công tác.'); return; }
    if(!isAllowedHospitalEmail(email)){
      setMsg('REGISTER-MSG','err','Chỉ chấp nhận email bệnh viện @' + ALLOWED_EMAIL_DOMAIN + '.');
      return;
    }
    if(pw !== pw2){ setMsg('REGISTER-MSG','err','Mật khẩu xác nhận không khớp.'); return; }
    if(pw.length < 6){ setMsg('REGISTER-MSG','err','Mật khẩu tối thiểu 6 ký tự.'); return; }
    var btn = $('REGISTER-BTN');
    btn.disabled = true; btn.textContent = 'Đang đăng ký…';
    sb.auth.signUp({
      email: email, password: pw,
      // Giữ cả hai khóa để tương thích với trigger profiles hiện có.
      options: { data: { full_name: name, department: department, workplace: department } }
    }).then(function(res){
      btn.disabled = false; btn.textContent = 'Đăng ký';
      if(res.error){ setMsg('REGISTER-MSG','err', friendlyAuthError(res.error.message)); return; }
      $('REGISTER-FORM').reset();
      if(res.data.session){
        // Signed in immediately (email confirmation disabled) -> gate by profile status
        loadProfileAndGate(res.data.user);
      } else {
        $('PENDING-ICO').textContent = '✉️';
        $('PENDING-TITLE').textContent = 'Đăng ký thành công!';
        $('PENDING-TXT').textContent = 'Vui lòng kiểm tra email để xác nhận địa chỉ đăng ký. Sau khi xác nhận, tài khoản sẽ chờ quản trị viên kích hoạt.';
        showAuthPane('PENDING');
      }
    }).catch(function(err){
      btn.disabled = false; btn.textContent = 'Đăng ký';
      setMsg('REGISTER-MSG','err', friendlyAuthError(err && err.message));
    });
  });

  /* ---------- Forgot password ---------- */
  $('FORGOT-FORM').addEventListener('submit', function(e){
    e.preventDefault();
    clearMsg('FORGOT-MSG');
    var email = $('FORGOT-EMAIL').value.trim();
    if(!isAllowedHospitalEmail(email)){
      setMsg('FORGOT-MSG','err','Vui lòng dùng email bệnh viện @' + ALLOWED_EMAIL_DOMAIN + '.');
      return;
    }
    var btn = $('FORGOT-BTN');
    btn.disabled = true; btn.textContent = 'Đang gửi…';
    sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href }).then(function(res){
      btn.disabled = false; btn.textContent = 'Gửi liên kết đặt lại';
      if(res.error){ setMsg('FORGOT-MSG','err', friendlyAuthError(res.error.message)); return; }
      setMsg('FORGOT-MSG','ok','Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư (kể cả mục Spam).');
      $('FORGOT-FORM').reset();
    }).catch(function(err){
      btn.disabled = false; btn.textContent = 'Gửi liên kết đặt lại';
      setMsg('FORGOT-MSG','err', friendlyAuthError(err && err.message));
    });
  });

  /* ---------- Reset password (từ liên kết email) ---------- */
  $('RESET-FORM').addEventListener('submit', function(e){
    e.preventDefault();
    clearMsg('RESET-MSG');
    var pw = $('RESET-PW').value;
    var pw2 = $('RESET-PW2').value;
    if(pw !== pw2){ setMsg('RESET-MSG','err','Mật khẩu xác nhận không khớp.'); return; }
    if(pw.length < 6){ setMsg('RESET-MSG','err','Mật khẩu tối thiểu 6 ký tự.'); return; }
    var btn = $('RESET-BTN');
    btn.disabled = true; btn.textContent = 'Đang cập nhật…';
    sb.auth.updateUser({ password: pw }).then(function(res){
      btn.disabled = false; btn.textContent = 'Cập nhật mật khẩu';
      if(res.error){ setMsg('RESET-MSG','err', friendlyAuthError(res.error.message)); return; }
      $('RESET-FORM').reset();
      IN_RECOVERY_FLOW = false;
      sb.auth.signOut().then(function(){
        setMsg('LOGIN-MSG','ok','Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
        showAuthPane('LOGIN');
      });
    }).catch(function(err){
      btn.disabled = false; btn.textContent = 'Cập nhật mật khẩu';
      setMsg('RESET-MSG','err', friendlyAuthError(err && err.message));
    });
  });

  // Supabase chuyển hướng về app kèm sự kiện PASSWORD_RECOVERY khi người dùng bấm link trong email
  sb.auth.onAuthStateChange(function(event){
    if(event === 'PASSWORD_RECOVERY'){
      IN_RECOVERY_FLOW = true;
      document.body.classList.remove('authed');
      clearMsg('RESET-MSG');
      showAuthPane('RESET');
    }
  });

  /* ---------- Logout ---------- */
  function doLogout(){
    sb.auth.signOut().then(function(){
      CURRENT_USER = null; CURRENT_PROFILE = null;
      document.body.classList.remove('authed');
      $('LOGIN-FORM').reset();
      clearMsg('LOGIN-MSG');
      showAuthPane('LOGIN');
    });
  }
  $('LOGOUT-BTN').addEventListener('click', doLogout);
  $('PENDING-LOGOUT').addEventListener('click', doLogout);

  /* ================= ADMIN DASHBOARD (phân trang phía server) ================= */
  var ADM_PAGE = 0;
  var ADM_PAGE_SIZE = 20;
  var ADM_FILTER = 'all';
  var ADM_SEARCH_TERM = '';
  var ADM_TOTAL_ROWS = 0;
  var ADM_SEARCH_DEBOUNCE = null;

  function fmtDate(iso){
    if(!iso) return '—';
    var d = new Date(iso);
    if(isNaN(d)) return '—';
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
  }
  function statusBadge(u){
    if(u.status === 'approved') return '<span class="adm-badge approved">Đã kích hoạt</span>' + (u.role==='admin' ? ' <span class="adm-badge admin">Admin</span>' : '');
    if(u.status === 'rejected') return '<span class="adm-badge rejected">Từ chối</span>';
    return '<span class="adm-badge pending">Chờ duyệt</span>';
  }
  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function loadAdminStats(){
    var base = function(status){
      var q = sb.from('profiles').select('id', { count: 'exact', head: true });
      if(status) q = q.eq('status', status);
      return q;
    };
    Promise.all([
      base(null), base('pending'), base('approved'), base('rejected')
    ]).then(function(results){
      $('ADM-N-TOTAL').textContent = (results[0].count != null) ? results[0].count : '–';
      $('ADM-N-PENDING').textContent = (results[1].count != null) ? results[1].count : '–';
      $('ADM-N-APPROVED').textContent = (results[2].count != null) ? results[2].count : '–';
      $('ADM-N-REJECTED').textContent = (results[3].count != null) ? results[3].count : '–';
    });
  }

  function loadAdminUsers(){
    var tbody = $('ADM-TBODY');
    tbody.innerHTML = '<tr><td colspan="7" class="adm-empty">Đang tải dữ liệu người dùng…</td></tr>';
    var from = ADM_PAGE * ADM_PAGE_SIZE;
    var to = from + ADM_PAGE_SIZE - 1;
    var q = sb.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
    if(ADM_FILTER !== 'all') q = q.eq('status', ADM_FILTER);
    if(ADM_SEARCH_TERM){
      var term = '%' + ADM_SEARCH_TERM.replace(/%/g,'') + '%';
      q = q.or('full_name.ilike.' + term + ',email.ilike.' + term + ',workplace.ilike.' + term);
    }
    q.then(function(res){
      if(res.error){
        tbody.innerHTML = '<tr><td colspan="7" class="adm-empty">Không thể tải dữ liệu: ' + esc(res.error.message) + '</td></tr>';
        return;
      }
      ADM_TOTAL_ROWS = res.count || 0;
      renderAdminTable(res.data || []);
      renderAdminPagination();
    });
  }

  function renderAdminTable(list){
    var tbody = $('ADM-TBODY');
    if(!list || list.length === 0){
      tbody.innerHTML = '<tr><td colspan="7" class="adm-empty">Không có người dùng phù hợp.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function(u){
      var acts = '';
      if(u.status === 'pending'){
        acts += '<button class="adm-act-btn ok" data-act="approve" data-id="'+u.id+'">✔ Duyệt</button>';
        acts += '<button class="adm-act-btn no" data-act="reject" data-id="'+u.id+'">✕ Từ chối</button>';
      } else if(u.status === 'approved'){
        acts += '<button class="adm-act-btn no" data-act="revoke" data-id="'+u.id+'">Thu hồi</button>';
      } else if(u.status === 'rejected'){
        acts += '<button class="adm-act-btn ok" data-act="approve" data-id="'+u.id+'">Duyệt lại</button>';
      }
      return '<tr>' +
        '<td>'+esc(u.full_name)+'</td>' +
        '<td>'+esc(u.email)+'</td>' +
        '<td>'+esc(u.workplace || '—')+'</td>' +
        '<td>'+statusBadge(u)+'</td>' +
        '<td>'+fmtDate(u.created_at)+'</td>' +
        '<td>'+fmtDate(u.last_login_at)+'</td>' +
        '<td>'+acts+'</td>' +
      '</tr>';
    }).join('');
  }

  function renderAdminPagination(){
    var el = $('ADM-PAGINATION');
    if(!el) return;
    var totalPages = Math.max(1, Math.ceil(ADM_TOTAL_ROWS / ADM_PAGE_SIZE));
    var curPage = ADM_PAGE + 1;
    el.innerHTML =
      '<button class="bs" id="ADM-PREV" '+(ADM_PAGE<=0?'disabled':'')+'>‹ Trước</button>' +
      '<span style="font-size:12.5px;color:var(--T2);margin:0 10px">Trang '+curPage+' / '+totalPages+' · '+ADM_TOTAL_ROWS+' người dùng</span>' +
      '<button class="bs" id="ADM-NEXT" '+(curPage>=totalPages?'disabled':'')+'>Sau ›</button>';
    var prevBtn = $('ADM-PREV'), nextBtn = $('ADM-NEXT');
    if(prevBtn) prevBtn.addEventListener('click', function(){ if(ADM_PAGE>0){ ADM_PAGE--; loadAdminUsers(); } });
    if(nextBtn) nextBtn.addEventListener('click', function(){ if(curPage<totalPages){ ADM_PAGE++; loadAdminUsers(); } });
  }

  function updateUserStatus(id, status){
    sb.rpc('admin_set_profile_status', { target_user_id:id, new_status:status }).then(function(res){
      if(res.error){ alert('Lỗi: ' + res.error.message); return; }
      loadAdminStats();
      loadAdminUsers();
    });
  }

  $('ADM-TBODY').addEventListener('click', function(e){
    var btn = e.target.closest('[data-act]');
    if(!btn) return;
    var id = btn.dataset.id;
    var act = btn.dataset.act;
    if(act === 'approve') updateUserStatus(id, 'approved');
    else if(act === 'reject') updateUserStatus(id, 'rejected');
    else if(act === 'revoke') updateUserStatus(id, 'pending');
  });

  $('ADM-TABS').addEventListener('click', function(e){
    var tab = e.target.closest('.adm-tab');
    if(!tab) return;
    document.querySelectorAll('#ADM-TABS .adm-tab').forEach(function(t){t.classList.remove('active');});
    tab.classList.add('active');
    ADM_FILTER = tab.dataset.filter;
    ADM_PAGE = 0;
    loadAdminUsers();
  });
  $('ADM-SEARCH').addEventListener('input', function(){
    var val = $('ADM-SEARCH').value;
    clearTimeout(ADM_SEARCH_DEBOUNCE);
    ADM_SEARCH_DEBOUNCE = setTimeout(function(){
      ADM_SEARCH_TERM = val.trim();
      ADM_PAGE = 0;
      loadAdminUsers();
    }, 350);
  });
  $('ADM-REFRESH').addEventListener('click', function(){ loadAdminStats(); loadAdminUsers(); });

  $('NAV-ADMIN').addEventListener('click', function(){
    if(CURRENT_PROFILE && CURRENT_PROFILE.role === 'admin'){
      ADM_PAGE = 0;
      loadAdminStats();
      loadAdminUsers();
    }
  });

  /* ================= RENAL LOOKUP AUDIT ================= */
  var AUDIT_PAGE = 0;
  var AUDIT_PAGE_SIZE = 25;
  var AUDIT_TOTAL_ROWS = 0;
  var AUDIT_TYPE = 'all';
  var AUDIT_SEARCH_TERM = '';
  var AUDIT_SEARCH_DEBOUNCE = null;
  var AUDIT_LAST_FINGERPRINT = '';
  var AUDIT_LAST_AT = 0;
  var AUDIT_ERROR_SHOWN = false;
  var AUDIT_ALLOWED_TYPES = {
    renal_function: true,
    antibiotic_renal_dose: true,
    colistin_renal_dose: true
  };

  function auditText(value, maxLength){
    if(value == null) return null;
    var textValue = String(value).replace(/\s+/g, ' ').trim();
    if(!textValue) return null;
    return textValue.slice(0, maxLength || 500);
  }

  function auditNumber(value){
    var numberValue = Number(value);
    if(!Number.isFinite(numberValue)) return null;
    return Math.round(numberValue * 10) / 10;
  }

  function showAuditWriteWarning(){
    if(AUDIT_ERROR_SHOWN) return;
    AUDIT_ERROR_SHOWN = true;
    var warning = document.createElement('div');
    warning.id = 'AUDIT-WRITE-WARNING';
    warning.setAttribute('role', 'alert');
    warning.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;max-width:360px;padding:12px 14px;border-radius:10px;background:#7f1d1d;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.24);font:600 12.5px/1.45 system-ui,sans-serif';
    warning.textContent = 'Kết quả đã hiển thị nhưng chưa ghi được nhật ký tra cứu. Vui lòng báo quản trị viên kiểm tra cấu hình Supabase.';
    document.body.appendChild(warning);
  }

  function logLookup(payload){
    if(!CURRENT_USER || !CURRENT_PROFILE || CURRENT_PROFILE.status !== 'approved') return Promise.resolve(false);
    payload = payload || {};
    if(!AUDIT_ALLOWED_TYPES[payload.lookup_type]) return Promise.resolve(false);
    var row = {
      user_id: CURRENT_USER.id,
      lookup_type: payload.lookup_type,
      module_name: auditText(payload.module_name, 160),
      drug_name: auditText(payload.drug_name, 180),
      crcl_ml_min: auditNumber(payload.crcl_ml_min),
      egfr_ml_min_1_73m2: auditNumber(payload.egfr_ml_min_1_73m2),
      renal_band: auditText(payload.renal_band, 160),
      result_summary: auditText(payload.result_summary, 1000)
    };
    var fingerprint = JSON.stringify(row);
    var now = Date.now();
    if(fingerprint === AUDIT_LAST_FINGERPRINT && now - AUDIT_LAST_AT < 4000) return Promise.resolve(true);
    AUDIT_LAST_FINGERPRINT = fingerprint;
    AUDIT_LAST_AT = now;
    return sb.from('renal_lookup_logs').insert(row).then(function(res){
      if(res.error){
        console.error('[renal_lookup_logs]', res.error);
        showAuditWriteWarning();
        return false;
      }
      return true;
    }).catch(function(err){
      console.error('[renal_lookup_logs]', err);
      showAuditWriteWarning();
      return false;
    });
  }

  window.ClinpharmAudit = {
    logLookup: logLookup,
    getCurrentProfile: function(){ return CURRENT_PROFILE; }
  };

  function auditTypeLabel(type){
    if(type === 'renal_function') return 'Đánh giá chức năng thận';
    if(type === 'antibiotic_renal_dose') return 'Hiệu chỉnh liều kháng sinh';
    if(type === 'colistin_renal_dose') return 'Tính liều Colistin';
    return type || 'Tra cứu';
  }

  function renderAuditTable(list){
    var tbody = $('AUDIT-TBODY');
    if(!tbody) return;
    if(!list || list.length === 0){
      tbody.innerHTML = '<tr><td colspan="7" class="adm-empty">Chưa có lượt tra cứu phù hợp.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function(item){
      var metrics = [];
      if(item.crcl_ml_min != null) metrics.push('CrCl ' + esc(Number(item.crcl_ml_min).toFixed(1)) + ' mL/phút');
      if(item.egfr_ml_min_1_73m2 != null) metrics.push('eGFR ' + esc(Number(item.egfr_ml_min_1_73m2).toFixed(1)));
      var lookupName = auditTypeLabel(item.lookup_type);
      if(item.drug_name) lookupName += '<br><strong>' + esc(item.drug_name) + '</strong>';
      var detail = [item.renal_band, item.result_summary].filter(Boolean).map(esc).join('<br>');
      return '<tr>' +
        '<td>'+fmtDate(item.created_at)+'</td>' +
        '<td><strong>'+esc(item.doctor_name || '—')+'</strong></td>' +
        '<td>'+esc(item.department || '—')+'</td>' +
        '<td>'+esc(item.doctor_email || '—')+'</td>' +
        '<td>'+lookupName+'</td>' +
        '<td class="audit-metric">'+(metrics.length ? metrics.join('<br>') : '—')+'</td>' +
        '<td class="audit-detail">'+(detail || '—')+'</td>' +
      '</tr>';
    }).join('');
  }

  function renderAuditPagination(){
    var el = $('AUDIT-PAGINATION');
    if(!el) return;
    var totalPages = Math.max(1, Math.ceil(AUDIT_TOTAL_ROWS / AUDIT_PAGE_SIZE));
    var currentPage = AUDIT_PAGE + 1;
    el.innerHTML =
      '<button class="bs" id="AUDIT-PREV" '+(AUDIT_PAGE<=0?'disabled':'')+'>‹ Trước</button>' +
      '<span style="font-size:12.5px;color:var(--T2);margin:0 10px">Trang '+currentPage+' / '+totalPages+' · '+AUDIT_TOTAL_ROWS+' lượt tra cứu</span>' +
      '<button class="bs" id="AUDIT-NEXT" '+(currentPage>=totalPages?'disabled':'')+'>Sau ›</button>';
    var prev = $('AUDIT-PREV'), next = $('AUDIT-NEXT');
    if(prev) prev.addEventListener('click', function(){ if(AUDIT_PAGE>0){ AUDIT_PAGE--; loadAuditLogs(); } });
    if(next) next.addEventListener('click', function(){ if(currentPage<totalPages){ AUDIT_PAGE++; loadAuditLogs(); } });
  }

  function loadAuditLogs(){
    if(!CURRENT_PROFILE || CURRENT_PROFILE.role !== 'admin') return;
    var tbody = $('AUDIT-TBODY');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="adm-empty">Đang tải nhật ký tra cứu…</td></tr>';
    var from = AUDIT_PAGE * AUDIT_PAGE_SIZE;
    var to = from + AUDIT_PAGE_SIZE - 1;
    var query = sb.from('renal_lookup_logs').select('*', { count:'exact' }).order('created_at', { ascending:false }).range(from, to);
    if(AUDIT_TYPE !== 'all') query = query.eq('lookup_type', AUDIT_TYPE);
    if(AUDIT_SEARCH_TERM){
      var cleaned = AUDIT_SEARCH_TERM.replace(/[%(),.]/g, ' ').replace(/\s+/g, ' ').trim();
      if(cleaned){
        var term = '%' + cleaned + '%';
        query = query.or('doctor_name.ilike.'+term+',doctor_email.ilike.'+term+',department.ilike.'+term+',drug_name.ilike.'+term+',module_name.ilike.'+term);
      }
    }
    query.then(function(res){
      if(res.error){
        tbody.innerHTML = '<tr><td colspan="7" class="adm-empty">Không thể tải nhật ký. Vui lòng kiểm tra cấu hình Supabase.</td></tr>';
        console.error('[renal_lookup_logs]', res.error);
        return;
      }
      AUDIT_TOTAL_ROWS = res.count || 0;
      renderAuditTable(res.data || []);
      renderAuditPagination();
    });
  }

  if($('AUDIT-TYPE')) $('AUDIT-TYPE').addEventListener('change', function(){
    AUDIT_TYPE = this.value;
    AUDIT_PAGE = 0;
    loadAuditLogs();
  });
  if($('AUDIT-SEARCH')) $('AUDIT-SEARCH').addEventListener('input', function(){
    var value = this.value;
    clearTimeout(AUDIT_SEARCH_DEBOUNCE);
    AUDIT_SEARCH_DEBOUNCE = setTimeout(function(){
      AUDIT_SEARCH_TERM = value.trim();
      AUDIT_PAGE = 0;
      loadAuditLogs();
    }, 350);
  });
  if($('AUDIT-REFRESH')) $('AUDIT-REFRESH').addEventListener('click', loadAuditLogs);
  if($('NAV-AUDIT')) $('NAV-AUDIT').addEventListener('click', function(){
    if(CURRENT_PROFILE && CURRENT_PROFILE.role === 'admin'){
      AUDIT_PAGE = 0;
      loadAuditLogs();
    }
  });

  /* ---------- Boot ---------- */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', checkSession, { once:true });
  } else {
    checkSession();
  }

  /* ================= CLINICAL CONTENT LOADER (tách nội dung khỏi code) ================= */
  // Tải nội dung lâm sàng từ bảng Supabase 'clinical_content'. Nếu chưa có (lần đầu),
  // tự động seed bằng dữ liệu mặc định đang có sẵn trong code (fallbackData).
  // Nếu tải lỗi (mất mạng, chưa tạo bảng...), dùng luôn fallbackData — KHÔNG bao giờ làm hỏng module.
  async function loadClinicalContent(key, fallbackData){
    try{
      var res = await sb.from('clinical_content').select('data').eq('key', key).maybeSingle();
      if(res.error) throw res.error;
      if(res.data && res.data.data){
        return res.data.data;
      }
      // Chưa có dữ liệu trên server -> seed bằng dữ liệu mặc định (best-effort, cần quyền admin để ghi)
      sb.from('clinical_content').upsert({ key: key, data: fallbackData }).then(function(){});
      return fallbackData;
    }catch(e){
      var reason = (e && (e.message || e.error_description || e.details)) || (typeof e === 'string' ? e : JSON.stringify(e));
      console.warn('[clinical_content] Không tải được "'+key+'", dùng dữ liệu mặc định trong code. Lý do: ' + reason);
      return fallbackData;
    }
  }
  window.loadClinicalContent = loadClinicalContent;

  // --- Demo migration: module VIẾT TẮT (ABBRS) ---
  // Trang đã render ngay lập tức bằng dữ liệu mặc định (không có độ trễ / không có màn hình trắng).
  // Sau khi tải xong từ Supabase (nếu có), render lại với dữ liệu mới nhất.
  // QUAN TRỌNG: chỉ gọi hàm này SAU KHI phiên đăng nhập đã xác nhận (xem applyGateForProfile bên dưới),
  // vì policy RLS của bảng clinical_content yêu cầu auth.role() = 'authenticated'. Gọi quá sớm
  // (trước khi Supabase khôi phục xong session) sẽ luôn bị từ chối quyền và rơi vào fallback.
  function refreshAbbreviationsFromServer(){
    if(typeof window.ABBRS === 'undefined' || typeof window.buildAbbrTable !== 'function') return;
    loadClinicalContent('abbreviations', window.ABBRS).then(function(data){
      window.ABBRS = data;
      window.buildAbbrTable();
    });
  }
  window.refreshAbbreviationsFromServer = refreshAbbreviationsFromServer;

})();
