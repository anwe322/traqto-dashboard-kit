import { useMemo } from "react";
import {
  RadarChart as RRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../theme/ThemeProvider";
import { getSeriesColor } from "./colors";
import { ChartTooltip } from "./ChartTooltip";
import { EmptyState } from "./EmptyState";

export type RadarSeries = {
  key: string;
  label?: string;
  color?: string;
};

export type RadarChartProps = {
  data: Array<Record<string, unknown>>;
  axisKey: string;
  series: RadarSeries[];
  showLegend?: boolean;
  animate?: boolean;
  height?: number | string;
};

export function RadarChart({
  data,
  axisKey,
  series,
  showLegend = true,
  animate = true,
  height = "100%",
}: RadarChartProps) {
  const { palette, tokens } = useTheme();
  const resolved = useMemo(
    () => series.map((s, i) => ({ ...s, color: s.color ?? getSeriesColor(palette, i) })),
    [series, palette],
  );

  if (!data || data.length === 0) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RRadarChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 16 }}>
        <PolarGrid stroke={tokens.surface.cardBorder} />
        <PolarAngleAxis dataKey={axisKey} tick={{ fontSize: 11, fill: tokens.text.secondary }} />
        <PolarRadiusAxis tick={{ fontSize: 10, fill: tokens.text.muted }} stroke={tokens.surface.cardBorder} />
        {resolved.map((s) => (
          <Radar
            key={s.key}
            name={s.label ?? s.key}
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            fill={s.color}
            fillOpacity={0.3}
            isAnimationActive={animate}
            animationDuration={900}
          />
        ))}
        <Tooltip content={<ChartTooltip />} />
        {showLegend && (
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: tokens.text.secondary, paddingTop: 8 }} />
        )}
      </RRadarChart>
    </ResponsiveContainer>
  );
}
