import { palettes } from "../theme/tokens";
import type { PaletteName } from "../core/types";

export function getSeriesColor(palette: PaletteName, index: number): string {
  const colors = palettes[palette].colors;
  // Wrap safely for negative indices too (JS `%` keeps the sign).
  return colors[((index % colors.length) + colors.length) % colors.length];
}

export function getSeriesColors(palette: PaletteName, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(getSeriesColor(palette, i));
  return out;
}