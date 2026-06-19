"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import type { Trip } from "@/types/database.types";
import { yearOf, totalFlights } from "@/lib/trips";

const ANREISE_COLORS: Record<string, string> = {
  Auto: "var(--color-accent)",
  Flugzeug: "var(--color-arc)",
  Zug: "#7d8c54", // olive — fixed travel-mode color, independent of persons
};

function topBy(trips: Trip[], key: (t: Trip) => string | null) {
  const m = new Map<string, number>();
  for (const t of trips) {
    const k = key(t);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  let best: [string, number] | null = null;
  for (const e of m) if (!best || e[1] > best[1]) best = e;
  return best;
}

export default function Stats({ trips }: { trips: Trip[] }) {
  const m = useMemo(() => {
    const days = trips.reduce((s, t) => s + (t.tage ?? 0), 0);
    const countries = new Set(trips.map((t) => t.land_iso3).filter(Boolean));
    const years = new Set(trips.map(yearOf).filter((y): y is number => y != null));
    const perYear = new Map<number, { year: number; trips: number; days: number }>();
    for (const t of trips) {
      const y = yearOf(t);
      if (y == null) continue;
      const e = perYear.get(y) ?? { year: y, trips: 0, days: 0 };
      e.trips += 1;
      e.days += t.tage ?? 0;
      perYear.set(y, e);
    }
    const anreise = new Map<string, number>();
    for (const t of trips) if (t.anreise) anreise.set(t.anreise, (anreise.get(t.anreise) ?? 0) + 1);

    const longest = trips.reduce<Trip | null>(
      (best, t) => ((t.tage ?? 0) > (best?.tage ?? -1) ? t : best),
      null,
    );

    return {
      count: trips.length,
      days,
      countries: countries.size,
      perYearArr: [...perYear.values()].sort((a, b) => a.year - b.year),
      anreiseArr: [...anreise.entries()].map(([name, value]) => ({ name, value })),
      longest,
      topOrt: topBy(trips, (t) => t.ort),
      topLand: topBy(trips, (t) => t.land),
      perYearAvg: years.size ? countries.size / years.size : 0,
      flights: totalFlights(trips),
    };
  }, [trips]);

  if (!trips.length) {
    return <p className="text-sm text-muted">Keine Aufenthalte für diese Auswahl.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Reisen" value={m.count} />
      <Kpi label="Gesamttage" value={m.days} />
      <Kpi label="Länder besucht" value={m.countries} />
      <Kpi label="Länder / Jahr" value={m.perYearAvg.toFixed(1)} />
      <Kpi
        label="Längster Aufenthalt"
        value={m.longest ? `${m.longest.tage} T` : "–"}
        sub={m.longest?.ort ?? undefined}
      />
      <Kpi
        label="Meistbesuchter Ort"
        value={m.topOrt ? m.topOrt[0] : "–"}
        sub={m.topOrt ? `${m.topOrt[1]}×` : undefined}
      />
      <Kpi
        label="Meistbesuchtes Land"
        value={m.topLand ? m.topLand[0] : "–"}
        sub={m.topLand ? `${m.topLand[1]}×` : undefined}
      />
      <Kpi label="Flüge" value={m.flights} />

      {/* Charts */}
      <div className="col-span-2 rounded-2xl border border-line bg-surface p-4">
        <h3 className="mb-3 text-sm font-medium text-ink">Reisen pro Jahr</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={m.perYearArr} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface-2)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-line)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="trips" name="Reisen" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="col-span-2 rounded-2xl border border-line bg-surface p-4">
        <h3 className="mb-3 text-sm font-medium text-ink">Anreiseart</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={m.anreiseArr}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={70}
              paddingAngle={2}
              stroke="var(--color-surface)"
            >
              {m.anreiseArr.map((a) => (
                <Cell key={a.name} fill={ANREISE_COLORS[a.name] ?? "var(--color-land)"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-line)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-center gap-4 text-xs text-muted">
          {m.anreiseArr.map((a) => (
            <span key={a.name} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: ANREISE_COLORS[a.name] ?? "var(--color-land)" }}
              />
              {a.name} ({a.value})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="truncate text-xl font-semibold tabular-nums text-ink">{value}</div>
      {sub && <div className="truncate text-xs text-muted">{sub}</div>}
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
