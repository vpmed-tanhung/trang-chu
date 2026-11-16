-- Admin AI: additive infrastructure. Existing authentication helpers are preserved.
create extension if not exists pg_net;
create extension if not exists pg_cron;
create schema admin_ai;
revoke all on schema admin_ai from public, anon, authenticated, service_role;

create table admin_ai.settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 worker_token_hash text not null,
 project_url text not null default 'https://jaswtdcgrfbygmdxvumu.supabase.co',
 baseline_url text not null default 'https://hotrolamsang.io.vn/data/inpatient_medicines_20260707.json'
);
create table admin_ai.jobs (
 id uuid primary key default gen_random_uuid(), kind text not null,
 status text not null default 'queued' check(status in
 ('queued','running','retry','review_required','blocked','failed','approved','rejected','publishing','awaiting_live','published','publish_failed')),
 created_by uuid references public.profiles(id), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), input jsonb not null default '{}',
 result jsonb, result_sha256 text, source_sha256 text, base_sha256 text,
 attempts int not null default 0, publication_attempts int not null default 0, next_attempt_at timestamptz not null default now(),
 lease uuid, lease_until timestamptz, error_code text, publication jsonb,
 idempotency_key text unique, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz
);
create index admin_ai_ready_jobs on admin_ai.jobs(next_attempt_at,created_at)
 where status in ('queued','retry','running','approved','publishing');
create index admin_ai_recent_jobs on admin_ai.jobs(created_at desc);
create table admin_ai.audit (
 id bigint generated always as identity primary key, actor uuid, action text not null,
 job_id uuid references admin_ai.jobs(id), content_sha256 text,
 details jsonb not null default '{}', created_at timestamptz not null default now()
);
create table admin_ai.privacy_incidents (
 log_id bigint primary key references public.renal_lookup_logs(id) on delete cascade,
 reason_code text not null, state text not null default 'open' check(state in ('open','resolved','false_positive')),
 detected_at timestamptz not null default now(), resolved_by uuid references public.profiles(id), resolved_at timestamptz
);
create table admin_ai.sources (
 id uuid primary key default gen_random_uuid(), url text not null unique,
 label text not null, enabled boolean not null default true, last_sha256 text,
 last_checked_at timestamptz, created_by uuid references public.profiles(id)
);
create table admin_ai.feedback (
 id uuid primary key default gen_random_uuid(), module_id text not null,
 field_name text not null check(field_name in ('drug_name','strength','unit','route','omitted_drug')),
 error_kind text not null check(error_kind in ('changed','added','removed','ambiguous')),
 confirmed boolean not null default false, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table admin_ai.approved_documents (
 job_id uuid primary key references admin_ai.jobs(id), content jsonb not null,
 content_sha256 text not null, approved_by uuid not null references public.profiles(id), approved_at timestamptz not null default now()
);
do $$ declare t text; begin
 foreach t in array array['settings','jobs','audit','privacy_incidents','sources','feedback','approved_documents'] loop
  execute format('alter table admin_ai.%I enable row level security',t);
 end loop;
end $$;
revoke all on all tables in schema admin_ai from public,anon,authenticated,service_role;
revoke all on all sequences in schema admin_ai from public,anon,authenticated,service_role;

do $$ declare k text; begin
 k:=encode(extensions.gen_random_bytes(32),'hex');
 perform vault.create_secret(k,'vpmed_admin_ai_worker','Internal scheduler token; never exposed to clients');
 insert into admin_ai.settings(worker_token_hash) values(encode(sha256(convert_to(k,'UTF8')),'hex'));
end $$;

create function admin_ai.actor_allowed(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=p_id and p.role='admin'
 and p.status='approved' and p.account_type='personal' and lower(p.email) ~ '^[^@[:space:]]+@vpmed[.]vn$');
$$;
revoke all on function admin_ai.actor_allowed(uuid) from public,anon,authenticated,service_role;

-- A narrow service-only API. The Edge Function verifies user JWTs before passing actor IDs.
create function public.admin_ai_backend(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare j admin_ai.jobs%rowtype; u uuid; v jsonb; t timestamptz; e timestamptz:=now(); result jsonb; k text;
begin
 if p_action='validate_worker' then
  return jsonb_build_object('ok',exists(select 1 from admin_ai.settings s
   where s.worker_token_hash=encode(sha256(convert_to(coalesce(p_data->>'token',''),'UTF8')),'hex')));
 elsif p_action='config' then
  return (select jsonb_build_object('enabled',s.enabled,'baseline_url',s.baseline_url) from admin_ai.settings s);
 elsif p_action='actor' then
  return jsonb_build_object('allowed',admin_ai.actor_allowed((p_data->>'actor')::uuid)
   and exists(select 1 from auth.sessions where id=(p_data->>'session_id')::uuid and user_id=(p_data->>'actor')::uuid));
 elsif p_action in ('create_job','list_jobs','job_detail','review','add_source','list_sources','confirm_feedback','resolve_incident') then
  u:=(p_data->>'actor')::uuid;
  if not admin_ai.actor_allowed(u) then raise exception 'ADMIN_REQUIRED'; end if;
  if p_action='create_job' then
   if p_data->>'kind' not in ('catalog','document','privacy','report','ocr') then raise exception 'INVALID_JOB_KIND'; end if;
   insert into admin_ai.jobs(kind,created_by,input,source_sha256,idempotency_key)
    values(p_data->>'kind',u,coalesce(p_data->'input','{}'),p_data->>'source_sha256',p_data->>'idempotency_key')
    on conflict(idempotency_key) do nothing returning * into j;
   if j.id is null then select * into j from admin_ai.jobs where idempotency_key=p_data->>'idempotency_key'; end if;
   insert into admin_ai.audit(actor,action,job_id) values(u,'enqueue',j.id);
   return to_jsonb(j);
  elsif p_action='list_jobs' then
   return coalesce((select jsonb_agg(x) from (select id,kind,status,created_at,updated_at,attempts,error_code,result_sha256,
    reviewed_at,publication, result->'summary' as summary from admin_ai.jobs order by created_at desc limit 80) x),'[]');
  elsif p_action='job_detail' then
   select * into strict j from admin_ai.jobs where id=(p_data->>'job_id')::uuid;
   return to_jsonb(j);
  elsif p_action='review' then
   if coalesce(p_data->>'aal','')<>'aal2' then raise exception 'MFA_REQUIRED'; end if;
   if not exists(select 1 from auth.sessions where id=(p_data->>'session_id')::uuid and user_id=u) then raise exception 'ACTIVE_SESSION_REQUIRED'; end if;
   select * into strict j from admin_ai.jobs where id=(p_data->>'job_id')::uuid for update;
   if j.status<>'review_required' then raise exception 'NOT_READY_FOR_REVIEW'; end if;
   if j.result_sha256 is distinct from p_data->>'expected_sha256' then raise exception 'CONTENT_CHANGED_REVIEW_AGAIN'; end if;
   if p_data->>'decision' not in ('approve','reject') then raise exception 'INVALID_DECISION'; end if;
   if p_data->>'decision'='approve' and j.kind='document' and coalesce((p_data->>'source_checked')::boolean,false)=false then
    raise exception 'SOURCE_CHECK_REQUIRED';
   end if;
   update admin_ai.jobs set status=case when p_data->>'decision'='approve' then 'approved' else 'rejected' end,
    reviewed_by=u,reviewed_at=now(),updated_at=now() where id=j.id;
   if p_data->>'decision'='approve' and j.kind in ('document','report','ocr') then
    insert into admin_ai.approved_documents(job_id,content,content_sha256,approved_by)
     values(j.id,j.result,j.result_sha256,u) on conflict(job_id) do nothing;
   end if;
   insert into admin_ai.audit(actor,action,job_id,content_sha256,details)
    values(u,p_data->>'decision',j.id,j.result_sha256,jsonb_build_object('source_checked',p_data->'source_checked'));
   return jsonb_build_object('ok',true);
  elsif p_action='list_sources' then
   return coalesce((select jsonb_agg(to_jsonb(s)) from admin_ai.sources s),'[]');
  elsif p_action='add_source' then
   insert into admin_ai.sources(url,label,created_by) values(p_data->>'url',left(p_data->>'label',200),u)
    on conflict(url) do update set enabled=true;
   return jsonb_build_object('ok',true);
  elsif p_action='confirm_feedback' then
   update admin_ai.feedback set confirmed=true where id=(p_data->>'feedback_id')::uuid;
   return jsonb_build_object('ok',true);
  elsif p_action='resolve_incident' then
   if coalesce(p_data->>'aal','')<>'aal2' then raise exception 'MFA_REQUIRED'; end if;
   update admin_ai.privacy_incidents set state='false_positive',resolved_by=u,resolved_at=now()
    where log_id=(p_data->>'log_id')::bigint;
   insert into admin_ai.audit(actor,action,details) values(u,'release_privacy_hold',jsonb_build_object('log_id',p_data->>'log_id'));
   return jsonb_build_object('ok',true);
  end if;
 elsif p_action='feedback' then
  u:=(p_data->>'actor')::uuid;
  if not exists(select 1 from public.profiles where id=u and status='approved') then raise exception 'APPROVED_USER_REQUIRED'; end if;
  if p_data->>'module_id' not in ('prescription','inpatient') then raise exception 'INVALID_MODULE'; end if;
  insert into admin_ai.feedback(module_id,field_name,error_kind,created_by)
   values(p_data->>'module_id',p_data->>'field_name',p_data->>'error_kind',u);
  return jsonb_build_object('ok',true);
 elsif p_action='claim' then
  select * into j from admin_ai.jobs where
   ((status in ('queued','retry') and next_attempt_at<=now()) or (status='running' and lease_until<now()))
   and attempts<3 order by created_at for update skip locked limit 1;
  if j.id is null then return null; end if;
  update admin_ai.jobs set status='running',attempts=attempts+1,lease=gen_random_uuid(),
   lease_until=now()+interval '4 minutes',updated_at=now() where id=j.id returning * into j;
  return to_jsonb(j);
 elsif p_action='finish' then
  select * into strict j from admin_ai.jobs where id=(p_data->>'job_id')::uuid for update;
  if j.status<>'running' or j.lease is distinct from (p_data->>'lease')::uuid then raise exception 'STALE_LEASE'; end if;
  v:=p_data->'result';
  update admin_ai.jobs set result=v,result_sha256=encode(sha256(convert_to(v::text,'UTF8')),'hex'),
   base_sha256=p_data->>'base_sha256',status=case when coalesce((p_data->>'blocked')::boolean,false) then 'blocked' else 'review_required' end,
   lease=null,lease_until=null,error_code=null,updated_at=now() where id=j.id;
  return jsonb_build_object('ok',true);
 elsif p_action='fail' then
  update admin_ai.jobs set status=case when attempts>=3 then 'failed' else 'retry' end,
   next_attempt_at=now()+make_interval(secs=>60*greatest(attempts,1)),
   error_code=left(coalesce(p_data->>'error_code','WORKER_ERROR'),80),lease=null,lease_until=null,updated_at=now()
   where id=(p_data->>'job_id')::uuid and lease=(p_data->>'lease')::uuid;
  return jsonb_build_object('ok',true);
 elsif p_action='scan_privacy' then
  insert into admin_ai.privacy_incidents(log_id,reason_code)
   select id,case when upper(trim(patient_code)) in ('','KHONG_CO_MA','.') then 'HIS_MISSING_OR_PLACEHOLDER' else 'HIS_FORMAT_REQUIRES_REVIEW' end
   from public.renal_lookup_logs where patient_code !~ '^[0-9]{1,30}$' on conflict(log_id) do nothing;
  return jsonb_build_object('incidents',coalesce((select jsonb_agg(jsonb_build_object('log_id',log_id,'reason_code',reason_code,'state',state))
   from admin_ai.privacy_incidents where state='open'),'[]'), 'checked_rows',(select count(*) from public.renal_lookup_logs),
   'registry_verification','not_connected','free_text_sent_to_ai',false);
 elsif p_action='report_data' then
  if p_data->>'period'='previous_month' then
   e:=date_trunc('month',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
   t:=(date_trunc('month',now() at time zone 'Asia/Ho_Chi_Minh')-interval '1 month') at time zone 'Asia/Ho_Chi_Minh';
  elsif p_data->>'period'='previous_week' then
   e:=date_trunc('week',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
   t:=(date_trunc('week',now() at time zone 'Asia/Ho_Chi_Minh')-interval '1 week') at time zone 'Asia/Ho_Chi_Minh';
  else t:=now()-interval '7 days'; end if;
  return jsonb_build_object('start',t,'end',e,'timezone','Asia/Ho_Chi_Minh',
   'by_department',coalesce((select jsonb_agg(x) from (select department,lookup_type,count(*) as log_rows
    from public.renal_lookup_logs where created_at>=t and created_at<e group by department,lookup_type) x),'[]'),
   'by_drug',coalesce((select jsonb_agg(x) from (select drug_name,count(*) as log_rows
    from public.renal_lookup_logs where created_at>=t and created_at<e group by drug_name) x),'[]'),
   'coverage',jsonb_build_object('renal_lookup_logs',true,'interaction_events',false,'all_modules',false));
 elsif p_action='ocr_data' then
  return jsonb_build_object('counts',coalesce((select jsonb_agg(x) from (select module_id,field_name,error_kind,count(*) as count
   from admin_ai.feedback where confirmed group by module_id,field_name,error_kind) x),'[]'),
   'unconfirmed',coalesce((select jsonb_agg(to_jsonb(x)) from (select id,module_id,field_name,error_kind,created_at
   from admin_ai.feedback where not confirmed order by created_at desc limit 100) x),'[]'));
 elsif p_action='source_list' then
  return coalesce((select jsonb_agg(to_jsonb(s)) from admin_ai.sources s where enabled),'[]');
 elsif p_action='source_update' then
  update admin_ai.sources set last_sha256=p_data->>'sha256',last_checked_at=now() where id=(p_data->>'source_id')::uuid;
  return jsonb_build_object('ok',true);
 elsif p_action='publisher_claim' then
  select * into j from admin_ai.jobs where kind='catalog' and
   (status='approved' or (status='publishing' and lease_until<now())) and publication_attempts<3 order by reviewed_at for update skip locked limit 1;
  if j.id is null then return null; end if;
  if not admin_ai.actor_allowed(j.reviewed_by) then raise exception 'REVIEWER_NO_LONGER_AUTHORIZED'; end if;
  update admin_ai.jobs set status='publishing',publication_attempts=publication_attempts+1,lease=gen_random_uuid(),lease_until=now()+interval '20 minutes',updated_at=now()
    where id=j.id returning * into j;
  return jsonb_build_object('job_id',j.id,'lease',j.lease,'candidate_sha256',j.result_sha256,
   'base_sha256',j.base_sha256,'candidate',j.result->'candidate','reviewed_at',j.reviewed_at);
 elsif p_action='publisher_result' then
  select * into strict j from admin_ai.jobs where id=(p_data->>'job_id')::uuid for update;
  if j.status<>'publishing' or j.lease is distinct from (p_data->>'lease')::uuid then raise exception 'STALE_PUBLICATION'; end if;
  if coalesce((p_data->>'ok')::boolean,false) then
   update admin_ai.jobs set status='awaiting_live',publication=p_data-'lease',lease=null,lease_until=null,updated_at=now() where id=j.id;
  else
   update admin_ai.jobs set status='publish_failed',error_code=left(p_data->>'error_code',80),publication=p_data-'lease',updated_at=now() where id=j.id;
  end if;
  return jsonb_build_object('ok',true);
 elsif p_action='awaiting_live' then
  return coalesce((select jsonb_agg(jsonb_build_object('id',id,'publication',publication)) from admin_ai.jobs where status='awaiting_live'),'[]');
 elsif p_action='mark_live' then
  update admin_ai.jobs set status='published',updated_at=now(),publication=publication||jsonb_build_object('site_verified_at',now())
   where id=(p_data->>'job_id')::uuid and status='awaiting_live';
  return jsonb_build_object('ok',true);
 else raise exception 'UNKNOWN_ACTION';
 end if;
 raise exception 'UNHANDLED_ACTION';
end;
$$;
revoke all on function public.admin_ai_backend(text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_ai_backend(text,jsonb) to service_role;

create function public.admin_ai_system_enqueue(p_kind text,p_key text,p_input jsonb default '{}') returns uuid
language plpgsql security definer set search_path='' as $$ declare j uuid; begin
 if p_kind not in ('catalog','document','privacy','report','ocr','source_watch','system_probe') then raise exception 'INVALID_KIND'; end if;
 insert into admin_ai.jobs(kind,idempotency_key,input) values(p_kind,p_key,p_input)
  on conflict(idempotency_key) do nothing returning id into j;
 return j;
end $$;
revoke all on function public.admin_ai_system_enqueue(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_ai_system_enqueue(text,text,jsonb) to service_role;

create function admin_ai.tick() returns void language plpgsql security definer set search_path='' as $$
declare k text; z timestamp; begin
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
  perform net.http_post(url:='https://jaswtdcgrfbygmdxvumu.supabase.co/functions/v1/admin-ai/tick',
    headers:=jsonb_build_object('Content-Type','application/json','x-admin-ai-worker',k),body:='{}',timeout_milliseconds:=120000);
 end if;
end $$;
revoke all on function admin_ai.tick() from public,anon,authenticated,service_role;
select cron.schedule('vpmed-admin-ai-worker','* * * * *','select admin_ai.tick()');

insert into storage.buckets(id,name,public,file_size_limit) values('admin-ai-inputs','admin-ai-inputs',false,5242880);

-- Hide a held row from shared history immediately; approved personal admins can review it.
create function public.admin_ai_log_visible(p_log_id bigint) returns boolean
language sql stable security definer set search_path='' as $$
 select admin_ai.actor_allowed((select auth.uid())) or
 not exists(select 1 from admin_ai.privacy_incidents i where i.log_id=p_log_id and i.state='open');
$$;
revoke all on function public.admin_ai_log_visible(bigint) from public,anon,service_role;
grant execute on function public.admin_ai_log_visible(bigint) to authenticated;
create policy "admin ai privacy holds restrict shared history" on public.renal_lookup_logs
 as restrictive for select to authenticated using (public.admin_ai_log_visible(id));

create function admin_ai.flag_patient_code() returns trigger
language plpgsql security definer set search_path='' as $$ begin
 if new.patient_code !~ '^[0-9]{1,30}$' then
  insert into admin_ai.privacy_incidents(log_id,reason_code)
   values(new.id,case when upper(trim(new.patient_code)) in ('','KHONG_CO_MA','.')
    then 'HIS_MISSING_OR_PLACEHOLDER' else 'HIS_FORMAT_REQUIRES_REVIEW' end)
   on conflict(log_id) do update set state='open',detected_at=now(),resolved_by=null,resolved_at=null;
 elsif tg_op='UPDATE' then
  update admin_ai.privacy_incidents set state='resolved',resolved_at=now() where log_id=new.id and state='open';
 end if;
 return new;
end $$;
revoke all on function admin_ai.flag_patient_code() from public,anon,authenticated,service_role;
create trigger admin_ai_flag_patient_code after insert or update of patient_code on public.renal_lookup_logs
 for each row execute function admin_ai.flag_patient_code();
select public.admin_ai_backend('scan_privacy');
create index admin_ai_jobs_created_by_idx on admin_ai.jobs(created_by);
create index admin_ai_jobs_reviewed_by_idx on admin_ai.jobs(reviewed_by);
create index admin_ai_audit_job_id_idx on admin_ai.audit(job_id);
create index admin_ai_incident_resolver_idx on admin_ai.privacy_incidents(resolved_by);
create index admin_ai_sources_creator_idx on admin_ai.sources(created_by);
create index admin_ai_feedback_creator_idx on admin_ai.feedback(created_by);
create index admin_ai_documents_approver_idx on admin_ai.approved_documents(approved_by);
