from __future__ import annotations

import json
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "assets" / "pharmacovigilance_bulletin_76_data.js"
SOURCE_PATH = PROJECT_ROOT / "sources" / "ban-tin-canh-giac-duoc-so-2-2026.pdf"
STATIC_PATH = PROJECT_ROOT / "assets" / "pharmacovigilance_alerts.json"
AUTO_PATH = PROJECT_ROOT / "assets" / "pharmacovigilance_auto.json"
INTEGRATION_PATH = PROJECT_ROOT / "assets" / "pharmacovigilance_integration.js"
ASSIGNMENT = "window.VPMED_PHARMACOVIGILANCE_BULLETIN_76_DATA = "
MAGAZINE_URL = "https://magazine.canhgiacduoc.org.vn/"


def load_bulletin_alerts() -> list[dict]:
    raw = DATA_PATH.read_text(encoding="utf-8").strip()
    if not raw.startswith(ASSIGNMENT) or not raw.endswith(";"):
        raise AssertionError("Tệp dữ liệu Bản tin 76 không đúng định dạng JavaScript.")
    return json.loads(raw[len(ASSIGNMENT):-1])


class PharmacovigilanceBulletin76Tests(unittest.TestCase):
    def test_contains_four_new_bulletin_alerts(self) -> None:
        alerts = load_bulletin_alerts()
        self.assertEqual(len(alerts), 4)
        self.assertEqual(
            {item["id"] for item in alerts},
            {
                "nirpid-10-batch-5k240425",
                "xylometazoline-oxymetazoline-overuse",
                "cefazolin-kounis-syndrome",
                "carbidopa-levodopa-vitamin-b6-seizures",
            },
        )

    def test_entries_are_complete_and_link_to_bulletin(self) -> None:
        alerts = load_bulletin_alerts()
        required_text = {"id", "level", "year", "date", "category", "system", "title", "drugs", "summary", "quick", "source", "url"}
        required_lists = {"risk", "signs", "action", "monitor"}

        self.assertTrue(SOURCE_PATH.is_file())
        self.assertGreater(SOURCE_PATH.stat().st_size, 0)

        for alert in alerts:
            self.assertTrue(required_text.issubset(alert))
            self.assertTrue(required_lists.issubset(alert))
            self.assertEqual(alert["date"], "04/08/2026")
            self.assertEqual(alert["year"], "2026")
            self.assertIn("sources/ban-tin-canh-giac-duoc-so-2-2026.pdf#page=", alert["url"])
            self.assertTrue(all(alert[field] for field in required_text))
            self.assertTrue(all(isinstance(alert[field], list) and alert[field] for field in required_lists))

    def test_ids_do_not_duplicate_existing_curated_data(self) -> None:
        bulletin_ids = {item["id"] for item in load_bulletin_alerts()}
        existing = json.loads(STATIC_PATH.read_text(encoding="utf-8"))
        existing_ids = {item["id"] for item in existing}
        self.assertFalse(bulletin_ids & existing_ids)

    def test_all_five_bulletin_topics_exist_in_combined_data(self) -> None:
        combined = json.loads(STATIC_PATH.read_text(encoding="utf-8")) + load_bulletin_alerts()
        combined_ids = {item["id"] for item in combined}
        self.assertTrue(
            {
                "nirpid-10-batch-5k240425",
                "xylometazoline-oxymetazoline-overuse",
                "cefazolin-kounis-syndrome",
                "carbidopa-levodopa-vitamin-b6-seizures",
                "diosmin-hesperidin-bleeding",
            }.issubset(combined_ids)
        )

    def test_all_cards_have_direct_source_button(self) -> None:
        source = INTEGRATION_PATH.read_text(encoding="utf-8")
        self.assertIn(MAGAZINE_URL, source)
        self.assertIn("item.source_url = BULLETIN_76_SOURCE_URL", source)
        self.assertIn("item.source_url || item.url", source)
        self.assertIn('>Nguồn</a>', source)
        self.assertIn('target="_blank"', source)
        self.assertNotIn("item.detail_url", source)
        self.assertNotIn("item.direct_source", source)
        self.assertNotIn('>Xem chi tiết</button>', source)
        self.assertIn('aria-label="Mở nguồn trong tab mới"', source)
        for alert_id in {
            "nirpid-10-batch-5k240425",
            "xylometazoline-oxymetazoline-overuse",
            "cefazolin-kounis-syndrome",
            "carbidopa-levodopa-vitamin-b6-seizures",
            "diosmin-hesperidin-bleeding",
        }:
            self.assertIn(alert_id, source)

    def test_every_alert_has_a_source_url(self) -> None:
        static_alerts = json.loads(STATIC_PATH.read_text(encoding="utf-8"))
        auto_payload = json.loads(AUTO_PATH.read_text(encoding="utf-8"))
        alerts = static_alerts + load_bulletin_alerts() + auto_payload.get("alerts", [])
        missing = [item.get("id") for item in alerts if not (item.get("source_url") or item.get("url"))]
        self.assertEqual(missing, [])


if __name__ == "__main__":
    unittest.main()
