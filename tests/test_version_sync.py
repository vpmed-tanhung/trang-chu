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


def test_operational_metadata_does_not_create_a_new_clinical_version(tmp_path):
    original = {
        "generated_at": "2026-08-26T06:00:00+07:00",
        "source": "https://example.test/source",
        "source_listing_count": 10,
        "newly_fetched_count": 1,
        "retained_history_count": 2,
        "detail_error_count": 0,
        "review_status": "Đã kiểm tra.",
        "alerts": [{"id": "auto-1", "title": "Cảnh báo không đổi"}],
    }
    next_check = {
        **original,
        "generated_at": "2026-08-27T06:00:00+07:00",
        "source_listing_count": 11,
        "newly_fetched_count": 0,
        "retained_history_count": 3,
        "detail_error_count": 1,
    }

    for filename in (
        "pharmacovigilance_auto.json",
        "pharmacovigilance_auto_data.js",
    ):
        first = tmp_path / "first" / filename
        second = tmp_path / "second" / filename
        first.parent.mkdir(parents=True, exist_ok=True)
        second.parent.mkdir(parents=True, exist_ok=True)
        if filename.endswith(".json"):
            first.write_text(json.dumps(original, ensure_ascii=False), encoding="utf-8")
            second.write_text(json.dumps(next_check, ensure_ascii=False), encoding="utf-8")
        else:
            prefix = "window.VPMED_PHARMACOVIGILANCE_AUTO_DATA = "
            first.write_text(
                prefix + json.dumps(original, ensure_ascii=False) + ";\n",
                encoding="utf-8",
            )
            second.write_text(
                prefix + json.dumps(next_check, ensure_ascii=False) + ";\n",
                encoding="utf-8",
            )
        assert VERSIONER.clinical_file_bytes(first) == VERSIONER.clinical_file_bytes(second)
