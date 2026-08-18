import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_footer_version_matches_app_version():
    version = json.loads((ROOT / "assets" / "app-version.json").read_text(encoding="utf-8"))
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    match = re.search(r'id="vpmedLatestVersion"[^>]*>\s*·\s*v([^<]+)</span>', html)
    assert match, "Không tìm thấy phiên bản hiển thị ở footer"
    assert match.group(1).strip() == version["displayVersion"]


def test_build_and_display_versions_are_present():
    version = json.loads((ROOT / "assets" / "app-version.json").read_text(encoding="utf-8"))
    assert str(version.get("version", "")).strip()
    assert str(version.get("displayVersion", "")).strip()
    assert str(version.get("updatedAt", "")).strip()
