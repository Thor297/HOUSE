import { redirect } from "next/navigation";
import { Home } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SignupPage() {
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
        <CardTitle>Konto erstellen</CardTitle>
        <CardDescription>Für &bdquo;Mein Haus&ldquo; registrieren</CardDescription>
      </CardHeader>
      <SignupForm />
    </Card>
  );
}
