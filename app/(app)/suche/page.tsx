import { Search } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={Search}
      title="Suche"
      description="Globale Volltextsuche über Dokumente, Kosten, Anlagen und Versicherungen."
      phase="Phase 7"
    />
  );
}
