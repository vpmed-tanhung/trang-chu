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

    def test_does_not_split_sentences_on_species_abbreviation(self) -> None:
        # Hồi quy cho lỗi thực tế: "W. somnifera" (viết tắt Withania) bị bộ
        # tách câu hiểu nhầm là hết câu vì có dấu chấm, khiến chữ "somnifera"
        # bị rơi mất và các câu không liên quan bị ghép lại với nhau trong
        # bản tóm tắt hiển thị cho người dùng (bản tin Sâm Ấn Độ 21/08/2026).
        sentences = updater.split_sentences(
            "TGA đã ghi nhận 01 báo cáo biến cố bất lợi về tình trạng tổn "
            "thương gan nghiêm trọng liên quan đến một loại thuốc có chứa "
            "W. somnifera. Sau đó, TGA đã tiến hành một đánh giá về mối "
            "liên quan giữa W. somnifera và tình trạng tổn thương gan."
        )

        self.assertEqual(len(sentences), 2)
        self.assertTrue(sentences[0].endswith("có chứa W. somnifera."))
        self.assertTrue(sentences[1].startswith("Sau đó,"))
        for sentence in sentences:
            self.assertNotIn(" W.", sentence[-3:])  # câu không được cụt tại "W."

    def test_summary_keeps_late_sections_of_long_bulletins(self) -> None:
        # Hồi quy: build_structured_summary trước đây chỉ lấy 3 câu đầu +
        # vài câu khớp từ khóa (~9 câu), nên các mục nằm cuối bài dài nhiều
        # mốc thời gian (ví dụ số liệu cập nhật mới nhất) bị loại bỏ hoàn
        # toàn khỏi tóm tắt dù vẫn còn trong "sentences".
        title = "Bản tin nhiều mục"
        sentences = [
            f"Đây là câu mở đầu số {i} mô tả bối cảnh chung của bản tin thử nghiệm này."
            for i in range(1, 6)
        ] + [
            "Tính đến nay, cơ quan quản lý đã ghi nhận tổng số 11 ca nghi ngờ "
            "tổn thương gan liên quan đến hoạt chất này trên toàn quốc."
        ]

        structured = updater.build_structured_summary(sentences, title)

        self.assertIn("tổng số 11 ca nghi ngờ", structured["summary"])

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
