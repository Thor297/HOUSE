import { redirect } from "next/navigation";

/**
 * "/" ist kein eigener Einstiegspunkt, sondern leitet immer auf
 * /dashboard weiter. Die eigentliche Auth-Entscheidung übernehmen
 * Middleware (lib/supabase/middleware.ts, schneller Redirect ohne
 * Rendern) und zusätzlich das (app)-Layout (serverseitige Absicherung):
 *
 * - Nicht eingeloggt: Middleware fängt bereits "/" ab und leitet auf
 *   /login um, bevor diese Seite überhaupt rendert.
 * - Eingeloggt: Middleware lässt durch, hier erfolgt der Redirect auf
 *   /dashboard, das (app)-Layout rendert normal.
 *
 * Es entsteht dadurch kein Redirect-Loop: /login redirected niemals
 * zurück auf "/", und "/dashboard" redirected nur auf "/login", nie
 * auf sich selbst oder auf "/".
 */
export default function RootPage() {
  redirect("/dashboard");
}
