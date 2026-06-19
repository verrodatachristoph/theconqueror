"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Person } from "@/types/database.types";
import type { TripWithMedia } from "@/lib/data";
import { personColor } from "@/lib/trips";
import { personStats, overviewStats, tripsOf, type Home } from "@/lib/stats";
import TopNav from "@/components/TopNav";
import TripList from "@/components/TripList";
import TripDetail from "@/components/TripDetail";
import TripForm from "@/components/TripForm";

const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-[980/500] w-full place-items-center rounded-xl bg-ocean text-sm text-muted">
      Karte lädt…
    </div>
  ),
});

export default function ProfilPage({
  person,
  persons,
  trips,
  home,
  defaultAirport,
}: {
  person: Person;
  persons: Person[];
  trips: TripWithMedia[];
  home: Home;
  defaultAirport: string | null;
}) {
  const [detail, setDetail] = useState<TripWithMedia | null>(null);
  const [editing, setEditing] = useState<TripWithMedia | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const mine = useMemo(() => tripsOf(trips, person.code) as TripWithMedia[], [trips, person.code]);
  const s = useMemo(() => personStats(trips, person.code), [trips, person.code]);
  const ov = useMemo(() => overviewStats(mine, home), [mine, home]);
  const color = personColor(persons, person.code);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
      <TopNav />

      {/* Person switcher */}
      <div className="mb-6 flex flex-wrap gap-2">
        {persons.map((p) => {
          const active = p.code === person.code;
          return (
            <Link
              key={p.code}
              href={`/profil/${p.code}`}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                active ? "border-transparent text-white shadow-sm" : "border-line bg-surface text-ink hover:border-ink/30"
              }`}
              style={active ? { backgroundColor: personColor(persons, p.code) } : undefined}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : personColor(persons, p.code) }}
              >
                {p.code}
              </span>
              {p.name}
            </Link>
          );
        })}
      </div>

      {/* Hero */}
      <div className="mb-6 flex items-center gap-4 rounded-3xl border border-line bg-surface p-5">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {person.code}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{person.name}</h1>
          <p className="text-sm text-muted">
            war auf <b className="text-ink">{s.trips}</b> Reisen in{" "}
            <b className="text-ink">{s.countries}</b> Ländern ·{" "}
            <b className="text-ink">{s.days}</b> Tage unterwegs
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Reisen" value={s.trips} />
        <Tile label="Länder" value={s.countries} />
        <Tile label="Reisetage" value={s.days} />
        <Tile label="Flüge" value={s.flights} />
      </div>

      {/* Highlights */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          label="Längster Aufenthalt"
          value={s.longest ? `${s.longest.tage} T` : "–"}
          sub={s.longest?.ort ?? undefined}
        />
        <Tile
          label="Weitester Ort"
          value={ov.farthest ? ov.farthest.ort : "–"}
          sub={ov.farthest ? `${ov.farthest.km.toLocaleString("de")} km` : undefined}
        />
        <Tile
          label="Meistbesuchtes Land"
          value={s.topCountry ? s.topCountry[0] : "–"}
          sub={s.topCountry ? `${s.topCountry[1]}×` : undefined}
        />
        <Tile
          label="Zeitraum"
          value={s.firstYear ? `${s.firstYear}–${s.lastYear}` : "–"}
          sub={`${ov.continents.length} Kontinente`}
        />
      </div>

      {/* Map */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-2 shadow-sm md:p-3">
        <WorldMap
          trips={mine}
          onSelectTrip={(t) => {
            const full = trips.find((x) => x.id === t.id);
            if (full) setDetail(full);
          }}
        />
      </section>

      {/* Trips */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Reisen <span className="text-sm font-normal text-muted">({mine.length})</span>
        </h2>
        <TripList trips={mine} persons={persons} onOpen={setDetail} />
      </section>

      {detail && (
        <TripDetail
          trip={detail}
          persons={persons}
          onClose={() => setDetail(null)}
          onEdit={(t) => {
            setDetail(null);
            setEditing(t);
            setFormOpen(true);
          }}
        />
      )}
      {formOpen && (
        <TripForm
          trip={editing}
          persons={persons}
          defaultAirport={defaultAirport}
          onClose={() => setFormOpen(false)}
        />
      )}
    </main>
  );
}

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="truncate text-xl font-semibold text-ink" title={String(value)}>
        {value}
      </div>
      {sub && <div className="truncate text-xs text-muted">{sub}</div>}
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
