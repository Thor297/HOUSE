-- ============================================================
-- "Mein Haus" - Phase 1: Profiles + Household-Erstellung
-- ============================================================

-- ------------------------------------------------------------
-- PROFILES
-- Spiegelt minimale, für die UI nötige Informationen aus
-- auth.users (E-Mail, Name), damit Mitgliederlisten ohne
-- Service-Role-Zugriff im Client dargestellt werden können.
-- Wird automatisch per Trigger bei jeder Neuregistrierung befüllt.
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Lesen: eigenes Profil immer, fremde Profile nur bei gemeinsamem Haushalt
create policy "profiles_select" on profiles for select
using (
  id = auth.uid()
  or exists (
    select 1 from household_members hm1
    join household_members hm2 on hm1.household_id = hm2.household_id
    where hm1.user_id = auth.uid() and hm2.user_id = profiles.id
  )
);

-- Schreiben: nur das eigene Profil (Name), E-Mail bleibt Auth-gesteuert.
-- Insert erfolgt ausschließlich über den Trigger (Security Definer),
-- daher keine Insert-Policy für Clients nötig (Default: verweigert).
create policy "profiles_update_own" on profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Trigger: bei jeder Neuregistrierung automatisch ein Profil anlegen
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Atomare Household-Erstellung
-- Erstellt Household + Owner-Mitgliedschaft in einem Funktionsaufruf,
-- damit nie ein Haushalt ohne Owner entstehen kann (kein zweistufiger
-- Client-seitiger Insert nötig).
-- ------------------------------------------------------------
create or replace function create_household_with_owner(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_household_id uuid;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Haushaltsname darf nicht leer sein';
  end if;

  insert into households (name) values (trim(p_name))
  returning id into v_household_id;

  insert into household_members (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'owner');

  return v_household_id;
end;
$fn$;
