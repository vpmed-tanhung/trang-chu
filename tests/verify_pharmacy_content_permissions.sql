begin;
create temp table pharmacy_permission_subjects on commit drop as
  select id,email,role from public.profiles where status='approved';
grant select on pharmacy_permission_subjects to authenticated;
select set_config('request.jwt.claim.sub',(select id::text from pharmacy_permission_subjects where email='khoaduoc@vpmed.vn'),true);
set local role authenticated;
do $$ begin
 if not public.can_edit_pharmacy_content() then raise exception 'Pharmacy department account lacks editor permission'; end if;
end $$;
insert into public.pharmacy_documents(id,kind,title,category,file_name,file_size,storage_path)
select id,'drug','__permission_test_20261117__','Thông tin thuốc','test.pdf',100,'drug/'||id::text||'.pdf'
from (select gen_random_uuid() id) q;
do $$ declare r integer; begin
 select revision into r from public.pharmacy_site_content where id='homepage';
 update public.pharmacy_site_content set content='{"heroTitle":"__permission_test__"}'::jsonb where id='homepage' and revision=r;
 if not found then raise exception 'Editor homepage update failed'; end if;
 if (select revision from public.pharmacy_site_content where id='homepage')<>r+1 then raise exception 'Homepage revision did not advance'; end if;
 update public.pharmacy_site_content set content='{}'::jsonb where id='homepage' and revision=r;
 if found then raise exception 'Stale homepage revision unexpectedly accepted'; end if;
 update public.pharmacy_documents set title='__permission_test_edited__' where title='__permission_test_20261117__' and revision=1;
 if not found then raise exception 'Editor PDF metadata update failed'; end if;
 if (select revision from public.pharmacy_documents where title='__permission_test_edited__')<>2 then raise exception 'Document revision did not advance'; end if;
end $$;
reset role;
do $test$
declare subject record; affected integer;
begin
 for subject in select id,email,role from pharmacy_permission_subjects where email<>'khoaduoc@vpmed.vn' and role<>'admin' loop
   perform set_config('request.jwt.claim.sub',subject.id::text,true);
   -- Even a forged email claim cannot replace the canonical Auth email check.
   perform set_config('request.jwt.claims',jsonb_build_object('sub',subject.id,'email','khoaduoc@vpmed.vn','role','authenticated')::text,true);
   execute 'set local role authenticated';
   if public.can_edit_pharmacy_content() then raise exception 'Non-pharmacy editor permission granted'; end if;
   if (select count(*) from public.pharmacy_documents where title='__permission_test_edited__')<>1 then raise exception 'Approved viewer cannot read PDFs'; end if;
   update public.pharmacy_documents set title='__unauthorized__' where title='__permission_test_edited__';
   get diagnostics affected=row_count;
   if affected<>0 then raise exception 'Viewer modified PDF metadata'; end if;
   update public.pharmacy_site_content set content='{"heroTitle":"__unauthorized__"}'::jsonb where id='homepage';
   get diagnostics affected=row_count;
   if affected<>0 then raise exception 'Viewer modified homepage'; end if;
   delete from public.pharmacy_documents where title='__permission_test_edited__';
   get diagnostics affected=row_count;
   if affected<>0 then raise exception 'Viewer deleted a PDF'; end if;
   begin
     insert into public.pharmacy_documents(kind,title,category,file_name,file_size,storage_path)
     values('drug','__unauthorized__','Thông tin thuốc','test.pdf',100,'drug/'||gen_random_uuid()::text||'.pdf');
     raise exception 'Viewer inserted a PDF';
   exception when insufficient_privilege then null;
   end;
   execute 'reset role';
 end loop;
end;
$test$;
select set_config('request.jwt.claim.sub',(select id::text from pharmacy_permission_subjects where role='admin' limit 1),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from pharmacy_permission_subjects where role='admin' limit 1),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if not public.can_edit_pharmacy_content() then raise exception 'Personal administrator lost editor access'; end if;
 update public.pharmacy_documents set summary='__admin_verified__' where title='__permission_test_edited__';
 if not found then raise exception 'Administrator cannot edit document metadata'; end if;
 update public.pharmacy_site_content set content='{}'::jsonb where id='homepage';
 if not found then raise exception 'Administrator cannot edit homepage'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from pharmacy_permission_subjects where email='khoaduoc@vpmed.vn'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from pharmacy_permission_subjects where email='khoaduoc@vpmed.vn'),'role','authenticated')::text,true);
set local role authenticated;
delete from public.pharmacy_documents where title='__permission_test_edited__';
do $$ begin
 if exists(select 1 from public.pharmacy_documents where title='__permission_test_edited__') then raise exception 'Editor delete failed'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.pharmacy_site_content; raise exception 'Anonymous homepage access granted';
 exception when insufficient_privilege then null; end;
 begin perform public.can_edit_pharmacy_content(); raise exception 'Anonymous permission RPC access granted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: exact verified pharmacy email can publish/edit/delete; other department accounts can only read content; personal admin retains editor permission; forged email claims denied; revision conflict guarded; all test writes rolled back.' as verification;
