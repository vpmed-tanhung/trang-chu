import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "cap-nhat-canh-bao-duoc.yml"


def test_pharmacovigilance_workflow_keeps_three_morning_schedules():
    source = WORKFLOW.read_text(encoding="utf-8")

    assert re.search(r"(?m)^\s{2}schedule:\s*$", source), (
        "Workflow phải giữ trình kích hoạt schedule để tự chạy mỗi sáng."
    )
    assert re.search(r"(?m)^\s{2}workflow_dispatch:\s*\{\}\s*$", source), (
        "Workflow phải giữ nút chạy tay để xử lý khi cần."
    )

    cron_values = re.findall(r'(?m)^\s*-\s*cron:\s*["\']([^"\']+)["\']\s*$', source)
    assert cron_values == ["7 23 * * *", "37 23 * * *", "17 0 * * *"], (
        "Phải có các lượt tự động 06:07, 06:37 và 07:17 theo giờ Việt Nam."
    )

    # Không đặt lịch ở phút 00: GitHub có thể trì hoãn lịch trong giờ cao điểm.
    assert all(value.split()[0] != "0" for value in cron_values)

    assert "cancel-in-progress: false" in source, (
        "Các lượt bị GitHub trì hoãn không được tự hủy một lượt đang cập nhật."
    )


def test_backup_workflow_is_manual_only():
    source = (ROOT / ".github" / "workflows" / "du-phong-cap-nhat-canh-bao-duoc.yml").read_text(encoding="utf-8")
    assert "workflow_dispatch: {}" in source
    assert "schedule:" not in source
