-- RE-SKIN public landing-page statistics
-- Run once in Supabase SQL Editor for an existing RE-SKIN database.
-- Exposes aggregate counters only; no personal or transaction rows are public.

begin;

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

alter table public.landing_stats enable row level security;

drop policy if exists "Anyone can read public landing stats" on public.landing_stats;
create policy "Anyone can read public landing stats"
  on public.landing_stats for select to anon, authenticated
  using (true);

grant select on public.landing_stats to anon, authenticated;
revoke insert, update, delete on public.landing_stats from anon, authenticated;

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

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
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
