import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Hält die Supabase-Session bei jedem Request aktuell (Token-Refresh).
 * Wird von der Root-Middleware (middleware.ts) für alle Routen im
 * geschützten Bereich (app/(app)/**) aufgerufen.
 *
 * Leitet nicht eingeloggte Nutzer auf /login um. Die eigentliche
 * Berechtigungsprüfung pro Datensatz übernimmt weiterhin RLS – diese
 * Middleware ist nur der schnelle "ist überhaupt eingeloggt"-Check für
 * eine gute UX (sofortiger Redirect statt leerer Seiten).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/auth");
  const isProtectedRoute =
    !isPublicRoute && !request.nextUrl.pathname.startsWith("/api");

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
