import { palettes } from "../theme/tokens";
import type { PaletteName } from "../core/types";

export function getSeriesColor(palette: PaletteName, index: number): string {
  const colors = palettes[palette].colors;
  return colors[index % colors.length];
}

export function getSeriesColors(palette: PaletteName, count: number): string[] {
  const colors = palettes[palette].colors;
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(colors[i % colors.length]);
  return out;
}