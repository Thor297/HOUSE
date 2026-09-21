import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUserHouseholds } from "@/lib/data/households";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AppHeader } from "@/components/layout/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zusätzliche serverseitige Absicherung neben der Middleware: Ein
  // Server-Component-Layout, das ohne gültige Session niemals rendert,
  // schützt auch dann, wenn die Middleware aus irgendeinem Grund
  // übersprungen würde.
  if (!user) {
    redirect("/login");
  }

  const memberships = await getUserHouseholds();
  if (memberships.length === 0) {
    redirect("/onboarding/household");
  }

  // Phase 1: kein Umschalter zwischen mehreren Haushalten, es zählt
  // immer der älteste (siehe lib/data/households.ts).
  const current = memberships[0];

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader
          householdName={current.household.name}
          userEmail={user.email ?? ""}
        />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
