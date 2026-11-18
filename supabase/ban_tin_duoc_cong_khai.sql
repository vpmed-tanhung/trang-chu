-- Công khai đúng 18 PDF Bản tin Dược đã được xác nhận ngày 18/11/2026.
-- Lưu đường dẫn tại thời điểm xuất bản để tệp thay thế cần xác nhận lại.
begin;

create table public.pharmacy_public_bulletin_files (
  document_id uuid primary key references public.pharmacy_documents(id) on delete cascade,
  storage_path text not null unique
);

alter table public.pharmacy_public_bulletin_files enable row level security;
revoke all on public.pharmacy_public_bulletin_files from public, anon, authenticated;
grant select (document_id, storage_path) on public.pharmacy_public_bulletin_files to anon;
create policy pharmacy_bulletin_publication_read on public.pharmacy_public_bulletin_files
  for select to anon using (true);

do $$
declare
  approved_count integer;
begin
  insert into public.pharmacy_public_bulletin_files (document_id, storage_path)
  select document.id, document.storage_path
  from public.pharmacy_documents as document
  join storage.objects as pdf
    on pdf.bucket_id = 'pharmacy-pdfs' and pdf.name = document.storage_path
  where document.kind = 'bulletin' and document.category = 'Bản tin Dược'
    and document.created_at <= timestamptz '2026-09-12 04:32:22.85362+00';
  get diagnostics approved_count = row_count;
  if approved_count <> 18 then
    raise exception 'Cần đúng 18 bản tin đã xác nhận, hiện khớp % bản', approved_count;
  end if;
end;
$$;

grant select (id, kind, title, summary, category, file_size, storage_path, created_at, document_date)
  on public.pharmacy_documents to anon;

create policy pharmacy_documents_public_bulletin_read on public.pharmacy_documents
  for select to anon using (
    kind = 'bulletin' and category = 'Bản tin Dược'
    and exists (
      select 1 from public.pharmacy_public_bulletin_files as publication
      where publication.document_id = pharmacy_documents.id
        and publication.storage_path = pharmacy_documents.storage_path
    )
  );

create policy pharmacy_pdfs_public_bulletin_read on storage.objects
  for select to anon using (
    bucket_id = 'pharmacy-pdfs'
    and exists (
      select 1 from public.pharmacy_documents as document
      where document.storage_path = storage.objects.name
        and document.kind = 'bulletin' and document.category = 'Bản tin Dược'
    )
  );

commit;
