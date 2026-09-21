"use client";

import { useActionState } from "react";

import { inviteMember } from "@/lib/actions/households";
import type { ActionState } from "@/lib/actions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteMemberForm({ householdId }: { householdId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    inviteMember,
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="householdId" value={householdId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">E-Mail</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="name@beispiel.de"
          className="w-64"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">Rolle</Label>
        <select
          id="invite-role"
          name="role"
          defaultValue="member"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="read_only">Read Only</option>
        </select>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Wird eingeladen…" : "Einladen"}
      </Button>

      {state?.error && (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      )}
      {state?.message && (
        <p className="w-full text-sm text-status-ok">{state.message}</p>
      )}
    </form>
  );
}
