import type { PaletteName } from "../core/types";

export type Palette = {
  name: PaletteName;
  label: string;
  colors: string[];
  gradient: [string, string];
};

export const palettes: Record<PaletteName, Palette> = {
  lavender: {
    name: "lavender",
    label: "Lavender",
    colors: ["#7c3aed", "#ec4899", "#a78bfa", "#f472b6", "#6366f1", "#fb7185"],
    gradient: ["#7c3aed", "#ec4899"],
  },
  traqto: {
    name: "traqto",
    label: "traqto",
    colors: ["#2f4b7c", "#e09040", "#16a34a", "#2563eb", "#c17f3a", "#8b5cf6"],
    gradient: ["#2f4b7c", "#2563eb"],
  },
  sunrise: {
    name: "sunrise",
    label: "Sunrise",
    colors: ["#ff6b35", "#f7c548", "#f95d6a", "#a05195", "#2f4b7c", "#ffa600"],
    gradient: ["#ff6b35", "#f7c548"],
  },
  aurora: {
    name: "aurora",
    label: "Aurora",
    colors: ["#00c2ff", "#4f8cff", "#b14aed", "#ff5ec4", "#2dd4bf", "#fbbf24"],
    gradient: ["#00c2ff", "#b14aed"],
  },
  earth: {
    name: "earth",
    label: "Earth",
    colors: ["#5fa363", "#c8961c", "#d96030", "#6b4f3f", "#9b6a3f", "#3d7a4e"],
    gradient: ["#5fa363", "#c8961c"],
  },
  // W3-C: gedeckte Standard-Palette, abgeleitet aus den bereits entsättigten
  // Statusfarben der App (src/theme.ts: success #167a3e / warning #c17f3a /
  // danger #a83228 / info #2563eb) plus dem Navy-Ton. Keine grellen Punkte mehr.
  dezent: {
    name: "dezent",
    label: "Gedeckt",
    colors: ["#2f4b7c", "#c17f3a", "#167a3e", "#2563eb", "#a83228", "#6b5b80"],
    gradient: ["#2f4b7c", "#2563eb"],
  },
};

export const defaultPalette: PaletteName = "dezent";

export const tokens = {
  radius: {
    sm: "10px",
    md: "14px",
    lg: "20px",
    xl: "28px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "14px",
    lg: "20px",
    xl: "28px",
  },
  // W3-C: neutrale (navy-basierte) Schatten statt Violett (124,58,237).
  shadow: {
    sm: "0 2px 10px rgba(15, 23, 42, 0.06)",
    md: "0 10px 30px rgba(15, 23, 42, 0.10)",
    lg: "0 22px 56px rgba(15, 23, 42, 0.14)",
  },
  surface: {
    card: "#ffffff",
    cardBorder: "rgba(15, 23, 42, 0.06)",
    cardHover: "rgba(15, 23, 42, 0.03)",
    page: "#f0f2f5",
  },
  text: {
    primary: "#1a2233",
    secondary: "#4a4a4a",
    muted: "#8a8f98",
  },
  accent: {
    primary: "#2f4b7c",
    gradient: "linear-gradient(135deg, #2f4b7c, #2563eb)",
  },
};
