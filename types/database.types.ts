/**
 * Platzhalter für die generierten Supabase-Datenbanktypen.
 *
 * Sobald das Supabase-Projekt angelegt und die Migrationen aus
 * supabase/migrations/ angewendet wurden, wird diese Datei ersetzt durch:
 *
 *   npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.types.ts
 *
 * Bis dahin ist `Database` bewusst minimal gehalten, damit die
 * Supabase-Clients (lib/supabase/*) bereits typisiert kompilieren.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
