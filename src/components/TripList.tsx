"use client";

import { useEffect, useState } from "react";
import type { Person } from "@/types/database.types";
import type { TripWithMedia } from "@/lib/data";
import { personColor, yearOf, isUpcoming, TRAVEL_MODE_ICON } from "@/lib/trips";
import { flagEmoji } from "@/lib/iso";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/components/i18n/LanguageProvider";

const PAGE_SIZE = 20;

export default function TripList({
  trips,
  persons,
  onOpen,
}: {
  trips: TripWithMedia[];
  persons: Person[];
  onOpen: (t: TripWithMedia) => void;
}) {
  const tr = useT();
  const nameByCode = new Map(persons.map((p) => [p.code, p.name]));

  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  // Reset to the first page whenever the (filtered/sorted) list changes.
  useEffect(() => {
    setPage(1);
  }, [trips]);

  if (!trips.length)
    return (
      <EmptyState icon="📍" title={tr("list.emptyTitle")} hint={tr("list.emptyHint")} />
    );

  const totalPages = Math.ceil(trips.length / PAGE_SIZE);
  const current = Math.min(page, totalPages);
  const paged = showAll ? trips : trips.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const hasPagination = trips.length > PAGE_SIZE;

  return (
    <>
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {paged.map((t) => {
        const needsAirport = t.travel_mode === "plane" && !t.departure_iata;
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
                    {TRAVEL_MODE_ICON[t.travel_mode ?? ""] ?? "📍"}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-ink">{t.place}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {flagEmoji(t.country_iso3)} {t.country}
                  </span>
                  {isUpcoming(t) && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: "#6d5bd020", color: "#6d5bd0" }}
                    >
                      {tr("common.planned")}
                    </span>
                  )}
                  {needsAirport && (
                    <span className="shrink-0 rounded-full bg-[var(--color-arc)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--color-arc)]">
                      {tr("tripDetail.needAirport")}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <span>{yearOf(t) ?? tr("common.none")}</span>
                  <span>·</span>
                  <span>
                    {TRAVEL_MODE_ICON[t.travel_mode ?? ""] ?? ""} {t.travel_mode ? tr("travelMode." + t.travel_mode) : tr("common.none")}
                  </span>
                  <span>·</span>
                  <span>{t.days ?? "?"} {tr("common.daysShort")}</span>
                </div>
              </div>

              <div className="flex shrink-0 -space-x-1">
                {(t.travelers ?? []).map((c) => (
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

    {hasPagination && (
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
        {!showAll && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-muted"
              aria-label={tr("list.prevPage")}
            >
              ‹
            </button>
            <span className="px-2 text-muted">{tr("list.pageOf", { page: current, total: totalPages })}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-muted"
              aria-label={tr("list.nextPage")}
            >
              ›
            </button>
          </div>
        )}
        <button
          onClick={() => setShowAll((s) => !s)}
          className="rounded-full border border-line px-3 py-1.5 text-muted transition-colors hover:text-ink"
        >
          {showAll ? tr("list.paginate") : tr("list.showAll", { n: trips.length })}
        </button>
      </div>
    )}
    </>
  );
}
