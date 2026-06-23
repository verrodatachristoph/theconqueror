"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { Person } from "@/types/database.types";
import type { TripWithMedia } from "@/lib/data";
import { personColor, filterTrips, yearOf } from "@/lib/trips";
import {
  personStats,
  headToHead,
  overviewStats,
  deepStats,
  type PersonStats,
  type Home,
} from "@/lib/stats";
import TopNav from "@/components/TopNav";
import PersonFilter from "@/components/PersonFilter";
import Stats from "@/components/Stats";
import StatTile from "@/components/StatTile";
import Wrapped from "@/components/Wrapped";
import { Stagger } from "@/components/motion";

export default function StatisticsPage({
  trips,
  persons,
  home,
}: {
  trips: TripWithMedia[];
  persons: Person[];
  home: Home;
}) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [aCode, setACode] = useState(persons[0]?.code ?? "");
  const [bCode, setBCode] = useState(persons[1]?.code ?? persons[0]?.code ?? "");

  const toggle = (code: string) =>
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const visible = useMemo(() => filterTrips(trips, enabled), [trips, enabled]);
  const nameOf = (code: string) => persons.find((p) => p.code === code)?.name ?? code;
  const h2h = useMemo(() => headToHead(visible, aCode, bCode), [visible, aCode, bCode]);

  const perPerson = useMemo(
    () => persons.map((p) => ({ person: p, s: personStats(visible, p.code) })),
    [visible, persons],
  );
  const ov = useMemo(() => overviewStats(visible, home), [visible, home]);
  const ds = useMemo(() => deepStats(visible), [visible]);
  const maxLandTrips = Math.max(1, ...ov.topCountries.map((c) => c.trips));

  const years = useMemo(
    () => [...new Set(visible.map(yearOf).filter((y): y is number => y != null))].sort((a, b) => b - a),
    [visible],
  );
  const [recapYear, setRecapYear] = useState<"all" | number>("all");
  const [recapOpen, setRecapOpen] = useState(false);
  const recapTrips = useMemo(
    () => (recapYear === "all" ? visible : visible.filter((t) => yearOf(t) === recapYear)),
    [visible, recapYear],
  );

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
      <TopNav />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PersonFilter
          persons={persons}
          enabled={enabled}
          onToggle={toggle}
          onAll={() => setEnabled(new Set())}
        />
        <div className="flex items-center gap-2">
          <select
            value={recapYear}
            onChange={(e) => setRecapYear(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
            title="Zeitraum für den Rückblick"
          >
            <option value="all">Alle Jahre</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={() => setRecapOpen(true)}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface shadow-sm transition-transform active:scale-95"
          >
            🎁 Rückblick
          </button>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Gesamt</h2>
        <Stats trips={visible} />
      </section>

      {/* Rekorde & Highlights */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Rekorde & Highlights</h2>
        <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <HiTile
            label="Reisefreudigstes Jahr"
            value={ov.busiestYear ? String(ov.busiestYear[0]) : "–"}
            sub={ov.busiestYear ? `${ov.busiestYear[1]} Reisen` : undefined}
          />
          <HiTile label="Ø Reisedauer" value={`${ov.avgDuration} T`} />
          <HiTile label="Anteil Ausland" value={`${ov.abroadPct} %`} />
          <HiTile label="Länder weltweit" value={`${ov.coverage}`} sub="von 195" />
          <HiTile
            label="Kontinente"
            value={`${ov.continents.length}`}
            sub={ov.continents.join(", ") || undefined}
          />
          <HiTile
            label="Weitester Ort"
            value={ov.farthest ? ov.farthest.place : "–"}
            sub={ov.farthest ? `${ov.farthest.km.toLocaleString("de")} km ab ${ov.homeLabel}` : undefined}
          />
          <HiTile
            label="Meiste Tage (Land)"
            value={ds.topDaysCountries[0]?.country ?? "–"}
            sub={ds.topDaysCountries[0] ? `${ds.topDaysCountries[0].days} Tage gesamt` : undefined}
          />
          <HiTile
            label="Meiste Tage (Ort)"
            value={ds.topDaysPlaces[0]?.place ?? "–"}
            sub={ds.topDaysPlaces[0] ? `${ds.topDaysPlaces[0].days} Tage gesamt` : undefined}
          />
        </Stagger>
      </section>

      {/* Saison + Top Länder */}
      <section className="mb-10 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <h3 className="mb-3 text-sm font-medium text-ink">Reisemonate</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={ov.byMonth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--color-surface-2)" }}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--color-line)", fontSize: 12 }}
              />
              <Bar dataKey="trips" name="Reisen" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <h3 className="mb-3 text-sm font-medium text-ink">Top Länder</h3>
          <ul className="space-y-2.5">
            {ov.topCountries.map((c, i) => (
              <li key={c.country} className="flex items-center gap-3">
                <span className="w-4 text-sm font-semibold tabular-nums text-muted">{i + 1}</span>
                <span className="w-28 shrink-0 truncate text-sm text-ink">{c.country}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(c.trips / maxLandTrips) * 100}%` }}
                  />
                </span>
                <span className="w-24 shrink-0 text-right text-xs text-muted">
                  {c.trips} Reisen · {c.days} T
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mehr Auswertungen */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Mehr Auswertungen</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-4 lg:col-span-2">
            <h3 className="mb-3 text-sm font-medium text-ink">Länder über die Zeit</h3>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={ds.growth} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: "var(--color-line)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-line)", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="total" name="Länder gesamt" stroke="var(--color-accent)" strokeWidth={2.5} fill="url(#growthFill)" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="mt-1 text-xs text-muted">Kumulierte Anzahl besuchter Länder bis zum jeweiligen Jahr.</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4">
            <h3 className="mb-3 text-sm font-medium text-ink">Anreiseart über die Jahre</h3>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={ds.travelModeByYear} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "var(--color-surface-2)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-line)", fontSize: 12 }} />
                <Bar dataKey="car" stackId="a" fill="var(--color-accent)" />
                <Bar dataKey="plane" stackId="a" fill="var(--color-arc)" />
                <Bar dataKey="train" stackId="a" fill="#7d8c54" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4 text-xs text-muted">
              <Dot c="var(--color-accent)" label="Auto" />
              <Dot c="var(--color-arc)" label="Flugzeug" />
              <Dot c="#7d8c54" label="Zug" />
            </div>
          </div>

          <Card title="Kontinente">
            <RankList rows={ds.byContinent.map((c) => ({ label: c.name, value: c.value, right: `${c.value} Reisen` }))} />
          </Card>

          <Card title="Top-Orte">
            <RankList rows={ds.topPlaces.map((p) => ({ label: p.place, value: p.trips, right: `${p.trips} Reisen · ${p.days} T` }))} />
          </Card>

          <Card title="Meiste Tage – Länder">
            <RankList rows={ds.topDaysCountries.map((c) => ({ label: c.country, value: c.days, right: `${c.days} Tage` }))} />
          </Card>

          <div className="flex flex-col justify-center rounded-2xl border border-line bg-surface p-4">
            <h3 className="mb-2 text-sm font-medium text-ink">Weltabdeckung</h3>
            <div className="text-3xl font-semibold text-ink">
              {ds.coverage} <span className="text-lg text-muted">/ 195</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (ds.coverage / 195) * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{Math.round((ds.coverage / 195) * 100)} % aller Länder weltweit.</p>
          </div>
        </div>
      </section>

      {/* Head-to-Head */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Head-to-Head</h2>
          <div className="flex items-center gap-2 text-sm">
            <PersonSelect persons={persons} value={aCode} onChange={setACode} />
            <span className="text-muted">vs</span>
            <PersonSelect persons={persons} value={bCode} onChange={setBCode} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {/* header row with avatars */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line bg-surface-2/60 p-4">
            <PersonHead code={aCode} name={nameOf(aCode)} color={personColor(persons, aCode)} align="left" />
            <span className="px-2 text-xs font-medium uppercase tracking-wide text-muted">vs</span>
            <PersonHead code={bCode} name={nameOf(bCode)} color={personColor(persons, bCode)} align="right" />
          </div>

          <Row label="Reisen" a={h2h.a.trips} b={h2h.b.trips} />
          <Row label="Länder" a={h2h.a.countries} b={h2h.b.countries} />
          <Row label="Tage gesamt" a={h2h.a.days} b={h2h.b.days} />
          <Row label="Flüge" a={h2h.a.flights} b={h2h.b.flights} />
          <Row label="Längster Aufenthalt am Stück" a={h2h.a.longest?.days ?? 0} b={h2h.b.longest?.days ?? 0} unit=" T" />
          <Row label="Erste Reise" a={h2h.a.firstYear ?? 0} b={h2h.b.firstYear ?? 0} compare={false} />
          <Row label="Letzte Reise" a={h2h.a.lastYear ?? 0} b={h2h.b.lastYear ?? 0} compare={false} />
          <TextRow
            label="Meistbesuchtes Land"
            a={h2h.a.topCountry?.[0] ?? "–"}
            b={h2h.b.topCountry?.[0] ?? "–"}
          />
        </div>

        {/* shared band */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Gemeinsame Reisen" value={h2h.together} />
          <MiniStat label="Gemeinsame Länder" value={h2h.sharedCountries} />
          <MiniStat label={`Nur ${nameOf(aCode)}`} value={h2h.onlyA} />
          <MiniStat label={`Nur ${nameOf(bCode)}`} value={h2h.onlyB} />
        </div>
      </section>

      {/* Everyone compared */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Alle im Vergleich</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CompareChart title="Reisen pro Person" data={perPerson} pick={(s) => s.trips} />
          <CompareChart title="Reisetage pro Person" data={perPerson} pick={(s) => s.days} />
          <CompareChart title="Länder pro Person" data={perPerson} pick={(s) => s.countries} />
        </div>
      </section>

      {recapOpen && (
        <Wrapped
          trips={recapTrips}
          home={home}
          scopeLabel={recapYear === "all" ? "Alle Jahre" : String(recapYear)}
          onClose={() => setRecapOpen(false)}
        />
      )}
    </main>
  );
}

function HiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <StatTile label={label} value={value} sub={sub} />;
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-4 ${className ?? ""}`}>
      <h3 className="mb-3 text-sm font-medium text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Dot({ c, label }: { c: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
      {label}
    </span>
  );
}

function RankList({ rows }: { rows: { label: string; value: number; right: string }[] }) {
  if (!rows.length) return <p className="text-sm text-muted">Keine Daten.</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="w-4 text-sm font-semibold tabular-nums text-muted">{i + 1}</span>
          <span className="w-24 shrink-0 truncate text-sm text-ink" title={r.label}>
            {r.label}
          </span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="w-28 shrink-0 text-right text-xs text-muted">{r.right}</span>
        </li>
      ))}
    </ul>
  );
}

function PersonSelect({
  persons,
  value,
  onChange,
}: {
  persons: Person[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium outline-none focus:border-accent"
    >
      {persons.map((p) => (
        <option key={p.code} value={p.code}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

function PersonHead({
  code,
  name,
  color,
  align,
}: {
  code: string;
  name: string;
  color: string;
  align: "left" | "right";
}) {
  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {code}
      </span>
      <span className="text-base font-semibold">{name}</span>
    </div>
  );
}

function Row({
  label,
  a,
  b,
  unit = "",
  compare = true,
}: {
  label: string;
  a: number;
  b: number;
  unit?: string;
  compare?: boolean;
}) {
  const aWins = compare && a > b;
  const bWins = compare && b > a;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-4 py-2.5 last:border-b-0">
      <div className={`text-lg tabular-nums ${aWins ? "font-bold text-ink" : "text-muted"}`}>
        {a}
        {unit}
      </div>
      <div className="px-2 text-center text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`text-right text-lg tabular-nums ${bWins ? "font-bold text-ink" : "text-muted"}`}>
        {b}
        {unit}
      </div>
    </div>
  );
}

function TextRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-4 py-2.5 last:border-b-0">
      <div className="truncate text-sm text-ink">{a}</div>
      <div className="px-2 text-center text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="truncate text-right text-sm text-ink">{b}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 text-center">
      <div className="text-2xl font-semibold tabular-nums text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

function CompareChart({
  title,
  data,
  pick,
}: {
  title: string;
  data: { person: Person; s: PersonStats }[];
  pick: (s: PersonStats) => number;
}) {
  const rows = data.map((d) => ({
    name: d.person.name,
    code: d.person.code,
    color: d.person.color,
    value: pick(d.s),
  }));
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="mb-3 text-sm font-medium text-ink">{title}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "var(--color-surface-2)" }}
            contentStyle={{ borderRadius: 12, border: "1px solid var(--color-line)", fontSize: 12 }}
          />
          <Bar dataKey="value" name={title} radius={[4, 4, 0, 0]}>
            {rows.map((r) => (
              <Cell key={r.code} fill={r.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
