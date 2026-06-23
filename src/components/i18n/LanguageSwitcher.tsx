"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/i18n-actions";
import { locales, localeNames } from "@/lib/i18n/config";
import { useLocale } from "./LanguageProvider";

/** Compact DE/EN segmented toggle. Used in the header and footer. */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(loc: string) {
    if (loc === current) return;
    startTransition(async () => {
      await setLocale(loc);
      router.refresh();
    });
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border border-line bg-surface p-0.5 text-xs ${className}`}
      role="group"
      aria-label={localeNames[current]}
    >
      {locales.map((loc) => {
        const active = loc === current;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => choose(loc)}
            disabled={pending}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 font-medium uppercase transition-colors disabled:opacity-60 ${
              active ? "bg-ink text-surface" : "text-muted hover:text-ink"
            }`}
          >
            {loc}
          </button>
        );
      })}
    </div>
  );
}
