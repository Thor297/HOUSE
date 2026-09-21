# „Mein Haus" – Architektur- und Planungsdokument (v4)

**Status: Phase 0 und Phase 1 abgeschlossen und validiert.** Dieses Dokument beschreibt den *tatsächlichen* Stand des Projekts. Wo etwas noch nicht implementiert ist, steht das hier ausdrücklich so.

Kanonische Quelle für das Datenbankschema sind die realen, getesteten Migrationsdateien unter `supabase/migrations/` – nicht dieses Dokument.

---

## 0. Änderungsprotokoll Phase 1 gegenüber Phase 0

| Bereich | Änderung |
|---|---|
| Schema | Neue Migration `00000000000004_profiles.sql`: `profiles`-Tabelle (Name/E-Mail für die UI, per Trigger automatisch aus `auth.users` befüllt) sowie die Datenbankfunktion `create_household_with_owner` (atomare Haushalts-Erstellung inkl. Owner-Mitgliedschaft). |
| Datenbanktypen | `types/database.types.ts` von einem Platzhalter auf echte, handgepflegte Typen für `households`, `household_members`, `profiles` umgestellt (inkl. des von `supabase-js` 2.116 zwingend geforderten `Relationships`-Felds je Tabelle). |
| Auth | Echte Supabase-Auth-Integration: Login, Registrierung, Abmelden, E-Mail-Bestätigungs-/Einladungs-Callback. Platzhalterseiten aus Phase 0 vollständig ersetzt. |
| Household-Flow | Neuer Onboarding-Bereich (`/household`, eigene Route Group `(onboarding)`): Nutzer ohne Haushalt werden dorthin geleitet und legen dort ihren ersten Haushalt an. |
| Mitgliederverwaltung | `/einstellungen/haushalt` ist jetzt funktional: Mitgliederliste mit Namen/E-Mail, Einladen per E-Mail (neue wie bestehende Nutzer), Rolle ändern, Mitglied entfernen – inklusive Schutz gegen das Entfernen/Degradieren des letzten Owners. |
| Dashboard | Zeigt jetzt den echten Haushaltsnamen und die eigene Rolle statt eines Platzhaltertexts. |
| Navigation | `AppHeader` neu: zeigt Haushaltsname + E-Mail, Link zu den Haushaltseinstellungen, Abmelden-Button. |
| Middleware | `/signup` und `/auth/*` als öffentliche Routen ergänzt (Registrierung und E-Mail-Callback müssen ohne bestehende Session erreichbar sein). |

---

## 1. Finale Architektur (Ergänzung Phase 1)

```
                     iPhone/iPad/Mac (Browser)
                              │
                   ┌──────────▼──────────┐
                   │   Next.js 16 (App Router) │
                   │  Server Components/        │
                   │  Server Actions             │
                   └──────────┬──────────┘
                              │
              ┌───────────────┼────────────────┐
              │ RLS-Client     │  Admin-Client (nur für Invite)
              │ (lib/supabase/server.ts)        │ (lib/supabase/admin.ts)
              ▼                                  ▼
   ┌────────────────────┐            ┌────────────────────────┐
   │ Supabase Postgres    │            │ Supabase Auth Admin API │
   │ (RLS-gebunden)        │            │ (Service Role, nur      │
   │                        │            │  serverseitig)          │
   └────────────────────┘            └────────────────────────┘
```

Der Admin-Client wird in Phase 1 **ausschließlich** für zwei eng abgegrenzte, privilegierte Vorgänge verwendet, jeweils mit vorheriger Rollenprüfung über den normalen RLS-Client:
1. Nachschlagen, ob zu einer E-Mail-Adresse bereits ein Profil existiert (Tabelle `profiles`, für die ein Client mit `anon`-Key keinen Zugriff auf beliebige E-Mail-Suche hätte)
2. Versenden einer Einladung über `auth.admin.inviteUserByEmail` (erfordert zwingend den Service-Role-Key, gibt es in der Supabase-Auth-API nicht anders)

Das eigentliche Einfügen der `household_members`-Zeile läuft bewusst über den normalen RLS-Client, nicht über den Admin-Client – die bereits in Phase 0 gebaute RLS-Policy (owner/admin dürfen Mitglieder hinzufügen) greift damit unverändert, ohne Sonderlogik.

### Auth-Flow im Detail

```
Registrierung (/signup)
  → supabase.auth.signUp()
  → Trigger legt automatisch profiles-Zeile an
  → Session vorhanden? → /onboarding/household (Haushalt anlegen)
  → keine Session (E-Mail-Bestätigung aktiv)? → Hinweistext, Bestätigungsmail
       → Klick auf Link in Mail → /auth/callback?code=...
       → exchangeCodeForSession() → Session gesetzt → /dashboard

Login (/login)
  → supabase.auth.signInWithPassword() → /dashboard

Einladung eines Mitglieds
  → Owner/Admin füllt Formular in /einstellungen/haushalt
  → Server Action prüft Berechtigung (RLS-Client)
  → Admin-Client: bestehendes Profil? → direkt household_members-Zeile anlegen
                  kein Profil? → inviteUserByEmail() → household_members-Zeile mit neuer user_id
  → Eingeladene Person erhält Mail mit Link → /auth/callback → Session → /dashboard
```

---

## 2. Finale Projektstruktur (Ergänzung Phase 1)

```
mein-haus/
├── app/
│   ├── auth/
│   │   └── callback/route.ts          # NEU – Code-Austausch für E-Mail-/Invite-Links
│   ├── (auth)/
│   │   ├── login/page.tsx             # ersetzt: echte Anmeldung
│   │   └── signup/page.tsx            # NEU – echte Registrierung
│   ├── (onboarding)/                  # NEU – eigene Route Group
│   │   ├── layout.tsx                 # prüft nur Auth, nicht Haushalt
│   │   └── household/page.tsx         # erster Haushalt anlegen
│   └── (app)/
│       ├── layout.tsx                 # erweitert: Haushalts-Prüfung + AppHeader
│       ├── dashboard/page.tsx         # ersetzt: echte Daten statt Platzhalter
│       └── einstellungen/haushalt/page.tsx  # ersetzt: echte Mitgliederverwaltung
├── components/
│   ├── ui/{input,label}.tsx           # NEU
│   ├── layout/app-header.tsx          # NEU
│   ├── auth/{login-form,signup-form}.tsx        # NEU
│   ├── onboarding/create-household-form.tsx     # NEU
│   └── settings/{invite-member-form,member-row-actions}.tsx  # NEU
├── lib/
│   ├── data/households.ts             # NEU – Datenzugriffsschicht
│   └── actions/{types,auth,households}.ts       # NEU – Server Actions
├── types/database.types.ts            # NEU befüllt (war Platzhalter)
└── supabase/migrations/
    └── 00000000000004_profiles.sql    # NEU
```

---

## 3. Datenmodell-Ergänzung: `profiles`

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Wird ausschließlich per `security definer`-Trigger (`handle_new_user`, ausgelöst durch `after insert on auth.users`) befüllt – kein Client-seitiger Insert nötig oder erlaubt. RLS erlaubt Lesen des eigenen Profils immer, fremder Profile nur bei gemeinsamer Haushaltsmitgliedschaft; Schreiben nur am eigenen Profil.

`create_household_with_owner(p_name text)` ist eine `security definer`-Funktion, die `households`- und `household_members`-Insert in einem einzigen, atomaren Aufruf kapselt – verhindert strukturell, dass ein Haushalt ohne Owner entstehen kann.

---

## 4. Security/RLS – Validierungsstand nach Phase 1

Getestet gegen dieselbe Art lokaler PostgreSQL-16-Instanz wie in Phase 0:

| Prüfung | Ergebnis |
|---|---|
| Alle vier Migrationen in Reihenfolge auf leerer DB | ✅ Exit Code 0 |
| Fachliche Tabellen ohne aktivierte RLS | **0** (weiterhin, inkl. `profiles`) |
| Gesamtzahl Policies | **121** (119 aus Phase 0 + 2 neue für `profiles`) |
| Trigger `handle_new_user` | ✅ funktional getestet: `auth.users`-Insert erzeugt automatisch passende `profiles`-Zeile |
| Funktion `create_household_with_owner` | ✅ funktional getestet: legt Household + Owner-Mitgliedschaft an; leerer Name wird korrekt abgelehnt |
| Service-Role-Key nur in `lib/supabase/admin.ts` referenziert | ✅ (statische Codeprüfung) |
| Kein `"use client"`-Modul importiert `lib/supabase/admin.ts` | ✅ (0 Treffer) |
| `inviteUserByEmail` nur in `lib/actions/households.ts` (serverseitig) verwendet | ✅ (0 Treffer außerhalb) |

---

## 5. Tatsächlicher Phase-1-Status

### Implementiert
- Registrierung, Login, Abmelden (Supabase Auth, E-Mail/Passwort)
- E-Mail-Bestätigungs-/Einladungs-Callback (`/auth/callback`)
- Erster Haushalt anlegen (Onboarding-Flow für Nutzer ohne Haushalt)
- Mitglieder einladen (neue Nutzer per E-Mail-Einladung, bestehende Nutzer direkt hinzugefügt)
- Rolle ändern, Mitglied entfernen – inklusive Schutz des letzten Owners
- Echtes Dashboard (Haushaltsname, eigene Rolle)
- `AppHeader` mit Haushaltsname, Einstellungen-Link, Abmelden

### Bewusst nicht umgesetzt (kein Vorziehen späterer Phasen)
- Kein Umschalter zwischen mehreren Haushalten (Phase 1 verwendet immer den ältesten Haushalt des Nutzers) – eine bewusste Vereinfachung, kein Bug; bei Bedarf in einer späteren Phase nachrüstbar, ohne das Datenmodell zu ändern (das unterstützt mehrere Haushalte pro Nutzer bereits vollständig)
- Kein Profilbild/erweitertes Profil-Editing über `full_name` hinaus
- Keine Passwort-Zurücksetzen-Funktion (kein expliziter Bestandteil des Phase-1-Auftrags; Supabase Auth unterstützt das serverseitig bereits, UI folgt bei Bedarf)

---

## 6. Bekannte Einschränkungen

- Wie in Phase 0: Alle Tests liefen gegen eine lokale, generische PostgreSQL-16-Instanz mit minimalem Mock der Supabase-Systemschemas. Der komplette Auth-Flow (echte E-Mail-Zustellung, echte Einladungs-Mails, echtes `exchangeCodeForSession` gegen einen echten Supabase-Auth-Server) konnte **nicht live getestet werden**, da kein echtes Supabase-Projekt in dieser Umgebung erreichbar ist. Build, TypeScript, Lint und alle Redirect-/Middleware-Pfade wurden dagegen real geprüft (siehe Abschlussbericht).
- Die Rollenprüfung beim Einladen/Ändern/Entfernen läuft serverseitig in der Server Action *und* zusätzlich über RLS (Verteidigung in der Tiefe) – wurde nur gegen die lokale Testdatenbank verifiziert, nicht gegen eine reale Auth-Session.

---

## 7. Phasenplan (unverändert, Phase 1 jetzt abgeschlossen)

✅ Phase 0 – Fundament & vollständiges Basis-Schema
✅ Phase 1 – Auth & Household-Verwaltung

Phase 2 – Haus & Anlagen
Phase 3 – Dokumente (manueller Upload)
Phase 4 – Kosten
Phase 5 – Versicherungen
Phase 6 – Wartungen & Termine
Phase 7 – Dashboard & globale Suche
Phase 8 – Steuerberater-Export
Phase 9 – Generische Import-Pipeline (serverseitig, ohne Agent)
Phase 10 – KI-Dokumentenanalyse
Phase 11 – macOS-Import-Agent (iCloud Drive)
Phase 12 – KI-Haus-Assistent
Phase 13 – iOS Share Extension
Phase 14 – E-Mail-Import
Phase 15 – Politur, PWA, Performance, Barrierefreiheit

---

## 8. Manuell notwendige Einrichtung nach Phase 1

Zusätzlich zu den Schritten aus der README (Supabase-Projekt, Migrationen, Vercel):

1. **Migration `00000000000004_profiles.sql` einspielen** (im Supabase SQL Editor, nach den drei bestehenden Dateien, in genau dieser Reihenfolge)
2. **E-Mail-Templates prüfen**: Supabase-Dashboard → Authentication → Email Templates – Standardvorlagen funktionieren, können aber bei Bedarf auf Deutsch angepasst werden
3. **E-Mail-Bestätigung ein/aus**: Authentication → Providers → Email – „Confirm email" steuert, ob nach der Registrierung sofort eine Session existiert oder erst nach Bestätigung
4. **`NEXT_PUBLIC_APP_URL`** in Vercel auf die tatsächliche Produktions-URL setzen (wird für Einladungs-/Bestätigungslinks verwendet)
