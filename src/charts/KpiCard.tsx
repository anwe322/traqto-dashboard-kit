import { useTheme } from "../theme/ThemeProvider";
import { Sparkline } from "./Sparkline";
import { getSeriesColor } from "./colors";

export type KpiCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: number; label?: string };
  sparkline?: number[];
  colorIndex?: number;
  icon?: React.ReactNode;
};

export function KpiCard({ label, value, unit, trend, sparkline, colorIndex = 0, icon }: KpiCardProps) {
  const { palette, tokens } = useTheme();
  const color = getSeriesColor(palette, colorIndex);
  const trendUp = trend ? trend.value >= 0 : null;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: tokens.spacing.lg,
        background: tokens.surface.card,
        borderRadius: tokens.radius.xl,
        border: "none",
        boxShadow: tokens.shadow.sm,
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 200ms ease, transform 200ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = tokens.shadow.md;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = tokens.shadow.sm;
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${color}1f, transparent 65%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
        {icon && (
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `${color}22`,
              color,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            {icon}
          </span>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: tokens.text.secondary, letterSpacing: 0.4, textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 12, position: "relative" }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: tokens.text.primary, lineHeight: 1 }}>
          {typeof value === "number" ? value.toLocaleString("de-DE") : value}
        </span>
        {unit && <span style={{ fontSize: 14, color: tokens.text.muted }}>{unit}</span>}
      </div>
      {trend && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: trendUp ? "#2ea043" : "#c0392b",
            display: "flex",
            alignItems: "center",
            gap: 4,
            position: "relative",
          }}
        >
          <span>{trendUp ? "▲" : "▼"}</span>
          <span>{Math.abs(trend.value).toLocaleString("de-DE", { maximumFractionDigits: 1 })}%</span>
          {trend.label && <span style={{ color: tokens.text.muted, marginLeft: 4 }}>{trend.label}</span>}
        </div>
      )}
      {sparkline && sparkline.length > 0 && (
        <div style={{ marginTop: "auto", paddingTop: 8, position: "relative" }}>
          <Sparkline data={sparkline} color={color} />
        </div>
      )}
    </div>
  );
}