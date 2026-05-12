import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { PieChart as RPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from "recharts";
import { useTheme } from "../theme/ThemeProvider";
import { getSeriesColors } from "./colors";
import { ChartTooltip } from "./ChartTooltip";
import { EmptyState } from "./EmptyState";

export type PieDatum = {
  name: string;
  value: number;
  color?: string;
};

export type PieChartProps = {
  data: PieDatum[];
  donut?: boolean;
  innerRadius?: number;
  showLegend?: boolean;
  animate?: boolean;
  height?: number | string;
  valueFormatter?: (v: number) => string;
  centerLabel?: string;
  centerValue?: string;
};

export function PieChart({
  data,
  donut = false,
  innerRadius,
  showLegend = true,
  animate = true,
  height = "100%",
  valueFormatter,
  centerLabel,
  centerValue,
}: PieChartProps) {
  const { palette, tokens } = useTheme();

  const colored = useMemo(() => {
    const colors = getSeriesColors(palette, data.length);
    return data.map((d, i) => ({ ...d, color: d.color ?? colors[i] }));
  }, [data, palette]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pieRect, setPieRect] = useState<{ cx: number; cy: number; r: number } | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const svg = el.querySelector("svg.recharts-surface");
      const sector = el.querySelector(".recharts-pie-sector path, .recharts-sector");
      if (!svg || !sector) return;
      const svgRect = (svg as SVGSVGElement).getBoundingClientRect();
      const sRect = (sector as SVGPathElement).getBoundingClientRect();
      const cx = sRect.left + sRect.width / 2 - svgRect.left;
      const cy = sRect.top + sRect.height / 2 - svgRect.top;
      const r = Math.min(sRect.width, sRect.height) / 2;
      setPieRect({ cx, cy, r });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [data, donut]);

  if (!data || data.length === 0) return <EmptyState />;

  const inner = donut ? (innerRadius ?? 60) : 0;

  return (
    <div ref={containerRef} style={{ height, width: "100%", position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RPieChart>
          <Pie
            data={colored}
            dataKey="value"
            nameKey="name"
            innerRadius={inner}
            outerRadius="80%"
            paddingAngle={donut ? 2 : 0}
            isAnimationActive={animate}
            animationDuration={900}
            activeShape={renderActiveShape}
            stroke="#ffffff"
            strokeWidth={2}
            label={false}
            labelLine={false}
          >
            {colored.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<TooltipWithFormatter formatter={valueFormatter} />} />
          {showLegend && (
            <Legend
              iconType="circle"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: 12, color: tokens.text.secondary, paddingTop: 8 }}
            />
          )}
        </RPieChart>
      </ResponsiveContainer>
      {donut && (centerLabel || centerValue) && pieRect && (
        <div
          style={{
            position: "absolute",
            left: pieRect.cx,
            top: pieRect.cy,
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            maxWidth: Math.max(60, pieRect.r * 1.6),
            textAlign: "center",
          }}
        >
          {centerValue && (
            <div style={{ fontSize: 22, fontWeight: 700, color: tokens.text.primary, lineHeight: 1.05, whiteSpace: "nowrap" }}>
              {centerValue}
            </div>
          )}
          {centerLabel && (
            <div style={{ fontSize: 10, color: tokens.text.muted, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.6 }}>
              {centerLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TooltipWithFormatter({
  formatter,
  ...rest
}: { formatter?: (v: number) => string } & Record<string, unknown>) {
  const payload = (rest as { payload?: Array<{ value: number; name: string; color?: string }> }).payload;
  if (!formatter || !payload) {
    return <ChartTooltip {...(rest as Parameters<typeof ChartTooltip>[0])} />;
  }
  const formattedPayload = payload.map((p) => ({ ...p, value: formatter(p.value) as unknown as number }));
  return <ChartTooltip {...(rest as Parameters<typeof ChartTooltip>[0])} payload={formattedPayload as never} />;
}

function renderActiveShape(props: unknown) {
  const p = props as {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
  };
  return (
    <Sector
      cx={p.cx}
      cy={p.cy}
      innerRadius={p.innerRadius}
      outerRadius={p.outerRadius + 5}
      startAngle={p.startAngle}
      endAngle={p.endAngle}
      fill={p.fill}
    />
  );
}