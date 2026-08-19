from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_inpatient_order_feature_is_wired_without_regressing_rx_review():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    unified = (ROOT / 'assets' / 'unified.js').read_text(encoding='utf-8')

    assert 'assets/inpatient-order-review.css?v=20260819-inpatient-order-v2-busy' in html
    assert 'data-open="inpatient-order"' in html
    assert 'id="view-inpatient-order"' in html
    assert 'assets/inpatient-order-review.js?v=20260819-inpatient-order-v4-busy' in html
    assert "'inpatient-order'" in unified

    # Các sửa mới nhất của module rà soát đơn BHYT phải được giữ nguyên khi merge.
    assert 'phân biệt thiếu mã bệnh với mã bệnh chưa thật sự phù hợp' in html
    assert 'HDSD/SPC Cục QLD · Dược thư QGVN III · Phác đồ/Hướng dẫn BYT' in html
    assert 'TT20/2022 · TT37/2024 · TT01/2025 · NĐ188/2025' in html
    assert 'assets/prescription-check.js?v=20260819-build21' in html


def test_inpatient_order_artifacts_are_present():
    required = [
        'TINH_NANG_Y_LENH_NOI_TRU.md',
        'apps-script/inpatient-order-review.gs',
        'assets/inpatient-order-review.css',
        'assets/inpatient-order-review.js',
        'docs/ai-prompts/y-lenh-noi-tru-system-prompt.md',
        'tests/test_inpatient_order_severity.js',
    ]
    for rel in required:
        assert (ROOT / rel).is_file(), rel


def test_inpatient_order_web_app_endpoint_is_configured():
    js = (ROOT / 'assets' / 'inpatient-order-review.js').read_text(encoding='utf-8')
    assert 'DAN_DEPLOYMENT_ID' not in js
    assert 'https://script.google.com/macros/s/' in js
    assert '/exec' in js


def test_bundled_apps_script_uses_connected_gemini_model():
    gs = (ROOT / 'apps-script' / 'inpatient-order-review.gs').read_text(encoding='utf-8')
    assert "var GEMINI_MODEL = 'gemini-3.6-flash'" in gs


def test_inpatient_order_has_compact_busy_indicator():
    js = (ROOT / 'assets' / 'inpatient-order-review.js').read_text(encoding='utf-8')
    css = (ROOT / 'assets' / 'inpatient-order-review.css').read_text(encoding='utf-8')

    assert 'Đang phân tích…' in js
    assert 'io-analyzing-state' in js
    assert 'aria-busy' in js
    assert '.io-spinner' in css
    assert '@keyframes io-spin' in css
