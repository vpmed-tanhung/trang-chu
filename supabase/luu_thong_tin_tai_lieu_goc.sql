-- Retain the dates and metadata from the legacy pharmacy catalog.
alter table public.pharmacy_documents
  add column if not exists document_date date,
  add column if not exists keywords text,
  add column if not exists week_number smallint,
  add column if not exists author text;
