-- CHUYỂN SANG TÀI KHOẢN DÙNG CHUNG THEO KHOA/PHÒNG
-- Chạy MỘT LẦN trên dự án Supabase đang sử dụng, trước khi tải mã website mới.
-- Không xóa tài khoản, không xóa hồ sơ và không xóa lịch sử hiện có.

begin;

alter table public.profiles
  add column if not exists account_type text;

update public.profiles
set account_type = 'personal'
where account_type is null or trim(account_type) = '';

alter table public.profiles
  alter column account_type set default 'personal';
alter table public.profiles
  alter column account_type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_account_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_account_type_check
      check (account_type in ('personal', 'department'));
  end if;
end;
$$;

-- Mỗi khoa/phòng chỉ có một tài khoản dùng chung.
create unique index if not exists profiles_one_department_account_idx
  on public.profiles (lower(trim(workplace)))
  where account_type = 'department';

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
    id, email, full_name, job_title, workplace, account_type,
    role, status, created_at, updated_at
  ) values (
    new.id, lower(trim(new.email)), profile_name, profile_job_title,
    profile_department, profile_account_type,
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

comment on column public.profiles.account_type is
  'personal: tài khoản cũ hoặc admin; department: tài khoản dùng chung của một khoa/phòng.';
comment on column public.renal_lookup_logs.department is
  'Khoa/phòng sử dụng tài khoản để thực hiện lượt tra cứu.';

notify pgrst, 'reload schema';

commit;

-- Kiểm tra sau khi chạy:
select email, workplace as khoa_phong, account_type, role, status
from public.profiles
order by created_at desc;
