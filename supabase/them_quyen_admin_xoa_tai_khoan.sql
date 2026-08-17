-- VPMED - Cho phép admin xóa vĩnh viễn tài khoản và chặn tài khoản đã xóa truy cập lại.
-- Chạy MỘT LẦN trong Supabase SQL Editor trên dự án đang dùng.
-- Sau khi chạy: admin có thể xóa cả tài khoản pending/rejected/approved/admin.
-- Người bị xóa chỉ dùng lại web sau khi đăng ký lại từ đầu và được duyệt lại.

begin;

create or replace function public.is_vpmed_approved_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and lower(p.email) ~ '^[^@[:space:]]+@vpmed\.vn$'
  );
$$;

revoke all on function public.is_vpmed_approved_user() from public;
grant execute on function public.is_vpmed_approved_user() to authenticated;

-- Giữ nhật ký cũ: khi profile bị xóa, user_id của lịch sử chuyển NULL.
do $$
begin
  if to_regclass('public.renal_lookup_logs') is not null then
    alter table public.renal_lookup_logs drop constraint if exists renal_lookup_logs_user_id_fkey;
    alter table public.renal_lookup_logs alter column user_id drop not null;
    alter table public.renal_lookup_logs
      add constraint renal_lookup_logs_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete set null;
  end if;
end;
$$;

-- RPC chỉ admin đã duyệt mới gọi được; xóa thật auth.users để email đăng ký lại được.
create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_vpmed_admin() then raise exception 'Admin required'; end if;
  if target_user_id is null then raise exception 'Tài khoản không hợp lệ'; end if;
  delete from auth.users where id = target_user_id;
  if not found then raise exception 'Không tìm thấy tài khoản'; end if;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- JWT cũ của user đã xóa không được đọc/ghi clinical_content chỉ vì còn role authenticated.
do $$
begin
  if to_regclass('public.clinical_content') is not null then
    alter table public.clinical_content enable row level security;
    drop policy if exists "approved profile required for clinical content" on public.clinical_content;
    create policy "approved profile required for clinical content"
      on public.clinical_content as restrictive for all to authenticated
      using (public.is_vpmed_approved_user())
      with check (public.is_vpmed_approved_user());
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;

select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('admin_delete_user', 'is_vpmed_approved_user')
order by proname;
