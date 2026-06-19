"use client";

import { useEffect, useRef, useState } from "react";
import { searchAirports, type AirportHit } from "@/app/actions";

/**
 * Airport picker: type a city/name/IATA, pick from results → stores the IATA.
 * Free text is still allowed (geocoded on save) for airports not in the list.
 */
export default function AirportInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (iata: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<AirportHit[]>([]);
  const [query, setQuery] = useState<string | null>(null); // null = show `value`
  const boxRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // debounced search
  useEffect(() => {
    if (query == null) return;
    const q = query;
    const t = setTimeout(async () => {
      const res = await searchAirports(q);
      setHits(res);
      setOpen(true);
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div ref={boxRef} className="relative">
      <input
        className={className}
        value={query ?? value}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value.toUpperCase();
          setQuery(v);
          onChange(v); // keep raw text as the value (free-text fallback)
        }}
        onFocus={() => {
          if (hits.length) setOpen(true);
        }}
        autoComplete="off"
      />
      {open && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full min-w-[16rem] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-lg">
          {hits.map((h) => (
            <li key={h.iata}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(h.iata);
                  setQuery(null);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-surface-2"
              >
                <span className="w-10 shrink-0 font-semibold text-accent">{h.iata}</span>
                <span className="truncate">
                  {h.city ? <span className="text-ink">{h.city}</span> : null}
                  {h.city ? <span className="text-muted"> · </span> : null}
                  <span className="text-muted">{h.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
