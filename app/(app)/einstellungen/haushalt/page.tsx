import { Users } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={Users}
      title="Haushalt & Mitglieder"
      description="Mitglieder einladen, Rollen verwalten (Owner, Admin, Member, Read Only)."
      phase="Phase 1"
    />
  );
}
