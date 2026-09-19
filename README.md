# Mein Haus – Setup-Anleitung (Phase 0)

Diese Anleitung richtet sich an dich als Nicht-Entwickler. Alle Befehle kannst du direkt kopieren und im Terminal ausführen. Jeder Schritt ist gekennzeichnet mit:

- 🟢 **Bereits im Projekt enthalten** – du musst hier nichts tun außer den Befehl auszuführen.
- 🔵 **Das musst du selbst machen** – erfordert eine Entscheidung oder einen externen Account.

---

## 1. Voraussetzungen 🔵

Installiere, falls noch nicht vorhanden:

- **Node.js 20 oder neuer** – https://nodejs.org (LTS-Version)
- **Git** – https://git-scm.com
- Ein **Supabase-Account** – https://supabase.com (kostenlos)
- Ein **Vercel-Account** – https://vercel.com (kostenlos, später für Deployment)

Prüfen, ob Node.js installiert ist:
```bash
node -v
npm -v
```

---

## 2. Projekt lokal installieren 🟢

Entpacke `mein-haus-phase0.zip` an einen Ort deiner Wahl, öffne dort ein Terminal und führe aus:

```bash
npm install
```

Das installiert alle im Projekt bereits definierten Abhängigkeiten (Next.js, Tailwind, Supabase-Client, shadcn/ui-Bausteine usw.) – nichts davon musst du selbst auswählen.

---

## 3. Supabase-Projekt anlegen 🔵

1. Auf https://supabase.com einloggen, „New Project" wählen.
2. Organisation auswählen/anlegen, Projektname z.B. `mein-haus`, ein sicheres Datenbank-Passwort setzen (aufbewahren!) und eine Region nahe an dir wählen (z.B. Frankfurt).
3. Warten, bis das Projekt bereitsteht (ca. 1–2 Minuten).
4. Im Supabase-Dashboard zu **Project Settings → API** gehen und folgende drei Werte notieren:
   - **Project URL**
   - **anon public key**
   - **service_role key** (unter „Reveal" – diesen Wert niemals teilen oder committen)

---

## 4. Environment Variables eintragen 🔵 (Datei-Vorlage 🟢 bereits enthalten)

Kopiere die Vorlage:
```bash
cp .env.local.example .env.local
```

Öffne `.env.local` in einem Texteditor und trage die drei Werte aus Schritt 3 ein:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`.env.local` wird von Git automatisch ignoriert (siehe `.gitignore`) – dieser Schritt kann also nichts versehentlich öffentlich machen, solange du die Datei nicht manuell an anderer Stelle einfügst.

---

## 5. Migrationen anwenden 🔵 (Migrationsdateien 🟢 bereits enthalten und getestet)

Am einfachsten über den **SQL Editor** im Supabase-Dashboard (kein CLI-Setup nötig):

1. Im Supabase-Dashboard: **SQL Editor → New query**.
2. Öffne `supabase/migrations/00000000000001_schema.sql` aus dem Projekt, kopiere den gesamten Inhalt, füge ihn im SQL Editor ein, klicke **Run**.
3. Wiederhole denselben Vorgang für `supabase/migrations/00000000000002_rls.sql`.
4. Wiederhole denselben Vorgang für `supabase/migrations/00000000000003_storage.sql`.

**Wichtig:** Reihenfolge exakt einhalten (`...0001` vor `...0002` vor `...0003`), da spätere Dateien auf den Tabellen der vorherigen aufbauen.

Alternative für später (optional, benötigt die Supabase CLI):
```bash
npx supabase login
npx supabase link --project-ref <dein-project-ref>
npx supabase db push
```

Nach erfolgreichem Lauf kannst du im Supabase-Dashboard unter **Table Editor** ca. 29 Tabellen sehen (u.a. `households`, `houses`, `cost_entry`, `insurance`, `document`, `recurring_cost`, `tax_classifications`).

---

## 6. Auth konfigurieren 🔵

1. Im Supabase-Dashboard: **Authentication → Providers**.
2. „Email" ist standardmäßig aktiv – das reicht für Phase 0/1 aus.
3. Unter **Authentication → URL Configuration**: Trage als „Site URL" `http://localhost:3000` ein (später zusätzlich deine Vercel-Domain, siehe Schritt 11).
4. Die eigentliche Login-Oberfläche in der App ist in Phase 0 nur ein Platzhalter – die funktionale Anmeldung folgt in Phase 1.

---

## 7. Storage konfigurieren 🟢 (bereits per Migration erledigt)

Der private Storage-Bucket `documents` sowie die zugehörigen Zugriffsregeln wurden bereits durch `00000000000003_storage.sql` angelegt. Du kannst das im Dashboard unter **Storage** prüfen – dort sollte ein Bucket namens `documents` mit dem Symbol für „privat" erscheinen. Nichts weiter zu tun.

---

## 8. Anwendung lokal starten 🟢

```bash
npm run dev
```

Öffne http://localhost:3000 im Browser. Da noch kein Login implementiert ist (Phase 1), wirst du automatisch zu `/login` weitergeleitet und siehst dort eine Platzhalterseite. Das ist erwartetes Verhalten für Phase 0.

---

## 9. Production Build testen 🟢

```bash
npm run build
npm run start
```

Der Build wurde bereits im Rahmen der Fertigstellung erfolgreich getestet (siehe Abschlussbericht). Dieser Schritt dient dir zur eigenen Bestätigung, dass alles auch in deiner Umgebung funktioniert.

---

## 10. Vercel-Projekt erstellen 🔵

1. Auf https://vercel.com einloggen, **Add New → Project**.
2. Dein Git-Repository verbinden (siehe Hinweis unten, falls du das Projekt noch nicht in einem eigenen Git-Repo hast).
3. Framework wird automatisch als „Next.js" erkannt.

**Hinweis:** Das gelieferte ZIP enthält absichtlich kein `.git`-Verzeichnis. Um es mit Vercel zu verbinden, lege selbst ein Repository an (z.B. auf GitHub) und pushe den entpackten Ordner dorthin:
```bash
git init
git add .
git commit -m "Mein Haus - Phase 0"
git branch -M main
git remote add origin <deine-repo-url>
git push -u origin main
```

---

## 11. Environment Variables in Vercel setzen 🔵

Im Vercel-Projekt unter **Settings → Environment Variables** dieselben drei Werte aus Schritt 4 eintragen:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (als „Sensitive" markieren)

Jeweils für die Umgebungen „Production", „Preview" und „Development" hinterlegen.

---

## 12. Deployment 🔵

Klicke in Vercel auf **Deploy**. Nach Abschluss erhältst du eine Live-URL (z.B. `mein-haus.vercel.app`).

Trage diese URL zusätzlich in Supabase unter **Authentication → URL Configuration → Site URL / Redirect URLs** ein, damit der spätere Login-Flow (Phase 1) auch live funktioniert.

---

## 13. Erste Anmeldung 🔵 (steht erst nach Phase 1 zur Verfügung)

Die tatsächliche Anmeldefunktion (E-Mail/Passwort) ist noch nicht implementiert – aktuell zeigt `/login` nur eine Platzhalterseite. Dieser Schritt wird nach Abschluss von Phase 1 relevant.

---

## 14. Household anlegen 🔵 (steht erst nach Phase 1 zur Verfügung)

Ebenfalls Teil von Phase 1: Nach der ersten Anmeldung legst du deinen Haushalt an und wirst automatisch als `owner` eingetragen. Weitere Haushaltsmitglieder kannst du danach unter „Einstellungen → Haushalt" einladen (Rollen: `owner`, `admin`, `member`, `read_only`).

---

## Projektstruktur auf einen Blick

```
app/(auth)/       Öffentliche Seiten (Login)
app/(app)/         Geschützte Seiten (Dashboard, Kosten, ...)
components/ui/      shadcn/ui-Bausteine
components/layout/   Sidebar, mobile Navigation
lib/supabase/        Server-/Browser-/Admin-Clients, Middleware
supabase/migrations/ Datenbankschema, RLS, Storage
```

## Bei Problemen

- **`npm run build` schlägt fehl:** Prüfe, ob `.env.local` existiert und alle drei Supabase-Werte enthält.
- **Migrationsfehler im SQL Editor:** Stelle sicher, dass du die Dateien in der Reihenfolge `0001 → 0002 → 0003` ausgeführt hast und keine der drei übersprungen wurde.
- **`/dashboard` zeigt nach Login nichts an:** Erwartet für Phase 0 – die eigentlichen Bereiche werden erst in Phase 1 und folgenden implementiert; aktuell siehst du dort absichtlich nur Platzhalter mit Hinweis auf die jeweilige Phase.
