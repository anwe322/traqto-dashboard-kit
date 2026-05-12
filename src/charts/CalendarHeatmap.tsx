import { useMemo, useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { EmptyState } from "./EmptyState";

export type CalendarHeatmapPoint = {
  date: string | Date;
  value: number;
};

export type CalendarHeatmapProps = {
  data: CalendarHeatmapPoint[];
  startDate?: string | Date;
  endDate?: string | Date;
  colorScale?: [string, string];
  valueFormatter?: (v: number) => string;
  dateFormatter?: (d: Date) => string;
  cellSize?: number;
  cellGap?: number;
  cellRadius?: number;
  weekStartsOn?: "monday" | "sunday";
  showWeekdayLabels?: boolean;
  showMonthLabels?: boolean;
  showLegend?: boolean;
  emptyColor?: string;
  height?: number | string;
  maxValue?: number;
};

const WEEKDAYS_DE_MON = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAYS_DE_SUN = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

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

function toDate(v: string | Date): Date {
  return v instanceof Date ? new Date(v.getFullYear(), v.getMonth(), v.getDate()) : new Date(v);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isoKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function CalendarHeatmap({
  data,
  startDate,
  endDate,
  colorScale,
  valueFormatter,
  dateFormatter,
  cellSize = 13,
  cellGap = 3,
  cellRadius = 3,
  weekStartsOn = "monday",
  showWeekdayLabels = true,
  showMonthLabels = true,
  showLegend = true,
  emptyColor,
  height = "100%",
  maxValue,
}: CalendarHeatmapProps) {
  const { tokens, gradient } = useTheme();
  const [hover, setHover] = useState<{ date: Date; value: number; x: number; y: number } | null>(null);

  const { weeks, monthMarks, vMax, fromRgb, toRgb, lookup } = useMemo(() => {
    if (!data || data.length === 0) {
      return { weeks: [], monthMarks: [], vMax: 0, fromRgb: [0, 0, 0] as [number, number, number], toRgb: [0, 0, 0] as [number, number, number], lookup: new Map<string, number>() };
    }
    const map = new Map<string, number>();
    let dataMin: Date | null = null;
    let dataMax: Date | null = null;
    for (const p of data) {
      const d = startOfDay(toDate(p.date));
      map.set(isoKey(d), (map.get(isoKey(d)) ?? 0) + p.value);
      if (!dataMin || d < dataMin) dataMin = d;
      if (!dataMax || d > dataMax) dataMax = d;
    }
    const start = startDate ? startOfDay(toDate(startDate)) : (dataMin ?? new Date());
    const end = endDate ? startOfDay(toDate(endDate)) : (dataMax ?? new Date());

    const offset = weekStartsOn === "monday" ? 1 : 0;
    const adjust = (d: Date) => (d.getDay() - offset + 7) % 7;
    const firstCellDate = addDays(start, -adjust(start));

    const totalDays = Math.round((end.getTime() - firstCellDate.getTime()) / 86_400_000) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    const wks: Array<Array<{ date: Date; value: number | null; inRange: boolean } | null>> = [];
    let cursor = new Date(firstCellDate);
    let lastMonth = -1;
    const marks: Array<{ weekIndex: number; label: string }> = [];

    for (let w = 0; w < totalWeeks; w++) {
      const week: Array<{ date: Date; value: number | null; inRange: boolean } | null> = [];
      for (let d = 0; d < 7; d++) {
        const inRange = cursor >= start && cursor <= end;
        const v = map.get(isoKey(cursor)) ?? null;
        week.push({ date: new Date(cursor), value: v, inRange });
        if (d === 0 && cursor.getMonth() !== lastMonth && inRange) {
          marks.push({ weekIndex: w, label: MONTHS_DE[cursor.getMonth()] });
          lastMonth = cursor.getMonth();
        }
        cursor = addDays(cursor, 1);
      }
      wks.push(week);
    }

    const values = Array.from(map.values());
    const computedMax = maxValue ?? (values.length ? Math.max(...values) : 1);
    const [from, to] = colorScale ?? [`${gradient[0]}1f`, gradient[1]];

    return {
      weeks: wks,
      monthMarks: marks,
      vMax: computedMax === 0 ? 1 : computedMax,
      fromRgb: hexToRgb(from.length === 9 ? from.slice(0, 7) : from),
      toRgb: hexToRgb(to.length === 9 ? to.slice(0, 7) : to),
      lookup: map,
    };
  }, [data, startDate, endDate, colorScale, gradient, maxValue, weekStartsOn]);

  if (!data || data.length === 0) return <EmptyState />;

  const weekdayLabels = weekStartsOn === "monday" ? WEEKDAYS_DE_MON : WEEKDAYS_DE_SUN;
  const fmtValue = valueFormatter ?? ((v: number) => v.toLocaleString("de-DE"));
  const fmtDate =
    dateFormatter ??
    ((d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`);

  const labelGutter = showWeekdayLabels ? cellSize + 6 : 0;
  const monthRowHeight = showMonthLabels ? 18 : 0;
  const gridHeight = 7 * cellSize + 6 * cellGap;

  void lookup;

  return (
    <div
      style={{
        height,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
      }}
      onMouseLeave={() => setHover(null)}
    >
      <div style={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ position: "relative", paddingLeft: labelGutter, paddingTop: monthRowHeight }}>
          {showMonthLabels && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: labelGutter,
                right: 0,
                height: monthRowHeight,
                fontSize: 10,
                color: tokens.text.muted,
                pointerEvents: "none",
              }}
            >
              {monthMarks.map((m) => (
                <span
                  key={`${m.weekIndex}-${m.label}`}
                  style={{
                    position: "absolute",
                    left: m.weekIndex * (cellSize + cellGap),
                    fontWeight: 600,
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          )}

          {showWeekdayLabels && (
            <div
              style={{
                position: "absolute",
                top: monthRowHeight,
                left: 0,
                width: labelGutter,
                height: gridHeight,
                fontSize: 10,
                color: tokens.text.muted,
                pointerEvents: "none",
              }}
            >
              {weekdayLabels.map((wd, i) => (
                <span
                  key={wd}
                  style={{
                    position: "absolute",
                    top: i * (cellSize + cellGap) + Math.floor(cellSize / 2) - 6,
                    right: 6,
                    display: i % 2 === 0 ? "block" : "none",
                  }}
                >
                  {wd}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: cellGap, height: gridHeight }}>
            {weeks.map((week, wi) => (
              <div key={`w-${wi}`} style={{ display: "flex", flexDirection: "column", gap: cellGap }}>
                {week.map((cell, di) => {
                  if (!cell || !cell.inRange) {
                    return <div key={`c-${wi}-${di}`} style={{ width: cellSize, height: cellSize }} />;
                  }
                  const v = cell.value;
                  const hasData = v != null && v > 0;
                  const t = hasData ? Math.min(1, v / vMax) : 0;
                  const bg = hasData
                    ? mixColor(fromRgb, toRgb, t)
                    : emptyColor ?? `${gradient[0]}0a`;
                  return (
                    <div
                      key={`c-${wi}-${di}`}
                      onMouseEnter={(e) =>
                        setHover({
                          date: cell.date,
                          value: v ?? 0,
                          x: e.clientX,
                          y: e.clientY,
                        })
                      }
                      onMouseMove={(e) =>
                        setHover((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))
                      }
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: cellRadius,
                        background: bg,
                        transition: "transform 120ms ease, filter 120ms ease",
                        cursor: hasData ? "pointer" : "default",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showLegend && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: tokens.text.muted,
            paddingLeft: labelGutter,
          }}
        >
          <span>weniger</span>
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <span
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: cellRadius,
                background: t === 0 ? (emptyColor ?? `${gradient[0]}0a`) : mixColor(fromRgb, toRgb, t),
                display: "inline-block",
              }}
            />
          ))}
          <span>mehr</span>
        </div>
      )}

      {hover && (
        <div
          style={{
            position: "fixed",
            left: hover.x + 12,
            top: hover.y + 12,
            background: tokens.surface.card,
            border: `1px solid ${tokens.surface.cardBorder}`,
            borderRadius: tokens.radius.md,
            boxShadow: tokens.shadow.md,
            padding: "8px 12px",
            fontSize: 12,
            color: tokens.text.primary,
            pointerEvents: "none",
            zIndex: 200,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontWeight: 600 }}>{fmtDate(hover.date)}</div>
          <div style={{ color: tokens.text.secondary }}>{fmtValue(hover.value)}</div>
        </div>
      )}
    </div>
  );
}
