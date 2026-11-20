-- RE-SKIN: Google OAuth profile completion and member gender/avatar preference
-- Run once in Supabase Dashboard > SQL Editor.

begin;

alter table public.profiles
  add column if not exists gender text,
  add column if not exists privacy_consent_at timestamptz,
  add column if not exists privacy_policy_version text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_gender_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_gender_check
      check (gender is null or gender in ('male', 'female'));
  end if;
end;
$$;

-- Extend the existing profile trigger so email/password registrations can
-- store the avatar/gender choices supplied at sign-up. Google users choose
-- these details on the first-login profile setup screen.
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

-- Keep profile edits limited to the signed-in user's own row via the existing
-- RLS policy; this grant only adds the gender column to the allowed update set.
grant update (full_name, avatar_style, gender, privacy_consent_at, privacy_policy_version) on public.profiles to authenticated;

commit;
