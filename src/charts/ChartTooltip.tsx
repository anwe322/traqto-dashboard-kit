import type { TooltipProps } from "recharts";
import { useTheme } from "../theme/ThemeProvider";

export function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const { tokens } = useTheme();
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: tokens.surface.card,
        border: `1px solid ${tokens.surface.cardBorder}`,
        borderRadius: tokens.radius.md,
        boxShadow: tokens.shadow.md,
        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
        fontSize: 13,
        color: tokens.text.primary,
        minWidth: 120,
      }}
    >
      {label !== undefined && (
        <div style={{ fontWeight: 600, marginBottom: 6, color: tokens.text.secondary }}>{label}</div>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: entry.color as string,
              flexShrink: 0,
            }}
          />
          <span style={{ flex: 1, color: tokens.text.secondary }}>{entry.name}</span>
          <span style={{ fontWeight: 600 }}>{formatValue(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function formatValue(v: unknown): string {
  if (typeof v === "number") {
    if (Math.abs(v) >= 1000) return v.toLocaleString("de-DE", { maximumFractionDigits: 1 });
    return v.toLocaleString("de-DE", { maximumFractionDigits: 2 });
  }
  return String(v ?? "");
}