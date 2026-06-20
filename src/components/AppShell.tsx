"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Person } from "@/types/database.types";
import type { TripWithMedia } from "@/lib/data";
import { filterTrips } from "@/lib/trips";
import PersonFilter from "@/components/PersonFilter";
import Stats from "@/components/Stats";

// The d3 map is heavy and interactive — render it client-only to avoid
// floating-point projection mismatches between server and client.
const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-[980/500] w-full place-items-center rounded-xl bg-ocean text-sm text-muted">
      Karte lädt…
    </div>
  ),
});
import TripList from "@/components/TripList";
import TripForm from "@/components/TripForm";
import TripDetail from "@/components/TripDetail";
import TopNav from "@/components/TopNav";
import { Reveal } from "@/components/motion";

export default function AppShell({
  trips,
  persons,
  defaultAirport,
}: {
  trips: TripWithMedia[];
  persons: Person[];
  defaultAirport: string | null;
}) {
  const allCodes = useMemo(() => persons.map((p) => p.code), [persons]);
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(persons.map((p) => p.code)));
  const [onlyMissingAirport, setOnlyMissingAirport] = useState(false);
  const [showArcs, setShowArcs] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"date" | "days" | "land">("date");
  const [editing, setEditing] = useState<TripWithMedia | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<TripWithMedia | null>(null);

  const toggle = (code: string) =>
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const byPerson = useMemo(() => filterTrips(trips, enabled), [trips, enabled]);
  const listTrips = useMemo(
    () =>
      onlyMissingAirport
        ? byPerson.filter((t) => t.anreise === "Flugzeug" && !t.abflug_iata)
        : byPerson,
    [byPerson, onlyMissingAirport],
  );
  const missingCount = useMemo(
    () => trips.filter((t) => t.anreise === "Flugzeug" && !t.abflug_iata).length,
    [trips],
  );
  const visibleList = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = q
      ? listTrips.filter((t) => `${t.ort ?? ""} ${t.land ?? ""}`.toLowerCase().includes(q))
      : listTrips;
    const sorted = [...arr];
    if (sort === "date") sorted.sort((a, b) => (b.datum_start ?? "").localeCompare(a.datum_start ?? ""));
    else if (sort === "days") sorted.sort((a, b) => (b.tage ?? 0) - (a.tage ?? 0));
    else sorted.sort((a, b) => (a.land ?? "").localeCompare(b.land ?? "", "de"));
    return sorted;
  }, [listTrips, query, sort]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (t: TripWithMedia) => {
    setDetail(null);
    setEditing(t);
    setFormOpen(true);
  };
  const openDetail = (t: TripWithMedia) => setDetail(t);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
      <TopNav>
        <button
          onClick={openNew}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
        >
          + Neuer Aufenthalt
        </button>
      </TopNav>

      <div className="mb-5">
        <PersonFilter
          persons={persons}
          enabled={enabled}
          onToggle={toggle}
          onAll={() => setEnabled(new Set(allCodes))}
        />
      </div>

      {/* Map hero — full-bleed on mobile, card on larger screens */}
      <section className="relative mb-6 -mx-4 border-y border-line bg-surface shadow-sm sm:mx-0 sm:rounded-2xl sm:border sm:p-3">
        <WorldMap
          trips={byPerson}
          showArcs={showArcs}
          onSelectTrip={(t) => {
            const full = trips.find((x) => x.id === t.id);
            if (full) openDetail(full);
          }}
        />
        <button
          onClick={() => setShowArcs((v) => !v)}
          aria-pressed={showArcs}
          className={`absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm shadow-sm backdrop-blur transition-colors ${
            showArcs
              ? "border-[var(--color-arc)] bg-[var(--color-arc)]/15 text-[var(--color-arc)]"
              : "border-line bg-surface/90 text-muted hover:text-ink"
          }`}
        >
          <span
            className="h-2 w-4 rounded-full"
            style={{ background: showArcs ? "var(--color-arc)" : "var(--color-line)" }}
          />
          Fluglinien {showArcs ? "an" : "aus"}
        </button>
      </section>

      {/* Stats */}
      <section className="mb-8">
        <Stats trips={byPerson} />
      </section>

      {/* List */}
      <Reveal as="section">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-semibold">
            Aufenthalte <span className="text-sm font-normal text-muted">({visibleList.length})</span>
          </h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen…"
            className="w-36 rounded-full border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent sm:w-48"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
            title="Sortierung"
          >
            <option value="date">Neueste zuerst</option>
            <option value="days">Längste zuerst</option>
            <option value="land">Land A–Z</option>
          </select>
          <button
            onClick={() => setOnlyMissingAirport((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              onlyMissingAirport
                ? "border-[var(--color-arc)] bg-[var(--color-arc)]/10 text-[var(--color-arc)]"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            ✈️ ohne Abflughafen{missingCount ? ` (${missingCount})` : ""}
          </button>
        </div>
        <TripList trips={visibleList} persons={persons} onOpen={openDetail} />
      </Reveal>

      {detail && (
        <TripDetail
          trip={detail}
          persons={persons}
          onClose={() => setDetail(null)}
          onEdit={openEdit}
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
