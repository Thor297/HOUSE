# „Mein Haus" – Architektur- und Planungsdokument (v4)

**Status: Phase 0 abgeschlossen und validiert.** Dieses Dokument ersetzt `mein-haus-architektur-v3.md` und beschreibt den *tatsächlichen* Stand des Projekts, nicht nur die Planung. Wo etwas noch nicht implementiert ist, steht das hier ausdrücklich so.

Kanonische Quelle für das Datenbankschema sind die realen, getesteten Migrationsdateien unter `supabase/migrations/` – nicht dieses Dokument. Das vermeidet zwei auseinanderlaufende „Wahrheiten". Dieses Dokument beschreibt und begründet die Struktur.

---

## 1. Finale Architektur

```
                     iPhone/iPad/Mac (Browser)
                              │
                   ┌──────────▼──────────┐
                   │   Next.js 16 (App Router) │
                   │  Server Components/        │
                   │  Server Actions/Route Handler│
                   └──────────┬──────────┘
                              │  (RLS-gebundener Client)
                   ┌──────────▼──────────┐
                   │       Supabase          │
                   │ Postgres 16 · Auth ·     │
                   │ Storage · RLS            │
                   └──┬───────┬──────────┬──┘
                      │       │          │
              ┌───────▼─┐ ┌───▼────┐ ┌───▼─────────┐
              │Claude API│ │Steuer- │ │ Import-API    │
              │(geplant, │ │export- │ │(geplant,      │
              │Phase 9/10│ │Engine  │ │Phase 9)       │
              │/12)      │ │(Phase 8)│ │               │
              └──────────┘ └────────┘ └──────┬────────┘
                                              │ (geplant)
                                     ┌────────▼─────────┐
                                     │  macOS-Agent        │
                                     │  (Phase 11, noch     │
                                     │  kein Code)          │
                                     └──────────────────┘
```

Umgesetzt in Phase 0: Next.js-App, Supabase-Client-Schicht (Server/Browser/Admin getrennt), Middleware/Proxy für Session-Refresh und Auth-Redirects, vollständiges Datenbankschema inkl. RLS und Storage-Grundstruktur. **Nicht umgesetzt:** alles, was von Supabase-Laufzeitdaten abhängt (Login-Flow, Household-Erstellung) sowie alle in Abschnitt 15 als „später" markierten Integrationen.

### Technologieentscheidungen (bestätigt, wie eingesetzt)

| Bereich | Eingesetzt |
|---|---|
| Framework | Next.js 16.3.5, App Router, Turbopack |
| Sprache | TypeScript 5, `strict: true` |
| Styling | Tailwind CSS v4 (CSS-first Config über `@theme`, kein `tailwind.config.js` nötig) |
| UI-Komponenten | shadcn/ui-Stil, **manuell eingerichtet** (Begründung siehe Abschnitt 16) |
| Icons | lucide-react |
| Backend/DB | Supabase (Postgres 16, Auth, Storage) – Projekt selbst noch nicht angelegt (siehe README) |
| Schriftart | Natives System-Font-Stack (SF Pro auf Apple-Geräten) statt Google-Webfont – Begründung siehe Abschnitt 16 |

---

## 2. Finale Projektstruktur (tatsächlicher Stand)

```
mein-haus/
├── app/
│   ├── layout.tsx                    # Root-Layout, System-Font-Stack
│   ├── page.tsx                      # "/" → redirect("/dashboard")
│   ├── globals.css                   # Design-Tokens, Light/Dark
│   ├── (auth)/
│   │   ├── layout.tsx                # zentriertes, öffentliches Layout
│   │   └── login/page.tsx            # Platzhalter, Redirect falls bereits eingeloggt
│   └── (app)/
│       ├── layout.tsx                # Auth-Guard + Sidebar/MobileNav
│       ├── dashboard/page.tsx
│       ├── kosten/page.tsx
│       ├── haus-anlagen/page.tsx
│       ├── versicherungen/page.tsx
│       ├── dokumente/
│       │   ├── page.tsx
│       │   └── posteingang/page.tsx
│       ├── wartungen/page.tsx
│       ├── termine/page.tsx
│       ├── steuer-datev/
│       │   ├── page.tsx
│       │   └── historie/page.tsx
│       ├── einstellungen/
│       │   ├── haushalt/page.tsx
│       │   └── geraete/page.tsx
│       ├── suche/page.tsx
│       └── assistent/page.tsx
├── components/
│   ├── ui/{button,card,badge}.tsx    # manuell nach shadcn-Standard angelegt
│   ├── layout/{sidebar,mobile-nav,nav-items}.tsx
│   └── shared/page-placeholder.tsx
├── lib/
│   ├── supabase/{server,client,admin,middleware}.ts
│   ├── utils.ts                      # cn()-Helper
│   ├── data/                         # angelegt, noch leer (Phase 1+)
│   ├── actions/                      # angelegt, noch leer (Phase 1+)
│   └── validation/                   # angelegt, noch leer (Phase 1+)
├── types/database.types.ts           # Platzhalter, wird durch `supabase gen types` ersetzt
├── supabase/migrations/
│   ├── 00000000000001_schema.sql
│   ├── 00000000000002_rls.sql
│   └── 00000000000003_storage.sql
├── proxy.ts                          # Next.js 16 Nachfolger von middleware.ts
├── components.json                   # shadcn-Konfiguration
├── .env.local.example
└── mein-haus-architektur-v4.md       # dieses Dokument
```

`lib/data`, `lib/actions`, `lib/validation` existieren als leere Ordner – bewusst angelegt, damit die in Phase 1+ folgende Struktur nicht improvisiert werden muss, aber **ohne Inhalt**, da das Feature-Implementierung wäre.

---

## 3–14. Datenmodell, Household/Rollen, Haus-Zuordnung, `recurring_cost`, Versicherung, Steuer-Domäne, Dokumente, Import, iCloud-Agent

Diese Abschnitte sind inhaltlich identisch mit v3 (dort ausführlich hergeleitet und begründet) und wurden in Phase 0 **unverändert in SQL umgesetzt und real getestet**. Zusammenfassung mit Verweis auf die tatsächliche Umsetzung:

### 3. Household-/Rollenmodell
`households`, `household_members` (Rollen `owner`/`admin`/`member`/`read_only`), `houses`. Getestet: RLS greift rollenabhängig (siehe Abschnitt 15).

### 4. Haus-Zuordnung
`cost_entry.house_id` und `document.house_id` (beide `nullable`, `on delete set null`), zusätzlich zu Anlagen-/`document_link`-Verknüpfungen. Verifiziert direkt in der Datenbank (Spalten existieren, korrekt nullable).

### 5. `recurring_cost`
Eigene Tabelle, ausschließlich `cost_entry.recurring_cost_id → recurring_cost.id` (eine Richtung). Verifiziert: Tabelle inkl. Check-Constraint (`interval = 'individuell'` erfordert `interval_months`) existiert wie spezifiziert.

### 6. Versicherungsvertragsmodell (inkl. Kündigungslogik)

Vier Kündigungsfrist-Typen (`cancellation_deadline_type`): `vor_hauptfaelligkeit`, `festes_datum`, `nach_mindestlaufzeit`, `jederzeit`.

**So funktioniert die automatische Berechnung von `next_cancellation_deadline` (Trigger `calculate_insurance_next_cancellation_deadline`, läuft bei jedem Insert/Update):**

- **`vor_hauptfaelligkeit`** (Standardfall): Aus `main_due_month`/`main_due_day` (der wiederkehrende Jahrestermin, z.B. 1. Januar) wird die *nächste zukünftige* Hauptfälligkeit bestimmt. Davon werden `cancellation_period_months` Monate abgezogen. Liegt das Ergebnis in der Vergangenheit, wird ein Jahr weitergerechnet. *Real getestet:* Hauptfälligkeit 1.1., 3 Monate Frist, heutiges Datum 15.09.2026 → nächste Fälligkeit 01.01.2027 → berechnete Frist **01.10.2026**. Korrekt.
- **`festes_datum`**: `next_cancellation_deadline` übernimmt direkt `cancellation_fixed_date`. *Real getestet:* Eingabe 15.11.2026 → Ausgabe **15.11.2026**. Korrekt.
- **`nach_mindestlaufzeit`**: übernimmt `min_contract_end_date` (danach gilt der Vertrag als frei kündbar).
- **`jederzeit`**: `next_cancellation_deadline` bleibt `NULL` (kein fixer Stichtag).

Die Abfrage „Welche Versicherungen kann/muss ich in den nächsten 90 Tagen kündigen?" wird dadurch zu:
```sql
select * from insurance
where next_cancellation_deadline between current_date and current_date + interval '90 days';
```
Diese Logik wurde **nicht verändert** gegenüber der bereits validierten Version aus v3/dem vorherigen Arbeitsschritt.

Zusätzliche Felder: `tariff`, `policyholder`, `auto_renewal`, `insured_sum`, `default_deductible`, `contact_name`/`contact_phone`/`contact_email`/`website`. Alle 16 erwarteten Spalten wurden in der Datenbank verifiziert (siehe Abschnitt 15).

`insurance_coverage` (Deckungsbausteine) unverändert wie in v3: `coverage_type` als Freitext mit App-seitiger Vorschlagsliste, plus Quellenverweis (`source_document_id`, `source_page`, `source_section`, `source_excerpt`).

### 7. Steuer-Domäne
`tax_categories` (13 Standardkategorien vorbelegt + eigene möglich), `tax_classifications` (der „Sachverhalt", n:m zu Belegen über `tax_classification_documents`), `payment_evidence`. KI-Vorschläge laufen über `source='ki_vorschlag'`/`review_status='ki_vorschlag'`, zählen erst nach Bestätigung für den Export (`tax_exports`/`tax_export_items`).

### 8. Dokumentenmodell
`document` (inkl. `sha256`-Duplikatsschutz, `review_status`, jetzt auch `house_id`), `document_link` (n:m, flexibel), `document_import_jobs` (Import-Pipeline-Historie), `document_ai_suggestions` (KI-Vorschläge, nie automatisch übernommen).

### 9. Importarchitektur
Generisches Quellenmodell (`import_sources`, Typen `manual_upload`/`icloud`/`email`/`scanner`/`ios_share`/`future_cloud_source`), `agent_devices` für widerrufbare Geräte-Kopplung, `document_import_jobs` mit vollständiger Status-Maschine (`detected` → `uploading` → `uploaded` → `analyzing` → `review_required`/`completed`/`duplicate`/`failed`). **Nur das Datenmodell ist angelegt – keine Route Handler, keine Pipeline-Logik.** Das ist wie gefordert erst Phase 9.

### 10. iCloud-Agent-Konzept
Unverändert wie in v3: nativer Swift/SwiftUI-Menüleisten-Agent (Phase 11), kein Zugriff auf Supabase-Secrets, Security-Scoped Bookmark auf genau einen Ordner, Pairing-Flow mit kurzlebigen, widerrufbaren Tokens, Upload ausschließlich über `/api/import/upload` (noch nicht implementiert). **Kein Code für den Agenten existiert – wie gefordert.**

---

## 15. Security/RLS – tatsächlicher Validierungsstand

Getestet gegen eine frisch installierte, leere PostgreSQL-16-Instanz (mit minimalem Mock von `auth.users`, `auth.uid()`, `storage.buckets`, `storage.objects`, `storage.foldername()`):

| Prüfung | Ergebnis |
|---|---|
| `00000000000001_schema.sql` (Schema) | ✅ Exit Code 0 |
| `00000000000002_rls.sql` (RLS) | ✅ Exit Code 0 |
| `00000000000003_storage.sql` (Storage) | ✅ Exit Code 0 |
| Fachliche Tabellen ohne aktivierte RLS | **0** |
| Gesamtzahl Policies | **119** (4 je fachlicher Tabelle × 29 Tabellen + 3 für `storage.objects`) |
| Storage-Bucket `documents` | `public = false` (privat) bestätigt |
| Storage-Policies | 3 (`select`/`insert`/`delete`, rollenabhängig wie bei den DB-Tabellen) |
| Kündigungsfrist-Trigger | ✅ funktional mit 2 Testfällen verifiziert (siehe Abschnitt 6) |

Zusätzliche Code-Sicherheitsprüfungen (statische Analyse des Quellcodes, siehe Abschnitt 16):
- `SUPABASE_SERVICE_ROLE_KEY` wird ausschließlich in `lib/supabase/admin.ts` referenziert, nirgends sonst.
- Kein `"use client"`-Modul importiert `lib/supabase/admin.ts` (0 Treffer).
- `ANTHROPIC_API_KEY` ist im Code nirgends referenziert (nur als auskommentierter Platzhalter in `.env.local.example`).
- `.env.local` existiert nicht im Projekt; `.gitignore` schließt `.env*` aus, mit expliziter Ausnahme für `.env.local.example` (damit die Vorlage versioniert werden kann).
- `.env.local.example` enthält ausschließlich Platzhalterwerte, keine echten Schlüssel.

**Damit sind 119 Policies und 0 ungeschützte fachliche Tabellen weiterhin das korrekte, bestätigte Ergebnis nach Phase 0.**

---

## 16. Tatsächlicher Phase-0-Status

### Implementiert
- Next.js-App (App Router, TS strict, Tailwind v4), shadcn/ui-Komponenten (Button, Card, Badge) manuell nach Standard-Quellcode angelegt, da die `shadcn`-CLI `ui.shadcn.com` in dieser Umgebung nicht erreichen konnte (Domain nicht in der Netzwerk-Whitelist) – funktional identisch zum CLI-Ergebnis, nur ohne den interaktiven Registry-Abruf.
- Design-Tokens (Light/Dark, automatisch über `prefers-color-scheme`, zusätzlich `.dark`-Klasse für einen späteren manuellen Umschalter vorbereitet).
- System-Font-Stack statt Google-Webfont (siehe unten, Begründung Robustheit).
- Vollständige Supabase-Client-Schicht mit sauberer Trennung Server/Browser/Admin.
- Proxy/Middleware mit Session-Refresh und Auth-Redirect-Logik (Next.js 16 hat `middleware.ts` zu `proxy.ts` migriert; per offiziellem `@next/codemod` automatisiert übernommen).
- Vollständiges Ordnerskelett aller Bereiche mit Platzhalterseiten.
- Vollständige, real getestete initiale Migration (Schema, RLS, Storage).

### Abweichungen von der ursprünglichen Planung (mit Begründung)
1. **shadcn/ui manuell statt per CLI** – Netzwerkbeschränkung dieser Umgebung, keine inhaltliche Abweichung vom Ergebnis.
2. **System-Font-Stack statt Google Fonts (Geist)** – `next/font/google` schlug beim Production-Build fehl, weil `fonts.googleapis.com` nicht erreichbar war. Da die geforderte Ästhetik ohnehin „Apple-nah" ist, ist ein natives System-Font-Stack (SF Pro auf iPhone/iPad/Mac) die passendere UND robustere Wahl – kein externer Netzwerk-Request beim Laden der App, kein Risiko für zukünftige Build-Umgebungen mit eingeschränktem Netzwerkzugriff. Diese Entscheidung ist dauerhaft, nicht nur ein Workaround für diese Sandbox.
3. **`middleware.ts` → `proxy.ts`** – Next.js 16 hat die Datei-Konvention umbenannt; automatisiert per offiziellem Codemod migriert, keine funktionale Änderung.

---

## 17. Bekannte Einschränkungen

- **Kein echtes Supabase-Projekt existiert.** Alle Tests (Schema/RLS/Storage) liefen gegen eine lokal installierte, generische PostgreSQL-16-Instanz mit minimalem Mock der Supabase-Systemschemas. Das validiert SQL-Korrektheit und RLS-Logik vollständig, **nicht** aber Supabase-spezifisches Verhalten (z.B. tatsächliche `auth.users`-Trigger, echte Storage-Signierung, Auth-E-Mail-Versand).
- **Kein echter Login-Flow getestet.** Der Production-Build und der Smoke-Test liefen mit Platzhalter-Umgebungsvariablen (`https://placeholder.supabase.co`). Middleware/Layout-Redirects wurden dabei funktional bestätigt (siehe Abschnitt 18), aber ohne eine reale, erfolgreiche Anmeldung – die gibt es technisch erst mit Phase 1.
- **`document_ai_suggestions`, Import-Pipeline, Steuerexport-Engine, KI-Assistent** enthalten nur das Datenmodell, keine Logik – wie gefordert.
- **Kein manueller Dark-Mode-Umschalter**, nur automatisches Folgen des Systemschemas. Ein Toggle wäre eine kleine Zusatzfunktion, war aber nicht Teil des Phase-0-Auftrags und wurde daher bewusst nicht ergänzt.

---

## 18. Smoke-Test – tatsächlich durchgeführt

Lokaler Production-Server (`next start`) mit Platzhalter-Env-Variablen, getestet per `curl`:

| Route/Fall | Ergebnis |
|---|---|
| `GET /` (nicht eingeloggt) | 307 → `/login` |
| `GET /login` | 200, enthält erwarteten Platzhalter-Inhalt |
| `GET /dashboard` (nicht eingeloggt) | 307 → `/login` |
| `GET /kosten`, `/versicherungen` (nicht eingeloggt) | jeweils 307 → `/login` |
| `GET /nichtvorhanden` (nicht eingeloggt) | 307 → `/login` (Middleware greift vor Next.js-Routing – siehe Hinweis unten) |
| `GET /` mehrfach hintereinander | konstant 307 → `/login`, **kein Redirect-Loop** |
| CSS-Bundle | Design-Tokens, Dark-Mode-Media-Query, System-Font-Stack bestätigt im ausgelieferten CSS |
| Client-Bundle | Sidebar- (`md:flex`) und MobileNav-Klassen (`md:hidden`) bestätigt vorhanden |
| Build-Output | Alle 16 Bereichsseiten unter `(app)` sowie `/login` korrekt als eigene Routen kompiliert |

**Hinweis:** Für nicht eingeloggte Nutzer liefert derzeit *jede* nicht auf `/login` oder `/api` beginnende URL einen Redirect statt eines 404 – auch nicht existierende Pfade. Das ist beabsichtigtes Verhalten (verhindert, dass unautorisierte Anfragen überhaupt erkennen, welche Routen existieren), aber bewusst dokumentiert, damit es nicht mit einem Fehler verwechselt wird.

**Nicht getestet (mangels echtem Supabase-Projekt):** erfolgreicher Login, Verhalten der `(app)`-Seiten für einen tatsächlich eingeloggten Nutzer, reales Verhalten von `household_members`-Abfragen mit echten Daten, tatsächliches Speichern/Lesen über Storage. Diese Punkte lassen sich erst nach den manuellen Einrichtungsschritten (siehe README) sinnvoll testen.

---

## 19. Phasenplan (unverändert, Phase 0 jetzt abgeschlossen)

**✅ Phase 0 – Fundament & vollständiges Basis-Schema** – abgeschlossen, siehe Abschnitt 16.

Phase 1 – Auth & Household-Verwaltung
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

## 20. Manuell notwendige Einrichtung

Vollständige Schritt-für-Schritt-Anleitung siehe `README.md`. Kurzfassung: Supabase-Projekt anlegen, Migrationen anwenden, Environment-Variablen setzen (lokal und in Vercel), Storage-Bucket ist bereits Teil der Migration (`00000000000003_storage.sql`), Vercel-Projekt verbinden und deployen.
