import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "cap-nhat-canh-bao-duoc.yml"
BACKUP_WORKFLOW = (
    ROOT / ".github" / "workflows" / "du-phong-cap-nhat-canh-bao-duoc.yml"
)


def test_pharmacovigilance_workflow_keeps_two_morning_schedules():
    source = WORKFLOW.read_text(encoding="utf-8")

    assert re.search(r"(?m)^\s{2}schedule:\s*$", source), (
        "Workflow phải giữ trình kích hoạt schedule để tự chạy mỗi sáng."
    )
    assert re.search(r"(?m)^\s{2}workflow_dispatch:\s*\{\}\s*$", source), (
        "Workflow phải giữ nút chạy tay để xử lý khi cần."
    )

    cron_values = re.findall(r'(?m)^\s*-\s*cron:\s*["\']([^"\']+)["\']\s*$', source)
    assert cron_values == ["7 23 * * *", "37 23 * * *"], (
        "Phải có lượt tự động 06:07 và lượt dự phòng 06:37 theo giờ Việt Nam."
    )

    # Không đặt lịch ở phút 00: GitHub có thể trì hoãn lịch trong giờ cao điểm.
    assert all(value.split()[0] != "0" for value in cron_values)


def test_pharmacovigilance_has_an_independent_backup_schedule():
    main_source = WORKFLOW.read_text(encoding="utf-8")
    backup_source = BACKUP_WORKFLOW.read_text(encoding="utf-8")

    assert re.search(r"(?m)^\s{2}workflow_call:\s*\{\}\s*$", main_source), (
        "Workflow chính phải cho phép workflow dự phòng gọi lại cùng quy trình."
    )
    assert re.search(r"(?m)^\s{2}schedule:\s*$", backup_source), (
        "Workflow dự phòng phải có lịch độc lập để GitHub đăng ký riêng."
    )
    assert re.search(
        r'(?m)^\s*-\s*cron:\s*["\']17 0 \* \* \*["\']\s*$', backup_source
    ), "Workflow dự phòng phải kiểm tra lúc 07:17 theo giờ Việt Nam."
    assert "uses: ./.github/workflows/cap-nhat-canh-bao-duoc.yml" in backup_source
