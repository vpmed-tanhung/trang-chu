(() => {
  'use strict';

  const BUILD_VERSION = '2026.08.22.40';
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
      'assets/unified.js?v=20260822-renal-layout-v4-large-clean',
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
    dose: DOSE_CLINICAL,
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
        'assets/prescription-check.js?v=20260822-behavior-tests-v1'
      ]
    },
    'inpatient-order': {
      styles: ['assets/inpatient-order-review.css?v=20260821-inpatient-file-grid-v4'],
      scripts: [
        'assets/data.js',
        'assets/rx-official-sources.js?v=20260819-rx-official-v1',
        'assets/interaction-regulatory-data.js?v=20260817-rx-regulatory-v2',
        'assets/renal_database_20260723.js?v=20260723-renal-only-v4',
        'assets/inpatient-order-review.js?v=20260822-platform-events-v1'
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
        'assets/stock_clinical_data_20260814.js',
        'assets/stock_clinical_tools.js?v=20260822-platform-events-v1'
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
        'assets/pharmacovigilance_auto_data.js?v=20260822062331',
        'assets/pharmacovigilance_bulletin_76_data.js?v=20260804',
        'assets/pharmacovigilance_auto_editor.js?v=20260728-structured',
        'assets/pharmacovigilance_integration.js?v=20260822-platform-shell-v1'
      ]
    }
  });

  const loadedResources = new Set();
  const featureLoads = new Map();
  const prefetchedResources = new Set();
  let deferredInstallPrompt = null;
  let calculationCompleted = false;
  let serviceWorkerRegistration = null;
  let isReloadingForWorker = false;
  let hadServiceWorkerController = Boolean(navigator.serviceWorker?.controller);
  let cachedClinicalState = null;

  function absoluteUrl(url) {
    return new URL(url, document.baseURI).href;
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
    loadedResources.add(key);
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = absoluteUrl(url);
      link.dataset.vpmedLazy = 'style';
      link.addEventListener('load', resolve, {once: true});
      link.addEventListener('error', () => {
        loadedResources.delete(key);
        reject(new Error(`Không tải được CSS: ${url}`));
      }, {once: true});
      document.head.appendChild(link);
    });
  }

  function loadScript(url) {
    const key = resourceKey(url);
    if (loadedResources.has(key)) return Promise.resolve();
    loadedResources.add(key);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = absoluteUrl(url);
      script.async = false;
      script.dataset.vpmedLazy = 'script';
      script.addEventListener('load', resolve, {once: true});
      script.addEventListener('error', () => {
        loadedResources.delete(key);
        reject(new Error(`Không tải được JavaScript: ${url}`));
      }, {once: true});
      document.body.appendChild(script);
    });
  }

  async function loadBundle(name) {
    const bundle = FEATURE_BUNDLES[name];
    if (!bundle) throw new Error(`Không tìm thấy module: ${name}`);
    if (featureLoads.has(name)) return featureLoads.get(name);
    const promise = (async () => {
      await Promise.all(bundle.styles.map(loadStyle));
      for (const script of bundle.scripts) await loadScript(script);
    })();
    featureLoads.set(name, promise);
    try {
      await promise;
    } catch (error) {
      featureLoads.delete(name);
      throw error;
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
    document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view === target));
    document.querySelectorAll('.main-nav button').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
    document.getElementById('mainNav')?.classList.remove('open');
    if (!options.fromHistory) history.replaceState(null, '', `#${name}`);
    if (!options.preserveScroll) {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      window.scrollTo({top: 0, behavior: reduceMotion ? 'auto' : 'smooth'});
    }
  }

  async function openFeature(requestedName, options = {}) {
    const name = requestedName === 'icd10-bhyt' ? 'home' : requestedName;
    if (!FEATURE_BUNDLES[name]) {
      toast('Công cụ này chưa sẵn sàng.', {tone: 'warning'});
      return;
    }
    setCardLoading(name, true);
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
    link.href = absoluteUrl(url);
    link.crossOrigin = 'anonymous';
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

  function showWorkerUpdateBanner(registration) {
    let banner = document.getElementById('vpmedUpdateBanner');
    if (!banner) {
      banner = document.createElement('aside');
      banner.id = 'vpmedUpdateBanner';
      banner.className = 'vpmed-shell-banner vpmed-update-banner';
      banner.innerHTML = '<div><strong>Có phiên bản ứng dụng mới</strong><span>Tải lại để dùng mã nguồn và dữ liệu mới nhất.</span></div><div class="vpmed-shell-banner-actions"><button type="button" data-refresh>Cập nhật ngay</button><button type="button" class="secondary" data-dismiss>Để sau</button></div>';
      document.body.appendChild(banner);
      banner.querySelector('[data-dismiss]').addEventListener('click', () => { banner.hidden = true; });
    }
    banner.hidden = false;
    banner.querySelector('[data-refresh]').onclick = () => {
      const waiting = registration.waiting;
      if (waiting) waiting.postMessage({type: 'SKIP_WAITING'});
      else location.reload();
    };
  }

  function handleWorkerMessage(event) {
    const message = event.data || {};
    if (message.type === 'VPMED_OFFLINE_DATA_FALLBACK') {
      renderConnectivity('cached-data', message);
      toast('Đang dùng bản dữ liệu y khoa ngoại tuyến.', {tone: 'warning', persistent: true});
    }
    if (message.type === 'VPMED_DATA_VERSION_CHANGED') {
      renderConnectivity(navigator.onLine ? 'online' : 'offline');
      emit(EVENT_NAMES.dataVersionChanged, {
        previousVersion: message.previousVersion,
        version: message.version,
        source: 'service-worker'
      });
      toast('Dữ liệu y khoa trên máy chủ đã có phiên bản mới. Tải lại trước khi tiếp tục đối chiếu điều trị.', {
        tone: 'warning',
        persistent: true,
        actionLabel: 'Tải lại dữ liệu',
        onAction: () => location.reload()
      });
    }
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
    try {
      const registration = await navigator.serviceWorker.register('sw.js', {scope: './'});
      serviceWorkerRegistration = registration;
      if (registration.waiting && navigator.serviceWorker.controller) showWorkerUpdateBanner(registration);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showWorkerUpdateBanner(registration);
        });
      });
      navigator.serviceWorker.addEventListener('message', handleWorkerMessage);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
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
        serviceWorkerRegistration?.update();
        navigator.serviceWorker?.controller?.postMessage({type: 'CHECK_DATA_VERSION'});
      }
    });
  }

  function initialize() {
    markInitialResources();
    calculationCompleted = sessionStorage.getItem('vpmed-calculation-completed') === '1';
    window.VPMED_PLATFORM = Object.freeze({
      version: BUILD_VERSION,
      events: EVENT_NAMES,
      openFeature,
      prefetchFeature,
      emit,
      toast,
      calculationComplete
    });
    bindNavigation();
    bindLifecycle();
    renderConnectivity(navigator.onLine ? 'online' : 'offline');
    registerServiceWorker();
    emit(EVENT_NAMES.shellReady, {features: Object.keys(FEATURE_BUNDLES)});
    openFeature(location.hash.slice(1) || 'home', {source: 'initial', fromHistory: true, preserveScroll: true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once: true});
  else initialize();
})();
