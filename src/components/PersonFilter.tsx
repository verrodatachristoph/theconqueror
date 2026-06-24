"use client";

import type { Person } from "@/types/database.types";
import { personColor } from "@/lib/trips";
import { useT } from "@/components/i18n/LanguageProvider";

export default function PersonFilter({
  persons,
  enabled,
  onToggle,
  onAll,
}: {
  persons: Person[];
  enabled: Set<string>;
  onToggle: (code: string) => void;
  onAll: () => void;
}) {
  const noneActive = !persons.some((p) => enabled.has(p.code));
  const t = useT();

  return (
    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
      <div className="flex items-center justify-between gap-2 md:contents">
        <span className="text-xs font-medium uppercase tracking-wide text-muted md:mr-1">{t("filter.whoWasThere")}</span>
        {/* Reset rides with the label on mobile (right-aligned); inline on desktop. */}
        <button
          type="button"
          onClick={onAll}
          disabled={noneActive}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm text-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-40 disabled:hover:no-underline md:order-last"
        >
          {t("filter.reset")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 md:contents">
        {persons.map((p) => {
          const on = enabled.has(p.code);
          return (
            <button
              key={p.code}
              type="button"
              onClick={() => onToggle(p.code)}
              aria-pressed={on}
              title={on ? t("filter.removeFromFilter", { name: p.name }) : t("filter.onlyWith", { name: p.name })}
              style={on ? { backgroundColor: personColor(persons, p.code) } : undefined}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
                on ? "text-white shadow-sm" : "bg-surface-2 text-ink hover:bg-surface"
              }`}
            >
              {on ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/95 text-[10px] font-bold text-ink">
                  ✓
                </span>
              ) : (
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: personColor(persons, p.code) }}
                />
              )}
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
