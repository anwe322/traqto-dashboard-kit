import { useMemo } from "react";
import {
  ScatterChart as RScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import { useTheme } from "../theme/ThemeProvider";
import { getSeriesColor } from "./colors";
import { ChartTooltip } from "./ChartTooltip";
import { EmptyState } from "./EmptyState";

export type ScatterSeries = {
  key: string;
  label?: string;
  color?: string;
  data: Array<Record<string, unknown>>;
};

export type ScatterChartProps = {
  series: ScatterSeries[];
  xKey: string;
  yKey: string;
  sizeKey?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  height?: number | string;
  xFormatter?: (v: number) => string;
  yFormatter?: (v: number) => string;
};

export function ScatterChart({
  series,
  xKey,
  yKey,
  sizeKey,
  showLegend = true,
  showGrid = true,
  animate = true,
  height = "100%",
  xFormatter,
  yFormatter,
}: ScatterChartProps) {
  const { palette, tokens } = useTheme();
  const resolved = useMemo(
    () => series.map((s, i) => ({ ...s, color: s.color ?? getSeriesColor(palette, i) })),
    [series, palette],
  );

  if (!series || series.length === 0 || series.every((s) => s.data.length === 0)) {
    return <EmptyState />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        {showGrid && (
          <CartesianGrid stroke={tokens.surface.cardBorder} strokeDasharray="3 4" />
        )}
        <XAxis
          type="number"
          dataKey={xKey}
          stroke={tokens.text.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={xFormatter}
        />
        <YAxis
          type="number"
          dataKey={yKey}
          stroke={tokens.text.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={yFormatter}
          width={48}
        />
        {sizeKey && <ZAxis type="number" dataKey={sizeKey} range={[60, 600]} />}
        <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: "3 3" }} />
        {showLegend && (
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: tokens.text.secondary, paddingTop: 8 }} />
        )}
        {resolved.map((s) => (
          <Scatter
            key={s.key}
            name={s.label ?? s.key}
            data={s.data}
            fill={s.color}
            isAnimationActive={animate}
            animationDuration={800}
          />
        ))}
      </RScatterChart>
    </ResponsiveContainer>
  );
}
