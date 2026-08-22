#!/usr/bin/env python3
"""Tạo hoặc kiểm tra SHA256SUMS.txt theo nội dung thực tế của repository."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "SHA256SUMS.txt"
EXCLUDED_DIRECTORIES = {".git", "node_modules", "__pycache__", ".pytest_cache"}
EXCLUDED_FILES = {OUTPUT.resolve()}


def included_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.is_symlink():
            continue
        if any(part in EXCLUDED_DIRECTORIES for part in path.relative_to(ROOT).parts):
            continue
        if path.resolve() in EXCLUDED_FILES:
            continue
        files.append(path)
    return sorted(files, key=lambda item: item.relative_to(ROOT).as_posix())


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def expected_content() -> str:
    lines = [
        f"{sha256(path)}  ./{path.relative_to(ROOT).as_posix()}"
        for path in included_files()
    ]
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Chỉ kiểm tra, không ghi file")
    args = parser.parse_args()
    expected = expected_content()
    if args.check:
        actual = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if actual != expected:
            print("SHA256SUMS.txt không khớp nội dung repository.")
            return 1
        print(f"SHA256SUMS.txt hợp lệ ({len(included_files())} file).")
        return 0
    OUTPUT.write_text(expected, encoding="utf-8", newline="\n")
    print(f"Đã cập nhật SHA256SUMS.txt ({len(included_files())} file).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
