"use client";

import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useT } from "@/components/i18n/LanguageProvider";

/** Global footer: "A product of Just PANC" + language selector. */
export default function Footer() {
  const t = useT();
  return (
    <footer className="mt-10 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted sm:flex-row">
        <a
          href="https://justpanc.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span>{t("footer.productOf")}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/justpanc_logo_black.png" alt="Just PANC" className="block h-5 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/justpanc_logo_white.png" alt="Just PANC" className="hidden h-5 w-auto dark:block" />
        </a>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">{t("footer.language")}</span>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
