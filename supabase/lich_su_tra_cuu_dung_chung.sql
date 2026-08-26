-- BỔ SUNG LỊCH SỬ TRA CỨU LIỀU THẬN DÙNG CHUNG
-- Chạy MỘT LẦN trên dự án Supabase đang sử dụng.
-- Mọi tài khoản approved được xem; chỉ admin được xóa.

begin;

alter table public.renal_lookup_logs
  add column if not exists patient_code text;

-- Các dòng cũ được giữ lại nhưng trước đây chưa lưu mã bệnh nhân.
update public.renal_lookup_logs
set patient_code = 'KHONG_CO_MA'
where patient_code is null or trim(patient_code) = '';

alter table public.renal_lookup_logs
  alter column patient_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'renal_lookup_logs_patient_code_length'
      and conrelid = 'public.renal_lookup_logs'::regclass
  ) then
    alter table public.renal_lookup_logs
      add constraint renal_lookup_logs_patient_code_length
      check (char_length(trim(patient_code)) between 1 and 30);
  end if;
end;
$$;

create or replace function public.normalize_renal_lookup_patient_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.patient_code := upper(trim(coalesce(new.patient_code, '')));
  if char_length(new.patient_code) < 1 or char_length(new.patient_code) > 30 then
    raise exception 'Mã bệnh nhân phải có từ 1 đến 30 ký tự';
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_renal_lookup_patient_code on public.renal_lookup_logs;
create trigger normalize_renal_lookup_patient_code
before insert or update of patient_code on public.renal_lookup_logs
for each row execute function public.normalize_renal_lookup_patient_code();

alter table public.renal_lookup_logs enable row level security;

drop policy if exists "approved users read shared renal lookup history"
on public.renal_lookup_logs;

create policy "approved users read shared renal lookup history"
on public.renal_lookup_logs for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and lower(p.email) ~ '^[^@[:space:]]+@vpmed\.vn$'
  )
);

revoke all on public.renal_lookup_logs from anon, authenticated;
grant insert, select, delete on public.renal_lookup_logs to authenticated;
grant usage, select on sequence public.renal_lookup_logs_id_seq to authenticated;

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

create or replace function public.admin_delete_renal_lookup_log(target_log_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_vpmed_admin() then raise exception 'Admin required'; end if;
  delete from public.renal_lookup_logs where id = target_log_id;
  if not found then raise exception 'Không tìm thấy lượt tra cứu'; end if;
end;
$$;

create or replace function public.admin_clear_renal_lookup_logs()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare deleted_count bigint;
begin
  if not public.is_vpmed_admin() then raise exception 'Admin required'; end if;
  delete from public.renal_lookup_logs;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.admin_delete_renal_lookup_log(bigint) from public;
revoke all on function public.admin_clear_renal_lookup_logs() from public;
grant execute on function public.admin_delete_renal_lookup_log(bigint) to authenticated;
grant execute on function public.admin_clear_renal_lookup_logs() to authenticated;

comment on column public.renal_lookup_logs.patient_code is
  'Mã người bệnh trên HIS; không nhập họ tên người bệnh.';
comment on table public.renal_lookup_logs is
  'Lịch sử dùng chung về tra cứu chức năng thận và liều thuốc; chỉ lưu mã HIS, không lưu họ tên bệnh nhân.';

notify pgrst, 'reload schema';

commit;

