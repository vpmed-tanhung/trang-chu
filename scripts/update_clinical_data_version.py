#!/usr/bin/env python3
"""Gắn phiên bản nội dung lâm sàng vào app-version.json bằng hàm băm xác định."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
VERSION_FILE = ASSETS / "app-version.json"
CLINICAL_NAME = re.compile(
    r"(?:data|database|profile|medicine|alert|icd10|disease|contra|renal|infusion|"
    r"clinical|dosing|interaction|antibiotic|pharmacovigilance|pregnancy|"
    r"hepatotoxicity|injectable|stock|source)",
    re.IGNORECASE,
)


def clinical_files() -> list[Path]:
    return sorted(
        (
            path
            for path in ASSETS.rglob("*")
            if path.is_file()
            and path.suffix.lower() in {".js", ".json", ".csv"}
            and path.name != VERSION_FILE.name
            and CLINICAL_NAME.search(path.name)
        ),
        key=lambda path: path.relative_to(ROOT).as_posix(),
    )


def clinical_digest(paths: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in paths:
        relative = path.relative_to(ROOT).as_posix().encode("utf-8")
        digest.update(relative)
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def main() -> int:
    files = clinical_files()
    payload = json.loads(VERSION_FILE.read_text(encoding="utf-8"))
    payload["clinicalDataVersion"] = f"sha256-{clinical_digest(files)[:24]}"
    VERSION_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"Đã cập nhật clinicalDataVersion từ {len(files)} file lâm sàng.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

