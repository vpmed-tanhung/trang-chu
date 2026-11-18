-- Quyền biên tập: giữ toàn quyền admin; bổ sung mail Khoa Dược đã xác minh và được duyệt.
create schema if not exists pharmacy_private;
revoke all on schema pharmacy_private from public, anon;
grant usage on schema pharmacy_private to authenticated;

create or replace function pharmacy_private.can_edit_content()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from auth.users u join public.profiles p on p.id=u.id
    where u.id=(select auth.uid())
      and (lower(u.email)='khoaduoc@vpmed.vn' or p.role='admin')
      and u.email_confirmed_at is not null and p.status='approved'
  );
$$;
revoke all on function pharmacy_private.can_edit_content() from public,anon;
grant execute on function pharmacy_private.can_edit_content() to authenticated;

create or replace function public.can_edit_pharmacy_content()
returns boolean language sql stable security invoker set search_path = ''
as $$ select pharmacy_private.can_edit_content(); $$;
revoke all on function public.can_edit_pharmacy_content() from public,anon;
grant execute on function public.can_edit_pharmacy_content() to authenticated;

create table public.pharmacy_site_content (
  id text primary key check (id='homepage'),
  content jsonb not null default '{}'::jsonb
    check (jsonb_typeof(content)='object' and octet_length(content::text)<=60000
      and not jsonb_path_exists(content,'$.* ? (@.type() != "string")')),
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.pharmacy_site_content(id) values('homepage');
alter table public.pharmacy_site_content enable row level security;
revoke all on public.pharmacy_site_content from public,anon,authenticated;
grant select on public.pharmacy_site_content to authenticated;
grant update(content) on public.pharmacy_site_content to authenticated;
create policy pharmacy_home_approved_read on public.pharmacy_site_content for select to authenticated
using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='approved'));
create policy pharmacy_home_editor_update on public.pharmacy_site_content for update to authenticated
using((select pharmacy_private.can_edit_content()))
with check((select pharmacy_private.can_edit_content()));

create function pharmacy_private.stamp_content_revision()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.revision := old.revision+1;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
revoke all on function pharmacy_private.stamp_content_revision() from public,anon,authenticated;
create trigger pharmacy_home_revision before update on public.pharmacy_site_content
for each row execute function pharmacy_private.stamp_content_revision();

alter table public.pharmacy_documents
  add column revision integer not null default 1,
  add column updated_at timestamptz not null default now(),
  add column updated_by uuid references auth.users(id) on delete set null;
create index pharmacy_documents_updated_by_idx on public.pharmacy_documents(updated_by);
create index pharmacy_site_content_updated_by_idx on public.pharmacy_site_content(updated_by);
grant update(title,summary,category,file_name,file_size,storage_path) on public.pharmacy_documents to authenticated;
create trigger pharmacy_documents_revision before update on public.pharmacy_documents
for each row execute function pharmacy_private.stamp_content_revision();

drop policy pharmacy_documents_admin_insert on public.pharmacy_documents;
drop policy pharmacy_documents_admin_delete on public.pharmacy_documents;
create policy pharmacy_documents_editor_insert on public.pharmacy_documents for insert to authenticated
with check(created_by=(select auth.uid()) and (select pharmacy_private.can_edit_content()));
create policy pharmacy_documents_editor_update on public.pharmacy_documents for update to authenticated
using((select pharmacy_private.can_edit_content()))
with check((select pharmacy_private.can_edit_content()));
create policy pharmacy_documents_editor_delete on public.pharmacy_documents for delete to authenticated
using((select pharmacy_private.can_edit_content()));

drop policy pharmacy_pdfs_admin_upload on storage.objects;
drop policy pharmacy_pdfs_admin_delete on storage.objects;
create policy pharmacy_pdfs_editor_upload on storage.objects for insert to authenticated
with check(bucket_id='pharmacy-pdfs'
  and name ~ '^(drug|guide|bulletin)/[0-9a-f-]{36}\.pdf$'
  and (select pharmacy_private.can_edit_content()));
create policy pharmacy_pdfs_editor_delete on storage.objects for delete to authenticated
using(bucket_id='pharmacy-pdfs' and (select pharmacy_private.can_edit_content()));
