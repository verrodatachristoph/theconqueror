"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { itemVariants } from "@/components/motion";
import CountUp from "@/components/CountUp";

/**
 * One consistent KPI tile used across all stat grids. The sub line is always
 * reserved (even when empty) so tiles in a row keep equal height. Inside a
 * <Stagger> it fades up in sequence; standalone it just renders.
 */
export default function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-sm"
    >
      <div
        className="truncate text-xl font-semibold leading-tight text-ink"
        title={typeof value === "string" ? value : undefined}
      >
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </div>
      <div className="mt-0.5 min-h-[1.05rem] truncate text-xs text-muted">{sub ?? " "}</div>
      <div className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
    </motion.div>
  );
}
