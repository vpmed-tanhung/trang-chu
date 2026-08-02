#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Chỉ cập nhật các liên kết và thông tin trong mục Nguồn của index.html.
Không thay đổi dữ liệu thuốc, giao diện, công thức tính hoặc chức năng khác.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

INDEX = Path("index.html")
REVIEW_DATE_OLD = "Ngày rà soát nguồn: 08/07/2026"
REVIEW_DATE_NEW = "Ngày rà soát nguồn: 11/07/2026"

SOURCES = [
    ("Tờ hướng dẫn sử dụng thuốc đã được phê duyệt", "https://dichvucong.dav.gov.vn/congbothuoc/index"),
    ("Dược thư Quốc gia Việt Nam III", "https://www.nidqc.gov.vn/thong-bao-phat-hanh-sach-dien-tu-duoc-thu-quoc-gia-viet-nam-lan-xuat-ban-thu-ba"),
    ("Quyết định 708/QĐ-BYT", "https://kcb.vn/thu-vien-tai-lieu/tai-lieu-huong-dan-su-dung-khang-sinh.html"),
    ("Quyết định 5948/QĐ-BYT", "https://kcb.vn/upload/2005611/20220330/1.-qd-5948_danh-muc-ttt-ccd6153.pdf"),
    ("Quyết định 29/QĐ-BYT", "https://kcb.vn/upload/2005611/20220330/2.-qd-29.-ban-hanh-huong-dan-giam-sat-phan-ung-co-hai-cua-thuoc-adr-tai-cac-co-so-kham-benh-chua-benh0e3b.pdf"),
    ("Quyết định 2388/QĐ-BYT", "https://kcb.vn/phac-do/quyet-dinh-so-2388-qd-byt-ngay-12-8-2024-ve-viec-ban-hanh-tai-lieu-chuyen-mon-huong-dan-chan-doan-va-dieu-tri-benh-than-.html?categoryId=101796520"),
    ("Thông tư 21/2013/TT-BYT", "https://congbao.chinhphu.vn/van-ban/thong-tu-so-21-2013-tt-byt-7406/4043.htm"),
    ("Thư viện hướng dẫn chẩn đoán, điều trị", "https://kcb.vn/phac-do"),
    ("EANM Guidelines", "https://eanm.org/publications/guidelines/"),
    ("SNMMI Practice Guidelines", "https://snmmi.org/Web/Web/Clinical-Practice/Procedure-Standards/Procedure-Standards.aspx"),
    ("ACR Practice Parameters", "https://www.acr.org/clinical-resources/clinical-tools-and-reference/practice-parameters-and-technical-standards"),
    ("IAEA – Radiation Protection of Patients", "https://www.iaea.org/resources/rpop"),
    ("IAEA Human Health Campus", "https://www.iaea.org/resources/hhc/nuclear-medicine"),
    ("Bệnh viện K", "https://benhvienk.vn/"),
    ("Bệnh viện Bạch Mai", "https://bachmai.gov.vn/"),
    ("Bệnh viện Trung ương Quân đội 108", "https://www.benhvien108.vn/home.htm"),
    ("Bệnh viện Chợ Rẫy", "https://bvchoray.vn/"),
]


def replace_href_near_title(html: str, title: str, new_url: str) -> tuple[str, bool, str]:
    """Thay đúng href gần tiêu đề nguồn; không đụng phần khác."""
    pos = html.find(title)
    if pos < 0:
        return html, False, "không tìm thấy tiêu đề"

    # Ưu tiên href nằm sau tiêu đề trong cùng thẻ nguồn.
    after = html[pos:pos + 1800]
    m = re.search(r'href\s*=\s*(["\'])(.*?)\1', after, flags=re.I | re.S)
    if m:
        old_url = m.group(2)
        a = pos + m.start(2)
        b = pos + m.end(2)
        if old_url != new_url:
            return html[:a] + new_url + html[b:], True, old_url
        return html, False, "đã đúng"

    # Dự phòng khi toàn bộ thẻ nguồn là một thẻ <a> và href nằm trước tiêu đề.
    before_start = max(0, pos - 1200)
    before = html[before_start:pos]
    matches = list(re.finditer(r'href\s*=\s*(["\'])(.*?)\1', before, flags=re.I | re.S))
    if matches:
        m = matches[-1]
        old_url = m.group(2)
        a = before_start + m.start(2)
        b = before_start + m.end(2)
        if old_url != new_url:
            return html[:a] + new_url + html[b:], True, old_url
        return html, False, "đã đúng"

    return html, False, "không tìm thấy href gần tiêu đề"


def add_duoc_thu_card_if_missing(html: str) -> tuple[str, bool, str]:
    title = "Dược thư Quốc gia Việt Nam III"
    if title in html:
        return html, False, "đã có"

    marker = "Quyết định 708/QĐ-BYT"
    pos = html.find(marker)
    if pos < 0:
        return html, False, "không tìm thấy thẻ QĐ 708 để sao chép bố cục"

    # Sao chép nguyên cấu trúc thẻ QĐ 708 để không làm thay đổi giao diện.
    candidates = []
    for tag in ("article", "div", "a"):
        start = html.rfind(f"<{tag}", 0, pos)
        end = html.find(f"</{tag}>", pos)
        if start >= 0 and end >= 0:
            end += len(f"</{tag}>")
            block = html[start:end]
            if len(block) <= 3500 and marker in block:
                score = 0
                opening = block[: min(500, len(block))].lower()
                if "source" in opening or "ref" in opening: score += 3
                if "href" in block: score += 2
                if "<h3" in block or "<h2" in block: score += 1
                candidates.append((score, start, end, block))
    if not candidates:
        return html, False, "không xác định được khối thẻ nguồn"

    _, start, _, block = max(candidates, key=lambda x: (x[0], -len(x[3])))
    card = block.replace(marker, title, 1)
    card = re.sub(
        r'(<p[^>]*>).*?(</p>)',
        r'\1Tài liệu chính thức của Bộ Y tế về hướng dẫn sử dụng thuốc hợp lý, an toàn và hiệu quả; lần xuất bản thứ ba ban hành kèm Quyết định 3445/QĐ-BYT ngày 23/12/2022.\2',
        card,
        count=1,
        flags=re.I | re.S,
    )
    card, changed, _ = replace_href_near_title(
        card,
        title,
        "https://www.nidqc.gov.vn/thong-bao-phat-hanh-sach-dien-tu-duoc-thu-quoc-gia-viet-nam-lan-xuat-ban-thu-ba",
    )
    if not changed and "nidqc.gov.vn" not in card:
        return html, False, "không thay được liên kết trong thẻ sao chép"
    card = re.sub(r'>Mở tài liệu chính thức<', '>Mở nguồn chính thức<', card, count=1)
    return html[:start] + card + "\n" + html[start:], True, "đã bổ sung"


def main() -> int:
    if not INDEX.exists():
        print("LỖI: Không tìm thấy index.html ở thư mục gốc repository.", file=sys.stderr)
        return 2

    original = INDEX.read_text(encoding="utf-8")
    html = original
    log: list[str] = []

    html, added, detail = add_duoc_thu_card_if_missing(html)
    log.append(f"Dược thư Quốc gia Việt Nam III: {detail}")

    for title, url in SOURCES:
        html, changed, detail = replace_href_near_title(html, title, url)
        state = "đã cập nhật" if changed else detail
        log.append(f"{title}: {state}")

    # Sửa các URL cũ có thể xuất hiện ngoài thẻ nguồn, nhưng chỉ đúng các link nguồn đã xác định.
    direct_replacements = {
        "https://www.snmmi.org/ClinicalPractice/content.aspx?ItemNumber=6414": "https://snmmi.org/Web/Web/Clinical-Practice/Procedure-Standards/Procedure-Standards.aspx",
        "https://humanhealth.iaea.org/HHW/NuclearMedicine/index.html": "https://www.iaea.org/resources/hhc/nuclear-medicine",
        "https://www.acr.org/Clinical-Resources/Practice-Parameters-and-Technical-Standards": "https://www.acr.org/clinical-resources/clinical-tools-and-reference/practice-parameters-and-technical-standards",
        "https://choray.vn/": "https://bvchoray.vn/",
        "https://choray.vn": "https://bvchoray.vn/",
    }
    for old, new in direct_replacements.items():
        if old in html:
            html = html.replace(old, new)
            log.append(f"URL cũ {old}: đã thay")

    if REVIEW_DATE_OLD in html:
        html = html.replace(REVIEW_DATE_OLD, REVIEW_DATE_NEW, 1)
        log.append("Ngày rà soát nguồn: đã cập nhật 11/07/2026")
    elif REVIEW_DATE_NEW in html:
        log.append("Ngày rà soát nguồn: đã đúng")
    else:
        log.append("Ngày rà soát nguồn: không tìm thấy chuỗi ngày cũ")

    if html == original:
        print("Không có thay đổi cần ghi.")
        for row in log:
            print("-", row)
        return 0

    INDEX.write_text(html, encoding="utf-8", newline="")
    print("ĐÃ HOÀN TẤT: chỉ cập nhật mục Nguồn trong index.html.")
    for row in log:
        print("-", row)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
