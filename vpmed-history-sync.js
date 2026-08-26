/*
  VPMED - Đồng bộ hai chiều lịch sử tra cứu liều với Google Sheet Khoa Dược.
  Đồng bộ mã bệnh nhân, thời gian, CrCl, eGFR, thuốc và gợi ý liều.
*/
(function () {
  'use strict';

  const HISTORY_KEY = 'vpmed_dose_history_v6';
  const SENT_KEY = 'vpmed_history_last_sent_signature_v1';
  const HISTORY_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwgt3wEKmSUlVCHvReMsRo1bW8QBsHyPYq-FUAPztD4uibx-Rv-u1HnTO4aJM45d4hC0w/exec';
  const MAX_ROWS = 100;
  const REFRESH_INTERVAL_MS = 30000;
  const nativeSetItem = localStorage.setItem.bind(localStorage);
  let refreshTimer = null;

  function safeString(value) {
    return value == null ? '' : String(value).trim();
  }

  function escapeHtml(value) {
    return safeString(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function normalizeCrcl(value) {
    const text = safeString(value);
    if (!/^\d{4}-\d{2}-\d{2}T17:00:00(?:\.000)?Z$/.test(text)) return text;
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok', day: 'numeric', month: 'numeric'
    }).formatToParts(new Date(text));
    const day = parts.find(function (item) { return item.type === 'day'; });
    const month = parts.find(function (item) { return item.type === 'month'; });
    return day && month ? Number(day.value) + '.' + Number(month.value) : text;
  }

  function normalizeRow(item) {
    const sourceAdvice = safeString(item && item.advice);
    const marker = sourceAdvice.match(/^\[Mã BN:\s*([^\]]+)\]\s*/i);
    return {
      time: safeString(item && item.time) || new Date().toLocaleString('vi-VN'),
      patientCode: safeString(item && (item.patientCode || item.patient_code || item.maBenhNhan)) || safeString(marker && marker[1]),
      crcl: normalizeCrcl(item && item.crcl),
      egfr: safeString(item && item.egfr),
      drug: safeString(item && item.drug),
      advice: marker ? sourceAdvice.slice(marker[0].length).trim() : sourceAdvice
    };
  }

  function makeSignature(item) {
    const row = normalizeRow(item);
    return [row.time, row.patientCode, row.crcl, row.egfr, row.drug, row.advice].join('|');
  }

  function parseVietnameseTime(value) {
    const text = safeString(value);
    let match = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) return new Date(+match[6], +match[5] - 1, +match[4], +match[1], +match[2], +(match[3] || 0)).getTime();
    match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) return new Date(+match[3], +match[2] - 1, +match[1], +match[4], +match[5], +(match[6] || 0)).getTime();
    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function loadLocalRows() {
    try {
      const rows = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(rows) ? rows.map(normalizeRow) : [];
    } catch (err) {
      return [];
    }
  }

  function prepareRemoteRows(remoteRows) {
    const seen = new Set();
    return [].concat(remoteRows || []).map(normalizeRow).filter(function (row) {
      if (!row.patientCode && !row.drug && !row.crcl && !row.egfr && !row.advice) return false;
      const signature = makeSignature(row);
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    }).sort(function (left, right) {
      return parseVietnameseTime(right.time) - parseVietnameseTime(left.time);
    }).slice(0, MAX_ROWS);
  }

  function renderRows(rows) {
    const body = document.querySelector('#hist');
    if (!body) return;
    body.innerHTML = rows.length ? rows.map(function (row) {
      return '<tr><td>' + escapeHtml(row.time) + '</td><td>' + escapeHtml(row.patientCode || '—') +
        '</td><td>' + escapeHtml(row.crcl) + ' mL/ph</td><td>' + escapeHtml(row.egfr || '—') + '</td><td>' +
        escapeHtml(row.drug) + '</td><td>' + escapeHtml(row.advice) + '</td></tr>';
    }).join('') : '<tr><td colspan="6" style="text-align:center">Chưa có lịch sử</td></tr>';
  }

  function setStatus(message, isError) {
    const status = document.querySelector('#sharedHistoryStatus');
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#a33b32' : '';
  }

  async function refreshSharedHistory() {
    setStatus('Đang đồng bộ dữ liệu chung…', false);
    try {
      const response = await fetch(HISTORY_WEB_APP_URL + '?_=' + Date.now(), {
        method: 'GET', cache: 'no-store'
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const payload = await response.json();
      const remoteRows = Array.isArray(payload) ? payload : (Array.isArray(payload && payload.history) ? payload.history : []);
      const rows = prepareRemoteRows(remoteRows);
      nativeSetItem(HISTORY_KEY, JSON.stringify(rows));
      renderRows(rows);
      setStatus(rows.length ? 'Đã đồng bộ ' + rows.length + ' lượt tra cứu gần nhất.' : 'Hiện không có lịch sử tra cứu.', false);
      return rows;
    } catch (err) {
      const rows = loadLocalRows();
      renderRows(rows);
      setStatus('Chưa tải được dữ liệu chung; đang hiển thị lịch sử có trên thiết bị này.', true);
      return rows;
    }
  }

  function postHistory(payload) {
    if (!HISTORY_WEB_APP_URL) return;
    const row = normalizeRow(payload);
    const outbound = Object.assign({}, row, {
      advice: row.patientCode ? '[Mã BN: ' + row.patientCode + '] ' + row.advice : row.advice
    });
    fetch(HISTORY_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(outbound)
    }).then(function () {
      window.setTimeout(refreshSharedHistory, 2500);
    }).catch(function () {
      setStatus('Lượt tra cứu đã lưu trên thiết bị nhưng chưa gửi được lên dữ liệu chung.', true);
    });
  }

  function syncLatestHistory() {
    const rows = loadLocalRows();
    if (!rows.length) return;
    const latest = normalizeRow(rows[0]);
    if (!latest.patientCode && !latest.drug && !latest.crcl && !latest.egfr && !latest.advice) return;
    const signature = makeSignature(latest);
    if (localStorage.getItem(SENT_KEY) === signature) return;
    nativeSetItem(SENT_KEY, signature);
    postHistory(latest);
  }

  function start() {
    const refreshButton = document.querySelector('#clear');
    if (refreshButton) {
      refreshButton.textContent = 'Làm mới lịch sử';
      refreshButton.classList.remove('btn-danger-soft');
      refreshButton.classList.add('btn-soft');
      refreshButton.onclick = refreshSharedHistory;
    }
    document.querySelector('#calc')?.addEventListener('click', function () {
      window.setTimeout(syncLatestHistory, 0);
    });
    refreshSharedHistory();
    refreshTimer = window.setInterval(function () {
      if (document.visibilityState !== 'hidden') refreshSharedHistory();
    }, REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') refreshSharedHistory();
    });
  }

  window.VPMED_SHARED_HISTORY = {
    refresh: refreshSharedHistory,
    syncLatest: syncLatestHistory,
    stop: function () { if (refreshTimer) window.clearInterval(refreshTimer); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
