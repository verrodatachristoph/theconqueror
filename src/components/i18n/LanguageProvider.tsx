"use client";

import { createContext, useContext, useMemo } from "react";
import { createT, type TFunc } from "@/lib/i18n";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type Ctx = { locale: Locale; t: TFunc };
const LanguageContext = createContext<Ctx | null>(null);

/** Provides the active locale + translator to client components. */
export function LanguageProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<Ctx>(() => ({ locale, t: createT(locale) }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLocale(): Locale {
  const ctx = useContext(LanguageContext);
  return ctx?.locale ?? defaultLocale;
}

/** Translator hook for client components. */
export function useT(): TFunc {
  const ctx = useContext(LanguageContext);
  return ctx?.t ?? createT(defaultLocale);
}
