import { Users } from "lucide-react";

import { getUserHouseholds, getHouseholdMembers } from "@/lib/data/households";
import { InviteMemberForm } from "@/components/settings/invite-member-form";
import { MemberRowActions } from "@/components/settings/member-row-actions";
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

export default async function HouseholdSettingsPage() {
  const memberships = await getUserHouseholds();
  const current = memberships[0];

  // Das (app)-Layout leitet bereits auf /onboarding/household um, wenn
  // kein Haushalt existiert - dieser Fall tritt hier praktisch nie ein.
  if (!current) return null;

  const members = await getHouseholdMembers(current.household.id);
  const canManage = current.role === "owner" || current.role === "admin";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-12 md:px-10">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Users className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Haushalt &amp; Mitglieder
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {current.household.name}
          </CardTitle>
          <CardDescription>
            {members.length} Mitglied{members.length === 1 ? "" : "er"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {member.profile?.full_name ||
                    member.profile?.email ||
                    "Unbekannt"}
                </p>
                {member.profile?.email && (
                  <p className="text-xs text-muted-foreground">
                    {member.profile.email}
                  </p>
                )}
              </div>
              {canManage ? (
                <MemberRowActions
                  householdId={current.household.id}
                  memberId={member.id}
                  currentRole={member.role}
                />
              ) : (
                <Badge variant="secondary">
                  {ROLE_LABELS[member.role] ?? member.role}
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Mitglied einladen
            </CardTitle>
            <CardDescription>
              Per E-Mail einladen. Neue Nutzer erhalten eine Einladungsmail,
              bestehende Nutzer werden direkt hinzugefügt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMemberForm householdId={current.household.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
