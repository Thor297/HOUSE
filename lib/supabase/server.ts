import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database.types";

/**
 * RLS-gebundener Supabase-Client für Server Components und Server Actions.
 *
 * Läuft im Namen des eingeloggten Nutzers (Session-Cookie) – niemals mit
 * dem Service-Role-Key. Das ist der Standard-Datenzugriff für die gesamte
 * Anwendung; siehe lib/data/* und lib/actions/*.
 *
 * Muss innerhalb eines Request-Kontexts (Server Component, Route Handler,
 * Server Action) aufgerufen werden, da next/headers benötigt wird.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll wird auch aus Server Components aufgerufen, wo das
            // Setzen von Cookies nicht erlaubt ist. Das ist unkritisch,
            // solange die Middleware (lib/supabase/middleware.ts) die
            // Session zuverlässig aktuell hält.
          }
        },
      },
    }
  );
}
