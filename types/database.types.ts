/**
 * Handgepflegte Supabase-Datenbanktypen für die in der Anwendung
 * tatsächlich verwendeten Tabellen/Funktionen.
 *
 * Deckt aktuell ab: households, household_members, profiles sowie die
 * RPC-Funktion create_household_with_owner (alles, was der Code aus
 * Phase 0/1 anspricht). Weitere Tabellen aus dem vollständigen Schema
 * (supabase/migrations/) werden ergänzt, sobald der jeweilige Bereich
 * implementiert wird.
 *
 * Sobald ein echtes Supabase-Projekt existiert, kann diese Datei durch
 * die generierten Typen ersetzt werden:
 *
 *   npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type HouseholdRole = "owner" | "admin" | "member" | "read_only";

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: HouseholdRole;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: HouseholdRole;
          invited_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: HouseholdRole;
          invited_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_household_with_owner: {
        Args: { p_name: string };
        Returns: string;
      };
    };
    Enums: {
      household_role: HouseholdRole;
    };
  };
};
