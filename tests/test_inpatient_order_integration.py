from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_inpatient_order_feature_is_wired_without_regressing_rx_review():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    shell = (ROOT / 'assets' / 'platform-shell.js').read_text(encoding='utf-8')
    unified = (ROOT / 'assets' / 'unified.js').read_text(encoding='utf-8')

    assert 'assets/inpatient-order-review.css?v=20260821-inpatient-file-grid-v4' in shell
    inpatient_bundle = shell.split("'inpatient-order': {", 1)[1].split("'petct-dose':", 1)[0]
    shared_layout_css = 'assets/prescription-check.css?v=20260821-rx-actions-v9'
    module_css = 'assets/inpatient-order-review.css?v=20260821-inpatient-file-grid-v4'
    assert shared_layout_css in inpatient_bundle
    assert inpatient_bundle.index(shared_layout_css) < inpatient_bundle.index(module_css)
    assert 'data-open="inpatient-order"' in html
    assert 'id="view-inpatient-order"' in html
    assert 'assets/inpatient-order-review.js?v=20260822-platform-events-v1' in shell
    assert "'inpatient-order'" in unified

    # Các sửa mới nhất của module rà soát đơn BHYT phải được giữ nguyên khi merge.
    assert 'phân biệt thiếu mã bệnh với mã bệnh chưa thật sự phù hợp' in html
    assert 'HDSD/SPC Cục QLD · Dược thư QGVN III · Phác đồ/Hướng dẫn BYT' in html
    assert 'TT20/2022 · TT37/2024 · TT01/2025 · NĐ188/2025' in html
    assert 'assets/prescription-check.js?v=20260827-ocr-complete-v1' in shell


def test_inpatient_order_artifacts_are_present():
    required = [
        'TINH_NANG_Y_LENH_NOI_TRU.md',
        'apps-script/inpatient-order-review.gs',
        'assets/inpatient-order-review.css',
        'assets/inpatient-order-review.js',
        'docs/ai-prompts/y-lenh-noi-tru-system-prompt.md',
        'tests/test_inpatient_order_severity.js',
        'tests/test_inpatient_order_renal.js',
    ]
    for rel in required:
        assert (ROOT / rel).is_file(), rel


def test_inpatient_order_web_app_endpoint_is_configured():
    js = (ROOT / 'assets' / 'inpatient-order-review.js').read_text(encoding='utf-8')
    assert 'DAN_DEPLOYMENT_ID' not in js
    assert 'https://script.google.com/macros/s/' in js
    assert '/exec' in js


def test_bundled_apps_script_uses_gemini_free_vision_with_fallback():
    gs = (ROOT / 'apps-script' / 'inpatient-order-review.gs').read_text(encoding='utf-8')
    assert "var GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite']" in gs
    assert 'https://generativelanguage.googleapis.com/v1beta/models/' in gs
    assert "getProperty('GEMINI_API_KEY')" in gs
    assert "responseMimeType: 'application/json'" in gs
    assert 'https://api.openai.com' not in gs


def test_bhyt_ocr_text_has_optional_ai_review_without_uploading_images():
    js = (ROOT / 'assets' / 'prescription-check.js').read_text(encoding='utf-8')
    gs = (ROOT / 'apps-script' / 'inpatient-order-review.gs').read_text(encoding='utf-8')

    assert 'deidentifyOcrText' in js
    assert "action:'analyzeBhytPrescriptionText'" in js
    assert 'ocrText:text' in js
    assert 'images:' not in js
    assert 'handleAnalyzeBhytPrescriptionText' in gs
    assert "payload.action === 'analyzeBhytPrescriptionText'" in gs
    assert 'callGeminiText(BHYT_TEXT_PROMPT, text)' in gs
    assert 'requestGemini(instructions' in gs


def test_inpatient_order_has_compact_busy_indicator():
    js = (ROOT / 'assets' / 'inpatient-order-review.js').read_text(encoding='utf-8')
    css = (ROOT / 'assets' / 'inpatient-order-review.css').read_text(encoding='utf-8')

    assert 'Đang phân tích…' in js
    assert 'io-analyzing-state' in js
    assert 'aria-busy' in js
    assert '.io-spinner' in css
    assert '@keyframes io-spin' in css


def test_privacy_confirmation_is_compact_and_below_renal_inputs():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'inpatient-order-review.js').read_text(encoding='utf-8')
    css = (ROOT / 'assets' / 'inpatient-order-review.css').read_text(encoding='utf-8')

    renal_result = html.index('id="ioRenalCalcResult"')
    consent = html.index('id="ioConsent"')
    actions = html.index('class="rx-new-prescription-action"', consent)
    assert renal_result < consent < actions
    assert 'io-privacy-banner' not in html
    assert 'io-consent-compact' in html
    assert 'width:12px;height:12px;min-width:12px' in css
    assert '.io-renal-calc:empty{display:none}' in css
    placeholder = 'Chọn tình trạng thận và nhập dữ liệu hiện có. Hệ thống không tự chốt mức liều'
    assert placeholder not in html
    assert placeholder not in js


def test_uploaded_image_queue_uses_stable_grid_without_mid_row_gaps():
    css = (ROOT / 'assets' / 'inpatient-order-review.css').read_text(encoding='utf-8')

    assert '.io-file-queue{display:grid;' in css
    assert 'grid-template-columns:repeat(auto-fill,minmax(132px,1fr))' in css
    assert '.io-file-queue{display:flex' not in css
    assert '.io-file-chip{position:relative;display:flex;align-items:center;gap:8px;width:100%;min-width:0;box-sizing:border-box' in css


def test_inpatient_order_has_deterministic_renal_safety_layer():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'inpatient-order-review.js').read_text(encoding='utf-8')
    gs = (ROOT / 'apps-script' / 'inpatient-order-review.gs').read_text(encoding='utf-8')

    for field_id in [
        'ioRenalStatus', 'ioAge', 'ioSex', 'ioWeight', 'ioHeight',
        'ioScr', 'ioScrUnit',
    ]:
        assert f'id="{field_id}"' in html

    assert 'id="ioScrTime"' not in html
    assert 'id="ioVerifiedCrcl"' not in html

    assert 'calculateRenalAssessment' in js
    assert 'calcEgfr2021' in js
    assert 'VPMED_GET_RENAL_DOSE' in js
    assert 'note: buildRenalNote(renalAssessment)' in js
    assert "mode === 'aki'" in js
    assert "mode === 'hd'" in js
    assert "mode === 'crrt'" in js
    assert 'Không tự chọn dải liều cố định' in js
    assert 'suggestedRegimen' in gs
    assert 'liều nạp' in gs
