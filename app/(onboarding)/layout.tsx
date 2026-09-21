import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nur Auth wird hier geprüft, nicht das Vorhandensein eines Haushalts
  // (das übernimmt die Seite selbst) - sonst entstünde ein Redirect-Loop
  // mit dem (app)-Layout, das bei fehlendem Haushalt genau hierher leitet.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-5">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
