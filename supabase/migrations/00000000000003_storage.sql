-- ============================================================
-- "Mein Haus" - Storage-Grundstruktur
-- Ein privater Bucket "documents". Pfadkonvention:
--   {household_id}/{document_id}/{filename}
-- Zugriff ausschließlich über serverseitig erzeugte signierte URLs
-- bzw. RLS-geprüfte Storage-Policies für eingeloggte Mitglieder.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Lesen: Mitglied des Haushalts, dessen UUID der erste Pfadbestandteil ist
create policy "documents_read_household_members"
on storage.objects for select
using (
  bucket_id = 'documents'
  and exists (
    select 1 from household_members hm
    where hm.household_id = (storage.foldername(name))[1]::uuid
    and hm.user_id = auth.uid()
  )
);

-- Schreiben (Upload): owner, admin, member (nicht read_only)
create policy "documents_insert_write_roles"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and exists (
    select 1 from household_members hm
    where hm.household_id = (storage.foldername(name))[1]::uuid
    and hm.user_id = auth.uid()
    and hm.role in ('owner','admin','member')
  )
);

-- Löschen: owner, admin
create policy "documents_delete_admin_roles"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and exists (
    select 1 from household_members hm
    where hm.household_id = (storage.foldername(name))[1]::uuid
    and hm.user_id = auth.uid()
    and hm.role in ('owner','admin')
  )
);

-- Hinweis: Der macOS-Agent (Phase 11) lädt NICHT direkt über diesen
-- Storage-Pfad hoch, sondern ausschließlich über den serverseitigen
-- Route Handler /api/import/upload, der intern denselben Bucket nutzt.
-- Diese Policies sichern also sowohl die Web-App als auch den späteren
-- Agenten-Upload-Pfad konsistent ab.
