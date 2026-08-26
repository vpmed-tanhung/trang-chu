-- VPMED - tối ưu policy RLS mà không thay đổi phạm vi truy cập.
-- Chạy sau các file cài đặt/nâng cấp nghiệp vụ và trước bao_mat_security_definer.sql.
-- Không xóa dữ liệu hoặc thay đổi quyền bảng.

begin;

alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "admins read all profiles" on public.profiles;
drop policy if exists "authenticated read permitted profiles" on public.profiles;

create policy "authenticated read permitted profiles"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select public.is_vpmed_admin())
);

alter table public.renal_lookup_logs enable row level security;

drop policy if exists "approved users insert own renal lookups"
on public.renal_lookup_logs;

create policy "approved users insert own renal lookups"
on public.renal_lookup_logs for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'approved'
      and lower(p.email) ~ '^[^@[:space:]]+@vpmed\.vn$'
  )
);

drop policy if exists "admins read renal lookup audit"
on public.renal_lookup_logs;
drop policy if exists "approved users read shared renal lookup history"
on public.renal_lookup_logs;
drop policy if exists "approved users or admins read renal lookup history"
on public.renal_lookup_logs;

create policy "approved users or admins read renal lookup history"
on public.renal_lookup_logs for select to authenticated
using (
  (select public.is_vpmed_admin())
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'approved'
      and lower(p.email) ~ '^[^@[:space:]]+@vpmed\.vn$'
  )
);

drop policy if exists "admins delete shared renal lookup history"
on public.renal_lookup_logs;

create policy "admins delete shared renal lookup history"
on public.renal_lookup_logs for delete to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.status = 'approved'
      and lower(p.email) ~ '^[^@[:space:]]+@vpmed\.vn$'
  )
);

notify pgrst, 'reload schema';

commit;

select
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'renal_lookup_logs')
order by tablename, cmd, policyname;
