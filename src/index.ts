export type {
  WidgetDef,
  WidgetCategory,
  ConfigField,
  PaletteName,
  DataContext,
  LayoutItem,
  DashboardLayout,
} from "./core/types";

export {
  registerWidget,
  unregisterWidget,
  getWidget,
  listWidgets,
  listWidgetsByCategory,
  clearRegistry,
} from "./core/WidgetRegistry";

export { DashboardProvider, useDashboard } from "./core/DashboardProvider";
export { DashboardGrid } from "./core/DashboardGrid";
export { DashboardToolbar } from "./core/DashboardToolbar";
export { WidgetFrame } from "./core/WidgetFrame";
export { WidgetHost } from "./core/WidgetHost";
export { WidgetPicker } from "./editor/WidgetPicker";
export { WidgetConfigPanel } from "./editor/WidgetConfigPanel";

export {
  exportCSV,
  exportSVG,
  exportPNG,
  exportWidget,
  toCSV,
  type ExportFormat,
} from "./core/export";

export { ThemeProvider, useTheme } from "./theme/ThemeProvider";
export { palettes, defaultPalette, tokens } from "./theme/tokens";

export { LineChart } from "./charts/LineChart";
export type { LineChartProps, LineSeries } from "./charts/LineChart";
export { BarChart } from "./charts/BarChart";
export type { BarChartProps, BarSeries } from "./charts/BarChart";
export { PieChart } from "./charts/PieChart";
export type { PieChartProps, PieDatum } from "./charts/PieChart";
export { AreaChart } from "./charts/AreaChart";
export type { AreaChartProps, AreaSeries } from "./charts/AreaChart";
export { ScatterChart } from "./charts/ScatterChart";
export type { ScatterChartProps, ScatterSeries } from "./charts/ScatterChart";
export { RadarChart } from "./charts/RadarChart";
export type { RadarChartProps, RadarSeries } from "./charts/RadarChart";
export { HeatmapChart } from "./charts/HeatmapChart";
export type { HeatmapChartProps, HeatmapCell } from "./charts/HeatmapChart";
export { CalendarHeatmap } from "./charts/CalendarHeatmap";
export type { CalendarHeatmapProps, CalendarHeatmapPoint } from "./charts/CalendarHeatmap";

export { KpiCard } from "./charts/KpiCard";
export type { KpiCardProps } from "./charts/KpiCard";
export { Sparkline } from "./charts/Sparkline";
export { getSeriesColor, getSeriesColors } from "./charts/colors";