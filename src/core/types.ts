import type { ReactNode } from "react";

export type WidgetCategory = "kpi" | "chart" | "list" | "map" | "custom";

export type ConfigField =
  | { key: string; label: string; type: "string"; default?: string }
  | { key: string; label: string; type: "number"; default?: number; min?: number; max?: number }
  | { key: string; label: string; type: "boolean"; default?: boolean }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; default?: string }
  | { key: string; label: string; type: "palette"; default?: PaletteName }
  | { key: string; label: string; type: "range"; min: number; max: number; step?: number; default?: number };

export type PaletteName = "lavender" | "traqto" | "sunrise" | "aurora" | "earth";

export type DataContext = {
  userId?: string;
  orgId?: string;
};

export type WidgetDef<TConfig = Record<string, unknown>, TData = unknown> = {
  id: string;
  title: string;
  description?: string;
  category: WidgetCategory;
  icon?: ReactNode;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  configSchema?: ConfigField[];
  defaultConfig: TConfig;
  loadData: (ctx: DataContext, cfg: TConfig) => Promise<TData> | TData;
  render: (props: { data: TData; cfg: TConfig; loading: boolean; error: Error | null }) => ReactNode;
};

export type LayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widgetId: string;
  config: Record<string, unknown>;
};

export type DashboardLayout = {
  version: number;
  items: LayoutItem[];
  palette?: PaletteName;
};