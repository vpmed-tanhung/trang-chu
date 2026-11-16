-- Metadata only: no role can retrieve or submit API keys through this RPC.
create or replace function public.admin_ai_ai_settings(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security invoker set search_path='' as $$ begin
 if p_action<>'get' then raise exception 'AI_ACTIVATION_PENDING'; end if;
 return jsonb_build_object('configured',false,'activation_pending',true);
end $$;
revoke all on function public.admin_ai_ai_settings(text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_ai_ai_settings(text,jsonb) to service_role;
