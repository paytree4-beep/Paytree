\set ON_ERROR_STOP on
create schema tst;
create table tst.results (name text, expected text, actual text, pass boolean);
create function tst.t(name text, rolename text, sub uuid, sql text, expected text) returns void language plpgsql as $$
declare v text; begin
  perform set_config('request.jwt.claim.sub', coalesce(sub::text,''), true);
  execute format('set local role %I', rolename);
  begin execute sql into v; exception when others then v := 'error'; end;
  execute 'reset role';
  insert into tst.results values (name, expected, v, v is not distinct from expected);
end $$;

insert into auth.users (id,email) values ('aaaaaaaa-0000-0000-0000-000000000001','a@x.test'),('bbbbbbbb-0000-0000-0000-000000000002','b@x.test');
insert into public.profiles (id,username,display_name) values
 ('aaaaaaaa-0000-0000-0000-000000000001','alice','Alice Studio'),
 ('bbbbbbbb-0000-0000-0000-000000000002','bob','Bob Studio');
update public.profiles set is_published=false where username='bob';
insert into public.payment_methods (profile_id,method_id,position,is_visible,public_config) values
 ('aaaaaaaa-0000-0000-0000-000000000001','cashapp',0,true,'{"handle":"alice"}'),
 ('aaaaaaaa-0000-0000-0000-000000000001','venmo',1,false,'{"handle":"alice-v"}'),
 ('bbbbbbbb-0000-0000-0000-000000000002','cashapp',0,true,'{"handle":"bob"}');
insert into public.payment_methods (id,profile_id,method_id,has_secret) values ('cccccccc-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','ach',true);
insert into public.payment_method_secrets (payment_method_id,ciphertext) values ('cccccccc-0000-0000-0000-000000000003','v1:ciphertext');
insert into public.subscriptions (user_id,provider,plan,status,current_period_end) values ('aaaaaaaa-0000-0000-0000-000000000001','test','annual','active', now()+interval '30 days');
insert into public.analytics_events (profile_id,action,method_id,device) values ('aaaaaaaa-0000-0000-0000-000000000001','view',null,'mobile'),('bbbbbbbb-0000-0000-0000-000000000002','view',null,'desktop');

-- ANON (signed-out visitor)
select tst.t('anon sees published profiles only','anon',null,'select count(*) from public.profiles','1');
select tst.t('anon sees visible methods of published profiles only','anon',null,'select count(*) from public.payment_methods','2'); -- alice cashapp + ach; venmo hidden; bob unpublished
select tst.t('anon cannot read secrets','anon',null,'select count(*) from public.payment_method_secrets','error');
select tst.t('anon cannot read subscriptions','anon',null,'select count(*) from public.subscriptions','error');
select tst.t('anon cannot read analytics','anon',null,'select count(*) from public.analytics_events','error');
select tst.t('anon cannot read billing_events','anon',null,'select count(*) from public.billing_events','error');
select tst.t('anon cannot read reserved list','anon',null,'select count(*) from public.reserved_usernames','error');
select tst.t('anon cannot insert profile','anon',null,$q$with x as (insert into public.profiles (id,username,display_name) values (gen_random_uuid(),'hacker','Hacker') returning 1) select count(*) from x$q$,'error');
select tst.t('anon cannot insert analytics directly','anon',null,$q$with x as (insert into public.analytics_events (profile_id,action,device) values ('aaaaaaaa-0000-0000-0000-000000000001','view','mobile') returning 1) select count(*) from x$q$,'error');

-- ALICE (signed in)
select tst.t('alice reads own + published profiles','authenticated','aaaaaaaa-0000-0000-0000-000000000001','select count(*) from public.profiles','1');
select tst.t('alice sees all her own methods incl hidden','authenticated','aaaaaaaa-0000-0000-0000-000000000001','select count(*) from public.payment_methods','3');
select tst.t('alice cannot read secrets even her own','authenticated','aaaaaaaa-0000-0000-0000-000000000001','select count(*) from public.payment_method_secrets','error');
select tst.t('alice updates own bio','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (update public.profiles set bio='Hi' where id='aaaaaaaa-0000-0000-0000-000000000001' returning 1) select count(*) from x$q$,'1');
select tst.t('alice cannot update bob (0 rows)','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (update public.profiles set display_name='Pwned' where id='bbbbbbbb-0000-0000-0000-000000000002' returning 1) select count(*) from x$q$,'0');
select tst.t('alice cannot change profile id','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (update public.profiles set id=gen_random_uuid() where id='aaaaaaaa-0000-0000-0000-000000000001' returning 1) select count(*) from x$q$,'error');
select tst.t('alice cannot create profile for bob id','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (insert into public.profiles (id,username,display_name) values ('bbbbbbbb-0000-0000-0000-000000000002','bob2','Bob Two') returning 1) select count(*) from x$q$,'error');
select tst.t('alice cannot add method to bob','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (insert into public.payment_methods (profile_id,method_id) values ('bbbbbbbb-0000-0000-0000-000000000002','wise') returning 1) select count(*) from x$q$,'error');
select tst.t('alice adds own method','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (insert into public.payment_methods (profile_id,method_id,public_config) values ('aaaaaaaa-0000-0000-0000-000000000001','wise','{"handle":"alice"}') returning 1) select count(*) from x$q$,'1');
select tst.t('alice cannot store account number in public_config','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (insert into public.payment_methods (profile_id,method_id,public_config) values ('aaaaaaaa-0000-0000-0000-000000000001','chime','{"account":"123456789"}') returning 1) select count(*) from x$q$,'error');
select tst.t('unknown method id rejected','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (insert into public.payment_methods (profile_id,method_id) values ('aaaaaaaa-0000-0000-0000-000000000001','bitcoin') returning 1) select count(*) from x$q$,'error');
select tst.t('duplicate method rejected','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (insert into public.payment_methods (profile_id,method_id) values ('aaaaaaaa-0000-0000-0000-000000000001','cashapp') returning 1) select count(*) from x$q$,'error');
select tst.t('alice cannot move method to another profile','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (update public.payment_methods set profile_id='bbbbbbbb-0000-0000-0000-000000000002' where method_id='venmo' returning 1) select count(*) from x$q$,'error');
select tst.t('alice reads own subscription','authenticated','aaaaaaaa-0000-0000-0000-000000000001','select count(*) from public.subscriptions','1');
select tst.t('alice cannot write subscription','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (update public.subscriptions set status='active' returning 1) select count(*) from x$q$,'error');
select tst.t('alice reads only own analytics','authenticated','aaaaaaaa-0000-0000-0000-000000000001','select count(*) from public.analytics_events','1');
select tst.t('alice cannot write analytics','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$with x as (insert into public.analytics_events (profile_id,action,device) values ('aaaaaaaa-0000-0000-0000-000000000001','view','mobile') returning 1) select count(*) from x$q$,'error');
select tst.t('alice cannot run purge','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$select public.purge_analytics_older_than(interval '1 day')::text$q$,'error');
select tst.t('alice cannot call has_active_subscription','authenticated','aaaaaaaa-0000-0000-0000-000000000001',$q$select public.has_active_subscription('aaaaaaaa-0000-0000-0000-000000000001')::text$q$,'error');

-- USERNAME RULES (user carol has no profile yet)
insert into auth.users (id,email) values ('dddddddd-0000-0000-0000-000000000004','c@x.test');
select tst.t('reserved username rejected','authenticated','dddddddd-0000-0000-0000-000000000004',$q$with x as (insert into public.profiles (id,username,display_name) values ('dddddddd-0000-0000-0000-000000000004','admin','Carol') returning 1) select count(*) from x$q$,'error');
select tst.t('reserved username rejected (new route name: auth)','authenticated','dddddddd-0000-0000-0000-000000000004',$q$with x as (insert into public.profiles (id,username,display_name) values ('dddddddd-0000-0000-0000-000000000004','auth','Carol') returning 1) select count(*) from x$q$,'error');
select tst.t('uppercase username rejected','authenticated','dddddddd-0000-0000-0000-000000000004',$q$with x as (insert into public.profiles (id,username,display_name) values ('dddddddd-0000-0000-0000-000000000004','Carol','Carol') returning 1) select count(*) from x$q$,'error');
select tst.t('too-short username rejected','authenticated','dddddddd-0000-0000-0000-000000000004',$q$with x as (insert into public.profiles (id,username,display_name) values ('dddddddd-0000-0000-0000-000000000004','ab','Carol') returning 1) select count(*) from x$q$,'error');
select tst.t('username with slash rejected','authenticated','dddddddd-0000-0000-0000-000000000004',$q$with x as (insert into public.profiles (id,username,display_name) values ('dddddddd-0000-0000-0000-000000000004','a/b/c','Carol') returning 1) select count(*) from x$q$,'error');
select tst.t('duplicate username rejected','authenticated','dddddddd-0000-0000-0000-000000000004',$q$with x as (insert into public.profiles (id,username,display_name) values ('dddddddd-0000-0000-0000-000000000004','alice','Carol') returning 1) select count(*) from x$q$,'error');
select tst.t('bio over 140 chars rejected','authenticated','dddddddd-0000-0000-0000-000000000004',$q$with x as (insert into public.profiles (id,username,display_name,bio) values ('dddddddd-0000-0000-0000-000000000004','carol','Carol',repeat('x',141)) returning 1) select count(*) from x$q$,'error');
select tst.t('valid profile accepted','authenticated','dddddddd-0000-0000-0000-000000000004',$q$with x as (insert into public.profiles (id,username,display_name) values ('dddddddd-0000-0000-0000-000000000004','carol.studio','Carol') returning 1) select count(*) from x$q$,'1');
select tst.t('cannot rename into a reserved name','authenticated','dddddddd-0000-0000-0000-000000000004',$q$with x as (update public.profiles set username='settings' where id='dddddddd-0000-0000-0000-000000000004' returning 1) select count(*) from x$q$,'error');

-- ANALYTICS CONSTRAINTS (service role is the only writer)
select tst.t('service writes a view','service_role',null,$q$with x as (insert into public.analytics_events (profile_id,action,device,country) values ('aaaaaaaa-0000-0000-0000-000000000001','view','mobile','US') returning 1) select count(*) from x$q$,'1');
select tst.t('service writes a copy with method','service_role',null,$q$with x as (insert into public.analytics_events (profile_id,action,method_id,device) values ('aaaaaaaa-0000-0000-0000-000000000001','copy','zelle','desktop') returning 1) select count(*) from x$q$,'1');
select tst.t('view with a method rejected','service_role',null,$q$with x as (insert into public.analytics_events (profile_id,action,method_id,device) values ('aaaaaaaa-0000-0000-0000-000000000001','view','zelle','desktop') returning 1) select count(*) from x$q$,'error');
select tst.t('open without method rejected','service_role',null,$q$with x as (insert into public.analytics_events (profile_id,action,device) values ('aaaaaaaa-0000-0000-0000-000000000001','open','desktop') returning 1) select count(*) from x$q$,'error');
select tst.t('bad device rejected','service_role',null,$q$with x as (insert into public.analytics_events (profile_id,action,device) values ('aaaaaaaa-0000-0000-0000-000000000001','view','Mozilla/5.0') returning 1) select count(*) from x$q$,'error');
select tst.t('bad country rejected','service_role',null,$q$with x as (insert into public.analytics_events (profile_id,action,device,country) values ('aaaaaaaa-0000-0000-0000-000000000001','view','mobile','usa') returning 1) select count(*) from x$q$,'error');

-- SERVICE-ROLE-ONLY TABLES
select tst.t('service reads secrets','service_role',null,'select count(*) from public.payment_method_secrets','1');
select tst.t('service writes billing event','service_role',null,$q$with x as (insert into public.billing_events (provider,event_id,event_type) values ('test','evt_1','subscription.created') returning 1) select count(*) from x$q$,'1');
select tst.t('duplicate webhook event rejected (idempotency)','service_role',null,$q$with x as (insert into public.billing_events (provider,event_id,event_type) values ('test','evt_1','subscription.created') returning 1) select count(*) from x$q$,'error');
select tst.t('active subscription grants access','service_role',null,$q$select public.has_active_subscription('aaaaaaaa-0000-0000-0000-000000000001')::text$q$,'true');
select tst.t('no subscription means no access','service_role',null,$q$select public.has_active_subscription('bbbbbbbb-0000-0000-0000-000000000002')::text$q$,'false');

-- ACCESS RULES FOR SUBSCRIPTION STATES
update public.subscriptions set status='canceled', current_period_end = now()+interval '5 days';
select tst.t('canceled but paid period remains = access','service_role',null,$q$select public.has_active_subscription('aaaaaaaa-0000-0000-0000-000000000001')::text$q$,'true');
update public.subscriptions set status='canceled', current_period_end = now()-interval '1 day';
select tst.t('canceled and period ended = no access','service_role',null,$q$select public.has_active_subscription('aaaaaaaa-0000-0000-0000-000000000001')::text$q$,'false');
update public.subscriptions set status='past_due', current_period_end = now()+interval '2 days';
select tst.t('past_due within paid period = access','service_role',null,$q$select public.has_active_subscription('aaaaaaaa-0000-0000-0000-000000000001')::text$q$,'true');

-- RETENTION
insert into public.analytics_events (profile_id,action,device,occurred_at) values ('aaaaaaaa-0000-0000-0000-000000000001','view','mobile', now()-interval '500 days');
select tst.t('purge removes only events older than the period','service_role',null,$q$select public.purge_analytics_older_than(interval '400 days')::text$q$,'1');
select tst.t('purge refuses a zero retention','service_role',null,$q$select public.purge_analytics_older_than(interval '0')::text$q$,'error');

-- DELETING AN ACCOUNT REMOVES EVERYTHING
delete from auth.users where id='aaaaaaaa-0000-0000-0000-000000000001';
select tst.t('account deletion cascades: profiles','service_role',null,$q$select count(*) from public.profiles where id='aaaaaaaa-0000-0000-0000-000000000001'$q$,'0');
select tst.t('account deletion cascades: methods','service_role',null,$q$select count(*) from public.payment_methods where profile_id='aaaaaaaa-0000-0000-0000-000000000001'$q$,'0');
select tst.t('account deletion cascades: encrypted secrets','service_role',null,'select count(*) from public.payment_method_secrets','0');
select tst.t('account deletion cascades: subscription','service_role',null,$q$select count(*) from public.subscriptions where user_id='aaaaaaaa-0000-0000-0000-000000000001'$q$,'0');
select tst.t('account deletion cascades: analytics','service_role',null,$q$select count(*) from public.analytics_events where profile_id='aaaaaaaa-0000-0000-0000-000000000001'$q$,'0');

select name, expected, actual, case when pass then 'PASS' else '<<< FAIL' end as result from tst.results order by pass, name;
select count(*) filter (where pass) as passed, count(*) filter (where not pass) as failed from tst.results;
