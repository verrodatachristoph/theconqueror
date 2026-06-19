"use client";

import type { Person } from "@/types/database.types";
import type { TripWithMedia } from "@/lib/data";
import { personColor, yearOf } from "@/lib/trips";
import { flagEmoji } from "@/lib/iso";
import EmptyState from "@/components/EmptyState";

const ANREISE_ICON: Record<string, string> = { Auto: "🚗", Flugzeug: "✈️", Zug: "🚆" };

export default function TripList({
  trips,
  persons,
  onOpen,
}: {
  trips: TripWithMedia[];
  persons: Person[];
  onOpen: (t: TripWithMedia) => void;
}) {
  const nameByCode = new Map(persons.map((p) => [p.code, p.name]));

  if (!trips.length)
    return (
      <EmptyState icon="📍" title="Keine Aufenthalte" hint="Für diese Auswahl gibt es nichts zu zeigen — Filter anpassen oder eine Reise anlegen." />
    );

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {trips.map((t) => {
        const needsAirport = t.anreise === "Flugzeug" && !t.abflug_iata;
        return (
          <li key={t.id}>
            <button
              onClick={() => onOpen(t)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {t.cover_signed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.cover_signed} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base opacity-60">
                    {ANREISE_ICON[t.anreise ?? ""] ?? "📍"}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-ink">{t.ort}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {flagEmoji(t.land_iso3)} {t.land}
                  </span>
                  {needsAirport && (
                    <span className="shrink-0 rounded-full bg-[var(--color-arc)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--color-arc)]">
                      Abflughafen nachtragen
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <span>{yearOf(t) ?? "—"}</span>
                  <span>·</span>
                  <span>
                    {ANREISE_ICON[t.anreise ?? ""] ?? ""} {t.anreise ?? "—"}
                  </span>
                  <span>·</span>
                  <span>{t.tage ?? "?"} T</span>
                </div>
              </div>

              <div className="flex shrink-0 -space-x-1">
                {(t.wer_von_uns ?? []).map((c) => (
                  <span
                    key={c}
                    title={nameByCode.get(c) ?? c}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-surface text-[10px] font-semibold text-surface"
                    style={{ backgroundColor: personColor(persons, c) }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
