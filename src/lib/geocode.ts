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

/** Geocode "ort, land" with the DB cache, ORT-alone and country-centroid fallbacks. */
export async function geocode(ort: string, land: string): Promise<Geo> {
  const supabase = createAdminClient();
  const key = `${ort}, ${land}`.toLowerCase().replace(/\s+/g, " ").trim();

  const { data: cached } = await supabase
    .from("geocode_cache")
    .select("lat, lon, source")
    .eq("query", key)
    .maybeSingle();
  if (cached) return { lat: Number(cached.lat), lon: Number(cached.lon), source: cached.source };

  let hit = ort ? await nominatim(`${ort}, ${land}`) : null;
  let source = "nominatim";
  if (!hit && ort) hit = await nominatim(ort);
  if (!hit && land) {
    hit = await nominatim(land);
    source = "country-centroid";
  }
  if (!hit) return null;

  const geo = { lat: hit.lat, lon: hit.lon, source };
  await supabase.from("geocode_cache").insert({ query: key, ...geo });
  return geo;
}
