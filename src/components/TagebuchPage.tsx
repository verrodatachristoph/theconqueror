"use client";

import { useMemo, useState } from "react";
import type { Person } from "@/types/database.types";
import type { TripWithMedia } from "@/lib/data";
import { filterTrips, personColor, yearOf } from "@/lib/trips";
import TopNav from "@/components/TopNav";
import PersonFilter from "@/components/PersonFilter";
import TripDetail from "@/components/TripDetail";
import TripForm from "@/components/TripForm";
import { Reveal } from "@/components/motion";

const ANREISE_ICON: Record<string, string> = { Auto: "🚗", Flugzeug: "✈️", Zug: "🚆" };

function fmt(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

export default function TagebuchPage({
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
  const [detail, setDetail] = useState<TripWithMedia | null>(null);
  const [editing, setEditing] = useState<TripWithMedia | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const toggle = (code: string) =>
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const byYear = useMemo(() => {
    const visible = filterTrips(trips, enabled).slice().sort((a, b) => {
      const da = a.datum_start ?? "";
      const db = b.datum_start ?? "";
      return db.localeCompare(da); // newest first
    });
    const groups = new Map<number, TripWithMedia[]>();
    for (const t of visible) {
      const y = yearOf(t) ?? 0;
      const list = groups.get(y);
      if (list) list.push(t);
      else groups.set(y, [t]);
    }
    return [...groups.entries()].sort((a, b) => b[0] - a[0]);
  }, [trips, enabled]);

  const nameByCode = new Map(persons.map((p) => [p.code, p.name]));

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
      <TopNav />

      <div className="mb-8">
        <PersonFilter
          persons={persons}
          enabled={enabled}
          onToggle={toggle}
          onAll={() => setEnabled(new Set(allCodes))}
        />
      </div>

      <div className="max-w-3xl">

      {byYear.map(([year, list]) => (
        <Reveal as="section" key={year} className="mb-8">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{year || "—"}</h2>
            <span className="text-sm text-muted">
              {list.length} {list.length === 1 ? "Reise" : "Reisen"}
            </span>
          </div>

          <ul className="space-y-3 border-l border-line pl-4 md:pl-6">
            {list.map((t) => (
              <li key={t.id} className="relative">
                <span className="absolute -left-[1.4rem] top-5 h-2.5 w-2.5 rounded-full border-2 border-parchment bg-accent md:-left-[1.65rem]" />
                <button
                  onClick={() => setDetail(t)}
                  className="flex w-full gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition-colors hover:bg-surface-2"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:h-24 sm:w-24">
                    {t.cover_signed ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.cover_signed} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl opacity-50">
                        {ANREISE_ICON[t.anreise ?? ""] ?? "📍"}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate text-base font-semibold text-ink">{t.ort}</h3>
                      <span className="shrink-0 text-xs text-muted">{t.land}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                      <span>
                        {fmt(t.datum_start)} – {fmt(t.datum_ende)}
                      </span>
                      <span>·</span>
                      <span>{t.tage ?? "?"} Tage</span>
                      <span>·</span>
                      <span>
                        {ANREISE_ICON[t.anreise ?? ""] ?? ""} {t.anreise ?? "—"}
                      </span>
                    </div>
                    {t.kommentar && (
                      <p className="mt-1 line-clamp-2 text-sm text-ink/80">{t.kommentar}</p>
                    )}
                    <div className="mt-1.5 flex gap-1">
                      {(t.wer_von_uns ?? []).map((c) => (
                        <span
                          key={c}
                          title={nameByCode.get(c) ?? c}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                          style={{ backgroundColor: personColor(persons, c) }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Reveal>
      ))}

        {!byYear.length && <p className="text-sm text-muted">Keine Aufenthalte für diese Auswahl.</p>}
      </div>

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
