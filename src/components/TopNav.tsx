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
        <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight md:text-xl">
          The&nbsp;Conqueror
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
