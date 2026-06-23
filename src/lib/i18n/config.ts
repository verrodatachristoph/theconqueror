export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";
export const LOCALE_COOKIE = "conq_locale";

export const localeNames: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
};

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "de" || v === "en";
}
