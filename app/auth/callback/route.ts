import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Ziel von E-Mail-Bestätigungs-, Einladungs- und Magic-Link-URLs, die
 * Supabase Auth verschickt. Tauscht den Code aus der URL gegen eine
 * echte Session (Cookies) und leitet dann in die App weiter.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
