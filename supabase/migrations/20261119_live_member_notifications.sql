-- RE-SKIN: notify both admins and the submitting member when a new request is created.
-- Safe to run after the V12 schema has already been installed.

begin;

create or replace function public.notify_pickup_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  member_label text;
begin
  select coalesce(nullif(p.full_name, ''), p.email, 'Member RE-SKIN')
    into member_label
  from public.profiles p
  where p.id = new.user_id;

  perform public.notify_admins(
    'pickup_created',
    'Pengajuan pickup baru',
    coalesce(member_label, 'Member RE-SKIN') || ' mengajukan pickup ' || new.request_code || '.',
    'pickup_request',
    new.id,
    '/admin'
  );

  insert into public.notifications
    (user_id, notification_type, title, message, entity_type, entity_id, target_path)
  values
    (new.user_id, 'pickup_created', 'Pengajuan pickup terkirim',
     'Pengajuan ' || new.request_code || ' berhasil dikirim dan menunggu konfirmasi admin.',
     'pickup_request', new.id, '/dashboard');

  return new;
end;
$$;

create or replace function public.notify_redemption_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  member_label text;
begin
  select coalesce(nullif(p.full_name, ''), p.email, 'Member RE-SKIN')
    into member_label
  from public.profiles p
  where p.id = new.user_id;

  perform public.notify_admins(
    'redemption_created',
    'Permintaan penukaran hadiah baru',
    coalesce(member_label, 'Member RE-SKIN') || ' meminta ' || new.reward_name ||
      ' (' || new.request_code || ').',
    'redemption_request',
    new.id,
    '/admin'
  );

  insert into public.notifications
    (user_id, notification_type, title, message, entity_type, entity_id, target_path)
  values
    (new.user_id, 'redemption_created', 'Permintaan hadiah terkirim',
     'Pengajuan ' || new.request_code || ' untuk ' || new.reward_name || ' sudah dikirim. SKINPoint ditahan sementara.',
     'redemption_request', new.id, '/dashboard');

  return new;
end;
$$;

create or replace function public.notify_account_deletion_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  member_label text;
begin
  select coalesce(nullif(p.full_name, ''), p.email, 'Member RE-SKIN')
    into member_label
  from public.profiles p
  where p.id = new.user_id;

  perform public.notify_admins(
    'account_deletion_created',
    'Pengajuan penghapusan akun',
    coalesce(member_label, 'Member RE-SKIN') || ' mengajukan peninjauan penghapusan akun ' || new.request_code || '.',
    'account_deletion_request',
    new.id,
    '/admin'
  );

  insert into public.notifications
    (user_id, notification_type, title, message, entity_type, entity_id, target_path)
  values
    (new.user_id, 'account_deletion_created', 'Pengajuan penghapusan akun terkirim',
     'Pengajuan ' || new.request_code || ' sudah dikirim untuk ditinjau. Akunmu belum dihapus.',
     'account_deletion_request', new.id, '/dashboard');

  return new;
end;
$$;

commit;
