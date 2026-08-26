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
SERVICE_WORKER_FILE = ROOT / "sw.js"
CLINICAL_DATA_VERSION_RE = re.compile(
    r"(const CLINICAL_DATA_VERSION = ')[^']+(';)",
)
CLINICAL_NAME = re.compile(
    r"(?:data|database|profile|medicine|alert|icd10|disease|contra|renal|infusion|"
    r"clinical|dosing|interaction|antibiotic|pharmacovigilance|pregnancy|"
    r"hepatotoxicity|injectable|stock|source)",
    re.IGNORECASE,
)
PHARMACOVIGILANCE_AUTO_FILES = {
    "pharmacovigilance_auto.json",
    "pharmacovigilance_auto_data.js",
}
NON_CLINICAL_METADATA_FIELDS = {
    "generated_at",
    "source_listing_count",
    "newly_fetched_count",
    "retained_history_count",
    "detail_error_count",
}
AUTO_DATA_ASSIGNMENT_RE = re.compile(
    r"\s*window\.VPMED_PHARMACOVIGILANCE_AUTO_DATA\s*=\s*(\{.*\});\s*",
    re.DOTALL,
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


def clinical_file_bytes(path: Path) -> bytes:
    if path.name not in PHARMACOVIGILANCE_AUTO_FILES:
        return path.read_bytes()

    if path.suffix.lower() == ".json":
        payload = json.loads(path.read_text(encoding="utf-8"))
    else:
        source = path.read_text(encoding="utf-8")
        match = AUTO_DATA_ASSIGNMENT_RE.fullmatch(source)
        if not match:
            raise RuntimeError(f"Không đọc được dữ liệu cảnh báo dược trong {path}.")
        payload = json.loads(match.group(1))

    if not isinstance(payload, dict):
        raise RuntimeError(f"Dữ liệu cảnh báo dược trong {path} không phải object.")
    normalized_payload = dict(payload)
    for field in NON_CLINICAL_METADATA_FIELDS:
        normalized_payload.pop(field, None)
    return json.dumps(
        normalized_payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def clinical_digest(paths: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in paths:
        relative = path.relative_to(ROOT).as_posix().encode("utf-8")
        digest.update(relative)
        digest.update(b"\0")
        digest.update(clinical_file_bytes(path))
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
    worker = SERVICE_WORKER_FILE.read_text(encoding="utf-8")
    updated_worker, replacements = CLINICAL_DATA_VERSION_RE.subn(
        rf"\g<1>{payload['clinicalDataVersion']}\g<2>",
        worker,
        count=1,
    )
    if replacements != 1:
        raise RuntimeError("Không tìm thấy CLINICAL_DATA_VERSION trong sw.js.")
    SERVICE_WORKER_FILE.write_text(updated_worker, encoding="utf-8", newline="\n")
    print(
        f"Đã cập nhật clinicalDataVersion từ {len(files)} file lâm sàng "
        "và đồng bộ service worker."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
