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
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface shadow-sm transition-transform hover:scale-[1.02]"
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

      {/* Map hero */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-2 shadow-sm md:p-3">
        <div className="mb-2 flex justify-end px-1">
          <button
            onClick={() => setShowArcs((v) => !v)}
            aria-pressed={showArcs}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              showArcs
                ? "border-[var(--color-arc)] bg-[var(--color-arc)]/10 text-[var(--color-arc)]"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            <span
              className="h-2 w-4 rounded-full"
              style={{ background: showArcs ? "var(--color-arc)" : "var(--color-line)" }}
            />
            Fluglinien {showArcs ? "an" : "aus"}
          </button>
        </div>
        <WorldMap
          trips={byPerson}
          showArcs={showArcs}
          onSelectTrip={(t) => {
            const full = trips.find((x) => x.id === t.id);
            if (full) openDetail(full);
          }}
        />
      </section>

      {/* Stats */}
      <section className="mb-8">
        <Stats trips={byPerson} />
      </section>

      {/* List */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Aufenthalte <span className="text-sm font-normal text-muted">({listTrips.length})</span>
          </h2>
          <button
            onClick={() => setOnlyMissingAirport((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              onlyMissingAirport
                ? "border-[var(--color-arc)] bg-[var(--color-arc)]/10 text-[var(--color-arc)]"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            ✈️ Flüge ohne Abflughafen{missingCount ? ` (${missingCount})` : ""}
          </button>
        </div>
        <TripList trips={listTrips} persons={persons} onOpen={openDetail} />
      </section>

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
