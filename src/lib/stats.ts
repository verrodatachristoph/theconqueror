import type { Trip } from "@/types/database.types";
import { yearOf, tripStops, flightLegs, totalFlights } from "@/lib/trips";

export type PersonStats = {
  code: string;
  trips: number;
  days: number;
  countries: number;
  countrySet: Set<string>;
  flights: number;
  longest: Trip | null;
  topCountry: [string, number] | null;
  topPlace: [string, number] | null;
  firstYear: number | null;
  lastYear: number | null;
};

function topBy(trips: Trip[], key: (t: Trip) => string | null): [string, number] | null {
  const m = new Map<string, number>();
  for (const t of trips) {
    const k = key(t);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  let best: [string, number] | null = null;
  for (const e of m) if (!best || e[1] > best[1]) best = [e[0], e[1]];
  return best;
}

/** Trips a person took part in (their code is in wer_von_uns). */
export function tripsOf(trips: Trip[], code: string): Trip[] {
  return trips.filter((t) => t.wer_von_uns?.includes(code));
}

export function personStats(trips: Trip[], code: string): PersonStats {
  const mine = tripsOf(trips, code);
  const countrySet = new Set<string>();
  let days = 0;
  let flights = 0;
  let longest: Trip | null = null;
  const years: number[] = [];
  for (const t of mine) {
    if (t.land_iso3) countrySet.add(t.land_iso3);
    days += t.tage ?? 0;
    flights += flightLegs(t);
    if ((t.tage ?? 0) > (longest?.tage ?? -1)) longest = t;
    const y = yearOf(t);
    if (y != null) years.push(y);
  }
  return {
    code,
    trips: mine.length,
    days,
    countries: countrySet.size,
    countrySet,
    flights,
    longest,
    topCountry: topBy(mine, (t) => t.land),
    topPlace: topBy(mine, (t) => t.ort),
    firstYear: years.length ? Math.min(...years) : null,
    lastYear: years.length ? Math.max(...years) : null,
  };
}

/** Home reference for "farthest trip" distance (configured in app settings). */
export type Home = { lat: number | null; lon: number | null; label: string };

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

// Compact ISO3 -> continent map (covers the data + common destinations).
const CONTINENT: Record<string, string> = {
  DEU: "Europa", AUT: "Europa", CHE: "Europa", FRA: "Europa", ITA: "Europa",
  ESP: "Europa", PRT: "Europa", NLD: "Europa", GBR: "Europa", SWE: "Europa",
  GRC: "Europa", DNK: "Europa", NOR: "Europa", BEL: "Europa", POL: "Europa",
  CZE: "Europa", HRV: "Europa", IRL: "Europa", ISL: "Europa", FIN: "Europa",
  HUN: "Europa", TUR: "Asien", ARE: "Asien", IDN: "Asien", LKA: "Asien",
  SGP: "Asien", THA: "Asien", MDV: "Asien", JPN: "Asien", CHN: "Asien",
  IND: "Asien", VNM: "Asien", KOR: "Asien", USA: "Nordamerika",
  CAN: "Nordamerika", MEX: "Nordamerika", CRI: "Nordamerika", CUB: "Nordamerika",
  BRA: "Südamerika", ARG: "Südamerika", PER: "Südamerika", CHL: "Südamerika",
  ZAF: "Afrika", EGY: "Afrika", MAR: "Afrika", TUN: "Afrika", KEN: "Afrika",
  TZA: "Afrika", CPV: "Afrika", AUS: "Ozeanien", NZL: "Ozeanien",
};

export type Overview = {
  busiestYear: [number, number] | null; // [year, trips]
  avgDuration: number;
  abroadPct: number; // share of trips outside DEU
  coverage: number; // distinct countries
  continents: string[];
  farthest: { ort: string; land: string; km: number } | null;
  homeLabel: string;
  byMonth: { month: string; trips: number }[];
  topCountries: { land: string; trips: number; days: number }[];
};

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function overviewStats(trips: Trip[], home: Home): Overview {
  const hasHome = home.lat != null && home.lon != null;
  const yearCount = new Map<number, number>();
  const monthCount = new Array(12).fill(0);
  const landAgg = new Map<string, { land: string; trips: number; days: number }>();
  const continentSet = new Set<string>();
  let abroad = 0;
  let totalDays = 0;
  let farthest: Overview["farthest"] = null;

  for (const t of trips) {
    const y = yearOf(t);
    if (y != null) yearCount.set(y, (yearCount.get(y) ?? 0) + 1);
    if (t.datum_start) {
      const m = Number(t.datum_start.slice(5, 7)) - 1;
      if (m >= 0 && m < 12) monthCount[m] += 1;
    }
    if (t.land) {
      const e = landAgg.get(t.land) ?? { land: t.land, trips: 0, days: 0 };
      e.trips += 1;
      e.days += t.tage ?? 0;
      landAgg.set(t.land, e);
    }
    if (t.land_iso3) {
      if (t.land_iso3 !== "DEU") abroad += 1;
      const cont = CONTINENT[t.land_iso3];
      if (cont) continentSet.add(cont);
    }
    totalDays += t.tage ?? 0;
    if (hasHome && t.lat != null && t.lon != null) {
      const km = haversineKm(home.lat!, home.lon!, t.lat, t.lon);
      if (!farthest || km > farthest.km) farthest = { ort: t.ort ?? "", land: t.land ?? "", km };
    }
  }

  let busiestYear: [number, number] | null = null;
  for (const e of yearCount) if (!busiestYear || e[1] > busiestYear[1]) busiestYear = [e[0], e[1]];

  const countrySet = new Set(trips.map((t) => t.land_iso3).filter(Boolean));

  return {
    busiestYear,
    avgDuration: trips.length ? Math.round((totalDays / trips.length) * 10) / 10 : 0,
    abroadPct: trips.length ? Math.round((abroad / trips.length) * 100) : 0,
    coverage: countrySet.size,
    continents: [...continentSet].sort(),
    farthest,
    homeLabel: home.label,
    byMonth: MONTHS.map((month, i) => ({ month, trips: monthCount[i] })),
    topCountries: [...landAgg.values()].sort((a, b) => b.trips - a.trips).slice(0, 5),
  };
}

/** Total flown distance (great-circle) summed over every leg of every flight. */
export function totalFlightKm(trips: Trip[]): number {
  let km = 0;
  for (const t of trips) {
    if (t.anreise !== "Flugzeug" || t.abflug_lat == null || t.abflug_lon == null) continue;
    const destLat = t.ziel_lat ?? t.lat;
    const destLon = t.ziel_lon ?? t.lon;
    if (destLat == null || destLon == null) continue;
    const pts: [number, number][] = [[t.abflug_lat, t.abflug_lon]];
    for (const s of tripStops(t)) if (s.lat != null && s.lon != null) pts.push([s.lat, s.lon]);
    pts.push([destLat, destLon]);
    for (let i = 0; i < pts.length - 1; i++) {
      km += haversineKm(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    }
  }
  return km;
}

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  current: number;
  target: number;
  earned: boolean;
};

export const ACHIEVEMENT_METRICS = [
  "trips",
  "countries",
  "continents",
  "flights",
  "maxDays",
  "maxKm",
  "familyTrips",
  "years",
] as const;
export type AchievementMetric = (typeof ACHIEVEMENT_METRICS)[number];

/** Compute every metric an achievement can be based on. */
export function achievementAggregates(
  trips: Trip[],
  allPersonCodes: string[],
  home: Home,
): Record<AchievementMetric, number> {
  const countries = new Set(trips.map((t) => t.land_iso3).filter(Boolean));
  const continents = new Set<string>();
  for (const c of countries) {
    const k = CONTINENT[c as string];
    if (k) continents.add(k);
  }
  const years = new Set(trips.map(yearOf).filter((y) => y != null));
  let maxKm = 0;
  if (home.lat != null && home.lon != null) {
    for (const t of trips) {
      if (t.lat != null && t.lon != null) maxKm = Math.max(maxKm, haversineKm(home.lat, home.lon, t.lat, t.lon));
    }
  }
  return {
    trips: trips.length,
    countries: countries.size,
    continents: continents.size,
    flights: totalFlights(trips),
    maxDays: trips.reduce((m, t) => Math.max(m, t.tage ?? 0), 0),
    maxKm: Math.round(maxKm),
    familyTrips: allPersonCodes.length
      ? trips.filter((t) => allPersonCodes.every((c) => t.wer_von_uns?.includes(c))).length
      : 0,
    years: years.size,
  };
}

export type AchievementDef = {
  id: string;
  icon: string;
  title: string;
  descr: string;
  metric: string;
  target: number;
  enabled: boolean;
};

/** Evaluate configurable achievement definitions against the aggregates. */
export function evaluateAchievements(
  defs: AchievementDef[],
  agg: Record<string, number>,
): Achievement[] {
  return defs
    .filter((d) => d.enabled)
    .map((d) => {
      const current = agg[d.metric] ?? 0;
      return {
        id: d.id,
        icon: d.icon,
        title: d.title,
        desc: d.descr,
        current,
        target: d.target,
        earned: current >= d.target,
      };
    });
}

export type HeadToHead = {
  a: PersonStats;
  b: PersonStats;
  together: number; // trips both were on
  onlyA: number;
  onlyB: number;
  sharedCountries: number; // countries both have visited
};

export function headToHead(trips: Trip[], codeA: string, codeB: string): HeadToHead {
  const a = personStats(trips, codeA);
  const b = personStats(trips, codeB);
  let together = 0;
  for (const t of trips) {
    const w = t.wer_von_uns ?? [];
    if (w.includes(codeA) && w.includes(codeB)) together += 1;
  }
  let sharedCountries = 0;
  for (const c of a.countrySet) if (b.countrySet.has(c)) sharedCountries += 1;
  return {
    a,
    b,
    together,
    onlyA: a.trips - together,
    onlyB: b.trips - together,
    sharedCountries,
  };
}
