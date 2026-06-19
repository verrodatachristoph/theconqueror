"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth";
import { geocode } from "@/lib/geocode";

type Result = { ok: boolean; error?: string };

function revalidateAll() {
  revalidatePath("/", "layout");
}

// ── Persons ────────────────────────────────────────────────────────────────
export async function createPerson(code: string, name: string, farbe: string): Promise<Result> {
  const c = code.trim().toUpperCase();
  if (!c) return { ok: false, error: "Kürzel fehlt." };
  if (!name.trim()) return { ok: false, error: "Name fehlt." };
  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("persons").select("code").eq("code", c).maybeSingle();
  if (existing) return { ok: false, error: `Kürzel „${c}" existiert bereits.` };
  const { error } = await supabase.from("persons").insert({ code: c, name: name.trim(), farbe });
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function updatePerson(code: string, name: string, farbe: string): Promise<Result> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("persons")
    .update({ name: name.trim(), farbe })
    .eq("code", code);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deletePerson(code: string): Promise<Result> {
  const supabase = createAdminClient();
  // strip the code from any trips that reference it
  const { data: affected } = await supabase
    .from("trips")
    .select("id, wer_von_uns")
    .contains("wer_von_uns", [code]);
  for (const t of affected ?? []) {
    await supabase
      .from("trips")
      .update({ wer_von_uns: (t.wer_von_uns ?? []).filter((c) => c !== code) })
      .eq("id", t.id);
  }
  const { error } = await supabase.from("persons").delete().eq("code", code);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

// ── Settings ───────────────────────────────────────────────────────────────
export async function saveSettings(input: {
  home_label: string;
  home_lat: number | null;
  home_lon: number | null;
  default_airport: string | null;
}): Promise<Result> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      home_label: input.home_label.trim() || "Zuhause",
      home_lat: input.home_lat,
      home_lon: input.home_lon,
      default_airport: input.default_airport?.trim().toUpperCase() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

/** Geocode a place name to coordinates (for the home location picker). */
export async function geocodeHome(query: string): Promise<{ lat: number; lon: number } | null> {
  if (!query.trim()) return null;
  const geo = await geocode(query.trim(), "");
  return geo ? { lat: geo.lat, lon: geo.lon } : null;
}

export async function changePassword(newPassword: string): Promise<Result> {
  if (newPassword.length < 4) return { ok: false, error: "Passwort zu kurz (min. 4 Zeichen)." };
  const hash = await hashPassword(process.env.AUTH_SECRET!, newPassword);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ password_hash: hash, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

// ── Achievements ─────────────────────────────────────────────────────────────
export async function saveAchievement(def: {
  id: string;
  icon: string;
  title: string;
  descr: string;
  metric: string;
  target: number;
  sort: number;
  enabled: boolean;
}): Promise<Result> {
  if (!def.id.trim()) return { ok: false, error: "ID fehlt." };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("achievements")
    .upsert({ ...def, id: def.id.trim() }, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteAchievement(id: string): Promise<Result> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("achievements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}
