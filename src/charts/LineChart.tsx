import { useMemo } from "react";
import {
  LineChart as RLineChart,
  Line,
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

export type LineSeries = {
  key: string;
  label?: string;
  color?: string;
};

export type LineChartProps = {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: LineSeries[];
  smooth?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  height?: number | string;
  yFormatter?: (v: number) => string;
};

export function LineChart({
  data,
  xKey,
  series,
  smooth = true,
  showLegend = true,
  showGrid = true,
  animate = true,
  height = "100%",
  yFormatter,
}: LineChartProps) {
  const { palette, tokens } = useTheme();

  const resolvedSeries = useMemo(
    () => series.map((s, i) => ({ ...s, color: s.color ?? getSeriesColor(palette, i) })),
    [series, palette],
  );

  if (!data || data.length === 0) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <defs>
          {resolvedSeries.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && (
          <CartesianGrid stroke={tokens.surface.cardBorder} strokeDasharray="3 4" vertical={false} />
        )}
        <XAxis
          dataKey={xKey}
          stroke={tokens.text.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={tokens.text.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={yFormatter}
          width={48}
        />
        <Tooltip content={<ChartTooltip />} />
        {showLegend && (
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: tokens.text.secondary, paddingTop: 8 }}
          />
        )}
        {resolvedSeries.map((s) => (
          <Line
            key={s.key}
            type={smooth ? "monotone" : "linear"}
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0, fill: s.color }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
            isAnimationActive={animate}
            animationDuration={900}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}