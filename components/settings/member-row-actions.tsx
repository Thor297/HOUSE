"use client";

import { useActionState } from "react";

import { updateMemberRole, removeMember } from "@/lib/actions/households";
import type { ActionState } from "@/lib/actions/types";
import type { HouseholdRole } from "@/types/database.types";
import { Button } from "@/components/ui/button";

interface MemberRowActionsProps {
  householdId: string;
  memberId: string;
  currentRole: HouseholdRole;
}

export function MemberRowActions({
  householdId,
  memberId,
  currentRole,
}: MemberRowActionsProps) {
  const [roleState, roleAction, rolePending] = useActionState<
    ActionState,
    FormData
  >(updateMemberRole, null);
  const [removeState, removeAction, removePending] = useActionState<
    ActionState,
    FormData
  >(removeMember, null);

  const error = roleState?.error ?? removeState?.error;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <form action={roleAction}>
          <input type="hidden" name="householdId" value={householdId} />
          <input type="hidden" name="memberId" value={memberId} />
          <select
            name="role"
            defaultValue={currentRole}
            disabled={rolePending}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="read_only">Read Only</option>
          </select>
        </form>

        <form action={removeAction}>
          <input type="hidden" name="householdId" value={householdId} />
          <input type="hidden" name="memberId" value={memberId} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={removePending}
          >
            Entfernen
          </Button>
        </form>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
