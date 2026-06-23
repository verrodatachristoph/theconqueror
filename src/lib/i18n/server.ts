import "server-only";
import { cookies } from "next/headers";
import { createT } from "./index";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "./config";

/** Current UI locale from the cookie (server components / actions). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : defaultLocale;
}

/** Translator bound to the current locale, for server components. */
export async function getT() {
  return createT(await getLocale());
}
