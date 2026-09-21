"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signIn } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    signIn,
    null
  );

  return (
    <>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Anmelden…" : "Anmelden"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Noch kein Konto?{" "}
          <Link
            href="/signup"
            className="text-primary underline-offset-4 hover:underline"
          >
            Registrieren
          </Link>
        </p>
      </CardFooter>
    </>
  );
}
