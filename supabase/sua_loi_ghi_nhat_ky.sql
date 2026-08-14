-- SỬA LỖI: KẾT QUẢ ĐÃ TÍNH NHƯNG CHƯA LƯU ĐƯỢC NHẬT KÝ
-- Chạy TOÀN BỘ file này một lần trong Supabase SQL Editor.
-- An toàn cho cả cấu trúc cũ và mới; không xóa tài khoản hoặc lịch sử hiện có.

begin;

-- 1. Chuẩn hóa các cột hồ sơ mà trigger nhật ký cần sử dụng.
alter table public.profiles add column if not exists workplace text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists account_type text;

update public.profiles
set workplace = coalesce(nullif(trim(workplace), ''), nullif(trim(full_name), ''), 'Chưa cập nhật'),
    job_title = coalesce(nullif(trim(job_title), ''), 'Chưa cập nhật'),
    account_type = case
      when account_type in ('personal', 'department') then account_type
      else 'personal'
    end;

alter table public.profiles alter column job_title set default 'Chưa cập nhật';
alter table public.profiles alter column job_title set not null;
alter table public.profiles alter column account_type set default 'personal';
alter table public.profiles alter column account_type set not null;

-- 2. Bổ sung các cột nhật ký còn thiếu trên các bản database cũ.
alter table public.renal_lookup_logs add column if not exists patient_code text;
alter table public.renal_lookup_logs add column if not exists staff_name text;
alter table public.renal_lookup_logs add column if not exists staff_email text;
alter table public.renal_lookup_logs add column if not exists job_title text;
alter table public.renal_lookup_logs add column if not exists department text;

-- Lấy lại định danh từ hồ sơ hiện có để bảo toàn các dòng lịch sử cũ.
update public.renal_lookup_logs as logs
set patient_code = coalesce(nullif(trim(logs.patient_code), ''), 'KHONG_CO_MA'),
    staff_name = coalesce(nullif(trim(logs.staff_name), ''), nullif(trim(p.full_name), ''), p.email, 'Chưa cập nhật'),
    staff_email = coalesce(nullif(trim(logs.staff_email), ''), p.email, 'Chưa cập nhật'),
    job_title = coalesce(nullif(trim(logs.job_title), ''), nullif(trim(p.job_title), ''), 'Chưa cập nhật'),
    department = coalesce(nullif(trim(logs.department), ''), nullif(trim(p.workplace), ''), 'Chưa cập nhật')
from public.profiles as p
where p.id = logs.user_id;

update public.renal_lookup_logs
set patient_code = coalesce(nullif(trim(patient_code), ''), 'KHONG_CO_MA'),
    staff_name = coalesce(nullif(trim(staff_name), ''), 'Chưa cập nhật'),
    staff_email = coalesce(nullif(trim(staff_email), ''), 'Chưa cập nhật'),
    job_title = coalesce(nullif(trim(job_title), ''), 'Chưa cập nhật'),
    department = coalesce(nullif(trim(department), ''), 'Chưa cập nhật');

alter table public.renal_lookup_logs alter column patient_code set default 'KHONG_CO_MA';
alter table public.renal_lookup_logs alter column patient_code set not null;
alter table public.renal_lookup_logs alter column staff_name set not null;
alter table public.renal_lookup_logs alter column staff_email set not null;
alter table public.renal_lookup_logs alter column job_title set default 'Chưa cập nhật';
alter table public.renal_lookup_logs alter column job_title set not null;
alter table public.renal_lookup_logs alter column department set default 'Chưa cập nhật';
alter table public.renal_lookup_logs alter column department set not null;

-- Cho phép công cụ Tính liều kháng sinh Nhi ghi cùng bảng nhật ký.
-- Tự tìm và thay constraint CHECK cũ để chạy được trên các bản database đã triển khai.
do $$
declare lookup_constraint text;
begin
  select c.conname into lookup_constraint
  from pg_constraint c
  where c.conrelid = 'public.renal_lookup_logs'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%lookup_type%'
  limit 1;

  if lookup_constraint is not null then
    execute format('alter table public.renal_lookup_logs drop constraint %I', lookup_constraint);
  end if;

  alter table public.renal_lookup_logs
    add constraint renal_lookup_logs_lookup_type_check
    check (lookup_type in ('renal_function', 'antibiotic_renal_dose', 'colistin_renal_dose', 'pediatric_antibiotic_dose'));
end;
$$;

-- Bản rất cũ có doctor_name/doctor_email NOT NULL, khiến client mới không INSERT được.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'renal_lookup_logs' and column_name = 'doctor_name'
  ) then
    execute 'alter table public.renal_lookup_logs alter column doctor_name drop not null';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'renal_lookup_logs' and column_name = 'doctor_email'
  ) then
    execute 'alter table public.renal_lookup_logs alter column doctor_email drop not null';
  end if;
end;
$$;

-- 3. Trigger tự lấy đúng khoa/phòng của tài khoản đang đăng nhập.
create or replace function public.fill_renal_lookup_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare current_profile public.profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into current_profile
  from public.profiles
  where id = auth.uid()
    and status = 'approved'
    and lower(email) ~ '^[^@[:space:]]+@vpmed\.vn$';

  if not found then raise exception 'Approved profile required'; end if;

  new.user_id := auth.uid();
  new.patient_code := upper(trim(coalesce(nullif(new.patient_code, ''), 'KHONG_CO_MA')));
  new.department := coalesce(nullif(trim(current_profile.workplace), ''), 'Chưa cập nhật');
  new.staff_name := case
    when current_profile.account_type = 'department' then new.department
    else coalesce(nullif(trim(current_profile.full_name), ''), current_profile.email)
  end;
  new.staff_email := current_profile.email;
  new.job_title := case
    when current_profile.account_type = 'department' then 'Tài khoản khoa/phòng'
    else coalesce(nullif(trim(current_profile.job_title), ''), 'Chưa cập nhật')
  end;
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists set_renal_lookup_identity on public.renal_lookup_logs;
create trigger set_renal_lookup_identity
before insert on public.renal_lookup_logs
for each row execute function public.fill_renal_lookup_identity();

create or replace function public.normalize_renal_lookup_patient_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.patient_code := upper(trim(coalesce(nullif(new.patient_code, ''), 'KHONG_CO_MA')));
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

-- 4. Khôi phục quyền INSERT/SELECT đúng cho tài khoản bệnh viện đã duyệt.
alter table public.renal_lookup_logs enable row level security;

drop policy if exists "approved users insert own renal lookups" on public.renal_lookup_logs;
create policy "approved users insert own renal lookups"
on public.renal_lookup_logs for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and lower(p.email) ~ '^[^@[:space:]]+@vpmed\.vn$'
  )
);

drop policy if exists "approved users read shared renal lookup history" on public.renal_lookup_logs;
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

do $$
declare identity_sequence text;
begin
  identity_sequence := pg_get_serial_sequence('public.renal_lookup_logs', 'id');
  if identity_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', identity_sequence);
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;

-- Kết quả kiểm tra: phải có policy INSERT và hai trigger ở trên.
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'renal_lookup_logs'
order by cmd, policyname;
