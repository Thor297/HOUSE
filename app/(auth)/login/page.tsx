import { redirect } from "next/navigation";
import { Home } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LoginPage() {
  // Bereits eingeloggte Nutzer sollen /login nicht sehen, auch wenn sie
  // die URL direkt aufrufen (die Middleware lässt sie hier bewusst
  // durch, siehe lib/supabase/middleware.ts). Kein Loop: /dashboard
  // redirected nie zurück auf /login, solange ein Nutzer eingeloggt ist.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Home className="size-5" />
        </div>
        <CardTitle>Mein Haus</CardTitle>
        <CardDescription>Anmeldung folgt in Phase 1</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Badge variant="secondary">Phase 1</Badge>
        <p className="text-center text-sm text-muted-foreground">
          Supabase-Auth-Integration (E-Mail/Passwort, Household-Erstellung,
          Mitgliederverwaltung) wird in Phase 1 umgesetzt. Dieses Grundgerüst
          bestätigt lediglich, dass Routing, Middleware und Styling
          funktionieren.
        </p>
      </CardContent>
    </Card>
  );
}
