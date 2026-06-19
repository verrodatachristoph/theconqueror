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
  { href: "/admin", label: "Admin", match: undefined },
];

export default function TopNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">The Conqueror</h1>
          <p className="hidden text-xs text-muted sm:block">Wo die Familie schon überall war.</p>
        </div>
        <nav className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
          {LINKS.map((l) => {
            const active = l.match ? pathname.startsWith(l.match) : pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-ink text-surface" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {children}
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
