import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Service-Role-Client – umgeht Row Level Security vollständig.
 *
 * NUR für klar abgegrenzte, privilegierte Server-Operationen verwenden,
 * z.B. den Steuerberater-Export (Phase 8) oder Agent-Device-Verwaltung
 * (Phase 11). Jede Verwendung MUSS die Berechtigung des aufrufenden
 * Nutzers vorher explizit selbst prüfen (Rollen-Check gegen
 * household_members), da RLS hier nicht mehr greift.
 *
 * Das `server-only`-Paket sorgt dafür, dass ein versehentlicher Import
 * aus einer Client Component bereits beim Build fehlschlägt.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
