"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Person } from "@/types/database.types";
import type { TripWithMedia } from "@/lib/data";
import { filterTrips, yearOf, isUpcoming, daysUntil } from "@/lib/trips";
import { flagEmoji } from "@/lib/iso";
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
  wishlist,
  readOnly = false,
}: {
  trips: TripWithMedia[];
  persons: Person[];
  defaultAirport: string | null;
  wishlist: string[];
  readOnly?: boolean;
}) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [onlyMissingAirport, setOnlyMissingAirport] = useState(false);
  const [showArcs, setShowArcs] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"date" | "days" | "country">("date");
  const [focused, setFocused] = useState<string | null>(null);
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
        ? byPerson.filter((t) => t.travel_mode === "plane" && !t.departure_iata)
        : byPerson,
    [byPerson, onlyMissingAirport],
  );
  const missingCount = useMemo(
    () => trips.filter((t) => t.travel_mode === "plane" && !t.departure_iata).length,
    [trips],
  );
  const focusedTrips = useMemo(
    () => (focused ? byPerson.filter((t) => t.country_iso3 === focused) : []),
    [byPerson, focused],
  );

  const nextTrip = useMemo(() => {
    const up = byPerson
      .filter(isUpcoming)
      .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));
    return up[0] ?? null;
  }, [byPerson]);

  const visibleList = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = q
      ? listTrips.filter((t) => `${t.place ?? ""} ${t.country ?? ""}`.toLowerCase().includes(q))
      : listTrips;
    const sorted = [...arr];
    if (sort === "date") sorted.sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""));
    else if (sort === "days") sorted.sort((a, b) => (b.days ?? 0) - (a.days ?? 0));
    else sorted.sort((a, b) => (a.country ?? "").localeCompare(b.country ?? "", "de"));
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
      {readOnly ? (
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-lg font-semibold tracking-tight md:text-xl">The Conqueror</span>
          <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted">
            geteilte Ansicht
          </span>
        </header>
      ) : (
        <TopNav>
          <button
            onClick={openNew}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
          >
            + Neuer Aufenthalt
          </button>
        </TopNav>
      )}

      <div className="mb-5">
        <PersonFilter
          persons={persons}
          enabled={enabled}
          onToggle={toggle}
          onAll={() => setEnabled(new Set())}
        />
      </div>

      {/* Countdown to the next planned trip */}
      {nextTrip && (
        <div
          className="mb-5 flex items-center gap-3 rounded-2xl border p-4"
          style={{ borderColor: "#6d5bd055", background: "#6d5bd012" }}
        >
          <span className="text-2xl">🔜</span>
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#6d5bd0" }}>
              Nächste Reise
            </div>
            <div className="truncate font-semibold text-ink">
              {nextTrip.place} {flagEmoji(nextTrip.country_iso3)}
              {nextTrip.start_date && (
                <span className="font-normal text-muted">
                  {" "}
                  · in {daysUntil(nextTrip.start_date)} Tagen
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map hero — full-bleed on mobile, card on larger screens */}
      <section className="relative mb-6 -mx-4 border-y border-line bg-surface shadow-sm sm:mx-0 sm:rounded-2xl sm:border sm:p-3">
        <WorldMap
          trips={byPerson}
          showArcs={showArcs}
          wishlist={wishlist}
          focusIso={focused}
          onSelectCountry={setFocused}
          onSelectTrip={(t) => {
            const full = trips.find((x) => x.id === t.id);
            if (full) openDetail(full);
          }}
        />
        <button
          onClick={() => setShowArcs((v) => !v)}
          aria-pressed={showArcs}
          className={`absolute right-5 top-5 z-10 flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm shadow-sm backdrop-blur transition-colors ${
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

        {/* Desktop: compact country panel inside the map */}
        {focused && (
          <div className="absolute left-5 top-5 z-10 hidden max-h-[70%] w-64 flex-col overflow-hidden rounded-xl border border-line bg-surface/95 shadow-lg backdrop-blur sm:flex">
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <span className="truncate text-sm font-semibold">
                {flagEmoji(focused)} {focusedTrips[0]?.country ?? focused}
                <span className="ml-1 font-normal text-muted">({focusedTrips.length})</span>
              </span>
              <button
                onClick={() => setFocused(null)}
                aria-label="Schließen"
                className="shrink-0 text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
            <ul className="overflow-y-auto py-1">
              {focusedTrips.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => openDetail(t)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface-2"
                  >
                    <span className="truncate">{t.place}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted">{yearOf(t) ?? ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Country focus panel — mobile only (desktop uses the in-map overlay) */}
      {focused && (
        <Reveal as="section" className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:hidden">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {flagEmoji(focused)} {focusedTrips[0]?.country ?? focused}{" "}
              <span className="text-sm font-normal text-muted">({focusedTrips.length})</span>
            </h2>
            <button
              onClick={() => setFocused(null)}
              className="rounded-full border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
            >
              Schließen ✕
            </button>
          </div>
          <TripList trips={focusedTrips} persons={persons} onOpen={openDetail} />
        </Reveal>
      )}

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
            <option value="country">Land A–Z</option>
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
          readOnly={readOnly}
        />
      )}

      {formOpen && !readOnly && (
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
