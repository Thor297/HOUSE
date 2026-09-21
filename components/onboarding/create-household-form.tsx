"use client";

import { useActionState } from "react";

import { createHousehold } from "@/lib/actions/households";
import type { ActionState } from "@/lib/actions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateHouseholdForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createHousehold,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name des Haushalts</Label>
        <Input
          id="name"
          name="name"
          placeholder="z.B. Familie Müller"
          required
          autoFocus
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Wird erstellt…" : "Haushalt erstellen"}
      </Button>
    </form>
  );
}
