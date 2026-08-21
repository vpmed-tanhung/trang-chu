/* Logic điều hướng + xử lý UI chính của công cụ (đã tách INT_DB ra interactions-data.js) */


// ============================================================
// CORE NAVIGATION — No addEventListener on null
// ============================================================
function showPg(id) {
  document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('active');});
  var pg = document.getElementById('pg-'+id);
  if(pg) pg.classList.add('active');
  document.querySelectorAll('.ni[data-pg="'+id+'"]').forEach(function(n){n.classList.add('active');});
  var titles = {
    home:'Trang chủ',renal:'Chức năng thận — CrCl / eGFR / IBW',
    vanco:'Vancomycin PK/TDM',amino:'Aminoglycoside',colistin:'Colistin (CMS)',
    levo:'Levothyroxine',la:'Thuốc gây tê — Liều tối đa',
    heparin:'Heparin UFH',insulin:'Insulin',
    opioid:'Opioid Tương đương (MEDD)',corticoid:'Corticosteroid Tương đương',
    benzo:'Benzodiazepine Tương đương',
    scores:'SOFA / APACHE II / GCS',cha2ds2:'CHA₂DS₂-VASc / CURB-65',
    news2:'NEWS2',dapt:'DAPT / HAS-BLED',
    nutrition:'Dinh dưỡng TPN / EN',phenytoin:'Phenytoin TDM',warfarin:'Warfarin & INR',
    ivfluid:'Dịch truyền IV',electrolyte:'Bổ sung Điện giải',
    druginfo:'Thông tin Thuốc',interaction:'Tương tác Thuốc — QĐ 5948',
    guide:'Hướng dẫn & Từ viết tắt',references:'Tài liệu Tham khảo',ai:'Trợ lý AI',
    inject:'Pha & Bảo quản Tiêm — 428 thuốc',
    nelson:'Tính liều KS Nhi',
    admin:'Quản trị hệ thống — Người dùng',
    audit:'Nhật ký tra cứu liều thận'
  };
  var t = document.getElementById('TB-title');
  if(t) t.textContent = titles[id] || 'Hệ thống Hỗ trợ Dược lâm sàng';
  window.scrollTo(0,0);
  closeSB();
}

function openSB(){
  var sb = document.getElementById('SB');
  var ov = document.getElementById('OVL');
  if(sb) sb.classList.add('open');
  if(ov) ov.classList.add('show');
}
function closeSB(){
  var sb = document.getElementById('SB');
  var ov = document.getElementById('OVL');
  if(sb) sb.classList.remove('open');
  if(ov) ov.classList.remove('show');
}

// Tab switching
function switchTab(tab, targetId) {
  // Deactivate all tab-c in same parent as target
  var target = document.getElementById(targetId);
  if(!target) return;
  var parent = target.parentElement;
  if(!parent) return;
  parent.querySelectorAll('.tab-c').forEach(function(c){c.classList.remove('active');});
  target.classList.add('active');
  // Update tab buttons
  var tabRow = parent.querySelector('.tab-row');
  if(tabRow) {
    tabRow.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active');});
    var btn = tabRow.querySelector('[data-target="'+targetId+'"]');
    if(btn) btn.classList.add('active');
  }
}

// ============================================================
// HELPERS
// ============================================================
function gv(id){var e=document.getElementById(id);return e?parseFloat(e.value)||0:0;}
function gs(id){var e=document.getElementById(id);return e?e.value:'';}
function sv(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
function showErr(prefix,msg){
  var e=document.getElementById('err-'+prefix);
  var m=document.getElementById('err-'+prefix+'-msg');
  if(e){e.classList.add('show');}
  if(m)m.textContent=msg;
}
function hideErr(prefix){var e=document.getElementById('err-'+prefix);if(e)e.classList.remove('show');}
function showRes(prefix){var e=document.getElementById('res-'+prefix);if(e)e.style.display='block';}
function hideRes(prefix){var e=document.getElementById('res-'+prefix);if(e)e.style.display='none';}

function setIB(id, color, title, text, ref) {
  var e = document.getElementById('ib-'+id);
  if(!e) return;
  // color: g=green, w=warning/yellow, r=red, b=blue(default)
  e.className = 'ib' + (color?' ib-'+color:'');
  var icons = {g:'✅',w:'⚠️',r:'🚨',b:'ℹ️'};
  var ic = icons[color]||'ℹ️';
  e.innerHTML = '<div class="ib-title">'+ic+' '+title+'</div>'
    + '<div class="ib-text">'+text+'</div>';
}

function clearMod(prefix) {
  // Clear all inputs
  var all = document.querySelectorAll('[id^="'+prefix+'-"]');
  all.forEach(function(el){
    if(el.tagName==='INPUT' && el.type!=='time'){el.value='';}
    else if(el.tagName==='SELECT'){el.selectedIndex=0;}
  });
  // Hide results + errors
  hideRes(prefix);
  hideErr(prefix);
  var ib = document.getElementById('ib-'+prefix);
  if(ib){ib.innerHTML='';ib.className='ib';}
}

function addTime(timeStr, hours) {
  if(!timeStr) return '--:--';
  var parts = timeStr.split(':');
  var h = parseInt(parts[0])||0;
  var m = parseInt(parts[1])||0;
  h += Math.floor(hours);
  m += Math.round((hours%1)*60);
  if(m>=60){h++;m-=60;}
  h = h%24;
  return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;
}

// ============================================================
// RENAL CALCULATIONS
// ============================================================
// ── Chuyển đổi đơn vị Creatinine mg/dL ↔ µmol/L
var _scrUnits = {};
function setScrUnit(mod, unit) {
  var inp = document.getElementById(mod+'-scr');
  var hint = document.getElementById(mod+'-scr-hint');
  var btnMg = document.getElementById(mod+'-unit-mg');
  var btnUmol = document.getElementById(mod+'-unit-umol');
  var prevUnit = window['_'+mod+'Unit'] || 'mg';
  var val = parseFloat(inp.value);
  // Convert giá trị hiện tại nếu có
  if(!isNaN(val) && val > 0) {
    if(prevUnit === 'mg' && unit === 'umol') {
      inp.value = (val * 88.42).toFixed(1);
    } else if(prevUnit === 'umol' && unit === 'mg') {
      inp.value = (val / 88.42).toFixed(3);
    }
  }
  window['_'+mod+'Unit'] = unit;
  if(unit === 'mg') {
    inp.placeholder = (mod==='cg'||mod==='rn')?'1.0':'1.2';
    inp.step = '0.01';
    if(hint) hint.textContent = 'Nhập mg/dL · Khoảng tham chiếu: Nam 0.7–1.3 · Nữ 0.5–1.1 mg/dL';
    if(btnMg) btnMg.classList.add('active');
    if(btnUmol) btnUmol.classList.remove('active');
  } else {
    inp.placeholder = (mod==='cg'||mod==='rn')?'88':'106';
    inp.step = '0.1';
    if(hint) hint.textContent = 'Nhập µmol/L · Khoảng tham chiếu: Nam 62–115 · Nữ 44–97 µmol/L';
    if(btnUmol) btnUmol.classList.add('active');
    if(btnMg) btnMg.classList.remove('active');
  }
}

// Hàm tính toán THUẦN TÚY dùng chung (không đụng DOM) — CrCl (Cockcroft-Gault) + eGFR (CKD-EPI 2021)
// + IBW (Devine) + ABW. Được module "Chức năng thận CrCl/eGFR/IBW/ABW" VÀ module
// "Hiệu chỉnh liều KS CrCl" cùng gọi — đảm bảo LUÔN đồng nhất công thức, sửa 1 nơi áp dụng cả 2 module.
function computeRenalCore(age, sex, ht, wt, scr) {
  // CKD-EPI 2021 và Cockcroft-Gault trong công cụ này chỉ áp dụng cho người lớn.
  if(!isFinite(age)||age<18||age>120) return null;
  var htIn=(ht-152.4)/2.54;
  var ibw=sex==='male'?Math.max(49.9,50+2.3*htIn):Math.max(45.5,45.5+2.3*htIn);
  var abw=ibw+0.4*(wt-ibw);
  var bmi=wt/((ht/100)*(ht/100));
  var bsa=Math.sqrt((ht*wt)/3600);
  var useWt=wt>1.2*ibw?abw:wt;

  var crcl = ((140-age)*wt)/(72*scr);
  if(sex==='female') crcl*=0.85;

  var k=sex==='female'?0.7:0.9, a=sex==='female'?-0.241:-0.302;
  var sk=scr/k;
  var egfr=142*Math.pow(Math.min(sk,1),a)*Math.pow(Math.max(sk,1),-1.200)*Math.pow(0.9938,age);
  if(sex==='female') egfr*=1.012;
  var egfrAbsolute=egfr*bsa/1.73;
  var egfrStage,egfrColor;
  if(egfr>=90){egfrStage='G1 — Bình thường/cao';egfrColor='g';}
  else if(egfr>=60){egfrStage='G2 — Giảm nhẹ';egfrColor='g';}
  else if(egfr>=45){egfrStage='G3a — Giảm nhẹ-vừa';egfrColor='w';}
  else if(egfr>=30){egfrStage='G3b — Giảm vừa-nặng';egfrColor='w';}
  else if(egfr>=15){egfrStage='G4 — Giảm nặng';egfrColor='r';}
  else{egfrStage='G5 — Suy thận';egfrColor='r';}

  var bmiInterp;
  if(bmi<18.5){bmiInterp='Thiếu cân (chuẩn châu Á) — dùng cân nặng thực tế cho PK.';}
  else if(bmi<23){bmiInterp='Bình thường (chuẩn châu Á) — IBW ≈ cân nặng thực tế.';}
  else if(bmi<25){bmiInterp='Thừa cân (chuẩn châu Á) — dùng cân nặng thực tế cho hầu hết thuốc.';}
  else if(bmi<30){bmiInterp='Béo phì độ I (chuẩn châu Á) — <strong>cân nhắc ABW = '+abw.toFixed(1)+' kg</strong> cho aminoglycoside, vancomycin.';}
  else{bmiInterp='Béo phì độ II–III (chuẩn châu Á) — <strong>dùng ABW = '+abw.toFixed(1)+' kg</strong> cho aminoglycoside, vancomycin; dùng IBW cho phenytoin, digoxin, heparin. TDM thường xuyên.';}

  return {
    ibw:ibw, abw:abw, bmi:bmi, bsa:bsa, useWt:useWt,
    crcl:crcl,
    egfr:egfr, egfrAbsolute:egfrAbsolute, egfrStage:egfrStage, egfrColor:egfrColor,
    bmiInterp:bmiInterp
  };
}
window.computeRenalCore = computeRenalCore;

// Module hợp nhất: CrCl (Cockcroft-Gault) + eGFR (CKD-EPI 2021 race-free) + IBW (Devine) + ABW
// CrCl và eGFR là hai ước tính khác nhau: không lấy min/max và không gán nhóm G cho CrCl.
function calcRenal() {
  var age=gv('rn-age'),sex=gs('rn-sex'),ht=gv('rn-ht'),wt=gv('rn-wt'),scrRaw=gv('rn-scr');
  hideErr('rn'); hideRes('rn');
  if(!age||!ht||!wt||!scrRaw){showErr('rn','Vui lòng nhập đầy đủ: Tuổi, Chiều cao, Cân nặng, Creatinine');return;}
  if(age<18||age>120){showErr('rn','Tuổi phải trong khoảng 18–120 (công cụ chỉ dành cho người lớn)');return;}
  if(wt<10||wt>300){showErr('rn','Cân nặng không hợp lệ (10–300 kg)');return;}
  if(ht<100||ht>230){showErr('rn','Chiều cao không hợp lệ (100–230 cm)');return;}
  // Convert về mg/dL nếu đang dùng µmol/L
  var rnUnit=window._rnUnit||'mg';
  var scr = rnUnit==='umol' ? scrRaw/88.42 : scrRaw;
  if(rnUnit==='mg'&&(scrRaw<0.1||scrRaw>30)){showErr('rn','Creatinine không hợp lệ (0.1–30 mg/dL)');return;}
  if(rnUnit==='umol'&&(scrRaw<9||scrRaw>2650)){showErr('rn','Creatinine không hợp lệ (9–2650 µmol/L)');return;}

  var m = computeRenalCore(age, sex, ht, wt, scr);
  var ibw=m.ibw, abw=m.abw, bmi=m.bmi, useWt=m.useWt;
  var crcl=m.crcl;
  var egfr=m.egfr, egfrAbsolute=m.egfrAbsolute, egfrStage=m.egfrStage;
  var bmiInterp=m.bmiInterp;

  // ---- Hiển thị riêng CrCl, eGFR chuẩn hóa và eGFR không chuẩn hóa BSA ----
  sv('rn-crcl-val',crcl.toFixed(1));
  sv('rn-egfr-val',egfr.toFixed(1));
  sv('rn-egfr-absolute-val',egfrAbsolute.toFixed(1));
  sv('rn-egfr-stage',egfrStage);
  sv('rn-ibw-val',ibw.toFixed(1));
  sv('rn-abw-val',abw.toFixed(1));
  sv('rn-bmi-val',bmi.toFixed(1));
  sv('rn-usewt-val',useWt.toFixed(1)+' kg');

  var interp = '<div class="renal-split-interp">'
    +'<div><strong>CrCl Cockcroft-Gault</strong><br><b>'+crcl.toFixed(1)+' mL/phút</b><br>Chỉ dùng để đối chiếu ngưỡng hiệu chỉnh liều khi tài liệu của thuốc quy định theo CrCl. Không gán G1–G5 và không dùng CrCl để chẩn đoán hoặc phân giai đoạn CKD.</div>'
    +'<div><strong>eGFR CKD-EPI 2021</strong><br><b>'+egfr.toFixed(1)+' mL/phút/1,73 m² — '+egfrStage+'</b><br>eGFR không chuẩn hóa theo BSA: <b>'+egfrAbsolute.toFixed(1)+' mL/phút</b>. Nhóm G dựa trên eGFR; một kết quả đơn lẻ không tự xác lập chẩn đoán CKD.</div>'
    +'</div>'
    +'<div class="renal-body-metrics"><strong>IBW</strong> = '+ibw.toFixed(1)+' kg · <strong>ABW</strong> = '+abw.toFixed(1)+' kg · <strong>BMI</strong> = '+bmi.toFixed(1)+' kg/m² — '+bmiInterp+'</div>';

  setIB('rn','','Kết quả tách biệt — không trộn CrCl với eGFR',interp,
    'Cockcroft DW, Gault MH. Nephron. 1976;16:31-41. · Inker LA et al. N Engl J Med. 2021;385:1737-1749. · Devine BJ. Drug Intell Clin Pharm. 1974. · Winter ME. Basic Clinical Pharmacokinetics. 5th Ed.');
  showRes('rn');
  if(window.ClinpharmAudit){
    window.ClinpharmAudit.logLookup({
      lookup_type:'renal_function',
      module_name:'Chức năng thận CrCl/eGFR',
      crcl_ml_min:crcl,
      egfr_ml_min_1_73m2:egfr,
      renal_band:egfrStage.split(' — ')[0],
      result_summary:'CrCl '+crcl.toFixed(1)+' mL/phút (định liều theo nguồn dùng CrCl); eGFR '+egfr.toFixed(1)+' mL/phút/1,73m² ('+egfrStage+'); eGFR không chuẩn hóa BSA '+egfrAbsolute.toFixed(1)+' mL/phút'
    });
  }
}

// ============================================================
// AMINOGLYCOSIDE
// ============================================================
var AG_CONFIG = {
  genta:{name:'Gentamicin',uti:{dkg:1.5,int:8},sepsis:{dkg:1.7,int:8},cf:{dkg:2.5,int:8},pk_str:'6–10 mg/L',tr_str:'<2 mg/L'},
  tobra:{name:'Tobramycin',uti:{dkg:1.5,int:8},sepsis:{dkg:1.7,int:8},cf:{dkg:2.5,int:8},pk_str:'6–10 mg/L',tr_str:'<2 mg/L'},
  amik:{name:'Amikacin',uti:{dkg:7.5,int:12},sepsis:{dkg:7.5,int:12},cf:{dkg:10,int:8},pk_str:'20–30 mg/L',tr_str:'<10 mg/L'}
};

function calcAGtrad() {
  var drug=gs('ag-drug'),wt=gv('ag-wt'),age=gv('ag-age'),scrRaw=gv('ag-scr'),sex=gs('ag-sex'),ind=gs('ag-ind');
  hideErr('ag'); hideRes('ag');
  if(!wt||!age||!scrRaw){showErr('ag','Nhập đầy đủ: Cân nặng, Tuổi, Creatinine');return;}
  var agUnit=window._agUnit||'mg';
  var scr=agUnit==='umol'?scrRaw/88.42:scrRaw;
  if(agUnit==='mg'&&(scrRaw<0.1||scrRaw>30)){showErr('ag','Creatinine không hợp lệ (0.1–30 mg/dL)');return;}
  if(agUnit==='umol'&&(scrRaw<9||scrRaw>2650)){showErr('ag','Creatinine không hợp lệ (9–2650 µmol/L)');return;}
  var crcl=((140-age)*wt)/(72*scr);
  if(sex==='female') crcl*=0.85;
  var cfg=AG_CONFIG[drug];
  var icfg=cfg[ind]||cfg.sepsis;
  var dkg=icfg.dkg;
  var interval=icfg.int;
  if(crcl<50) interval=12;
  if(crcl<30) interval=24;
  if(crcl<10) interval=48;
  var dose=Math.round(dkg*wt);
  sv('ag-dose',dose);
  sv('ag-dkg',dkg.toFixed(1));
  sv('ag-int',interval+'h');
  sv('ag-peak',cfg.pk_str);
  sv('ag-trough',cfg.tr_str);
  var color=crcl<30?'r':crcl<60?'w':'g';
  setIB('ag',color,'Aminoglycoside — Traditional Dosing',
    cfg.name+': <strong>'+dose+'mg mỗi '+interval+'h</strong> IV trong 30 phút.<br>'
    +'Peak mục tiêu: '+cfg.pk_str+' · Trough mục tiêu: '+cfg.tr_str+'.<br>'
    +(crcl<60?'Suy thận — giám sát CN thận và thính giác 2 lần/tuần.':'TDM sau liều thứ 3–4.'),
    'Avent ML et al. Intern Med J. 2011;41:441-449.');
  showRes('ag');
}

function calcAGeid() {
  var drug=gs('ei-drug'),wt=gv('ei-wt'),age=gv('ei-age'),scrRaw=gv('ei-scr'),sex=gs('ei-sex');
  hideErr('ei'); hideRes('ei');
  if(!wt||!age||!scrRaw){showErr('ei','Nhập đầy đủ thông tin');return;}
  var eiUnit=window._eiUnit||'mg';
  var scr=eiUnit==='umol'?scrRaw/88.42:scrRaw;
  if(eiUnit==='mg'&&(scrRaw<0.1||scrRaw>30)){showErr('ei','Creatinine không hợp lệ (0.1–30 mg/dL)');return;}
  if(eiUnit==='umol'&&(scrRaw<9||scrRaw>2650)){showErr('ei','Creatinine không hợp lệ (9–2650 µmol/L)');return;}
  var crcl=((140-age)*wt)/(72*scr);
  if(sex==='female') crcl*=0.85;
  if(crcl<20){
    setIB('ei','r','Không khuyến cáo EID','CrCl <20 mL/phút: EID không khuyến cáo. Dùng liều truyền thống với TDM chặt.','Nicolau DP et al. Antimicrob Agents Chemother. 1995;39:650-655.');
    showRes('ei'); return;
  }
  // Doses: Gentamicin/Tobramycin = 7 mg/kg; Amikacin = 15 mg/kg
  var dkg = drug==='amik'?15:7;
  var dose=Math.round(dkg*wt);
  var interval=crcl>=60?24:crcl>=40?36:48;
  sv('ei-dose',dose);
  sv('ei-dkg',dkg.toFixed(0));
  sv('ei-int',interval+'h');
  sv('ei-crcl',crcl.toFixed(0));
  var nomNote=crcl>=60?'Vùng Q24h':crcl>=40?'Vùng Q36h':'Vùng Q48h';
  nomNote = crcl>=60?'Vùng Q24h':crcl>=40?'Vùng Q36h':'Vùng Q48h';
  setIB('ei','g','Extended-Interval Dosing — Hartford Nomogram',
    drug==='amik'?'<strong>Amikacin '+dose+'mg (15 mg/kg) mỗi '+interval+'h</strong> IV trong 60 phút.':
    '<strong>'+(drug==='genta'?'Gentamicin':'Tobramycin')+' '+dose+'mg (7 mg/kg) mỗi '+interval+'h</strong> IV trong 30–60 phút.<br>'
    +'TDM Hartford Nomogram: lấy nồng độ lúc 6–14h sau liều, đối chiếu '+nomNote+'.',
    'Nicolau DP et al. Antimicrob Agents Chemother. 1995;39:650-655.');
  showRes('ei');
}


// ============================================================
// BG UNIT CONVERSION (mmol/L ↔ mg/dL)
// ============================================================
window._bgUnits = {};
function setBgUnit(prefix, unit) {
  window._bgUnits[prefix] = unit;
  var ids = {
    'sl': {btn_mmol:'sl-unit-mmol', btn_mgdl:'sl-unit-mgdl', hint:'sl-bg-hint', input:'sl-bg'},
    'iv': {btn_mmol:'iv-unit-mmol', btn_mgdl:'iv-unit-mgdl', hint:'iv-bg-hint', input:'iv-bg'},
    'ivp': {btn_mmol:'ivp-unit-mmol', btn_mgdl:'ivp-unit-mgdl', hint:'ivp-bg-hint', input:'iv-prev'},
    'ivinit': {btn_mmol:'ivinit-unit-mmol', btn_mgdl:'ivinit-unit-mgdl', hint:'ivinit-bg-hint', input:'ivinit-bg'},
    'dka': {btn_mmol:'dka-unit-mmol', btn_mgdl:'dka-unit-mgdl', hint:'dka-bg-hint', input:'dka-bg'},
    'gik': {btn_mmol:'gik-unit-mmol', btn_mgdl:'gik-unit-mgdl', hint:'gik-bg-hint', input:'gik-bg'}
  };
  var cfg = ids[prefix]; if(!cfg) return;
  var inp = document.getElementById(cfg.input);
  var hint = document.getElementById(cfg.hint);
  var btnMmol = document.getElementById(cfg.btn_mmol);
  var btnMgdl = document.getElementById(cfg.btn_mgdl);
  if(!inp) return;
  var val = parseFloat(inp.value);
  if(unit === 'mgdl') {
    if(btnMmol) btnMmol.classList.remove('active');
    if(btnMgdl) btnMgdl.classList.add('active');
    if(!isNaN(val) && val > 0 && (window._bgUnits[prefix+'_prev'] || (prefix==='dka'||prefix==='gik'?'mgdl':'mmol')) === 'mmol') {
      inp.value = (val * 18.0).toFixed(0);
    }
    if(hint) hint.textContent = (prefix==='dka'||prefix==='gik') ? 'Nhập mg/dL' : 'Nhập mg/dL · Mục tiêu: 140–180 mg/dL';
    inp.placeholder = '225';
    inp.step = '1';
  } else {
    if(btnMmol) btnMmol.classList.add('active');
    if(btnMgdl) btnMgdl.classList.remove('active');
    if(!isNaN(val) && val > 0 && (window._bgUnits[prefix+'_prev'] || (prefix==='dka'||prefix==='gik'?'mgdl':'mmol')) === 'mgdl') {
      inp.value = (val / 18.0).toFixed(1);
    }
    if(hint) hint.textContent = (prefix==='dka'||prefix==='gik') ? 'Nhập mmol/L' : 'Nhập mmol/L · Mục tiêu nội trú: 7.8–10.0 mmol/L';
    inp.placeholder = '12.5';
    inp.step = '0.1';
  }
  window._bgUnits[prefix+'_prev'] = unit;
}

// Override calcSliding để hỗ trợ mg/dL
var _origCalcSliding = calcSliding;
calcSliding = function() {
  var unit = window._bgUnits['sl'] || 'mmol';
  var inp = document.getElementById('sl-bg');
  if(!inp) return _origCalcSliding();
  var rawVal = parseFloat(inp.value);
  var mmolVal = unit === 'mgdl' ? rawVal / 18.0 : rawVal;
  var origGet = window.gv;
  window.gv = function(id) { if(id === 'sl-bg') return mmolVal; return origGet(id); };
  _origCalcSliding();
  window.gv = origGet;
};

// Override calcIVInsulin để hỗ trợ mg/dL
var _origCalcIVInsulin = calcIVInsulin;
calcIVInsulin = function() {
  var unitIv = window._bgUnits['iv'] || 'mmol';
  var unitIvp = window._bgUnits['ivp'] || 'mmol';
  var inpBg = document.getElementById('iv-bg');
  var inpPrev = document.getElementById('iv-prev');
  var rawBg = parseFloat(inpBg ? inpBg.value : 0);
  var rawPrev = parseFloat(inpPrev ? inpPrev.value : 0);
  var mmolBg = unitIv === 'mgdl' ? rawBg / 18.0 : rawBg;
  var mmolPrev = unitIvp === 'mgdl' ? rawPrev / 18.0 : rawPrev;
  var origGet = window.gv;
  window.gv = function(id) {
    if(id === 'iv-bg') return mmolBg;
    if(id === 'iv-prev') return mmolPrev;
    return origGet(id);
  };
  _origCalcIVInsulin();
  window.gv = origGet;
};

// ============================================================
// LOCAL ANESTHETIC
// ============================================================
var LA_MAX = {
  lido:{name:'Lidocain',mgkg:4.5},lido_epi:{name:'Lidocain+Epi',mgkg:7},
  bupi:{name:'Bupivacain',mgkg:2},bupi_epi:{name:'Bupivacain+Epi',mgkg:2.5},
  ropi:{name:'Ropivacain',mgkg:3},mepi:{name:'Mepivacain',mgkg:4}
};
function calcLA() {
  var drug=gs('la-drug'),wt=gv('la-wt'),conc=parseFloat(gs('la-conc'));
  hideErr('la'); hideRes('la');
  if(!wt){showErr('la','Nhập cân nặng bệnh nhân');return;}
  var cfg=LA_MAX[drug];
  var totMg=cfg.mgkg*wt;
  var vol=totMg/(conc*10);
  sv('la-mgkg',cfg.mgkg);
  sv('la-totmg',totMg.toFixed(0));
  sv('la-vol',vol.toFixed(1));
  var color=totMg>200?'w':'g';
  setIB('la',color,'Thuốc gây tê — Liều tối đa',
    cfg.name+': <strong>'+cfg.mgkg+' mg/kg</strong> = tổng tối đa <strong>'+totMg.toFixed(0)+' mg</strong>.<br>'
    +'Nồng độ '+conc+'%: thể tích tối đa = <strong>'+vol.toFixed(1)+' mL</strong>.<br>'
    +'⚠️ Chuẩn bị sẵn Intralipid 20% (1.5 mL/kg IV bolus) xử lý LAST.',
    'NYSORA Regional Anesthesia Guidelines 2020 · Miller\'s Anesthesia 9th Ed.');
  showRes('la');
}

// ============================================================
// HEPARIN UFH
// ============================================================
function calcHeparin() {
  var wt=gv('hp-wt'),ind=gs('hp-ind'),conc=parseInt(gs('hp-conc'))||100;
  hideErr('hp'); hideRes('hp');
  if(!wt){showErr('hp','Nhập cân nặng bệnh nhân');return;}
  var bolus=0,rate=0,note='',color='g';
  if(ind==='dvt'){
    bolus=Math.min(Math.round(80*wt/100)*100,10000);
    rate=Math.round(18*wt/100)*100;
    note='DVT/PE: Bolus 80U/kg (max 10,000U) → 18U/kg/h. Mục tiêu aPTT 60–100s. Lấy aPTT sau 6h.';
  } else if(ind==='acs'){
    bolus=Math.min(Math.round(60*wt/100)*100,4000);
    rate=Math.round(12*wt/100)*100;
    note='ACS/NSTEMI: Bolus 60U/kg (max 4000U) → 12U/kg/h (max 1000U/h). Mục tiêu aPTT 50–70s.';
  } else if(ind==='stemi'){
    bolus=Math.round(70*wt/100)*100;
    rate=0;
    note='STEMI + PCI: Bolus 70–100U/kg (không GPI) hoặc 50–70U/kg (có GPI). Không cần truyền duy trì sau PCI thành công.';
    color='w';
  } else if(ind==='bridge'){
    bolus=0;
    rate=Math.round(15*wt/50)*50;
    note='Cầu nối thủ thuật: Không bolus. Truyền 15U/kg/h. Ngừng 4–6h trước thủ thuật.';
  } else {
    bolus=5000; rate=0;
    note='Dự phòng huyết khối: 5000U SC q8–12h. Không cần theo dõi aPTT.';
    color='g';
  }
  var mlh=rate>0?(rate/conc).toFixed(1):'—';
  sv('hp-bolus',bolus>0?bolus.toLocaleString():'Không bolus');
  sv('hp-rate',rate>0?rate.toLocaleString()+' U/h':'—');
  sv('hp-mlh',rate>0?mlh+' mL/h':'—');
  setIB('hp',color,'Heparin UFH — '+document.getElementById('hp-ind').options[document.getElementById('hp-ind').selectedIndex].text.split('—')[0].trim(),
    (bolus>0?'Bolus: <strong>'+bolus.toLocaleString()+' U</strong> IV trong 3–5 phút.<br>':'')
    +(rate>0?'Truyền liên tục: <strong>'+rate.toLocaleString()+' U/h</strong> ('+conc+'U/mL → '+mlh+' mL/h).<br>':'')
    +note+'<br>⚠️ HIT: Kiểm tra tiểu cầu baseline → ngày 4 → ngày 8–10. Ngừng ngay nếu TC giảm >50%.',
    'Raschke RA et al. Ann Intern Med. 1993. ACCP 2012.');
  showRes('hp');
}

function calcLMWH() {
  var wt=gv('lmwh-wt'),crcl=gv('lmwh-crcl');
  var drug=gs('lmwh-drug'),ind=gs('lmwh-ind');
  var ib=document.getElementById('ib-lmwh');
  if(!ib||!wt){return;}
  var dose='',freq='',note='',color='g';
  var renalWarn=crcl&&crcl<30?'<br>⚠️ CrCl&lt;30: Giảm liều Enoxaparin 50% (q24h thay q12h) hoặc chuyển sang UFH. Theo dõi anti-Xa.':'';
  if(drug==='enox'){
    if(ind==='tx'){dose=(wt).toFixed(0)+' mg';freq='1mg/kg SC q12h (hoặc 1.5mg/kg q24h — không nguy cơ cao)';}
    else if(ind==='acs'){dose=Math.min(wt,100).toFixed(0)+' mg';freq='1mg/kg SC q12h (max 100mg/liều × 2 liều đầu)';}
    else if(ind==='px'){dose='40mg';freq='SC q24h (bắt đầu 12h trước mổ hoặc 12h sau mổ)';}
    else{dose='40mg';freq='SC q24h';}
    note='Enoxaparin (Clexane) <strong>'+dose+'</strong>: '+freq+'.'+renalWarn;
  } else if(drug==='dalta'){
    if(ind==='tx'){dose=Math.round(200*wt).toLocaleString()+' IU';freq='200 IU/kg SC q24h (max 18,000 IU/ngày)';}
    else if(ind==='px'){dose='5,000 IU';freq='SC q24h';}
    else{dose='2,500–5,000 IU';freq='SC q24h';}
    note='Dalteparin (Fragmin) <strong>'+dose+'</strong>: '+freq+'.'+renalWarn;
  } else {
    if(ind==='tx'){dose=Math.round(86*wt).toLocaleString()+' IU';freq='86 IU/kg SC q12h';}
    else{dose='2,850 IU';freq='SC q24h';}
    note='Nadroparin (Fraxiparine) <strong>'+dose+'</strong>: '+freq+'.'+renalWarn;
  }
  if(crcl&&crcl<30)color='r'; else if(crcl&&crcl<50)color='w';
  sv('lmwh-dose',dose); sv('lmwh-freq',freq);
  ib.className='ib ib-'+color;
  ib.innerHTML='<div class="ib-title">💉 LMWH — '+['Enoxaparin','Dalteparin','Nadroparin'][['enox','dalta','nadro'].indexOf(drug)]+'</div><div class="ib-text">'+note+'</div>';
  document.getElementById('res-lmwh').style.display='block';
}

function calcProtamine() {
  var dose=gv('prot-dose'),timeH=gv('prot-time'),type=gs('prot-type');
  var ib=document.getElementById('ib-prot');
  if(!ib||!dose||!timeH)return;
  var protMg=0,note='';
  if(type==='ufh'){
    var red=timeH<=0.5?1:timeH<=1?0.75:timeH<=2?0.5:timeH<=4?0.25:0.1;
    protMg=Math.min(Math.round(dose/100*red),50);
    note='UFH TM '+dose.toLocaleString()+'U. Hệ số hiệu chỉnh '+Math.round(red*100)+'% ('+timeH+'h sau liều cuối).';
  } else if(type==='ufh-sc'){
    protMg=Math.min(Math.round(dose/100*0.5),50);
    note='UFH SC: Chỉ trung hòa ~50% (hấp thu chậm). Max 50mg/lần.';
  } else {
    protMg=Math.min(Math.round(dose),50);
    note='LMWH (Enoxaparin '+dose+'mg): Protamine trung hòa ~60–75%. Nếu aPTT còn kéo dài, dùng liều 2 (50% liều đầu). Anti-Xa không trung hòa hoàn toàn.';
  }
  var vol=(protMg/10).toFixed(1);
  sv('prot-dose-out',protMg+' mg'); sv('prot-vol-out',vol+' mL');
  ib.className='ib ib-r';
  ib.innerHTML='<div class="ib-title">🚨 Protamine Sulfate — '+protMg+'mg ('+vol+'mL)</div>'
    +'<div class="ib-text">'+note+'<br>Tiêm IV chậm &lt;5mg/phút (max 50mg/lần). Theo dõi aPTT sau 5–15 phút.<br>⚠️ Quá liều Protamine gây kháng đông nghịch lý. Theo dõi HA, nhịp tim khi tiêm.</div>';
  document.getElementById('res-prot').style.display='block';
}

// ============================================================
// INSULIN
// ============================================================
function calcSliding() {
  var bg=gv('sl-bg'),sens=gs('sl-sens'),eat=gs('sl-eat');
  hideRes('sl');
  if(!bg){return;}
  var scales={high:[3.9,0,0,0],low:[3.9,4,6,8,10,12,14]};
  var sensIdx={high:0,normal:1,low:2}[sens];
  var scale=[[3.9,0,0,0,'🚨 Hạ đường huyết'],[7.8,0,0,0,'✅ Trong mục tiêu'],[10,2,2,4,''],[13.3,4,4,6,''],[16.7,6,8,10,''],[22.2,8,10,12,''],[999,10,12,14,'⚠️ Rất cao']];
  var dose=0,note='';
  for(var i=0;i<scale.length;i++){
    if(bg<=scale[i][0]){dose=[scale[i][1],scale[i][2],scale[i][3]][sensIdx];note=scale[i][4];break;}
  }
  var color=bg<3.9?'r':bg<=7.8?'g':'w';
  var ib=document.getElementById('ib-sl');
  if(!ib)return;
  ib.className='ib ib-'+(bg<3.9?'r':bg<=7.8?'g':'w');
  ib.innerHTML='<div class="ib-title">'+(bg<3.9?'🚨':bg<=7.8?'✅':'⚠️')+' Xử trí — BG '+bg.toFixed(1)+' mmol/L</div>'
    +'<div class="ib-text">'+(note||(dose>0?'Tiêm <strong>'+dose+' U Insulin Regular SC</strong>.':'-'))
    +(eat==='no'&&dose>0?'<br>⚠️ BN nhịn ăn: giảm liều correction 50%.':'')
    +'<br>Kiểm tra lại đường huyết sau 2h.</div>';
  document.getElementById('res-sl').style.display='block';
}

function calcIVInsulin() {
  var bgRaw=gv('iv-bg'),prevRaw=gv('iv-prev'),curr=gv('iv-curr');
  var ib=document.getElementById('ib-iv2');
  if(!ib||!bgRaw)return;
  // Chuyển đổi về mmol/L để tính toán, bất kể đơn vị đang hiển thị của từng ô nhập
  var bgUnit=(window._bgUnits['iv']||'mmol');
  var prevUnit=(window._bgUnits['ivp']||'mmol');
  var bg = bgUnit==='mgdl' ? bgRaw/18.0 : bgRaw;
  var prev = prevRaw>0 ? (prevUnit==='mgdl' ? prevRaw/18.0 : prevRaw) : 0;
  var bgMgdl = bg*18.0;
  var trend=prev>0?bg-prev:null;
  var newRate=curr,action='',color='g';
  if(bg<3.9){newRate=0;action='🚨 Ngưng insulin. D50% 20–40mL IV bolus. KTR lại sau 15 phút.';color='r';}
  else if(bg<6.0){newRate=Math.max(0,curr*0.5);action='Giảm 50% → '+newRate.toFixed(1)+' U/h. Theo dõi mỗi 30 phút.';color='w';}
  else if(bg<=10.0){
    if(trend!==null&&trend<-2){newRate=Math.max(0,curr*0.8);action='Đang giảm nhanh (Δ'+trend.toFixed(1)+' mmol/L). Giảm nhẹ → '+newRate.toFixed(1)+' U/h.';color='w';}
    else{action='✅ Trong mục tiêu (7.8–10.0 mmol/L). Duy trì '+curr+' U/h.';}
  }
  else if(bg<=13.3){newRate=curr+0.5;action='Tăng → '+newRate.toFixed(1)+' U/h.';color='w';}
  else if(bg<=16.7){newRate=curr+1.0;action='Tăng → '+newRate.toFixed(1)+' U/h.';color='w';}
  else{newRate=curr+2.0;action='🚨 Bolus '+Math.round((bg-10)*2)+'U + tăng → '+newRate.toFixed(1)+' U/h.';color='r';}
  ib.className='ib ib-'+color;
  ib.innerHTML='<div class="ib-title">Điều chỉnh Insulin IV — BG '+bg.toFixed(1)+' mmol/L ('+bgMgdl.toFixed(0)+' mg/dL)</div>'
    +'<div class="ib-text">'+action+'<br>Kiểm tra lại sau 1–2h. Mục tiêu: 7.8–10.0 mmol/L (140–180 mg/dL).</div>';
  document.getElementById('res-iv2').style.display='block';
}

function setIvMode(mode) {
  var a=document.getElementById('ivmode-adj'),b=document.getElementById('ivmode-init');
  var sa=document.getElementById('iv-sub-adj'),si=document.getElementById('iv-sub-init');
  if(!a||!b||!sa||!si)return;
  a.classList.toggle('active',mode==='adj');
  b.classList.toggle('active',mode==='init');
  sa.style.display=mode==='adj'?'':'none';
  si.style.display=mode==='init'?'':'none';
}

function calcIVInsulinInit() {
  var bgRaw=gv('ivinit-bg'),wt=gv('ivinit-wt'),proto=gs('ivinit-proto'),target=gs('ivinit-target');
  var ib=document.getElementById('ib-ivinit');
  if(!ib||!bgRaw||!wt)return;
  // Chuyển đổi về mg/dL để tính toán (ngưỡng gốc theo mg/dL), hiển thị song song cả 2 đơn vị
  var unit=(window._bgUnits['ivinit']||'mmol');
  var bgMgdl = unit==='mgdl' ? bgRaw : bgRaw*18.0;
  var bgMmol = unit==='mgdl' ? bgRaw/18.0 : bgRaw;
  var conc=proto==='std'?1:0.1;
  var initRate=Math.round(0.1*wt*10)/10,bolus=0,note='';
  if(bgMgdl>300){bolus=Math.round(wt*0.1);note='ĐH >300 mg/dL (>16.7 mmol/L): dùng bolus khởi đầu.';}
  else if(bgMgdl>200){initRate=Math.round(0.05*wt*10)/10;note='ĐH 200–300 mg/dL (11.1–16.7 mmol/L): bắt đầu liều thấp hơn.';}
  else{initRate=Math.round(0.02*wt*10)/10;note='ĐH <200 mg/dL (<11.1 mmol/L): tốc độ khởi đầu thấp.';}
  var pumpRate=(initRate/conc).toFixed(1);
  var tgtText=target==='cardiac'?'110–150 mg/dL (6.1–8.3 mmol/L)':'140–180 mg/dL (7.8–10.0 mmol/L)';
  var color=bgMgdl>400?'r':bgMgdl>300?'w':'g';
  ib.className='ib ib-'+color;
  ib.innerHTML='<div class="ib-title">⚡ Liều khởi đầu Insulin IV — BG '+bgMgdl.toFixed(0)+' mg/dL ('+bgMmol.toFixed(1)+' mmol/L)</div>'
    +'<div class="ib-text">Mục tiêu: '+tgtText+'.<br>'
    +'Tốc độ khởi đầu: <strong>'+initRate.toFixed(1)+' U/h</strong> ('+pumpRate+' mL/h — dung dịch '+(proto==='std'?'1U/mL':'0.1U/mL')+').<br>'
    +(bolus>0?'Bolus: <strong>'+bolus+' U IV</strong>.<br>':'')
    +note+'<br>Kiểm tra ĐH mỗi 1–2h. ⚠️ ĐH &lt;70 mg/dL (&lt;3.9 mmol/L): NGỪNG insulin ngay, xử lý hạ ĐH.</div>';
  document.getElementById('res-ivinit').style.display='block';
}

function calcIVtoSC() {
  var tot=gv('sc-tot'),eat=gs('sc-eat');
  var ib=document.getElementById('ib-sc2');
  if(!ib||!tot)return;
  var factor=eat==='yes'?0.8:0.5;
  var totSC=Math.round(tot*factor);
  var basal=Math.round(totSC*0.5/2)*2;
  var bolus=eat==='yes'?Math.round(totSC*0.5/3/2)*2:0;
  ib.className='ib ib-g';
  ib.innerHTML='<div class="ib-title">✅ Chuyển đổi IV → SC Basal-Bolus</div>'
    +'<div class="ib-text">'
    +'Insulin nền (Basal): <strong>'+basal+'U/ngày</strong> Glargine hoặc Detemir (tiêm 1 lần/ngày).<br>'
    +(eat==='yes'?'Insulin bolus (Lispro/Aspart): <strong>'+bolus+'U</strong> trước mỗi bữa ăn × 3 lần.<br>':'Không ăn — chỉ dùng insulin nền.<br>')
    +'⚠️ Tiêm SC đầu tiên <strong>trước khi ngưng IV 1–2h</strong> (overlap để tránh tăng đường huyết hồi).'
    +'</div>';
  document.getElementById('res-sc2').style.display='block';
}

function calcDKA() {
  var wt=gv('dka-wt'),bgRaw=gv('dka-bg'),k=gv('dka-k'),sev=gs('dka-sev');
  var ib=document.getElementById('ib-dka');
  if(!ib||!wt||!bgRaw)return;
  var unit=(window._bgUnits['dka']||'mgdl');
  var bgMgdl = unit==='mmol' ? bgRaw*18.0 : bgRaw;
  var bgMmol = unit==='mmol' ? bgRaw : bgRaw/18.0;
  var fluid1raw=Math.round(wt*17.5/100)*100; // 15–20 mL/kg/h (Kitabchi 2009) — dùng trung bình 17.5 mL/kg
  var fluid1=Math.max(1000,Math.min(1500,fluid1raw)); // giới hạn thực hành: 1.0–1.5 L/giờ
  var fluid1Capped = fluid1raw!==fluid1;
  var fluidMaint=375;
  var insBolus=sev==='mild'?0:Math.round(0.1*wt);
  var insRate=Math.round(0.1*wt*10)/10;
  var kNote=k<3.5?'⚠️ K⁺ thấp — BÙ KALI TRƯỚC khi dùng insulin (ngừng insulin đến khi K⁺>3.5).':k>5.5?'⚠️ K⁺ cao — KHÔNG bù kali ban đầu.':'K⁺='+(k||'?')+' mEq/L — Bù KCl 20–40 mEq/L dịch khi K⁺ <4.5 mEq/L.';
  var color=sev==='severe'?'r':sev==='moderate'?'w':'g';
  ib.className='ib ib-'+color;
  ib.innerHTML='<div class="ib-title">🚨 Phác đồ DKA — Mức độ '+(sev==='mild'?'nhẹ':sev==='moderate'?'vừa':'nặng')+' — ĐH nhập viện '+bgMgdl.toFixed(0)+' mg/dL ('+bgMmol.toFixed(1)+' mmol/L)</div>'
    +'<div class="ib-text">Dịch giờ 1: <strong>'+fluid1+' mL</strong> NaCl 0.9% ('+Math.round(fluid1/60)+' mL/phút)'+(fluid1Capped?' — đã giới hạn theo mức thực hành 1.0–1.5 L/giờ':'')+'.<br>'
    +'Duy trì: <strong>'+fluidMaint+' mL/h</strong> NaCl 0.45% hoặc 0.9% (tuỳ Na⁺).<br>'
    +'Insulin Regular: '+(sev==='mild'?'Không bolus → ':insBolus+' U IV bolus → ')+'<strong>'+insRate+' U/h IV</strong>.<br>'
    +kNote+'<br>Khi ĐH≤250 mg/dL (≤13.9 mmol/L): thêm Glucose 5% và duy trì insulin.<br>'
    +'Mục tiêu: ĐH giảm 50–70 mg/dL/h (2.8–3.9 mmol/L/h). Theo dõi khí máu, điện giải mỗi 2–4h.</div>';
  document.getElementById('res-dka').style.display='block';
}

function calcBasalBolus() {
  var wt=gv('bb-wt'),hba1c=gv('bb-hba1c'),status=gs('bb-status'),renal=gs('bb-renal');
  var ib=document.getElementById('ib-bb');
  if(!ib||!wt)return;
  var tddPerKg=0.4;
  if(status==='naive')tddPerKg=0.3;
  else if(status==='controlled')tddPerKg=0.4;
  else if(status==='insulin')tddPerKg=0.5;
  else if(status==='steroid')tddPerKg=0.5;
  if(renal==='impaired')tddPerKg*=0.75;
  else if(renal==='severe')tddPerKg*=0.5;
  if(hba1c>10)tddPerKg*=1.2;
  else if(hba1c&&hba1c<7)tddPerKg*=0.8;
  var tdd=Math.round(tddPerKg*wt);
  var basal=Math.round(tdd*0.5);
  var bolus=Math.round(tdd*0.5/3);
  var isf=Math.round(1700/tdd);
  var note=status==='steroid'?'⚠️ Dùng Corticosteroid: ĐH thường tăng cao buổi chiều — cân nhắc tăng liều bolus buổi trưa/chiều.':renal==='severe'?'⚠️ Suy thận nặng: insulin chuyển hóa chậm → nguy cơ hạ ĐH. Kiểm tra ĐH thường xuyên hơn.':'';
  ib.className='ib ib-g';
  ib.innerHTML='<div class="ib-title">📋 Phác đồ Basal-Bolus — TDD='+tdd+' U/ngày</div>'
    +'<div class="ib-text">TDD = <strong>'+tdd+' U/ngày</strong> ('+tddPerKg.toFixed(2)+' U/kg/ngày).<br>'
    +'Insulin Basal (Lantus/Tresiba): <strong>'+basal+' U</strong> × 1 lần/ngày.<br>'
    +'Insulin Bolus (Novorapid/Humalog): <strong>'+bolus+' U</strong> × 3 lần/ngày trước ăn.<br>'
    +'Correction (ISF): 1U hạ '+isf+' mg/dL.<br>'+note
    +(note?'<br>':'')+'Kiểm tra ĐH: trước ăn + trước ngủ. Mục tiêu: ĐH trước ăn 140–180 mg/dL.</div>';
  document.getElementById('res-bb').style.display='block';
}

function calcGIK() {
  var wt=gv('gik-wt'),bgRaw=gv('gik-bg'),k=gv('gik-k'),proto=gs('gik-proto');
  var ib=document.getElementById('ib-gik');
  if(!ib||!wt)return;
  var unit=(window._bgUnits['gik']||'mgdl');
  var bg = bgRaw ? (unit==='mmol' ? bgRaw*18.0 : bgRaw) : 0;
  var bgMmol = bgRaw ? (unit==='mmol' ? bgRaw : bgRaw/18.0) : 0;
  var insU,glcG,kMeq,vol=500;
  if(proto==='std'){insU=10;glcG=50;kMeq=10;}
  else if(proto==='high'){insU=20;glcG=100;kMeq=20;}
  else{insU=Math.round(wt*0.15);glcG=insU*4;kMeq=10;}
  var rate=Math.round(wt*1.5);
  var insH=(insU/vol*rate).toFixed(1);
  var glcH=(glcG/vol*rate).toFixed(1);
  var kH=(kMeq/vol*rate).toFixed(1);
  var bgText=bgRaw?(' — ĐH hiện tại '+bg.toFixed(0)+' mg/dL ('+bgMmol.toFixed(1)+' mmol/L)'):'';
  var note=bg>200?'⚠️ ĐH>200 mg/dL (&gt;11.1 mmol/L): cân nhắc tăng tỷ lệ Insulin/Glucose.':(bg&&bg<140?'⚠️ ĐH&lt;140 mg/dL (&lt;7.8 mmol/L): cân nhắc giảm tỷ lệ Insulin hoặc tạm ngừng GIK.':'');
  ib.className='ib ib-w';
  ib.innerHTML='<div class="ib-title">💊 Phác đồ GIK — '+rate+' mL/h'+bgText+'</div>'
    +'<div class="ib-text">Pha: '+vol+'mL Glucose '+(proto==='std'?'10%':proto==='high'?'20%':'?')+' + '+insU+'U Insulin Regular + '+kMeq+'mEq KCl.<br>'
    +'Tốc độ truyền: <strong>'+rate+' mL/h</strong> = '+insH+' U insulin/h + '+glcH+' g glucose/h + '+kH+' mEq K⁺/h.<br>'
    +note+(note?'<br>':'')+'Kiểm tra ĐH mỗi 1–2h, K⁺ mỗi 4–6h. Điều chỉnh tốc độ để duy trì ĐH 140–180 mg/dL (7.8–10.0 mmol/L).</div>';
  document.getElementById('res-gik').style.display='block';
}


// ============================================================
// OP_MEDD: hệ số × liều (mg/ngày) = MME/ngày — theo CDC 2022 Table
// Fentanyl (mcg/h): đơn vị mcg/h, nhân 2.4 → MME/ngày (KHÔNG dùng mg)
// Morphine IV: 1 mg IV = 3 MME (IV mạnh hơn PO 3 lần)
// Hydromorphone IV: 1 mg IV ≈ 20 MME
var OP_MEDD={
  morph_po:1,        // morphine PO: 1 mg = 1 MME (chuẩn CDC 2022)
  morph_iv:3,        // morphine IV/IM: 1 mg = 3 MME
  oxy_po:1.5,        // oxycodone PO: CDC 2022 = 1.5
  hydro_po:5,        // hydromorphone PO: CDC 2022 = 5 (trước dùng 4)
  hydro_iv:20,       // hydromorphone IV: ≈20 (equianalgesic 1mg IV ~ 5mg PO)
  fent_iv:100,       // fentanyl IV tiêm (mcg/h): 1 mcg/h × 24h × (/10) ~ dùng quy đổi riêng
  fent_p:2.4,        // fentanyl patch (mcg/h): CDC 2022 — 1 mcg/h = 2.4 MME/ngày
  codeine:0.15,      // codeine PO: CDC 2022 = 0.15
  tramadol:0.2,      // tramadol PO: CDC 2022 = 0.2
  oxymorph_po:3.0,   // oxymorphone PO: CDC 2022 = 3.0
  methadone:4.7,     // methadone PO: CDC 2022 = 4.7 (thận trọng đặc biệt)
  tapentadol:0.4,    // tapentadol PO: CDC 2022 = 0.4
  pethi_iv:0.1       // pethidine IV: ~0.1 (không dùng MEDD để convert; tránh dài ngày)
};
function calcOpioid() {
  var from=gs('op-from'),to=gs('op-to'),dose=gv('op-dose');
  hideErr('op'); hideRes('op');
  if(!dose||dose<=0){showErr('op','Nhập liều thuốc nguồn (>0)');return;}
  // Tính MEDD
  var medd;
  if(from==='fent_p'){
    // Fentanyl patch: input mcg/h, nhân 2.4 → MME/ngày (CDC 2022)
    medd=dose*2.4;
  } else if(from==='fent_iv'){
    // Fentanyl IV: input mcg/h liên tục, 1 mcg/h × 24h ÷ 10 (mcg→mg, rồi × 100 potency ratio)
    // Cách chuẩn: dose(mcg/h) × 24 = mcg/ngày → ÷1000 = mg/ngày → × 100 (potency vs morphine PO) = MME
    medd=dose*24*0.1; // = dose×2.4 ≈ tương đương fentanyl patch (cùng mcg/h)
  } else {
    medd=dose*(OP_MEDD[from]||1);
  }
  // Tính liều tương đương sang opioid đích
  var equiv, unit='mg/ngày';
  if(to==='fent_p'){
    equiv=medd/2.4; unit='mcg/h';
  } else if(to==='fent_iv'){
    equiv=medd/2.4; unit='mcg/h';
  } else {
    equiv=medd/(OP_MEDD[to]||1);
  }
  var recEquiv=equiv*0.7; // Giảm 30% (khuyến cáo giảm 25-50%)
  // Phân tầng nguy cơ theo MEDD
  var riskLevel,riskColor,riskNote;
  if(medd<50){
    riskLevel='⚠️ Thận trọng bình thường'; riskColor='g';
    riskNote='MEDD <50: thận trọng tiêu chuẩn. Theo dõi đáp ứng, tác dụng phụ.';
  } else if(medd<90){
    riskLevel='🔶 Nguy cơ trung bình — Tăng giám sát'; riskColor='w';
    riskNote='MEDD 50–<90: CDC 2022 khuyến nghị tăng giám sát. Cân nhắc naloxone dự phòng, đánh giá lại benefit/risk.';
  } else if(medd<120){
    riskLevel='🔴 Nguy cơ cao — Đánh giá lại benefit/risk'; riskColor='r';
    riskNote='MEDD ≥90: nguy cơ quá liều tăng đáng kể. Đánh giá lại mục tiêu điều trị, cân nhắc chuyên khoa đau.';
  } else {
    riskLevel='🚨 Nguy cơ rất cao — ≥120 MME/ngày'; riskColor='r';
    riskNote='MEDD ≥120: nguy cơ tử vong do quá liều rất cao. Cần đánh giá toàn diện, cân nhắc giảm liều hoặc chuyển opioid.';
  }
  // Cảnh báo đặc thù theo loại opioid
  var specNote='';
  if(from==='methadone'||to==='methadone')
    specNote='<br>⚠️ <strong>Methadone</strong>: half-life dài và biến thiên (8–59h), peak ức chế hô hấp kéo dài hơn analgesia. KHÔNG dùng bảng MEDD thông thường để convert — cần chuyên gia và theo dõi sát 3–5 ngày đầu.';
  if(from==='tramadol'||from==='tapentadol')
    specNote+='<br>⚠️ <strong>Tramadol/Tapentadol</strong>: MME dựa trên mức độ µ-receptor agonism; tương quan overdose chưa rõ như full agonists. Ngưỡng MME an toàn chưa được xác định chắc chắn.';
  if(from==='pethi_iv'||to==='pethi_iv')
    specNote+='<br>⚠️ <strong>Pethidine</strong>: KHÔNG khuyến cáo dài ngày — tích lũy norpethidine gây co giật. Không dùng MEDD để convert sang/từ pethidine.';
  sv('op-medd',medd.toFixed(1)+' mg/ngày');
  sv('op-equiv',equiv.toFixed(2)+' '+unit);
  sv('op-rec',recEquiv.toFixed(2)+' '+unit);
  setIB('op',riskColor,'Opioid MEDD — '+riskLevel,
    'MEDD: <strong>'+medd.toFixed(1)+' mg morphine/ngày</strong>.<br>'
    +'Liều tương đương: <strong>'+equiv.toFixed(2)+' '+unit+'</strong>'
    +' → Liều khuyến nghị (−30%): <strong>'+recEquiv.toFixed(2)+' '+unit+'</strong>.<br>'
    +'<strong>Phân tầng nguy cơ:</strong> '+riskNote
    +(specNote?specNote:'')
    +'<br><em>⛔ Không ngưng opioid đột ngột. Không dùng MEDD để titrate cross-tolerance giữa các opioid mà không giảm liều. Luôn giảm 25–50% liều tính được khi chuyển đổi.</em>',
    'Dowell D et al. CDC Clinical Practice Guideline for Prescribing Opioids for Pain — United States, 2022. MMWR Recomm Rep. 2022;71(3):1-95.');
  showRes('op');
}

// ============================================================
// CORTICOID CONVERTER
// ============================================================
var CS_EQ={hc:20,cort:25,pred:5,prednisone:5,mp:4,tri:4,dex:0.75,beta:0.6};
var CS_MIN={hc:'++++ (cao)',cort:'+++ (cao)',pred:'+ (thấp)',prednisone:'+ (thấp)',mp:'± (rất thấp)',tri:'− (không có)',dex:'− (không có)',beta:'− (không có)'};
function calcCS() {
  var from=gs('cs-from'),to=gs('cs-to'),dose=gv('cs-dose');
  hideErr('cs'); hideRes('cs');
  if(!dose){showErr('cs','Nhập liều thuốc nguồn');return;}
  var hcEq=dose*(20/CS_EQ[from]);
  var toEq=hcEq*(CS_EQ[to]/20);
  sv('cs-equiv',toEq.toFixed(2)+' mg/ngày');
  sv('cs-hceq',hcEq.toFixed(0)+' mg/ngày');
  sv('cs-min',CS_MIN[to]||'—');
  setIB('cs','g','Corticosteroid Equivalence',
    dose+'mg '+from+' ≡ '+hcEq.toFixed(0)+'mg Hydrocortisone ≡ <strong>'+toEq.toFixed(2)+'mg '+to+'/ngày</strong>.<br>'
    +'Mineralocorticoid của '+to+': '+CS_MIN[to]+'.<br>'
    +'⚠️ Chỉ tương đương kháng viêm. Tác dụng phụ khác nhau giữa các thuốc.',
    'Rang HP et al. Rang & Dale\'s Pharmacology. 9th ed. Elsevier, 2019.');
  showRes('cs');
}

// ============================================================
// BENZO CONVERTER v2 — Ashton Manual 2002 · validated
// ============================================================
var BZD_TABLE={
  alprazolam:      {name:'Alprazolam',      eq:0.5,  hl:'Ngắn (6-12h)'},
  bromazepam:      {name:'Bromazepam',      eq:5.5,  hl:'Trung bình (10-20h)'},
  chlordiazepoxide:{name:'Chlordiazepoxide',eq:25,   hl:'Dài (5-30h)'},
  clonazepam:      {name:'Clonazepam',      eq:0.5,  hl:'Dài (18-50h)'},
  diazepam:        {name:'Diazepam',        eq:10,   hl:'Dài (20-100h)'},
  lorazepam:       {name:'Lorazepam',       eq:1,    hl:'Trung bình (10-20h)'},
  nitrazepam:      {name:'Nitrazepam',      eq:10,   hl:'TB-Dài (15-38h)'},
  oxazepam:        {name:'Oxazepam',        eq:20,   hl:'Ngắn (4-15h)'},
  temazepam:       {name:'Temazepam',       eq:20,   hl:'Ngắn (8-22h)'},
  triazolam:       {name:'Triazolam',       eq:0.5,  hl:'Rất ngắn (2-5h)'}
};
(function(){
  function bzFmt(n,d){d=d||2;return parseFloat(n.toFixed(d)).toString();}
  function bzBuildSelects(){
    var keys=Object.keys(BZD_TABLE);
    var hf=document.getElementById('bz-from'),ht=document.getElementById('bz-to');
    if(!hf||!ht)return;
    hf.innerHTML='';ht.innerHTML='';
    keys.forEach(function(k){
      var d=BZD_TABLE[k];
      var o1=document.createElement('option');o1.value=k;o1.textContent=d.name;hf.appendChild(o1);
      var o2=document.createElement('option');o2.value=k;o2.textContent=d.name;ht.appendChild(o2);
    });
    hf.value='diazepam';ht.value='diazepam';
  }
  window.bzToggleReduce=function(){
    var w=document.getElementById('bz-reduce-wrap');
    if(w)w.style.display=document.getElementById('bz-reduce').checked?'block':'none';
  };
  function calcBenzo(){
    hideErr('bz');
    var fromKey=document.getElementById('bz-from').value;
    var toKey=document.getElementById('bz-to').value;
    var dose=parseFloat(document.getElementById('bz-dose').value);
    if(!dose||dose<=0){showErr('bz','Nhập liều > 0');return;}
    var base=BZD_TABLE[fromKey],target=BZD_TABLE[toKey];
    var rawEq=dose*(target.eq/base.eq);
    var doReduce=document.getElementById('bz-reduce').checked;
    var pct=doReduce?parseFloat(document.getElementById('bz-reduce-pct').value):0;
    var finalEq=doReduce?rawEq*(1-pct/100):rawEq;
    // Hero
    var dze=dose*(10/base.eq);
    document.getElementById('bz-hero-title').textContent=bzFmt(dose)+'mg '+base.name+' → '+target.name+' '+bzFmt(finalEq)+'mg/ngày';
    document.getElementById('bz-box-dze').textContent=bzFmt(dze)+' mg DZE/ngày';
    document.getElementById('bz-box-eq').textContent=bzFmt(finalEq)+' mg '+target.name+'/ngày';
    document.getElementById('bz-box-t1').textContent=base.hl;
    document.getElementById('bz-box-t2').textContent=target.hl;
    document.getElementById('bz-hero-sub').textContent=doReduce?'Đã giảm '+pct+'% cross-tolerance (chưa giảm: '+bzFmt(rawEq)+' mg)':'Quy đổi trực tiếp · Ashton Manual';
    // Bảng toàn bộ
    var tbody=document.getElementById('bz-table-body');
    tbody.innerHTML='';
    Object.keys(BZD_TABLE).forEach(function(k){
      var d=BZD_TABLE[k];
      var eq=dose*(d.eq/base.eq);
      var tr=document.createElement('tr');
      var isT=k===toKey,isB=k===fromKey;
      if(isT)tr.style.cssText='background:rgba(0,91,142,.07);font-weight:700';
      else if(isB)tr.style.cssText='background:#fafcfc;font-style:italic';
      tr.innerHTML='<td style="padding:8px 10px;border-bottom:1px solid var(--BOR)">'+d.name+(isT?' ⭐':'')+(isB?' (gốc)':'')+'</td>'
        +'<td style="padding:8px 10px;border-bottom:1px solid var(--BOR)">'+bzFmt(d.eq)+' mg</td>'
        +'<td style="padding:8px 10px;border-bottom:1px solid var(--BOR)">'+bzFmt(eq)+' mg</td>'
        +'<td style="padding:8px 10px;border-bottom:1px solid var(--BOR)">'+d.hl+'</td>';
      tbody.appendChild(tr);
    });
    // Diễn giải
    var bShort=base.hl.includes('Ngắn')||base.hl.includes('ngắn');
    var tLong=target.hl.includes('Dài')||target.hl.includes('dài');
    var tShort=target.hl.includes('Ngắn')||target.hl.includes('ngắn');
    var note='';
    if(bShort&&tLong)note='Chuyển từ tác dụng ngắn ('+base.name+') → tác dụng dài ('+target.name+'): nguy cơ tích lũy ở người cao tuổi/suy gan. Phù hợp cho tapering.';
    else if(!bShort&&tShort)note='Chuyển từ tác dụng dài ('+base.name+') → tác dụng ngắn ('+target.name+'): có thể xuất hiện triệu chứng cai giữa liều do nồng độ giảm nhanh hơn.';
    else note=base.name+' và '+target.name+' có thời gian bán thải tương đối gần nhau.';
    setIB('bz','w','Diễn giải lâm sàng',
      note
      +'<br><strong>Dung nạp chéo không hoàn toàn:</strong> bắt đầu với liều thấp hơn 25–50%, điều chỉnh theo đáp ứng — đặc biệt người cao tuổi.'
      +'<br><strong>Tapering:</strong> diazepam (t½ dài) thường dễ cai hơn (Ashton Manual).',
      'Ashton CH. Ashton Manual. Newcastle, 2002. · Brett J et al. Aust Prescr. 2015;38(5):152.');
    document.getElementById('res-bz').style.display='block';
  }
  function bzClear(){
    var hf=document.getElementById('bz-from'),ht=document.getElementById('bz-to');
    if(hf)hf.value='diazepam';
    if(ht)ht.value='diazepam';
    var bd=document.getElementById('bz-dose');if(bd)bd.value='10';
    var br=document.getElementById('bz-reduce');if(br)br.checked=false;
    bzToggleReduce();
    document.getElementById('res-bz').style.display='none';
    hideErr('bz');
  }
  function bzInit(){
    bzBuildSelects();
    var b=document.getElementById('btn-bz');if(b)b.addEventListener('click',calcBenzo);
    var c=document.getElementById('clr-bz');if(c)c.addEventListener('click',bzClear);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bzInit,{once:true});
  else bzInit();
})();

// ============================================================
// SCORES
// ============================================================
function calcSOFA() {
  var resp=parseInt(gs('sf-resp')),plt=parseInt(gs('sf-plt'));
  var bili=parseInt(gs('sf-bili')),card=parseInt(gs('sf-card'));
  var gcs=parseInt(gs('sf-gcs')),cr=parseInt(gs('sf-cr'));
  var tot=resp+plt+bili+card+gcs+cr;
  var mort,risk,color;
  if(tot<=1){mort='<10%';risk='Thấp';color='g';}
  else if(tot<=6){mort='10–20%';risk='Trung bình';color='w';}
  else if(tot<=11){mort='20–40%';risk='Cao';color='r';}
  else if(tot<=14){mort='40–60%';risk='Rất cao';color='r';}
  else{mort='>80%';risk='Cực kỳ cao';color='r';}
  sv('sf-tot',tot+'/24');
  sv('sf-mort',mort);
  sv('sf-risk',risk);
  setIB('sf',color,'SOFA Score',
    'Tổng SOFA: <strong>'+tot+'/24</strong> — Tử vong ICU: <strong>'+mort+'</strong> — '+risk+'.<br>'
    +(tot>=2?'SOFA ≥2 = tiêu chí Sepsis (Sepsis-3). Đánh giá lại mỗi 24–48h.':'Chưa đáp ứng tiêu chí Sepsis.'),
    'Singer M et al. JAMA. 2016;315:801-810 (Sepsis-3).');
  showRes('sf');
}

function scT(v,breaks,scores){for(var i=0;i<breaks.length;i++){if(v<=breaks[i])return scores[i];}return scores[scores.length-1];}
function calcAPACHE() {
  var age=gv('ap-age'),temp=gv('ap-temp'),map=gv('ap-map'),hr=gv('ap-hr');
  var rr=gv('ap-rr'),pao2=gv('ap-pao2'),ph=gv('ap-ph');
  var na=gv('ap-na'),k=gv('ap-k'),cr=gv('ap-cr'),hct=gv('ap-hct'),wbc=gv('ap-wbc');
  var gcs=gv('ap-gcs'),chr=parseInt(gs('ap-chr'));
  hideErr('ap'); hideRes('ap');
  if(!age||!gcs){showErr('ap','Nhập ít nhất: Tuổi và GCS');return;}
  var sT=scT(temp,[35,32,34,35.9,38.4,38.9,39.9,41],[4,4,3,1,0,1,2,4]);
  var sM=scT(map,[49,49,69,109,129,159,160],[4,4,2,0,2,3,4]);
  var sH=scT(hr,[39,39,54,69,109,139,179,180],[4,4,3,2,0,2,3,4]);
  var sR=scT(rr,[5,5,9,11,24,34,49,50],[4,4,3,1,0,1,2,4]);
  var sP=pao2>70?0:pao2>61?1:pao2>55?3:4;
  var sPH=ph?scT(ph,[7.14,7.24,7.32,7.49,7.59,7.69,7.7],[4,3,2,0,1,3,4]):0;
  var sN=na?scT(na,[110,119,129,149,154,159,179,180],[4,3,2,0,1,2,3,4]):0;
  var sK=k?scT(k,[2.4,2.4,2.9,3.4,5.4,5.9,6.9,7],[4,4,2,1,0,1,3,4]):0;
  var sCR=cr?scT(cr,[0.59,1.19,1.49,1.99,3.49,4.99,5],[2,0,2,3,4,6,8]):0;
  var sHCT=hct?scT(hct,[19.9,29.9,45.9,49.9,59.9,60],[4,2,0,1,2,4]):0;
  var sWBC=wbc?scT(wbc,[0.9,2.9,14.9,19.9,39.9,40],[4,2,0,1,2,4]):0;
  var sGCS=15-gcs;
  var ageS=age<45?0:age<55?2:age<65?3:age<75?5:6;
  var aps=sT+sM+sH+sR+sP+sPH+sN+sK+sCR+sHCT+sWBC+sGCS;
  var tot=aps+ageS+chr;
  var mort=Math.min(99,Math.round(100/(1+Math.exp(-(-3.517+0.146*tot)))));
  sv('ap-tot',tot);
  sv('ap-mort',mort+'%');
  var color=mort<15?'g':mort<35?'w':'r';
  setIB('ap',color,'APACHE II Score',
    'Tổng APACHE II: <strong>'+tot+'</strong> — Tử vong dự đoán: <strong>'+mort+'%</strong>.<br>'
    +(tot<10?'Bệnh nhẹ.':tot<20?'Bệnh trung bình, theo dõi chặt.':tot<30?'Bệnh nặng, ICU.':'Bệnh rất nặng, tỷ lệ tử vong cao.'),
    'Knaus WA et al. Crit Care Med. 1985;13:818-829.');
  showRes('ap');
}

function calcGCS() {
  var e=parseInt(gs('gc-e')),v=parseInt(gs('gc-v')),m=parseInt(gs('gc-m'));
  var tot=e+v+m;
  var grade,color;
  if(tot>=13){grade='Nhẹ (13–15)';color='g';}
  else if(tot>=9){grade='Vừa (9–12)';color='w';}
  else{grade='Nặng (3–8)';color='r';}
  sv('gc-tot',tot);
  sv('gc-grd',grade);
  setIB('gc',color,'Glasgow Coma Scale (GCS)',
    'GCS: <strong>E'+e+'V'+v+'M'+m+' = '+tot+'</strong> — '+grade+'.<br>'
    +(tot<=8?'⚠️ GCS ≤8: xem xét đặt nội khí quản bảo vệ đường thở.':
    tot<=12?'Theo dõi sát, đánh giá lại thường xuyên.':'Không có mất ý thức nghiêm trọng.'),
    'Teasdale G, Jennett B. Lancet. 1974;2:81-84.');
  showRes('gc');
}

// ============================================================
// CHA2DS2-VASc + CURB65
// ============================================================
function calcCHA() {
  var c=parseInt(gs('cha-c')),h=parseInt(gs('cha-h')),a2=parseInt(gs('cha-a2'));
  var d=parseInt(gs('cha-d')),s2=parseInt(gs('cha-s2')),v=parseInt(gs('cha-v'));
  var a=parseInt(gs('cha-a')),sc=parseInt(gs('cha-sc'));
  var tot=c+h+a2+d+s2+v+a+sc;
  var risks=[0,1.3,2.2,3.2,4.0,6.7,9.8,9.6,6.7,15.2];
  var riskPct=risks[Math.min(tot,9)]||risks[9];
  var rec,color;
  if(tot===0){rec='Không cần OAC';color='g';}
  else if(tot===1&&sc===1){rec='Không cần (điểm chỉ từ giới nữ)';color='g';}
  else if(tot===1){rec='Xem xét OAC';color='w';}
  else{rec='Khuyến cáo OAC (NOAC ưu tiên)';color='r';}
  sv('cha-tot',tot);
  sv('cha-risk',riskPct+'%/năm');
  sv('cha-rec',rec);
  setIB('cha',color,'CHA₂DS₂-VASc — Nguy cơ đột quỵ rung nhĩ',
    'Điểm: <strong>'+tot+'</strong> — Nguy cơ đột quỵ: ~'+riskPct+'%/năm — <strong>'+rec+'</strong>.<br>'
    +(tot>=2?'Lựa chọn: NOAC (rivaroxaban, apixaban, dabigatran) ưu tiên hơn warfarin trừ van tim cơ học.':''),
    'Lip GY et al. Chest. 2010. · ESC Guidelines AF 2020.');
  showRes('cha');
}

function calcCURB() {
  var c=parseInt(gs('cb-c')),u=parseInt(gs('cb-u')),r=parseInt(gs('cb-r'));
  var b=parseInt(gs('cb-b')),age=parseInt(gs('cb-65'));
  var tot=c+u+r+b+age;
  var morts=[0.7,2.1,9.2,14.5,40,57];
  var mort=morts[Math.min(tot,5)];
  var sev,color;
  if(tot<=1){sev='Nhẹ — điều trị ngoại trú';color='g';}
  else if(tot===2){sev='Vừa — nhập viện hoặc theo dõi';color='w';}
  else{sev='Nặng — nhập viện ICU';color='r';}
  sv('cb-tot',tot);
  sv('cb-mort',mort+'%');
  sv('cb-sev',sev);
  setIB('cb',color,'CURB-65 — Viêm phổi cộng đồng',
    'CURB-65: <strong>'+tot+'/5</strong> — Tử vong 30 ngày: ~'+mort+'%.<br>'
    +'Xử trí: <strong>'+sev+'</strong>. Chọn kháng sinh theo hướng dẫn CAP địa phương.',
    'Lim WS et al. Thorax. 2003;58:377-382.');
  showRes('cb');
}

// ============================================================
// NEWS2
// ============================================================
function calcNEWS2() {
  var spo2=parseInt(gs('n2-spo2')),o2=parseInt(gs('n2-o2'));
  var rr_raw=gs('n2-rr'),temp_raw=gs('n2-temp');
  var sbp_raw=gs('n2-sbp'),hr_raw=gs('n2-hr'),avpu_raw=gs('n2-avpu');
  var rr=parseInt(rr_raw),temp=parseInt(temp_raw);
  var sbp=parseInt(sbp_raw),hr=parseInt(hr_raw),avpu=parseInt(avpu_raw);
  var tot=spo2+o2+rr+temp+sbp+hr+avpu;
  var risk,resp,color;
  if(tot===0){risk='Thấp';resp='Theo dõi mỗi 12h';color='g';}
  else if(tot<=4){risk='Thấp–Vừa';resp='Đánh giá lại mỗi 4–6h';color='g';}
  else if(tot<=6){risk='Vừa';resp='Đánh giá bác sĩ trong 1h';color='w';}
  else if(tot<=8){risk='Cao';resp='Bác sĩ cấp cao khẩn';color='r';}
  else{risk='Rất cao';resp='🚨 Kích hoạt RRT / ICU ngay';color='r';}
  sv('n2-tot',tot);
  sv('n2-risk',risk);
  sv('n2-resp',resp);
  setIB('n2',color,'NEWS2 — '+risk,
    'NEWS2: <strong>'+tot+'</strong> — '+risk+'.<br>Đáp ứng: <strong>'+resp+'</strong>.<br>'
    +(tot>=7?'⚠️ NEWS2 ≥7: nguy cơ tử vong trong viện tăng cao. Kích hoạt đội phản ứng nhanh (RRT) ngay lập tức.':''),
    'Royal College of Physicians. NEWS2. London: RCP, 2017.');
  showRes('n2');
}

// ============================================================
// DAPT + HAS-BLED
// ============================================================
function calcDAPT() {
  var age=parseInt(gs('dp-age')),sm=parseInt(gs('dp-sm')),dm=parseInt(gs('dp-dm'));
  var mi=parseInt(gs('dp-mi')),pci=parseInt(gs('dp-pci')),ptx=parseInt(gs('dp-ptx'));
  var sm2=parseInt(gs('dp-sm2')),chf=parseInt(gs('dp-chf')),svg=parseInt(gs('dp-svg'));
  var tot=age+sm+dm+mi+pci+ptx+sm2+chf+svg;
  var rec,color;
  if(tot>=2){rec='Kéo dài DAPT 30 tháng ↑ lợi ích tim mạch';color='g';}
  else{rec='DAPT tiêu chuẩn 12 tháng';color='w';}
  sv('dp-tot',tot);
  sv('dp-rec',rec);
  setIB('dp',color,'DAPT Score',
    'Điểm DAPT: <strong>'+tot+'</strong>. '+rec+'.<br>'
    +'⚠️ Cân nhắc đồng thời HAS-BLED và đặc điểm lâm sàng trước khi quyết định.',
    'Yeh RW et al. JAMA. 2016;315:1735-1749.');
  showRes('dp');
}

function calcHASBLED() {
  var h=parseInt(gs('hb-h')),a=parseInt(gs('hb-a')),s=parseInt(gs('hb-s'));
  var b=parseInt(gs('hb-b')),l=parseInt(gs('hb-l')),e=parseInt(gs('hb-e')),d=parseInt(gs('hb-d'));
  var tot=h+a+s+b+l+e+d;
  var bleeds=[1.13,1.02,1.88,3.74,8.70,12.50,12.50,12.50,12.50];
  var risk=bleeds[Math.min(tot,8)];
  var lev,color;
  if(tot<=1){lev='Thấp';color='g';}
  else if(tot<=2){lev='Trung bình';color='w';}
  else{lev='Cao';color='r';}
  sv('hb-tot',tot);
  sv('hb-risk',risk+'%/năm');
  sv('hb-lev',lev);
  setIB('hb',color,'HAS-BLED — Nguy cơ chảy máu',
    'HAS-BLED: <strong>'+tot+'</strong> — '+risk+'%/năm chảy máu nặng — <strong>'+lev+'</strong>.<br>'
    +(tot>=3?'⚠️ Nguy cơ cao — không chống chỉ định OAC, nhưng xử lý các yếu tố nguy cơ có thể điều chỉnh.':''),
    'Pisters R et al. Chest. 2010;138:1093-1100.');
  showRes('hb');
}

// ============================================================
// NUTRITION
// ============================================================
function calcNutrition() {
  var wt=gv('nt-wt'),ht=gv('nt-ht'),age=gv('nt-age'),sex=gs('nt-sex');
  var stress=parseFloat(gs('nt-stress'));
  hideErr('nt'); hideRes('nt');
  if(!wt||!ht||!age){showErr('nt','Nhập đầy đủ: Cân nặng, Chiều cao, Tuổi');return;}
  var bmr=sex==='male'?10*wt+6.25*ht-5*age+5:10*wt+6.25*ht-5*age-161;
  var kcal=Math.round(bmr*stress/50)*50;
  var prot=Math.round((1.2+0.3*(stress-1))*wt);
  var fat=Math.round(kcal*0.3/9);
  var dex=Math.round((kcal-fat*9-prot*4)/4);
  var fluid=Math.round(35*wt);
  var bmi=wt/((ht/100)**2);
  sv('nt-kcal',kcal);sv('nt-prot',prot);sv('nt-dex',dex);
  sv('nt-fat',fat);sv('nt-fluid',fluid);sv('nt-bmi',bmi.toFixed(1));
  setIB('nt','g','Dinh dưỡng — TPN/EN',
    'Nhu cầu: <strong>'+kcal+' kcal/ngày</strong> (stress factor '+stress+'×). Đạm: <strong>'+prot+'g/ngày</strong> ('+(prot/wt).toFixed(2)+' g/kg).<br>'
    +'Tỷ lệ: Carb '+dex*4+' kcal ('+Math.round(dex*4/kcal*100)+'%) · Lipid '+fat*9+' kcal ('+Math.round(fat*9/kcal*100)+'%) · Đạm '+prot*4+' kcal.<br>'
    +'Dịch: '+fluid+' mL/ngày.',
    'ASPEN 2022 · Singer P et al. ESPEN ICU Guideline 2019.');
  showRes('nt');
}

// ============================================================
// PHENYTOIN TDM
// ============================================================
function calcPhenCorr() {
  var val=gv('pc-val'),alb=gv('pc-alb'),crcl=gv('pc-crcl'),vpa=gs('pc-vpa');
  hideErr('pc'); hideRes('pc');
  if(!val||!alb){showErr('pc','Nhập Phenytoin đo được và Albumin');return;}
  var corr;
  if(crcl&&crcl<10) corr=val/(0.1*alb+0.1);
  else if(vpa==='yes') corr=val/((0.25*alb/4.4)+0.1);
  else corr=val/(alb/4.4*0.9+0.1);
  var free=corr*0.1;
  var stat,color;
  if(corr<10){stat='Dưới điều trị (<10 mg/L)';color='w';}
  else if(corr<=20){stat='Trong ngưỡng (10–20 mg/L)';color='g';}
  else{stat='Trên ngưỡng (>20 mg/L)';color='r';}
  sv('pc-corr',corr.toFixed(1));
  sv('pc-free',free.toFixed(1)+' mg/L');
  sv('pc-stat',stat);
  setIB('pc',color,'Phenytoin — Hiệu chỉnh Albumin (Winter-Tozer)',
    'Phenytoin hiệu chỉnh: <strong>'+corr.toFixed(1)+' mg/L</strong> (Albumin BT = 4.4 g/dL).<br>'
    +'Ước tính tự do: '+free.toFixed(1)+' mg/L. Trạng thái: <strong>'+stat+'</strong>.<br>'
    +(corr>20?'Giảm liều. Theo dõi triệu chứng ngộ độc: rung giật nhãn cầu, mất điều phối.':
    corr<10?'Tăng liều. Kiểm tra tuân thủ điều trị.':'Duy trì phác đồ.'),
    'Winter ME. Basic Clinical Pharmacokinetics. 5th Ed. (Winter-Tozer Equation).');
  showRes('pc');
}

function calcPhenLoad() {
  var wt=gv('pl-wt'),curr=gv('pl-curr'),tgt=parseFloat(gs('pl-tgt')),vd=parseFloat(gs('pl-vd'));
  if(!wt) return;
  var dose=Math.round((tgt-curr)*vd*wt/50)*50;
  var time=Math.round(dose/50);
  sv('pl-dose',dose+' mg');
  sv('pl-rate','≤50 mg/phút');
  sv('pl-time',time+' phút tối thiểu');
  setIB('pl','w','Phenytoin Loading Dose',
    'Loading dose: <strong>'+dose+'mg</strong> pha trong NaCl 0.9% (tuyệt đối không pha Dextrose).<br>'
    +'Tốc độ: ≤50 mg/phút (cao tuổi/tim mạch: ≤25 mg/phút). Thời gian tối thiểu: <strong>'+time+' phút</strong>.<br>'
    +'⚠️ Theo dõi ECG và HA liên tục trong suốt thời gian truyền.',
    'Micromedex · Winter ME. Basic Clinical Pharmacokinetics.');
  document.getElementById('res-pl').style.display='block';
}

// ============================================================
// WARFARIN
// ============================================================
function calcWarfarin() {
  var inr=gv('wf-inr'),dose=gv('wf-dose'),tgt=gs('wf-tgt');
  hideErr('wf'); hideRes('wf');
  if(!inr||!dose){showErr('wf','Nhập INR và liều warfarin hiện tại');return;}
  var low=tgt==='2_3'?2:2.5, high=tgt==='2_3'?3:3.5;
  var pct=0,action='',color='g';
  if(inr<low-0.5){pct=20;action='Tăng liều 15–20%';color='w';}
  else if(inr<low){pct=10;action='Tăng liều 5–10%';color='w';}
  else if(inr<=high){pct=0;action='Duy trì liều hiện tại ✓';color='g';}
  else if(inr<=high+0.5){pct=-10;action='Giảm liều 5–10%';color='w';}
  else if(inr<=5){pct=-20;action='Giảm liều 10–15%';color='w';}
  else if(inr<=9){pct=-100;action='Bỏ 1–2 liều, giảm 20–25%';color='r';}
  else{pct=-100;action='⚠️ Ngưng thuốc, xem xét Vitamin K IV';color='r';}
  var newDose=pct===-100?dose:Math.round(dose*(1+pct/100)/5)*5;
  sv('wf-newdose',pct===-100?'—':newDose+' mg/tuần');
  sv('wf-chg',pct===0?'Không đổi':(pct>0?'+':'')+pct+'%');
  sv('wf-act',action);
  setIB('wf',color,'Warfarin — Điều chỉnh liều',
    'INR: <strong>'+inr+'</strong> (mục tiêu: '+low+'–'+high+'). Liều hiện tại: '+dose+' mg/tuần.<br>'
    +'Khuyến nghị: <strong>'+action+'</strong>.<br>'
    +'Tái kiểm INR sau '+(Math.abs(pct)>10?'3–5':'5–7')+' ngày.',
    'Fennerty AG et al. BMJ. 1984. · ACC/AHA VTE Guidelines.');
  showRes('wf');
}

// ============================================================
// IV FLUID
// ============================================================
function calcIVRate() {
  var vol=gv('ir-vol'),time=gv('ir-time'),wt=gv('ir-wt');
  hideErr('ir'); hideRes('ir');
  if(!vol||!time){showErr('ir','Nhập Thể tích và Thời gian');return;}
  var mlh=vol/time;
  var d15=Math.round(mlh/60*15),d20=Math.round(mlh/60*20);
  sv('ir-mlh',mlh.toFixed(1));
  sv('ir-kgh',wt>0?(mlh/wt).toFixed(2):'—');
  sv('ir-d15',d15);
  sv('ir-d20',d20);
  var color=mlh>500?'r':mlh>200?'w':'g';
  setIB('ir',color,'Tốc độ truyền dịch IV',
    'Tốc độ: <strong>'+mlh.toFixed(1)+' mL/h</strong>.<br>'
    +(wt>0?'= '+(mlh/wt).toFixed(2)+' mL/kg/h.<br>':'')
    +'Giọt/phút: <strong>'+d15+' (set 15 g/mL)</strong> / '+d20+' (set 20 g/mL).<br>'
    +(mlh>500?'⚠️ Tốc độ cao — đảm bảo chỉ định rõ ràng.':''));
  showRes('ir');
}

function calcIVVol() {
  var rate=gv('iv-rate'),time=gv('iv-time');
  var start=document.getElementById('iv-start')?document.getElementById('iv-start').value:'08:00';
  hideErr('ivv'); hideRes('ivv');
  if(!rate||!time){showErr('ivv','Nhập Tốc độ và Thời gian');return;}
  var vol=rate*time,endT=addTime(start,time);
  sv('ivv-ml',Math.round(vol));
  sv('ivv-end',endT);
  sv('ivv-b5',Math.ceil(vol/500)+' túi');
  setIB('ivv','g','Thể tích dịch truyền','Tổng thể tích: <strong>'+Math.round(vol)+' mL</strong>.<br>'+'Bắt đầu '+start+' → Kết thúc: <strong>'+endT+'</strong>.');
  showRes('ivv');
}

function calcIVTime() {
  var vol=gv('it-vol'),rate=gv('it-rate');
  var start=document.getElementById('it-start')?document.getElementById('it-start').value:'08:00';
  hideErr('it'); hideRes('it');
  if(!vol||!rate){showErr('it','Nhập Thể tích và Tốc độ');return;}
  var hours=vol/rate,hh=Math.floor(hours),mm=Math.round((hours-hh)*60);
  var endT=addTime(start,hours);
  sv('it-h',hours.toFixed(2));
  sv('it-hm',hh+'h '+mm+'ph');
  sv('it-end',endT);
  setIB('it','g','Thời gian truyền dịch',vol+' mL ÷ '+rate+' mL/h = <strong>'+hh+'h '+mm+'ph</strong>.<br>Kết thúc dự kiến: <strong>'+endT+'</strong>.');
  showRes('it');
}

function calcIVDrops() {
  var vol=gv('id-vol'),mins=gv('id-min'),set=parseFloat(gs('id-set'));
  hideErr('id'); hideRes('id');
  if(!vol||!mins){showErr('id','Nhập Thể tích và Thời gian (phút)');return;}
  var dpm=(vol*set)/mins,dp10=Math.round(dpm/6*10)/10,mlh=vol/(mins/60);
  sv('id-dpm',dpm.toFixed(1));
  sv('id-d10s',dp10.toFixed(1));
  sv('id-mlh',mlh.toFixed(1));
  setIB('id',dpm>60?'w':'g','Giọt/phút (Drop Rate)',
    'Tốc độ: <strong>'+dpm.toFixed(1)+' giọt/phút</strong> (set '+set+' g/mL).<br>'
    +'Đếm thực tế: <strong>'+dp10.toFixed(1)+' giọt/10 giây</strong>.<br>'
    +(dpm>60?'⚠️ Tốc độ cao — khuyến cáo dùng bơm tiêm điện để đảm bảo chính xác.':''));
  showRes('id');
}

// ============================================================
// ELECTROLYTE
// ============================================================
function calcSodium() {
  var curr=gv('na-curr'),tgt=gv('na-tgt'),wt=gv('na-wt'),sex=gs('na-sex');
  var fl=parseFloat(gs('na-fl')),hr=gv('na-hr');
  hideErr('na'); hideRes('na');
  if(!curr||!tgt||!wt){showErr('na','Nhập đầy đủ: Na⁺ hiện tại, mục tiêu, cân nặng');return;}
  if(curr>=tgt){showErr('na','Na⁺ mục tiêu phải lớn hơn hiện tại');return;}
  if(fl<=curr){showErr('na','Na⁺ của dịch truyền phải lớn hơn Na⁺ huyết thanh hiện tại — dịch này sẽ làm giảm Na⁺, không phù hợp để bù.');return;}
  var tbw=(sex==='male'?0.6:0.5)*wt;
  // Công thức Adrogue-Madias (Adrogué HJ, Madias NE. N Engl J Med. 2000): 
  // ΔNa⁺ huyết thanh mỗi LÍT dịch truyền = (Na⁺ dịch truyền − Na⁺ huyết thanh) / (TBW + 1)
  // → Thể tích dịch cần truyền để đạt mức tăng Na⁺ mục tiêu = (Na⁺ mục tiêu − Na⁺ hiện tại) / ΔNa⁺-mỗi-lít
  var deltaNaPerL=(fl-curr)/(tbw+1);
  var targetRise=tgt-curr;
  var vol=Math.round((targetRise/deltaNaPerL)*1000);
  var rate=hr>0?vol/hr:vol/24;
  var rateNa=(rate/1000)*deltaNaPerL;
  var rise=rateNa*24;
  sv('na-def',deltaNaPerL.toFixed(2));
  sv('na-vol',vol);
  sv('na-rate',rate.toFixed(1)+' mL/h');
  sv('na-rise',rise.toFixed(1));
  var color=rise>8?'r':rise>6?'w':'g';
  setIB('na',color,'Bù Natri — Adrogue-Madias',
    'TBW: '+tbw.toFixed(1)+'L · ΔNa⁺ mỗi lít dịch truyền: <strong>'+deltaNaPerL.toFixed(2)+' mmol/L</strong>.<br>'
    +'Truyền <strong>'+vol+' mL</strong> trong '+(hr||24)+'h = <strong>'+rate.toFixed(1)+' mL/h</strong> ('+rateNa.toFixed(2)+' mmol Na⁺ tăng/h, dự kiến).<br>'
    +(rise>8?'🚨 Tốc độ tăng Na⁺ dự kiến <strong>'+rise.toFixed(1)+' mmol/24h > 8 mmol</strong> — NGUY CƠ ODS! Phải giảm tốc độ.':
    rise>6?'⚠️ Gần giới hạn trên ('+rise.toFixed(1)+' mmol/24h). Kiểm tra điện giải mỗi 4–6h.':
    '✅ An toàn ('+rise.toFixed(1)+' mmol/24h ≤ 8).')+'<br>Kiểm tra Na⁺ mỗi 2–4h. Công thức Adrogue-Madias chỉ ước tính ban đầu — không thay thế theo dõi Na⁺ huyết thanh lặp lại.',
    'Adrogué HJ, Madias NE. N Engl J Med. 2000;342:1581-1589.');
  showRes('na');
}

function calcPotassium() {
  var curr=gv('kp-curr'),tgt=gv('kp-tgt'),wt=gv('kp-wt'),rt=gs('kp-rt'),crcl=gv('kp-crcl');
  hideErr('kp'); hideRes('kp');
  if(!curr||!tgt||!wt){showErr('kp','Nhập đầy đủ: K⁺ hiện tại, mục tiêu, cân nặng');return;}
  if(curr>=tgt){showErr('kp','K⁺ mục tiêu phải lớn hơn hiện tại');return;}
  var def;
  if(curr>=3.0) def=(tgt-curr)*100;
  else if(curr>=2.5) def=(tgt-3.0)*100+(3.0-curr)*200;
  else if(curr>=2.0) def=(tgt-3.0)*100+100+(2.5-curr)*300;
  else def=(tgt-3.0)*100+100+150+(2.0-curr)*400;
  def=Math.max(def,(tgt-curr)*100);
  def=Math.round(def/10)*10;
  var kclMl=def, sess=Math.ceil(def/10);
  sv('kp-tot',def);
  sv('kp-kcl',kclMl+' mL');
  sv('kp-sess',sess+' lần');
  var color=curr<2.5?'r':curr<3.0?'w':'g';
  setIB('kp',color,'Bù Kali — K⁺',
    (curr<2.0?'🚨 Hạ Kali nặng nguy hiểm tính mạng.':curr<2.5?'⚠️ Hạ Kali nặng.':curr<3.0?'Hạ Kali vừa.':'Hạ Kali nhẹ.')+' '
    +'Ước tính thiếu hụt: <strong>'+def+' mmol K⁺</strong>.<br>'
    +(rt==='iv'?'Bù IV: <strong>'+kclMl+' mL KCl 10%</strong>, chia <strong>'+sess+' lần × 10 mmol</strong>.<br>⚠️ Không tiêm KCl trực tiếp IV — nguy cơ ngưng tim. Phải pha loãng.':
    'Bù uống: chia nhiều lần, uống sau ăn.')
    +(crcl<30?'<br>⚠️ Suy thận nặng: giảm 50% liều, theo dõi ECG mỗi 2h.':'')
    +'<br>Điều chỉnh đồng thời Magiê nếu thiếu hụt.',
    'Mount DB. UpToDate 2024. · Weiner ID et al. Clin J Am Soc Nephrol. 2013.');
  showRes('kp');
}

function calcKRate() {
  var mmol=gv('kr-mmol'),conc=parseFloat(gs('kr-conc')),acc=gs('kr-acc');
  hideErr('kr'); hideRes('kr');
  if(!mmol){showErr('kr','Nhập tổng K⁺ cần truyền');return;}
  var maxRates={peripheral:10,central:20,icu:40};
  var maxR=maxRates[acc]||10;
  var vol=Math.round(mmol/conc*1000);
  var time=mmol/maxR;
  var mlh=vol/time;
  var warn='',color='g';
  if(acc==='peripheral'&&conc>40){color='r';warn='🚨 Nồng độ >40 mmol/L KHÔNG AN TOÀN qua ngoại vi. Dùng đường trung tâm.';}
  else if(acc==='peripheral'&&conc===40){color='w';warn='⚠️ Nồng độ 40 mmol/L qua ngoại vi: theo dõi vị trí kim.';}
  else{warn='✅ An toàn cho đường truyền đã chọn.';}
  sv('kr-maxr',maxR+' mmol/h');
  sv('kr-mlh',mlh.toFixed(1)+' mL/h');
  sv('kr-vol',vol+' mL');
  sv('kr-time',time.toFixed(1)+'h');
  setIB('kr',color,'Tốc độ truyền K⁺ IV',
    mmol+' mmol KCl pha nồng độ '+conc+' mmol/L → <strong>'+vol+' mL</strong>.<br>'
    +'Tốc độ: <strong>'+mlh.toFixed(1)+' mL/h</strong> ('+maxR+' mmol/h). Thời gian: <strong>'+time.toFixed(1)+'h</strong>.<br>'
    +warn,
    'WHO Potassium Replacement Guidelines. · ASHP Drug Information 2024.');
  showRes('kr');
}

function calcBicarb() {
  var curr=gv('hc-curr'),tgt=gv('hc-tgt'),wt=gv('hc-wt'),ph=gv('hc-ph');
  var conc=parseFloat(gs('hc-conc')),strat=parseFloat(gs('hc-strat'));
  hideErr('hc'); hideRes('hc');
  if(!curr||!tgt||!wt){showErr('hc','Nhập đầy đủ: HCO₃⁻ hiện tại, mục tiêu, cân nặng');return;}
  if(curr>=tgt){showErr('hc','HCO₃⁻ mục tiêu phải lớn hơn hiện tại');return;}
  var def=0.3*wt*(tgt-curr);
  var dose=def*strat;
  var vol=Math.round(dose/conc);
  var infTime=ph&&ph<7.1?2:4;
  var rate=Math.round(vol/infTime);
  sv('hc-def',def.toFixed(0));
  sv('hc-dose',dose.toFixed(0));
  sv('hc-vol',vol);
  sv('hc-rate',rate+' mL/h');
  var color=ph&&ph<7.0?'r':ph&&ph<7.1?'w':'g';
  setIB('hc',color,'Bù Bicarbonate (Astrup)',
    (ph&&ph<7.0?'🚨 pH <7.0 — Nhiễm toan nguy hiểm.':ph&&ph<7.1?'⚠️ pH <7.1 — Nhiễm toan nặng.':'')+' '
    +'Thiếu hụt: <strong>'+def.toFixed(0)+' mmol</strong>. Bù '+(strat*100)+'%: <strong>'+dose.toFixed(0)+' mmol</strong>.<br>'
    +'Cần <strong>'+vol+' mL NaHCO₃</strong> '+(conc===1?'8.4%':conc===0.5?'4.2%':'1.4%')+'.<br>'
    +'Truyền trong '+infTime+'h = <strong>'+rate+' mL/h</strong>.<br>'
    +'⚠️ Na⁺ bổ sung: '+dose.toFixed(0)+' mmol. Tái đánh giá khí máu sau 1–2h.',
    'Berend K et al. N Engl J Med. 2014;371:1434-1445. · KDIGO AKI Guidelines 2012.');
  showRes('hc');
}

// ============================================================
// DRUG DATABASE
// ============================================================
var DRUG_DB = window.DRUG_DB = {
  vancomycin:{name:'Vancomycin',cls:'Glycopeptide',dose:'15–20 mg/kg/lần mỗi 8–12h IV (truyền ≥1h)',ind:'MRSA, nhiễm khuẩn Gram(+) nặng',monitor:'AUC/MIC 400–600 mg·h/L; Trough <10 mg/L; Creatinine',ci:'Dị ứng vancomycin',note:'Red Man Syndrome: truyền chậm ≥1h. Tránh bolus'},
  gentamicin:{name:'Gentamicin',cls:'Aminoglycoside',dose:'1.5–2.5 mg/kg q8–12h hoặc 7 mg/kg q24h (EID)',ind:'Nhiễm khuẩn Gram(-), phối hợp viêm nội tâm mạc',monitor:'Peak 6–10 mg/L; Trough <2 mg/L; Thính giác',ci:'Suy thính giác nặng',note:'Độc tính thận và thính giác tích lũy. TDM Peak/Trough'},
  amikacin:{name:'Amikacin',cls:'Aminoglycoside',dose:'7.5 mg/kg q12h hoặc 15–20 mg/kg q24h (EID)',ind:'Nhiễm khuẩn Gram(-) đa kháng (MDR)',monitor:'Peak 20–30 mg/L; Trough <10 mg/L',ci:'Suy thính giác nặng',note:'Phổ rộng hơn gentamicin. Hiệu chỉnh theo CrCl'},
  colistin:{name:'Colistin (CMS, Polymyxin E)',cls:'Polymyxin',dose:'Loading 9 MIU, Maintenance 4.5 MIU q12h',ind:'XDR/PDR Gram(-): Acinetobacter, Pseudomonas, KPC',monitor:'Creatinine hàng ngày, nồng độ đáy',ci:'Không có CCĐ tuyệt đối, thận trọng suy thận nặng',note:'Pha ≥250 mL, truyền 30–60 phút. TDM nếu có thể'},
  warfarin:{name:'Warfarin',cls:'Vitamin K Antagonist (VKA)',dose:'Khởi đầu 2–5 mg/ngày, chỉnh theo INR',ind:'Rung nhĩ, DVT/PE, van tim cơ học',monitor:'INR mục tiêu 2.0–3.0 hoặc 2.5–3.5',ci:'Mang thai, chảy máu tích cực, tiểu cầu <50k',note:'Nhiều tương tác thuốc và thức ăn. Phụ nữ mang thai tuyệt đối tránh'},
  metformin:{name:'Metformin',cls:'Biguanide',dose:'500–2550 mg/ngày chia 2–3 lần, uống cùng ăn',ind:'ĐTĐ type 2 đầu tay',monitor:'CrCl, lactate (nghi nhiễm toan)',ci:'eGFR <30, suy gan, nhiễm toan, rượu nặng',note:'Tạm ngưng trước thủ thuật cản quang IV 48h'},
  digoxin:{name:'Digoxin (Lanoxin)',cls:'Cardiac Glycoside — ức chế Na⁺/K⁺-ATPase',dose:'NL loading IV: 8–12 mcg/kg chia 3 lần (½+¼+¼) cách 6–8h; Duy trì PO: 0.125–0.25 mg/ngày (thận BT); 0.0625 mg/ngày (suy thận). Trẻ <2T duy trì: 11.3–18.8 mcg/kg/ngày ÷ 2',ind:'Rung nhĩ mạn tính (kiểm soát tần số thất), cuồng nhĩ; suy tim HFrEF kèm rung nhĩ',monitor:'Nồng độ máu 0.5–0.9 ng/mL (lấy ≥6h sau liều); K⁺, Mg²⁺, Ca²⁺; ECG; creatinine; chức năng thận',ci:'Block AV hoàn toàn ngắt quãng/độ 2, hội chứng WPW, ngộ độc digitalis, phì đại cơ tim tắc nghẽn',note:'Cửa sổ điều trị rất hẹp. Hạ K⁺/Mg²⁺ + tăng Ca²⁺ tăng độc tính. Ngộ độc: nhịp chậm, block AV, buồn nôn, nhìn vàng → Digifab (kháng thể Fab). DTQGVN 2023'},
  phenytoin:{name:'Phenytoin (Dilantin)',cls:'Antiepileptic — ức chế kênh Na⁺ / Nhóm hydantoin',dose:'NL uống: Khởi đầu 3–4 mg/kg/ngày (150–300 mg ÷ 1–2); duy trì 200–500 mg/ngày. IV (trạng thái động kinh): 15–20 mg/kg ≤50 mg/phút; duy trì 1–3 mg/kg/phút. Trẻ em: 5 mg/kg/ngày ÷ 2',ind:'Động kinh tonic-clonic, động kinh cục bộ; trạng thái động kinh; loạn nhịp thất do nhiễm độc digitalis kháng thuốc khác',monitor:'Nồng độ 10–20 mcg/mL (40–80 micromol/L); hiệu chỉnh albumin (Winter-Tozer); ECG khi dùng IV; chức năng gan',ci:'Block AV độ 2–3, nhịp chậm xoang, Adams-Stokes; dị ứng hydantoin; tiêm trong động mạch',note:'Động học PHI TUYẾN (bão hòa): tăng liều nhỏ → nồng độ tăng nhiều. Không pha trong Dextrose (tủa). Tiêm ≤50 mg/phút. Winter-Tozer: nồng độ hiệu chỉnh = đo/(0.2×albumin + 0.1). DTQGVN 2023'},
  heparin:{name:'Heparin UFH',cls:'Anticoagulant — Heparin không phân đoạn',dose:'DVT/PE: Bolus 80 đv/kg IV → truyền 18 đv/kg/h; điều chỉnh theo aPTT. Dự phòng: 5000 đv TDD mỗi 8–12h. Lọc máu: 1000–5000 đv bolus → 250–1000 đv/h. Trẻ em: 75 đv/kg IV → 20 đv/kg/h',ind:'DVT/PE cấp, ACS, huyết khối tĩnh mạch sâu, dự phòng huyết khối nằm lâu, ĐMNS rải rác, lọc máu',monitor:'aPTT mục tiêu 60–100s (1.5–2× chứng); Anti-Xa 0.3–0.7 IU/mL; tiểu cầu ngày 4 và 8–10 (nguy cơ HIT); Hct hàng ngày',ci:'Chảy máu không kiểm soát, HIT type II (tiền sử hoặc hiện tại), dị ứng heparin; không có điều kiện theo dõi đông máu',note:'Giải độc: Protamine sulfate 1 mg/100 đv heparin (tối đa 50 mg IV chậm). HIT type II: ngừng heparin ngay → dùng argatroban thay thế. Không dùng heparin có cồn benzylic ở trẻ sơ sinh. DTQGVN 2023'},
  amiodarone:{name:'Amiodarone',cls:'Class III Antiarrhythmic',dose:'IV: 150mg bolus → 1mg/phút×6h → 0.5mg/phút×18h; PO: 200–400mg/ngày',ind:'VT, VF, rung nhĩ kháng trị',monitor:'TSH, chức năng gan, X-quang phổi (mỗi 6–12 tháng); QTc; Corneal microdeposits',ci:'Block AV, QTc >500ms, suy giáp/cường giáp chưa điều trị, iode dị ứng',note:'T½ 40–55 ngày. Ức chế CYP2C9 (warfarin), CYP3A4 (statin, digoxin)'},
  furosemide:{name:'Furosemide (Lasix)',cls:'Lợi tiểu quai — ức chế Na⁺-K⁺-2Cl⁻ đoạn dày nhánh lên quai Henle',dose:'NL uống: 20–40 mg × 1 lần sáng; tối đa 80 mg/ngày thông thường. NL IV cấp cứu: 20–50 mg tiêm chậm ≤4 mg/phút; tối đa 1.5 g/ngày. Bơm tiêm điện IV: 5–20 mg/h. Trẻ em IV: 0.5–1 mg/kg mỗi 8h (tối đa 6 mg/kg/ngày)',ind:'Phù suy tim, phù phổi cấp (IV cấp cứu), xơ gan cổ trướng, phù thận hư, tăng huyết áp, hỗ trợ thiểu niệu suy thận cấp',monitor:'Điện giải (K⁺, Na⁺, Mg²⁺, Ca²⁺), creatinine, lượng nước tiểu, cân nặng hàng ngày, huyết áp tư thế',ci:'Vô niệu, dị ứng sulfonamide, mất nước nặng, hạ K⁺/Na⁺ nặng, hôn mê gan kèm xơ gan, nhiễm độc digoxin',note:'⚠ Tiêm TM ≤4 mg/phút — tiêm nhanh gây độc tai (ù tai, điếc hồi phục), tăng nguy cơ khi phối hợp aminoglycoside. Mất K⁺/Mg²⁺ kèm — bổ sung điện giải. DTQGVN 2023'},
  meropenem:{name:'Meropenem',cls:'Carbapenem',dose:'0.5–1g q8h IV; Nặng/ESBL: 2g q8h hoặc 1g q6h; Viêm màng não: 2g q8h',ind:'Nhiễm khuẩn nặng, đa đề kháng Gram(-)',monitor:'Chức năng thận, co giật (liều cao)',ci:'Dị ứng carbapenem nặng',note:'Không pha trong Dextrose >30 phút. Extended infusion 3h tối ưu PK/PD'},
  ciprofloxacin:{name:'Ciprofloxacin',cls:'Fluoroquinolone thế hệ 2',dose:'400mg q8–12h IV hoặc 500–750mg q12h PO',ind:'UTI phức tạp, nhiễm khuẩn tiêu hóa, xương khớp',monitor:'QTc, gân achilles, đường huyết',ci:'Trẻ <18 tuổi, mang thai, QTc >500ms, myasthenia gravis',note:'Bioavailability PO ~70% ≈ IV. Chelate với cation Mg²⁺, Ca²⁺, Al³⁺'},
  omeprazole:{name:'Omeprazole/Pantoprazole (PPI)',cls:'Proton Pump Inhibitor',dose:'20–40mg q24h PO; 40mg IV q12h (loét xuất huyết)',ind:'Loét dạ dày, GERD, H. pylori, dự phòng loét stress ICU',monitor:'Mg²⁺ (dài ngày), B12 (dài ngày)',ci:'Kết hợp clopidogrel → dùng pantoprazole thay omeprazole',note:'Uống trước ăn 30–60 phút. Ức chế CYP2C19'},
  norepinephrine:{name:'Norepinephrine (Levophed)',cls:'Catecholamine — chủ vận α₁ mạnh, β₁ vừa / Vasopressor',dose:'Khởi đầu 0.01–0.05 mcg/kg/phút; duy trì 0.01–3 mcg/kg/phút; điều chỉnh theo MAP. Không có liều trần tuyệt đối trong septic shock. Pha trong G5% hoặc NaCl 0.9%',ind:'Sốc nhiễm khuẩn (vasopressor đầu tay — Surviving Sepsis Campaign), sốc phân phối, hạ huyết áp sau gây tê tủy sống',monitor:'MAP liên tục (mục tiêu ≥65 mmHg); nhịp tim; lưu lượng nước tiểu; lactate; dấu hiệu thoát mạch',ci:'Tụt huyết áp do thiếu thể tích (chưa bù dịch); gây mê bằng cyclopropane/halothane (loạn nhịp thất)',note:'⚠ Truyền qua tĩnh mạch TRUNG TÂM — hoại tử mô nặng nếu thoát mạch ngoại vi. Nếu thoát mạch: tiêm phentolamine 5–10 mg vào vùng tổn thương ngay. Dung dịch có metabisulfit — thận trọng bệnh nhân hen. DTQGVN 2023'},
  morphine:{name:'Morphine sulfate',cls:'Opioid agonist tự nhiên — chủ vận thụ thể µ',dose:'IV cấp cứu: 2–4 mg mỗi 4h tiêm chậm; Bơm tiêm điện ICU: 1–5 mg/h; PO giải phóng chậm: 10–30 mg mỗi 12h; Trẻ em IV: 0.05–0.1 mg/kg mỗi 4h (tối đa 0.2 mg/kg)',ind:'Đau nặng cấp và mạn tính; phù phổi cấp (giảm tiền tải); giảm đau sau mổ; an thần/giảm đau ICU',monitor:'Nhịp thở (≥12/phút), SpO₂, điểm đau (NRS/VAS), RASS (ICU), táo bón, bí tiểu',ci:'Suy hô hấp cấp không hỗ trợ thở máy, liệt ruột, tăng áp nội sọ nặng, dị ứng morphine',note:'Chuẩn tham chiếu opioid (MEDD). Tích lũy chất chuyển hóa M6G gây ức chế hô hấp ở suy thận. Giải độc: Naloxone 0.4 mg IV (có thể lặp mỗi 2–3 phút). Phóng thích histamine — gây ngứa, tụt HA. DTQGVN 2023'},
  fentanyl:{name:'Fentanyl',cls:'Opioid agonist tổng hợp',dose:'ICU IV: 25–100 mcg/h; Bolus: 25–50 mcg; Patch: 25–100 mcg/h q72h',ind:'Đau nặng, an thần ICU, gây mê',monitor:'Nhịp thở, SpO₂, ý thức, RASS',ci:'Dị ứng fentanyl',note:'Ít giải phóng histamine. Tích lũy ở mô mỡ — tác dụng kéo dài khi dùng dài ngày'},
  midazolam:{name:'Midazolam',cls:'Benzodiazepine tác dụng ngắn',dose:'An thần ICU: 0.02–0.1 mg/kg/h; Thủ thuật: 1–2mg IV từng nấc',ind:'An thần thủ thuật, co giật cấp, an thần ICU',monitor:'RASS (mục tiêu −2 đến 0), nhịp thở, HA',ci:'Tăng nhãn áp cấp (tương đối)',note:'Tích lũy suy gan, béo phì. Propylene glycol toxicity ở liều cao kéo dài'},
  insulin_reg:{name:'Insulin Regular (Actrapid HM)',cls:'Short-acting insulin',dose:'IV: 0.05–0.1 U/kg/h; SC: 3–6U trước ăn 30 phút',ind:'Tăng đường huyết, DKA, HHS',monitor:'Đường huyết mỗi 1–2h (IV), K⁺ (hạ K⁺ khi bơm insulin)',ci:'Hạ đường huyết <3.9 mmol/L',note:'Tác dụng SC bắt đầu 30–60 phút. Insulin IV: hấp thu trực tiếp'},
  levothyroxine:{name:'Levothyroxine (Synthroid)',cls:'Thyroid hormone (T4)',dose:'1.6–1.8 mcg/kg/ngày; Cao tuổi/tim: khởi đầu 25 mcg',ind:'Suy giáp, ức chế TSH sau cắt giáp',monitor:'TSH sau 6–8 tuần; FT4; Nhịp tim',ci:'Nhồi máu cơ tim giai đoạn cấp (tương đối)',note:'Uống buổi sáng lúc đói, cách thuốc khác ≥4h'},
  ketamine:{name:'Ketamine (Ketalar)',cls:'NMDA receptor antagonist — Thuốc gây mê phân ly',dose:'Khởi mê IV: 1–2 mg/kg (tiêm chậm ≥60s); IM: 5–10 mg/kg. An thần thủ thuật IV: 0.5–1 mg/kg. Duy trì truyền: 10–50 mcg/kg/phút. Trẻ em: tương tự người lớn tính theo kg',ind:'Gây mê thủ thuật ngắn không cần giãn cơ; giảm đau thủ thuật (bỏng, băng bó); khởi mê bệnh nhân hen, sốc giảm thể tích',monitor:'Huyết áp, nhịp tim (kích thích giao cảm); SpO₂; dấu hiệu mê sảng hồi phục; áp lực nội sọ (chống chỉ định tương đối chấn thương sọ)',ci:'Tăng huyết áp không kiểm soát, bệnh tim thiếu máu nặng, tiền sản giật/sản giật, tăng nhãn áp cấp, rối loạn tâm thần nặng',note:'Duy trì phản xạ đường thở — không thay thế kiểm soát đường thở. Tiền mê midazolam 0.04–0.08 mg/kg để giảm ảo giác hồi phục. Tiêm chậm ≥60s tránh ức chế hô hấp thoáng qua. DTQGVN 2023'},
  dobutamine:{name:'Dobutamine (Dobutrex)',cls:'Catecholamine — chủ vận β₁ chọn lọc / Thuốc tăng co bóp cơ tim',dose:'Người lớn: 2.5–10 mcg/kg/phút IV; tối đa 40 mcg/kg/phút. Trẻ em: 5–20 mcg/kg/phút IV. Bù đủ thể tích trước khi dùng. Pha trong G5% hoặc NaCl 0.9%',ind:'Suy tim cấp (sốc tim, NMCT có sốc); sốc nhiễm khuẩn kèm giảm cung lượng tim (phối hợp vasopressor); stress test siêu âm tim',monitor:'ECG liên tục (loạn nhịp, nhịp nhanh), huyết áp, cung lượng tim, áp lực tĩnh mạch trung tâm, SpO₂',ci:'Hẹp dưới van động mạch chủ phì đại tắc nghẽn, nhịp nhanh thất không kiểm soát, dị ứng dobutamine',note:'⚠ Tăng nhịp tim >10 lần/phút so với ban đầu → giảm tốc độ truyền. Nguy cơ quen thuốc (tachyphylaxis) sau 72h liên tục. Dung dịch đổi màu hồng nhạt không dùng. DTQGVN 2023'},
  dopamine:{name:'Dopamine (Intropin)',cls:'Catecholamine — chủ vận dopaminergic/β/α phụ thuộc liều',dose:'Liều thận 2–5 mcg/kg/phút: giãn mạch thận; Liều tim 5–15 mcg/kg/phút: tăng co bóp; Liều vận mạch >15 mcg/kg/phút: co mạch ngoại vi. Pha trong G5% hoặc NaCl 0.9%, qua tĩnh mạch trung tâm',ind:'Sốc tim, hạ huyết áp sau phẫu thuật tim, sốc nhiễm khuẩn kèm nhịp chậm (thay thế norepinephrine)',monitor:'ECG (loạn nhịp), huyết áp liên tục, nhịp tim, lưu lượng nước tiểu, vị trí truyền (hoại tử nếu thoát mạch)',ci:'U tế bào ưa chrome (pheochromocytoma), rung nhĩ không kiểm soát, nhịp nhanh thất, thiếu thể tích chưa bù',note:'⚠ Thoát mạch ngoại vi → hoại tử mô: tiêm phentolamine 5–10 mg vào vùng tổn thương ngay. Norepinephrine ưu tiên hơn trong septic shock (Surviving Sepsis Campaign). DTQGVN 2023'},
  atropine:{name:'Atropine sulfate',cls:'Kháng cholinergic — đối kháng muscarinic cạnh tranh',dose:'Nhịp chậm/ngừng tim: 0.5–1 mg IV mỗi 3–5 phút (tối đa 3 mg). Ngộ độc lân hữu cơ: 2–4 mg IV mỗi 5–10 phút đến khô tiết phế quản. Tiền mê: 0.4–0.6 mg IM trước 30–60 phút. Trẻ em: 0.02 mg/kg IV (tối thiểu 0.1 mg, tối đa 0.5 mg)',ind:'Nhịp chậm triệu chứng (ACLS), block AV có huyết động không ổn định, ngộ độc lân hữu cơ/carbamate, tiền mê giảm tiết',monitor:'Nhịp tim, huyết áp, bài tiết phế quản (khi trị ngộ độc lân), đồng tử, bí tiểu (người cao tuổi)',ci:'Tăng nhãn áp góc đóng (tương đối), liệt ruột nặng, phì đại tiền liệt tuyến giai đoạn nặng',note:'⚠ Liều <0.5 mg có thể gây nhịp chậm phó giao cảm ngịch lý. Trong ngộ độc lân hữu cơ: dùng liều cao đến khi tiết phế quản giảm — không dùng SpO₂ làm đích cai atropine. DTQGVN 2023'},
  nicardipine:{name:'Nicardipine (Cardene IV)',cls:'Chẹn kênh canxi nhóm dihydropyridine — Thuốc hạ huyết áp IV',dose:'Cấp cứu THA: Khởi đầu truyền IV 5 mg/h → tăng 2.5 mg/h mỗi 5 phút → tối đa 15 mg/h; sau khi đạt mục tiêu HA → duy trì 3 mg/h và chỉnh dần. Không có dạng bolus IV',ind:'Tăng huyết áp cấp cứu (THA ác tính, THA sau phẫu thuật, THA trong đột quỵ xuất huyết não, cơn THA kịch phát)',monitor:'Huyết áp mỗi 1–5 phút khi chỉnh liều, nhịp tim (phản xạ tachycardia), lưu lượng nước tiểu, vị trí truyền',ci:'Hẹp động mạch chủ nặng, nhồi máu cơ tim cấp kèm tụt huyết áp, suy tim mất bù nặng, mẫn cảm dihydropyridine',note:'Tương kỵ hóa học với bicarbonat và furosemide cùng đường truyền — dùng đường truyền riêng. Tác dụng nhanh và dễ điều chỉnh — thích hợp cấp cứu THA. DTQGVN 2023'},
  epinephrine:{name:'Epinephrine/Adrenaline',cls:'Catecholamine nội sinh — chủ vận α và β / Thuốc cấp cứu phản vệ & hồi sinh tim phổi',dose:'Phản vệ IM: NL 0.5–1 mg (dd 1:1000) mỗi 3–5 phút; Trẻ em 0.01 mg/kg IM (tối đa 0.5 mg). IV phản vệ nặng: 0.05–0.1 mg (dd 1:10000) chậm, sau đó truyền 0.1 mcg/kg/phút. HSTP NL: 1 mg IV/IO mỗi 3–5 phút; Trẻ: 10 mcg/kg IV/IO. Septic shock: truyền 0.05–2 mcg/kg/phút',ind:'Sốc phản vệ (thuốc đầu tay), hồi sinh tim phổi (VF/VT/PEA/Asystole), sốc nhiễm khuẩn kháng trị, co thắt phế quản nặng',monitor:'ECG, huyết áp liên tục, nhịp tim, SpO₂, đường huyết (tăng đường huyết), kali máu (hạ K⁺)',ci:'Không có chống chỉ định tuyệt đối trong phản vệ và ngừng tim. Thận trọng: tăng nhãn áp góc đóng, cường giáp, bệnh tim thiếu máu nặng',note:'⚠ Đường tiêm BẮP vào đùi ngoài được ưu tiên hơn dưới da trong phản vệ (hấp thu nhanh hơn). Trong HSTP: ưu tiên IV/IO; chỉ dùng nội khí quản khi không có đường IV/IO với liều 2–2.5 mg. DTQGVN 2023'},
  labetalol:{name:'Labetalol (Trandate)',cls:'Chẹn α₁ và β không chọn lọc — Thuốc hạ huyết áp kép',dose:'IV cấp cứu THA: Tiêm TM chậm 20 mg trong 2 phút; lặp lại 40–80 mg mỗi 10 phút (tối đa 300 mg tổng). Hoặc truyền liên tục 1–2 mg/phút; duy trì đạt HA. PO: Khởi đầu 100 mg × 2 lần/ngày; duy trì 200–400 mg × 2 lần/ngày; tối đa 2400 mg/ngày',ind:'Tăng huyết áp cấp cứu (THA ác tính, THA trong thai kỳ/tiền sản giật, THA sau phẫu thuật), tăng huyết áp mạn tính, hội chứng cai rượu có THA',monitor:'Huyết áp (BN nằm ngửa trong khi tiêm IV và ≥3 giờ sau), nhịp tim (nhịp chậm), dấu hiệu suy tim, chức năng gan (dùng lâu dài)',ci:'Hen phế quản, COPD nặng, block AV độ 2–3, nhịp chậm xoang, suy tim mất bù, sốc tim',note:'Tác dụng kép α+β — hạ HA mà không phản xạ tăng nhịp tim (ưu điểm so với hydralazine). Bệnh nhân phải nằm ngửa khi tiêm IV tránh hạ HA tư thế. An toàn trong thai kỳ (category C). DTQGVN 2023'},
  propofol:{name:'Propofol (Diprivan)',cls:'Thuốc gây mê/an thần đường tĩnh mạch — tăng cường GABA-A',dose:'Khởi mê NL: 1.5–2.5 mg/kg IV (tiêm từng bước 40 mg/10s đến khi đủ mê). Duy trì mê: 4–12 mg/kg/h truyền. An thần ICU: 0.3–4 mg/kg/h truyền (khởi đầu 0.3 mg/kg/h, tăng dần). Thủ thuật ngắn: 0.5–1 mg/kg IV rồi 1.5–4.5 mg/kg/h',ind:'Khởi mê và duy trì mê toàn thân; an thần ICU ngắn-trung hạn; an thần thủ thuật (nội soi, tim mạch can thiệp)',monitor:'SpO₂, nhịp thở, HA, ECG, mức độ an thần (RASS/SAS), triglyceride (dùng >3 ngày), CK và pH máu (PRIS)',ci:'Dị ứng propofol/đậu tương/trứng/đậu phộng; không dùng gây mê cho trẻ <1 tháng; không an thần ICU cho trẻ em (PRIS)',note:'⚠ Propofol Infusion Syndrome (PRIS): toan chuyển hóa + suy tim + tiêu cơ vân — nguy cơ khi >4 mg/kg/h >48h. Không dùng chung đường truyền với máu. Lắc kỹ trước dùng; sau mở không để quá 12h. Pha được trong G5%, NaCl 0.9%. DTQGVN 2023'},
  vasopressin:{name:'Vasopressin (Argipressin/ADH)',cls:'Hormone chống bài niệu — chủ vận thụ thể V1/V2 / Vasopressor',dose:'Septic shock (hỗ trợ norepinephrine): Truyền IV cố định 0.03–0.04 đvqt/phút (không chỉnh liều). Ngừng tim (VF/VT kháng trị): 40 đvqt IV bolus × 1 liều thay thế epinephrine liều 1 hoặc 2. Xuất huyết tiêu hóa do giãn TM: 20 đvqt pha 100 ml G5% truyền 15 phút, sau đó 0.2–0.4 đvqt/phút. Đái tháo nhạt: 5–20 đvqt TDD/TB mỗi 4h',ind:'Septic shock (hỗ trợ/giảm liều norepinephrine), xuất huyết tiêu hóa do giãn tĩnh mạch thực quản, đái tháo nhạt trung ương',monitor:'MAP, nhịp tim, lưu lượng nước tiểu, điện giải (Na⁺ — nguy cơ hạ Na⁺), dấu hiệu thiếu máu mô (ngón tay, da)',ci:'Bệnh mạch vành nặng (co mạch vành), dị ứng vasopressin; không dùng đơn độc trong sốc phân phối thiếu bù dịch',note:'Liều cố định trong septic shock — không titrate như catecholamine khác. Phối hợp vasopressin + norepinephrine giảm nhu cầu norepinephrine và cải thiện kết cục. DTQGVN 2023'},
  oxytocin:{name:'Oxytocin (Syntocinon)',cls:'Hormone tử cung tổng hợp — chủ vận thụ thể oxytocin',dose:'Gây/tăng co tử cung: Khởi đầu 0.5–1 milli-đvqt/phút truyền IV; tăng 1–2 milli-đvqt/30 phút; thường đáp ứng ở 3–4 milli-đvqt/phút; tối đa 20 milli-đvqt/phút. Sau sinh/mổ lấy thai: 5 đvqt tiêm TM chậm. Phòng băng huyết sau sinh: 10 đvqt IM ngay sau khi sổ nhau',ind:'Khởi phát chuyển dạ, tăng co tử cung khi chuyển dạ chậm tiến triển, phòng và điều trị băng huyết sau sinh, mổ lấy thai',monitor:'Cơn co tử cung (tần số, cường độ, thời gian), nhịp tim thai liên tục, huyết áp mẹ, lượng nước tiểu (nguy cơ hạ Na⁺ pha loãng)',ci:'Cơn co tử cung cường tính, suy thai cấp, nhau tiền đạo, vỡ tử cung, sa dây rốn, bất tương xứng đầu-khung chậu, dị ứng oxytocin',note:'⚠ NGỪNG NGAY khi có cơn co cường tính (>5 cơn/10 phút) hoặc suy thai. Oxytocin có tác dụng chống bài niệu → truyền dịch nhiều không có điện giải gây hạ Na⁺ pha loãng. Không tiêm bolus IV nhanh — tụt HA phản xạ. DTQGVN 2023'},
  phenobarbital:{name:'Phenobarbital (Luminal)',cls:'Barbiturat — tăng cường GABA-A, ức chế kênh Na⁺ / Chống động kinh & an thần',dose:'Động kinh NL uống: 60–180 mg × 1 lần/tối; Trẻ 1 tháng–11T: 2.5–4 mg/kg × 2 lần/ngày. IV cấp cứu (trạng thái động kinh) NL: 50–200 mg IM hoặc IV chậm ≤60 mg/phút; Trẻ: ≤30 mg/phút. TDM: nồng độ an thần 10 mcg/mL, ngủ 40 mcg/mL, hôn mê >50 mcg/mL',ind:'Động kinh tonic-clonic, động kinh cục bộ (dòng 2 sau benzodiazepin/phenytoin); trạng thái động kinh; an thần trẻ sơ sinh; cai rượu nặng',monitor:'Nồng độ huyết thanh 15–40 mcg/mL; nhịp thở (ức chế hô hấp IV); chức năng gan; dấu hiệu ngộ độc (lơ mơ, mất phối hợp)',ci:'Suy gan nặng, suy hô hấp cấp không hỗ trợ, tiền sử dị ứng barbiturat, bệnh nhân có hội chứng thiếu porphyrin',note:'Cảm ứng CYP mạnh (2C9, 3A4) → giảm nồng độ nhiều thuốc. Phụ thuộc thể chất sau dùng lâu dài — giảm liều từ từ khi ngừng (tránh hội chứng cai). Không tiêm dưới da — hoại tử mô. DTQGVN 2023'},
  naloxone:{name:'Naloxone (Narcan)',cls:'Đối kháng opioid thuần túy — cạnh tranh thụ thể µ/κ/δ / Thuốc giải độc opioid',dose:'Quá liều opioid NL: 0.4–2 mg IV/IM/TDD mỗi 2–3 phút; tối đa 10 mg. Xịt mũi: 4 mg × 1 lỗ mũi, lặp mỗi 2–3 phút. Ức chế hô hấp do opioid điều trị: 0.02–0.2 mg IV chậm (chuẩn liều đến khi hô hấp đủ). Trẻ <5T hoặc ≤20kg: 0.1 mg/kg IV (tối đa 2 mg); ≥5T hoặc >20kg: 2 mg IV',ind:'Giải độc quá liều opioid (ức chế hô hấp, hôn mê), đảo ngược ức chế hô hấp sau dùng opioid điều trị trong ICU/gây mê',monitor:'Nhịp thở (đích chính), SpO₂, ý thức, nhịp tim, huyết áp; theo dõi ≥4–6h sau liều (opioid tác dụng dài > naloxone)',ci:'Mẫn cảm naloxone. Thận trọng: bệnh nhân lệ thuộc opioid (gây hội chứng cai cấp tính nguy hiểm)',note:'⚠ T½ naloxone (60–90 phút) NGẮN hơn hầu hết opioid → bệnh nhân có thể rơi vào hôn mê/ức chế hô hấp trở lại sau 1–4h. Chuẩn liều từng 0.04 mg để tránh hội chứng cai cấp tính ở bệnh nhân lệ thuộc. Sau đáp ứng cần truyền duy trì 2/3 liều hiệu quả/giờ nếu opioid tác dụng dài. DTQGVN 2023'},
  protamine:{name:'Protamine sulfate',cls:'Thuốc giải độc heparin — trung hòa heparin bằng phức hợp tĩnh điện',dose:'Trung hòa heparin IV: 1 mg protamine trung hòa 80–100 đvqt heparin (trong 15 phút đầu); nếu >15 phút: dùng 0.5–0.75 mg/100 đvqt; nếu >2h: 0.25–0.375 mg/100 đvqt. Tiêm TM chậm ≤5 mg/phút; không quá 50 mg/lần/10 phút. Theo dõi aPTT/ACT sau 5–15 phút để điều chỉnh',ind:'Trung hòa heparin UFH sau phẫu thuật tim/mạch máu, ngộ độc heparin quá liều, trung hòa heparin kết thúc lọc máu',monitor:'aPTT và ACT sau 5–15 phút mỗi liều (ROTEM Heptem nếu có); huyết áp, nhịp tim (trong và sau tiêm)',ci:'Dị ứng protamine hoặc cá (nguồn gốc từ tinh trùng cá hồi), không có chỉ định trung hòa',note:'⚠ Tiêm nhanh protamine gây tụt HA, nhịp chậm, co thắt phế quản, phù phổi — PHẢI tiêm chậm ≤5 mg/phút. Nguy cơ dị ứng tăng ở: nam đã phẫu thuật thắt ống dẫn tinh, bệnh nhân dị ứng cá, đã dùng insulin NPH chứa protamine. DTQGVN 2023'},
  magnesium:{name:'Magnesium sulfate (MgSO₄)',cls:'Điện giải thiết yếu — chẹn kênh Ca²⁺, ức chế NMDA, ổn định màng thần kinh-cơ',dose:'Sản giật — liều nạp: 4 g MgSO₄ 20% IV trong 5–15 phút → duy trì: 1 g/h truyền liên tục 24h sau cơn giật. Hạ Mg²⁺ nặng: 1–2 g IV trong 15 phút; duy trì 0.5–1 g/h. Loạn nhịp (Torsades de Pointes): 1–2 g IV trong 1–2 phút (cấp cứu). Trẻ em: 25–50 mg/kg IV trong 15–30 phút (tối đa 2 g)',ind:'Sản giật và tiền sản giật nặng (phòng và điều trị co giật), hạ Mg²⁺ có triệu chứng, Torsades de Pointes, cơn hen nặng kháng trị, giảm co tử cung sớm',monitor:'Phản xạ gân xương gót chân (mất phản xạ báo hiệu ngộ độc sớm ở 3.5–5 mmol/L), nhịp thở ≥16/phút, lưu lượng nước tiểu ≥25 ml/h, nồng độ Mg²⁺ mục tiêu 2–3.5 mmol/L',ci:'Block AV hoàn toàn, vô niệu, nhược cơ, mẫn cảm MgSO₄',note:'⚠ Giải độc ngộ độc MgSO₄: Calcium gluconate 1 g (10 mL 10%) IV chậm ngay lập tức. Tiêm nhanh gây hạ HA, ức chế hô hấp → tiêm ≤150 mg/phút. Suy thận: giảm liều duy trì; theo dõi nồng độ Mg²⁺ chặt hơn. DTQGVN 2023'},
  sodium_bicarb:{name:'Natri bicarbonate (NaHCO₃)',cls:'Thuốc kiềm hóa — đệm bicarbonate ngoại bào',dose:'Toan chuyển hóa nặng (pH <7.1): Tính liều = 0.3 × cân nặng × (HCO₃⁻ mong muốn − HCO₃⁻ hiện tại); bù ½ lượng tính, truyền chậm ≤1 mEq/kg/h; kiểm tra khí máu 30–60 phút sau. Ngừng tim (tăng K⁺, ngộ độc TCA): 1 mEq/kg IV bolus. Kiềm hóa nước tiểu: 1–2 mEq/kg/ngày chia 4 lần PO. Trẻ <2T: dùng NaHCO₃ 4.2%',ind:'Toan chuyển hóa nặng (pH <7.1), tăng kali huyết cấp, ngộ độc thuốc chống trầm cảm ba vòng (TCA), kiềm hóa nước tiểu (ngộ độc salicylate, myoglobin niệu)',monitor:'Khí máu động mạch (pH, HCO₃⁻, PaCO₂), điện giải (Na⁺, K⁺, Ca²⁺ ion hóa), thẩm thấu huyết thanh; theo dõi tải natri (suy tim, suy thận)',ci:'Toan chuyển hóa do mất HCO₃⁻ (không có chỉ định kiềm hóa), nhiễm kiềm chuyển hóa, hạ canxi huyết, không có điều kiện thông khí (tăng CO₂)',note:'⚠ Bất tương kỵ với catecholamine và canxi cùng đường truyền → tráng rửa NaCl 0.9% trước và sau. Không khuyến cáo thường quy trong ngừng tuần hoàn. Tránh bù quá nhanh → kiềm chuyển hóa, hạ K⁺, hạ Ca²⁺ ion hóa.'},
  dexmedetomidine:{name:'Dexmedetomidine (Precedex)',cls:'Chủ vận α₂ chọn lọc — an thần ICU không ức chế hô hấp',dose:'Liều nạp (tùy chọn): 1 mcg/kg IV trong 10 phút. Duy trì: 0.2–0.7 mcg/kg/h truyền liên tục; chỉnh theo mục tiêu RASS. Pha nồng độ 4 mcg/ml hoặc 8 mcg/ml trong NaCl 0.9%/G5%/Ringer lactat. Không dùng quá 24h liên tục. Giảm liều duy trì khi suy gan; thận trọng khi mức lọc cầu thận <30 ml/phút',ind:'An thần ICU (ưu tiên khi cần bệnh nhân hợp tác/giao tiếp được), cai máy thở, thủ thuật ngắn không đặt NKQ, giảm nhu cầu opioid/benzodiazepin',monitor:'Nhịp tim (nhịp chậm — ADR thường gặp), huyết áp, mức độ an thần (RASS mục tiêu −2 đến 0), ECG',ci:'Block AV hoàn toàn không có máy tạo nhịp, nhịp chậm xoang nặng, dị ứng dexmedetomidine',note:'Ưu điểm: an thần mà không ức chế hô hấp — bệnh nhân có thể thở tự nhiên và giao tiếp được. Tránh tiêm bolus nhanh (hạ HA và nhịp chậm). Dùng >24h không được khuyến cáo do thiếu dữ liệu an toàn dài hạn.'},
  calcium_gluconate:{name:'Calcium gluconate (Calci gluconate)',cls:'Điện giải — bổ sung canxi; ổn định màng cơ tim',dose:'Hạ Ca²⁺ cấp có triệu chứng/Tăng K⁺ nặng/Ngộ độc MgSO₄: 1–2 g (10–20 ml dung dịch 10%) IV chậm 10–20 phút. Trẻ em: 0.2–0.5 ml/kg (dd 10%) IV chậm, tối đa 10 ml. Ngộ độc HF (acid hydrofluoric): 0.1–0.2 ml/kg IV, lặp lại nếu cần. Sau truyền máu khối lượng lớn: 1 g/500 ml máu truyền',ind:'Hạ canxi huyết cấp tính (tetani, co giật), tăng kali huyết nặng (ổn định màng cơ tim), ngộ độc MgSO₄, ngộ độc thuốc chẹn kênh canxi (hỗ trợ), ngộ độc acid hydrofluoric',monitor:'Canxi huyết thanh (tổng và ion hóa), ECG liên tục khi tiêm IV nhanh, nhịp tim (nhịp chậm), huyết áp, vị trí truyền (hoại tử nếu thoát mạch)',ci:'Rung thất, vô tâm thu, tăng canxi huyết, tăng canxi niệu, sỏi thận calci, đang dùng glycosid tim (nguy cơ ngộ độc digitalis), không dùng TDD/TB',note:'⚠ Tiêm TM chậm ≤200 mg/phút NL, ≤100 mg/phút Trẻ em — tiêm nhanh gây tụt HA, loạn nhịp, ngừng tim. Thoát mạch ngoại vi → hoại tử nặng. Tương kỵ với NaHCO₃ và cephalosporin (kết tủa) — truyền đường riêng. Không dùng đồng thời với ceftriaxone ở trẻ sơ sinh <28 ngày.'},
  potassium_chloride:{name:'Kali chloride (KCl)',cls:'Điện giải — bù kali thiếu hụt',dose:'Hạ K⁺ nhẹ-vừa PO: 40–80 mmol/ngày chia nhiều lần (uống sau ăn với nhiều nước). Hạ K⁺ nặng IV (K⁺ <2.5 mmol/L): Truyền 10–20 mmol/h qua TM ngoại vi; cấp cứu tối đa 20 mmol/h (phải ECG liên tục). Nồng độ tốt nhất 40 mmol/L, không vượt 80 mmol/L. Trẻ em IV: tối đa 0.02 mmol/kg/phút. NMCT cấp: duy trì K⁺ >4 mEq/L',ind:'Hạ kali huyết (do lợi tiểu, nôn mửa tiêu chảy kéo dài, kiềm chuyển hóa, corticoid), phòng hạ K⁺ khi dùng lợi tiểu dài hạn, dự phòng loạn nhịp trong NMCT cấp',monitor:'Kali máu trước và trong truyền, ECG liên tục khi tốc độ >0.5 mmol/kg/h, chức năng thận, lượng nước tiểu (≥0.5 ml/kg/h trước khi truyền)',ci:'Tăng kali huyết, vô niệu/thiểu niệu nặng, liệt chu kỳ tăng kali huyết, mất nước nặng chưa bù',note:'⚠ KHÔNG tiêm bolus IV trực tiếp — gây ngừng tim tức thì. Truyền qua TM trung tâm nếu tốc độ >10 mmol/h hoặc nồng độ >40 mmol/L. Không pha trong dịch có glucose (tụt K⁺ thêm do insulin nội sinh). Theo dõi K⁺ máu mỗi 2–4h khi bù cấp cứu.'},
  nitroglycerin:{name:'Glyceryl trinitrate / Nitroglycerin (NTG)',cls:'Nitrat hữu cơ — giãn mạch qua NO / Thuốc chống đau thắt ngực',dose:'Cắt cơn đau thắt ngực SL: 0.3–0.6 mg ngậm dưới lưỡi; lặp mỗi 5 phút × 3 lần. Xịt SL: 0.4 mg × 1–2 nhát. Truyền IV (ĐTNGON/SHT/suy tim cấp): Khởi đầu 5–10 mcg/phút; tăng 10 mcg/30 phút; thường đáp ứng 10–200 mcg/phút. Miếng dán: 5–10 mg/24h (dán 12–14h/ngày, bỏ 10–12h để tránh dung nạp)',ind:'Cắt cơn đau thắt ngực ổn định và không ổn định, đau thắt ngực không ổn định/NMCT (IV), suy tim cấp có HA bình thường/tăng, THA cấp cứu chu phẫu',monitor:'Huyết áp (hạ HA tư thế), nhịp tim (phản xạ nhịp nhanh), đau đầu (ADR thường gặp — giãn mạch não)',ci:'Hạ HA (HA tâm thu <90 mmHg), sốc tim, tắc nghẽn đường ra thất phải (nhồi máu thất phải), tăng nhãn áp góc đóng, dùng cùng PDE-5 inhibitor (sildenafil — hạ HA nặng)',note:'⚠ Tuyệt đối không dùng khi đã dùng sildenafil/tadalafil/vardenafil trong 24–48h — nguy cơ hạ HA nặng tử vong. Tránh đồ đựng PVC (NTG bị hấp phụ vào nhựa) — dùng bình thủy tinh/dây PE. Dung nạp thuốc sau 24h dùng liên tục → cần ngắt khoảng.'},
  rocuronium:{name:'Rocuronium bromide (Esmeron)',cls:'Thuốc giãn cơ không khử cực — chẹn thần kinh-cơ cạnh tranh',dose:'RSI/Đặt NKQ: 0.6 mg/kg IV nhanh (giãn cơ trong 60–90s); RSI liều cao: 1.2 mg/kg (thay succinylcholine khi chống chỉ định). Duy trì phẫu thuật: 0.15 mg/kg IV ngắt quãng (hoặc 0.1 mg/kg khi gây mê hô hấp); truyền liên tục: 0.3–0.6 mg/kg/h. ICU duy trì: khởi đầu 0.3–0.6 mg/kg/h → giảm theo đáp ứng TOF. Trẻ em: liều tương tự NL tính theo kg',ind:'Giãn cơ để đặt NKQ (RSI và giãn cơ thường quy), duy trì giãn cơ trong phẫu thuật và thông khí cơ học ICU, kiểm soát co giật kháng trị kèm thông khí xâm lấn',monitor:'Kích thích dây thần kinh ngoại biên (TOF — Train-of-Four; mục tiêu 1–2 nhịp/4); chức năng gan (kéo dài tác dụng); nhiệt độ cơ thể (hạ thân nhiệt kéo dài giãn cơ)',ci:'Mẫn cảm rocuronium/bromide, không có điều kiện thông khí/kiểm soát đường thở',note:'⚠ Giải độc đặc hiệu: Sugammadex 16 mg/kg IV (đảo ngược ngay lập tức ngay cả khi giãn cơ sâu) — ưu việt hơn neostigmine. Không dùng duy trì ICU cho trẻ em và người cao tuổi (thiếu dữ liệu). Kéo dài tác dụng khi suy gan, hạ thân nhiệt, rối loạn điện giải.'},
  dexamethasone:{name:'Dexamethasone (Decadron)',cls:'Glucocorticoid tổng hợp — chống viêm, chống phù nề / Potency: 25× hydrocortisone',dose:'Chống viêm/dị ứng NL uống: 0.5–10 mg/ngày; IV: 0.5–24 mg dexamethasone phosphat/ngày. Trẻ em IV: 0.1–0.4 mg/kg/ngày. Phòng nôn hóa trị (high-emetogenic): 8–20 mg IV trước hóa trị. Phù não (u não/chấn thương): 10 mg IV bolus → 4 mg IV mỗi 6h. Viêm màng não (BN ≥1 tháng): 0.15 mg/kg IV mỗi 6h × 4 ngày (trước hoặc cùng kháng sinh đầu tiên). COVID-19 nặng thở máy: 6 mg/ngày PO/IV × 10 ngày',ind:'Phù não (u não, chấn thương), viêm màng não (giảm biến chứng thần kinh), chống nôn hóa trị, suy thượng thận cấp, dị ứng/phản ứng nặng, COVID-19 nặng cần thở máy, nhóm corticoid mạnh dự phòng phản ứng truyền máu',monitor:'Đường huyết (tăng đường huyết), huyết áp, điện giải (K⁺, Na⁺), dấu hiệu nhiễm trùng (che khuất sốt/viêm), mật độ xương (dùng lâu dài)',ci:'Nhiễm trùng toàn thân không kiểm soát (trừ lao/viêm màng não có chỉ định đặc biệt), mẫn cảm dexamethasone, tiêm bắp ở bệnh nhân giảm tiểu cầu nặng',note:'Hoạt lực cao nhất trong nhóm glucocorticoid thường dùng; không có tác dụng giữ muối (mineralocorticoid = 0) — không thay thế được hydrocortisone trong suy thượng thận cấp. Không ngừng đột ngột sau dùng >7 ngày — giảm liều dần. Che khuất dấu hiệu nhiễm trùng.'},
  hydrocortisone:{name:'Hydrocortisone (Solu-Cortef)',cls:'Glucocorticoid + mineralocorticoid — corticoid thay thế sinh lý',dose:'Suy thượng thận cấp (cơn bão thượng thận): 100 mg IV bolus → 200–300 mg/ngày truyền liên tục hoặc 50–100 mg IV mỗi 6–8h × 24–48h → giảm dần về liều duy trì. Septic shock kháng vasopressor: 200–300 mg/ngày truyền liên tục hoặc 50 mg IV mỗi 6h × 7 ngày. NL uống/TB duy trì: 20–30 mg/ngày chia 2 lần. Trẻ em IV: 0.56–8 mg/kg/ngày chia 3–4 lần',ind:'Suy thượng thận cấp (cơn bão thượng thận — thuốc ưu tiên), sốc nhiễm khuẩn kháng vasopressor (steroids liều stress), dị ứng nặng/phản vệ (hỗ trợ sau epinephrine), suy thượng thận mạn (liều thay thế)',monitor:'Huyết áp, đường huyết, điện giải (K⁺ giảm, Na⁺ tăng), áp lực mạch, lượng nước tiểu; trong septic shock: đánh giá đáp ứng vasopressor sau 12–24h',ci:'Nhiễm nấm toàn thân không kiểm soát, mẫn cảm thành phần; dùng thận trọng khi nhiễm trùng nặng chưa được kiểm soát bằng kháng sinh',note:'Là corticoid DUY NHẤT có đủ cả glucocorticoid và mineralocorticoid → thuốc ưu tiên trong suy thượng thận cấp (không thay thế bằng methylprednisolone/dexamethasone). Trong septic shock: không chỉ định thường quy — chỉ dùng khi sốc kháng trị với đủ dịch và vasopressor.'},
  tranexamic_acid:{name:'Acid tranexamic (TXA / Cyklokapron)',cls:'Chống tiêu sợi huyết — ức chế cạnh tranh plasminogen/plasmin',dose:'Chảy máu nặng/chấn thương (CRASH-2): 1 g IV trong 10 phút → 1 g truyền 8h (phải dùng trong 3h sau chấn thương). Phẫu thuật (ức chế tiêu fibrin): 0.5–1 g IV chậm (≤100 mg/phút) mỗi 6–8h; hoặc 15 mg/kg × 3 lần/ngày. Rong kinh: 1 g PO × 3 lần/ngày × 4 ngày (tối đa 4 g/ngày). Trẻ em: 15–25 mg/kg PO hoặc 10 mg/kg IV × 2–3 lần/ngày. Suy thận: giảm liều theo Ccr',ind:'Chảy máu chấn thương nặng (đặc biệt trong 3h đầu), xuất huyết tiêu hóa trên, phẫu thuật tim hở/gan/chấn thương sọ, rong kinh nặng, bệnh ưa chảy máu (phẫu thuật răng), phù mạch di truyền',monitor:'Dấu hiệu huyết khối (DVT/PE — nguy cơ tăng ở bệnh nhân có yếu tố nguy cơ), creatinine (suy thận cần giảm liều), màu sắc nước tiểu',ci:'Tiền sử huyết khối tắc mạch (DVT/PE), đông máu nội mạch rải rác (DIC) đang tiến triển, mẫn cảm TXA, co giật không kiểm soát (liều cao TXA hạ ngưỡng co giật)',note:'Bằng chứng mạnh nhất từ CRASH-2: giảm tử vong do chảy máu trong chấn thương — phải dùng trong 3h đầu (sau 3h không có lợi, sau 6h có thể có hại). Tiêm chậm ≤100 mg/phút — tiêm nhanh gây tụt HA. Không pha cùng penicillin trong cùng bơm tiêm.'},
  lidocaine:{name:'Lidocaine (Xylocaine)',cls:'Gây tê tại chỗ nhóm amide; chống loạn nhịp nhóm Ib',dose:'Loạn nhịp thất (VT/VF sau DC shock): Bolus 1–1.5 mg/kg IV; lặp 0.5–0.75 mg/kg mỗi 5–10 phút (tối đa 3 mg/kg). Duy trì: 1–4 mg/phút truyền. Gây tê tiêm ngấm NL: 5–300 mg (dd 0.5–1%), tối đa 4.5 mg/kg không có adrenaline (7 mg/kg có adrenaline). Gây tê ngoài màng cứng: 200–300 mg (dd 1.5–2%). Trẻ em IV loạn nhịp: 1 mg/kg bolus; duy trì 20–50 mcg/kg/phút',ind:'Loạn nhịp thất (VT/VF kháng DC shock — dòng 2 sau amiodarone), gây tê tại chỗ và vùng (tiêm ngấm, phong bế thần kinh ngoại biên, ngoài màng cứng, tủy sống), giảm đau thủ thuật ICU/cấp cứu',monitor:'ECG liên tục khi dùng IV (QRS, PR, loạn nhịp mới), nhịp tim, huyết áp, dấu hiệu ngộ độc hệ TKTW (ù tai, tê môi, co giật — báo hiệu nồng độ máu cao)',ci:'Block AV hoàn toàn không có máy tạo nhịp, hội chứng Wolff-Parkinson-White, hội chứng Adams-Stokes, mẫn cảm với thuốc gây tê nhóm amide, suy gan nặng',note:'Ngộ độc toàn thân (LAST): co giật → loạn nhịp → ngừng tim — giải độc bằng Intralipid 20% (1.5 ml/kg IV bolus). Tốc độ truyền >4 mg/phút hoặc nồng độ máu >5 mcg/ml có nguy cơ độc TKTW và tim. Suy gan: giảm liều 50% (chuyển hóa hoàn toàn qua gan — T½ kéo dài)'},
  diazepam:{name:'Diazepam (Valium)',cls:'Benzodiazepin — tăng cường GABA-A / An thần, chống co giật, giãn cơ',dose:'Trạng thái động kinh NL IV: 10 mg tiêm chậm ≤5 mg/phút; lặp sau 10 phút nếu cần. Trẻ em IV: 0.3–0.4 mg/kg (tối đa 10 mg); lặp sau 10 phút. Đường trực tràng trẻ em (ngoài bệnh viện): 500 mcg/kg. An thần thủ thuật NL: 2–10 mg IV chậm; tiền mê 0.1–0.2 mg/kg IV. Uốn ván IV: 100–300 mcg/kg mỗi 1–4h hoặc truyền 3–10 mg/kg/24h. Cai rượu nặng: 10–20 mg IV, lặp mỗi 4h',ind:'Trạng thái động kinh và co giật cấp (lựa chọn ưu tiên trước lorazepam khi không có), co giật do uốn ván, an thần thủ thuật, tiền mê, hội chứng cai rượu nặng, lo âu/co thắt cơ cấp',monitor:'Nhịp thở (ức chế hô hấp — ADR nguy hiểm nhất), SpO₂, mức độ an thần, huyết áp (hạ HA), dấu hiệu ức chế hô hấp (đặc biệt khi phối hợp opioid)',ci:'Suy hô hấp cấp không hỗ trợ thở máy, myasthenia gravis nặng, suy gan nặng, ngộ độc rượu cấp nặng, mẫn cảm benzodiazepin',note:'⚠ Phối hợp với opioid → giảm liều diazepam ≥1/3 (nguy cơ ức chế hô hấp cộng hợp). Không pha loãng cùng thuốc khác trong cùng bơm tiêm (kết tủa). Giải độc: Flumazenil 0.2 mg IV lặp mỗi phút (tối đa 1 mg) — T½ ngắn, bệnh nhân có thể ngủ lại. Dùng kéo dài: phụ thuộc thể chất — giảm liều dần khi ngừng.'},
  cefepime:{name:'Cefepime (Maxipime)',cls:'Cephalosporin thế hệ 4 — phổ rộng Gram âm + Pseudomonas',dose:'Viêm phổi nặng/HAP/VAP: NL 1–2 g IV mỗi 8–12h × 10 ngày; Pseudomonas: 2 g IV mỗi 8h. Sốt giảm bạch cầu trung tính: 2 g IV mỗi 8h × 7 ngày. Trẻ ≥2T ≤40 kg: 50 mg/kg (tối đa 2 g) IV mỗi 8–12h. Truyền 30 phút. Hiệu chỉnh liều theo CrCl khi suy thận.',ind:'Viêm phổi bệnh viện/thở máy (HAP/VAP), nhiễm khuẩn huyết Gram âm, sốt giảm bạch cầu trung tính (kinh nghiệm), nhiễm khuẩn ổ bụng/tiết niệu nặng, vi khuẩn kháng cefotaxime/ceftriaxone',monitor:'Chức năng thận (CrCl để hiệu chỉnh liều), dấu hiệu co giật (độc thần kinh khi suy thận không hiệu chỉnh), công thức máu (điều trị dài ngày)',ci:'Mẫn cảm cephalosporin; thận trọng dị ứng penicillin nặng (dị ứng chéo ~1–2%)',note:'Phổ tốt với Pseudomonas aeruginosa và Enterobacteriaceae (kể cả ESBL khi liều cao/truyền kéo dài). ⚠ Độc thần kinh (co giật, bệnh não) đặc biệt khi suy thận không hiệu chỉnh liều. Truyền kéo dài 3–4h tối ưu hóa T>MIC với vi khuẩn nhạy cảm trung gian. DTQGVN 2023'},
  imipenem:{name:'Imipenem/Cilastatin (Tienam)',cls:'Carbapenem — phổ rộng nhất kháng sinh beta-lactam / Kháng sinh dự phòng cuối cùng',dose:'NL (CrCl ≥90 ml/phút): Vi khuẩn nhạy: 500 mg IV mỗi 6h hoặc 1 g mỗi 8h; Vi khuẩn nhạy trung gian: 1 g IV mỗi 6h; Tối đa 4 g/ngày. Suy thận (CrCl 60–90): 400 mg/6h; CrCl 30–60: 300 mg/6h; CrCl 15–30: 200 mg/6h. Truyền ≤500 mg trong 20–30 phút; >500 mg trong 40–60 phút.',ind:'Nhiễm khuẩn nặng đa kháng (Gram âm ESBL/AmpC, Acinetobacter, Pseudomonas), viêm phổi bệnh viện/thở máy, nhiễm khuẩn huyết MDR, nhiễm khuẩn ổ bụng phức tạp',monitor:'Chức năng thận (hiệu chỉnh liều), dấu hiệu co giật (độc thần kinh đặc trưng), ECG, công thức máu, men gan; theo dõi kháng thuốc',ci:'Mẫn cảm carbapenem/beta-lactam; thận trọng tiền sử co giật/tổn thương TKTW; không dùng đơn trị VRE',note:'⚠ Trong nhóm carbapenem: Imipenem nguy cơ co giật cao nhất — ưu tiên Meropenem khi BN có tiền sử động kinh. Tốc độ truyền quá nhanh gây buồn nôn/nôn → giảm tốc độ. Không phối hợp với ganciclovir (co giật). Cilastatin ức chế enzyme phân hủy imipenem ở ống thận. DTQGVN 2023'},
  linezolid:{name:'Linezolid (Zyvox)',cls:'Oxazolidinone — ức chế tổng hợp protein (50S) / Kháng MRSA & VRE',dose:'MRSA viêm phổi bệnh viện/da biến chứng: NL 600 mg IV/PO mỗi 12h × 10–14 ngày. VRE Enterococcus faecium: 600 mg IV/PO mỗi 12h × 14–28 ngày. Trẻ sơ sinh–11T: 10 mg/kg IV/PO mỗi 8h × 10–14 ngày. Sinh khả dụng PO ≈ IV → chuyển uống khi BN ổn định.',ind:'MRSA viêm phổi bệnh viện/cộng đồng, nhiễm khuẩn da biến chứng do MRSA/Streptococcus, VRE Enterococcus faecium kháng vancomycin, thay thế vancomycin khi không thể dùng IV',monitor:'CBC hàng tuần (giảm tiểu cầu — ADR thường gặp nhất khi >2 tuần), acid lactic (nhiễm toan lactic), dấu hiệu serotonin syndrome khi phối hợp SSRI/SNRI',ci:'Phối hợp MAOI hoặc trong vòng 2 tuần ngừng MAOI; hội chứng serotonin (phối hợp SSRI/SNRI/tramadol — nguy cơ cao); tăng huyết áp không kiểm soát',note:'⚠ Ức chế yếu MAOI → hội chứng serotonin khi phối hợp serotonergic drugs (SSRI, tramadol, meperidine). Ức chế tủy xương phụ thuộc thời gian — theo dõi CBC hàng tuần nếu dùng >2 tuần. Không cần hiệu chỉnh liều khi suy thận/gan. Tránh thực phẩm giàu tyramine (phô mai ủ, rượu vang đỏ). DTQGVN 2023'},
  fluconazole:{name:'Fluconazole (Diflucan)',cls:'Azole kháng nấm — ức chế CYP51 (lanosterol 14α-demethylase) / Kháng Candida & Cryptococcus',dose:'Candidemia/nhiễm Candida xâm lấn: 800 mg (12 mg/kg) IV liều nạp ngày 1 → 400 mg (6 mg/kg)/ngày. Viêm màng não Cryptococcus (duy trì): 400 mg/ngày ≥6–8 tuần. Dự phòng Candida ICU: 400 mg/ngày. Trẻ em: 6–12 mg/kg/ngày (tối đa 600 mg/ngày). Hiệu chỉnh liều 50% khi CrCl <50 ml/phút.',ind:'Candidemia/nhiễm Candida xâm lấn (C. albicans/tropicalis/parapsilosis nhạy), viêm màng não Cryptococcus (duy trì), dự phòng nấm ICU/suy giảm miễn dịch, nhiễm nấm niêm mạc',monitor:'Chức năng gan (ALT, AST), thuốc dùng kèm (ức chế CYP2C9/3A4: warfarin, phenytoin, cyclosporine, tacrolimus tăng nồng độ), ECG (QTc kéo dài)',ci:'Mẫn cảm azole; phối hợp astemizole/terfenadine/cisapride/pimozide/quinidine (QTc kéo dài nguy hiểm); Candida krusei (kháng tự nhiên)',note:'Kháng tự nhiên với C. krusei; giảm nhạy/kháng C. glabrata → dùng echinocandin thay thế. Ức chế CYP2C9 mạnh: tăng INR ở BN dùng warfarin — giảm liều warfarin 25–50%. Sinh khả dụng PO ~90% → chuyển uống ngay khi BN dung nạp. Không hiệu quả với Aspergillus. DTQGVN 2023'},
  methylprednisolone:{name:'Methylprednisolone (Solu-Medrol)',cls:'Glucocorticoid tổng hợp — chống viêm mạnh, không giữ muối / Potency: 5× hydrocortisone',dose:'Pulse therapy (ARDS/viêm nặng): 500–1000 mg IV × 3–5 ngày (truyền ≥30–60 phút). Cơn hen cấp nặng: 40–80 mg IV mỗi 6–12h đến FEV1 ≥70% → giảm dần. Phản ứng dị ứng nặng: 40–250 mg IV bolus, lặp mỗi 4–6h nếu cần. Uống duy trì: 4–48 mg/ngày. Trẻ em IV: 0.5–1.7 mg/kg/ngày chia 1–2 lần.',ind:'Cơn hen cấp nặng/trạng thái hen, ARDS (pha fibroproliferative), đợt cấp COPD nặng, phản vệ nặng (hỗ trợ sau epinephrine), ghép tạng (thải ghép cấp), MS cơn cấp',monitor:'Đường huyết (tăng rõ rệt), huyết áp, điện giải (K⁺ giảm), dấu hiệu nhiễm trùng (che khuất triệu chứng), tâm thần (loạn thần corticoid)',ci:'Nhiễm nấm toàn thân không kiểm soát, dị ứng methylprednisolone; thận trọng đái tháo đường, loét dạ dày đang hoạt động',note:'⚠ Tiêm IV nhanh liều ≥250 mg trong <30 phút → nguy cơ tụt HA, loạn nhịp, tử vong — PHẢI truyền ≥30–60 phút. Không có tác dụng mineralocorticoid — không thay thế hydrocortisone trong suy thượng thận cấp. Ngừng đột ngột sau dùng dài → suy thượng thận. DTQGVN 2023'},
  enoxaparin:{name:'Enoxaparin (Clexane/Lovenox)',cls:'Heparin trọng lượng phân tử thấp (LMWH) — ức chế yếu tố Xa > IIa',dose:'Dự phòng DVT nguy cơ vừa (nội khoa): 40 mg TDD × 1 lần/ngày. Dự phòng nguy cơ cao (phẫu thuật chỉnh hình): 40 mg TDD × 1 lần/ngày. Điều trị DVT/PE: 1.5 mg/kg TDD × 1 lần/ngày hoặc 1 mg/kg TDD × 2 lần/ngày. STEMI (18–74T): 30 mg IV bolus + 1 mg/kg TDD mỗi 12h. ≥75T: 0.75 mg/kg TDD mỗi 12h (không bolus). 2 mg ≡ 100 đvqt anti-Xa.',ind:'Dự phòng và điều trị DVT/PE, STEMI, đau thắt ngực không ổn định/NSTEMI, dự phòng huyết khối BN nằm viện dài ngày ICU',monitor:'Anti-Xa (mục tiêu điều trị 2 lần/ngày: 0.6–1.0 IU/ml; 1 lần/ngày: 1.0–2.0 IU/ml; lấy mẫu 4h sau tiêm), tiểu cầu ngày 4 và 8 (HIT — thấp hơn UFH), chức năng thận (giảm liều khi CrCl <30)',ci:'HIT type II, chảy máu nặng không kiểm soát, viêm nội tâm mạc nhiễm trùng (van tự nhiên), không dùng IM; CrCl <15: thay bằng UFH',note:'Không cần theo dõi aPTT thường quy (trừ trẻ em, béo phì nặng >190 kg, suy thận CrCl 15–30). Anti-Xa ưu tiên theo dõi ở suy thận vừa. Không thay thế đơn vị với UFH. Giải độc: protamine sulfate trung hòa ~60% anti-Xa (không hoàn toàn như UFH). DTQGVN 2023'},
  mannitol:{name:'Mannitol (Osmitrol)',cls:'Lợi tiểu thẩm thấu — tăng áp thẩm thấu huyết tương, kéo nước ra khỏi não/tổ chức',dose:'Phù não/tăng ICP: NL 0.25–2 g/kg IV trong 30–60 phút; lặp 1–2 lần sau 4–8h nếu cần. Trẻ 1T–11T: 0.25–1.5 g/kg. Trẻ 12–17T: 0.25–2 g/kg. Tăng áp lực nội nhãn: 0.25–2 g/kg IV trong 30–60 phút. Mục tiêu áp thẩm thấu huyết tương 310–320 mOsm/kg (không vượt 320).',ind:'Tăng áp lực nội sọ cấp (phù não do chấn thương, đột quỵ, u não), giảm ICP trước/sau phẫu thuật thần kinh, tăng áp lực nội nhãn cấp (glaucoma góc đóng cấp)',monitor:'Áp suất thẩm thấu huyết tương (mục tiêu 310–320, không vượt 320 mOsm/kg), điện giải (Na⁺, K⁺), lượng nước tiểu, áp lực nội sọ (nếu có ICP monitor), chức năng thận',ci:'Vô niệu, mất nước nặng, phù phổi, suy tim mất bù nặng, xuất huyết nội sọ đang tiến triển (tương đối), mẫn cảm mannitol',note:'⚠ Hiệu ứng bật ngược (rebound): tích tụ trong mô não tổn thương → tăng ICP trở lại nếu dùng kéo dài hoặc áp thẩm thấu >320 mOsm/kg. Không pha chung với máu/điện giải. Truyền đường riêng. Cân nhắc lọc thận nếu áp thẩm thấu tăng dần không thải được. DTQGVN 2023'},
  lorazepam:{name:'Lorazepam (Ativan)',cls:'Benzodiazepin tác dụng trung bình — tăng cường GABA-A / An thần ICU & chống co giật',dose:'Trạng thái động kinh IV NL: 4 mg tiêm chậm (≤2 mg/phút); lặp 4 mg sau 10 phút nếu cần. Trẻ 1T–11T: 100 mcg/kg IV (tối đa 4 mg); lặp sau 10 phút. Trẻ 12–17T: 4 mg, lặp sau 10 phút. An thần ICU (ngắn hạn) NL: 0.025–0.05 mg/kg IV mỗi 2–4h theo nhu cầu. Tiền mê: 0.05 mg/kg IV (30–45 phút trước PT). Cai rượu: 2 mg PO mỗi 6h × 4 liều, sau đó 1 mg mỗi 6h × 8 liều.',ind:'Trạng thái động kinh cấp (ưu tiên hơn diazepam ICU nhờ T½ hiệu quả dài hơn), an thần ngắn hạn ICU, cai rượu nặng, tiền mê, lo âu cơn cấp',monitor:'Nhịp thở, SpO₂ (ức chế hô hấp — ADR chính), HA, mức an thần (RASS), chức năng thận khi IV kéo dài (propylene glycol — nhiễm toan), dấu hiệu phụ thuộc thuốc',ci:'Suy hô hấp cấp không hỗ trợ thở máy, myasthenia gravis, suy thận nặng khi dùng IV kéo dài, mẫn cảm benzodiazepin',note:'Ưu điểm so với diazepam ICU: T½ hiệu quả 12–15h (không tích lũy chất chuyển hóa hoạt tính), ít phụ thuộc CYP. ⚠ Dạng tiêm IV chứa propylene glycol: dùng kéo dài liều cao → nhiễm toan lactic, suy thận — theo dõi khe thẩm thấu. Giải độc: Flumazenil 0.2 mg IV (tối đa 1 mg). DTQGVN 2023'},
  haloperidol:{name:'Haloperidol (Haldol)',cls:'Antipsychotic điển hình — đối kháng D2 mạnh / Điều trị mê sảng ICU',dose:'Mê sảng ICU uống: 1–10 mg/ngày (liều đơn hoặc chia 2–3 lần). Kích động nặng IM: Khởi đầu 5 mg IM; lặp mỗi 1h đến khi kiểm soát; tối đa 20 mg/ngày. Tiêm TM (off-label ICU): 0.5–2 mg IV chậm; lặp mỗi 15–20 phút nếu cần; duy trì 0.5–2 mg mỗi 6h. Người cao tuổi: ½ liều thấp nhất (tối đa 5 mg/ngày).',ind:'Mê sảng cấp ICU (điều trị và dự phòng — thuốc dùng phổ biến nhất), kích động tâm thần cấp, tâm thần phân liệt và rối loạn loạn thần, phòng và điều trị nôn sau phẫu thuật kháng trị',monitor:'ECG trước và trong dùng IV (QTc kéo dài — ngừng nếu QTc >500 ms), dấu hiệu ngoại tháp (dystonia, akathisia, parkinsonism), điện giải (K⁺, Mg²⁺)',ci:'QTc kéo dài ≥500 ms, hạ K⁺/Mg²⁺ không kiểm soát, bệnh Parkinson, sa sút trí tuệ thể Lewy, phối hợp thuốc kéo dài QT khác',note:'⚠ Đường TM (off-label): nguy cơ QTc kéo dài và Torsades de Pointes — luôn ECG. Hội chứng an thần kinh ác tính (NMS — hiếm, tử vong nếu không nhận diện): sốt cao + cứng cơ + loạn thần + rối loạn thực vật → ngừng thuốc ngay. Người cao tuổi: tăng nguy cơ tử vong (cảnh báo FDA hộp đen). DTQGVN 2023'},
  piperacillin_tazobactam:{name:'Piperacillin/Tazobactam (Pip/Tazo, Tazocin)',cls:'Penicillin phổ rộng + ức chế beta-lactamase / Kháng sinh ICU phổ rộng',dose:'NL chức năng thận bình thường: 4.5 g IV mỗi 6–8h (truyền 30 phút). Nhiễm khuẩn nặng/Pseudomonas: 4.5 g IV mỗi 6h. Tối ưu hóa PK/PD: truyền kéo dài 4h (Extended infusion). Trẻ em: 100 mg/kg (piperacillin) IV mỗi 8h. Hiệu chỉnh liều theo CrCl (giảm tần suất khi CrCl <40 ml/phút).',ind:'Nhiễm khuẩn huyết Gram âm nặng, viêm phổi bệnh viện/thở máy (Pseudomonas, Klebsiella), nhiễm khuẩn ổ bụng phức tạp, nhiễm khuẩn da và cấu trúc da, sốt giảm bạch cầu trung tính (phối hợp)',monitor:'Chức năng thận (hiệu chỉnh liều và tần suất), công thức máu (giảm tiểu cầu khi dùng dài), điện giải (hạ K⁺ — thành phần natri cao), chức năng gan',ci:'Mẫn cảm penicillin hoặc cephalosporin (dị ứng chéo); thận trọng tiền sử co giật (liều cao)',note:'Phổ rộng nhất trong nhóm beta-lactam (bao gồm cả Pseudomonas, ESBL, anaerobes). Extended infusion 4h tăng T>MIC so với truyền ngắn 30 phút — áp dụng khi điều trị Pseudomonas hoặc vi khuẩn nhạy cảm trung gian. Tương kỵ aminoglycoside và Ringer lactate — truyền đường riêng.'},
  alteplase:{name:'Alteplase (Actilyse) — tPA',cls:'Thuốc tiêu sợi huyết — chất hoạt hóa plasminogen tổ chức tái tổ hợp (rtPA)',dose:'NMCT cấp (phác đồ nhanh, trong 6h): Bolus 15 mg IV → 0.75 mg/kg truyền 30 phút (≤50 mg) → 0.5 mg/kg truyền 60 phút (≤35 mg); tổng tối đa 100 mg/90 phút. Đột quỵ thiếu máu cấp (trong 4.5h): 0.9 mg/kg IV (tối đa 90 mg); 10% bolus 1 phút → 90% còn lại truyền 60 phút. Thuyên tắc phổi nặng: Bolus 10 mg → 90 mg truyền 2h (≤65 kg: tối đa 1.5 mg/kg).',ind:'NMCT cấp ST chênh lên (khởi phát <6h hoặc <12h), đột quỵ thiếu máu não cấp (trong 4.5h), thuyên tắc phổi nặng đe dọa tính mạng, huyết khối van tim nhân tạo',monitor:'Huyết áp liên tục (mục tiêu HA tâm thu <180 mmHg trong và sau dùng), dấu hiệu chảy máu (nội sọ, tiêu hóa, vị trí tiêm), ECG liên tục (NMCT), thần kinh (đột quỵ — NIHSS mỗi 15 phút trong 2h đầu)',ci:'Đột quỵ xuất huyết bất kỳ lúc nào, xuất huyết nội sọ trước đó, phẫu thuật lớn hoặc chấn thương nặng trong 3 tháng, chảy máu nội tạng đang hoạt động, HA >185/110 mmHg không kiểm soát, đột quỵ thiếu máu nặng (NIHSS >25)',note:'⚠ KHÔNG tiêm bắp, tiêm dưới da, hoặc đường ngoài TM. Pha trong nước cất pha tiêm (lọ 50 mg) hoặc lọ dung môi kèm theo — không lắc mạnh. Sau dùng thrombolysis cho đột quỵ: không dùng heparin hoặc aspirin trong 24h. Tỷ lệ xuất huyết nội sọ ~6% (đột quỵ) — chuẩn bị phác đồ cấp cứu sẵn sàng.'},
  ertapenem:{name:'Ertapenem (Invanz)',cls:'Carbapenem — phổ rộng không bao gồm Pseudomonas/Acinetobacter / 1 lần/ngày',dose:'NL và trẻ ≥13T: 1 g IV hoặc IM × 1 lần/ngày × 5–14 ngày (tùy chỉ định). Trẻ 3 tháng–12T: 15 mg/kg IV/IM × 2 lần/ngày (tối đa 1 g/ngày). Suy thận (CrCl ≤30 ml/phút hoặc lọc máu): 500 mg/ngày; bổ sung 150 mg sau lọc nếu dùng trong 6h trước lọc. Dự phòng PT đại trực tràng: 1 g IV liều duy nhất trước PT 1h. Truyền IV trong 30 phút. TB (với lidocain 1%).',ind:'Nhiễm khuẩn ổ bụng biến chứng, nhiễm khuẩn da và mô mềm biến chứng, viêm phổi cộng đồng nặng, nhiễm khuẩn tiết niệu biến chứng, nhiễm khuẩn vùng chậu cấp tính, dự phòng nhiễm khuẩn phẫu thuật đại trực tràng',monitor:'Chức năng thận (hiệu chỉnh liều), dấu hiệu co giật (tuy ít hơn imipenem), phản ứng dị ứng (mẫn cảm carbapenem/beta-lactam)',ci:'Mẫn cảm carbapenem/beta-lactam; không có phổ với Pseudomonas aeruginosa, Acinetobacter, Stenotrophomonas — không dùng điều trị HAP/VAP; TB không được dùng NaCl 0.9% để pha (dùng lidocain 1%)',note:'Ưu điểm: 1 lần/ngày — thuận tiện chuyển từ ICU sang bệnh phòng. Phổ tốt với ESBL nhưng KHÔNG có tác dụng với Pseudomonas/Acinetobacter. Không pha trong Dextrose (tủa). Dung dịch IM chứa lidocain — không tiêm TM.'},
  teicoplanin:{name:'Teicoplanin (Targocid)',cls:'Glycopeptide tác dụng kéo dài — ức chế tổng hợp vách tế bào Gram dương',dose:'Loading (3 liều đầu, mỗi 12h): 6 mg/kg IV/IM × 3 liều (nhiễm khuẩn nhẹ-vừa: 3 liều 6 mg/kg; nhiễm khuẩn nặng/viêm nội tâm mạc: 3 liều 10 mg/kg). Duy trì: 6 mg/kg × 1 lần/ngày (nhẹ-vừa) hoặc 10 mg/kg × 1 lần/ngày (nặng). Trẻ em: loading 10 mg/kg mỗi 12h × 3 liều → duy trì 6 mg/kg × 1 lần/ngày. Viêm nội tâm mạc: duy trì 10–12 mg/kg/ngày.',ind:'Nhiễm khuẩn Gram dương nặng (MRSA, MRSE, Enterococcus), viêm nội tâm mạc do Gram dương, nhiễm khuẩn xương-khớp/da-mô mềm do MRSA, thay thế vancomycin (dung nạp tốt hơn, ít độc thận)',monitor:'Nồng độ đáy (trough) mục tiêu: nhiễm khuẩn thông thường 10–20 mg/L; viêm nội tâm mạc/nhiễm khuẩn nặng 15–30 mg/L (lấy trước liều thứ 4); chức năng thận; công thức máu; chức năng gan',ci:'Mẫn cảm teicoplanin hoặc vancomycin; thận trọng dị ứng chéo glycopeptide',note:'Ưu điểm so với vancomycin: ít độc thận hơn, 1 lần/ngày (sau loading). T½ dài 70–100h — không ngày nào bỏ liều (khó điều chỉnh nồng độ). Loading 3 liều bắt buộc để đạt nồng độ điều trị nhanh. Tương kỵ aminoglycoside — truyền đường riêng.'},
  daptomycin:{name:'Daptomycin (Cubicin)',cls:'Lipopeptide vòng — phá vỡ màng tế bào Gram dương phụ thuộc canxi',dose:'Nhiễm khuẩn da-mô mềm biến chứng (không kèm nhiễm khuẩn huyết): NL 4 mg/kg IV mỗi 24h × 7–14 ngày; Trẻ 1–2T: 10 mg/kg; 2–6T: 9 mg/kg; 7–11T: 7 mg/kg; 12–17T: 5 mg/kg. Nhiễm khuẩn huyết MRSA/viêm nội tâm mạc phải: NL 6 mg/kg mỗi 24h × 2–6 tuần (có thể đến 8–10 mg/kg trong MRSA nặng). Suy thận (CrCl <30 ml/phút): 4 mg/kg hoặc 6 mg/kg mỗi 48h. Tiêm TM trong 2 phút hoặc truyền 30 phút.',ind:'Nhiễm khuẩn da và mô mềm biến chứng do Gram dương, nhiễm khuẩn huyết và viêm nội tâm mạc phải do Staphylococcus aureus (kể cả MRSA), VRE. Dự trữ khi thất bại vancomycin/teicoplanin',monitor:'CK máu hàng tuần (tiêu cơ vân — ADR quan trọng nhất), chức năng thận, eosinophil (viêm phổi tăng bạch cầu ái toan), đáp ứng lâm sàng ngày 3–5',ci:'Mẫn cảm daptomycin; KHÔNG dùng điều trị viêm phổi (bất hoạt bởi surfactant phổi); thận trọng phối hợp statin (tăng nguy cơ tiêu cơ vân)',note:'⚠ KHÔNG dùng điều trị viêm phổi bất kỳ loại nào — daptomycin bị surfactant phổi bất hoạt hoàn toàn. Ngừng statin khi dùng daptomycin để giảm nguy cơ tiêu cơ vân. Không pha trong Dextrose (chỉ NaCl 0.9%). Không truyền chung đường với các thuốc khác.'},
  voriconazole:{name:'Voriconazole (Vfend)',cls:'Triazole thế hệ 2 — ức chế CYP51 nấm rộng phổ / Kháng Aspergillus & Candida',dose:'NL (≥40 kg): Loading IV 6 mg/kg mỗi 12h × 2 liều → Duy trì IV 4 mg/kg mỗi 12h (hoặc PO 200 mg mỗi 12h). Nếu không dung nạp: giảm duy trì xuống 3 mg/kg mỗi 12h. Trẻ 2–11T và 12–14T (<50 kg): Loading IV 9 mg/kg mỗi 12h × 2 liều → Duy trì IV 8 mg/kg mỗi 12h. Truyền IV tối đa 3 mg/kg/h trong 1–2h. PO: uống 1h trước hoặc sau ăn.',ind:'Aspergillosis xâm lấn (thuốc đầu tay — hướng dẫn IDSA/ECMM), nhiễm Candida xâm lấn kháng fluconazole, nhiễm nấm hiếm gặp (Scedosporium, Fusarium). Dự phòng nấm ở ghép tạng/tế bào gốc.',monitor:'Nồng độ đáy TDM (trough mục tiêu 1–5.5 mg/L; lấy trước liều thứ 5); chức năng gan (ALT/AST — tăng thường gặp); rối loạn thị giác (thường gặp đầu tiên — thoáng qua, lành tính); ECG (QTc); điện giải (K⁺, Mg²⁺, Ca²⁺)',ci:'Phối hợp rifampicin, carbamazepine, phenobarbital (giảm nồng độ voriconazole mạnh), sirolimus, ergotamine, pimozide (tăng độc tính), quinidine',note:'Thuốc đầu tay aspergillosis xâm lấn (vượt trội amphotericin B trong trial NEJM 2002). Tương tác thuốc rất nhiều và phức tạp (ức chế CYP2C9, CYP2C19, CYP3A4). TDM bắt buộc — nồng độ <1 mg/L: thất bại điều trị; >5.5 mg/L: độc gan/thần kinh. Không dùng với suy thận nặng (dung môi sulfobutyl ether β-cyclodextrin tích tụ).'},
  milrinone:{name:'Milrinone (Primacor)',cls:'Ức chế PDE-3 — tăng co bóp + giãn mạch / Thuốc tăng co bóp không phụ thuộc beta',dose:'NL: Loading 50 mcg/kg IV chậm trong ≥10 phút → Duy trì truyền 0.375–0.75 mcg/kg/phút (thường 0.5 mcg/kg/phút). Tổng liều tối đa: 1.13 mg/kg/ngày. Thời gian dùng: thường 48–72h; tối đa 5 ngày. Suy thận hiệu chỉnh duy trì: CrCl 50: 0.43 mcg/kg/phút; CrCl 40: 0.38; CrCl 30: 0.33; CrCl 20: 0.28; CrCl 10: 0.20 mcg/kg/phút. Pha trong G5% hoặc NaCl 0.9% đạt 200 mcg/ml.',ind:'Suy tim nặng cấp tính/mạn mất bù không đáp ứng đủ với lợi tiểu và vasodilator; giảm cung lượng tim sau phẫu thuật tim; cầu nối đến ghép tim; sốc tim kháng dobutamine',monitor:'Huyết áp liên tục (hạ HA — ADR thường gặp), nhịp tim và ECG (loạn nhịp thất), cung lượng tim/áp lực PCWP (nếu có PA catheter), chức năng thận (tích lũy suy thận)',ci:'Hẹp van động mạch chủ hoặc hẹp đường ra thất nặng, tắc nghẽn phổi nghiêm trọng, nhịp nhanh thất không kiểm soát, hạ huyết áp nặng (HA tâm thu <80 mmHg)',note:'Cơ chế kép: tăng co bóp + giãn mạch hệ thống và phổi → giảm tiền tải và hậu tải. Không phụ thuộc thụ thể beta — hiệu quả khi bệnh nhân đã dùng beta-blocker dài hạn. Tương kỵ với furosemide và NaHCO₃ — dùng đường truyền riêng. Nguy cơ hạ HA cao hơn dobutamine.'},
  valproic_acid:{name:'Valproate natri (Depakine IV)',cls:'Thuốc chống động kinh đa cơ chế — tăng GABA, ức chế kênh Na⁺/Ca²⁺ / Ổn định tâm thần',dose:'Động kinh IV (khi không dùng được PO): Chuyển đổi từ PO → IV với liều và tần suất tương đương. Trạng thái động kinh (off-label): 15–45 mg/kg IV bolus (≤6 mg/kg/phút), sau đó 1–5 mg/kg/h. Động kinh PO: Khởi đầu NL 15 mg/kg/ngày ÷ 2–4 lần; tăng dần 5–10 mg/kg/tuần; duy trì 25–30 mg/kg/ngày; tối đa 60 mg/kg/ngày. Rối loạn lưỡng cực: Khởi đầu 750 mg/ngày ÷ 2–3 lần. Truyền IV: pha trong ≥50 ml G5%/NaCl 0.9%/Ringer lactat; tốc độ ≤20 mg/phút.',ind:'Động kinh (cơn vắng, cơn toàn thể, cục bộ, hỗn hợp), trạng thái động kinh (IV), rối loạn lưỡng cực giai đoạn cấp và dự phòng, dự phòng đau nửa đầu (migraine)',monitor:'Nồng độ huyết thanh mục tiêu 50–100 mcg/ml; chức năng gan (độc gan nặng — phổ biến ở trẻ <2T dùng đa thuốc); ammonium máu (bệnh não do tăng ammonia); tiểu cầu (giảm tiểu cầu); cân nặng (tăng cân)',ci:'Suy gan hoặc viêm gan (bao gồm tiền sử gia đình), mẫn cảm valproate, rối loạn chuyển hóa porphyrin, phụ nữ có thai (dị tật thai nhi — phân loại X cho migraine, D cho động kinh)',note:'⚠ Độc gan nặng và tử vong: nguy cơ cao nhất ở trẻ <2 tuổi dùng đa thuốc chống động kinh — theo dõi men gan. Hội chứng tăng ammonia không có triệu chứng gan: theo dõi NH₃ khi lơ mơ/mê sảng. Chống chỉ định trong thai kỳ (dị tật ống thần kinh, giảm IQ trẻ). Tương tác nhiều: enzyme inducer làm giảm nồng độ valproate.'},
  tigecycline:{name:'Tigecycline (Tygacil)',cls:'Glycylcycline — ức chế tổng hợp protein (30S) siêu phổ / Kháng đa kháng MDR',dose:'NL: Loading 100 mg IV (truyền 30–60 phút) → Duy trì 50 mg IV mỗi 12h × 5–14 ngày tùy chỉ định. Suy gan nặng (Child-Pugh C): Loading 100 mg → Duy trì 25 mg mỗi 12h. Không cần hiệu chỉnh khi suy thận. Trẻ 8–11T: 1.2 mg/kg mỗi 12h (tối đa 50 mg); 12–17T: 50 mg mỗi 12h. Pha trong NaCl 0.9%, G5% hoặc Ringer lactat đến nồng độ ≤1 mg/ml.',ind:'Nhiễm khuẩn ổ bụng biến chứng (MDR Gram âm, Enterococcus), nhiễm khuẩn da và mô mềm biến chứng. Sử dụng off-label: HAP/VAP do MDR (CRKP, Acinetobacter baumannii), nhiễm khuẩn huyết MDR (phối hợp)',monitor:'Đáp ứng lâm sàng ngày 3–5 (nguy cơ thất bại điều trị trong VAP — FDA cảnh báo tăng tử vong), chức năng gan (suy gan nặng cần giảm liều), buồn nôn/nôn (ADR thường gặp nhất >30%)',ci:'Mẫn cảm tigecycline hoặc tetracycline; thận trọng phụ nữ mang thai và trẻ <8 tuổi (ảnh hưởng men răng); hạn chế đơn trị nhiễm khuẩn huyết/VAP (FDA cảnh báo tăng tử vong)',note:'Phổ rộng nhất hiện tại: MRSA, VRE, ESBL, Acinetobacter baumannii MDR, Klebsiella pneumoniae carbapenem-resistant (CRKP). ⚠ FDA cảnh báo tăng tử vong khi dùng đơn trị HAP/VAP — luôn phối hợp thuốc thứ 2. Nồng độ đỉnh thấp trong máu → không hiệu quả đơn trị nhiễm khuẩn huyết nặng. Gây buồn nôn/nôn mạnh — cân nhắc tiền mê chống nôn.'},
  acetylcysteine:{name:'N-Acetylcysteine / Acetylcysteine (NAC)',cls:'Thuốc giải độc paracetamol; tiêu đờm; chống oxy hóa',dose:'Giải độc paracetamol IV (NL và trẻ em): Tổng 300 mg/kg trong 21h — 3 giai đoạn liên tiếp: (1) 150 mg/kg truyền trong 1h (pha G5% 200 ml); (2) 50 mg/kg trong 4h (G5% 500 ml); (3) 100 mg/kg trong 16h (G5% 1000 ml). Trẻ: giảm thể tích dịch theo cân nặng. PO giải độc: 140 mg/kg liều nạp → 70 mg/kg mỗi 4h × 17 liều. Tiêu đờm phun khí dung: 3–5 ml dd 20% mỗi 6–8h.',ind:'Giải độc quá liều paracetamol (đường TM hoặc uống, trong vòng 8–24h sau uống — hiệu quả nhất trong 8h), tiêu đờm (xơ nang, COPD, phẫu thuật), bảo vệ thận cản quang (off-label), bệnh não gan (hỗ trợ)',monitor:'AST, ALT, INR, creatinine hàng ngày khi giải độc (đánh giá đáp ứng); dấu hiệu phản ứng giả dị ứng anaphylactoid (trong 1h đầu — đặc biệt giai đoạn 1); điện giải',ci:'Mẫn cảm acetylcysteine (tương đối — có thể tiếp tục sau xử lý phản ứng); thận trọng hen phế quản (co thắt phế quản khi phun khí dung)',note:'⚠ Phản ứng anaphylactoid (15–20% BN IV): đỏ bừng, ngứa, buồn nôn trong giờ đầu giai đoạn 1 → ngừng tạm thời, xử trí antihistamine, sau đó tiếp tục tốc độ chậm hơn. Hiệu quả giải độc tốt nhất trong 8h đầu; vẫn có lợi đến 24h sau uống. Pha trong G5% (không dùng NaCl — tương kỵ cao su). Tương kỵ kim loại nặng (Fe, Cu) và oxy hóa.'},
  adenosine:{name:'Adenosine (Adenocard)',cls:'Antiarrhythmic nhóm V — ức chế nút AV thoáng qua / Cắt cơn SVT cấp cứu',dose:'SVT NL: 6 mg IV bolus nhanh trong 1–2 giây + flush NaCl 20 ml ngay → Nếu không hiệu quả sau 1–2 phút: 12 mg bolus, lặp lại 1 lần nếu cần (tối đa 12 mg/liều). Trẻ <50 kg: Khởi đầu 0.05–0.1 mg/kg; tăng 0.05–0.1 mg/kg mỗi 1–2 phút đến khi có hiệu quả (tối đa 0.3 mg/kg hoặc 12 mg). Trẻ ≥50 kg: 6 mg → 12 mg (như NL). Ghép tim: liều khởi đầu 3 mg (nhạy cảm hơn). Stress test xạ hình cơ tim: truyền 140 mcg/kg/phút × 6 phút.',ind:'Cắt cơn nhịp nhanh kịch phát trên thất (SVT — AVNRT, AVRT) cấp cứu; phân biệt chẩn đoán nhịp nhanh trên thất với thất (làm chậm tạm thời nút AV); stress test xạ hình cơ tim (thay thế gắng sức)',monitor:'ECG liên tục trong và ngay sau tiêm (block AV thoáng qua, nhịp chậm xoang, ngừng xoang — thường tự hồi phục <10–30 giây); SpO₂; huyết áp; dấu hiệu co thắt phế quản',ci:'Block AV độ 2–3 hoặc sick sinus syndrome không có máy tạo nhịp, rung/cuồng nhĩ, nhịp nhanh thất (không hiệu quả và nguy hiểm), hen phế quản/COPD nặng (co thắt phế quản), mẫn cảm adenosine',note:'⚠ Tiêm NHANH nhất có thể trong 1–2 giây + flush NaCl ngay — T½ cực ngắn <10 giây (bị khử hoạt trong hồng cầu và nội mạc). Tiêm chậm sẽ không đạt nồng độ hiệu quả tại nút AV. Dipyridamole ức chế chuyển hóa → giảm liều adenosine xuống ¼. Methyl xanthine (theophylline, caffeine) đối kháng tác dụng → kém hiệu quả ở BN đang dùng theophylline.'}
};

function _normDI(s){if(!s)return'';return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u0111]/g,'d').replace(/[\u0110]/g,'D').toLowerCase().trim();}
function searchDrug() {
  var raw = (document.getElementById('di-search').value||'').trim();
  var q = _normDI(raw);
  var res = document.getElementById('di-result');
  if(!res) return;
  if(!q){
    res.innerHTML='<div style="text-align:center;padding:40px;color:var(--TM)"><div style="font-size:40px;margin-bottom:12px">💊</div><div>Nhập tên thuốc để tra cứu ('+Object.keys(DRUG_DB).length+' thuốc)</div></div>';
    return;
  }
  var matches = Object.entries(DRUG_DB).filter(function(e){
    var d=e[1];
    return _normDI(e[0]).includes(q)||_normDI(d.name).includes(q)||
      _normDI(d.cls).includes(q)||_normDI(d.ind).includes(q);
  });
  if(!matches.length){
    res.innerHTML='<div class="no-found"><div class="nf-ico">🔍</div><div>Không tìm thấy "'+q+'"</div><div style="font-size:11px;margin-top:6px">Thử từ khóa khác hoặc hỏi Trợ lý AI</div></div>';
    return;
  }
  var DI_CITATION='<div class="di-citation">📚 <strong>Tài liệu tham khảo:</strong> Bộ Y tế (2022). <em>Dược thư quốc gia Việt Nam</em>, lần xuất bản thứ ba. Quyết định số 3445/QĐ-BYT, ngày 23 tháng 12 năm 2022.</div>';
  res.innerHTML='<div style="font-size:11.5px;color:var(--TM);margin-bottom:10px">Tìm thấy <strong>'+matches.length+'</strong> kết quả:</div>'+
    matches.map(function(e){var d=e[1];
      var noteClean=(d.note||'').replace(/[\.\s]*DTQGVN\s*202[0-9]\.?/g,'').trim();
      return(
      '<div class="drug-card">'
      +'<div class="drug-name">'+d.name+'</div>'
      +'<div class="drug-class">📦 '+d.cls+'</div>'
      +'<div class="ir"><strong>📋 Chỉ định</strong><span>'+d.ind+'</span></div>'
      +'<div class="ir"><strong>💉 Liều dùng</strong><span>'+d.dose+'</span></div>'
      +'<div class="ir"><strong>🔬 Theo dõi</strong><span>'+d.monitor+'</span></div>'
      +'<div class="ir"><strong style="color:var(--R)">🚫 Chống chỉ định</strong><span style="color:var(--R)">'+d.ci+'</span></div>'
      +'<div class="ir"><strong style="color:var(--W)">⚠️ Lưu ý</strong><span style="color:var(--W)">'+noteClean+'</span></div>'
      +DI_CITATION
      +'</div>'
    );}).join('');
}

// ============================================================
// INTERACTION CHECKER (QD 5948)
// ============================================================
function checkInteraction() {
  var d1=(document.getElementById('int-d1')||{}).value||'';
  var d2=(document.getElementById('int-d2')||{}).value||'';
  var single=(document.getElementById('int-single')||{}).value||'';
  var res=document.getElementById('int-result');
  if(!res) return;

  // Normalize: bỏ dấu tiếng Việt, lowercase
  function norm(s){if(!s)return'';return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u0111]/g,'d').replace(/[\u0110]/g,'D').toLowerCase().trim();}
  var n1=norm(d1), n2=norm(d2), ns=norm(single);

  if(!n1&&!n2&&!ns){
    res.innerHTML='<div class="no-found"><div class="nf-ico">🔍</div><div>Nhập tên thuốc để kiểm tra</div></div>';
    return;
  }

  var found=[];
  // Fuzzy match: dùng norm để tìm cả có dấu và không dấu
  function match(q,drugName){
    if(!q||q.length<2) return false;
    var nq=norm(q), dn=norm(drugName);
    return dn.includes(nq)||nq.includes(dn.split(' ')[0]);
  }

  if(ns) {
    // Single drug search: find all interactions involving this drug
    found=INT_DB.filter(function(i){return match(ns,i.d1)||match(ns,i.d2);});
  } else if(n1||n2) {
    // Two-drug search
    if(n1&&n2){
      found=INT_DB.filter(function(i){
        return (match(n1,i.d1)&&match(n2,i.d2))||(match(n1,i.d2)&&match(n2,i.d1));
      });
    } else {
      var q=n1||n2;
      found=INT_DB.filter(function(i){return match(q,i.d1)||match(q,i.d2);});
    }
  }

  if(!found.length){
    res.innerHTML='<div class="no-found">'
      +'<div class="nf-ico">✅</div>'
      +'<div style="font-weight:700;color:var(--G)">Không tìm thấy tương tác trong Danh mục QĐ 5948</div>'
      +'<div style="font-size:12px;margin-top:6px;color:var(--TM)">Không có nghĩa là an toàn tuyệt đối.<br>Vẫn nên tra cứu thêm: Micromedex · Lexicomp · Drugs.com</div>'
      +'</div>';
    return;
  }

  // Sort: CCI (tuyệt đối) first, then conditional
  found.sort(function(a,b){return (b.ci?1:0)-(a.ci?1:0);});
  var cci=found.filter(function(i){return i.ci;});
  var cond=found.filter(function(i){return !i.ci;});

  res.innerHTML='<div style="font-size:12px;color:var(--TM);margin-bottom:12px">'
    +'Tìm thấy <strong>'+found.length+'</strong> tương tác: '
    +(cci.length?'<span style="color:var(--R);font-weight:700">🔴 '+cci.length+' Chống chỉ định tuyệt đối</span> ':'')
    +(cond.length?'<span style="color:var(--W);font-weight:700">🟡 '+cond.length+' Cần thận trọng/tránh</span>':'')
    +'</div>'
    +found.map(function(i){
      var cls=i.ci?'int-ccci':'int-cn';
      var icon=i.ci?'🔴':'🟡';
      var sev_text=i.ci?'CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI':'CẦN THẬN TRỌNG / TỐT NHẤT NÊN TRÁNH';
      return '<div class="int-card '+cls+'">'
        +'<div class="int-sev">'+icon+' '+sev_text+'</div>'
        +'<div class="int-pair">'+i.d1+' ↔ '+i.d2+'</div>'
        +(i.m?'<div class="int-row"><b>⚙️ Cơ chế:</b> '+i.m+'</div>':'')
        +(i.c?'<div class="int-row"><b>⚠️ Hậu quả:</b> '+i.c+'</div>':'')
        +(i.x?'<div class="int-mgmt"><b>✅ Xử trí:</b> '+i.x+'</div>':'')
        +'</div>';
    }).join('');
}

// ============================================================
// MULTI-DRUG INTERACTION CHECK (tối đa 10 thuốc, kiểm tra mọi cặp)
// ============================================================
var MTT_MAX=10, mttRowCount=0;

function mttNorm(s){if(!s)return'';return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u0111]/g,'d').replace(/[\u0110]/g,'D').toLowerCase().trim();}
function mttMatch(q,drugName){
  if(!q||q.length<2) return false;
  var nq=mttNorm(q), dn=mttNorm(drugName);
  return dn.includes(nq)||nq.includes(dn.split(' ')[0]);
}

function mttCreateRow(){
  mttRowCount++;
  var id='mtt-row-'+mttRowCount;
  var wrap=document.createElement('div');
  wrap.className='ac-wrap';
  wrap.id=id+'-wrap';
  wrap.style.marginBottom='8px';
  wrap.style.position='relative';
  wrap.innerHTML='<div style="display:flex;gap:6px">'
    +'<input type="text" id="'+id+'" class="mtt-input" placeholder="Thuốc '+mttRowCount+'" autocomplete="off" '
    +'style="flex:1;border:2px solid var(--BOR);border-radius:9px;padding:9px 13px;font-size:13.5px;font-family:\'Be Vietnam Pro\',sans-serif;color:var(--TXT);box-sizing:border-box">'
    +'<button type="button" class="bs" onclick="mttRemoveRow(\''+id+'\')" style="padding:6px 10px">✕</button>'
    +'</div><div class="ac-dd" id="'+id+'-dd" role="listbox"></div>';
  document.getElementById('mtt-list').appendChild(wrap);
  AcCtrl(id,id+'-dd',getIntSugs,function(val){var inp=document.getElementById(id);if(inp)inp.value=val;});
  mttUpdateAddBtn();
}
function mttRemoveRow(id){
  var el=document.getElementById(id+'-wrap');
  if(el) el.remove();
  mttUpdateAddBtn();
}
function mttUpdateAddBtn(){
  var n=document.querySelectorAll('#mtt-list .ac-wrap').length;
  var btn=document.getElementById('mtt-btn-add');
  if(btn) btn.disabled = n>=MTT_MAX;
}
function mttRunSearch(){
  var inputs=Array.prototype.slice.call(document.querySelectorAll('#mtt-list .mtt-input'));
  var names=inputs.map(function(i){return i.value.trim();}).filter(Boolean);
  var res=document.getElementById('mtt-result');
  if(!res) return;
  if(names.length<2){
    res.innerHTML='<div class="no-found"><div class="nf-ico">🔍</div><div>Cần nhập ít nhất 2 thuốc để kiểm tra</div></div>';
    return;
  }
  var found=[], seen={};
  for(var a=0;a<names.length;a++){
    for(var b=a+1;b<names.length;b++){
      INT_DB.forEach(function(it){
        var key=it.d1+'||'+it.d2+'||'+a+'-'+b;
        if(seen[key]) return;
        if((mttMatch(names[a],it.d1)&&mttMatch(names[b],it.d2))||(mttMatch(names[a],it.d2)&&mttMatch(names[b],it.d1))){
          seen[key]=true; found.push(it);
        }
      });
    }
  }
  if(!found.length){
    res.innerHTML='<div class="no-found">'
      +'<div class="nf-ico">✅</div>'
      +'<div style="font-weight:700;color:var(--G)">Không tìm thấy tương tác giữa các thuốc đã nhập</div>'
      +'<div style="font-size:12px;margin-top:6px;color:var(--TM)">Không có nghĩa là an toàn tuyệt đối — vẫn nên tra cứu thêm Micromedex · Lexicomp · Drugs.com</div>'
      +'</div>';
    return;
  }
  found.sort(function(a,b){return (b.ci?1:0)-(a.ci?1:0);});
  var cci=found.filter(function(i){return i.ci;}), cond=found.filter(function(i){return !i.ci;});
  res.innerHTML='<div style="font-size:12px;color:var(--TM);margin-bottom:12px">'
    +'Tìm thấy <strong>'+found.length+'</strong> tương tác trong '+names.length+' thuốc: '
    +(cci.length?'<span style="color:var(--R);font-weight:700">🔴 '+cci.length+' Chống chỉ định tuyệt đối</span> ':'')
    +(cond.length?'<span style="color:var(--W);font-weight:700">🟡 '+cond.length+' Cần thận trọng/tránh</span>':'')
    +'</div>'
    +found.map(function(i){
      var cls=i.ci?'int-ccci':'int-cn';
      var icon=i.ci?'🔴':'🟡';
      var sev_text=i.ci?'CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI':'CẦN THẬN TRỌNG / TỐT NHẤT NÊN TRÁNH';
      return '<div class="int-card '+cls+'">'
        +'<div class="int-sev">'+icon+' '+sev_text+'</div>'
        +'<div class="int-pair">'+i.d1+' ↔ '+i.d2+'</div>'
        +(i.m?'<div class="int-row"><b>⚙️ Cơ chế:</b> '+i.m+'</div>':'')
        +(i.c?'<div class="int-row"><b>⚠️ Hậu quả:</b> '+i.c+'</div>':'')
        +(i.x?'<div class="int-mgmt"><b>✅ Xử trí:</b> '+i.x+'</div>':'')
        +'</div>';
    }).join('');
}

// ============================================================
// ABBREVIATIONS
// ============================================================
// ============================================================
// ABBRS v2 — Bộ viết tắt đầy đủ, không trùng lặp, phân nhóm
// ============================================================
var ABBRS=[
  // ── NHÂN TRẮC & CHỨC NĂNG THẬN ──────────────────────────
  ['CrCl','Creatinine Clearance / Độ thanh thải creatinine (Cockcroft-Gault)','mL/phút (BT: 80–120)'],
  ['eGFR','Estimated Glomerular Filtration Rate (CKD-EPI race-free)','mL/phút/1.73m²'],
  ['SCr','Serum Creatinine / Creatinine huyết thanh','mg/dL (BT: 0.6–1.2) hoặc µmol/L'],
  ['BUN','Blood Urea Nitrogen / Urê nitơ máu','mg/dL (BT: 7–20)'],
  ['IBW','Ideal Body Weight / Cân nặng lý tưởng (Devine)','kg'],
  ['ABW','Adjusted Body Weight / Cân nặng hiệu chỉnh','kg (dùng khi BMI >30)'],
  ['LBW','Lean Body Weight / Cân nặng gầy','kg'],
  ['TBW','Total Body Weight / Cân nặng thực tế','kg'],
  ['BMI','Body Mass Index / Chỉ số khối cơ thể','kg/m² (BT: 18.5–24.9)'],
  ['TBW (nước)','Total Body Water / Tổng lượng nước cơ thể','L (≈60% cân nặng nam, 50% nữ)'],
  ['BSA','Body Surface Area / Diện tích bề mặt cơ thể','m² (Mosteller)'],
  ['CKD','Chronic Kidney Disease / Bệnh thận mạn','Giai đoạn G1–G5 (KDIGO 2022)'],
  ['AKI','Acute Kidney Injury / Tổn thương thận cấp','KDIGO: tăng SCr ≥0.3 mg/dL trong 48h'],
  // ── DƯỢC ĐỘNG HỌC / DƯỢC LỰC HỌC ────────────────────────
  ['PK','Pharmacokinetics / Dược động học','Hấp thu, phân bố, chuyển hóa, thải trừ'],
  ['PD','Pharmacodynamics / Dược lực học','Cơ chế tác dụng, hiệu quả'],
  ['TDM','Therapeutic Drug Monitoring / Giám sát nồng độ thuốc điều trị','—'],
  ['AUC','Area Under Curve / Diện tích dưới đường cong nồng độ–thời gian','mg·h/L'],
  ['AUC/MIC','Tỷ số AUC/MIC — PD index kháng sinh phụ thuộc nồng độ','Vancomycin: mục tiêu 400–600'],
  ['MIC','Minimum Inhibitory Concentration / Nồng độ ức chế tối thiểu','mg/L'],
  ['Cmax','Maximum concentration / Nồng độ đỉnh','mg/L'],
  ['Cmin','Minimum concentration / Nồng độ đáy (trough)','mg/L'],
  ['Cmax/MIC','Tỷ số Cmax/MIC — PD index aminoglycoside','Mục tiêu: ≥8–10'],
  ['%T>MIC','Phần trăm thời gian nồng độ trên MIC','PD index beta-lactam; mục tiêu ≥40–100%'],
  ['Ke','Elimination rate constant / Hằng số tốc độ thải trừ','h⁻¹'],
  ['Vd','Volume of distribution / Thể tích phân bố','L hoặc L/kg'],
  ['CL','Clearance / Độ thanh thải thuốc','L/h hoặc mL/phút'],
  ['t½','Half-life / Thời gian bán thải','h'],
  ['F','Bioavailability / Sinh khả dụng','% (0–100%)'],
  ['fu','Fraction unbound / Phân suất thuốc tự do','0–1'],
  ['PK/PD','Pharmacokinetics/Pharmacodynamics — Dược động/Dược lực học','—'],
  // ── KHÁNG SINH & VI SINH ─────────────────────────────────
  ['MRSA','Methicillin-Resistant Staphylococcus aureus','Tụ cầu vàng kháng methicillin'],
  ['MSSA','Methicillin-Susceptible Staphylococcus aureus','Tụ cầu vàng nhạy methicillin'],
  ['ESBL','Extended-Spectrum Beta-Lactamase','Enzyme phân hủy beta-lactam phổ rộng'],
  ['KPC','Klebsiella pneumoniae Carbapenemase','Carbapenemase nhóm A'],
  ['MBL','Metallo-Beta-Lactamase','Carbapenemase nhóm B (NDM, IMP, VIM)'],
  ['MDR','Multi-Drug Resistant / Đa kháng thuốc','Kháng ≥3 nhóm kháng sinh'],
  ['XDR','Extensively Drug Resistant / Kháng thuốc diện rộng','Chỉ còn 1–2 nhóm nhạy cảm'],
  ['PDR','Pan-Drug Resistant / Kháng tất cả kháng sinh','Toàn kháng'],
  ['MIC','Minimum Inhibitory Concentration / Nồng độ ức chế tối thiểu','mg/L'],
  ['MBC','Minimum Bactericidal Concentration / Nồng độ diệt khuẩn tối thiểu','mg/L'],
  ['CAP','Community-Acquired Pneumonia / Viêm phổi cộng đồng','CURB-65 để phân tầng'],
  ['HAP','Hospital-Acquired Pneumonia / Viêm phổi bệnh viện','≥48h sau nhập viện'],
  ['VAP','Ventilator-Assoc. Pneumonia / Viêm phổi liên quan thở máy','≥48h sau đặt NKQ'],
  ['UTI','Urinary Tract Infection / Nhiễm khuẩn tiết niệu','—'],
  ['SSTI','Skin and Soft Tissue Infection / Nhiễm khuẩn da và mô mềm','—'],
  ['BSI','Bloodstream Infection / Nhiễm khuẩn huyết','—'],
  ['IAI','Intra-Abdominal Infection / Nhiễm khuẩn ổ bụng','—'],
  ['CMS','Colistimethate Sodium / Colistin methanesulfonate','MIU (triệu đơn vị quốc tế)'],
  ['MIU','Million International Units / Triệu đơn vị quốc tế','Đơn vị CMS/Colistin'],
  ['EID','Extended-Interval Dosing / Liều giãn cách mở rộng','Aminoglycoside: 1 lần/ngày'],
  ['MDD','Multiple Daily Dosing / Liều nhiều lần mỗi ngày','—'],
  ['ODD','Once Daily Dosing / Liều một lần mỗi ngày','—'],
  ['AMS','Antimicrobial Stewardship / Quản lý sử dụng kháng sinh','Chương trình QLKS bệnh viện'],
  ['AWaRe','Access – Watch – Reserve','WHO phân loại kháng sinh (2021)'],
  ['DDD','Defined Daily Dose / Liều xác định mỗi ngày','Đơn vị đo lường tiêu thụ KS (WHO)'],
  // ── ĐƯỜNG DÙNG THUỐC ─────────────────────────────────────
  ['IV','Intravenous / Đường tĩnh mạch','—'],
  ['IM','Intramuscular / Đường tiêm bắp','—'],
  ['SC','Subcutaneous / Đường tiêm dưới da','—'],
  ['PO','Per Os / Đường uống','—'],
  ['PR','Per Rectum / Đường trực tràng','—'],
  ['SL','Sublingual / Đường dưới lưỡi','—'],
  ['TD','Transdermal / Đường qua da (miếng dán)','—'],
  ['INH','Inhalation / Đường hít','—'],
  ['NPO','Nil Per Os / Nhịn ăn — không uống/ăn qua miệng','—'],
  ['TTM','Truyền tĩnh mạch / IV infusion (nhỏ giọt)','mL/h hoặc gtt/phút'],
  ['TM','Tiêm tĩnh mạch chậm / IV push (bolus)','—'],
  ['TB','Tiêm bắp / Intramuscular injection','—'],
  ['TDD','Tiêm dưới da / Subcutaneous injection','—'],
  ['gtt/mL','Giọt/mL — drop factor','15 (chuẩn), 20 (mini), 60 (micro — nhi)'],
  // ── LỌC MÁU & HỒI SỨC ───────────────────────────────────
  ['IHD','Intermittent Hemodialysis / Lọc máu ngắt quãng','Thường 3–4 lần/tuần, 3–4h/lần'],
  ['CRRT','Continuous Renal Replacement Therapy / Lọc máu liên tục','—'],
  ['CVVH','Continuous Veno-Venous Hemofiltration','Lọc đối lưu liên tục'],
  ['CVVHD','Continuous Veno-Venous Hemodialysis','Lọc khuếch tán liên tục'],
  ['CVVHDF','Continuous Veno-Venous Hemodiafiltration','Lọc kết hợp liên tục'],
  ['SLED','Sustained Low-Efficiency Dialysis / Lọc máu hiệu suất thấp kéo dài','—'],
  ['ECMO','Extracorporeal Membrane Oxygenation / Tim phổi nhân tạo ngoài cơ thể','VA-ECMO / VV-ECMO'],
  ['ICU','Intensive Care Unit / Đơn vị chăm sóc tích cực','—'],
  ['HDU','High Dependency Unit / Phòng bệnh nặng','—'],
  ['ETT','Endotracheal Tube / Ống nội khí quản','—'],
  ['NKQ','Nội khí quản','—'],
  ['MV','Mechanical Ventilation / Thở máy xâm lấn','—'],
  // ── HUYẾT ĐỘNG & THEO DÕI ────────────────────────────────
  ['MAP','Mean Arterial Pressure / Huyết áp động mạch trung bình','mmHg (mục tiêu ICU: ≥65)'],
  ['HATT','Huyết áp tâm thu','mmHg (BT: <120)'],
  ['HATTr','Huyết áp tâm trương','mmHg (BT: <80)'],
  ['HR','Heart Rate / Nhịp tim','lần/phút (BT: 60–100)'],
  ['RR','Respiratory Rate / Nhịp thở','lần/phút (BT: 12–20)'],
  ['SpO₂','Oxygen saturation by pulse oximetry / Độ bão hòa oxy mao mạch','% (BT: ≥95%)'],
  ['PaO₂','Partial pressure of arterial O₂ / Áp suất riêng phần O₂ động mạch','mmHg (BT: 80–100)'],
  ['PaCO₂','Partial pressure of arterial CO₂ / Áp suất riêng phần CO₂ động mạch','mmHg (BT: 35–45)'],
  ['FiO₂','Fraction of inspired oxygen / Phân suất oxy hít vào','0.21 (khí trời) – 1.0 (100%)'],
  ['P/F','PaO₂/FiO₂ ratio / Chỉ số oxy hóa','BT: >400; ARDS nhẹ: 200–300'],
  ['CVP','Central Venous Pressure / Áp lực tĩnh mạch trung tâm','mmHg (BT: 5–12)'],
  ['ScvO₂','Central venous O₂ saturation / Độ bão hòa oxy TM trung tâm','% (BT: ≥70%)'],
  ['QTc','Corrected QT interval / Khoảng QT hiệu chỉnh','ms (BT: <440 nam, <460 nữ)'],
  ['EF','Ejection Fraction / Phân suất tống máu','% (BT: 55–70%)'],
  ['RASS','Richmond Agitation–Sedation Scale / Thang điểm an thần–kích thích','−5 (hôn mê sâu) đến +4 (rất kích thích)'],
  ['NEWS2','National Early Warning Score 2','0–20 điểm; ≥7: nguy cơ rất cao'],
  ['GCS','Glasgow Coma Scale / Thang điểm hôn mê Glasgow','3 (hôn mê sâu) – 15 (tỉnh táo)'],
  ['NRS','Numerical Rating Scale / Thang điểm đau số học','0 (không đau) – 10 (đau tột độ)'],
  ['VAS','Visual Analogue Scale / Thang điểm đau nhìn hình ảnh','0–100 mm'],
  // ── XÉT NGHIỆM MÁU ───────────────────────────────────────
  ['WBC','White Blood Cell / Bạch cầu','10³/µL (BT: 4.0–10.0)'],
  ['Hb','Hemoglobin / Huyết sắc tố','g/dL (BT: 12–16 nữ; 13–17 nam)'],
  ['Hct','Hematocrit / Tỷ lệ hồng cầu','% (BT: 36–48 nữ; 41–53 nam)'],
  ['PLT','Platelet / Tiểu cầu','10³/µL (BT: 150–400)'],
  ['Neu','Neutrophil / Bạch cầu trung tính','10³/µL (BT: 1.8–7.7)'],
  ['Lymph','Lymphocyte / Bạch cầu lympho','10³/µL (BT: 1.0–4.8)'],
  ['CRP','C-Reactive Protein / Protein phản ứng C','mg/L (BT: <5)'],
  ['PCT','Procalcitonin / Procalcitonin','ng/mL (BT: <0.1; sepsis: >2)'],
  ['Lactate','Lactate máu','mmol/L (BT: 0.5–2.0; shock: >4)'],
  ['ALT','Alanine Aminotransferase / Men gan ALT (SGPT)','U/L (BT: <45)'],
  ['AST','Aspartate Aminotransferase / Men gan AST (SGOT)','U/L (BT: <40)'],
  ['GGT','Gamma-Glutamyl Transferase / Gamma GT','U/L (BT: <60)'],
  ['ALP','Alkaline Phosphatase / Phosphatase kiềm','U/L (BT: 40–150)'],
  ['Bilirubin TP','Bilirubin toàn phần','µmol/L (BT: 3.4–17.1)'],
  ['Albumin','Albumin huyết thanh','g/L (BT: 35–50)'],
  ['Na⁺','Sodium / Natri huyết thanh','mEq/L hoặc mmol/L (BT: 136–145)'],
  ['K⁺','Potassium / Kali huyết thanh','mEq/L hoặc mmol/L (BT: 3.5–5.0)'],
  ['Cl⁻','Chloride / Clorid huyết thanh','mEq/L (BT: 98–106)'],
  ['HCO₃⁻','Bicarbonate / Bicarbonate huyết thanh','mEq/L (BT: 22–26)'],
  ['Ca²⁺','Calcium / Canxi huyết thanh','mg/dL (BT: 8.5–10.5) hoặc mmol/L'],
  ['Mg²⁺','Magnesium / Magie huyết thanh','mg/dL (BT: 1.7–2.2)'],
  ['Phospho','Phosphate / Phospho huyết thanh','mg/dL (BT: 2.5–4.5)'],
  ['Glucose','Glucose máu','mg/dL hoặc mmol/L (BT lúc đói: 70–100 mg/dL)'],
  ['HbA1c','Glycated Hemoglobin / Hemoglobin glycated','% (mục tiêu ĐTĐ: <7–8%)'],
  ['PT','Prothrombin Time / Thời gian prothrombin','giây (BT: 11–14)'],
  ['INR','International Normalized Ratio','BT: 0.9–1.1; mục tiêu VKA: 2.0–3.0'],
  ['aPTT','Activated Partial Thromboplastin Time','giây (BT: 25–37; mục tiêu heparin: 60–100)'],
  ['D-dimer','D-dimer','µg/mL FEU (BT: <0.5)'],
  ['TSH','Thyroid-Stimulating Hormone / Hormon kích thích tuyến giáp','mIU/L (BT: 0.4–4.0)'],
  ['FT4','Free Thyroxine / Thyroxine tự do T4','pmol/L (BT: 9–20) hoặc ng/dL'],
  ['FT3','Free Triiodothyronine / T3 tự do','pmol/L (BT: 3.5–6.5)'],
  ['Cortisol','Cortisol huyết thanh buổi sáng','µg/dL (BT: 7–25)'],
  // ── ĐÔNG MÁU & TIM MẠCH ──────────────────────────────────
  ['DVT','Deep Vein Thrombosis / Huyết khối tĩnh mạch sâu','—'],
  ['PE','Pulmonary Embolism / Thuyên tắc phổi','—'],
  ['VTE','Venous Thromboembolism / Thuyên tắc tĩnh mạch','DVT + PE'],
  ['ACS','Acute Coronary Syndrome / Hội chứng vành cấp','UA, NSTEMI, STEMI'],
  ['NMCT','Nhồi máu cơ tim / Myocardial Infarction','STEMI / NSTEMI'],
  ['PCI','Percutaneous Coronary Intervention / Can thiệp mạch vành qua da','—'],
  ['CABG','Coronary Artery Bypass Grafting / Phẫu thuật bắc cầu mạch vành','—'],
  ['HFrEF','Heart Failure with reduced EF / Suy tim phân suất tống máu giảm','EF <40%'],
  ['HFpEF','Heart Failure with preserved EF / Suy tim phân suất tống máu bảo tồn','EF ≥50%'],
  ['AF','Atrial Fibrillation / Rung nhĩ','—'],
  ['CHA₂DS₂-VASc','Thang điểm nguy cơ đột quỵ trong rung nhĩ','0–9 điểm; ≥2 (nam)/≥3 (nữ): cần OAC'],
  ['HAS-BLED','Thang điểm nguy cơ chảy máu khi dùng OAC','0–9 điểm; ≥3: nguy cơ cao'],
  ['DAPT','Dual Antiplatelet Therapy / Kháng kết tập tiểu cầu kép','Aspirin + P2Y12 inhibitor'],
  ['OAC','Oral Anticoagulant / Thuốc kháng đông đường uống','VKA (warfarin) hoặc NOAC'],
  ['VKA','Vitamin K Antagonist / Kháng vitamin K','Warfarin, acenocoumarol'],
  ['NOAC','Non-vitamin K Oral Anticoagulant / Thuốc kháng đông không kháng VitK','Apixaban, Rivaroxaban, Dabigatran, Edoxaban'],
  ['LMWH','Low Molecular Weight Heparin / Heparin phân tử thấp','Enoxaparin, Tinzaparin'],
  ['UFH','Unfractionated Heparin / Heparin không phân đoạn','—'],
  ['HIT','Heparin-Induced Thrombocytopenia / Giảm tiểu cầu do heparin','Type I (không miễn dịch) / Type II (miễn dịch)'],
  ['TTR','Time in Therapeutic Range / Thời gian trong ngưỡng điều trị INR','% (mục tiêu ≥70%)'],
  // ── NỘI TIẾT & CHUYỂN HÓA ────────────────────────────────
  ['DKA','Diabetic Ketoacidosis / Nhiễm toan ceton đái tháo đường','—'],
  ['HHS','Hyperosmolar Hyperglycemic State / Tình trạng tăng áp thẩm thấu ĐTĐ','—'],
  ['Osm','Osmolality / Áp lực thẩm thấu','mOsm/kg (BT: 285–295)'],
  ['BMR','Basal Metabolic Rate / Tốc độ chuyển hóa cơ sở (Harris-Benedict)','kcal/ngày'],
  ['REE','Resting Energy Expenditure / Tiêu hao năng lượng lúc nghỉ','kcal/ngày'],
  ['TEE','Total Energy Expenditure / Tổng tiêu hao năng lượng','kcal/ngày'],
  // ── DINH DƯỠNG LÂM SÀNG ─────────────────────────────────
  ['TPN','Total Parenteral Nutrition / Dinh dưỡng hoàn toàn qua đường tĩnh mạch','kcal/ngày'],
  ['PPN','Peripheral Parenteral Nutrition / Dinh dưỡng tĩnh mạch ngoại vi','—'],
  ['EN','Enteral Nutrition / Dinh dưỡng qua đường tiêu hóa','—'],
  ['NGT','Nasogastric Tube / Ống thông mũi dạ dày','—'],
  ['PEG','Percutaneous Endoscopic Gastrostomy / Dẫn lưu dạ dày qua da','—'],
  // ── THẦN KINH & AN THẦN ──────────────────────────────────
  ['GABA','Gamma-Aminobutyric Acid / Acid gamma-aminobutyric','Chất dẫn truyền thần kinh ức chế'],
  ['BZD','Benzodiazepine / Nhóm thuốc benzodiazepine','Diazepam, Lorazepam, Midazolam…'],
  ['GAPP','Guideline for Appropriate Antibiotic use Pharmacist Protocol','Nomogram khởi đầu Vancomycin'],
  ['ODS','Osmotic Demyelination Syndrome / Hội chứng thuyên tắc myelin thẩm thấu','Biến chứng khi bù Na⁺ quá nhanh (>10 mEq/24h)'],
  ['LAST','Local Anesthetic Systemic Toxicity / Độc tính toàn thân thuốc tê cục bộ','Xử trí: Intralipid 20%'],
  // ── THANG ĐIỂM LÂM SÀNG ──────────────────────────────────
  ['SOFA','Sequential Organ Failure Assessment','0–24 điểm; ≥2 thay đổi: sepsis'],
  ['APACHE II','Acute Physiology and Chronic Health Evaluation II','0–71 điểm; >25: tỷ lệ tử vong cao'],
  ['CURB-65','Thang điểm mức độ nặng viêm phổi cộng đồng','0–5 điểm; ≥3: nhập ICU'],
  ['qSOFA','Quick SOFA — sàng lọc sepsis ngoài ICU','0–3 điểm; ≥2: nguy cơ cao'],
  // ── OPIOID & ĐAU ─────────────────────────────────────────
  ['MEDD','Morphine Equivalent Daily Dose / Liều tương đương morphine mỗi ngày (CDC 2022)','mg morphine PO/ngày'],
  ['MME','Morphine Milligram Equivalent / Tương đương morphine tính bằng mg','mg (= MEDD)'],
  ['NRS','Numerical Rating Scale / Thang điểm đau số học','0–10'],
  ['VAS','Visual Analogue Scale / Thang điểm đau nhìn','0–100 mm'],
  ['PCA','Patient-Controlled Analgesia / Giảm đau do bệnh nhân kiểm soát','—'],
  ['µ-receptor','Mu-opioid receptor / Thụ thể mu-opioid','Đích tác dụng của opioid full agonist'],
  // ── ĐƯỜNG THẬN VÀ LIÊN QUAN ──────────────────────────────
  ['GFR','Glomerular Filtration Rate / Mức lọc cầu thận','mL/phút/1.73m²'],
  ['KDIGO','Kidney Disease: Improving Global Outcomes','Tổ chức ban hành hướng dẫn bệnh thận'],
  ['RRT','Renal Replacement Therapy / Liệu pháp thay thế thận (hoặc Rapid Response Team)','Theo ngữ cảnh'],
  // ── DƯỢC LÂM SÀNG & CHUYÊN MÔN ──────────────────────────
  ['DRP','Drug-Related Problem / Vấn đề liên quan thuốc','Phân loại PCNE V9.1'],
  ['ADR','Adverse Drug Reaction / Phản ứng có hại của thuốc','—'],
  ['ADE','Adverse Drug Event / Sự kiện có hại liên quan thuốc','—'],
  ['PI','Pharmacist Intervention / Can thiệp dược sĩ','—'],
  ['CMR','Comprehensive Medication Review / Rà soát toàn diện thuốc','—'],
  ['MTM','Medication Therapy Management / Quản lý liệu pháp thuốc','—'],
  ['PCNE','Pharmaceutical Care Network Europe','Phân loại DRP theo PCNE V9.1'],
  ['SOAP','Subjective, Objective, Assessment, Plan','Phương pháp ghi chép bệnh án SOAP'],
  ['EBM','Evidence-Based Medicine / Y học chứng cứ','—'],
  ['RCT','Randomized Controlled Trial / Thử nghiệm ngẫu nhiên có đối chứng','—'],
  ['NNT','Number Needed to Treat / Số bệnh nhân cần điều trị','—'],
  ['NNH','Number Needed to Harm / Số bệnh nhân cần để gây hại','—'],
  ['CI','Confidence Interval / Khoảng tin cậy','—'],
  ['RR','Relative Risk / Nguy cơ tương đối (hoặc Respiratory Rate)','Theo ngữ cảnh'],
  ['OR','Odds Ratio / Tỷ số odds','—'],
  ['GRADE','Grading of Recommendations Assessment, Development and Evaluation','Đánh giá bằng chứng y học'],
  ['ASHP','American Society of Health-System Pharmacists','Hiệp hội Dược sĩ Bệnh viện Mỹ'],
  ['IDSA','Infectious Diseases Society of America','Hiệp hội Bệnh truyền nhiễm Mỹ'],
  ['ESPEN','European Society for Parenteral and Enteral Nutrition','Hiệp hội Dinh dưỡng châu Âu'],
  ['ASPEN','American Society for Parenteral and Enteral Nutrition','Hiệp hội Dinh dưỡng Mỹ'],
  ['MOH','Ministry of Health / Bộ Y tế Việt Nam','QĐ-BYT / Thông tư'],
  ['DTQGVN','Dược thư Quốc gia Việt Nam','Phiên bản 2023'],
  ['JCI','Joint Commission International','Tiêu chuẩn kiểm định bệnh viện quốc tế (Lần 8)'],
  ['WHO','World Health Organization / Tổ chức Y tế Thế giới','—'],
  // ── SƠ SINH & NHI KHOA (Nelson PAT 2026) ─────────────────
  ['GA','Gestational Age / Tuổi thai','Tuần thai khi sinh'],
  ['PMA','Postmenstrual Age / Tuổi hiệu chỉnh sau kinh chót','GA + PNA (tuần)'],
  ['PNA','Postnatal Age / Tuổi sau sinh','Ngày/tuần tính từ lúc sinh'],
  ['CGA','Corrected Gestational Age / Tuổi thai hiệu chỉnh','Dùng khi đánh giá phát triển trẻ sinh non'],
  ['ELBW','Extremely Low Birth Weight / Cực nhẹ cân lúc sinh','<1000 g'],
  ['VLBW','Very Low Birth Weight / Rất nhẹ cân lúc sinh','<1500 g'],
  ['LBW (sơ sinh)','Low Birth Weight / Nhẹ cân lúc sinh','<2500 g'],
  ['SGA','Small for Gestational Age / Nhỏ so với tuổi thai','Cân nặng <bách phân vị thứ 10'],
  ['AGA','Appropriate for Gestational Age / Phù hợp tuổi thai','Bách phân vị 10–90'],
  ['LGA','Large for Gestational Age / Lớn so với tuổi thai','Cân nặng >bách phân vị thứ 90'],
  ['APGAR','Appearance, Pulse, Grimace, Activity, Respiration','0–10 điểm tại phút 1 và 5 sau sinh'],
  ['RDS','Respiratory Distress Syndrome / Hội chứng suy hô hấp sơ sinh','Do thiếu surfactant'],
  ['BPD','Bronchopulmonary Dysplasia / Loạn sản phế quản phổi','Thường ở trẻ sinh rất non'],
  ['PDA','Patent Ductus Arteriosus / Còn ống động mạch','—'],
  ['NEC','Necrotizing Enterocolitis / Viêm ruột hoại tử sơ sinh','Bell stage I–III'],
  ['IVH','Intraventricular Hemorrhage / Xuất huyết não thất','Độ I–IV (Papile)'],
  ['ROP','Retinopathy of Prematurity / Bệnh võng mạc trẻ sinh non','Sàng lọc ở trẻ non tháng/nhẹ cân'],
  ['PPHN','Persistent Pulmonary Hypertension of the Newborn / Tăng áp phổi dai dẳng sơ sinh','—'],
  ['TTN','Transient Tachypnea of the Newborn / Thở nhanh thoáng qua sơ sinh','—'],
  ['MAS','Meconium Aspiration Syndrome / Hội chứng hít phân su','—'],
  ['EOS','Early-Onset Sepsis / Nhiễm khuẩn huyết sơ sinh khởi phát sớm','<72h tuổi'],
  ['LOS','Late-Onset Sepsis / Nhiễm khuẩn huyết sơ sinh khởi phát muộn','≥72h tuổi'],
  ['GBS','Group B Streptococcus / Liên cầu nhóm B','Tác nhân EOS thường gặp'],
  ['KMC','Kangaroo Mother Care / Chăm sóc kiểu Kangaroo','Da kề da mẹ–con'],
  ['NICU','Neonatal Intensive Care Unit / Đơn vị hồi sức sơ sinh','—'],
  ['PICU','Pediatric Intensive Care Unit / Đơn vị hồi sức nhi','—'],
  // ── ENZYM CHUYỂN HÓA & VẬN CHUYỂN THUỐC (Tương tác thuốc) ─
  ['CYP450','Cytochrome P450 / Hệ enzym chuyển hóa thuốc ở gan','Pha I chuyển hóa thuốc'],
  ['CYP3A4','Cytochrome P450 3A4','Enzym chuyển hóa ~50% thuốc trên thị trường'],
  ['CYP2D6','Cytochrome P450 2D6','Chuyển hóa nhiều thuốc tâm thần, opioid'],
  ['CYP2C9','Cytochrome P450 2C9','Chuyển hóa warfarin, NSAID, phenytoin'],
  ['CYP2C19','Cytochrome P450 2C19','Chuyển hóa clopidogrel, PPI, voriconazol'],
  ['CYP1A2','Cytochrome P450 1A2','Chuyển hóa theophylin, clozapin, caffein'],
  ['P-gp','P-glycoprotein / Glycoprotein-P','Bơm vận chuyển thuốc qua màng tế bào'],
  ['OATP1B1','Organic Anion Transporting Polypeptide 1B1','Vận chuyển statin, thuốc vào gan'],
  ['BCRP','Breast Cancer Resistance Protein','Bơm vận chuyển thuốc kháng đa thuốc'],
  ['UGT','UDP-Glucuronosyltransferase','Enzym pha II — glucuronid hóa'],
  // ── ĐÁI THÁO ĐƯỜNG & INSULIN mở rộng ─────────────────────
  ['DM','Diabetes Mellitus / Đái tháo đường','—'],
  ['T1DM','Type 1 Diabetes Mellitus / Đái tháo đường típ 1','—'],
  ['T2DM','Type 2 Diabetes Mellitus / Đái tháo đường típ 2','—'],
  ['FPG','Fasting Plasma Glucose / Glucose huyết tương lúc đói','mg/dL (BT: 70–100)'],
  ['PPG','Postprandial Glucose / Glucose sau ăn','mg/dL (mục tiêu <180 sau 2h)'],
  ['CSII','Continuous Subcutaneous Insulin Infusion / Bơm insulin dưới da liên tục','—'],
  ['MDI','Multiple Daily Injections / Tiêm insulin nhiều lần trong ngày','—'],
  ['SSI','Sliding Scale Insulin / Insulin theo thang trượt','Điều chỉnh theo đường huyết mao mạch'],
  ['TDI','Total Daily Insulin dose / Tổng liều insulin mỗi ngày','Đơn vị/kg/ngày'],
  ['NPH','Neutral Protamine Hagedorn — Insulin tác dụng trung bình','Đục, tác dụng 12–18h'],
  // ── VI SINH & KHÁNG SINH ĐỒ ───────────────────────────────
  ['S (KSĐ)','Susceptible / Nhạy cảm (kết quả kháng sinh đồ)','Theo CLSI/EUCAST breakpoint'],
  ['I (KSĐ)','Intermediate / Trung gian (kết quả kháng sinh đồ)','Theo CLSI/EUCAST breakpoint'],
  ['R (KSĐ)','Resistant / Đề kháng (kết quả kháng sinh đồ)','Theo CLSI/EUCAST breakpoint'],
  ['CLSI','Clinical and Laboratory Standards Institute','Chuẩn breakpoint kháng sinh đồ (Mỹ)'],
  ['EUCAST','European Committee on Antimicrobial Susceptibility Testing','Chuẩn breakpoint kháng sinh đồ (châu Âu)'],
  ['KSĐ','Kháng sinh đồ / Antibiogram','—'],
  // ── DỊCH TRUYỀN & ĐIỆN GIẢI mở rộng ───────────────────────
  ['NS','Normal Saline / Nước muối sinh lý 0.9%','NaCl 0.9%'],
  ['½NS','Half Normal Saline / Nước muối 0.45%','NaCl 0.45%'],
  ['LR','Lactated Ringer / Ringer Lactat','—'],
  ['D5W','Dextrose 5% in Water / Glucose 5%','—'],
  ['D10W','Dextrose 10% in Water / Glucose 10%','—'],
  ['ORS','Oral Rehydration Solution / Dung dịch bù nước điện giải đường uống','—'],
  // ── TỪ VIẾT TẮT LÂM SÀNG TIẾNG VIỆT THÔNG DỤNG ────────────
  ['BN','Bệnh nhân','—'],
  ['NB','Người bệnh','—'],
  ['CĐ','Chỉ định','—'],
  ['CCĐ','Chống chỉ định','—'],
  ['TDKMM','Tác dụng không mong muốn','—'],
  ['XN','Xét nghiệm','—'],
  ['THA','Tăng huyết áp','—'],
  ['ĐTĐ','Đái tháo đường','—'],
  ['SHH','Suy hô hấp','—'],
  ['NTH','Nhiễm trùng huyết / Nhiễm khuẩn huyết','—'],
  ['RLĐM','Rối loạn đông máu','—'],
  ['TALNS','Tăng áp lực nội sọ','—'],
  ['DTQG','Dược thư Quốc gia','—'],
  ['QĐ-BYT','Quyết định — Bộ Y tế','Văn bản pháp lý ngành y tế']
];

function buildAbbrTable() {
  var c=document.getElementById('abbr-container');
  if(!c) return;
  var rows=ABBRS.map(function(a){
    return '<div class="abbr-row" data-key="'+a[0].toLowerCase()+' '+a[1].toLowerCase()+' '+a[2].toLowerCase()+'">'
      +'<span class="abbr-key" style="font-weight:700;color:var(--PD)">'+a[0]+'</span>'
      +'<span class="abbr-vi">'+a[1]+'</span>'
      +'<span class="abbr-unit" style="color:var(--TM)">'+a[2]+'</span>'
      +'</div>';
  });
  c.innerHTML=c.querySelector('.abbr-head').outerHTML+rows.join('');
  var cnt=document.getElementById('abbr-count');
  if(cnt) cnt.textContent=ABBRS.length;
}
function filterAbbr() {
  var q=(document.getElementById('abbr-search').value||'').toLowerCase().trim();
  var rows=document.querySelectorAll('#abbr-container .abbr-row');
  var shown=0;
  rows.forEach(function(r){
    var match=!q||(r.dataset.key||'').includes(q);
    r.style.display=match?'':'none';
    if(match) shown++;
  });
  var cnt=document.getElementById('abbr-count');
  if(cnt) cnt.textContent=q?shown:ABBRS.length;
}

// ============================================================
// AI ASSISTANT
// ============================================================
async function sendAI() {
  var inp=document.getElementById('ai-inp');
  var area=document.getElementById('ai-area');
  if(!inp||!area) return;
  var msg=inp.value.trim();
  if(!msg) return;

  // Add user message
  var userDiv=document.createElement('div');
  userDiv.className='cm cm-u';
  userDiv.textContent=msg;
  area.appendChild(userDiv);
  inp.value='';

  // Add typing indicator
  var typingDiv=document.createElement('div');
  typingDiv.className='cm cm-a';
  typingDiv.id='ai-typing-'+Date.now();
  typingDiv.innerHTML='<div class="ai-lbl">⚕ TRỢ LÝ AI</div><div class="typing"><span></span><span></span><span></span></div>';
  area.appendChild(typingDiv);
  area.scrollTop=area.scrollHeight;

  try {
    var resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        system:'Bạn là Dược sĩ lâm sàng AI (PharmD) hỗ trợ chuyên môn dược lâm sàng. Trả lời ngắn gọn, chính xác bằng tiếng Việt. Dùng số liệu cụ thể. Nhắc nhở kết quả chỉ tham khảo.',
        messages:[{role:'user',content:msg}]
      })
    });
    var data=await resp.json();
    var reply=(data.content||[]).map(function(c){return c.text||'';}).join('')||'Xin lỗi, không thể kết nối AI lúc này.';
    typingDiv.innerHTML='<div class="ai-lbl">⚕ TRỢ LÝ DƯỢC LÂM SÀNG AI</div><div>'+reply.replace(/\n/g,'<br>')+'</div>';
  } catch(e) {
    typingDiv.innerHTML='<div class="ai-lbl">⚕ TRỢ LÝ AI</div><div>Không kết nối được với AI. Vui lòng thử lại sau.</div>';
  }
  area.scrollTop=area.scrollHeight;
}

// ============================================================
// EVENT BINDING — All in DOMContentLoaded, no null errors
// Auto-update drug count badge from DRUG_DB
document.addEventListener('DOMContentLoaded', function() {
  var badge = document.getElementById('drug-count-badge');
  if (badge && window.DRUG_DB) {
    badge.textContent = Object.keys(window.DRUG_DB).length;
  }
});
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  // Sidebar nav items
  document.querySelectorAll('.ni[data-pg]').forEach(function(el){
    el.addEventListener('click',function(){showPg(this.dataset.pg);});
  });

  // Overlay click
  var ovl=document.getElementById('OVL');
  if(ovl) ovl.addEventListener('click',closeSB);

  // Mobile menu button
  var mbb=document.getElementById('MB-btn');
  if(mbb) mbb.addEventListener('click',openSB);

  // Tab buttons — event delegation
  document.addEventListener('click',function(e){
    var btn=e.target.closest('.tab-btn');
    if(btn&&btn.dataset.target){
      switchTab(btn.dataset.tab||'',btn.dataset.target);
    }
  });

  // Keyboard
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){
      var b=document.querySelector('.pg.active .bp');
      if(b)b.click();
    }
    if(e.key==='Escape') closeSB();
  });

  // Prevent negative input
  document.addEventListener('input',function(e){
    if(e.target.tagName==='INPUT'&&e.target.type==='number'){
      var v=parseFloat(e.target.value);
      if(!isNaN(v)&&v<0) e.target.value='';
    }
  });

  // ---- RENAL ----
  var bRN=document.getElementById('btn-rn'); if(bRN)bRN.addEventListener('click',calcRenal);
  var cRN=document.getElementById('clr-rn'); if(cRN)cRN.addEventListener('click',function(){clearMod('rn');});

  // ---- AMINOGLYCOSIDE ----
  var bAG=document.getElementById('btn-ag'); if(bAG)bAG.addEventListener('click',calcAGtrad);
  var cAG=document.getElementById('clr-ag'); if(cAG)cAG.addEventListener('click',function(){clearMod('ag');});
  var bEI=document.getElementById('btn-ei'); if(bEI)bEI.addEventListener('click',calcAGeid);
  var cEI=document.getElementById('clr-ei'); if(cEI)cEI.addEventListener('click',function(){clearMod('ei');});

  // ---- LOCAL ANESTHETIC ----
  var bLA=document.getElementById('btn-la'); if(bLA)bLA.addEventListener('click',calcLA);
  var cLA=document.getElementById('clr-la'); if(cLA)cLA.addEventListener('click',function(){clearMod('la');});

  // ---- HEPARIN ----
  var bHP=document.getElementById('btn-hp'); if(bHP)bHP.addEventListener('click',calcHeparin);
  var cHP=document.getElementById('clr-hp'); if(cHP)cHP.addEventListener('click',function(){clearMod('hp');hideRes('hp');});
  var bLMWH=document.getElementById('btn-lmwh'); if(bLMWH)bLMWH.addEventListener('click',calcLMWH);
  var cLMWH=document.getElementById('clr-lmwh'); if(cLMWH)cLMWH.addEventListener('click',function(){clearMod('lmwh');document.getElementById('res-lmwh').style.display='none';});
  var bProt=document.getElementById('btn-prot'); if(bProt)bProt.addEventListener('click',calcProtamine);
  var cProt=document.getElementById('clr-prot'); if(cProt)cProt.addEventListener('click',function(){clearMod('prot');document.getElementById('res-prot').style.display='none';});

  // ---- INSULIN ----
  var bSL=document.getElementById('btn-sl'); if(bSL)bSL.addEventListener('click',calcSliding);
  var cSL=document.getElementById('clr-sl'); if(cSL)cSL.addEventListener('click',function(){clearMod('sl');document.getElementById('res-sl').style.display='none';});
  var bIV2=document.getElementById('btn-iv2'); if(bIV2)bIV2.addEventListener('click',calcIVInsulin);
  var cIV2=document.getElementById('clr-iv2'); if(cIV2)cIV2.addEventListener('click',function(){clearMod('iv');document.getElementById('res-iv2').style.display='none';});
  var bSC2=document.getElementById('btn-sc2'); if(bSC2)bSC2.addEventListener('click',calcIVtoSC);
  var cSC2=document.getElementById('clr-sc2'); if(cSC2)cSC2.addEventListener('click',function(){clearMod('sc');document.getElementById('res-sc2').style.display='none';});
  var bDKA=document.getElementById('btn-dka'); if(bDKA)bDKA.addEventListener('click',calcDKA);
  var cDKA=document.getElementById('clr-dka'); if(cDKA)cDKA.addEventListener('click',function(){clearMod('dka');document.getElementById('res-dka').style.display='none';});
  var bBB=document.getElementById('btn-bb'); if(bBB)bBB.addEventListener('click',calcBasalBolus);
  var cBB=document.getElementById('clr-bb'); if(cBB)cBB.addEventListener('click',function(){clearMod('bb');document.getElementById('res-bb').style.display='none';});
  var bGIK=document.getElementById('btn-gik'); if(bGIK)bGIK.addEventListener('click',calcGIK);
  var cGIK=document.getElementById('clr-gik'); if(cGIK)cGIK.addEventListener('click',function(){clearMod('gik');document.getElementById('res-gik').style.display='none';});
  var ivmA=document.getElementById('ivmode-adj'); if(ivmA)ivmA.addEventListener('click',function(){setIvMode('adj');});
  var ivmI=document.getElementById('ivmode-init'); if(ivmI)ivmI.addEventListener('click',function(){setIvMode('init');});
  var bIVI=document.getElementById('btn-ivinit'); if(bIVI)bIVI.addEventListener('click',calcIVInsulinInit);
  var cIVI=document.getElementById('clr-ivinit'); if(cIVI)cIVI.addEventListener('click',function(){clearMod('ivinit');document.getElementById('res-ivinit').style.display='none';});

  // ---- CONVERTERS ----
  var bOP=document.getElementById('btn-op'); if(bOP)bOP.addEventListener('click',calcOpioid);
  var cOP=document.getElementById('clr-op'); if(cOP)cOP.addEventListener('click',function(){clearMod('op');});
  var bCS=document.getElementById('btn-cs'); if(bCS)bCS.addEventListener('click',calcCS);
  var cCS=document.getElementById('clr-cs'); if(cCS)cCS.addEventListener('click',function(){clearMod('cs');});
  var bBZ=null; // BZD v2 — listener được wire trong IIFE bzInit()
  var cBZ=null;

  // ---- SCORES ----
  var bSF=document.getElementById('btn-sf'); if(bSF)bSF.addEventListener('click',calcSOFA);
  var cSF=document.getElementById('clr-sf'); if(cSF)cSF.addEventListener('click',function(){clearMod('sf');});
  var bAP=document.getElementById('btn-ap'); if(bAP)bAP.addEventListener('click',calcAPACHE);
  var cAP=document.getElementById('clr-ap'); if(cAP)cAP.addEventListener('click',function(){clearMod('ap');});
  var bGC=document.getElementById('btn-gc'); if(bGC)bGC.addEventListener('click',calcGCS);
  var cGC=document.getElementById('clr-gc'); if(cGC)cGC.addEventListener('click',function(){clearMod('gc');});
  var bCHA=document.getElementById('btn-cha'); if(bCHA)bCHA.addEventListener('click',calcCHA);
  var cCHA=document.getElementById('clr-cha'); if(cCHA)cCHA.addEventListener('click',function(){clearMod('cha');});
  var bCB=document.getElementById('btn-cb'); if(bCB)bCB.addEventListener('click',calcCURB);
  var cCB=document.getElementById('clr-cb'); if(cCB)cCB.addEventListener('click',function(){clearMod('cb');});
  var bN2=document.getElementById('btn-n2'); if(bN2)bN2.addEventListener('click',calcNEWS2);
  var cN2=document.getElementById('clr-n2'); if(cN2)cN2.addEventListener('click',function(){clearMod('n2');});
  var bDP=document.getElementById('btn-dp'); if(bDP)bDP.addEventListener('click',calcDAPT);
  var cDP=document.getElementById('clr-dp'); if(cDP)cDP.addEventListener('click',function(){clearMod('dp');});
  var bHB=document.getElementById('btn-hb'); if(bHB)bHB.addEventListener('click',calcHASBLED);
  var cHB=document.getElementById('clr-hb'); if(cHB)cHB.addEventListener('click',function(){clearMod('hb');});

  // ---- NUTRITION + PHENYTOIN + WARFARIN ----
  var bNT=document.getElementById('btn-nt'); if(bNT)bNT.addEventListener('click',calcNutrition);
  var cNT=document.getElementById('clr-nt'); if(cNT)cNT.addEventListener('click',function(){clearMod('nt');});
  var bPC=document.getElementById('btn-pc'); if(bPC)bPC.addEventListener('click',calcPhenCorr);
  var cPC=document.getElementById('clr-pc'); if(cPC)cPC.addEventListener('click',function(){clearMod('pc');});
  var bPL=document.getElementById('btn-pl'); if(bPL)bPL.addEventListener('click',calcPhenLoad);
  var cPL=document.getElementById('clr-pl'); if(cPL)cPL.addEventListener('click',function(){clearMod('pl');document.getElementById('res-pl').style.display='none';});
  var bWF=document.getElementById('btn-wf'); if(bWF)bWF.addEventListener('click',calcWarfarin);
  var cWF=document.getElementById('clr-wf'); if(cWF)cWF.addEventListener('click',function(){clearMod('wf');});

  // ---- IV FLUID ----
  var bIR=document.getElementById('btn-ir'); if(bIR)bIR.addEventListener('click',calcIVRate);
  var cIR=document.getElementById('clr-ir'); if(cIR)cIR.addEventListener('click',function(){clearMod('ir');});
  var bIVV=document.getElementById('btn-ivv'); if(bIVV)bIVV.addEventListener('click',calcIVVol);
  var cIVV=document.getElementById('clr-ivv'); if(cIVV)cIVV.addEventListener('click',function(){clearMod('ivv');});
  var bIT=document.getElementById('btn-it'); if(bIT)bIT.addEventListener('click',calcIVTime);
  var cIT=document.getElementById('clr-it'); if(cIT)cIT.addEventListener('click',function(){clearMod('it');});
  var bID=document.getElementById('btn-id'); if(bID)bID.addEventListener('click',calcIVDrops);
  var cID=document.getElementById('clr-id'); if(cID)cID.addEventListener('click',function(){clearMod('id');});

  // ---- ELECTROLYTE ----
  var bNA=document.getElementById('btn-na'); if(bNA)bNA.addEventListener('click',calcSodium);
  var cNA=document.getElementById('clr-na'); if(cNA)cNA.addEventListener('click',function(){clearMod('na');});
  var bKP=document.getElementById('btn-kp'); if(bKP)bKP.addEventListener('click',calcPotassium);
  var cKP=document.getElementById('clr-kp'); if(cKP)cKP.addEventListener('click',function(){clearMod('kp');});
  var bKR=document.getElementById('btn-kr'); if(bKR)bKR.addEventListener('click',calcKRate);
  var cKR=document.getElementById('clr-kr'); if(cKR)cKR.addEventListener('click',function(){clearMod('kr');});
  var bHC=document.getElementById('btn-hc'); if(bHC)bHC.addEventListener('click',calcBicarb);
  var cHC=document.getElementById('clr-hc'); if(cHC)cHC.addEventListener('click',function(){clearMod('hc');});


// ============================================================
// AUTOCOMPLETE ENGINE — DrugInfo & Interaction
// ============================================================
(function(){
'use strict';

// ── Chuẩn hoá tiếng Việt (bỏ dấu, lower)
function acNorm(s){
  if(!s) return '';
  return s.normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/\u0111/g,'d').replace(/\u0110/g,'D')
    .replace(/đ/g,'d').replace(/Đ/g,'D')
    .toLowerCase().trim();
}

// ── Highlight ký tự match — hỗ trợ cả có dấu lẫn không dấu
function acHL(text, q){
  if(!q || !text) return text;
  var nText = acNorm(text), nQ = acNorm(q.trim());
  if(!nQ) return text;
  // Tìm vị trí match trong chuỗi normalized
  var idx = nText.indexOf(nQ);
  if(idx === -1) return text;
  // Map ngược về chuỗi gốc (normalized string có thể ngắn hơn do NFD)
  // Dùng approach đơn giản: tìm span có độ dài bằng q.length trong original
  var len = nQ.length;
  return text.slice(0, idx)
    + '<span class="ac-hl">' + text.slice(idx, idx + len) + '</span>'
    + text.slice(idx + len);
}

// ── Generic autocomplete controller
function AcCtrl(inputId, ddId, getSuggestions, onSelect){
  var inp = document.getElementById(inputId);
  var dd  = document.getElementById(ddId);
  if(!inp || !dd) return;

  var focusIdx = -1;
  var items = [];
  var debounce;

  function renderDd(sugs){
    items = sugs;
    focusIdx = -1;
    if(!sugs.length){
      dd.innerHTML = '<div class="ac-empty">Không tìm thấy thuốc phù hợp</div>';
      dd.classList.add('open');
      return;
    }
    dd.innerHTML = sugs.map(function(s, i){
      return '<div class="ac-item" data-idx="'+i+'" role="option" title="'+s.value+'">'
        + '<span class="ac-tag '+s.tagCls+'">'+s.tag+'</span>'
        + '<span class="ac-item-text">'+acHL(s.label, inp.value)+'</span>'
        + '</div>';
    }).join('');
    dd.classList.add('open');
    // Click
    dd.querySelectorAll('.ac-item').forEach(function(el){
      el.addEventListener('mousedown', function(e){
        e.preventDefault();
        var idx = +el.getAttribute('data-idx');
        pick(idx);
      });
    });
  }

  function closeDd(){ dd.classList.remove('open'); dd.innerHTML=''; focusIdx=-1; }

  function setFocus(i){
    var els = dd.querySelectorAll('.ac-item');
    if(!els.length) return;
    if(focusIdx >= 0 && els[focusIdx]) els[focusIdx].classList.remove('focused');
    focusIdx = (i + els.length) % els.length;
    els[focusIdx].classList.add('focused');
    els[focusIdx].scrollIntoView({block:'nearest'});
  }

  function pick(i){
    if(i < 0 || i >= items.length) return;
    var val = items[i].value;
    inp.value = val;
    closeDd();
    onSelect(val);
  }

  inp.addEventListener('input', function(){
    var q = inp.value.trim();
    clearTimeout(debounce);
    if(!q){ closeDd(); return; }
    debounce = setTimeout(function(){
      var sugs = getSuggestions(q);
      if(sugs.length) renderDd(sugs);
      else closeDd();
    }, 80);
  });

  inp.addEventListener('keydown', function(e){
    if(!dd.classList.contains('open')) return;
    if(e.key==='ArrowDown'){ e.preventDefault(); setFocus(focusIdx+1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); setFocus(focusIdx <= 0 ? items.length-1 : focusIdx-1); }
    else if(e.key==='Enter'){
      e.preventDefault();
      if(focusIdx >= 0) pick(focusIdx);
      else { closeDd(); onSelect(inp.value); }
    }
    else if(e.key==='Escape'){ closeDd(); }
  });

  inp.addEventListener('blur', function(){ setTimeout(closeDd, 180); });

  // Đóng khi click ngoài
  document.addEventListener('click', function(e){
    if(!inp.contains(e.target) && !dd.contains(e.target)) closeDd();
  });
}

// ── Danh sách gợi ý DRUG_DB (thông tin thuốc)
function getDiSugs(q){
  var nq = acNorm(q);
  if(!nq || !window.DRUG_DB) return [];
  var res = [];
  Object.entries(window.DRUG_DB).forEach(function(e){
    var key = e[0], d = e[1];
    var nKey = acNorm(key), nName = acNorm(d.name), nCls = acNorm(d.cls||''), nInd = acNorm(d.ind||'');
    // Ưu tiên: tên bắt đầu bằng q > key bắt đầu > tên chứa q > class/chỉ định chứa q
    var score = nName.startsWith(nq)?0 : nKey.startsWith(nq)?1 : nName.includes(nq)||nKey.includes(nq)?2 : nCls.includes(nq)||nInd.includes(nq)?3 : -1;
    if(score >= 0){
      // Label hiển thị: tên thuốc + nhóm thuốc
      var label = d.name + ' — ' + (d.cls||'Thuốc');
      res.push({ label: label, value: d.name, tag:'Thuốc', tagCls:'ac-tag-di', score: score });
    }
  });
  return res.sort(function(a,b){return a.score-b.score||a.label.localeCompare(b.label,'vi');}).slice(0,15);
}

// ── Danh sách gợi ý INT_DB (tương tác thuốc)
var INT_NAMES = null;
function getIntNames(){
  if(INT_NAMES) return INT_NAMES;
  if(!window.INT_DB) return [];
  var set = {};
  window.INT_DB.forEach(function(r){
    // Tách tên thuốc phức hợp (dấu phẩy, dấu *, dấu +)
    [r.d1, r.d2].forEach(function(raw){
      // Thêm tên đầy đủ
      set[raw.trim()] = true;
      // Tách các tên con nếu có dấu phẩy trong ngoặc
      var parts = raw.split(/[,*+\/](?![^(]*\))/);
      parts.forEach(function(p){
        var t = p.trim();
        if(t.length > 2) set[t] = true;
      });
    });
  });
  INT_NAMES = Object.keys(set).sort(function(a,b){return a.localeCompare(b,'vi');});
  return INT_NAMES;
}

// Cache: đếm số tương tác mỗi thuốc
var INT_COUNT = null;
function getIntCount(){
  if(INT_COUNT) return INT_COUNT;
  if(!window.INT_DB) return {};
  INT_COUNT = {};
  window.INT_DB.forEach(function(r){
    [r.d1, r.d2].forEach(function(n){
      var t = n.trim();
      INT_COUNT[t] = (INT_COUNT[t]||0) + 1;
    });
  });
  return INT_COUNT;
}

function getIntSugs(q){
  var nq = acNorm(q);
  if(!nq) return [];
  var names = getIntNames();
  var counts = getIntCount();
  var res = [];
  names.forEach(function(name){
    var nn = acNorm(name);
    if(nn.includes(nq)){
      var cnt = counts[name] || 0;
      // Label: tên thuốc + số tương tác
      var label = name + (cnt > 0 ? ' — ' + cnt + ' tương tác' : '');
      res.push({ label:label, value:name, tag:'Tương tác', tagCls:'ac-tag-int',
        score: nn.startsWith(nq)?0:nn.indexOf(nq)===0?0:1 });
    }
  });
  // Sắp xếp: starts-with trước, rồi theo số tương tác giảm dần, rồi alphabetical
  return res.sort(function(a,b){
    if(a.score !== b.score) return a.score - b.score;
    var ca = counts[a.value]||0, cb = counts[b.value]||0;
    if(cb !== ca) return cb - ca;
    return a.value.localeCompare(b.value,'vi');
  }).slice(0,15);
}

// ── Khởi động autocomplete (gọi trực tiếp — đã nằm trong DOMContentLoaded ngoài)
(function initAC(){
  // -- DrugInfo search --
  AcCtrl('di-search','di-dd', getDiSugs, function(val){
    var inp = document.getElementById('di-search');
    if(inp){ inp.value = val; }
    setTimeout(function(){ if(typeof searchDrug === 'function') searchDrug(); }, 0);
  });

  // -- Interaction: d1, d2, single --
  ['int-d1','int-d2','int-single'].forEach(function(id){
    AcCtrl(id, id+'-dd', getIntSugs, function(val){
      var inp = document.getElementById(id);
      if(inp) inp.value = val;
      if(id === 'int-single' && typeof checkInteraction === 'function') checkInteraction();
    });
  });
})();

window.AcCtrl = AcCtrl;
window.getIntSugs = getIntSugs;
})(); // end IIFE AUTOCOMPLETE

  // ---- DRUG INFO ----
  var bDI=document.getElementById('btn-di');
  var diSearch=document.getElementById('di-search');
  if(bDI) bDI.addEventListener('click',searchDrug);
  if(diSearch){
    diSearch.addEventListener('keypress',function(e){if(e.key==='Enter')searchDrug();});
    searchDrug();
  }

  // ---- INTERACTION ----
  var iSingle=document.getElementById('int-single');
  if(iSingle) iSingle.addEventListener('keypress',function(e){if(e.key==='Enter')checkInteraction();});

  // ---- INTERACTION: multi-drug (mtt) ----
  if(document.getElementById('mtt-list')){
    mttCreateRow(); mttCreateRow();
    var bMttAdd=document.getElementById('mtt-btn-add');
    var bMttCheck=document.getElementById('mtt-btn-check');
    if(bMttAdd) bMttAdd.addEventListener('click',mttCreateRow);
    if(bMttCheck) bMttCheck.addEventListener('click',mttRunSearch);
  }

  // ---- AI ----
  var bAI=document.getElementById('btn-ai');
  var aiInp=document.getElementById('ai-inp');
  if(bAI) bAI.addEventListener('click',sendAI);
  if(aiInp) aiInp.addEventListener('keypress',function(e){if(e.key==='Enter')sendAI();});

  // Build abbreviation table
  buildAbbrTable();

  console.log('%c⚕ Hệ thống Hỗ trợ Dược lâm sàng v1.2026 — Loaded','background:#005B8E;color:#fff;padding:4px 10px;border-radius:4px;font-weight:bold');
});

// ====== MODULE: PHA & BẢO QUẢN THUỐC TIÊM (IIFE) ======
(function(){
'use strict';
const DRUGS=[{"id":1,"tradeName":"4.2% W/V SODIUM BICARBONATE","activeIngredient":"Natri hydrocarbonat (natri bicarbonat)","strength":"10,5g/250ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền (1) Natri bicarbonat có thể được tĩnh mạch trực tiếp trong trường hợp cấp cứu (ngừng tuần hoàn) (2)","storage":"Bảo quản nơi khô, < 30°C. Hủy thuốc dư không sử dụng ngay (1)","incompatibilities":"Không dùng đồng thời với các dung dịch có chứa canxi, magie, phosphat do khả năng kết tủa (1)","manufacturer":"B.Braun Melsungen AG","notes":"Chỉ dùng khi dung dịch trong suốt và không màu.","cold":false,"light":false},{"id":2,"tradeName":"A.T ACYCLOVIR","activeIngredient":"Aciclovir","strength":"250mg","dosageForm":"Bột đông khô pha tiêm + 10ml (nước cất pha tiêm, NaCl 0,9%) → dung dịch tiêm.","routes":["TTM"],"reconstitution":"TTM: - Đối với trẻ em: Pha loãng dung dịch hoàn nguyên với NaCl 0,9% tỷ lệ 1:5 - Đối với người lớn: + Với liều ≤ 500mg pha loãng đến 100ml với dung dịch NaCl 0,9% + Với liều từ 500mg-1000mg pha loãng đến 200ml với dung dịch NaCl 0,9% (thời gian truyền trên 60 phút) (1) PHÒNG PHA TIÊM: Bột pha tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha không nên bảo quản trong tủ lạnh. Dung dịch sau khi pha loãng ổn định trong vòng 12h ở nhiệt độ phòng 15–25°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Công ty Cổ phần Dược phẩm An Thiên","notes":"Nếu xuất hiện kết tủa hoặc bất thường trong quá trình pha loãng phải loại bỏ thuốc ngay (1,2)","cold":true,"light":false},{"id":3,"tradeName":"A.T FUROSEMIDE","activeIngredient":"Furosemid","strength":"20mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm. Tốc độ tiêm không quá 4 mg/phút (1). TTM: Pha loãng trong ≥20ml NaCl 0,9%. Tốc độ truyền không quá 4 mg/phút (1).","storage":"Dung dịch pha xong phải dùng trong vòng 24h (2)","incompatibilities":"Không được pha với dung dịch Glucose hoặc dùng riêng với dung dịch acid (1,2)","manufacturer":"CT CP Dược phẩm An Thiên - VN","notes":"","cold":false,"light":false},{"id":4,"tradeName":"A.T HYDROCORTISONE","activeIngredient":"Hydrocortison","strength":"100mg","dosageForm":"Bột đông khô pha tiêm+ 2ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM","TM","TB"],"reconstitution":"TB, TM: Dung dịch hoàn nguyên, tiêm chậm ít nhất 30 giây (1) TTM: Dung dịch hoàn nguyên + 100- 1000 ml (NaCl 0,9%, Glucose 5%) truyền từ 20-30 phút (1,5)","storage":"Dung dịch tiêm sau khi pha loãng bảo quản trong vòng 24h ở nhiệt độ ở nhiệt độ 2–8°C (5)","incompatibilities":"","manufacturer":"Cty CP Dược phẩm An Thiên - VN","notes":"","cold":true,"light":false},{"id":5,"tradeName":"A.T NICARDIPINE 10MG/10 ML","activeIngredient":"Nicardipin hydroclorid","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm NL - Liều ban đầu: Truyền 3-5mg/giờ, không được quá 15mg/giờ -Liều duy trì: Truyền 2-4mg/giờ Cần pha loãng thuốc trong dung dịch tiêm truyền glucose 5% đến nồng độ 0,1 đến 0,2 mg/ml trước khi dùng, trừ khi được tiêm truyền qua tĩnh mạch trung tâm. (1,2)","storage":"Dung dịch thuốc sau khi mở nắp hoặc pha loãng ổn định ở nhiệt độ 25°C trong vòng 24h, tránh ánh sáng (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Công ty Cổ phần Dược phẩm An Thiên","notes":"Cần dùng bơm tiêm điện hoặc bơm tiêm tự động để kiểm soát tốc độ truyền. Nếu truyền TM ngoại biên, cần thay đổi vị trí tiêm truyền mỗi 12h để tránh kích ứng tĩnh mạch (4)","cold":false,"light":true},{"id":6,"tradeName":"ACISTE 2MIU","activeIngredient":"Colistimethat natri","strength":"2MUI","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 3ml dung dịch NaCl 0,9% (1,2) TM: Bột tiêm + 10ml NaCl 0,9% (tiêm chậm 5 phút) (5) TTM: Liều qui định pha trong 100ml dung dịch NaCl 0,9% (truyền trong 60 phút) (5) PHÒNG PHA TIÊM: Bột tiêm + 10ml NaCl 0.9%","storage":"Dung dịch tiêm được bảo quản ở nhiệt độ 2–8°C trong 24h (2,5)","incompatibilities":"","manufacturer":"CTCPDPTW I PHARBACO","notes":"","cold":false,"light":false},{"id":7,"tradeName":"ACTEMRA","activeIngredient":"Tocilizumab","strength":"20mg/ml Lọ 20ml","dosageForm":"Chất lỏng cô đặc pha dung dịch truyền","routes":["TTM"],"reconstitution":"TTM: Chất lỏng cô đặc + dung dịch NaCl 0,9% → vừa đủ 100ml dung dịch truyền tĩnh mạch. Truyền tĩnh mạch trong ít nhất 1h (1)","storage":"Bảo quản thuốc ở 2–8°C, tránh ánh sáng. Thuốc sau khi pha loãng bảo quản ở 2–8°C trong vòng 24h","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Chugai Pharma Manufacturing Co. - Thụy Sỹ","notes":"","cold":false,"light":true},{"id":8,"tradeName":"ACTILYSE","activeIngredient":"Alteplase","strength":"50mg","dosageForm":"Lọ bột đông khô + lọ dung môi 50ml→ dung dịch hoàn nguyên 1mg/1ml","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên 1mg/1ml (có thể pha loãng với NaCl 0,9% cho tới nồng độ tối thiểu 0,2 mg/ml) Tiêm tĩnh mạch chậm không được nhanh hơn 1ml/phút","storage":"Dung dịch tiêm sau khi pha loãng bảo quản trong vòng 24h ở nhiệt độ ở nhiệt độ 2–8°C.","incompatibilities":"Không được pha dung dịch hoàn nguyên với nước cất","manufacturer":"Boehringer Ingelheim","notes":"","cold":true,"light":false},{"id":9,"tradeName":"ACTRAPID 100IU/ML 10ML","activeIngredient":"Insulin tác dụng ngắn (S) (Insulin người)","strength":"100UI/ml","dosageForm":"Dung dịch tiêm","routes":["TM","TDD"],"reconstitution":"TDD, TM: Dung dịch tiêm (1)","storage":"Lọ thuốc chưa mở nắp: Bảo quản ở nhiệt độ 2–8°C. Lọ thuốc đã mở nắp: Bảo quản < 30°C trong hộp bao bì đóng gói, phải dùng trong 6 tuần (1)","incompatibilities":"Dùng riêng với các thuốc khác chứa thiol hay sulphite (1)","manufacturer":"NOVO NORDISK PRODUCTION SAS-PHÁP","notes":"Không sử dụng chế phẩm Insulin đã bị đông lạnh (1).THUỐC TRÁNH ÁNH SÁNG","cold":true,"light":true},{"id":10,"tradeName":"ACUPAN 20MG/2ML","activeIngredient":"Nefopam hydrochloride 20mg/2ml","strength":"20mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB sâu: Dung dịch tiêm TM: Pha 8ml NaCl 0,9% thành nồng độ 2mg/ml, tiêm TMC ít nhất 5 phút. TTM: 1 ống pha 100ml NaCl 0,9%/Glucose 5% truyền tối thiểu trong 15 phút","storage":"Dung dịch sau khi pha được sử dụng ngay khi mở nắp và pha loãng","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":11,"tradeName":"ACYCLOVIR","activeIngredient":"Aciclovir","strength":"250mg","dosageForm":"Bột pha tiêm + 10ml (nước cất tiêm, NaCl 0,9%) → dung dịch hoàn nguyên.","routes":["TTM"],"reconstitution":"TTM: - Đối với trẻ em: Pha loãng dung dịch hoàn nguyên với NaCl 0,9% tỷ lệ 1:5 - Đối với người lớn: + Với liều ≤ 500mg pha loãng đến 100ml với dung dịch NaCl 0,9% + Với liều từ 500mg-1000mg pha loãng đến 200ml với dung dịch NaCl 0,9% (thời gian truyền trên 60 phút) (1) PHÒNG PHA TIÊM: Bột pha tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha ổn định trong vòng 12h ở nhiệt độ phòng 15–25°C (1)","incompatibilities":"Dung dịch aciclovir tương kỵ với các chế phẩm máu v→ dung dịch chứa protein, foscarnet, meropenem, morphin sulphat, piperacillin - tazobactam. (2)","manufacturer":"JSC \"KIEVMEDPR EPARAT\" - UKRAINE","notes":"Nếu xuất hiện kết tủa hoặc bất thường trong quá trình pha loãng phải loại bỏ thuốc ngay (1)","cold":false,"light":false},{"id":12,"tradeName":"ADENORYTHM","activeIngredient":"Adenosin triphosphat","strength":"6mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Dung dịch tiêm. (1)","storage":"Thuốc phải được dùng ngay lập tức khi mở ống (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Vianex S.A- Plant A'","notes":"","cold":false,"light":false},{"id":13,"tradeName":"ADRENALIN 1MG/1ML","activeIngredient":"Adrenalin","strength":"1mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB","TDD"],"reconstitution":"TDD, TB: Dung dịch tiêm. (1) TM, TTM: Chuẩn bị dung dịch 0,01mg/ml: 0,1ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%). (2,4) Chuẩn bị dung dịch 0,05mg/ml: 0,5ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%). (2,4) Chuẩn bị dung dịch 0,1mg/ml: 1ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%) (2,4)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Không pha với dung dịch kiềm (như natri bicarbonat) (1)","manufacturer":"CT CPDP Minh Dân-VN","notes":"Tuyệt đối không được tiêm vào tĩnh mạch nếu chưa được pha loãng (1)","cold":false,"light":true},{"id":14,"tradeName":"ADRENALIN 1MG/1ML","activeIngredient":"Adrenalin","strength":"1mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TDD"],"reconstitution":"TDD: Dung dịch tiêm. (1) TM, TTM: Chuẩn bị dung dịch 0,01mg/ml: 0,1ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%). (2,4) Chuẩn bị dung dịch 0,05mg/ml: 0,5ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%). (2,4) Chuẩn bị dung dịch 0,1mg/ml: 1ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%) (2,4)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Không pha với dung dịch kiềm (như natri bicarbonat) (1)","manufacturer":"Công ty cổ phần dược phẩm Vĩnh Phúc","notes":"Tuyệt đối không được tiêm vào tĩnh mạch nếu chưa được pha loãng (1). THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":15,"tradeName":"ADRENALINE-BFS 5MG/5ML","activeIngredient":"Adrenalin","strength":"1mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB","TDD"],"reconstitution":"TDD, TB: Dung dịch tiêm. (1) TM, TTM: Chuẩn bị dung dịch 0,01mg/ml: 0,1ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%). (2,4) Chuẩn bị dung dịch 0,05mg/ml: 0,5ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%). (2,4) Chuẩn bị dung dịch 0,1mg/ml: 1ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%) (2,4)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Adrenalin tương kỵ với các dung dịch kiềm (như natri bicarbonat) (2)","manufacturer":"CTCPDP CPC1 HÀ NỘI- VN","notes":"Tuyệt đối không được tiêm vào tĩnh mạch nếu chưa được pha loãng (1). THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":16,"tradeName":"ADRENALINE-BFS 1MG","activeIngredient":"Adrenalin","strength":"1mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB","TDD"],"reconstitution":"TDD, TB: Dung dịch tiêm. (1) TM, TTM: Chuẩn bị dung dịch 0,01mg/ml: 0,1ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%). (2,4) Chuẩn bị dung dịch 0,05mg/ml: 0,5ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%). (2,4) Chuẩn bị dung dịch 0,1mg/ml: 1ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%) (2,4)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Adrenalin tương kỵ với các dung dịch kiềm (như natri bicarbonat) (2)","manufacturer":"CTCPDP CPC1 HÀ NỘI-VN","notes":"Tuyệt đối không được tiêm vào tĩnh mạch nếu chưa được pha loãng (1)","cold":false,"light":true},{"id":17,"tradeName":"ALBIOMIN 20%","activeIngredient":"Albumin","strength":"200g/1l","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền, truyền từ 1- 2ml/phút (có thể pha loãng với một lượng thích hợp NaCl 0,9%) (1)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với thuốc khác.","manufacturer":"Biotest Pharma GmbH- Đức","notes":"","cold":false,"light":true},{"id":18,"tradeName":"ALBUNORM 20%","activeIngredient":"Albumin","strength":"20g/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền (có thể pha loãng với một lượng thích hợp NaCl 0,9%, Glucose 5%) (1)","storage":"Bảo quản ở nhiệt độ phòng < 30°C, tránh ánh sáng, tránh đông lạnh, chai thuốc mở ra phải được dùng ngay (1)","incompatibilities":"Không được pha với các thuốc khác, máu toàn phần, hồng cầu lắng và nước cất pha tiêm (1)","manufacturer":"Octapharma Pharmazeutika Produktionsges. m.b.H","notes":"Không được dùng khi dung dịch vẩn đục hoặc có cặn Tốc độ truyền phải điều chỉnh theo chỉ định và bệnh tình BN (1)","cold":true,"light":true},{"id":19,"tradeName":"ALGESIN-N 30MG/ML","activeIngredient":"Ketorolac trometamol 30mg/ml","strength":"30mg/ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB: Tiêm chậm và TB sâu TM: Tiêm bolus không dưới 15s.","storage":"Dung dịch sau khi pha được sử dụng ngay khi mở nắp.","incompatibilities":"","manufacturer":"Rompharm Company SRL","notes":"THUỐC TRÁNH ÁNH SÁNG. Trẻ em: Tiêm TM từ 1-5 phút","cold":false,"light":true},{"id":20,"tradeName":"AMA-POWER","activeIngredient":"Ampicillin + Sulbactam","strength":"1000 mg + 500 mg","dosageForm":"Bột pha tiêm + 3,2ml (nước cất pha tiêm, NaCl 0,9%) → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm TM: Dung dịch tiêm (Tiêm ít nhất trong 3 phút) (1) TTM: Dung dịch tiêm + 50-100 ml dung dịch NaCl 0,9% (truyền từ 15-30 phút) (2)","storage":"Dung dịch đậm đặc để tiêm bắp trong vòng 1h sau khi pha Dung dịch sau khi pha NaCl 0,9% bảo quản trong vòng 8h ở 15–25°C và 72h ở 4°C (1)","incompatibilities":"Dùng riêng với aminoglycosid và các sản phẩm từ màu hoặc từ protein thủy phân (1,2)","manufacturer":"S.C. Antibiotice S.A.- Rumani","notes":"Thuốc chứa thành phần ampicillin nên sẽ kém bền trong dung dịch dextrose hoặc các dung dịch chứa carbohydrat khác (1,2)","cold":false,"light":false},{"id":21,"tradeName":"AMIKACIN 125MG/ML","activeIngredient":"Amikacin*","strength":"250mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm TTM: - Đối với người lớn: Dung dịch tiêm (2 ống) tương đương 500mg + 100-200ml dung dịch (Glucose 5%, NaCl 0,9%) (2) (truyền từ 30-60 phút) (1,2) - Đối với trẻ em: Thể tích phụ thuộc vào nhu cầu người bệnh nhưng phải đủ để truyền trong 1-2 giờ (1,2). Dung dịch tiêm truyền đạt nồng độ tối đa 10mg/ml (6)","storage":"Bảo quản nhiệt độ ≤ 30°C, tránh ánh sáng, tránh đông lạnh. (1)","incompatibilities":"Dùng riêng với các thuốc khác đặc biệt là kháng sinh beta-lactam (1)","manufacturer":"Sopharma PLC- Bulgaria","notes":"","cold":true,"light":true},{"id":22,"tradeName":"AMINAZIN 1,25%","activeIngredient":"Clorpromazin (hydroclorid)","strength":"25mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm TTM : Pha vào 500 - 1000 ml NaCl 0,9% (1)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C.","incompatibilities":"","manufacturer":"DANAPHA-VN","notes":"Không dùng khi thuốc biến màu. Chỉ dùng tiêm bắp","cold":false,"light":false},{"id":23,"tradeName":"AMINOPLASMAL 10%/250ML B.BRAUN","activeIngredient":"Acid amin và chất điện giải","strength":"10% E 500 mL","dosageForm":"Dung dịch tiêm truyền tĩnh mạch","routes":["TTM"],"reconstitution":"TTM: Tốc độ truyền tối đa <=1ml/kg/giờ (có thể trộn với các chất dinh dưỡng khác như carbonhydrate, lipid, vitamin, nguyên tố vi lượng nếu đã ghi nhận tương thích)","storage":"Bảo quản dưới 30°C, tránh ánh sáng. Nên sử dụng ngay khi mở nắp. Sau khi pha trộn dung dịch sử dụng trong vòng 24h ở 2–8°C (trong điều kiện vô trùng)","incompatibilities":"","manufacturer":"B. Braun Melsungen AG","notes":"","cold":true,"light":true},{"id":24,"tradeName":"AMIPAREN-10 200ML","activeIngredient":"Acid amin 10%/200ml","strength":"0.1","dosageForm":"Dung dịch tiêm truyền","routes":["TTM","TM"],"reconstitution":"TTM: Dung dich tiêm. Tốc độ khuyến cáo đường truyền TM ngoại biên 10g acid amin trong 60 phút (200ml/60 phút)","storage":"Dung dịch truyền sử dụng 1 lần ngay khi mở dung dịch phải trong suốt không màu (không sử dụng chai dịch khi viên chỉ thị màu chuyển màu xanh/tím, bỏ phần dư không sử dụng)","incompatibilities":"","manufacturer":"","notes":"Tốc độ tiêm truyền TM có thể giảm xuống ở trẻ em","cold":false,"light":false},{"id":25,"tradeName":"AMPHOLIP","activeIngredient":"Amphotericin B lipid complex*","strength":"50mg/ 10ml","dosageForm":"Phức hợp lipid tiêm tĩnh mạch","routes":["TTM","TM"],"reconstitution":"TTM: Lắc lọ thuốc nhẹ nhàng đến khi không còn thấy cặn màu vàng ở đáy lọ, rồi rút liều Ampholip thích hợp từ lọ vào bơm tiêm vô khuẩn 20ml (sử dụng kim tiêm đi kèm lọ thuốc). Thay kim tiêm cỡ 5mm, bơm thuốc vào túi truyền TM chứa Glucose 5% để đạt nồng độ 1mg/ml (50mg/50ml) (hoặc 2mg/ml (50mg/25ml) tùy đối tượng bệnh nhân) (1) (truyền thuốc với tốc độ 2,5mg/kg/giờ) (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ 2–8°C, tránh ánh sáng, tránh đông lạnh Thuốc sau khi pha có thể bảo quản trong vòng 48h ở nhiệt độ 2–8°C. Loại bỏ phần thuốc chưa dùng hết (1)","incompatibilities":"Không pha thuốc với dung dịch NaCl 0,9%. Dùng riêng với các thuốc khác (1)","manufacturer":"BHARAT SERUM AND VACCINES LTD.","notes":"Trước khi truyền lắc đều túi thuốc. Lắc nhẹ chai/túi dịch truyền 2h một lần nếu thời gian truyền >2h (1) Phải dùng bộ dây truyền riêng và không có bộ lọc","cold":true,"light":true},{"id":26,"tradeName":"AMPHOT","activeIngredient":"Amphotericin B*","strength":"50mg","dosageForm":"Bột đông khô pha tiêm + 10ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 500ml dung dịch Glucose 5% (liều dùng hàng ngày). Liều test ban đầu: 1mg Amphot pha 20ml Glucose 5% truyền trong 20-30 phút (1,2)","storage":"Dung dịch hoàn nguyên bảo quản trong vòng 24h ở 2–8°C, tránh ánh sáng Sau khi pha loãng phải dùng trong vòng 8h (1)","incompatibilities":"KHÔNG PHA TRỰC TIẾP bột đông khô với dung dịch glucose hoặc nước muối. Dùng riêng với các thuốc khác (1)","manufacturer":"LYKA LABS- ẤN ĐỘ","notes":"Nên tiêm truyền chậm từ 2-6h, phụ thuộc vào liều dùng. (1)","cold":true,"light":true},{"id":27,"tradeName":"AMPHOTRET","activeIngredient":"Amphotericin B*","strength":"50mg","dosageForm":"Bột đông khô pha tiêm + 10ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 500ml dung dịch Glucose 5%, nồng độ không vượt quá 0,1mg/ml, truyền trong thời gian 2-6 giờ (1,2). Liều test ban đầu: 1mg Amphotericin B pha 20ml Glucose 5% truyền trong 20-30 phút (2)","storage":"Dung dịch thuốc sau khi pha ổn định trong vòng 7 ngày ở nhiệt độ 2–8°C, tránh ánh sáng. (1)","incompatibilities":"KHÔNG PHA TRỰC TIẾP bột đông khô với dung dịch dextrose hoặc nước muối. Dùng riêng với các thuốc khác (1)","manufacturer":"BHARAT SERUM AND VACCINES LTD.","notes":"Dịch truyền phải được tránh ánh sáng trong khi truyền (1)","cold":true,"light":true},{"id":28,"tradeName":"AMPICILLIN 1G","activeIngredient":"Ampicilin (muối natri)","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB, TM: Bột tiêm + 2-3ml nước cất tiêm (tiêm TM chậm 3-6 phút) (1) TTM: Bột tiêm + 100ml dung dịch NaCl 0,9% (truyền trong 60 phút) (1)","storage":"Dung dịch tiêm dùng ngay sau khi pha và tránh đông lạnh (1,2)","incompatibilities":"Dùng riêng với Aminoglycosid (1,2,5)","manufacturer":"Cty CPDP MINH DÂN- VN","notes":"Ampicillin kém bền trong dung dịch Glucose, Fructose, đường nghịch đảo, Dextran, Lactat, Hartmann (1,2,5)","cold":true,"light":false},{"id":29,"tradeName":"AMPICILLIN 1G","activeIngredient":"Ampicilin (muối natri)","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 3,5ml nước cất tiêm (1) TM: Bột tiêm + 5-10ml nước cất tiêm (tiêm TM chậm 10-15 phút) TTM: Bột tiêm + 5ml nước cất tiêm → dung dịch tiêm pha với lượng thích hợp dung dịch NaCl 0,9% (1)","storage":"Dung dịch tiêm dùng ngay sau khi pha và tránh đông lạnh (2)","incompatibilities":"Dùng riêng với Aminoglycosid (1,2,5)","manufacturer":"Cty CP hóa- Dược phẩm Mekophar-VN","notes":"Ampicillin kém bền trong dung dịch Glucose, Fructose, đường nghịch đảo, Dextran, Lactat, Hartmann (1,2,5)","cold":true,"light":false},{"id":30,"tradeName":"AMPICILLIN/SULBACTAM 1,5 G","activeIngredient":"Ampicillin + Sulbactam","strength":"1000 mg + 500 mg","dosageForm":"Bột pha tiêm + 3,2ml nước cất pha tiêm → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm TM: Dung dịch tiêm (Tiêm ít nhất trong 3 phút) (1) TTM: Dung dịch tiêm + 50-100 ml dung dịch NaCl 0,9% (truyền từ 15-30 phút) (1)","storage":"Dung dịch đậm đặc để tiêm bắp, tiêm tĩnh mạch trong vòng 1h ở 2–8°C, 30 phút ở 25°C Dung dịch sau khi pha NaCl 0,9% bảo quản trong vòng 6h ở 2–8°C, 2h ở 25°C (1)","incompatibilities":"Dùng riêng với aminoglycosid và các sản phẩm từ màu hoặc từ protein thủy phân (1,2)","manufacturer":"Imexpharm","notes":"Thuốc chỉ dùng một lần, loại bỏ phần thừa Dung dịch phải trong suốt, không màu, loại bỏ nếu có tiểu phân hoặc tủa Thuốc chứa thành phần ampicillin nên sẽ kém bền trong dung dịch dextrose hoặc các dung dịch chứa carbohydrat khác. (1,2)","cold":true,"light":false},{"id":31,"tradeName":"ANAROPIN 2MG/ML","activeIngredient":"Ropivacaine hydrochloride","strength":"2mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"Tiêm/Truyền quanh dây thần kinh và ngoài màng cứng","storage":"Dung dịch không có chất bảo quản chỉ được dùng 1 lần. Bỏ thuốc dư khi mở nắp (trong vòng 24 giờ)","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":32,"tradeName":"ANAROPIN 5MG/ML","activeIngredient":"Ropivacaine hydrochloride","strength":"5mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"Tiêm nội thuỷ mạc (dưới màng nhện)","storage":"Dung dịch không có chất bảo quản chỉ được dùng 1 lần. Bỏ thuốc dư khi mở nắp (trong vòng 24 giờ)","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":33,"tradeName":"ANTIMUC","activeIngredient":"Acetylcystein","strength":"300mg/3ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"Phun khí dung: Dung dịch tiêm (1) TM: Dung dịch tiêm (liều đầu tiên TM nên được pha loãng với NaCl 0,9%, Glucose 5% theo tỷ lệ 1:1). Tiêm tĩnh mạch chậm ít nhất trong 5 phút (1) TTM: Dung dịch tiêm pha với một lượng thích hợp Glucose 5% (có thể dùng NaCL 0,9% khi không thể dùng Glucose 5%) gồm 3 giai đoạn TTM liên tiếp cho người lớn*: -Giai đoạn 1 : 150mg/kg thể trọng (pha loãng đến 200ml Glucose 5%), truyền trong 1 giờ. -Giai đoạn 2 : 50mg/kg thể trọng (pha loãng đến 500ml Glucose 5%), truyền trong 4 giờ. -Giai đoạn 3 : 100mg/kg thể trọng (pha loãng đến 1000ml Glucose 5%), truyền trong 16 giờ. (1) *Trẻ em thể tích pha loãng dựa trên cân nặng, tham khảo tờ HDSD","storage":"Sau khi mở lọ sử dụng trong vòng 24h, bảo quản ở nhiệt độ 2–8°C (1)","incompatibilities":"Tương kỵ với dầu iod, trypsin và hydrogen peroxyd, một số kim loại như sắt, đồng, cao su (1)","manufacturer":"Công ty Cổ phần Dược phẩm An Thiên","notes":"","cold":true,"light":false},{"id":34,"tradeName":"ANTIPEC","activeIngredient":"Cefepim","strength":"1g","dosageForm":"Bột pha tiêm + 3ml (nước cất pha tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TM: Bột tiêm + 10 ml (Glucose 5%, NaCl 0,9%,…) (tiêm từ 3-5 phút) (1) TTM: Bột tiêm + 50-100ml (Glucose 5%, NaCl 0,9% (truyền 30 phút) (2) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch đã pha ổn định trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Tương kỵ vancomycin, gentamycin, tobramycin sulfat, metronidazol hay netilmicin sunfat, aminophylin (1)","manufacturer":"Công ty TNHH Medochemie","notes":"","cold":true,"light":false},{"id":35,"tradeName":"ANTOPI 250","activeIngredient":"Aciclovir","strength":"250mg","dosageForm":"Bột đông khô pha tiêm + 5ml (nước cất pha tiêm, NaCl 0,9%)→ dung dịch hoàn nguyên.","routes":["TTM"],"reconstitution":"TTM: + Với liều ≤ 500mg pha loãng 50 - 100ml với dung dịch NaCl 0,9% + Với liều từ 500mg-1000mg pha loãng đến 200ml với dung dịch NaCl 0,9% (thời gian truyền trên 60 phút) (1) PHÒNG PHA TIÊM: Bột pha tiêm + 5ml nước cất tiêm","storage":"Dung dịch sau khi pha phải dùng ngay (1)","incompatibilities":"Dung dịch aciclovir tương kỵ với các chế phẩm máu v→ dung dịch chứa protein, foscarnet, meropenem, morphin sulphat, piperacillin - tazobactam, aztreonam, diltiazem HCl, dobutamin HCl, dopamin HCl. (2)","manufacturer":"CÔNG TY CỔ PHẦN DƯỢC PHẨM TRUNG ƯƠNG 1 - PHARBACO- VN","notes":"Nếu xuất hiện kết tủa hoặc bất thường trong quá trình pha loãng phải loại bỏ thuốc ngay (1,2)","cold":false,"light":false},{"id":36,"tradeName":"ARDUAN","activeIngredient":"Pipecuronium bromid","strength":"4mg","dosageForm":"Bột đông khô pha tiêm+ lọ dung môi NaCl 0,9% 2ml → dung dịch hoàn nguyên","routes":["TM"],"reconstitution":"TM: Dung dịch hoàn nguyên. (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ 2–8°C, tránh ánh sáng. Dung dịch đã pha phải dùng ngay (1)","incompatibilities":"Không dùng chung với các dung dich khác, thuốc khác trong cùng một ống tiêm hoặc túi","manufacturer":"GEDEON RICHTER - HUNGARY","notes":"","cold":true,"light":true},{"id":37,"tradeName":"ARTESUN 60MG","activeIngredient":"Artesunat","strength":"60mg","dosageForm":"Bột pha tiêm","routes":["TM","TB"],"reconstitution":"TB, TM: - Bột tiêm + 1ml NaHCO3 5% lắc đều cho đến khi tan hoàn toàn, sau đó pha thêm 5ml NaCl 0,9% (TM) hoặc 2ml NaCl 0,9% (TB) (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ < 30°C, tránh ánh sáng. Thuốc sau khi pha nên dùng ngay, phải được dùng trong 1h.","incompatibilities":"Dùng riêng với thuốc khác (1)","manufacturer":"Công ty TNHH DƯỢC PHẨM QUẾ LÂM (TQ)","notes":"Các dung môi pha thuốc có sẵn trong hộp thuốc.","cold":false,"light":true},{"id":38,"tradeName":"ARTESUNAT 60MG","activeIngredient":"Artesunat","strength":"60mg","dosageForm":"Bột pha tiêm","routes":["TM","TB"],"reconstitution":"TB, TM: - Bột tiêm+1ml dung môi Natri bicarbonat 5% lắc đều cho đến khi tan hoàn toàn, sau đó pha thêm 5ml NaCl 0,9% (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ < 30°C, tránh ánh sáng.","incompatibilities":"","manufacturer":"CÔNG TY CỔ PHẦN DƯỢC PHẨM TRUNG ƯƠNG 1 - PHARBACO- VN","notes":"Trong một số trường hợp có thể chỉ cần pha lọ thuốc với 1ml NaHCO3 5% (1)","cold":false,"light":true},{"id":39,"tradeName":"ASGIZOLE","activeIngredient":"Esomeprazole sodium","strength":"40 mg","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm+ 5ml dung dịch NaCl 0,9%. (Tiêm tối thiểu 3 phút) (1) TTM: Bột tiêm + 100ml dung dịch NaCl 0,9%, truyền tĩnh mạch trong 10-30 phút (1)","storage":"Dung dịch sau khi pha nên dùng ngay (1)","incompatibilities":"Dùng riêng với các thuốc khác","manufacturer":"Sofarimex - Industria Quimica e Farmaceutica, S.A","notes":"","cold":false,"light":false},{"id":40,"tradeName":"ASIMPLEX 250 MG","activeIngredient":"Aciclovir","strength":"250mg","dosageForm":"Bột pha tiêm + 10ml (nước cất tiêm, NaCl 0,9%) → dung dịch hoàn nguyên.","routes":["TTM"],"reconstitution":"TTM: - Đối với trẻ em: Pha loãng dung dịch hoàn nguyên với NaCl 0,9% tỷ lệ 1:5 - Đối với người lớn: + Với liều ≤ 500mg pha loãng đến 100ml với dung dịch NaCl 0,9% + Với liều từ 500mg-1000mg pha loãng đến 200ml với dung dịch NaCl 0,9% (thời gian truyền trên 60 phút) (1)","storage":"Dung dịch sau khi pha phải dùng ngay (1)","incompatibilities":"Dung dịch aciclovir tương kỵ với các chế phẩm máu v→ dung dịch chứa protein, foscarnet, meropenem, morphin sulphat, piperacillin - tazobactam, aztreonam, diltiazem HCl, dobutamin HCl, dopamin HCl (2)","manufacturer":"Aroma İlaç San. Ltd. Şti; Turkey","notes":"Nếu xuất hiện kết tủa hoặc bất thường trong quá trình pha loãng phải loại bỏ thuốc ngay (1,2)","cold":false,"light":false},{"id":41,"tradeName":"ATIBUTRET 250MG/5ML","activeIngredient":"Dobutamin","strength":"250mg/5ml","dosageForm":"Dung dịch đậm đặc để pha tiêm truyền","routes":["TTM"],"reconstitution":"TTM P ha loãng với một thể tích ít nhất 50 ml (trường hợp hạn chế dịch) hoặc 250 - 500ml với dung dịch NaCl 0,9%, Glucose 5% (1)","storage":"Dung dịch sau khi pha phải được dùng trong vòng 24h, bảo quản ở nhiệt độ 2–8°C (1)","incompatibilities":"Dobutamin tương kỵ Natri carbonat 5% và các dung dịch kiềm mạnh khác. Dùng riêng với các thuốc khác.","manufacturer":"Công ty Cổ phần Dược phẩm An Thiên","notes":"","cold":true,"light":false},{"id":42,"tradeName":"ATIGANCI","activeIngredient":"Ganciclovir sodium*","strength":"500mg","dosageForm":"Bột đông khô pha tiêm + 10ml nước cất tiêm→ dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 50 - 100ml dung dịch (Glucose 5%, NaCl 0,9%). (nồng độ dịch truyền ≤ 10mg/ml được khuyến cáo) (1,4,5) Thời gian truyền > 60 phút (1,4,5)","storage":"Dung dịch tiêm truyền sử dụng trong vòng 24h (1)","incompatibilities":"Không trộn lẫn với các dung dịch khác Không sử dụng nước pha tiêm có chất bảo quản paraben để hoàn nguyên (1)","manufacturer":"Công ty Cổ phần dược phẩm An Thiên","notes":"Không được tiêm trực tiếp vào tĩnh mạch hoặc tiêm truyền nhanh. Không tiêm bắp hoặc tiêm dưới da (1).","cold":false,"light":false},{"id":43,"tradeName":"ATIMEZON","activeIngredient":"Omeprazole","strength":"40 mg","dosageForm":"Bột đông khô pha tiêm","routes":["TM"],"reconstitution":"TM: Bột đông khô pha tiêm+10ml dung môi. Tiêm chậm không quá 4ml/phút (1)","storage":"Dung dịch sau khi pha dùng trong vòng 4h và bảo quản ở nhiệt độ dưới 25°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"CTCPDP AN THIÊN-VN","notes":"Dùng trong vòng 4h","cold":false,"light":false},{"id":44,"tradeName":"ATISOLU 40 INJ","activeIngredient":"Methylprednisolo ne natri succinat","strength":"40mg","dosageForm":"Bột đông khô pha tiêm+1ml nước cất tiêm → dung dịch tiêm.","routes":["TTM","TM","TB"],"reconstitution":"TB,TM: Dung dịch tiêm. (1) TTM: Dung dịch tiêm pha với một lượng thích hợp dung dịch Glucose 5%, NaCl 0,9% truyền trong 30 phút (2) (5)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C, tránh ánh sáng (1)","incompatibilities":"Dung môi chứa 10mg benzyl alcol, không được sử dụng cho trẻ sinh non và trẻ sơ sinh (1)","manufacturer":"CTCP DP AN THIÊN","notes":"Chế phẩm có dung môi kèm theo","cold":false,"light":true},{"id":45,"tradeName":"ATROPIN SULFAT 0,25MG/1ML","activeIngredient":"Atropine sulfat 0,25mg/1ml","strength":"0,25mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB","TDD"],"reconstitution":"TB: Dung dịch tiêm TM:dung dịch tiêm TDD:dung dịch tiêm","storage":"Dung dịch khi mở nắp bảo quản nhiệt độ phòng chỉ sử dụng trong vòng 24 giờ","incompatibilities":"Bị tương kỵ vật lý khi trộn với norepinephrin bitartrat, metaraminol bitartrat và natri bicarbonat - Trộn atropin + natri methohexital → tủa trong vòng 15 phút.","manufacturer":"Công ty cổ phần dược phẩm Vĩnh Phúc","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":46,"tradeName":"AUROPENNZ 1.5","activeIngredient":"Ampicillin + Sulbactam","strength":"1000 mg + 500 mg","dosageForm":"Bột pha tiêm + 3,2ml nước cất tiêm → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TM: Dung dịch tiêm (Tiêm trong 10 -15 phút) (1,2) TTM: Dung dịch tiêm + 50-100 ml dung dịch NaCl 0,9% (truyền từ 15-30 phút) (1,2)","storage":"Dung dịch sau khi pha (NaCl 0,9%) bảo quản 8h ở 15–25°C và 48h ở 4°C (1)","incompatibilities":"Dùng riêng với aminoglycosid và các sản phẩm từ màu hoặc từ protein thủy phân (1,2)","manufacturer":"Aurobindo Pharma Ltd - Ấn Độ.","notes":"","cold":false,"light":false},{"id":47,"tradeName":"AVELOX","activeIngredient":"Moxifloxacin HCl","strength":"400mg/ 250ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền (thời gian truyền trên 60 phút) (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng. PHÒNG PHA TIÊM: 24h ở nhiệt độ < 25°C","incompatibilities":"Avelox tương kỵ với dung dịch NaHCO3 4,2% & NaHCO3 8,4% nên dung riêng.","manufacturer":"Bayer Pharma AG-Đức","notes":"KHÔNG bảo quản AVELOX trong tủ lạnh (< 15°C), chỉ sử dụng dung dịch còn trong suốt","cold":true,"light":true},{"id":48,"tradeName":"AVICEMOR 750MG/150ML","activeIngredient":"Levofloxacin","strength":"750mg/ 150ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm (truyền ít nhất 90 phút) (1)","storage":"Dùng ngay sau khi mở nắp (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch khác (2)","manufacturer":"AMVIPHARM- VIỆT NAM","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":false,"light":false},{"id":49,"tradeName":"AZACTAM","activeIngredient":"Aztreonam","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 3ml nước cất tiêm (1) TM: Bột tiêm + 6-10ml nước cất tiêm (tiêm chậm 3-5 phút) (1) TTM: Bột tiêm + 50-100ml (NaCl 0,9%, Glucose 5%), truyền trong 20-60 phút (1)","storage":"Dung dịch pha loãng ổn định trong 24 giờ ở nhiệt độ 15–30°C, 3 ngày ở 2–8°C (1)","incompatibilities":"Dùng riêng với nafcillin natri, cephradine, metronidazole, acyclovir, amphotericin B, ampicillin, ganciclovir, vancomycin (1,2)","manufacturer":"Bristol-Myers Squibb S.r.1 Localita’ Fontana del Ceras (Italy)","notes":"","cold":false,"light":false},{"id":50,"tradeName":"AZEIN INJ.","activeIngredient":"Aciclovir","strength":"250mg","dosageForm":"Bột đông khô pha tiêm + 10ml (nước cất pha tiêm, NaCl 0,9%) → dung dịch tiêm.","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm trong bơm truyền kiểm soát tốc độ trong thời gian ít nhất 1h (1,5) TTM: + Với liều ≤ 500mg pha loãng 50- 100ml với dung dịch NaCl 0,9% + Với liều > 500mg pha loãng đến 250ml với dung dịch NaCl 0,9% (thời gian truyền trên 60 phút) (5) PHÒNG PHA TIÊM: Bột pha tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha phải dùng ngay (1)","incompatibilities":"Dung dịch aciclovir tương kỵ với các chế phẩm máu v→ dung dịch chứa protein, foscarnet, meropenem, morphin sulphat, piperacillin - tazobactam. (2)","manufacturer":"MYUNG IN PHARM CO ., LTD- HÀN QUỐC","notes":"Nếu xuất hiện kết tủa hoặc bất thường trong quá trình pha loãng phải loại bỏ thuốc ngay (1,2)","cold":false,"light":false},{"id":51,"tradeName":"BACQURE 500MG","activeIngredient":"Imipenem + Cilastatin","strength":"500mg + 500mg","dosageForm":"Bột pha tiêm + 10 ml (NaCl 0.9%, Glucose 5%,...), lắc kỹ, thêm tiếp 10 ml dung môi trên, lắc kỹ để đảm bảo thuốc đã tan hoàn toàn → dung dịch tiêm (1)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm chuyển vào lọ chứa vừa đủ 100ml dịch truyền (NaCl 0,9%, Glucose 5%), tương đương với nồng độ 2,5mg/ml đến 5mg/ml (1) (truyền trong khoảng 30 - 60 phút) (1) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h.","storage":"Dung dịch sau khi pha loãng ổn định trong vòng 4h ở nhiệt độ 25°C và 24h ở nhiệt độ 4°C (1)","incompatibilities":"Dùng riêng với các kháng sinh khác, nếu dùng đồng thời với aminoglycosid thì tiêm ở vị trí khác nhau (1,2) Không dùng dung dịch Lactate để pha thuốc (1)","manufacturer":"Sun Pharmaceutical Industries Ltd India","notes":"Đảm bảo thuốc đã tan hoàn toàn trước khi truyền (1,2) Nếu có buồn nôn và/hoặc nôn trong khi dùng thuốc, giảm tốc độ truyền (1)","cold":false,"light":false},{"id":52,"tradeName":"BACTRIM®","activeIngredient":"Sulfamethoxazol + Trimethoprim","strength":"400mg + 80mg","dosageForm":"Dung dịch đậm đặc pha tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch đậm đặc + 125ml (Glucose 5%, NaCl 0,9%) (truyền từ 30 - 60 phút) (1)","storage":"Dung dịch sau khi pha nên sử dụng trong vòng 6h (1). Tốt nhất nên sử dụng ngay để tránh bị kết tinh hoặc tủa (5). Không được sử dụng thuốc nếu phát hiện tủa hoặc kết tinh (5).","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"CENEXI SAS - PHÁP","notes":"Chỉ sử dụng đường TTM (1).","cold":false,"light":false},{"id":53,"tradeName":"BARBIT","activeIngredient":"Phenobarbital Natri","strength":"200mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm. (1)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với dung dịch acid vì có thể tủa Phenobarbital (2)","manufacturer":"INCEPTA PHARMACEU TICAL Ltd.","notes":"Bảo quản theo qui chế thuốc hướng thần","cold":false,"light":true},{"id":54,"tradeName":"BASMICIN","activeIngredient":"Ciprofloxacin","strength":"400 mg/200 ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: - Đối với người lớn: Truyền trong 60 phút (1) - Đối với trẻ em và trẻ vị thành niên: 5 -10 mg/kg/ngày, truyền từ 30-60 phút (1,2)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng, tránh đông lạnh.. PHÒNG PHA TIÊM: 24h ở 2–8°C","incompatibilities":"Dung dịch tiêm truyền Ciprofloxacin có pH từ 3,9-4,5 nên dùng riêng với các thuốc có pH cao (Penicillin, Heparin) (1)","manufacturer":"FRESENIUS KABI BIDIPHAR-VN","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":true,"light":true},{"id":55,"tradeName":"BASULTAM","activeIngredient":"Cefoperazon + Sulbactam","strength":"1g + 1g","dosageForm":"Bột pha tiêm + 6,7ml (nước cất pha tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm pha loãng thành 20 ml dung dịch pha thuốc. Tiêm ít nhất trong 3 phút (1,2) TTM: Dung dịch tiêm pha loãng với ít nhất 20 ml (Glucose 5%, NaCl 0,9%) truyền từ 15-60 phút (1,2) Nếu TTM với Ringer Lactat: Bột pha tiêm + 6,7ml nước cất tiêm, sau đó pha loãng với 200 ml dung dịch Ringer Lactate (1)","storage":"Bảo quản nhiệt độ < 30°C, tránh ánh sáng (1)","incompatibilities":"Dùng riêng với Aminoglycosid (1)","manufacturer":"MEDOCHEMIE LTD-CYPRUS","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":false,"light":true},{"id":56,"tradeName":"BENZATHIN BENZYLPENICILLIN 1.2 MIU","activeIngredient":"Benzathin benzylpenicillin","strength":"1.2 MIU","dosageForm":"Bột pha tiêm","routes":["TB"],"reconstitution":"TB: Bột tiêm + 3ml nước cất tiêm (1)","storage":"Dung dịch ổn định trong vòng 24 giờ ở nhiệt độ 25°C (1)","incompatibilities":"Tương kỵ với các ion kim loại, các chất oxy hóa, rượu, glycerol, macrogol, dung dịch kiềm nhẹ Dùng riêng với các thuốc khác (1)","manufacturer":"Công ty CPDP VCP","notes":"Không được tiêm tĩnh mạch, động mạch, gần dây thần kinh ngoại biên chính hoặc mạch máu","cold":false,"light":false},{"id":57,"tradeName":"BENZYL PENICILIN 1.000.000UI","activeIngredient":"Benzylpenicilin (Penicillin G)","strength":"1MUI (600mg)","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 1,6-2ml nước cất tiêm (1,2) TM: Bột tiêm + 4-10ml nước cất tiêm (1,2) TTM: Bột tiêm + 10-100ml dung dịch NaCl 0,9%, Glucose 5%. (truyền 20-30 phút) (1,5).","storage":"Dung dịch pha tiêm sau khi hoàn nguyên ổn định trong vòng 7 ngày ở nhiệt độ 2–8°C (1,2,4)","incompatibilities":"Dùng riêng với Aminoglycosid (1)","manufacturer":"Cty CPDP MINH DÂN- VN","notes":"Phải thử phản ứng dị ứng trước khi tiêm","cold":true,"light":false},{"id":58,"tradeName":"BFS- NORADRENALINE 10MG","activeIngredient":"Nor adrenalin (Nor Epinephrin)","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM: 2mg (2ml) dung dịch tiêm + 48ml dung dịch Glucose 5% hoặc NaCl 0,9% (1) Theo DTQG 2022, dung dịch norepinephrin 1mg/ml phải được pha loãng trước khi truyền bằng glucose 5% hoặc hỗn hợp dung dịch glucose và NaCl, không pha với một mình dung dịch NaCl (2).","storage":"Dung dịch sau pha loãng bảo quản ở 2–8°C (1)","incompatibilities":"Thuốc tương kỵ với bicarbonat hoặc dung dịch kiềm. (1)","manufacturer":"Công ty Cổ phần Dược phẩm CPC1 Hà Nội","notes":"Khuyến cáo dùng đường tĩnh mạch trung tâm do có thể gây co mạch tại chỗ rất mạnh và hoại tử mô (1) Khuyến cáo không pha trong NaCl 0,9% bắt nguồn từ chế phẩm Levophed với lý do là khả năng phân hủy oxy hóa trong dung dịch nước muối sinh lý nguyên chất (NaCl 0,9% có pH 5,5-6 hơi acid so với Glucose 5%), ngoài ra có thể liên quan đến nguy cơ của sự dư thừa Na+ nếu sử dụng trong bệnh lý tim mạch (ví dụ sốc tim,...)","cold":true,"light":false},{"id":59,"tradeName":"BFS-ADENOSIN 3MG/ML, 2ML","activeIngredient":"Adenosin 3mg/ml","strength":"3mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM (chỉ định loạn nhịp nhanh kịch phát trên thất): Tiêm nhanh dung dịch tiêm vào tĩnh mạch trong 1-2 (là TM ngoại biên gần thân người như cánh tay trên-TM bắp tay hoặc gần /khuỷu tay), sau đó truyền nhanh tiếp theo vào mạch 20ml NaCl 0,9% (6mg adenosin+18- 20ml NaCl 0,9% theo sau). TTM (chỉ kỹ thuật xạ hình cơ tim): Truyền liên tục trong 6 phút (tổng liều 0,84mg/kg), dược chất phóng xạ sẽ tiêm giữa lúc truyền (sau khi bắt đầu truyền adenosin 3 phút) với tốc độ tính theo công thức (ml/phút)=0,14x trọng lượng cơ thể/3","storage":"Bảo quản dung dịch tiêm ở nhiệt độ phòng, không bỏ tủ lạnh vì có thể gây kết tinh. Sử dụng ngay sau khi mở nắp.","incompatibilities":"","manufacturer":"Công ty Cổ phần Dược phẩm CPC1 Hà Nội","notes":"THUỐC TRÁNH ÁNH SÁNG. TM (chỉ định loạn nhịp nhanh kịch phát trên thất): Tiêm nhanh dung dịch tiêm vào tĩnh mạch trong 1-2 (là TM ngoại biên gần thân người như cánh tay trên- TM bắp tay hoặc gần /khuỷu tay), sau đó truyền nhanh tiếp theo vào mạch 5 10ml NaCl 0,9% (6mg adenosin+18-20ml NaCl 0,9% theo sau).","cold":true,"light":true},{"id":60,"tradeName":"BFS-CAFEIN 30MG/3ML","activeIngredient":"Cafein 30mg/3ml","strength":"30mg/3ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm hoặc pha loãng với D5W (pha trong 25ml D5W) tiêm tối thiểu 3-5 phút. TTM: Pha nồng độ 10mg/mL truyền trong 10-30 phút PO (uống): Dung dịch tiêm","storage":"Dung dịch tiêm TM: Dùng ngay khi mở nắp, dung dịch để uống dùng trong vòng 1 giờ sau khi mở nắp","incompatibilities":"","manufacturer":"Công ty Cổ phần Dược phẩm CPC1 Hà Nội","notes":"Không được tiêm bắp. THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":61,"tradeName":"BFS-DEPARA","activeIngredient":"N-Acetylcystein","strength":"2g/10ml","dosageForm":"Dung dịch đậm đặc pha tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Pha với một lượng thích hợp Glucose 5%, NaCl 0,9%. Giải độc quá liều Paracetamol gồm 3 giai đoạn TTM liên tiếp cho người lớn: -Giai đoạn 1: 150mg/kg thể trọng (pha loãng đến 200ml Glucose 5%, NaCl 0,9%), truyền trong 1 giờ. -Giai đoạn 2: 50mg/kg thể trọng (pha loãng đến 500ml Glucose 5%, NaCl 0,9%), truyền trong 4 giờ. -Giai đoạn 3: 100mg/kg thể trọng (pha loãng đến 1000ml Glucose 5%, NaCl 0,9%), truyền trong 16 giờ. (1)","storage":"Dung dịch sau pha loãng sử dụng trong vòng 24h, bảo quản ở nhiệt độ phòng < 25°C (1)","incompatibilities":"Tương kỵ với dầu iod, trypsin và hydrogen peroxyd, một số kim loại như sắt, đồng, cao su (1)","manufacturer":"Công ty Cổ phần Dược phẩm CPC1 Hà Nội","notes":"","cold":false,"light":false},{"id":62,"tradeName":"BFS-FAMOTIDIN 20MG/2ML","activeIngredient":"Famotidin 20mg/2ml","strength":"20mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm + vửa đủ 5-10ml dung dịch NaCl 0,9%, glucose 5% (TMC ít nhất 2 phút) TTM: Dung dịch tiêm + 50-100ml dung dịch NaCl 0,9%, glucose 5% (truyền 15-30 phút)","storage":"Dung dịch pha loãng nên sử dụng ngay sau khi pha Cân nhắc: TM: DD bảo quản 2–8°C sử dụng trong vòng 48 giờ TTM: DD bảo quản 2–8°C sử dụng trong vòng 48 giờ","incompatibilities":"","manufacturer":"Công ty Cổ phần Dược phẩm CPC1 Hà Nội","notes":"TM: Pha NaCl 0,9%, glucose 5%, LR nồng độ tối đa 4mg/ml TTM: Pha nồng độ 0,2mg/ml (NS, D5,10W,LR)","cold":true,"light":false},{"id":63,"tradeName":"BFS-NICARDIPIN","activeIngredient":"Nicardipin hydroclorid","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm NL - Liều ban đầu: Truyền 3-5mg/giờ, không được quá 15mg/giờ -Liều duy trì: Truyền 2-4mg/giờ Cần pha loãng thuốc trong dung dịch tiêm truyền glucose 5% đến nồng độ 0,1 đến 0,2 mg/ml trước khi dùng, trừ khi được tiêm truyền qua tĩnh mạch trung tâm. (1,2)","storage":"Bảo quản nơi khô ráo, nhiệt độ < 30°C, tránh ánh sáng","incompatibilities":"Nicardipin tương kỵ với dung dịch Natri bicarbonat, Ringer lactat, furosemid, heparin và thiopental (2)","manufacturer":"Công ty cổ phần dược phẩm CPC1 Hà Nội","notes":"Cần dùng bơm tiêm điện hoặc bơm tiêm tự động để kiểm soát tốc độ truyền. Nếu truyền TM ngoại biên, cần thay đổi vị trí tiêm truyền mỗi 12h để tránh kích ứng tĩnh mạch (4)","cold":false,"light":true},{"id":64,"tradeName":"BICARBONATE DE SODIUM 8.4%(840MG/10ML)","activeIngredient":"Natri bicarbonat","strength":"0,84g/10ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM","TM"],"reconstitution":"TM, TTM: Dung dịch tiêm (1) Tiêm truyền tĩnh mạch với tốc độ khoảng 20 - 40 giọt/phút = 60 -120ml/giờ (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng (1)","incompatibilities":"Dùng riêng với các thuốc khác chứa Canxi (1)","manufacturer":"LABORATOIR E RENAUDIN- PHÁP","notes":"","cold":false,"light":true},{"id":65,"tradeName":"BICEFZIDIM","activeIngredient":"Ceftazidim","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 4ml nước cất tiêm. (1) TM: Bột tiêm + 10ml (Nước cất tiêm, Glucose 5%, NaCl 0,9%) (1,2,5) (tiêm từ 3-5 phút) (1,5) TTM: Bột tiêm + 100ml (Glucose 5%, NaCl 0,9%) (truyền từ 20-30 phút) (1,2,5) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha loãng có thể bảo quản trong vòng 24h ở nhiệt độ <25°C, 7 ngày ở nhiệt độ 2–8°C (1)","incompatibilities":"Không được pha thuốc vào dung dịch Natri bicarbonate (1,2) Dùng riêng với Vancomycin, Aminoglycosid, Metronidazol (1,2)","manufacturer":"Công Ty Cổ Phần Dược - Trang Thiết Bị Y Tế Bình Định (Bidiphar)-VN","notes":"","cold":true,"light":false},{"id":66,"tradeName":"BIDINAM","activeIngredient":"Imipenem + Cilastatin","strength":"500mg + 500mg","dosageForm":"Bột pha tiêm + 10 ml (NaCl 0.9%, Glucose 5%,...), lắc kỹ, thêm tiếp 10 ml dung môi trên, lắc kỹ để đảm bảo thuốc đã tan hoàn toàn → dung dịch tiêm (1)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm + 80ml (Glucose 5%, NaCl 0,9%,...) (1) (Nồng độ cuối cùng không được quá 5 mg/ml) (truyền 250-500mg Imipenem từ 20-30 phút, 1g Imipenem từ 40-60 phút) (1,5) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h.","storage":"Độ ổn định của Imipenem/Cilastatin khi pha loãng với Dextrose 5% hoặc NaCl 0.9% là 4h (ở 25°C) hoặc 24h (4°C) (1)","incompatibilities":"Dùng riêng với các kháng sinh khác, không dùng dung dịch Lactate để pha thuốc (1)","manufacturer":"CTCPD-TTB Y TẾ BÌNH ĐỊNH-VN","notes":"Thường dùng dung dịch NaCl 0,9% để pha dịch truyền (2,5). Đảm bảo thuốc đã tan hoàn toàn trước khi truyền (1) Nếu có buồn nôn và/hoặc nôn trong khi dùng thuốc, giảm tốc độ truyền (1)","cold":false,"light":false},{"id":67,"tradeName":"BINOCRIT","activeIngredient":"Epoetin alfa","strength":"1000IU/0,5ml","dosageForm":"Dung dịch tiêm đóng sẵn trong bơm tiêm","routes":["TM","TDD"],"reconstitution":"Trước khi sử dụng, cần để bơm tiêm epoetin alfa đến khi đạt tới nhiệt độ phòng. Thời gian khoảng 15 -30 phút. (1) TM: Thời gian tiêm tối thiểu 1-5 phút, tùy thuộc tổng liều. (1) TDD: Không nên tiêm vượt quá thể tích tối đa 1ml tại mỗi vị trí tiêm. (1)","storage":"Bảo quản lạnh ở nhiệt độ 2–8°C, trong bao bì gốc để tránh ánh sáng (1)","incompatibilities":"","manufacturer":"IDT Biologika GmbH Am Pharmapark - Đức","notes":"","cold":true,"light":true},{"id":68,"tradeName":"BIO-TAKSYM","activeIngredient":"Cefotaxim","strength":"1g","dosageForm":"Bột pha tiêm + 4ml nước cất pha tiêm → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TM: Dung dịch tiêm pha thành 10ml với nước cất pha tiêm (tiêm từ 3-5 phút) (1) TTM: Dung dịch tiêm + 50 - 100ml (dung dịch NaCl 0,9%, Glucose 5%) (thời gian truyền từ 20-60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10 ml nước cất tiêm","storage":"Dung dịch tiêm sau khi pha bảo quản trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không được pha vào dung dịch kiềm (dung dịch Natri bicarbonate,…). Dùng riêng với Aminoglycosid, Metronidazol,... (1)","manufacturer":"PHARMACEU TICAL WORKS POLPHARMA SA","notes":"","cold":true,"light":false},{"id":69,"tradeName":"BIPISYN","activeIngredient":"Ampicillin + Sulbactam","strength":"1000 mg + 500 mg","dosageForm":"Bột pha tiêm + 3,2ml nước cất pha tiêm → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TM: Dung dịch tiêm (Tiêm ít nhất trong 10-15 phút) (1) TTM: Dung dịch tiêm + 50-100 ml dung dịch NaCl 0,9% (truyền từ 15-30 phút) (2)","storage":"Bảo quản < 25°C, tránh ánh sáng (1)","incompatibilities":"Dùng riêng với aminoglycosid và các sản phẩm từ màu hoặc từ protein thủy phân (1,2)","manufacturer":"Công ty Cổ phần Dược - trang thiết bị y tế Bình Định (Bidiphar)-VN","notes":"Thuốc chứa thành phần ampicillin nên sẽ kém bền trong dung dịch dextrose hoặc các dung dịch chứa carbohydrat khác. (2)","cold":false,"light":true},{"id":70,"tradeName":"BRICANYL 0,5MG/ML","activeIngredient":"Terbutaline sulfat 0,5mg/ml","strength":"0,5mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TDD"],"reconstitution":"TDD: Dung dịch tiêm. TM: Dung dịch tiêm. TTM: Chuẩn bị dung dịch pha 5mg (10 ống 1ml) pha vào 1000ml (glucose 5%/dung dịch NaCl 0,9%/DD ringer), tránh dùng nước muối sinh lý để pha cho PNCT vì tăng nguy cơ phù phổi trong sinh non. 10 giọt/phút tương ứng 2,5mcg/phút và 20 giọt/phút tương ứng 5mcg/phút.","storage":"Dung dịch pha truyền phải sử dụng trong vòng 12 giờ","incompatibilities":"","manufacturer":"AstraZeneca, Interphil Laboratories Inc","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":71,"tradeName":"BRIDION 100MG/ML","activeIngredient":"Sugammadex","strength":"100mg/ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Liều trực tiếp tiêm nhanh (pha loãng 10mg/ml (NaCl 0,9%-0,45%, glucose 5%-2,5%, ringer lactat) hoặc nguyên chất 100mg/ml) trong vòng 10s vào đường truyền tĩnh mạch. Người lớn tuổi tiêm chậm hơn (do tác dụng phụ chậm nhịp tim, loạn nhịp tim). Đường truyền nên được xả trôi bằng NaCl 0,9% giữa các lần tiêm Bridion và các thuốc khác","storage":"Bảo quản nhiệt độ phòng < 30°C. Không để đông đá.Dung dịch pha loãng ổn định lý hóa 48h ở nhiệt độ 2–25°C. Theo quan điểm vi sinh, dung dịch sử dụng tức thì trong vòng 24h ở nhiệt độ 2–8°C","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG. Nếu không bảo vệ tránh ánh sáng lọ thuốc phải sủ dụng trong vòng 5 ngày. TM: Bệnh Nhi dưới 2 tuổi có thể pha loãng nồng độ 10mg/ml hoặc 25mg/ml để tăng chính xác cho liều dùng.","cold":true,"light":true},{"id":72,"tradeName":"BRUDOPA","activeIngredient":"Dopamin HCl","strength":"40 mg/ml Ống 5ml 200mg/5mL","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: 5ml dung dịch tiêm + 250-500 ml dung dịch NaCl 0.9%, Glucose 5%, 10% hoặc 20%, dung dịch Ringer lactat (1)","storage":"Bảo quản ống thuốc < 30°C, tránh ánh sáng Dung dịch sau khi pha sử dụng trong vòng 24h ở nhiệt độ 25°C (1)","incompatibilities":"Không được pha với các dung dịch kiềm (1)","manufacturer":"Brawn Laboratories Ltd","notes":"Truyền tĩnh mạch sau khi pha loãng","cold":false,"light":true},{"id":73,"tradeName":"BUPIVACAINE AGUETTANT 5MG/ML, 20ML","activeIngredient":"Bupivacaine hydrochloride 100mg/20ml","strength":"100mg/20ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"Không tiêm vào mạch máu Gây tê từng lớp, Phong bế thần kinh ngoại biên, gây tê ngoài màng cứng, gây tê vùng đuôi ngựa, gây tê tuỷ sống","storage":"Sau khi mở: Phải dùng ngay (dung dịch trong suốt không màu hoặc hơi vàng, không có tiểu phân hoặc kết tủa)","incompatibilities":"","manufacturer":"Delpharm Tours, Pháp","notes":"","cold":false,"light":false},{"id":74,"tradeName":"BUSCOPAN","activeIngredient":"Hyoscin-N- butylbromide","strength":"20mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB","TDD"],"reconstitution":"TDD, TB: Dung dịch tiêm TM: Dung dịch tiêm, tiêm tĩnh mạch chậm (1)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C.","incompatibilities":"","manufacturer":"Boehringer Ingelheim Espana S.A - Spain","notes":"Những bệnh nhân dùng thuốc chống đông chống chỉ định tiêm bắp","cold":false,"light":false},{"id":75,"tradeName":"CADEN","activeIngredient":"Adenosin triphosphat","strength":"6mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Dung dịch tiêm. (1)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C.","incompatibilities":"","manufacturer":"Valdepharm - Pháp","notes":"","cold":false,"light":false},{"id":76,"tradeName":"CALCI CLORID","activeIngredient":"Calci clorid","strength":"500mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Dung dịch tiêm.Tiêm chậm tốc độ không vượt quá 0,5-1ml/phút (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ < 30°C, tránh ánh sáng. Không làm đông lạnh (1)","incompatibilities":"Calci clorid bị kết tủa bởi carbonat, bicarbonat, phosphat, sulphat và tartrat","manufacturer":"Cty CP DP Vĩnh Phúc","notes":"Chỉ được tiêm tĩnh mạch (1)","cold":true,"light":true},{"id":77,"tradeName":"CALCI CLORID","activeIngredient":"Calci clorid","strength":"500 mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Dung dịch tiêm. Tiêm chậm tốc độ không vượt quá 0,5-1ml/phút. (2)","storage":"Bảo quản lọ thuốc ở nhiệt độ < 30°C, tránh ánh sáng.","incompatibilities":"Calci clorid bị kết tủa bởi carbonat, bicarbonat, phosphat, sulphat và tartrat","manufacturer":"CT CPDP Minh Dân-VN","notes":"Chỉ được tiêm tĩnh mạch (1)","cold":false,"light":true},{"id":78,"tradeName":"CAMMIC","activeIngredient":"Acid tranexamic","strength":"250mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Dung dịch tiêm (tiêm tĩnh mạch chậm không được quá 100 mg/phút) (1)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với penicillin (2)","manufacturer":"Công ty Cổ phần Dược phẩm Vĩnh Phúc","notes":"Không có chỉ định tiêm bắp (1)","cold":false,"light":true},{"id":79,"tradeName":"CANCIDAS","activeIngredient":"Caspofungin","strength":"50mg","dosageForm":"Bột đông khô pha tiêm + 10,5ml (nước cất tiêm, NaCl 0,9%) → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 100-250ml dung dịch NaCl 0,9% (1) Truyền trong vòng 60 phút PHÒNG PHA TIÊM: Bột đông khô pha tiêm + 10,5ml nước cất tiêm","storage":"Dung dịch hoàn nguyên bảo quản trong vòng 24h ở nhiệt độ < 25°C Sau khi pha loãng để trong túi hoặc chai truyền TM phải dùng trong vòng 24h ở nhiệt độ 25°C, 48h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không dùng dung môi chứa GLUCOSE để pha (1)","manufacturer":"LABORATOIR ES MERCK SHARP&DOH M CHIBRET- PHÁP","notes":"","cold":true,"light":false},{"id":80,"tradeName":"CANCIDAS","activeIngredient":"Caspofungin","strength":"70mg","dosageForm":"Bột đông khô + 10,5ml (nước cất tiêm, NaCl 0,9%) → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên pha thành 250ml dung dịch NaCl 0,9% (1) Truyền trong vòng 60 phút PHÒNG PHA TIÊM: Bột đông khô + 10,5ml nước cất tiêm","storage":"Dung dịch hoàn nguyên bảo quản trong vòng 24h ở nhiệt độ < 25°C Sau khi pha loãng để trong túi hoặc chai truyền TM phải dùng trong vòng 24h ở nhiệt độ 25°C, 48h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không dùng dung môi chứa GLUCOSE để pha (1)","manufacturer":"LABORATOIR ES MERCK SHARP&DOH M CHIBRET- PHÁP","notes":"","cold":true,"light":false},{"id":81,"tradeName":"CAPOZIDE 50","activeIngredient":"Caspofungin","strength":"50mg","dosageForm":"Bột đông khô pha tiêm + 10,5ml (nước cất tiêm, NaCl 0,9%) → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 100-250ml dung dịch NaCl 0,9% (1) Truyền trong vòng 60 phút PHÒNG PHA TIÊM: Bột đông khô pha tiêm + 10,5ml nước cất tiêm","storage":"Bảo quản lọ thuốc ở nhiệt độ 2–8°C trong bao bì gốc. Dung dịch hoàn nguyên nên được pha loãng thành dung dịch truyền ngay. (1) Dung dịch sau khi pha nên dùng ngay (1).","incompatibilities":"Không dùng dung môi chứa GLUCOSE để pha (1) Không trộn hoặc truyền chung với bất kỳ thuốc nào khác (1)","manufacturer":"Penmix Ltd. - Korea","notes":"","cold":true,"light":false},{"id":82,"tradeName":"CAPOZIDE 70","activeIngredient":"Caspofungin","strength":"70mg","dosageForm":"Bột đông khô pha tiêm + 10,5ml (nước cất tiêm, NaCl 0,9%) → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 250ml dung dịch NaCl 0,9% (1) Truyền trong vòng 60 phút PHÒNG PHA TIÊM: Bột đông khô pha tiêm + 10,5ml nước cất tiêm","storage":"Dung dịch hoàn nguyên nên được pha loãng dung dịch truyền ngay. (1) Dung dịch sau khi pha nên dùng ngay (1)","incompatibilities":"Không dùng dung môi chứa GLUCOSE để pha (1)","manufacturer":"Penmix Ltd. - Korea","notes":"","cold":false,"light":false},{"id":83,"tradeName":"CASPOFUNGIN ACETATE","activeIngredient":"Caspofungin","strength":"50mg","dosageForm":"Bột đông khô + 10,5ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 100-250ml dung dịch NaCl 0,9% (1) Truyền trong vòng 60 phút PHÒNG PHA TIÊM: Bột đông khô + 10,5ml nước cất tiêm","storage":"Dung dịch hoàn nguyên bảo quản trong vòng 24h ở nhiệt độ < 25°C Sau khi pha loãng để trong túi hoặc chai truyền TM phải dùng trong vòng 24h ở nhiệt độ 25°C, 48h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không dùng dung môi chứa GLUCOSE để pha, Dùng riêng với các thuốc khác (1)","manufacturer":"Gland Pharma Limited-Ấn Độ","notes":"","cold":true,"light":false},{"id":84,"tradeName":"CASPOFUNGIN ACETATE","activeIngredient":"Caspofungin","strength":"70mg","dosageForm":"Bột đông khô pha tiêm + 10,5ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 250ml dung dịch NaCl 0,9% (1) Truyền trong vòng 60 phút PHÒNG PHA TIÊM: Bột đông khô pha tiêm + 10,5ml nước cất tiêm","storage":"Dung dịch hoàn nguyên bảo quản trong vòng 24h ở nhiệt độ < 25°C Sau khi pha loãng để trong túi hoặc chai truyền TM phải dùng trong vòng 24h ở nhiệt độ 25°C, 48h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không dùng dung môi chứa GLUCOSE để pha, Dùng riêng với các thuốc khác (1)","manufacturer":"Gland Pharma Limited-Ấn Độ","notes":"","cold":true,"light":false},{"id":85,"tradeName":"CASPOFUNGIN NORMON","activeIngredient":"Caspofungin","strength":"70mg","dosageForm":"Bột đông khô pha tiêm + 10,5ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 250ml dung dịch NaCl 0,9% (1) Truyền trong vòng 60 phút PHÒNG PHA TIÊM: Bột đông khô pha tiêm + 10,5ml nước cất tiêm","storage":"Bảo quản lọ thuốc ở nhiệt độ 2–8°C trong bao bì gốc. Dung dịch hoàn nguyên bảo quản trong vòng 24h ở nhiệt độ 2–8°C Sau khi pha loãng để trong túi hoặc chai truyền TM 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không dùng dung môi chứa GLUCOSE để pha (1) Không trộn hoặc truyền chung với bất kỳ thuốc nào khác (1)","manufacturer":"Laboratorios Normon, S.A - Spain","notes":"","cold":true,"light":false},{"id":86,"tradeName":"CASPOFUNGIN SANDOZ","activeIngredient":"Caspofungin","strength":"50mg","dosageForm":"Bột đông khô pha tiêm + 10,5ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 100-250ml dung dịch NaCl 0,9% (1) Truyền trong vòng 60 phút PHÒNG PHA TIÊM: Bột đông khô pha tiêm + 10,5ml nước cất tiêm","storage":"Dung dịch hoàn nguyên bảo quản trong vòng 24h ở nhiệt độ < 25°C Sau khi pha loãng để trong túi hoặc chai truyền TM phải dùng trong vòng 24h ở nhiệt độ 25°C, 48h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không dùng dung môi chứa GLUCOSE để pha (1)","manufacturer":"BAG Health Care GmbH - Đức","notes":"","cold":true,"light":false},{"id":87,"tradeName":"CEFAZOLINE PANPHARMA 1G","activeIngredient":"Cefazolin 1g","strength":"1g","dosageForm":"Bột pha tiêm + 2,5ml nước cất pha tiêm → dung dịch hoàn nguyên (3ml- 330mg/mL)","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch hoàn nguyên (có thể pha với lidocain 0,5%) TM: Dung dịch hoàn nguyên+ hòa loãng thêm với 5ml nước cất/NaCl 0,9%/Glucose 5% TTM: Dung dịch hoàn nguyên + pha loãng với 50 - 100ml dung môi thích hợp (NaCl 0,9%; Glucose 5%)","storage":"Dung dịch hoàn nguyên, dung dịch tiêm bảo quản ở nhiệt độ 2–8°C trong vòng 24 giờ.","incompatibilities":"","manufacturer":"Panpharma, Pháp","notes":"THUỐC TRÁNH ÁNH SÁNG. TTM gián đoạn có thể pha loãng dung môi thích hợp về nồng độ 5-40mg/mL, ở trẻ sơ sinh có thể ở nồng độ 100mg/mL","cold":false,"light":true},{"id":88,"tradeName":"CEFEME 1G","activeIngredient":"Cefepim","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB sâu: Bột tiêm + 2,4ml nước cất tiêm/NaCl 0,9%/Glucose 5%/Lidocain 1% hoặc 0,5% TM: Bột tiêm + 10ml (Nước cất tiêm, Glucose 5%, NaCl 0,9%, Ringer lactat...) (1,2) (tiêm từ 3-5 phút) (1,2) TTM: Bột tiêm + 50-100ml (Glucose 5%, NaCl 0,9%,Ringer lactat...) (2) (truyền 30 phút) (1,2) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch đã pha ổn định trong vòng 12h ở nhiệt độ 25°C, 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Tương kỵ metronidazol hay netilmicin sunfat, aminophylin (1)","manufacturer":"Công ty TNHH Medochemie (Viễn Đông)","notes":"","cold":true,"light":false},{"id":89,"tradeName":"CEFEPIME KABI","activeIngredient":"Cefepim","strength":"1g","dosageForm":"Bột pha tiêm + 10ml (nước cất pha tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 10ml (Nước cất tiêm, Glucose 5%, NaCl 0,9%, Ringer lactat,...) (1,2) (tiêm từ 3- 5 phút) (1,2) TTM: Bột tiêm + 50-100ml (Glucose 5%, NaCl 0,9%,Ringer lactat...) (2) (truyền 30 phút) (1,2) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch đã pha ổn định trong vòng 2h ở nhiệt độ 25°C (1)","incompatibilities":"Tương kỵ metronidazol hay netilmicin sunfat, aminophylin (1)","manufacturer":"LABESFAL- LABORATÓRI OS ALMINO S.A. - PORTUGAL","notes":"Không có chỉ định tiêm bắp (1)","cold":false,"light":false},{"id":90,"tradeName":"CEFOPEFAST-S 2000","activeIngredient":"Cefoperazon + Sulbactam","strength":"1g + 1g","dosageForm":"Bột pha tiêm + 6,8ml (nước cất pha tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm pha loãng thành 20 ml dung dịch pha thuốc. Tiêm ít nhất trong 3 phút (1,2) TTM: Dung dịch tiêm pha loãng với ít nhất 20 ml (Glucose 5%, NaCl 0,9%) truyền từ 15-60 phút (1,2) Nếu TTM với Ringer Lactat: Bột pha tiêm + 6,8ml nước cất tiêm, sau đó pha loãng với 200 ml dung dịch Ringer Lactate (1)","storage":"Dung dịch sau pha bảo quản trong vòng 8h ở nhiệt độ ≤ 25°C hoặc trong vòng 12h ở nhiệt độ 2–8°C.","incompatibilities":"Dùng riêng với Aminoglycosid","manufacturer":"Công ty cổ phần dược phẩm Tenamyd","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":true,"light":false},{"id":91,"tradeName":"CEFOPERAZONE ABR 1G","activeIngredient":"Cefoperazon","strength":"1g","dosageForm":"Bột pha tiêm + 5ml (nước cất pha tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột pha tiêm + 2,6 ml nước cất → lắc đều để bột tan hết + 0,9 ml lidocain 2% → 4ml dung dịch 250 mg/ml (1) TM: Dung dịch tiêm pha thành 10ml với nước cất pha tiêm (1) TTM: Dung dịch tiêm + 20 - 100ml (dung dịch NaCl 0,9%, Glucose 5%) (thời gian truyền từ 15-60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 5ml nước cất tiêm","storage":"Dung dịch tiêm sau khi pha bảo quản trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với Aminoglycosid (2)","manufacturer":"Balkanpharma- Razgrad AD- Bulgari","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":true,"light":false},{"id":92,"tradeName":"CEFTAZIDIM GERDA 1G","activeIngredient":"Ceftazidim","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 4ml nước cất tiêm. (1,2) TM: Bột tiêm + 10ml (Nước cất tiêm, Glucose 5%, NaCl 0,9%) (1,2,4,5) (tiêm từ 3-5 phút) (1,5) TTM: Bột tiêm + 50-100ml (Glucose 5%, NaCl 0,9%) (truyền từ 20-30 phút) (1,2,5) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha loãng có thể bảo quản trong vòng 8h ở nhiệt độ phòng, 24h ở nhiệt độ 2–8°C (1,2)","incompatibilities":"Không được pha thuốc vào dung dịch Natri bicarbonate (1,2) Dùng riêng với Vancomycin, Aminoglycosid, Metronidazol (2)","manufacturer":"LDP. LABORATORI OS TORLAN- SPAIN","notes":"","cold":false,"light":false},{"id":93,"tradeName":"CEFTAZIDIME EG","activeIngredient":"Ceftazidim","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 3ml nước cất tiêm. (1) TM: Bột tiêm + 10ml (Nước cất tiêm, Glucose 5%, NaCl 0,9%) (1,2,5) (tiêm từ 3-5 phút) (1,5) TTM: Bột tiêm + 100ml (Glucose 5%, NaCl 0,9%) (truyền từ 20-30 phút) (1,2,5) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha loãng ổn định trong vòng 24h ở nhiệt độ < 25°C, 7 ngày ở nhiệt độ 2–8°C (1)","incompatibilities":"Không được pha thuốc vào dung dịch Natri bicarbonate (1,2) Dùng riêng với Vancomycin, Aminoglycosid, Metronidazol (1,2)","manufacturer":"CTCP PYMEPHARC O-VN","notes":"","cold":true,"light":false},{"id":94,"tradeName":"CEFTRIAXON STRAGEN","activeIngredient":"Ceftriaxon","strength":"2g","dosageForm":"Bột pha tiêm","routes":["TTM"],"reconstitution":"TTM: Bột tiêm + 40ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút) (1)","storage":"Dung dịch pha tiêm TM sau khi pha ổn định trong vòng 12h ở nhiệt độ phòng, 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không được pha với các dung dịch thuốc chứa Canxi khác (dung dịch Ringer,…). Dủng riêng với Aminoglycosid, Vancomycin, Fluconazol (2)","manufacturer":"MITIM S.R.L- Ý","notes":"Liều tiêm TM >1g chỉ nên truyền TM (1,2)","cold":true,"light":false},{"id":95,"tradeName":"CEFTRIAXONE 1000","activeIngredient":"Ceftriaxon","strength":"1g","dosageForm":"Bột pha tiêm + 10 ml (nước cất pha tiêm, Glucose 5%, NaCl 0,9%) → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm (tiêm 2-4 phút) (1,2,5) TTM: Dung dịch tiêm + 50-100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút) (1,2) PHÒNG PHA TIÊM: Bột tiêm + 10 ml nước cất tiêm","storage":"Dung dịch pha tiêm tĩnh mạch bảo quản trong vòng 8h ở nhiệt độ 2–8°C. (1) Nên dùng dung dịch mới pha (2)","incompatibilities":"Không sử dụng dung dịch pha loãng có chứa calci (Ringer lactat, Hartmann Không pha lẫn với Aminoglycoside, Amsacrine, Vancomycin, Fluconazol (1)","manufacturer":"Công ty Cổ phần Dược phẩm Tenamyd","notes":"Liều tiêm TM >1g chỉ nên truyền TM (1,2)","cold":false,"light":false},{"id":96,"tradeName":"CEFTRIAXONE 1G","activeIngredient":"Ceftriaxon","strength":"1g","dosageForm":"Bột pha tiêm + 10 ml nước cất pha tiêm → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm (tiêm 2-4 phút) TTM: Dung dịch tiêm + 40ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10 ml nước cất tiêm","storage":"Dung dịch tiêm tĩnh mạch ổn định trong vòng 3 ngày ở nhiệt độ 25°C, 10 ngày ở nhiệt độ 4°C (1)","incompatibilities":"Không nên pha trộn Ceftriaxione với các dung dịch thuốc chứa Canxi khác (dung dịch Ringer,…), Aminoglycosid, Vancomycin, Fluconazol (2)","manufacturer":"Công ty CPDP Minh Dân","notes":"Có thể pha loãng dung dịch ceftriaxon thành 50-100ml với (NaCl 0,9%, Glucose 5%) để TTM (2,5) Liều tiêm TM >1g chỉ nên truyền TM (1,2)","cold":false,"light":false},{"id":97,"tradeName":"CEFTRIAXONE EG","activeIngredient":"Ceftriaxon","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm +10ml nước cất tiêm (tiêm từ 2- 4 phút) (1) (5) TTM: 2g bột tiêm + 40ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút) (1) (5) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch tiêm tĩnh mạch ổn định trong vòng 2 ngày ở nhiệt độ phòng < 25°C, 10 ngày ở nhiệt độ (4°C) (1) Nên dùng dung dịch mới pha (1,2)","incompatibilities":"Không được pha với các dung dịch thuốc chứa Canxi khác (dung dịch Ringer,…). Dủng riêng với Aminoglycosid, Vancomycin, Fluconazol (2)","manufacturer":"CTCP PYMEPHARC O-VN","notes":"Có thể pha loãng dung dịch ceftriaxon thành 50-100ml với (NaCl 0,9%, Glucose 5%) để TTM (2,5) Liều tiêm TM >1g chỉ nên truyền TM (1,2)","cold":false,"light":false},{"id":98,"tradeName":"CEFTRIONE 1G","activeIngredient":"Ceftriaxon","strength":"1g","dosageForm":"Bột pha tiêm + 10 ml nước cất pha tiêm, Glucose 5%, NaCl 0,9%) → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm (tiêm từ 2-4 phút) (1,2) TTM: Dung dịch tiêm + 50-100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút) (1,2) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch tiêm tĩnh mạch ổn định trong vòng 3 ngày ở nhiệt độ phòng, 10 ngày ở nhiệt độ 4°C (1)","incompatibilities":"Không được pha với các dung dịch thuốc chứa Canxi khác (dung dịch Ringer,…). Dủng riêng với Aminoglycosid, Vancomycin, Fluconazol (2)","manufacturer":"CTCP DƯỢC- TTBYT BÌNH ĐỊNH- VN","notes":"Liều tiêm TM >1g chỉ nên truyền TM (1,2)","cold":false,"light":false},{"id":99,"tradeName":"CEPEMID 1G","activeIngredient":"Imipenem + Cilastatin","strength":"500mg + 500mg","dosageForm":"Bột pha tiêm + 10 ml (NaCl 0.9%, Glucose 5%,...), lắc kỹ, thêm tiếp 10 ml dung môi trên, lắc kỹ để đảm bảo thuốc đã tan hoàn toàn → dung dịch tiêm (1)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm chuyển vào lọ chứa vừa đủ 100 - 200ml dịch truyền (NaCl 0,9%, Glucose 5%), tương đương với nồng độ 2,5mg/ml đến 5mg/ml (1) (truyền trong khoảng 30 - 60 phút) (1) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h.","storage":"Dung dịch sau khi pha loãng ổn định trong vòng 4h ở nhiệt độ 25°C và 24h ở nhiệt độ 4°C (1)","incompatibilities":"Dùng riêng với các kháng sinh khác, nếu dùng đồng thời với aminoglycosid thì tiêm ở vị trí khác nhau (1,2)","manufacturer":"Công ty CPDP Minh Dân-VN","notes":"Đảm bảo thuốc đã tan hoàn toàn trước khi truyền (1,2) Nếu có buồn nôn và/hoặc nôn trong khi dùng thuốc, giảm tốc độ truyền (1)","cold":false,"light":false},{"id":100,"tradeName":"CERAAPIX","activeIngredient":"Cefoperazon","strength":"1g","dosageForm":"Bột pha tiêm + 5ml nước cất tiêm → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột pha tiêm + 2,8 ml nước cất → lắc đều để bột tan hết + 1ml lidocain 2% → 4ml dung dịch 250 mg/ml (1) TM: Dung dịch tiêm pha thành 10ml với nước cất tiêm (1) TTM: Dung dịch tiêm + 20 - 40ml (dung dịch NaCl 0,9%, Glucose 5%) (thời gian truyền từ 15-30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 5ml nước cất tiêm","storage":"Bảo quản < 30°C. Tránh ánh sáng.","incompatibilities":"Dùng riêng với Aminoglycosid (2)","manufacturer":"Công ty cổ phần Pymepharco- VN","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":false,"light":true},{"id":101,"tradeName":"CERNEVIT","activeIngredient":"Vitamin A + Vitamin D3 + Tocoferol + Vitamin B1 + Vitamin B2 + Vitamin B6 + Vitamin B12 + Folic Acid + Dexpanthenol + Biotin + Vitamin PP + Glycine + Glycocholic acid + Lecithin","strength":"3500IU + 220IU + 10,2mg + 3,51mg + 4,14mg + 4,53mg + 0,006mg + 0,414mg + 16,15mg + 0,069mg + 46mg + 250mg + 140mg","dosageForm":"Bôt đông khô pha tiêm, dùng đường tĩnh mạch","routes":["TTM","TM"],"reconstitution":"TM: Bột đông khô + 5ml nước cất tiêm à Dung dịch tiêm. Tiêm chậm ít nhất 10 phút (1) TTM: Dung dịch tiêm pha loãng NaCl 0,9%, Glucose 5% với lượng thích hợp (1)","storage":"Bảo quản < 30°C, tránh ánh sáng. Hủy thuốc dư không sử dụng ngay (1)","incompatibilities":"Dùng riêng với một số kháng sinh đã ghi nhận tương kỵ với vitamin. (1)","manufacturer":"PIERRE FABRE MEDICAMENT -PHÁP","notes":"CERNEVIT có thể được bơm vào hỗn hợp dinh dưỡng đường tĩnh mạch kết hợp carbohydrat, lipid, amino acid, chất điện giải và những nguyên tố vi lượng với điều kiện đã kiểm tra về tính tương hợp và tính ổn định.","cold":false,"light":true},{"id":102,"tradeName":"CHEMACIN","activeIngredient":"Amikacin*","strength":"500mg/ 2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm TTM: - Đối với người lớn: Dung dịch tiêm+ 100- 200ml dung dịch (Glucose 5%, NaCl 0,9%) (truyền từ 30-60 phút) (1) - Đối với trẻ em: Thể tích phụ thuộc vào nhu cầu người bệnh nhưng phải đủ để truyền trong 1-2 giờ (trẻ nhỏ), 30-60 phút (trẻ lớn) (1,2). Dung dịch tiêm truyền đạt nồng độ tối đa 10mg/ml (6)","storage":"Dung dịch sau khi mở ống phải dùng ngay.","incompatibilities":"Dùng riêng với kháng sinh khác (1)","manufacturer":"Laboratorio Farmaceuticao C.T.s.r.l- Italy","notes":"","cold":false,"light":false},{"id":103,"tradeName":"CIPREMI RTU","activeIngredient":"Remdesivir","strength":"100mg/20ml","dosageForm":"Dung dịch pha truyền tĩnh mạch","routes":["TTM"],"reconstitution":"TTM: Dung dịch pha tiêm + vừa đủ 100–250 mL NaCl 0.9%, truyền trong 30 – 120 phút (1).","storage":"Thuốc bảo quản trong tủ lạnh 2–8°C. Thuốc chưa mở nắp có thể bảo quản trong vòng 12h ở nhiệt độ phòng. Dung dịch sau pha loãng ổn định trong vòng 24h ở 20–25°C hoặc 48h ở 2–8°C (1)","incompatibilities":"Tính tương kỵ với các thuốc khác chưa được biết nên dùng riêng với các thuốc (1)","manufacturer":"CIPLA LTD. - Ấn Độ","notes":"","cold":true,"light":false},{"id":104,"tradeName":"CIPROBAY 200MG/100ML","activeIngredient":"Ciprofloxacin lactate 200mg/100ml","strength":"200mg/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền trong hơn 60 phút (truyền chậm qua tĩnh mạch lớn nguy cơ kích thích tĩnh mạch như châm chích nóng đau, đỏ, sưng)","storage":"Dung dịch trong suốt hoặc vàng bảo quản nhiệt độ phòng (không bảo quản trong tủ lạnh vì nguy cơ bị kết tinh). Nên sử dụng ngay sau khi mở nắp (độ bền hoá học có thể được 14 ngày khi bảo quản nhiệt độ thường tuy nhiên không đảm bảo độ an toàn vi sinh)","incompatibilities":"Dung dịch tiêm truyền Ciprofloxacin có pH từ 3,9- 4,5 không được trộn với các thuốc có pH cao (Penicillin, Heparin, Clindamycin...)","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":true,"light":true},{"id":105,"tradeName":"CIPROBID","activeIngredient":"Ciprofloxacin","strength":"400 mg/200 ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền, truyền trong 60 phút (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng, tránh đông lạnh (1) PHÒNG PHA TIÊM: 24h ở 2–8°C","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"S.C. Infomed Fluids S.R.L","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":true,"light":true},{"id":106,"tradeName":"CIPROFLOXACIN","activeIngredient":"Ciprofloxacin","strength":"200mg/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: - Đối với người lớn: Truyền trong 30 phút (1) - Đối với trẻ em: 60 phút (1,2)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng, tránh đông lạnh. PHÒNG PHA TIÊM: 24h ở 2–8°C","incompatibilities":"Dung dịch tiêm truyền Ciprofloxacin có pH từ 3,9-4,5 dùng riêng với các thuốc có pH cao (Penicillin, Heparin, Amoxicillin,Clindamyc in, Aminophyllin) (1)","manufacturer":"Công ty CPDP Minh Dân-VN","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":true,"light":true},{"id":107,"tradeName":"CIPROFLOXACIN KABI","activeIngredient":"Ciprofloxacin","strength":"200 mg/100 ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền - Đối với người lớn: Truyền trong 30 phút. - Đối với trẻ em: Truyền trong 60 phút (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng, tránh đông lạnh. PHÒNG PHA TIÊM: 24h ở 2–8°C","incompatibilities":"Dung dịch tiêm truyền Ciprofloxacin có pH từ 3,9-4,5 nên dùng riêng với các thuốc có pH cao (Penicillin, Heparin) (1)","manufacturer":"FRESENIUS KABI BIDIPHAR-VN","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":true,"light":true},{"id":108,"tradeName":"CIPROFLOXACIN POLPHARMA","activeIngredient":"Ciprofloxacin","strength":"400 mg/200 ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: - Đối với người lớn: Truyền trong 60 phút (1) - Đối với trẻ em và trẻ vị thành niên: 5 -10 mg/kg/ngày, truyền từ 30-60 phút (2)","storage":"Dung dịch truyền Ciprofloxacin khi pha với dung dịch Glucose 5%, NaCl 0,9% ổn định trong vòng 28 ngày ở nhiệt độ phòng (1) PHÒNG PHA TIÊM: 24h ở 2–8°C","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"PHARMACEU TICAL WORKS POLPHARMA S.A- BA LAN","notes":"Dung dịch truyền Ciprofloxacin bảo quản tránh ánh sáng, chỉ được lấy ra khỏi bao bì khi sử dụng. (1) Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":true,"light":true},{"id":109,"tradeName":"CITOPCIN INJECTION 400NG/200ML","activeIngredient":"Ciprofloxacin","strength":"400 mg/200 ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: - Đối với người lớn: Truyền trong 60 phút (1) - Đối với trẻ em và trẻ vị thành niên: 5 -10 mg/kg/ngày, truyền từ 30-60 phút (2)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng, tránh đông lạnh. Thuốc sau khi mở nắp nên sử dụng ngay (1) PHÒNG PHA TIÊM: 24h ở 2–8°C","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"CJ HEALTHCARE CORPORATIO N- KOREA","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":true,"light":true},{"id":110,"tradeName":"CLINDACINE 600","activeIngredient":"Clindamycin","strength":"600mg/4ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TTM: Dung dịch tiêm + 50ml NaCl 0,9%, Glucose 5%. Truyền trong 20-60 phút (1,2) (Phải pha loãng dung dịch tiêm khi truyền tĩnh mạch) (1)","storage":"Dung dịch sau khi pha bảo quản trong vòng 24h (1)","incompatibilities":"Dùng riêng với Ampicillin, barbiturate, Aminophylline, Magnesi sulphate… (1)","manufacturer":"Cty CP DP Vĩnh Phúc","notes":"Liều tiêm bắp không được lớn hơn 600mg Không dùng > 1200 mg/lần trong 1 giờ","cold":false,"light":false},{"id":111,"tradeName":"CLINDAMYCIN 300MG/2ML","activeIngredient":"Clindamycin","strength":"300mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TTM: Dung dịch tiêm + 50ml NaCl 0,9%, Glucose 5%, truyền trong 10-60 phút (1,2)","storage":"Dung dịch sau khi pha bảo quản trong vòng 24h ở nhiệt độ < 30°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Công ty CPDP Minh Dân","notes":"Liều tiêm bắp không được lớn hơn 600mg Không dùng > 1200 mg/lần trong 1 giờ (1)","cold":false,"light":false},{"id":112,"tradeName":"CLINDAMYCIN- HAMELH 150MG/ML INJECTION","activeIngredient":"Clindamycin","strength":"150mg/ml- ống 4ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TTM: Dung dịch tiêm + 50-100ml NaCl 0,9%, Glucose 5%. Truyền trong 20-60 phút (1,2) (Phải pha loãng dung dịch tiêm khi truyền tĩnh mạch) (1)","storage":"Dung dịch sau khi pha bảo quản trong vòng 24h ở nhiệt độ 2–8°C (5)","incompatibilities":"Dùng riêng với Ampicillin, barbiturate, Aminophylline, Magnesi sulphate… (1)","manufacturer":"Siegfried Hameln GmbH- ĐỨC","notes":"Liều tiêm bắp không được lớn hơn 600mg Không dùng > 1200 mg/lần trong 1 giờ (1,2)","cold":true,"light":false},{"id":113,"tradeName":"COLIREX","activeIngredient":"Colistimethat natri","strength":"1MUI (80mg)","dosageForm":"Bột đông khô pha tiêm + 5ml dung môi NaCl 0,9% → dung dịch hoàn nguyên","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch hoàn nguyên TM: Dung dịch hoàn nguyên+ 5ml NaCl 0,9% (tiêm chậm trong 5 phút) (5) TTM: Dung dịch hoàn nguyên+ 100ml NaCl 0,9% (truyền trong 30 phút) (5) Phun khí dung: Bột đông khô pha tiêm + 2- 4ml dung dịch NaCl 0,9% (5) PHÒNG PHA TIÊM: Bột tiêm + 5ml dung dịch NaCl 0,9%","storage":"Dung dịch sau khi pha được bảo quản ở nhiệt độ 2–8°C trong vòng 24h (1)","incompatibilities":"","manufacturer":"CTCP DƯỢC- TTBYT BÌNH ĐỊNH- VN","notes":"Hủy thuốc dư không sử dụng ngay","cold":true,"light":false},{"id":114,"tradeName":"COLISODI 1,0 MIU","activeIngredient":"Colistimethat natri","strength":"1MUI (80mg)","dosageForm":"Bột đông khô pha tiêm + 10ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch hoàn nguyên TTM: Dung dịch hoàn nguyên+ 50ml NaCl 0,9% (truyền trong 30 phút) (1) Phun khí dung: Bột đông khô pha tiêm + 2- 4ml dung dịch NaCl 0,9% (1) (5) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất pha tiêm","storage":"Dung dịch hoàn nguyên bảo quản trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không được trộn lẫn với các thuốc khác (1)","manufacturer":"Công ty Cổ phần Dược phẩm An Thiên","notes":"Dung dịch sau pha nên dùng ngay, chỉ dùng 1 lần duy nhất và loại bỏ phần thừa (1)","cold":true,"light":false},{"id":115,"tradeName":"COLISODI 4,5MIU","activeIngredient":"Colistimethat natri","strength":"4,5 MIU","dosageForm":"Bột đông khô pha tiêm + 10ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch hoàn nguyên TTM: Dung dịch hoàn nguyên+ 50ml NaCl 0,9% (truyền trong 30 phút) (1) Phun khí dung: Bột đông khô pha tiêm + 2- 4ml dung dịch NaCl 0,9% (1) (5) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất pha tiêm","storage":"Dung dịch hoàn nguyên bảo quản trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không được trộn lẫn với các thuốc khác (1)","manufacturer":"Công ty Cổ phần Dược phẩm An Thiên","notes":"Dung dịch sau pha nên dùng ngay, chỉ dùng 1 lần duy nhất và loại bỏ phần thừa (1)","cold":true,"light":false},{"id":116,"tradeName":"COLISTIMED","activeIngredient":"Colistimethat natri","strength":"1MUI (80mg)","dosageForm":"Bột đông khô pha tiêm + 5ml nước cất pha tiêm → dung dịch hoàn nguyên","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch hoàn nguyên (1) TM: Dung dịch hoàn nguyên pha với dung dịch NaCl 0,9% đến 10ml (tiêm chậm 5 phút) (1) TTM: Dung dịch hoàn nguyên + 50ml NaCl 0,9% (truyền trong 60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 5ml nước cất pha tiêm","storage":"Dung dịch sau khi pha được bảo quản ở nhiệt độ 2–8°C trong vòng 24h","incompatibilities":"Việc thêm các kháng sinh khác vào dung dịch Colistimethatnatri có thể làm kết tủa. Vì vậy dùng riêng với các thuốc khác (1)","manufacturer":"Công ty TNHH SXDP Medlac Pharma Italy- VN","notes":"","cold":true,"light":false},{"id":117,"tradeName":"COLISTIN 1 MIU","activeIngredient":"Colistimethat natri","strength":"1MUI","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 1ml nước cất tiêm (1) TM: Bột tiêm + 10ml (nước cất tiêm, NaCl 0,9%) →dung dịch tiêm (tiêm chậm 5 phút) (1) TTM: Bột tiêm + 10ml (nước cất tiêm, NaCl 0,9%) → dung dịch tiêm pha loãng với 50ml dung dịch NaCl 0,9% (truyền trong 30-60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml NaCl 0.9%","storage":"Dung dịch hoàn nguyên được bảo quản ở nhiệt độ 2–8°C trong vòng 24h (1)","incompatibilities":"Không dùng chung với các thuốc khác (1)","manufacturer":"CN Cty CPDP Imexpharm- Nhà máy công nghệ cao Bình Dương-VN","notes":"Dung dịch sau khi pha loãng nên sử dụng ngay Thuốc chỉ dùng một lần, loại bỏ phần thừa","cold":true,"light":false},{"id":118,"tradeName":"COLISTIN 2 MIU","activeIngredient":"Colistimethat natri","strength":"2MUI","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 2ml nước cất tiêm (1) TM: Bột tiêm + 10ml (nước cất tiêm, NaCl 0,9%) →dung dịch tiêm (tiêm chậm 5 phút) (1) TTM: Bột tiêm + 10ml (nước cất tiêm, NaCl 0,9%) → dung dịch tiêm pha loãng với 50ml dung dịch NaCl 0,9% (truyền trong 60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml NaCl 0.9%","storage":"Dung dịch hoàn nguyên được bảo quản ở nhiệt độ 2–8°C trong vòng 24h (2)","incompatibilities":"Không dùng chung với các thuốc khác (1)","manufacturer":"CN Cty CPDP Imexpharm- Nhà máy công nghệ cao Bình Dương-VN","notes":"Dung dịch sau khi pha loãng nên sử dụng ngay","cold":true,"light":false},{"id":119,"tradeName":"COLISTIN TZF","activeIngredient":"Colistimethat natri","strength":"1MUI","dosageForm":"Bột đông khô pha tiêm + 2ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch hoàn nguyên + nước cất tiêm hoặc NaCl 0,9% vừa đủ 5ml (1) TM: Dung dịch hoàn nguyên + NaCl 0,9% vừa đủ 10ml (tiêm ít nhất 5 phút) (1) TTM: Dung dịch hoàn nguyên + NaCl 0,9% vừa đủ 50-100ml (truyền trong 30 phút) (1) Phun khí dung: Bột đông khô pha tiêm + 2- 4ml dung dịch NaCl 0,9% (1) (5) PHÒNG PHA TIÊM: Bột tiêm + 2ml nước cất pha tiêm","storage":"Dung dịch sau khi pha được bảo quản ở nhiệt độ 2–8°C trong vòng 24h (1)","incompatibilities":"Việc thêm các kháng sinh khác vào dung dịch Colistimethatnatri có thể làm kết tủa. Vì vậy không trộn lẫn với các thuốc khác (1)","manufacturer":"Tarchomin Pharmaceutical Works “Polfa” S.A.","notes":"Không được tiêm vào tủy sống hay tâm thất","cold":true,"light":false},{"id":120,"tradeName":"COMOPAS","activeIngredient":"Colistimethat natri","strength":"4,5 MIU","dosageForm":"Bột đông khô pha tiêm + 2ml nước cất pha tiêm → dung dịch hoàn nguyên","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch hoàn nguyên TM: Dung dịch hoàn nguyên + NaCl 0,9% vừa đủ 10ml (tiêm trong 3-5 phút) TTM: Dung dịch hoàn nguyên + NaCl 0,9% vừa đủ 100ml (truyền trong 30 phút) (1,2) PHÒNG PHA TIÊM: Bột tiêm + 2ml nước cất pha tiêm","storage":"Dung dịch sau khi pha bảo quản trong vòng 8h ở nhiệt độ ≤ 25°C và 24h ở 2–8°C (1)","incompatibilities":"Không dùng chung với aminoglycoside và polymyxin Tránh sử dụng đồng thời natri cephalothin (1)","manufacturer":"Ildong Pharmaceutical Co., Ltd.","notes":"","cold":true,"light":false},{"id":121,"tradeName":"CORDARONE 150MG/3ML","activeIngredient":"Amiodaron","strength":"150mg/ 3ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dùng 2 ống dung dịch tiêm Cordaron (hoặc 5mg/kg) + 20 ml Glucose 5% (1) TTM: (Khi dùng qua đường tĩnh mạch trung tâm) (1) Truyền tấn công nhanh hoặc truyền bổ sung: 3ml Amiodaron + 100 ml Glucose 5%. Truyền tấn công chậm và truyền duy trì: 18 ml Amiodaron + 500 ml Glucose 5% Truyền duy trì tiếp theo: 3 ml Amiodaron + 20 - 150 ml Glucose 5% (đạt nồng độ 1 - 6 mg/ml) (2,4)","storage":"Bảo quản thuốc ở nhiệt độ 2–8°C. Sau khi mở ống thuốc phải dùng ngay (1)","incompatibilities":"Không được pha với dung dịch NaCl 0,9%","manufacturer":"SANOFI WINTHROP INDUSTRIE - PHÁP","notes":"Chỉ được dùng qua đường tĩnh mạch, pha loãng với dung dịch Glucose 5%. Chỉ sử dụng hệ thống ống tiêm và truyền dịch bằng thuỷ tinh và Polyolefins, PVC không có DEHP (1)","cold":true,"light":false},{"id":122,"tradeName":"CRAVIT IV 250MG/50ML","activeIngredient":"Levofloxacin","strength":"250mg/50ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (truyền ít nhất 60 phút) (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 25°C, tránh ánh sáng. Sau khi lấy ra khỏi hộp, để trong điều kiện ánh sáng trong nhà tối đa là 3 ngày. Không để trong tủ lạnh hoặc làm đông lạnh Thuốc phải được sử dụng trong vòng 3h sau khi chọc thủng nút cao su (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch heparin, các dung dịch kiềm khác (Natri hydro carbonat) (1)","manufacturer":"OLIC (Thailand) Limited-THÁI LAN","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":true,"light":true},{"id":123,"tradeName":"CRAVIT IV 750MG/150ML","activeIngredient":"Levofloxacin","strength":"750mg/ 150ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (truyền ít nhất 90 phút) (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 25°C, tránh ánh sáng. Sau khi lấy ra khỏi hộp, để trong điều kiện ánh sáng trong nhà tối đa là 3 ngày. Không để trong tủ lạnh hoặc làm đông lạnh Thuốc phải được sử dụng trong vòng 3h sau khi chọc thủng nút cao su (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch heparin, các dung dịch kiềm khác (Natri hydro carbonat) (1)","manufacturer":"DAIICHI- SANKYO (NHẬT BẢN)- THÁI LAN","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":true,"light":true},{"id":124,"tradeName":"CUBICIN","activeIngredient":"Daptomycin","strength":"500mg","dosageForm":"Bột đông khô pha tiêm + 10ml NaCl 0,9% → dung dịch hoàn nguyên","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch hoàn nguyên (tiêm trong khoảng 2 phút) TTM: Dung dịch hoàn nguyên+ 50ml NaCl 0,9% (truyền trong vòng 30 phút) (1)","storage":"Dung dịch thuốc sau khi pha loãng ổn định trong túi dịch truyền 12h ở nhiệt độ phòng, 48h ở nhiệt độ 2–8°C.","incompatibilities":"Không được pha với dung dịch chứa Glucose (1)","manufacturer":"LABORATOIR ES MERCK SHARP&DOH M - PHÁP","notes":"Để giảm thiểu hiện tượng tạo bọt, tránh lắc mạnh lọ thuốc trong và sau khi pha","cold":false,"light":false},{"id":125,"tradeName":"CUROSURF 120MG/1,5ML","activeIngredient":"Poractant alfa","strength":"120mg/1,5ml","dosageForm":"Hỗn dịch bơm vào ống nội khí quản","routes":["TTM"],"reconstitution":"Lấy ra khỏi tủ lạnh làm ấm nhiệt độ phòng, lật chai ngược cho đồng đều (Màu sắc nên là trắng hoặc trắng kem), không lắc (tránh tạo bọt khí). Rút thuốc ra ống tiêm. Curosurf có thể sử dụng theo các cách sau: -Ngắt kết nối bệnh nhi với máy thở -Không ngắt kết nối bệnh nhi với máy thở -Sử dụng kĩ thuật đặt nội khí quản— bơm chất diện hoạt phôi— rút nội khí quan và thông khí áp lực dương không xâm lấn CPAP (kĩ thuật INSURE)","storage":"Bảo quản thuốc ở nhiệt độ 2–8°C, tránh ánh sáng. Không sử dụng lượng dư thừa sau lần rút đầu tiên ở lọ thuốc. Lọ đã làm ấm về nhiệt độ phòng nhưng chưa mở nắp, chưa sử dụng trong vòng 24 giờ có thể cho lại vào tủ lạnh bảo quản đề sử dụng tiếp (không quá 1 lần)","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":true,"light":true},{"id":126,"tradeName":"CYMEVENE 500MG","activeIngredient":"Ganciclovir sodium*","strength":"500mg","dosageForm":"Bột đông khô pha tiêm + 10ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 50 - 100ml dung dịch (Glucose 5%, NaCl 0,9%). (nồng độ dịch truyền ≤ 10mg/ml được khuyến cáo) (1,4,5) Thời gian truyền > 60 phút (1,4,5)","storage":"Dung dịch hoàn nguyên bảo quản trong vòng 12h ở nhiệt độ 15–25°C, không nên để lạnh (1) Dung dịch truyền Cymeven sau khi pha nên sử dụng trong vòng 24h. Dung dịch truyền nên được để lạnh, tránh đông lạnh (1)","incompatibilities":"Dùng riêng với các thuốc tiêm tĩnh mạch khác (1).","manufacturer":"F.HOFFMANN- LA ROCHE LTD.-THỤY SĨ","notes":"Chỉ được truyền tĩnh mạch. Tránh hít hoặc tiếp xúc trực tiếp chất bột trong lọ Cymeve, hoặc tiếp xúc trực tiếp dung dịch sau khi pha với da hoặc màng nhầy. Nếu có tiếp xúc với da rửa kỹ với xà phòng và nước, tiếp xúc với mắt rửa kỹ với nước sạch (1)","cold":true,"light":false},{"id":127,"tradeName":"DALACIN C INJ","activeIngredient":"Clindamycin phosphate","strength":"600mg/4ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm Dalacin (cần được dùng ở dạng không pha loãng) (1) TTM: Dung dịch tiêm Dalacin + 50ml NaCl 0,9%, Glucose 5%. Truyền trong 20 phút (1)","storage":"Bảo quản ống thuốc ở nhiệt độ 2–8°C. Tránh đông lạnh (1)","incompatibilities":"Dùng riêng với các thuốc khác. Không tiêm tĩnh mạch Clindamycin phosphate chưa pha loãng. (1)","manufacturer":"PFIZER -BỈ","notes":"Liều tiêm bắp không được lớn hơn 600mg Không dùng > 1200 mg/lần trong 1 giờ (1,2)","cold":true,"light":false},{"id":128,"tradeName":"DANOTAN","activeIngredient":"Phenobarbital Natri","strength":"100mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB","TDD"],"reconstitution":"TDD,TB,TM: Dung dịch tiêm (1)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với dung dịch acid vì có thể tủa Phenobarbital (1)","manufacturer":"DAI HAN PHARM- KOREAN","notes":"Bảo quản theo qui chế thuốc hướng thần","cold":false,"light":true},{"id":129,"tradeName":"DAPMYTO 350","activeIngredient":"Daptomycin","strength":"350mg","dosageForm":"Bột đông khô pha tiêm + 7ml NaCl 0,9% → dung dịch hoàn nguyên","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch hoàn nguyên (tiêm trong khoảng 2 phút) TTM: Dung dịch hoàn nguyên+ 50ml NaCl 0,9% (truyền trong vòng 30-60 phút) (1)","storage":"Dung dịch hoàn nguyên ổn định trong 12h ở 25°C, 48h ở 2–8°C Dung dịch pha loãng ổn định trong 12h ở 25°C, 24h ở 2–8°C (1)","incompatibilities":"Không được pha với dung dịch chứa Glucose (1)","manufacturer":"Công ty Cổ phần Dược phẩm An Thiên","notes":"Để giảm thiểu hiện tượng tạo bọt, tránh lắc mạnh lọ thuốc trong và sau khi pha","cold":true,"light":false},{"id":130,"tradeName":"DAYTRIX","activeIngredient":"Ceftriaxon","strength":"1g","dosageForm":"Bột pha tiêm + 10 ml nước cất pha tiêm → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm (tiêm từ 2-4 phút) (2) TTM: Dung dịch tiêm + 50-100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút) (2) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch tiêm ổn định trong vòng 6h ở nhiệt độ phòng < 25°C, 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không được pha với các dung dịch thuốc chứa Canxi khác (dung dịch Ringer,…). Dủng riêng với Aminoglycosid, Vancomycin, Fluconazol (2)","manufacturer":"Laboratorio Farmaceuticao C.T.s.r.l- Italy","notes":"Có thể pha loãng dung dịch ceftriaxon thành 50-100ml với NaCl 0,9%) để TTM (2,5) Liều tiêm TM >1g chỉ nên truyền TM (1,2)","cold":true,"light":false},{"id":131,"tradeName":"DELIVIR","activeIngredient":"Fosfomycin","strength":"2g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 20ml (nước cất tiêm, Glucose 5%) (tiêm chậm ≥ 5 phút) (1) TTM: Bột tiêm + 100-500ml (Glucose 5%, NaCl 0,9%) (truyền trong 60-120 phút) (1)","storage":"Dung dịch sau khi pha loãng ổn định trong vòng 24 giờ ở nhiệt độ < 25°C (1)","incompatibilities":"","manufacturer":"PHARBACO- VN","notes":"Chế phẩm chứa 14.5 mEq Natri ~ mỗi 1g. Thận trọng trên bệnh nhân cần giảm lượng Natri đưa vào cơ thể do suy tim, suy thận, cao huyết áp","cold":false,"light":false},{"id":132,"tradeName":"DEPO-MEDROL","activeIngredient":"Methylprednisolo n acetat","strength":"40mg/ ml","dosageForm":"Hỗn dịch tiêm","routes":["TB"],"reconstitution":"TB, Tiêm trong khớp và mô mềm: Hỗn dịch tiêm. (1)","storage":"Bảo quản ở nhiệt độ ≤ 30°C Dùng thuốc ngay sau khi mở lọ (1)","incompatibilities":"Không được pha loãng hoặc trộn với các dung dịch khác (1)","manufacturer":"Pfizer Manufacturing Belgium NV","notes":"Không được tiêm tĩnh mạch, không được tiêm nội tủy (1)","cold":false,"light":false},{"id":133,"tradeName":"DEXAMETHASON KABI 4MG/1ML","activeIngredient":"Dexamethason 4mg/1ml","strength":"4mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"Tiêm tại chỗ, TB,TM: Dung dịch tiêm (1) TTM: Dung dịch tiêm được pha loãng cho đến 50-100 ml dung dịch NaCl 0,9%, Glucose 5% (2,5)","storage":"Dung dịch sau khi pha loãng được dùng trong vòng 24h (2)","incompatibilities":"Dùng riêng với vancomycin, daunorubicin, doxorubicin","manufacturer":"Công ty Cổ phần Fresenius Kabi Bidiphar","notes":"Tiêm tại chỗ: Tiêm trong khớp, trong bao hoạt dịch, trong tổn thương mô mềm. THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":134,"tradeName":"DEXAMETHASON 4MG/1ML (VP)","activeIngredient":"Dexamethason 4mg/1ml","strength":"4mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"Tiêm tại chỗ, TB,TM: Dung dịch tiêm (1) TTM: Dung dịch tiêm được pha loãng cho đến 50-100 ml dung dịch NaCl 0,9%, Glucose 5% (2,5)","storage":"Dung dịch sau khi pha loãng được dùng trong vòng 24h (2)","incompatibilities":"Dùng riêng với vancomycin, ciprofloxacin, midazolam (2)","manufacturer":"Cty CP DP Vĩnh Phúc, Việt Nam","notes":"Tiêm tại chỗ: Tiêm trong khớp, trong bao hoạt dịch, trong tổn thương mô mềm. THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":135,"tradeName":"DEXAMETHASONE","activeIngredient":"Dexamethason natri phosphat","strength":"4mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"Tiêm tại chỗ, TB,TM: Dung dịch tiêm (1) TTM: Dung dịch tiêm được pha loãng cho đến 100 ml dung dịch NaCl 0,9%, Glucose 5% (2,5)","storage":"Bảo quản ở nhiệt độ phòng < 30°C, tránh ánh sáng. (1)","incompatibilities":"Dùng riêng với vancomycin, daunorubicin, doxorubicin, doxapram hydroclorid, glycopyrolat (1)","manufacturer":"Công ty cổ phần Dược Vật tư y tế Hải Dương","notes":"Tiêm tại chỗ: Tiêm trong khớp, trong bao hoạt dịch, trong tổn thương mô mềm","cold":false,"light":true},{"id":136,"tradeName":"DEXAMETHASONE","activeIngredient":"Dexamethason natri phosphat","strength":"4mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"Tiêm tại chỗ, TB,TM: Dung dịch tiêm (1) TTM: Dung dịch tiêm được pha loãng cho đến 100 ml dung dịch NaCl 0,9%, Glucose 5% (2,5)","storage":"Dung dịch sau khi pha loãng được dùng trong vòng 24h (2)","incompatibilities":"Dùng riêng với vancomycin, ciprofloxacin, midazolam (2)","manufacturer":"Cty CP DP Vĩnh Phúc, Việt Nam","notes":"Tiêm tại chỗ: Tiêm trong khớp, trong bao hoạt dịch, trong tổn thương mô mềm","cold":false,"light":false},{"id":137,"tradeName":"DEXAMETHASONE 4MG/ML","activeIngredient":"Dexamethason natri phosphat","strength":"4mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"Tiêm tại chỗ, TB,TM: Dung dịch tiêm (1) TTM: Dung dịch tiêm được pha loãng cho đến 100 ml dung dịch NaCl 0,9%, Glucose 5% (1,2,5)","storage":"Dung dịch sau khi pha loãng được dùng trong vòng 24h (2)","incompatibilities":"Dùng riêng với vancomycin, ciprofloxacin, midazolam (2)","manufacturer":"CTCPDP MINH DÂN- VN","notes":"Tiêm tại chỗ: Tiêm trong khớp, trong bao hoạt dịch, trong tổn thương mô mềm Không được tiêm vào vùng da bị nhiễm khuẩn (1)","cold":false,"light":false},{"id":138,"tradeName":"DIAPHYLLIN VENOSUM","activeIngredient":"Theophyllin - ethylendiamine","strength":"240 mg/ 5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm, tiêm chậm trong 5 phút. TTM: Dung dịch tiêm+ 250-500ml dung dịch (Glucose 5%, NaCl 0,9%) (1)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C.","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"GEDEON RICHTER - HUNGARY","notes":"","cold":false,"light":false},{"id":139,"tradeName":"DIAZEPAM","activeIngredient":"Diazepam","strength":"10mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm. TM: Dung dịch tiêm. Tiêm tĩnh mạch chậm, không quá 1ml/phút ở người lớn và trong khoảng 3-5 phút ở trẻ em (2) TTM: 4 ống dung dịch tiêm Diazepam được pha loãng với 500ml dung dịch (Glucose 5%, NaCl 0,9%) (không được vượt quá nồng độ 40mg/500ml) (1)","storage":"Dung dịch tiêm sau khi pha dùng trong vòng 6h (1)","incompatibilities":"Dùng riêng với các dung dịch khác hoặc thuốc khác (1)","manufacturer":"ROTEXMEDIC A-ĐỨC","notes":"Bảo quản theo qui chế thuốc hướng tâm thần Tiêm chậm, tốc độ 5mg/phút, sau đó bolus 10ml NaCl 0,9% cho 10mg Diazepam (3)","cold":false,"light":false},{"id":140,"tradeName":"DIAZEPAM","activeIngredient":"Diazepam","strength":"10mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm. TM: Dung dịch tiêm. Tiêm tĩnh mạch chậm, không quá 1 ml/phút (1) TTM: 1 ống dung dịch tiêm Diazepam được pha loãng với 200ml dung dịch (Glucose 5%, NaCl 0,9%) (5)","storage":"Dung dịch tiêm sau khi pha dùng ngay lập tức (5)","incompatibilities":"Dùng riêng với các dung dịch khác hoặc thuốc khác (1)","manufacturer":"VIDIPHAR-VN","notes":"Bảo quản theo qui chế thuốc hướng tâm thần Tiêm chậm, tốc độ 5mg/phút, sau đó bolus 10ml NaCl 0,9% cho 10mg Diazepam (3)","cold":false,"light":false},{"id":141,"tradeName":"DIAZEPAM HAMELN","activeIngredient":"Diazepam","strength":"10mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm. TM: Dung dịch tiêm. Tiêm tĩnh mạch chậm, không quá 1 ml/phút (5) TTM: 4 ống dung dịch tiêm Diazepam được pha loãng với 500ml dung dịch (Glucose 5%, NaCl 0,9%) (không được vượt quá nồng độ 40mg/500ml) (1)","storage":"Dung dịch tiêm sau khi pha dùng trong vòng 6h (1)","incompatibilities":"Dùng riêng với các dung dịch khác hoặc thuốc khác (1)","manufacturer":"HAMELN- ĐỨC","notes":"Bảo quản theo qui chế thuốc hướng thần Tiêm chậm, tốc độ 5mg/phút, sau đó bolus 10ml NaCl 0,9% cho 10mg Diazepam (3)","cold":false,"light":false},{"id":142,"tradeName":"DIAZEPAM- HAMELN 5MG/ML","activeIngredient":"Diazepam","strength":"5mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm. TM: Dung dịch tiêm. Tiêm tĩnh mạch chậm, không quá 1ml/phút ở người lớn và trong khoảng 3-5 phút ở trẻ em (2) TTM: 4 ống dung dịch tiêm Diazepam được pha loãng với 500ml dung dịch (Glucose 5%, NaCl 0,9%) (không được vượt quá nồng độ 40mg/500ml) (1)","storage":"Dung dịch tiêm sau khi pha dùng trong vòng 6h (1)","incompatibilities":"Không nên trộn hoặc pha loãng Diazepam với các dung dịch khác hoặc thuốc khác trong bơm tiêm hoặc trong chai dịch truyền (1)","manufacturer":"Siegfried Hameln GmbH","notes":"Bảo quản theo qui chế thuốc hướng tâm thần Tiêm chậm, tốc độ 5mg/phút, sau đó bolus 10ml NaCl 0,9% cho 10mg Diazepam (3)","cold":false,"light":false},{"id":143,"tradeName":"DIGOXIN/ ANFARM","activeIngredient":"Digoxin","strength":"0,5mg/2ml, Ống 2ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm được pha loãng với dung dịch (Glucose 5%, NaCl 0,9%) với một thể tích gấp 4 lần hoặc hơn (1) Truyền từ 10-20 phút","storage":"Dung dịch sau pha loãng bảo quản ở nhiệt độ 2–8°C trong vòng 24h. (1)","incompatibilities":"","manufacturer":"Anfarm hellas S.A., Hy Lạp","notes":"Pha loãng với một thể tích nhỏ hơn 8ml có thể dẫn đến kết tủa Digoxin.","cold":false,"light":false},{"id":144,"tradeName":"DIGOXIN-BFS","activeIngredient":"Digoxin","strength":"0,25mg/ml, Ống 1ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm được pha loãng với 4 - 250ml dung dịch (Glucose 5%, NaCl 0,9%) (1) Truyền từ 10-20 phút","storage":"Dung dịch sau pha loãng ổn định ở nhiệt độ phòng trong vòng 24h (1)","incompatibilities":"","manufacturer":"Công ty cổ phần Dược phẩm CPC1 Hà Nội, Việt Nam","notes":"Pha loãng với một thể tích nhỏ hơn 4ml có thể dẫn đến kết tủa Digoxin.","cold":false,"light":false},{"id":145,"tradeName":"DIMEDROL","activeIngredient":"Diphenhydramin","strength":"10mg/ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm (1)","storage":"Bảo quản ống thuốc ở nhiệt độ 15–30°C, tránh ánh sáng.","incompatibilities":"","manufacturer":"VINPHACO- VN","notes":"","cold":false,"light":true},{"id":146,"tradeName":"DIPHERELINE P.R. 11,25MG","activeIngredient":"Triptorelin 11,25mg","strength":"11,25mg","dosageForm":"Bột +dung môi kèm theo 2ml→dung dịch tiêm dạng sữa đồng nhất","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm","storage":"Dung dịch tiêm sử dụng ngay sau khi pha","incompatibilities":"","manufacturer":"Ipsen Pharma Biotech – Pháp","notes":"","cold":false,"light":false},{"id":147,"tradeName":"DIPHERELINE 0,1MG","activeIngredient":"Triptorelin 0,1mg","strength":"0,1mg","dosageForm":"Bột +dung môi →dung dịch tiêm dạng sữa đồng nhất","routes":["TDD"],"reconstitution":"TDD: Dung dịch tiêm","storage":"Dung dịch tiêm sử dụng ngay sau khi pha","incompatibilities":"","manufacturer":"Ipsen Pharma Biotech – Pháp","notes":"","cold":false,"light":false},{"id":148,"tradeName":"DIPHERELINE 3,75MG","activeIngredient":"Triptorelin 3.75mg","strength":"3.75mg","dosageForm":"Bột +dung môi kèm theo 2ml→dung dịch tiêm dạng sữa đồng nhất","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm","storage":"Dung dịch tiêm sử dụng ngay sau khi pha","incompatibilities":"","manufacturer":"Ipsen Pharma Biotech – Pháp","notes":"","cold":false,"light":false},{"id":149,"tradeName":"DIPROSPAN INJ 1ML","activeIngredient":"Betamethasone dipropionate 5mg + Betamethasone sodium phosphate 2mg","strength":"7 mg","dosageForm":"Hỗn dịch tiêm","routes":["TB"],"reconstitution":"TB, Tiêm trong khớp, trong khớp, bao hoạt dịch, trong da, trong tổn thương và mô mềm: Hỗn dịch tiêm","storage":"Không dữ liệu. Sử dụng ngay sau mở ống","incompatibilities":"","manufacturer":"Schering - Plough Labo N.V.","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":150,"tradeName":"DOBUTAMIN -HAMELN 12,5MG/ML","activeIngredient":"Dobutamin","strength":"250mg/20ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Pha ≥50 ml hoặc hơn với dung dịch NaCl 0,9%, Glucose 5% (1)","storage":"Dung dịch đã pha phải được dùng trong vòng 24h, bảo quản ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác.","manufacturer":"HAMELN- ĐỨC","notes":"","cold":true,"light":false},{"id":151,"tradeName":"DOBUTAMIN -HAMELN 5MG/ML","activeIngredient":"Dobutamin","strength":"250mg/50ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM Dùng cho bơm tiêm: Dung dịch tiêm truyền Dùng trong hệ thống tiêm truyền: Pha loãng với một thể tích ít nhất 50 ml hoặc hơn với dung dịch NaCl 0,9%, Glucose 5% (1)","storage":"Dung dịch sau khi pha phải được dùng trong vòng 24h, bảo quản ở nhiệt độ 2–8°C (1)","incompatibilities":"Dobutamin tương kỵ Natri carbonat 5% và các dung dịch kiềm mạnh khác. Dùng riêng với các thuốc khác.","manufacturer":"Siegfried Hameln GmbH- ĐỨC","notes":"","cold":true,"light":false},{"id":152,"tradeName":"DOPAMINE HYDROCHLORIDE","activeIngredient":"Dopamin HCl","strength":"40 mg/ml Ống 5ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM: 5ml dung dịch tiêm + 250-500 ml dung dịch NaCl 0.9%, Glucose 5% (2)","storage":"Dung dịch sau khi pha phải dùng ngay (1)","incompatibilities":"Không được pha với các dung dịch kiềm","manufacturer":"ROTEXMEDIC A-ĐỨC","notes":"Truyền tĩnh mạch sau khi pha loãng","cold":false,"light":false},{"id":153,"tradeName":"DOPAMINE HYDROCHLORIDE 4%","activeIngredient":"Dopamin HCl","strength":"40 mg/ml Ống 5ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Pha loãng 400mg đến 800mg Dopamin (2 đến 4 ống) vào 250ml dung dịch NaCl 0.9%, Glucose 5% (1)","storage":"Dung dịch sau khi pha phải dùng trong vòng 24h.","incompatibilities":"Không được pha với các dung dịch kiềm (2)","manufacturer":"WARSAW PHARMACEU TICAL WORKS POLFA S.A. - BALAN","notes":"Truyền tĩnh mạch sau khi pha loãng","cold":false,"light":false},{"id":154,"tradeName":"DURATOCIN 100ΜG","activeIngredient":"Carbetocin 100µg/ml","strength":"100µg/ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB: Dung dịch tiêm (chỉ nên tiêm trong trường hợp sinh ngã âm đạo) TM: Tiêm chậm trên 1 phút (sinh ngã âm đạo/ mổ lấy thai)","storage":"Dung dịch tiêm sử dụng ngay khi mở nắp","incompatibilities":"","manufacturer":"Ferring GmbH","notes":"","cold":false,"light":false},{"id":155,"tradeName":"ELITAN","activeIngredient":"Metoclopramid hydroclorid","strength":"10mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB,TM: Dung dịch tiêm. Tiêm trong vòng ít nhất 3 phút (1)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C, tránh ánh sáng (1)","incompatibilities":"","manufacturer":"Medochemie LTD-Ampoule injectable facility- Cộng hòa Síp","notes":"","cold":false,"light":true},{"id":156,"tradeName":"EPHEDRINE AGUETTANT 30MG/10ML","activeIngredient":"Ephedrine hydrochloride 30mg/10ml","strength":"30mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM, TTM: Dung dịch tiêm.","storage":"Sau khi mở nắp phải sử dụng ngay","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":157,"tradeName":"ERAXIS","activeIngredient":"Anidulafungin","strength":"100mg","dosageForm":"Bột đông khô + 30ml nước cất pha tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 100ml dung dịch NaCl 0,9%, Glucose 5%. Truyền trên 90 phút (1)","storage":"Thuốc bảo quản ở 2–8°C Dung dịch hoàn nguyên bảo quản trong vòng 24h ở nhiệt độ ≤ 25°C Dung dịch pha loãng bảo quản trong vòng 48h ở nhiệt độ 25°C, không đông lạnh (1)","incompatibilities":"Không trộn lẫn với các loại thuốc khác hoặc các chất điện giải. (1)","manufacturer":"Pharmacia and Upjohn Company LLC","notes":"Nếu có các tiểu phân lạ hoặc đổi màu, phải loại bỏ dịch truyền. (1)","cold":true,"light":false},{"id":158,"tradeName":"ERTALGOLD","activeIngredient":"Ertapenem sodium*","strength":"1g","dosageForm":"Bột đông khô pha tiêm + 10ml (nước cất tiêm, NaCl 0,9%) → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên+ 50ml NaCl 0,9% (thời gian truyền ít nhất 30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml NaCl 0,9%","storage":"Dung dịch sau khi pha loãng sử dụng trong vòng 3h ở nhiệt độ phòng (25°C), có thể bảo quản 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng ngay sau khi pha Dùng riêng với các thuốc khác (1)","manufacturer":"ACS Dobfar S.P.A - Ý","notes":"Bảo quản lọ thuốc ở dưới 30°C. Không dùng dung dịch chứa Glucose để pha tiêm (1)","cold":false,"light":false},{"id":159,"tradeName":"ESMERON 50MG/5ML","activeIngredient":"Esmeron 50mg/5ml","strength":"50mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm TTM: Dung dịch tiêm pha loãng NaCl 0,9%, Glucose 5%, Lactat Ringer, nước vô khuẩn pha tiêm đạt nồng độ thường sử dụng là 0,5mg/ml hoặc 2mg/ml (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ 2–8°C, tránh đông lạnh. Dung dịch sau pha loãng dùng trong vòng 24h (1,2)","incompatibilities":"Dùng riêng với các thuốc: Intralipid,Amo xcillin, amphotericin B, cefazolin, cloxacillin, dexamethason, diazepam, furosemid, hydrocortison, methylpredniso lon, prednisolon, insulin, trimethoprim, vancomycin (1)","manufacturer":"","notes":"","cold":true,"light":false},{"id":160,"tradeName":"ESOVEX-40","activeIngredient":"Esomeprazole sodium","strength":"40 mg","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm+ 5ml dung dịch NaCl 0,9%. (Tiêm tối thiểu 3 phút) (1) TTM: Bột tiêm hòa tan vừa đủ 100ml dung dịch NaCl 0,9%, truyền tĩnh mạch trong 10-30 phút (1)","storage":"Dung dịch có thể bảo quản trong 12h ở nhiệt độ < 25°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Naprod Life Sciences PVT.LTD","notes":"","cold":false,"light":false},{"id":161,"tradeName":"FANLODO 500MG","activeIngredient":"Levofloxacin","strength":"500mg/ 100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (truyền ít nhất 60 phút) (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 25°C, tránh ánh sáng. Sau khi lấy ra khỏi hộp, để trong điều kiện ánh sáng trong nhà tối đa là 3 ngày. Không để trong tủ lạnh hoặc làm đông lạnh Thuốc phải được sử dụng trong vòng 3h sau khi chọc thủng nút cao su (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch heparin, các dung dịch kiềm khác (Natri hydro carbonat) (1)","manufacturer":"SOLUPHARM - ĐỨC","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":true,"light":true},{"id":162,"tradeName":"FENILHAM","activeIngredient":"Fentanyl","strength":"50mcg/ml Ống 2ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Dung dịch tiêm. Có thể pha loãng dung dịch tiêm với (dung dịch Glucose 5%, NaCl 0,9%) với tỷ lệ 1:1 hoặc 1:25 (1)","storage":"Dung dịch thuốc sau khi pha phải dùng trong vòng 24h ở nhiệt độ 2–8°C.","incompatibilities":"Dùng riêng với Pentobarbital natri, Methohexital natri, Thiopental natri và Nafcilline (1)","manufacturer":"HAMELN- ĐỨC","notes":"Bảo quản theo qui chế thuốc gây nghiện Mang găng tay bảo vệ ngón tay khi mở ống thuốc.","cold":false,"light":false},{"id":163,"tradeName":"FENTANYL B.BRAUN 0,1MG/2ML","activeIngredient":"Fentanyl","strength":"50mcg/ml Ống 2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm TM: Dung dịch tiêm. TTM: Có thể pha loãng dung dịch tiêm với (dung dịch Glucose 5%, NaCl 0,9%) với tỷ lệ 1:1 hoặc 1:25, pha loãng với midazolam 0,1% tỷ lệ 1:25","storage":"Dung dịch thuốc sau khi pha phải dùng trong vòng 24h ở nhiệt độ 2–8°C. Sau khi mở ống thuốc nên sử dụng ngay lập tức vì quan điểm vi sinh.","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":164,"tradeName":"FENTANYL 50 MICROGRAMS/ML SOLUTION FOR INJECTIONL","activeIngredient":"Fentanyl","strength":"50mcg/ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm. Có thể pha loãng dung dịch tiêm với (dung dịch Glucose 5%, NaCl 0,9%) (2)","storage":"Bảo quản < 30°C, nơi khô ráo, tránh ánh sáng","incompatibilities":"Tương kỵ với thiopentone và methohexitone natri (2)","manufacturer":"Macarthys Laboratories Limited","notes":"Bảo quản theo qui chế thuốc gây nghiện Mang găng tay bảo vệ ngón tay khi mở ống thuốc.","cold":false,"light":true},{"id":165,"tradeName":"FENTANYL CITRATE","activeIngredient":"Fentanyl","strength":"0,5mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm Có thể pha loãng dung dịch tiêm với (dung dịch Glucose 5%, NaCl 0,9%) (2)","storage":"Bảo quản < 30°C, nơi khô ráo, tránh ánh sáng","incompatibilities":"Tương kỵ với thiopentone và methohexitone natri (2)","manufacturer":"Yichang Humanwell Pharmaceutical Co., Ltd","notes":"Bảo quản theo qui chế thuốc gây nghiện Mang găng tay bảo vệ ngón tay khi mở ống thuốc.","cold":false,"light":true},{"id":166,"tradeName":"FENTANYL - HAMELN","activeIngredient":"Fentanyl","strength":"100 mcg/2 ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Dung dịch tiêm (tiêm chậm 1-2 phút) Có thể pha loãng dung dịch tiêm với (dung dịch Glucose 5%, NaCl 0,9%) với tỷ lệ 1:1 hoặc 1:25 (1)","storage":"Dung dịch thuốc sau khi pha phải dùng trong vòng 24h ở nhiệt độ 2–8°C.","incompatibilities":"Dùng riêng với Pentobarbital natri, Methohexital natri, Thiopental natri và Nafcilline (1)","manufacturer":"HAMELN- ĐỨC","notes":"Bảo quản theo qui chế thuốc gây nghiện Mang găng tay bảo vệ ngón tay khi mở ống thuốc.","cold":false,"light":false},{"id":167,"tradeName":"FLEXBUMIN 20% INJ 10G/50ML","activeIngredient":"Albumin","strength":"10G/50ML","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM: Tốc độ không nên quá 1ml/phút - Có thể pha loãng dung dịch tiêm với NaCl 0,9%, Glucose 5% (1 phần thể tích dung dịch tiêm: 3 phần dung môi)","storage":"Không dùng khi dung dịch bị vẩn đục. Không tiến hành truyền sau khi mở bao bì hơn 4 giờ. Loại bỏ phần không sử dụng","incompatibilities":"Tương kỵ với các dung dịch protein thủy phân hoặc các dung dịch có chứa cồn","manufacturer":"Baxalta US Inc","notes":"Không pha loãng với nước cất pha tiêm để truyền vì có thể gây tan huyết/suy thận cấp","cold":false,"light":false},{"id":168,"tradeName":"FOSFOMED 1G","activeIngredient":"Fosfomycin","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 20ml (nước cất tiêm, Glucose 5%) (tiêm chậm ≥ 5 phút) (1) TTM: Bột tiêm + 100-500ml (Glucose 5%, NaCl 0,9%) (truyền trong 60-120 phút) (1)","storage":"Dung dịch sau khi pha loãng ổn định trong vòng 24 giờ ở nhiệt độ 20°C - 25°C (1)","incompatibilities":"","manufacturer":"Công ty TNHH sản xuất dược phẩm Medlac Pharma Italy- VN","notes":"Chế phẩm chứa 14.5 mEq Natri ~ mỗi 1g. Thận trọng trên bệnh nhân cần giảm lượng Natri đưa vào cơ thể do suy tim, suy thận, cao huyết áp","cold":false,"light":false},{"id":169,"tradeName":"FOSFOMED 2G","activeIngredient":"Fosfomycin","strength":"2g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 20ml (nước cất tiêm, Glucose 5%) (tiêm chậm ≥ 5 phút) (1) TTM: Bột tiêm + 100-500ml (Glucose 5%, NaCl 0,9%) (truyền trong 60-120 phút) (1)","storage":"Dung dịch sau khi pha loãng ổn định trong vòng 24 giờ ở nhiệt độ 20°C - 25°C (1)","incompatibilities":"","manufacturer":"Công ty TNHH sản xuất dược phẩm Medlac Pharma Italy- VN","notes":"Chế phẩm chứa 14.5 mEq Natri ~ mỗi 1g. Thận trọng trên bệnh nhân cần giảm lượng Natri đưa vào cơ thể do suy tim, suy thận, cao huyết áp","cold":false,"light":false},{"id":170,"tradeName":"FRESOFOL 1% MCT/LCT INJ 20ML","activeIngredient":"Propofol","strength":"200mg/20ml","dosageForm":"Nhũ tương tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Nhũ tương tiêm hoặc pha loãng với NaCl 0,9%, Glucose 5% không vượt quá tỷ lệ 1:4 (1)","storage":"Nhũ tương tiêm sau khi pha loãng dùng trong vòng 6h (1) Tránh đông lạnh.","incompatibilities":"Dùng riêng với các dung dịch tiêm truyền khác (1)","manufacturer":"FRESENIUS KABI Austria GmbH-Áo","notes":"","cold":true,"light":false},{"id":171,"tradeName":"FYRANCO","activeIngredient":"Teicoplanin","strength":"400mg","dosageForm":"Bột đông khô pha tiêm + 3ml nước cất pha tiêm → dung dịch hoàn nguyên. Cần đảm bảo tất cả lượng bột đều tan hết, kể cả bột chung quanh nắp lọ","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch hoàn nguyên (1) TM: Dung dịch hoàn nguyên (1) (tiêm từ 3-5 phút) (5) TTM: Dung dịch hoàn nguyên được pha loãng với 20-50 ml dung dịch NaCl 0,9%, DD Ringer, Ringer lactate, NaCl 0,18% + Dextrose 4%, Glucose 5% (thường dùng pha với NaCl 0,9% truyền trong 30 phút) (1,5)","storage":"Dung dịch hoàn nguyên ổn định trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Tương kỵ với aminoglycosides (1)","manufacturer":"Demo S.A. Pharmaceutical Industry","notes":"Khi pha dung dịch hoàn nguyên tránh tạo bọt. Chú ý khi có bọt trong quá trình hoàn nguyên, nên để yên 15 phút trước khi sử dụng tiếp theo (1)","cold":false,"light":false},{"id":172,"tradeName":"GALOXCIN 750","activeIngredient":"Levofloxacin","strength":"750mg/ 150ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm (truyền ít nhất 90 phút) (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng. Dung dịch thuốc dùng không hết trong lần phải được loại bỏ (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch heparin, các dung dịch kiềm khác (Natri hydro carbonat) (1)","manufacturer":"PHARBACO- VN","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":false,"light":true},{"id":173,"tradeName":"GARNOTAL INJ 200MG/2ML","activeIngredient":"Phenobarbital Natri","strength":"200mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm. (1)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với dung dịch acid vì có thể tủa Phenobarbital (1)","manufacturer":"Cty CPD DANAPHA- VN","notes":"Bảo quản theo qui chế thuốc hướng thần. THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":174,"tradeName":"GARNOTAL INJ","activeIngredient":"Phenobarbital Natri","strength":"200mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm. (1)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với dung dịch acid vì có thể tủa Phenobarbital (1)","manufacturer":"Cty CPD DANAPHA-VN","notes":"Bảo quản theo qui chế thuốc hướng tâm thần","cold":false,"light":true},{"id":175,"tradeName":"GELOFUSINE 4% 500ML","activeIngredient":"Succinylated gelatin 20g + NaCl 35,05g + NaOH 0,68g","strength":"20g+35,05g+0 ,68g","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Liều lượng và tốc độ truyền được điều chỉnh tùy theo nhu cầu cá nhân (theo dõi thông số tuần hoàn: Huyết áp…) Đối với việc bù đắp các tổn thất nhỏ về máu hoặc huyết tương, cũng như đối với dự phòng trước và trong phẫu thuật thường quy, theo quy tắc, 500 - 1000 ml Gelofusine sẽ cần được truyền, trong khoảng từ 1 - 3 giờ. Đối với việc bù đắp các tổn thất lớn về máu hoặc huyết tương, liều trung bình là từ 1000 đến 2000 ml Trong các tình huống cấp cứu hoặc sốc, một liều ban đầu 500 ml có thể được truyền nhanh trong vòng 5 - 10 phút, sử dụng máy bơm hoặc bơm truyền áp suất. Tốc độ truyền tối đa: Tốc độ truyền tối đa phụ thuộc vào tình trạng tim mạch-thần kinh hiện tại","storage":"Chỉ những dung dịch trong suốt và không có cặn mới nên được truyền. Các đơn vị đã được chuẩn bị sẵn để truyền phải được sử dụng trong vòng 4 giờ. Phần dung dịch không sử dụng còn lại không nên được lưu trữ cho lần sử dụng sau.","incompatibilities":"","manufacturer":"B. Braun Medical Industries Sdn.","notes":"Trước khi bắt đầu truyền, dung dịch cần được làm ấm đến tối đa 37°C.","cold":false,"light":false},{"id":176,"tradeName":"GEMAPAXANE (4000IU/0,4ML)","activeIngredient":"Enoxaparin (natri)","strength":"4000IU/0,4ml","dosageForm":"Dung dịch tiêm","routes":["TM","TDD"],"reconstitution":"TDD: Dung dịch tiêm TM: BN nhồi máu cơ tim cần dùng liều tĩnh mạch ban đầu Tiêm vào mạch máu: Tiêm dung dịch tiêm vào ống dây của hệ thống thẩm phân nối với động mạch (1)","storage":"Bảo quản < 30°C, tránh để đông lạnh Thuốc phải giữ nguyên trong bao bì trước khi sử dụng","incompatibilities":"Không trộn thuốc với các chế phẩm khác (1)","manufacturer":"Italfarmaco, S.p.A.","notes":"Không có chỉ định tiêm bắp (1)","cold":true,"light":false},{"id":177,"tradeName":"GEMAPAXANE (6000IU/0,6ML)","activeIngredient":"Enoxaparin (natri)","strength":"6000IU/0,6ml","dosageForm":"Dung dịch tiêm","routes":["TM","TDD"],"reconstitution":"TDD: Dung dịch tiêm TM: BN nhồi máu cơ tim cần dùng liều tĩnh mạch ban đầu Tiêm vào mạch máu: Tiêm dung dịch tiêm vào ống dây của hệ thống thẩm phân nối với động mạch (1)","storage":"Bảo quản < 30°C, tránh để đông lạnh Thuốc phải giữ nguyên trong bao bì trước khi sử dụng","incompatibilities":"Không trộn thuốc với các chế phẩm khác (1)","manufacturer":"Italfarmaco S.p.A.","notes":"Không có chỉ định tiêm bắp (1)","cold":true,"light":false},{"id":178,"tradeName":"GENTAMICIN KABI 40MG/ML","activeIngredient":"Gentamicin 40mg/ml","strength":"40mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm Gentamicin. TM: Dung dịch tiêm ít nhất 3 phút. TTM: Dung dịch Gentamicin + 78ml dung dịch Glucose 5%, NaCl 0,9%. (pha loãng đến nồng độ 1mg/ml) (với thể tích truyền 100ml- truyền trong 20 phút). Có thể pha trong 50-200ml dung môi tương hợp. (truyền trong vòng 30-120 phút) (1)","storage":"Bảo quản nhiệt độ từ 2–30°C, tránh ánh sáng, không dùng dung dịch tiêm biến màu hoặc có tủa.","incompatibilities":"","manufacturer":"Cty CP Fresenius Kabi Bidiphar","notes":"Nồng độ dung dịch truyền TM có thể pha 1-10mg/mL","cold":false,"light":true},{"id":179,"tradeName":"GENTAMICIN 80MG/2ML (KABI)","activeIngredient":"Gentamicin","strength":"80mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm Gentamicin. TM: Tiêm thẳng dung dịch tiêm vào TM/ống nhỏ giọt trong ít nhất 3 phút. (không khuyến khích dùng) TTM: Dung dịch Gentamicin + 78ml dung dịch Glucose 5%, NaCl 0,9%. (pha loãng đến nồng độ 1mg/ml) (truyền trong vòng 30-60 phút) (1)","storage":"Bảo quản nhiệt độ từ 2–30°C, tránh ánh sáng, không dùng dung dịch tiêm biến màu hoặc có tủa. Hạn dùng khi mở nắp/pha loãng: Không có thông tin.","incompatibilities":"Dùng riêng với Heparin, Furosemid, Natri bicarbonate, kháng sinh nhóm Beta-lactam (1)","manufacturer":"Fresenius Kabi Bidiphar","notes":"Không dùng tiêm dưới da vì nguy cơ hoại tử da.","cold":false,"light":true},{"id":180,"tradeName":"GENTAMICIN 80MG/2ML","activeIngredient":"Gentamicin","strength":"80mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm Gentamicin. TTM: Dung dịch Gentamicin + 78ml dung dịch Glucose 5%, NaCl 0,9%. (pha loãng đến nồng độ 1mg/ml) (truyền trong vòng 30-60 phút) (1)","storage":"Bảo quản nhiệt độ từ 2–30°C, tránh ánh sáng, không dùng dung dịch tiêm biến màu hoặc có tủa (2)","incompatibilities":"Dùng riêng với Heparin, Furosemid, Natri bicarbonate, kháng sinh nhóm Beta-lactam (1)","manufacturer":"VIDIPHA-VN","notes":"Không dùng tiêm dưới da vì nguy cơ hoại tử da.","cold":false,"light":true},{"id":181,"tradeName":"GLUCOSE 10% 250ML","activeIngredient":"Glucose 10%","strength":"0.1","dosageForm":"Dung dịch tiêm truyền","routes":["TTM","TM"],"reconstitution":"TM,TTM","storage":"Ổn định lý hoá ở nhiệt độ phòng, tránh đông băng. Theo tờ HDSD dùng ngay khi mở nắp. Theo USP ở điều kiện bảo quản sạch (clean room) có thể bảo quản 14 ngày ở nhiệt độ 2–8°C, 24-48 giờ ở nhiệt độ phòng, tuy nhiên để đảm bảo an toàn vi sinh nên dùng trong vòng 24 giờ, trách nhiệm thuộc về người sử dụng.","incompatibilities":"","manufacturer":"Công ty Cổ phần Fresenius Kabi Bidiphar","notes":"Nồng độ >10% có thể gây thoát mạch, sử dụng cẩn trọng","cold":true,"light":false},{"id":182,"tradeName":"GLUCOSE 20% 500ML","activeIngredient":"Glucose 20%","strength":"0.2","dosageForm":"Dung dịch tiêm truyền","routes":["TTM","TM"],"reconstitution":"TM,TTM","storage":"Ổn định lý hoá ở nhiệt độ phòng, tránh đông băng. Theo tờ HDSD dùng ngay khi mở nắp. Theo USP ở điều kiện bảo quản sạch (clean room) có thể bảo quản 14 ngày ở nhiệt độ 2–8°C, 24-48 giờ ở nhiệt độ phòng, tuy nhiên để đảm bảo an toàn vi sinh nên dùng trong vòng 24 giờ, trách nhiệm thuộc về người sử dụng.","incompatibilities":"","manufacturer":"Công ty Cổ phần Fresenius Kabi Bidiphar","notes":"Nồng độ >10% có thể gây thoát mạch, sử dụng cẩn trọng","cold":true,"light":false},{"id":183,"tradeName":"GLUCOSE 30% 250ML","activeIngredient":"Glucose 30%","strength":"0.3","dosageForm":"Dung dịch tiêm truyền","routes":["TTM","TM"],"reconstitution":"TM,TTM","storage":"Ổn định lý hoá ở nhiệt độ phòng, tránh đông băng. Theo tờ HDSD dùng ngay khi mở nắp. Theo USP ở điều kiện bảo quản sạch (clean room) có thể bảo quản 14 ngày ở nhiệt độ 2–8°C, 24-48 giờ ở nhiệt độ phòng, tuy nhiên để đảm bảo an toàn vi sinh nên dùng trong vòng 24 giờ, trách nhiệm thuộc về người sử dụng.","incompatibilities":"","manufacturer":"Công ty Cổ phần Fresenius Kabi Bidiphar","notes":"Nồng độ >10% có thể gây thoát mạch, sử dụng cẩn trọng","cold":true,"light":false},{"id":184,"tradeName":"GLUCOSE 5% 250ML","activeIngredient":"Glucose 5%","strength":"0.05","dosageForm":"Dung dịch tiêm truyền","routes":["TTM","TM"],"reconstitution":"TM,TTM","storage":"Ổn định lý hoá ở nhiệt độ phòng, tránh đông băng. Theo tờ HDSD dùng ngay khi mở nắp. Theo USP ở điều kiện bảo quản sạch (clean room) có thể bảo quản 14 ngày ở nhiệt độ 2–8°C, 24-48 giờ ở nhiệt độ phòng, tuy nhiên để đảm bảo an toàn vi sinh nên dùng trong vòng 24 giờ, trách nhiệm thuộc về người sử dụng.","incompatibilities":"","manufacturer":"Công ty Cổ phần Fresenius Kabi Bidiphar","notes":"","cold":true,"light":false},{"id":185,"tradeName":"GLYCERYL TRINITRATE - HAMELN 1MG/ML","activeIngredient":"Glyceryl trinitrat (Nitroglycerin)","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm hoặc pha loãng dung dịch tiêm với dung dịch (Glucose 5%, NaCl 0,9%) theo tỷ lệ 1: 10 cho đến 1: 40. (10mg pha trong 100-400ml) (1) Dung dịch thuốc nên truyền chậm (1)","storage":"Dung dịch sau khi pha sử dụng trong vòng 24h ở nhiệt độ 2–8°C Nên dùng ngay sau khi mở ống thuốc (1)","incompatibilities":"Dung dịch Glyceryl trinitrat không tương thích với ống tiêm (hoặc hệ thống tiêm) bằng nhựa PVC vì có thể hấp thu đến 50% Glyceryl trinitrat từ dung dịch (1)","manufacturer":"HAMELN- ĐỨC","notes":"Nên được sử dụng bằng bộ bơm truyền vi giọt hoặc bằng bộ thiết bị tương tự giúp duy trì tốc độ truyền ổn định.","cold":true,"light":false},{"id":186,"tradeName":"GLYPRESSIN","activeIngredient":"Terlipressin acetate","strength":"1mg","dosageForm":"Bột đông khô+ 5ml dung môi → dung dịch hoàn nguyên","routes":["TM"],"reconstitution":"TM: Dung dịch hoàn nguyên (1)","storage":"Bảo quản < 30°C trong bao bì gốc để tránh ánh sáng. Dung dịch đã pha phải sử dụng ngay (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Ferring GmbH- Germany","notes":"","cold":false,"light":true},{"id":187,"tradeName":"GOLDVOXIN","activeIngredient":"Levofloxacin","strength":"250mg/ 50ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (truyền ít nhất 60 phút) (1,2)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng. Thuốc phải được sử dụng ngay (5) Dung dịch thuốc dùng không hết trong lần phải được loại bỏ (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch khác (2)","manufacturer":"INFORLIFE S.A- THỤY SĨ","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":false,"light":true},{"id":188,"tradeName":"GRAN","activeIngredient":"Filgrastim","strength":"30MU (300mcg)","dosageForm":"Dung dịch tiêm được đóng sẵn trong bơm tiêm 0,5ml","routes":["TTM","TDD"],"reconstitution":"TDD: Dung dịch tiêm. TTM: Dung dịch tiêm Filgrastim pha loãng vừa đủ với 20ml dung dịch Glucose 5% (có tổng liều Filgrastim <300mcg)+ 0,2ml dd Albumin người 20%) truyền ít nhất 30 phút (1) Chú ý: Nồng độ dịch truyền < 5mcg/ml không được khuyến cáo (không pha loãng hơn 50 ml Glucose 5%) (1)","storage":"Nên bảo quản ở nhiệt độ 2–8°C. Không để đông lạnh. Dung dịch sau khi pha phải sử dụng trong vòng 24h (1).","incompatibilities":". Không được tiêm liều Gran đầu tiên trong vòng 24h trước và sau khi dùng hóa trị gây độc tế bào (1)","manufacturer":"F.Hoffmann- La Roche Ltd- Thụy sĩ","notes":"Không pha loãng dung dịch Gran với dung dịch NaCl 0,9%. Tránh lắc mạnh. Bơm tiêm đóng sẵn Gran chỉ dùng cho một lần sử dụng","cold":true,"light":false},{"id":189,"tradeName":"GROWPONE 10% 10ML","activeIngredient":"Calci gluconat 10%","strength":"0.1","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm, tiệm chậm không vượt quá 200mg/phút (2ml/phút). Tốc độ khác nhau các khuyến cáo 2ml/phút, 1.5 tới 3ml/phút và 5ml/phút. BN nên nằm lại 15 phút sau khi tiêm HOẶC có thể pha loãng với NaCl 0,9%/glucose 5%/Lactat Ringer thành dung dịch có nồng độ 10-50mg/mL tiêm bolus. TTM: Truyền liên tục hoặc nhỏ giọt dung dịch tiêm HOẶC pha loãng với NaCl 0,9%/glucose 5%/Lactat Ringer thành dung dịch có nồng độ 5,8-10mg/mL.","storage":"Bảo quản nhiệt độ thường. Dung dịch tiêm khi mở nắp sử dụng trong vòng 4 giờ. Dung dịch đã pha nên sử dụng ngay khi pha, sử dụng trong vòng 24h. Không dùng dung dịch khi đổi màu, mờ, đục.","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":190,"tradeName":"HADUMEDROL","activeIngredient":"Diphenhydramin","strength":"10mg/ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm (1)","storage":"Bảo quản ống thuốc ở nhiệt độ 15–30°C, tránh ánh sáng.","incompatibilities":"Không trộn lẫn với các thuốc khác.","manufacturer":"Công ty cổ phần dược vật tư y tế Hải Dương","notes":"Khi tiêm bắp phải tiêm sâu. Khi tiêm TM phải tiêm chậm, người bệnh ở tư thế nằm.","cold":false,"light":true},{"id":191,"tradeName":"HADUNALIN 1MG/ML","activeIngredient":"Adrenalin","strength":"1mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB","TDD"],"reconstitution":"TDD, TB: Dung dịch tiêm. (1) TM, TTM: Chuẩn bị dung dịch 0,01mg/ml: 0,1ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%). (2,4) Chuẩn bị dung dịch 0,05mg/ml: 0,5ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%). (2,4) Chuẩn bị dung dịch 0,1mg/ml: 1ml dd tiêm (1mg/ml) pha đến 10ml với (nước cất tiêm, dung dịch NaCl 0,9%) (2,4)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với các thuốc khác (1) Adrenalin tương kỵ với các dung dịch kiềm (như natri bicarbonat) (2)","manufacturer":"Công ty CP Dược VTYT Hải Dương","notes":"Tuyệt đối không được tiêm vào tĩnh mạch nếu chưa được pha loãng (1)","cold":false,"light":true},{"id":192,"tradeName":"HALOPERIDOL","activeIngredient":"Haloperidol","strength":"5mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm","storage":"Bảo quản ống thuốc < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với các thuốc khác. Thuốc có thể tương kỵ với nước cất pha tiêm và nước muối sinh lý pha tiêm (2)","manufacturer":"DANAPHA-VN","notes":"Dùng liều cao và tiêm tĩnh mạch có nguy cơ gây kéo dài khoảng QT và xoắn đỉnh.","cold":false,"light":true},{"id":193,"tradeName":"HEMASTOP 250ΜG/1ML","activeIngredient":"Carboprost 250µg/1ml","strength":"250µg/1ml","dosageForm":"Dung dịch tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm","storage":"Bảo quản tủ lạnh (nhiệt độ 2–8°C)","incompatibilities":"","manufacturer":"CTCPDP CPC1 HÀ NỘI- VN","notes":"","cold":true,"light":false},{"id":194,"tradeName":"HEPARIN 25,000IU/5ML","activeIngredient":"Heparin (natri)","strength":"25.000 UI/5 ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TDD"],"reconstitution":"TDD, TM: Dung dịch tiêm (1) TTM: Dung dịch tiêm được pha loãng với 50- 100 ml dung dịch NaCl 0,9% (2) (5)","storage":"Bảo quản < 25°C","incompatibilities":"Heparin không dùng chung với các thuốc khác. Heparin tương kỵ với hydrocortison, phenothiazin, các thuốc giảm đau gây ngủ, một vài kháng sinh và kháng histamin (1)","manufacturer":"Panpharma GmbH","notes":"Không được tiêm bắp. Riêng dung dịch Heparin dùng tráng bơm tiêm có thể bảo quản 28 ngày sau khi mở nắp.","cold":false,"light":false},{"id":195,"tradeName":"HEPARIN-BELMED","activeIngredient":"Heparin (natri)","strength":"25000UI/5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TDD"],"reconstitution":"TDD, TM: Dung dịch tiêm (1) TTM: Dung dịch tiêm được pha loãng với 50- 100 ml dung dịch NaCl 0,9% (2) (5)","storage":"Bảo quản < 30°C. Tránh ánh sáng Dung dịch pha loãng bảo quản trong 24 giờ ở nhiệt độ 2–8°C (5)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Belmedpreparat y RUE - Cộng hòa Belarus","notes":"Không được tiêm bắp (2) Riêng dung dịch Heparin dùng tráng bơm tiêm có thể bảo quản 28 ngày sau khi mở nắp (5)","cold":true,"light":true},{"id":196,"tradeName":"HUMAN ALBUMIN 20% BEHRING, MUỐI THẤP","activeIngredient":"Albumin","strength":"200g/1l","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền, có thể pha loãng với một lượng thích hợp NaCl 0,9%, glucose 5% (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh đông lạnh, chai thuốc mở ra phải được dùng ngay (1)","incompatibilities":"Dùng riêng với thuốc khác, máu toàn phần và hồng cầu lắng (1)","manufacturer":"CSL Behring GmbH- Đức","notes":"","cold":true,"light":false},{"id":197,"tradeName":"HUMAN ALBUMIN 20% OCTAPHARMA","activeIngredient":"Albumin","strength":"10g/50ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền","storage":"Bảo quản ở nhiệt độ 2–25°C, tránh đông lạnh, chai thuốc mở ra phải được dùng ngay (1)","incompatibilities":"Không được pha với các thuốc khác, máu toàn phần, hồng cầu lắng và nước cất pha tiêm (1)","manufacturer":"Octapharma Pharmazeutika Produktionsges. m.b.H","notes":"Không được dùng khi dung dịch vẩn đục hoặc có cặn Tốc độ truyền phải điều chỉnh theo chỉ định và bệnh tình BN (1)","cold":true,"light":false},{"id":198,"tradeName":"HUMAN ALBUMIN BAXTER 200G/L","activeIngredient":"Albumin","strength":"200g/1l","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền, có thể pha loãng với một lượng thích hợp NaCl 0,9%, Glucose 5% (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh đông lạnh, chai thuốc mở ra phải được dùng ngay (1)","incompatibilities":"Dùng riêng với các thuốc khác","manufacturer":"Takeda Manufacturing Italia S.p.A","notes":"Không được pha loãng với nước cất pha tiêm","cold":true,"light":false},{"id":199,"tradeName":"HUMULIN","activeIngredient":"Insulin tác dụng ngắn (S) (Insulin người)","strength":"100UI/ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB","TDD"],"reconstitution":"TDD, TB, TM: Dung dịch tiêm (1)","storage":"Lọ thuốc chưa mở nắp: Bảo quản ở nhiệt độ 2–8°C Lọ thuốc đã mở nắp: Bảo quản ở nhiệt độ < 30°C trong hộp bao bì đóng gói, phải dùng trong vòng 28 ngày (1)","incompatibilities":"Dùng riêng với các thuốc khác, các insulin người của nhà sản xuất khác hoặc các chế phẩm insulin động vật (1).","manufacturer":"ELI LILLY AND COMPANY - MỸ","notes":"Không sử dụng chung ống tiêm và kim tiêm với các thuốc khác (1)","cold":false,"light":false},{"id":200,"tradeName":"HYDROCORTISON","activeIngredient":"Hydrocortison","strength":"100mg","dosageForm":"Bột đông khô + 2ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM","TM","TB"],"reconstitution":"TB, TM: Dung dịch hoàn nguyên, tiêm chậm ít nhất 30 giây (1) TTM: Dung dịch hoàn nguyên + 100- 1000 ml (NaCl 0,9%, Glucose 5%) truyền từ 20-30 phút (1,5)","storage":"Dung dịch hoàn nguyên ổn định trong vòng 3 ngày. Dung dịch pha loãng để truyền tĩnh mạch ổn định tối thiểu 4 giờ sau khi pha. (1)","incompatibilities":"","manufacturer":"Cty CP Dược - TTBYT Bình Định (Bidiphar)","notes":"","cold":false,"light":false},{"id":201,"tradeName":"IMATIG","activeIngredient":"Tigecyclin","strength":"50mg","dosageForm":"Bột đông khô + 5,3ml (Glucose 5%, NaCl 0,9%) → dung dịch hoàn nguyên.","routes":["TTM"],"reconstitution":"TTM: Lấy 5ml dung dịch hoàn nguyên + 100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền từ 30- 60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 5,3ml dung dịch NaCl 0,9%","storage":"Dung dịch hoàn nguyên sau pha loãng với (Glucose 5%, NaCl 0,9%) bảo quản trong vòng 6h ở nhiệt độ < 25°C, 48h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với Amphotericin B, Chlorpromazin, Methyl prednisolon, Voriconazol (1)","manufacturer":"Immacule Lifesciences Pvt. Ltd","notes":"* Pha ít nhất 5,3ml (Glucose 5%, NaCl 0,9%) *Lọ thuốc chứa 6% lượng dư","cold":false,"light":false},{"id":202,"tradeName":"IMIPENEM CILASTATIN KABI 500MG/500MG","activeIngredient":"Imipenem + Cilastatin","strength":"500mg + 500mg","dosageForm":"Bột pha tiêm + 10 ml (NaCl 0.9%, Glucose 5%,...), lắc kỹ, thêm tiếp 10 ml dung môi trên, lắc kỹ để đảm bảo thuốc đã tan hoàn toàn → dung dịch tiêm (1)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm + 80ml (NaCl 0,9%,Glucose 5%...) (1) (truyền 250-500mg Imipenem từ 20-30 phút, 1g Imipenem từ 40-60 phút) (1,5) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h.","storage":"Dung dịch sau khi pha loãng sử dụng trong vòng 3h ở nhiệt độ phòng (<25°C), trong vòng 24h ở nhiệt độ 2–8°C (1,2)","incompatibilities":"Không pha trộn với các kháng sinh khác, không dùng dung dịch Lactate để pha thuốc (1)","manufacturer":"ACS Dobfar SpA-Ý","notes":"Thường dùng dung dịch NaCl 0,9% để pha dịch truyền (2,5). Đảm bảo thuốc đã tan hoàn toàn trước khi truyền (1)","cold":false,"light":false},{"id":203,"tradeName":"IMMUNO HBS 180IU/ML","activeIngredient":"Globulin miễn dịch kháng HBV (Human hepatitis B immunoglobulin)","strength":"180IU/ml","dosageForm":"Dung dịch thuốc tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch thuốc tiêm","storage":"Sử dụng ngay khi mở nắp, bảo quản tủ lạnh (nhiệt độ 2–8°C)","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":true,"light":true},{"id":204,"tradeName":"IMMUNO RHO 300MCG","activeIngredient":"Globulin miễn dịch anti -D có nguồn gốc từ người","strength":"300mcg (1500 đơn vị)","dosageForm":"Bột đông khô+2ml nước cất pha tiêm trong vòng 5 phút→ dung dịch hoàn nguyên","routes":["TB"],"reconstitution":"TB: Dung dịch hoàn nguyên","storage":"Dung dịch hoàn nguyên bảo quản ở 2–8°C, không làm đông, tránh ánh sáng","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":true},{"id":205,"tradeName":"INLEZONE 600","activeIngredient":"Linezolid","strength":"600mg/300ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (thời gian truyền 30-120 phút) (1,5)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng. Không để thuốc đóng băng. Dùng thuốc ngay sau khi mở lọ (5) PHÒNG PHA TIÊM: 24h ở nhiệt độ < 25°C","incompatibilities":"Tiêm truyền riêng đối với các thuốc khác (1)","manufacturer":"Công ty cổ phần Dược phẩm Am Vi","notes":"Chỉ được sử dụng một lần, bỏ đi phần dung dịch thừa nếu chưa sử dụng hết (1)","cold":false,"light":true},{"id":206,"tradeName":"INTRATECT 50MG/ML, 50ML","activeIngredient":"Immunoglobulin người (IVIg)","strength":"2,5g/50ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Truyền tĩnh mạch với tốc độ ban đầu không vượt quá 1,4mL/kg/giờ trong 30 phút. Nếu đạt dung nạp tốt tốc độ truyền có thể tăng lên mức tối đa 1,9ml/kg/giờ cho đến khi hết dịch.","storage":"Bảo quản trong bao bì kín, tránh ánh sáng, ở nơi khô ráo, nhiệt độ < 25°C. Sử dụng ngay khi mở nắp. (các chế phẩm IVIg 5% đa số khuyến cáo sử dụng trong vòng 8 giờ sau khi mở nắp)","incompatibilities":"","manufacturer":"Biotest Pharma GmbH","notes":"","cold":false,"light":true},{"id":207,"tradeName":"INVANZ","activeIngredient":"Ertapenem sodium*","strength":"1g","dosageForm":"Bột đông khô pha tiêm + 10ml (nước cất tiêm, NaCl 0,9%) → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên+ 50ml NaCl 0,9% (thời gian truyền ít nhất 30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml NaCl 0,9%","storage":"Dung dịch sau khi pha loãng sử dụng trong vòng 6h ở nhiệt độ phòng (25°C), có thể bảo quản 24h ở nhiệt độ (5°C) và dùng trong vòng 4h sau khi lấy ra khỏi tủ lạnh (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"MERCKSHAR P& DOHMECHIBR ET - PHÁP","notes":"Bảo quản lọ thuốc ở 2–8°C. Không dùng dung dịch chứa Glucose để pha tiêm (1)","cold":true,"light":false},{"id":208,"tradeName":"ITAMERINON 10","activeIngredient":"Milrinone","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm, tiêm chậm trong 10 phút (hoặc pha đến 20ml với NaCl 0,9%, Gluose 5%) (chỉ dùng liều tải) (2) TTM: 10ml dung dịch tiêm Milrinone + 40ml dung dịch (Glucose 5%, NaCl 0,9%) (liều duy trì) (1,2,5)","storage":"Sau khi pha loãng dung dịch bảo quản trong vòng 24h ở 2–8°C (1,5)","incompatibilities":"Không được pha với dung dịch NaHCO3, dùng riêng với furosemid.","manufacturer":"Medlac Pharma Italy","notes":"Không được sử dụng nếu có dị vật lạ hay biến màu trong dung dịch sau khi pha.","cold":true,"light":false},{"id":209,"tradeName":"IVF - M INJ 150","activeIngredient":"Human Menopausal Gonadotrophin","strength":"150IU","dosageForm":"Bột pha tiêm + 1ml dung dịch NaCl 0,9% (sẵn trong hộp) -> dung dịch tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm","storage":"Bảo quản ở nhiệt độ không quá 30°C. Sử dụng lập tức ngay sau khi pha","incompatibilities":"","manufacturer":"Công ty LG Life Sciences Ltd., Korea","notes":"","cold":false,"light":false},{"id":210,"tradeName":"IVF-C INJECTION 5000IU","activeIngredient":"Human chorionic gonadotropin","strength":"5000IU","dosageForm":"Bột pha tiêm + 1ml dung dịch NaCl 0,9% (sẵn trong hộp) -> dung dịch tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm","storage":"Bảo quản ở nhiệt độ không quá 30°C. Sử dụng lập tức ngay sau khi pha","incompatibilities":"","manufacturer":"Công ty LG Life Sciences Ltd., Korea","notes":"","cold":false,"light":false},{"id":211,"tradeName":"JUNIMIN 10ML","activeIngredient":"Kẽm 1000mcg + Đồng 200mcg + Mangan 5mcg + Iod 10mcg + Selen 20mcg","strength":"","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"","storage":"Bảo quản nhiệt độ phòng, không được đông lạnh. Sau khi pha loãng dung dịch ổn định mặt hóa lý trong 48 giờ ở nhiệt độ 25°C","incompatibilities":"","manufacturer":"","notes":"TTM: Phải pha loãng dung dịch tiêm trước khi sử dụng. Phải pha loãng tới khi đạt độ thẩm thấu mong muốn","cold":true,"light":false},{"id":212,"tradeName":"KALI CLORID 10%","activeIngredient":"Kali clorid","strength":"1g/10ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM","TM"],"reconstitution":"TTM: 3 ống dung dịch Kali clorid được pha loãng đến 1000ml dung dịch NaCl 0,9% - khi truyền TM ngoại biên (1) (để đạt nồng độ 40mmol/lít-1mmol tương đương với 75mg Kali clorid), 2 ống kali clorid trong 500 ml (Hội đồng thuốc và điều trị) Điều trị giảm Kali máu: Bình thường truyền nhỏ giọt tĩnh mạch ngoại biên với tốc độ truyền 10-20mmol/giờ (>20mmol/giờ trong trường hợp cấp cứu), đối với người có tổn thương thận hoặc bị blốc tim phải giảm tốc độ truyền không quá 5-10mmol/giờ (1)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C, tránh ánh sáng. (1)","incompatibilities":"Dùng riêng với Mannitol, máu và các sản phẩm của máu, dung dịch chứa Aminoacid hoặc có chứa lipid (1)","manufacturer":"Công ty CP DP Vĩnh Phúc","notes":"Phải pha loãng trước khi dùng. Lưu ý: NSX khuyến cáo khi dùng chung với dung dịch GLUCOSE có thể giảm kali máu nên HĐT khuyến cáo theo dõi nồng độ kali máu khi sử dụng. Không có tương kỵ vật lý, hóa học khi dùng hoặc pha chung kali v→ dung dịch GLUCOSE","cold":false,"light":true},{"id":213,"tradeName":"KALI CLORID KABI 10%","activeIngredient":"Kali clorid","strength":"10% (1g/10ml)","dosageForm":"Dung dịch tiêm dùng để tiêm truyền","routes":["TTM","TM"],"reconstitution":"TTM: 3 ống dung dịch Kali clorid được pha loãng đến 1000ml dung dịch (Glucose 5%, NaCl 0,9%) - khi truyền TM ngoại biên (1) (để đạt nồng độ 40mmol/lít-1mmol tương đương với 75mg Kali clorid), 2 ống kali clorid trong 500 ml (Hội đồng thuốc và điều trị) Điều trị giảm Kali máu: Bình thường truyền nhỏ giọt tĩnh mạch ngoại biên với tốc độ truyền 10-20mmol/giờ (>20mmol/giờ trong trường hợp cấp cứu), đối với người có tổn thương thận hoặc bị blốc tim phải giảm tốc độ truyền không quá 5-10mmol/giờ (1)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với Mannitol, máu và các sản phẩm của máu, dung dịch chứa Aminoacid hoặc có chứa lipid (1)","manufacturer":"FRESENIUS KABI BIDIPHAR -VN","notes":"Phải pha loãng Dung dịch tiêm trước khi dùng Giới hạn nồng độ: Nồng độ tối đa khi truyền tĩnh mạch ngoại biên là 60mmol/l. Nồng độ tối đa khi truyền tĩnh mạch trung tâm là 100mmol/l","cold":false,"light":true},{"id":214,"tradeName":"KETAMINE 500MG/10ML","activeIngredient":"Ketamin HCl","strength":"500mg/10mL","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm TM: Dung dịch tiêm chậm trên 1 phút (tốc độ 0,5mg/kg/phút. TTM: Dung dịch tiêm pha loãng với NaCl 0,9%/Glucose 5% thành dung dịch 1mg/mL (ở BN hạn chế dịch thì 2mg/ml, 10mg/ml)","storage":"Bảo quản dưới 30°C, tránh ánh sáng. Nên sử dụng ngay khi mở nắp. Độ ổn định lý hóa trong vòng 48h ở 25°C. Về vi sinh nên sử dụng trong vòng 24h ở 2–8°C","incompatibilities":"","manufacturer":"","notes":"AHSP khuyến cáo pha loãng dung dịch tiêm thành nồng độ 2mg/ml,10mg/ml truyền tĩnh mạch.","cold":false,"light":true},{"id":215,"tradeName":"KLEVAFLU SOL.INF 2MG/ 1ML","activeIngredient":"Fluconazol","strength":"2mg/1ml, 100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: - Đối với người lớn: Không quá 10ml/phút (1) - Đối với trẻ em: Không quá 5ml/phút (2)","storage":"Bảo quản < 30°C, tránh ánh sáng và ẩm.","incompatibilities":"Fluconazol tương kỵ với nhiều thuốc bao gồm Amphotericin B, Ampicilin, Calci gluconat, Cefotaxim, Ceftazidim, Ceftriaxonel, Clindamycin, Diazepam, Digoxin, Furosemid, Imipenem, Pantoprazol.","manufacturer":"Kleva Pharmaceuticals S.A.","notes":"Dung dịch tiêm truyền có chứa dung dịch NaCl pha loãng, bệnh nhân phải hạn chế Natri hoặc dịch cần cân nhắc về tốc độ khi truyền dịch. (1)","cold":false,"light":true},{"id":216,"tradeName":"LACTATED RINGERS & DEXTROSE 500ML","activeIngredient":"Dextrose monohydrat 25g + Natri clorid 3g + Kali clorid 0,15g + Natri lactat 1,5g + Calci clorid 2H20 0,1g","strength":"500ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"","storage":"","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":217,"tradeName":"LANTUS 100IU/ML","activeIngredient":"Insulin glargine (Insulin tác dụng chậm, kéo dài)","strength":"100UI/ml","dosageForm":"Dung dịch tiêm","routes":["TDD"],"reconstitution":"TDD: Dung dịch tiêm (1)","storage":"Khi chưa sử dụng bảo quản lọ thuốc ở 2–8°C, tránh ánh sáng. Lọ thuốc sau khi mở có thể sử dụng tới 28 ngày và bảo quản ở nhiệt độ <30°C, tránh ánh sáng và sức nóng trực tiếp.","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"SANOFI- AVENTIS DEUTSCHLAN D GMBH -ĐỨC","notes":"Không được tiêm tĩnh mạch. Nên ghi ngày rút thuốc lần đầu tiên trên nhãn lọ (1).","cold":true,"light":true},{"id":218,"tradeName":"LEFLOCIN","activeIngredient":"Levofloxacin","strength":"750mg/ 150ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm (truyền ít nhất 90 phút) (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 25°C, tránh ánh sáng. Thuốc phải được sử dụng ngay (5) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với các dung dịch khác (2)","manufacturer":"YURIA- PHARMA LTD -URAICA","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":false,"light":true},{"id":219,"tradeName":"LEVEMIR FLEXPEN 100U/ML, 3ML","activeIngredient":"Insulin detemir (rDNA)","strength":"300 U/3ml","dosageForm":"Dung dịch tiêm","routes":["TDD"],"reconstitution":"TDD: Dung dịch tiêm","storage":"Khi chưa sử dụng bảo quản lọ thuốc ở 2–8°C, không đông lạnh. Sau khi mở nắp: Sử dụng trong vòng 6 tuần bảo quản dưới 30°C/ có thể bảo quản 2–8°C.","incompatibilities":"","manufacturer":"Novo Nordisk Production S.A.S","notes":"","cold":true,"light":false},{"id":220,"tradeName":"LEVOFLOXACIN 750MG/150ML","activeIngredient":"Levofloxacin","strength":"750mg/150ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (truyền ít nhất 90 phút) (1)","storage":"Bảo quản < 30°C, tránh ánh sáng. Sử dụng ngay sau khi lấy ra khỏi túi (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch khác (2) Thuốc chỉ dùng một lần, loại bỏ phần thừa (1)","manufacturer":"Chi nhánh Công ty CP Dược phẩm Imexpharm - Nhà máy công nghệ cao Bình Dương","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":false,"light":true},{"id":221,"tradeName":"LEVOFLOXACIN KABI","activeIngredient":"Levofloxacin","strength":"500mg/ 100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (truyền ít nhất 60 phút) (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng. Thuốc phải được sử dụng ngay (5) Dung dịch thuốc dùng không hết trong lần phải được loại bỏ (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch heparin, các dung dịch kiềm khác (Natri hydro carbonat) (1)","manufacturer":"CTCP FRENESIUS KABI BIDIPHAR-VN","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":false,"light":true},{"id":222,"tradeName":"LEVOFLOXACIN/CO OPER SOLUTION FOR INFUSION","activeIngredient":"Levofloxacin","strength":"500mg/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (truyền ít nhất 60 phút) (1)","storage":"Sau khi lấy ra khỏi bao bì gốc trong điều kiện ánh sáng phòng: 3 ngày Thuốc phải được sử dụng ngay (trong vòng 3h) sau khi chọc thủng nút cao su (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch khác (2)","manufacturer":"Cooper S.A. Pharmaceuticals","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":false,"light":true},{"id":223,"tradeName":"LEVOGOLDS","activeIngredient":"Levofloxacin","strength":"750mg/ 150ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm (truyền ít nhất 90 phút) (1,2)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng. Thuốc phải được sử dụng ngay (5) Dung dịch thuốc dùng không hết trong lần phải được loại bỏ (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch heparin, các dung dịch kiềm khác (Natri hydro carbonat) (1)","manufacturer":"INFORLIFE S.A- THỤY SĨ","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":false,"light":true},{"id":224,"tradeName":"LEVONOR 1MG/1ML","activeIngredient":"Nor adrenalin (Nor Epinephrin)","strength":"1mg/ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM : 2mg (2ml) dung dịch tiêm + 48ml dung dịch Glucose 5% hoặc NaCl 0,9% (1) Theo DTQG 2022, dung dịch norepinephrin 1mg/ml phải được pha loãng trước khi truyền bằng glucose 5% hoặc hỗn hợp dung dịch glucose và NaCl, không pha với một mình dung dịch NaCl (2).","storage":"Dung dịch phải dùng ngay sau khi pha. Không sử dụng thuốc đã bị biến đổi màu (1).","incompatibilities":"Dùng riêng với các hợp chất có tính kiềm hoặc oxy hóa,Natri carbonate, Natri iodite, Streptomycin (1)","manufacturer":"WARSAW PHARMACEU TICAL WORKS POLFA S.A. - BALAN","notes":"Khuyến cáo dùng đường tĩnh mạch trung tâm do có thể gây co mạch tại chỗ rất mạnh và hoại tử mô (1) Khuyến cáo không pha trong NaCl 0,9% bắt nguồn từ chế phẩm Levophed với lý do là khả năng phân hủy oxy hóa trong dung dịch nước muối sinh lý nguyên chất (NaCl 0,9% có pH 5,5-6 hơi acid so với Glucose 5%), ngoài ra có thể liên quan đến nguy cơ của sự dư thừa Na+ nếu sử dụng trong bệnh lý tim mạch (ví dụ sốc tim,...)","cold":false,"light":false},{"id":225,"tradeName":"LICHAUNOX","activeIngredient":"Linezolid","strength":"600mg/ 300ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (thời gian truyền 30-120 phút) (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng. Tránh đông lạnh. Sau khi mở lọ thuốc sử dụng trong vòng 8h, nhiệt độ < 25°C (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"WARSAW PHARMACEU TICAL WORKS POLFA S.A. - BALAN","notes":"","cold":true,"light":true},{"id":226,"tradeName":"LIDOCAIN","activeIngredient":"Lidocain (hydroclorid)","strength":"40mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch nồng độ 10-20mg/mL TTM: Pha loãng với DW5 thành dung dịch 1- 8mg/mL Dùng gây tê tại chỗ, niêm mạc, gây tê từng lớp, gây tê phong bế thần kinh: Tiêm trực tiếp dung dịch tiêm vào mô, tiêm dưới da (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"","manufacturer":"Cty CP DP Vĩnh Phúc","notes":"AHSP TTM nồng độ 4- 8mg/mL","cold":false,"light":true},{"id":227,"tradeName":"LIDOCAIN HYDROCLORID","activeIngredient":"Lidocain (hydroclorid)","strength":"40mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"Dùng gây tê tại chỗ, niêm mạc, gây tê từng lớp, gây tê phong bế thần kinh: Tiêm trực tiếp dung dịch tiêm vào mô, tiêm dưới da (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Công ty CP Dược VTYT Hải Dương","notes":"","cold":false,"light":true},{"id":228,"tradeName":"LIDOCAIN KABI 2% 2ML","activeIngredient":"Lidocain (hydroclorid)","strength":"40mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"Dùng gây tê tại chỗ, niêm mạc, gây tê từng lớp, gây tê phong bế thần kinh: Tiêm trực tiếp dung dịch tiêm vào mô, tiêm dưới da (1,2)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"","manufacturer":"Công ty cổ phần Dược- TTBYT Bình Định (Bidiphar)","notes":"","cold":false,"light":true},{"id":229,"tradeName":"LIDOCAIN 40MG/2ML","activeIngredient":"Lidocain (hydroclorid)","strength":"40mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"Dùng gây tê tại chỗ, niêm mạc, gây tê từng lớp, gây tê phong bế thần kinh: Tiêm trực tiếp dung dịch tiêm vào mô, tiêm dưới da (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"","manufacturer":"Công ty cổ phần dược phẩm Minh Dân","notes":"Dung dịch để TTM phải pha loãng trước khi tiêm","cold":false,"light":true},{"id":230,"tradeName":"LIDOCAIN-BFS 200MG/10ML","activeIngredient":"Lidocain hydroclodrid 200mg/10ml","strength":"200mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch nồng độ 10-20mg/mL TTM: Pha loãng với DW5 thành dung dịch 1- 8mg/mL Dùng gây tê tại chỗ, niêm mạc, gây tê từng lớp, gây tê phong bế thần kinh: Tiêm trực tiếp dung dịch tiêm vào mô, tiêm dưới da (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"","manufacturer":"Công ty Cổ phần Dược phẩm CPC1 Hà Nội.","notes":"AHSP TTM nồng độ 4- 8mg/mL","cold":false,"light":true},{"id":231,"tradeName":"LIGNOSPAN STANDARD 1,8ML","activeIngredient":"Lidocaine hydrochloride 20mg + Epinephrine 10mcg + Sodium chloride 6,5mg + Potassium metabisulfite 1,2mg + Edetate disodium 0,25mg","strength":"","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"Không tiêm TM Dùng gây tê tại chỗ, niêm mạc, gây tê từng lớp, gây tê phong bế thần kinh: Tiêm trực tiếp dung dịch tiêm vào mô, tiêm dưới da, có thể dùng gây tê ngoài màng cứng","storage":"Dung dịch tiêm sử dụng ngay sau khi mở nắp","incompatibilities":"","manufacturer":"Septodont, Pháp","notes":"","cold":false,"light":false},{"id":232,"tradeName":"LINEZOLID 600","activeIngredient":"Linezolid","strength":"600mg/ 300ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (thời gian truyền 30-120 phút) (1,5)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng. Tránh đông lạnh. Sau khi mở lọ thuốc sử dụng trong vòng 8h, nhiệt độ < 25°C (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ < 25°C","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"AMVIPHARM- VIỆT NAM","notes":"","cold":true,"light":true},{"id":233,"tradeName":"LIPOFUNDIN MCT/LCT 20% 250ML","activeIngredient":"Nhũ dịch Lipid 20%","strength":"0.2","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Trong 15 phút đầu tốc độ truyền chỉ nên ~ 50% tốc độ tối đa (Tốc độ tối đa Người lớn: 0,15g/kg/giờ, Trẻ em và trẻ vị thành niên: 0,13g/kg/ giờ, Trẻ sơ sinh thiếu tháng-trẻ sơ sinh đủ tháng, trẻ sơ sinh và trẻ tập đi 0,17g/kg/giờ)","storage":"Sau khi mở ra lần đầu sử dụng ngay lập tức. Có thể bảo quản nhiệt độ phòng sử dụng trong tối đa 24 giờ, có thể bảo quản ở nhiệt độ 2–8°C-tránh đông lạnh (nhũ tương ở dạng đồng nhất có màu trắng sữa- không tách pha)","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":true,"light":true},{"id":234,"tradeName":"LISANOLONA 80MG/ 2ML","activeIngredient":"Triamcinolone acetonide","strength":"80mg/ 2ml","dosageForm":"Hỗn dịch tiêm","routes":["TB"],"reconstitution":"TB: Hỗn dịch tiêm (lắc kỹ) Tiêm trong khớp, quanh khớp:Hỗn dịch tiêm Tiêm vào vết thương/ trong da (trị sẹo lồi):Hỗn dịch tiêm","storage":"Bảo quản nhiệt độ phòng, tránh ánh sáng. Khi mở nắp có thể bảo quản ở 15–25°C dưới 28 ngày (đảm bảo điều kiện vi sinh)","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":235,"tradeName":"LORDIN","activeIngredient":"Omeprazole","strength":"40mg","dosageForm":"Bột đông khô + 10ml dung môi → dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Dung dịch tiêm. Tiêm chậm 2,5 phút, không quá 4ml/phút (1)","storage":"Dung dịch sau pha bảo quản trong vòng 4h, nhiệt độ < 25°C hoặc 24h ở 2–8°C (1)","incompatibilities":"Omeprazol tương kỵ với Lorazepam, Midazolam, Vancomycin (5). Không được trộn hoặc pha dung dịch Omeprazol để tiêm tĩnh mạch với các dung dịch tiêm truyền tĩnh mạch khác.","manufacturer":"CSSX bột đông khô: Vianex S.A.- Plant C'; CSSX dung môi: Vianex S.A.- Plant A'","notes":"Không được truyền tĩnh mạch (1)","cold":false,"light":false},{"id":236,"tradeName":"LOVENOX 4000","activeIngredient":"Enoxaparin natri 4000 anti-Xa IU (40mg)","strength":"4000 anti-Xa IU/0,4 ml","dosageForm":"Dung dịch tiêm đóng sẵn trong bơm tiêm","routes":["TDD"],"reconstitution":"TDD:dung dịch tiêm Tiêm vào mạch máu: Dung dịch tiêm tiêm vào ống dây của hệ thống thẩm phân nối với động mạch (1)","storage":"Bảo quản nhiệt độ phòng < 30°C. Thuốc phải giữ nguyên trong bao bì trước khi sử dụng","incompatibilities":"","manufacturer":"SANOFI WINTHROP INDUSTRIE - PHÁP","notes":"KHÔNG ĐƯỢC TIÊM BẮP (1) Bơm tiêm đóng sẵn có thể dùng ngay, không ấn pít-tông để đẩy bọt khí ra trước khi tiêm thuốc (1)","cold":false,"light":false},{"id":237,"tradeName":"LOVENOX 6000","activeIngredient":"Enoxaparin natri 6000 anti-Xa IU (60mg)","strength":"6000 anti-Xa IU/0,6 ml","dosageForm":"Dung dịch tiêm đóng sẵn trong bơm tiêm","routes":["TDD"],"reconstitution":"TDD:dung dịch tiêm Tiêm vào mạch máu: Dung dịch tiêm (bệnh nhân nhồi máu cơ tim cần dùng liều tĩnh mạch ban đầu- nên tiêm enoxaparin qua dây truyền tĩnh mạch) (1)","storage":"Bảo quản nhiệt độ phòng < 30°C. Thuốc phải giữ nguyên trong bao bì trước khi sử dụng","incompatibilities":"","manufacturer":"SANOFI WINTHROP INDUSTRIE - PHÁP","notes":"KHÔNG ĐƯỢC TIÊM BẮP (1) Bơm tiêm đóng sẵn có thể dùng ngay, không ấn pít-tông để đẩy bọt khí ra trước khi tiêm thuốc (1)","cold":false,"light":false},{"id":238,"tradeName":"MAGNESI SULFAT KABI 15% 10ML","activeIngredient":"Magnesi sulfat","strength":"15% (1,5g/10ml)","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm TTM: Dung dịch tiêm được pha loãng với dung dịch (Glucose 5%, NaCl 0,9%) (1,2)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng.","incompatibilities":"Chỉ được pha thuốc với dung dịch Glucose 5% hoặc NaCl 0,9% (1)","manufacturer":"FRESENIUS KABI BIDIPHAR- VN","notes":"Không được pha dung dịch tiêm vào Manitol và Natri bicarbonat (1)","cold":false,"light":true},{"id":239,"tradeName":"MANNITOL 20% 250ML","activeIngredient":"D-Mannitol 20%","strength":"0.2","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: 30-60 phút (Không pha loãng)","storage":"Bỏ phần còn lại","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":240,"tradeName":"MARCAINE SPINAL HEAVY INJ 0,5% 4ML","activeIngredient":"Bupivacain hydrochloride 5mg/ml","strength":"5mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"Tiêm nội tủy mạc (dưới màng nhện, tủy sống) Tiêm ngoài màng cứng","storage":"","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":241,"tradeName":"MAXAPIN","activeIngredient":"Cefepim","strength":"1g","dosageForm":"Bột pha tiêm + 3ml (nước cất pha tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TM: Dung dịch tiêm pha loãng thành 10 ml (Glucose 5%, NaCl 0,9%,…) (tiêm từ 3-5 phút) (1) TTM: Bột tiêm + 50-100ml (Glucose 5%, NaCl 0,9% (truyền 30 phút) (2) PHÒNG PHA TIÊM: Bột tiêm + 3 ml nước cất tiêm","storage":"Dung dịch pha tiêm bắp và tiêm tĩnh mạch ổn định trong vòng 24h ở nhiệt độ phòng < 25°C, 7 ngày ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng đường truyền với các kháng sinh khác (1)","manufacturer":"CÔNG TY CP PYMEPHARC O - VN","notes":"","cold":false,"light":false},{"id":242,"tradeName":"MEDAXONE 1G","activeIngredient":"Ceftriaxon 1g","strength":"1g","dosageForm":"Bột pha tiêm + 10 ml nước cất pha tiêm, Glucose 5%, NaCl 0,9%) → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm+ 2,1-3,6ml nước cất pha tiêm/NaCl 0,9%/Glucose 5%/Lidocain 1% TM: Dung dịch tiêm (TMC trong 5 phút) TTM: Dung dịch tiêm (C=100mg/ml) pha loãng với dung môi thành dung dịch 10-40mg/mL (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút)","storage":"Dung dịch hoàn nguyên, pha loãng ổn định 6h ở nhiệt độ phòng, 24h ở nhiệt độ 2–8°C","incompatibilities":"","manufacturer":"Medochemie","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":243,"tradeName":"MEDIVERNOL","activeIngredient":"Ceftriaxon","strength":"1g","dosageForm":"Bột pha tiêm + 10 ml nước cất tiêm → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm +10ml nước cất tiêm (tiêm từ 2- 4 phút) (1) (5) TTM: 2g bột tiêm + 40ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút) (1) (5) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha bảo quản trong vòng 24h ở nhiệt độ 2–8°C. Nên dùng dung dịch mới pha (1,2)","incompatibilities":"Không pha với các thuốc khác như Amsacrin, Vancomycin, Fluconazol, Aminoglycosid, đặc biệt không sử dụng dung môi chứa canxi (dung dịch Ringer hay Hartmann) (1)","manufacturer":"Công ty TNHH Medochemie","notes":"Có thể pha loãng dung dịch ceftriaxon thành 50-100ml với (NaCl 0,9%, Glucose 5%) để TTM (2,5) Liều tiêm TM >1g chỉ nên truyền TM (1,2)","cold":true,"light":false},{"id":244,"tradeName":"MEDOZOPEN","activeIngredient":"Meropenem","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 20ml nước cất tiêm (tiêm trong khoảng 5 phút) (1) TTM: Bột tiêm+50-200ml (Glucose 5%, NaCl 0,9%) (truyền từ 15 đến 30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 20ml NaCl 0,9%","storage":"Dung dịch sau khi pha loãng để TM hay TTM nên dùng ngay (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Medochemie Ltd. - Factory C-Cyprus","notes":"","cold":false,"light":false},{"id":245,"tradeName":"MEDSAMIC 250MG/5ML","activeIngredient":"Acid tranexamic","strength":"250mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm TTM: Dung dịch tiêm pha loãng với dung dịch Glucose 5%, NaCl 0,9% (1,2) (tiêm tĩnh mạch chậm không được quá 1 ml/phút) (1,2)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với penicillin (1)","manufacturer":"MEDOCHEMIE LTD-CYPRUS","notes":"Không có chỉ định tiêm bắp (1)","cold":false,"light":true},{"id":246,"tradeName":"MEILEO","activeIngredient":"Aciclovir","strength":"250mg/10ml","dosageForm":"Dung dịch tiêm truyền tĩnh mạch","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm trong bơm truyền kiểm soát tốc độ trong thời gian ít nhất 1h (1) TTM: + Với liều ≤ 500mg pha loãng 50- 100ml với dung dịch NaCl 0,9% + Với liều từ 500mg-1000mg pha loãng 100- 200ml với dung dịch NaCl 0,9% (thời gian truyền trên 60 phút) (1,5)","storage":"Dung dịch sau khi pha bảo quản trong vòng 8h ở nhiệt độ phòng 15–25°C, 24h ở nhiệt độ 2–8°C.","incompatibilities":"Dung dịch aciclovir tương kỵ với các chế phẩm máu v→ dung dịch chứa protein, foscarnet, meropenem, morphin sulphat, piperacillin - tazobactam. (2)","manufacturer":"TEDEC MEIJI FARMA- SPAIN","notes":"Nếu xuất hiện kết tủa hoặc bất thường trong quá trình pha loãng phải loại bỏ thuốc ngay (1,2)","cold":false,"light":false},{"id":247,"tradeName":"MERONEM 1G","activeIngredient":"Meropenem","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 20ml nước cất tiêm (tiêm trong khoảng 5 phút) (1,5) TTM: Bột tiêm + 50-200ml (Glucose 5%, NaCl 0,9%) (truyền từ 15 đến 30 phút) (1,5) PHÒNG PHA TIÊM: Bột tiêm + 20ml NaCl 0.9% (50mg/ml) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h (Lưu ý dung dịch pha NaCl 0,9%)","storage":"Dung dịch thuốc tiêm (pha với nước cất) có độ ổn định trong vòng 3h ở nhiệt độ < 25°C hay 16h ở 2–8°C. Dung dịch tiêm truyền có độ ổn định sau khi pha (với NaCl 0,9% trong vòng 3h ở nhiệt độ < 25°C hoặc 24h ở 2–8°C, với Glucose 5% nên sử dụng ngay lập tức) (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"ACS Dobfar SpA-Ý","notes":"Nên dùng thuốc ngay sau khi pha. Không đông lạnh thuốc sau khi pha (1)","cold":true,"light":false},{"id":248,"tradeName":"MERONEM 500MG","activeIngredient":"Meropenem","strength":"500mg","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 10ml nước cất tiêm (tiêm trong khoảng 5 phút) (1,5) TTM: Bột tiêm + 50-200ml (Glucose 5%, NaCl 0,9%) (truyền từ 15 đến 30 phút) (1,5) PHÒNG PHA TIÊM: Bột tiêm + 10ml NaCl 0.9% (50mg/ml) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h (Lưu ý dung dịch pha NaCl 0,9%)","storage":"Dung dịch thuốc tiêm (pha với nước cất) có độ ổn định trong vòng 3h ở nhiệt độ < 25°C hay 16h ở 2–8°C. Dung dịch tiêm truyền có độ ổn định sau khi pha (với NaCl 0,9% trong vòng 3h ở nhiệt độ < 25°C hoặc 24h ở 2–8°C, với Glucose 5% nên sử dụng ngay lập tức) (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"ACS DOBFAR S.P.A-Ý ĐÓNG GÓI ANH","notes":"Nên dùng thuốc ngay sau khi pha. Không đông lạnh thuốc sau khi pha (1)","cold":true,"light":false},{"id":249,"tradeName":"MEROPENEM ANFARM","activeIngredient":"Meropenem","strength":"500mg","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 10ml nước cất tiêm (tiêm trong khoảng 5 phút) (1) TTM: Bột tiêm+50-200ml (Glucose 5%, NaCl 0,9%) (truyền từ 15 đến 30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml NaCl 0.9% Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h (Lưu ý dung dịch pha NaCl 0,9%)","storage":"Dung dịch thuốc tiêm (pha với nước cất) có độ ổn định trong vòng 3h ở nhiệt độ < 25°C hoặc 12h ở nhiệt độ 2–8°C. Dung dịch sau khi pha loãng có độ ổn định với NaCl 0,9% trong vòng 3h ở nhiệt độ < 25°C hoặc 24h ở nhiệt độ 2–8°C. Dung dịch sau khi pha với Glucose 5% nên sử dụng ngay lập tức.","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Anfarm hellas S.A., Hy Lạp","notes":"Nên sử dụng thuốc ngay sau khi pha thành dung dịch (1) Không để đông lạnh (1)","cold":true,"light":false},{"id":250,"tradeName":"MEROPENEM KABI","activeIngredient":"Meropenem","strength":"500mg","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 10ml nước cất tiêm (tiêm trong khoảng 5 phút) (2) TTM: Bột tiêm + 50-200ml (Glucose 5%, NaCl 0,9%) (truyền từ 15 đến 30 phút) (5) PHÒNG PHA TIÊM: Bột tiêm + 10ml NaCl 0.9% Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h (Lưu ý dung dịch pha NaCl 0,9%)","storage":"Dung dịch thuốc tiêm (pha với nước cất) có độ ổn định trong vòng 3h ở nhiệt độ < 25°C hay 12h ở 2–8°C. Dung dịch tiêm truyền có độ ổn định sau khi pha (với NaCl 0,9% trong vòng 3h ở nhiệt độ < 25°C hoặc 24h ở 2–8°C, với Glucose 5% trong vòng 1h ở nhiệt độ <30°C, 4h ở 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"FARMACEUTI CAL S.P.A-Ý","notes":"Về mặt vi sinh nên sử dụng ngay sau khi qua (1)","cold":true,"light":false},{"id":251,"tradeName":"MEROPENEM KABI","activeIngredient":"Meropenem","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 20ml nước cất tiêm (tiêm trong khoảng 5 phút) (2) TTM: Bột tiêm + 50-200ml (Glucose 5%, NaCl 0,9%) (truyền từ 15 đến 30 phút) (5) PHÒNG PHA TIÊM: Bột tiêm + 20ml NaCl 0.9% Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h (Lưu ý dung dịch pha NaCl 0,9%)","storage":"Dung dịch thuốc tiêm (pha với nước cất) có độ ổn định trong vòng 3h ở nhiệt độ < 25°C hay 12h ở 2–8°C. Dung dịch tiêm truyền có độ ổn định sau khi pha (với NaCl 0,9% trong vòng 3h ở nhiệt độ < 25°C hoặc 24h ở 2–8°C, với Glucose 5% trong vòng 1h ở nhiệt độ <30°C, 4h ở 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"FACTA FARMACEUTI CAL S.P.A-Ý","notes":"Về mặt vi sinh nên sử dụng ngay sau khi qua (1)","cold":true,"light":false},{"id":252,"tradeName":"MEROVIA","activeIngredient":"Meropenem","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 20ml nước cất tiêm (tiêm trong khoảng 5 phút) (1) TTM: Bột tiêm+50-200ml (Glucose 5%, NaCl 0,9%) (truyền từ 15 đến 30 phút) (1)","storage":"Dung dịch sau khi pha loãng bảo quản < 12 giờ ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Remedina S.A","notes":"Nên sử dụng thuốc ngay sau khi pha thành dung dịch (1)","cold":true,"light":false},{"id":253,"tradeName":"METHOTREXAT BIDIPHAR 50MG/2ML","activeIngredient":"Methotrexat 50mg/2ml","strength":"50mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB","TDD"],"reconstitution":"TB, TDD: Dung dịch tiêm. Tiêm ống tuỷ sống: Dung dịch tiêm không có chất bảo quản Tiêm động mạch: Dung dịch tiêm/pha loãng nồng độ 1 25mg/ml. TM: Dung dịch tiêm/ dung dịch tiêm pha loãng với NaCl 0,9%/glucose 5% (nồng độ dung dịch ≤ 25 mg/ml, <100mg tiêm 5 phút, 100-300mg tiêm trong 15 phút) TTM: Dung dịch tiêm pha loãng với NaCl 0,9%, glucose 5% (pha loãng thành dung dịch nồng độ 1- 2mg/mL (tốt nhất nên 1mg/mL), 100mg truyền ít nhất trong 30 phút. Với chế độ liều cao > 1 g/m2 thì pha dung dịch trong 1000ml dung môi truyền 2-4 giờ theo phác đồ.","storage":"Dung dịch sau khi pha loãng: Bảo quản trong tủ lạnh 2–8°C trong 24h","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":true,"light":true},{"id":254,"tradeName":"METHYLERGOMETRINE MALEATE 0,2MG/ML","activeIngredient":"Methylergometrin e maleate 0,2mg/ml","strength":"0,2mg/ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB: Dung dịch tiêm TM: Tiêm chậm không dưới 60s (không thường xuyên vì có thể gây tăng huyết áp đột ngột và tai biến mạch máu não- chỉ dùng trong TH khẩn cấp)","storage":"Bảo quản nhiêt độ 2–8°C (có tài liệu nói rằng có thể bảo quản ở nhiệt độ phòng ống thuốc trong vòng 14 ngày). Dung dịch tiêm sử dụng ngay lập tức sau khi mở nắp.","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":true,"light":true},{"id":255,"tradeName":"METHYLPREDNISO LONE SOPHARMA","activeIngredient":"Methylprednisolo ne sodium succinate","strength":"40mg","dosageForm":"Bột đông khô pha tiêm+1ml nước cất tiêm → dung dịch tiêm.","routes":["TTM","TM","TB"],"reconstitution":"TB,TM: Dung dịch tiêm, tiêm trong vòng 5 phút TTM: Dung dịch tiêm pha với một lượng thích hợp dung dịch Glucose 5%, NaCl 0,9% truyền trong 30 phút (1)","storage":"Sử dụng dung dịch đã pha trong vòng 6h ở nhiệt độ < 30°C, 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Nên tiêm Methylprednisolone sodium succinate riêng rẽ (1)","manufacturer":"Sopharma AD- Bungari","notes":"Chế phẩm KHÔNG có dung môi kèm theo","cold":true,"light":false},{"id":256,"tradeName":"METRONIDAZOL","activeIngredient":"Metronidazol","strength":"500mg/ 100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm (tốc độ truyền 5ml/phút, truyền phải trên 20 phút) (1,5) (có thể pha loãng dung dịch tiêm với NaCl 0,9% hoặc Glucose 5% để truyền tĩnh mạch) (2)","storage":"Dung dịch tiêm sử dụng ngay sau khi mở nắp (5)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"B.Braun Melsungen AG- VN","notes":"Không bảo quản dung dịch tiêm truyền Metronidazol trong tủ lạnh (5)","cold":true,"light":false},{"id":257,"tradeName":"METRONIDAZOL KABI 500MG/100ML","activeIngredient":"Metronidazol","strength":"500mg/ 100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm (tốc độ truyền 5ml/phút, truyền phải trên 20 phút) (1,5) (có thể pha loãng dung dịch tiêm với NaCl 0,9% hoặc Glucose 5% để truyền tĩnh mạch) (2)","storage":"Dung dịch tiêm sử dụng ngay sau khi mở nắp (5)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"CTCP FRENESIUS KABI BIDIPHAR-VN","notes":"Không bảo quản dung dịch tiêm truyền Metronidazol trong tủ lạnh (5) THUỐC TRÁNH ÁNH SÁNG","cold":true,"light":true},{"id":258,"tradeName":"METRONIDAZOLE/V IOSER","activeIngredient":"Metronidazol","strength":"500mg/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm (tốc độ truyền 5ml/phút, truyền 20-60 phút) (1,5) (có thể được pha loãng với 1 đến 5 hoặc nhiều hơn thể tích dung dịch NaCl 0,9% hoặc Glucose 5%)","storage":"Dung dịch tiêm sử dụng ngay sau khi mở nắp (5) Bảo quản trong bao bì kín, tránh ánh sáng, tránh ẩm, ở nhiệt độ dưới 30°C (1)","incompatibilities":"Dùng riêng với các thuốc khác. (1) Metronidazol tiêm truyền không tương thích về mặt hóa học với dung dịch natri lactat (dung dịch Hartmamn) hoặc dung dịch Ringer (1)","manufacturer":"Vioser S.A Parenteral Solutions Industry","notes":"Không bảo quản dung dịch tiêm truyền Metronidazol trong tủ lạnh (5)","cold":true,"light":true},{"id":259,"tradeName":"MIDAPEZON 1G/1G","activeIngredient":"Cefoperazon + Sulbactam","strength":"1g + 1g","dosageForm":"Bột pha tiêm + 6,7ml (nước cất pha tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm pha loãng thành 20 ml dung dịch pha thuốc. Tiêm ít nhất trong 3 phút (1,2) TTM: Dung dịch tiêm pha loãng với ít nhất 20 ml (Glucose 5%, NaCl 0,9%) truyền từ 15-60 phút (1,2) Nếu TTM với Ringer Lactat: Bột pha tiêm + 6,7ml nước cất tiêm, sau đó pha loãng với 200 ml dung dịch Ringer Lactate (1)","storage":"Dung dịch thuốc sau khi pha loãng ổn định trong 24h ở nhiệt độ phòng (1)","incompatibilities":"Dùng riêng với Aminoglycosid (1)","manufacturer":"CCTCPDP MINH DÂN- VN","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":false,"light":false},{"id":260,"tradeName":"MIDAZOLAM ROTEXMEDICA","activeIngredient":"Midazolam","strength":"10mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB: Dung dịch tiêm. (1) TM: Dung dịch tiêm. (1) (tiêm chậm trong 5 phút) Bơm hậu môn: Dung dịch tiêm (nếu dung dịch tiêm quá ít có thể thêm nước cất tiêm đến tối đa 10ml (1)","storage":"Dung dịch tiêm sau khi pha loãng phải dùng ngay (1)","incompatibilities":"Không được pha với dung dịch Hartmann's (1)","manufacturer":"ROTEXMEDIC A-ĐỨC","notes":"Bảo quản theo qui chế thuốc hướng thần","cold":false,"light":false},{"id":261,"tradeName":"MIDAZOLAM B.BRAUN 1MG/ML- 50ML","activeIngredient":"Midazolam","strength":"1mg/ml-50ml","dosageForm":"Dung dịch tiêm/ truyền hoặc bơm hậu môn","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm (chỉ dùng trong trường hợp ngoại lệ vì gây đau) TM: Dung dịch tiêm TTM: Dung dịch tiêm (có thể pha loãng với dd (Glucose 5%, NaCl 0,9%) thành nồng độ mong muốn là 15mg/100-1000ml dung dịch để truyền) Bơm hậu môn: Dung dịch tiêm (nếu dung dịch tiêm quá ít có thể thêm nước cất tiêm đến tối đa 10ml) (1)","storage":"Dung dịch tiêm sau khi pha loãng bảo quản trong vòng 24h ở nhiệt độ 2–8°C.","incompatibilities":"Midazolam kết tủa trong các dung dịch chứa bicarbonat (1)","manufacturer":"B.Braun Medical S.A.","notes":"Bảo quản theo qui chế thuốc hướng thần","cold":true,"light":false},{"id":262,"tradeName":"MIDAZOLAM -HAMELN","activeIngredient":"Midazolam","strength":"5mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm (chỉ dùng trong trường hợp ngoại lệ vì gây đau) TM: Dung dịch tiêm. TTM: 3 ống dung dịch tiêm Midazolam + 100- 1000ml dung dịch (Glucose 5%, NaCl 0,9%) (tỷ lệ pha loãng: 15mg/100-1000ml). Bơm hậu môn: Dung dịch tiêm (nếu dung dịch tiêm quá ít có thể thêm nước cất tiêm đến tối đa 10ml) (1)","storage":"Dung dịch tiêm sau khi pha loãng bảo quản trong vòng 24h ở nhiệt độ 2–8°C.","incompatibilities":"Midazolam kết tủa trong các dung dịch chứa bicarbonat (1)","manufacturer":"HAMELN - ĐỨC","notes":"Bảo quản theo qui chế thuốc hướng thần","cold":true,"light":false},{"id":263,"tradeName":"MILRINONE - BFS","activeIngredient":"Milrinone","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm, tiêm chậm trong 10 phút (hoặc pha đến 20ml với NaCl 0,9%, Gluose 5%) (chỉ dùng liều tải) (2) TTM: 10ml dung dịch tiêm Milrinone + 40ml dung dịch (Glucose 5%, NaCl 0,9%, NaCl 0,45%) (1) (liều duy trì)","storage":"Dung dịch đã pha loãng nên sử dụng trong 24h (2) Sau khi pha loãng dung dịch bảo quản trong vòng 24h ở 2–8°C (5)","incompatibilities":"Không được pha với dung dịch NaHCO3, không được tiêm cùng một vị trí với furosemid, bumetanid để tránh kết tủa (1)","manufacturer":"Công ty Cổ phần Dược phẩm CPC1 Hà Nội","notes":"","cold":true,"light":false},{"id":264,"tradeName":"MILRINONE 1MG/ML","activeIngredient":"Milrinone","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm, tiêm chậm trong 10 phút (hoặc pha đến 20ml với NaCl 0,9%, Gluose 5%) (chỉ dùng liều tải) (2) TTM: 10ml dung dịch tiêm Milrinone + 40ml dung dịch (Glucose 5%, NaCl 0,9%) (liều duy trì) (1,2,5)","storage":"Sau khi pha loãng dung dịch bảo quản trong vòng 24h ở 2–8°C (1,5)","incompatibilities":"Không được pha với dung dịch NaHCO3, dùng riêng với furosemid.","manufacturer":"CENEXI - Pháp","notes":"Không được sử dụng nếu có dị vật lạ hay biến màu trong dung dịch sau khi pha.","cold":true,"light":false},{"id":265,"tradeName":"MITIWIND 350","activeIngredient":"Daptomycin","strength":"350mg","dosageForm":"Bột đông khô pha tiêm + 7ml NaCl 0,9% → dung dịch hoàn nguyên","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch hoàn nguyên (tiêm trong khoảng 2 phút) TTM: Dung dịch hoàn nguyên+ 50ml NaCl 0,9% (truyền trong vòng 30 phút) (1)","storage":"Dung dịch hoàn nguyên v→ dung dịch sau pha loãng ổn định trong 12h ở nhiệt độ phòng, 48h ở nhiệt độ 2–8°C (1).","incompatibilities":"Không được pha với dung dịch chứa Glucose (1)","manufacturer":"Công ty cổ phần dược phẩm Vĩnh Phúc","notes":"Để giảm thiểu hiện tượng tạo bọt, tránh lắc mạnh lọ thuốc trong và sau khi pha","cold":false,"light":false},{"id":266,"tradeName":"MIXIPEM","activeIngredient":"Imipenem + Cilastatin","strength":"500mg + 500mg","dosageForm":"Bột pha tiêm + 10 ml (NaCl 0.9%, Glucose 5%,...), lắc kỹ, thêm tiếp 10 ml dung môi trên, lắc kỹ để đảm bảo thuốc đã tan hoàn toàn (trong vòng 3 phút) → dung dịch tiêm (1)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm chuyển vào lọ chứa vừa đủ 100 ml dịch truyền (NaCl 0,9%, Glucose 5%) (1) (truyền 250-500mg Imipenem từ 20-30 phút, 1g Imipenem từ 40-60 phút) (1,5) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h.","storage":"Dung dịch sau khi pha loãng có thể bảo quản trong vòng 4h ở nhiệt độ phòng (25°C), trong vòng 24h ở nhiệt độ (4°C) (1,2)","incompatibilities":"Dùng riêng với các kháng sinh khác, không dùng dung dịch Lactate để pha thuốc (1)","manufacturer":"FACTA FARMACEUTI CAL S.P.A-Ý","notes":"Thường dùng dung dịch NaCl 0,9% để pha dịch truyền (2,5). Đảm bảo thuốc đã tan hoàn toàn trước khi truyền (1) Nếu có buồn nôn và/hoặc nôn trong khi dùng thuốc, giảm tốc độ truyền (1)","cold":false,"light":false},{"id":267,"tradeName":"MIXTARD 30 INJ.","activeIngredient":"Insulin trộn (M)","strength":"100UI/ml","dosageForm":"Hỗn dịch tiêm","routes":["TDD"],"reconstitution":"TDD: Hỗn dịch tiêm (1)","storage":"Lọ thuốc chưa mở nắp: Bảo quản ở nhiệt độ 2–8°C, tránh ánh sáng. Lọ thuốc đã mở nắp: Bảo quản < 30°C trong hộp bao bì đóng gói, phải dùng trong 5 tuần (1)","incompatibilities":"Dùng riêng với các dịch truyền (1)","manufacturer":"NOVO NORDISK PRODUCTION SAS-PHÁP","notes":"Không được tiêm tĩnh mạch. Khi mang lọ thuốc ra khỏi tủ lạnh nên đưa lọ thuốc về nhiệt độ phòng trước khi trộn insulin theo hướng dẫn.","cold":true,"light":true},{"id":268,"tradeName":"MIZAPENEM","activeIngredient":"Meropenem","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 20ml nước cất tiêm (tiêm trong khoảng 5 phút) (1) TTM: Bột tiêm+50-200ml (Glucose 5%, NaCl 0,9%) (truyền từ 15 đến 30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 20ml NaCl 0.9% Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h (Lưu ý dung dịch pha NaCl 0,9%)","storage":"Dung dịch sau khi pha loãng có độ ổn định (với NaCl 0,9% trong vòng 8h, Glucose 5% là 3h ở nhiệt độ 15–25°C; với NaCl 0,9% trong vòng 48h, Glucose 5% là 14h ở nhiệt độ 2–8°C (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ 2–8°C","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"CCTCPDP MINH DÂN- VN","notes":"Nên sử dụng thuốc ngay sau khi pha thành dung dịch (1)","cold":true,"light":false},{"id":269,"tradeName":"MIZAPENEM","activeIngredient":"Meropenem","strength":"500mg","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 10ml nước cất tiêm (tiêm trong khoảng 5 phút) (1) TTM: Bột tiêm+50-200ml (Glucose 5%, NaCl 0,9%) (truyền từ 15 đến 30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml NaCl 0.9% Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h (Lưu ý dung dịch pha NaCl 0,9%)","storage":"Dung dịch sau khi pha loãng có độ ổn định (với NaCl 0,9% trong vòng 8h, Glucose 5% là 3h ở nhiệt độ 15–25°C; với NaCl 0,9% trong vòng 48h, Glucose 5% là 14h ở nhiệt độ 2–8°C (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ 2–8°C","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"CCTCPDP MINH DÂN- VN","notes":"Nên sử dụng thuốc ngay sau khi pha thành dung dịch (1)","cold":true,"light":false},{"id":270,"tradeName":"MOBIC 15MG/1,5ML","activeIngredient":"Meloxicam 15mg/1,5ml","strength":"15mg/1,5ml","dosageForm":"Dung dịch tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm","storage":"Bảo quản dưới 30°C. Sử dụng ngay khi mở nắp.","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":271,"tradeName":"MORPHIN","activeIngredient":"Morphin hydroclorid","strength":"10mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB","TDD"],"reconstitution":"TDD,TB,TM: Dung dịch tiêm (1) TTM: Pha với dung môi NaCl 0,9% với một lượng thích hợp (5) Tiêm bắp không được khuyến khích vì gây đau và không có ưu điểm hơn về động học so với tiêm dưới da (1)","storage":"Bảo quản 15–30°C, tránh ánh sáng, tránh đông lạnh (2)","incompatibilities":"Morphin nhạy với sự thay đổi pH và dễ bị kết tủa trong môi trường kiềm (2) Dùng riêng với các thuốc khác (1)","manufacturer":"VIDIPHAR-VN","notes":"Bảo quản theo qui chế thuốc gây nghiện. Tránh sử dụng bằng 2 đường khác nhau cùng một lúc","cold":true,"light":true},{"id":272,"tradeName":"MUCOMUCIL","activeIngredient":"N-Acetylcystein","strength":"300mg/3ml","dosageForm":"Dung dịch dùng để tiêm và khí dung","routes":["TTM","TM"],"reconstitution":"Phun khí dung: Dung dịch thuốc Mucomucil (1) TM: Dung dịch thuốc Mucomucil (liều đầu tiên TM nên được pha loãng với NaCl 0,9%, Glucose 5% theo tỷ lệ 1:1) (1) TTM: Dung dịch thuốc Mucomucil pha với một lượng thích hợp Glucose 5% (có thể dùng NaCL 0,9% khi không thể dùng Glucose 5%) gồm 3 giai đoạn TTM liên tiếp cho người lớn*: -Giai đoạn 1 : 150mg/kg thể trọng (pha loãng đến 200ml Glucose 5%), truyền trong 1 giờ. -Giai đoạn 2 : 50mg/kg thể trọng (pha loãng đến 500ml Glucose 5%), truyền trong 4 giờ. -Giai đoạn 3 : 100mg/kg thể trọng (pha loãng đến 1000ml Glucose 5%), truyền trong 16 giờ. (1) *Trẻ em thể tích pha loãng dựa trên cân nặng, tham khảo tờ HDSD","storage":"Sau khi mở lọ sử dụng trong vòng 24h, bảo quản ở nhiệt độ 2–8°C (1)","incompatibilities":"Tương kỵ với dầu iod, trypsin và hydrogen peroxyd, một số kim loại như sắt, đồng, cao su (1)","manufacturer":"Esseti Farmaceutici S.r.l, Italia","notes":"","cold":true,"light":false},{"id":273,"tradeName":"MYCAMINE","activeIngredient":"Micafungin natri","strength":"50mg","dosageForm":"Bột đông khô pha tiêm + 5 ml (NaCl 0.9%, Glucose 5%) → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên pha thành 100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền trong vòng 60 phút) (1)","storage":"Dung dịch hoàn nguyên v→ dung dịch đã pha loãng có thể bảo quản trong vòng 24h ở nhiệt độ < 30°C, tránh ánh sáng (1)","incompatibilities":"Dùng riêng với các thuốc khác (1) Trước khi truyền TM cần được rửa sạch dây truyền hiện có với dung dịch NaCl 0,9%","manufacturer":"Astellas Pharma Tech Co., Ltd. Takaoka Plant- Japan","notes":"Khi pha dung dịch hoàn nguyên nên xoay nhẹ nhàng, KHÔNG ĐƯỢC LẮC để tránh tạo bọt (1)","cold":false,"light":true},{"id":274,"tradeName":"NAFLOXIN SOLUTION FOR INFUSION","activeIngredient":"Ciprofloxacin","strength":"200mg/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền - Đối với người lớn: Truyền trong 30 phút. - Đối với trẻ em: Truyền trong 60 phút (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng, tránh đóng băng. PHÒNG PHA TIÊM: 24h ở 2–8°C","incompatibilities":"Dung dịch tiêm truyền Ciprofloxacin có pH từ 3,9-4,5 không được trộn với các thuốc có pH cao (Penicillin, Heparin) (1)","manufacturer":"Cooper S.A. Pharmaceuticals","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":true,"light":true},{"id":275,"tradeName":"NALOXONE - HAMELN 0,4MG/1ML","activeIngredient":"Naloxon","strength":"0.4mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm TTM: 5 ống Naloxon (2mg) pha thành 500 ml dung dịch (NaCl 0,9%, Glucose 5%) (1)","storage":"Sau khi pha loãng dung dịch ổn định trong vòng 24h ở 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc chứa bisulphite, metabisulphite, các dung dịch có độ pH kiềm (1)","manufacturer":"Siegfried Hameln GmbH- ĐỨC","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":true,"light":true},{"id":276,"tradeName":"NATRI CLORID 10% 250ML","activeIngredient":"Natri clorid 10%","strength":"0.1","dosageForm":"Dung dịch tiêm, truyền","routes":["TTM","TM"],"reconstitution":"TM,TTM","storage":"Theo nhà SX phải dùng ngay khi mở nắp. Bảo quản nhiệt độ phòng. Có thể sử dụng trong vòng 24 giờ sau khi mở nắp tuy nhiên trách nhiệm thuộc về người dùng","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":277,"tradeName":"NATRI CLORID 0,9% 100ML","activeIngredient":"Natri clorid 0,9%","strength":"0.009","dosageForm":"Dung dịch tiêm, truyền","routes":["TTM","TM"],"reconstitution":"TM,TTM","storage":"Theo nhà SX phải dùng ngay khi mở nắp. Bảo quản nhiệt độ phòng. Có thể sử dụng trong vòng 24 giờ sau khi mở nắp tuy nhiên trách nhiệm thuộc về người dùng","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":278,"tradeName":"NATRI CLORID 0,45% 500ML","activeIngredient":"Natri clorid 0,45%","strength":"0.0045","dosageForm":"Dung dịch tiêm, truyền","routes":["TTM","TM"],"reconstitution":"TM,TTM","storage":"Theo nhà SX phải dùng ngay khi mở nắp. Bảo quản nhiệt độ phòng. Có thể sử dụng trong vòng 24 giờ sau khi mở nắp tuy nhiên trách nhiệm thuộc về người dùng","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":279,"tradeName":"NATRI CLORID 3% 100ML","activeIngredient":"Natri clorid 3%","strength":"0.03","dosageForm":"Dung dịch tiêm, truyền","routes":["TTM","TM"],"reconstitution":"TM,TTM","storage":"Theo nhà SX phải dùng ngay khi mở nắp. Bảo quản nhiệt độ phòng. Có thể sử dụng trong vòng 24 giờ sau khi mở nắp tuy nhiên trách nhiệm thuộc về người dùng","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":280,"tradeName":"NEBIDO 1000MG/4ML","activeIngredient":"Testosterone undecanoate 1000mg/4ml","strength":"1000mg/4ml","dosageForm":"","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm","storage":"Bảo quản nhiệt độ phòng. Sử dụng liều đơn ngay khi mở nắp.","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":281,"tradeName":"NEOSTIGMIN 0,5MG/ML","activeIngredient":"Neostigmine methylsulfate","strength":"0,5mg/ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB","TDD"],"reconstitution":"TDD, TB, TM (tiêm chậm): Dung dịch tiêm (1)","storage":"Bảo quản ống thuốc < 25°C","incompatibilities":"Dùng riêng với Atropin (1)","manufacturer":"HAMELN- ĐỨC","notes":"Không được sử dụng nếu dung dịch bị đổi màu. THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":282,"tradeName":"NEXIUM 40MG","activeIngredient":"Esomeprazole sodium","strength":"40 mg","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm+ 5ml dung dịch NaCl 0,9%. TTM: 40 - 80mg bột tiêm hòa tan vừa đủ 100ml dung dịch NaCl 0,9%, truyền tĩnh mạch trong 10-30 phút (1)","storage":"Dung dịch sau khi pha chỉ sử dụng một lần duy nhất trong vòng 12h, không sử dụng lại phần dung dịch thừa. (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"ASTRAZENEC A AB -THỤY ĐIỂN","notes":"","cold":false,"light":false},{"id":283,"tradeName":"NICARDIPINE 10MG/10ML","activeIngredient":"Nicardipin","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM Điều trị tấn công (5-15 mg/giờ) Cách 1 : Bolus tĩnh mạch chậm 1/4 ống (2,5mg), có thể lặp lại sau 10 phút. Tổng liều: Tối đa 10mg. Cách 2 : Dùng bơm tiêm điện, pha 1/2 ống + 45 ml Glucose 5%, truyền tĩnh mạch 50ml/giờ (5 mg/giờ). Liều tối đa: 15 mg/giờ Điều trị duy trì (2-4 mg/giờ) Cách 1 : Dùng bơm tiêm điện, pha 1/2 ống + 45ml Glucose 5%, truyền tĩnh mạch 20 ml/giờ (2 mg/giờ) Cách 2 : Dùng bơm tiêm điện, pha 1 ống + 40ml Glucose 5%, truyền tĩnh mạch 10 ml/giờ (2 mg/giờ) Nồng độ tối đa khi tiêm truyền tĩnh mạch ngoại biên: 0,2 mg/ml.","storage":"Dung dịch thuốc sau khi mở nắp hoặc pha loãng bảo quản ở nhiệt độ phòng < 25°C trong vòng 24h, tránh ánh sáng (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"AGUETTANT- PHÁP","notes":"Chỉ dùng tiêm truyền tĩnh mạch Chỉ được tiêm truyền dung dịch đậm đặc khi qua catheter tĩnh mạch trung tâm. THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":284,"tradeName":"NIGLYVID","activeIngredient":"Glyceryl trinitrat (Nitroglycerin)","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm hoặc pha loãng dung dịch tiêm với dung dịch (Glucose 5%, NaCl 0,9%) theo tỷ lệ 1: 10 cho đến 1: 40. (10mg pha trong 100-400ml) (1). Dung dịch thuốc nên truyền chậm (1).","storage":"Dung dịch sau khi pha sử dụng trong vòng 24h ở nhiệt độ 2–8°C Nên dùng ngay sau khi mở ống thuốc (1)","incompatibilities":"Dung dịch Glyceryl trinitrat không tương thích với ống tiêm (hoặc hệ thống tiêm) bằng nhựa PVC vì có thể hấp thu đến 50% Glyceryl trinitrat từ dung dịch (1)","manufacturer":"Siegfried Hameln GmbH","notes":"Nên được sử dụng bằng bộ bơm truyền vi giọt hoặc bằng bộ thiết bị tương tự giúp duy trì tốc độ truyền ổn định. Thuốc tương thích với bộ dây truyền bằng thủy tinh hoặc polyethylene (1)","cold":true,"light":false},{"id":285,"tradeName":"NO - SPA 40MG/2ML","activeIngredient":"Drotaverin hydrochloride 40mg/2ml","strength":"40mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB: Dung dịch tiêm TM: Dung dịch tiêm","storage":"Bảo quản <=25°C","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":286,"tradeName":"NOBSTRUCT","activeIngredient":"N-Acetylcystein","strength":"300mg/3ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB, Phun khí dung, Nhỏ giọt NKQ: Dung dịch tiêm TTM: Pha với một lượng thích hợp Glucose 5%. Giải độc quá liều Paracetamol gồm 3 giai đoạn TTM liên tiếp cho người lớn: -Giai đoạn 1: 150mg/kg thể trọng (pha loãng đến 200ml Glucose 5%), truyền trong 15 phút. -Giai đoạn 2: 50mg/kg thể trọng (pha loãng đến 500ml Glucose 5%), truyền trong 4 giờ. -Giai đoạn 3: 100mg/kg thể trọng (pha loãng đến 1000ml Glucose 5%), truyền trong 16 giờ. (1)","storage":"Dung dịch sau khi pha phải dùng ngay (1)","incompatibilities":"Tương kỵ với dầu iod, trypsin và hydrogen peroxyd, một số kim loại như sắt, niken, đồng, cao su (1)","manufacturer":"Công ty cổ phần dược phẩm Trung Ương 2","notes":"Thuốc có chứa 14,37 mg natri mỗi ml dung dịch tiêm, cân nhắc dùng cho bệnh nhân ăn kiêng muối.","cold":false,"light":false},{"id":287,"tradeName":"NORADRENALIN","activeIngredient":"Nor adrenalin tartrat (Nor Epinephrin)","strength":"8mg/4ml","dosageForm":"Dung dịch đậm đặc để pha tiêm truyền","routes":["TTM"],"reconstitution":"TTM: 2mg (2ml) dung dịch tiêm + 48ml dung dịch Glucose 5% hoặc NaCl 0,9% (1) Theo DTQG 2022, dung dịch norepinephrin 1mg/ml phải được pha loãng trước khi truyền bằng glucose 5% hoặc hỗn hợp dung dịch glucose và NaCl, không pha với một mình dung dịch NaCl (2).","storage":"Dung dịch sau khi pha loãng sử dụng trong vòng 24h. (1) Dung dịch sau khi pha có thể bảo quản ở nhiệt độ 2–8°C (5)","incompatibilities":"Dùng riêng với các chất có tính kiềm (1)","manufacturer":"CT CP DƯỢC PHẨM VĨNH PHÚC","notes":"Truyền qua tĩnh mạch trung tâm (1) Khuyến cáo không pha trong NaCl 0,9% bắt nguồn từ chế phẩm Levophed với lý do là khả năng phân hủy oxy hóa trong dung dịch nước muối sinh lý nguyên chất (NaCl 0,9% có pH 5,5-6 hơi acid so với Glucose 5%), ngoài ra có thể liên quan đến nguy cơ của sự dư thừa Na+ nếu sử dụng trong bệnh lý tim mạch (ví dụ sốc tim,...)","cold":true,"light":false},{"id":288,"tradeName":"NORADRENALIN","activeIngredient":"Nor adrenalin tartrat (Nor Epinephrin)","strength":"4mg/4ml","dosageForm":"Dung dịch đậm đặc để pha tiêm truyền","routes":["TTM"],"reconstitution":"TTM: 4mg (4ml) dung dịch tiêm + 96ml dung dịch Glucose 5% (1) Theo DTQG 2022, dung dịch norepinephrin 1mg/ml phải được pha loãng trước khi truyền bằng glucose 5% hoặc hỗn hợp dung dịch glucose và NaCl, không pha với một mình dung dịch NaCl (2).","storage":"Dung dịch sau khi pha có thể bảo quản ở nhiệt độ 2–8°C và truyền ở nhiệt độ phòng trong vòng 24h (5)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Công ty cổ phần dược vật tư y tế Hải Dương","notes":"Để tránh hoại tử mô nên truyền qua tĩnh mạch trung tâm hoặc các tĩnh mạch lớn ở phía trên các chi, khuyến cáo là cánh tay (1) Khuyến cáo không pha trong NaCl 0,9% bắt nguồn từ chế phẩm Levophed với lý do là khả năng phân hủy oxy hóa trong dung dịch nước muối sinh lý nguyên chất (NaCl 0,9% có pH 5,5-6 hơi acid so với Glucose 5%), ngoài ra có thể liên quan đến nguy cơ của sự dư thừa Na+ nếu sử dụng trong bệnh lý tim mạch (ví dụ sốc tim,...)","cold":true,"light":false},{"id":289,"tradeName":"NORADRENALIN BASE AGUETTANT","activeIngredient":"Nor adrenalin (Nor Epinephrin)","strength":"4mg/4ml","dosageForm":"Dung dịch đậm đặc để pha tiêm truyền","routes":["TTM"],"reconstitution":"TTM : 2mg (2ml) dung dịch tiêm + 48ml dung dịch Glucose 5% hoặc NaCl 0,9% (1) Theo DTQG 2022, dung dịch norepinephrin 1mg/ml phải được pha loãng trước khi truyền bằng glucose 5% hoặc hỗn hợp dung dịch glucose và NaCl, không pha với một mình dung dịch NaCl (2).","storage":"Dung dịch thuốc sau khi pha phải dùng trong vòng 12h ở nhiệt độ 25°C","incompatibilities":"Dùng riêng với các chất có tính kiềm (1)","manufacturer":"AGUETTANT- PHÁP","notes":"Khuyến cáo dùng đường tĩnh mạch trung tâm do có thể gây co mạch tại chỗ rất mạnh và hoại tử mô (1) Khuyến cáo không pha trong NaCl 0,9% bắt nguồn từ chế phẩm Levophed với lý do là khả năng phân hủy oxy hóa trong dung dịch nước muối sinh lý nguyên chất (NaCl 0,9% có pH 5,5-6 hơi acid so với Glucose 5%), ngoài ra có thể liên quan đến nguy cơ của sự dư thừa Na+ nếu sử dụng trong bệnh lý tim mạch (ví dụ sốc tim,...)","cold":false,"light":false},{"id":290,"tradeName":"NOTRIXUM","activeIngredient":"Atracurium besylat","strength":"25mg/2,5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm TTM: Dung dịch tiêm được pha loãng với dung dịch (Glucose 5%, NaCl 0,9%) để được dung dịch truyền nồng độ ³ 0,5 mg/ml (1)","storage":"Bảo quản thuốc ở nhiệt độ 2–8°C. Dung dịch sau khi pha loãng với NaCl 0,9% ổn định trong 24h và glucose 5% trong 8h ở nhiệt độ < 30°C (1)","incompatibilities":"Atracurium besylat là chất nhược trương sẽ ảnh hưởng đến chế phẩm máu nên dùng riêng đường truyền (1)","manufacturer":"PT. Novell Pharmaceutical Laboratories, Indonesia","notes":"","cold":false,"light":false},{"id":291,"tradeName":"NOVERON","activeIngredient":"Rocuronium bromid","strength":"10mg/ml, 5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM, TTM: Dung dịch tiêm (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ 2–8°C, tránh đông lạnh.","incompatibilities":"Dùng riêng với các thuốc: Amoxicillin, amphotericin B, cefazolin, cloxacillin, dexamethason, diazepam. Furosemid, hydrocortison, methylprednisolon, prednisolon, insulin, trimethoprim, vancomycin (1)","manufacturer":"PT. Novell Pharmaceutical Laboratories, Indonesia","notes":"Dung dịch tiêm tương hợp với NaCl 0,9%, Glucose 5% (1)","cold":true,"light":false},{"id":292,"tradeName":"NOVOMIX FLEXPEN 100U/ML","activeIngredient":"Insulin aspart","strength":"100U/1ml, 3ml","dosageForm":"Hỗn dịch tiêm","routes":["TDD"],"reconstitution":"TDD: Hỗn dịch tiêm","storage":"Khi chưa sử dụng bảo quản lọ thuốc ở 2–8°C, không đông lạnh. Lọ thuốc sau khi mở có thể sử dụng tới 28 ngày và bảo quản ở nhiệt độ <30°C, tránh ánh sáng, sức nóng trực tiếp. (1)","incompatibilities":"","manufacturer":"Novo Nordisk Production S.A.S","notes":"Không được tiêm tĩnh mạch hoặc tiêm bắp","cold":true,"light":true},{"id":293,"tradeName":"NƯỚC VÔ KHUẨN MKP 1000ML","activeIngredient":"Nước cất vô khuẩn (dùng ngoài)","strength":"","dosageForm":"Dung dịch dùng ngoài","routes":["TTM"],"reconstitution":"","storage":"24h ở dưới 25°C sau khi mở","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":294,"tradeName":"NUPOVEL","activeIngredient":"Propofol","strength":"10mg/ml, ống 20ml","dosageForm":"Nhũ tương tiêm truyền","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm TTM: Nhũ tương tiêm hoặc pha loãng với Glucose 5% không vượt quá tỷ lệ 1:5 (1)","storage":"Nhũ tương tiêm sau khi pha loãng dùng trong vòng 6h (1) Tránh đông lạnh.","incompatibilities":"Dùng riêng với các dung dịch tiêm truyền khác (1)","manufacturer":"PT. Novell Pharmaceutical Laboratories","notes":"Có thể dùng cùng lúc NaCl 0,9% qua chạc ba (1)","cold":true,"light":false},{"id":295,"tradeName":"OFFIPAIN","activeIngredient":"Paracetamol","strength":"1g/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền trong 15 phút (1)","storage":"Bảo quản thuốc ở nhiệt độ < 30°C. Không để trong tủ lạnh hoặc làm đông lạnh. Dùng thuốc ngay sau khi mở, dung dịch dùng dư phải hủy bỏ. (1)","incompatibilities":"","manufacturer":"Demo S.A. Pharmaceutical Industry (Hy Lạp)","notes":"Lọ thuốc 100ml giới hạn chỉ dùng cho trẻ em và người lớn > 33kg","cold":true,"light":false},{"id":296,"tradeName":"OMELUPEM","activeIngredient":"Omeprazole","strength":"40 mg","dosageForm":"Bột đông khô pha tiêm","routes":["TTM"],"reconstitution":"TTM: Bột đông khô pha pha loãng đến 100ml dd (Glucose 5%, NaCl 0,9%) (truyền chậm trong vòng 20-30 phút) (1)","storage":"Dung dịch đã pha với NaCl 0,9% ổn định trong vòng 12h, pha với glucose 5% ổn định trong 6h (1) Nên dùng thuốc sau khi pha trong vòng 3h (1)","incompatibilities":"","manufacturer":"STANDARD CHEM. & PHARM. CO. LTD.- TAIWAN","notes":"Chỉ dùng tiêm truyền tĩnh mạch (1)","cold":false,"light":false},{"id":297,"tradeName":"OMEPRAZOL NORMON 40MG","activeIngredient":"Omeprazole","strength":"40 mg","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột pha tiêm+ 10ml NaCl 0,9%. Tiêm chậm ít nhất 3 phút, không quá 4ml/phút (1) (5). TTM: Bột đông khô pha pha loãng đến 100ml dung dịch (Glucose 5%, NaCl 0,9%) (truyền trong vòng 20-30 phút) (1)","storage":"Dung dịch đã pha với NaCl 0,9% bảo quản trong 12h, pha với glucose 5% bảo quản trong 6h (1)","incompatibilities":"Dùng riêng với các dung dịch tiêm truyền khác (1)","manufacturer":"LABORATORI OS NORMON, S.A- SPAIN","notes":"","cold":false,"light":false},{"id":298,"tradeName":"OMEUSA","activeIngredient":"Oxacilin","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 5,7ml nước cất tiêm, NaCl 0,9% (1) TM: Bột tiêm + 10ml (nước cất tiêm, NaCl 0,9%) tiêm trong vòng 10 phút (1) TTM: Dung dịch tiêm TM pha loãng với dung dịch NaCl 0,9% (Nồng độ tối đa không quá 40mg/ml) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha ổn định trong vòng 4 ngày ở nhiệt độ <25°C, 7 ngày ở 2–8°C (1)","incompatibilities":"Oxacillin có thể tương kỵ về mặt hóa học với Aminoglycosid (2)","manufacturer":"S.C. Antibiotice S.A.- Rumani","notes":"Tiêm tĩnh mạch chậm trong vòng 10 phút để giảm thiểu kích ứng tĩnh mạch (1)","cold":true,"light":false},{"id":299,"tradeName":"ONDANOV 4MG/2ML","activeIngredient":"Ondansetron 2mg/ml","strength":"2mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm (chậm 2-5 phút) TTM: Pha loãng dung dịch tiêm với 50 NaCl 0,9%/glucose 5%/Ringer lactat/ Manitol truyền trên 15- 30 phút","storage":"Bảo quản nhiệt độ phòng. Dung dịch tiêm dùng ngay khi mở nắp. DD pha loãng ổn định hóa lý 48h ở nhiệt độ 25°C về mặt vi sinh sử dụng không quá 24h bảo quản nhiệt độ 2–8°C.","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG. TM: Dung dịch tiêm TTM: Pha loãng dung dịch tiêm với 10-50 NaCl 0,9%/glucose 5%/Ringer lactat/ Manitol truyền trên 15-30 phút (Trẻ em từ 6 tháng-1 năm tuổi/<=10kg).","cold":true,"light":true},{"id":300,"tradeName":"OPIPHINE 10MG/ML","activeIngredient":"Morphin sulfat 10mg/ml","strength":"10mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB","TDD"],"reconstitution":"TB, TDD: Dung dịch tiêm. Tiêm ngoài màng cứng: TM: Chỉ khi cần khởi phát tác dụng nhanh - dung dịch tiêm/ pha loãng với NaCl 0,9%/glucose 5% thành nồng độ 0,5-5mg/mL. TTM: Dung dịch tiêm pha loãng với NaCl 0,9%/glucose 5% thành dung dịch nồng độ 0,1- 5mg/mL Tiêm nội tủy mạc (tủy sống):","storage":"Dung dịch pha loãng với NaCl 0,9% ổn định lý hóa trong 48 giờ ở nhiệt độ 25°C. Nên dùng ngay sau khi pha loãng, thường bảo quản nhiệt độ 2–8°C trong vòng 24h.","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":true,"light":true},{"id":301,"tradeName":"ORADAYS","activeIngredient":"Ciprofloxacin","strength":"200 mg/100 ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền - Đối với người lớn: Truyền trong hơn 30 phút. - Đối với trẻ em: Truyền trong 30- 60 phút (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng, tránh đông lạnh. PHÒNG PHA TIÊM: 24h ở 2–8°C","incompatibilities":"Dung dịch tiêm truyền Ciprofloxacin có pH từ 3,9-4,5 nên dùng riêng với các thuốc có pH cao (Penicillin, clindamycin, heparin) (1)","manufacturer":"S.C. Infomed Fluids S.R.L- Rumani","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":true,"light":true},{"id":302,"tradeName":"ORGALUTRAN 0,25MG/0,5ML","activeIngredient":"Ganirelix","strength":"0,25mg/0,5ml","dosageForm":"Xy lanh chứa dung dịch tiêm","routes":["TDD"],"reconstitution":"TDD: Dung dịch tiêm","storage":"Bảo quản dưới 30°C. Không để đông đá","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":303,"tradeName":"OVITRELLE PREFILL 250MCG/0.5ML","activeIngredient":"Choriomic Gonadotrophin","strength":"250mcg/0.5ml","dosageForm":"Bút chứa dung dịch tiêm pha sẵn 0,5mL+ 01 kim tiêm","routes":["TDD"],"reconstitution":"TDD: Dung dịch tiêm","storage":"Bảo quản trong tủ lạnh 2–8°C. Không để đông lạnh. Sau khi mở, nên dùng thuốc ngay lập tức.","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":false},{"id":304,"tradeName":"OXACILLIN 1G","activeIngredient":"Oxacilin","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 5ml nước cất tiêm (1) TM: Bột tiêm + 10ml (nước cất tiêm, NaCl 0,9%) tiêm trong vòng 10 phút (1) TTM: Bột tiêm + một lượng tối thiểu 25ml dung dịch NaCl 0,9%. (Nồng độ tối đa không quá 40mg/ml) (1) TTM: Bột tiêm + 10 ml (nước cất pha tiêm, NaCl 0,9%), sau đó pha loãng với DD tiêm truyền tương ứng (Dextrose 5%, NaCl 0,9%) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha loãng với nước cất ổn định trong vòng 3 ngày ở nhiệt độ 15–25°C, 7 ngày ở 2–8°C (2) Dung dịch sau khi pha loãng với Dextrose 5% ổn định trong 24 giờ ở 15–25°C (2)","incompatibilities":"Oxacillin có thể tương kỵ về mặt hóa học với Aminoglycosid, Tetracillin (1)","manufacturer":"BIDIPHAR - VN","notes":"Tiêm tĩnh mạch chậm trong vòng 10 phút để giảm thiểu kích ứng tĩnh mạch (1)","cold":true,"light":false},{"id":305,"tradeName":"OXACILLIN 1G","activeIngredient":"Oxacilin","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 5,7ml nước cất tiêm (1) TM: Bột tiêm + 10ml (nước cất tiêm, NaCl 0,9%) tiêm trong vòng 10 phút (1) TTM: Bột tiêm + một lượng tối thiểu 25ml dung dịch NaCl 0,9%. (Nồng độ tối đa không quá 40mg/ml) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha với nước cất ổn định trong vòng 3 ngày ở nhiệt độ 15–25°C, 7 ngày ở 2–8°C (1) Dung dịch sau khi pha với NaCl 0,9% ổn định trong vòng 3 ngày và Glucose 5% ổn định 24h ở nhiệt độ 15–25°C (1).","incompatibilities":"Oxacillin có thể tương kỵ về mặt hóa học với Aminoglycosid, Tetracylin (1)","manufacturer":"CTCPDP VCP- VN","notes":"Tiêm tĩnh mạch chậm trong vòng 10 phút để giảm thiểu kích ứng tĩnh mạch (1)","cold":true,"light":false},{"id":306,"tradeName":"OXACILLINE PANPHARMA","activeIngredient":"Oxacilin","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 10ml (nước cất tiêm, NaCl 0,9%) tiêm trong vòng 10 phút (1) TTM: Bột tiêm + một lượng tối thiểu 25ml dung dịch NaCl 0,9%, glucose 5%. (Nồng độ tối đa không quá 40mg/ml) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha với nước cất sử dụng trong vòng 12h ở nhiệt độ <25°C, 7 ngày ở 2–8°C (1) Dung dịch sau khi pha loãng với NaCl 0,9% sử dụng trong vòng 24h ở nhiệt độ <25°C hoặc ở 2–8°C (1) Dung dịch sau khi pha loãng với glucose sử dụng trong vòng 12h ở nhiệt độ <25°C hoặc 24h ở 2–8°C (1)","incompatibilities":"Oxacillin có thể tương kỵ về mặt hóa học với Aminoglycosid, Tetracylin (1)","manufacturer":"Panpharma- Pháp","notes":"Tiêm tĩnh mạch chậm trong vòng 10 phút để giảm thiểu kích ứng tĩnh mạch (1)","cold":true,"light":false},{"id":307,"tradeName":"OXYTOCIN 5IU/1ML","activeIngredient":"Oxytocin 5IU/1ml","strength":"5IU/1ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm TTM: Pha loãng dung dịch tiêm với NaCl 0,9%/Glucose 5%/Lactat ringer. (độ pha loãng và tốc độ truyền dao động tùy khuyến cáo)","storage":"Bảo quản trong tủ lạnh 2–8°C. Dung dịch sau pha loãng sử dụng trong vòng 24h ở nhiệt độ 25°C hoặc 2–8°C.","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":false},{"id":308,"tradeName":"PANTOLOC","activeIngredient":"Pantoprazol","strength":"40mg","dosageForm":"Bột đông khô","routes":["TTM","TM"],"reconstitution":"TM:Bột đông khô+10ml dung dịch NaCl 0,9% TTM: Pha loãng dung dịch hoàn nguyên với 100ml dung dịch (Glucose 5%, NaCl 0,9%) Dung dịch thuốc dùng đường tĩnh mạch từ 2-15 phút (1)","storage":"Phải dùng thuốc sau khi pha hoặc pha loãng trong vòng 12h ở nhiệt độ không quá 25°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"TAKEDA GMBH-ĐỨC","notes":"","cold":false,"light":false},{"id":309,"tradeName":"PARACETAMOL KABI 1000MG/100ML","activeIngredient":"Paracetamol","strength":"1g/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền trong 15 phút (1)","storage":"Bảo quản ở nhiệt độ không quá 30°C. Dùng thuốc ngay sau khi mở lọ/ sử dụng trong vòng 6 giờ khi bảo quản nhiệt độ thường.","incompatibilities":"Không trộn chung với các thuốc khác","manufacturer":"Fresenius Kabi Deutschland GmbH","notes":"Lọ thuốc 100ml giới hạn chỉ dùng cho người lớn và trẻ có cân nặng >33kg","cold":false,"light":false},{"id":310,"tradeName":"PARACETAMOL B.BRAUN 10MG/ML 100ML","activeIngredient":"Paracetamol","strength":"1g/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền trong 15 phút (1). Hoặc có thể pha loãng NaCl 0,9%/glucose 5% (tỷ lệ 1:10)","storage":"Bảo quản ở nhiệt độ không quá 30°C. Dùng thuốc ngay sau khi mở lọ / sử dụng trong vòng 6 giờ khi bảo quản nhiệt độ thường","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":311,"tradeName":"PARACETAMOL 10MG/ML","activeIngredient":"Paracetamol","strength":"1g/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền trong 15 phút (1)","storage":"Bảo quản thuốc ở nhiệt độ < 30°C Dùng thuốc ngay sau khi mở lọ, dung dịch dùng dư phải hủy bỏ. (1)","incompatibilities":"Không trộn chung với các thuốc khác","manufacturer":"Công ty TNHH Dược phẩm Allomed","notes":"","cold":false,"light":false},{"id":312,"tradeName":"PARACETAMOL 1G/100ML","activeIngredient":"Paracetamol","strength":"1g/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền trong 15 phút hoặc có thể pha loãng trong dung dịch NaCl 0,9% hoặc dung dịch glucose 5% tới 10 lần (1).","storage":"Bảo quản thuốc ở nhiệt độ < 30°C, tránh ánh sáng Dung dịch sau pha loãng phải sử dụng trong vòng 1 giờ (1).","incompatibilities":"Không trộn chung với các thuốc khác (1)","manufacturer":"Công ty CPDP Minh Dân","notes":"","cold":false,"light":true},{"id":313,"tradeName":"PARINGOLD INJECTION","activeIngredient":"Heparin (natri)","strength":"25000UI/5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TDD"],"reconstitution":"TDD, TM: Dung dịch tiêm (1) TTM: Dung dịch tiêm được pha loãng với 50- 100 ml dung dịch NaCl 0,9% (2) (5)","storage":"Bảo quản < 30°C. Không để đông lạnh","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"JW PHARMACEU TICAL CORPORATIO N- HÀN QUỐC","notes":"Không được tiêm bắp. Riêng dung dịch Heparin dùng tráng bơm tiêm có thể bảo quản 28 ngày sau khi mở nắp (5)","cold":true,"light":false},{"id":314,"tradeName":"PAVINJEC","activeIngredient":"Pantoprazol","strength":"40mg","dosageForm":"Bột đông khô + 10ml dung dịch NaCl 0,9% -> dung dịch hoàn nguyên","routes":["TTM","TM"],"reconstitution":"TM:Bột đông khô+10ml dung dịch NaCl 0,9% TTM: Pha loãng dung dịch hoàn nguyên với 100ml dung dịch (Glucose 5%, NaCl 0,9%) Dung dịch thuốc dùng đường tĩnh mạch từ 2-15 phút (1)","storage":"Phải dùng thuốc sau khi pha hoặc pha loãng trong vòng 12h ở nhiệt độ không quá 25°C (1)","incompatibilities":"Không được trộn lẫn với các thuốc khác (1)","manufacturer":"Demo S.A. Pharmaceutical Industry","notes":"","cold":false,"light":false},{"id":315,"tradeName":"PDSOLONE-40MG","activeIngredient":"Methylprednisolo ne natri succinat","strength":"40mg","dosageForm":"Bột đông khô pha tiêm + không quá 5ml nước cất tiêm → dung dịch tiêm.","routes":["TTM","TM","TB"],"reconstitution":"TB,TM: Dung dịch tiêm. TTM: Dung dịch tiêm pha với một lượng thích hợp dung dịch (có thể đến 50ml) NaCl 0,9%, Glucose 5% trong NaCl 0,9% truyền trong 30- 60 phút (1)","storage":"Dung dịch sau khi pha bảo quản trong vòng 48h ở nhiệt độ 25°C, tránh ánh sáng (1)","incompatibilities":"Dùng riêng rẽ, không trộn lẫn với các thuốc khác","manufacturer":"Swiss Parenterals Ltd","notes":"Chế phẩm KHÔNG có dung môi kèm theo","cold":false,"light":true},{"id":316,"tradeName":"PENICILLIN G 1 MIU","activeIngredient":"Benzylpenicilin (Penicillin G)","strength":"1MUI (600mg)","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 2ml nước cất tiêm (1,2) TM: Bột tiêm + 4-10ml nước cất tiêm (1,2) TTM: Bột tiêm + 10-100ml dung dịch NaCl 0,9% (truyền 20- 30 phút) (1,5).","storage":"Dung dịch ổn định ở nhiệt độ phòng 23–27°C trong vòng 12h hoặc 4 ngày ở tủ lạnh 3–7°C","incompatibilities":"Dùng riêng với Aminoglycosid (1)","manufacturer":"Cty CP hoá - Dược phẩm Mekophar- VN","notes":"Phải thử phản ứng dị ứng trước khi tiêm","cold":true,"light":false},{"id":317,"tradeName":"PENICILLIN 1.000.000 IU","activeIngredient":"Benzylpenicilin (Penicillin G)","strength":"1MUI (600mg)","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 2ml nước cất tiêm (1) TM: Bột tiêm + 4-10ml nước cất tiêm (1,2) TTM: Bột tiêm + 10-100ml dung dịch NaCl 0,9% (truyền 20-30 phút) (1,5).","storage":"Dung dịch Penicillin G ổn định ở nhiệt độ phòng (25 ± 2°C) trong vòng 12h hoặc 4 ngày ở tủ lạnh (5 ± 2°C) (1)","incompatibilities":"Dùng riêng với Aminoglycosid (2)","manufacturer":"Cty CP hóa- Dược phẩm Mekophar-VN","notes":"Phải thử phản ứng dị ứng trước khi tiêm","cold":true,"light":false},{"id":318,"tradeName":"PERFALGAN","activeIngredient":"Paracetamol","strength":"1g/100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền trong 15 phút (1)","storage":"Bảo quản thuốc ở nhiệt độ < 30°C. Không để trong tủ lạnh hoặc làm đông lạnh. Dùng thuốc ngay sau khi mở, dung dịch dùng dư phải hủy bỏ. Sau khi mở lọ cần dùng trong vòng 1h (1)","incompatibilities":"","manufacturer":"Bristol-Myers Squibb S.r.1 Localita’ Fontana del Ceras (Italy)","notes":"Lọ thuốc 100ml giới hạn chỉ dùng cho trẻ em và người lớn > 33kg","cold":true,"light":false},{"id":319,"tradeName":"PETHIDINE 100MG/2ML","activeIngredient":"Pethidin hydrochloride 100mg/2ml","strength":"100mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB","TDD"],"reconstitution":"TB,,TDD: Dung dịch tiêm TM: Tiêm chậm trong 1-3 phút- BN nên ở tư thế nằm theo dõi hô hấp trong vòng 30 phút (dung dịch tiêm pha loãng với nước cất pha tiêm/NaCl 0,9%/Glucose 5 % thành nồng độ 10mg/mL.","storage":"Dung dịch tiêm sử dụng ngay sau khi mở nắp (5)","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG. Dung dịch tiêm tĩnh mạch pha loãng nồng độ =<10mg/ml.","cold":false,"light":true},{"id":320,"tradeName":"PHENYLALPHA 50 MCG/10ML","activeIngredient":"Phenylephrine hydrochloride 500mcg/10ml","strength":"50 mcg/1ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm TTM: Dung dịch tiêm/ dung dịch tiêm pha loãng với NaCl 0,9%, glucose 5% thành nồng độ 20mcg/mL.","storage":"Dung dịch pha loãng sử dụng trong vòng 4 giờ bảo quản nhiệt độ phòng, trong vòng 24 giờ ở nhiệt độ 2–8°C","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":321,"tradeName":"PIMENEM","activeIngredient":"Meropenem","strength":"1g","dosageForm":"Bột tiêm + 20ml nước cất tiêm → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm (tiêm trong khoảng 5 phút) (1) TTM: Dung dịch tiêm pha loãng với lượng thích hợp (Glucose 5%, NaCl 0,9%) (truyền từ 15 đến 30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 20ml nước c Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h (Lưu ý dung dịch pha NaCl 0,9%)","storage":"Dung dịch hoàn nguyên ổn định trong vòng 2h ở nhiệt độ phòng (15–25°C) hoặc 12h trong tủ lạnh (4°C). Dung dịch pha loãng với NaCl 0,9% ổn định trong vòng 4h ở nhiệt độ phòng hoặc trong 24h ở nhiệt độ 2–8°C (2)","incompatibilities":"Dùng riêng với các thuốc khác (2)","manufacturer":"Công ty cổ phần Pymepharco","notes":"","cold":true,"light":false},{"id":322,"tradeName":"PIPEBAMID 4,0G/0,5G","activeIngredient":"Piperacillin monohydrate +Tazobactam","strength":"4g+0,5g","dosageForm":"Bột pha tiêm + 20ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên pha loãng thành 150ml (Glucose 5%, NaCl 0,9%) truyền trong 20-30 phút (1)","storage":"Dung dịch sau pha ổn định trong vòng 24h ở nhiệt độ < 25°C, 48h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với Aminoglycosid, Metronidazol hoặc với các dung dịch chứa Natri carbonat, Lactat ringer, chế phẩm máu hoặc các sản phẩm thủy phân Albumin (1)","manufacturer":"Công ty CPDP Minh Dân","notes":"","cold":true,"light":false},{"id":323,"tradeName":"PIPERACILLIN/ TAZOBACTAM KABI 4G/0,5G","activeIngredient":"Piperacillin monohydrate +Tazobactam","strength":"4g+0,5g","dosageForm":"Bột đông khô pha tiêm + 20ml (nước cất tiêm, NaCl 0,9%) → dung dịch hoàn nguyên","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch hoàn nguyên (tiêm trong khoảng 3-5 phút) (1) TTM: Dung dịch hoàn nguyên pha loãng thành 50-150 ml (Glucose 5%, NaCl 0,9%) truyền trong 20-30 phút (1,5) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 4h","storage":"Dung dịch sau khi pha ổn định trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với Aminoglycosid, Metronidazol hoặc với các dung dịch chứa Natri carbonat (2)","manufacturer":"LABESFAL- LABORATÓRI OS ALMINO S.A. - PORTUGAL","notes":"","cold":true,"light":false},{"id":324,"tradeName":"PIPOLPHEN","activeIngredient":"Promethazin","strength":"50mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB: Dung dịch tiêm TM: 1ml dung dịch tiêm pha thành 10 ml dung dịch với nước cất pha tiêm (1,4,5), tốc độ tối đa 25mg/phút","storage":"Bảo quản thuốc ở nhiệt độ dưới 30°, tránh ánh sáng Dung dịch phải dùng ngay sau khi pha","incompatibilities":"Dùng riêng với các chất kiềm (1)","manufacturer":"EGIS- HUNGARY","notes":"Tối đa 100 mg trong 24h (4) Tiêm vào động mạch hoặc dưới da có thể dẫn đến hoại tử.","cold":false,"light":true},{"id":325,"tradeName":"POFOL INJECTION","activeIngredient":"Propofol","strength":"200mg/20ml","dosageForm":"Nhũ dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Nhũ dịch tiêm hoặc pha loãng với Glucose 5% không vượt quá tỷ lệ 1:5 (1)","storage":"Nhũ tương tiêm sau khi pha loãng dùng trong vòng 6h (1), nếu không pha loãng cần thay thế hệ thống truyền thuốc trong vòng 12h. Bảo quản ở nhiệt độ không quá 30°C.","incompatibilities":"Dùng riêng với các dung dịch tiêm truyền khác (1)","manufacturer":"Dongkook pharmaceutical Co., Ltd- Hàn Quốc","notes":"Lắc kĩ trước khi sử dụng. (1).","cold":false,"light":false},{"id":326,"tradeName":"POLTRAXON","activeIngredient":"Ceftriaxon","strength":"1g","dosageForm":"Bột pha tiêm + 10 ml nước cất tiêm → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm (tiêm 5 phút) (1) TTM: Dung dịch tiêm + 40ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch tiêm tĩnh mạch bảo quản trong vòng 24h ở nhiệt độ 2–8°C. Nên dùng dung dịch mới pha (1,2) Dung dịch truyền tĩnh mạch đã pha loãng với Glucose 5%, NaCl 0,9% không được bảo quản trong tủ lạnh (2–8°C) do tương kỵ vật lý giữa các thành phần ở nhiệt độ thấp.","incompatibilities":"Không pha với các thuốc khác, đặc biệt không sử dụng dung môi chứa canxi (dung dịch Ringer hay Hartmann) (1)","manufacturer":"Pharmaceutical Works Polpharma S.A.","notes":"Có thể pha loãng dung dịch ceftriaxon thành 50-100ml với (NaCl 0,9%, Glucose 5%) để TTM (2,5) Liều tiêm TM >1g chỉ nên truyền TM (1,2)","cold":true,"light":false},{"id":327,"tradeName":"POTASSIUM CHLORIDE PROAMP 0,1G/ML","activeIngredient":"Kali chlorid 0,1g/ml","strength":"10% (1g/10ml)","dosageForm":"Dung dịch tiêm Nồng độ: KCl = 1,34 mmol/mL=1,34 mEq/mL","routes":["TTM","TM"],"reconstitution":"TTM: Chỉ dùng đường truyền tĩnh mạch. Pha loãng trước khi truyền. Thường quy thì pha tĩnh mạch ngoại vi thì nồng độ tối đa 10mEq/100mL (thường 1 ống 10ml nên pha với ít nhất 250ml NaCl 0,9%). Đường TM trung tâm thì có thể 20-40mEq/100mL với tốc độ tối đa 40mEq/h. Tốc độ truyền 10-15mmol/1h. Trường hợp cấp cứu có thể truyền nhanh hơn 20 mmol/giờ nhưng cần được theo dõi và giám sát liên tục ECG.","storage":"Bảo quản thuốc ở nhiệt độ phòng. Sau khi pha loãng phải sử dụng ngay","incompatibilities":"","manufacturer":"Laboratoire Aguettant - Pháp","notes":"","cold":false,"light":false},{"id":328,"tradeName":"PRESSON","activeIngredient":"Vasopressin","strength":"20 IU/1ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TTD, TB: Dung dịch tiêm. TTM: Dung dịch tiêm + 100ml Glucose 5% (Truyền trong ít nhất 15 phút) (1,5)","storage":"Dung dịch sau khi pha dùng ngay (5)","incompatibilities":"Tương kỵ với Furosemide, phenytoin sodium (5)","manufacturer":"Joint Stock Company Farmak - Ukraine","notes":"","cold":false,"light":false},{"id":329,"tradeName":"PRIMINOL","activeIngredient":"Milrinone","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm, tiêm chậm trong 10 phút (hoặc pha đến 20ml với NaCl 0,9%, Gluose 5%) (chỉ dùng liều tải) (2) TTM: 10ml dung dịch tiêm Milrinone + 40ml dung dịch (Glucose 5%, NaCl 0,9%) (1) (liều duy trì)","storage":"Dung dịch đã pha loãng nên sử dụng trong 24h (2) Sau khi pha loãng dung dịch bảo quản trong vòng 24h ở 2–8°C (5)","incompatibilities":"Không được pha với dung dịch NaHCO3, không được tiêm cùng một vị trí với furosemid, bumetanid để tránh kết tủa (1)","manufacturer":"Công Ty Cổ Phần Pymepharco","notes":"Không được sử dụng nếu có dị vật lạ hay biến màu trong dung dịch sau khi pha.","cold":true,"light":false},{"id":330,"tradeName":"PROGESTERONE 25MG/ML","activeIngredient":"Progesterone 25mg/ml","strength":"25mg/ml","dosageForm":"Dung dịch tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm","storage":"Bảo quản nhiệt độ 25°C, tránh ánh sáng. Sử dụng ngay khi mở nắp.","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":true},{"id":331,"tradeName":"PROPOFOL-LIPURO 1% (10MG/ML)","activeIngredient":"Propofol","strength":"10mg/ml, ống 20ml","dosageForm":"Nhũ tương Tiêm/ Truyền","routes":["TTM"],"reconstitution":"TTM: Nhũ tương tiêm hoặc pha loãng với NaCl 0,9%, Glucose 5% không vượt quá tỷ lệ 1:4, nồng độ tối thiểu 2mg propofol/ml (1)","storage":"Nhũ tương tiêm chưa pha loãng sử dụng trong vòng 12h, đã pha loãng dùng trong vòng 6h (1) Hủy thuốc dư, thay thế dây truyền và bình đựng nếu quá thời gian trên. Bảo quản ở nhiệt độ không quá 30°C. Tránh đông lạnh.","incompatibilities":"Dùng riêng với các dung dịch tiêm truyền khác (1)","manufacturer":"B.Braun Melsungen AG, Germany","notes":"Lắc kĩ trước khi sử dụng","cold":true,"light":false},{"id":332,"tradeName":"PUREGON INJ 300IU 0,36ML","activeIngredient":"Follitropin beta 300 IU/0,36 ml","strength":"300IU 0,36ml","dosageForm":"Mỗi cartridge: Chứa Hormon kích nang noãn tái tổ hợp 300IU có hoạt tính trong 0,36mL dung dịch.","routes":["TB","TDD"],"reconstitution":"TB: Dung dịch tiêm TDD: Dung dịch tiêm","storage":"Sau khi phân phát, SP có thể được BN bảo quản an toàn trong tủ lạnh ở nhiệt độ 2–8°C cho đến ngày hết hạn/ nhiệt độ =<25°C trong 3 tháng, không để đông lạnh, tránh ánh sáng. Một khi nắp đậy bằng cao su của ống thuốc bị kim xuyên thủng chỉ có thể bảo quản sản phẩm tối đa 28 ngày.","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":true},{"id":333,"tradeName":"PUREGON INJ 600IU 0,72ML","activeIngredient":"Follitropin beta 600 IU/0,72 ml","strength":"600IU 0,72ml","dosageForm":"Mỗi cartridge: Chứa Hormon kích nang noãn tái tổ hợp 600IU có hoạt tính trong 0,72mL dung dịch.","routes":["TB","TDD"],"reconstitution":"TB: Dung dịch tiêm TDD: Dung dịch tiêm","storage":"Sau khi phân phát, SP có thể được BN bảo quản an toàn trong tủ lạnh ở nhiệt độ 2–8°C cho đến ngày hết hạn/ nhiệt độ =<25°C trong 3 tháng, không để đông lạnh, tránh ánh sáng. Một khi nắp đậy bằng cao su của ống thuốc bị kim xuyên thủng chỉ có thể bảo quản sản phẩm tối đa 28 ngày.","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":true},{"id":334,"tradeName":"PYCLIN 300","activeIngredient":"Clindamycin","strength":"300mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TTM: Dung dịch tiêm + 50ml NaCl 0,9%, truyền trong 10-60 phút (1,2)","storage":"Dung dịch sau khi pha bảo quản trong vòng 24h ở nhiệt độ 2–8°C (5)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"CTCP PYMEPHARC O-VN","notes":"Liều tiêm bắp không được lớn hơn 600mg Không dùng > 1200 mg/lần trong 1 giờ (1,2)","cold":true,"light":false},{"id":335,"tradeName":"PYTHINAM","activeIngredient":"Imipenem + Cilastatin","strength":"500mg + 500mg","dosageForm":"Bột pha tiêm + 10 ml (NaCl 0.9%, Glucose 5%,...), lắc kỹ chuyển vào chai chứa dịch truyền, thêm tiếp 10 ml dung môi trên, lắc kỹ → dung dịch tiêm (1)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm + 80ml (Glucose 5%, NaCl 0,9%,...) (1) (truyền 250-500mg Imipenem từ 20-30 phút, 1g Imipenem từ 40-60 phút) (5) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h (nên pha truyền với NaCl 0,9%).","storage":"Dung dịch sau khi pha loãng ổn định trong vòng 24h ở nhiệt độ 2–8°C (2)","incompatibilities":"Dùng riêng với các kháng sinh khác, không dùng dung dịch Lactate để pha thuốc (1)","manufacturer":"CTCP PYMEPHARC O-VN","notes":"Thường dùng dung dịch NaCl 0,9% để pha dịch truyền (2,5) Đảm bảo thuốc đã tan hoàn toàn trước khi truyền (1) Nếu có buồn nôn và/hoặc nôn trong khi dùng thuốc, giảm tốc độ truyền (1)","cold":false,"light":false},{"id":336,"tradeName":"RAXADIN","activeIngredient":"Imipenem + Cilastatin","strength":"500mg + 500mg","dosageForm":"Bột pha tiêm + 10 ml (NaCl 0.9%, Glucose 5%,...), lắc kỹ, thêm tiếp 10 ml dung môi trên, lắc kỹ để đảm bảo thuốc đã tan hoàn toàn (trong vòng 3 phút) → dung dịch tiêm (1)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm chuyển vào lọ chứa vừa đủ 100 ml dịch truyền (NaCl 0,9%, Glucose 5%) (1) (truyền 250-500mg Imipenem từ 20-30 phút, 1g Imipenem từ 40-60 phút) (1,2,5)","storage":"Dung dịch sau khi pha loãng có thể bảo quản trong vòng 3h ở nhiệt độ phòng (25°C), trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với các kháng sinh khác, không dùng dung dịch Lactate để pha thuốc (1)","manufacturer":"Demo S.A Pharmaceutical Industry","notes":"Thường dùng dung dịch NaCl 0,9% để pha dịch truyền (2,5). Đảm bảo thuốc đã tan hoàn toàn trước khi truyền (1) Nếu có buồn nôn và/hoặc nôn trong khi dùng thuốc, giảm tốc độ truyền","cold":false,"light":false},{"id":337,"tradeName":"RECARBRIO","activeIngredient":"Imipenem + Cilastatin + Relebactam","strength":"500mg + 500mg + 250mg","dosageForm":"Bột pha tiêm + 10 ml (NaCl 0.9%, Glucose 5%,...), lắc kỹ, thêm tiếp 10 ml dung môi trên, lắc kỹ để đảm bảo thuốc đã tan hoàn toàn → dung dịch tiêm (1)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm chuyển vào lọ chứa vừa đủ 100 ml dịch truyền (NaCl 0,9%, Glucose 5%). Truyền trong 30 phút (1) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h.","storage":"Dung dịch sau khi pha loãng có thể bảo quản trong vòng 4h ở nhiệt độ phòng (< 30°C), trong vòng 24h ở nhiệt độ (2–8°C) (1)","incompatibilities":"Tương hợp với các thuốc: Dexmedetomidine, Dopamine, Epinephrine, Fentanyl, Heparin, Midazolam, Norepinephrine, Phenylephrine. Không nên dùng đồng thời với các thuốc khác.","manufacturer":"Merck Sharp & Dohme - Hoa Kỳ","notes":"Nếu có buồn nôn và/hoặc nôn trong khi dùng thuốc, giảm tốc độ truyền (1)","cold":false,"light":false},{"id":338,"tradeName":"REKOVELLE 36MCG/1,08ML","activeIngredient":"Follitropin delta","strength":"36mcg/1,08ml","dosageForm":"Dung dịch tiêm","routes":["TDD"],"reconstitution":"TDD: Dung dịch tiêm","storage":"Bảo quản2–8°C. Sau khi mở sử dụng trong vòng 28 ngày ở nhiệt độ <=25°C.","incompatibilities":"Ferring GmbH","manufacturer":"","notes":"","cold":true,"light":false},{"id":339,"tradeName":"RINGER LACTATE 500ML","activeIngredient":"Natri clorid 3g + Kali clorid 0,2g + Natri lactat 1,6g + Calci clorid 2H2O 0,135g","strength":"500ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM,TTM","storage":"Sử dụng ngay sau khi mở nắp.","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":340,"tradeName":"ROCEPHIN","activeIngredient":"Ceftriaxon","strength":"1 g","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm + 10ml nước cất tiêm (tiêm từ 2- 4 phút) (1) TTM: 2g bột tiêm Rocephin + 40ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch tiêm sau khi pha bảo quản trong vòng 6h ở nhiệt độ phòng, 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không được pha với các dung dịch thuốc chứa Canxi khác (dd Hartmann và Ringer,...) (1)","manufacturer":"F.HOFFMANN- LA ROCHE LTD- Thụy sĩ","notes":"Có thể pha loãng dung dịch Rocephin thành 50-100ml với NaCl 0,9%) để TTM (2,5) Liều tiêm TM >1g chỉ nên truyền TM (2)","cold":true,"light":false},{"id":342,"tradeName":"ROURONIUM- BFS","activeIngredient":"Rocuronium bromid","strength":"10mg/ml, 5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm TTM: Dung dịch tiêm pha loãng NaCl 0,9%, Glucose 5% đạt nồng độ thường sử dụng là 0,5mg/ml hoặc 2mg/ml (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ 2–8°C, tránh đông lạnh. Dung dịch sau pha loãng dùng trong vòng 24h (1,2)","incompatibilities":"Dùng riêng với các dung dịch kiềm (Vd: Natri bicarbonat), các thuốc: Amoxicillin, amphotericin B, cefazolin, cloxacillin, dexamethason, diazepam, furosemid, hydrocortison, methylprednisolon, prednisolon, insulin, trimethoprim, vancomycin (1)","manufacturer":"Công ty CPDP CPC1 - Hà Nội","notes":"","cold":true,"light":false},{"id":343,"tradeName":"SAIZEN LIQUID 6MG/1.03ML","activeIngredient":"Somatropin 6mg","strength":"6mg/1.03ml","dosageForm":"Bột đông khô+ Nước cất pha tiêm chứa metacresol 0,3%→ dung dịch hoàn nguyên","routes":["TDD"],"reconstitution":"TDD: Dung dịch hoàn nguyên","storage":"28 ngày ở 2–8°C","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":false},{"id":344,"tradeName":"SALBUTAMOL RENAUDIN 0,5MG/1ML","activeIngredient":"Salbutamol","strength":"0,5mg/ml","dosageForm":"Dung dịch tiêm","routes":["TDD"],"reconstitution":"TDD: Dung dịch tiêm (1)","storage":"Dưới 30°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Laboratoire renaudin-Pháp","notes":"Không pha loãng ống tiêm khi tiêm dưới da (1)","cold":false,"light":false},{"id":345,"tradeName":"SANDOSTATIN 0.1MG/ML, 1ML","activeIngredient":"Octreotid","strength":"0.1mg/ml, 1ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TDD"],"reconstitution":"TDD: Dung dịch tiêm TM: Dung dịch tiêm chậm trên 3 phút (3-5 phút) TTM: Pha loãng dung dịch tiêm với 50ml NaCl 0,9%/glucose 5% thành nồng độ 2mcg/mL (truyền trong 15-30 phút)","storage":"Bảo quản nhiệt độ 2–8°C, tránh ánh. Có thể bảo quản ở nhiệt độ phòng sử dụng trong vòng 14 ngày. Khi pha loãng với NaCl 0,9%, glucose 5% thì bảo quản ở nhiệt độ phòng/ 2–8°C trong vòng 24h","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":false},{"id":346,"tradeName":"SAT","activeIngredient":"Huyết thanh kháng độc tố uốn ván tinh chế","strength":"","dosageForm":"Dung dịch tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm (thường dùng). Nếu chống chỉ định tiêm bắp (nguy cơ xuất huyết có thể tiêm dưới da)","storage":"Huyết thanh bảo quản nhiệt độ 2–8°C, sử dụng ngay sau mở nắp.","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":false},{"id":347,"tradeName":"SCILIN M30","activeIngredient":"Insulin trộn (M) (Insulin người) 30/70","strength":"100UI/ml","dosageForm":"Hỗn dịch tiêm","routes":["TB","TDD"],"reconstitution":"TDD, TB: Hỗn dịch tiêm (1)","storage":"Khi chưa sử dụng bảo quản lọ thuốc ở 2–8°C, tránh ánh sáng. Khi đã sử dụng, thuốc có thể giữ trong 28 ngày ở nhiệt độ phòng < 25°C (1)","incompatibilities":"","manufacturer":"BIOTON S.A. - POLAND","notes":"Không được tiêm tĩnh mạch.","cold":true,"light":true},{"id":348,"tradeName":"SELEMYCIN 500MG/2ML","activeIngredient":"Amikacin sulfat 500mg/2ml","strength":"500mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm TTM: Dung dịch tiêm pha loãng với NaCl 0,9%/glucose 5 % (100-200ml) tới nồng độ 0,25- 5mg/ml truyền trong 30-60 phút","storage":"Sử dụng dung dịch đã pha trong vòng 24h ở nhiệt độ phòng/ 2–8°C","incompatibilities":"","manufacturer":"","notes":"TTM: Dung dịch tiêm có thể pha loãng tới nồng độ 10mg/mL","cold":true,"light":false},{"id":349,"tradeName":"SENITRAM 1G/0,5G","activeIngredient":"Ampicillin + Sulbactam","strength":"1000 mg + 500 mg","dosageForm":"Bột pha tiêm + 3,2ml nước cất tiêm → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TM: Dung dịch tiêm (Tiêm ít nhất trong 10-15 phút) (1) TTM: Dung dịch tiêm + 50-100 ml dung dịch NaCl 0,9% (truyền từ 15-30 phút) (1)","storage":"Dung dịch đậm đặc để tiêm bắp dùng 1h sau khi pha Dung dịch sau khi pha (NaCl 0,9%) bảo quản 8h ở 15–25°C và 72h ở 4°C (1)","incompatibilities":"Dùng riêng với aminoglycosid và các sản phẩm từ màu hoặc từ protein thủy phân (1,2)","manufacturer":"Công ty CPDP Minh Dân","notes":"Thuốc chứa thành phần ampicillin nên sẽ kém bền trong dung dịch dextrose hoặc các dung dịch chứa carbohydrat khác. (2)","cold":false,"light":false},{"id":350,"tradeName":"SMOFLIPID 20% 100ML","activeIngredient":"Fat emulsion (fish oil Based)","strength":"2-%","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền tốc độ tối đa (Người lớn,trẻ em: 0,15g/kg/giờ, Trẻ sơ sinh và trẻ nhỏ: 0,125g/kg/giờ)","storage":"Không được đông lạnh. Nên sử dụng ngay khi mở chai, nếu không sử dụng ngay nên bảo quản nhiệt độ 2–8°C sử dụng trong 24h","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":false},{"id":351,"tradeName":"SODIUM CHLORIDE SOLUTION FOR I.V. INFUSION 0,9% 1000ML","activeIngredient":"Sodium chloride 0,9%","strength":"0.009","dosageForm":"Dung dịch tiêm, truyền","routes":["TTM","TM"],"reconstitution":"TM, TTM","storage":"Theo nhà SX phải dùng ngay khi mở nắp. Bảo quản nhiệt độ phòng. Có thể sử dụng trong vòng 24 giờ sau khi mở nắp tuy nhiên trách nhiệm thuộc về người dùng","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":352,"tradeName":"SODIUM VALPROATE AGUETTANT","activeIngredient":"Natri Valproate","strength":"400mg/4ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm pha loãng với một lượng thích hợp NaCl 0,9%, Glucose 5%, tiêm trong 3-5 phút (5) TTM: Dung dịch tiêm pha loãng với 50-100ml NaCl 0,9%, truyền trên 60 phút, tốc độ truyền không vượt quá 20 mg/phút (2,5).","storage":"Sau khi pha loãng ổn định trong 24h (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"AGUETTANT- PHÁP","notes":"Không được tiêm bắp","cold":false,"light":false},{"id":353,"tradeName":"SOLEZOL","activeIngredient":"Esomeprazole sodium","strength":"40 mg","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm+ 5ml dung dịch NaCl 0,9%. (Tiêm tối thiểu 3 phút) (1) TTM: Bột tiêm hòa tan vừa đủ 100ml dung dịch NaCl 0,9%, truyền tĩnh mạch trong 10-30 phút (1)","storage":"Dung dịch sau khi pha ổn định trong 12h ở nhiệt độ < 30°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"ANFARMHEL LAS S.A-HY LẠP","notes":"","cold":false,"light":false},{"id":354,"tradeName":"SOLI - MEDON 40","activeIngredient":"Methylprednisolo ne natri succinat","strength":"40mg","dosageForm":"Bột đông khô pha tiêm+1ml nước cất tiêm → dung dịch tiêm.","routes":["TTM","TM","TB"],"reconstitution":"TB,TM: Dung dịch tiêm. (1) TTM: Dung dịch tiêm pha với một lượng thích hợp dung dịch Glucose 5%, NaCl 0,9% truyền trong 30 phút (2) (5)","storage":"Sử dụng dung dịch đã pha ổn định ở nhiệt độ 15–30°C trong vòng 48h sau khi pha (2)","incompatibilities":"","manufacturer":"Công ty cổ phần Dược- TTBYT Bình Định (Bidiphar)","notes":"Chế phẩm có dung môi kèm theo","cold":false,"light":false},{"id":355,"tradeName":"SOLU - MEDROL 40MG","activeIngredient":"Methylprednisolo ne sodium succinate","strength":"40mg","dosageForm":"Bột đông khô pha tiêm+1ml nước cất tiêm → dung dịch tiêm.","routes":["TTM","TM","TB"],"reconstitution":"TB,TM: Dung dịch tiêm. TTM: Dung dịch tiêm pha với một lượng thích hợp dung dịch Glucose 5%, NaCl 0,9% truyền trong 30 phút (1)","storage":"Sử dụng dung dịch đã pha trong vòng 24h ở nhiệt độ < 25°C (1)","incompatibilities":"Nên tiêm Solu- Medrol riêng rẽ (1)","manufacturer":"PFIZER -BỈ","notes":"Chế phẩm có dung môi kèm theo","cold":false,"light":false},{"id":356,"tradeName":"SUFENTANIL 50MCG/1ML","activeIngredient":"Sufentanil 50mcg/1ml","strength":"50mcg/1ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm TTM: Dung dịch tiêm được pha loãng với dung dịch (Glucose 5%, NaCl 0,9%, Lactat ringer) Tiêm ngoài màng cứng: Pha loãng với NaCl 0,9%/ dung dịch bupivacaine","storage":"Độ ổn định lý hoá dung dịch pha loãng ở nhiệt độ phòng là 72h, tuy nhiên nên sử dụng trong vòng 24 giờ bảo quản dung dịch ở nhiệt độ 2–8°C.","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":false},{"id":357,"tradeName":"SULPERAZON","activeIngredient":"Cefoperazon + Sulbactam","strength":"500 mg + 500 mg","dosageForm":"Bột pha tiêm + 3,4ml (nước cất pha tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm. Tiêm ít nhất trong 3 phút (1,2) TTM: Dung dịch tiêm pha loãng thành 20 ml (Glucose 5%, NaCl 0,9%) truyền từ 15-60 phút (1,2) Nếu TTM với Ringer Lactat: Bột pha tiêm + 3,4 ml nước cất tiêm, sau đó pha loãng với 50- 100 ml dung dịch Ringer Lactate (1)","storage":"Dung dịch sau khi pha bảo quản ở 15–30°C trong vòng 24h (1)","incompatibilities":"Dùng riêng với Aminoglycosid (2)","manufacturer":"HAUPT PHARM LATINA S.R.L- Ý","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":false,"light":false},{"id":358,"tradeName":"SULRAAPIX","activeIngredient":"Cefoperazon + Sulbactam","strength":"500 mg + 500 mg","dosageForm":"Bột pha tiêm + 3,4ml (nước cất tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm. Tiêm ít nhất trong 3 phút (1,2) TTM: Dung dịch tiêm pha loãng (với cùng dung môi pha thuốc) thành 20 ml (Glucose 5%, NaCl 0,9%,…) truyền từ 15-60 phút (1,2) Nếu TTM với Ringer Lactat: Bột pha tiêm + 3,4 ml nước cất tiêm, sau đó pha loãng với 50- 100 ml dung dịch Ringer Lactate (1)","storage":"Bảo quản nhiệt độ < 30°C, tránh ánh sáng (1)","incompatibilities":"Dùng riêng với Aminoglycosid (2)","manufacturer":"CTCP PYMEPHARC O-VN","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":false,"light":true},{"id":359,"tradeName":"SULRAAPIX","activeIngredient":"Cefoperazon + Sulbactam","strength":"1000 mg + 1000 mg","dosageForm":"Bột pha tiêm + 6,7ml (nước cất pha tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm pha loãng thành 20 ml dung dịch pha thuốc. Tiêm ít nhất trong 3 phút (1,2) TTM: Dung dịch tiêm pha loãng với ít nhất 20 ml (Glucose 5%, NaCl 0,9%) truyền từ 15-60 phút (1,2) Nếu TTM với Ringer Lactat: Bột pha tiêm + 6,7ml nước cất tiêm, sau đó pha loãng với 200 ml dung dịch Ringer Lactate (1)","storage":"Dung dịch sau pha bảo quản trong vòng 8h ở nhiệt độ ≤ 25°C.","incompatibilities":"Dùng riêng với Aminoglycosid (1)","manufacturer":"CTCP PYMEPHARC O-VN","notes":"Đã ghi nhận báo cáo về tương kỵ tạo tủa khi truyền chung ciprofloxacin - cefoperazon trong cùng 1 đường truyền. (Cảnh giác dược T10/2024)","cold":false,"light":false},{"id":360,"tradeName":"SUNFLOXACIN 750MG/150ML","activeIngredient":"Levofloxacin","strength":"750mg/ 150ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (truyền ít nhất 90 phút) (1)","storage":"Bảo quản túi thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng. Sau khi lấy ra khỏi hộp, để trong điều kiện ánh sáng trong nhà tối đa là 3 ngày. Không để trong tủ lạnh hoặc làm đông lạnh Thuốc chỉ sử dụng một lần, hủy phần thừa nếu không sử dụng hết (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch khác (2)","manufacturer":"Công ty TNHH Dược phẩm Allomed","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":true,"light":true},{"id":361,"tradeName":"SUN-NICAR 10MG/50ML","activeIngredient":"Nicardipin hydroclorid","strength":"10mg/50ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm NL - Liều ban đầu: Truyền 3-5mg/giờ, không được quá 15mg/giờ -Liều duy trì: Truyền 2-4mg/giờ Cần pha loãng thuốc trong dung dịch tiêm truyền glucose 5% đến nồng độ 0,1 đến 0,2 mg/ml trước khi dùng, trừ khi được tiêm truyền qua tĩnh mạch trung tâm. (1,2)","storage":"Bảo quản nơi khô ráo, nhiệt độ < 30°C, tránh ánh sáng","incompatibilities":"Nicardipin tương kỵ với dung dịch Natri bicarbonat, Ringer lactat, furosemid, heparin và thiopental (2)","manufacturer":"Công ty TNHH Sun Garden Việt Nam","notes":"Cần dùng bơm tiêm điện hoặc bơm tiêm tự động để kiểm soát tốc độ truyền. Nếu truyền TM ngoại biên, cần thay đổi vị trí tiêm truyền mỗi 12h để tránh kích ứng tĩnh mạch (4)","cold":false,"light":true},{"id":362,"tradeName":"SUNPRANZA","activeIngredient":"Esomeprazole sodium","strength":"40mg","dosageForm":"Bột đông khô pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm+ 5ml dung dịch NaCl 0,9% (tiêm ít nhất 3 phút) (1) TTM: Bột tiêm hòa tan vừa đủ 100ml dung dịch NaCl 0,9%, truyền tĩnh mạch trong 10-30 phút (1)","storage":"Dung dịch sau khi pha phải dùng ngay (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Sun Pharmaceutical Industries Ltd","notes":"","cold":false,"light":false},{"id":363,"tradeName":"TAKIZD","activeIngredient":"Furosemid","strength":"20mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm. Tốc độ tiêm không quá 4 mg/phút (1). TTM: Pha loãng trong NaCl 0,9%. Tốc độ truyền không quá 4 mg/phút (1).","storage":"Bảo quản nơi khô ráo, nhiệt độ < 30°C, tránh ánh sáng","incompatibilities":"Không được pha với dung dịch Glucose hoặc dung dịch acid Không được phối hợp bất cứ thuốc gì vào dịch truyền hoặc bơm tiêm có chứa furosemid (1,2)","manufacturer":"Công ty CP Dược VTYT Hải Dương","notes":"","cold":false,"light":true},{"id":364,"tradeName":"TANGANIL 500MG","activeIngredient":"Acetylleucin","strength":"500mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Dung dịch tiêm (1)","storage":"Sau khi mở ống thuốc phải được dùng ngay lập tức","incompatibilities":"","manufacturer":"PIERRE FABRE MEDICAMENT -PHÁP","notes":"","cold":false,"light":false},{"id":365,"tradeName":"TARGOCID","activeIngredient":"Teicoplanin","strength":"400mg","dosageForm":"Bột đông khô pha tiêm + 3ml nước cất pha tiêm → dung dịch hoàn nguyên. Cần đảm bảo tất cả lượng bột đều tan hết, kể cả bột chung quanh nắp lọ","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch hoàn nguyên (1) TM: Dung dịch hoàn nguyên (1) (tiêm từ 3-5 phút) (5) TTM: Dung dịch hoàn nguyên pha loãng với Glucose 5%, NaCl 0,9%, hoặc Ringer lactate, NaCl 0,18% + Dextrose 0,4% (1) (thường dùng pha với 100ml NaCl 0,9% truyền trên 30 phút) (5) Tiêm trong phúc mạc: Dung dịch hoàn nguyên thêm vào dung dịch thẩm phân: 20mg Teicoplanin + 1L dd thẩm phân (1)","storage":"Dung dịch hoàn nguyên ổn định trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với aminoglycosides (2)","manufacturer":"GRUPPO LEPETIT S.R.L-Ý","notes":"Khi pha dung dịch hoàn nguyên tránh tạo bọt. Chú ý khi có bọt trong quá trình hoàn nguyên, nên để yên 15 phút trước khi sử dụng tiếp theo (1)","cold":false,"light":false},{"id":366,"tradeName":"TAVANIC 250MG INJ.","activeIngredient":"Levofloxacin","strength":"250mg/ 50ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm truyền (truyền ít nhất 30 phút) (1)","storage":"Thuốc phải được sử dụng trong vòng 3h sau khi chọc thủng nút cao su (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch heparin, các dung dịch kiềm khác (Natri hydro carbonat) (1)","manufacturer":"SANOFI- AVENTIS DEUTSCHLAN D GMBH -ĐỨC","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":false,"light":false},{"id":367,"tradeName":"TAVANIC 500MG INJ.","activeIngredient":"Levofloxacin","strength":"500mg/ 100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (truyền ít nhất 60 phút) (1)","storage":"Thuốc phải được sử dụng trong vòng 3h sau khi chọc thủng nút cao su (1) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với dung dịch heparin, các dung dịch kiềm khác (Natri hydro carbonat) (1)","manufacturer":"SANOFI- AVENTIS DEUTSCHLAN D GMBH -ĐỨC","notes":"Chỉ được dùng truyền tĩnh mạch chậm, tiêm tĩnh mạch nhanh hay chậm đều có khả năng gây hạ huyết áp (1)","cold":false,"light":false},{"id":368,"tradeName":"TAXIMMED 1G","activeIngredient":"Cefotaxim natri 1g","strength":"1 g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 3ml nước cất tiêm/dd Lidocain 1% TM: Bột tiêm + 10 ml nước cất tiêm (tiêm TM chậm 3- 5 phút) TTM: Bột tiêm +10ml nước cất tiêm (dung dịch hoàn nguyên) pha loãng với 40-100 ml dung dịch NaCl 0,9%/glucose 5%/ Dextrose và NaCl/ natri lactat thành dd trong suốt không màu (truyền 20-60')","storage":"Dung dịch pha truyền tĩnh mạch bảo quản ở nhiệt độ 2–8°C trong vòng 24 giờ. DD hoàn nguyên ổn định hóa lý trong 12-24h ở nhiệt độ phòng/2–8°C.","incompatibilities":"Không dùng dd natri bicarbonate để hòa tan thuốc","manufacturer":"MEDOCHEMI E LTD – FACTORY C","notes":"THUỐC TRÁNH ÁNH SÁNG. TB: Pha với nước cất pha tiêm thành nồng độ 230- 330mg/mL TM: Bột pha tiêm+tối thiểu 10ml nước cất thành nồng độ tối đa 200mg/mL TTM: Bột pha tiêm+nước cất pha tiêm→ dung dịch hoàn nguyên pha loãng tiếp tục với NaCl 0,9%, glucose 5%/ Glucose và NaCl, Lactat ringer thành nồng độ 10-40mg/mL","cold":false,"light":true},{"id":369,"tradeName":"TAZOPELIN 4.5G","activeIngredient":"Piperacillin monohydrate +Tazobactam","strength":"4g+0,5g","dosageForm":"Bột pha tiêm + 20ml (nước cất tiêm,, NaCl 0,9%) → dung dịch hoàn nguyên","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch hoàn nguyên (tiêm trong 5 phút) (1) TTM: Dung dịch hoàn nguyên pha loãng thành ít nhất 50ml (Glucose 5%, NaCl 0,9%) truyền trong 20-30 phút (1,5) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 4h","storage":"Dung dịch hoàn nguyên được bảo quản trong vòng 12h ở nhiệt độ < 25°C, 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với Aminoglycosid, Metronidazol hoặc với các dung dịch chứa Natri carbonat, Lactat ringer, chế phẩm máu hoặc các sản phẩm thủy phân Albumin (1)","manufacturer":"BIDIPHAR- VN","notes":"NSX: Chống chỉ định trẻ < 2 tháng tuổi (1)","cold":false,"light":false},{"id":370,"tradeName":"TENAMYD- CEFOTAXIME 1000","activeIngredient":"Cefotaxim","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 3ml nước cất tiêm (1) TM: Bột tiêm + 10ml nước cất tiêm (tiêm từ 3- 5 phút) (1) TTM: Bột tiêm + 50 - 100ml (NaCl 0,9%, Glucose 5%) (thời gian truyền 20-60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10 ml nước cất tiêm","storage":"Bảo quản dung dịch sau khi pha trong vòng 12h ở nhiệt độ 2–8°C hoặc trong vòng 4h ở nhiệt độ ≤ 25°C (1)","incompatibilities":"Không nên pha trộn với các dung dịch kiềm (dd Natri bicarbonate,…), Aminoglycosid, Metronidazol,... (1)","manufacturer":"Công ty Cổ phần Dược phẩm Tenamyd","notes":"Tiêm TM nhanh dưới 3 phút có thể gây nguy hiểm do chứng loạn nhịp tim. Khuyến cáo dùng đường tĩnh mạch đối với liều lớn.","cold":true,"light":false},{"id":371,"tradeName":"TENAMYD- CEFTAZDIIME 1000","activeIngredient":"Ceftazidim","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 3ml nước cất tiêm. (1,2) TM: Bột tiêm + 10ml (Nước cất tiêm, Glucose 5%, NaCl 0,9%) (1) (5) (tiêm từ 3-5 phút) (5) TTM: Bột tiêm + 50-100ml (Glucose 5%, NaCl 0,9%) (truyền từ 20-30 phút) (1) (5) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi pha ổn định trong vòng 12h ở nhiệt độ < 25°C, 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Không được pha thuốc vào dung dịch Natri bicarbonate (2) Dùng riêng với Vancomycin, Aminoglycosid, Metronidazol (2)","manufacturer":"CTCP DƯỢC PHẨM TENAMYD- VN","notes":"","cold":true,"light":false},{"id":372,"tradeName":"TENAMYD-CEFOTAXIME 1G","activeIngredient":"Cefotaxim natri 1g","strength":"1 g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 3ml nước cất tiêm (1) TM: Bột tiêm +9,5 tới 10ml nước cất tiêm (tiêm từ 3-5 phút) (1) (100 mg/mL) TTM: Bột tiêm + 50 - 100ml (NaCl 0,9%, Glucose 5%) (thời gian truyền 20-60 phút) (1). (5- 40mg/ml) PHÒNG PHA TIÊM: Bột tiêm + 9,5-10 ml nước cất tiêm→ Dung dịch hoàn nguyên","storage":"Bảo quản dung dịch sau khi pha trong vòng 12h ở nhiệt độ 2–8°C hoặc trong vòng 4h ở nhiệt độ ≤ 25°C (1) - DD hoàn nguyên: 12 - 24h ở 15–25°C, 24h ở 2–8°C.","incompatibilities":"Không nên pha trộn với các dung dịch kiềm (dd Natri bicarbonate,…), Aminoglycosid, Metronidazol,... (1)","manufacturer":"Công ty Cổ phần Dược phẩm Tenamyd","notes":"THUỐC TRÁNH ÁNH SÁNG. TM: Có thể pha tới nồng độ max 200mg/ml (1 lọ +5ml Nước cất) tuy nhiên tiêm nhanh có thể gây rối loạn nhịp tim. TTM: Ở BN hạn chế dịch nồng độ tối đa pha 86mg/ml trong glucose 5%, 73 mg/ml pha NaCl 0,9%, 147mg/ml pha trong nước cất","cold":true,"light":true},{"id":373,"tradeName":"TIENAM 500MG/500MG","activeIngredient":"Imipenem + Cilastatin","strength":"500mg + 500mg","dosageForm":"Bột pha tiêm + 10 ml (NaCl 0.9%, Glucose 5%,...), lắc kỹ, thêm tiếp 10 ml dung môi trên, lắc kỹ để đảm bảo thuốc đã tan hoàn toàn → dung dịch tiêm (1)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm chuyển vào lọ chứa vừa đủ 100 ml dịch truyền (NaCl 0,9%, Glucose 5%) (1) (truyền 250-500mg Imipenem từ 20-30 phút, 1g Imipenem từ 40-60 phút) (1,5) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h.","storage":"Dung dịch sau khi pha loãng có thể bảo quản trong khoảng 4h ở nhiệt độ phòng (25°C), trong vòng 24h ở nhiệt độ 2–8°C (1,2)","incompatibilities":"Dùng riêng với các kháng sinh khác, không dùng dung dịch Lactate để pha thuốc (1)","manufacturer":"Merck Sharp&Dohme Corp.-Mỹ","notes":"Thường dùng dung dịch NaCl 0,9% để pha dịch truyền (2,5) Nếu có buồn nôn và/hoặc nôn trong khi dùng thuốc, giảm tốc độ truyền (1)","cold":false,"light":false},{"id":374,"tradeName":"TOBRAMYCIN","activeIngredient":"Tobramycin","strength":"80mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm TTM: Dung dịch tiêm + 50-100ml (NaCl 0,9%, Glucose 5%) (thời gian truyền từ 20- 60 phút) (1)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C, tránh ánh sáng","incompatibilities":"Tương kỵ với các kháng sinh nhóm beta - lactam (2)","manufacturer":"Công ty CP Dược phẩm Minh Dân","notes":"","cold":false,"light":true},{"id":375,"tradeName":"TRACTOCILE 37,5MG/5ML","activeIngredient":"Atosiban 37,5mg/5ml","strength":"37,5mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"Bước 1: Tiêm bolus TM: Lấy 0,9 ml (6,75mg) TMC trên 1 phút HOẶC lấy 6,75mg (0,9ml) pha 10ml Lactated Ringer's/NaCl 0,9%/Glucose 5% tiêm TMC trên 1 phút Bước 2: Liểu duy trì: Lọ 1còn 30,75 mg (4,1 mL) Atosiban pha 36,9 mL Lactated Ringer's/NaCl 0,9%/Glucose 5%, truyền bơm tiêm điện (BTĐ) 24 mL/giờ. Sau đó pha lọ 2 (37,5 mg/5 mL) trong 45 mL Lactated Ringer's/NaCl 0,9%/Glucose 5% truyền BTĐ 24 mL/giờ trong 3 giờ đầu -Bước 3: Lọ 2 còn 19 mL ở bước 2 truyền BTĐ 8 mL/giờ. Từ lọ 3: Pha với 45 mL Lactated Ringer's/NaCl 0,9%/Glucose 5% được 50 mL dung dịch truyền với tốc độ 8mL/giờ. Thời gian dùng thuốc tối đa 45 giờ.","storage":"Thuốc bảo quản nhiệt độ 2–8°C, sử dụng ngay sau mở nắp. Dung dịch pha loãng truyền tĩnh mạch có thể sử dụng trong vòng 24h","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":false},{"id":376,"tradeName":"TRACUTIL","activeIngredient":"Sắt clorid + kẽm clorid + mangan clorid + đồng clorid + crôm clorid + natri molybdat dihydrat + natri selenid pentahydrat + natri fluorid + kali iodid","strength":"(6,958mg +6,815mg +1,979mg +2,046mg +0,053mg +0,0242mg +0,0789mg +1,26mg +0,166mg) /10ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm cần phải pha loãng với ≥ 250ml NaCl 0,9%, Glucose 5% (1) Truyền dung dịch pha loãng ít nhất trong 6h và nên hoàn tất trong vòng 24h (1)","storage":"Thuốc sau khi pha bảo quản trong vòng 24h ở 2–8°C. Hủy thuốc dư không sử dụng ngay (1)","incompatibilities":"Dùng riêng với các dung dịch có chứa phosphat vô cơ, dung dịch kiềm như natri bicarbonat, nhũ tương béo (1)","manufacturer":"B.Braun Melsungen AG, Germany","notes":"","cold":false,"light":false},{"id":377,"tradeName":"TRAMADOL - HAMELN 100MG/2ML","activeIngredient":"Tramadol hydrochloride 100mg/2ml","strength":"100mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB","TDD"],"reconstitution":"TB,TDD: Dung dịch tiêm TM: Dung dịch tiêm chậm trong 2-3 phút TTM: Dung dịch tiêm pha loãng với dung dịch NaCl 0,9%/glucose 5% thành dung dịch nồng độ 10mg/mL (pha 50-100ml dung môi tương hợp truyền trong 15-30 phút)","storage":"Dung dịch pha nên sử dụng ngay lập tức. Độ ổn định lý hóa dung dịch pha trong vòng 24h ở 2–8°C.","incompatibilities":"","manufacturer":"","notes":"","cold":true,"light":false},{"id":378,"tradeName":"TRANEXAMIC ACID 250MG/5ML","activeIngredient":"Acid tranexamic","strength":"250mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm TTM: Dung dịch tiêm pha loãng với dung dịch Glucose 5%, NaCl 0,9% (1,2) (tiêm tĩnh mạch chậm không được quá 1 ml/phút) (2)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C, tránh ánh sáng.","incompatibilities":"Dùng riêng với penicillin (2)","manufacturer":"CT CPDP Minh Dân-VN","notes":"Không có chỉ định tiêm bắp (1)","cold":false,"light":true},{"id":379,"tradeName":"TRANSAMIN","activeIngredient":"Acid tranexamic","strength":"250mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB, TM, TTM: Dung dịch tiêm","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C.","incompatibilities":"Dùng riêng với penicillin (2)","manufacturer":"OLIC (Thailand) Limited-THÁI LAN","notes":"","cold":false,"light":false},{"id":380,"tradeName":"TREPMYCIN","activeIngredient":"Streptomycin sulfat","strength":"1000mg","dosageForm":"Bột pha tiêm","routes":["TB"],"reconstitution":"TB: Bột pha tiêm pha loãng với 4,2ml - 3,2ml - 1,8ml nước cất tiêm để được dung dịch có nồng độ tương ứng 200mg/ml, 250 mg/ml, 400 mg/ml (1,4,5)","storage":"Sử dụng trong vòng 24 giờ và loại bỏ phần thừa. Bảo quản lọ thuốc ở nhiệt độ < 30°C, tránh ánh sáng (1,2)","incompatibilities":"Streptomycin tương kỵ với acid và kiềm (2)","manufacturer":"PHARBACO- VN","notes":"Phải thử phản ứng dị ứng trước khi tiêm. Chỉ được dùng tiêm bắp sâu vào vùng cơ lớn.","cold":false,"light":true},{"id":381,"tradeName":"TRIAXOBIOTIC","activeIngredient":"Ceftriaxon","strength":"1g","dosageForm":"Bột pha tiêm + 10 ml nước cất pha tiêm → dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm (tiêm từ 2-4 phút) (2) TTM: Dung dịch tiêm + 50-100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút) (2) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch tiêm sau khi pha bảo quản trong vòng 24h ở nhiệt độ 2–8°C (2)","incompatibilities":"Không được pha với các dung dịch thuốc chứa Canxi khác (dung dịch Ringer,…). Dủng riêng với Aminoglycosid, Vancomycin, Fluconazol (2)","manufacturer":"CTCP DƯỢC PHẨM TENAMID- VN","notes":"Liều tiêm TM >1g chỉ nên truyền TM (1,2)","cold":true,"light":false},{"id":382,"tradeName":"TYGACIL","activeIngredient":"Tigecyclin","strength":"50mg","dosageForm":"Bột đông khô + 5,3ml (Glucose 5%, NaCl 0,9%) → dung dịch hoàn nguyên.","routes":["TTM"],"reconstitution":"TTM: Lấy 5ml dung dịch hoàn nguyên + 100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền từ 30- 60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 5,3ml dung dịch NaCl 0,9%","storage":"Dung dịch hoàn nguyên sau pha loãng với (Glucose 5%, NaCl 0,9%) bảo quản trong vòng 6h ở nhiệt độ < 25°C, 48h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với Amphotericin B, Chlorpromazin, Methyl prednisolon, Voriconazol (1)","manufacturer":"WYETH LEDERLE S.R.L-Ý","notes":"* Pha ít nhất 5,3ml (Glucose 5%, NaCl 0,9%). *Lọ thuốc chứa 6% lượng dư","cold":false,"light":false},{"id":383,"tradeName":"TYGEPOL","activeIngredient":"Tigecyclin","strength":"50mg","dosageForm":"Bột đông khô + 5ml (Glucose 5%, NaCl 0,9%, Lactate ringer) → dung dịch hoàn nguyên.","routes":["TTM"],"reconstitution":"TTM: Lấy 5ml dung dịch hoàn nguyên + 100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền từ 30- 60 phút) (1,2) PHÒNG PHA TIÊM: Bột tiêm + 5ml dung dịch NaCl 0,9%","storage":"Dung dịch hoàn nguyên sau pha loãng với (Glucose 5%, NaCl 0,9%) bảo quản trong vòng 6h (để trong lọ thuốc) hoặc 18 giờ (để trong túi dịch truyền) ở nhiệt độ < 25°C, 48h (trong túi dịch truyền) ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Aroma İlaç San. Ltd. Şti; Turkey","notes":"","cold":true,"light":false},{"id":384,"tradeName":"ULCERON","activeIngredient":"Pantoprazol","strength":"40 mg","dosageForm":"Bột đông khô+ 10ml nước cất tiêm → dung dịch tiêm.","routes":["TTM","TM"],"reconstitution":"TM:dung dịch tiêm, tiêm trong vòng 2-5 phút TTM: Dung dịch tiêm + 90ml (dung dịch Glucose 5%, NaCl 0,9%), không pha loãng dến nồng độ dưới 0,4 mg/ml để tránh kết tủa. Truyền trong vòng 15 phút (1)","storage":"Nên dùng thuốc sau khi pha trong vòng 6h (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"ANFARMHEL LAS S.A-HY LẠP","notes":"","cold":false,"light":false},{"id":385,"tradeName":"UNASYN 1,5G","activeIngredient":"Ampicillin + Sulbactam","strength":"1000 mg + 500 mg","dosageForm":"Bột pha tiêm + 3,2ml (nước cất pha tiêm, NaCl 0,9%) → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm (có thể pha với Lidocain 0,5%/2%) TM: Dung dịch tiêm (Tiêm ít nhất trong 3 phút) (1) TTM: Dung dịch tiêm + 50-100 ml dung dịch NaCl 0,9% (truyền từ 15-30 phút) (2)","storage":"Dung dịch đậm đặc để tiêm bắp trong vòng 1h sau khi pha Dung dịch sau khi pha NaCl 0,9% bảo quản trong vòng 8h ở 15–25°C và 72h ở 4°C (1)","incompatibilities":"Dùng riêng với aminoglycosid và các sản phẩm từ màu hoặc từ protein thủy phân (1,2)","manufacturer":"Haunpt Pharma Latina Ý","notes":"Thuốc chứa thành phần ampicillin nên sẽ kém bền trong dung dịch dextrose hoặc các dung dịch chứa carbohydrat khác. (1,2)","cold":false,"light":false},{"id":386,"tradeName":"VALBIVI","activeIngredient":"Vancomycin","strength":"500mg","dosageForm":"Bột tiêm + 10ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 100ml (dung dịch Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch hoàn nguyên ổn định trong 14 5 ngày ở nhiệt độ 2–8°C, hoặc sau pha loãng với dung dịch Glucose 5%, NaCl 0,9% ổn định trong 14 ngày ở nhiệt độ 2–8°C (1)","incompatibilities":"","manufacturer":"CÔNG TY CỔ PHẦN DƯỢC PHẨM TRUNG ƯƠNG 1 - PHARBACO- VN","notes":"","cold":true,"light":false},{"id":387,"tradeName":"VALBIVI","activeIngredient":"Vancomycin","strength":"1g","dosageForm":"Bột tiêm + 20ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 200ml (dung dịch Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 120 phút) (1,5) PHÒNG PHA TIÊM: Bột tiêm + 20ml nước cất tiêm","storage":"Dung dịch hoàn nguyên ổn định trong 145 ngày ở nhiệt độ 2–8°C, hoặc sau pha loãng với dung dịch Glucose 5%, NaCl 0,9% ổn định trong 14 ngày ở nhiệt độ 2–8°C (1)","incompatibilities":"","manufacturer":"CÔNG TY CỔ PHẦN DƯỢC PHẨM TRUNG ƯƠNG 1 - PHARBACO- VN","notes":"","cold":true,"light":false},{"id":388,"tradeName":"VAMINOLACT 100ML","activeIngredient":"Acid amin","strength":"100ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Thời gian truyền tối thiểu nên 8h (trẻ em) và 24h (trẻ sơ sinh và trẻ nhỏ)","storage":"Hỗn hợp đã pha cần truyền trong vòng 24 giờ để tránh nhiễm khuẩn","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":389,"tradeName":"VANCOMYCIN 500","activeIngredient":"Vancomycin","strength":"500mg","dosageForm":"Bột đông khô + 10ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi hoàn nguyên hoặc sau pha loãng với Glucose 5%, NaCl 0,9% ổn định trong vòng 14 ngày ở nhiệt độ 2–8°C (1)","incompatibilities":"Dung dịch Vancomycin hydroclorid có pH acid, nên tương kỵ với các chế phẩm kiềm, dùng riêng với Ceftriaxon, Ceftazidim, … (1)","manufacturer":"CTCPD-TTB Y TẾ BÌNH ĐỊNH-VN","notes":"Không được tiêm bắp (1)","cold":true,"light":false},{"id":390,"tradeName":"VANCOMYCIN 500 A.T","activeIngredient":"Vancomycin","strength":"500mg","dosageForm":"Bột đông khô + 10ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 100ml-200ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch sau khi hoàn nguyên hoặc sau pha loãng với Glucose 5%, NaCl 0,9% ổn định trong vòng 14 ngày ở nhiệt độ 2–8°C (1)","incompatibilities":"Dung dịch Vancomycin hydroclorid có pH acid, nên tương kỵ với các chế phẩm kiềm, dùng riêng với Ceftriaxon, Ceftazidim, … (1)","manufacturer":"CTCP DP AN THIÊN","notes":"Không được tiêm bắp (1)","cold":true,"light":false},{"id":391,"tradeName":"VERAPIME","activeIngredient":"Cefepime","strength":"1g","dosageForm":"Bột pha tiêm + 3ml (nước cất pha tiêm, NaCl 0,9%, Glucose 5%) → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm (1) TM: Dung dịch tiêm pha loãng thành 10 ml (Glucose 5%, NaCl 0,9%,…) (tiêm từ 3-5 phút) (1) TTM: Bột tiêm + 50-100ml (Glucose 5%, NaCl 0,9% (truyền 30 phút) (2) PHÒNG PHA TIÊM: Bột tiêm + 3ml nước cất tiêm","storage":"Dung dịch tiêm sau khi pha bảo quản trong vòng 12h ở nhiệt độ phòng < 25°C, 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Demo S.A. Pharmaceutical Industry","notes":"","cold":true,"light":false},{"id":392,"tradeName":"VICIMLASTATIN 1G","activeIngredient":"Imipenem + Cilastatin","strength":"500mg + 500mg","dosageForm":"Bột pha tiêm + 10 ml NaCl 0.9%, lắc kỹ, thêm tiếp 10 ml dung môi trên, lắc kỹ để đảm bảo thuốc đã tan hoàn toàn → dung dịch tiêm (1)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm chuyển vào lọ chứa vừa đủ 100 ml dịch truyền NaCl 0,9% (1) (truyền 250-500mg Imipenem từ 20-30 phút, 1g Imipenem từ 40-60 phút) (1,5) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 3h.","storage":"Dung dịch sau khi pha loãng có thể bảo quản trong vòng 4h ở nhiệt độ phòng (25°C), trong vòng 24h ở nhiệt độ 2–8°C (2)","incompatibilities":"Dùng riêng với các kháng sinh khác, không dùng dung dịch Lactate để pha thuốc (1)","manufacturer":"CTCP DP VCP- VN","notes":"Nếu có buồn nôn và/hoặc nôn trong khi dùng thuốc, giảm tốc độ truyền (1)","cold":false,"light":false},{"id":393,"tradeName":"VIETCEF 1G","activeIngredient":"Ceftriaxone","strength":"1g","dosageForm":"Bột pha tiêm + 10 ml nước cất pha tiêm, Glucose 5%, NaCl 0,9%) → dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm+ 2,1-3,6ml nước cất pha tiêm/NaCl 0,9%/Glucose 5%/Lidocain 1% TM: Dung dịch tiêm (TMC trong 5 phút) TTM: Dung dịch tiêm (C=100mg/ml) pha loãng với dung môi thành dung dịch 10-40mg/mL (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 30 phút)","storage":"","incompatibilities":"","manufacturer":"Panpharma, Pháp","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":394,"tradeName":"VIK 1 INJ 10MG/ML","activeIngredient":"Phytonadion 10mg/ml","strength":"10mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch tiêm TM: Dung dịch tiêm trong 3-5 phút TTM: Dung dịch tiêm pha loãng với tối thiểu 50ml dung môi tương hợp NaCl 0,9%/ glucose 5% truyền trong vòng 10-30 phút tốc độ tối đa 1mg/phút (15-30 phút)","storage":"Sử dụng ngay lập tức","incompatibilities":"","manufacturer":"","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":395,"tradeName":"VINCARDIPIN","activeIngredient":"Nicardipin hydroclorid","strength":"10mg/10ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm -Liều ban đầu: Truyền 3-5mg/giờ, không được quá 15mg/giờ -Liều duy trì: Truyền 2-4mg/giờ Cần pha loãng thuốc trong dung dịch tiêm truyền glucose 5% đến nồng độ 0,1 đến 0,2 mg/ml trước khi dùng, trừ khi được tiêm truyền qua tĩnh mạch trung tâm. (1)","storage":"Dung dịch sau khi pha loãng sử dụng trong vòng 24h. (1)","incompatibilities":"Nicardipin tương kỵ với dung dịch Ringer's lactat, furosemid, heparin và thiopental (1)","manufacturer":"Công ty CPDP Vĩnh Phúc, Việt Nam.","notes":"Cần dùng bơm tiêm điện hoặc bơm tiêm tự động để kiểm soát tốc độ truyền. Nếu truyền TM ngoại biên, cần thay đổi vị trí tiêm truyền mỗi 12h để tránh kích ứng tĩnh mạch (4)","cold":false,"light":false},{"id":396,"tradeName":"VINCOMID","activeIngredient":"Metoclopramid hydroclorid","strength":"10mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB,TM: Dung dịch tiêm. Tiêm trong vòng ít nhất 3 phút (1)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C, tránh ánh sáng (1)","incompatibilities":"Dùng riêng với các thuốc khác","manufacturer":"Công ty Cổ phần Dược phẩm Vĩnh Phúc","notes":"","cold":false,"light":true},{"id":397,"tradeName":"VINCOPANE","activeIngredient":"Hyoscin-N- butylbromide","strength":"20mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB","TDD"],"reconstitution":"TDD, TB: Dung dịch tiêm TM: Dung dịch tiêm, tiêm tĩnh mạch chậm (1)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C, tránh ánh sáng","incompatibilities":"Dùng riêng với các thuốc khác","manufacturer":"Công ty CPDP Vĩnh Phúc","notes":"Những bệnh nhân dùng thuốc chống đông chống chỉ định tiêm bắp. Không khuyến cáo sử dụng cho trẻ em.","cold":false,"light":true},{"id":398,"tradeName":"VINCOPANE 20MG/1ML","activeIngredient":"Hyoscin - N - Butylbromid 20mg/1ml","strength":"20mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB","TDD"],"reconstitution":"TB,TDD: Dung dịch tiêm TM: Dung dịch tiêm với tốc độ 1ml/phút","storage":"Sử dụng ngay khi mở ống, Ổn định trong dd glucose 5%, glucose 10%, NaCl 0,9%, Lactat ringer trong vòng 8h","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":399,"tradeName":"VINPHACINE","activeIngredient":"Amikacin*","strength":"500mg/ 2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm TTM: - Đối với người lớn: Dung dịch Vinphacine + 100-200ml dung dịch (Glucose 5%, NaCl 0,9%) (truyền từ 30-60 phút) (1,2) - Đối với trẻ em: Thể tích phụ thuộc vào nhu cầu người bệnh nhưng phải đủ để truyền trong 1-2 giờ (trẻ nhỏ), 30-60 phút (trẻ lớn) (1,2). Dung dịch tiêm truyền đạt nồng độ tối đa 10mg/ml (6)","storage":"Dung dịch sau khi pha bảo quản trong vòng 12h ở nhiệt độ 2–8°C, tránh ánh sáng (1)","incompatibilities":"Không được trộn lẫn với các thuốc khác Dùng riêng với kháng sinh nhóm Beta-lactam","manufacturer":"Công ty CPDP Vĩnh Phúc","notes":"","cold":true,"light":true},{"id":400,"tradeName":"VINPHASON","activeIngredient":"Hydrocortison","strength":"100mg","dosageForm":"Bột đông khô pha tiêm+ 2ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM","TM","TB"],"reconstitution":"TB, TM: Dung dịch hoàn nguyên. TTM: Dung dịch hoàn nguyên + 100- 1000 ml (NaCl 0,9% hoặc Glucose 5%) truyền từ 20-30 phút (1,5)","storage":"Dung dịch tiêm sau khi pha loãng bảo quản được 24h ở nhiệt độ ở nhiệt độ 2–8°C (5)","incompatibilities":"Không được trộn lẫn với các thuốc khác. (1)","manufacturer":"Cty CP DP Vĩnh Phúc","notes":"","cold":true,"light":false},{"id":401,"tradeName":"VINPHYTON 10MG","activeIngredient":"Phytomenadion (Vitamin K1)","strength":"10mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm TTM: Pha loãng dung dịch tiêm với một lượng thích hợp (khoảng 50 ml) (5)dung dịch Glucose 5%, NaCl 0,9%. (1) (Không được TTM >40mg Vinphyton trong 24h) (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh để đông lạnh, tránh ánh sáng. Phải dùng thuốc ngay sau khi pha loãng. Không được bảo quản lạnh, không dùng thuốc tiêm đã bị tách pha hoặc có xuất hiện các giọt dầu (1).","incompatibilities":"","manufacturer":"VINPHACO - VN","notes":"Không được TB trong các trường hợp có nguy cơ xuất huyết cao (1)","cold":true,"light":true},{"id":402,"tradeName":"VINPHYTON 1MG","activeIngredient":"Phytomenadion (Vitamin K1)","strength":"1mg/1ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm TTM: Pha loãng dung dịch tiêm với một lượng thích hợp (khoảng 50 ml (5))dung dịch Glucose 5%, NaCl 0,9%. (1) (Không được TTM >40mg Vinphyton trong 24h) (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh đông lạnh, tránh ánh sáng. Phải dùng thuốc ngay sau khi pha loãng. Không được bảo quản lạnh, không dùng thuốc tiêm đã bị tách pha hoặc có xuất hiện các giọt dầu (1)","incompatibilities":"","manufacturer":"VINPHACO - VN","notes":"Không được TB trong các trường hợp có nguy cơ xuất huyết cao (1)","cold":true,"light":true},{"id":403,"tradeName":"VINSALMOL","activeIngredient":"Salbutamol","strength":"0,5mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB","TDD"],"reconstitution":"TDD, TB: Dung dịch tiêm TM: 0,25 mg (0,5 ml) dung dịch tiêm pha loãng thành 5ml dung dịch với nước cất, tiêm chậm trong 5 phút (1,2,5) TTM: 0,5 mg dung dịch tiêm với 50ml dung dịch Glucose 5% hoặc NaCl 0,9% (5 mg pha với 500mg Glucose 5% hoặc NaCl 0,9%), tốc độ 3-20 microgam/phút (1,2).","storage":"Sau khi pha loãng dung dịch phải dùng ngay","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"VINPHACO- VN","notes":"Pha loãng thuốc trước khi dùng theo đường tĩnh mạch","cold":false,"light":false},{"id":404,"tradeName":"VINSOLON","activeIngredient":"Methylprednisolo ne natri succinat","strength":"40mg","dosageForm":"Bột đông khô pha tiêm +1ml nước cất tiêm → dung dịch tiêm.","routes":["TTM","TM","TB"],"reconstitution":"TB,TM: Dung dịch tiêm. TTM: Dung dịch tiêm pha với một lượng thích hợp dung dịch Glucose 5%, NaCl 0,9% truyền trong 30 phút (1)","storage":"Dung dịch sau pha loãng bảo quản trong vong 24h. (1)","incompatibilities":"Dùng riêng rẽ, không trộn lẫn với các thuốc khác","manufacturer":"Cty CP DP Vĩnh Phúc","notes":"Chế phẩm có dung môi kèm theo","cold":false,"light":false},{"id":405,"tradeName":"VINXIUM","activeIngredient":"Esomeprazole sodium","strength":"40 mg","dosageForm":"Bột pha tiêm","routes":["TTM","TM"],"reconstitution":"TM: Bột tiêm+ 5ml dung dịch NaCl 0,9%. (Tiêm tối thiểu 3 phút) (1) TTM: Bột tiêm hòa tan vừa đủ 100ml dung dịch NaCl 0,9%, truyền tĩnh mạch trong 10-30 phút (1)","storage":"Dung dịch có thể bảo quản trong 12h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Công ty CPDP Vĩnh Phúc - VN","notes":"","cold":true,"light":false},{"id":406,"tradeName":"VINZIX","activeIngredient":"Furosemid","strength":"20mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm. Tốc độ tiêm không quá 4 mg/phút (1). TTM: Pha loãng trong NaCl 0,9%. Tốc độ truyền không quá 4 mg/phút (1).","storage":"Bảo quản nơi khô ráo, nhiệt độ < 30°C, tránh ánh sáng","incompatibilities":"Không được pha với dung dịch Glucose hoặc dung dịch acid Không được phối hợp bất cứ thuốc gì vào dịch truyền hoặc bơm tiêm có chứa furosemid (1,2)","manufacturer":"Cty CP DP Vĩnh Phúc","notes":"","cold":false,"light":true},{"id":407,"tradeName":"VITAFXIM 1G","activeIngredient":"Cefotaxim","strength":"1g","dosageForm":"Bột pha tiêm","routes":["TTM","TM","TB"],"reconstitution":"TB: Bột tiêm + 5ml nước cất tiêm (1) TM: Bột tiêm + 5ml nước cất tiêm (tiêm từ 3-5 phút) (1) TTM: Bột tiêm + 50 - 100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 20 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 5 ml nước cất tiêm","storage":"Dung dịch tiêm sau khi pha ổn định trong vòng 24h ở nhiệt độ 2–8°C (1,2)","incompatibilities":"Không được pha vào dung dịch kiềm (dung dịch Natri bicarbonate,…). Dùng riêng với Aminoglycosid, Metronidazol,... (1)","manufacturer":"CTCPDP VCP- VN","notes":"","cold":true,"light":false},{"id":408,"tradeName":"VITAMIN B1","activeIngredient":"Thiamin HCL","strength":"100mg/ml","dosageForm":"Dung dịch tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm (1)","storage":"Bảo quản thuốc ở nhiệt độ < 30°C, tránh ánh sáng (1)","incompatibilities":"","manufacturer":"Công ty CP DP Vĩnh Phúc","notes":"Không được tiêm tĩnh mạch (1)","cold":false,"light":true},{"id":409,"tradeName":"VITAMIN B1","activeIngredient":"Thiamin HCL","strength":"100mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm (1)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C.","incompatibilities":"","manufacturer":"CT CPDP 3/2","notes":"Không được tiêm tĩnh mạch (1)","cold":false,"light":false},{"id":410,"tradeName":"VITAMIN B1","activeIngredient":"Thiamin HCL","strength":"100mg/2ml","dosageForm":"Dung dịch tiêm","routes":["TB"],"reconstitution":"TB: Dung dịch tiêm (1)","storage":"Bảo quản ống thuốc ở nhiệt độ phòng < 30°C, tránh ánh sáng (1)","incompatibilities":"","manufacturer":"CTCP DƯỢC VTYT HẢI DƯƠNG-VN","notes":"Không được tiêm tĩnh mạch (1)","cold":false,"light":true},{"id":411,"tradeName":"VITAMIN C KABI 500MG/5ML","activeIngredient":"Acid ascorbic","strength":"500mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB","TDD"],"reconstitution":"TB, TM, TDD: Dung dịch tiêm (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng (1)","incompatibilities":"Dùng riêng với penicillin G, muối sắt, nguyên tố oxi hóa và các kim loại nặng, aminophyllin, natri bicarbonat, nitrofurantoin (1)","manufacturer":"Công ty cổ phần Fresenius Kabi Việt Nam, Việt Nam.","notes":"","cold":false,"light":true},{"id":412,"tradeName":"VITAMIN C 500MG/5ML","activeIngredient":"Acid ascorbic","strength":"500mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB, TM: Dung dịch tiêm (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Cty CPDP MINH DÂN- VN","notes":"Chỉ lấy thuốc ra khỏi hộp ngay trước khi dùng, tránh tác động của ánh sáng.","cold":false,"light":true},{"id":413,"tradeName":"VITAMIN K1","activeIngredient":"Phytomenadion (Vitamin K1)","strength":"10mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM"],"reconstitution":"TTM: Pha loãng dung dịch tiêm với 50 ml dung dịch Glucose 5%, NaCl 0,9% truyền từ 15-30 phút (5) (Không được TTM >40mg Vitamin K1 trong 24h) (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh đông lạnh, tránh ánh sáng. Phải dùng thuốc ngay sau khi pha loãng.","incompatibilities":"","manufacturer":"DANAPHA-VN","notes":"CCĐ tiêm bắp do có nguy cơ hình thành huyết khối (1)","cold":true,"light":true},{"id":414,"tradeName":"VITAMIN K1","activeIngredient":"Phytomenadion (Vitamin K1)","strength":"10mg/ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm TTM: Pha loãng dung dịch tiêm với 50 ml dung dịch Glucose 5%, NaCl 0,9% truyền từ 15-30 phút (5) (Không được TTM >40mg Vitamin K1 trong 24h) (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, không được bảo quản lạnh thuốc tiêm, cần tránh ánh sáng. Phải dùng thuốc ngay sau khi pha loãng.","incompatibilities":"","manufacturer":"Cty CPDP MINH DÂN- VN","notes":"Không được TB trong các trường hợp có nguy cơ xuất huyết cao (1)","cold":true,"light":true},{"id":415,"tradeName":"VIZIMTEX 500MG","activeIngredient":"Azithromycin","strength":"500mg","dosageForm":"Bột pha tiêm + 4,8 ml nước cất pha tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"Không tiêm bắp và tiêm tĩnh mạch. Dung môi tương hợp D5W, NS, Others (0.45% NaCl, LR, D5LR) Hoàn nguyên: Dung dịch hoàn nguyên pha loãng thành nồng độ 1mg/mL (500mL dung môi)/ nồng độ 2mg/mL (250mL dung môi) Truyền tĩnh mạch > 60 phút (Khuyến cáo nồng độ 2mg/ml truyền trên 1 giờ, 1mg/ml truyền trên 3 giờ)","storage":"Dung dịch hoàn nguyên bảo quản ở nhiệt độ phòng (<30°C) ổn định hóa học trong 24 giờ. Dung dịch pha tiêm truyền ổn định hóa học 24 giờ (<30°C) và 7 ngày ở nhiệt độ 2–8°C.","incompatibilities":"","manufacturer":"Anfarm Hellas S.A - Greece.","notes":"","cold":false,"light":false},{"id":416,"tradeName":"VOLTAREN","activeIngredient":"Diclofenac natri","strength":"75mg/3ml","dosageForm":"Dung dịch thuốc tiêm","routes":["TTM","TB"],"reconstitution":"TB: Dung dịch tiêm, phải tuân thủ hướng dẫn tiêm bắp để tránh tổn thương thần kinh hoặc mô. TTM: Cần phải pha loãng với 100 - 500 ml dung dịch Glucose 5%, NaCl 0,9%, thêm dung dịch đệm Natri bicarbonat (0,5 ml dung dịch 8.4% hoặc 1ml dung dịch 4.2%) (5)","storage":"Bảo quản trong bao bì kín, tránh ánh sáng, ở nơi khô ráo, nhiệt độ < 30°C. Dung dịch cần được tiêm ngay sau khi mở. Hủy thuốc dư không sử dụng ngay","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Lek Pharmaceuticals d.d.,Slovenia","notes":"","cold":false,"light":true},{"id":417,"tradeName":"VOLULYTE 6%","activeIngredient":"Tinh bột ester hóa (hydroxyethyl starch)","strength":"6%, 500ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Liều dùng và tốc độ truyền tùy thuộc vào tình trạng mất máu của BN","storage":"Dùng thuốc ngay sau khi mở bao bì","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":418,"tradeName":"VORIOLE IV","activeIngredient":"Voriconazol","strength":"200mg","dosageForm":"Bột đông khô pha vừa đủ với 20ml (nước cất tiêm, NaCl 0,9%) → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên pha đến 40ml- 400ml dung dịch NaCl 0,9% (để có được dung dịch Voriconazol 0,5-5mg/ml) (1) (thời gian truyền trong vòng 1-3 giờ)","storage":"Dung dịch sau khi pha loãng ổn định trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác kể cả dịch truyền dinh dưỡng (1)","manufacturer":"MSN Laboratories Limited- Ấn Độ","notes":"","cold":false,"light":false},{"id":419,"tradeName":"VORZOLE","activeIngredient":"Voriconazol","strength":"200mg","dosageForm":"Bột đông khô + 19ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên pha đến 100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền trong vòng 1-2 giờ) (1)","storage":"Dung dịch sau khi pha loãng ổn định trong vòng 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác kể cả dịch truyền dinh dưỡng (1)","manufacturer":"LYKA LABS LTD- Ấn Độ","notes":"Chỉ được truyền TM, không được tiêm tĩnh mạch nhanh","cold":false,"light":false},{"id":420,"tradeName":"VOXIN","activeIngredient":"Vancomycin","strength":"500mg","dosageForm":"Bột đông khô + 10ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch hoàn nguyên bảo quản ở nhiệt độ 2–8°C trong 4 ngày (1), hoặc sau pha loãng với dung dịch Glucose 5%, NaCl 0,9% bảo quản ở nhiệt độ 2–8°C trong 24 giờ, tối đa 14 ngày nếu đảm bảo việc pha loãng được thực hiện vô trùng.","incompatibilities":"Dung dịch Vancomycin hydroclorid có pH acid, nên tương kỵ với các chế phẩm kiềm, dùng riêng với Ceftriaxon, Ceftazidim, … (1)","manufacturer":"Vianex S.A- Plant C' - Hy Lạp","notes":"","cold":true,"light":false},{"id":421,"tradeName":"VOXIN","activeIngredient":"Vancomycin","strength":"1g","dosageForm":"Bột đông khô + 20ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên + 200ml-500ml (Glucose 5%, NaCl 0,9%) (thời gian truyền ít nhất 60 phút) (1) PHÒNG PHA TIÊM: Bột tiêm + 20ml nước cất tiêm","storage":"Dung dịch hoàn nguyên bảo quản ở nhiệt độ 2–8°C trong 4 ngày (1), hoặc sau pha loãng với dung dịch Glucose 5%, NaCl 0,9% bảo quản ở nhiệt độ 2–8°C trong 24 giờ, tối đa 14 ngày nếu đảm bảo việc pha loãng được thực hiện vô trùng.","incompatibilities":"Dung dịch Vancomycin hydroclorid có pH acid, nên tương kỵ với các chế phẩm kiềm, dùng riêng với Ceftriaxon, Ceftazidim, … (1)","manufacturer":"Vianex S.A- Plant C' - Hy Lạp","notes":"","cold":true,"light":false},{"id":422,"tradeName":"ZAMIFEN 1G","activeIngredient":"Cefazolin Sodium 1g","strength":"1g","dosageForm":"Bột pha tiêm + 2,5ml nước cất pha tiêm→ dung dịch hoàn nguyên","routes":["TTM","TM","TB"],"reconstitution":"TB: Dung dịch hoàn nguyên. TM: Dung dịch hoàn nguyên hòa loãng thêm với 10ml nước cất. (TMC 3-5 phút) TTM:dung dịch hoàn nguyên pha loãng với 50 - 100ml dung môi thích hợp (NaCl 0,9%; Glucose 5%, 10%; Ringer lactated)","storage":"Dung dịch hoàn nguyên, dung dịch tiêm bảo quản ở nhiệt độ 2–8°C trong vòng 24 giờ.","incompatibilities":"","manufacturer":"Công ty TNHH Medochemie (Viễn Đông)","notes":"THUỐC TRÁNH ÁNH SÁNG","cold":false,"light":true},{"id":423,"tradeName":"ZAVICEFTA","activeIngredient":"Ceftazidime + Avibactam","strength":"2g + 0.5g","dosageForm":"Bột pha tiêm + 10 ml nước cất tiêm → dung dịch hoàn nguyên","routes":["TTM"],"reconstitution":"TTM: Dung dịch hoàn nguyên pha đến 100ml (Glucose 5%, NaCl 0,9%) (thời gian truyền trong vòng 2 giờ) (1) PHÒNG PHA TIÊM: Bột tiêm + 10ml nước cất tiêm","storage":"Dung dịch hoàn nguyên phải được pha loãng ngay lập tức, tổng thởi gian từ khi bắt đầu hoàn nguyên và hoàn tất pha dung dịch truyền TM trong vòng 30 phút (1) Dung dịch sau khi pha ổn định trong vòng 4h ở nhiệt độ < 25°C, 12h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"ACS Dobfar S.P.A- Italy","notes":"","cold":true,"light":false},{"id":424,"tradeName":"ZENTANIL 500MG/5ML","activeIngredient":"Acetyl leucin 500mg/5ml","strength":"500mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TM"],"reconstitution":"TM: Dung dịch tiêm (tiêm TM chậm 3-5 phút)","storage":"Sau khi mở ống thuốc phải được dùng ngay lập tức","incompatibilities":"","manufacturer":"","notes":"","cold":false,"light":false},{"id":425,"tradeName":"ZENTRAMOL","activeIngredient":"Acid tranexamic","strength":"250mg/5ml","dosageForm":"Dung dịch tiêm","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch tiêm TTM: Dung dịch tiêm pha loãng với dung dịch Glucose 5%, NaCl 0,9%, dextran 40, dextran 70, dung dịch điện giải Ringer (2) (tiêm tĩnh mạch chậm không được quá 1 ml/phút) (1,2)","storage":"Bảo quản ống thuốc ở nhiệt độ < 30°C.","incompatibilities":"Dùng riêng với penicillin (2)","manufacturer":"CTCP DƯỢC DANAPHA-VN","notes":"Không có chỉ định tiêm bắp (1)","cold":false,"light":false},{"id":426,"tradeName":"ZERBAXA 1G/0,5G","activeIngredient":"Ceftolozane+ Tazobactam","strength":"1g + 0,5g","dosageForm":"Bột pha tiêm + 10 ml nước cất pha tiêm, NaCl 0,9%) → dung dịch tiêm (không được dùng để tiêm trực tiếp)","routes":["TTM"],"reconstitution":"TTM: Dung dịch tiêm + 100ml (NaCl 0,9%, Glucose 5%) (1)","storage":"Bảo quản lọ thuốc ở nhiệt độ 2–8°C (1) Dung dịch sau khi pha loãng ổng định trong vòng 24h ở nhiệt độ < 25°C, 7 ngày ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"Steri-Pharma, LLC","notes":"","cold":true,"light":false},{"id":427,"tradeName":"ZOBACTA 3,375G","activeIngredient":"Piperacillin monohydrate +Tazobactam","strength":"3g + 0,375g","dosageForm":"Bột pha tiêm + 15ml (nước cất tiêm, NaCl 0,9%, Glucose 5%) → dung dịch hoàn nguyên","routes":["TTM","TM"],"reconstitution":"TM: Dung dịch hoàn nguyên (trong 3-5 phút) (1) TTM: Dung dịch hoàn nguyên + 50-100ml (Glucose 5%, NaCl 0,9%) truyền ít nhất 30 phút (1) Khuyến cáo để đạt PK/PD, kháng sinh truyền chậm trong 4h","storage":"Dung dịch hoàn nguyên được bảo quản trong vòng 12h ở nhiệt độ < 25°C, 24h ở nhiệt độ 2–8°C (1)","incompatibilities":"Dùng riêng với Aminoglycosid, Metronidazol hoặc với các dung dịch chứa Natri carbonat, Lactat ringer, chế phẩm máu hoặc các sản phẩm thủy phân Albumin (1)","manufacturer":"Chi nhánh 3 - Công ty Cổ phần Dược phẩm Imexpharm tại Bình Dương","notes":"","cold":false,"light":false},{"id":428,"tradeName":"ZODALAN","activeIngredient":"Midazolam","strength":"5mg/ml","dosageForm":"Dung dịch tiêm","routes":["TM","TB"],"reconstitution":"TB: Dung dịch tiêm (chỉ dùng trong những trường hợp đặc biệt) TM: Dung dịch tiêm (tốc độ 1mg/30 giây (1) * TE < 15 kg: Nên pha loãng về nồng độ 1 mg/ml.","storage":"Ống thuốc được bảo quản <30°C, tránh ánh sáng","incompatibilities":"Midazolam kết tủa trong các dung dịch chứa bicarbonat (5)","manufacturer":"Cty CPD DANAPHA-VN","notes":"Bảo quản theo qui chế thuốc hướng thần","cold":false,"light":true},{"id":429,"tradeName":"ZYVOX","activeIngredient":"Linezolid","strength":"600mg/ 300ml","dosageForm":"Dung dịch tiêm truyền","routes":["TTM"],"reconstitution":"TTM: Dung dịch TTM (thời gian truyền 30-120 phút) (1)","storage":"Bảo quản nhiệt độ phòng < 30°C, tránh ánh sáng. Tránh đông lạnh. Dùng thuốc ngay sau khi mở lọ (1,5) PHÒNG PHA TIÊM: 24h ở nhiệt độ <25°C","incompatibilities":"Dùng riêng với các thuốc khác (1)","manufacturer":"FRESENIUS KABI NORGE AS-NA UY","notes":"Nên kiểm tra cảm quang trước khi sử dụng. Nên kiểm tra độ rò rỉ bằng cách bóp chặt lọ thuốc vài phút, nếu có rò rỉ phải loại bỏ ngay","cold":true,"light":true}];
const REFS=[
  {n:"1",t:"Hướng dẫn sử dụng thuốc của Nhà sản xuất"},
  {n:"2",t:"Dược thư quốc gia Việt Nam 2022 – lần xuất bản thứ 3"},
  {n:"3",t:"Trung tâm DI & ADR Quốc gia"},
  {n:"4",t:"AHFS Drug Information 2011"},
  {n:"5",t:"Injectable Drugs Guide 2011"},
  {n:"6",t:"Pediatric Injectable Drug – 10th Edition"}
];

// ─ Utils ─
function injNorm(s){return(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\u0111/g,"d");}
function injEh(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function injCite(s){
  if(!s)return"—";
  return injEh(s).replace(/\(\s*(\d+(?:\s*,\s*\d+)*)\s*\)/g,function(_,inner){
    return inner.trim().split(/\s*,\s*/).filter(Boolean).map(function(n){return"<sup class=\"injCite\">["+n+"]</sup>";}).join("");
  });
}
function hl(s,q){
  if(!q)return injEh(s);
  var e=q.replace(/[.+*?{}()|[\]\\^$]/g,"\\$&");
  try{return injEh(s).replace(new RegExp("("+e+")","gi"),"<mark>$1</mark>");}catch(err){return injEh(s);}
}

// ─ Text normalizer ─
// Fix data inconsistencies: "TM:word" → "TM: word", "TTM :" → "TTM:"
function injNormalizeText(t){
  if(!t) return t;
  // Fix space before colon: "TTM :" → "TTM:"
  t=t.replace(/(TTM|TM|TB|TDD|NKQ)\s+:/g,"$1:");
  // Fix missing space after colon: "TM:word" → "TM: word"
  t=t.replace(/(PHÒNG PHA TIÊM|TTM|TM|TB|TDD|NKQ):([^\s])/g,"$1: $2");
  return t;
}

// ─ Reconstitution splitter ─
// Split on route-label boundaries; post-merge orphan "ROUTE," fragments
function injSplitRecon(text){
  if(!text)return[];
  var t=injNormalizeText(text.trim());
  var SEP="\x00";
  // Keywords ordered longest-first to avoid partial matches
  var KW=["PHÒNG PHA TIÊM","TTM trẻ sơ sinh","TTM trẻ em","TTM người lớn",
    "TDD, TB, TM","TDD,TB,TM","TB, TM, TDD","TB, TM, TTM",
    "TB, TM","TB,TM","TDD, TB","TDD,TB","TDD, TM","TDD,TM",
    "TM, TTM","TM,TTM",
    "TTM","TM","TB","TDD","NKQ",
    "Khuyến cáo PK/PD","Phun khí dung","Tủy sống","Ngoài màng cứng"];
  KW.forEach(function(kw){
    // Insert SEP before kw when kw is followed by ":"
    var rx=new RegExp("(?<!\\w)(?="+kw.replace(/[.+*?{}()|[\]\\^$]/g,"\\$&")+"\\s*:)","g");
    t=t.replace(rx,SEP);
  });
  t=t.replace(/^\x00/,"");
  var raw=t.split(SEP).map(function(s){return s.trim();}).filter(Boolean);
  // Post-merge orphan "ROUTE," with next segment
  var segs=[]; var i=0;
  while(i<raw.length){
    var seg=raw[i];
    if(/^(?:TTM|TM|TB|TDD)[,\s]*$/.test(seg)&&i+1<raw.length){
      var nxt=raw[i+1];
      var m=nxt.match(/^([\w\s,]+?)\s*:\s*/);
      if(m){segs.push(seg.replace(/[,\s]+$/,"")+", "+nxt);}
      else{segs.push(seg+" "+nxt);}
      i+=2;
    }else{segs.push(seg);i++;}
  }
  return segs.length?segs:[t];
}

// Badge CSS class for a route label string
function injBadgeCls(label){
  var l=label.trim();
  if(l==="PHÒNG PHA TIÊM")return"rb-PP";
  var parts=l.split(/\s*,\s*/);
  if(parts.length>1)return"rb-COMBO";
  var m={"TTM":"rb-TTM","TM":"rb-TM","TB":"rb-TB","TDD":"rb-TDD"};
  return m[parts[0]]||"rb-OTHER";
}

// Render reconstitution as coloured rows
function injRenderRecon(text){
  if(!text)return"<span style=\"color:#94a3b8\">—</span>";
  var segs=injSplitRecon(text);
  var PP=["PHÒNG PHA TIÊM"];
  var lines=segs.map(function(seg){
    var label="",content=seg;
    for(var j=0;j<PP.length;j++){if(seg.indexOf(PP[j]+":")==0){label=PP[j];content=seg.slice(PP[j].length+1).trim();break;}}
    if(!label){
      var cm=seg.match(/^((?:(?:TTM|TM|TB|TDD)(?:\s*,\s*)?)+)\s*:\s*/);
      if(cm){label=cm[1].trim();content=seg.slice(cm[0].length).trim();}
    }
    if(!label){
      var km=seg.match(/^(Khuyến cáo PK\/PD|Phun khí dung|NKQ|Tủy sống|Ngoài màng cứng)\s*:\s*/);
      if(km){label=km[1];content=seg.slice(km[0].length).trim();}
    }
    if(label){
      var isPP=PP.indexOf(label)>=0;
      var lh=isPP?"<span class=\"recon-pp\">"+injEh(label)+":</span>":"<span class=\"recon-route\">"+injEh(label)+":</span>";
      return lh+" "+injCite(content);
    }
    return injCite(seg);
  });
  return lines.join("<br>");
}

// Used references from a drug record
function injUsedRefs(d){
  var txt=[d.reconstitution,d.storage,d.incompatibilities,d.notes].join(" ");
  var found=new Set();
  (txt.match(/\(\s*\d+(?:\s*,\s*\d+)*\s*\)/g)||[]).forEach(function(g){(g.match(/\d+/g)||[]).forEach(function(n){found.add(+n);});});
  var refs=REFS.filter(function(_,i){return found.has(i+1);});
  // Default to manufacturer ref [1] when no citations found
  if(!refs.length) refs=[REFS[0]];
  return refs;
}

// Section builder
function sec(cls,iconSvg,title,bodyHtml){
  return"<div class=\"sb "+cls+"\"><div class=\"st\">"+iconSvg+title+"</div><div class=\"sv\">"+bodyHtml+"</div></div>";
}

// ─ Build card ─
var ICO={
  box:"<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z\"/></svg>",
  grid:"<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><path d=\"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18\"/></svg>",
  cal:"<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><rect x=\"2\" y=\"7\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M16 3v4M8 3v4\"/></svg>",
  warn:"<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><path d=\"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/></svg>",
  info:"<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"16\" x2=\"12.01\" y2=\"16\"/></svg>",
  shield:"<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/></svg>",
  book:"📚",
  bld:"<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"2\" y=\"7\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2\"/></svg>"
};

function injBuildCard(d){
  var rps=d.routes.map(function(r){return"<span class=\"rp rp-"+r+"\">"+r+"</span>";}).join("");
  var infoBadges="<span class=\"info-badge ib-api\">"+injEh(d.activeIngredient)+(d.strength?" · "+injEh(d.strength):"")+  "</span>";
  if(d.cold)infoBadges+="<span class=\"info-badge ib-sto-cold\">❄ Lạnh 2–8°C</span>";
  else if(d.light)infoBadges+="<span class=\"info-badge ib-sto-light\">☀ Tránh ánh sáng</span>";
  else infoBadges+="<span class=\"info-badge ib-sto\">Nhiệt độ phòng</span>";
  if(d.incompatibilities)infoBadges+="<span class=\"info-badge ib-inc\">⚠ Có tương kỵ</span>";
  if(d.manufacturer)infoBadges+="<span class=\"info-badge ib-mfr\">"+injEh(d.manufacturer)+"</span>";
  var reconHtml=injRenderRecon(d.reconstitution);
  var stoClass=d.cold?"sto-cold":d.light?"sto-light":"sto-room";
  var stoVal="<span class=\""+stoClass+"\">"+injCite(d.storage||"—")+"</span>";
  var trDos="<tr><td class=\"td-lbl\">Dạng bào chế</td><td>"+injEh(d.dosageForm||"—")+"</td></tr>";
  var trRec="<tr><td class=\"td-lbl\">Đường dùng &amp;<br>Hướng dẫn pha</td><td>"+reconHtml+"</td></tr>";
  var trSto="<tr><td class=\"td-lbl\">Bảo quản</td><td>"+stoVal+"</td></tr>";
  var trInc=d.incompatibilities?"<tr class=\"tr-inc\"><td class=\"td-lbl\">Tương kỵ</td><td class=\"inc-text\">"+injCite(d.incompatibilities)+"</td></tr>":"";
  var trNot=d.notes?"<tr><td class=\"td-lbl\">Chú ý đặc biệt</td><td>"+injCite(d.notes)+"</td></tr>":"";
  var clinicalText="<span class=\"cli-lbl\">Kiểm tra cảm quan:</span> Không sử dụng nếu dung dịch thay đổi màu sắc, xuất hiện kết tủa hoặc đông băng trong quá trình bảo quản.<br>"
    +"<span class=\"cli-lbl\">Sử dụng sau khi pha:</span> Về mặt hóa lý, dung dịch sau khi pha chỉ ổn định trong khoảng thời gian nhất định theo khuyến cáo. Để đảm bảo an toàn vi sinh, khuyến khích sử dụng ngay lập tức sau khi pha. Trong trường hợp không thể sử dụng ngay, phải tuân thủ nghiêm ngặt điều kiện và thời gian bảo quản sau khi pha.";
  var trCli="<tr class=\"tr-cli\"><td class=\"td-lbl\">Lưu ý lâm sàng</td><td>"+clinicalText+"</td></tr>";
  var refs=injUsedRefs(d);
  var refsSec="<div class=\"sb s-ref\"><div class=\"st\">"+ICO.book+" Tài liệu tham khảo</div><div class=\"sv\"><div class=\"ref-list\">"
    +(refs.length?refs.map(function(r){return"<div class=\"ref-row\"><span class=\"ref-n\">["+r.n+"]</span><span>"+injEh(r.t)+"</span></div>";}).join(""):"")
    +"</div></div></div>";
  return"<div class=\"dc\" id=\"inj-dc-"+d.id+"\">"
    +"<div class=\"dch\"><div class=\"dch-trade\">"+injEh(d.tradeName)+"</div>"
    +"<div class=\"dch-meta\">"+injEh(d.activeIngredient)+(d.strength?" <span class=\"str\">· "+injEh(d.strength)+"</span>":"")+"</div>"
    +"<div class=\"dch-pills\">"+rps+"</div>"
    +"<div class=\"dch-info-row\">"+infoBadges+"</div></div>"
    +"<div class=\"dtbl-wrap\"><table class=\"dtbl\"><tbody>"
    +trDos+trRec+trSto+trInc+trNot+trCli
    +"</tbody></table></div>"
    +refsSec+"</div>";
}

// ─ Render cards ─
function injRenderCards(list){
  var cc=document.getElementById("inj-cc");
  if(!list||!list.length){
    if(!injQ){
      var cold=DRUGS.filter(function(d){return d.cold;}).length;
      var light=DRUGS.filter(function(d){return d.light;}).length;
      var inc=DRUGS.filter(function(d){return d.incompatibilities;}).length;
      cc.innerHTML="<div class=\"wlc\"><div class=\"wlc-ico\">💉</div><div class=\"wlc-h\">Tra Cứu Thuốc Tiêm</div><div class=\"wlc-p\">Nhập tên biệt dược, hoạt chất, hàm lượng hoặc nhà sản xuất để tra cứu hướng dẫn pha và bảo quản</div><div class=\"ws-row\"><div class=\"ws\"><div class=\"ws-n\">428</div><div class=\"ws-l\">Thuốc tiêm</div></div><div class=\"ws\"><div class=\"ws-n\" style=\"color:#1d4ed8\">"+cold+"</div><div class=\"ws-l\">Bảo quản lạnh</div></div><div class=\"ws\"><div class=\"ws-n\" style=\"color:#92400e\">"+light+"</div><div class=\"ws-l\">Tránh ánh sáng</div></div><div class=\"ws\"><div class=\"ws-n\" style=\"color:#b91c1c\">"+inc+"</div><div class=\"ws-l\">Có tương kỵ</div></div></div></div>";
    }else{
      cc.innerHTML="<div class=\"nores\"><div class=\"nores-ico\">🔍</div><div class=\"nores-h\">Không tìm thấy kết quả</div><p>Thử từ khóa khác hoặc tên hoạt chất</p></div>";
    }return;
  }
  cc.innerHTML=list.map(injBuildCard).join("");
}

// ─ Search — init sau DOMContentLoaded ─
var injQ="",injFI=-1,injDI=[],injDBT;
var injSI,injDD,injSC;
function injInit(){
  injSI=document.getElementById("inj-si");
  injDD=document.getElementById("inj-dd");
  injSC=document.getElementById("inj-sc");
  if(!injSI)return; // chưa load xong DOM
  injSI.addEventListener("input",function(){injQ=this.value;injSC.classList.toggle("on",injQ.length>0);clearTimeout(injDBT);injDBT=setTimeout(function(){injFI=-1;injRunSearch();},90);});
  injSI.addEventListener("keydown",function(e){if(!injDD.classList.contains("open"))return;if(e.key==="ArrowDown"){e.preventDefault();injMoveFocus(1);}else if(e.key==="ArrowUp"){e.preventDefault();injMoveFocus(-1);}else if(e.key==="Enter"){e.preventDefault();injPickFocused();}else if(e.key==="Escape"){injCloseDd();}});
  injSI.addEventListener("blur",function(){setTimeout(injCloseDd,200);});
  injSC.addEventListener("click",function(){injSI.value="";injQ="";injSC.classList.remove("on");injCloseDd();injRenderCards([]);document.getElementById("inj-rc").style.display="none";injSI.focus();});
  document.addEventListener("click",function(e){var sw=document.getElementById("inj-sw");if(sw&&!sw.contains(e.target))injCloseDd();});
  injRenderCards([]);
}
if(document.readyState==='loading')document.addEventListener("DOMContentLoaded",injInit,{once:true});else injInit();
function injMoveFocus(d){injFI=Math.max(-1,Math.min(injDI.length-1,injFI+d));Array.from(injDD.querySelectorAll(".ddi")).forEach(function(el,i){el.classList.toggle("focused",i===injFI);});var el=injDD.querySelectorAll(".ddi")[injFI];if(el)el.scrollIntoView({block:"nearest"});}
function injPickFocused(){if(injFI>=0&&injDI[injFI])injSelectDrug(injDI[injFI].id);else if(injDI.length)injSelectDrug(injDI[0].id);}
function injCloseDd(){injDD.classList.remove("open");injFI=-1;}
function injRunSearch(){
  var q=injQ.trim(),nq=injNorm(q);
  if(!nq){injCloseDd();if(!q){injRenderCards([]);document.getElementById("inj-rc").style.display="none";}return;}
  var res=DRUGS.filter(function(d){return injNorm(d.tradeName).includes(nq)||injNorm(d.activeIngredient).includes(nq)||injNorm(d.strength).includes(nq)||injNorm(d.manufacturer).includes(nq);});
  injDI=res;
  if(!res.length){injDD.innerHTML="<div class=\"ddempty\">Không tìm thấy thuốc phù hợp</div>";injDD.classList.add("open");injRenderCards([]);document.getElementById("inj-rc").style.display="none";return;}
  injDD.innerHTML=res.slice(0,60).map(function(d){
    var rp=d.routes.map(function(r){return"<span class=\"rp rp-"+r+"\">"+r+"</span>";}).join("");
    return"<div class=\"ddi\" data-id=\""+d.id+"\"><span class=\"ddi-id\">"+d.id+"</span><div class=\"ddi-b\"><div class=\"ddi-trade\">"+hl(d.tradeName,q)+"</div><div class=\"ddi-meta\">"+hl(d.activeIngredient,q)+" <span style=\"color:#94a3b8;font-size:12.5px\">"+injEh(d.strength)+"</span></div></div><div class=\"ddi-r\"><div class=\"ddi-rps\">"+rp+"</div><div class=\"ddi-mfr\">"+injEh((d.manufacturer||"").split(/[-–,]/)[0].trim().slice(0,22))+"</div></div></div>";
  }).join("");
  injDD.classList.add("open");
  injDD.querySelectorAll(".ddi").forEach(function(el){
    el.addEventListener("mousedown",function(e){e.preventDefault();injSelectDrug(+el.dataset.id);});
    el.addEventListener("mouseover",function(){injFI=Array.from(injDD.querySelectorAll(".ddi")).indexOf(el);Array.from(injDD.querySelectorAll(".ddi")).forEach(function(e2,i2){e2.classList.toggle("focused",i2===injFI);});});
  });
  injRenderCards(res);
  var rc=document.getElementById("inj-rc");rc.style.display="inline-block";
  rc.innerHTML="Tìm thấy <strong>"+res.length+"</strong> / "+DRUGS.length+" thuốc";
}
function injSelectDrug(id){
  var d=DRUGS.find(function(x){return x.id===id;});if(!d)return;
  injSI.value=d.tradeName;injQ=d.tradeName;injSC.classList.add("on");injCloseDd();
  injRenderCards([d]);
  var rc=document.getElementById("inj-rc");rc.style.display="inline-block";
  rc.innerHTML="Đang hiển thị: <strong>"+injEh(d.tradeName)+"</strong>";
  setTimeout(function(){var c=document.getElementById("inj-dc-"+id);if(c)c.scrollIntoView({behavior:"smooth",block:"start"});},80);
}

})(); // end IIFE PHA & BẢO QUẢN THUỐC TIÊM

// =====================================================================
// MODULE: HIỆU CHỈNH LIỀU KHÁNG SINH — ABX DOSING (SHC 2026)
// =====================================================================
(function(){
var ABX_DRUGS=[{"id":1,"name":"Acyclovir (IV)","nameNorm":"acyclovir iv","group":"Kháng virus — Kháng sinh ưu tiên quản lý","indications":["Dự phòng HSV (BMT, Huyết học/Ung thư)","Điều trị HSV: Mucocutaneous, CNS/mắt/lan tỏa, Zoster"],"doses":{"normal":"Dự phòng BMT: 250 mg/m² mỗi 12 giờ; Huyết học/Ung thư: 2 mg/kg mỗi 12 giờ; Điều trị Thông thường: 5 mg/kg mỗi 8 giờ; Điều trị Nặng (CNS/Zoster): 10 mg/kg mỗi 8 giờ","crcl_gt50":"Như liều thông thường","crcl_10_50":"CrCl 25–50: BMT 125 mg/m² mỗi 12 giờ; Huyết học/Ung thư 2 mg/kg mỗi 12 giờ; Thông thường 5 mg/kg mỗi 12 giờ; Nặng 10 mg/kg mỗi 12 giờ","crcl_lt10":"CrCl <25: BMT 125 mg/m² mỗi 24 giờ; Huyết học/Ung thư 2 mg/kg mỗi 24 giờ; Thông thường 5 mg/kg mỗi 24 giờ; Nặng 10 mg/kg mỗi 24 giờ","ihd":"BMT: 62.5 mg/m² mỗi 24 giờ; Huyết học/Ung thư: 1 mg/kg mỗi 24 giờ; Thông thường: 2.5 mg/kg mỗi 24 giờ; Nặng: 5 mg/kg mỗi 24 giờ","crrt":"BMT: 125 mg/m² mỗi 12 giờ; Huyết học/Ung thư: 2 mg/kg mỗi 12 giờ; Thông thường: 5–10 mg/kg mỗi 12 giờ; Nặng: 10 mg/kg mỗi 12 giờ"},"notes":"Dùng cân nặng hiệu chỉnh (ABW) khi béo phì. Bù đủ nước để tránh kết tinh thận.","citation":"SHC-ABX 2026 [1–7]"},{"id":2,"name":"Acyclovir (PO)","nameNorm":"acyclovir po uong","group":"Kháng virus","indications":["Dự phòng HSV (BMT, Huyết học/Ung thư)","Điều trị HSV Mucocutaneous, VZV"],"doses":{"normal":"Dự phòng BMT: 800 mg 2 lần/ngày; Huyết học/Ung thư: 400 mg 2 lần/ngày; Điều trị HSV: 400 mg mỗi 8 giờ (hoặc 200 mg 5x/ngày); VZV: 800 mg mỗi 4 giờ (5x/ngày)","crcl_gt50":"Như liều thông thường","crcl_10_50":"CrCl 25–50: Dự phòng BMT 400 mg 2 lần/ngày; Huyết học/Ung thư 400 mg 2 lần/ngày; HSV: 200 mg mỗi 8 giờ; VZV: 800 mg mỗi 8 giờ","crcl_lt10":"CrCl <25→<10: Dự phòng 200 mg mỗi ngày; HSV: 200 mg mỗi 12 giờ; VZV: 800 mg mỗi 12 giờ","ihd":"Dự phòng: 200 mg/ngày; HSV/VZV: Không có dữ liệu","crrt":"Không có dữ liệu"},"notes":"Cân nhắc valacyclovir để giảm tần suất uống (tiền chất có sinh khả dụng cao hơn).","citation":"SHC-ABX 2026 [1,2,7]"},{"id":3,"name":"Amikacin (IV)","nameNorm":"amikacin iv aminoglycoside","group":"Aminoglycoside","indications":["Nhiễm khuẩn gram âm nặng (TDM)"],"doses":{"normal":"Xem Aminoglycoside Dosing Protocol — TDM bắt buộc","crcl_gt50":"Tham khảo Aminoglycoside Protocol","crcl_10_50":"Tham khảo Aminoglycoside Protocol — hiệu chỉnh theo CrCl","crcl_lt10":"Tham khảo Aminoglycoside Protocol — giãn khoảng liều","ihd":"Tham khảo Aminoglycoside Protocol","crrt":"Tham khảo Aminoglycoside Protocol"},"notes":"Dùng ABW khi béo phì. TDM bắt buộc (Cpeak/Ctrough hoặc AUC). Nguy cơ độc tính thận + độc tính tai.","citation":"SHC-ABX 2026 [1,2,5,8,9]"},{"id":4,"name":"Amoxicillin (PO)","nameNorm":"amoxicillin po amoxil","group":"Penicillin","indications":["CAP: 1000 mg mỗi 8 giờ","Dự phòng thủ thuật: 2000 mg x 1"],"doses":{"normal":"500 mg mỗi 8 giờ hoặc 1000 mg q8–12h; CAP: 1000 mg mỗi 8 giờ; Dự phòng thủ thuật: 2000 mg x 1","crcl_gt50":"Như liều thông thường","crcl_10_50":"CrCl 10–29: 1000 mg mỗi 12 giờ; hoặc 875–1000 mg mỗi 12 giờ; hoặc 500 mg mỗi 12 giờ","crcl_lt10":"500 mg mỗi 12 giờ hoặc 500 mg q12–24h","ihd":"500 mg mỗi 12 giờ","crrt":"Không có dữ liệu"},"notes":"Không phủ MRSA hay Pseudomonas.","citation":"SHC-ABX 2026 [1,2]"},{"id":5,"name":"Amoxicillin/Clavulanate (PO)","nameNorm":"amoxicillin clavulanate amoxiclav augmentin co-amoxiclav","group":"Penicillin + ức chế β-lactamase","indications":["CAP: 875 mg mỗi 12 giờ","IAI/GNR nhiễm khuẩn huyết step-down: đến 875 mg mỗi 8 giờ"],"doses":{"normal":"500 mg mỗi 8 giờ hoặc 875 mg mỗi 12 giờ; CAP: 875 mg mỗi 12 giờ; IAI/GNR step-down: đến 875 mg mỗi 8 giờ","crcl_gt50":"Như liều thông thường","crcl_10_50":"CrCl 10–30: 500 mg mỗi 12 giờ (hoặc 875 mg mỗi 12 giờ cho IAI/GNR step-down)","crcl_lt10":"500 mg mỗi 24 giờ (hoặc đến 875 mg mỗi 24 giờ cho IAI/GNR)","ihd":"500 mg mỗi 24 giờ; thêm 1 liều sau HD","crrt":"Không có dữ liệu"},"notes":"Không dùng 875 mg mỗi 8 giờ khi CrCl <30. Xem hướng dẫn liều béo phì.","citation":"SHC-ABX 2026 [1,2,10–12]"},{"id":6,"name":"Amphotericin B Liposomal (IV)","nameNorm":"amphotericin liposomal ambisome l-amb ampho","group":"Kháng nấm — Kháng sinh ưu tiên quản lý","indications":["Nhiễm nấm xâm lấn nặng: Candida, Aspergillus, Cryptococcus"],"doses":{"normal":"3–5 mg/kg/ngày","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Dạng liposomal ít độc thận hơn dạng thường. Tiền xử lý để giảm phản ứng truyền dịch. Xem hướng dẫn béo phì.","citation":"SHC-ABX 2026 [1,2]"},{"id":7,"name":"Ampicillin (IV)","nameNorm":"ampicillin iv ampicin","group":"Penicillin","indications":["Nhiễm khuẩn nhẹ: 1–2 g mỗi 6 giờ","Màng não/Nội mạch/PJI: 2 g mỗi 4 giờ"],"doses":{"normal":"Nhẹ: 1–2 g mỗi 6 giờ; Màng não/nội mạch/PJI: 2 g mỗi 4 giờ","crcl_gt50":"CrCl >130 xem xét 2 g mỗi 4 giờ cho nhẹ; Màng não: 2 g mỗi 4 giờ","crcl_10_50":"CrCl 30–50: Nhẹ 1–2 g mỗi 8 giờ; Màng não 2 g mỗi 6 giờ; CrCl 15–30: Nhẹ 1–2 g mỗi 12 giờ; Màng não 2 g mỗi 8 giờ","crcl_lt10":"CrCl <15: Nhẹ 1–2 g mỗi 24 giờ; Màng não 2 g mỗi 12 giờ","ihd":"Nhẹ: 1–2 g mỗi 24 giờ; Màng não: 2 g mỗi 12 giờ","crrt":"Nhẹ: 2 g q8–12h; Màng não: 2 g q6–8h"},"notes":"Cân nhắc truyền liên tục cho màng não/nội mạch/PJI. Không phủ MRSA.","citation":"SHC-ABX 2026 [1–3]"},{"id":8,"name":"Ampicillin/Sulbactam (IV)","nameNorm":"ampicillin sulbactam unasyn","group":"Penicillin + ức chế β-lactamase","indications":["Nhiễm khuẩn nhẹ-trung bình","Acinetobacter baumannii: 3 g mỗi 4 giờ"],"doses":{"normal":"Nhẹ: 1.5 g mỗi 6 giờ; Hệ thống: 3 g mỗi 6 giờ; A.baumannii: 3 g mỗi 4 giờ","crcl_gt50":"CrCl >30: Như liều thông thường","crcl_10_50":"CrCl 15–30: Nhẹ 1.5 g mỗi 12 giờ; Hệ thống 3 g mỗi 12 giờ; A.baumannii 3 g mỗi 8 giờ","crcl_lt10":"CrCl <15: Nhẹ 1.5 g mỗi 24 giờ; Hệ thống 3 g mỗi 24 giờ; A.baumannii 3 g mỗi 12 giờ","ihd":"Nhẹ: 1.5 g mỗi 24 giờ; Hệ thống: 3 g mỗi 24 giờ; A.baumannii: 3 g mỗi 12 giờ","crrt":"Nhẹ: 3 g mỗi 12 giờ; Hệ thống: 3 g mỗi 8 giờ; A.baumannii: 3 g mỗi 6 giờ"},"notes":"Sulbactam có hoạt tính riêng chống A.baumannii. Liều cao cần thiết cho nhiễm khuẩn nặng.","citation":"SHC-ABX 2026 [1–3,5,13]"},{"id":9,"name":"Azithromycin (IV/PO)","nameNorm":"azithromycin zithromax azithro","group":"Macrolide","indications":["Viêm phổi cộng đồng (CAP)","Nhiễm Atypical organisms"],"doses":{"normal":"500 mg IV/PO mỗi 24 giờ","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Không cần điều chỉnh thận (thải qua gan/mật). Cảnh báo kéo dài QTc.","citation":"SHC-ABX 2026 [1,2]"},{"id":10,"name":"Aztreonam (IV)","nameNorm":"aztreonam azactam","group":"Monobactam","indications":["Nhiễm gram âm (dị ứng penicillin)","Viêm màng não gram âm"],"doses":{"normal":"1–2 g mỗi 8 giờ; Nặng/Màng não: 2 g q6–8h","crcl_gt50":"Như liều thông thường","crcl_10_50":"CrCl <30: 1 g mỗi 8 giờ; Nặng/Màng não: 1 g q6–8h","crcl_lt10":"500 mg mỗi 8 giờ; Nặng/Màng não: 1 g mỗi 12 giờ","ihd":"1 g mỗi 24 giờ; Nặng/Màng não: 1 g mỗi 12 giờ","crrt":"2 g tải + 1 g mỗi 8 giờ HOẶC 2 g mỗi 12 giờ"},"notes":"Dùng ABW khi béo phì. An toàn khi dị ứng penicillin (không cross-react). Không phủ gram dương.","citation":"SHC-ABX 2026 [1–3,14]"},{"id":11,"name":"Caspofungin (IV)","nameNorm":"caspofungin cancidas","group":"Echinocandin — Kháng sinh ưu tiên quản lý","indications":["Candidiasis","Aspergillosis (thay thế)","Nội tâm mạc/nội mạch: 150 mg mỗi 24 giờ"],"doses":{"normal":"70 mg IV x 1, sau đó 50 mg mỗi 24 giờ; Cảm ứng mạnh (phenytoin, rifampin): 70 mg mỗi 24 giờ; Nội tâm mạc/nội mạch: 150 mg mỗi 24 giờ","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Không điều chỉnh Child-Pugh B/C. Xem hướng dẫn liều béo phì.","citation":"SHC-ABX 2026 [1,2,15–17]"},{"id":12,"name":"Cefazolin (IV)","nameNorm":"cefazolin ancef kefzol","group":"Cephalosporin thế hệ 1","indications":["Nhiễm khuẩn da/mô mềm","Xương khớp","Dự phòng phẫu thuật"],"doses":{"normal":"Nhẹ: 1 g mỗi 8 giờ; Trung bình-nặng: 2 g mỗi 8 giờ","crcl_gt50":"CrCl >30: Như liều thông thường","crcl_10_50":"CrCl 10–30: Nhẹ 1 g mỗi 12 giờ; Trung bình-nặng 2 g mỗi 12 giờ","crcl_lt10":"CrCl <10: Nhẹ 1 g mỗi 24 giờ; Trung bình-nặng 2 g mỗi 24 giờ","ihd":"1 g mỗi 24 giờ sau HD; Alt: 2g/2g/3g sau HD 3 lần/tuần","crrt":"2 g mỗi 12 giờ"},"notes":"Xem hướng dẫn liều béo phì. Ưu tiên cho MSSA nhiễm khuẩn huyết trên HD (hơn vancomycin).","citation":"SHC-ABX 2026 [1–5,18–20]"},{"id":13,"name":"Cefepime (IV)","nameNorm":"cefepime maxipime","group":"Cephalosporin thế hệ 4","indications":["Sốt giảm bạch cầu","Viêm phổi bệnh viện","Pseudomonas","Viêm màng não"],"doses":{"normal":"Thông thường: 1 g mỗi 8 giờ hoặc 2 g mỗi 12 giờ; Nặng/Pseudomonas/CNS: 2 g mỗi 8 giờ (TẤT CẢ truyền kéo dài 4 giờ)","crcl_gt50":"CrCl >60: Như liều thông thường","crcl_10_50":"CrCl 30–60: Thường 1 g mỗi 12 giờ/2 g mỗi 24 giờ; Nặng 2 g mỗi 12 giờ; CrCl 11–29: Thường 1 g mỗi 24 giờ; Nặng 1 g mỗi 12 giờ","crcl_lt10":"Thường: 500 mg mỗi 24 giờ; Nặng: 1 g mỗi 24 giờ","ihd":"0.5–1 g mỗi 24 giờ sau HD; Alt: 2 g sau mỗi HD","crrt":"2 g tải + 1 g mỗi 8 giờ (truyền 4 giờ)"},"notes":"Truyền kéo dài 4 giờ tối ưu %T>MIC. Giám sát độc tính thần kinh khi CrCl thấp (đặc biệt người cao tuổi).","citation":"SHC-ABX 2026 [1–3,5,21–23]"},{"id":14,"name":"Cefiderocol (IV)","nameNorm":"cefiderocol fetroja","group":"Cephalosporin-siderophore — Kháng sinh ưu tiên quản lý","indications":["Nhiễm khuẩn kháng đa thuốc (CR-Acinetobacter, CRE, DTR-Pseudomonas)"],"doses":{"normal":"CrCl >120: 2 g mỗi 8 giờ; CrCl 60–120: 2 g mỗi 8 giờ; CrCl 30–60: 1.5 g mỗi 8 giờ","crcl_gt50":"CrCl 60–120: 2 g mỗi 8 giờ","crcl_10_50":"CrCl 30–60: 1.5 g mỗi 8 giờ; CrCl 15–30: 1 g mỗi 8 giờ","crcl_lt10":"CrCl <15: 750 mg mỗi 12 giờ","ihd":"750 mg mỗi 12 giờ","crrt":"≤2L/h: 1.5 g mỗi 12 giờ; 2.1–3L/h: 2 g mỗi 12 giờ; 3.1–4L/h: 1.5 g mỗi 8 giờ; ≥4.1L/h: 2 g mỗi 8 giờ"},"notes":"Liều CRRT hiển thị theo tốc độ dòng dịch thải trong Epic.","citation":"SHC-ABX 2026 [1,2]"},{"id":15,"name":"Cefpodoxime (PO)","nameNorm":"cefpodoxime vantin","group":"Cephalosporin thế hệ 3 (uống)","indications":["UTI không biến chứng: 100 mg mỗi 12 giờ","CAP/viêm phế quản: 200 mg mỗi 12 giờ","Da/mô mềm: 400 mg mỗi 12 giờ"],"doses":{"normal":"UTI: 100 mg mỗi 12 giờ; CAP: 200 mg mỗi 12 giờ; SSTI: 400 mg mỗi 12 giờ","crcl_gt50":"Như liều thông thường","crcl_10_50":"CrCl <30: Cùng liều nhưng mỗi 24 giờ","crcl_lt10":"Cùng liều, dùng sau HD","ihd":"Cùng liều dùng sau HD","crrt":"Không có dữ liệu"},"notes":"Không cần hiệu chỉnh nếu CrCl >30. Dùng sau HD.","citation":"SHC-ABX 2026 [1,2]"},{"id":16,"name":"Ceftaroline (IV)","nameNorm":"ceftaroline teflaro","group":"Cephalosporin thế hệ 5 (MRSA) — Kháng sinh ưu tiên quản lý","indications":["Nhiễm MRSA nặng","Nội tâm mạc/S.aureus nhiễm khuẩn huyết/SDD: 600 mg mỗi 8 giờ truyền 2 giờ"],"doses":{"normal":"Thông thường: 600 mg mỗi 12 giờ; Nội tâm mạc/S.aureus nhiễm khuẩn huyết/SDD: 600 mg mỗi 8 giờ (truyền 2 giờ)","crcl_gt50":"CrCl >50: Như liều thông thường","crcl_10_50":"CrCl 30–50: 400 mg mỗi 12 giờ (thường) / 400 mg mỗi 8 giờ (nội tâm mạc, truyền 2h); CrCl 15–30: 300 mg mỗi 12 giờ / 300 mg mỗi 8 giờ","crcl_lt10":"CrCl <15: 200 mg mỗi 12 giờ / 200 mg mỗi 8 giờ","ihd":"200 mg q8–12h (truyền 2h cho nội tâm mạc)","crrt":"Không có dữ liệu"},"notes":"Hoạt tính chống MRSA. Nội tâm mạc dùng mỗi 8 giờ truyền 2 giờ.","citation":"SHC-ABX 2026 [1,2,24]"},{"id":17,"name":"Ceftazidime (IV)","nameNorm":"ceftazidime fortaz tazicef ceftazidim","group":"Cephalosporin thế hệ 3 (Pseudomonas)","indications":["Nhiễm Pseudomonas aeruginosa","Gram âm nặng"],"doses":{"normal":"1–2 g mỗi 8 giờ; Nặng: 2 g mỗi 8 giờ","crcl_gt50":"Như liều thông thường","crcl_10_50":"CrCl 30–50: 1–2 g mỗi 12 giờ; CrCl 16–30: 1–2 g mỗi 24 giờ; CrCl 6–15: 0.5–1 g mỗi 24 giờ","crcl_lt10":"CrCl <5: 0.5 g mỗi 24 giờ","ihd":"0.5–1 g mỗi 24 giờ sau HD; Alt: 1–2 g q48–72h hoặc 1 g sau HD 3 lần/tuần","crrt":"2 g tải + 1 g mỗi 8 giờ HOẶC 2 g mỗi 12 giờ"},"notes":"Không dùng đơn độc khi nghi ESBL.","citation":"SHC-ABX 2026 [1–3,25]"},{"id":18,"name":"Ceftazidime/Avibactam (IV)","nameNorm":"ceftazidime avibactam avycaz","group":"Cephalosporin + beta-lactamase inhibitor mới — Kháng sinh ưu tiên quản lý","indications":["CRE, CRPA có KPC/OXA-48/AmpC"],"doses":{"normal":"2.5 g mỗi 8 giờ","crcl_gt50":"CrCl >50: 2.5 g mỗi 8 giờ","crcl_10_50":"CrCl 31–50: 1.25 g mỗi 8 giờ; CrCl 16–30: 0.94 g mỗi 12 giờ","crcl_lt10":"CrCl 6–15: 0.94 g mỗi 24 giờ; CrCl <5: 0.94 g mỗi 48 giờ","ihd":"0.94 g q24–48h sau HD","crrt":"1.25 g mỗi 8 giờ; 2.5 g mỗi 8 giờ nếu MIC >4 mcg/mL hoặc nhiễm sâu"},"notes":"Ức chế KPC, OXA-48, AmpC.","citation":"SHC-ABX 2026 [1,2,26–29]"},{"id":19,"name":"Ceftolozane/Tazobactam (IV)","nameNorm":"ceftolozane tazobactam zerbaxa","group":"Cephalosporin mới + beta-lactamase inhibitor — Kháng sinh ưu tiên quản lý","indications":["HAP/VAP, UTI","Pseudomonas kháng đa thuốc (DTR-P.a.)"],"doses":{"normal":"UTI: 1.5 g mỗi 8 giờ; HAP/VAP/Pseudomonas/CF: 3 g mỗi 8 giờ","crcl_gt50":"CrCl >50: Như liều thông thường","crcl_10_50":"CrCl 30–50: UTI 750 mg mỗi 8 giờ; HAP 1.5 g mỗi 8 giờ; CrCl 15–29: UTI 375 mg mỗi 8 giờ; HAP 750 mg mỗi 8 giờ","crcl_lt10":"UTI: 750 mg tải + 150 mg mỗi 8 giờ; HAP: 2.25 g tải + 450 mg mỗi 8 giờ","ihd":"UTI: 750 mg tải + 150 mg mỗi 8 giờ; HAP: 2.25 g tải + 450 mg mỗi 8 giờ","crrt":"UTI: 750 mg mỗi 8 giờ; HAP: 1.5 g mỗi 8 giờ (Alt: 3 g tải + 750 mg mỗi 8 giờ)"},"notes":"Không có hoạt tính MRSA. Hội chẩn Bác sĩ/vi sinh.","citation":"SHC-ABX 2026 [1,2,30–35]"},{"id":20,"name":"Ceftriaxone (IV)","nameNorm":"ceftriaxone rocephin","group":"Cephalosporin thế hệ 3","indications":["Nhiễm khuẩn thông thường: 1–2 g mỗi 24 giờ","Nội mạch/xương/PJI: 2 g mỗi 24 giờ","Màng não / E.faecalis nội tâm mạc: 2 g mỗi 12 giờ"],"doses":{"normal":"1–2 g mỗi 24 giờ; Nội mạch/xương/PJI: 2 g mỗi 24 giờ; Màng não / E.faecalis NTM: 2 g mỗi 12 giờ","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Không cần điều chỉnh thận — thải qua mật. Cẩn thận dùng cùng calci IV (tủa).","citation":"SHC-ABX 2026 [1,2,36]"},{"id":21,"name":"Cephalexin (PO)","nameNorm":"cephalexin keflex cefalexin","group":"Cephalosporin thế hệ 1 (uống)","indications":["SSTI/Viêm mô tế bào: 500 mg mỗi 6 giờ","UTI không biến chứng: 500 mg mỗi 12 giờ","UTI biến chứng: 1 g 3 lần/ngày"],"doses":{"normal":"250–1000 mg mỗi 6 giờ; UTI không biến chứng: 500 mg mỗi 12 giờ; UTI biến chứng: 1 g 3 lần/ngày; SSTI: 500 mg mỗi 6 giờ","crcl_gt50":"Như liều thông thường","crcl_10_50":"CrCl 15–29: 250 mg q8–12h; CrCl 5–14: 250 mg mỗi 24 giờ","crcl_lt10":"250 mg mỗi 24 giờ sau HD","ihd":"500 mg mỗi 24 giờ sau HD","crrt":"Không có dữ liệu"},"notes":"Không phủ MRSA. Dùng sau HD (liều nhật).","citation":"SHC-ABX 2026 [1,2,37]"},{"id":22,"name":"Ciprofloxacin (IV/PO)","nameNorm":"ciprofloxacin cipro","group":"Fluoroquinolone","indications":["Nhiễm gram âm thông thường: 400 mg IV mỗi 12 giờ / 500 mg PO mỗi 12 giờ","Pseudomonas/nặng: 400 mg IV mỗi 8 giờ / 750 mg PO mỗi 12 giờ"],"doses":{"normal":"Thông thường: 400 mg IV mỗi 12 giờ / 500 mg PO mỗi 12 giờ; Pseudomonas/nặng: 400 mg IV mỗi 8 giờ / 750 mg PO mỗi 12 giờ","crcl_gt50":"CrCl >50: Như liều thông thường","crcl_10_50":"CrCl 30–50: Như liều thông thường","crcl_lt10":"CrCl <30: Thường 400 mg IV mỗi 24 giờ / 500 mg PO mỗi 24 giờ; Pseudomonas: 400 mg IV mỗi 24 giờ / 500 mg PO mỗi 24 giờ","ihd":"200–400 mg IV mỗi 24 giờ / 250–500 mg PO mỗi 24 giờ sau HD","crrt":"400 mg IV mỗi 12 giờ / 500 mg PO mỗi 12 giờ; A.baumannii/P.a. nặng: 400 mg IV q8–12h"},"notes":"Xem hướng dẫn liều béo phì. Cảnh báo QTc, bệnh lý gân, thần kinh ngoại vi. Hấp thu PO ~100%.","citation":"SHC-ABX 2026 [1–4,28,38]"},{"id":23,"name":"Clindamycin (IV/PO)","nameNorm":"clindamycin cleocin dalacin","group":"Lincosamide","indications":["Nhiễm khuẩn da/mô mềm","Kỵ khí, aspiration"],"doses":{"normal":"600–900 mg IV mỗi 8 giờ; 150–450 mg PO mỗi 6 giờ","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Không cần điều chỉnh thận. Cẩn thận nguy cơ CDAD. Xem hướng dẫn béo phì.","citation":"SHC-ABX 2026 [1,2]"},{"id":24,"name":"Dalbavancin (IV)","nameNorm":"dalbavancin dalvance","group":"Lipoglycopeptide — Kháng sinh ưu tiên quản lý","indications":["ABSSSI"],"doses":{"normal":"Ưu tiên: 1500 mg IV x 1; Thay thế: 1000 mg IV x 1 + 500 mg 1 tuần sau","crcl_gt50":"CrCl >30: 1500 mg x 1","crcl_10_50":"CrCl >30: Như liều thông thường","crcl_lt10":"CrCl <30: 1125 mg x 1; Thay thế 750 mg + 375 mg (1 tuần sau)","ihd":"1500 mg x 1 (như CrCl >30)","crrt":"Không có dữ liệu"},"notes":"T½ ~14 ngày. Hội chẩn Bác sĩ cho off-label.","citation":"SHC-ABX 2026 [1,39]"},{"id":25,"name":"Daptomycin (IV)","nameNorm":"daptomycin cubicin dapto","group":"Lipopeptide — Kháng sinh ưu tiên quản lý","indications":["Da/mô mềm: 4–6 mg/kg","Bacteremia/nội mạch: 8 mg/kg","E.faecium (hội chẩn Bác sĩ): 10–12 mg/kg"],"doses":{"normal":"Da/mô mềm: 4–6 mg/kg mỗi 24 giờ; Bacteremia/nội mạch: 8 mg/kg mỗi 24 giờ; E.faecium: 10–12 mg/kg mỗi 24 giờ","crcl_gt50":"CrCl >30: Như liều thông thường","crcl_10_50":"CrCl >30: Không thay đổi","crcl_lt10":"CrCl <30: Da 4–6 mg/kg mỗi 48 giờ; Bacteremia 8 mg/kg mỗi 48 giờ; E.faecium 10–12 mg/kg mỗi 48 giờ","ihd":"Da: 6 mg/kg sau HD (hoặc 6/6/9 mg/kg sau HD 3 lần/tuần); Bacteremia: 8 mg/kg sau HD","crrt":"Da: 6 mg/kg mỗi 24 giờ; Bacteremia: 6–8 mg/kg mỗi 24 giờ; E.faecium: 8 mg/kg mỗi 24 giờ"},"notes":"ABW khi béo phì. >8 mg/kg tăng nguy cơ CPK/bệnh cơ — theo dõi CPK có giá trị nền. Không dùng viêm phổi.","citation":"SHC-ABX 2026 [1,2,23,40–47]"},{"id":26,"name":"Doxycycline (IV/PO)","nameNorm":"doxycycline vibramycin","group":"Tetracycline","indications":["Atypical organisms","MRSA cộng đồng","Lyme, Rickettsia, Brucella"],"doses":{"normal":"100 mg IV/PO mỗi 12 giờ; Tải (nặng): 200 mg x 1","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Không cần điều chỉnh thận. Tránh Ca/Mg/Al (giảm hấp thu PO). Hấp thu PO ~93%.","citation":"SHC-ABX 2026 [1,2]"},{"id":27,"name":"Ertapenem (IV/IM)","nameNorm":"ertapenem invanz","group":"Carbapenem — Kháng sinh ưu tiên quản lý","indications":["Nhiễm khuẩn ESBL","Nhiễm ổ bụng/phụ khoa"],"doses":{"normal":"1 g IV mỗi 24 giờ","crcl_gt50":"Không thay đổi (CrCl >30)","crcl_10_50":"CrCl <30: 500 mg mỗi 24 giờ","crcl_lt10":"500 mg mỗi 24 giờ","ihd":"500 mg mỗi 24 giờ sau HD (hoặc 500–1000 mg sau HD tùy flux)","crrt":"1 g mỗi 24 giờ"},"notes":"Không phủ Pseudomonas. Dùng được IM. Không điều chỉnh khi CrCl >30.","citation":"SHC-ABX 2026 [1,2,48–50]"},{"id":28,"name":"Ethambutol (PO)","nameNorm":"ethambutol myambutol emb","group":"Kháng lao","indications":["Điều trị lao (phác đồ 4 thuốc)"],"doses":{"normal":"Theo cân nặng gầy (Lean BW): 40–55 kg: 800 mg/ngày; 56–75 kg: 1200 mg/ngày; 76–90 kg: 1600 mg/ngày (tối đa 15–25 mg/kg/ngày)","crcl_gt50":"15–25 mg/kg/ngày","crcl_10_50":"CrCl <30: 15–25 mg/kg 3 lần/tuần","crcl_lt10":"15–25 mg/kg 3 lần/tuần","ihd":"15–25 mg/kg 3 lần/tuần sau HD","crrt":"15–25 mg/kg 3 lần/tuần"},"notes":"Dùng cân nặng gầy (Lean BW) khi béo phì. Theo dõi thị lực và phân biệt màu sắc (độc tính mắt liên quan liều).","citation":"SHC-ABX 2026 [1,5,51–54]"},{"id":29,"name":"Fidaxomicin (PO)","nameNorm":"fidaxomicin dificid","group":"Kháng khuẩn đặc hiệu C.difficile","indications":["Nhiễm Clostridioides difficile (CDI)"],"doses":{"normal":"200 mg mỗi 12 giờ x 10 ngày","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Hấp thu PO tối thiểu — nồng độ cao trong đại tràng. Nguy cơ tái phát CDI thấp hơn vancomycin PO.","citation":"SHC-ABX 2026 [1,2]"},{"id":30,"name":"Fluconazole (IV/PO)","nameNorm":"fluconazole diflucan fluconazol","group":"Kháng nấm Triazole","indications":["Candidiasis miệng/phúc mạc","Candidemia/CNS nặng: Tải 800 mg","C.glabrata SDD: 800 mg mỗi 24 giờ"],"doses":{"normal":"Miệng hầu/phúc mạc: Tải 200 mg + 100–200 mg mỗi 24 giờ; Thực quản/xương: 400 mg mỗi 24 giờ; Candidemia/nặng: Tải 800 mg + 400–800 mg mỗi 24 giờ; C.glabrata SDD: 800 mg mỗi 24 giờ","crcl_gt50":"CrCl >50: Như liều thông thường","crcl_10_50":"CrCl ≤50: Giảm liều duy trì (giữ nguyên liều tải); Miệng hầu: 100 mg mỗi 24 giờ; Thực quản: 200 mg mỗi 24 giờ; Candidemia/nặng: 400 mg mỗi 24 giờ","crcl_lt10":"Như CrCl ≤50","ihd":"Miệng hầu: Tải 200 mg + 200 mg mỗi 48 giờ (sau HD); Thực quản: Tải 400 mg + 400 mg sau HD hoặc 200 mg mỗi 24 giờ; Candidemia/nặng: Tải 800 mg + 400–800 mg sau HD","crrt":"Tải gấp đôi; Miệng hầu: Tải 400 mg + 100–200 mg mỗi 24 giờ; Thực quản: Tải 800 mg + 400 mg mỗi 24 giờ; Nặng: Tải 800–1200 mg + 400–800 mg mỗi 24 giờ"},"notes":"Xem hướng dẫn béo phì. SDD = susceptible-dose dependent (C.glabrata luôn SDD/kháng). Kiểm tra QTc. Hội chẩn Bác sĩ cho cryptococcus/coccidioides.","citation":"SHC-ABX 2026 [1–4,17,28,55–57]"},{"id":31,"name":"Foscarnet (IV)","nameNorm":"foscarnet foscavir","group":"Kháng virus (non-nucleoside)","indications":["CMV induction/maintenance","HSV kháng acyclovir"],"doses":{"normal":"CMV Khởi đầu (AdjCrCl >1.4 mL/min/kg): 60 mg/kg mỗi 8 giờ hoặc 90 mg/kg mỗi 12 giờ; Duy trì: 90–120 mg/kg mỗi 24 giờ; HSV: 40 mg/kg q8–12h","crcl_gt50":"Tham khảo bảng AdjCrCl (mL/min/kg) — liều theo từng dải","crcl_10_50":"Giảm liều theo AdjCrCl — xem bảng SHC 2026 chi tiết","crcl_lt10":"AdjCrCl <0.4 mL/min/kg: Không khuyến cáo","ihd":"CMV: 45–60 mg/kg/liều sau HD","crrt":"Không có dữ liệu"},"notes":"ABW khi béo phì. AdjCrCl = CrCl (mL/min) / cân nặng (kg). Bù đủ nước. Nguy cơ mất cân bằng điện giải.","citation":"SHC-ABX 2026 [1,2,58–60]"},{"id":32,"name":"Ganciclovir (IV)","nameNorm":"ganciclovir cytovene","group":"Kháng virus — Kháng sinh ưu tiên quản lý","indications":["CMV Khởi đầu: 5 mg/kg mỗi 12 giờ","CMV Duy trì: 5 mg/kg mỗi 24 giờ"],"doses":{"normal":"CMV Khởi đầu (CrCl >70): 5 mg/kg mỗi 12 giờ; Duy trì: 5 mg/kg mỗi 24 giờ","crcl_gt50":"CrCl >50: Khởi đầu 2.5 mg/kg mỗi 12 giờ; Duy trì 2.5 mg/kg mỗi 24 giờ; CrCl >25: 2.5 mg/kg mỗi 24 giờ (Ind/Duy trì)","crcl_10_50":"CrCl >10: Khởi đầu 1.25 mg/kg mỗi 24 giờ; Duy trì 0.625 mg/kg mỗi 24 giờ","crcl_lt10":"CrCl <10: Khởi đầu 1.25 mg/kg 3x/tuần; Duy trì 0.625 mg/kg 3x/tuần","ihd":"Khởi đầu: 1.25 mg/kg 3x/tuần sau HD; Duy trì: 0.625 mg/kg 3x/tuần sau HD","crrt":"Khởi đầu: 2.5 mg/kg mỗi 12 giờ; Duy trì: 2.5 mg/kg mỗi 24 giờ"},"notes":"ABW khi béo phì. Theo dõi ANC (độc tính tủy xương). Tham khảo phác đồ BMT nếu áp dụng.","citation":"SHC-ABX 2026 [1,2]"},{"id":33,"name":"Gentamicin (IV)","nameNorm":"gentamicin garamycin gentamycin aminoglycoside","group":"Aminoglycoside","indications":["Nhiễm gram âm (TDM)","Phối hợp beta-lactam (cộng lực)"],"doses":{"normal":"Xem Hướng dẫn liều Aminoglycoside và Phụ lục","crcl_gt50":"Tham khảo Protocol","crcl_10_50":"Tham khảo Protocol","crcl_lt10":"Tham khảo Protocol","ihd":"Tham khảo Protocol","crrt":"Tham khảo Protocol"},"notes":"ABW khi béo phì. TDM bắt buộc. Độc tính thận + độc tính tai.","citation":"SHC-ABX 2026 [1,3,61]"},{"id":34,"name":"Imipenem/Cilastatin (IV)","nameNorm":"imipenem cilastatin primaxin tienam","group":"Carbapenem — Kháng sinh ưu tiên quản lý","indications":["Nhiễm khuẩn nặng gram âm","NTM: 1000 mg mỗi 12 giờ"],"doses":{"normal":"Thông thường: 500 mg mỗi 6 giờ hoặc 1 g mỗi 8 giờ; NTM: 1000 mg mỗi 12 giờ","crcl_gt50":"CrCl >60: Như liều thông thường","crcl_10_50":"CrCl 30–59: 500 mg mỗi 8 giờ; CrCl 15–29: 500 mg mỗi 12 giờ; NTM CrCl 30–59: 750 mg mỗi 12 giờ; CrCl 15–29: 500 mg mỗi 12 giờ","crcl_lt10":"CrCl <10: Không khuyến cáo trừ khi đã lọc máu trong 48h","ihd":"250–500 mg mỗi 12 giờ","crrt":"1 g tải + 500 mg mỗi 6 giờ"},"notes":"Nguy cơ co giật (đặc biệt suy thận + liều cao). Không dùng CrCl <10 nếu không lọc máu.","citation":"SHC-ABX 2026 [1]"},{"id":35,"name":"Isavuconazole (IV/PO)","nameNorm":"isavuconazole cresemba isavuconazonium","group":"Kháng nấm Triazole thế hệ mới — Kháng sinh ưu tiên quản lý","indications":["Aspergillosis xâm lấn","Mucormycosis"],"doses":{"normal":"Tải: 372 mg IV/PO mỗi 8 giờ x 6 liều (2 ngày); Duy trì: 372 mg IV/PO mỗi 24 giờ","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Không điều chỉnh thận/gan nhẹ-trung bình. Rút ngắn QTc (khác các azole khác kéo dài). Ít tương tác hơn voriconazole.","citation":"SHC-ABX 2026 [1,2]"},{"id":36,"name":"Isoniazid (PO)","nameNorm":"isoniazid inh","group":"Kháng lao","indications":["Điều trị lao","Dự phòng lao tiềm ẩn"],"doses":{"normal":"300 mg PO mỗi 24 giờ (5 mg/kg/ngày)","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Bổ sung pyridoxin (B6) 25–50 mg/ngày để phòng viêm thần kinh ngoại biên. Theo dõi men gan.","citation":"SHC-ABX 2026 [1,2,51,52]"},{"id":37,"name":"Levofloxacin (IV/PO)","nameNorm":"levofloxacin levaquin tavanic levoflo","group":"Fluoroquinolone","indications":["UTI: 250 mg mỗi 24 giờ","DFI/Prostatitis nhẹ-trung bình: 500 mg mỗi 24 giờ","Nặng/Pneumonia/Pseudomonas/Stenotrophomonas: 750 mg mỗi 24 giờ"],"doses":{"normal":"UTI: 250 mg mỗi 24 giờ; DFI/Prostatitis: 500 mg mỗi 24 giờ; Nặng/PNA/Pseudomonas: 750 mg mỗi 24 giờ","crcl_gt50":"CrCl ≥50: Như liều thông thường","crcl_10_50":"CrCl 20–49: UTI không đổi; DFI 500 mg tải + 250 mg mỗi 24 giờ; Nặng 750 mg mỗi 48 giờ","crcl_lt10":"CrCl <20: UTI không đổi; DFI 500 mg tải + 250 mg mỗi 48 giờ; Nặng 750 mg tải + 500 mg mỗi 48 giờ","ihd":"Như CrCl <20; dùng sau HD; mỗi 48 giờ","crrt":"UTI không đổi; DFI: 500 mg tải + 250 mg mỗi 24 giờ hoặc 500 mg mỗi 48 giờ; Nặng: 750 mg tải + 500 mg mỗi 48 giờ hoặc 750 mg mỗi 48 giờ"},"notes":"Hấp thu PO ≈100%. Cảnh báo QTc, bệnh lý gân. Không dùng đơn độc cho Pseudomonas nặng.","citation":"SHC-ABX 2026 [1–4]"},{"id":38,"name":"Linezolid (IV/PO)","nameNorm":"linezolid zyvox","group":"Oxazolidinone — Kháng sinh ưu tiên quản lý","indications":["MRSA, VRE","HAP/VAP"],"doses":{"normal":"600 mg IV/PO mỗi 12 giờ","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Ức chế MAO — tương tác với thuốc nhóm serotonergic/adrenergic. Theo dõi CBC (giảm tiểu cầu). Hấp thu PO ~100%.","citation":"SHC-ABX 2026 [1,2]"},{"id":39,"name":"Meropenem (IV)","nameNorm":"meropenem merrem","group":"Carbapenem — Kháng sinh ưu tiên quản lý","indications":["Nhiễm khuẩn nặng (FN, VAP, Pseudomonas)","CF/CNS: 2 g mỗi 8 giờ"],"doses":{"normal":"Thông thường (FN/PNA/Pseudomonas): 1 g mỗi 8 giờ; CF/CNS: 2 g mỗi 8 giờ (truyền kéo dài 3 giờ)","crcl_gt50":"CrCl >50: Như liều thông thường","crcl_10_50":"CrCl 26–50: 1 g mỗi 12 giờ (thường)/2 g mỗi 12 giờ (CF); CrCl 10–25: 0.5 g mỗi 12 giờ (thường)/1 g mỗi 12 giờ (CF)","crcl_lt10":"0.5 g mỗi 24 giờ; CF/CNS: 1 g mỗi 24 giờ","ihd":"500 mg mỗi 24 giờ sau HD; CF/CNS: 1 g mỗi 24 giờ","crrt":"1 g mỗi 8 giờ; CF/CNS: 2 g mỗi 12 giờ"},"notes":"Xem hướng dẫn béo phì. *2 g mỗi 8 giờ truyền kéo dài khi: MIC=2, CrCl≥130, béo phì, nhiễm kháng. Truyền 3 giờ tối ưu %T>MIC.","citation":"SHC-ABX 2026 [1–4,62]"},{"id":40,"name":"Metronidazole (IV/PO)","nameNorm":"metronidazole flagyl metronidazol","group":"Nitroimidazole","indications":["Nhiễm C.difficile","Kỵ khí/ổ bụng","CNS/SSTI/hoại tử: 500 mg mỗi 8 giờ"],"doses":{"normal":"CNS/CDAD/SSTI/hoại tử: 500 mg IV/PO mỗi 8 giờ; Ổ bụng: 500 mg q8–12h","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Thận trọng tích lũy nếu CrCl <30 và dùng >1–2 tuần","ihd":"Thận trọng — xem xét giảm liều khi dùng dài ngày","crrt":"Thận trọng"},"notes":"Gan nặng: 500 mg mỗi 12 giờ. Cẩn thận tích lũy chất chuyển hóa khi CrCl <30 và dùng kéo dài.","citation":"SHC-ABX 2026 [1,2]"},{"id":41,"name":"Moxifloxacin (IV/PO)","nameNorm":"moxifloxacin avelox","group":"Fluoroquinolone","indications":["Viêm phổi cộng đồng (CAP)","Nhiễm khuẩn ổ bụng (phối hợp)"],"doses":{"normal":"400 mg IV/PO mỗi 24 giờ","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Không cần điều chỉnh thận (gan/mật). Cảnh báo QTc. Không phủ Pseudomonas.","citation":"SHC-ABX 2026 [1,2]"},{"id":42,"name":"Nafcillin (IV)","nameNorm":"nafcillin nallpen","group":"Penicillin chống Staphylococcus","indications":["MSSA — Staphylococcus aureus nhạy methicillin","Nội tâm mạc MSSA, xương khớp"],"doses":{"normal":"2 g IV mỗi 4 giờ","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi (thải qua gan)","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Thải qua gan — không cần điều chỉnh thận. Điều chỉnh khi suy gan nặng + suy thận đồng thời.","citation":"SHC-ABX 2026 [1,2]"},{"id":43,"name":"Oseltamivir (PO)","nameNorm":"oseltamivir tamiflu","group":"Kháng virus Neuraminidase inhibitor","indications":["Điều trị cúm: 75 mg mỗi 12 giờ x 5 ngày","Dự phòng cúm: 75 mg mỗi 24 giờ"],"doses":{"normal":"Điều trị: 75 mg mỗi 12 giờ; Dự phòng: 75 mg mỗi 24 giờ","crcl_gt50":"CrCl ≥60: Như liều thông thường","crcl_10_50":"CrCl 30–60: Điều trị 75 mg tải + 30 mg mỗi 12 giờ; Dự phòng 30 mg mỗi 24 giờ; CrCl 10–30: Điều trị 30 mg mỗi 24 giờ; Dự phòng 30 mg mỗi 48 giờ","crcl_lt10":"CrCl ≤10: Điều trị 30 mg cách ngày; Dự phòng 30 mg 1 lần/tuần","ihd":"Dự phòng: 30 mg + 30 mg sau mỗi 2 HD; Điều trị: 30 mg + 30 mg sau mỗi HD","crrt":"Điều trị: 75 mg mỗi 12 giờ; Dự phòng: 75 mg mỗi 24 giờ"},"notes":"Bắt đầu trong 48h khởi phát. Cân nhắc liều cao/kéo dài cho ca nặng/miễn dịch suy giảm.","citation":"SHC-ABX 2026 [1,2,63]"},{"id":44,"name":"Penicillin G (IV)","nameNorm":"penicillin g benzylpenicillin pen g","group":"Penicillin","indications":["Nhiễm Streptococcus","Giang mai thần kinh","Listeria"],"doses":{"normal":"2–4 triệu đơn vị mỗi 4 giờ hoặc 12–24 MU/ngày truyền liên tục","crcl_gt50":"2–3 MU mỗi 4 giờ","crcl_10_50":"1–2 MU mỗi 6 giờ","crcl_lt10":"Nhẹ: 0.5–1 MU q4–6h hoặc 1–2 MU q8–12h; Nặng: 2 MU q4–6h hoặc 4 MU q8–12h","ihd":"Nhẹ: 0.5–1 MU q4–6h; Nặng: 2 MU q4–6h","crrt":"4 MU q4–6h"},"notes":"Nguy cơ co giật khi liều cao + suy thận.","citation":"SHC-ABX 2026 [1–3,5]"},{"id":45,"name":"Piperacillin/Tazobactam (IV)","nameNorm":"piperacillin tazobactam pip tazo zosyn tazocin piptazo","group":"Penicillin phổ rộng + beta-lactamase inhibitor","indications":["Nhiễm gram âm nặng, Pseudomonas","Viêm phổi bệnh viện, nhiễm ổ bụng"],"doses":{"normal":"Truyền kéo dài (4h) CrCl>20: 3.375–4.5 g mỗi 8 giờ; SDD: 4.5 g mỗi 8 giờ; Truyền ngắn (30ph): Thường 3.375 g mỗi 6 giờ; Nặng/Sepsis 4.5 g mỗi 6 giờ","crcl_gt50":"CrCl >40: Như liều thông thường truyền kéo dài","crcl_10_50":"CrCl 20–40: Kéo dài: 3.375 g mỗi 12 giờ; Ngắn: Thường 2.25 g mỗi 6 giờ; Nặng 3.375 g mỗi 6 giờ","crcl_lt10":"CrCl <20: Thường 2.25 g mỗi 8 giờ; Nặng 2.25 g mỗi 6 giờ","ihd":"Thường: 2.25 g mỗi 12 giờ; Nặng: 3.375 g mỗi 12 giờ (4h) hoặc 2.25 g mỗi 8 giờ","crrt":"3.375 g mỗi 6 giờ (30ph) hoặc 3.375–4.5 g mỗi 8 giờ (4h)"},"notes":"*Liều cao hơn: sepsis, nhiễm sâu, MIC=16, BMI>40, CrCl>120, CF. Truyền kéo dài tối ưu %T>MIC.","citation":"SHC-ABX 2026 [1–4,64,65]"},{"id":46,"name":"Polymyxin B (IV)","nameNorm":"polymyxin b polymixin","group":"Polymyxin — Kháng sinh ưu tiên quản lý","indications":["MDR A.baumannii, Pseudomonas"],"doses":{"normal":"Tải: 20,000–25,000 units/kg x 1; Duy trì: 12,500–15,000 units/kg mỗi 12 giờ","crcl_gt50":"Không thay đổi (không phụ thuộc CrCl như colistin)","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không có dữ liệu cụ thể","crrt":"Không thay đổi"},"notes":"ABW khi béo phì. Độc thận. 10,000 units = 1 mg. Hội chẩn Bác sĩ bắt buộc. Khác colistin (CMS).","citation":"SHC-ABX 2026 [1,2,66,67]"},{"id":47,"name":"Posaconazole (IV/PO)","nameNorm":"posaconazole noxafil","group":"Kháng nấm Triazole — Kháng sinh ưu tiên quản lý","indications":["Dự phòng nấm xâm lấn","Aspergillosis, Mucormycosis"],"doses":{"normal":"Tải: 300 mg mỗi 12 giờ x 2 liều; Duy trì: 300 mg mỗi 24 giờ (cả IV và PO)","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Viên và huyền dịch KHÔNG thay thế nhau. Tham khảo Hướng dẫn TDM kháng nấm.","citation":"SHC-ABX 2026 [1,2]"},{"id":48,"name":"Pyrazinamide (PO)","nameNorm":"pyrazinamide pza","group":"Kháng lao","indications":["Điều trị lao (2 tháng đầu trong phác đồ)"],"doses":{"normal":"25 mg/kg/ngày theo cân nặng gầy (Lean BW): 40–55 kg: 1000 mg; 56–75 kg: 1500 mg; 76–90 kg: 2000 mg","crcl_gt50":"25 mg/kg/ngày","crcl_10_50":"CrCl <30: 25 mg/kg 3 lần/tuần","crcl_lt10":"25 mg/kg 3 lần/tuần","ihd":"25 mg/kg 3 lần/tuần sau HD","crrt":"Không có dữ liệu"},"notes":"cân nặng gầy (Lean BW) khi béo phì. Theo dõi men gan và acid uric. Gây tăng uric acid.","citation":"SHC-ABX 2026 [1,2,51,52]"},{"id":49,"name":"Rifampin (IV/PO)","nameNorm":"rifampin rifampicin rifadin","group":"Rifamycin","indications":["Lao: 600 mg mỗi 24 giờ","Nội tâm mạc: 300 mg mỗi 8 giờ","PJI: 300–450 mg mỗi 12 giờ"],"doses":{"normal":"Lao: 600 mg mỗi 24 giờ (≤45 kg: 10 mg/kg); Nội tâm mạc: 300 mg mỗi 8 giờ; PJI: 300–450 mg mỗi 12 giờ; Xương cột sống: 600 mg mỗi 24 giờ","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Cảm ứng CYP mạnh — nhiều tương tác thuốc quan trọng. Không dùng đơn độc (kháng thuốc). Nhuộm màu cam/đỏ dịch cơ thể.","citation":"SHC-ABX 2026 [1,2,51,52,68–70]"},{"id":50,"name":"Tedizolid (IV/PO)","nameNorm":"tedizolid sivextro","group":"Oxazolidinone thế hệ mới — Kháng sinh ưu tiên quản lý","indications":["ABSSSI do MRSA"],"doses":{"normal":"200 mg IV/PO mỗi 24 giờ x 6 ngày","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Ít ức chế MAO hơn linezolid. Chỉ 6 ngày điều trị.","citation":"SHC-ABX 2026 [1,2,71]"},{"id":51,"name":"TMP/SMX (IV/PO)","nameNorm":"trimethoprim sulfamethoxazole tmp smx cotrimoxazole bactrim biseptol","group":"Sulfonamide + DHFR inhibitor","indications":["UTI: 1 DS mỗi 12 giờ","SSTI: 1–2 DS mỗi 12 giờ","PJP: ~2 DS 3 lần/ngày","Stenotrophomonas: 10–15 mg/kg TMP q8–12h"],"doses":{"normal":"UTI: 1 DS mỗi 12 giờ; SSTI: 1–2 DS mỗi 12 giờ; S.aureus xương/GNR: 2 DS mỗi 12 giờ (8–10 mg/kg TMP); Stenotrophomonas: 10–15 mg/kg TMP q8–12h; PJP: ~2 DS 3 lần/ngày","crcl_gt50":"Như liều thông thường","crcl_10_50":"CrCl 15–30: Giảm 50% liều","crcl_lt10":"CrCl <15: Không khuyến cáo; PJP khẩn: 5–7.5 mg/kg TMP mỗi 24 giờ","ihd":"25–50% liều (2.5–5 mg/kg TMP mỗi 24 giờ) sau HD; PJP/Stenotrophomonas: 5–7.5 mg/kg TMP mỗi 24 giờ","crrt":"5–10 mg/kg TMP/ngày chia mỗi 12 giờ; Stenotrophomonas: 10–15 mg/kg TMP q8–12h; PJP: ~2 DS 3 lần/ngày"},"notes":"ABW khi béo phì. SS=80 mg TMP; DS=160 mg TMP. Tăng creatinine huyết thanh ức chế bài tiết ống thận (không phải suy thận thực).","citation":"SHC-ABX 2026 [1,2,4,72]"},{"id":52,"name":"Valacyclovir (PO)","nameNorm":"valacyclovir valtrex","group":"Kháng virus (Tiền chất của Acyclovir) — Kháng sinh ưu tiên quản lý","indications":["VZV (CrCl>50): 1 g mỗi 8 giờ","Herpes sinh dục khởi đầu: 1 g mỗi 12 giờ","Herpes sinh dục tái phát: 500 mg mỗi 12 giờ","Herpes môi (CrCl>50): 2 g mỗi 12 giờ x 2 liều"],"doses":{"normal":"VZV (CrCl>50): 1 g mỗi 8 giờ; VZV (CrCl 30–50): 1 g mỗi 12 giờ; Genital HSV initial: 1 g mỗi 12 giờ; Tái phát: 500 mg mỗi 12 giờ; Labialis (CrCl>50): 2 g mỗi 12 giờ x 2; Labialis (CrCl 30–50): 1 g mỗi 12 giờ x 2","crcl_gt50":"Như liều thông thường","crcl_10_50":"CrCl 10–30: VZV 1 g mỗi 24 giờ; Genital initial 1 g mỗi 24 giờ; Tái phát 500 mg mỗi 24 giờ; Labialis 500 mg mỗi 12 giờ x 2","crcl_lt10":"VZV 500 mg mỗi 24 giờ; Genital 500 mg mỗi 24 giờ; Labialis 500 mg x 1","ihd":"500 mg mỗi 24 giờ sau HD","crrt":"Không có dữ liệu"},"notes":"Tham khảo phác đồ ghép tạng nếu áp dụng. Tiền chất của acyclovir — sinh khả dụng PO cao hơn.","citation":"SHC-ABX 2026 [1,2]"},{"id":53,"name":"Valganciclovir (PO)","nameNorm":"valganciclovir valcyte","group":"Kháng virus (Tiền chất của Ganciclovir) — Kháng sinh ưu tiên quản lý","indications":["CMV Khởi đầu: 900 mg mỗi 12 giờ x 14–21 ngày","CMV Duy trì/Dự phòng: 900 mg mỗi 24 giờ"],"doses":{"normal":"Khởi đầu: 900 mg mỗi 12 giờ; Duy trì/Dự phòng: 900 mg mỗi 24 giờ","crcl_gt50":"CrCl >60: Như liều thông thường; CrCl 40–59: Khởi đầu 450 mg mỗi 12 giờ; Duy trì 450 mg mỗi 24 giờ","crcl_10_50":"CrCl 25–39: Khởi đầu 450 mg mỗi 24 giờ; Duy trì 450 mg mỗi 48 giờ; CrCl 10–24: Khởi đầu 450 mg mỗi 48 giờ; Duy trì 2 lần/tuần","crcl_lt10":"CrCl <10/IHD: Khởi đầu 200 mg 3x/tuần sau HD; Duy trì 100 mg 3x/tuần sau HD","ihd":"Khởi đầu: 200 mg 3x/tuần sau HD; Duy trì: 100 mg 3x/tuần sau HD","crrt":"Không có dữ liệu"},"notes":"Tham khảo phác đồ ghép tạng. Tiền chất của ganciclovir. Theo dõi ANC/tiểu cầu.","citation":"SHC-ABX 2026 [1,2]"},{"id":54,"name":"Vancomycin (IV)","nameNorm":"vancomycin vanco iv","group":"Glycopeptide — Kháng sinh ưu tiên quản lý","indications":["MRSA","Enterococcus","Staphylococcus coagulase-negative"],"doses":{"normal":"Xem Vancomycin Dosing Protocol — theo AUC₂₄/MIC (ASHP/IDSA/SIDP 2020)","crcl_gt50":"Tham khảo Vancomycin TDM Protocol","crcl_10_50":"Tham khảo Vancomycin TDM Protocol","crcl_lt10":"Tham khảo Vancomycin TDM Protocol","ihd":"Tham khảo Vancomycin TDM Protocol","crrt":"Tham khảo Vancomycin TDM Protocol"},"notes":"TDM bắt buộc — mục tiêu AUC₂₄/MIC 400–600. Theo dõi Scr thường xuyên. Tránh phối hợp thuốc độc thận.","citation":"SHC-ABX 2026 [1,2,73,74]"},{"id":55,"name":"Vancomycin (PO)","nameNorm":"vancomycin po uong cdiff oral","group":"Glycopeptide PO (tác dụng tại chỗ)","indications":["Nhiễm Clostridioides difficile (CDI)","CDI nặng biến chứng: 500 mg mỗi 6 giờ"],"doses":{"normal":"Nhẹ-trung bình-nặng: 125 mg PO mỗi 6 giờ; Nặng biến chứng (shock, ileus, megacolon): 500 mg PO mỗi 6 giờ","crcl_gt50":"Không thay đổi","crcl_10_50":"Không thay đổi","crcl_lt10":"Không thay đổi","ihd":"Không thay đổi","crrt":"Không thay đổi"},"notes":"Hấp thu hệ thống rất thấp — chỉ tác dụng tại ruột già. Không điều chỉnh thận. Cân nhắc fidaxomicin để giảm tái phát.","citation":"SHC-ABX 2026 [1,2,75]"},{"id":56,"name":"Voriconazole (IV/PO)","nameNorm":"voriconazole vfend","group":"Kháng nấm Triazole — Kháng sinh ưu tiên quản lý","indications":["Aspergillosis xâm lấn (hàng đầu)","Candidiasis (thay thế)"],"doses":{"normal":"IV Tải: 6 mg/kg mỗi 12 giờ x 2; IV Duy trì: 4 mg/kg mỗi 12 giờ; PO Tải: 400 mg mỗi 12 giờ x 2; PO Duy trì: 200 mg mỗi 12 giờ","crcl_gt50":"Như liều thông thường","crcl_10_50":"Cân nhắc chuyển PO nếu CrCl <50 (tích lũy cyclodextrin IV)","crcl_lt10":"Dùng PO nếu có thể; IV chỉ khi lợi ích vượt nguy cơ","ihd":"Ưu tiên PO","crrt":"Ưu tiên PO"},"notes":"Chuyển đổi IV↔PO 1:1 (làm tròn đến cỡ tablet có sẵn: 200 mg, 50 mg). Tham khảo Hướng dẫn TDM kháng nấm. ABW khi béo phì.","citation":"SHC-ABX 2026 [1,2,76,77]"},{"id":57,"name":"Tobramycin (IV)","nameNorm":"tobramycin tobi nebcin aminoglycoside","group":"Aminoglycoside","indications":["Pseudomonas (ưu tiên hơn gentamicin)","Nhiễm gram âm nặng"],"doses":{"normal":"Tham khảo Aminoglycoside Protocol (tương tự Gentamicin)","crcl_gt50":"Tham khảo Protocol","crcl_10_50":"Tham khảo Protocol","crcl_lt10":"Tham khảo Protocol","ihd":"Tham khảo Protocol","crrt":"Tham khảo Protocol"},"notes":"Tham khảo Gentamicin và Phụ lục đầy đủ. Ưu tiên cho Pseudomonas hơn gentamicin.","citation":"SHC-ABX 2026 [1,2,61]"},{"id":58,"name":"Cefotaxim (IV)","nameNorm":"cefotaxim iv cefotaxime claforan","group":"Cephalosporin thế hệ 3","indications":["Nhiễm khuẩn gram âm/gram dương nhạy cảm theo phác đồ chuẩn"],"doses":{"normal":"CrCl >50 mL/phút: 2 g mỗi 8 giờ","crcl_gt50":"2 g mỗi 8 giờ","crcl_10_50":"CrCl 15–30: 1–2 g mỗi 12 giờ","crcl_lt10":"CrCl <15: 2 g mỗi 24 giờ","ihd":"2 g mỗi 24 giờ; bổ sung 1 g sau mỗi buổi lọc","crrt":"2 g mỗi 12–24 giờ"},"notes":"Thẩm phân phúc mạc (PD): 0.5–1 g mỗi 24 giờ.","citation":"Báo cáo tổng hợp HDSD Kháng sinh lâm sàng — Phụ lục bổ sung 2026"},{"id":59,"name":"Cefoperazon (IM/IV)","nameNorm":"cefoperazon im iv cefoperazone","group":"Cephalosporin thế hệ 3 (thải qua mật)","indications":["Nhiễm khuẩn nặng theo HDSD; cần thận trọng theo dõi dấu hiệu tích lũy thuốc"],"doses":{"normal":"CrCl >50 mL/phút: 1–2 g mỗi 12 giờ (tối đa 12 g/ngày cho nhiễm khuẩn nặng)","crcl_gt50":"1–2 g mỗi 12 giờ; MAX 12 g/ngày","crcl_10_50":"CrCl 18–50: 1–2 g mỗi 12 giờ (không đổi)","crcl_lt10":"CrCl <18: 100% liều chuẩn; MAX 4 g/ngày","ihd":"Tham khảo nhóm CrCl <18 mL/phút (không có dữ liệu riêng cho IHD)","crrt":"Không điều chỉnh liều"},"notes":"CẢNH BÁO: nếu có dấu hiệu tích lũy thuốc phải giảm liều phù hợp. Bệnh gan/tắc mật: MAX 4 g/ngày. Suy gan nặng hoặc suy gan kèm suy thận: MAX 2 g/ngày.","citation":"Báo cáo tổng hợp HDSD Kháng sinh lâm sàng — Phụ lục bổ sung 2026"},{"id":60,"name":"Cefoperazon/Sulbactam (IV) — tỷ lệ 1:1","nameNorm":"cefoperazon sulbactam iv ty le 1 1 sulperazon","group":"Cephalosporin + ức chế β-lactamase","indications":["Liều tính theo TỔNG LƯỢNG cả 2 hoạt chất (ví dụ 2–4 g tổng = 1–2 g Cefoperazon + 1–2 g Sulbactam)"],"doses":{"normal":"CrCl >30 mL/phút: 2–4 g mỗi 12 giờ (tổng); MAX Cefoperazon 12 g/ngày","crcl_gt50":"2–4 g mỗi 12 giờ (tổng)","crcl_10_50":"CrCl 15–30: Cefoperazon dùng 100% liều chuẩn; Sulbactam MAX 2 g/ngày (1 g mỗi 12 giờ)","crcl_lt10":"CrCl <15: Cefoperazon dùng 100% liều chuẩn; Sulbactam MAX 1 g/ngày (500 mg mỗi 12 giờ)","ihd":"Tham khảo nhóm CrCl <15 mL/phút (không có dữ liệu riêng cho IHD)","crrt":"Không có dữ liệu cụ thể"},"notes":"Sulbactam MAX tuyệt đối: không quá 9 g/ngày. Suy gan/tắc mật: Cefoperazon MAX 4 g/ngày. Suy gan nặng hoặc suy gan kèm suy thận: Cefoperazon MAX 2 g/ngày.","citation":"Báo cáo tổng hợp HDSD Kháng sinh lâm sàng — Phụ lục bổ sung 2026"},{"id":61,"name":"Fosfomycin (IV)","nameNorm":"fosfomycin iv disodium fosfomycine","group":"Dẫn chất acid phosphonic — Kháng sinh ưu tiên quản lý","indications":["Kháng sinh dự trữ — lựa chọn thay thế khi thất bại phác đồ đầu tay; khuyến cáo bắt buộc phối hợp với kháng sinh khác","Viêm màng não nhiễm khuẩn, viêm tủy xương: 16–24 g/ngày (chia 3–4 liều)","Nhiễm khuẩn tiết niệu phức tạp, viêm phổi bệnh viện, nhiễm khuẩn ổ bụng có biến chứng, viêm nội tâm mạc, nhiễm khuẩn da-mô mềm biến chứng, nhiễm khuẩn huyết liên quan: 12–24 g/ngày (chia 2–3 liều)"],"doses":{"normal":"CrCl >80 mL/phút — Màng não/tủy xương: 16–24 g/ngày (chia 3–4 liều); Các chỉ định khác: 12–24 g/ngày (chia 2–3 liều). Mỗi liều không vượt quá 8 g.","crcl_gt50":"CrCl 40–80: Thận trọng khi dùng liều cao, chưa có khuyến cáo hiệu chỉnh cụ thể","crcl_10_50":"CrCl 30–<40: 70% liều chuẩn; CrCl 20–<30: 60% liều chuẩn; CrCl 10–<20: 40% liều chuẩn (chia 2–3 liều hoặc mỗi 8–12 giờ)","crcl_lt10":"CrCl <10: 20% liều chuẩn (chia 2–3 liều hoặc mỗi 8–12 giờ)","ihd":"Khởi đầu: 2–4 g. Duy trì: 2–4 g x 3 lần/tuần (dùng sau lọc máu)","crrt":"6–8 g mỗi 12 giờ"},"notes":"Thẩm phân phúc mạc (PD): 2–4 g mỗi 48 giờ. CHỐNG CHỈ ĐỊNH dùng NaCl 0,9% làm dung môi hoàn nguyên (Fosfomycin disodium chứa hàm lượng Natri rất cao — nguy cơ quá tải Natri máu). Dung môi tương hợp: nước cất pha tiêm, Glucose 5% hoặc 10%. Nồng độ tối đa ≤40 mg/mL. Bảo quản dung dịch sau pha: dùng ngay hoặc 2–8°C trong 24 giờ, tránh ánh sáng. ADR thường gặp: rối loạn điện giải (tăng Natri, giảm Kali, phù) — nên truyền chậm (≥4 giờ ở BN nguy cơ tim mạch/thận/xơ gan), hạn chế ăn mặn.","citation":"Báo cáo tổng hợp HDSD Kháng sinh lâm sàng — Phụ lục 8 (2026)"},{"id":62,"name":"Colistin (CMS) (IV)","nameNorm":"colistin cms iv polymyxin e colistimethate","group":"Polymyxin — Kháng sinh ưu tiên quản lý","indications":["Nhiễm khuẩn nặng do vi khuẩn Gram âm đa kháng (P. aeruginosa, A. baumannii, K. pneumoniae)","Dạng khí dung: hỗ trợ điều trị viêm phổi bệnh viện/thở máy do Gram âm đa kháng"],"doses":{"normal":"Liều tải: 9 MIU. Liều duy trì (CrCl ≥50): 9 MIU/ngày, chia 2–3 lần","crcl_gt50":"CrCl ≥50 mL/phút: 9 MIU/ngày","crcl_10_50":"CrCl 30–<50: 5,5–7,5 MIU/ngày; CrCl 10–<30: 4,5–5,5 MIU/ngày","crcl_lt10":"CrCl <10: 3,5 MIU/ngày","ihd":"Liều tải 9 MIU. Ngày lọc máu: 4,5 MIU (dùng sau lọc); Ngày không lọc: 4 MIU/24 giờ","crrt":"Liều tải 9 MIU. Duy trì: 6 MIU mỗi 12 giờ"},"notes":"CAPD: liều tải 9 MIU, duy trì 4,5–6 MIU mỗi 24 giờ. Mục tiêu Css ~2 mg/L khi áp dụng liệu pháp thay thế thận. CẢNH BÁO AN TOÀN: tuyệt đối không nhầm lẫn đơn vị hoạt lực (CBA) và đơn vị khối lượng muối (CMS) — quy đổi tham khảo: 1 MIU CMS ≈ 80 mg CMS ≈ 34 mg CBA. Xem thêm module Colistin (CMS) Calculator để tính AUC/liều khí dung chi tiết.","citation":"Báo cáo tổng hợp HDSD Kháng sinh lâm sàng — Phụ lục 9 (2026)"},{"id":63,"name":"Imipenem/Cilastatin/Relebactam (IV)","nameNorm":"imipenem cilastatin relebactam iv recarbrio","group":"Carbapenem + ức chế beta-lactamase mới — Kháng sinh ưu tiên quản lý","indications":["Liều biểu thị theo TỔNG LƯỢNG 3 thành phần (500mg Imipenem + 500mg Cilastatin + 250mg Relebactam)","Nhiễm khuẩn Gram âm đa kháng có beta-lactamase nhóm A/C (KPC...)"],"doses":{"normal":"CrCl ≥90 mL/phút: 1,25 g (tổng) mỗi 6 giờ","crcl_gt50":"CrCl 60–89: 1 g mỗi 6 giờ; CrCl 30–59: 750 mg mỗi 6 giờ","crcl_10_50":"CrCl 15–29: 500 mg mỗi 6 giờ","crcl_lt10":"CrCl ≤15: 500 mg mỗi 12 giờ","ihd":"Chưa có dữ liệu cụ thể trong tài liệu — tham khảo nhóm CrCl ≤15 mL/phút và hội chẩn dược lâm sàng","crrt":"Liều nạp 1,25 g x 1 lần, sau đó duy trì 750 mg mỗi 6 giờ"},"notes":"PNCT: Imipenem và Cilastatin đi qua nhau thai. Suy gan: không cần hiệu chỉnh liều.","citation":"Báo cáo tổng hợp HDSD Kháng sinh lâm sàng — Phụ lục bổ sung 2026"}];

// ─── UTILS ───
function abxNorm(s){return(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function abxEh(s){return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function abxFmtGroup(g){
  var esc=abxEh(g||"");
  return esc.replace(/Kháng sinh ưu tiên quản lý/g,'<strong class="abx-restrict-label">Kháng sinh ưu tiên quản lý</strong>');
}

// ─── BẢN ĐỒ GIẢI NGHĨA VIẾT TẮT BỆNH LÝ/CHỈ ĐỊNH (tiếng Việt) ───
var abxAbbrMap=[
  ['CAP','Viêm phổi mắc phải tại cộng đồng'],
  ['HAP','Viêm phổi mắc phải tại bệnh viện'],
  ['VAP','Viêm phổi liên quan thở máy'],
  ['CF','Xơ nang'],
  ['PJI','Nhiễm trùng khớp giả'],
  ['UTI','Nhiễm khuẩn đường tiết niệu'],
  ['SSTI','Nhiễm khuẩn da và mô mềm'],
  ['DFI','Nhiễm khuẩn bàn chân đái tháo đường'],
  ['IAI','Nhiễm khuẩn ổ bụng'],
  ['CNS','Hệ thần kinh trung ương'],
  ['BMT','Ghép tủy xương'],
  ['CDI','Nhiễm Clostridioides difficile'],
  ['HSV','Virus Herpes simplex'],
  ['VZV','Virus Varicella-zoster (thủy đậu/zona)'],
  ['CMV','Virus Cytomegalovirus'],
  ['MRSA','Tụ cầu vàng kháng methicillin'],
  ['MSSA','Tụ cầu vàng nhạy methicillin'],
  ['VRE','Enterococcus kháng vancomycin'],
  ['ESBL','Vi khuẩn sinh men beta-lactamase phổ rộng'],
  ['CRE','Vi khuẩn đường ruột kháng carbapenem'],
  ['CRPA','Pseudomonas aeruginosa kháng carbapenem'],
  ['KPC','Carbapenemase nhóm Klebsiella pneumoniae'],
  ['DTR','Vi khuẩn kháng thuốc khó điều trị'],
  ['NTM','Nhiễm Mycobacterium không lao'],
  ['PJP','Viêm phổi do Pneumocystis jirovecii'],
  ['GNR','Trực khuẩn Gram âm'],
  ['TB','Bệnh lao'],
  ['SDD','Liều phụ thuộc độ nhạy (susceptible dose-dependent)'],
  ['FN','Sốt giảm bạch cầu hạt'],
  ['ABSSSI','Nhiễm khuẩn da và cấu trúc da cấp tính'],
  ['DKA','Nhiễm toan ceton đái tháo đường']
];
function abxAbbrFootnote(d){
  var all=[d.group,d.notes].concat(d.indications||[]);
  Object.keys(d.doses||{}).forEach(function(k){all.push(d.doses[k]);});
  var combined=all.join(" ");
  var found=[];
  abxAbbrMap.forEach(function(p){
    var re=new RegExp('\\b'+p[0]+'\\b');
    if(re.test(combined)) found.push(p);
  });
  if(!found.length) return "";
  var items=found.map(function(p){return '<strong>'+p[0]+'</strong>: '+p[1];}).join(' · ');
  return '<div class="abx-abbr-foot"><strong>📖 Chú giải viết tắt:</strong> '+items+'</div>';
}

// ─── STATE ───
var abxUnit="mg",abxCrCl=null,abxEgfr=null,abxSelectedDrug=null,abxFI=-1,abxDI=[],abxDBT;

// ─── UNIT TOGGLE ───
window.abxSetUnit=function(u){
  abxUnit=u;
  document.getElementById("abx-ut-mg").classList.toggle("active",u==="mg");
  document.getElementById("abx-ut-umol").classList.toggle("active",u==="umol");
  document.getElementById("abx-scr").placeholder=u==="mg"?"1.0":"88";
};

// ─── CALC CRCL ───
window.abxCalcCrCl=function(){
  var age=parseFloat(document.getElementById("abx-age").value);
  var sex=document.getElementById("abx-sex").value;
  var ht=parseFloat(document.getElementById("abx-ht").value);
  var wt=parseFloat(document.getElementById("abx-wt").value);
  var scrRaw=parseFloat(document.getElementById("abx-scr").value);
  var errEl=document.getElementById("abx-err");
  var errMsg=document.getElementById("abx-err-msg");
  var extraEl=document.getElementById("abx-extra-metrics");
  errEl.style.display="none";
  if(extraEl) extraEl.style.display="none";
  if(isNaN(age)||age<18||age>120){errMsg.textContent="Tuổi phải trong khoảng 18–120 (công cụ chỉ dành cho người lớn)";errEl.style.display="flex";return;}
  if(isNaN(ht)||ht<100||ht>230){errMsg.textContent="Chiều cao không hợp lệ (100–230 cm)";errEl.style.display="flex";return;}
  if(isNaN(wt)||wt<5||wt>300){errMsg.textContent="Cân nặng không hợp lệ (5–300 kg)";errEl.style.display="flex";return;}
  if(isNaN(scrRaw)||scrRaw<=0){errMsg.textContent="Creatinine không hợp lệ";errEl.style.display="flex";return;}
  var scr_mgdl=abxUnit==="umol"?scrRaw/88.42:scrRaw;
  if(scr_mgdl<0.1){errMsg.textContent="Creatinine quá thấp — kiểm tra đơn vị";errEl.style.display="flex";return;}

  // Dùng chung engine tính toán với module "Chức năng thận CrCl/eGFR/IBW/ABW" phía trên
  // — đảm bảo CrCl/eGFR/IBW/ABW luôn đồng nhất giữa 2 module.
  var m = window.computeRenalCore(age, sex, ht, wt, scr_mgdl);
  var crcl = Math.round(m.crcl*10)/10;
  abxCrCl=crcl;
  abxEgfr=Math.round(m.egfr*10)/10;
  var resEl=document.getElementById("abx-crcl-result");
  var valEl=document.getElementById("abx-crcl-val");
  var zoneEl=document.getElementById("abx-crcl-zone");
  var noteEl=document.getElementById("abx-crcl-note");
  valEl.textContent=crcl<0?"<0":crcl;
  resEl.classList.add("show");
  var scrDisp=abxUnit==="mg"?(scrRaw+" mg/dL"):(scrRaw+" µmol/L → "+Math.round(scr_mgdl*100)/100+" mg/dL");
  var metaStr="<small style='color:#6B7A8D'>SCr: "+scrDisp+" | "+(sex==="male"?"Nam":"Nữ")+" | "+age+" tuổi | "+ht+" cm | "+wt+" kg | Công thức Cockcroft-Gault</small>";
  if(crcl>50){
    resEl.style.cssText="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:14px;border-radius:10px;padding:14px 18px;background:linear-gradient(135deg,rgba(22,163,74,.07),rgba(22,163,74,.12));border:1.5px solid rgba(22,163,74,.3);animation:fadeUp .25s ease";
    valEl.style.color="#15803D";
    zoneEl.className="abx-crcl-zone zone-hi";
    zoneEl.textContent="Ngưỡng CrCl >50 mL/phút để đối chiếu liều";
    noteEl.innerHTML="Dùng liều thông thường cho hầu hết kháng sinh.<br>"+metaStr;
  } else if(crcl>=10){
    resEl.style.cssText="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:14px;border-radius:10px;padding:14px 18px;background:linear-gradient(135deg,rgba(217,119,6,.07),rgba(217,119,6,.12));border:1.5px solid rgba(217,119,6,.3);animation:fadeUp .25s ease";
    valEl.style.color="#B45309";
    zoneEl.className="abx-crcl-zone zone-mid";
    zoneEl.textContent="Ngưỡng CrCl 10–50 mL/phút để đối chiếu liều";
    noteEl.innerHTML="Cần hiệu chỉnh liều hầu hết kháng sinh — xem bảng bên dưới.<br>"+metaStr;
  } else {
    resEl.style.cssText="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:14px;border-radius:10px;padding:14px 18px;background:linear-gradient(135deg,rgba(220,38,38,.07),rgba(220,38,38,.12));border:1.5px solid rgba(220,38,38,.3);animation:fadeUp .25s ease";
    valEl.style.color="#B91C1C";
    zoneEl.className="abx-crcl-zone zone-lo";
    zoneEl.textContent="Ngưỡng CrCl <10 mL/phút để đối chiếu liều";
    noteEl.innerHTML="Hiệu chỉnh liều quan trọng. Cân nhắc lọc máu. Tham khảo cột IHD/CRRT.<br>"+metaStr;
  }
  // Hiển thị thêm eGFR / IBW / ABW (từ engine dùng chung)
  if(extraEl){
    var egfrEl=document.getElementById("abx-egfr-val");
    var egfrAbsoluteEl=document.getElementById("abx-egfr-absolute-val");
    var ibwEl=document.getElementById("abx-ibw-val");
    var abwEl=document.getElementById("abx-abw-val");
    if(egfrEl) egfrEl.textContent=m.egfr.toFixed(1);
    if(egfrAbsoluteEl) egfrAbsoluteEl.textContent=m.egfrAbsolute.toFixed(1);
    if(ibwEl) ibwEl.textContent=m.ibw.toFixed(1);
    if(abwEl) abwEl.textContent=m.abw.toFixed(1);
    extraEl.style.display="grid";
  }
  abxHighlightRow();
  abxLogCurrentLookup();
};

window.abxResetCrCl=function(){
  ["abx-age","abx-ht","abx-wt","abx-scr"].forEach(function(id){var el=document.getElementById(id);if(el)el.value="";});
  var res=document.getElementById("abx-crcl-result");if(res)res.classList.remove("show");
  var err=document.getElementById("abx-err");if(err)err.style.display="none";
  var extra=document.getElementById("abx-extra-metrics");if(extra)extra.style.display="none";
  abxCrCl=null;
  abxEgfr=null;
  abxHighlightRow();
};

// ─── HIGHLIGHT ───
function abxHighlightRow(){
  var rows=document.querySelectorAll("#abx-result-panel .abx-dtbl tbody tr[data-key]");
  rows.forEach(function(r){
    r.classList.remove("abx-row-match");
    var b=r.querySelector(".abx-match-badge");if(b)b.remove();
  });
  if(abxCrCl===null) return;
  var key;
  if(abxCrCl>50) key="crcl_gt50";
  else if(abxCrCl>=10) key="crcl_10_50";
  else key="crcl_lt10";
  var row=document.querySelector('#abx-result-panel .abx-dtbl tbody tr[data-key="'+key+'"]');
  if(row){
    row.classList.add("abx-row-match");
    var td=row.querySelector("td:first-child");
    if(td&&!td.querySelector(".abx-match-badge")){
      var badge=document.createElement("span");
      badge.className="abx-match-badge";badge.textContent="✓ Phù hợp";
      td.appendChild(badge);
    }
    setTimeout(function(){row.scrollIntoView({behavior:"smooth",block:"nearest"});},100);
  }
}

function abxLogCurrentLookup(){
  if(!abxSelectedDrug||abxCrCl===null||!window.ClinpharmAudit) return;
  var key=abxCrCl>50?"crcl_gt50":abxCrCl>=10?"crcl_10_50":"crcl_lt10";
  var labels={crcl_gt50:'CrCl >50 mL/phút',crcl_10_50:'CrCl 10–50 mL/phút',crcl_lt10:'CrCl <10 mL/phút'};
  window.ClinpharmAudit.logLookup({
    lookup_type:'antibiotic_renal_dose',
    module_name:'Hiệu chỉnh liều kháng sinh theo CrCl',
    drug_name:abxSelectedDrug.name,
    crcl_ml_min:abxCrCl,
    egfr_ml_min_1_73m2:abxEgfr,
    renal_band:labels[key],
    result_summary:abxSelectedDrug.doses&&abxSelectedDrug.doses[key]?abxSelectedDrug.doses[key]:''
  });
}

// ─── RENDER DRUG TABLE ───
function abxRenderDrug(d){
  var rows=[
    {key:"normal",label:"💊 Liều thông thường (CrCl bình thường)"},
    {key:"crcl_gt50",label:"🟢 CrCl >50 mL/phút"},
    {key:"crcl_10_50",label:"🟡 CrCl 10–50 mL/phút"},
    {key:"crcl_lt10",label:"🔴 CrCl <10 mL/phút"},
    {key:"ihd",label:"🔵 IHD — Lọc máu ngắt quãng (3×/tuần)"},
    {key:"crrt",label:"🟣 CRRT — Lọc máu liên tục (CVVHDF/CVVHD)"}
  ];
  var trs=rows.map(function(r){
    return'<tr data-key="'+r.key+'"><td>'+r.label+'</td><td>'+abxEh(d.doses[r.key])+'</td></tr>';
  }).join("");
  var indHtml=d.indications&&d.indications.length?'<div class="abx-drug-ind">📌 '+d.indications.slice(0,2).map(abxEh).join(" · ")+'</div>':"";
  return'<div class="abx-drug-hdr">'
    +'<div class="abx-drug-name">'+abxEh(d.name)+'</div>'
    +'<div class="abx-drug-group">'+abxFmtGroup(d.group)+'</div>'
    +indHtml
    +'</div>'
    +'<div class="abx-dtbl-wrap">'
    +'<table class="abx-dtbl"><thead><tr><th style="width:230px">Phân vùng CrCl / Chế độ lọc máu</th><th>Liều khuyến cáo</th></tr></thead>'
    +'<tbody>'+trs+'</tbody></table></div>'
    +'<div class="abx-notes-box"><strong>📝 Lưu ý lâm sàng:</strong> '+abxEh(d.notes)
    +abxAbbrFootnote(d)
    +'</div>';
}

// ─── SEARCH ───
var abxSI,abxDD,abxSC,abxRPanel;
function abxInit(){
  abxSI=document.getElementById("abx-si");
  abxDD=document.getElementById("abx-dd");
  abxSC=document.getElementById("abx-sclr");
  abxRPanel=document.getElementById("abx-result-panel");
  if(!abxSI) return;
  abxSI.addEventListener("input",function(){
    abxSC.classList.toggle("on",this.value.length>0);
    clearTimeout(abxDBT);
    var q=this.value;
    abxDBT=setTimeout(function(){abxFI=-1;abxRunSearch(q);},110);
  });
  abxSI.addEventListener("keydown",function(e){
    if(!abxDD.classList.contains("open")) return;
    if(e.key==="ArrowDown"){e.preventDefault();abxMoveFocus(1);}
    else if(e.key==="ArrowUp"){e.preventDefault();abxMoveFocus(-1);}
    else if(e.key==="Enter"){e.preventDefault();abxPickFocused();}
    else if(e.key==="Escape"){abxCloseDd();}
  });
  abxSI.addEventListener("blur",function(){setTimeout(abxCloseDd,200);});
  abxSC.addEventListener("click",function(){
    abxSI.value="";abxSC.classList.remove("on");abxCloseDd();
    abxRPanel.classList.remove("show");
    document.getElementById("abx-result-inner").innerHTML='<div class="abx-empty"><div class="abx-empty-ico">💊</div><div class="abx-empty-t">Chọn kháng sinh để xem bảng hiệu chỉnh liều</div><div style="font-size:12px;margin-top:4px">Sau khi tính CrCl ở Phần A, dòng liều tương ứng sẽ được tô sáng tự động</div></div>';
    abxSI.focus();
  });
  document.addEventListener("click",function(e){
    var sw=document.getElementById("abx-swrap");
    if(sw&&!sw.contains(e.target)) abxCloseDd();
  });
}
function abxMoveFocus(d){
  abxFI=Math.max(-1,Math.min(abxDI.length-1,abxFI+d));
  Array.from(abxDD.querySelectorAll(".abx-ddi")).forEach(function(el,i){el.classList.toggle("abx-focused",i===abxFI);});
  var el=abxDD.querySelectorAll(".abx-ddi")[abxFI];if(el)el.scrollIntoView({block:"nearest"});
}
function abxPickFocused(){
  if(abxFI>=0&&abxDI[abxFI]) abxSelectDrug(abxDI[abxFI].id);
  else if(abxDI.length) abxSelectDrug(abxDI[0].id);
}
function abxCloseDd(){abxDD.classList.remove("open");abxFI=-1;}
function abxRunSearch(q){
  var nq=abxNorm(q.trim().replace(/[\/\-\.]/g," "));
  if(!nq){abxCloseDd();return;}
  var words=nq.split(/\s+/).filter(Boolean);
  var res=ABX_DRUGS.filter(function(d){
    var haystack=abxNorm(d.name.replace(/[\/\-\.]/g," "))+" "+abxNorm(d.nameNorm)+" "+abxNorm(d.group);
    if(words.length>1) return words.every(function(w){return haystack.includes(w);});
    return haystack.includes(words[0]);
  });
  abxDI=res;
  if(!res.length){
    abxDD.innerHTML='<div class="abx-ddempty">Không tìm thấy — thử từ khác (tên hoạt chất, biệt dược, nhóm thuốc)</div>';
    abxDD.classList.add("open");return;
  }
  abxDD.innerHTML=res.slice(0,45).map(function(d){
    return'<div class="abx-ddi" data-id="'+d.id+'">'
      +'<span class="abx-ddi-name">'+abxEh(d.name)+'</span>'
      +'<span class="abx-ddi-group">'+abxEh(d.group.replace(/— Kháng sinh ưu tiên quản lý/,"★").split("(")[0].trim().slice(0,28))+'</span>'
      +'</div>';
  }).join("");
  abxDD.classList.add("open");
  abxDD.querySelectorAll(".abx-ddi").forEach(function(el){
    el.addEventListener("mousedown",function(e){e.preventDefault();abxSelectDrug(+el.dataset.id);});
    el.addEventListener("mouseover",function(){
      abxFI=Array.from(abxDD.querySelectorAll(".abx-ddi")).indexOf(el);
      Array.from(abxDD.querySelectorAll(".abx-ddi")).forEach(function(e2,i2){e2.classList.toggle("abx-focused",i2===abxFI);});
    });
  });
}
function abxSelectDrug(id){
  var d=ABX_DRUGS.find(function(x){return x.id===id;});if(!d)return;
  abxSelectedDrug=d;
  abxSI.value=d.name;abxSC.classList.add("on");abxCloseDd();
  document.getElementById("abx-result-inner").innerHTML=abxRenderDrug(d);
  abxRPanel.classList.add("show");
  abxHighlightRow();
  abxLogCurrentLookup();
  setTimeout(function(){abxRPanel.scrollIntoView({behavior:"smooth",block:"start"});},80);
}

document.addEventListener("DOMContentLoaded",abxInit);
})(); // end IIFE ABX DOSING MODULE
