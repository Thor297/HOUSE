import { Home } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={Home}
      title="Haus & Anlagen"
      description="Verwaltung von Häusern, Bereichen und Anlagen (Heizung, PV-Anlage, Dach usw.)."
      phase="Phase 2"
    />
  );
}
