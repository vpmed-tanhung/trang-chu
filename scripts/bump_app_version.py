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
SERVICE_WORKER_FILE = ROOT / "sw.js"
APP_VERSION_RE = re.compile(r"(const APP_VERSION = ')[^']+(';)")
BUILD_META_RE = re.compile(
    r'(<meta\s+name="vpmed-build-version"\s+content=")[^"]+("\s*/?>)',
)
BUILD_STAMP_PAGES = (
    "index.html",
    "cap-nhat-du-lieu.html",
    "cong-cu-duoc-lam-sang.html",
    "petct-dose-tool.html",
    "phieu-danh-gia.html",
    "tai-khoan.html",
)


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
        help="Giữ mốc phiên bản trước để trình thông báo cập nhật thủ công",
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
    # HTML của build mới phải mang đúng số phiên bản mới. Người dùng còn ở
    # build cũ vẫn thấy footer cũ từ HTML đang được cache; sau khi bấm cập nhật
    # và tải build này, footer mới đổi sang phiên bản hiện tại.
    footer_display = args.display
    html2, count = re.subn(pattern, rf'\g<1>{footer_display}\g<2>', html, count=1)
    if count != 1:
        raise SystemExit("Không cập nhật được phiên bản footer trong index.html")
    INDEX_FILE.write_text(html2, encoding="utf-8")

    for page_name in BUILD_STAMP_PAGES:
        page = ROOT / page_name
        source = page.read_text(encoding="utf-8")
        stamped, stamp_count = BUILD_META_RE.subn(
            rf"\g<1>{args.build}\g<2>",
            source,
            count=1,
        )
        if stamp_count != 1:
            raise SystemExit(f"Không cập nhật được vpmed-build-version trong {page_name}")
        page.write_text(stamped, encoding="utf-8")

    worker = SERVICE_WORKER_FILE.read_text(encoding="utf-8")
    worker2, worker_count = APP_VERSION_RE.subn(
        rf"\g<1>{args.build}\g<2>",
        worker,
        count=1,
    )
    if worker_count != 1:
        raise SystemExit("Không cập nhật được APP_VERSION trong sw.js")
    SERVICE_WORKER_FILE.write_text(worker2, encoding="utf-8", newline="\n")
    print(f"Đã đồng bộ bản phát hành v{args.display} / build {args.build}; footer v{footer_display}")


if __name__ == "__main__":
    main()
