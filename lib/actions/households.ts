"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/actions/types";
import type { HouseholdRole } from "@/types/database.types";

const MANAGE_ROLES: HouseholdRole[] = ["owner", "admin"];
const ASSIGNABLE_ROLES: HouseholdRole[] = [
  "owner",
  "admin",
  "member",
  "read_only",
];

export async function createHousehold(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Bitte einen Namen für den Haushalt angeben." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Atomare Erstellung (Household + Owner-Mitgliedschaft) über die
  // Datenbankfunktion aus 00000000000004_profiles.sql - so kann nie ein
  // Haushalt ohne Owner entstehen.
  const { error } = await supabase.rpc("create_household_with_owner", {
    p_name: name,
  });

  if (error) {
    return { error: "Haushalt konnte nicht erstellt werden." };
  }

  redirect("/dashboard");
}

async function requireHouseholdManager(householdId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !MANAGE_ROLES.includes(membership.role)) {
    return { supabase, user, allowed: false as const };
  }

  return { supabase, user, allowed: true as const };
}

export async function inviteMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const householdId = String(formData.get("householdId") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const roleInput = String(formData.get("role") ?? "member");
  const role = ASSIGNABLE_ROLES.includes(roleInput as HouseholdRole)
    ? (roleInput as HouseholdRole)
    : "member";

  if (!householdId || !email) {
    return { error: "E-Mail-Adresse ist erforderlich." };
  }

  const ctx = await requireHouseholdManager(householdId);
  if (!ctx.allowed) {
    return { error: "Keine Berechtigung, Mitglieder einzuladen." };
  }

  const admin = createAdminClient();

  // Zuerst prüfen, ob bereits ein Profil (= bestehender Nutzer) mit
  // dieser E-Mail existiert - dann direkt hinzufügen statt erneut
  // einzuladen.
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let targetUserId = existingProfile?.id;

  if (!targetUserId) {
    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      });
    if (inviteError || !invited.user) {
      return {
        error:
          "Einladung konnte nicht versendet werden. Ist die E-Mail-Adresse korrekt?",
      };
    }
    targetUserId = invited.user.id;
  }

  const { error: insertError } = await ctx.supabase
    .from("household_members")
    .insert({
      household_id: householdId,
      user_id: targetUserId,
      role,
      invited_by: ctx.user.id,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "Diese Person ist bereits Mitglied dieses Haushalts." };
    }
    return { error: "Mitglied konnte nicht hinzugefügt werden." };
  }

  revalidatePath("/einstellungen/haushalt");
  return { message: "Einladung gesendet." };
}

export async function updateMemberRole(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const householdId = String(formData.get("householdId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const roleInput = String(formData.get("role") ?? "");

  if (!ASSIGNABLE_ROLES.includes(roleInput as HouseholdRole)) {
    return { error: "Ungültige Rolle." };
  }
  const role = roleInput as HouseholdRole;

  const ctx = await requireHouseholdManager(householdId);
  if (!ctx.allowed) {
    return { error: "Keine Berechtigung." };
  }

  if (role !== "owner") {
    const { data: target } = await ctx.supabase
      .from("household_members")
      .select("role")
      .eq("id", memberId)
      .single();

    if (target?.role === "owner") {
      const { count } = await ctx.supabase
        .from("household_members")
        .select("id", { count: "exact", head: true })
        .eq("household_id", householdId)
        .eq("role", "owner");
      if ((count ?? 0) <= 1) {
        return { error: "Der letzte Owner kann nicht degradiert werden." };
      }
    }
  }

  const { error } = await ctx.supabase
    .from("household_members")
    .update({ role })
    .eq("id", memberId)
    .eq("household_id", householdId);

  if (error) {
    return { error: "Rolle konnte nicht geändert werden." };
  }

  revalidatePath("/einstellungen/haushalt");
  return { message: "Rolle aktualisiert." };
}

export async function removeMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const householdId = String(formData.get("householdId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");

  const ctx = await requireHouseholdManager(householdId);
  if (!ctx.allowed) {
    return { error: "Keine Berechtigung." };
  }

  const { data: target } = await ctx.supabase
    .from("household_members")
    .select("role")
    .eq("id", memberId)
    .single();

  if (target?.role === "owner") {
    const { count } = await ctx.supabase
      .from("household_members")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("role", "owner");
    if ((count ?? 0) <= 1) {
      return { error: "Der letzte Owner kann nicht entfernt werden." };
    }
  }

  const { error } = await ctx.supabase
    .from("household_members")
    .delete()
    .eq("id", memberId)
    .eq("household_id", householdId);

  if (error) {
    return { error: "Mitglied konnte nicht entfernt werden." };
  }

  revalidatePath("/einstellungen/haushalt");
  return { message: "Mitglied entfernt." };
}
