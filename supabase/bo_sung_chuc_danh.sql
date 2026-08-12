-- Bổ sung chức danh/vị trí công tác cho dự án đã chạy renal_lookup_audit.sql.
-- Không xóa bảng, tài khoản hoặc nhật ký hiện có. Chạy một lần.

begin;

alter table public.profiles
  add column if not exists job_title text;

update public.profiles as p
set job_title = coalesce(
  nullif(trim(job_title), ''),
  nullif(trim((select u.raw_user_meta_data ->> 'job_title' from auth.users u where u.id = p.id)), ''),
  'Chưa cập nhật'
);

alter table public.profiles
  alter column job_title set default 'Chưa cập nhật';
alter table public.profiles
  alter column job_title set not null;

alter table public.renal_lookup_logs
  add column if not exists job_title text;

update public.renal_lookup_logs
set job_title = 'Chưa cập nhật'
where job_title is null or trim(job_title) = '';

alter table public.renal_lookup_logs
  alter column job_title set default 'Chưa cập nhật';
alter table public.renal_lookup_logs
  alter column job_title set not null;

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

commit;
