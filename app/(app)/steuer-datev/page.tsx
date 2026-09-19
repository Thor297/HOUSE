import { Receipt } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={Receipt}
      title="Steuer & DATEV"
      description="Steuerlich klassifizierte Sachverhalte und Steuerberater-Export (ZIP/PDF/XLSX/CSV)."
      phase="Phase 8"
    />
  );
}
