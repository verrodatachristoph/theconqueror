"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Person, Anreise } from "@/types/database.types";
import type { TripWithMedia } from "@/lib/data";
import type { SignedPhoto } from "@/lib/data";
import { toIso3, germanCountryNames } from "@/lib/iso";
import { personColor, computeTage } from "@/lib/trips";
import { motion } from "framer-motion";
import { compressImage } from "@/lib/image";
import AirportInput from "@/components/AirportInput";
import {
  saveTrip,
  uploadPhotos,
  fetchTripPhotos,
  deleteTrip,
  deletePhoto,
  setCoverPhoto,
} from "@/app/actions";

const ARTEN = ["Hotel", "Ferienwohnung", "Ferienhaus", "Resort", "Campingplatz", "Familienhotel"];
const ANREISEN: Anreise[] = ["Auto", "Flugzeug", "Zug"];
const COUNTRY_NAMES = germanCountryNames();

export default function TripForm({
  trip,
  persons,
  defaultAirport,
  onClose,
}: {
  trip: TripWithMedia | null;
  persons: Person[];
  defaultAirport?: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!trip;

  const [ort, setOrt] = useState(trip?.ort ?? "");
  const [land, setLand] = useState(trip?.land ?? "");
  const [art, setArt] = useState(trip?.art ?? "");
  const [anreise, setAnreise] = useState<Anreise | "">(trip?.anreise ?? "");
  const [abflug, setAbflug] = useState(trip?.abflug_iata ?? defaultAirport ?? "");
  const [ziel, setZiel] = useState(trip?.ziel_iata ?? "");
  const [stops, setStops] = useState<string[]>(() => (trip?.flug_stops ?? []).map((s) => s.iata));
  const [start, setStart] = useState(trip?.datum_start ?? "");
  const [ende, setEnde] = useState(trip?.datum_ende ?? "");
  const [wer, setWer] = useState<Set<string>>(new Set(trip?.wer_von_uns ?? []));
  const [werSonst, setWerSonst] = useState(trip?.wer_sonst ?? "");
  const [kommentar, setKommentar] = useState(trip?.kommentar ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [photos, setPhotos] = useState<SignedPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (trip) fetchTripPhotos(trip.id).then(setPhotos).catch(() => {});
  }, [trip]);

  const iso = toIso3(land);
  const isFlight = anreise === "Flugzeug";
  const tage = computeTage(start, ende);

  const toggleWer = (code: string) =>
    setWer((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  async function handleSave() {
    setError(null);
    if (!ort.trim()) return setError("Ort fehlt.");
    if (!land.trim()) return setError("Land fehlt.");
    if (isFlight && !abflug.trim()) return setError("Abflughafen ist bei Flügen Pflicht.");
    setSaving(true);
    try {
      const { id } = await saveTrip({
        id: trip?.id,
        ort: ort.trim(),
        land: land.trim(),
        art: art.trim() || null,
        anreise: anreise || null,
        abflug_iata: isFlight ? abflug.trim() : null,
        ziel_iata: isFlight ? ziel.trim() : null,
        stops: isFlight ? stops.map((s) => s.trim()).filter(Boolean) : [],
        datum_start: start || null,
        datum_ende: ende || null,
        wer_von_uns: [...wer],
        wer_sonst: werSonst.trim() || null,
        kommentar: kommentar.trim() || null,
      });
      if (files.length) {
        const fd = new FormData();
        for (const f of files) fd.append("files", await compressImage(f));
        await uploadPhotos(id, fd);
      }
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!trip) return;
    if (!confirm(`„${trip.ort}" wirklich löschen?`)) return;
    setSaving(true);
    try {
      await deleteTrip(trip.id);
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen.");
      setSaving(false);
    }
  }

  async function removePhoto(p: SignedPhoto) {
    await deletePhoto(p.id, p.path);
    setPhotos((ps) => ps.filter((x) => x.id !== p.id));
    router.refresh();
  }
  async function makeCover(p: SignedPhoto) {
    if (!trip) return;
    await setCoverPhoto(trip.id, p.path);
    router.refresh();
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEdit ? "Aufenthalt bearbeiten" : "Neuer Aufenthalt"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Schließen">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ort" required>
              <input className={inputCls} value={ort} onChange={(e) => setOrt(e.target.value)} />
            </Field>
            <Field label="Land" required hint={land ? (iso ?? "kein ISO-Code") : undefined}>
              <input
                className={inputCls}
                list="country-list"
                value={land}
                onChange={(e) => setLand(e.target.value)}
              />
              <datalist id="country-list">
                {COUNTRY_NAMES.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Art">
              <input className={inputCls} list="art-list" value={art} onChange={(e) => setArt(e.target.value)} />
              <datalist id="art-list">
                {ARTEN.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </Field>
            <Field label="Anreise">
              <select
                className={inputCls}
                value={anreise}
                onChange={(e) => setAnreise(e.target.value as Anreise | "")}
              >
                <option value="">—</option>
                {ANREISEN.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {isFlight && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Abflughafen" required hint="Stadt oder IATA">
                <AirportInput value={abflug} onChange={setAbflug} placeholder="z.B. Frankfurt" className={inputCls} />
              </Field>
              <Field label="Zielflughafen" hint="optional, Stadt oder IATA">
                <AirportInput value={ziel} onChange={setZiel} placeholder="z.B. Honolulu" className={inputCls} />
              </Field>
            </div>
          )}

          {isFlight && (
            <Field label="Zwischenstopps" hint="Gabelflug — jede Teilstrecke zählt als Flug">
              <div className="space-y-2">
                {stops.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs text-muted">{i + 1}.</span>
                    <div className="flex-1">
                      <AirportInput
                        value={s}
                        onChange={(v) => setStops((prev) => prev.map((x, j) => (j === i ? v : x)))}
                        placeholder="z.B. Vancouver"
                        className={`${inputCls} w-full`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setStops((prev) => prev.filter((_, j) => j !== i))}
                      className="px-2 text-muted hover:text-ink"
                      title="Entfernen"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setStops((prev) => [...prev, ""])}
                  className="rounded-lg border border-dashed border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
                >
                  + Stopp hinzufügen
                </button>
              </div>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <input type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Ende" hint={tage ? `${tage} Tage` : undefined}>
              <input type="date" className={inputCls} value={ende} onChange={(e) => setEnde(e.target.value)} />
            </Field>
          </div>

          <Field label="Wer von uns">
            <div className="flex flex-wrap gap-2">
              {persons.map((p) => {
                const on = wer.has(p.code);
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => toggleWer(p.code)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                      on ? "border-transparent text-surface" : "border-line text-muted"
                    }`}
                    style={on ? { backgroundColor: personColor(persons, p.code) } : undefined}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: on ? "var(--color-surface)" : personColor(persons, p.code) }}
                    />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Wer sonst">
            <input
              className={inputCls}
              value={werSonst}
              onChange={(e) => setWerSonst(e.target.value)}
              placeholder="kommagetrennt"
            />
          </Field>

          <Field label="Kommentar">
            <textarea
              className={`${inputCls} min-h-[64px] resize-y`}
              value={kommentar}
              onChange={(e) => setKommentar(e.target.value)}
            />
          </Field>

          {/* Photos */}
          <Field label="Fotos">
            {photos.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt=""
                      className={`h-16 w-16 rounded-lg object-cover ring-2 ${
                        trip?.cover_photo_url === p.path ? "ring-accent" : "ring-transparent"
                      }`}
                    />
                    <div className="absolute inset-0 hidden items-center justify-center gap-1 rounded-lg bg-ink/50 group-hover:flex">
                      <button
                        type="button"
                        onClick={() => makeCover(p)}
                        title="Als Cover"
                        className="rounded bg-surface/90 px-1.5 text-xs"
                      >
                        ★
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(p)}
                        title="Löschen"
                        className="rounded bg-surface/90 px-1.5 text-xs"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-ink"
            />
            <p className="mt-1 text-xs text-muted">
              {files.length > 0 ? `${files.length} Datei(en) ausgewählt · ` : ""}
              Große Fotos (&gt;1&nbsp;MB) werden automatisch verkleinert.
            </p>
          </Field>

          {error && <p className="text-sm text-[var(--color-arc)]">{error}</p>}

          <div className="flex items-center justify-between pt-1">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="text-sm text-[var(--color-arc)] hover:underline disabled:opacity-50"
              >
                Löschen
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-ink"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-surface disabled:opacity-50"
              >
                {saving ? "Speichern…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-parchment/40 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">
          {label}
          {required && <span className="text-[var(--color-arc)]"> *</span>}
        </span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
