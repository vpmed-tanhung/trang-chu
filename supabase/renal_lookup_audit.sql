-- ClinpharmAI / VPMED
-- Cài đặt tài khoản khoa/phòng dùng email @vpmed.vn, duyệt tài khoản và nhật ký tra cứu liều thận.
-- Dùng cho dự án Supabase mới hoàn toàn. Chạy một lần trên dự án mới.

begin;

-- 1. Tạo hồ sơ tài khoản nội bộ bệnh viện.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  job_title text not null,
  workplace text,
  account_type text not null default 'personal' check (account_type in ('personal', 'department')),
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_by uuid,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Chỉ chấp nhận hồ sơ dùng email bệnh viện.
create or replace function public.enforce_vpmed_profile_email()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.email := lower(trim(coalesce(new.email, '')));
  if new.email !~ '^[^@[:space:]]+@vpmed\.vn$' then
    raise exception 'Chỉ chấp nhận email bệnh viện @vpmed.vn';
  end if;
  return new;
end;
$$;

create trigger enforce_vpmed_profile_email
before insert or update of email on public.profiles
for each row execute function public.enforce_vpmed_profile_email();

create unique index profiles_one_department_account_idx
  on public.profiles (lower(trim(workplace)))
  where account_type = 'department';

-- 3. Tự tạo hồ sơ khi Supabase Auth tạo người dùng mới.
create or replace function public.handle_new_vpmed_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_job_title text;
  profile_department text;
  profile_account_type text;
begin
  if lower(trim(coalesce(new.email, ''))) !~ '^[^@[:space:]]+@vpmed\.vn$' then
    raise exception 'Chỉ chấp nhận email bệnh viện @vpmed.vn';
  end if;

  profile_account_type := case
    when lower(trim(coalesce(new.raw_user_meta_data ->> 'account_type', ''))) = 'department'
      then 'department'
    else 'personal'
  end;
  profile_department := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'department'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'workplace'), ''),
    'Chưa cập nhật'
  );

  if profile_account_type = 'department' then
    if profile_department = 'Chưa cập nhật' then
      raise exception 'Vui lòng nhập khoa/phòng/đơn vị sử dụng';
    end if;
    profile_name := profile_department;
    profile_job_title := 'Tài khoản khoa/phòng';
  else
    profile_name := coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      lower(trim(new.email))
    );
    profile_job_title := coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'job_title'), ''),
      'Chưa cập nhật'
    );
  end if;

  insert into public.profiles (
    id, email, full_name, job_title, workplace, account_type, role, status, created_at, updated_at
  ) values (
    new.id, lower(trim(new.email)), profile_name, profile_job_title, profile_department, profile_account_type,
    'user', 'pending', now(), now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(trim(public.profiles.full_name), ''), excluded.full_name),
    job_title = coalesce(nullif(trim(public.profiles.job_title), ''), excluded.job_title),
    workplace = coalesce(nullif(trim(public.profiles.workplace), ''), excluded.workplace),
    account_type = coalesce(public.profiles.account_type, excluded.account_type),
    updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_vpmed_user();

-- 4. Hàm kiểm tra quyền admin, không tạo vòng lặp RLS.
create or replace function public.is_vpmed_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.status = 'approved'
      and lower(p.email) ~ '^[^@[:space:]]+@vpmed\.vn$'
  );
$$;

revoke all on function public.is_vpmed_admin() from public;
grant execute on function public.is_vpmed_admin() to authenticated;

-- Người dùng chỉ đọc hồ sơ của mình; admin đọc danh sách để duyệt.
alter table public.profiles enable row level security;

create policy "users read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "admins read all profiles"
on public.profiles for select to authenticated
using (public.is_vpmed_admin());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- Cập nhật lần đăng nhập mà không cho client sửa các cột nhạy cảm.
create or replace function public.touch_my_last_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.profiles set last_login_at = now(), updated_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.touch_my_last_login() from public;
grant execute on function public.touch_my_last_login() to authenticated;

-- Chỉ admin đã duyệt mới được đổi trạng thái tài khoản.
create or replace function public.admin_set_profile_status(target_user_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_vpmed_admin() then raise exception 'Admin required'; end if;
  if new_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Trạng thái không hợp lệ';
  end if;

  update public.profiles
  set status = new_status,
      approved_at = case when new_status = 'approved' then now() else null end,
      approved_by = auth.uid(),
      updated_at = now()
  where id = target_user_id;

  if not found then raise exception 'Không tìm thấy tài khoản'; end if;
end;
$$;

revoke all on function public.admin_set_profile_status(uuid, text) from public;
grant execute on function public.admin_set_profile_status(uuid, text) to authenticated;

-- 5. Nhật ký tra cứu liều thận.
create table public.renal_lookup_logs (
  id bigint generated by default as identity primary key,
  user_id uuid not null references public.profiles(id) on delete restrict,
  patient_code text not null default 'KHONG_CO_MA' check (char_length(trim(patient_code)) between 1 and 30),
  staff_name text not null,
  staff_email text not null,
  job_title text not null,
  department text not null,
  lookup_type text not null check (
    lookup_type in ('renal_function', 'antibiotic_renal_dose', 'colistin_renal_dose', 'pediatric_antibiotic_dose')
  ),
  module_name text,
  drug_name text,
  crcl_ml_min numeric(7,1) check (crcl_ml_min is null or crcl_ml_min between 0 and 1000),
  egfr_ml_min_1_73m2 numeric(7,1) check (egfr_ml_min_1_73m2 is null or egfr_ml_min_1_73m2 between 0 and 1000),
  renal_band text,
  result_summary text,
  created_at timestamptz not null default now()
);

create index renal_lookup_logs_created_at_idx
  on public.renal_lookup_logs (created_at desc);
create index renal_lookup_logs_user_id_created_at_idx
  on public.renal_lookup_logs (user_id, created_at desc);
create index renal_lookup_logs_lookup_type_created_at_idx
  on public.renal_lookup_logs (lookup_type, created_at desc);

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

create trigger set_renal_lookup_identity
before insert on public.renal_lookup_logs
for each row execute function public.fill_renal_lookup_identity();

create or replace function public.normalize_renal_lookup_patient_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.patient_code := upper(trim(coalesce(new.patient_code, '')));
  if char_length(new.patient_code) < 1 or char_length(new.patient_code) > 30 then
    raise exception 'Mã bệnh nhân phải có từ 1 đến 30 ký tự';
  end if;
  return new;
end;
$$;

create trigger normalize_renal_lookup_patient_code
before insert or update of patient_code on public.renal_lookup_logs
for each row execute function public.normalize_renal_lookup_patient_code();

alter table public.renal_lookup_logs enable row level security;

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

create policy "admins read renal lookup audit"
on public.renal_lookup_logs for select to authenticated
using (public.is_vpmed_admin());

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
set search_path = public
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
set search_path = public
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

comment on table public.renal_lookup_logs is
  'Lịch sử dùng chung về tra cứu chức năng thận và liều thuốc; chỉ lưu mã HIS, không lưu họ tên bệnh nhân.';

notify pgrst, 'reload schema';

commit;
