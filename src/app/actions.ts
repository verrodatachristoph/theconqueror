"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { toIso3 } from "@/lib/iso";
import { geocode } from "@/lib/geocode";
import { computeDays } from "@/lib/trips";
import { getTripPhotos, type SignedPhoto } from "@/lib/data";
import type { TravelMode } from "@/types/database.types";

export type TripInput = {
  id?: string;
  place: string;
  country: string;
  category: string | null;
  travel_mode: TravelMode | null;
  departure_iata: string | null;
  arrival_iata: string | null;
  stops: string[]; // ordered intermediate stop IATA codes (Gabelflug)
  start_date: string | null;
  end_date: string | null;
  travelers: string[];
  other_travelers: string | null;
  comment: string | null;
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
  const country_iso3 = toIso3(input.country);
  const days = computeDays(input.start_date, input.end_date);
  const isFlight = input.travel_mode === "plane";

  // Reuse existing destination coords unless place/country changed (preserve manual edits)
  let lat: number | null = null;
  let lon: number | null = null;
  let existing: { place: string | null; country: string | null; lat: number | null; lon: number | null } | null =
    null;
  if (input.id) {
    const { data } = await supabase
      .from("trips")
      .select("place, country, lat, lon")
      .eq("id", input.id)
      .maybeSingle();
    existing = data;
  }
  if (existing && existing.place === input.place && existing.country === input.country && existing.lat != null) {
    lat = Number(existing.lat);
    lon = Number(existing.lon);
  } else if (input.place || input.country) {
    const geo = await geocode(input.place, input.country);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
    }
  }

  // Departure airport coords (flights only)
  let departure_iata: string | null = null;
  let departure_lat: number | null = null;
  let departure_lon: number | null = null;
  if (isFlight && input.departure_iata?.trim()) {
    departure_iata = input.departure_iata.trim().toUpperCase();
    const ap = await resolveAirport(supabase, departure_iata);
    if (ap) {
      departure_lat = ap.lat;
      departure_lon = ap.lon;
    }
  }

  // Optional destination airport coords (flights only); else arc ends at the Ort
  let arrival_iata: string | null = null;
  let arrival_lat: number | null = null;
  let arrival_lon: number | null = null;
  if (isFlight && input.arrival_iata?.trim()) {
    arrival_iata = input.arrival_iata.trim().toUpperCase();
    const ap = await resolveAirport(supabase, arrival_iata);
    if (ap) {
      arrival_lat = ap.lat;
      arrival_lon = ap.lon;
    }
  }

  // Multi-leg stops (Gabelflug): resolve each IATA to coordinates, keep order
  const flight_stops: { iata: string; lat: number; lon: number }[] = [];
  if (isFlight) {
    for (const raw of input.stops) {
      const code = raw.trim().toUpperCase();
      if (!code) continue;
      const ap = await resolveAirport(supabase, code);
      if (ap) flight_stops.push({ iata: code, lat: ap.lat, lon: ap.lon });
    }
  }

  const row = {
    place: input.place || null,
    country: input.country || null,
    country_iso3,
    lat,
    lon,
    category: input.category,
    travel_mode: input.travel_mode,
    departure_iata,
    departure_lat,
    departure_lon,
    arrival_iata,
    arrival_lat,
    arrival_lon,
    flight_stops,
    start_date: input.start_date,
    end_date: input.end_date,
    days,
    travelers: input.travelers,
    other_travelers: input.other_travelers,
    comment: input.comment,
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

export async function addWish(country: string): Promise<{ ok: boolean; error?: string }> {
  const name = country.trim();
  if (!name) return { ok: false, error: "Land fehlt." };
  const iso3 = toIso3(name);
  if (!iso3) return { ok: false, error: `„${name}" konnte keinem Land zugeordnet werden.` };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("wishlist")
    .upsert({ iso3, country: name }, { onConflict: "iso3" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/destinations");
  return { ok: true };
}

export async function removeWish(iso3: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("wishlist").delete().eq("iso3", iso3);
  revalidatePath("/destinations");
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
