create or replace function admin_ai.tick() returns void language plpgsql security definer set search_path='' as $$
declare k text; gateway_key text; z timestamp; begin
 if not exists(select 1 from admin_ai.settings where enabled) then return; end if;
 update admin_ai.jobs set status='failed',error_code='WORKER_LEASE_EXPIRED',updated_at=now()
  where status='running' and lease_until<now() and attempts>=3;
 update admin_ai.jobs set status='publish_failed',error_code='PUBLISHER_LEASE_EXPIRED',updated_at=now()
  where status='publishing' and lease_until<now() and publication_attempts>=3;
 z:=now() at time zone 'Asia/Ho_Chi_Minh';
 insert into admin_ai.jobs(kind,idempotency_key,input)
 values('privacy','privacy-'||to_char(z,'YYYY-MM-DD-HH'),'{}') on conflict(idempotency_key) do nothing;
 if extract(isodow from z)=1 and extract(hour from z)>=7 then
  insert into admin_ai.jobs(kind,idempotency_key,input)
  values('report','weekly-'||to_char(z,'IYYY-IW'),jsonb_build_object('period','previous_week')) on conflict(idempotency_key) do nothing;
 end if;
 if extract(day from z)=1 and extract(hour from z)>=7 then
  insert into admin_ai.jobs(kind,idempotency_key,input)
  values('report','monthly-'||to_char(z,'YYYY-MM'),jsonb_build_object('period','previous_month')) on conflict(idempotency_key) do nothing;
 end if;
 if extract(isodow from z)=1 and extract(hour from z)>=8 then
  insert into admin_ai.jobs(kind,idempotency_key) values('ocr','ocr-'||to_char(z,'IYYY-IW')) on conflict(idempotency_key) do nothing;
 end if;
 if exists(select 1 from admin_ai.sources where enabled) and extract(hour from z)>=6 then
  insert into admin_ai.jobs(kind,idempotency_key) values('source_watch','sources-'||to_char(z,'YYYY-MM-DD')) on conflict(idempotency_key) do nothing;
 end if;
 if exists(select 1 from admin_ai.jobs where
    (status in ('queued','retry') and next_attempt_at<=now() and attempts<3)
    or (status='running' and lease_until<now() and attempts<3) or status='awaiting_live') then
  select decrypted_secret into strict k from vault.decrypted_secrets where name='vpmed_admin_ai_worker';
  select decrypted_secret into strict gateway_key from vault.decrypted_secrets where name='vpmed_admin_ai_gateway_anon';
  perform net.http_post(url:='https://jaswtdcgrfbygmdxvumu.supabase.co/functions/v1/admin-ai/tick',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||gateway_key,'x-admin-ai-worker',k),body:='{}',timeout_milliseconds:=120000);
 end if;
end $$;

