-- ClinpharmAI / VPMED
-- Cài đặt đăng ký nhân viên bệnh viện @vpmed.vn, duyệt tài khoản và nhật ký tra cứu liều thận.
-- Dùng cho dự án Supabase mới hoàn toàn. Chạy một lần trên dự án mới.

begin;

-- 1. Tạo hồ sơ nhân viên bệnh viện.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  job_title text not null,
  workplace text,
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
begin
  if lower(trim(coalesce(new.email, ''))) !~ '^[^@[:space:]]+@vpmed\.vn$' then
    raise exception 'Chỉ chấp nhận email bệnh viện @vpmed.vn';
  end if;

  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    lower(trim(new.email))
  );
  profile_job_title := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'job_title'), ''),
    'Chưa cập nhật'
  );
  profile_department := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'department'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'workplace'), ''),
    'Chưa cập nhật'
  );

  insert into public.profiles (
    id, email, full_name, job_title, workplace, role, status, created_at, updated_at
  ) values (
    new.id, lower(trim(new.email)), profile_name, profile_job_title, profile_department,
    'user', 'pending', now(), now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(trim(public.profiles.full_name), ''), excluded.full_name),
    job_title = coalesce(nullif(trim(public.profiles.job_title), ''), excluded.job_title),
    workplace = coalesce(nullif(trim(public.profiles.workplace), ''), excluded.workplace),
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
  doctor_name text not null,
  doctor_email text not null,
  job_title text not null,
  department text not null,
  lookup_type text not null check (
    lookup_type in ('renal_function', 'antibiotic_renal_dose', 'colistin_renal_dose')
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
  new.doctor_name := coalesce(nullif(trim(current_profile.full_name), ''), current_profile.email);
  new.doctor_email := current_profile.email;
  new.job_title := coalesce(nullif(trim(current_profile.job_title), ''), 'Chưa cập nhật');
  new.department := coalesce(nullif(trim(current_profile.workplace), ''), 'Chưa cập nhật');
  new.created_at := now();
  return new;
end;
$$;

create trigger set_renal_lookup_identity
before insert on public.renal_lookup_logs
for each row execute function public.fill_renal_lookup_identity();

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

revoke all on public.renal_lookup_logs from anon, authenticated;
grant insert, select on public.renal_lookup_logs to authenticated;
grant usage, select on sequence public.renal_lookup_logs_id_seq to authenticated;

comment on table public.renal_lookup_logs is
  'Audit trail for renal-function and renal-dose lookups; no patient identifiers are stored.';

commit;
