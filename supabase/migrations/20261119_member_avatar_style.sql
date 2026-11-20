begin;

alter table public.profiles
  add column if not exists avatar_style text not null default 'female_hijab';

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, avatar_style, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when new.raw_user_meta_data ->> 'avatar_style' in ('male', 'female_hijab', 'female_no_hijab')
        then new.raw_user_meta_data ->> 'avatar_style'
      else 'female_hijab'
    end,
    new.email,
    'member'
  )
  on conflict (id) do update
    set email = excluded.email,
        avatar_style = excluded.avatar_style;
  return new;
end;
$$;

grant update (full_name, avatar_style) on public.profiles to authenticated;

commit;
