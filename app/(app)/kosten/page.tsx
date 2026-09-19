import { Wallet } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={Wallet}
      title="Kosten"
      description="Kostenkategorien, Buchungen, Auswertungen je Haus/Anlage/Kategorie, wiederkehrende Kosten."
      phase="Phase 4"
    />
  );
}
