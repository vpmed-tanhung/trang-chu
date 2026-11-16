-- Keep the helper outside the exposed API schema. Policy dependencies follow its OID.
alter function public.admin_ai_log_visible(bigint) set schema admin_ai;
grant usage on schema admin_ai to authenticated;
do $$ declare t text; begin
 foreach t in array array['settings','jobs','audit','privacy_incidents','sources','feedback','approved_documents'] loop
  execute format('create policy deny_direct_client_access on admin_ai.%I for all to authenticated using (false) with check (false)',t);
 end loop;
end $$;
