"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Person } from "@/types/database.types";
import type { TripWithMedia, SignedPhoto } from "@/lib/data";
import { fetchTripPhotos } from "@/app/actions";
import { personColor, yearOf, TRAVEL_MODE_ICON } from "@/lib/trips";
import { flagEmoji } from "@/lib/iso";
import { useT } from "@/components/i18n/LanguageProvider";

function fmt(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

export default function TripDetail({
  trip,
  persons,
  onClose,
  onEdit,
  readOnly = false,
}: {
  trip: TripWithMedia;
  persons: Person[];
  onClose: () => void;
  onEdit?: (t: TripWithMedia) => void;
  readOnly?: boolean;
}) {
  const t = useT();
  const [photos, setPhotos] = useState<SignedPhoto[]>([]);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    fetchTripPhotos(trip.id).then(setPhotos).catch(() => {});
  }, [trip.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightbox === null) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, onClose]);

  const who = persons.filter((p) => trip.travelers?.includes(p.code));
  const isFlight = trip.travel_mode === "plane";
  const routeNodes =
    isFlight && trip.departure_iata
      ? [
          trip.departure_iata,
          ...(trip.flight_stops ?? []).map((s) => s.iata),
          trip.arrival_iata ?? trip.place ?? "",
        ].filter(Boolean)
      : [];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Cover header */}
        <div className="relative h-44 w-full overflow-hidden rounded-t-3xl bg-surface-2 sm:h-52">
          {trip.cover_signed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trip.cover_signed} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl opacity-40">
              {TRAVEL_MODE_ICON[trip.travel_mode ?? ""] ?? "📍"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-ink"
            aria-label={t("tripDetail.close")}
          >
            ✕
          </button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-2xl font-semibold leading-tight drop-shadow">{trip.place}</h2>
            <p className="text-sm opacity-90 drop-shadow">
              {flagEmoji(trip.country_iso3)} {trip.country}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Meta label={t("tripDetail.period")} value={`${fmt(trip.start_date)} – ${fmt(trip.end_date)}`} />
            <Meta label={t("tripDetail.duration")} value={`${trip.days ?? "?"} ${t("common.days")}`} />
            <Meta
              label={t("travelMode.label")}
              value={`${TRAVEL_MODE_ICON[trip.travel_mode ?? ""] ?? ""} ${trip.travel_mode ? t("travelMode." + trip.travel_mode) : t("common.none")}`}
            />
            <Meta label={t("form.category")} value={trip.category ?? t("common.none")} />
          </div>

          {routeNodes.length >= 2 && (
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{t("tripDetail.flightRoute")}</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {routeNodes.map((n, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-xs text-[var(--color-arc)]">✈</span>}
                    <span className="rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold text-ink">{n}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Wer */}
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{t("tripDetail.whoWasThere")}</div>
            <div className="flex flex-wrap gap-2">
              {who.map((p) => (
                <span
                  key={p.code}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium text-white"
                  style={{ backgroundColor: personColor(persons, p.code) }}
                >
                  {p.name}
                </span>
              ))}
              {trip.other_travelers && (
                <span className="flex items-center rounded-full border border-line px-2.5 py-1 text-sm text-muted">
                  + {trip.other_travelers}
                </span>
              )}
            </div>
          </div>

          {trip.comment && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{t("form.comment")}</div>
              <p className="whitespace-pre-wrap text-sm text-ink/90">{trip.comment}</p>
            </div>
          )}

          {/* Photo gallery */}
          {photos.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                {t("tripDetail.photos", { n: photos.length })}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setLightbox(i)}
                    className="aspect-square overflow-hidden rounded-lg bg-surface-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.caption ?? ""} className="h-full w-full object-cover transition-transform hover:scale-105" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted">{yearOf(trip) ?? ""}</span>
            {!readOnly && onEdit && (
              <button
                onClick={() => onEdit(trip)}
                className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-surface transition-transform active:scale-95"
              >
                {t("tripDetail.edit")}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {lightbox !== null && photos[lightbox] && (
        <Lightbox
          photos={photos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNav={(i) => setLightbox((i + photos.length) % photos.length)}
        />
      )}
    </motion.div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 font-medium text-ink">{value}</div>
    </div>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onNav,
}: {
  photos: SignedPhoto[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNav(index - 1);
      if (e.key === "ArrowRight") onNav(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose, onNav]);

  const photo = photos[index];
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <button className="absolute right-4 top-4 text-2xl text-white/80" onClick={onClose} aria-label={t("tripDetail.close")}>
        ✕
      </button>
      {photos.length > 1 && (
        <button
          className="absolute left-3 text-3xl text-white/70 hover:text-white"
          onClick={(e) => { e.stopPropagation(); onNav(index - 1); }}
          aria-label={t("tripDetail.prev")}
        >
          ‹
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.caption ?? ""}
        className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {photos.length > 1 && (
        <button
          className="absolute right-3 text-3xl text-white/70 hover:text-white"
          onClick={(e) => { e.stopPropagation(); onNav(index + 1); }}
          aria-label={t("tripDetail.next")}
        >
          ›
        </button>
      )}
      <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/70">
        {index + 1} / {photos.length}
        {photo.caption ? ` · ${photo.caption}` : ""}
      </div>
    </motion.div>
  );
}
