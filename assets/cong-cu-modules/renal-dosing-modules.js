/* 3 module tính liều thận (IIFE độc lập, ghép theo đúng thứ tự gốc) */

(function() {
  'use strict';

  /* =========================================================================
   * PHẦN LÕI THUẬT TOÁN — đã validate độc lập bằng Node.js (8 nhóm test, PASS)
   * ========================================================================= */

  function calcIBW(heightCm, sex) {
    const heightIn = heightCm / 2.54;
    const base = sex === 'female' ? 45.5 : 50;
    if (heightIn <= 60) return base;
    return base + 2.3 * (heightIn - 60);
  }

  const AVAILABLE_STRENGTHS = [25, 50, 75, 100, 125, 150, 200];

  function getBracketStrengths(calculatedDoseMcg) {
    const sorted = [...AVAILABLE_STRENGTHS].sort((a, b) => a - b);
    let lower = sorted[0];
    let upper = sorted[sorted.length - 1];
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] <= calculatedDoseMcg) lower = sorted[i];
      if (sorted[i] >= calculatedDoseMcg) { upper = sorted[i]; break; }
    }
    return { lower, upper, exact: AVAILABLE_STRENGTHS.includes(calculatedDoseMcg) };
  }

  function calcDoseHealthy(weightKg, heightCm, sex) {
    const ibw = calcIBW(heightCm, sex);
    const doseMcg = 1.6 * ibw;
    return { doseMcg, weightUsed: ibw, weightType: 'IBW', tshTarget: { min: 0.4, max: 4.0 } };
  }

  function calcDoseElderlyCardiac() {
    return { doseMcg: 25, doseRangeMin: 12.5, doseRangeMax: 25, weightUsed: null, weightType: null, tshTarget: { min: 0.4, max: 4.0 } };
  }

  function calcDoseSubclinical() {
    return { doseMcg: 50, doseRangeMin: 25, doseRangeMax: 75, weightUsed: null, weightType: null, tshTarget: { min: 0.4, max: 4.0 } };
  }

  function calcDoseThyroidCancer(weightKg, riskLevel) {
    const doseMcg = 1.6 * weightKg;
    const riskTargets = {
      high: { min: 0, max: 0.1, label: 'Nguy cơ cao: TSH <0,1 mIU/L' },
      intermediate: { min: 0.1, max: 0.5, label: 'Nguy cơ trung bình: TSH 0,1–0,5 mIU/L' },
      low: { min: 0.5, max: 2.0, label: 'Nguy cơ thấp/đáp ứng tốt: TSH 0,5–2,0 mIU/L' },
    };
    const tshTarget = riskTargets[riskLevel] || riskTargets.intermediate;
    return { doseMcg, weightUsed: weightKg, weightType: 'ABW', tshTarget, doseMayIncreaseTo: 2.7 * weightKg };
  }

  function calcDoseTotalThyroidectomyBenign(weightKg) {
    const doseMcg = 1.6 * weightKg;
    return { doseMcg, weightUsed: weightKg, weightType: 'ABW', tshTarget: { min: 0.5, max: 2.0 } };
  }

  function calcDosePregnancy(weightKg) {
    const doseMcgMin = 1.6 * weightKg;
    const doseMcgMax = 2.2 * weightKg;
    return {
      doseMcg: (doseMcgMin + doseMcgMax) / 2,
      doseRangeMin: doseMcgMin, doseRangeMax: doseMcgMax,
      weightUsed: weightKg, weightType: 'ABW',
      tshTarget: { min: 0.1, max: 2.5, note: 'Tam cá nguyệt 1: <2,5; Tam cá nguyệt 2-3: <3,0 mIU/L (cần Bác sĩ xác nhận theo từng tam cá nguyệt)' },
    };
  }

  function adjustDose(currentDoseMcg, tshValue, targetMin, targetMax) {
    const STEP = 12.5, STEP_MAX = 25;
    if (tshValue > targetMax) {
      return { action: 'increase', newDoseMin: currentDoseMcg + STEP, newDoseMax: currentDoseMcg + STEP_MAX, message: 'TSH cao hơn đích — cần TĂNG liều' };
    } else if (tshValue < targetMin) {
      return { action: 'decrease', newDoseMin: currentDoseMcg - STEP_MAX, newDoseMax: currentDoseMcg - STEP, message: 'TSH thấp hơn đích — cần GIẢM liều' };
    } else {
      return { action: 'maintain', newDoseMin: currentDoseMcg, newDoseMax: currentDoseMcg, message: 'TSH trong khoảng đích — GIỮ NGUYÊN liều hiện tại' };
    }
  }

  /* ============================= UI LOGIC ============================= */

  const VLT = {
    mode: 'initial',
    profile: 'healthy',
    isPregnant: false,

    setMode(mode) {
      this.mode = mode;
      document.getElementById('vlt-mode-initial').classList.toggle('active', mode === 'initial');
      document.getElementById('vlt-mode-adjust').classList.toggle('active', mode === 'adjust');
      document.getElementById('vlt-initial-fields').style.display = mode === 'initial' ? 'block' : 'none';
      document.getElementById('vlt-adjust-fields').style.display = mode === 'adjust' ? 'block' : 'none';
    },

    togglePregnant() {
      this.isPregnant = document.getElementById('vlt-pregnant').checked;
      document.getElementById('vlt-profile-section').style.display = this.isPregnant ? 'none' : 'block';
    },

    getVal(id) { return parseFloat(document.getElementById(id).value); },
    fmt(n, d = 1) { return Number.isFinite(n) ? n.toFixed(d) : '—'; },

    init() {
      const items = document.querySelectorAll('.vlt-radio-item');
      items.forEach(item => {
        item.addEventListener('click', () => {
          items.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          item.querySelector('input').checked = true;
          this.profile = item.dataset.profile;
          document.getElementById('vlt-risk-block').style.display = this.profile === 'cancer' ? 'block' : 'none';
        });
      });
    },

    calculate() {
      if (this.mode === 'initial') this.calculateInitial();
      else this.calculateAdjust();
      document.getElementById('vlt-results').classList.add('vlt-show');
    },

    calculateInitial() {
      const weightKg = this.getVal('vlt-weight');
      const heightCm = this.getVal('vlt-height');
      const sex = document.getElementById('vlt-sex').value;

      if (!weightKg || weightKg <= 0 || !heightCm || heightCm <= 0) {
        alert('Vui lòng kiểm tra lại cân nặng và chiều cao (phải > 0).');
        return;
      }

      let result, profileLabel, profileNote;
      const alertsDiv = document.getElementById('vlt-alerts');
      alertsDiv.innerHTML = '';

      if (this.isPregnant) {
        result = calcDosePregnancy(weightKg);
        profileLabel = 'Mang thai';
        profileNote = 'Nhu cầu hormone giáp tăng cao trong thai kỳ. Điều trị kịp thời quan trọng cho phát triển thần kinh thai nhi. Theo dõi TSH mỗi 4 tuần trong thai kỳ.';
        alertsDiv.innerHTML = `<div class="vlt-warn-block">⚠ ${result.tshTarget.note}</div>`;
      } else {
        switch (this.profile) {
          case 'healthy':
            result = calcDoseHealthy(weightKg, heightCm, sex);
            profileLabel = 'Suy giáp hoàn toàn (trẻ, khỏe)';
            profileNote = 'Dùng cân nặng lý tưởng (IBW) vì Levothyroxine phân bố chủ yếu vào khối cơ — tránh quá liều ở người thừa cân/béo phì.';
            break;
          case 'elderly':
            result = calcDoseElderlyCardiac();
            profileLabel = 'Suy giáp (người cao tuổi / tim mạch)';
            profileNote = 'Chiến lược "khởi đầu thấp, tăng từ từ" (start low, go slow) — tăng liều mỗi 4-6 tuần theo TSH để giảm nguy cơ biến cố tim mạch.';
            break;
          case 'subclinical':
            result = calcDoseSubclinical();
            profileLabel = 'Suy giáp dưới lâm sàng';
            profileNote = 'Quyết định điều trị phức tạp, phụ thuộc triệu chứng và kháng thể anti-TPO — cần đánh giá của Bác sĩ trước khi bắt đầu.';
            break;
          case 'cancer': {
            const riskLevel = document.getElementById('vlt-risk-level').value;
            result = calcDoseThyroidCancer(weightKg, riskLevel);
            profileLabel = 'Ức chế TSH (ung thư giáp)';
            profileNote = `${result.tshTarget.label}. Có thể cần tăng liều tới khoảng ${this.fmt(result.doseMayIncreaseTo,0)} mcg/ngày (2,1-2,7 mcg/kg) để đạt mức ức chế đủ theo dõi sau.`;
            break;
          }
          case 'thyroidectomy':
            result = calcDoseTotalThyroidectomyBenign(weightKg);
            profileLabel = 'Sau cắt toàn bộ tuyến giáp (lành tính)';
            profileNote = 'Đích TSH bình thường-thấp (KHÔNG ức chế như ung thư giáp). Bệnh nhân không còn mô giáp (athyreotic) có thể cần liều cao hơn người còn sót mô giáp.';
            break;
        }
      }

      const bracket = getBracketStrengths(result.doseRangeMin ? (result.doseRangeMin + result.doseRangeMax) / 2 : result.doseMcg);

      document.getElementById('vlt-hero').innerHTML = `
        <div class="vlt-hero-stat"><div class="vlt-hero-label">Tình trạng</div><div class="vlt-hero-value" style="font-size:15px;">${profileLabel}</div></div>
        <div class="vlt-hero-stat"><div class="vlt-hero-label">Liều khởi đầu</div><div class="vlt-hero-value">${result.doseRangeMin ? this.fmt(result.doseRangeMin,0)+'–'+this.fmt(result.doseRangeMax,0) : this.fmt(result.doseMcg,0)}</div><div class="vlt-hero-sub">mcg/ngày</div></div>
        <div class="vlt-hero-stat"><div class="vlt-hero-label">Đích TSH</div><div class="vlt-hero-value">${result.tshTarget.min}–${result.tshTarget.max}</div><div class="vlt-hero-sub">mIU/L</div></div>
      `;

      let regimenHTML = `<div class="vlt-dose-block vlt-primary">
        <div class="vlt-dose-title">Liều khởi đầu tính toán</div>
        <div class="vlt-dose-value">${result.doseRangeMin ? this.fmt(result.doseRangeMin,1)+' – '+this.fmt(result.doseRangeMax,1) : this.fmt(result.doseMcg,1)} mcg/ngày</div>
        <div class="vlt-dose-note">${profileNote}</div>
        ${result.weightUsed ? `<div class="vlt-dose-note">Cân nặng dùng tính toán: ${this.fmt(result.weightUsed,1)} kg (${result.weightType === 'IBW' ? 'cân nặng lý tưởng' : 'cân nặng thực tế'}).</div>` : ''}
      </div>`;
      document.getElementById('vlt-regimen-content').innerHTML = regimenHTML;

      const doseForBracket = result.doseRangeMin ? (result.doseRangeMin + result.doseRangeMax) / 2 : result.doseMcg;
      document.getElementById('vlt-bracket-card').style.display = 'block';
      document.getElementById('vlt-bracket-content').innerHTML = bracket.exact
        ? `<div class="vlt-dose-block vlt-maintain"><div class="vlt-dose-value">${doseForBracket} mcg/ngày — có sẵn đúng hàm lượng</div></div>`
        : `<div class="vlt-dose-block"><div class="vlt-dose-value">Khoảng liều ${bracket.lower} mcg và ${bracket.upper} mcg</div>
           <div class="vlt-dose-note">Liều tính toán ${this.fmt(doseForBracket,1)} mcg nằm giữa 2 hàm lượng viên thuốc — Bác sĩ/Dược sĩ lâm sàng cân nhắc chọn mức gần hơn hoặc phối hợp bẻ viên.</div></div>`;

      document.getElementById('vlt-monitoring-content').innerHTML = `
        <p style="font-size:13px; margin:0;">Kiểm tra lại TSH sau <strong>4-6 tuần</strong> kể từ khi bắt đầu hoặc thay đổi liều
        (người cao tuổi/tim mạch nên theo dõi chậm hơn, mỗi 6-8 tuần). Khi đã đạt đích ổn định, kiểm tra định kỳ
        mỗi 6-12 tháng hoặc khi có thay đổi triệu chứng/thuốc phối hợp.</p>
      `;

      document.getElementById('vlt-results').classList.add('vlt-show');
    },

    calculateAdjust() {
      const currentDose = this.getVal('vlt-current-dose');
      const tshValue = this.getVal('vlt-tsh-value');
      const targetMin = this.getVal('vlt-target-min');
      const targetMax = this.getVal('vlt-target-max');

      if (!currentDose || currentDose <= 0 || tshValue === undefined || isNaN(tshValue) || targetMin >= targetMax) {
        alert('Vui lòng kiểm tra lại thông tin nhập (liều hiện tại > 0, giới hạn dưới đích phải nhỏ hơn giới hạn trên).');
        return;
      }

      const adj = adjustDose(currentDose, tshValue, targetMin, targetMax);

      const actionLabel = { increase: 'TĂNG liều', decrease: 'GIẢM liều', maintain: 'GIỮ NGUYÊN' };
      const actionClass = { increase: 'vlt-increase', decrease: 'vlt-decrease', maintain: 'vlt-maintain' };

      document.getElementById('vlt-hero').innerHTML = `
        <div class="vlt-hero-stat"><div class="vlt-hero-label">Liều hiện tại</div><div class="vlt-hero-value">${this.fmt(currentDose,1)}</div><div class="vlt-hero-sub">mcg/ngày</div></div>
        <div class="vlt-hero-stat"><div class="vlt-hero-label">TSH đo được</div><div class="vlt-hero-value">${this.fmt(tshValue,2)}</div><div class="vlt-hero-sub">mIU/L (đích ${targetMin}–${targetMax})</div></div>
        <div class="vlt-hero-stat"><div class="vlt-hero-label">Khuyến nghị</div><div class="vlt-hero-value">${actionLabel[adj.action]}</div></div>
      `;

      document.getElementById('vlt-alerts').innerHTML = '';

      document.getElementById('vlt-regimen-content').innerHTML = `
        <div class="vlt-dose-block ${actionClass[adj.action]}">
          <div class="vlt-dose-title">${actionLabel[adj.action]}</div>
          <div class="vlt-dose-value">${adj.action === 'maintain' ? this.fmt(currentDose,1) + ' mcg/ngày (không đổi)' : this.fmt(adj.newDoseMin,1) + ' – ' + this.fmt(adj.newDoseMax,1) + ' mcg/ngày'}</div>
          <div class="vlt-dose-note">${adj.message}. Bước điều chỉnh thông thường 12,5–25 mcg/ngày.</div>
        </div>
      `;

      document.getElementById('vlt-bracket-card').style.display = 'none';

      document.getElementById('vlt-monitoring-content').innerHTML = `
        <p style="font-size:13px; margin:0;">Kiểm tra lại TSH sau <strong>4-6 tuần</strong> kể từ khi điều chỉnh liều.
        Không điều chỉnh liều dựa trên 1 lần đo TSH nếu có yếu tố gây nhiễu (mới ốm, thay đổi thuốc phối hợp,
        không nhịn ăn đúng cách trước lấy mẫu).</p>
      `;

      document.getElementById('vlt-results').classList.add('vlt-show');
    },

    reset() {
      // Reset chế độ về Khởi đầu
      this.setMode('initial');

      // Reset checkbox mang thai
      document.getElementById('vlt-pregnant').checked = false;
      this.isPregnant = false;
      document.getElementById('vlt-profile-section').style.display = 'block';

      // Reset radio tình trạng về "healthy" (mặc định ban đầu)
      const items = document.querySelectorAll('.vlt-radio-item');
      items.forEach(item => {
        const isHealthy = item.dataset.profile === 'healthy';
        item.classList.toggle('active', isHealthy);
        item.querySelector('input').checked = isHealthy;
      });
      this.profile = 'healthy';
      document.getElementById('vlt-risk-block').style.display = 'none';
      document.getElementById('vlt-risk-level').value = 'intermediate';

      // Reset các input về giá trị mặc định ban đầu
      document.getElementById('vlt-weight').value = '65';
      document.getElementById('vlt-height').value = '160';
      document.getElementById('vlt-sex').value = 'female';
      document.getElementById('vlt-current-dose').value = '100';
      document.getElementById('vlt-tsh-value').value = '6.5';
      document.getElementById('vlt-target-min').value = '0.4';
      document.getElementById('vlt-target-max').value = '4.0';

      // Ẩn kết quả
      document.getElementById('vlt-results').classList.remove('vlt-show');
    },
  };

  window.VLT = VLT;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VLT.init(), { once: true });
  } else {
    VLT.init();
  }
})();



(function() {
  'use strict';

  /* =========================================================================
   * PHẦN LÕI THUẬT TOÁN — đã validate độc lập bằng Node.js (7/7 ca PASS)
   * Nguồn: GAPP (Galway Antimicrobial Prescribing Policy/Guidelines),
   * Renal Dosing & Aminoglycoside/Vancomycin Dosing & Monitoring (Adults),
   * https://eguides.megsupporttools.com/public/guh/ (accessed June 2026)
   * Tham chiếu gốc: Rybak et al 2009 (Clin Infect Dis 2009;49:325-327)
   * ========================================================================= */

  function calcIBW_GAPP(heightCm, sex) {
    const inchesOver5ft = (heightCm / 2.54) - 60;
    const base = sex === 'female' ? 45.5 : 50;
    return base + 2.3 * Math.max(0, inchesOver5ft);
  }

  function calcAdjustedDosingWeight(actualWeightKg, ibwKg) {
    if (actualWeightKg >= 1.2 * ibwKg) return ibwKg + 0.4 * (actualWeightKg - ibwKg);
    return null;
  }

  // QUAN TRỌNG: N=1.23(nam)/1.04(nữ) chỉ đúng khi scrUmolL là µmol/L (KHÔNG dùng hệ số 72 kiểu mg/dL)
  function calcCrCl_GAPP({ ageYears, weightKg, heightCm, sex, scrUmolL }) {
    const ibw = calcIBW_GAPP(heightCm, sex);
    const adjBW = calcAdjustedDosingWeight(weightKg, ibw);
    let crclWeight;
    if (weightKg < ibw) crclWeight = weightKg;
    else if (adjBW !== null) crclWeight = adjBW;
    else crclWeight = ibw;
    const N = sex === 'female' ? 1.04 : 1.23;
    const crcl = ((140 - ageYears) * crclWeight * N) / scrUmolL;
    return { crcl, ibw, adjBW, crclWeight };
  }

  function getTroughTarget(riskCategory) {
    if (riskCategory === 'high') return { min: 15, max: 20, label: '15–20 mg/L (nguy cơ cao)' };
    return { min: 10, max: 15, label: '10–15 mg/L (chuẩn)' };
  }

  function calcLoadingDose(actualWeightKg) {
    const raw = 25 * actualWeightKg;
    const capped = Math.min(raw, 2000);
    return Math.round(capped / 250) * 250;
  }

  function getMaintenanceRegimen(crcl, actualWeightKg) {
    const rawDose = 15 * actualWeightKg;
    const roundedDose = Math.round(rawDose / 250) * 250;
    if (crcl > 50) {
      return { doseMg: roundedDose, intervalH: 12, note: 'CrCl > 50 mL/min: 15mg/kg mỗi 12 giờ' };
    } else if (crcl >= 20) {
      return { doseMg: roundedDose, intervalH: 24, note: 'CrCl 20–50 mL/min: 15mg/kg mỗi 24 giờ' };
    } else {
      return {
        doseMg: roundedDose, intervalH: null,
        note: 'CrCl < 20 mL/min: 15mg/kg, định liều lại theo nồng độ đo được (thường mỗi 3–7 ngày).',
        requiresConsult: true,
      };
    }
  }

  function getHDRegimen(actualWeightKg) {
    let dose;
    if (actualWeightKg < 50) dose = 750;
    else if (actualWeightKg < 70) dose = 1000;
    else if (actualWeightKg <= 100) dose = 1500;
    else dose = 2000;
    return { loadingDose: dose, maintenanceDose: dose };
  }

  /* ============================= UI LOGIC ============================= */

  const VGN = {
    mode: 'normal',
    scrUnit: 'mgdl',
    risk: 'standard',

    setMode(mode) {
      this.mode = mode;
      document.getElementById('vgn-mode-normal').classList.toggle('active', mode === 'normal');
      document.getElementById('vgn-mode-hd').classList.toggle('active', mode === 'hd');
      document.getElementById('vgn-normal-fields').style.display = mode === 'normal' ? 'block' : 'none';
      document.getElementById('vgn-hd-fields').style.display = mode === 'hd' ? 'block' : 'none';
      document.getElementById('vgn-risk-card').style.display = mode === 'normal' ? 'block' : 'none';
    },

    setRisk(risk) {
      this.risk = risk;
      document.getElementById('vgn-risk-standard-label').classList.toggle('active', risk === 'standard');
      document.getElementById('vgn-risk-high-label').classList.toggle('active', risk === 'high');
      if (risk === 'high') document.getElementById('vgn-want-loading').checked = true;
    },

    toggleScrUnit(unit) {
      const input = document.getElementById('vgn-scr');
      const buttons = document.querySelectorAll('.vgn-unit-toggle button');
      let val = parseFloat(input.value);
      if (isNaN(val)) return;
      if (unit === 'umol' && this.scrUnit === 'mgdl') {
        val = Math.round(val * 88.4 * 100) / 100;
        buttons.forEach(b => b.classList.toggle('active', b.dataset.unit === 'umol'));
      } else if (unit === 'mgdl' && this.scrUnit === 'umol') {
        val = Math.round((val / 88.4) * 100) / 100;
        buttons.forEach(b => b.classList.toggle('active', b.dataset.unit === 'mgdl'));
      }
      input.value = val;
      this.scrUnit = unit;
    },

    getVal(id) { return parseFloat(document.getElementById(id).value); },
    fmt(n, d = 1) { return Number.isFinite(n) ? n.toFixed(d) : '—'; },

    calculate() {
      if (this.mode === 'hd') {
        this.calculateHD();
      } else {
        this.calculateNormal();
      }
      document.getElementById('vgn-results').classList.add('vgn-show');
    },

    calculateNormal() {
      const patient = {
        ageYears: this.getVal('vgn-age'),
        weightKg: this.getVal('vgn-weight'),
        heightCm: this.getVal('vgn-height'),
        sex: document.getElementById('vgn-sex').value,
      };
      // Quy đổi nội bộ luôn về µmol/L vì công thức N=1.23/1.04 chỉ đúng với µmol/L
      const scrInput = this.getVal('vgn-scr');
      patient.scrUmolL = this.scrUnit === 'mgdl' ? scrInput * 88.4 : scrInput;

      const crclResult = calcCrCl_GAPP(patient);
      const target = getTroughTarget(this.risk);
      const maint = getMaintenanceRegimen(crclResult.crcl, patient.weightKg);
      const wantLoading = document.getElementById('vgn-want-loading').checked;
      const loadingDose = wantLoading ? calcLoadingDose(patient.weightKg) : null;

      const bwInfo = document.getElementById('vgn-bw-info');
      bwInfo.style.display = 'block';
      bwInfo.innerHTML = `<strong>IBW</strong> = ${this.fmt(crclResult.ibw)} kg` +
        (crclResult.adjBW ? ` · <strong>AdjBW</strong> (dùng cho CrCl) = ${this.fmt(crclResult.adjBW)} kg (ABW ≥120% IBW)` : ` · CrCl dùng ${crclResult.crclWeight === patient.weightKg ? 'cân nặng thực tế' : 'IBW'} (${this.fmt(crclResult.crclWeight)} kg)`);

      // Hero
      const hero = document.getElementById('vgn-hero');
      hero.innerHTML = `
        <div class="vgn-hero-stat"><div class="vgn-hero-label">CrCl (Cockcroft-Gault)</div><div class="vgn-hero-value">${this.fmt(crclResult.crcl,1)}</div><div class="vgn-hero-sub">mL/min</div></div>
        <div class="vgn-hero-stat"><div class="vgn-hero-label">Đích trough</div><div class="vgn-hero-value">${target.min}–${target.max}</div><div class="vgn-hero-sub">mg/L</div></div>
        <div class="vgn-hero-stat"><div class="vgn-hero-label">Liều duy trì</div><div class="vgn-hero-value">${maint.intervalH ? this.fmt(maint.doseMg,0)+'mg' : 'Cá thể hóa'}</div><div class="vgn-hero-sub">${maint.intervalH ? 'mỗi '+maint.intervalH+'h' : 'theo dõi sát'}</div></div>
      `;

      // Alerts
      const alertsDiv = document.getElementById('vgn-alerts');
      alertsDiv.innerHTML = '';
      if (maint.requiresConsult) {
        alertsDiv.innerHTML += `<div class="vgn-alert-block">⚠ CrCl ${this.fmt(crclResult.crcl,1)} mL/min (&lt;20 mL/min): nomogram không dự đoán tốt ở mức suy thận này. Cần hội chẩn Bác sĩ hoặc Dược sĩ lâm sàng để định liều theo nồng độ đo được.</div>`;
      }
      if (crclResult.crcl < 30 && !maint.requiresConsult) {
        alertsDiv.innerHTML += `<div class="vgn-warn-block">ℹ CrCl &lt;30 mL/min: theo GAPP nên thảo luận với Bác sĩ, đặc biệt nếu đợt điều trị kéo dài.</div>`;
      }

      // Regimen content
      let regimenHTML = '';
      if (loadingDose) {
        regimenHTML += `<div class="vgn-dose-block vgn-loading">
          <div class="vgn-dose-title">Liều nạp (Loading dose)</div>
          <div class="vgn-dose-value">${this.fmt(loadingDose,0)} mg IV, truyền 1 lần</div>
          <div class="vgn-dose-note">25mg/kg cân nặng thực tế (tối đa 2g). Làm tròn liều lượng đến bội số gần nhất của 250mg. Không nên trì hoãn việc truyền liều nạp.</div>
        </div>`;
      }
      regimenHTML += `<div class="vgn-dose-block vgn-maintenance">
        <div class="vgn-dose-title">Liều duy trì</div>
        <div class="vgn-dose-value">${this.fmt(maint.doseMg,0)} mg IV ${maint.intervalH ? 'mỗi ' + maint.intervalH + ' giờ' : '(định liều lại theo nồng độ)'}</div>
        <div class="vgn-dose-note">${maint.note}</div>
      </div>`;
      regimenHTML += `<div class="vgn-method-note" style="margin-top:10px;">
        Tốc độ truyền tối đa <strong>10mg/phút</strong> để tránh phản ứng dạng phản vệ, viêm tắc tĩnh mạch, Hội chứng Red man.
        Không nên trì hoãn việc truyền liều nạp. Có thể cân nhắc truyền liều duy trì vào 10h sáng và 10h tối nếu dùng 2 lần/ngày.
      </div>`;
      document.getElementById('vgn-regimen-content').innerHTML = regimenHTML;

      // Monitoring
      document.getElementById('vgn-monitoring-content').innerHTML = `
        <p style="font-size:13px; margin: 0 0 10px;">Lấy mẫu trough (trước liều) lần đầu vào <strong>Ngày 3 điều trị</strong>, không muộn hơn trước liều thứ 4 hoặc 5. Lấy mẫu trong vòng 1 giờ trước liều kế tiếp. Không trì hoãn liều khi chờ kết quả (trừ khi nghi ngờ độc tính). Theo dõi creatinine và chức năng thận hàng ngày.</p>
      `;
      const rows = target.max === 15
        ? [
            ['&lt;10 mg/L', 'Thấp', 'Có thể cần tăng liều — kiểm tra lại trước liều thứ 4 sau khi chỉnh'],
            ['10–15 mg/L', 'Đạt đích', 'Tiếp tục liều hiện tại nếu chức năng thận ổn định, kiểm tra lại sau 3 ngày'],
            ['&gt;15 mg/L', 'Cao', 'Cần chỉnh liều — hội chẩn Bác sĩ, không dùng liều tiếp theo trước khi hội chẩn'],
          ]
        : [
            ['&lt;15 mg/L', 'Thấp', 'Có thể cần tăng liều — kiểm tra lại trước liều thứ 4 sau khi chỉnh'],
            ['15–20 mg/L', 'Đạt đích', 'Tiếp tục liều hiện tại nếu chức năng thận ổn định, kiểm tra lại sau 3 ngày'],
            ['&gt;20 mg/L', 'Cao', 'Cần chỉnh liều — hội chẩn Bác sĩ, không dùng liều tiếp theo trước khi hội chẩn'],
          ];
      document.getElementById('vgn-interpret-table').innerHTML = `
        <thead><tr><th>Nồng độ trough</th><th>Đánh giá</th><th>Hướng xử trí</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody>
      `;

      // Calc detail
      document.getElementById('vgn-calc-detail').innerHTML = `
        <table class="vgn-table">
          <tbody>
            <tr><td>IBW</td><td>${this.fmt(crclResult.ibw)} kg</td></tr>
            <tr><td>AdjBW (nếu béo phì)</td><td>${crclResult.adjBW ? this.fmt(crclResult.adjBW) + ' kg' : 'Không áp dụng'}</td></tr>
            <tr><td>Cân nặng dùng tính CrCl</td><td>${this.fmt(crclResult.crclWeight)} kg</td></tr>
            <tr><td>CrCl (Cockcroft-Gault)</td><td>${this.fmt(crclResult.crcl,1)} mL/min</td></tr>
            <tr><td>SCr dùng để tính (quy đổi nội bộ)</td><td>${this.fmt(patient.scrUmolL,1)} µmol/L</td></tr>
          </tbody>
        </table>
      `;
      document.getElementById('vgn-method-note').innerHTML = `
        <strong>Phương pháp tính:</strong> Cockcroft-Gault, CrCl = N × (140−tuổi) × cân nặng / SCr(µmol/L), N=1.23 (nam)/1.04 (nữ).
        IBW: Nam 50 + 2,3×(inch trên 5 feet); Nữ 45,5 + 2,3×(inch trên 5 feet). AdjBW áp dụng nếu ABW ≥120% IBW.
        Liều duy trì dùng <strong>cân nặng thực tế</strong> (không dùng AdjBW).
        Đây là nomogram dùng đích <strong>trough</strong> — khác với module Bayesian AUC-guided đã có, áp dụng khi
        <strong>chưa có</strong> nồng độ đo được.<br>
        <span style="color:var(--T2)">⚠ Lưu ý: module này dùng <strong>cân nặng hiệu chỉnh</strong> (IBW/AdjBW) khi tính CrCl theo khuyến cáo GAPP — kết quả CrCl có thể khác với module "Chức năng thận CrCl/eGFR" (dùng cân nặng thực tế) ở bệnh nhân thừa cân/béo phì. Đây là chủ ý thiết kế, không phải sai số.</span>
      `;
    },

    calculateHD() {
      const weight = this.getVal('vgn-hd-weight');
      const hd = getHDRegimen(weight);

      const hero = document.getElementById('vgn-hero');
      hero.innerHTML = `
        <div class="vgn-hero-stat"><div class="vgn-hero-label">Cân nặng</div><div class="vgn-hero-value">${this.fmt(weight,0)}</div><div class="vgn-hero-sub">kg</div></div>
        <div class="vgn-hero-stat"><div class="vgn-hero-label">Đích trough (trước lọc máu)</div><div class="vgn-hero-value">15–20</div><div class="vgn-hero-sub">mg/L</div></div>
        <div class="vgn-hero-stat"><div class="vgn-hero-label">Liều mỗi lần lọc máu</div><div class="vgn-hero-value">${this.fmt(hd.maintenanceDose,0)}mg</div><div class="vgn-hero-sub">post-dialysis</div></div>
      `;

      document.getElementById('vgn-alerts').innerHTML = '';

      document.getElementById('vgn-regimen-content').innerHTML = `
        <div class="vgn-dose-block vgn-loading">
          <div class="vgn-dose-title">Liều nạp (bắt buộc để đạt nồng độ huyết tương đủ nhanh)</div>
          <div class="vgn-dose-value">${this.fmt(hd.loadingDose,0)} mg IV</div>
          <div class="vgn-dose-note">Theo bảng cân nặng GAPP (làm tròn 250mg).</div>
        </div>
        <div class="vgn-dose-block vgn-maintenance">
          <div class="vgn-dose-title">Liều duy trì</div>
          <div class="vgn-dose-value">${this.fmt(hd.maintenanceDose,0)} mg với mỗi lần lọc máu</div>
          <div class="vgn-dose-note">Truyền vào phần cuối buổi lọc máu (post-dialysis, infusion). Vancomycin đào thải 80–90% qua thận dạng không đổi, không bị loại bỏ đáng kể qua HD thông thường (loại bỏ tăng với HD luồng cao).</div>
        </div>
      `;

      document.getElementById('vgn-monitoring-content').innerHTML = `
        <p style="font-size:13px; margin: 0 0 10px;">Lấy mẫu trough trước lọc máu. Kiểm tra trough lần đầu trước liều thứ 2, sau đó mỗi tuần một lần. Không cần giữ liều khi chờ kết quả trừ khi nồng độ trước đó cao hoặc nghi ngờ độc tính.</p>
      `;
      document.getElementById('vgn-interpret-table').innerHTML = `
        <thead><tr><th>Nồng độ trough (trước lọc máu)</th><th>Đánh giá</th><th>Hướng xử trí</th></tr></thead>
        <tbody>
          <tr><td>&lt;15 mg/L</td><td>Thấp</td><td>Cân nhắc tăng liều — hội chẩn Bác sĩ hoặc Dược sĩ</td></tr>
          <tr><td>15–20 mg/L</td><td>Đạt đích</td><td>Tiếp tục liều hiện tại</td></tr>
          <tr><td>&gt;20 mg/L</td><td>Cao</td><td>Cần chỉnh liều — hội chẩn trước khi dùng liều kế tiếp</td></tr>
        </tbody>
      `;

      document.getElementById('vgn-calc-detail').innerHTML = `
        <table class="vgn-table">
          <tbody>
            <tr><td>Nhóm cân nặng</td><td>${weight < 50 ? '&lt;50kg' : weight < 70 ? '50–69kg' : weight <= 100 ? '70–100kg' : '&gt;100kg'}</td></tr>
            <tr><td>Liều duy trì theo bảng GAPP</td><td>${this.fmt(hd.maintenanceDose,0)} mg</td></tr>
          </tbody>
        </table>
      `;
      document.getElementById('vgn-method-note').innerHTML = `
        <strong>Phương pháp:</strong> Bảng liều cố định theo cân nặng cho bệnh nhân lọc máu chu kỳ (Intermittent Haemodialysis),
        giả định GFR &lt;10 mL/min.<br>
        <span style="color:var(--T2)">⚠ Lưu ý: các module tính CrCl trong tab GAPP dùng <strong>cân nặng hiệu chỉnh</strong> (IBW/AdjBW) — kết quả CrCl có thể khác với module "Chức năng thận CrCl/eGFR" (dùng cân nặng thực tế) ở bệnh nhân thừa cân/béo phì. Đây là chủ ý thiết kế, không phải sai số.</span>
      `;
    },

    reset() {
      this.setMode('normal');
      this.setRisk('standard');
      document.getElementById('vgn-age').value = '60';
      document.getElementById('vgn-height').value = '165';
      document.getElementById('vgn-weight').value = '65';
      document.getElementById('vgn-sex').value = 'male';
      document.getElementById('vgn-scr').value = '0.9';
      document.getElementById('vgn-hd-weight').value = '65';
      document.getElementById('vgn-want-loading').checked = false;
      if (this.scrUnit !== 'mgdl') this.toggleScrUnit('mgdl');
      const bw = document.getElementById('vgn-bw-info');
      if (bw) { bw.style.display='none'; bw.innerHTML=''; }
      document.getElementById('vgn-results').classList.remove('vgn-show');
    },
  };
  window.VGN = VGN;
})();



(function() {
  'use strict';

  /* =========================================================================
   * PHẦN LÕI THUẬT TOÁN — đã validate độc lập bằng Node.js (7/7 ca PASS)
   * Nguồn: AAC 2023 (doi:10.1128/aac.00172-23) cho prior CL/V + CV;
   *        ASHP/IDSA/PIDS/SIDP 2020 cho đích AUC 400-600;
   *        Residual error 10% proportional + 0.5 mg/L additive (chuẩn TDM ICU sim, Rybak 2020)
   * ========================================================================= */

  function calcIBW(heightCm, sex) {
    const heightIn = heightCm / 2.54;
    const base = sex === 'female' ? 45.5 : 50;
    if (heightIn <= 60) return base;
    return base + 2.3 * (heightIn - 60);
  }

  function calcAdjBW(actualWeightKg, ibwKg) {
    if (actualWeightKg > 1.2 * ibwKg) return ibwKg + 0.4 * (actualWeightKg - ibwKg);
    return null;
  }

  function calcCrCl({ ageYears, weightKg, heightCm, sex, scrMgDl }) {
    const ibw = calcIBW(heightCm, sex);
    const adjBW = calcAdjBW(weightKg, ibw);
    let dosingWeight;
    if (weightKg < ibw) dosingWeight = weightKg;
    else if (adjBW !== null) dosingWeight = adjBW;
    else dosingWeight = ibw; // quy tắc GAPP: IBW ≤ cân nặng thực < 1.2×IBW

    let crcl = ((140 - ageYears) * dosingWeight) / (72 * scrMgDl);
    if (sex === 'female') crcl *= 0.85;

    const bsa = 0.007184 * Math.pow(heightCm, 0.725) * Math.pow(weightKg, 0.425);
    const crclBsaAdj = crcl / (bsa / 1.73);
    let crclFinal = crcl;
    if (crclBsaAdj > 130) crclFinal = 130 * (bsa / 1.73);
    return { crcl: crclFinal, ibw, adjBW, dosingWeight, bsa };
  }

  function getPopulationPrior({ crcl, dosingWeight }) {
    const CLprior = 0.0474 * crcl + 0.942;
    const Vprior = 0.7 * dosingWeight;
    const CV = 0.3;
    return { CLprior, Vprior, omegaCL2: Math.pow(CLprior * CV, 2), omegaV2: Math.pow(Vprior * CV, 2), CV };
  }

  function predictConcentration(doses, CL, V, tObsH) {
    const Kel = CL / V;
    let total = 0;
    for (const dose of doses) {
      const { amountMg, startTimeH, infusionTimeH, intervalH, numDoses } = dose;
      if (!infusionTimeH || infusionTimeH <= 0) {
        throw new Error(`Thời gian truyền phải > 0, nhận được: ${infusionTimeH}`);
      }
      if (!amountMg || amountMg <= 0) {
        throw new Error(`Liều dùng phải > 0, nhận được: ${amountMg}`);
      }
      const rate = amountMg / infusionTimeH;
      for (let n = 0; n < numDoses; n++) {
        const doseStart = startTimeH + n * intervalH;
        const doseEnd = doseStart + infusionTimeH;
        if (tObsH < doseStart) continue;
        let conc;
        if (tObsH <= doseEnd) {
          const tInf = tObsH - doseStart;
          conc = (rate / CL) * (1 - Math.exp(-Kel * tInf));
        } else {
          const tPostInf = tObsH - doseEnd;
          const concEnd = (rate / CL) * (1 - Math.exp(-Kel * infusionTimeH));
          conc = concEnd * Math.exp(-Kel * tPostInf);
        }
        total += conc;
      }
    }
    return total;
  }

  function calcOFV(CL, V, prior, observations, doses) {
    const { CLprior, Vprior, omegaCL2, omegaV2 } = prior;
    let ofv = Math.pow(CL - CLprior, 2) / omegaCL2 + Math.pow(V - Vprior, 2) / omegaV2;
    for (const obs of observations) {
      const Cpred = predictConcentration(doses, CL, V, obs.timeH);
      const sigma2 = Math.pow(0.1 * Cpred, 2) + Math.pow(0.5, 2);
      ofv += Math.pow(obs.conc - Cpred, 2) / sigma2;
    }
    return ofv;
  }

  function gridSearchMAP(prior, observations, doses) {
    const { CLprior, Vprior } = prior;
    if (observations.length === 0) return { CL: CLprior, V: Vprior, ofv: 0 };

    const clMin = CLprior * 0.2, clMax = CLprior * 3.0;
    const vMin = Vprior * 0.5, vMax = Vprior * 2.0;
    const steps = 150;
    let best = { CL: CLprior, V: Vprior, ofv: Infinity };

    const clStep1 = (clMax - clMin) / steps;
    const vStep1 = (vMax - vMin) / steps;
    for (let i = 0; i <= steps; i++) {
      const CL = clMin + i * clStep1;
      for (let j = 0; j <= steps; j++) {
        const V = vMin + j * vStep1;
        const ofv = calcOFV(CL, V, prior, observations, doses);
        if (ofv < best.ofv) best = { CL, V, ofv };
      }
    }
    const clRange2 = clStep1 * 4, vRange2 = vStep1 * 4;
    const clMin2 = Math.max(clMin, best.CL - clRange2), clMax2 = Math.min(clMax, best.CL + clRange2);
    const vMin2 = Math.max(vMin, best.V - vRange2), vMax2 = Math.min(vMax, best.V + vRange2);
    const fineSteps = 150;
    const clStep2 = (clMax2 - clMin2) / fineSteps, vStep2 = (vMax2 - vMin2) / fineSteps;
    for (let i = 0; i <= fineSteps; i++) {
      const CL = clMin2 + i * clStep2;
      for (let j = 0; j <= fineSteps; j++) {
        const V = vMin2 + j * vStep2;
        const ofv = calcOFV(CL, V, prior, observations, doses);
        if (ofv < best.ofv) best = { CL, V, ofv };
      }
    }
    return best;
  }

  function calcAUC24(CL, dailyDoseMg) { return dailyDoseMg / CL; }

  function calcPeakTrough(CL, V, doseMg, infusionTimeH, intervalH) {
    const Kel = CL / V;
    const rate = doseMg / infusionTimeH;
    const factor = 1 / (1 - Math.exp(-Kel * intervalH));
    const concEndInfusion = (rate / CL) * (1 - Math.exp(-Kel * infusionTimeH)) * factor;
    const peak = concEndInfusion;
    const trough = peak * Math.exp(-Kel * (intervalH - infusionTimeH));
    return { peak, trough, Kel };
  }

  /* ============================= UI LOGIC ============================= */

  const VBM = {
    scrUnit: 'mgdl',
    levelCount: 0,
    chartInstance: null,

    toggleScrUnit(unit) {
      const input = document.getElementById('vbm-scr');
      const buttons = document.querySelectorAll('.vbm-unit-toggle button');
      let val = parseFloat(input.value);
      if (isNaN(val)) return;
      if (unit === 'umol' && this.scrUnit === 'mgdl') {
        val = Math.round(val * 88.4 * 100) / 100; // mg/dL -> µmol/L
        buttons.forEach(b => b.classList.toggle('active', b.dataset.unit === 'umol'));
      } else if (unit === 'mgdl' && this.scrUnit === 'umol') {
        val = Math.round((val / 88.4) * 100) / 100; // µmol/L -> mg/dL
        buttons.forEach(b => b.classList.toggle('active', b.dataset.unit === 'mgdl'));
      }
      input.value = val;
      this.scrUnit = unit;
    },

    checkRRT() {
      const checked = document.getElementById('vbm-renalreplace').checked;
      document.getElementById('vbm-rrt-alert').style.display = checked ? 'block' : 'none';
      document.getElementById('vbm-btn-calc').disabled = checked;
    },

    toggleBlock(id, show) {
      document.getElementById(id).style.display = show ? 'block' : 'none';
    },

    addLevel() {
      if (this.levelCount >= 2) return;
      this.levelCount++;
      const idx = this.levelCount;
      const container = document.getElementById('vbm-levels-container');
      const row = document.createElement('div');
      row.className = 'vbm-level-row';
      row.id = `vbm-level-row-${idx}`;
      row.innerHTML = `
        <div class="vbm-level-num">#${idx}</div>
        <div class="vbm-field"><label>Loại mẫu</label>
          <select id="vbm-level-type-${idx}">
            <option value="trough">Trough</option>
            <option value="peak">Peak</option>
            <option value="random">Bất kỳ thời điểm</option>
          </select>
        </div>
        <div class="vbm-field"><label>Nồng độ (mcg/mL)</label><input type="number" id="vbm-level-conc-${idx}" value="15" step="0.1"></div>
        <div class="vbm-field"><label>Giờ lấy mẫu (mốc t=0)</label><input type="number" id="vbm-level-time-${idx}" value="36" step="0.25"></div>
        <button type="button" class="vbm-btn-remove" onclick="VBM.removeLevel(${idx})">✕</button>
      `;
      container.appendChild(row);
      if (this.levelCount >= 2) document.getElementById('vbm-btn-add-level').style.display = 'none';
    },

    removeLevel(idx) {
      const row = document.getElementById(`vbm-level-row-${idx}`);
      if (row) row.remove();
      this.levelCount--;
      document.getElementById('vbm-btn-add-level').style.display = 'block';
    },

    getVal(id) { return parseFloat(document.getElementById(id).value); },

    buildDoseList() {
      const doses = [];
      if (document.getElementById('vbm-has-loading').checked) {
        doses.push({
          amountMg: this.getVal('vbm-load-dose'),
          infusionTimeH: this.getVal('vbm-load-inf'),
          startTimeH: this.getVal('vbm-load-start'),
          intervalH: 999999, // liều nạp không lặp
          numDoses: 1,
        });
      }
      doses.push({
        amountMg: this.getVal('vbm-maint-dose'),
        infusionTimeH: this.getVal('vbm-maint-inf'),
        startTimeH: this.getVal('vbm-maint-start'),
        intervalH: this.getVal('vbm-maint-interval'),
        numDoses: this.getVal('vbm-maint-numdoses'),
      });
      if (document.getElementById('vbm-has-extra').checked) {
        doses.push({
          amountMg: this.getVal('vbm-extra-dose'),
          infusionTimeH: this.getVal('vbm-extra-inf'),
          startTimeH: this.getVal('vbm-extra-time'),
          intervalH: 999999,
          numDoses: 1,
        });
      }
      return doses;
    },

    buildObservations() {
      const obs = [];
      for (let i = 1; i <= this.levelCount; i++) {
        const row = document.getElementById(`vbm-level-row-${i}`);
        if (!row) continue;
        obs.push({
          conc: this.getVal(`vbm-level-conc-${i}`),
          timeH: this.getVal(`vbm-level-time-${i}`),
        });
      }
      return obs;
    },

    fmt(n, d = 1) { return Number.isFinite(n) ? n.toFixed(d) : '—'; },

    aucBadge(auc) {
      if (auc < 400) return '<span class="vbm-badge vbm-badge-warn">Dưới đích</span>';
      if (auc > 600) return '<span class="vbm-badge vbm-badge-danger">Vượt đích (nguy cơ độc thận)</span>';
      return '<span class="vbm-badge vbm-badge-ok">Đạt đích 400–600</span>';
    },

    validateInputs(patient, doses) {
      const errors = [];
      if (!patient.ageYears || patient.ageYears < 18) errors.push('Tuổi phải ≥18 (công cụ chỉ dành cho người lớn).');
      if (!patient.weightKg || patient.weightKg <= 0) errors.push('Cân nặng phải > 0.');
      if (!patient.heightCm || patient.heightCm <= 0) errors.push('Chiều cao phải > 0.');
      if (!patient.scrMgDl || patient.scrMgDl <= 0) errors.push('Creatinine phải > 0.');
      doses.forEach((d, i) => {
        if (!d.amountMg || d.amountMg <= 0) errors.push(`Liều dùng ở mục ${i + 1} phải > 0.`);
        if (!d.infusionTimeH || d.infusionTimeH <= 0) errors.push(`Thời gian truyền ở mục ${i + 1} phải > 0 (không được để 0 hoặc trống).`);
      });
      return errors;
    },

    calculate() {
      const patient = {
        ageYears: this.getVal('vbm-age'),
        weightKg: this.getVal('vbm-weight'),
        heightCm: this.getVal('vbm-height'),
        sex: document.getElementById('vbm-sex').value,
        scrMgDl: this.scrUnit === 'mgdl' ? this.getVal('vbm-scr') : this.getVal('vbm-scr') / 88.4,
      };
      const mic = this.getVal('vbm-mic');
      const doses = this.buildDoseList();
      const observations = this.buildObservations();

      const inputErrors = this.validateInputs(patient, doses);
      if (inputErrors.length > 0) {
        alert('Vui lòng kiểm tra lại thông tin nhập:\n\n' + inputErrors.join('\n'));
        return;
      }

      let crclResult, prior, map;
      try {
        crclResult = calcCrCl(patient);
        prior = getPopulationPrior({ crcl: crclResult.crcl, dosingWeight: crclResult.dosingWeight });
        map = gridSearchMAP(prior, observations, doses);
      } catch (e) {
        alert('Lỗi tính toán: ' + e.message + '\n\nVui lòng kiểm tra lại các giá trị đã nhập (đặc biệt là liều dùng và thời gian truyền).');
        return;
      }

      // Hiển thị ghi chú cân nặng
      const bwInfo = document.getElementById('vbm-bw-info');
      bwInfo.style.display = 'block';
      bwInfo.innerHTML = `<strong>IBW</strong> = ${this.fmt(crclResult.ibw)} kg` +
        (crclResult.adjBW ? ` · <strong>AdjBW</strong> (dùng cho CrCl &amp; V) = ${this.fmt(crclResult.adjBW)} kg (BN béo phì, ABW &gt; 120% IBW)` : ` · Dùng cân nặng thực tế (${this.fmt(patient.weightKg)} kg) vì chưa vượt 120% IBW`) +
        ` · <strong>CrCl (Cockcroft-Gault)</strong> = ${this.fmt(crclResult.crcl)} mL/min`;

      // Phác đồ hiện tại: dùng liều duy trì hiện có để tính AUC/Peak/Trough hiện tại
      const maintDoseMg = this.getVal('vbm-maint-dose');
      const maintInterval = this.getVal('vbm-maint-interval');
      const maintInf = this.getVal('vbm-maint-inf');
      const currentTDD = maintDoseMg * (24 / maintInterval);
      const currentAUC = calcAUC24(map.CL, currentTDD);
      const currentPT = calcPeakTrough(map.CL, map.V, maintDoseMg, maintInf, maintInterval);

      // Tìm liều đề xuất tối ưu: thử các khoảng liều chuẩn, với mỗi khoảng tìm liều/lần để AUC≈500
      const candidateIntervals = [8, 12, 24, 36, 48];
      const targetAUC = 500;
      const comparisons = candidateIntervals.map(interval => {
        const tdd = targetAUC * map.CL; // TDD cần thiết để đạt AUC mục tiêu (không phụ thuộc khoảng liều)
        const dosePerAdmin = tdd * (interval / 24);
        const roundedDose = Math.round(dosePerAdmin / 250) * 250; // làm tròn theo bước 250mg
        const infTime = roundedDose > 1000 ? Math.max(1.5, roundedDose / 1000) : 1; // truyền chậm hơn nếu liều cao
        const pt = calcPeakTrough(map.CL, map.V, roundedDose, infTime, interval);
        const actualTDD = roundedDose * (24 / interval);
        const actualAUC = calcAUC24(map.CL, actualTDD);
        return { interval, dose: roundedDose, infTime, auc: actualAUC, peak: pt.peak, trough: pt.trough };
      });

      // Chọn phác đồ đề xuất: ưu tiên khoảng liều gần với khoảng hiện tại, AUC trong đích, trough không quá cao
      let recommended = comparisons.find(c => c.auc >= 400 && c.auc <= 600 && c.interval === maintInterval)
        || comparisons.find(c => c.auc >= 400 && c.auc <= 600)
        || comparisons.reduce((a, b) => Math.abs(a.auc - 500) < Math.abs(b.auc - 500) ? a : b);

      this.renderHero(map, currentAUC, recommended);
      this.renderSuggested(recommended, mic);
      this.renderCompareTable(comparisons, recommended, mic);
      this.renderKinetics(crclResult, prior, map, mic);
      this.renderChart(doses, map.CL, map.V, recommended);

      document.getElementById('vbm-results').classList.add('vbm-show');
      document.getElementById('vbm-placeholder').style.display = 'none';
    },

    renderHero(map, currentAUC, recommended) {
      const hero = document.getElementById('vbm-hero');
      hero.innerHTML = `
        <div class="vbm-hero-stat"><div class="vbm-hero-label">AUC₂₄ hiện tại</div><div class="vbm-hero-value">${this.fmt(currentAUC,0)}</div><div class="vbm-hero-sub">mg·h/L</div></div>
        <div class="vbm-hero-stat"><div class="vbm-hero-label">CL cá thể (MAP)</div><div class="vbm-hero-value">${this.fmt(map.CL,2)}</div><div class="vbm-hero-sub">L/h</div></div>
        <div class="vbm-hero-stat"><div class="vbm-hero-label">V cá thể (MAP)</div><div class="vbm-hero-value">${this.fmt(map.V,1)}</div><div class="vbm-hero-sub">L</div></div>
        <div class="vbm-hero-stat"><div class="vbm-hero-label">Phác đồ đề xuất</div><div class="vbm-hero-value">${this.fmt(recommended.dose,0)}mg</div><div class="vbm-hero-sub">mỗi ${recommended.interval}h</div></div>
      `;
    },

    renderSuggested(rec, mic) {
      const aucMic = rec.auc / mic;
      document.getElementById('vbm-suggested-content').innerHTML = `
        <div style="font-size:15px; font-weight:700; color:var(--ttt-accent-dark); margin-bottom:8px;">
          ${this.fmt(rec.dose,0)} mg, truyền trong ${this.fmt(rec.infTime,1)} giờ, mỗi ${rec.interval} giờ
        </div>
        <div style="display:flex; gap:18px; flex-wrap:wrap; font-size:13px; margin-bottom:10px;">
          <div>AUC₂₄/MIC dự đoán: <strong>${this.fmt(aucMic,0)}</strong> ${this.aucBadge(rec.auc)}</div>
          <div>Peak dự đoán: <strong>${this.fmt(rec.peak,1)}</strong> mcg/mL</div>
          <div>Trough dự đoán: <strong>${this.fmt(rec.trough,1)}</strong> mcg/mL</div>
        </div>
      `;
    },

    renderCompareTable(comparisons, recommended, mic) {
      const rows = comparisons.map(c => {
        const isRec = c.interval === recommended.interval && c.dose === recommended.dose;
        return `<tr class="${isRec ? 'vbm-row-recommended' : ''}">
          <td>${c.interval} giờ${isRec ? ' ⭐' : ''}</td>
          <td>${this.fmt(c.dose,0)} mg</td>
          <td>${this.fmt(c.infTime,1)} h</td>
          <td>${this.fmt(c.auc,0)}</td>
          <td>${this.fmt(c.auc/mic,0)}</td>
          <td>${this.fmt(c.peak,1)}</td>
          <td>${this.fmt(c.trough,1)}</td>
          <td>${this.aucBadge(c.auc)}</td>
        </tr>`;
      }).join('');
      document.getElementById('vbm-compare-table').innerHTML = `
        <thead><tr><th>Khoảng liều</th><th>Liều/lần</th><th>T.gian truyền</th><th>AUC₂₄</th><th>AUC/MIC</th><th>Peak</th><th>Trough</th><th>Đánh giá</th></tr></thead>
        <tbody>${rows}</tbody>
      `;
    },

    renderKinetics(crclResult, prior, map, mic) {
      const Kel = map.CL / map.V;
      const halfLife = Math.log(2) / Kel;
      document.getElementById('vbm-kinetic-grid').innerHTML = `
        <div class="vbm-kinetic-item"><div class="vbm-k-label">CrCl (Cockcroft-Gault)</div><div class="vbm-k-value">${this.fmt(crclResult.crcl,1)}</div></div>
        <div class="vbm-kinetic-item"><div class="vbm-k-label">Kel</div><div class="vbm-k-value">${this.fmt(Kel,4)} /h</div></div>
        <div class="vbm-kinetic-item"><div class="vbm-k-label">t½</div><div class="vbm-k-value">${this.fmt(halfLife,1)} h</div></div>
        <div class="vbm-kinetic-item"><div class="vbm-k-label">CL cá thể ± SD</div><div class="vbm-k-value">${this.fmt(map.CL,2)} L/h</div></div>
        <div class="vbm-kinetic-item"><div class="vbm-k-label">V cá thể ± SD</div><div class="vbm-k-value">${this.fmt(map.V,1)} L</div></div>
        <div class="vbm-kinetic-item"><div class="vbm-k-label">CL prior (dân số)</div><div class="vbm-k-value">${this.fmt(prior.CLprior,2)} L/h</div></div>
        <div class="vbm-kinetic-item"><div class="vbm-k-label">V prior (dân số)</div><div class="vbm-k-value">${this.fmt(prior.Vprior,1)} L</div></div>
        <div class="vbm-kinetic-item"><div class="vbm-k-label">MIC</div><div class="vbm-k-value">${this.fmt(mic,2)} mcg/mL</div></div>
      `;
      document.getElementById('vbm-method-note').innerHTML = `
        <strong>Phương pháp tính:</strong> Bayesian MAP estimation, mô hình 1 khoang (1-compartment, linear elimination).<br>
        <strong>Prior dân số</strong> (đúng nguyên bản): CL = 0,0474×CrCl + 0,942 (L/h); V = 0,7×cân nặng hiệu chỉnh (L); CV = 30%
        cho cả CL và V (nguồn: Salehpour et al., <em>Antimicrob Agents Chemother</em> 2023, doi:10.1128/aac.00172-23).<br>
        <strong>⚠ Phương pháp giải MAP</strong> (biến thể mở rộng, KHÁC bài báo gốc): bài báo AAC 2023 dùng 1 nồng độ duy nhất
        coi là giá trị đúng tuyệt đối (không có sai số đo lường). Module này dùng biến thể có thêm sai số đo lường
        (10% nhân + 0,5 mcg/mL cộng) và cho phép 1-2 nồng độ đồng thời — gần với phương pháp Sheiner &amp; Beal 1982 hơn,
        phổ biến trong các phần mềm Bayesian TDM khác. Giải bằng grid search 2D (2 vòng: thô → tinh chỉnh), không dùng
        gradient descent — đảm bảo kết quả tất định, kiểm định được.<br>
        Đích điều trị AUC₂₄/MIC 400–600 mg·h/L theo khuyến cáo ASHP/IDSA/PIDS/SIDP 2020.<br>
        <span style="color:var(--T2)">⚠ Lưu ý: module này dùng <strong>cân nặng hiệu chỉnh</strong> (IBW/AdjBW) khi tính CrCl — kết quả CrCl có thể khác với module "Chức năng thận CrCl/eGFR" (dùng cân nặng thực tế) ở bệnh nhân thừa cân/béo phì. Đây là chủ ý thiết kế, không phải sai số.</span>
      `;
    },

    renderChart(doses, CL, V, recommended) {
      const tMax = 72;
      const step = 0.25;
      const labels = [];
      const dataCurrent = [];

      // Đường cong dựa trên phác đồ duy trì hiện tại (doses đã nhập) + CL/V cá thể MAP
      for (let t = 0; t <= tMax; t += step) {
        labels.push(t);
        dataCurrent.push(predictConcentration(doses, CL, V, t));
      }

      // Đường cong dựa trên phác đồ đề xuất (mô phỏng riêng từ t=0, ổn định sau vài liều)
      const recDoses = [{ amountMg: recommended.dose, infusionTimeH: recommended.infTime, startTimeH: 0, intervalH: recommended.interval, numDoses: Math.ceil(tMax / recommended.interval) + 1 }];
      const dataRecommended = labels.map(t => predictConcentration(recDoses, CL, V, t));

      const ctx = document.getElementById('vbm-chart').getContext('2d');
      if (this.chartInstance) this.chartInstance.destroy();
      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Phác đồ hiện tại (nhập tay)', data: dataCurrent, borderColor: '#8a8a8a', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, tension: 0.15 },
            { label: 'Phác đồ đề xuất', data: dataRecommended, borderColor: '#0d6e6e', backgroundColor: 'rgba(13,110,110,0.08)', borderWidth: 2.2, pointRadius: 0, tension: 0.15, fill: true },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { title: { display: true, text: 'Thời gian (giờ)' }, ticks: { maxTicksLimit: 12 } },
            y: { title: { display: true, text: 'Nồng độ (mcg/mL)' }, beginAtZero: true },
          },
          plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        },
      });
    },

    reset() {
      ['vbm-age','vbm-height','vbm-weight','vbm-scr'].forEach((id,i) => {
        const d = document.getElementById(id);
        if (d) d.value = ['60','165','65','0.9'][i];
      });
      if (this.scrUnit !== 'mgdl') this.toggleScrUnit('mgdl');
      document.getElementById('vbm-renalreplace').checked = false;
      document.getElementById('vbm-rrt-alert').style.display = 'none';
      document.getElementById('vbm-has-loading').checked = false;
      this.toggleBlock('vbm-loading-block', false);
      document.getElementById('vbm-maint-dose').value = '1000';
      document.getElementById('vbm-maint-interval').value = '12';
      document.getElementById('vbm-maint-inf').value = '1';
      document.getElementById('vbm-maint-start').value = '0';
      document.getElementById('vbm-maint-numdoses').value = '4';
      document.getElementById('vbm-has-extra').checked = false;
      this.toggleBlock('vbm-extra-block', false);
      document.getElementById('vbm-mic').value = '1.0';
      document.getElementById('vbm-levels-container').innerHTML = '';
      this.levelCount = 0; this.addLevel();
      document.getElementById('vbm-results').classList.remove('vbm-show');
      document.getElementById('vbm-placeholder').style.display = 'block';
      const bw = document.getElementById('vbm-bw-info');
      if (bw) { bw.style.display='none'; bw.innerHTML=''; }
    },
  };
  window.VBM = VBM;
  // KHÔNG dùng document.addEventListener('DOMContentLoaded', ...) ở đây.
  // Lý do: khi module này được nhúng vào app TOOLPHARMACY chính (nested HTML),
  // DOMContentLoaded của trang chính có thể đã fire xong trước khi script này
  // được chèn vào DOM, khiến listener không bao giờ được gọi (bug đã từng gặp
  // với AcCtrl() trong module autocomplete trước đây). Gọi trực tiếp init() ngay
  // vì script này luôn nằm sau các phần tử HTML nó cần (#vbm-levels-container).
  function vbmInit() {
    VBM.addLevel(); // mặc định có sẵn 1 ô nhập nồng độ
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', vbmInit, { once: true });
  } else {
    vbmInit();
  }
})();

/* ===== ICU Infusion Rate Module ===== */
(function () {
  'use strict';

  /* =========================================================================
   * DATA — đối chiếu Dược thư Quốc gia VN 2023, Lexicomp, SSC 2026, PADIS 2018
   * Tất cả giá trị liều đã được kiểm tra chéo với ít nhất 2 nguồn.
   * ========================================================================= */

  const DRUG_DB = [
    {
      id: 'norepinephrine',
      name: 'Norepinephrine',
      nameVI: 'Norepinephrine (Noradrenaline)',
      cls: 'Vận mạch',
      icon: '🔴',
      clsColor: '#9e1c1c', clsBg: '#fde8e6',
      iconBg: '#fde8e6',
      weightBased: true,
      unitDefault: 'mcg/kg/min',
      units: ['mcg/kg/min'],
      defaultAmtValue: 8,
      defaultAmtUnit: 'mg',
      volOpts: [50, 100, 250, 500],
      defaultVol: 250,
      commonConcs: [
        { amt: 4, vol: 250, label: '4 mg/250 mL = 16 mcg/mL' },
        { amt: 8, vol: 250, label: '8 mg/250 mL = 32 mcg/mL (thông dụng)' },
        { amt: 16, vol: 250, label: '16 mg/250 mL = 64 mcg/mL (hạn chế dịch truyền)' },
      ],
      doseMin: 0.01, doseMax: 1.0, doseStep: 0.01, doseDefault: 0.1,
      quickDoses: [0.02, 0.05, 0.1, 0.2, 0.3, 0.5],
      refDoses: [
        { doseVal: 0.02, label: 'Khởi đầu', risk: 'ok', note: '0.02–0.05 mcg/kg/min — liều nạp ban đầu' },
        { doseVal: 0.05, label: 'Thấp', risk: 'ok', note: '0.05–0.1 mcg/kg/min — duy trì thông thường' },
        { doseVal: 0.1,  label: 'Trung bình', risk: 'ok', note: '0.1–0.3 mcg/kg/min — septic shock điển hình' },
        { doseVal: 0.3,  label: 'Cao', risk: 'warning', note: '0.3–0.5 mcg/kg/min — xem xét thêm vasopressin' },
        { doseVal: 0.5,  label: 'Rất cao', risk: 'warning', note: '> 0.5 mcg/kg/min — shock kháng trị, thêm corticoid, thêm thuốc' },
        { doseVal: 1.0,  label: 'Tối đa ghi nhận', risk: 'danger', note: '> 1 mcg/kg/min — liều cứu nguy, nguy cơ thiếu máu mô cực cao' },
      ],
      clinicalNote: `<strong>Chỉ định:</strong> Shock nhiễm khuẩn (first-line, SSC 2026), shock phân bố, hỗ trợ huyết áp.<br>
<strong>Pha chế:</strong> Dùng D5W (bảo vệ chống oxy hóa). NaCl 0.9% chấp nhận được nhưng không tối ưu. Ổn định 24h ở nhiệt độ phòng.<br>
<strong>Đường truyền:</strong> Ưu tiên TM trung tâm. SSC 2026 cho phép khởi đầu qua TM ngoại biên, sau đó chuyển trung tâm ngay khi có thể — theo dõi sát vị trí tiêm để phát hiện thoát mạch.<br>
<strong>Mục tiêu huyết áp trung bình (HATB):</strong> ≥ 65 mmHg (chung); 60–65 mmHg ở BN ≥ 65 tuổi (SSC 2026, conditional).<br>
<strong>Thoát mạch:</strong> Điều trị phentolamine 5–10 mg pha 10 mL NaCl 0.9%, tiêm dưới da quanh vùng thoát mạch.<br>
<strong>Lưu ý:</strong> Dùng cân nặng thực tế.`,
    },

    {
      id: 'epinephrine',
      name: 'Epinephrine',
      nameVI: 'Epinephrine (Adrenaline)',
      cls: 'Vận mạch / Tăng co bóp',
      icon: '🟠',
      clsColor: '#7a3a00', clsBg: '#fff0e6',
      iconBg: '#fff0e6',
      weightBased: true,
      unitDefault: 'mcg/kg/min',
      units: ['mcg/kg/min'],
      defaultAmtValue: 4,
      defaultAmtUnit: 'mg',
      volOpts: [50, 100, 250, 500],
      defaultVol: 250,
      commonConcs: [
        { amt: 4, vol: 250, label: '4 mg/250 mL = 16 mcg/mL' },
        { amt: 8, vol: 250, label: '8 mg/250 mL = 32 mcg/mL' },
      ],
      doseMin: 0.01, doseMax: 0.5, doseStep: 0.01, doseDefault: 0.05,
      quickDoses: [0.01, 0.05, 0.1, 0.2, 0.3, 0.5],
      refDoses: [
        { doseVal: 0.01, label: 'Rất thấp (β ưu thế)', risk: 'ok', note: '0.01–0.05 mcg/kg/min: tăng co bóp, giãn mạch nhẹ' },
        { doseVal: 0.05, label: 'Thấp', risk: 'ok', note: '0.05–0.1 mcg/kg/min: phản vệ, shock tim nhẹ' },
        { doseVal: 0.1,  label: 'Trung bình (α+β)', risk: 'warning', note: '0.1–0.3 mcg/kg/min: shock tim nặng, nguy cơ loạn nhịp' },
        { doseVal: 0.3,  label: 'Cao', risk: 'warning', note: '0.3–0.5 mcg/kg/min: shock kháng trị, theo dõi sát ECG' },
        { doseVal: 0.5,  label: 'Tối đa thường dùng', risk: 'danger', note: '> 0.5 mcg/kg/min: nguy cơ loạn nhịp, thiếu máu tạng cao' },
      ],
      clinicalNote: `<strong>Chỉ định:</strong> Shock phản vệ (first-line), shock tim cung lượng thấp, ngừng tim (IV/IO), phối hợp shock nhiễm khuẩn kháng trị.<br>
<strong>Cơ chế liều:</strong> Liều thấp (0.01–0.1 mcg/kg/min): β1,β2 ưu thế → tăng co bóp + giãn mạch nhẹ. Liều cao (> 0.2 mcg/kg/min): α ưu thế → co mạch mạnh.<br>
<strong>Pha chế:</strong> D5W hoặc NaCl 0.9%. Tránh ánh sáng, sử dụng trong 24h.<br>
<strong>Theo dõi:</strong> ECG liên tục (nguy cơ VT/VF); lactate (thiếu máu mạc treo); đường huyết (glycogenolysis).<br>
<strong>Phản vệ:</strong> Liều IM cấp cứu: 0.3–0.5 mg (1:1000), bắp đùi ngoài — sau đó IV nếu cần.`,
    },

    {
      id: 'dopamine',
      name: 'Dopamine',
      nameVI: 'Dopamine',
      cls: 'Vận mạch / Tăng co bóp',
      icon: '🟡',
      clsColor: '#6b5000', clsBg: '#fef9ec',
      iconBg: '#fef9ec',
      weightBased: true,
      unitDefault: 'mcg/kg/min',
      units: ['mcg/kg/min'],
      defaultAmtValue: 400,
      defaultAmtUnit: 'mg',
      volOpts: [100, 250, 500],
      defaultVol: 250,
      commonConcs: [
        { amt: 200, vol: 250, label: '200 mg/250 mL = 800 mcg/mL' },
        { amt: 400, vol: 250, label: '400 mg/250 mL = 1600 mcg/mL (thông dụng)' },
        { amt: 400, vol: 500, label: '400 mg/500 mL = 800 mcg/mL' },
      ],
      doseMin: 1, doseMax: 20, doseStep: 0.5, doseDefault: 5,
      quickDoses: [2, 5, 10, 15, 20],
      refDoses: [
        { doseVal: 2,  label: 'Liều thận (dopaminergic)', risk: 'ok', note: '1–3 mcg/kg/min: DA1 ưu thế, giãn mạch thận/mạc treo. LƯU Ý: không còn được khuyến cáo bảo vệ thận.' },
        { doseVal: 5,  label: 'Liều tim (β1 ưu thế)', risk: 'ok', note: '3–10 mcg/kg/min: tăng co bóp, tăng nhịp tim, tăng cung lượng tim' },
        { doseVal: 10, label: 'Liều vận mạch (α ưu thế)', risk: 'warning', note: '10–20 mcg/kg/min: co mạch ngoại biên mạnh, tăng sức cản mạch ngoại biên (SVR)' },
        { doseVal: 15, label: 'Cao', risk: 'warning', note: '15–20 mcg/kg/min: nguy cơ loạn nhịp tăng rõ rệt' },
        { doseVal: 20, label: 'Tối đa', risk: 'danger', note: '> 20 mcg/kg/min: hiếm khi dùng vì nguy cơ loạn nhịp cao, ưu tiên thay bằng norepinephrine' },
      ],
      clinicalNote: `<strong>Lưu ý SSC 2021/2026:</strong> Không còn là lựa chọn ưu tiên — nguy cơ loạn nhịp tim cao hơn norepinephrine (De Backer et al., NEJM 2010). Chỉ dùng khi không có norepinephrine hoặc nhịp tim chậm kèm cung lượng thấp.<br>
<strong>"Liều thận":</strong> Đã bị bác bỏ — không cải thiện kết cục thận ở bệnh nhân nặng.<br>
<strong>Pha chế:</strong> D5W hoặc NaCl 0.9%. Dung dịch 800 mcg/mL hoặc 1600 mcg/mL. Ổn định 24h.<br>
<strong>Theo dõi:</strong> ECG (loạn nhịp), huyết áp động mạch xâm lấn, mê giảm đau phù hợp.`,
    },

    {
      id: 'dobutamine',
      name: 'Dobutamine',
      nameVI: 'Dobutamine',
      cls: 'Thuốc tăng co bóp',
      icon: '🟢',
      clsColor: '#1d5c1d', clsBg: '#e8f5ee',
      iconBg: '#e8f5ee',
      weightBased: true,
      unitDefault: 'mcg/kg/min',
      units: ['mcg/kg/min'],
      defaultAmtValue: 250,
      defaultAmtUnit: 'mg',
      volOpts: [100, 250, 500],
      defaultVol: 250,
      commonConcs: [
        { amt: 250, vol: 250, label: '250 mg/250 mL = 1000 mcg/mL' },
        { amt: 500, vol: 250, label: '500 mg/250 mL = 2000 mcg/mL' },
      ],
      doseMin: 1, doseMax: 25, doseStep: 0.5, doseDefault: 5,
      quickDoses: [2, 5, 10, 15, 20],
      refDoses: [
        { doseVal: 2,  label: 'Liều thấp', risk: 'ok', note: '2–5 mcg/kg/min: tăng co bóp nhẹ, cải thiện cung lượng tim' },
        { doseVal: 5,  label: 'Trung bình', risk: 'ok', note: '5–10 mcg/kg/min: suy tim nặng, sốc tim' },
        { doseVal: 10, label: 'Cao', risk: 'warning', note: '10–20 mcg/kg/min: nguy cơ tụt HA (giãn mạch), loạn nhịp' },
        { doseVal: 20, label: 'Rất cao', risk: 'danger', note: '> 20 mcg/kg/min: không khuyến cáo — tăng nguy cơ loạn nhịp mà không tăng thêm lợi ích' },
      ],
      clinicalNote: `<strong>Chỉ định:</strong> Suy tim nặng/sốc tim có cung lượng thấp (CO thấp, sức cản mạch ngoại biên cao (SVR cao)). Phối hợp với thuốc vận mạch khi cần nâng huyết áp.<br>
<strong>Cơ chế:</strong> β1 ưu thế → tăng co bóp + tăng nhịp tim. Giãn mạch ngoại biên (β2) → có thể gây tụt HA ở BN có SVR thấp sẵn.<br>
<strong>Không dùng:</strong> Shock nhiễm khuẩn đơn thuần (tăng co bóp không có lợi nếu CO đã bình thường).<br>
<strong>Pha chế:</strong> D5W hoặc NaCl 0.9%. Ổn định 24h. Tránh kiềm mạnh (pH > 7.5).<br>
<strong>Theo dõi:</strong> CO/CI (Swan-Ganz hoặc PICCO), ECG (nhịp nhanh xoang, AF), HA, SpO2.`,
    },

    {
      id: 'vasopressin',
      name: 'Vasopressin',
      nameVI: 'Vasopressin (ADH)',
      cls: 'Vận mạch',
      icon: '🔵',
      clsColor: '#1a4a7a', clsBg: '#e8f1fb',
      iconBg: '#e8f1fb',
      weightBased: false,
      unitDefault: 'units/min',
      units: ['units/min'],
      defaultAmtValue: 20,
      defaultAmtUnit: 'units',
      volOpts: [50, 100, 250],
      defaultVol: 100,
      commonConcs: [
        { amt: 20, vol: 100, label: '20 units/100 mL = 0.2 units/mL (thông dụng)' },
        { amt: 40, vol: 100, label: '40 units/100 mL = 0.4 units/mL (nồng độ gấp đôi)' },
      ],
      doseMin: 0.01, doseMax: 0.07, doseStep: 0.01, doseDefault: 0.03,
      quickDoses: [0.01, 0.02, 0.03, 0.04, 0.07],
      refDoses: [
        { doseVal: 0.01, label: 'Thấp', risk: 'ok', note: '0.01–0.02 units/min: liều phối hợp catecholamine thấp' },
        { doseVal: 0.03, label: 'Chuẩn (SSC 2021)', risk: 'ok', note: '0.03 units/min: liều tiêu chuẩn — GIỮ CỐ ĐỊNH, không chuẩn độ' },
        { doseVal: 0.04, label: 'Tối đa thường dùng', risk: 'warning', note: '0.04 units/min: giới hạn trên thường được khuyến cáo' },
        { doseVal: 0.07, label: 'Tối đa tuyệt đối', risk: 'danger', note: '> 0.04–0.07 units/min: nguy cơ thiếu máu mạc treo, hoại tử chi, nhồi máu cơ tim' },
      ],
      clinicalNote: `<strong>Chỉ định:</strong> Phối hợp với norepinephrine trong septic shock (tiết kiệm catecholamine) — mục tiêu giảm liều norepi, không phải tăng huyết áp trung bình thêm.<br>
<strong>Liều cố định:</strong> KHÔNG chuẩn độ theo huyết áp trung bình (HATB). Giữ cố định 0.03 units/min, điều chỉnh norepinephrine theo đáp ứng.<br>
<strong>Pha chế:</strong> D5W hoặc NaCl 0.9%. Dung dịch 0.2 units/mL (20 units/100 mL) hoặc 0.4 units/mL. Ổn định 24h ở nhiệt độ phòng.<br>
<strong>Không phụ thuộc cân nặng:</strong> liều tính theo units/min (không /kg).<br>
<strong>Tác dụng phụ:</strong> Thiếu máu mạc treo/chi (liều cao), giảm tiểu cầu, co mạch vành, giảm natri máu.`,
    },

    {
      id: 'propofol',
      name: 'Propofol',
      nameVI: 'Propofol',
      cls: 'An thần ICU',
      icon: '🟤',
      clsColor: '#4a3300', clsBg: '#f5f0e6',
      iconBg: '#f5f0e6',
      weightBased: true,
      unitDefault: 'mcg/kg/min',
      units: ['mcg/kg/min', 'mg/kg/h'],
      defaultAmtValue: 500,
      defaultAmtUnit: 'mg',
      volOpts: [50, 100, 200, 500],
      defaultVol: 50,
      commonConcs: [
        { amt: 500, vol: 50, label: '500 mg/50 mL = 10 mg/mL (1%, nguyên lọ)' },
        { amt: 1000, vol: 100, label: '1000 mg/100 mL = 10 mg/mL (1%, không pha loãng)' },
        { amt: 200, vol: 100, label: '200 mg/100 mL = 2 mg/mL (2%, hạn chế dịch)' },
      ],
      doseMin: 5, doseMax: 100, doseStep: 5, doseDefault: 20,
      quickDoses: [5, 10, 20, 30, 50, 67],
      refDoses: [
        { doseVal: 5,  label: 'Khởi đầu thấp', risk: 'ok', note: '5–10 mcg/kg/min (0.3–0.6 mg/kg/h): RASS -1 đến 0, duy trì tỉnh nhẹ' },
        { doseVal: 10, label: 'An thần nhẹ', risk: 'ok', note: '10–20 mcg/kg/min (0.6–1.2 mg/kg/h): RASS -1 đến -2' },
        { doseVal: 20, label: 'An thần vừa', risk: 'ok', note: '20–33 mcg/kg/min (1.2–2 mg/kg/h): RASS -2 đến -3' },
        { doseVal: 33, label: 'An thần sâu', risk: 'warning', note: '33–50 mcg/kg/min (2–3 mg/kg/h): RASS -4, thở máy sâu' },
        { doseVal: 50, label: 'Cao — nguy cơ PRIS', risk: 'warning', note: '> 50 mcg/kg/min (3 mg/kg/h): nguy cơ tăng rõ rệt, hạn chế < 48h' },
        { doseVal: 67, label: 'Giới hạn tuyệt đối', risk: 'danger', note: '> 67 mcg/kg/min (4 mg/kg/h): nguy cơ Hội chứng ngộ độc Propofol (PRIS) cao — hội chứng toan chuyển hóa, rhabdomyolysis, suy tim, tử vong' },
      ],
      clinicalNote: `<strong>PRIS – Hội chứng ngộ độc Propofol:</strong> Nguy cơ tăng khi liều > 4 mg/kg/h (67 mcg/kg/min) và/hoặc truyền > 48h. Theo dõi: pH, lactate, CK, TG, men tim mỗi 12–24h ở liều cao.<br>
<strong>Cung cấp năng lượng:</strong> 1% propofol = 1.1 kcal/mL (từ lipid intralipid 10%). Phải tính vào tổng năng lượng nuôi dưỡng.<br>
<strong>Pha chế:</strong> Không pha loãng dưới 2 mg/mL. Không dùng chung đường với máu/huyết thanh. Lắc nhẹ trước dùng. Thay dây và chai mỗi 12h (vi khuẩn phát triển trong lipid).<br>
<strong>Chuyển đổi đơn vị:</strong> mcg/kg/min × 0.06 = mg/kg/h. Ví dụ: 33 mcg/kg/min = 2 mg/kg/h.`,
    },

    {
      id: 'fentanyl',
      name: 'Fentanyl',
      nameVI: 'Fentanyl',
      cls: 'Giảm đau ICU',
      icon: '🟣',
      clsColor: '#3d1a7a', clsBg: '#f0ebfc',
      iconBg: '#f0ebfc',
      weightBased: true,
      unitDefault: 'mcg/kg/h',
      units: ['mcg/kg/h', 'mcg/h'],
      defaultAmtValue: 0.5,
      defaultAmtUnit: 'mg',
      volOpts: [50, 100, 250],
      defaultVol: 50,
      commonConcs: [
        { amt: 0.5, vol: 50, label: '0.5 mg (500 mcg)/50 mL = 10 mcg/mL' },
        { amt: 1, vol: 100, label: '1 mg (1000 mcg)/100 mL = 10 mcg/mL' },
        { amt: 2.5, vol: 250, label: '2.5 mg (2500 mcg)/250 mL = 10 mcg/mL' },
      ],
      doseMin: 0.25, doseMax: 6, doseStep: 0.25, doseDefault: 1,
      quickDoses: [0.5, 1, 1.5, 2, 3, 4],
      refDoses: [
        { doseVal: 0.5,  label: 'Giảm đau nhẹ', risk: 'ok', note: '0.25–0.5 mcg/kg/h: NRS/CPOT thấp, phối hợp đa mô thức' },
        { doseVal: 1,    label: 'Giảm đau vừa', risk: 'ok', note: '0.5–1.5 mcg/kg/h: đau vừa khi thở máy' },
        { doseVal: 2,    label: 'Giảm đau nặng', risk: 'ok', note: '1.5–2 mcg/kg/h: thủ thuật, đau hậu phẫu' },
        { doseVal: 3,    label: 'Liều cao', risk: 'warning', note: '2–4 mcg/kg/h: phối hợp an thần, chú ý tích lũy' },
        { doseVal: 4,    label: 'Rất cao', risk: 'warning', note: '> 4 mcg/kg/h: nguy cơ tích lũy, kéo dài thời gian thức tỉnh' },
        { doseVal: 6,    label: 'Tối đa', risk: 'danger', note: '> 6 mcg/kg/h: chỉ dùng trong tình huống đặc biệt, theo dõi sát' },
      ],
      clinicalNote: `<strong>Ưu điểm ICU:</strong> Ít ảnh hưởng huyết động, không giải phóng histamine (khác morphine), tiềm lực mạnh (100× morphine). Lựa chọn ưu tiên cho BN không ổn định huyết động.<br>
<strong>Tích lũy:</strong> Lipophilic → phân bố rộng vào mô mỡ → tích lũy khi dùng kéo dài, đặc biệt BN béo phì/suy gan. T1/2 hiệu lực có thể tăng nhiều lần sau 24–48h truyền liên tục.<br>
<strong>Pha chế:</strong> NaCl 0.9% (tương thích tốt nhất), D5W. Nồng độ chuẩn 10 mcg/mL. Ổn định 7 ngày nhiệt độ phòng, tránh ánh sáng.<br>
<strong>Bolus giảm đau:</strong> 25–100 mcg IV chậm (2–5 phút) theo NRS/CPOT. Naloxone sẵn sàng.`,
    },

    {
      id: 'morphine',
      name: 'Morphine',
      nameVI: 'Morphine',
      cls: 'Giảm đau ICU',
      icon: '🟣',
      clsColor: '#3d1a7a', clsBg: '#f0ebfc',
      iconBg: '#f0ebfc',
      weightBased: false,
      unitDefault: 'mg/h',
      units: ['mg/h'],
      defaultAmtValue: 50,
      defaultAmtUnit: 'mg',
      volOpts: [50, 100, 250],
      defaultVol: 50,
      commonConcs: [
        { amt: 50, vol: 50, label: '50 mg/50 mL = 1 mg/mL (thông dụng)' },
        { amt: 100, vol: 100, label: '100 mg/100 mL = 1 mg/mL' },
      ],
      doseMin: 0.5, doseMax: 20, doseStep: 0.5, doseDefault: 2,
      quickDoses: [1, 2, 4, 6, 8, 10],
      refDoses: [
        { doseVal: 1,  label: 'Giảm đau nhẹ', risk: 'ok', note: '1–2 mg/h: đau nhẹ–vừa, theo dõi huyết động' },
        { doseVal: 2,  label: 'Giảm đau vừa', risk: 'ok', note: '2–4 mg/h: đau vừa, sau phẫu thuật' },
        { doseVal: 5,  label: 'Giảm đau nặng', risk: 'warning', note: '4–8 mg/h: đau nặng, kết hợp an thần' },
        { doseVal: 10, label: 'Cao', risk: 'warning', note: '8–10 mg/h: giám sát hô hấp chặt chẽ' },
        { doseVal: 15, label: 'Rất cao', risk: 'danger', note: '> 10 mg/h: nguy cơ ức chế hô hấp, suy hô hấp. Naloxone sẵn sàng.' },
      ],
      clinicalNote: `<strong>Hạn chế trong ICU:</strong> Giải phóng histamine → tụt HA, co thắt phế quản (tránh trong hen/COPD nặng). Chất chuyển hóa hoạt tính (morphine-6-glucuronide) tích lũy trong suy thận → an thần kéo dài.<br>
<strong>Tương tác:</strong> Nguy cơ cao khi phối hợp benzodiazepin, propofol, hoặc rượu → ức chế hô hấp, tử vong (FDA Black Box Warning).<br>
<strong>Pha chế:</strong> NaCl 0.9% hoặc D5W. Nồng độ chuẩn: 1 mg/mL. Ổn định 24h.<br>
<strong>Đảo ngược:</strong> Naloxone 0.1–0.4 mg IV, có thể lặp lại mỗi 2–3 phút. Thời gian tác dụng naloxone ngắn hơn morphine — theo dõi tái ức chế hô hấp.`,
    },

    {
      id: 'midazolam',
      name: 'Midazolam',
      nameVI: 'Midazolam',
      cls: 'An thần ICU',
      icon: '🟤',
      clsColor: '#4a3300', clsBg: '#f5f0e6',
      iconBg: '#f5f0e6',
      weightBased: false,
      unitDefault: 'mg/h',
      units: ['mg/h'],
      defaultAmtValue: 50,
      defaultAmtUnit: 'mg',
      volOpts: [50, 100, 250],
      defaultVol: 50,
      commonConcs: [
        { amt: 50, vol: 50, label: '50 mg/50 mL = 1 mg/mL (thông dụng)' },
        { amt: 100, vol: 100, label: '100 mg/100 mL = 1 mg/mL' },
        { amt: 150, vol: 50, label: '150 mg/50 mL = 3 mg/mL (nồng độ cao, hạn chế dịch)' },
      ],
      doseMin: 0.5, doseMax: 30, doseStep: 0.5, doseDefault: 2,
      quickDoses: [1, 2, 5, 10, 15],
      refDoses: [
        { doseVal: 1,  label: 'An thần nhẹ (RASS -1)', risk: 'ok', note: '1–2 mg/h: duy trì nhẹ, có thể hợp tác' },
        { doseVal: 2,  label: 'An thần vừa (RASS -2)', risk: 'ok', note: '2–5 mg/h: thở máy đồng bộ' },
        { doseVal: 5,  label: 'An thần sâu (RASS -3/-4)', risk: 'warning', note: '5–15 mg/h: cẩn thận tích lũy nếu > 48h' },
        { doseVal: 15, label: 'Cao — tích lũy rõ rệt', risk: 'warning', note: '15–20 mg/h: kéo dài thời gian thở máy, thức tỉnh chậm' },
        { doseVal: 20, label: 'Rất cao', risk: 'danger', note: '> 20 mg/h: nguy cơ an thần kéo dài, lú lẫn cấp (delirium), hội chứng cai thuốc' },
      ],
      clinicalNote: `<strong>Lưu ý PADIS 2018:</strong> Không khuyến cáo ưu tiên cho an thần ICU kéo dài — propofol hoặc dexmedetomidine được ưu tiên hơn do kéo dài thời gian thở máy và thức tỉnh ít hơn.<br>
<strong>Tích lũy:</strong> Chất chuyển hóa hoạt tính (1-OH midazolam) tích lũy trong suy thận. Tác dụng kéo dài sau ngừng thuốc nếu dùng > 48–72h.<br>
<strong>Cai thuốc:</strong> Giảm dần khi dùng > 5–7 ngày để tránh hội chứng cai thuốc (kích thích, co giật).<br>
<strong>Pha chế:</strong> NaCl 0.9%, D5W, hoặc Ringer Lactate. Ổn định 24h. Nồng độ chuẩn 1 mg/mL (loãng hơn ưu tiên để chuẩn độ chính xác).`,
    },

    {
      id: 'nicardipine',
      name: 'Nicardipine',
      nameVI: 'Nicardipine',
      cls: 'Hạ áp ICU',
      icon: '🔴',
      clsColor: '#7a0000', clsBg: '#fde8e6',
      iconBg: '#fde8e6',
      weightBased: false,
      unitDefault: 'mg/h',
      units: ['mg/h'],
      defaultAmtValue: 20,
      defaultAmtUnit: 'mg',
      volOpts: [100, 200, 250],
      defaultVol: 200,
      commonConcs: [
        { amt: 20, vol: 200, label: '20 mg/200 mL D5W = 0.1 mg/mL (thông dụng)' },
        { amt: 40, vol: 200, label: '40 mg/200 mL D5W = 0.2 mg/mL' },
      ],
      doseMin: 5, doseMax: 30, doseStep: 1, doseDefault: 5,
      quickDoses: [5, 10, 15, 20, 30],
      refDoses: [
        { doseVal: 5,  label: 'Khởi đầu', risk: 'ok', note: '5 mg/h: liều khởi đầu chuẩn' },
        { doseVal: 10, label: 'Chuẩn độ', risk: 'ok', note: '5–15 mg/h: tăng 2.5 mg/h mỗi 5–15 phút đến đích HA' },
        { doseVal: 15, label: 'Vừa', risk: 'ok', note: '10–20 mg/h: THA nặng, THA ác tính' },
        { doseVal: 20, label: 'Cao', risk: 'warning', note: '20–30 mg/h: THA khủng hoảng, sau phẫu thuật' },
        { doseVal: 30, label: 'Tối đa', risk: 'danger', note: '> 30 mg/h: giới hạn khuyến cáo, nguy cơ tụt HA quá mức' },
      ],
      clinicalNote: `<strong>Chỉ định:</strong> Tăng huyết áp nặng/khủng hoảng ICU, THA chu phẫu, THA sau phẫu thuật thần kinh (tránh kéo dài co mạch não).<br>
<strong>Pha chế:</strong> Chỉ dùng D5W (không dùng NaCl 0.9% hoặc Ringer Lactate — kết tủa). Nồng độ chuẩn 0.1 mg/mL (20 mg/200 mL). Ổn định 24h ở nhiệt độ phòng, tránh ánh sáng.<br>
<strong>Chuẩn độ:</strong> Tăng 2.5 mg/h mỗi 5–15 phút đến đích. Tác dụng xuất hiện trong 5–15 phút sau thay đổi liều.<br>
<strong>Không phụ thuộc cân nặng.</strong> Mục tiêu HA: giảm ≤ 25% MAP trong 1h đầu (không giảm quá nhanh tránh thiếu máu não).`,
    },

    {
      id: 'insulin',
      name: 'Insulin TM',
      nameVI: 'Insulin Regular (Truyền TM)',
      cls: 'Đường huyết',
      icon: '⚗️',
      clsColor: '#0d5c6e', clsBg: '#e6f3f8',
      iconBg: '#e6f3f8',
      weightBased: false,
      unitDefault: 'units/h',
      units: ['units/h'],
      defaultAmtValue: 100,
      defaultAmtUnit: 'units',
      volOpts: [50, 100],
      defaultVol: 100,
      commonConcs: [
        { amt: 100, vol: 100, label: '100 units/100 mL NaCl = 1 unit/mL (chuẩn)' },
        { amt: 50,  vol: 50,  label: '50 units/50 mL NaCl = 1 unit/mL' },
      ],
      doseMin: 0.5, doseMax: 15, doseStep: 0.5, doseDefault: 2,
      quickDoses: [0.5, 1, 2, 3, 5, 10],
      refDoses: [
        { doseVal: 0.5, label: 'Duy trì nhẹ', risk: 'ok', note: '0.5–1 unit/h: kiểm soát ĐH nhẹ (< 10 mmol/L)' },
        { doseVal: 2,   label: 'Kiểm soát vừa', risk: 'ok', note: '1–3 units/h: ĐH 10–16 mmol/L' },
        { doseVal: 5,   label: 'DKA / HHS', risk: 'warning', note: '3–7 units/h: DKA (0.1 unit/kg/h) — mục tiêu giảm ĐH 3–5 mmol/L/h' },
        { doseVal: 7,   label: 'Cao', risk: 'warning', note: '7–10 units/h: kháng insulin, sau ghép, steroid liều cao' },
        { doseVal: 10,  label: 'Rất cao', risk: 'danger', note: '> 10 units/h: nguy cơ hạ ĐH nghiêm trọng — monitor ĐH mỗi 30 phút' },
      ],
      clinicalNote: `<strong>Mục tiêu đường huyết ICU (PADIS 2018):</strong> 7.8–10 mmol/L (140–180 mg/dL). Tránh hạ ĐH (< 4.4 mmol/L).<br>
<strong>Pha chế:</strong> 100 units Insulin Regular/100 mL NaCl 0.9% = 1 unit/mL. XẢ 50 mL đầu tiên để bão hòa insulin vào dây truyền (insulin hấp phụ vào PVC).<br>
<strong>Theo dõi ĐH:</strong> Mỗi 1–2h khi đang hiệu chỉnh; mỗi 2–4h khi ổn định. Nếu ĐH < 4 mmol/L: ngừng insulin, cho 50 mL Dextrose 50% IV, tái đánh giá.<br>
<strong>DKA:</strong> Bắt đầu 0.1 unit/kg/h. Khi ĐH ≤ 14 mmol/L → chuyển sang D5W + insulin. Kiểm soát kali song song.`,
    },

    {
      id: 'heparin',
      name: 'Heparin',
      nameVI: 'Heparin không phân đoạn (UFH)',
      cls: 'Kháng đông',
      icon: '💊',
      clsColor: '#1d4a7a', clsBg: '#e8f1fb',
      iconBg: '#e8f1fb',
      weightBased: true,
      unitDefault: 'units/kg/h',
      units: ['units/kg/h', 'units/h'],
      defaultAmtValue: 25000,
      defaultAmtUnit: 'units',
      volOpts: [250, 500],
      defaultVol: 500,
      commonConcs: [
        { amt: 25000, vol: 500, label: '25,000 units/500 mL = 50 units/mL (thông dụng)' },
        { amt: 25000, vol: 250, label: '25,000 units/250 mL = 100 units/mL (nồng độ gấp đôi)' },
      ],
      doseMin: 5, doseMax: 35, doseStep: 1, doseDefault: 18,
      quickDoses: [5, 10, 15, 18, 20, 25],
      refDoses: [
        { doseVal: 5,  label: 'Dự phòng thấp', risk: 'ok', note: '5–10 units/kg/h: dự phòng DVT liều thấp' },
        { doseVal: 15, label: 'Điều trị (aPTT)', risk: 'ok', note: '12–18 units/kg/h: DVT/PE — chuẩn độ theo aPTT 60–100 giây' },
        { doseVal: 20, label: 'ACS / van tim', risk: 'warning', note: '15–25 units/kg/h: ACS, thay van — aPTT mục tiêu 50–70 giây' },
        { doseVal: 25, label: 'Cao', risk: 'warning', note: '> 25 units/kg/h: kiểm tra kháng heparin, theo dõi anti-Xa nếu cần' },
        { doseVal: 35, label: 'Tối đa', risk: 'danger', note: '> 35 units/kg/h: nguy cơ xuất huyết cao — cân nhắc đổi kháng đông' },
      ],
      clinicalNote: `<strong>Liều nạp:</strong> 60–80 units/kg IV bolus (tối đa 5000 units). Sau đó duy trì 12–18 units/kg/h.<br>
<strong>Theo dõi:</strong> aPTT sau 6h liều đầu, sau mỗi lần chỉnh liều. Mục tiêu: aPTT 60–100 giây (hoặc anti-Xa 0.3–0.7 IU/mL nếu aPTT không đáng tin).<br>
<strong>HIT – Giảm tiểu cầu do Heparin (HIT):</strong> Theo dõi tiểu cầu ngày 3–5 sau khi bắt đầu. Nếu giảm > 50% → ngừng heparin ngay, dùng argatroban/fondaparinux.<br>
<strong>Pha chế:</strong> NaCl 0.9%. 25,000 units/500 mL = 50 units/mL. Ổn định 24h.<br>
<strong>Đảo ngược:</strong> Protamine sulfate 1 mg/100 units heparin (trong 2h gần nhất).`,
    },

    {
      id: 'milrinone',
      name: 'Milrinone',
      nameVI: 'Milrinone',
      cls: 'Tăng co bóp / Giãn mạch',
      icon: '🟢',
      clsColor: '#1d5c1d', clsBg: '#e8f5ee',
      iconBg: '#e8f5ee',
      weightBased: true,
      unitDefault: 'mcg/kg/min',
      units: ['mcg/kg/min'],
      defaultAmtValue: 20,
      defaultAmtUnit: 'mg',
      volOpts: [100, 200, 250],
      defaultVol: 100,
      commonConcs: [
        { amt: 20, vol: 100, label: '20 mg/100 mL = 200 mcg/mL (thông dụng)' },
        { amt: 40, vol: 200, label: '40 mg/200 mL = 200 mcg/mL' },
        { amt: 20, vol: 200, label: '20 mg/200 mL = 100 mcg/mL (nồng độ thấp)' },
      ],
      doseMin: 0.1, doseMax: 0.75, doseStep: 0.05, doseDefault: 0.375,
      quickDoses: [0.1, 0.25, 0.375, 0.5, 0.75],
      refDoses: [
        { doseVal: 0.1,   label: 'Liều thấp', risk: 'ok', note: '0.1–0.25 mcg/kg/min: khởi đầu, hạn chế tụt HA' },
        { doseVal: 0.25,  label: 'Vừa thấp', risk: 'ok', note: '0.25–0.375 mcg/kg/min: suy tim vừa, thường dùng kết hợp' },
        { doseVal: 0.375, label: 'Trung bình (chuẩn)', risk: 'ok', note: '0.375–0.5 mcg/kg/min: liều duy trì tiêu chuẩn trong sốc tim' },
        { doseVal: 0.5,   label: 'Cao', risk: 'warning', note: '0.5–0.75 mcg/kg/min: tăng nguy cơ loạn nhịp, tụt HA' },
        { doseVal: 0.75,  label: 'Tối đa', risk: 'danger', note: '> 0.75 mcg/kg/min: không khuyến cáo vượt quá liều này' },
      ],
      clinicalNote: `<strong>Chỉ định:</strong> Suy tim cấp mất bù/sốc tim có sức cản mạch ngoại biên cao và CO thấp, đặc biệt khi dùng thêm dobutamine không đủ. Cầu nối trước ghép tim hoặc hỗ trợ cơ học.<br>
<strong>Cơ chế:</strong> Ức chế phosphodiesterase III → tăng cAMP → tăng co bóp + giãn mạch (thuốc tăng co bóp-giãn mạch). Không phụ thuộc thụ thể β (hiệu quả khi bệnh nhân dùng β-blocker mạn tính).<br>
<strong>Liều nạp:</strong> 50 mcg/kg IV trong 10 phút (tùy chọn — thường bỏ qua khi HA thấp để tránh tụt HA đột ngột).<br>
<strong>Pha chế:</strong> D5W hoặc NaCl 0.9%. Nồng độ chuẩn 200 mcg/mL (20 mg/100 mL). Ổn định 24h nhiệt độ phòng.<br>
<strong>Theo dõi:</strong> CO/CI (Swan-Ganz/PICCO), huyết áp động mạch xâm lấn, ECG (loạn nhịp thất), creatinine (thải qua thận 80-85% — giảm liều khi CrCl < 50 mL/min).`,
    },

    {
      id: 'ketamine',
      name: 'Ketamine',
      nameVI: 'Ketamine',
      cls: 'An thần / Giảm đau',
      icon: '🟤',
      clsColor: '#4a3300', clsBg: '#f5f0e6',
      iconBg: '#f5f0e6',
      weightBased: true,
      unitDefault: 'mcg/kg/min',
      units: ['mcg/kg/min', 'mg/kg/h'],
      defaultAmtValue: 500,
      defaultAmtUnit: 'mg',
      volOpts: [50, 100, 250, 500],
      defaultVol: 500,
      commonConcs: [
        { amt: 500, vol: 500, label: '500 mg/500 mL = 1 mg/mL (thông dụng ICU)' },
        { amt: 500, vol: 250, label: '500 mg/250 mL = 2 mg/mL (nồng độ gấp đôi)' },
        { amt: 200, vol: 100, label: '200 mg/100 mL = 2 mg/mL' },
      ],
      doseMin: 2, doseMax: 100, doseStep: 1, doseDefault: 10,
      quickDoses: [2, 5, 10, 20, 30, 50],
      refDoses: [
        { doseVal: 2,  label: 'Giảm đau liều thấp (dưới ngưỡng phân ly)', risk: 'ok', note: '1–3 mcg/kg/min (0.1–0.2 mg/kg/h): giảm đau không phân ly, tiết kiệm opioid' },
        { doseVal: 5,  label: 'An thần bổ sung', risk: 'ok', note: '3–8 mcg/kg/min (0.2–0.5 mg/kg/h): phối hợp propofol/midazolam giảm liều opioid' },
        { doseVal: 10, label: 'An thần trung bình', risk: 'ok', note: '8–15 mcg/kg/min (0.5–1 mg/kg/h): an thần thủ thuật, thay băng ICU' },
        { doseVal: 20, label: 'An thần sâu / RASS -4', risk: 'warning', note: '15–30 mcg/kg/min (1–2 mg/kg/h): cần phối hợp benzodiazepin chống ảo giác' },
        { doseVal: 50, label: 'RSI / khởi mê', risk: 'warning', note: '1–2 mg/kg IV bolus để đặt NKQ; không dùng infusion liều này kéo dài' },
        { doseVal: 80, label: 'Tối đa truyền liên tục', risk: 'danger', note: '> 4 mg/kg/h (67 mcg/kg/min): hiếm gặp, chỉ tình huống đặc biệt (động kinh liên tục, co thắt phế quản kháng trị)' },
      ],
      clinicalNote: `<strong>Ưu điểm ICU:</strong> Duy trì huyết động (kích thích giao cảm — tăng nhịp tim, HA), bảo tồn phản xạ đường thở, giãn phế quản mạnh → lý tưởng cho BN hen suyễn/COPD nặng, BN huyết động không ổn định.<br>
<strong>Giảm đau liều thấp (dưới ngưỡng phân ly):</strong> 0.1–0.3 mg/kg/h (1.7–5 mcg/kg/min) — tiết kiệm opioid hiệu quả, ít tác dụng phụ tâm thần.<br>
<strong>Chống chỉ định tương đối:</strong> Tăng HA không kiểm soát, tăng nhãn áp, tiền sử tâm thần phân liệt. Thận trọng khi tăng áp lực nội sọ (ICP) — bằng chứng mới cho thấy an toàn nếu thông khí đầy đủ.<br>
<strong>Dự phòng ảo giác:</strong> Phối hợp midazolam 1–2 mg IV hoặc propofol liều thấp khi dùng liều an thần/phân ly.<br>
<strong>Pha chế:</strong> NaCl 0.9% hoặc D5W. Nồng độ 1–2 mg/mL. Ổn định 24h. Tránh pha cùng barbiturate (kết tủa).`,
    },

    {
      id: 'rocuronium',
      name: 'Rocuronium',
      nameVI: 'Rocuronium',
      cls: 'Giãn cơ (NMBA)',
      icon: '⚫',
      clsColor: '#1a1a2e', clsBg: '#eaeaf5',
      iconBg: '#eaeaf5',
      weightBased: true,
      unitDefault: 'mcg/kg/min',
      units: ['mcg/kg/min', 'mg/kg/h'],
      defaultAmtValue: 500,
      defaultAmtUnit: 'mg',
      volOpts: [50, 100, 250, 500],
      defaultVol: 500,
      commonConcs: [
        { amt: 500, vol: 500, label: '500 mg/500 mL = 1 mg/mL (thông dụng)' },
        { amt: 200, vol: 200, label: '200 mg/200 mL = 1 mg/mL' },
        { amt: 500, vol: 250, label: '500 mg/250 mL = 2 mg/mL (nồng độ gấp đôi)' },
      ],
      doseMin: 5, doseMax: 20, doseStep: 1, doseDefault: 10,
      quickDoses: [5, 7, 10, 12, 15],
      refDoses: [
        { doseVal: 5,  label: 'Thấp / duy trì nhẹ', risk: 'ok', note: '5–8 mcg/kg/min (0.3–0.5 mg/kg/h): giãn cơ nhẹ, hiệu chỉnh theo TOF' },
        { doseVal: 10, label: 'Duy trì chuẩn', risk: 'ok', note: '8–12 mcg/kg/min (0.5–0.7 mg/kg/h): ARDS, HFOV, giảm áp nội sọ' },
        { doseVal: 12, label: 'Trung bình cao', risk: 'warning', note: '10–15 mcg/kg/min: điều chỉnh theo TOF 1–2/4' },
        { doseVal: 15, label: 'Cao', risk: 'warning', note: '> 15 mcg/kg/min: cần theo dõi TOF mỗi 4–6h, nguy cơ tích lũy và yếu cơ kéo dài' },
        { doseVal: 20, label: 'Tối đa', risk: 'danger', note: '> 20 mcg/kg/min: hiếm khi cần, nguy cơ yếu cơ mắc phải tại ICU cao' },
      ],
      clinicalNote: `<strong>Chỉ định truyền liên tục ICU:</strong> ARDS nặng (P/F < 150, nằm sấp điều trị), tăng áp lực nội sọ khó kiểm soát, động kinh liên tục, dị ứng succinylcholine.<br>
<strong>Đặt nội khí quản trình tự nhanh (RSI):</strong> 1.2 mg/kg IV bolus (RSI liều cao); liều thông thường 0.6 mg/kg. Không dùng truyền liên tục để thực hiện RSI.<br>
<strong>Theo dõi TOF (Train-of-Four):</strong> BẮT BUỘC mỗi 4–6h. Mục tiêu TOF 1–2/4 twitch. KHÔNG dùng truyền liên tục với liều cố định mà không theo dõi TOF → nguy cơ tích lũy và yếu cơ mắc phải tại ICU.<br>
<strong>Đảo ngược:</strong> Sugammadex 16 mg/kg IV (ngay lập tức đảo ngược ngay cả liều cao). Neostigmine KHÔNG hiệu quả với rocuronium liều cao.<br>
<strong>Pha chế:</strong> NaCl 0.9% hoặc D5W. Nồng độ 1–2 mg/mL. Ổn định 24h nhiệt độ phòng (12h nếu pha loãng).<br>
<strong>Cảnh báo:</strong> PHẢI đảm bảo an thần đầy đủ (RASS ≤ -3) trước và trong suốt thời gian dùng NMBA — bệnh nhân tỉnh táo hoàn toàn mà không vận động được là tình huống vô cùng nguy hiểm về đạo đức.`,
    },

    {
      id: 'vecuronium',
      name: 'Vecuronium',
      nameVI: 'Vecuronium',
      cls: 'Giãn cơ (NMBA)',
      icon: '⚫',
      clsColor: '#1a1a2e', clsBg: '#eaeaf5',
      iconBg: '#eaeaf5',
      weightBased: true,
      unitDefault: 'mcg/kg/min',
      units: ['mcg/kg/min'],
      defaultAmtValue: 100,
      defaultAmtUnit: 'mg',
      volOpts: [100, 250, 500],
      defaultVol: 250,
      commonConcs: [
        { amt: 40, vol: 100, label: '40 mg/100 mL = 0.4 mg/mL (thông dụng)' },
        { amt: 100, vol: 250, label: '100 mg/250 mL = 0.4 mg/mL' },
        { amt: 50, vol: 250, label: '50 mg/250 mL = 0.2 mg/mL (nồng độ thấp)' },
      ],
      doseMin: 0.5, doseMax: 2, doseStep: 0.1, doseDefault: 1,
      quickDoses: [0.5, 0.8, 1, 1.5, 2],
      refDoses: [
        { doseVal: 0.5, label: 'Thấp', risk: 'ok', note: '0.5–0.8 mcg/kg/min: duy trì nhẹ, TOF 2–3/4' },
        { doseVal: 1,   label: 'Chuẩn', risk: 'ok', note: '0.8–1.2 mcg/kg/min: giãn cơ duy trì ICU, TOF 1–2/4' },
        { doseVal: 1.5, label: 'Cao', risk: 'warning', note: '1.2–2 mcg/kg/min: ARDS nặng, prone; theo dõi TOF sát' },
        { doseVal: 2,   label: 'Tối đa', risk: 'danger', note: '> 2 mcg/kg/min: nguy cơ tích lũy cao, đặc biệt suy gan/thận' },
      ],
      clinicalNote: `<strong>Chỉ định:</strong> Tương tự rocuronium — ARDS nặng, nằm sấp điều trị, tăng ICP, thở máy không đồng bộ. Thường dùng khi không có sugammadex (rocuronium ưu tiên hơn nếu có).<br>
<strong>Liều bolus đặt NKQ:</strong> 0.1 mg/kg IV; liều cao 0.15–0.2 mg/kg (khởi phát chậm hơn succinylcholine ~3–5 phút).<br>
<strong>Tích lũy trong suy gan/thận:</strong> Vecuronium thải qua gan (70%) và thận (30%) → tích lũy rõ rệt ở ICU kéo dài. Cân nhắc atracurium/cisatracurium ở BN suy đa cơ quan (thải qua phân hủy tự phát (Hofmann degradation), không phụ thuộc gan thận).<br>
<strong>Theo dõi TOF:</strong> Bắt buộc mỗi 4–6h. Nghỉ NMBA mỗi ngày (ngừng thuốc đánh giá hàng ngày) để đánh giá phục hồi thần kinh cơ và tránh yếu cơ mắc phải tại ICU.<br>
<strong>Pha chế:</strong> Pha lọ bột trong nước cất pha tiêm (WFI), sau đó pha loãng NaCl 0.9% hoặc D5W. Nồng độ 0.2–0.4 mg/mL. Ổn định 24h sau khi pha loãng (lạnh 4°C) hoặc 12h nhiệt độ phòng.<br>
<strong>Cảnh báo:</strong> Giống rocuronium — đảm bảo an thần đầy đủ trước và trong khi dùng NMBA.`,
    },

    {
      id: 'amiodarone',
      name: 'Amiodarone',
      nameVI: 'Amiodarone',
      cls: 'Chống loạn nhịp',
      icon: '💛',
      clsColor: '#6b4c00', clsBg: '#fef5d9',
      iconBg: '#fef5d9',
      weightBased: false,
      unitDefault: 'mg/h',
      units: ['mg/h'],
      defaultAmtValue: 900,
      defaultAmtUnit: 'mg',
      volOpts: [250, 500],
      defaultVol: 500,
      commonConcs: [
        { amt: 900, vol: 500, label: '900 mg/500 mL D5W = 1.8 mg/mL (chuẩn 24h)' },
        { amt: 300, vol: 250, label: '300 mg/250 mL D5W = 1.2 mg/mL (tải nhanh)' },
        { amt: 150, vol: 100, label: '150 mg/100 mL D5W = 1.5 mg/mL (bolus pha loãng)' },
      ],
      doseMin: 0.5, doseMax: 50, doseStep: 0.5, doseDefault: 21,
      quickDoses: [15, 21, 30, 42],
      refDoses: [
        { doseVal: 15,  label: 'Nạp nhanh (pha 1)', risk: 'ok', note: '150 mg trong 10 phút = 900 mg/h → 15 mg/min (bolus cấp cứu VF/VT)' },
        { doseVal: 21,  label: 'Duy trì chậm (pha 2)', risk: 'ok', note: '360 mg trong 6h = 60 mg/h ≈ 1 mg/min (sau bolus cấp cứu)' },
        { doseVal: 30,  label: 'Nạp 24h (pha 3)', risk: 'warning', note: '540 mg trong 18h = 30 mg/h ≈ 0.5 mg/min (duy trì sau nạp)' },
        { doseVal: 42,  label: 'Tổng liều 24h (ACL)', risk: 'warning', note: 'ACLS: tổng 2.2g/24h (150 mg bolus + 360 mg/6h + 540 mg/18h)' },
      ],
      clinicalNote: `<strong>Phác đồ ACLS (VF/VT vô mạch, không đáp ứng shock):</strong><br>
— Liều 1: 300 mg IV bolus → nếu không đáp ứng → Liều 2: 150 mg IV bolus<br>
— Sau khi đạt nhịp xoang: tải 150 mg/10 phút, tiếp theo 1 mg/min × 6h, tiếp theo 0.5 mg/min × 18h<br>
<strong>VT có mạch / Rung nhĩ:</strong> 150 mg IV trong 10 phút, sau đó 1 mg/min × 6h → 0.5 mg/min × 18h.<br>
<strong>Pha chế:</strong> CHỈ dùng D5W (tương thích tốt nhất — amiodarone tủa trong NaCl 0.9%). Nồng độ ≥ 2 mg/mL phải dùng catheter trung tâm (gây viêm tĩnh mạch ngoại biên). Nồng độ < 2 mg/mL có thể dùng ngoại biên tạm thời. Chai thủy tinh ưu tiên hơn túi nhựa PVC (amiodarone hấp phụ vào PVC và chất hóa dẻo DEHP rò rỉ ra dung dịch).<br>
<strong>Theo dõi:</strong> ECG liên tục (QTc, nhịp chậm, AV block), HA (tụt HA khi truyền nhanh), chức năng gan (AST/ALT), tuyến giáp (TSH dài hạn), X-quang phổi (độc tính phổi dài hạn).`,
    },

    {
      id: 'diltiazem',
      name: 'Diltiazem',
      nameVI: 'Diltiazem',
      cls: 'Chống loạn nhịp / Hạ áp',
      icon: '💛',
      clsColor: '#6b4c00', clsBg: '#fef5d9',
      iconBg: '#fef5d9',
      weightBased: false,
      unitDefault: 'mg/h',
      units: ['mg/h'],
      defaultAmtValue: 125,
      defaultAmtUnit: 'mg',
      volOpts: [100, 250],
      defaultVol: 250,
      commonConcs: [
        { amt: 125, vol: 250, label: '125 mg/250 mL NaCl = 0.5 mg/mL (thông dụng)' },
        { amt: 250, vol: 250, label: '250 mg/250 mL NaCl = 1 mg/mL (nồng độ gấp đôi)' },
        { amt: 125, vol: 100, label: '125 mg/100 mL NaCl = 1.25 mg/mL' },
      ],
      doseMin: 5, doseMax: 30, doseStep: 1, doseDefault: 10,
      quickDoses: [5, 10, 15, 20, 25],
      refDoses: [
        { doseVal: 5,  label: 'Thấp', risk: 'ok', note: '5–10 mg/h: khởi đầu sau bolus, kiểm soát nhịp nhẹ' },
        { doseVal: 10, label: 'Trung bình', risk: 'ok', note: '10–15 mg/h: kiểm soát nhịp AF/flutter mục tiêu < 110/phút' },
        { doseVal: 15, label: 'Vừa cao', risk: 'warning', note: '15–20 mg/h: nhịp nhanh kháng trị, theo dõi HA và AV block' },
        { doseVal: 20, label: 'Cao', risk: 'warning', note: '20–25 mg/h: tối đa thường dùng trên lâm sàng' },
        { doseVal: 25, label: 'Tối đa', risk: 'danger', note: '> 25 mg/h: nguy cơ nhịp chậm, block AV độ 2–3, tụt HA' },
      ],
      clinicalNote: `<strong>Chỉ định:</strong> Kiểm soát nhịp thất trong rung nhĩ/cuồng nhĩ (ventricular rate control), SVT, THA kết hợp nhịp nhanh.<br>
<strong>Liều nạp IV:</strong> 0.25 mg/kg (thường 15–25 mg) IV trong 2 phút. Nếu không đủ đáp ứng sau 15 phút: lặp lại 0.35 mg/kg. Sau đó bắt đầu infusion.<br>
<strong>Mục tiêu nhịp tim:</strong> < 110/phút (chiến lược kiểm soát nhịp mềm theo nghiên cứu RACE II); < 80/phút nếu cần kiểm soát chặt.<br>
<strong>Chống chỉ định:</strong> Hội chứng WPW (nguy cơ dẫn truyền qua đường phụ tăng tốc → VF), suy tim tâm thu nặng (EF thấp), block AV độ 2–3, hạ HA, nhịp chậm xoang.<br>
<strong>Pha chế:</strong> NaCl 0.9%, D5W, hoặc D5/NaCl. Nồng độ 0.5–1 mg/mL. Ổn định 24h nhiệt độ phòng.<br>
<strong>Theo dõi:</strong> ECG liên tục (nhịp, PR interval), HA mỗi 15 phút khi tải liều, theo dõi dấu hiệu block AV.`,
    },

    {
      id: 'nitroglycerin',
      name: 'Nitroglycerin',
      nameVI: 'Nitroglycerin (Glyceryl trinitrate)',
      cls: 'Hạ áp / Giãn mạch',
      icon: '💛',
      clsColor: '#6b4c00', clsBg: '#fef5d9',
      iconBg: '#fef5d9',
      weightBased: false,
      unitDefault: 'mcg/min',
      units: ['mcg/min', 'mcg/kg/min'],
      defaultAmtValue: 50,
      defaultAmtUnit: 'mg',
      volOpts: [250, 500],
      defaultVol: 250,
      commonConcs: [
        { amt: 50, vol: 250, label: '50 mg/250 mL D5W = 200 mcg/mL (thông dụng)' },
        { amt: 50, vol: 500, label: '50 mg/500 mL D5W = 100 mcg/mL' },
        { amt: 25, vol: 250, label: '25 mg/250 mL D5W = 100 mcg/mL (liều thấp)' },
      ],
      doseMin: 5, doseMax: 400, doseStep: 5, doseDefault: 20,
      quickDoses: [5, 10, 20, 40, 80, 100, 200],
      refDoses: [
        { doseVal: 5,   label: 'Khởi đầu rất thấp', risk: 'ok',     note: '5–10 mcg/min: giảm tiền tải nhẹ, đau thắt ngực ổn định' },
        { doseVal: 20,  label: 'Thấp — hạ áp nhẹ',  risk: 'ok',     note: '10–40 mcg/min: giảm tiền tải, suy tim sung huyết cấp' },
        { doseVal: 50,  label: 'Trung bình',         risk: 'ok',     note: '40–80 mcg/min: phù phổi cấp, đau ngực không ổn định' },
        { doseVal: 100, label: 'Cao — hạ áp tích cực', risk: 'warning', note: '80–200 mcg/min: tăng huyết áp nặng, suy tim NYHA IV' },
        { doseVal: 200, label: 'Rất cao',            risk: 'warning', note: '200–400 mcg/min: tăng huyết áp khủng hoảng, theo dõi sát MetHb' },
        { doseVal: 400, label: 'Tối đa tuyệt đối',   risk: 'danger', note: '> 400 mcg/min: nguy cơ methemoglobin hóa, tụt huyết áp nặng, nhịp tim nhanh phản xạ' },
      ],
      clinicalNote: `<strong>Chỉ định:</strong> Đau thắt ngực không ổn định / nhồi máu cơ tim (giảm tiền tải, tái tưới máu), phù phổi cấp do suy tim, tăng huyết áp nặng/khủng hoảng có kèm suy vành hoặc suy tim, co thắt mạch vành.<br>
<strong>Cơ chế:</strong> Giải phóng NO → giãn cơ trơn → giãn tĩnh mạch (ưu thế) và giãn động mạch (liều cao). Giảm tiền tải mạnh, giảm hậu tải vừa, giãn mạch vành.<br>
<strong>Hấp phụ nhựa PVC:</strong> Nitroglycerin bị hấp phụ lên đến 40–80% vào dây truyền PVC. BẮT BUỘC dùng dây truyền không PVC (polyethylene hoặc PVC có lớp phủ đặc biệt). Dùng chai thủy tinh hoặc túi polyolefin — KHÔNG dùng túi nhựa PVC thông thường.<br>
<strong>Pha chế:</strong> Chỉ dùng D5W (ưu tiên) hoặc NaCl 0.9%. Nồng độ chuẩn 100–200 mcg/mL. Ổn định 48h nhiệt độ phòng, tránh ánh sáng (bọc giấy bạc).<br>
<strong>Methemoglobin hóa:</strong> Nguy cơ khi dùng liều cao kéo dài (> 400 mcg/min > 24h). Theo dõi SpO2 và methemoglobin (MetHb) — điều trị bằng methylene blue 1–2 mg/kg IV nếu MetHb > 30%.<br>
<strong>Nhờn thuốc (Tolerance):</strong> Xuất hiện sau 24–48h truyền liên tục. Biện pháp: ngừng truyền 8–12h/ngày (drug holiday) hoặc phối hợp N-acetylcysteine.<br>
<strong>Chống chỉ định tuyệt đối:</strong> Dùng chất ức chế PDE-5 (sildenafil, tadalafil) trong 24–48h → tụt huyết áp nặng, tử vong. Hạ huyết áp (HATB < 65 mmHg). Tắc nghẽn đường ra thất phải (hẹp phổi nặng, tràn dịch màng ngoài tim có chèn ép).<br>
<strong>Không phụ thuộc cân nặng</strong> trong thực hành ICU (liều tính mcg/min); có thể chuyển đổi sang mcg/kg/min nếu cần chuẩn hóa.`,
    },
  ];

  /* =========================================================================
   * TÍNH TOÁN
   * ========================================================================= */

  function calcConc(drug, amt, vol) {
    // Returns concentration in base unit per mL
    return amt / vol; // mg/mL or units/mL
  }

  function calcRate(drug, amt, vol, dose, unit, weight) {
    const conc = calcConc(drug, amt, vol); // mg/mL or units/mL

    if (unit === 'mcg/kg/min') {
      // dose in mcg/kg/min, conc in mg/mL → convert mg to mcg: ×1000
      return (dose * weight * 60) / (conc * 1000);
    } else if (unit === 'mg/kg/h') {
      return (dose * weight) / conc;
    } else if (unit === 'mcg/kg/h') {
      return (dose * weight) / (conc * 1000);
    } else if (unit === 'mg/h') {
      return dose / conc;
    } else if (unit === 'units/h') {
      return dose / conc; // conc in units/mL
    } else if (unit === 'units/min') {
      return (dose * 60) / conc;
    } else if (unit === 'units/kg/h') {
      return (dose * weight) / conc;
    } else if (unit === 'mcg/h') {
      return dose / (conc * 1000);
    } else if (unit === 'mcg/min') {
      // dose in mcg/min → to mL/h: (dose × 60) / (conc_mg/mL × 1000)
      return (dose * 60) / (conc * 1000);
    }
    return NaN;
  }

  function calcSteps(drug, amt, vol, dose, unit, weight) {
    const conc = calcConc(drug, amt, vol);
    const rate = calcRate(drug, amt, vol, dose, unit, weight);
    const dObj = DRUG_DB.find(d => d.id === drug.id);

    let concLabel = '';
    let isUnits = (unit === 'units/h' || unit === 'units/min' || unit === 'units/kg/h');
    if (isUnits) {
      concLabel = `${fmt(conc, 4)} units/mL`;
    } else {
      concLabel = `${fmt(conc * 1000, 2)} mcg/mL = ${fmt(conc, 4)} mg/mL`;
    }

    let step2 = '';
    if (unit === 'mcg/kg/min') {
      step2 = `${dose} mcg/kg/min × ${weight} kg × 60 min/h ÷ ${fmt(conc * 1000, 2)} mcg/mL = ${fmt(rate, 2)} mL/h`;
    } else if (unit === 'mg/kg/h') {
      step2 = `${dose} mg/kg/h × ${weight} kg ÷ ${fmt(conc, 4)} mg/mL = ${fmt(rate, 2)} mL/h`;
    } else if (unit === 'mcg/kg/h') {
      step2 = `${dose} mcg/kg/h × ${weight} kg ÷ ${fmt(conc * 1000, 2)} mcg/mL = ${fmt(rate, 2)} mL/h`;
    } else if (unit === 'mg/h') {
      step2 = `${dose} mg/h ÷ ${fmt(conc, 4)} mg/mL = ${fmt(rate, 2)} mL/h`;
    } else if (unit === 'units/h') {
      step2 = `${dose} units/h ÷ ${fmt(conc, 4)} units/mL = ${fmt(rate, 2)} mL/h`;
    } else if (unit === 'units/min') {
      step2 = `${dose} units/min × 60 min/h ÷ ${fmt(conc, 4)} units/mL = ${fmt(rate, 2)} mL/h`;
    } else if (unit === 'mcg/min') {
      step2 = `${dose} mcg/min × 60 min/h ÷ ${fmt(conc * 1000, 2)} mcg/mL = ${fmt(rate, 2)} mL/h`;
    } else if (unit === 'units/kg/h') {
      step2 = `${dose} units/kg/h × ${weight} kg ÷ ${fmt(conc, 4)} units/mL = ${fmt(rate, 2)} mL/h`;
    }

    return { concLabel, step1: `Nồng độ: ${amt} ÷ ${vol} mL = ${concLabel}`, step2: `Tốc độ: ${step2}` };
  }

  function fmt(n, d = 2) {
    if (!Number.isFinite(n) || isNaN(n)) return '—';
    return parseFloat(n.toFixed(d)).toString();
  }

  /* =========================================================================
   * STATE
   * ========================================================================= */

  const STATE = {
    drugId: 'norepinephrine',
    weight: 65,
    amt: 0,
    vol: 0,
    dose: 0,
    unit: '',
    init(drug) {
      this.drugId = drug.id;
      this.amt = drug.defaultAmtValue;
      this.vol = drug.defaultVol;
      this.dose = drug.doseDefault;
      this.unit = drug.unitDefault;
    },
    drug() { return DRUG_DB.find(d => d.id === this.drugId); }
  };

  STATE.init(DRUG_DB[0]);

  /* =========================================================================
   * RENDER
   * ========================================================================= */

  function renderDrugTabs() {
    const sel = document.getElementById('icu-drug-main-select');
    if (!sel) return;
    const groups = [
      { label: 'Vận mạch / Tăng co bóp', ids: ['norepinephrine','epinephrine','dopamine','dobutamine','vasopressin','milrinone'] },
      { label: 'An thần & Giảm đau & Giãn cơ', ids: ['propofol','midazolam','ketamine','fentanyl','morphine','rocuronium','vecuronium'] },
      { label: 'Tim mạch & Khác', ids: ['amiodarone','diltiazem','nicardipine','nitroglycerin','insulin','heparin'] },
    ];
    sel.innerHTML = groups.map(g => {
      const opts = g.ids.map(id => {
        const d = DRUG_DB.find(x => x.id === id);
        return `<option value="${d.id}"${d.id === STATE.drugId ? ' selected' : ''}>${d.name}</option>`;
      }).join('');
      return `<optgroup label="${g.label}">${opts}</optgroup>`;
    }).join('');
    updateClassPill();
  }

  function updateClassPill() {
    const drug = STATE.drug();
    const pill = document.getElementById('icu-drug-class-pill');
    if (!pill || !drug) return;
    pill.style.display = 'inline-block';
    pill.style.background = drug.clsBg;
    pill.style.color = drug.clsColor;
    pill.textContent = drug.icon + ' ' + drug.cls;
  }

  function renderInputCard() {
    const drug = STATE.drug();
    const card = document.getElementById('icu-input-card');

    // conc preset options
    const concOpts = drug.commonConcs.map((c, i) =>
      `<option value="${i}" data-amt="${c.amt}" data-vol="${c.vol}">${c.label}</option>`
    ).join('');

    // weight field
    const weightField = drug.weightBased
      ? `<input type="number" id="icu-weight" value="${STATE.weight}" min="10" max="300" step="1" oninput="ICU.setWeight(this.value)" placeholder="kg">`
      : `<input type="text" value="Không cần" disabled>`;

    card.innerHTML = `
      <!-- Compact drug header -->
      <div class="icu-drug-header-bar">
        <div class="icu-drug-icon-sm" style="background:${drug.iconBg}">${drug.icon}</div>
        <div>
          <span class="icu-drug-title-sm">${drug.nameVI}</span>
          <span class="icu-drug-class-badge" style="background:${drug.clsBg};color:${drug.clsColor}">${drug.cls}</span>
        </div>
      </div>

      <!-- Warning -->
      <div class="icu-warning-banner">
        <span style="flex-shrink:0">⚠️</span>
        <span>Kết quả phải được xác minh độc lập trước khi thiết lập máy bơm tiêm.</span>
      </div>

      <!-- Main input grid: 4 columns -->
      <div class="icu-form-grid">
        <div class="icu-field">
          <label>Nồng độ pha (preset)</label>
          <select class="icu-conc-select" id="icu-conc-preset" onchange="ICU.applyPreset(this)">
            <option value="">— Tùy chỉnh —</option>
            ${concOpts}
          </select>
        </div>
        <div class="icu-field">
          <label>Thuốc (${drug.defaultAmtUnit})</label>
          <input type="number" id="icu-amt" value="${STATE.amt}" min="0" step="any" oninput="ICU.setAmt(this.value)">
        </div>
        <div class="icu-field">
          <label>Dung môi (mL)</label>
          <input type="number" id="icu-vol-custom" value="${STATE.vol}" min="1" step="1" oninput="ICU.setCustomVol(this.value)">
        </div>
        <div class="icu-field">
          <label>Cân nặng (kg)</label>
          ${weightField}
        </div>
      </div>

      <!-- Dose section -->
      <div class="icu-dose-section">
        <div class="icu-dose-top">
          <span class="icu-dose-label">Liều (${STATE.unit})</span>
          <input type="range" class="icu-dose-slider" id="icu-dose-slider"
            min="${drug.doseMin}" max="${drug.doseMax}" step="${drug.doseStep}" value="${STATE.dose}"
            oninput="ICU.setDoseSlider(this.value)">
          <span class="icu-dose-display" id="icu-dose-display">${STATE.dose} ${STATE.unit}</span>
          <input type="number" id="icu-dose-input" value="${STATE.dose}" min="${drug.doseMin}" max="${drug.doseMax}" step="${drug.doseStep}"
            oninput="ICU.setDose(this.value)"
            style="width:90px;padding:6px 8px;font-size:13px;border:1px solid var(--icu-border);border-radius:7px;font-family:inherit;flex-shrink:0">
          ${drug.units.length > 1 ? `<select id="icu-unit-sel" onchange="ICU.setUnit(this.value)" style="padding:6px 8px;font-size:12px;border:1px solid var(--icu-border);border-radius:7px;font-family:inherit;background:#fff;flex-shrink:0">${drug.units.map(u=>`<option value="${u}"${u===STATE.unit?' selected':''}>${u}</option>`).join('')}</select>` : `<span style="font-size:12px;color:var(--icu-text-muted);white-space:nowrap">${STATE.unit}</span>`}
        </div>
        <div class="icu-quick-doses">
          <span style="font-size:10.5px;font-weight:700;color:var(--icu-text-muted);text-transform:uppercase;letter-spacing:.04em;align-self:center;margin-right:4px">Nhanh:</span>
          ${drug.quickDoses.map(d => `<button class="icu-quick-dose" onclick="ICU.setQuickDose(${d})">${d}</button>`).join('')}
        </div>
      </div>

      <div class="icu-btn-row">
        <button type="button" class="icu-btn-primary" onclick="ICU.calculate()">⚡ Tính tốc độ</button>
        <button type="button" class="icu-btn-secondary" onclick="ICU.reset()">🗑️ Xóa</button>
      </div>
    `;
  }

  function renderResults() {
    const drug = STATE.drug();
    const rate = calcRate(drug, STATE.amt, STATE.vol, STATE.dose, STATE.unit, STATE.weight);
    const steps = calcSteps(drug, STATE.amt, STATE.vol, STATE.dose, STATE.unit, STATE.weight);

    if (!Number.isFinite(rate) || isNaN(rate) || rate <= 0) return;

    // Hero
    document.getElementById('icu-hero').innerHTML = `
      <div class="icu-hero-label">${drug.nameVI} — Liều: ${STATE.dose} ${STATE.unit}${drug.weightBased ? ` | BN ${STATE.weight} kg` : ''}</div>
      <div><span class="icu-hero-rate">${fmt(rate, 2)}</span><span class="icu-hero-unit">mL/giờ</span></div>
      <div class="icu-hero-conc">${steps.concLabel}</div>
      <div class="icu-hero-steps">${steps.step1}\n${steps.step2}</div>
    `;

    // Ref table
    const isUnits = (STATE.unit === 'units/h' || STATE.unit === 'units/min' || STATE.unit === 'units/kg/h');
    const tableRows = drug.refDoses.map(rd => {
      const refRate = calcRate(drug, STATE.amt, STATE.vol, rd.doseVal, STATE.unit, STATE.weight);
      const isCurrent = Math.abs(rd.doseVal - STATE.dose) < (drug.doseStep * 0.5 + 0.001);
      const riskBadge = rd.risk === 'danger'
        ? '<span class="icu-badge icu-badge-danger">⚠️ Nguy hiểm</span>'
        : rd.risk === 'warning'
        ? '<span class="icu-badge icu-badge-warning">⚡ Cao</span>'
        : '<span class="icu-badge icu-badge-ok">✓ Thông thường</span>';

      return `<tr class="${isCurrent ? 'row-highlight' : ''}">
        <td>${rd.doseVal} ${STATE.unit}${isCurrent ? ' ◀' : ''}</td>
        <td>${rd.label}</td>
        <td><span class="icu-rate-pill">${Number.isFinite(refRate) ? fmt(refRate, 2) : '—'} mL/h</span></td>
        <td>${riskBadge}</td>
        <td style="color:#5b6e6e;font-size:12px">${rd.note}</td>
      </tr>`;
    }).join('');

    document.getElementById('icu-ref-table').innerHTML = `
      <thead>
        <tr>
          <th>Liều (${STATE.unit})</th>
          <th>Phân loại</th>
          <th>Tốc độ (mL/h)</th>
          <th>Mức độ</th>
          <th>Ghi chú lâm sàng</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    `;

    // Clinical notes
    document.getElementById('icu-clinical-content').innerHTML = `
      <div class="icu-info-banner">${drug.clinicalNote}</div>
    `;

    document.getElementById('icu-results').classList.add('icu-show');
  }

  /* =========================================================================
   * CONTROLLER
   * ========================================================================= */

  const ICU = {
    selectDrug(id) {
      const drug = DRUG_DB.find(d => d.id === id);
      STATE.init(drug);
      // sync the dropdown value (called from dropdown onchange, but also from init)
      const sel = document.getElementById('icu-drug-main-select');
      if (sel) sel.value = id;
      updateClassPill();
      renderInputCard();
      document.getElementById('icu-results').classList.remove('icu-show');
    },

    setWeight(v) { STATE.weight = parseFloat(v) || 65; },
    setAmt(v)    { STATE.amt    = parseFloat(v) || STATE.drug().defaultAmtValue;
                   // clear preset selection
                   const ps = document.getElementById('icu-conc-preset');
                   if (ps) ps.value = ''; },
    setCustomVol(v) {
      const val = parseFloat(v);
      if (val > 0) {
        STATE.vol = val;
        const ps = document.getElementById('icu-conc-preset');
        if (ps) ps.value = '';
      }
    },
    applyPreset(sel) {
      const opt = sel.options[sel.selectedIndex];
      if (!opt || !opt.dataset.amt) return;
      STATE.amt = parseFloat(opt.dataset.amt);
      STATE.vol = parseFloat(opt.dataset.vol);
      const amtEl = document.getElementById('icu-amt');
      const volEl = document.getElementById('icu-vol-custom');
      if (amtEl) amtEl.value = STATE.amt;
      if (volEl) volEl.value = STATE.vol;
    },
    setUnit(u) {
      STATE.unit = u;
      renderInputCard();
    },
    setDose(v) {
      STATE.dose = parseFloat(v) || STATE.drug().doseDefault;
      const slider = document.getElementById('icu-dose-slider');
      const disp   = document.getElementById('icu-dose-display');
      if (slider) slider.value = STATE.dose;
      if (disp)   disp.textContent = STATE.dose + ' ' + STATE.unit;
    },
    setDoseSlider(v) {
      STATE.dose = parseFloat(v);
      const inp  = document.getElementById('icu-dose-input');
      const disp = document.getElementById('icu-dose-display');
      if (inp)  inp.value = STATE.dose;
      if (disp) disp.textContent = STATE.dose + ' ' + STATE.unit;
    },
    setQuickDose(v) {
      STATE.dose = v;
      const slider = document.getElementById('icu-dose-slider');
      const inp    = document.getElementById('icu-dose-input');
      const disp   = document.getElementById('icu-dose-display');
      if (slider) slider.value = v;
      if (inp)    inp.value = v;
      if (disp)   disp.textContent = v + ' ' + STATE.unit;
    },
    calculate() {
      const amtEl    = document.getElementById('icu-amt');
      const weightEl = document.getElementById('icu-weight');
      const doseEl   = document.getElementById('icu-dose-input');
      const volEl    = document.getElementById('icu-vol-custom');

      if (amtEl)    STATE.amt    = parseFloat(amtEl.value)    || STATE.amt;
      if (weightEl) STATE.weight = parseFloat(weightEl.value) || STATE.weight;
      if (doseEl)   STATE.dose   = parseFloat(doseEl.value)   || STATE.dose;
      if (volEl)    STATE.vol    = parseFloat(volEl.value)    || STATE.vol;

      if (!STATE.amt || STATE.amt <= 0) { alert('Vui lòng nhập lượng thuốc > 0.'); return; }
      if (!STATE.vol || STATE.vol <= 0) { alert('Vui lòng nhập thể tích > 0 mL.'); return; }
      if (!STATE.dose || STATE.dose <= 0) { alert('Vui lòng nhập liều mục tiêu > 0.'); return; }

      renderResults();
      document.getElementById('icu-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    reset() {
      const drug = STATE.drug();
      STATE.init(drug);
      renderInputCard();
      document.getElementById('icu-results').classList.remove('icu-show');
    },
  };

  window.ICU = ICU;

  function init() {
    renderDrugTabs();
    renderInputCard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
