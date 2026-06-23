import de from "@/messages/de.json";
import en from "@/messages/en.json";
import { defaultLocale, type Locale } from "./config";

const dictionaries = { de, en } as const;

export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

function lookup(obj: unknown, path: string[]): string | undefined {
  let cur: unknown = obj;
  for (const part of path) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Build a translator bound to a locale. Falls back to the default locale, then the key. */
export function createT(locale: Locale): TFunc {
  return (key, vars) => {
    const path = key.split(".");
    const hit = lookup(dictionaries[locale], path) ?? lookup(dictionaries[defaultLocale], path) ?? key;
    return interpolate(hit, vars);
  };
}
