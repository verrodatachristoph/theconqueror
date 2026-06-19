import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Trip, Person, Airport } from "@/types/database.types";

/**
 * Server-side data access.
 *
 * Access control is the shared-password gate (middleware + session cookie),
 * so reads/writes use the service-role client server-side. The secret key
 * never reaches the browser (all data flows through Server Components and
 * Server Actions). RLS still protects the DB against any direct API access.
 */

const BUCKET = "trip-photos";
const SIGN_TTL = 60 * 60; // 1h

export type TripWithMedia = Trip & { cover_signed: string | null };

export async function getTrips(): Promise<TripWithMedia[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("datum_start", { ascending: false });
  if (error) throw error;
  const trips = data ?? [];

  // sign cover thumbnails in one batch
  const covers = trips.map((t) => t.cover_photo_url).filter((p): p is string => !!p);
  const signed = new Map<string, string>();
  if (covers.length) {
    const { data: urls } = await supabase.storage.from(BUCKET).createSignedUrls(covers, SIGN_TTL);
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
  }

  return trips.map((t) => ({
    ...t,
    cover_signed: t.cover_photo_url ? (signed.get(t.cover_photo_url) ?? null) : null,
  }));
}

export async function getPersons(): Promise<Person[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("persons").select("*").order("code");
  if (error) throw error;
  return data ?? [];
}

export async function getAirports(): Promise<Airport[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("airports").select("*").order("iata");
  if (error) throw error;
  return data ?? [];
}

export type Wish = { iso3: string; land: string; created_at: string };

export async function getWishlist(): Promise<Wish[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("wishlist").select("*").order("land");
  if (error) throw error;
  return data ?? [];
}

export type AchievementDef = {
  id: string;
  icon: string;
  title: string;
  descr: string;
  metric: string;
  target: number;
  sort: number;
  enabled: boolean;
};

export async function getAchievementDefs(): Promise<AchievementDef[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("achievements").select("*").order("sort");
  if (error) throw error;
  return data ?? [];
}

export type SignedPhoto = { id: string; path: string; url: string; caption: string | null; sort: number };

export async function getTripPhotos(tripId: string): Promise<SignedPhoto[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("trip_photos")
    .select("*")
    .eq("trip_id", tripId)
    .order("sort");
  if (error) throw error;
  const photos = data ?? [];
  if (!photos.length) return [];

  const { data: urls } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(photos.map((p) => p.url), SIGN_TTL);
  const signed = new Map<string, string>();
  for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);

  return photos.map((p) => ({
    id: p.id,
    path: p.url,
    url: signed.get(p.url) ?? "",
    caption: p.caption,
    sort: p.sort,
  }));
}
