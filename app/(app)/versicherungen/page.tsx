import { ShieldCheck } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={ShieldCheck}
      title="Versicherungen"
      description="Verträge, Deckungsbausteine, Kündigungsfristen und anstehende Fälligkeiten."
      phase="Phase 5"
    />
  );
}
