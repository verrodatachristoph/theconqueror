"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { ToastProvider } from "@/components/toast";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { THEME_COOKIE } from "@/lib/theme";
import type { Locale } from "@/lib/i18n/config";

/** Follow the OS colour scheme live, unless the user picked a theme explicitly. */
function useSystemThemeSync() {
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const hasChoice = () => document.cookie.includes(`${THEME_COOKIE}=`);
    const apply = () => {
      if (!hasChoice()) document.documentElement.classList.toggle("dark", mql.matches);
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);
}

/** App-wide client providers: locale + reduced-motion respect + toasts. */
export default function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  useSystemThemeSync();
  return (
    <LanguageProvider locale={locale}>
      <MotionConfig reducedMotion="user">
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </LanguageProvider>
  );
}
