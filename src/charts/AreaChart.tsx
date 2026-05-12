import { useMemo } from "react";
import {
  AreaChart as RAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../theme/ThemeProvider";
import { getSeriesColor } from "./colors";
import { ChartTooltip } from "./ChartTooltip";
import { EmptyState } from "./EmptyState";

export type AreaSeries = {
  key: string;
  label?: string;
  color?: string;
};

export type AreaChartProps = {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: AreaSeries[];
  stacked?: boolean;
  smooth?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  height?: number | string;
  yFormatter?: (v: number) => string;
};

export function AreaChart({
  data,
  xKey,
  series,
  stacked = false,
  smooth = true,
  showLegend = true,
  showGrid = true,
  animate = true,
  height = "100%",
  yFormatter,
}: AreaChartProps) {
  const { palette, tokens } = useTheme();
  const resolvedSeries = useMemo(
    () => series.map((s, i) => ({ ...s, color: s.color ?? getSeriesColor(palette, i) })),
    [series, palette],
  );

  if (!data || data.length === 0) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RAreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <defs>
          {resolvedSeries.map((s) => (
            <linearGradient key={s.key} id={`area-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && (
          <CartesianGrid stroke={tokens.surface.cardBorder} strokeDasharray="3 4" vertical={false} />
        )}
        <XAxis dataKey={xKey} stroke={tokens.text.muted} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={tokens.text.muted} fontSize={12} tickLine={false} axisLine={false} tickFormatter={yFormatter} width={48} />
        <Tooltip content={<ChartTooltip />} />
        {showLegend && (
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: tokens.text.secondary, paddingTop: 8 }} />
        )}
        {resolvedSeries.map((s) => (
          <Area
            key={s.key}
            type={smooth ? "monotone" : "linear"}
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color}
            strokeWidth={2.5}
            fill={`url(#area-grad-${s.key})`}
            stackId={stacked ? "stack" : undefined}
            isAnimationActive={animate}
            animationDuration={900}
          />
        ))}
      </RAreaChart>
    </ResponsiveContainer>
  );
}
