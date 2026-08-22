-- VPMED - hardening hàm PostgreSQL sau khi chạy bộ SQL cài đặt/nâng cấp.
-- Chạy file này CUỐI CÙNG trong Supabase SQL Editor.
-- Không xóa dữ liệu, tài khoản hoặc policy RLS.

begin;

do $$
declare
  function_signature text;
begin
  -- Trigger functions không phải API công khai. Trigger vẫn hoạt động khi
  -- EXECUTE bị thu hồi khỏi PUBLIC/anon/authenticated.
  foreach function_signature in array array[
    'public.enforce_vpmed_profile_email()',
    'public.handle_new_vpmed_user()',
    'public.fill_renal_lookup_identity()',
    'public.normalize_renal_lookup_patient_code()'
  ] loop
    if to_regprocedure(function_signature) is not null then
      execute format('alter function %s set search_path = %L', function_signature, '');
      execute format(
        'revoke all on function %s from public, anon, authenticated',
        function_signature
      );
    end if;
  end loop;

  -- RPC được client gọi. Mặc định thu hồi mọi quyền, sau đó chỉ cấp lại cho
  -- authenticated; từng hàm vẫn tự kiểm tra auth.uid(), status và role admin.
  foreach function_signature in array array[
    'public.is_vpmed_admin()',
    'public.is_vpmed_approved_user()',
    'public.touch_my_last_login()',
    'public.admin_set_profile_status(uuid,text)',
    'public.admin_delete_user(uuid)',
    'public.admin_delete_renal_lookup_log(bigint)',
    'public.admin_clear_renal_lookup_logs()'
  ] loop
    if to_regprocedure(function_signature) is not null then
      execute format('alter function %s set search_path = %L', function_signature, '');
      execute format(
        'revoke all on function %s from public, anon, authenticated',
        function_signature
      );
      execute format('grant execute on function %s to authenticated', function_signature);
    end if;
  end loop;
end;
$$;

notify pgrst, 'reload schema';

commit;

-- Kiểm tra: proconfig phải chứa search_path="" cho các hàm đã tồn tại.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as function_config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'enforce_vpmed_profile_email',
    'handle_new_vpmed_user',
    'fill_renal_lookup_identity',
    'normalize_renal_lookup_patient_code',
    'is_vpmed_admin',
    'is_vpmed_approved_user',
    'touch_my_last_login',
    'admin_set_profile_status',
    'admin_delete_user',
    'admin_delete_renal_lookup_log',
    'admin_clear_renal_lookup_logs'
  )
order by p.proname, arguments;
