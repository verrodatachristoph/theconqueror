"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Trip } from "@/types/database.types";
import { overviewStats, totalFlightKm, type Home } from "@/lib/stats";
import { totalFlights } from "@/lib/trips";

type Card = { bg: string; emoji: string; big: string; label: string; sub?: string };

const BG = [
  "linear-gradient(160deg,#2f6f6a,#1d4844)",
  "linear-gradient(160deg,#c2784f,#8f5030)",
  "linear-gradient(160deg,#3b6ea5,#24466b)",
  "linear-gradient(160deg,#6f9457,#4a663a)",
  "linear-gradient(160deg,#9a6a8f,#684460)",
  "linear-gradient(160deg,#cf9a3f,#9c7026)",
  "linear-gradient(160deg,#4b5e8a,#2b3a5c)",
];

const STEP_MS = 4200;

function buildCards(trips: Trip[], home: Home, scopeLabel: string): Card[] {
  const count = trips.length;
  const days = trips.reduce((s, t) => s + (t.days ?? 0), 0);
  const ov = overviewStats(trips, home);
  const flights = totalFlights(trips);
  const km = Math.round(totalFlightKm(trips));
  const longest = trips.reduce<Trip | null>((m, t) => ((t.days ?? 0) > (m?.days ?? -1) ? t : m), null);
  const top = ov.topCountries[0];

  const raw: Omit<Card, "bg">[] = [
    { emoji: "🌍", big: scopeLabel, label: "Euer Reise-Rückblick", sub: `${count} Reisen` },
    { emoji: "🧳", big: `${count}`, label: count === 1 ? "Reise" : "Reisen" },
    {
      emoji: "🗺️",
      big: `${ov.coverage}`,
      label: ov.coverage === 1 ? "Land" : "Länder",
      sub: `in ${ov.continents.length} ${ov.continents.length === 1 ? "Kontinent" : "Kontinenten"}`,
    },
    { emoji: "📅", big: `${days}`, label: "Tage unterwegs" },
    {
      emoji: "📍",
      big: ov.farthest ? ov.farthest.place : "–",
      label: "Weitester Ort",
      sub: ov.farthest ? `${ov.farthest.km.toLocaleString("de")} km ab ${ov.homeLabel}` : undefined,
    },
    {
      emoji: "🏆",
      big: top ? top.country : "–",
      label: "Meistbesuchtes Land",
      sub: top ? `${top.trips}× besucht` : undefined,
    },
    {
      emoji: "🏖️",
      big: longest ? `${longest.days} Tage` : "–",
      label: "Längster Aufenthalt am Stück",
      sub: longest?.place ?? undefined,
    },
    {
      emoji: "✈️",
      big: `${flights}`,
      label: flights === 1 ? "Flug" : "Flüge",
      sub: km ? `${(km / 40075).toFixed(1)}× um die Welt` : undefined,
    },
    { emoji: "💫", big: "Auf zum nächsten Abenteuer!", label: "" },
  ];
  return raw.map((c, i) => ({ ...c, bg: BG[i % BG.length] }));
}

export default function Wrapped({
  trips,
  home,
  scopeLabel,
  onClose,
}: {
  trips: Trip[];
  home: Home;
  scopeLabel: string;
  onClose: () => void;
}) {
  const cards = useMemo(() => buildCards(trips, home, scopeLabel), [trips, home, scopeLabel]);
  const [i, setI] = useState(0);

  const next = () => setI((x) => (x < cards.length - 1 ? x + 1 : x));
  const prev = () => setI((x) => Math.max(0, x - 1));

  useEffect(() => {
    const t = setTimeout(next, STEP_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, cards.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const card = cards[i];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-3 backdrop-blur-sm sm:p-6">
      <div
        className="relative aspect-[9/16] max-h-[92vh] w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: card.bg }}
      >
        {/* progress bars */}
        <div className="absolute inset-x-4 top-4 z-20 flex gap-1">
          {cards.map((_, j) => (
            <div key={j} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              {j < i && <div className="h-full w-full bg-white" />}
              {j === i && (
                <motion.div
                  key={i}
                  className="h-full bg-white"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                />
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose} className="absolute right-3 top-7 z-20 text-xl text-white/80 hover:text-white" aria-label="Schließen">
          ✕
        </button>

        {/* tap zones */}
        <button className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={prev} aria-label="Zurück" />
        <button className="absolute inset-y-0 right-0 z-10 w-1/3" onClick={next} aria-label="Weiter" />

        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-white"
          >
            <div className="text-6xl drop-shadow">{card.emoji}</div>
            <div className="text-3xl font-bold leading-tight drop-shadow sm:text-4xl">{card.big}</div>
            {card.label && <div className="text-lg font-medium opacity-90">{card.label}</div>}
            {card.sub && <div className="text-sm opacity-75">{card.sub}</div>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
