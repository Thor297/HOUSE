import { Inbox } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={Inbox}
      title="Dokumenten-Posteingang"
      description="Automatisch importierte Belege (z.B. aus dem iCloud-Eingang), die noch bestätigt werden müssen."
      phase="Phase 9/10"
    />
  );
}
