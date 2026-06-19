"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { login, type LoginState } from "@/app/auth-actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* warm backdrop */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 50% -10%, var(--color-accent-soft), transparent), radial-gradient(40rem 30rem at 110% 110%, color-mix(in oklab, var(--color-arc) 25%, transparent), transparent)",
        }}
      />
      <motion.form
        action={formAction}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-3xl border border-line bg-surface/80 p-7 shadow-xl backdrop-blur"
      >
        <svg viewBox="0 0 32 32" className="h-10 w-10">
          <circle cx="16" cy="16" r="9.5" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" />
          <path d="M16 6.5a13 13 0 0 1 0 19" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" opacity="0.55" />
          <path d="M6.5 16h19" stroke="var(--color-accent)" strokeWidth="1.2" opacity="0.55" />
          <path d="M6.8 11.5C11 8 21 8 25.2 11.5" fill="none" stroke="var(--color-arc)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.1" fill="var(--color-arc)" />
        </svg>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">The Conqueror</h1>
        <p className="mt-1 text-sm text-muted">Wo die Familie schon überall war.</p>

        <label className="mt-6 block">
          <span className="text-xs font-medium text-muted">Familien-Passwort</span>
          <input
            type="password"
            name="password"
            autoFocus
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-line bg-parchment/50 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </label>

        {state.error && <p className="mt-2 text-sm text-[var(--color-arc)]">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-ink py-2.5 text-sm font-medium text-surface transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "Anmelden…" : "Anmelden"}
        </button>
      </motion.form>
    </main>
  );
}
