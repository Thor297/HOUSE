import Link from "next/link";
import { LogOut, Settings } from "lucide-react";

import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  householdName: string;
  userEmail: string;
}

export function AppHeader({ householdName, userEmail }: AppHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border/60 px-5 md:px-10">
      <div>
        <p className="text-sm font-medium">{householdName}</p>
        <p className="text-xs text-muted-foreground">{userEmail}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon">
          <Link href="/einstellungen/haushalt" aria-label="Einstellungen">
            <Settings />
          </Link>
        </Button>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut />
            Abmelden
          </Button>
        </form>
      </div>
    </header>
  );
}
