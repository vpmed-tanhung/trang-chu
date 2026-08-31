(() => {
  'use strict';

  const BUILD_VERSION = '2026.08.31.70';
  const IS_INSTALLED_APP = (() => {
    try {
      return new URL(location.href).searchParams.get('vpmed_app') === 'installed' ||
        Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches) ||
        window.navigator?.standalone === true;
    } catch (error) {
      return Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches) ||
        window.navigator?.standalone === true;
    }
  })();
  const CLIENT_MODE = IS_INSTALLED_APP ? 'installed' : 'web';
  const EVENT_NAMES = Object.freeze({
    shellReady: 'vpmed:shell-ready',
    featureOpen: 'vpmed:feature-open',
    calculationComplete: 'vpmed:calculation-complete',
    dataVersionChanged: 'vpmed:data-version-changed'
  });

  const CORE_CLINICAL = Object.freeze({
    styles: ['assets/antibiotic-result-layout.css?v=20260822-renal-layout-v4-large-clean'],
    scripts: [
      'assets/data.js',
      'assets/rx-official-sources.js?v=20260819-rx-official-v1',
      'assets/interaction-regulatory-data.js?v=20260817-rx-regulatory-v2',
      'assets/contra_adr_hdsd_duocthu_20260717.js?v=20260717-final',
      'assets/clinical_updates.js',
      'assets/clinical_details.js',
      'assets/clinical_details_v2.js',
      'assets/clinical_details_v3.js',
      'assets/infusion_guide_update_20260709.js',
      'assets/clinical_dosing.js',
      'assets/antibiotic_38_complete.js?v=20260716-38-drugs',
      'assets/renal_database_20260723.js?v=20260723-renal-only-v4',
      'assets/diseases.js',
      'assets/unified.js?v=20260829-scroll-guard-v1',
      'assets/vpmed-renal-audit.js?v=20260814-module-history-v5',
      'assets/antibiotic_consultation.js?v=20260814-short-module-copy-v1',
      'assets/dose_24h_summary.js?v=20260822-renal-layout-v4-large-clean',
      'assets/vancomycin_renal_v2.js?v=20260723-renal-only-v6',
      'vpmed-interaction-compact.js',
      'vpmed-dose-reset.js',
      'vpmed-remove-quick-two-drug.js',
      'assets/disease_updates_2026.js',
      'vpmed-approved-data-bridge.js'
    ]
  });

  const DOSE_CLINICAL = Object.freeze({
    styles: [
      ...CORE_CLINICAL.styles,
      'assets/renal-dose-presentation.css?v=20260822-renal-layout-v4-large-clean'
    ],
    scripts: [
      ...CORE_CLINICAL.scripts,
      'assets/renal-dose-presentation.js?v=20260822-renal-layout-v4-large-clean'
    ]
  });

  const FEATURE_BUNDLES = Object.freeze({
    home: {styles: [], scripts: []},
    sources: {styles: [], scripts: []},
    'cap-cuu-phan-ve': {
      styles: [],
      scripts: [],
      frame: 'cap-cuu-phan-ve.html?v=20260829-no-clip-v2'
    },
    dose: DOSE_CLINICAL,
    'antibiotic-consultation': {
      styles: [],
      scripts: [
        'assets/data.js',
        'assets/antibiotic_38_complete.js?v=20260716-38-drugs',
        'assets/antibiotic_consultation.js?v=20260814-short-module-copy-v1'
      ]
    },
    antibiotics: CORE_CLINICAL,
    diseases: CORE_CLINICAL,
    interactions: CORE_CLINICAL,
    'prescription-check': {
      styles: ['assets/prescription-check.css?v=20260821-rx-actions-v9'],
      scripts: [
        'assets/data.js',
        'assets/rx-official-sources.js?v=20260819-rx-official-v1',
        'assets/interaction-regulatory-data.js?v=20260817-rx-regulatory-v2',
        'assets/contra_adr_hdsd_duocthu_20260717.js?v=20260717-final',
        'assets/icd-clinical-match.js?v=20260817-tt06-2026',
        'assets/prescription-diagnosis-ocr.js?v=20260817-exact-icd-v2',
        'assets/prescription-result-model.js?v=20260822-behavior-tests-v1',
        'assets/prescription-check.js?v=20260827-ocr-complete-v1'
      ]
    },
    'inpatient-order': {
      styles: [
        'assets/prescription-check.css?v=20260821-rx-actions-v9',
        'assets/inpatient-order-review.css?v=20260829-ai-availability-v1'
      ],
      scripts: [
        'assets/data.js',
        'assets/rx-official-sources.js?v=20260819-rx-official-v1',
        'assets/interaction-regulatory-data.js?v=20260817-rx-regulatory-v2',
        'assets/renal_database_20260723.js?v=20260723-renal-only-v4',
        'assets/inpatient_medicines_20260707.js?v=20260828-ai-identity-v1',
        'assets/inpatient-drug-identity.js?v=20260828-brand-preserve-v3',
        'assets/inpatient-order-review.js?v=20260829-ai-availability-v1'
      ]
    },
    'petct-dose': {
      styles: [],
      scripts: [
        'assets/petct_batch_calculator.js?v=20260802-formula-only',
        'assets/petct-tool.js?v=20260822-lazy-v1',
        'assets/petct_step_form.js?v=20260713'
      ]
    },
    hepatotoxicity: {
      styles: ['assets/hepatotoxicity.css?v=20260822-lazy-v1'],
      scripts: ['assets/hepatotoxicity.js?v=20260822-lazy-v1']
    },
    'pregnancy-lactation': {
      styles: ['assets/pregnancy_lactation.css?v=20260822-lazy-v1'],
      scripts: ['assets/pregnancy_lactation.js?v=20260822-lazy-v1']
    },
    'pediatric-dose': {
      styles: ['assets/stock_clinical_tools.css?v=20260814-direct-sources-v6'],
      scripts: [
        'assets/stock_clinical_data_20260814.js?v=20260822-pediatric-expansion-v1',
        'assets/stock_clinical_tools.js?v=20260822-pediatric-expansion-v1'
      ]
    },
    'injectable-guide': {
      styles: ['assets/injectable_guide.css?v=20260814-content-from-original-v2'],
      scripts: [
        'assets/injectable_guide_data.js?v=20260814-content-from-original-v2',
        'assets/injectable_guide.js?v=20260814-content-from-original-v2'
      ]
    },
    pharmacovigilance: {
      styles: [],
      scripts: [
        'assets/pharmacovigilance_alerts_data.js?v=20260711',
        'assets/pharmacovigilance_auto_data.js?v=20260830073553',
        'assets/pharmacovigilance_bulletin_76_data.js?v=20260804',
        'assets/pharmacovigilance_auto_editor.js?v=20260823-concise-summary-v2',
        'assets/pharmacovigilance_integration.js?v=20260823-concise-summary-v2'
      ]
    },
    'icd10-bhyt': {
      styles: [],
      scripts: [
        'assets/data.js',
        'assets/inpatient_medicines_20260707.js',
        'assets/drug_profiles_305_vpmed_20260710.js',
        'assets/icd10_verified_profiles_20260710.js',
        'assets/infusion_guide_update_20260709.js',
        'assets/icd10_byt2026_data.js?v=20260824-icd10-bhyt-enable-v1',
        'assets/icd10_bhyt_lookup.js?v=20260824-icd10-bhyt-enable-v1'
      ]
    }
  });

  const loadedResources = new Set();
  const resourceLoads = new Map();
  const featureLoads = new Map();
  const prefetchedResources = new Set();
  let deferredInstallPrompt = null;
  let calculationCompleted = false;
  let serviceWorkerRegistration = null;
  let isReloadingForWorker = false;
  let hadServiceWorkerController = Boolean(navigator.serviceWorker?.controller);
  let cachedClinicalState = null;
  let activeClinicalFeature = false;
  let announcedDataVersion = '';

  function clientAwareUrl(url) {
    const parsed = new URL(url, document.baseURI);
    if (IS_INSTALLED_APP && parsed.origin === location.origin) {
      parsed.searchParams.set('vpmed_client', 'installed');
    }
    return parsed.href;
  }

  function markInstalledContextUrl() {
    if (!IS_INSTALLED_APP) return;
    try {
      const current = new URL(location.href);
      if (current.searchParams.get('vpmed_app') === 'installed') return;
      current.searchParams.set('vpmed_app', 'installed');
      history.replaceState(null, '', current.pathname + current.search + current.hash);
    } catch (error) {}
  }

  function resourceKey(url) {
    const parsed = new URL(url, document.baseURI);
    return `${parsed.origin}${parsed.pathname}`;
  }

  function markInitialResources() {
    document.querySelectorAll('script[src],link[rel~="stylesheet"][href]').forEach((element) => {
      const value = element.src || element.href;
      if (value) loadedResources.add(resourceKey(value));
    });
  }

  function emit(name, detail = {}) {
    const event = new CustomEvent(name, {detail: {...detail, buildVersion: BUILD_VERSION}});
    window.dispatchEvent(event);
    return event;
  }

  function toast(message, options = {}) {
    let region = document.getElementById('vpmedShellToasts');
    if (!region) {
      region = document.createElement('div');
      region.id = 'vpmedShellToasts';
      region.className = 'vpmed-shell-toasts';
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    const item = document.createElement('div');
    item.className = `vpmed-shell-toast ${options.tone || ''}`.trim();
    const copy = document.createElement('span');
    copy.textContent = message;
    item.appendChild(copy);
    if (options.actionLabel && typeof options.onAction === 'function') {
      const action = document.createElement('button');
      action.type = 'button';
      action.textContent = options.actionLabel;
      action.addEventListener('click', () => {
        options.onAction();
        item.remove();
      });
      item.appendChild(action);
    }
    region.appendChild(item);
    if (!options.persistent) window.setTimeout(() => item.remove(), options.duration || 6500);
    return item;
  }

  function loadStyle(url) {
    const key = resourceKey(url);
    if (loadedResources.has(key)) return Promise.resolve();
    if (resourceLoads.has(key)) return resourceLoads.get(key);
    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = clientAwareUrl(url);
      link.dataset.vpmedLazy = 'style';
      link.addEventListener('load', () => {
        loadedResources.add(key);
        resourceLoads.delete(key);
        resolve();
      }, {once: true});
      link.addEventListener('error', () => {
        resourceLoads.delete(key);
        reject(new Error(`Không tải được CSS: ${url}`));
      }, {once: true});
      document.head.appendChild(link);
    });
    resourceLoads.set(key, promise);
    return promise;
  }

  function loadScript(url) {
    const key = resourceKey(url);
    if (loadedResources.has(key)) return Promise.resolve();
    if (resourceLoads.has(key)) return resourceLoads.get(key);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = clientAwareUrl(url);
      /* Dynamic classic scripts with async=false are fetched in parallel but
         still execute in insertion order, preserving module dependencies. */
      script.async = false;
      script.dataset.vpmedLazy = 'script';
      script.addEventListener('load', () => {
        loadedResources.add(key);
        resourceLoads.delete(key);
        resolve();
      }, {once: true});
      script.addEventListener('error', () => {
        resourceLoads.delete(key);
        reject(new Error(`Không tải được JavaScript: ${url}`));
      }, {once: true});
      document.body.appendChild(script);
    });
    resourceLoads.set(key, promise);
    return promise;
  }

  async function loadBundle(name) {
    const bundle = FEATURE_BUNDLES[name];
    if (!bundle) throw new Error(`Không tìm thấy module: ${name}`);
    if (featureLoads.has(name)) return featureLoads.get(name);
    const promise = (async () => {
      await Promise.all(bundle.styles.map(loadStyle));
      await Promise.all(bundle.scripts.map(loadScript));
      if (bundle.frame) await loadFeatureFrame(name, bundle.frame);
    })();
    featureLoads.set(name, promise);
    try {
      await promise;
    } catch (error) {
      featureLoads.delete(name);
      throw error;
    }
  }

  function measureFeatureFrame(frame) {
    if (!frame?.contentDocument) return;
    try {
      const doc = frame.contentDocument;
      const app = doc.querySelector('.app');
      const height = Math.ceil(app
        ? Math.max(app.scrollHeight, app.getBoundingClientRect().height)
        : Math.max(doc.documentElement?.scrollHeight || 0, doc.body?.scrollHeight || 0));
      if (!Number.isFinite(height) || height < 320 || height > 50000) return;
      frame.style.height = `${height + 2}px`;
      frame.dataset.vpmedAutoHeight = 'true';
    } catch (error) {
      // Khung khác origin (nếu có) vẫn dùng cơ chế postMessage hiện tại.
    }
  }

  function scheduleFeatureFrameMeasure(frame) {
    [0, 80, 250, 600].forEach((delay) => {
      window.setTimeout(() => {
        if (!frame?.closest('.view')?.classList.contains('active')) return;
        frame.contentWindow?.postMessage({type: 'vpmed:feature-frame-measure'}, '*');
        measureFeatureFrame(frame);
      }, delay);
    });
  }

  function loadFeatureFrame(name, url) {
    const frame = document.querySelector(`[data-feature-frame="${CSS.escape(name)}"]`);
    if (!frame) return Promise.reject(new Error(`Thiếu khung hiển thị cho module ${name}`));
    if (frame.dataset.vpmedReady === 'true') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const onLoad = () => {
        frame.dataset.vpmedReady = 'true';
        frame.setAttribute('scrolling', 'no');
        scheduleFeatureFrameMeasure(frame);
        resolve();
      };
      const onError = () => reject(new Error(`Không tải được khung module: ${url}`));
      frame.addEventListener('load', onLoad, {once: true});
      frame.addEventListener('error', onError, {once: true});
      frame.src = clientAwareUrl(url);
    });
  }

  function handleFeatureFrameMessage(event) {
    const data = event.data;
    if (!data || typeof data !== 'object' || !String(data.type || '').startsWith('vpmed:feature-frame-')) return;
    const name = String(data.feature || '');
    const frame = document.querySelector(`[data-feature-frame="${CSS.escape(name)}"]`);
    if (!frame || event.source !== frame.contentWindow) return;
    if (data.type === 'vpmed:feature-frame-height') {
      if (!frame.closest('.view')?.classList.contains('active')) return;
      const height = Math.ceil(Number(data.height));
      if (!Number.isFinite(height) || height < 320 || height > 50000) return;
      frame.style.height = `${height + 2}px`;
      frame.dataset.vpmedAutoHeight = 'true';
      return;
    }
    if (data.type === 'vpmed:feature-frame-scroll') {
      const ownerView = frame.closest('.view');
      if (!data.userInitiated || !ownerView?.classList.contains('active')) return;
      const offset = Math.max(0, Number(data.top) || 0);
      const top = window.scrollY + frame.getBoundingClientRect().top + offset;
      const targetTop = Math.max(0, top - 8);
      if (Math.abs(window.scrollY - targetTop) < 24) return;
      window.requestAnimationFrame(() => {
        if (ownerView.classList.contains('active')) {
          window.scrollTo({top: targetTop, left: 0, behavior: 'auto'});
        }
      });
    }
  }

  function setCardLoading(name, loading) {
    document.querySelectorAll(`[data-open="${CSS.escape(name)}"]`).forEach((card) => {
      card.classList.toggle('vpmed-feature-loading', loading);
      card.setAttribute('aria-busy', String(loading));
    });
  }

  function showView(name, options = {}) {
    const target = document.getElementById(`view-${name}`);
    if (!target) throw new Error(`Thiếu vùng hiển thị cho module ${name}`);
    const viewChanged = !target.classList.contains('active');
    document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view === target));
    document.querySelectorAll('.main-nav button').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
    document.getElementById('mainNav')?.classList.remove('open');
    if (!options.fromHistory) history.replaceState(null, '', `#${name}`);
    const frame = target.querySelector('[data-feature-frame]');
    if (frame) scheduleFeatureFrameMeasure(frame);
    if (!options.preserveScroll && viewChanged) {
      window.requestAnimationFrame(() => window.scrollTo({top: 0, left: 0, behavior: 'auto'}));
    }
  }

  async function openFeature(requestedName, options = {}) {
    const name = requestedName;
    if (!FEATURE_BUNDLES[name]) {
      toast('Công cụ này chưa sẵn sàng.', {tone: 'warning'});
      return;
    }
    setCardLoading(name, true);
    if (name !== 'home' && name !== 'sources') activeClinicalFeature = true;
    emit(EVENT_NAMES.featureOpen, {feature: name, phase: 'loading', source: options.source || 'navigation'});
    try {
      await loadBundle(name);
      showView(name, options);
      emit(EVENT_NAMES.featureOpen, {feature: name, phase: 'opened', source: options.source || 'navigation'});
    } catch (error) {
      console.error('[VPMED] Không thể mở module', name, error);
      toast(`Không thể tải công cụ. ${navigator.onLine ? 'Vui lòng thử lại.' : 'Thiết bị đang mất mạng.'}`, {tone: 'error', persistent: true});
      emit(EVENT_NAMES.featureOpen, {feature: name, phase: 'error', message: String(error?.message || error)});
      if (name !== 'home') showView('home');
    } finally {
      setCardLoading(name, false);
    }
  }

  function connectionAllowsPrefetch() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return true;
    if (connection.saveData) return false;
    return !/^(slow-2g|2g|3g)$/i.test(connection.effectiveType || '');
  }

  function prefetchResource(url, type) {
    const key = resourceKey(url);
    if (loadedResources.has(key) || prefetchedResources.has(key)) return;
    prefetchedResources.add(key);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = type;
    link.href = clientAwareUrl(url);
    document.head.appendChild(link);
  }

  function prefetchFeature(name) {
    if (!connectionAllowsPrefetch()) return false;
    const bundle = FEATURE_BUNDLES[name];
    if (!bundle) return false;
    bundle.styles.forEach((url) => prefetchResource(url, 'style'));
    bundle.scripts.forEach((url) => prefetchResource(url, 'script'));
    return true;
  }

  function schedulePrefetch(name) {
    const run = () => prefetchFeature(name);
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, {timeout: 1500});
    else window.setTimeout(run, 120);
  }

  function ensureConnectivityBanner() {
    let banner = document.getElementById('vpmedConnectivity');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'vpmedConnectivity';
      banner.className = 'vpmed-connectivity';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      banner.hidden = true;
      document.body.prepend(banner);
    }
    return banner;
  }

  function renderConnectivity(state, detail = {}) {
    const banner = ensureConnectivityBanner();
    if (state === 'online' && cachedClinicalState) {
      state = 'cached-data';
      detail = cachedClinicalState;
    }
    if (state === 'online') {
      banner.hidden = true;
      banner.className = 'vpmed-connectivity';
      banner.textContent = '';
      return;
    }
    banner.hidden = false;
    banner.className = `vpmed-connectivity ${state === 'cached-data' ? 'is-cached-data' : 'is-offline'}`;
    if (state === 'cached-data') {
      cachedClinicalState = {...detail};
      const version = detail.version ? ` (phiên bản ${detail.version})` : '';
      const parsedTime = detail.cachedAt ? new Date(detail.cachedAt) : null;
      const cachedAt = parsedTime && !Number.isNaN(parsedTime.getTime())
        ? `, lưu lúc ${parsedTime.toLocaleString('vi-VN')}`
        : '';
      banner.replaceChildren(document.createTextNode(
        `Đang dùng dữ liệu y khoa lưu ngoại tuyến${version}${cachedAt}. Hãy tải lại và kiểm tra dữ liệu máy chủ trước khi quyết định điều trị. `
      ));
      const reload = document.createElement('button');
      reload.type = 'button';
      reload.textContent = 'Tải lại dữ liệu';
      reload.addEventListener('click', () => location.reload());
      banner.appendChild(reload);
    } else {
      banner.textContent = 'Thiết bị đang mất mạng. Kết quả có thể dựa trên dữ liệu đã lưu; cần đối chiếu nguồn hiện hành trước khi quyết định điều trị.';
    }
  }

  function createInstallBanner() {
    let banner = document.getElementById('vpmedInstallBanner');
    if (banner) return banner;
    banner = document.createElement('aside');
    banner.id = 'vpmedInstallBanner';
    banner.className = 'vpmed-shell-banner';
    banner.hidden = true;
    banner.innerHTML = '<div><strong>Cài VPMED Dược lâm sàng</strong><span>Mở nhanh hơn và dùng App Shell khi mất mạng.</span></div><div class="vpmed-shell-banner-actions"><button type="button" data-install>Đề xuất cài app</button><button type="button" class="secondary" data-dismiss>Có thể để sau</button></div>';
    document.body.appendChild(banner);
    banner.querySelector('[data-install]').addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      banner.hidden = true;
    });
    banner.querySelector('[data-dismiss]').addEventListener('click', () => {
      banner.hidden = true;
      sessionStorage.setItem('vpmed-install-dismissed', '1');
    });
    return banner;
  }

  function maybeShowInstallBanner() {
    if (!deferredInstallPrompt || !calculationCompleted || sessionStorage.getItem('vpmed-install-dismissed') === '1') return;
    createInstallBanner().hidden = false;
  }

  function calculationComplete(detail = {}) {
    calculationCompleted = true;
    sessionStorage.setItem('vpmed-calculation-completed', '1');
    emit(EVENT_NAMES.calculationComplete, detail);
    maybeShowInstallBanner();
  }

  function showWorkerUpdateBanner(registration, detail = {}) {
    let banner = document.getElementById('vpmedUpdateBanner');
    if (!banner) {
      banner = document.createElement('aside');
      banner.id = 'vpmedUpdateBanner';
      banner.className = 'vpmed-shell-banner vpmed-update-banner';
      banner.innerHTML = '<div><strong data-update-title>Có phiên bản ứng dụng mới</strong><span data-update-copy>Tải lại để dùng phiên bản mới nhất.</span></div><div class="vpmed-shell-banner-actions"><button type="button" data-refresh>Cập nhật ngay</button><button type="button" class="secondary" data-dismiss>Để sau</button></div>';
      document.body.appendChild(banner);
      banner.querySelector('[data-dismiss]').addEventListener('click', () => { banner.hidden = true; });
    }
    const version = String(detail.version || '').trim();
    const dataVersion = String(detail.dataVersion || '').trim();
    const displayVersion = String(detail.displayVersion || '').trim();
    const isClinicalDataUpdate = detail.kind === 'clinical-data';
    const title = banner.querySelector('[data-update-title]');
    const copy = banner.querySelector('[data-update-copy]');
    if (title) title.textContent = isClinicalDataUpdate
      ? 'Nguồn dữ liệu tra cứu có cập nhật'
      : 'Có phiên bản ứng dụng mới';
    if (copy) copy.textContent = isClinicalDataUpdate
      ? 'Cập nhật để ứng dụng dùng cùng nguồn dữ liệu chuyên môn mới như bản web.'
      : (displayVersion
        ? `Phiên bản v${displayVersion} đã sẵn sàng. Tải lại để sử dụng.`
        : 'Tải lại để dùng phiên bản mới nhất.');
    banner.hidden = false;
    banner.querySelector('[data-refresh]').onclick = () => {
      if (isClinicalDataUpdate && dataVersion && window.VPMED_UPDATE_NOTIFIER?.applyDataUpdate) {
        window.VPMED_UPDATE_NOTIFIER.applyDataUpdate(dataVersion, version);
        return;
      }
      if (version && window.VPMED_UPDATE_NOTIFIER?.applyUpdate) {
        window.VPMED_UPDATE_NOTIFIER.applyUpdate(version);
        return;
      }
      const waiting = registration?.waiting || serviceWorkerRegistration?.waiting;
      if (waiting) waiting.postMessage({type: 'SKIP_WAITING'});
      else location.reload();
    };
  }

  function handleWorkerMessage(event) {
    const message = event.data || {};
    if (message.targetMode && message.targetMode !== CLIENT_MODE) return;
    if (message.type === 'VPMED_OFFLINE_DATA_FALLBACK') {
      renderConnectivity('cached-data', message);
      toast('Đang dùng bản dữ liệu y khoa ngoại tuyến.', {tone: 'warning', persistent: true});
    }
    if (message.type === 'VPMED_DATA_VERSION_AVAILABLE' && IS_INSTALLED_APP) {
      const nextVersion = String(message.version || '').trim();
      const previousVersion = String(message.previousVersion || '').trim();
      if (!nextVersion || nextVersion === previousVersion || nextVersion === announcedDataVersion) return;
      announcedDataVersion = nextVersion;
      emit(EVENT_NAMES.dataVersionChanged, {
        previousVersion,
        version: nextVersion,
        source: 'service-worker'
      });
      showWorkerUpdateBanner(serviceWorkerRegistration, {
        kind: 'clinical-data',
        dataVersion: nextVersion,
        version: String(message.buildVersion || '').trim()
      });
      return;
    }
    if (message.type === 'VPMED_DATA_VERSION_CHANGED') {
      const nextVersion = String(message.version || '').trim();
      const previousVersion = String(message.previousVersion || '').trim();
      if (!nextVersion || nextVersion === previousVersion || nextVersion === announcedDataVersion) return;
      announcedDataVersion = nextVersion;
      renderConnectivity(navigator.onLine ? 'online' : 'offline');
      emit(EVENT_NAMES.dataVersionChanged, {
        previousVersion: message.previousVersion,
        version: message.version,
        source: 'service-worker'
      });
      /* Khi người dùng còn ở trang chủ, áp dụng dữ liệu mới ngay bằng đúng một
         lần tải lại. Nếu đã vào công cụ, chỉ nhắc một lần để tránh làm mất dữ liệu nhập. */
      const autoReloadKey = 'vpmed_auto_data_reload_version_v1';
      if (!activeClinicalFeature && navigator.onLine && sessionStorage.getItem(autoReloadKey) !== nextVersion) {
        sessionStorage.setItem(autoReloadKey, nextVersion);
        location.reload();
        return;
      }
      /* Chờ notifier chính xử lý trước. Chỉ hiện cảnh báo dữ liệu riêng khi
         không có bản ứng dụng mới, bảo đảm cùng lúc chỉ có một thông báo cập nhật. */
      window.setTimeout(() => {
        if (document.getElementById('vpmedUpdateBanner') || serviceWorkerRegistration?.waiting) return;
        toast('Dữ liệu y khoa trên máy chủ đã có phiên bản mới. Tải lại trước khi tiếp tục đối chiếu điều trị.', {
          tone: 'warning',
          persistent: true,
          actionLabel: 'Tải lại dữ liệu',
          onAction: () => location.reload()
        });
      }, 350);
    }
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
    try {
      const registration = await navigator.serviceWorker.register('sw.js', {scope: './'});
      serviceWorkerRegistration = registration;
      navigator.serviceWorker.controller?.postMessage({type: 'REGISTER_CLIENT_MODE', clientMode: CLIENT_MODE});
      navigator.serviceWorker.ready.then(() => {
        navigator.serviceWorker.controller?.postMessage({type: 'REGISTER_CLIENT_MODE', clientMode: CLIENT_MODE});
      }).catch(() => {});
      if (!IS_INSTALLED_APP && registration.waiting && navigator.serviceWorker.controller) showWorkerUpdateBanner(registration);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (!IS_INSTALLED_APP && worker.state === 'installed' && navigator.serviceWorker.controller) showWorkerUpdateBanner(registration);
        });
      });
      navigator.serviceWorker.addEventListener('message', handleWorkerMessage);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        navigator.serviceWorker.controller?.postMessage({type: 'REGISTER_CLIENT_MODE', clientMode: CLIENT_MODE});
        if (IS_INSTALLED_APP) return;
        if (!hadServiceWorkerController) {
          hadServiceWorkerController = true;
          return;
        }
        if (isReloadingForWorker) return;
        isReloadingForWorker = true;
        location.reload();
      });
    } catch (error) {
      console.warn('[VPMED] Không đăng ký được Service Worker:', error);
    }
  }

  function bindNavigation() {
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-open],[data-view],[data-go]');
      if (!trigger || trigger.disabled || trigger.getAttribute('aria-disabled') === 'true') return;
      const name = trigger.dataset.open || trigger.dataset.view || trigger.dataset.go;
      if (!name) return;
      event.preventDefault();
      openFeature(name, {source: trigger.dataset.open ? 'feature-card' : 'navigation'});
    }, true);
    document.getElementById('menuBtn')?.addEventListener('click', () => document.getElementById('mainNav')?.classList.toggle('open'));
    const intentHandler = (event) => {
      const trigger = event.target.closest?.('[data-open]');
      if (trigger && !trigger.disabled) schedulePrefetch(trigger.dataset.open);
    };
    document.addEventListener('pointerenter', intentHandler, true);
    document.addEventListener('focusin', intentHandler);
    document.addEventListener('touchstart', intentHandler, {passive: true, capture: true});
    window.addEventListener('popstate', () => openFeature(location.hash.slice(1) || 'home', {source: 'history', fromHistory: true}));
  }

  function bindLifecycle() {
    window.addEventListener('message', handleFeatureFrameMessage);
    window.addEventListener('vpmed:app-update-available', (event) => {
      const detail = event.detail || {};
      if (!IS_INSTALLED_APP || detail.kind === 'clinical-data') {
        showWorkerUpdateBanner(serviceWorkerRegistration, detail);
      }
    });
    window.addEventListener('online', () => {
      renderConnectivity('online');
      toast(cachedClinicalState
        ? 'Đã có mạng. Hãy tải lại để thay dữ liệu ngoại tuyến bằng dữ liệu máy chủ.'
        : 'Đã kết nối mạng. Hệ thống sẽ ưu tiên dữ liệu từ máy chủ.', {tone: cachedClinicalState ? 'warning' : 'info'});
    });
    window.addEventListener('offline', () => renderConnectivity('offline'));
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      maybeShowInstallBanner();
    });
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      const banner = document.getElementById('vpmedInstallBanner');
      if (banner) banner.hidden = true;
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!IS_INSTALLED_APP) serviceWorkerRegistration?.update();
        navigator.serviceWorker?.controller?.postMessage({type: 'CHECK_DATA_VERSION', clientMode: CLIENT_MODE});
      }
    });
  }

  function initialize() {
    markInstalledContextUrl();
    markInitialResources();
    calculationCompleted = sessionStorage.getItem('vpmed-calculation-completed') === '1';
    window.VPMED_PLATFORM = Object.freeze({
      version: BUILD_VERSION,
      events: EVENT_NAMES,
      openFeature,
      prefetchFeature,
      emit,
      toast,
      calculationComplete,
      isInstalledApp: IS_INSTALLED_APP
    });
    bindNavigation();
    bindLifecycle();
    renderConnectivity(navigator.onLine ? 'online' : 'offline');
    registerServiceWorker();
    emit(EVENT_NAMES.shellReady, {features: Object.keys(FEATURE_BUNDLES)});
    openFeature(location.hash.slice(1) || 'home', {source: 'initial', fromHistory: true, preserveScroll: true});
    /* Làm ấm bộ dữ liệu dùng chung của mô-đun liều thận khi mạng đủ nhanh.
       Việc này diễn ra lúc trình duyệt rảnh, không chặn hiển thị trang chủ. */
    schedulePrefetch('dose');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once: true});
  else initialize();
})();
