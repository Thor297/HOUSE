-- ============================================================
-- "Mein Haus" - Initiale Schema-Migration (v4)
-- Ausführungsreihenfolge geprüft: jede Tabelle referenziert nur
-- bereits existierende Tabellen. Einziger Zyklus (document <->
-- document_import_jobs) wird per ALTER TABLE aufgelöst.
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ============================================================
-- 1. HOUSEHOLD, MEMBERS, HOUSES
-- ============================================================
create table households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type household_role as enum ('owner', 'admin', 'member', 'read_only');

create table household_members (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role household_role not null default 'member',
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table houses (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  street text, postal_code text, city text, country text default 'DE',
  build_year int,
  living_area_sqm numeric(8,2),
  plot_area_sqm numeric(8,2),
  purchase_date date,
  purchase_price numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table area (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid not null references houses(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. ASSET
-- ============================================================
create type asset_status as enum ('aktiv', 'inaktiv', 'ersetzt', 'entsorgt');

create table asset (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid not null references houses(id) on delete cascade,
  area_id uuid references area(id) on delete set null,
  name text not null,
  category text not null,
  manufacturer text, model text, serial_number text,
  purchase_date date, purchase_price numeric(12,2),
  warranty_until date, expected_lifetime_years int,
  status asset_status not null default 'aktiv',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. COST CATEGORY
-- ============================================================
create table cost_category (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  is_tax_relevant boolean not null default false,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

-- ============================================================
-- 4. INSURANCE + CLAIM  (erweitert: Ergänzung 3)
-- ============================================================
create type insurance_type as enum
  ('wohngebaeude','hausrat','haftpflicht','rechtsschutz','elementarschaden','sonstige');

create type cancellation_deadline_type as enum (
  'vor_hauptfaelligkeit',   -- X Monate vor main_due_month/day (Standardfall)
  'festes_datum',           -- exaktes Datum pro Vertragsjahr
  'nach_mindestlaufzeit',   -- erst kündbar nach Ablauf einer Erstlaufzeit
  'jederzeit'                -- monatlich/jederzeit kündbar
);

create table insurance (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  house_id uuid references houses(id) on delete set null,
  type insurance_type not null,
  provider text not null,
  tariff text,                          -- Tarifbezeichnung
  policy_number text,
  policyholder text,                    -- Versicherungsnehmer (kann von household-Mitglied abweichen)
  annual_premium numeric(12,2),
  payment_interval text,
  start_date date,
  end_date date,

  -- Hauptfälligkeit als wiederkehrendes Datum (Monat/Tag), nicht als fixes
  -- Kalenderdatum, da sie jedes Jahr wiederkehrt
  main_due_month smallint check (main_due_month between 1 and 12),
  main_due_day smallint check (main_due_day between 1 and 31),

  -- Kündigungsfrist: bewusst nicht nur "X Monate", sondern typisiert,
  -- weil reale Verträge unterschiedliche Muster haben
  cancellation_deadline_type cancellation_deadline_type not null default 'vor_hauptfaelligkeit',
  cancellation_period_months int,        -- genutzt bei 'vor_hauptfaelligkeit'
  cancellation_fixed_date date,          -- genutzt bei 'festes_datum' (aktueller Vertragszyklus)
  min_contract_end_date date,            -- genutzt bei 'nach_mindestlaufzeit'
  next_cancellation_deadline date,       -- berechnet/gepflegt per Trigger bzw. Anwendung, siehe unten

  auto_renewal boolean not null default true,
  insured_sum numeric(14,2),
  default_deductible numeric(12,2),

  contact_name text,
  contact_phone text,
  contact_email text,
  website text,

  coverage_summary text,                -- grobe Freitext-Zusammenfassung; Details siehe insurance_coverage
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index insurance_next_cancellation_idx on insurance (next_cancellation_deadline);

-- Automatische Berechnung von next_cancellation_deadline für den
-- Standardfall 'vor_hauptfaelligkeit'. Für 'festes_datum' und
-- 'nach_mindestlaufzeit' wird der jeweils gepflegte Wert direkt
-- übernommen; für 'jederzeit' bleibt das Feld leer (kein fixer Termin).
create or replace function calculate_insurance_next_cancellation_deadline()
returns trigger
language plpgsql
as $fn$
declare
  v_due date;
begin
  if new.cancellation_deadline_type = 'vor_hauptfaelligkeit'
     and new.main_due_month is not null
     and new.main_due_day is not null
     and new.cancellation_period_months is not null then

    v_due := make_date(extract(year from current_date)::int, new.main_due_month, new.main_due_day);
    if v_due <= current_date then
      v_due := make_date(extract(year from current_date)::int + 1, new.main_due_month, new.main_due_day);
    end if;

    new.next_cancellation_deadline := (v_due - (new.cancellation_period_months || ' months')::interval)::date;

    if new.next_cancellation_deadline < current_date then
      v_due := v_due + interval '1 year';
      new.next_cancellation_deadline := (v_due - (new.cancellation_period_months || ' months')::interval)::date;
    end if;

  elsif new.cancellation_deadline_type = 'festes_datum' then
    new.next_cancellation_deadline := new.cancellation_fixed_date;

  elsif new.cancellation_deadline_type = 'nach_mindestlaufzeit' then
    new.next_cancellation_deadline := new.min_contract_end_date;

  else
    new.next_cancellation_deadline := null;
  end if;

  return new;
end;
$fn$;

create trigger insurance_calc_cancellation_deadline
  before insert or update on insurance
  for each row execute function calculate_insurance_next_cancellation_deadline();

create table insurance_claim (
  id uuid primary key default uuid_generate_v4(),
  insurance_id uuid not null references insurance(id) on delete cascade,
  event_date date not null,
  description text,
  claimed_amount numeric(12,2),
  paid_amount numeric(12,2),
  status text default 'offen',
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. MAINTENANCE TASK
-- ============================================================
create type maintenance_interval as enum
  ('einmalig','monatlich','quartalsweise','halbjaehrlich','jaehrlich','individuell');

create table maintenance_task (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  asset_id uuid references asset(id) on delete set null,
  title text not null,
  interval maintenance_interval not null default 'jaehrlich',
  interval_months int,
  next_due_date date,
  last_done_date date,
  responsible text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 6. RECURRING COST  (NEU, Ergänzung 4)
--    braucht: households, houses, cost_category, asset, insurance
--    -- WICHTIG: recurring_cost ist eine Regel/Vorlage. Sie erzeugt
--    -- höchstens neue cost_entry-Zeilen, verändert aber NIE
--    -- bestehende. cost_entry.recurring_cost_id verweist optional auf
--    -- die erzeugende Regel; das Umgekehrte gibt es bewusst nicht.
-- ============================================================
create type recurring_interval as enum
  ('monatlich','quartalsweise','halbjaehrlich','jaehrlich','individuell');

create table recurring_cost (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  house_id uuid references houses(id) on delete set null,
  category_id uuid not null references cost_category(id),
  asset_id uuid references asset(id) on delete set null,
  insurance_id uuid references insurance(id) on delete set null,
  description text not null,
  vendor text,                          -- Zahlungsempfänger
  amount numeric(12,2) not null,
  interval recurring_interval not null default 'jaehrlich',
  interval_months int,                  -- nur bei 'individuell': beliebiger Monatsabstand
  start_date date not null,
  end_date date,
  next_due_date date not null,
  is_active boolean not null default true,
  auto_create_cost_entry boolean not null default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_cost_individuell_needs_months
    check (interval <> 'individuell' or interval_months is not null)
);
create index recurring_cost_next_due_idx on recurring_cost (next_due_date) where is_active;
create index recurring_cost_household_idx on recurring_cost (household_id);

-- ============================================================
-- 7. COST ENTRY  (erweitert: Ergänzung 1 + Verknüpfung zu recurring_cost)
-- ============================================================
create type cost_direction as enum ('ausgabe', 'einnahme');

create table cost_entry (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  house_id uuid references houses(id) on delete set null,          -- NEU (Ergänzung 1)
  category_id uuid not null references cost_category(id),
  asset_id uuid references asset(id) on delete set null,
  insurance_id uuid references insurance(id) on delete set null,
  maintenance_task_id uuid references maintenance_task(id) on delete set null,
  recurring_cost_id uuid references recurring_cost(id) on delete set null,  -- Herkunft, rein informativ
  direction cost_direction not null default 'ausgabe',
  amount numeric(12,2) not null,
  currency text not null default 'EUR',
  booking_date date not null,
  vendor text,
  description text,
  is_tax_relevant boolean not null default false,
  tax_year int,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cost_entry_house_idx on cost_entry (house_id);
create index cost_entry_household_year_idx on cost_entry (household_id, tax_year);
create index cost_entry_recurring_idx on cost_entry (recurring_cost_id);

create table maintenance_log (
  id uuid primary key default uuid_generate_v4(),
  maintenance_task_id uuid not null references maintenance_task(id) on delete cascade,
  performed_date date not null,
  performed_by text,
  cost_entry_id uuid references cost_entry(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8. APPOINTMENT
-- ============================================================
create table appointment (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  related_asset_id uuid references asset(id) on delete set null,
  related_maintenance_id uuid references maintenance_task(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 9. DOCUMENT  (erweitert: Ergänzung 2; import_job_id folgt per ALTER TABLE)
-- ============================================================
create type document_type as enum
  ('rechnung','vertrag','garantie','gutachten','foto','behoerdlich','sonstige');
create type document_review_status as enum ('zu_pruefen', 'bestaetigt');

create table document (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  house_id uuid references houses(id) on delete set null,   -- NEU (Ergänzung 2), primäre Immobilie
  title text not null,
  type document_type not null default 'sonstige',
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  sha256 text not null,
  document_date date,
  tags text[] default '{}',
  search_vector tsvector,
  review_status document_review_status not null default 'bestaetigt',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- import_job_id wird per ALTER TABLE ergänzt (siehe Block 11)
);
create unique index document_household_sha256_uidx on document (household_id, sha256);
create index document_search_idx on document using gin (search_vector);
create index document_house_idx on document (house_id);

create table document_link (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references document(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (document_id, entity_type, entity_id)
);
create index document_link_entity_idx on document_link (entity_type, entity_id);

-- ============================================================
-- 10. IMPORT-QUELLEN & GERÄTE
-- ============================================================
create type import_source_type as enum
  ('manual_upload', 'icloud', 'email', 'scanner', 'ios_share', 'future_cloud_source');

create table import_sources (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  type import_source_type not null,
  name text not null,
  config jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table agent_devices (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  import_source_id uuid references import_sources(id) on delete set null,
  device_name text not null,
  public_key_fingerprint text,
  status text not null default 'active',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- ============================================================
-- 11. DOCUMENT IMPORT JOBS  (danach: ALTER TABLE document, löst Zyklus)
-- ============================================================
create type import_job_status as enum (
  'detected', 'uploading', 'uploaded',
  'analyzing', 'review_required', 'completed',
  'duplicate', 'failed'
);

create table document_import_jobs (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  import_source_id uuid not null references import_sources(id),
  agent_device_id uuid references agent_devices(id) on delete set null,
  original_filename text not null,
  original_path text,
  mime_type text,
  file_size bigint,
  sha256 text not null,
  status import_job_status not null default 'detected',
  detected_at timestamptz not null default now(),
  uploaded_at timestamptz,
  processing_started_at timestamptz,
  processed_at timestamptz,
  document_id uuid references document(id) on delete set null,
  error_message text,
  retry_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index import_jobs_household_status_idx on document_import_jobs (household_id, status);
create index import_jobs_sha256_idx on document_import_jobs (household_id, sha256);

alter table document
  add column import_job_id uuid references document_import_jobs(id) on delete set null;

-- ============================================================
-- 12. DOCUMENT AI SUGGESTIONS
-- ============================================================
create table document_ai_suggestions (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references document(id) on delete cascade,
  extracted_data jsonb not null,
  suggested_category_id uuid references cost_category(id),
  suggested_asset_id uuid references asset(id),
  suggested_insurance_id uuid references insurance(id),
  suggested_tax_relevant boolean,
  confidence numeric(4,3),
  model_version text,
  status text not null default 'vorschlag',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 13. STEUER-DOMÄNE
-- ============================================================
create table tax_categories (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (household_id, key)
);
create unique index tax_categories_system_key_uidx on tax_categories (key) where household_id is null;

insert into tax_categories (key, name, is_system) values
  ('handwerkerleistungen', 'Handwerkerleistungen', true),
  ('haushaltsnahe_dienstleistungen', 'Haushaltsnahe Dienstleistungen', true),
  ('energetische_massnahmen', 'Energetische Maßnahmen', true),
  ('arbeitszimmer_homeoffice', 'Arbeitszimmer / Homeoffice', true),
  ('internet_telefon', 'Internet / Telefon', true),
  ('photovoltaik', 'Photovoltaik', true),
  ('vermietung_verpachtung', 'Vermietung / Verpachtung', true),
  ('versicherungen', 'Versicherungen', true),
  ('spenden', 'Spenden', true),
  ('kinderbetreuung', 'Kinderbetreuung', true),
  ('werbungskosten', 'Werbungskosten', true),
  ('aussergewoehnliche_belastungen', 'Außergewöhnliche Belastungen', true),
  ('sonstige', 'Sonstige', true);

create type tax_relevance_status as enum ('ja', 'nein', 'unklar');
create type tax_usage_type as enum ('privat', 'beruflich', 'gemischt');
create type tax_classification_review_status as enum
  ('ki_vorschlag', 'zu_pruefen', 'bestaetigt', 'abgelehnt');

create table tax_classifications (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  cost_entry_id uuid references cost_entry(id) on delete set null,
  tax_category_id uuid not null references tax_categories(id),
  tax_year int not null,
  title text not null,
  tax_relevant tax_relevance_status not null default 'unklar',
  usage_type tax_usage_type not null default 'privat',
  total_amount numeric(12,2),
  tax_relevant_amount numeric(12,2),
  deductible_percentage numeric(5,2),
  labor_cost numeric(12,2),
  travel_cost numeric(12,2),
  machine_cost numeric(12,2),
  material_cost numeric(12,2),
  vat_amount numeric(12,2),
  payment_date date,
  payment_method text,
  has_payment_evidence boolean not null default false,
  has_receipt boolean not null default false,
  review_status tax_classification_review_status not null default 'zu_pruefen',
  advisor_note text,
  source text not null default 'manuell',
  exported_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tax_classifications_household_year_idx on tax_classifications (household_id, tax_year);

create table tax_classification_documents (
  id uuid primary key default uuid_generate_v4(),
  tax_classification_id uuid not null references tax_classifications(id) on delete cascade,
  document_id uuid not null references document(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tax_classification_id, document_id)
);

create table payment_evidence (
  id uuid primary key default uuid_generate_v4(),
  tax_classification_id uuid not null references tax_classifications(id) on delete cascade,
  document_id uuid references document(id) on delete set null,
  payment_method text,
  evidence_date date,
  amount numeric(12,2),
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 14. STEUERBERATER-EXPORT
-- ============================================================
create table tax_exports (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  is_delta boolean not null default false,
  zip_storage_path text,
  pdf_summary_path text,
  xlsx_summary_path text,
  csv_summary_path text,
  status text not null default 'erstellt',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table tax_export_items (
  id uuid primary key default uuid_generate_v4(),
  tax_export_id uuid not null references tax_exports(id) on delete cascade,
  tax_classification_id uuid references tax_classifications(id) on delete set null,
  document_id uuid references document(id) on delete set null,
  cost_entry_id uuid references cost_entry(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 15. VERSICHERUNGSLEISTUNGEN
-- ============================================================
create type insurance_coverage_status as enum
  ('covered', 'limited', 'not_covered', 'unclear');

create table insurance_coverage (
  id uuid primary key default uuid_generate_v4(),
  insurance_id uuid not null references insurance(id) on delete cascade,
  coverage_type text not null,
  status insurance_coverage_status not null default 'unclear',
  coverage_limit numeric(12,2),
  deductible numeric(12,2),
  conditions text,
  restrictions text,
  exclusions text,
  notes text,
  source_document_id uuid references document(id) on delete set null,
  source_page int,
  source_section text,
  source_excerpt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index insurance_coverage_insurance_idx on insurance_coverage (insurance_id);

-- ============================================================
-- 16. KI-HAUS-ASSISTENT (Phase 12)
-- ============================================================
create table ai_conversation (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  title text,
  created_at timestamptz not null default now()
);

create table ai_message (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references ai_conversation(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 17. AUDIT LOG
-- ============================================================
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
