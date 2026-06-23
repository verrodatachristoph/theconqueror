"use client";

import type { Person } from "@/types/database.types";
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted">{t("filter.whoWasThere")}</span>

      {persons.map((p) => {
        const on = enabled.has(p.code);
        return (
          <button
            key={p.code}
            type="button"
            onClick={() => onToggle(p.code)}
            aria-pressed={on}
            title={on ? t("filter.removeFromFilter", { name: p.name }) : t("filter.onlyWith", { name: p.name })}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
              on
                ? "border-accent bg-accent text-white shadow-sm"
                : "border-line bg-surface text-ink hover:border-ink/30"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold ${
                on ? "border-white/70 bg-white/95 text-accent" : "border-ink/30 text-transparent"
              }`}
            >
              ✓
            </span>
            {p.name}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onAll}
        disabled={noneActive}
        className="ml-1 rounded-full px-3 py-1.5 text-sm text-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-40 disabled:hover:no-underline"
      >
        {t("filter.reset")}
      </button>
    </div>
  );
}
