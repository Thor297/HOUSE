import { History } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={History}
      title="Exporthistorie"
      description="Übersicht bisheriger Steuerberater-Exports inkl. Delta-Exporten."
      phase="Phase 8"
    />
  );
}
