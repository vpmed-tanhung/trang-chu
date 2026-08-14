-- SỬA QUYỀN XÓA LỊCH SỬ CHO ADMIN
-- Chạy một lần nếu tài khoản role=admin, status=approved nhưng nút xóa báo lỗi.

begin;

alter table public.renal_lookup_logs enable row level security;

revoke all on public.renal_lookup_logs from anon, authenticated;
grant insert, select, delete on public.renal_lookup_logs to authenticated;

drop policy if exists "admins delete shared renal lookup history"
on public.renal_lookup_logs;

create policy "admins delete shared renal lookup history"
on public.renal_lookup_logs for delete to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.status = 'approved'
      and lower(p.email) ~ '^[^@[:space:]]+@vpmed\.vn$'
  )
);

notify pgrst, 'reload schema';

commit;

-- Kiểm tra policy vừa tạo. Kết quả phải có một dòng cmd = DELETE.
select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'renal_lookup_logs'
  and policyname = 'admins delete shared renal lookup history';
