-- Công khai 216 PDF thuộc mục Hướng dẫn sử dụng đang có ngày 18/11/2026.
-- Danh sách lưu cả mã tài liệu và đường dẫn hiện tại để tệp thay thế vẫn được duyệt riêng.
begin;

create table public.pharmacy_public_guide_files (
  document_id uuid primary key references public.pharmacy_documents(id) on delete cascade,
  storage_path text not null unique
);

alter table public.pharmacy_public_guide_files enable row level security;
revoke all on public.pharmacy_public_guide_files from public, anon, authenticated;
grant select (document_id, storage_path) on public.pharmacy_public_guide_files to anon;
create policy pharmacy_public_guide_publication_read on public.pharmacy_public_guide_files
  for select to anon using (true);

do $$
declare
  approved_count integer;
begin
  insert into public.pharmacy_public_guide_files (document_id, storage_path)
  select document.id, document.storage_path
  from public.pharmacy_documents as document
  join storage.objects as pdf
    on pdf.bucket_id = 'pharmacy-pdfs' and pdf.name = document.storage_path
  where document.kind = 'guide' and document.category = 'Hướng dẫn sử dụng'
    and document.storage_path like 'guide/%'
    and document.created_at <= timestamptz '2026-09-12 07:47:21.547626+00';
  get diagnostics approved_count = row_count;
  if approved_count <> 216 then
    raise exception 'Cần đúng 216 tệp Hướng dẫn sử dụng, hiện khớp % tệp', approved_count;
  end if;
end;
$$;

create policy pharmacy_documents_public_guide_read on public.pharmacy_documents
  for select to anon using (
    kind = 'guide' and category = 'Hướng dẫn sử dụng'
    and exists (
      select 1 from public.pharmacy_public_guide_files as publication
      where publication.document_id = pharmacy_documents.id
        and publication.storage_path = pharmacy_documents.storage_path
    )
  );

create policy pharmacy_pdfs_public_guide_read on storage.objects
  for select to anon using (
    bucket_id = 'pharmacy-pdfs'
    and exists (
      select 1 from public.pharmacy_documents as document
      where document.storage_path = storage.objects.name
        and document.kind = 'guide' and document.category = 'Hướng dẫn sử dụng'
    )
  );

commit;
