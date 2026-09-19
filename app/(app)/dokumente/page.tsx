import { FileText } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={FileText}
      title="Dokumente"
      description="Archiv aller Belege und Verträge mit Filter, Tags und Vorschau."
      phase="Phase 3"
    />
  );
}
