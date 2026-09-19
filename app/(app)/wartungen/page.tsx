import { Wrench } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function Page() {
  return (
    <PagePlaceholder
      icon={Wrench}
      title="Wartungen"
      description="Wiederkehrende und einmalige Wartungsaufgaben mit Historie."
      phase="Phase 6"
    />
  );
}
