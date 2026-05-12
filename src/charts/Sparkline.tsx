import { LineChart, Line, ResponsiveContainer } from "recharts";

export type SparklineProps = {
  data: number[];
  color?: string;
  height?: number;
};

export function Sparkline({ data, color = "#7c3aed", height = 36 }: SparklineProps) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive
          animationDuration={700}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}