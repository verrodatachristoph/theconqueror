"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Person } from "@/types/database.types";
import type { AchievementDef } from "@/lib/data";
import type { PublicSettings } from "@/lib/settings";
import { ACHIEVEMENT_METRICS } from "@/lib/stats";
import TopNav from "@/components/TopNav";
import {
  createPerson,
  updatePerson,
  deletePerson,
  saveSettings,
  geocodeHome,
  changePassword,
  saveAchievement,
  deleteAchievement,
  updateSharing,
} from "@/app/admin-actions";

const METRIC_LABEL: Record<string, string> = {
  trips: "Reisen (Anzahl)",
  countries: "Länder (unique)",
  continents: "Kontinente",
  flights: "Flüge",
  maxDays: "Längster Aufenthalt (Tage)",
  maxKm: "Weiteste Distanz (km)",
  familyTrips: "Reisen mit allen",
  years: "Verschiedene Jahre",
};

const input = "rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

export default function AdminPage({
  persons,
  settings,
  achievementDefs,
}: {
  persons: Person[];
  settings: PublicSettings;
  achievementDefs: AchievementDef[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
      <TopNav />
      <div className="max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Admin</h1>
        <PersonsSection persons={persons} onChange={refresh} />
        <SettingsSection settings={settings} onChange={refresh} />
        <PasswordSection />
        <SharingSection token={settings.shareToken} onChange={refresh} />
        <AchievementsSection defs={achievementDefs} onChange={refresh} />
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

// ── Persons ──────────────────────────────────────────────────────────────────
function PersonsSection({ persons, onChange }: { persons: Person[]; onChange: () => void }) {
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b6ea5");
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    setErr(null);
    const res = await createPerson(newCode, newName, newColor);
    if (!res.ok) return setErr(res.error ?? "Fehler.");
    setNewCode("");
    setNewName("");
    onChange();
  }

  return (
    <Section title="Personen">
      <div className="space-y-2">
        {persons.map((p) => (
          <PersonRow key={p.code} person={p} onChange={onChange} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <input
          className={`${input} w-16`}
          placeholder="Kürzel"
          maxLength={3}
          value={newCode}
          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
        />
        <input
          className={`${input} flex-1`}
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="color"
          className="h-9 w-12 cursor-pointer rounded border border-line"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
        />
        <button onClick={add} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface">
          Anlegen
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-[var(--color-arc)]">{err}</p>}
    </Section>
  );
}

function PersonRow({ person, onChange }: { person: Person; onChange: () => void }) {
  const [name, setName] = useState(person.name);
  const [color, setColor] = useState(person.farbe);
  const dirty = name !== person.name || color !== person.farbe;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {person.code}
      </span>
      <input className={`${input} flex-1`} value={name} onChange={(e) => setName(e.target.value)} />
      <input
        type="color"
        className="h-9 w-12 cursor-pointer rounded border border-line"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <button
        disabled={!dirty}
        onClick={async () => {
          await updatePerson(person.code, name, color);
          onChange();
        }}
        className="rounded-lg border border-line px-3 py-2 text-sm disabled:opacity-40"
      >
        Speichern
      </button>
      <button
        onClick={async () => {
          if (confirm(`„${person.name}" löschen? Das Kürzel wird aus allen Reisen entfernt.`)) {
            await deletePerson(person.code);
            onChange();
          }
        }}
        className="rounded-lg px-2 py-2 text-sm text-[var(--color-arc)] hover:underline"
      >
        Löschen
      </button>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
function SettingsSection({ settings, onChange }: { settings: PublicSettings; onChange: () => void }) {
  const [label, setLabel] = useState(settings.homeLabel);
  const [lat, setLat] = useState(settings.homeLat?.toString() ?? "");
  const [lon, setLon] = useState(settings.homeLon?.toString() ?? "");
  const [airport, setAirport] = useState(settings.defaultAirport ?? "");
  const [geoQuery, setGeoQuery] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function doGeocode() {
    setMsg(null);
    const res = await geocodeHome(geoQuery);
    if (!res) return setMsg("Ort nicht gefunden.");
    setLat(res.lat.toFixed(4));
    setLon(res.lon.toFixed(4));
    if (!label.trim()) setLabel(geoQuery);
  }

  async function save() {
    setMsg(null);
    const res = await saveSettings({
      home_label: label,
      home_lat: lat ? Number(lat) : null,
      home_lon: lon ? Number(lon) : null,
      default_airport: airport || null,
    });
    setMsg(res.ok ? "Gespeichert ✓" : res.error ?? "Fehler.");
    if (res.ok) onChange();
  }

  return (
    <Section title="Heimat-Ort & Standard-Abflughafen">
      <p className="mb-3 text-xs text-muted">
        Der Heimat-Ort ist der Bezugspunkt für „Weitester Ort"/„Fernweh". Standard-Abflughafen füllt
        das Reise-Formular vor.
      </p>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-xs text-muted">Ort suchen (geocoden)</span>
          <input
            className={`${input} w-full`}
            placeholder="z.B. Berlin"
            value={geoQuery}
            onChange={(e) => setGeoQuery(e.target.value)}
          />
        </label>
        <button onClick={doGeocode} className="rounded-lg border border-line px-3 py-2 text-sm">
          Koordinaten holen
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Labeled label="Bezeichnung">
          <input className={`${input} w-full`} value={label} onChange={(e) => setLabel(e.target.value)} />
        </Labeled>
        <Labeled label="Breite (lat)">
          <input className={`${input} w-full`} value={lat} onChange={(e) => setLat(e.target.value)} />
        </Labeled>
        <Labeled label="Länge (lon)">
          <input className={`${input} w-full`} value={lon} onChange={(e) => setLon(e.target.value)} />
        </Labeled>
        <Labeled label="Standard-Abflughafen">
          <input
            className={`${input} w-full`}
            placeholder="z.B. FRA"
            value={airport}
            onChange={(e) => setAirport(e.target.value.toUpperCase())}
          />
        </Labeled>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface">
          Speichern
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </Section>
  );
}

function SharingSection({ token, onChange }: { token: string | null; onChange: () => void }) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLink(token ? `${window.location.origin}/s/${token}` : "");
  }, [token]);

  const act = async (a: "enable" | "regenerate" | "disable") => {
    setBusy(true);
    await updateSharing(a);
    setBusy(false);
    onChange();
  };

  return (
    <Section title="Öffentlicher Teilen-Link">
      <p className="mb-3 text-xs text-muted">
        Eine schreibgeschützte Ansicht (Karte &amp; Statistik) ohne Passwort. Jeder mit dem Link kann sie
        sehen — zum Deaktivieren einfach den Link zurückziehen.
      </p>
      {token ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className={`${input} flex-1`} />
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            >
              {copied ? "Kopiert ✓" : "Kopieren"}
            </button>
            <a href={link} target="_blank" rel="noreferrer" className="rounded-lg border border-line px-3 py-2 text-sm">
              Öffnen
            </a>
          </div>
          <div className="flex gap-4 text-sm">
            <button onClick={() => act("regenerate")} disabled={busy} className="text-muted hover:text-ink disabled:opacity-50">
              Neuen Link erzeugen
            </button>
            <button onClick={() => act("disable")} disabled={busy} className="text-[var(--color-arc)] hover:underline disabled:opacity-50">
              Teilen deaktivieren
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => act("enable")}
          disabled={busy}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface disabled:opacity-50"
        >
          Teilen aktivieren
        </button>
      )}
    </Section>
  );
}

function PasswordSection() {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Section title="Familien-Passwort ändern">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          className={`${input} flex-1`}
          placeholder="Neues Passwort"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <button
          onClick={async () => {
            const res = await changePassword(pw);
            setMsg(res.ok ? "Passwort geändert ✓" : res.error ?? "Fehler.");
            if (res.ok) setPw("");
          }}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface"
        >
          Ändern
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
      <p className="mt-2 text-xs text-muted">Gilt sofort für neue Logins. Bestehende Sitzungen bleiben aktiv.</p>
    </Section>
  );
}

// ── Achievements ─────────────────────────────────────────────────────────────
function AchievementsSection({ defs, onChange }: { defs: AchievementDef[]; onChange: () => void }) {
  const empty = { id: "", icon: "🏆", title: "", descr: "", metric: "trips", target: 1, sort: 999, enabled: true };
  return (
    <Section title="Erfolge / Ziele">
      <div className="space-y-3">
        {defs.map((d) => (
          <AchievementRow key={d.id} def={d} onChange={onChange} />
        ))}
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Neuen Erfolg anlegen</p>
        <AchievementRow def={empty} isNew onChange={onChange} />
      </div>
    </Section>
  );
}

function AchievementRow({
  def,
  isNew,
  onChange,
}: {
  def: AchievementDef & { sort?: number };
  isNew?: boolean;
  onChange: () => void;
}) {
  const [d, setD] = useState(def);
  const [err, setErr] = useState<string | null>(null);
  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }));

  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-center gap-2">
        {isNew && (
          <input
            className={`${input} w-24`}
            placeholder="id"
            value={d.id}
            onChange={(e) => set({ id: e.target.value })}
          />
        )}
        <input className={`${input} w-12 text-center`} value={d.icon} onChange={(e) => set({ icon: e.target.value })} />
        <input
          className={`${input} flex-1`}
          placeholder="Titel"
          value={d.title}
          onChange={(e) => set({ title: e.target.value })}
        />
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={d.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
          aktiv
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          className={`${input} flex-1`}
          placeholder="Beschreibung"
          value={d.descr}
          onChange={(e) => set({ descr: e.target.value })}
        />
        <select className={input} value={d.metric} onChange={(e) => set({ metric: e.target.value })}>
          {ACHIEVEMENT_METRICS.map((m) => (
            <option key={m} value={m}>
              {METRIC_LABEL[m] ?? m}
            </option>
          ))}
        </select>
        <input
          type="number"
          className={`${input} w-24`}
          placeholder="Ziel"
          value={d.target}
          onChange={(e) => set({ target: Number(e.target.value) })}
        />
        <button
          onClick={async () => {
            setErr(null);
            const res = await saveAchievement({
              id: d.id,
              icon: d.icon,
              title: d.title,
              descr: d.descr,
              metric: d.metric,
              target: d.target,
              sort: d.sort ?? 0,
              enabled: d.enabled,
            });
            if (!res.ok) return setErr(res.error ?? "Fehler.");
            onChange();
          }}
          className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-surface"
        >
          {isNew ? "Anlegen" : "Speichern"}
        </button>
        {!isNew && (
          <button
            onClick={async () => {
              if (confirm(`Erfolg „${d.title}" löschen?`)) {
                await deleteAchievement(d.id);
                onChange();
              }
            }}
            className="rounded-lg px-2 py-2 text-sm text-[var(--color-arc)] hover:underline"
          >
            Löschen
          </button>
        )}
      </div>
      {err && <p className="mt-1 text-sm text-[var(--color-arc)]">{err}</p>}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
