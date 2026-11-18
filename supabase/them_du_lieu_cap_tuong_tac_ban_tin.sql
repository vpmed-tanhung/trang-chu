-- Dữ liệu tra cứu dạng thẻ thuộc cùng bản tin và chính sách RLS của bản tin.
alter table public.pharmacy_documents
  add column if not exists interaction_pairs jsonb;

comment on column public.pharmacy_documents.interaction_pairs is
  'Danh sách cặp tương tác đã đối chiếu, chỉ đọc qua quyền xem bản tin hiện hành.';
