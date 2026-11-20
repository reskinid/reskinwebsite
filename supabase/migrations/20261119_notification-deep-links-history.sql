-- RE-SKIN V15 FIX: notification deep links, read history destinations, and triggers.
-- Run once in Supabase SQL Editor after the RE-SKIN V12 schema and the prior
-- live-member-notifications migration. Safe to re-run: functions are replaced
-- and triggers are dropped/recreated with the same names.

begin;

-- 1) Update destinations for existing notification history.
update public.notifications n
set target_path = case
  when n.entity_type = 'pickup_request' then
    case when p.role = 'admin' then '/admin#pickup-' || n.entity_id::text
         else '/dashboard#pickup-' || n.entity_id::text end
  when n.entity_type = 'redemption_request' then
    case when p.role = 'admin' then '/admin#redemption-' || n.entity_id::text
         else '/dashboard#redemption-' || n.entity_id::text end
  when n.entity_type = 'account_deletion_request' then
    case when p.role = 'admin' then '/admin#account-deletion-' || n.entity_id::text
         else '/dashboard#account-profile' end
  else n.target_path
end
from public.profiles p
where p.id = n.user_id
  and n.entity_id is not null
  and n.entity_type in ('pickup_request', 'redemption_request', 'account_deletion_request');

-- 2) Pickup created: notify admins and the member, with direct destinations.
create or replace function public.notify_pickup_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $reskin$
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
    '/admin#pickup-' || new.id
  );

  insert into public.notifications
    (user_id, notification_type, title, message, entity_type, entity_id, target_path)
  values
    (new.user_id, 'pickup_created', 'Pengajuan pickup terkirim',
     'Pengajuan ' || new.request_code || ' berhasil dikirim dan menunggu konfirmasi admin.',
     'pickup_request', new.id, '/dashboard#pickup-' || new.id);

  return new;
end;
$reskin$;

-- 3) Pickup status changed: notify the member.
create or replace function public.notify_pickup_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $reskin$
declare
  status_message text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  status_message := case new.status
    when 'confirmed' then 'Pengajuan pickup ' || new.request_code || ' telah dikonfirmasi admin.'
    when 'cancelled' then 'Pengajuan pickup ' || new.request_code || ' dibatalkan.'
    when 'completed' then 'Pickup ' || new.request_code || ' selesai diverifikasi. SKINPoint telah diproses.'
    else 'Status pickup ' || new.request_code || ' diperbarui menjadi ' || new.status || '.'
  end;

  insert into public.notifications
    (user_id, notification_type, title, message, entity_type, entity_id, target_path)
  values
    (new.user_id, 'pickup_status_updated', 'Pembaruan pengajuan pickup', status_message,
     'pickup_request', new.id, '/dashboard#pickup-' || new.id);

  return new;
end;
$reskin$;

-- 4) Redemption created: notify admins and the member.
create or replace function public.notify_redemption_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $reskin$
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
    '/admin#redemption-' || new.id
  );

  insert into public.notifications
    (user_id, notification_type, title, message, entity_type, entity_id, target_path)
  values
    (new.user_id, 'redemption_created', 'Permintaan hadiah terkirim',
     'Pengajuan ' || new.request_code || ' untuk ' || new.reward_name || ' sudah dikirim. SKINPoint ditahan sementara.',
     'redemption_request', new.id, '/dashboard#redemption-' || new.id);

  return new;
end;
$reskin$;

-- 5) Redemption status changed: notify member; notify admins when member confirms receipt.
create or replace function public.notify_redemption_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $reskin$
declare
  status_message text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  status_message := case new.status
    when 'approved' then 'Permintaan ' || new.reward_name || ' disetujui. Admin sedang menyiapkan hadiah.'
    when 'rejected' then 'Permintaan ' || new.reward_name || ' ditolak. SKINPoint yang ditahan telah dikembalikan ke saldo.'
    when 'ready' then 'Hadiah ' || new.reward_name || ' siap diambil. Buka detail instruksi di Member Area.'
    when 'shipped' then 'Hadiah ' || new.reward_name || ' sedang dikirim. Buka detail pengiriman di Member Area.'
    when 'received' then 'Penerimaan hadiah ' || new.reward_name || ' telah dikonfirmasi.'
    else 'Status penukaran ' || new.request_code || ' diperbarui menjadi ' || new.status || '.'
  end;

  if new.user_id is not null then
    insert into public.notifications
      (user_id, notification_type, title, message, entity_type, entity_id, target_path)
    values
      (new.user_id, 'redemption_status_updated', 'Pembaruan penukaran hadiah',
       status_message, 'redemption_request', new.id, '/dashboard#redemption-' || new.id);
  end if;

  if new.status = 'received' then
    perform public.notify_admins(
      'redemption_received',
      'Hadiah dikonfirmasi diterima',
      new.request_code || ': Beauty Bestie telah mengonfirmasi hadiah diterima.',
      'redemption_request',
      new.id,
      '/admin#redemption-' || new.id
    );
  end if;

  return new;
end;
$reskin$;

-- 6) Account deletion request created: notify admins and the member.
create or replace function public.notify_account_deletion_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $reskin$
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
    '/admin#account-deletion-' || new.id
  );

  insert into public.notifications
    (user_id, notification_type, title, message, entity_type, entity_id, target_path)
  values
    (new.user_id, 'account_deletion_created', 'Pengajuan penghapusan akun terkirim',
     'Pengajuan ' || new.request_code || ' sudah dikirim untuk ditinjau. Akunmu belum dihapus.',
     'account_deletion_request', new.id, '/dashboard#account-profile');

  return new;
end;
$reskin$;

-- 7) Account deletion request status changed: notify the member.
create or replace function public.notify_account_deletion_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $reskin$
begin
  if new.status is distinct from old.status and new.user_id is not null then
    insert into public.notifications
      (user_id, notification_type, title, message, entity_type, entity_id, target_path)
    values
      (new.user_id, 'account_deletion_status_updated', 'Pembaruan pengajuan penghapusan akun',
       case new.status
         when 'approved' then 'Pengajuan ' || new.request_code || ' disetujui untuk proses verifikasi akhir. Akun belum dihapus.'
         when 'rejected' then 'Pengajuan ' || new.request_code || ' belum dapat disetujui. Lihat pesan admin untuk detail.'
         else 'Status pengajuan penghapusan akun diperbarui.'
       end,
       'account_deletion_request', new.id, '/dashboard#account-profile');
  end if;
  return new;
end;
$reskin$;

-- 8) Re-attach the expected triggers. Dropping by name avoids duplicate triggers.
drop trigger if exists pickup_requests_notify_created on public.pickup_requests;
create trigger pickup_requests_notify_created
  after insert on public.pickup_requests
  for each row execute function public.notify_pickup_created();

drop trigger if exists pickup_requests_notify_status on public.pickup_requests;
create trigger pickup_requests_notify_status
  after update of status on public.pickup_requests
  for each row execute function public.notify_pickup_status_changed();

drop trigger if exists redemption_requests_notify_created on public.redemption_requests;
create trigger redemption_requests_notify_created
  after insert on public.redemption_requests
  for each row execute function public.notify_redemption_created();

drop trigger if exists redemption_requests_notify_status on public.redemption_requests;
create trigger redemption_requests_notify_status
  after update of status on public.redemption_requests
  for each row execute function public.notify_redemption_status_changed();

drop trigger if exists account_deletion_requests_notify_created on public.account_deletion_requests;
create trigger account_deletion_requests_notify_created
  after insert on public.account_deletion_requests
  for each row execute function public.notify_account_deletion_created();

drop trigger if exists account_deletion_requests_notify_status on public.account_deletion_requests;
create trigger account_deletion_requests_notify_status
  after update of status on public.account_deletion_requests
  for each row execute function public.notify_account_deletion_status_changed();

commit;
