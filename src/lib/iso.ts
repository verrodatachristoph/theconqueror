import countries from "i18n-iso-countries";
import de from "i18n-iso-countries/langs/de.json";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(de);
countries.registerLocale(en);

// German names i18n-iso-countries doesn't resolve on its own (mirrors the importer)
const ISO_OVERRIDES: Record<string, string> = {
  england: "GBR",
  schottland: "GBR",
  wales: "GBR",
  grossbritannien: "GBR",
  großbritannien: "GBR",
  uk: "GBR",
  usa: "USA",
  "vereinigte staaten": "USA",
  amerika: "USA",
  südkorea: "KOR",
  korea: "KOR",
  "kap verde": "CPV",
  kapverden: "CPV",
  vae: "ARE",
  "vereinigte arabische emirate": "ARE",
  singapur: "SGP",
  singpaur: "SGP",
};

/** German (or English) country name -> ISO 3166-1 alpha-3, or null. */
export function toIso3(land: string | null | undefined): string | null {
  if (!land) return null;
  const key = land.toLowerCase().trim();
  if (ISO_OVERRIDES[key]) return ISO_OVERRIDES[key];
  const a2 = countries.getAlpha2Code(land, "de") || countries.getAlpha2Code(land, "en");
  return a2 ? (countries.alpha2ToAlpha3(a2) ?? null) : null;
}

/** All German country names, for the form's datalist autocomplete. */
export function germanCountryNames(): string[] {
  const names = countries.getNames("de");
  return Object.values(names).sort((a, b) => a.localeCompare(b, "de"));
}
