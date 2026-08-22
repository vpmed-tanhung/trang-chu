import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "cong-cu-duoc-lam-sang.html"


def test_clinical_tool_does_not_contain_captured_output_placeholders():
    html = HTML_PATH.read_text(encoding="utf-8")

    assert html.lstrip().startswith("<!DOCTYPE html>")
    for corrupted_text in [
        "Warning: truncated output",
        "Total output lines:",
        "tokens truncated",
        "TODO (khôi phục nội dung)",
    ]:
        assert corrupted_text not in html

    assert html.count("<style") == html.count("</style>")


def test_eid_reference_markup_is_complete():
    html = HTML_PATH.read_text(encoding="utf-8")

    assert "Hartford Nomogram — Nicolau DP." in html
    assert re.search(
        r'<div class="ref-hdr">📚 Tài liệu tham khảo</div>\s*'
        r'<ol class="ref-ol">\s*'
        r'<li>Hartford Nomogram — Nicolau DP\.',
        html,
    )



def test_standalone_colistin_calculator_is_removed():
    html = HTML_PATH.read_text(encoding="utf-8")
    renal_module = (ROOT / "assets" / "cong-cu-modules" / "renal-dosing-modules.js").read_text(
        encoding="utf-8"
    )

    for removed_html in [
        'data-pg="colistin"',
        "showPg('colistin')",
        'id="pg-colistin"',
        'class="vcl-',
        "VCL.",
        "colistin_renal_dose",
        "Module 4 · Colistin (CMS)",
    ]:
        assert removed_html not in html

    for removed_script in [
        "const VCL =",
        "window.VCL = VCL",
        "auditColistin",
        "colistin_renal_dose",
        "vcl-",
    ]:
        assert removed_script not in renal_module
