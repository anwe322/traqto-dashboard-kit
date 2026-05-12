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
};

export const defaultPalette: PaletteName = "traqto";

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
  shadow: {
    sm: "0 2px 10px rgba(124, 58, 237, 0.06)",
    md: "0 10px 30px rgba(124, 58, 237, 0.10)",
    lg: "0 22px 56px rgba(124, 58, 237, 0.14)",
  },
  surface: {
    card: "#ffffff",
    cardBorder: "rgba(124, 58, 237, 0.06)",
    cardHover: "rgba(124, 58, 237, 0.03)",
    page: "#faf7ff",
  },
  text: {
    primary: "#1f1235",
    secondary: "#6b5b80",
    muted: "#a89cba",
  },
  accent: {
    primary: "#7c3aed",
    gradient: "linear-gradient(135deg, #7c3aed, #ec4899)",
  },
};
