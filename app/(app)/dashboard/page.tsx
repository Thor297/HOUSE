import { LayoutDashboard, Users } from "lucide-react";

import { getUserHouseholds } from "@/lib/data/households";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  read_only: "Read Only",
};

export default async function DashboardPage() {
  const memberships = await getUserHouseholds();
  const current = memberships[0];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-12 md:px-10">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <LayoutDashboard className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {current?.household.name ?? "Dashboard"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base font-medium">Haushalt</CardTitle>
            {current && (
              <Badge variant="secondary">
                Deine Rolle: {ROLE_LABELS[current.role] ?? current.role}
              </Badge>
            )}
          </div>
          <CardDescription>
            Kosten, Anlagen, Dokumente und weitere Bereiche folgen in den
            nächsten Phasen. Das Datenmodell dafür ist bereits vollständig
            angelegt.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          Mitglieder verwalten unter &bdquo;Einstellungen &rarr; Haushalt&ldquo;.
        </CardContent>
      </Card>
    </div>
  );
}
