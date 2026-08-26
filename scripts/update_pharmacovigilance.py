from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlsplit, urlunsplit
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


LIST_URL = "https://canhgiacduoc.org.vn/CanhGiacDuoc/DiemTinCGD.aspx"
BASE_URL = "https://canhgiacduoc.org.vn/"
SOURCE_NAME = "Trung tâm Quốc gia về Thông tin thuốc và Theo dõi phản ứng có hại của thuốc"
OUTPUT_PATH = Path("assets/pharmacovigilance_auto.json")
OUTPUT_JS_PATH = Path("assets/pharmacovigilance_auto_data.js")
STATIC_PATH = Path("assets/pharmacovigilance_alerts.json")
SHELL_PATH = Path("assets/platform-shell.js")
MAX_ITEMS = 30
HISTORY_LIMIT = 120
DETAIL_LINK_RE = re.compile(r"/CanhGiacDuoc/DiemTin/\d+/", re.IGNORECASE)
DATE_RE = re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b")

# Ranh giới câu: dấu kết câu + khoảng trắng, CHỈ khi ký tự tiếp theo là chữ
# hoa/số/dấu ngoặc mở hoặc hết chuỗi. Nếu không có điều kiện lookahead này,
# các từ viết tắt dạng "W. somnifera", "TS. Nguyễn..." sẽ bị hiểu nhầm là hết
# câu (vì "W." cũng kết thúc bằng dấu chấm), làm rơi mất từ theo sau và ghép
# nhầm các câu không liên quan với nhau trong bản tóm tắt.
SENTENCE_BOUNDARY_RE = re.compile(r"(?<=[.!?…])\s+(?=[A-ZÀ-ỸĐ0-9\"'“(]|$)")

# Thẻ cảnh báo chỉ hiển thị ý chính; bài đầy đủ luôn nằm ở liên kết "Nguồn".
# Hai câu và khoảng 420 ký tự đủ để nêu nguy cơ + bằng chứng/kết luận quan
# trọng mà không sao chép nguyên bài nguồn vào giao diện.
SUMMARY_CHAR_LIMIT = 420
SUMMARY_SENTENCE_LIMIT = 2


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def normalize_key(value: str) -> str:
    text = clean_text(value).replace("Đ", "D").replace("đ", "d")
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def normalize_source_url(value: str) -> str:
    """Chuẩn hóa đường dẫn nguồn về HTTPS để tránh liên kết HTTP và trùng bản tin."""
    url = clean_text(value)
    if not url:
        return ""

    parts = urlsplit(url)
    host = (parts.hostname or "").lower()

    if host in {"canhgiacduoc.org.vn", "www.canhgiacduoc.org.vn"}:
        netloc = parts.netloc
        if parts.port in {80, 443}:
            netloc = host
        return urlunsplit(("https", netloc, parts.path, parts.query, parts.fragment))

    return url


def smart_truncate(value: str, limit: int = 650) -> str:
    """Cắt tóm tắt tại cuối câu hoặc cuối từ, tránh đứt giữa nội dung."""
    text = clean_text(value)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)

    if not text:
        return ""
    if len(text) <= limit:
        return text if text.endswith((".", "!", "?", "…")) else text + "."

    sentences = SENTENCE_BOUNDARY_RE.split(text)
    selected: list[str] = []
    current_length = 0

    for sentence in sentences:
        sentence = clean_text(sentence)
        if not sentence:
            continue

        added = len(sentence) + (1 if selected else 0)
        if current_length + added > limit:
            break

        selected.append(sentence)
        current_length += added

    # Chỉ dùng phần cuối câu khi đủ thông tin; nếu câu đầu quá dài thì cắt theo từ.
    if selected and current_length >= min(220, limit // 2):
        result = " ".join(selected).strip()
        return result if result.endswith((".", "!", "?", "…")) else result + "."

    clipped = text[: max(1, limit - 1)].rstrip()
    last_space = clipped.rfind(" ")
    if last_space >= max(80, limit // 2):
        clipped = clipped[:last_space].rstrip()

    return clipped.rstrip(",;:") + "…"


def split_sentences(value: str) -> list[str]:
    """Tách và khử trùng lặp câu để tạo tóm tắt có cấu trúc."""
    results: list[str] = []
    seen: set[str] = set()
    normalized_text = re.sub(
        r"(?<=[.!?…])(?=[A-ZÀ-ỸĐ])",
        " ",
        clean_text(value),
    )

    for sentence in SENTENCE_BOUNDARY_RE.split(normalized_text):
        sentence = clean_text(sentence)
        key = normalize_key(sentence)
        if len(sentence) < 35 or not key or key in seen:
            continue
        seen.add(key)
        results.append(sentence)

    return results


def select_sentences(
    sentences: list[str],
    keywords: tuple[str, ...],
    *,
    limit: int = 6,
    used: set[str] | None = None,
) -> list[str]:
    selected: list[str] = []
    selected_keys: set[str] = set()
    used = used if used is not None else set()

    for sentence in sentences:
        key = normalize_key(sentence)
        if key in used or not any(keyword in key for keyword in keywords):
            continue
        clipped = smart_truncate(sentence, 360)
        clipped_key = normalize_key(clipped)
        used.add(key)
        if clipped_key in selected_keys:
            continue
        selected.append(clipped)
        selected_keys.add(clipped_key)
        if len(selected) >= limit:
            break

    return selected


def summary_sentence_score(sentence: str, index: int, total: int, title: str = "") -> int:
    """Chấm điểm câu có giá trị tóm tắt thay vì mặc định lấy phần mở bài."""
    key = f" {normalize_key(sentence)} "
    score = 0
    weighted_signals = (
        (10, (" ket luan ", " canh bao ", " chong chi dinh ", " thuoc gia ")),
        (8, (" nguy co ", " moi lien quan ", " co the gay ", " lien quan den ")),
        (7, (" tinh den ", " tong so ", " ghi nhan ", " bao cao ", " truong hop ")),
        (2, (" khuyen cao ", " khong su dung ", " can ngung ", " nen ngung ", " nen tranh ")),
        (5, (" tu vong ", " nhap vien ", " nghiem trong ", " hiem gap ", " rat hiem ")),
        (4, (" lieu cao ", " keo dai ", " phoi hop ", " mang thai ", " tre em ", " nguoi cao tuoi ")),
    )
    for weight, signals in weighted_signals:
        if any(signal in key for signal in signals):
            score += weight

    if " tinh den nay " in key:
        score += 15
    if " tai thoi diem ra soat " in key or " sau khi hoan tat danh gia " in key:
        score += 8
    if re.search(r"\b\d+(?:[.,]\d+)?\s*(?:%|ca|trường hợp|mg|ngày|tuần|tháng|năm)\b", sentence, re.IGNORECASE):
        score += 4
    title_terms = {
        word
        for word in normalize_key(title).split()
        if len(word) >= 4 and word not in {"nguy", "canh", "bao", "lien", "quan", "dung", "thuoc"}
    }
    sentence_terms = set(normalize_key(sentence).split())
    score += min(6, len(title_terms & sentence_terms))
    if any(marker in key for marker in (" la thuoc ", " duoc chi dinh ", " thong tin chung ")):
        score -= 5
    if key.strip().startswith(("khuyen cao", "who khuyen cao", "pmda khuyen cao")):
        score -= 12
    if len(sentence) > 280:
        score -= 8
    if len(sentence) > 420:
        score -= 4

    # Cho phần kết luận/cập nhật ở cuối bài một ưu tiên nhỏ, nhưng không đủ để
    # lấn át các tín hiệu nguy cơ và khuyến cáo chuyên môn.
    if total > 1:
        score += round(index * 2 / (total - 1))
    return score


def sentence_overlap(left: str, right: str) -> float:
    left_words = set(normalize_key(left).split())
    right_words = set(normalize_key(right).split())
    if not left_words or not right_words:
        return 0.0
    return len(left_words & right_words) / min(len(left_words), len(right_words))


def build_concise_summary(sentences: list[str], title: str) -> str:
    """Chọn tối đa hai câu giàu thông tin, ưu tiên nguy cơ và kết luận mới."""
    candidates: list[tuple[int, str]] = []
    seen: set[str] = set()
    for index, sentence in enumerate(sentences):
        cleaned = clean_text(sentence).lstrip("-• ")
        key = normalize_key(cleaned)
        if len(cleaned) < 35 or not key or key in seen:
            continue
        seen.add(key)
        candidates.append((index, cleaned))

    if not candidates:
        return smart_truncate(f"Bản tin mới từ nguồn chính thức: {title}.", SUMMARY_CHAR_LIMIT)

    short_candidates = [entry for entry in candidates if len(entry[1]) <= 300]
    ranking_pool = short_candidates if len(short_candidates) >= SUMMARY_SENTENCE_LIMIT else candidates
    ranked = sorted(
        ranking_pool,
        key=lambda entry: (
            summary_sentence_score(entry[1], entry[0], len(candidates), title),
            entry[0],
        ),
        reverse=True,
    )
    selected: list[tuple[int, str]] = []
    selected_length = 0
    for index, sentence in ranked:
        clipped = smart_truncate(sentence, 300)
        if any(sentence_overlap(clipped, existing) >= 0.68 for _, existing in selected):
            continue
        added_length = len(clipped) + (1 if selected else 0)
        if selected and selected_length + added_length > SUMMARY_CHAR_LIMIT:
            continue
        selected.append((index, clipped))
        selected_length += added_length
        if len(selected) >= SUMMARY_SENTENCE_LIMIT:
            break

    selected.sort(key=lambda entry: entry[0])
    return smart_truncate(" ".join(sentence for _, sentence in selected), SUMMARY_CHAR_LIMIT)


def infer_drugs(title: str, body_text: str) -> str:
    haystack = normalize_key(f"{title} {body_text}")
    rules = (
        (("domperidon",), "Domperidon"),
        (("tramadol",), "Tramadol"),
        (("daratumumab", "darzalex"), "Daratumumab (DARZALEX)"),
        (("pivoxil",), "Kháng sinh chứa ester pivoxil"),
        (("valproat", "valproic"), "Valproat (natri valproat/acid valproic)"),
        (("methadon",), "Methadon"),
        (("atorvastatin", "clarithromycin"), "Atorvastatin; clarithromycin"),
        (("orlistat",), "Orlistat"),
        (("opioid",), "Opioid"),
        (("corticosteroid", "corticoid"), "Corticosteroid"),
        (("fluoroquinolon", "quinolon"), "Fluoroquinolon"),
        (("vancomycin",), "Vancomycin"),
    )

    for needles, label in rules:
        if any(needle in haystack for needle in needles):
            return label

    phrase = re.search(
        r"(?:sử dụng|khi dùng|dùng|chứa)\s+(.{3,90}?)(?=\s+(?:ở|trên|trong|cho|khi)\b|[:.;,]|$)",
        title,
        re.IGNORECASE,
    )
    if phrase:
        return smart_truncate(phrase.group(1), 100).rstrip(".")

    return "Thuốc/nhóm thuốc nêu trong tiêu đề; xem bài nguồn để xác định đầy đủ."


def infer_category(text: str) -> str:
    value = normalize_key(text)
    if "tuong tac" in value or "interaction" in value:
        return "Tương tác thuốc"
    if any(term in value for term in ("mang thai", "thai nhi", "sinh san", "cho con bu")):
        return "Thai kỳ & sức khỏe sinh sản"
    if any(term in value for term in ("tre em", "tre so sinh", "nhi khoa")):
        return "Đối tượng đặc biệt"
    if any(term in value for term in ("qua lieu", "ngo doc")):
        return "Quá liều & thuốc nguy cơ cao"
    if any(term in value for term in ("thu hoi", "loi chat luong", "gia mao", "thuoc gia")):
        return "Chất lượng thuốc & thu hồi"
    return "Cảnh báo an toàn thuốc"


def infer_system(text: str) -> str:
    value = normalize_key(text)
    systems: list[str] = []
    rules = (
        (("tim", "qt", "nhip", "huyet ap", "mach"), "Tim mạch"),
        (("than kinh", "co giat", "y thuc", "tam than", "dong kinh"), "Thần kinh"),
        ((" gan ", "men gan", "duong mat"), "Gan mật"),
        (("suy than", "creatinin", "tieu co van"), "Thận"),
        (("ha duong huyet", "carnitin", "noi tiet", "chuyen hoa"), "Chuyển hóa"),
        (("tre em", "tre so sinh", "nhi khoa"), "Nhi khoa"),
        (("mang thai", "thai nhi", "sinh san"), "Sản khoa"),
    )
    padded = f" {value} "

    for needles, label in rules:
        if any(needle in padded for needle in needles):
            systems.append(label)

    return " · ".join(dict.fromkeys(systems)) or "Toàn thân"


def infer_level(text: str) -> str:
    value = normalize_key(text)
    if any(
        term in value
        for term in (
            "tu vong",
            "dot tu",
            "chong chi dinh",
            "nghiem trong",
            "co giat",
            "ngung tim",
            "ngung ho hap",
            "thuoc gia",
        )
    ):
        return "red"
    if any(term in value for term in ("nguy co", "canh bao", "ton thuong", "chay mau", "di tat")):
        return "orange"
    return "green"


def build_structured_summary(sentences: list[str], title: str) -> dict[str, Any]:
    """Tạo tóm tắt đủ bối cảnh, nguy cơ, dấu hiệu, hành động và theo dõi."""
    if not sentences:
        sentences = [f"Bản tin mới từ nguồn chính thức: {title}."]

    used: set[str] = set()
    monitor = select_sentences(
        sentences,
        (
            "theo doi",
            "giam sat",
            "kiem tra",
            "xet nghiem",
            "dien tam do",
            "ecg",
            "duong huyet",
            "men gan",
            "creatinin",
            "nong do",
        ),
        used=used,
    )
    action = select_sentences(
        sentences,
        (
            "theo khuyen cao",
            "khong duoc khuyen cao",
            "duoc khuyen cao",
            "who khuyen cao",
            "pmda khuyen cao",
            "health canada khuyen cao",
            "khuyen cao nguoi",
            "khuyen cao nhan vien",
            "khuyen cao nen",
            "can luu y",
            "can danh gia",
            "can ra soat",
            "can tu van",
            "can can nhac",
            "nen tranh",
            "khong nen",
            "khong su dung",
            "can ngung",
            "nen ngung",
            "giam lieu",
            "dieu chinh lieu",
        ),
        used=used,
    )
    signs = select_sentences(
        sentences,
        (
            "dau hieu",
            "trieu chung",
            "xuat hien",
            "bien co",
            "roi loan",
            "keo dai khoang qt",
            "loan nhip",
            "co giat",
            "ha duong huyet",
            "phat ban",
            "kho tho",
            "xuat huyet",
            "ton thuong",
            "doc tinh",
        ),
        used=used,
    )
    risk = select_sentences(
        sentences,
        (
            "nguy co",
            "yeu to nguy co",
            "dac biet",
            "benh nhan",
            "tre em",
            "tre so sinh",
            "nguoi cao tuoi",
            "mang thai",
            "lieu cao",
            "keo dai",
            "phoi hop",
            "suy gan",
            "suy than",
            "chong chi dinh",
            "can than",
        ),
        used=used,
    )

    if not risk:
        risk = [smart_truncate(sentences[0], 360)]
        used.add(normalize_key(sentences[0]))
    if not signs:
        signs = ["Theo dõi các dấu hiệu hoặc biến cố bất thường được mô tả trong bài nguồn."]
    if not action:
        action = ["Rà soát chỉ định, liều dùng, thời gian điều trị và thuốc dùng đồng thời theo bài nguồn."]
    if not monitor:
        monitor = ["Theo dõi đáp ứng và phản ứng có hại; đối chiếu yêu cầu giám sát trong bài nguồn."]

    summary = build_concise_summary(sentences, title)

    quick = action[0] if action else risk[0]
    return {
        "summary": summary,
        "quick": smart_truncate(quick, 320),
        "risk": risk,
        "signs": signs,
        "action": action,
        "monitor": monitor,
    }


def compact_existing_alert(item: dict[str, Any]) -> dict[str, Any]:
    """Rút gọn cả bản tin lịch sử để dữ liệu cũ không mang nguyên bài lên web."""
    normalized = dict(item)
    candidates: list[str] = []
    candidates.extend(split_sentences(str(item.get("summary", ""))))
    for field in ("risk", "signs", "action", "monitor"):
        values = item.get(field)
        if isinstance(values, list):
            for value in values:
                candidates.extend(split_sentences(str(value)))

    normalized["summary"] = build_concise_summary(
        candidates,
        clean_text(str(item.get("title", ""))),
    )
    quick_source = clean_text(str(item.get("quick", "")))
    if not quick_source:
        action = item.get("action")
        if isinstance(action, list) and action:
            quick_source = clean_text(str(action[0]))
    normalized["quick"] = smart_truncate(
        quick_source or "Mở nguồn để kiểm tra khuyến cáo và áp dụng theo đánh giá lâm sàng.",
        280,
    )
    normalized["editorialStatus"] = "auto-concise-v2"
    return normalized


def make_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=3,
        connect=3,
        read=3,
        backoff_factor=1,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET"}),
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (compatible; VPMED-Pharmacovigilance-Updater/1.0; "
                "+https://vpmed-tanhung.github.io/trang-chu-khoa-duoc/)"
            ),
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.7",
        }
    )
    return session


def fetch_html(session: requests.Session, url: str) -> str:
    response = session.get(url, timeout=40)
    response.raise_for_status()
    if not response.encoding or response.encoding.lower() == "iso-8859-1":
        response.encoding = response.apparent_encoding or "utf-8"
    return response.text


def extract_listing(html: str) -> list[dict[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    items: list[dict[str, str]] = []
    seen_urls: set[str] = set()

    for anchor in soup.find_all("a", href=True):
        title = clean_text(anchor.get_text(" ", strip=True))
        url = normalize_source_url(urljoin(BASE_URL, anchor["href"]))

        if not DETAIL_LINK_RE.search(url):
            continue
        if not title or title.casefold() in {"xem tiếp", "xem tiếp >>"}:
            continue
        if url in seen_urls:
            continue

        seen_urls.add(url)
        items.append({"title": title, "url": url})
        if len(items) >= MAX_ITEMS:
            break

    return items


def extract_detail(html: str, fallback_title: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    page_text = soup.get_text("\n", strip=True)
    lines = [clean_text(line) for line in page_text.splitlines() if clean_text(line)]

    date_text = ""
    date_match = DATE_RE.search(page_text)
    if date_match:
        day, month, year = map(int, date_match.groups())
        date_text = f"{day:02d}/{month:02d}/{year:04d}"

    start_index = 0
    target_key = normalize_key(fallback_title)
    for index, line in enumerate(lines):
        if target_key and target_key in normalize_key(line):
            start_index = index + 1
            break

    excluded_prefixes = (
        "trang chủ",
        "giới thiệu",
        "cảnh giác dược",
        "tiện ích",
        "lịch công tác",
        "các tin liên quan",
        "bản quyền",
        "địa chỉ:",
        "điện thoại:",
        "điểm tin:",
        "hiệu đính:",
        "phụ trách:",
    )

    body_lines: list[str] = []
    source_note = ""
    for line in lines[start_index:]:
        lower = line.casefold()

        if lower.startswith("nguồn:"):
            source_note = clean_text(line.split(":", 1)[1] if ":" in line else "")
            break
        if lower.startswith("các tin liên quan"):
            break
        if DATE_RE.fullmatch(line):
            continue
        if any(lower.startswith(prefix) for prefix in excluded_prefixes):
            continue
        # Ngưỡng cũ (25 ký tự) loại bỏ luôn các tiêu đề mục ngắn nhưng có
        # nghĩa như "Đánh giá của TGA", "Dữ liệu quốc tế" — hạ xuống 12 để
        # giữ lại các nhãn mục này, giúp tóm tắt bám sát cấu trúc bài gốc.
        if len(line) < 12:
            continue

        body_lines.append(line)
        if len(body_lines) >= 80:
            break

    body_text = clean_text(" ".join(body_lines))
    sentences = split_sentences(body_text)

    return {
        "date": date_text,
        "body_text": body_text,
        "sentences": sentences,
        "source_note": source_note,
    }


def load_static_keys() -> tuple[set[str], set[str]]:
    titles: set[str] = set()
    urls: set[str] = set()

    if not STATIC_PATH.exists():
        return titles, urls

    try:
        payload = json.loads(STATIC_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return titles, urls

    records = payload if isinstance(payload, list) else payload.get("alerts", [])
    for item in records:
        if not isinstance(item, dict):
            continue
        title = normalize_key(str(item.get("title", "")))
        url = normalize_source_url(str(item.get("url", ""))).rstrip("/").lower()
        if title:
            titles.add(title)
        if url:
            urls.add(url)

    return titles, urls


def load_previous_auto_alerts() -> list[dict[str, Any]]:
    if not OUTPUT_PATH.exists():
        return []
    try:
        payload = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []

    records = payload if isinstance(payload, list) else payload.get("alerts", [])
    return [item for item in records if isinstance(item, dict)]


def alert_keys(item: dict[str, Any]) -> tuple[str, str, str]:
    return (
        clean_text(str(item.get("id", ""))),
        normalize_source_url(str(item.get("url", ""))).rstrip("/").lower(),
        normalize_key(str(item.get("title", ""))),
    )


def merge_auto_history(
    current_alerts: list[dict[str, Any]],
    previous_alerts: list[dict[str, Any]],
    static_titles: set[str],
    static_urls: set[str],
) -> tuple[list[dict[str, Any]], int]:
    merged: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()
    retained_history_count = 0

    for is_history, item in [
        *((False, item) for item in current_alerts),
        *((True, item) for item in previous_alerts),
    ]:
        item_id, url, title = alert_keys(item)
        if (url and url in static_urls) or (title and title in static_titles):
            continue
        if (
            (item_id and item_id in seen_ids)
            or (url and url in seen_urls)
            or (title and title in seen_titles)
        ):
            continue

        normalized = compact_existing_alert(item)
        normalized["url"] = normalize_source_url(str(item.get("url", "")))
        normalized["source_url"] = normalized["url"]
        normalized["source"] = clean_text(str(item.get("source", ""))) or SOURCE_NAME
        normalized["auto"] = True
        normalized["reviewed"] = False
        merged.append(normalized)

        if item_id:
            seen_ids.add(item_id)
        if url:
            seen_urls.add(url)
        if title:
            seen_titles.add(title)
        if is_history:
            retained_history_count += 1

    def sort_key(alert: dict[str, Any]) -> datetime:
        try:
            return datetime.strptime(str(alert.get("date", "")), "%d/%m/%Y")
        except ValueError:
            return datetime.min

    merged.sort(key=sort_key, reverse=True)
    return merged[:HISTORY_LIMIT], min(retained_history_count, HISTORY_LIMIT)


def build_alert(title: str, url: str, detail: dict[str, Any]) -> dict[str, Any]:
    date_text = detail.get("date") or ""
    date_match = DATE_RE.search(date_text)
    year = date_match.group(3) if date_match else ""

    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:14]
    body_text = clean_text(str(detail.get("body_text", "")))
    sentences = detail.get("sentences")
    if not isinstance(sentences, list):
        sentences = split_sentences(body_text)
    structured = build_structured_summary(sentences, title)
    all_text = f"{title}. {body_text}"
    title_key = normalize_key(all_text)
    interaction = "tuong tac" in title_key or "interaction" in title_key
    source_url = normalize_source_url(url)

    return {
        "id": f"auto-{digest}",
        "level": infer_level(all_text),
        "year": year,
        "date": date_text,
        "category": infer_category(all_text),
        "system": infer_system(all_text),
        "interaction": interaction,
        "title": title,
        "drugs": infer_drugs(title, body_text),
        **structured,
        "source": SOURCE_NAME,
        "source_note": clean_text(str(detail.get("source_note", ""))),
        "source_url": source_url,
        "url": source_url,
        "auto": True,
        "reviewed": False,
        "autoEdited": True,
        "editorialStatus": "auto-structured",
    }


def existing_check_is_fresh(now: datetime) -> bool:
    if not OUTPUT_PATH.exists():
        return False
    try:
        payload = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
        if int(payload.get("detail_error_count", 0) or 0) > 0:
            return False
        generated_at = str(payload.get("generated_at", "")).strip()
        if not generated_at:
            return False
        checked = datetime.fromisoformat(generated_at.replace("Z", "+00:00"))
        if checked.tzinfo is None:
            checked = checked.replace(tzinfo=ZoneInfo("Asia/Ho_Chi_Minh"))
        return checked.astimezone(ZoneInfo("Asia/Ho_Chi_Minh")).date() == now.date()
    except (OSError, ValueError, TypeError, json.JSONDecodeError):
        return False


def update_shell_cache_buster(shell_text: str, version: str) -> str:
    updated, replacements = re.subn(
        r'(["\']assets/pharmacovigilance_auto_data\.js)(?:\?v=[^"\']*)?(["\'])',
        rf"\g<1>?v={version}\g<2>",
        shell_text,
        count=1,
    )
    if replacements != 1:
        raise RuntimeError("Không tìm thấy pharmacovigilance_auto_data.js trong Platform Shell.")
    return updated


def write_payload(payload: dict[str, Any], version: str) -> None:
    shell_text = update_shell_cache_buster(
        SHELL_PATH.read_text(encoding="utf-8"),
        version,
    )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    OUTPUT_JS_PATH.write_text(
        "window.VPMED_PHARMACOVIGILANCE_AUTO_DATA = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    SHELL_PATH.write_text(shell_text, encoding="utf-8")


def compact_existing_payload() -> int:
    """Áp dụng chính sách tóm tắt mới cho dữ liệu hiện có mà không gọi mạng."""
    if not OUTPUT_PATH.exists():
        raise RuntimeError(f"Không tìm thấy dữ liệu tại {OUTPUT_PATH}.")
    payload = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    alerts = payload.get("alerts")
    if not isinstance(alerts, list):
        raise RuntimeError("Trường alerts không phải danh sách.")

    payload["alerts"] = [
        compact_existing_alert(item)
        for item in alerts
        if isinstance(item, dict)
    ]
    payload["review_status"] = (
        "Bản tin được tự động trích xuất thành tóm tắt ngắn; nội dung đầy đủ "
        "được giữ tại liên kết nguồn để kiểm chứng trước khi áp dụng lâm sàng."
    )
    now = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    write_payload(payload, now.strftime("%Y%m%d%H%M%S"))
    print(f"Đã rút gọn {len(payload['alerts'])} bản tin hiện có.")
    return 0


def main(skip_if_fresh: bool = False) -> int:
    now = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    if skip_if_fresh and existing_check_is_fresh(now):
        print("Dữ liệu đã được kiểm tra trong ngày hôm nay; bỏ qua lượt chạy dự phòng.")
        return 0
    session = make_session()
    listing_html = fetch_html(session, LIST_URL)
    listing = extract_listing(listing_html)

    if not listing:
        raise RuntimeError("Không tìm thấy liên kết bản tin trên trang nguồn.")

    static_titles, static_urls = load_static_keys()
    previous_alerts = load_previous_auto_alerts()
    previous_ids: set[str] = set()
    previous_urls: set[str] = set()
    previous_titles: set[str] = set()
    for previous in previous_alerts:
        item_id, url, title = alert_keys(previous)
        if item_id:
            previous_ids.add(item_id)
        if url:
            previous_urls.add(url)
        if title:
            previous_titles.add(title)

    current_alerts: list[dict[str, Any]] = []
    errors: list[str] = []
    newly_fetched_count = 0

    for item in listing:
        title = item["title"]
        url = normalize_source_url(item["url"])
        title_key = normalize_key(title)
        url_key = url.rstrip("/").lower()

        if title_key in static_titles or url_key in static_urls:
            continue

        try:
            detail_html = fetch_html(session, url)
            detail = extract_detail(detail_html, title)
            alert = build_alert(title, url, detail)
            current_alerts.append(alert)
            alert_id, alert_url, alert_title = alert_keys(alert)
            if (
                alert_id not in previous_ids
                and alert_url not in previous_urls
                and alert_title not in previous_titles
            ):
                newly_fetched_count += 1
        except Exception as exc:  # tiếp tục lấy các bản tin còn lại
            errors.append(f"{url}: {exc}")

    alerts, retained_history_count = merge_auto_history(
        current_alerts,
        previous_alerts,
        static_titles,
        static_urls,
    )

    payload = {
        "generated_at": now.isoformat(timespec="seconds"),
        "source": LIST_URL,
        "source_listing_count": len(listing),
        "newly_fetched_count": newly_fetched_count,
        "retained_history_count": retained_history_count,
        "detail_error_count": len(errors),
        "review_status": (
            "Bản tin được tự động trích xuất và tóm tắt có cấu trúc từ nguồn đích. "
            "Luôn mở liên kết nguồn gốc để kiểm chứng trước khi áp dụng lâm sàng."
        ),
        "alerts": alerts,
    }

    write_payload(payload, now.strftime("%Y%m%d%H%M%S"))

    print(f"Đã tạo {len(alerts)} bản tin tự động tại {OUTPUT_PATH} và {OUTPUT_JS_PATH}.")
    if errors:
        print(f"Có {len(errors)} liên kết không đọc được:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cập nhật dữ liệu cảnh báo dược tự động.")
    parser.add_argument(
        "--skip-if-fresh",
        action="store_true",
        help="Bỏ qua nếu dữ liệu đã được kiểm tra trong ngày hiện tại.",
    )
    parser.add_argument(
        "--compact-existing",
        action="store_true",
        help="Rút gọn dữ liệu hiện có mà không tải lại nguồn.",
    )
    args = parser.parse_args()
    if args.compact_existing:
        raise SystemExit(compact_existing_payload())
    raise SystemExit(main(skip_if_fresh=args.skip_if_fresh))
