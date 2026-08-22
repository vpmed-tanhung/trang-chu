from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_auth_uses_server_validated_user_before_profile_authorization():
    source = (ROOT / "assets" / "vpmed-access.js").read_text(encoding="utf-8")
    assert "client.auth.getUser()" in source
    assert "client.auth.getSession()" not in source
    assert ".from('profiles')" in source


def test_sql_functions_do_not_use_mutable_public_search_path():
    for sql_path in sorted((ROOT / "supabase").glob("*.sql")):
        source = sql_path.read_text(encoding="utf-8").lower()
        assert "set search_path = public" not in source, sql_path.name
        assert "set search_path = public, auth" not in source, sql_path.name


def test_security_definer_hardening_covers_trigger_and_rpc_functions():
    source = (ROOT / "supabase" / "bao_mat_security_definer.sql").read_text(
        encoding="utf-8"
    )
    for function_name in [
        "handle_new_vpmed_user",
        "fill_renal_lookup_identity",
        "is_vpmed_admin",
        "is_vpmed_approved_user",
        "touch_my_last_login",
        "admin_set_profile_status",
        "admin_delete_user",
        "admin_delete_renal_lookup_log",
        "admin_clear_renal_lookup_logs",
    ]:
        assert function_name in source
    assert "revoke all on function" in source.lower()
    assert "set search_path = %L" in source
