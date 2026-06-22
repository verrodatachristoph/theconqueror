"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import StatTile from "@/components/StatTile";
import { Stagger } from "@/components/motion";

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

      {/* Person submenu */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Profil von</span>
          <PersonMenu persons={persons} current={person} />
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
        >
          + Reise hinzufügen
        </button>
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
      <Stagger className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Reisen" value={s.trips} />
        <Tile label="Länder" value={s.countries} />
        <Tile label="Reisetage" value={s.days} />
        <Tile label="Flüge" value={s.flights} />
      </Stagger>

      {/* Highlights */}
      <Stagger className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          label="Längster Aufenthalt am Stück"
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
      </Stagger>

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
  return <StatTile label={label} value={value} sub={sub} />;
}

function PersonMenu({ persons, current }: { persons: Person[]; current: Person }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const dot = (p: Person) => (
    <span
      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: p.farbe }}
    >
      {p.code}
    </span>
  );

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Andere Person wählen"
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-2 pr-1 text-sm font-medium shadow-sm transition-colors hover:border-ink/30"
      >
        {dot(current)}
        {current.name}
        <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-muted">
          <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 min-w-[13rem] rounded-xl border border-line bg-surface p-1 shadow-lg">
          <div className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            Person wählen
          </div>
          {persons.map((p) => (
            <Link
              key={p.code}
              href={`/profil/${p.code}`}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-surface-2 ${
                p.code === current.code ? "bg-surface-2 font-medium" : ""
              }`}
            >
              {dot(p)}
              {p.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
