import { Laptop } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={Laptop}
      title="Verbundene Geräte"
      description="Gekoppelte macOS-Import-Agenten einsehen und widerrufen."
      phase="Phase 11"
    />
  );
}
