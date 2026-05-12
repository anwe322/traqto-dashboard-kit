import { useMemo } from "react";
import {
  BarChart as RBarChart,
  Bar,
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

export type BarSeries = {
  key: string;
  label?: string;
  color?: string;
};

export type BarChartProps = {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: BarSeries[];
  stacked?: boolean;
  layout?: "horizontal" | "vertical";
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  height?: number | string;
  yFormatter?: (v: number) => string;
  barRadius?: number;
};

export function BarChart({
  data,
  xKey,
  series,
  stacked = false,
  layout = "horizontal",
  showLegend = true,
  showGrid = true,
  animate = true,
  height = "100%",
  yFormatter,
  barRadius = 12,
}: BarChartProps) {
  const { palette, tokens } = useTheme();
  const resolvedSeries = useMemo(
    () => series.map((s, i) => ({ ...s, color: s.color ?? getSeriesColor(palette, i) })),
    [series, palette],
  );

  if (!data || data.length === 0) return <EmptyState />;

  const isVertical = layout === "vertical";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 16, bottom: 8, left: isVertical ? 16 : 0 }}
        barCategoryGap={isVertical ? 12 : "20%"}
      >
        {showGrid && (
          <CartesianGrid
            stroke={tokens.surface.cardBorder}
            strokeDasharray="3 4"
            horizontal={!isVertical}
            vertical={isVertical}
          />
        )}
        {isVertical ? (
          <>
            <XAxis type="number" stroke={tokens.text.muted} fontSize={12} tickLine={false} axisLine={false} tickFormatter={yFormatter} />
            <YAxis type="category" dataKey={xKey} stroke={tokens.text.muted} fontSize={12} tickLine={false} axisLine={false} width={90} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} stroke={tokens.text.muted} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={tokens.text.muted} fontSize={12} tickLine={false} axisLine={false} tickFormatter={yFormatter} width={48} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(15,30,46,0.04)" }} />
        {showLegend && (
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: tokens.text.secondary, paddingTop: 8 }} />
        )}
        {resolvedSeries.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            fill={s.color}
            stackId={stacked ? "stack" : undefined}
            radius={
              stacked
                ? 0
                : layout === "vertical"
                ? [0, barRadius, barRadius, 0]
                : [barRadius, barRadius, 0, 0]
            }
            isAnimationActive={animate}
            animationDuration={800}
          />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}
