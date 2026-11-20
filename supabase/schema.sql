-- =============================================================================
-- RE-SKIN Supabase Database Schema V12
-- Full schema for profiles, pickup, SKINPoint, rewards, redemptions,
-- account deletion requests, and in-app notifications.
--
-- Run this entire file once in Supabase Dashboard > SQL Editor > New query.
-- Safe to re-run for the objects managed below (tables, columns, indexes,
-- policies, triggers, and functions).
--
-- IMPORTANT:
-- - Never put a Supabase Secret/service_role key in the browser.
-- - Admin role must be assigned manually by the project owner in SQL Editor.
-- - Account deletion approval is a review step, NOT an automatic Auth deletion.
-- =============================================================================

begin;

create extension if not exists pgcrypto;

-- Human-readable request code counters.
create sequence if not exists public.pickup_request_code_seq;
create sequence if not exists public.redemption_request_code_seq;
create sequence if not exists public.account_deletion_request_code_seq;

-- -----------------------------------------------------------------------------
-- 1. MEMBER PROFILES
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_style text not null default 'female_hijab',
  gender text,
  privacy_consent_at timestamptz,
  privacy_policy_version text,
  email text,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('member', 'admin'))
);

alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists avatar_style text not null default 'female_hijab';
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists privacy_consent_at timestamptz;
alter table public.profiles add column if not exists privacy_policy_version text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_avatar_style_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_style_check
      check (avatar_style in ('male', 'female_hijab', 'female_no_hijab'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_gender_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_gender_check
      check (gender is null or gender in ('male', 'female'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('member', 'admin'));
  end if;
end;
$$;

create index if not exists profiles_role_created_idx
  on public.profiles (role, created_at desc);

-- -----------------------------------------------------------------------------
-- 2. PICKUP REQUESTS AND PACKAGE DETAILS
-- -----------------------------------------------------------------------------
create table if not exists public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null default (
    'RSK-' || to_char(now(), 'YYMM') || '-' ||
    lpad(nextval('public.pickup_request_code_seq')::text, 6, '0')
  ),
  user_id uuid not null references auth.users (id) on delete cascade,
  pickup_date date not null,
  pickup_time time not null,
  location text not null,
  phone text not null,
  note text,
  total_packages integer not null check (total_packages > 0),
  estimated_points integer not null default 0 check (estimated_points >= 0),
  verified_total_packages integer,
  verified_points integer,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pickup_requests add column if not exists request_code text;
alter table public.pickup_requests add column if not exists verified_total_packages integer;
alter table public.pickup_requests add column if not exists verified_points integer;
alter table public.pickup_requests add column if not exists updated_at timestamptz not null default now();

update public.pickup_requests
set request_code = (
  'RSK-' || to_char(created_at, 'YYMM') || '-' ||
  lpad(nextval('public.pickup_request_code_seq')::text, 6, '0')
)
where request_code is null;

alter table public.pickup_requests
  alter column request_code set default (
    'RSK-' || to_char(now(), 'YYMM') || '-' ||
    lpad(nextval('public.pickup_request_code_seq')::text, 6, '0')
  );
alter table public.pickup_requests alter column request_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pickup_requests_verified_total_check'
      and conrelid = 'public.pickup_requests'::regclass
  ) then
    alter table public.pickup_requests
      add constraint pickup_requests_verified_total_check
      check (verified_total_packages is null or verified_total_packages >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pickup_requests_verified_points_check'
      and conrelid = 'public.pickup_requests'::regclass
  ) then
    alter table public.pickup_requests
      add constraint pickup_requests_verified_points_check
      check (verified_points is null or verified_points >= 0);
  end if;
end;
$$;

create unique index if not exists pickup_requests_request_code_uidx
  on public.pickup_requests (request_code);
create index if not exists pickup_requests_user_created_idx
  on public.pickup_requests (user_id, created_at desc);
create index if not exists pickup_requests_status_created_idx
  on public.pickup_requests (status, created_at desc);
create index if not exists pickup_requests_date_idx
  on public.pickup_requests (pickup_date desc);

create table if not exists public.pickup_items (
  id uuid primary key default gen_random_uuid(),
  pickup_request_id uuid not null references public.pickup_requests (id) on delete cascade,
  size_band text not null check (size_band in ('5-40ml', '50-100ml', '200-500ml')),
  quantity integer not null check (quantity > 0),
  verified_quantity integer,
  created_at timestamptz not null default now(),
  unique (pickup_request_id, size_band),
  constraint pickup_items_verified_quantity_check
    check (verified_quantity is null or verified_quantity >= 0)
);

alter table public.pickup_items add column if not exists verified_quantity integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pickup_items_verified_quantity_check'
      and conrelid = 'public.pickup_items'::regclass
  ) then
    alter table public.pickup_items
      add constraint pickup_items_verified_quantity_check
      check (verified_quantity is null or verified_quantity >= 0);
  end if;
end;
$$;

create index if not exists pickup_items_request_idx
  on public.pickup_items (pickup_request_id);

-- -----------------------------------------------------------------------------
-- 3. REWARD CATALOG
-- Admin must set points_cost, stock, and is_active before a reward is redeemable.
-- Ranges are the concept ranges already displayed in the RE-SKIN landing page;
-- exact prices and stock are intentionally not invented.
-- -----------------------------------------------------------------------------
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null,
  description text not null default '',
  min_points integer not null check (min_points > 0),
  max_points integer not null check (max_points >= min_points),
  points_cost integer check (points_cost is null or points_cost > 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default false,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.rewards
  (code, name, category, description, min_points, max_points, points_cost, stock, is_active)
values
  ('hair-clip', 'Jepit rambut lucu', 'Aksesori',
   'Aksesori manis untuk melengkapi daily look.', 1000, 10000, null, 0, false),
  ('bag-charm', 'Bag charm & aksesori', 'Aksesori',
   'Charm dan aksesori pilihan untuk tas favoritmu.', 11000, 25000, null, 0, false),
  ('beauty-products', 'Produk kosmetik pilihan', 'Beauty',
   'Pilihan produk kosmetik untuk beauty routine-mu.', 26000, 80000, null, 0, false)
on conflict (code) do nothing;

create index if not exists rewards_active_idx
  on public.rewards (is_active, category);

-- -----------------------------------------------------------------------------
-- 4. REDEMPTION REQUESTS
-- One request reserves points and one stock unit. Rejected requests release both.
-- -----------------------------------------------------------------------------
create table if not exists public.redemption_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null default (
    'RDM-' || to_char(now(), 'YYMM') || '-' ||
    lpad(nextval('public.redemption_request_code_seq')::text, 6, '0')
  ),
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_id uuid references public.rewards (id) on delete set null,
  reward_name text not null,
  points_cost integer not null check (points_cost > 0),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'ready', 'shipped', 'received')),
  fulfillment_method text
    check (fulfillment_method is null or fulfillment_method in ('pickup', 'delivery')),
  fulfillment_details text,
  admin_message text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists redemption_requests_request_code_uidx
  on public.redemption_requests (request_code);
create index if not exists redemption_requests_user_created_idx
  on public.redemption_requests (user_id, created_at desc);
create index if not exists redemption_requests_status_created_idx
  on public.redemption_requests (status, created_at desc);

-- -----------------------------------------------------------------------------
-- 5. ACCOUNT DELETION REQUESTS
-- Admin approval is a review stage only. It does not delete auth.users.
-- -----------------------------------------------------------------------------
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null default (
    'DEL-' || to_char(now(), 'YYMM') || '-' ||
    lpad(nextval('public.account_deletion_request_code_seq')::text, 6, '0')
  ),
  user_id uuid references auth.users (id) on delete set null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_message text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists account_deletion_requests_request_code_uidx
  on public.account_deletion_requests (request_code);
create index if not exists account_deletion_requests_user_created_idx
  on public.account_deletion_requests (user_id, created_at desc);
create index if not exists account_deletion_requests_status_created_idx
  on public.account_deletion_requests (status, created_at desc);

-- -----------------------------------------------------------------------------
-- 6. SKINPOINT LEDGER
-- Pending negative redemption rows are held from the spendable balance.
-- Rejected redemption rows are excluded from the balance, releasing the hold.
-- -----------------------------------------------------------------------------
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pickup_request_id uuid references public.pickup_requests (id) on delete set null,
  redemption_request_id uuid references public.redemption_requests (id) on delete set null,
  points integer not null check (points <> 0),
  transaction_type text not null
    check (transaction_type in ('earned', 'redeemed', 'adjustment')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  description text,
  created_at timestamptz not null default now()
);

alter table public.point_transactions
  add column if not exists redemption_request_id uuid
  references public.redemption_requests (id) on delete set null;

create unique index if not exists point_transactions_one_earned_per_pickup
  on public.point_transactions (pickup_request_id, transaction_type)
  where pickup_request_id is not null
    and transaction_type = 'earned'
    and status = 'approved';

create unique index if not exists point_transactions_one_redemption_debit
  on public.point_transactions (redemption_request_id, transaction_type)
  where redemption_request_id is not null
    and transaction_type = 'redeemed';

create index if not exists point_transactions_user_created_idx
  on public.point_transactions (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 7. IN-APP NOTIFICATIONS
-- One notification row per recipient. Admins receive their own copies.
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  target_path text not null default '/dashboard',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);


-- -----------------------------------------------------------------------------
-- 8. PUBLIC LANDING PAGE STATISTICS
-- Only aggregate counters are exposed; no member or transaction details.
-- -----------------------------------------------------------------------------
create table if not exists public.landing_stats (
  id integer primary key default 1 check (id = 1),
  total_packages bigint not null default 0 check (total_packages >= 0),
  total_members bigint not null default 0 check (total_members >= 0),
  total_points bigint not null default 0 check (total_points >= 0),
  updated_at timestamptz not null default now()
);

insert into public.landing_stats (id, total_packages, total_members, total_points)
values (1, 0, 0, 0)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 9. COMMON HELPERS AND AUTH PROFILE TRIGGER
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, avatar_style, gender, email, role, privacy_consent_at, privacy_policy_version)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      ''
    ),
    case
      when new.raw_user_meta_data ->> 'avatar_style' in ('male', 'female_hijab', 'female_no_hijab')
        then new.raw_user_meta_data ->> 'avatar_style'
      else 'female_hijab'
    end,
    case
      when new.raw_user_meta_data ->> 'gender' in ('male', 'female')
        then new.raw_user_meta_data ->> 'gender'
      when new.raw_user_meta_data ->> 'avatar_style' = 'male'
        then 'male'
      when new.raw_user_meta_data ->> 'avatar_style' in ('female_hijab', 'female_no_hijab')
        then 'female'
      else null
    end,
    new.email,
    'member',
    nullif(new.raw_user_meta_data ->> 'privacy_consent_at', '')::timestamptz,
    new.raw_user_meta_data ->> 'privacy_policy_version'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when excluded.full_name <> '' then excluded.full_name
          else public.profiles.full_name
        end,
        avatar_style = case
          when new.raw_user_meta_data ->> 'avatar_style' in ('male', 'female_hijab', 'female_no_hijab')
            then excluded.avatar_style
          else public.profiles.avatar_style
        end,
        gender = coalesce(excluded.gender, public.profiles.gender),
        privacy_consent_at = coalesce(excluded.privacy_consent_at, public.profiles.privacy_consent_at),
        privacy_policy_version = coalesce(excluded.privacy_policy_version, public.profiles.privacy_policy_version);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists pickup_requests_set_updated_at on public.pickup_requests;
create trigger pickup_requests_set_updated_at
  before update on public.pickup_requests
  for each row execute procedure public.set_updated_at();

drop trigger if exists rewards_set_updated_at on public.rewards;
create trigger rewards_set_updated_at
  before update on public.rewards
  for each row execute procedure public.set_updated_at();

drop trigger if exists redemption_requests_set_updated_at on public.redemption_requests;
create trigger redemption_requests_set_updated_at
  before update on public.redemption_requests
  for each row execute procedure public.set_updated_at();

drop trigger if exists account_deletion_requests_set_updated_at on public.account_deletion_requests;
create trigger account_deletion_requests_set_updated_at
  before update on public.account_deletion_requests
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------------------------------------
-- PUBLIC LANDING STATISTICS REFRESH
-- Counts verified packages, member profiles, and gross awarded SKINPoint.
-- -----------------------------------------------------------------------------
create or replace function public.recalculate_landing_stats()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  packages_total bigint;
  members_total bigint;
  points_total bigint;
begin
  select coalesce(sum(pr.verified_total_packages), 0)::bigint
    into packages_total
  from public.pickup_requests pr
  where pr.status = 'completed'
    and pr.verified_total_packages is not null;

  select count(*)::bigint
    into members_total
  from public.profiles p
  where p.role = 'member';

  select coalesce(sum(pt.points), 0)::bigint
    into points_total
  from public.point_transactions pt
  where pt.transaction_type = 'earned'
    and pt.status = 'approved'
    and pt.points > 0;

  insert into public.landing_stats (id, total_packages, total_members, total_points, updated_at)
  values (1, packages_total, members_total, points_total, now())
  on conflict (id) do update set
    total_packages = excluded.total_packages,
    total_members = excluded.total_members,
    total_points = excluded.total_points,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function public.refresh_landing_stats_after_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.recalculate_landing_stats();
  return null;
end;
$$;

revoke all on function public.recalculate_landing_stats() from public, anon, authenticated;
revoke all on function public.refresh_landing_stats_after_change() from public, anon, authenticated;

drop trigger if exists profiles_refresh_landing_stats on public.profiles;
create trigger profiles_refresh_landing_stats
after insert or update or delete on public.profiles
for each statement execute function public.refresh_landing_stats_after_change();

drop trigger if exists pickup_requests_refresh_landing_stats on public.pickup_requests;
create trigger pickup_requests_refresh_landing_stats
after insert or update or delete on public.pickup_requests
for each statement execute function public.refresh_landing_stats_after_change();

drop trigger if exists point_transactions_refresh_landing_stats on public.point_transactions;
create trigger point_transactions_refresh_landing_stats
after insert or update or delete on public.point_transactions
for each statement execute function public.refresh_landing_stats_after_change();

select public.recalculate_landing_stats();

-- -----------------------------------------------------------------------------
-- 10. NOTIFICATION TRIGGERS
-- -----------------------------------------------------------------------------
create or replace function public.notify_admins(
  p_type text,
  p_title text,
  p_message text,
  p_entity_type text,
  p_entity_id uuid,
  p_target_path text default '/admin'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications
    (user_id, notification_type, title, message, entity_type, entity_id, target_path)
  select p.id, p_type, p_title, p_message, p_entity_type, p_entity_id, p_target_path
  from public.profiles p
  where p.role = 'admin';
end;
$$;

revoke all on function public.notify_admins(text, text, text, text, uuid, text) from public;

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

create or replace function public.notify_pickup_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

create or replace function public.notify_redemption_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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
       status_message, 'redemption_request', new.id, '/dashboard');
  end if;

  if new.status = 'received' then
    perform public.notify_admins(
      'redemption_received',
      'Hadiah dikonfirmasi diterima',
      new.request_code || ': Beauty Bestie telah mengonfirmasi hadiah diterima.',
      'redemption_request',
      new.id,
      '/admin'
    );
  end if;

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

create or replace function public.notify_account_deletion_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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
       'account_deletion_request', new.id, '/dashboard');
  end if;
  return new;
end;
$$;

drop trigger if exists pickup_requests_notify_created on public.pickup_requests;
create trigger pickup_requests_notify_created
  after insert on public.pickup_requests
  for each row execute procedure public.notify_pickup_created();

drop trigger if exists pickup_requests_notify_status on public.pickup_requests;
create trigger pickup_requests_notify_status
  after update of status on public.pickup_requests
  for each row execute procedure public.notify_pickup_status_changed();

drop trigger if exists redemption_requests_notify_created on public.redemption_requests;
create trigger redemption_requests_notify_created
  after insert on public.redemption_requests
  for each row execute procedure public.notify_redemption_created();

drop trigger if exists redemption_requests_notify_status on public.redemption_requests;
create trigger redemption_requests_notify_status
  after update of status on public.redemption_requests
  for each row execute procedure public.notify_redemption_status_changed();

drop trigger if exists account_deletion_requests_notify_created on public.account_deletion_requests;
create trigger account_deletion_requests_notify_created
  after insert on public.account_deletion_requests
  for each row execute procedure public.notify_account_deletion_created();

drop trigger if exists account_deletion_requests_notify_status on public.account_deletion_requests;
create trigger account_deletion_requests_notify_status
  after update of status on public.account_deletion_requests
  for each row execute procedure public.notify_account_deletion_status_changed();

-- -----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.pickup_requests enable row level security;
alter table public.pickup_items enable row level security;
alter table public.point_transactions enable row level security;
alter table public.rewards enable row level security;
alter table public.redemption_requests enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.landing_stats enable row level security;

-- Public landing page can read only aggregate counters from landing_stats.
drop policy if exists "Anyone can read public landing stats" on public.landing_stats;
create policy "Anyone can read public landing stats"
  on public.landing_stats for select to anon, authenticated
  using (true);

grant select on public.landing_stats to anon, authenticated;
revoke insert, update, delete on public.landing_stats from anon, authenticated;

-- Profiles
drop policy if exists "Members read own profile" on public.profiles;
create policy "Members read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Members update own profile" on public.profiles;
create policy "Members update own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select on public.profiles to authenticated;
grant update (full_name, avatar_style, gender) on public.profiles to authenticated;

-- Pickup requests
drop policy if exists "Members read own pickup requests" on public.pickup_requests;
create policy "Members read own pickup requests"
  on public.pickup_requests for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins read all pickup requests" on public.pickup_requests;
create policy "Admins read all pickup requests"
  on public.pickup_requests for select to authenticated
  using ((select public.is_admin()));

grant select on public.pickup_requests to authenticated;
revoke insert, update, delete on public.pickup_requests from authenticated;

-- Pickup items
drop policy if exists "Members read own pickup items" on public.pickup_items;
create policy "Members read own pickup items"
  on public.pickup_items for select to authenticated
  using (
    exists (
      select 1 from public.pickup_requests r
      where r.id = pickup_request_id and r.user_id = (select auth.uid())
    )
  );

drop policy if exists "Admins read all pickup items" on public.pickup_items;
create policy "Admins read all pickup items"
  on public.pickup_items for select to authenticated
  using ((select public.is_admin()));

grant select on public.pickup_items to authenticated;
revoke insert, update, delete on public.pickup_items from authenticated;

-- Point transactions
drop policy if exists "Members read own point transactions" on public.point_transactions;
create policy "Members read own point transactions"
  on public.point_transactions for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins read all point transactions" on public.point_transactions;
create policy "Admins read all point transactions"
  on public.point_transactions for select to authenticated
  using ((select public.is_admin()));

grant select on public.point_transactions to authenticated;
revoke insert, update, delete on public.point_transactions from authenticated;

-- Rewards: members see active catalogue entries; admins can inspect all.
drop policy if exists "Members read active rewards" on public.rewards;
create policy "Members read active rewards"
  on public.rewards for select to authenticated
  using (is_active = true);

drop policy if exists "Admins read all rewards" on public.rewards;
create policy "Admins read all rewards"
  on public.rewards for select to authenticated
  using ((select public.is_admin()));

grant select on public.rewards to authenticated;
revoke insert, update, delete on public.rewards from authenticated;

-- Redemptions: members read only their requests; admins read all.
drop policy if exists "Members read own redemption requests" on public.redemption_requests;
create policy "Members read own redemption requests"
  on public.redemption_requests for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins read all redemption requests" on public.redemption_requests;
create policy "Admins read all redemption requests"
  on public.redemption_requests for select to authenticated
  using ((select public.is_admin()));

grant select on public.redemption_requests to authenticated;
revoke insert, update, delete on public.redemption_requests from authenticated;

-- Account deletion requests.
drop policy if exists "Members read own account deletion requests" on public.account_deletion_requests;
create policy "Members read own account deletion requests"
  on public.account_deletion_requests for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins read all account deletion requests" on public.account_deletion_requests;
create policy "Admins read all account deletion requests"
  on public.account_deletion_requests for select to authenticated
  using ((select public.is_admin()));

grant select on public.account_deletion_requests to authenticated;
revoke insert, update, delete on public.account_deletion_requests from authenticated;

-- Notifications: each account reads and marks only its own notifications.
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users update own notification read state" on public.notifications;
create policy "Users update own notification read state"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;
revoke insert, delete on public.notifications from authenticated;

-- -----------------------------------------------------------------------------
-- 12. MEMBER RPCs: PICKUP, BALANCE, REDEMPTION, ACCOUNT DELETION
-- -----------------------------------------------------------------------------
create or replace function public.submit_pickup_request(
  p_pickup_date date,
  p_pickup_time time,
  p_location text,
  p_phone text,
  p_note text,
  p_small_quantity integer,
  p_medium_quantity integer,
  p_large_quantity integer,
  p_total_packages integer,
  p_estimated_points integer
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_request_id uuid;
  calculated_total integer;
  calculated_points integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(coalesce(p_location, '')), '') is null
     or nullif(trim(coalesce(p_phone, '')), '') is null
     or p_pickup_date is null
     or p_pickup_time is null then
    raise exception 'Pickup date, time, location, and phone are required';
  end if;

  if p_pickup_date < current_date then
    raise exception 'Pickup date cannot be in the past';
  end if;

  if p_small_quantity is null or p_medium_quantity is null or p_large_quantity is null
     or p_total_packages is null or p_estimated_points is null then
    raise exception 'Package quantities and estimates are required';
  end if;

  if p_small_quantity < 0 or p_medium_quantity < 0 or p_large_quantity < 0 then
    raise exception 'Package quantities cannot be negative';
  end if;

  calculated_total := p_small_quantity + p_medium_quantity + p_large_quantity;
  calculated_points := (p_small_quantity * 5) + (p_medium_quantity * 10) + (p_large_quantity * 15);

  if calculated_total < 1 or calculated_total <> p_total_packages then
    raise exception 'Invalid package total';
  end if;

  if calculated_points <> p_estimated_points then
    raise exception 'Invalid estimated points';
  end if;

  insert into public.pickup_requests (
    user_id, pickup_date, pickup_time, location, phone, note,
    total_packages, estimated_points, status
  ) values (
    auth.uid(), p_pickup_date, p_pickup_time, trim(p_location), trim(p_phone),
    nullif(trim(coalesce(p_note, '')), ''),
    calculated_total, calculated_points, 'pending'
  ) returning id into new_request_id;

  if p_small_quantity > 0 then
    insert into public.pickup_items (pickup_request_id, size_band, quantity)
    values (new_request_id, '5-40ml', p_small_quantity);
  end if;
  if p_medium_quantity > 0 then
    insert into public.pickup_items (pickup_request_id, size_band, quantity)
    values (new_request_id, '50-100ml', p_medium_quantity);
  end if;
  if p_large_quantity > 0 then
    insert into public.pickup_items (pickup_request_id, size_band, quantity)
    values (new_request_id, '200-500ml', p_large_quantity);
  end if;

  return new_request_id;
end;
$$;

create or replace function public.get_my_point_balance()
returns bigint
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  balance bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select coalesce(sum(pt.points), 0)::bigint
    into balance
  from public.point_transactions pt
  where pt.user_id = auth.uid()
    and (
      pt.status = 'approved'
      or (pt.transaction_type = 'redeemed' and pt.status = 'pending')
    );

  return balance;
end;
$$;

create or replace function public.submit_redemption_request(p_reward_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reward_row public.rewards%rowtype;
  new_request_id uuid;
  current_balance bigint;
  locked_profile_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- Serialize concurrent redemptions from the same member to prevent overspending.
  select p.id into locked_profile_id
  from public.profiles p
  where p.id = auth.uid()
  for update;

  if locked_profile_id is null then
    raise exception 'Member profile not found';
  end if;

  select * into reward_row
  from public.rewards
  where id = p_reward_id
  for update;

  if not found or reward_row.is_active is not true then
    raise exception 'Reward is not available';
  end if;

  if reward_row.points_cost is null or reward_row.points_cost <= 0 then
    raise exception 'Reward point cost has not been configured by Admin';
  end if;

  if reward_row.stock < 1 then
    raise exception 'Reward is out of stock';
  end if;

  select coalesce(sum(pt.points), 0)::bigint
    into current_balance
  from public.point_transactions pt
  where pt.user_id = auth.uid()
    and (
      pt.status = 'approved'
      or (pt.transaction_type = 'redeemed' and pt.status = 'pending')
    );

  if current_balance < reward_row.points_cost then
    raise exception 'Insufficient SKINPoint balance';
  end if;

  update public.rewards
  set stock = stock - 1
  where id = reward_row.id;

  insert into public.redemption_requests (
    user_id, reward_id, reward_name, points_cost, status
  ) values (
    auth.uid(), reward_row.id, reward_row.name, reward_row.points_cost, 'pending'
  ) returning id into new_request_id;

  insert into public.point_transactions (
    user_id, redemption_request_id, points, transaction_type, status, description
  ) values (
    auth.uid(), new_request_id, -reward_row.points_cost, 'redeemed', 'pending',
    'SKINPoint ditahan untuk penukaran ' || reward_row.name
  );

  return new_request_id;
end;
$$;

create or replace function public.submit_account_deletion_request(p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'Please provide a short reason for the account deletion request';
  end if;

  if exists (
    select 1 from public.account_deletion_requests d
    where d.user_id = auth.uid()
      and d.status in ('pending', 'approved')
  ) then
    raise exception 'An account deletion request is already being reviewed';
  end if;

  insert into public.account_deletion_requests (user_id, reason, status)
  values (auth.uid(), trim(p_reason), 'pending')
  returning id into new_request_id;

  return new_request_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 13. ADMIN RPCs
-- -----------------------------------------------------------------------------
create or replace function public.admin_update_pickup_status(
  p_pickup_request_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_status is null or p_status not in ('confirmed', 'cancelled') then
    raise exception 'Unsupported pickup status';
  end if;

  update public.pickup_requests
  set status = p_status
  where id = p_pickup_request_id
    and status in ('pending', 'confirmed');

  get diagnostics changed_count = row_count;
  if changed_count = 0 then
    raise exception 'Pickup not found or cannot be changed from its current status';
  end if;
end;
$$;

drop function if exists public.admin_complete_pickup(uuid);

create or replace function public.admin_complete_pickup(
  p_pickup_request_id uuid,
  p_small_quantity integer,
  p_medium_quantity integer,
  p_large_quantity integer
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  pickup_row public.pickup_requests%rowtype;
  verified_total integer;
  earned_points integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_small_quantity is null or p_medium_quantity is null or p_large_quantity is null then
    raise exception 'Verified package quantities are required';
  end if;

  if p_small_quantity < 0 or p_medium_quantity < 0 or p_large_quantity < 0 then
    raise exception 'Verified package quantities cannot be negative';
  end if;

  verified_total := p_small_quantity + p_medium_quantity + p_large_quantity;
  earned_points := (p_small_quantity * 5) + (p_medium_quantity * 10) + (p_large_quantity * 15);

  if verified_total < 1 then
    raise exception 'At least one package must be verified';
  end if;

  select * into pickup_row
  from public.pickup_requests
  where id = p_pickup_request_id
  for update;

  if not found then
    raise exception 'Pickup request not found';
  end if;

  if pickup_row.status <> 'confirmed' then
    raise exception 'Only confirmed pickups can be completed';
  end if;

  update public.pickup_items
  set verified_quantity = case size_band
    when '5-40ml' then p_small_quantity
    when '50-100ml' then p_medium_quantity
    when '200-500ml' then p_large_quantity
  end
  where pickup_request_id = p_pickup_request_id;

  insert into public.pickup_items (pickup_request_id, size_band, quantity, verified_quantity)
  select p_pickup_request_id, '5-40ml', p_small_quantity, p_small_quantity where p_small_quantity > 0
  union all
  select p_pickup_request_id, '50-100ml', p_medium_quantity, p_medium_quantity where p_medium_quantity > 0
  union all
  select p_pickup_request_id, '200-500ml', p_large_quantity, p_large_quantity where p_large_quantity > 0
  on conflict (pickup_request_id, size_band)
  do update set verified_quantity = excluded.verified_quantity;

  update public.pickup_requests
  set status = 'completed',
      verified_total_packages = verified_total,
      verified_points = earned_points
  where id = p_pickup_request_id;

  insert into public.point_transactions (
    user_id, pickup_request_id, points, transaction_type, status, description
  ) values (
    pickup_row.user_id, pickup_row.id, earned_points, 'earned', 'approved',
    'SKINPoint dari pickup yang telah diverifikasi'
  );

  return earned_points;
end;
$$;

create or replace function public.admin_review_redemption(
  p_redemption_request_id uuid,
  p_decision text,
  p_admin_message text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  redemption_row public.redemption_requests%rowtype;
  changed_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_decision is null or p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  select * into redemption_row
  from public.redemption_requests
  where id = p_redemption_request_id
  for update;

  if not found or redemption_row.status <> 'pending' then
    raise exception 'Redemption request not found or already processed';
  end if;

  update public.redemption_requests
  set status = p_decision,
      admin_message = nullif(trim(coalesce(p_admin_message, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_redemption_request_id;

  update public.point_transactions
  set status = case when p_decision = 'approved' then 'approved' else 'rejected' end,
      description = case
        when p_decision = 'approved' then 'Penukaran ' || redemption_row.reward_name || ' disetujui'
        else 'Penukaran ' || redemption_row.reward_name || ' ditolak; poin dikembalikan'
      end
  where redemption_request_id = p_redemption_request_id
    and transaction_type = 'redeemed'
    and status = 'pending';

  get diagnostics changed_count = row_count;
  if changed_count = 0 then
    raise exception 'SKINPoint hold transaction not found';
  end if;

  if p_decision = 'rejected' and redemption_row.reward_id is not null then
    update public.rewards
    set stock = stock + 1
    where id = redemption_row.reward_id;
  end if;
end;
$$;

create or replace function public.admin_set_redemption_fulfillment(
  p_redemption_request_id uuid,
  p_method text,
  p_details text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
  next_status text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_method is null or p_method not in ('pickup', 'delivery') then
    raise exception 'Fulfillment method must be pickup or delivery';
  end if;

  if length(trim(coalesce(p_details, ''))) < 3 then
    raise exception 'Fulfillment instructions are required';
  end if;

  next_status := case when p_method = 'pickup' then 'ready' else 'shipped' end;

  update public.redemption_requests
  set status = next_status,
      fulfillment_method = p_method,
      fulfillment_details = trim(p_details)
  where id = p_redemption_request_id
    and status = 'approved';

  get diagnostics changed_count = row_count;
  if changed_count = 0 then
    raise exception 'Only approved redemption requests can receive fulfillment instructions';
  end if;
end;
$$;

create or replace function public.member_confirm_redemption_received(
  p_redemption_request_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.redemption_requests
  set status = 'received',
      received_at = now()
  where id = p_redemption_request_id
    and user_id = auth.uid()
    and status in ('ready', 'shipped');

  get diagnostics changed_count = row_count;
  if changed_count = 0 then
    raise exception 'This reward is not ready for receipt confirmation';
  end if;
end;
$$;

create or replace function public.admin_review_account_deletion(
  p_request_id uuid,
  p_decision text,
  p_admin_message text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_decision is null or p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  update public.account_deletion_requests
  set status = p_decision,
      admin_message = nullif(trim(coalesce(p_admin_message, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id
    and status = 'pending';

  get diagnostics changed_count = row_count;
  if changed_count = 0 then
    raise exception 'Account deletion request not found or already reviewed';
  end if;
end;
$$;

create or replace function public.admin_get_approved_point_total()
returns bigint
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  total_points bigint;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select coalesce(sum(points), 0)::bigint into total_points
  from public.point_transactions
  where status = 'approved';

  return total_points;
end;
$$;

-- -----------------------------------------------------------------------------
-- 14. FUNCTION EXECUTION PERMISSIONS
-- -----------------------------------------------------------------------------
revoke all on function public.submit_pickup_request(date, time, text, text, text, integer, integer, integer, integer, integer) from public;
revoke all on function public.get_my_point_balance() from public;
revoke all on function public.submit_redemption_request(uuid) from public;
revoke all on function public.submit_account_deletion_request(text) from public;
revoke all on function public.admin_update_pickup_status(uuid, text) from public;
revoke all on function public.admin_complete_pickup(uuid, integer, integer, integer) from public;
revoke all on function public.admin_review_redemption(uuid, text, text) from public;
revoke all on function public.admin_set_redemption_fulfillment(uuid, text, text) from public;
revoke all on function public.member_confirm_redemption_received(uuid) from public;
revoke all on function public.admin_review_account_deletion(uuid, text, text) from public;
revoke all on function public.admin_get_approved_point_total() from public;

grant execute on function public.submit_pickup_request(date, time, text, text, text, integer, integer, integer, integer, integer) to authenticated;
grant execute on function public.get_my_point_balance() to authenticated;
grant execute on function public.submit_redemption_request(uuid) to authenticated;
grant execute on function public.submit_account_deletion_request(text) to authenticated;
grant execute on function public.admin_update_pickup_status(uuid, text) to authenticated;
grant execute on function public.admin_complete_pickup(uuid, integer, integer, integer) to authenticated;
grant execute on function public.admin_review_redemption(uuid, text, text) to authenticated;
grant execute on function public.admin_set_redemption_fulfillment(uuid, text, text) to authenticated;
grant execute on function public.member_confirm_redemption_received(uuid) to authenticated;
grant execute on function public.admin_review_account_deletion(uuid, text, text) to authenticated;
grant execute on function public.admin_get_approved_point_total() to authenticated;

-- -----------------------------------------------------------------------------
-- 15. OPTIONAL REALTIME PUBLICATION FOR NOTIFICATIONS AND LANDING STATS
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.notifications;
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.landing_stats;
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end if;
end;
$$;

commit;

-- =============================================================================
-- AFTER RUNNING THIS FILE
--
-- 1. Create a normal user account using the RE-SKIN sign-up screen.
-- 2. Promote ONLY the intended administrator account from SQL Editor:
--
--    update public.profiles
--    set role = 'admin'
--    where email = 'admin@your-domain.com';
--
--    Replace the email with the exact email used for that account.
--
-- 3. In Table Editor > rewards, set points_cost and stock, then set is_active=true
--    only for rewards that are ready to be offered.
--
-- 4. Account deletion approval is not permanent deletion. Final identity
--    verification and secure Auth user deletion will be implemented separately
--    using a server-side/Edge Function; never expose service_role to the browser.
-- =============================================================================
