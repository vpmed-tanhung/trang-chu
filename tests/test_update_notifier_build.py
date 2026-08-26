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
        assert 'assets/update-notifier.js?v=20260822-installed-data-channel-v1' in html, f'{page} thiếu update notifier mới'
        match = re.search(r'<meta\s+name="vpmed-build-version"\s+content="([^"]+)"', html)
        assert match, f'{page} thiếu meta vpmed-build-version'
        assert match.group(1) == version, f'{page} đang đóng dấu build cũ'


def test_platform_shell_uses_current_build():
    version = json.loads((ROOT / 'assets' / 'app-version.json').read_text(encoding='utf-8'))['version']
    shell = (ROOT / 'assets' / 'platform-shell.js').read_text(encoding='utf-8')
    match = re.search(r"const BUILD_VERSION = '([^']+)'", shell)
    assert match, 'platform-shell.js thiếu BUILD_VERSION'
    assert match.group(1) == version, 'platform-shell.js đang dùng build cũ'


def test_notifier_verifies_loaded_build_before_success():
    js = (ROOT / 'assets' / 'update-notifier.js').read_text(encoding='utf-8')
    assert 'getLoadedBuildVersion' in js
    assert 'ACCEPTED_VERSION_KEY' in js
    assert 'ACCEPTED_DISPLAY_KEY' in js
    assert 'if (reloadTarget === version && (!loadedVersion || loadedVersion === version))' in js
    assert 'acceptVersion(version, displayVersion)' in js
    assert 'showSuccess(version, displayVersion)' in js
    assert 'serviceWorker.getRegistration()' in js
    assert "registration.waiting.postMessage({type: 'SKIP_WAITING'})" in js
    assert 'vpmed:app-update-available' in js
    assert 'INSTALLED_DATA_VERSION_KEY' in js
    assert 'clinicalDataVersion' in js
    assert 'applyDataUpdate' in js
    assert "notice.id = 'vpmedUpdateNotice'" not in js
    assert 'function getNotice' not in js
    assert '#vpmedUpdateNotice{' not in js
    # Không được ghi “đã thấy bản mới” trước khi reload thực sự tải đúng build.
    reload_block = re.search(r'function reloadForUpdate\(version\) \{([\s\S]*?)\n  \}', js)
    assert reload_block
    assert 'SEEN_VERSION_KEY' not in reload_block.group(1)
    assert 'RELOAD_TARGET_KEY' in reload_block.group(1)

    # Phát hiện bản mới chỉ chuyển sang banner lớn; không tạo notifier góc.
    update_block = re.search(r'function showUpdate\(data\) \{([\s\S]*?)\n  \}', js)
    assert update_block
    assert 'setFooterVersion' not in update_block.group(1)
    assert 'location.replace' not in update_block.group(1)
    assert 'location.reload' not in update_block.group(1)
    assert 'vpmed:app-update-available' in update_block.group(1)
    assert 'getNotice' not in update_block.group(1)

    # Nếu HTML thực tế đã đúng build máy chủ thì không được hiện lời mời cập nhật giả.
    assert 'loadedVersion === version && !reloadTarget' in js
    assert 'acceptedVersion === version' in js
    assert 'Chưa bấm: luôn giữ nhãn phiên bản cũ' in js


def test_changed_prescription_asset_has_current_cache_buster():
    shell = (ROOT / 'assets' / 'platform-shell.js').read_text(encoding='utf-8')
    assert 'assets/prescription-result-model.js?v=20260822-behavior-tests-v1' in shell
    assert 'assets/prescription-check.js?v=20260826-bhyt-ai-text-v1' in shell
    assert 'showWorkerUpdateBanner' in shell
    assert 'vpmedUpdateBanner' in shell
    assert 'vpmed:app-update-available' in shell
    assert "detail.kind === 'clinical-data'" in shell
    assert 'REGISTER_CLIENT_MODE' in shell


def test_installed_app_has_an_independent_data_update_channel():
    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    worker = (ROOT / 'sw.js').read_text(encoding='utf-8')
    assert 'vpmed_app=installed' in manifest['start_url']
    assert 'CLINICAL_WEB_CACHE_PREFIX' in worker
    assert 'CLINICAL_INSTALLED_CACHE_PREFIX' in worker
    assert 'STORED_INSTALLED_DATA_VERSION_URL' in worker
    assert 'VPMED_DATA_VERSION_AVAILABLE' in worker
    assert 'APPLY_DATA_VERSION' in worker
