"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/auth-actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-7 shadow-sm"
      >
        <h1 className="text-2xl font-semibold tracking-tight">The Conqueror</h1>
        <p className="mt-1 text-sm text-muted">Wo die Familie schon überall war.</p>

        <label className="mt-6 block">
          <span className="text-xs font-medium text-muted">Familien-Passwort</span>
          <input
            type="password"
            name="password"
            autoFocus
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-line bg-parchment/40 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </label>

        {state.error && <p className="mt-2 text-sm text-[var(--color-arc)]">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-ink py-2.5 text-sm font-medium text-surface disabled:opacity-50"
        >
          {pending ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </main>
  );
}
