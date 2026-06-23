export const THEME_COOKIE = "conq_theme";
export type Theme = "light" | "dark";

export function isTheme(v: string | undefined | null): v is Theme {
  return v === "light" || v === "dark";
}
