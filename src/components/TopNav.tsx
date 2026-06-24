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
      <img src="/theConqueror_logo_dark_trim.png" alt="The Conqueror" className="block h-11 w-auto md:h-14 dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/theConqueror_logo_light_trim.png" alt="The Conqueror" className="hidden h-11 w-auto md:h-14 dark:block" />
    </>
  );
}

type IconProps = { className?: string };
const ICON_BASE = "h-6 w-6";

function MapIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${ICON_BASE} ${className}`} aria-hidden>
      <path d="M9 18 3 20V6l6-2m0 14 6 2m-6-2V4m6 16 6-2V4l-6 2m0 14V6" />
    </svg>
  );
}
function DiaryIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${ICON_BASE} ${className}`} aria-hidden>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
function StatsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${ICON_BASE} ${className}`} aria-hidden>
      <path d="M3 3v18h18" />
      <rect x="7" y="11" width="3" height="6" rx="0.5" />
      <rect x="12" y="7" width="3" height="10" rx="0.5" />
      <rect x="17" y="13" width="3" height="4" rx="0.5" />
    </svg>
  );
}
function ProfileIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${ICON_BASE} ${className}`} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
function FlagIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${ICON_BASE} ${className}`} aria-hidden>
      <path d="M4 22V4m0 1 4.5-1.5a4 4 0 0 1 3 .2 4 4 0 0 0 3 .2L20 3v11l-5.5 1.1a4 4 0 0 1-3-.2 4 4 0 0 0-3-.2L4 16" />
    </svg>
  );
}

const LINKS = [
  { href: "/", key: "nav.map", match: undefined as string | undefined, Icon: MapIcon },
  { href: "/diary", key: "nav.diary", match: undefined, Icon: DiaryIcon },
  { href: "/statistics", key: "nav.statistics", match: undefined, Icon: StatsIcon },
  { href: "/profile", key: "nav.profiles", match: "/profile", Icon: ProfileIcon },
  { href: "/destinations", key: "nav.destinations", match: undefined, Icon: FlagIcon },
];

/** Settings + logout icon buttons (shown in the header on every breakpoint). */
function ActionButtons() {
  const pathname = usePathname();
  const t = useT();
  return (
    <>
      <Link
        href="/admin"
        title={t("nav.admin")}
        aria-label={t("nav.admin")}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-2xl leading-none transition-colors ${
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </>
  );
}

export default function TopNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const t = useT();
  const isActive = (href: string, match?: string) => (match ? pathname.startsWith(match) : pathname === href);

  return (
    <>
      <header className="sticky top-0 z-40 -mx-4 -mt-6 mb-6 flex items-center justify-between gap-3 border-b border-line bg-parchment/85 px-4 py-3 backdrop-blur md:-mx-8 md:-mt-10 md:gap-4 md:px-8">
        <Link href="/" className="shrink-0" aria-label="The Conqueror">
          <BrandLockup />
        </Link>

        {/* Desktop: inline pill bar. On mobile the nav lives in the bottom bar. */}
        <nav className="hidden items-center gap-1 rounded-full border border-line bg-surface p-1.5 md:flex">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.match);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-base font-medium transition-colors ${
                  active ? "bg-ink text-surface" : "text-muted hover:text-ink"
                }`}
              >
                {t(l.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {children}
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-1.5 md:border-l md:border-line md:pl-3">
            <ActionButtons />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar — thumb-reachable primary navigation. */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-parchment/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {LINKS.map((l) => {
          const active = isActive(l.href, l.match);
          const { Icon } = l;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className={active ? "stroke-[2.25]" : ""} />
              <span className="max-w-full truncate text-[11px] font-medium">{t(l.key)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
