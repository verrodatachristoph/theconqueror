"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoEqualEarth, geoPath, geoInterpolate, geoGraticule10 } from "d3-geo";
import { select } from "d3-selection";
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import "d3-transition"; // augments selection.transition() for smooth zoom
import { feature } from "topojson-client";
import countries from "i18n-iso-countries";
import worldData from "world-atlas/countries-110m.json";
import { flagEmoji } from "@/lib/iso";
import { useT } from "@/components/i18n/LanguageProvider";
import type { Trip } from "@/types/database.types";
import {
  aggregateByCountry,
  flightArcs,
  flightStopPoints,
  destinations,
  yearOf,
  isUpcoming,
  type Arc,
} from "@/lib/trips";

const W = 980;
const H = 500;

// numeric topojson id -> ISO alpha-3
function idToIso3(id: string | number): string | null {
  const s = String(id).padStart(3, "0");
  return countries.numericToAlpha3(s) ?? null;
}

type GeoFeature = {
  id: string | number;
  geometry: unknown;
  properties: { name?: string };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const world = worldData as any;
const landFeatures = (
  feature(world, world.objects.countries) as unknown as { features: GeoFeature[] }
).features;

type Hover =
  | { kind: "country"; iso3: string; name: string; trips: Trip[]; x: number; y: number }
  | { kind: "dest"; trip: Trip; cover?: string | null; x: number; y: number }
  | null;

type MapTrip = Trip & { cover_signed?: string | null };

export default function WorldMap({
  trips,
  showArcs = true,
  wishlist,
  focusIso,
  onSelectTrip,
  onSelectCountry,
}: {
  trips: MapTrip[];
  showArcs?: boolean;
  wishlist?: string[];
  focusIso?: string | null;
  onSelectTrip?: (trip: Trip) => void;
  onSelectCountry?: (iso3: string) => void;
}) {
  const t = useT();
  const gRef = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [k, setK] = useState(1);
  const [hover, setHover] = useState<Hover>(null);
  const [hoveredIso, setHoveredIso] = useState<string | null>(null);
  const hovId = hover && hover.kind === "dest" ? hover.trip.id : null;

  const projection = useMemo(
    () => geoEqualEarth().fitExtent([[6, 6], [W - 6, H - 6]], { type: "Sphere" }),
    [],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  const graticule = useMemo(() => path(geoGraticule10() as never), [path]);
  const byCountry = useMemo(() => aggregateByCountry(trips), [trips]);
  const tripsByCountry = useMemo(() => {
    const m = new Map<string, Trip[]>();
    for (const t of trips) {
      if (!t.country_iso3) continue;
      const list = m.get(t.country_iso3);
      if (list) list.push(t);
      else m.set(t.country_iso3, [t]);
    }
    return m;
  }, [trips]);
  const maxCount = useMemo(
    () => Math.max(1, ...[...byCountry.values()].map((c) => c.count)),
    [byCountry],
  );
  const wishSet = useMemo(() => new Set(wishlist ?? []), [wishlist]);
  const arcs = useMemo(() => flightArcs(trips), [trips]);
  const stopPoints = useMemo(() => flightStopPoints(trips), [trips]);
  const dests = useMemo(() => destinations(trips), [trips]);
  const coverById = useMemo(
    () => new Map(trips.map((t) => [t.id, t.cover_signed ?? null])),
    [trips],
  );

  // visited country fill: light -> deep teal by trip count; wishlist = soft gold
  function fillFor(iso3: string | null): string {
    if (!iso3) return "var(--color-country)";
    const agg = byCountry.get(iso3);
    if (agg) {
      const t = Math.sqrt(agg.count / maxCount); // sqrt for gentler low end
      return `color-mix(in oklab, var(--color-accent) ${Math.round(25 + t * 70)}%, var(--color-accent-soft))`;
    }
    if (wishSet.has(iso3)) return "color-mix(in oklab, #cf9a3f 42%, var(--color-country))";
    return "var(--color-country)";
  }

  // d3-zoom (wheel + pinch + drag pan), constant strokes via vector-effect
  useEffect(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;
    const zoom: ZoomBehavior<SVGSVGElement, unknown> = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 9])
      .translateExtent([[0, 0], [W, H]])
      .on("zoom", (e) => {
        g.setAttribute("transform", e.transform.toString());
        setK(e.transform.k);
      });
    zoomRef.current = zoom;
    const sel = select(svg);
    sel.call(zoom);
    sel.on("dblclick.zoom", null);
    return () => {
      sel.on(".zoom", null);
    };
  }, []);

  // Auto-fit: zoom to the focused country, else to the visible countries' extent.
  const fitTransform = useMemo(() => {
    const feats = focusIso
      ? landFeatures.filter((f) => idToIso3(f.id) === focusIso)
      : landFeatures.filter((f) => {
          const iso = idToIso3(f.id);
          return iso ? byCountry.has(iso) : false;
        });
    if (!feats.length) return zoomIdentity;
    const pad = focusIso ? 0.78 : 0.9;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const f of feats) {
      const b = path.bounds(f as never);
      if (!Number.isFinite(b[0][0])) continue;
      x0 = Math.min(x0, b[0][0]);
      y0 = Math.min(y0, b[0][1]);
      x1 = Math.max(x1, b[1][0]);
      y1 = Math.max(y1, b[1][1]);
    }
    if (!Number.isFinite(x0)) return zoomIdentity;
    const bw = Math.max(1, x1 - x0);
    const bh = Math.max(1, y1 - y0);
    const scale = Math.max(1, Math.min(9, pad * Math.min(W / bw, H / bh)));
    const tx = W / 2 - (scale * (x0 + x1)) / 2;
    const ty = H / 2 - (scale * (y0 + y1)) / 2;
    return zoomIdentity.translate(tx, ty).scale(scale);
  }, [byCountry, path, focusIso]);

  useEffect(() => {
    const svg = svgRef.current;
    const zoom = zoomRef.current;
    if (!svg || !zoom) return;
    select(svg).transition().duration(650).call(zoom.transform, fitTransform);
  }, [fitTransform]);

  const arcPath = (a: Arc) => {
    const interp = geoInterpolate(a.from, a.to);
    const pts = Array.from({ length: 41 }, (_, i) => interp(i / 40));
    return path({ type: "LineString", coordinates: pts } as never);
  };

  const moveTip = (e: React.PointerEvent | React.MouseEvent, base: Omit<Hover & object, "x" | "y">) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left ?? 0);
    const y = e.clientY - (rect?.top ?? 0);
    setHover({ ...(base as object), x, y } as Hover);
  };

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-xl">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="map-svg block h-auto w-full"
        style={{ background: "var(--color-ocean)" }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <radialGradient id="ocean" cx="50%" cy="40%" r="78%">
            <stop offset="0%" stopColor="var(--color-ocean)" />
            <stop offset="100%" stopColor="var(--color-ocean-deep)" />
          </radialGradient>
          <filter id="country-shadow" x="-4%" y="-4%" width="108%" height="108%">
            <feDropShadow dx="0" dy="0.8" stdDeviation="1" floodColor="#1b3a3f" floodOpacity="0.18" />
          </filter>
          <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g ref={gRef}>
          {/* ocean + graticule */}
          <path d={path({ type: "Sphere" } as never) ?? undefined} fill="url(#ocean)" />
          <path
            d={graticule ?? undefined}
            fill="none"
            stroke="#9fb4b7"
            strokeWidth={0.4}
            strokeOpacity={0.35}
            vectorEffect="non-scaling-stroke"
          />

          {/* countries */}
          <g filter="url(#country-shadow)">
          {landFeatures.map((f, i) => {
            const iso3 = idToIso3(f.id);
            const visited = iso3 ? byCountry.has(iso3) : false;
            const hl = visited && (iso3 === hoveredIso || iso3 === focusIso);
            return (
              <path
                key={i}
                d={path(f as never) ?? undefined}
                fill={fillFor(iso3)}
                stroke={hl ? "var(--color-ink)" : "var(--color-country-edge)"}
                strokeWidth={hl ? 1.2 : 0.5}
                vectorEffect="non-scaling-stroke"
                className={visited ? "cursor-pointer transition-[fill,stroke] duration-150" : ""}
                onPointerMove={(e) => {
                  if (!visited || !iso3) return;
                  setHoveredIso(iso3);
                  moveTip(e, {
                    kind: "country",
                    iso3,
                    name: f.properties?.name ?? iso3,
                    trips: tripsByCountry.get(iso3) ?? [],
                  } as never);
                }}
                onPointerLeave={() => {
                  setHover(null);
                  setHoveredIso(null);
                }}
                onClick={() => {
                  if (visited && iso3) onSelectCountry?.(iso3);
                }}
              />
            );
          })}
          </g>

          {/* flight arcs */}
          {showArcs && (
            <g filter="url(#arc-glow)">
              {arcs.map((a, i) => (
                <path
                  key={`arc-${i}`}
                  d={arcPath(a) ?? undefined}
                  fill="none"
                  stroke="var(--color-arc)"
                  strokeWidth={1.2}
                  strokeOpacity={0.75}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
              ))}
            </g>
          )}

          {/* flight stop waypoints */}
          {showArcs &&
            stopPoints.map((c, i) => {
              const p = projection(c);
              if (!p) return null;
              return (
                <circle
                  key={`stop-${i}`}
                  cx={p[0]}
                  cy={p[1]}
                  r={1.8 / k}
                  fill="var(--color-surface)"
                  stroke="var(--color-arc)"
                  strokeWidth={1 / k}
                  pointerEvents="none"
                />
              );
            })}

          {/* destination points — simple dots; the cover photo shows in the hover card */}
          {dests.map((d, i) => {
            const p = projection(d.coord);
            if (!p) return null;
            const planned = isUpcoming(d.trip);
            const isHov = hovId === d.trip.id;
            return (
              <g key={`dot-${i}`}>
                {isHov && (
                  <circle
                    cx={p[0]}
                    cy={p[1]}
                    r={7 / k}
                    fill="none"
                    stroke={planned ? "#6d5bd0" : "var(--color-arc)"}
                    strokeWidth={1.2 / k}
                    opacity={0.5}
                    pointerEvents="none"
                  />
                )}
                <circle
                  cx={p[0]}
                  cy={p[1]}
                  r={((planned ? 3.6 : 2.6) * (isHov ? 1.5 : 1)) / k}
                  fill={planned ? "none" : "var(--color-arc)"}
                  stroke={planned ? "#6d5bd0" : "var(--color-surface)"}
                  strokeWidth={(planned ? 1.8 : 1) / k}
                  className="cursor-pointer"
                  onPointerMove={(e) =>
                    moveTip(e, { kind: "dest", trip: d.trip, cover: coverById.get(d.trip.id) } as never)
                  }
                  onPointerLeave={() => setHover(null)}
                  onClick={() => onSelectTrip?.(d.trip)}
                >
                  {planned && (
                    <animate attributeName="opacity" values="1;0.35;1" dur="2s" repeatCount="indefinite" />
                  )}
                </circle>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-3 rounded-xl bg-surface/85 px-3 py-1.5 text-[11px] text-muted shadow-sm backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--color-accent)" }} />
          {t("map.visited")}
        </span>
        {wishSet.size > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#cf9a3f" }} />
            {t("map.wish")}
          </span>
        )}
        {trips.some(isUpcoming) && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: "#6d5bd0" }} />
            {t("common.planned")}
          </span>
        )}
      </div>

      {hover && <MapTooltip hover={hover} />}
    </div>
  );
}

function MapTooltip({ hover }: { hover: NonNullable<Hover> }) {
  const t = useT();
  const style: React.CSSProperties = {
    left: Math.max(8, hover.x + 12),
    top: Math.max(8, hover.y + 12),
  };
  return (
    <div
      className="pointer-events-none absolute z-10 max-w-[15rem] rounded-xl border border-line bg-surface/95 p-3 text-sm shadow-lg backdrop-blur"
      style={style}
    >
      {hover.kind === "country" ? (
        <>
          <div className="font-medium text-ink">
            {flagEmoji(hover.iso3)} {hover.name}
          </div>
          <div className="mt-0.5 text-xs text-muted">
            {hover.trips.length} {hover.trips.length === 1 ? t("home.stay") : t("home.stays")}
          </div>
          <ul className="mt-1.5 space-y-0.5 text-xs text-ink/80">
            {hover.trips.slice(0, 6).map((t) => (
              <li key={t.id} className="flex justify-between gap-3">
                <span className="truncate">{t.place}</span>
                <span className="shrink-0 text-muted">{yearOf(t) ?? ""}</span>
              </li>
            ))}
            {hover.trips.length > 6 && (
              <li className="text-muted">{t("map.more", { n: hover.trips.length - 6 })}</li>
            )}
          </ul>
        </>
      ) : (
        <>
          {hover.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hover.cover}
              alt=""
              className="mb-2 h-24 w-full rounded-lg object-cover"
            />
          )}
          <div className="font-medium text-ink">
            {hover.trip.place}
            {hover.trip.country ? `, ${hover.trip.country}` : ""}
          </div>
          <div className="mt-0.5 text-xs text-muted">
            {yearOf(hover.trip) ?? ""}
            {hover.trip.travel_mode ? ` · ${t("travelMode." + hover.trip.travel_mode)}` : ""} ·{" "}
            {hover.trip.days ?? "?"} {t("common.days")}
          </div>
        </>
      )}
    </div>
  );
}
