import type { Trip } from "@/types/database.types";

/** Person color from the DB (persons.farbe). Falls back to a neutral grey. */
export function personColor(persons: { code: string; farbe: string }[], code: string): string {
  return persons.find((p) => p.code === code)?.farbe ?? "#8c8378";
}

/**
 * AND semantics: a trip is shown only if EVERY enabled person was on it, so the
 * map/stats describe trips where exactly the selected people were together.
 * With all enabled (default) that means trips where the whole family was along;
 * with one enabled it's simply that person's trips. An empty selection = no
 * filter (show everything).
 */
export function filterTrips<T extends Trip>(trips: T[], enabled: Set<string>): T[] {
  if (enabled.size === 0) return trips;
  return trips.filter((t) => {
    const who = t.wer_von_uns ?? [];
    for (const c of enabled) if (!who.includes(c)) return false;
    return true;
  });
}

export type CountryAgg = { iso3: string; count: number; days: number };

/** Aggregate trips per ISO3 country. */
export function aggregateByCountry(trips: Trip[]): Map<string, CountryAgg> {
  const m = new Map<string, CountryAgg>();
  for (const t of trips) {
    if (!t.land_iso3) continue;
    const a = m.get(t.land_iso3) ?? { iso3: t.land_iso3, count: 0, days: 0 };
    a.count += 1;
    a.days += t.tage ?? 0;
    m.set(t.land_iso3, a);
  }
  return m;
}

export type Arc = {
  trip: Trip;
  from: [number, number]; // [lon, lat]
  to: [number, number]; // [lon, lat]
};

export type Stop = { iata: string; lat: number; lon: number };

/** Intermediate stops of a multi-leg flight (Gabelflug), in order. */
export function tripStops(t: Trip): Stop[] {
  const s = t.flug_stops as unknown;
  return Array.isArray(s) ? (s as Stop[]) : [];
}

/** Number of flight legs: a flight with k stops counts as k+1 flights. */
export function flightLegs(t: Trip): number {
  return t.anreise === "Flugzeug" ? tripStops(t).length + 1 : 0;
}

/** Total flight legs across trips (each leg of a Gabelflug counts). */
export function totalFlights(trips: Trip[]): number {
  return trips.reduce((n, t) => n + flightLegs(t), 0);
}

/** The full waypoint path of a flight: departure → stops → destination. */
function flightPath(t: Trip): [number, number][] | null {
  if (t.anreise !== "Flugzeug") return null;
  if (t.abflug_lat == null || t.abflug_lon == null) return null;
  const destLat = t.ziel_lat ?? t.lat;
  const destLon = t.ziel_lon ?? t.lon;
  if (destLat == null || destLon == null) return null;
  const pts: [number, number][] = [[t.abflug_lon, t.abflug_lat]];
  for (const s of tripStops(t)) {
    if (s.lat != null && s.lon != null) pts.push([s.lon, s.lat]);
  }
  pts.push([destLon, destLat]);
  return pts;
}

/** Flight arcs — one great-circle segment per leg (Gabelflug → several arcs).
 *  Only flights that have a departure airport with coordinates. */
export function flightArcs(trips: Trip[]): Arc[] {
  const arcs: Arc[] = [];
  for (const t of trips) {
    const pts = flightPath(t);
    if (!pts) continue;
    for (let i = 0; i < pts.length - 1; i++) arcs.push({ trip: t, from: pts[i], to: pts[i + 1] });
  }
  return arcs;
}

/** Intermediate stop coordinates (for drawing waypoint markers). */
export function flightStopPoints(trips: Trip[]): [number, number][] {
  const pts: [number, number][] = [];
  for (const t of trips) {
    if (t.anreise !== "Flugzeug" || t.abflug_lat == null) continue;
    for (const s of tripStops(t)) if (s.lat != null && s.lon != null) pts.push([s.lon, s.lat]);
  }
  return pts;
}

export type Destination = { trip: Trip; coord: [number, number] };

/** Destination points (every trip with coordinates). */
export function destinations(trips: Trip[]): Destination[] {
  return trips
    .filter((t) => t.lat != null && t.lon != null)
    .map((t) => ({ trip: t, coord: [t.lon as number, t.lat as number] }));
}

export const yearOf = (t: Trip) => (t.datum_start ? Number(t.datum_start.slice(0, 4)) : null);

/** A trip whose start date is in the future is "planned". */
export function isUpcoming(t: Trip): boolean {
  if (!t.datum_start) return false;
  return t.datum_start > new Date().toISOString().slice(0, 10);
}

/** Whole days from today until a date (negative if past). */
export function daysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ms = Date.parse(date) - today.getTime();
  return Math.ceil(ms / 86_400_000);
}

/** Days are inclusive (nights + 1). */
export function computeTage(start?: string | null, ende?: string | null): number | null {
  if (!start || !ende) return null;
  const ms = Date.parse(ende) - Date.parse(start);
  if (Number.isNaN(ms)) return null;
  return Math.round(ms / 86_400_000) + 1;
}
