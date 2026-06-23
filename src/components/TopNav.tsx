"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth-actions";
import { useT } from "@/components/i18n/LanguageProvider";
import ThemeToggle from "@/components/ThemeToggle";

/** Original brand logo; swaps colour variant per theme. */
function BrandLockup() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/theConqueror_logo_dark_trim.png" alt="The Conqueror" className="block h-12 w-auto md:h-14 dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/theConqueror_logo_light_trim.png" alt="The Conqueror" className="hidden h-12 w-auto md:h-14 dark:block" />
    </>
  );
}

const LINKS = [
  { href: "/", key: "nav.map", match: undefined as string | undefined },
  { href: "/diary", key: "nav.diary", match: undefined },
  { href: "/statistics", key: "nav.statistics", match: undefined },
  { href: "/profile", key: "nav.profiles", match: "/profile" },
  { href: "/destinations", key: "nav.destinations", match: undefined },
];

export default function TopNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const t = useT();
  const isActive = (href: string, match?: string) => (match ? pathname.startsWith(match) : pathname === href);

  return (
    <header className="sticky top-0 z-40 -mx-4 -mt-6 mb-6 flex flex-col gap-3 border-b border-line bg-parchment/85 px-4 py-3 backdrop-blur md:-mx-8 md:-mt-10 md:px-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <Link href="/" className="shrink-0" aria-label="The Conqueror">
          <BrandLockup />
        </Link>
        <nav className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1.5">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.match);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 rounded-full px-3.5 py-2 text-base font-medium transition-colors ${
                  active ? "bg-ink text-surface" : "text-muted hover:text-ink"
                }`}
              >
                {t(l.key)}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {children}
        <ThemeToggle />
        <div className="flex items-center gap-1.5 border-l border-line pl-3">
          <Link
            href="/admin"
            title={t("nav.admin")}
            aria-label={t("nav.admin")}
            className={`flex h-10 w-10 items-center justify-center rounded-full border text-2xl leading-none transition-colors ${
              pathname.startsWith("/admin")
                ? "border-ink bg-ink text-surface"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            ⚙
          </Link>
          <button
            onClick={() => logout()}
            title={t("nav.logout")}
            aria-label={t("nav.logout")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
