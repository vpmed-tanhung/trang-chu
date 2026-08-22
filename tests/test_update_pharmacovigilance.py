from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = PROJECT_ROOT / "scripts" / "update_pharmacovigilance.py"
SPEC = importlib.util.spec_from_file_location("update_pharmacovigilance", MODULE_PATH)
assert SPEC and SPEC.loader
updater = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(updater)


class PharmacovigilanceUpdaterTests(unittest.TestCase):
    def test_extracts_structured_summary_and_direct_source(self) -> None:
        title = (
            "Nguy cơ biến cố tim mạch khi sử dụng domperidon: "
            "Thông tin từ Bản tin BIP Occitanie số 02/2026"
        )
        html = f"""
        <html><body>
          <h1>{title}</h1>
          <p>24/07/2026</p>
          <p>Domperidon là thuốc đối kháng dopamin, được chỉ định điều trị
          buồn nôn và nôn ở người bệnh phù hợp.</p>
          <p>Thuốc có liên quan đến kéo dài khoảng QT, loạn nhịp thất nghiêm
          trọng và có thể dẫn đến đột tử.</p>
          <p>Nguy cơ tăng ở người dùng trên 30 mg mỗi ngày, điều trị kéo dài
          hoặc phối hợp thuốc ức chế CYP3A4.</p>
          <p>Khuyến cáo chỉ sử dụng liều thấp nhất có hiệu quả và tránh phối
          hợp với thuốc cũng gây kéo dài khoảng QT.</p>
          <p>Cần theo dõi điện tâm đồ và các dấu hiệu tim mạch ở người bệnh
          có yếu tố nguy cơ.</p>
          <p>Nguồn: Bản tin BIP Occitanie số 02/2026</p>
        </body></html>
        """

        detail = updater.extract_detail(html, title)
        alert = updater.build_alert(
            title,
            "https://canhgiacduoc.org.vn/CanhGiacDuoc/DiemTin/5849/domperidon.htm",
            detail,
        )

        self.assertEqual(alert["date"], "24/07/2026")
        self.assertEqual(alert["drugs"], "Domperidon")
        self.assertEqual(alert["source_url"], alert["url"])
        self.assertTrue(alert["summary"])
        self.assertTrue(alert["risk"])
        self.assertTrue(alert["signs"])
        self.assertTrue(alert["action"])
        self.assertTrue(alert["monitor"])
        self.assertEqual(
            alert["source_note"],
            "Bản tin BIP Occitanie số 02/2026",
        )

        structured = [
            *alert["risk"],
            *alert["signs"],
            *alert["action"],
            *alert["monitor"],
        ]
        normalized = [updater.normalize_key(item) for item in structured]
        self.assertEqual(len(normalized), len(set(normalized)))

    def test_retains_history_without_duplicates(self) -> None:
        current = {
            "id": "auto-new",
            "title": "Bản tin mới",
            "date": "28/07/2026",
            "url": "https://example.test/new",
        }
        previous_duplicate = dict(current)
        previous_old = {
            "id": "auto-old",
            "title": "Bản tin cũ",
            "date": "27/07/2026",
            "url": "https://example.test/old",
        }

        merged, retained = updater.merge_auto_history(
            [current],
            [previous_duplicate, previous_old],
            set(),
            set(),
        )

        self.assertEqual([item["id"] for item in merged], ["auto-new", "auto-old"])
        self.assertEqual(retained, 1)

    def test_updates_lazy_shell_cache_buster_without_depending_on_format(self) -> None:
        source = "scripts: [\n  'assets/pharmacovigilance_auto_data.js?v=old-build',\n]"
        updated = updater.update_shell_cache_buster(source, "20260822183000")
        self.assertIn(
            "assets/pharmacovigilance_auto_data.js?v=20260822183000",
            updated,
        )
        self.assertNotIn("old-build", updated)


if __name__ == "__main__":
    unittest.main()
