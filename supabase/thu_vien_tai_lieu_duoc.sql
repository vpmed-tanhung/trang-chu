-- Bổ sung kho PDF trên dự án vpmed-clinpharm.
-- Chỉ tạo tài nguyên mới; không sửa tài khoản và các bảng nghiệp vụ hiện có.
create table public.pharmacy_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('drug','guide','bulletin')),
  title text not null check (length(btrim(title)) between 1 and 240),
  summary text not null default '' check (length(summary) <= 1500),
  category text not null check (length(btrim(category)) between 1 and 80),
  file_name text not null check (length(file_name) between 1 and 255),
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  storage_path text not null unique check (storage_path ~ '^(drug|guide|bulletin)/[0-9a-f-]{36}\.pdf$'),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint pharmacy_document_path_matches_kind check (split_part(storage_path,'/',1) = kind)
);
comment on table public.pharmacy_documents is 'Tài liệu thuốc, hướng dẫn sử dụng và bản tin PDF; dùng chung tài khoản VPMED đã duyệt.';
create index pharmacy_documents_kind_date_idx on public.pharmacy_documents(kind,created_at desc,id desc);
create index pharmacy_documents_created_by_idx on public.pharmacy_documents(created_by);
alter table public.pharmacy_documents enable row level security;
revoke all on public.pharmacy_documents from anon, authenticated;
grant select, insert, delete on public.pharmacy_documents to authenticated;

create policy pharmacy_documents_approved_read on public.pharmacy_documents for select to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.status = 'approved'));
create policy pharmacy_documents_admin_insert on public.pharmacy_documents for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.status = 'approved' and p.role = 'admin')
);
create policy pharmacy_documents_admin_delete on public.pharmacy_documents for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.status = 'approved' and p.role = 'admin'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('pharmacy-pdfs','pharmacy-pdfs',false,20971520,array['application/pdf']);

create policy pharmacy_pdfs_approved_read on storage.objects for select to authenticated
using (bucket_id = 'pharmacy-pdfs'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.status = 'approved'));
create policy pharmacy_pdfs_admin_upload on storage.objects for insert to authenticated
with check (bucket_id = 'pharmacy-pdfs'
  and name ~ '^(drug|guide|bulletin)/[0-9a-f-]{36}\.pdf$'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.status = 'approved' and p.role = 'admin'));
create policy pharmacy_pdfs_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'pharmacy-pdfs'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.status = 'approved' and p.role = 'admin'));
