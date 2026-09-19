import { LayoutDashboard } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={LayoutDashboard}
      title="Dashboard"
      description="Aggregierte Übersicht: fällige Wartungen, anstehende Termine, Kostenverlauf, ablaufende Versicherungen/Garantien, zu prüfende Dokumente."
      phase="Phase 7"
    />
  );
}
