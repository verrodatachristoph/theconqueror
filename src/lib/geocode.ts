import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Nominatim asks for an identifying UA; set NOMINATIM_CONTACT for a contact.
const UA = `TheConqueror/1.0 (self-hosted family travel map${
  process.env.NOMINATIM_CONTACT ? `; ${process.env.NOMINATIM_CONTACT}` : ""
})`;
let lastHit = 0;

async function nominatim(q: string): Promise<{ lat: number; lon: number } | null> {
  const wait = 1100 - (Date.now() - lastHit);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHit = Date.now();
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!arr.length) return null;
  return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) };
}

export type Geo = { lat: number; lon: number; source: string } | null;

/** Geocode "place, country" with the DB cache, ORT-alone and country-centroid fallbacks. */
export async function geocode(place: string, country: string): Promise<Geo> {
  const supabase = createAdminClient();
  const key = `${place}, ${country}`.toLowerCase().replace(/\s+/g, " ").trim();

  const { data: cached } = await supabase
    .from("geocode_cache")
    .select("lat, lon, source")
    .eq("query", key)
    .maybeSingle();
  if (cached) return { lat: Number(cached.lat), lon: Number(cached.lon), source: cached.source };

  let hit = place ? await nominatim(`${place}, ${country}`) : null;
  let source = "nominatim";
  if (!hit && place) hit = await nominatim(place);
  if (!hit && country) {
    hit = await nominatim(country);
    source = "country-centroid";
  }
  if (!hit) return null;

  const geo = { lat: hit.lat, lon: hit.lon, source };
  await supabase.from("geocode_cache").insert({ query: key, ...geo });
  return geo;
}
