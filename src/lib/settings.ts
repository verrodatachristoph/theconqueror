import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Home } from "@/lib/stats";

/** Client-safe subset of app settings (no password hash). */
export type PublicSettings = {
  homeLat: number | null;
  homeLon: number | null;
  homeLabel: string;
  defaultAirport: string | null;
};

export async function getSettings() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
  return data;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const s = await getSettings();
  return {
    homeLat: s?.home_lat != null ? Number(s.home_lat) : null,
    homeLon: s?.home_lon != null ? Number(s.home_lon) : null,
    homeLabel: s?.home_label ?? "Zuhause",
    defaultAirport: s?.default_airport ?? null,
  };
}

export function homeFrom(s: PublicSettings): Home {
  return { lat: s.homeLat, lon: s.homeLon, label: s.homeLabel };
}
