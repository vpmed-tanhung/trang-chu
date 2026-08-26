-- Chỉ chạy file này nếu dự án đã dùng bản cũ có cột doctor_name / doctor_email.
-- Bản cài mới từ renal_lookup_audit.sql không cần chạy file này.

begin;

alter table public.renal_lookup_logs add column if not exists staff_name text;
alter table public.renal_lookup_logs add column if not exists staff_email text;

update public.renal_lookup_logs
set staff_name = coalesce(nullif(staff_name, ''), doctor_name),
    staff_email = coalesce(nullif(staff_email, ''), doctor_email)
where staff_name is null or staff_email is null;

alter table public.renal_lookup_logs alter column staff_name set not null;
alter table public.renal_lookup_logs alter column staff_email set not null;
alter table public.renal_lookup_logs alter column doctor_name drop not null;
alter table public.renal_lookup_logs alter column doctor_email drop not null;

create or replace function public.fill_renal_lookup_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
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
  new.staff_name := coalesce(nullif(trim(current_profile.full_name), ''), current_profile.email);
  new.staff_email := current_profile.email;
  new.job_title := coalesce(nullif(trim(current_profile.job_title), ''), 'Chưa cập nhật');
  new.department := coalesce(nullif(trim(current_profile.workplace), ''), 'Chưa cập nhật');
  new.created_at := now();
  return new;
end;
$$;

comment on column public.renal_lookup_logs.staff_name is 'Họ tên nhân viên thực hiện tra cứu.';
comment on column public.renal_lookup_logs.staff_email is 'Email bệnh viện của nhân viên thực hiện tra cứu.';

commit;

