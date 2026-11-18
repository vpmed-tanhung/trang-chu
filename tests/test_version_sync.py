import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION_SCRIPT = ROOT / "scripts" / "update_clinical_data_version.py"
VERSION_SPEC = importlib.util.spec_from_file_location(
    "update_clinical_data_version",
    VERSION_SCRIPT,
)
assert VERSION_SPEC and VERSION_SPEC.loader
VERSIONER = importlib.util.module_from_spec(VERSION_SPEC)
VERSION_SPEC.loader.exec_module(VERSIONER)


def test_footer_matches_the_build_embedded_in_current_html():
    version = json.loads((ROOT / "assets" / "app-version.json").read_text(encoding="utf-8"))
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    match = re.search(r'id="vpmedLatestVersion"[^>]*>\s*·\s*v([^<]+)</span>', html)
    assert match, "Không tìm thấy phiên bản hiển thị ở footer"
    assert match.group(1).strip() == version["displayVersion"]
    assert version["previousDisplayVersion"] != version["displayVersion"]


def test_build_and_display_versions_are_present():
    version = json.loads((ROOT / "assets" / "app-version.json").read_text(encoding="utf-8"))
    assert str(version.get("version", "")).strip()
    assert str(version.get("displayVersion", "")).strip()
    assert str(version.get("previousVersion", "")).strip()
    assert str(version.get("previousDisplayVersion", "")).strip()
    assert str(version.get("updatedAt", "")).strip()


def test_service_worker_uses_manifest_clinical_data_version():
    version = json.loads((ROOT / "assets" / "app-version.json").read_text(encoding="utf-8"))
    worker = (ROOT / "sw.js").read_text(encoding="utf-8")
    match = re.search(r"const CLINICAL_DATA_VERSION = '([^']+)'", worker)
    assert match, "Service worker thiếu mốc phiên bản dữ liệu chuyên môn"
    assert match.group(1) == version["clinicalDataVersion"]


def test_manifest_clinical_version_matches_current_data_hash():
    version = json.loads((ROOT / "assets" / "app-version.json").read_text(encoding="utf-8"))
    expected = f"sha256-{VERSIONER.clinical_digest(VERSIONER.clinical_files())[:24]}"
    assert version["clinicalDataVersion"] == expected


def test_automated_advisories_do_not_generate_a_new_clinical_version(tmp_path, monkeypatch):
    monkeypatch.setattr(VERSIONER, "ROOT", tmp_path)
    monkeypatch.setattr(VERSIONER, "ASSETS", tmp_path / "assets")
    assets = VERSIONER.ASSETS
    assets.mkdir()
    reference = assets / "renal_data.json"
    reference.write_text('{"revision":1}', encoding="utf-8")
    before = VERSIONER.clinical_digest(VERSIONER.clinical_files())

    (assets / "pharmacovigilance_auto.json").write_text('{"alerts":[{"id":"new"}]}', encoding="utf-8")
    (assets / "pharmacovigilance_auto_data.js").write_text(
        'window.VPMED_PHARMACOVIGILANCE_AUTO_DATA = {"alerts":[{"id":"new"}]};',
        encoding="utf-8",
    )
    assert VERSIONER.clinical_digest(VERSIONER.clinical_files()) == before
    reference.write_text('{"revision":2}', encoding="utf-8")
    assert VERSIONER.clinical_digest(VERSIONER.clinical_files()) != before
