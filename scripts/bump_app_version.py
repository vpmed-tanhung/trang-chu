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
    args = ap.parse_args()

    data = json.loads(VERSION_FILE.read_text(encoding="utf-8"))
    data["version"] = args.build
    data["displayVersion"] = args.display
    data["updatedAt"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).isoformat(timespec="seconds")
    data["note"] = args.note
    data["buildId"] = args.build_id or f"v{args.display}-{args.build}"
    VERSION_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    html = INDEX_FILE.read_text(encoding="utf-8")
    pattern = r'(id="vpmedLatestVersion"[^>]*>\s*·\s*v)[^<]+(</span>)'
    html2, count = re.subn(pattern, rf'\g<1>{args.display}\g<2>', html, count=1)
    if count != 1:
        raise SystemExit("Không cập nhật được phiên bản footer trong index.html")
    INDEX_FILE.write_text(html2, encoding="utf-8")
    print(f"Đã đồng bộ phiên bản hiển thị v{args.display} / build {args.build}")


if __name__ == "__main__":
    main()
