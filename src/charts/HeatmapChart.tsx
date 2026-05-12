import { Fragment, useMemo, useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { EmptyState } from "./EmptyState";

export type HeatmapCell = {
  x: string | number;
  y: string | number;
  value: number;
};

export type HeatmapChartProps = {
  data: HeatmapCell[];
  xLabels?: Array<string | number>;
  yLabels?: Array<string | number>;
  colorScale?: [string, string];
  valueFormatter?: (v: number) => string;
  showValues?: boolean;
  cellGap?: number;
  cellRadius?: number;
  height?: number | string;
  minValue?: number;
  maxValue?: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mixColor(from: [number, number, number], to: [number, number, number], t: number): string {
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function HeatmapChart({
  data,
  xLabels,
  yLabels,
  colorScale,
  valueFormatter,
  showValues = true,
  cellGap = 4,
  cellRadius = 8,
  height = "100%",
  minValue,
  maxValue,
}: HeatmapChartProps) {
  const { tokens, gradient } = useTheme();
  const [hover, setHover] = useState<HeatmapCell | null>(null);

  const { rows, cols, lookup, vMin, vMax, fromRgb, toRgb } = useMemo(() => {
    const xs = xLabels ?? Array.from(new Set(data.map((d) => d.x)));
    const ys = yLabels ?? Array.from(new Set(data.map((d) => d.y)));
    const map = new Map<string, HeatmapCell>();
    for (const c of data) map.set(`${c.x}::${c.y}`, c);
    const values = data.map((d) => d.value);
    const computedMin = minValue ?? (values.length ? Math.min(...values) : 0);
    const computedMax = maxValue ?? (values.length ? Math.max(...values) : 1);
    const [from, to] = colorScale ?? [`${gradient[0]}10`, gradient[0]];
    return {
      rows: ys,
      cols: xs,
      lookup: map,
      vMin: computedMin,
      vMax: computedMax === computedMin ? computedMin + 1 : computedMax,
      fromRgb: hexToRgb(from.length === 9 ? from.slice(0, 7) : from),
      toRgb: hexToRgb(to.length === 9 ? to.slice(0, 7) : to),
    };
  }, [data, xLabels, yLabels, colorScale, gradient, minValue, maxValue]);

  if (!data || data.length === 0) return <EmptyState />;

  const fmt = valueFormatter ?? ((v: number) => (Math.abs(v) >= 100 ? Math.round(v).toLocaleString("de-DE") : v.toFixed(1)));

  return (
    <div style={{ height, width: "100%", display: "flex", flexDirection: "column", position: "relative", gap: 8 }}>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: `auto repeat(${cols.length}, minmax(0, 1fr))`,
          gridAutoRows: "minmax(0, 1fr)",
          gap: cellGap,
        }}
      >
        <div />
        {cols.map((c) => (
          <div
            key={`col-${c}`}
            style={{
              fontSize: 11,
              color: tokens.text.muted,
              textAlign: "center",
              padding: "0 2px",
              alignSelf: "end",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={String(c)}
          >
            {c}
          </div>
        ))}
        {rows.map((r) => (
          <Fragment key={`row-${r}`}>
            <div
              style={{
                fontSize: 11,
                color: tokens.text.muted,
                paddingRight: 8,
                alignSelf: "center",
                justifySelf: "end",
                whiteSpace: "nowrap",
              }}
              title={String(r)}
            >
              {r}
            </div>
            {cols.map((c) => {
              const cell = lookup.get(`${c}::${r}`);
              const v = cell?.value ?? null;
              const t = v == null ? 0 : (v - vMin) / (vMax - vMin);
              const clamped = Math.max(0, Math.min(1, t));
              const bg = v == null ? "transparent" : mixColor(fromRgb, toRgb, clamped);
              const isHover = hover && hover.x === c && hover.y === r;
              const contrast = clamped > 0.55 ? "#ffffff" : tokens.text.primary;
              return (
                <div
                  key={`cell-${c}-${r}`}
                  onMouseEnter={() => v != null && setHover({ x: c, y: r, value: v })}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    background: bg,
                    border: v == null ? `1px dashed ${tokens.surface.cardBorder}` : "none",
                    borderRadius: cellRadius,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: contrast,
                    transition: "transform 150ms ease, filter 150ms ease",
                    transform: isHover ? "scale(1.04)" : "scale(1)",
                    filter: isHover ? "brightness(1.05)" : "none",
                    cursor: v == null ? "default" : "pointer",
                    minWidth: 0,
                    minHeight: 0,
                  }}
                  title={v == null ? "Keine Daten" : `${r} · ${c}: ${fmt(v)}`}
                >
                  {showValues && v != null ? fmt(v) : ""}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
      <ColorScaleLegend
        min={vMin}
        max={vMax}
        fromRgb={fromRgb}
        toRgb={toRgb}
        formatter={fmt}
      />
    </div>
  );
}

function ColorScaleLegend({
  min,
  max,
  fromRgb,
  toRgb,
  formatter,
}: {
  min: number;
  max: number;
  fromRgb: [number, number, number];
  toRgb: [number, number, number];
  formatter: (v: number) => string;
}) {
  const { tokens } = useTheme();
  const steps = 16;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: tokens.text.muted }}>
      <span>{formatter(min)}</span>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${Array.from({ length: steps + 1 }, (_, i) => mixColor(fromRgb, toRgb, i / steps)).join(", ")})`,
        }}
      />
      <span>{formatter(max)}</span>
    </div>
  );
}