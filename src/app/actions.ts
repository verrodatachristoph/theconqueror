"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { toIso3 } from "@/lib/iso";
import { geocode } from "@/lib/geocode";
import { computeTage } from "@/lib/trips";
import { getTripPhotos, type SignedPhoto } from "@/lib/data";
import type { Anreise } from "@/types/database.types";

export type TripInput = {
  id?: string;
  ort: string;
  land: string;
  art: string | null;
  anreise: Anreise | null;
  abflug_iata: string | null;
  ziel_iata: string | null;
  stops: string[]; // ordered intermediate stop IATA codes (Gabelflug)
  datum_start: string | null;
  datum_ende: string | null;
  wer_von_uns: string[];
  wer_sonst: string | null;
  kommentar: string | null;
};

const BUCKET = "trip-photos";

/** Resolve a departure airport's coordinates: lookup, else geocode + remember. */
async function resolveAirport(
  supabase: ReturnType<typeof createAdminClient>,
  iata: string,
): Promise<{ lat: number; lon: number } | null> {
  const code = iata.trim().toUpperCase();
  const { data: found } = await supabase
    .from("airports")
    .select("lat, lon")
    .eq("iata", code)
    .maybeSingle();
  if (found) return { lat: Number(found.lat), lon: Number(found.lon) };

  const geo = await geocode(`${code} airport`, "");
  if (!geo) return null;
  // remember free-text airports so they autocomplete next time
  await supabase
    .from("airports")
    .upsert({ iata: code, name: code, lat: geo.lat, lon: geo.lon }, { onConflict: "iata" });
  return { lat: geo.lat, lon: geo.lon };
}

export async function saveTrip(input: TripInput): Promise<{ id: string }> {
  const supabase = createAdminClient();
  const land_iso3 = toIso3(input.land);
  const tage = computeTage(input.datum_start, input.datum_ende);
  const isFlight = input.anreise === "Flugzeug";

  // Reuse existing destination coords unless ort/land changed (preserve manual edits)
  let lat: number | null = null;
  let lon: number | null = null;
  let existing: { ort: string | null; land: string | null; lat: number | null; lon: number | null } | null =
    null;
  if (input.id) {
    const { data } = await supabase
      .from("trips")
      .select("ort, land, lat, lon")
      .eq("id", input.id)
      .maybeSingle();
    existing = data;
  }
  if (existing && existing.ort === input.ort && existing.land === input.land && existing.lat != null) {
    lat = Number(existing.lat);
    lon = Number(existing.lon);
  } else if (input.ort || input.land) {
    const geo = await geocode(input.ort, input.land);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
    }
  }

  // Departure airport coords (flights only)
  let abflug_iata: string | null = null;
  let abflug_lat: number | null = null;
  let abflug_lon: number | null = null;
  if (isFlight && input.abflug_iata?.trim()) {
    abflug_iata = input.abflug_iata.trim().toUpperCase();
    const ap = await resolveAirport(supabase, abflug_iata);
    if (ap) {
      abflug_lat = ap.lat;
      abflug_lon = ap.lon;
    }
  }

  // Optional destination airport coords (flights only); else arc ends at the Ort
  let ziel_iata: string | null = null;
  let ziel_lat: number | null = null;
  let ziel_lon: number | null = null;
  if (isFlight && input.ziel_iata?.trim()) {
    ziel_iata = input.ziel_iata.trim().toUpperCase();
    const ap = await resolveAirport(supabase, ziel_iata);
    if (ap) {
      ziel_lat = ap.lat;
      ziel_lon = ap.lon;
    }
  }

  // Multi-leg stops (Gabelflug): resolve each IATA to coordinates, keep order
  const flug_stops: { iata: string; lat: number; lon: number }[] = [];
  if (isFlight) {
    for (const raw of input.stops) {
      const code = raw.trim().toUpperCase();
      if (!code) continue;
      const ap = await resolveAirport(supabase, code);
      if (ap) flug_stops.push({ iata: code, lat: ap.lat, lon: ap.lon });
    }
  }

  const row = {
    ort: input.ort || null,
    land: input.land || null,
    land_iso3,
    lat,
    lon,
    art: input.art,
    anreise: input.anreise,
    abflug_iata,
    abflug_lat,
    abflug_lon,
    ziel_iata,
    ziel_lat,
    ziel_lon,
    flug_stops,
    datum_start: input.datum_start,
    datum_ende: input.datum_ende,
    tage,
    wer_von_uns: input.wer_von_uns,
    wer_sonst: input.wer_sonst,
    kommentar: input.kommentar,
  };

  let id = input.id;
  if (id) {
    const { error } = await supabase.from("trips").update(row).eq("id", id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("trips").insert(row).select("id").single();
    if (error) throw error;
    id = data.id;
  }

  revalidatePath("/");
  return { id: id! };
}

export async function fetchTripPhotos(tripId: string): Promise<SignedPhoto[]> {
  return getTripPhotos(tripId);
}

export type AirportHit = { iata: string; name: string; city: string | null };

/** Search airports by IATA code, city or name (for the form's combobox). */
export async function searchAirports(q: string): Promise<AirportHit[]> {
  const query = q.trim().replace(/[,%*()]/g, "");
  if (query.length < 2) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("airports")
    .select("iata, name, city")
    .or(`iata.ilike.${query}%,city.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(20);
  const rows = data ?? [];
  const ql = query.toLowerCase();
  const rank = (a: AirportHit) =>
    a.iata.toLowerCase() === ql ? 0
    : a.iata.toLowerCase().startsWith(ql) ? 1
    : (a.city ?? "").toLowerCase().startsWith(ql) ? 2
    : 3;
  return rows.sort((a, b) => rank(a) - rank(b)).slice(0, 8);
}

export async function addWish(land: string): Promise<{ ok: boolean; error?: string }> {
  const name = land.trim();
  if (!name) return { ok: false, error: "Land fehlt." };
  const iso3 = toIso3(name);
  if (!iso3) return { ok: false, error: `„${name}" konnte keinem Land zugeordnet werden.` };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("wishlist")
    .upsert({ iso3, land: name }, { onConflict: "iso3" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/ziele");
  return { ok: true };
}

export async function removeWish(iso3: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("wishlist").delete().eq("iso3", iso3);
  revalidatePath("/ziele");
}

export async function deleteTrip(id: string): Promise<void> {
  const supabase = createAdminClient();
  // remove stored photos for this trip
  const { data: files } = await supabase.storage.from(BUCKET).list(id);
  if (files?.length) {
    await supabase.storage.from(BUCKET).remove(files.map((f) => `${id}/${f.name}`));
  }
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
}

/** Upload one or more photos for a trip; first becomes cover if none set. */
export async function uploadPhotos(tripId: string, formData: FormData): Promise<void> {
  const supabase = createAdminClient();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return;

  const { data: trip } = await supabase
    .from("trips")
    .select("cover_photo_url")
    .eq("id", tripId)
    .maybeSingle();
  const { count } = await supabase
    .from("trip_photos")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId);

  let sort = count ?? 0;
  let cover = trip?.cover_photo_url ?? null;

  for (const file of files) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${tripId}/${sort}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) throw upErr;
    await supabase.from("trip_photos").insert({ trip_id: tripId, url: path, sort });
    if (!cover) cover = path;
    sort++;
  }

  if (cover && cover !== trip?.cover_photo_url) {
    await supabase.from("trips").update({ cover_photo_url: cover }).eq("id", tripId);
  }
  revalidatePath("/");
}

export async function setCoverPhoto(tripId: string, path: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("trips").update({ cover_photo_url: path }).eq("id", tripId);
  if (error) throw error;
  revalidatePath("/");
}

export async function deletePhoto(photoId: string, path: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.storage.from(BUCKET).remove([path]);
  await supabase.from("trip_photos").delete().eq("id", photoId);
  revalidatePath("/");
}
