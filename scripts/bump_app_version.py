#!/usr/bin/env python3
"""Đồng bộ phiên bản hiển thị và build của website VPMED."""
import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = ROOT / "assets" / "app-version.json"
INDEX_FILE = ROOT / "index.html"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--display", required=True, help="Ví dụ: 4.2")
    ap.add_argument("--build", required=True, help="Ví dụ: 2026.08.18.12")
    ap.add_argument("--note", default="Cập nhật website.")
    ap.add_argument("--build-id", default="")
    ap.add_argument("--previous-build", default="", help="Build đã được người dùng chấp nhận trước đó")
    ap.add_argument("--previous-display", default="", help="Phiên bản hiển thị trước đó, ví dụ: 5.0")
    ap.add_argument(
        "--manual-activation",
        action="store_true",
        help="Giữ footer ở phiên bản trước cho tới khi người dùng bấm Cập nhật",
    )
    args = ap.parse_args()

    data = json.loads(VERSION_FILE.read_text(encoding="utf-8"))
    old_build = str(data.get("version", "")).strip()
    old_display = str(data.get("displayVersion", "")).strip()
    data["version"] = args.build
    data["displayVersion"] = args.display
    if args.manual_activation:
        data["previousVersion"] = args.previous_build or old_build
        data["previousDisplayVersion"] = args.previous_display or old_display
    else:
        data.pop("previousVersion", None)
        data.pop("previousDisplayVersion", None)
    data["updatedAt"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).isoformat(timespec="seconds")
    data["note"] = args.note
    data["buildId"] = args.build_id or f"v{args.display}-{args.build}"
    VERSION_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    html = INDEX_FILE.read_text(encoding="utf-8")
    pattern = r'(id="vpmedLatestVersion"[^>]*>\s*·\s*v)[^<]+(</span>)'
    footer_display = data.get("previousDisplayVersion", args.display)
    html2, count = re.subn(pattern, rf'\g<1>{footer_display}\g<2>', html, count=1)
    if count != 1:
        raise SystemExit("Không cập nhật được phiên bản footer trong index.html")
    INDEX_FILE.write_text(html2, encoding="utf-8")
    print(f"Đã đồng bộ bản phát hành v{args.display} / build {args.build}; footer v{footer_display}")


if __name__ == "__main__":
    main()
