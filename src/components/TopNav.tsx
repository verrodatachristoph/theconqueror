"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth-actions";

const LINKS = [
  { href: "/", label: "Karte", match: undefined as string | undefined },
  { href: "/tagebuch", label: "Tagebuch", match: undefined },
  { href: "/statistik", label: "Statistik", match: undefined },
  { href: "/profil", label: "Profile", match: "/profil" },
  { href: "/ziele", label: "Ziele", match: undefined },
];

export default function TopNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string, match?: string) => (match ? pathname.startsWith(match) : pathname === href);

  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight md:text-xl">
          <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
            <circle cx="16" cy="16" r="9.5" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" />
            <path d="M16 6.5a13 13 0 0 1 0 19" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" opacity="0.55" />
            <path d="M6.5 16h19" stroke="var(--color-accent)" strokeWidth="1.2" opacity="0.55" />
            <path d="M6.8 11.5C11 8 21 8 25.2 11.5" fill="none" stroke="var(--color-arc)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2.1" fill="var(--color-arc)" />
          </svg>
          <span className="hidden sm:inline">The&nbsp;Conqueror</span>
        </Link>
        <nav className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.match);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-ink text-surface" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {children}
        <Link
          href="/admin"
          title="Admin"
          aria-label="Admin"
          className={`flex h-9 w-9 items-center justify-center rounded-full border text-base transition-colors ${
            pathname.startsWith("/admin")
              ? "border-ink bg-ink text-surface"
              : "border-line text-muted hover:text-ink"
          }`}
        >
          ⚙
        </Link>
        <button
          onClick={() => logout()}
          className="rounded-full border border-line px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
          title="Abmelden"
        >
          Abmelden
        </button>
      </div>
    </header>
  );
}
