import { createClient } from "@/lib/supabase/server";
import type { HouseholdRole } from "@/types/database.types";

export type HouseholdMembership = {
  role: HouseholdRole;
  household: {
    id: string;
    name: string;
    created_at: string;
  };
};

/**
 * Alle Haushalte, denen der aktuell eingeloggte Nutzer angehört,
 * inklusive seiner Rolle je Haushalt. RLS filtert bereits serverseitig
 * auf die eigenen Mitgliedschaften; der explizite user_id-Filter dient
 * nur der Lesbarkeit der Query.
 *
 * Gibt ein leeres Array zurück, wenn kein Nutzer eingeloggt ist oder
 * noch kein Haushalt existiert (z.B. direkt nach der Registrierung).
 */
export async function getUserHouseholds(): Promise<HouseholdMembership[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (membershipError) throw membershipError;
  if (!memberships || memberships.length === 0) return [];

  const householdIds = memberships.map((m) => m.household_id);
  const { data: households, error: householdError } = await supabase
    .from("households")
    .select("id, name, created_at")
    .in("id", householdIds);
  if (householdError) throw householdError;

  return memberships
    .map((m) => {
      const household = households?.find((h) => h.id === m.household_id);
      if (!household) return null;
      return { role: m.role, household };
    })
    .filter((m): m is HouseholdMembership => m !== null);
}

/** Der "aktive" Haushalt für Phase 1: der älteste, dem der Nutzer angehört.
 *  Ein Umschalter zwischen mehreren Haushalten ist keine Phase-1-Funktion. */
export async function getCurrentHousehold(): Promise<HouseholdMembership | null> {
  const memberships = await getUserHouseholds();
  return memberships[0] ?? null;
}

export type HouseholdMemberWithProfile = {
  id: string;
  role: HouseholdRole;
  created_at: string;
  user_id: string;
  profile: { email: string; full_name: string | null } | null;
};

/** Mitgliederliste eines Haushalts inklusive Profildaten (Name/E-Mail). */
export async function getHouseholdMembers(
  householdId: string
): Promise<HouseholdMemberWithProfile[]> {
  const supabase = await createClient();
  const { data: members, error: memberError } = await supabase
    .from("household_members")
    .select("id, role, created_at, user_id")
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });
  if (memberError) throw memberError;
  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  return members.map((m) => ({
    ...m,
    profile: profiles?.find((p) => p.id === m.user_id) ?? null,
  }));
}
