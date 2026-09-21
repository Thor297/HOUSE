import { redirect } from "next/navigation";
import { Home } from "lucide-react";

import { getUserHouseholds } from "@/lib/data/households";
import { CreateHouseholdForm } from "@/components/onboarding/create-household-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HouseholdOnboardingPage() {
  // Wer bereits einen Haushalt hat, braucht diese Seite nicht mehr zu
  // sehen (z.B. bei direktem Aufruf der URL).
  const memberships = await getUserHouseholds();
  if (memberships.length > 0) {
    redirect("/dashboard");
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Home className="size-5" />
        </div>
        <CardTitle>Haushalt anlegen</CardTitle>
        <CardDescription>
          Für den Start brauchst du einen Haushalt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CreateHouseholdForm />
      </CardContent>
    </Card>
  );
}
