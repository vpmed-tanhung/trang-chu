import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    'index.html',
    'cap-nhat-du-lieu.html',
    'cong-cu-duoc-lam-sang.html',
    'petct-dose-tool.html',
    'phieu-danh-gia.html',
    'tai-khoan.html',
]


def test_all_notifier_pages_are_stamped_with_current_build():
    version = json.loads((ROOT / 'assets' / 'app-version.json').read_text(encoding='utf-8'))['version']
    for page in PAGES:
        html = (ROOT / page).read_text(encoding='utf-8')
        assert 'assets/update-notifier.js?v=20260822-pwa-v1' in html, f'{page} thiếu update notifier mới'
        match = re.search(r'<meta\s+name="vpmed-build-version"\s+content="([^"]+)"', html)
        assert match, f'{page} thiếu meta vpmed-build-version'
        assert match.group(1) == version, f'{page} đang đóng dấu build cũ'


def test_notifier_verifies_loaded_build_before_success():
    js = (ROOT / 'assets' / 'update-notifier.js').read_text(encoding='utf-8')
    assert 'getLoadedBuildVersion' in js
    assert 'ACCEPTED_VERSION_KEY' in js
    assert 'ACCEPTED_DISPLAY_KEY' in js
    assert 'if (reloadTarget === version && (!loadedVersion || loadedVersion === version))' in js
    assert 'acceptVersion(version, displayVersion)' in js
    assert 'showSuccess(version, displayVersion)' in js
    # Không được ghi “đã thấy bản mới” trước khi reload thực sự tải đúng build.
    reload_block = re.search(r'function reloadForUpdate\(version\) \{([\s\S]*?)\n  \}', js)
    assert reload_block
    assert 'SEEN_VERSION_KEY' not in reload_block.group(1)
    assert 'RELOAD_TARGET_KEY' in reload_block.group(1)

    # Phát hiện bản mới chỉ được hiện nút; không đổi footer hoặc tự tải lại.
    update_block = re.search(r'function showUpdate\(data\) \{([\s\S]*?)\n  \}', js)
    assert update_block
    assert 'setFooterVersion' not in update_block.group(1)
    assert 'location.replace' not in update_block.group(1)
    assert 'location.reload' not in update_block.group(1)
    assert "box.onclick = function () { reloadForUpdate(version); };" in update_block.group(1)

    # Nếu HTML thực tế đã đúng build máy chủ thì không được hiện lời mời cập nhật giả.
    assert 'loadedVersion === version && !reloadTarget' in js
    assert 'acceptedVersion === version' in js
    assert 'Chưa bấm: luôn giữ nhãn phiên bản cũ' in js


def test_changed_prescription_asset_has_current_cache_buster():
    shell = (ROOT / 'assets' / 'platform-shell.js').read_text(encoding='utf-8')
    assert 'assets/prescription-result-model.js?v=20260822-behavior-tests-v1' in shell
    assert 'assets/prescription-check.js?v=20260822-behavior-tests-v1' in shell

