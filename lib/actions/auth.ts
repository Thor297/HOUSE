"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";

export async function signIn(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-Mail und Passwort sind erforderlich." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.",
    };
  }

  redirect("/dashboard");
}

export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password) {
    return { error: "E-Mail und Passwort sind erforderlich." };
  }
  if (password.length < 8) {
    return { error: "Das Passwort muss mindestens 8 Zeichen lang sein." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: "Registrierung fehlgeschlagen: " + error.message };
  }

  // Wenn das Supabase-Projekt E-Mail-Bestätigung verlangt, existiert an
  // dieser Stelle noch keine Session - der Nutzer muss erst den Link in
  // der Bestätigungsmail öffnen (führt zu /auth/callback).
  if (data.session) {
    redirect("/onboarding/household");
  }

  return {
    message:
      "Fast geschafft: Bitte bestätige deine E-Mail-Adresse über den Link, den wir dir gerade geschickt haben.",
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
