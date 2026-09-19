import { Sparkles } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={Sparkles}
      title="KI-Haus-Assistent"
      description="Gesprächsbasierter Zugriff auf Kosten, Dokumente, Anlagen und Wartungen über die Claude API."
      phase="Phase 12"
    />
  );
}
