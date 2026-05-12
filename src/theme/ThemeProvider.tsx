import { createContext, useContext, useMemo, type ReactNode } from "react";
import { palettes, defaultPalette, tokens } from "./tokens";
import type { PaletteName } from "../core/types";

type ThemeContextValue = {
  palette: PaletteName;
  colors: string[];
  gradient: [string, string];
  tokens: typeof tokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export type ThemeProviderProps = {
  palette?: PaletteName;
  children: ReactNode;
};

export function ThemeProvider({ palette = defaultPalette, children }: ThemeProviderProps) {
  const value = useMemo<ThemeContextValue>(() => {
    const p = palettes[palette];
    return {
      palette,
      colors: p.colors,
      gradient: p.gradient,
      tokens,
    };
  }, [palette]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      palette: defaultPalette,
      colors: palettes[defaultPalette].colors,
      gradient: palettes[defaultPalette].gradient,
      tokens,
    };
  }
  return ctx;
}