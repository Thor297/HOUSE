-- ============================================================
-- "Mein Haus" - Row Level Security
-- Drei-Stufen-Muster: lesen (alle Mitglieder) / schreiben
-- (owner, admin, member) / löschen (owner, admin). read_only
-- ist damit automatisch auf reines Lesen beschränkt.
-- ============================================================

-- ------------------------------------------------------------
-- HOUSEHOLDS (Wurzel: kein household_id-Feld, sondern id selbst)
-- ------------------------------------------------------------
alter table households enable row level security;

create policy "households_select" on households for select
using (exists (
  select 1 from household_members hm
  where hm.household_id = households.id and hm.user_id = auth.uid()
));

create policy "households_insert" on households for insert
with check (auth.uid() is not null);
-- Hinweis: Die Anlage der ersten household_members-Zeile (als owner)
-- erfolgt im selben serverseitigen Vorgang wie die Erstellung des
-- Haushalts (Server Action), damit kein Haushalt ohne Owner entsteht.

create policy "households_update" on households for update
using (exists (
  select 1 from household_members hm
  where hm.household_id = households.id and hm.user_id = auth.uid()
  and hm.role in ('owner','admin')
))
with check (exists (
  select 1 from household_members hm
  where hm.household_id = households.id and hm.user_id = auth.uid()
  and hm.role in ('owner','admin')
));

create policy "households_delete" on households for delete
using (exists (
  select 1 from household_members hm
  where hm.household_id = households.id and hm.user_id = auth.uid()
  and hm.role = 'owner'
));

-- ------------------------------------------------------------
-- HOUSEHOLD_MEMBERS
-- ------------------------------------------------------------
alter table household_members enable row level security;

create policy "household_members_select" on household_members for select
using (exists (
  select 1 from household_members hm2
  where hm2.household_id = household_members.household_id and hm2.user_id = auth.uid()
));

create policy "household_members_insert" on household_members for insert
with check (
  user_id = auth.uid()  -- Selbstanlage als owner bei Haushaltserstellung
  or exists (
    select 1 from household_members hm2
    where hm2.household_id = household_members.household_id and hm2.user_id = auth.uid()
    and hm2.role in ('owner','admin')
  )
);

create policy "household_members_update" on household_members for update
using (exists (
  select 1 from household_members hm2
  where hm2.household_id = household_members.household_id and hm2.user_id = auth.uid()
  and hm2.role in ('owner','admin')
))
with check (exists (
  select 1 from household_members hm2
  where hm2.household_id = household_members.household_id and hm2.user_id = auth.uid()
  and hm2.role in ('owner','admin')
));

create policy "household_members_delete" on household_members for delete
using (
  user_id = auth.uid()
  or exists (
    select 1 from household_members hm2
    where hm2.household_id = household_members.household_id and hm2.user_id = auth.uid()
    and hm2.role in ('owner','admin')
  )
);

-- ------------------------------------------------------------
-- TAX_CATEGORIES (Sonderfall: household_id nullable = Systemstandard)
-- ------------------------------------------------------------
alter table tax_categories enable row level security;

create policy "tax_categories_select" on tax_categories for select
using (
  household_id is null
  or exists (
    select 1 from household_members hm
    where hm.household_id = tax_categories.household_id and hm.user_id = auth.uid()
  )
);

create policy "tax_categories_insert" on tax_categories for insert
with check (
  household_id is not null
  and exists (
    select 1 from household_members hm
    where hm.household_id = tax_categories.household_id and hm.user_id = auth.uid()
    and hm.role in ('owner','admin','member')
  )
);

create policy "tax_categories_update" on tax_categories for update
using (
  is_system = false
  and exists (
    select 1 from household_members hm
    where hm.household_id = tax_categories.household_id and hm.user_id = auth.uid()
    and hm.role in ('owner','admin','member')
  )
)
with check (
  is_system = false
  and exists (
    select 1 from household_members hm
    where hm.household_id = tax_categories.household_id and hm.user_id = auth.uid()
    and hm.role in ('owner','admin','member')
  )
);

create policy "tax_categories_delete" on tax_categories for delete
using (
  is_system = false
  and exists (
    select 1 from household_members hm
    where hm.household_id = tax_categories.household_id and hm.user_id = auth.uid()
    and hm.role in ('owner','admin')
  )
);

-- ------------------------------------------------------------
-- Tabellen mit direktem household_id-Feld: generisches 4-Policy-Muster
-- ------------------------------------------------------------
do $do$
declare
  tbl text;
  direct_tables text[] := array[
    'houses','cost_category','insurance','maintenance_task','recurring_cost',
    'cost_entry','appointment','document','import_sources','agent_devices',
    'document_import_jobs','tax_classifications','tax_exports',
    'ai_conversation','audit_log'
  ];
begin
  foreach tbl in array direct_tables loop
    execute format('alter table %I enable row level security;', tbl);

    execute format($f$
      create policy "%1$s_select" on %1$I for select using (
        exists (select 1 from household_members hm
                where hm.household_id = %1$I.household_id and hm.user_id = auth.uid())
      );
    $f$, tbl);

    execute format($f$
      create policy "%1$s_insert" on %1$I for insert with check (
        exists (select 1 from household_members hm
                where hm.household_id = %1$I.household_id and hm.user_id = auth.uid()
                and hm.role in ('owner','admin','member'))
      );
    $f$, tbl);

    execute format($f$
      create policy "%1$s_update" on %1$I for update using (
        exists (select 1 from household_members hm
                where hm.household_id = %1$I.household_id and hm.user_id = auth.uid()
                and hm.role in ('owner','admin','member'))
      ) with check (
        exists (select 1 from household_members hm
                where hm.household_id = %1$I.household_id and hm.user_id = auth.uid()
                and hm.role in ('owner','admin','member'))
      );
    $f$, tbl);

    execute format($f$
      create policy "%1$s_delete" on %1$I for delete using (
        exists (select 1 from household_members hm
                where hm.household_id = %1$I.household_id and hm.user_id = auth.uid()
                and hm.role in ('owner','admin'))
      );
    $f$, tbl);
  end loop;
end;
$do$;

-- ------------------------------------------------------------
-- Tabellen ohne direktes household_id-Feld: Zugriff über die
-- jeweilige Elterntabelle (die selbst household_id besitzt)
-- ------------------------------------------------------------
do $do$
declare
  i int;
  children text[] := array[
    'area','asset','insurance_claim','maintenance_log','document_link',
    'document_ai_suggestions','tax_classification_documents','payment_evidence',
    'tax_export_items','insurance_coverage','ai_message'
  ];
  fkcols text[] := array[
    'house_id','house_id','insurance_id','maintenance_task_id','document_id',
    'document_id','tax_classification_id','tax_classification_id',
    'tax_export_id','insurance_id','conversation_id'
  ];
  parents text[] := array[
    'houses','houses','insurance','maintenance_task','document',
    'document','tax_classifications','tax_classifications',
    'tax_exports','insurance','ai_conversation'
  ];
  tbl text; fkcol text; parent text;
begin
  for i in 1 .. array_length(children,1) loop
    tbl := children[i]; fkcol := fkcols[i]; parent := parents[i];
    execute format('alter table %I enable row level security;', tbl);

    execute format($f$
      create policy "%1$s_select" on %1$I for select using (
        exists (select 1 from %2$I p join household_members hm on hm.household_id = p.household_id
                where p.id = %1$I.%3$I and hm.user_id = auth.uid())
      );
    $f$, tbl, parent, fkcol);

    execute format($f$
      create policy "%1$s_insert" on %1$I for insert with check (
        exists (select 1 from %2$I p join household_members hm on hm.household_id = p.household_id
                where p.id = %1$I.%3$I and hm.user_id = auth.uid()
                and hm.role in ('owner','admin','member'))
      );
    $f$, tbl, parent, fkcol);

    execute format($f$
      create policy "%1$s_update" on %1$I for update using (
        exists (select 1 from %2$I p join household_members hm on hm.household_id = p.household_id
                where p.id = %1$I.%3$I and hm.user_id = auth.uid()
                and hm.role in ('owner','admin','member'))
      ) with check (
        exists (select 1 from %2$I p join household_members hm on hm.household_id = p.household_id
                where p.id = %1$I.%3$I and hm.user_id = auth.uid()
                and hm.role in ('owner','admin','member'))
      );
    $f$, tbl, parent, fkcol);

    execute format($f$
      create policy "%1$s_delete" on %1$I for delete using (
        exists (select 1 from %2$I p join household_members hm on hm.household_id = p.household_id
                where p.id = %1$I.%3$I and hm.user_id = auth.uid()
                and hm.role in ('owner','admin'))
      );
    $f$, tbl, parent, fkcol);
  end loop;
end;
$do$;
