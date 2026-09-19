import { CalendarDays } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={CalendarDays}
      title="Termine"
      description="Handwerker-, Ablese- und Behördentermine, verknüpft mit Anlagen und Wartungen."
      phase="Phase 6"
    />
  );
}
