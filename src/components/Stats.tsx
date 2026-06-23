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
import StatTile from "@/components/StatTile";
import EmptyState from "@/components/EmptyState";
import { Stagger, Item } from "@/components/motion";
import { useT } from "@/components/i18n/LanguageProvider";

const TRAVEL_MODE_COLORS: Record<string, string> = {
  car: "var(--color-accent)",
  plane: "var(--color-arc)",
  train: "#7d8c54", // olive — fixed travel-mode color, independent of persons
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
  const t = useT();
  const m = useMemo(() => {
    const days = trips.reduce((s, t) => s + (t.days ?? 0), 0);
    const countries = new Set(trips.map((t) => t.country_iso3).filter(Boolean));
    const years = new Set(trips.map(yearOf).filter((y): y is number => y != null));
    const perYear = new Map<number, { year: number; trips: number; days: number }>();
    for (const t of trips) {
      const y = yearOf(t);
      if (y == null) continue;
      const e = perYear.get(y) ?? { year: y, trips: 0, days: 0 };
      e.trips += 1;
      e.days += t.days ?? 0;
      perYear.set(y, e);
    }
    const travel_mode = new Map<string, number>();
    for (const t of trips) if (t.travel_mode) travel_mode.set(t.travel_mode, (travel_mode.get(t.travel_mode) ?? 0) + 1);

    const longest = trips.reduce<Trip | null>(
      (best, t) => ((t.days ?? 0) > (best?.days ?? -1) ? t : best),
      null,
    );

    return {
      count: trips.length,
      days,
      countries: countries.size,
      perYearArr: [...perYear.values()].sort((a, b) => a.year - b.year),
      travelModeArr: [...travel_mode.entries()].map(([name, value]) => ({ name, value })),
      longest,
      topPlace: topBy(trips, (t) => t.place),
      topCountry: topBy(trips, (t) => t.country),
      perYearAvg: years.size ? countries.size / years.size : 0,
      flights: totalFlights(trips),
    };
  }, [trips]);

  if (!trips.length) {
    return <EmptyState icon="📊" title={t("stats.emptyTitle")} hint={t("stats.emptyHint")} />;
  }

  return (
    <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label={t("common.trips")} value={m.count} />
      <Kpi label={t("stats.totalDays")} value={m.days} />
      <Kpi label={t("stats.countriesVisited")} value={m.countries} />
      <Kpi label={t("stats.countriesPerYear")} value={m.perYearAvg.toFixed(1)} />
      <Kpi
        label={t("stats.longestStay")}
        value={m.longest ? `${m.longest.days} ${t("common.daysShort")}` : "–"}
        sub={m.longest?.place ?? undefined}
      />
      <Kpi
        label={t("stats.topPlace")}
        value={m.topPlace ? m.topPlace[0] : "–"}
        sub={m.topPlace ? `${m.topPlace[1]}×` : undefined}
      />
      <Kpi
        label={t("stats.topCountry")}
        value={m.topCountry ? m.topCountry[0] : "–"}
        sub={m.topCountry ? `${m.topCountry[1]}×` : undefined}
      />
      <Kpi label={t("stats.flights")} value={m.flights} />

      {/* Charts */}
      <Item className="col-span-2 rounded-2xl border border-line bg-surface p-4">
        <h3 className="mb-3 text-sm font-medium text-ink">{t("stats.tripsPerYear")}</h3>
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
            <Bar dataKey="trips" name={t("common.trips")} fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Item>

      <Item className="col-span-2 rounded-2xl border border-line bg-surface p-4">
        <h3 className="mb-3 text-sm font-medium text-ink">{t("travelMode.title")}</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={m.travelModeArr}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={70}
              paddingAngle={2}
              stroke="var(--color-surface)"
            >
              {m.travelModeArr.map((a) => (
                <Cell key={a.name} fill={TRAVEL_MODE_COLORS[a.name] ?? "var(--color-country)"} />
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
          {m.travelModeArr.map((a) => (
            <span key={a.name} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: TRAVEL_MODE_COLORS[a.name] ?? "var(--color-country)" }}
              />
              {a.name ? t("travelMode." + a.name) : a.name} ({a.value})
            </span>
          ))}
        </div>
      </Item>
    </Stagger>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return <StatTile label={label} value={value} sub={sub} />;
}
