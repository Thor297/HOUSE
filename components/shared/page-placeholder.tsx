import { type LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PagePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}

/**
 * Platzhalter für Bereiche, deren Datenmodell in Phase 0 bereits im
 * Schema angelegt ist, deren UI aber erst in einer späteren Phase
 * umgesetzt wird. Macht die geplante Struktur sichtbar, ohne Funktionen
 * vorzuziehen.
 */
export function PagePlaceholder({
  icon: Icon,
  title,
  description,
  phase,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-12 md:px-10">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base font-medium">
              Noch nicht implementiert
            </CardTitle>
            <Badge variant="secondary">{phase}</Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Das Datenmodell für diesen Bereich ist bereits vollständig in der
            initialen Migration angelegt. Die Oberfläche folgt in der oben
            genannten Phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
