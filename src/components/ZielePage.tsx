"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Person } from "@/types/database.types";
import type { TripWithMedia, Wish, AchievementDef } from "@/lib/data";
import { germanCountryNames } from "@/lib/iso";
import { achievementAggregates, evaluateAchievements, totalFlightKm, type Home } from "@/lib/stats";
import { addWish, removeWish } from "@/app/actions";
import TopNav from "@/components/TopNav";

const EARTH_KM = 40075;
const COUNTRY_NAMES = germanCountryNames();

export default function ZielePage({
  trips,
  persons,
  wishlist,
  home,
  achievementDefs,
}: {
  trips: TripWithMedia[];
  persons: Person[];
  wishlist: Wish[];
  home: Home;
  achievementDefs: AchievementDef[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [land, setLand] = useState("");
  const [error, setError] = useState<string | null>(null);

  const allCodes = useMemo(() => persons.map((p) => p.code), [persons]);
  const badges = useMemo(
    () => evaluateAchievements(achievementDefs, achievementAggregates(trips, allCodes, home)),
    [achievementDefs, trips, allCodes, home],
  );
  const flightKm = useMemo(() => totalFlightKm(trips), [trips]);
  const visited = useMemo(
    () => new Set(trips.map((t) => t.land_iso3).filter(Boolean)),
    [trips],
  );
  const earnedCount = badges.filter((b) => b.earned).length;

  async function submitWish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await addWish(land);
    if (!res.ok) return setError(res.error ?? "Fehler.");
    setLand("");
    startTransition(() => router.refresh());
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
      <TopNav />

      {/* Flight kilometres */}
      <section className="mb-8 rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted">Geflogene Distanz</div>
            <div className="text-4xl font-semibold tabular-nums text-ink">
              {flightKm.toLocaleString("de")} <span className="text-xl text-muted">km</span>
            </div>
          </div>
          <div className="text-right text-sm text-muted">
            <div className="text-2xl font-semibold text-accent">
              {(flightKm / EARTH_KM).toFixed(1)}×
            </div>
            um die Welt
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.min(100, ((flightKm % EARTH_KM) / EARTH_KM) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Summe aller Flüge mit hinterlegtem Abflughafen. Erdumfang ≈ {EARTH_KM.toLocaleString("de")} km.
        </p>
      </section>

      {/* Achievements */}
      <section className="mb-8">
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="text-lg font-semibold">Erfolge</h2>
          <span className="text-sm text-muted">
            {earnedCount} / {badges.length} freigeschaltet
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border p-4 transition-colors ${
                b.earned ? "border-accent/40 bg-accent-soft/40" : "border-line bg-surface"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${b.earned ? "" : "opacity-40 grayscale"}`}>{b.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-medium text-ink">
                    {b.title}
                    {b.earned && <span className="text-accent">✓</span>}
                  </div>
                  <div className="truncate text-xs text-muted">{b.desc}</div>
                </div>
              </div>
              {!b.earned && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent/60"
                      style={{ width: `${Math.min(100, (b.current / b.target) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-[11px] text-muted">
                    {b.current.toLocaleString("de")} / {b.target.toLocaleString("de")}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Wishlist */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Wunschliste</h2>
        <form onSubmit={submitWish} className="mb-4 flex flex-wrap gap-2">
          <input
            list="wish-country-list"
            value={land}
            onChange={(e) => setLand(e.target.value)}
            placeholder="Land hinzufügen…"
            className="min-w-[12rem] flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <datalist id="wish-country-list">
            {COUNTRY_NAMES.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface disabled:opacity-50"
          >
            Hinzufügen
          </button>
        </form>
        {error && <p className="mb-3 text-sm text-[var(--color-arc)]">{error}</p>}

        {wishlist.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Wunschziele. Wohin als Nächstes?</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {wishlist.map((w) => {
              const seen = visited.has(w.iso3);
              return (
                <li
                  key={w.iso3}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                    seen ? "border-accent/40 bg-accent-soft/40 text-ink" : "border-line bg-surface text-ink"
                  }`}
                >
                  <span>{w.land}</span>
                  {seen && <span className="text-xs text-accent">✓ schon besucht</span>}
                  <button
                    onClick={() => startTransition(async () => { await removeWish(w.iso3); router.refresh(); })}
                    className="text-muted hover:text-ink"
                    title="Entfernen"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
