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

  -- Event trigger nội bộ không phải RPC công khai. Giữ nguyên cấu hình hàm,
  -- chỉ thu hồi quyền thực thi công khai để anon không thể gọi qua Data API.
  function_signature := 'public.rls_auto_enable()';
  if to_regprocedure(function_signature) is not null then
    execute format(
      'revoke all on function %s from public, anon',
      function_signature
    );
  end if;

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

-- Kiểm tra: các hàm nội bộ phải có anon_can_execute = false; các hàm được
-- harden ở trên phải giữ cấu hình search_path mong đợi.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as function_config,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'enforce_vpmed_profile_email',
    'handle_new_vpmed_user',
    'fill_renal_lookup_identity',
    'normalize_renal_lookup_patient_code',
    'rls_auto_enable',
    'is_vpmed_admin',
    'is_vpmed_approved_user',
    'touch_my_last_login',
    'admin_set_profile_status',
    'admin_delete_user',
    'admin_delete_renal_lookup_log',
    'admin_clear_renal_lookup_logs'
  )
order by p.proname, arguments;
