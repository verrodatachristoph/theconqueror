"use client";

import { MotionConfig } from "framer-motion";
import { ToastProvider } from "@/components/toast";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/config";

/** App-wide client providers: locale + reduced-motion respect + toasts. */
export default function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <LanguageProvider locale={locale}>
      <MotionConfig reducedMotion="user">
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </LanguageProvider>
  );
}
