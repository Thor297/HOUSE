import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";

/**
 * Supabase-Client für Client Components (z.B. interaktive Formulare mit
 * Live-Updates). Nutzt denselben anon key wie der Server-Client – RLS
 * greift identisch, es gibt keinen erweiterten Zugriff im Browser.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
