import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DashboardProvider,
  DashboardGrid,
  DashboardToolbar,
  WidgetPicker,
  WidgetConfigPanel,
  useDashboard,
  type DashboardLayout,
} from "@traqto/dashboard-kit";
import { registerDemoWidgets } from "./widgets";

registerDemoWidgets();

const defaultLayout: DashboardLayout = {
  version: 1,
  palette: "lavender",
  items: [
    { i: "k1", x: 0, y: 0, w: 3, h: 2, widgetId: "kpi-wartungskosten-ytd", config: {} },
    { i: "k2", x: 3, y: 0, w: 3, h: 2, widgetId: "kpi-arbeitszeit", config: {} },
    { i: "k3", x: 6, y: 0, w: 3, h: 2, widgetId: "kpi-stillstand", config: {} },
    { i: "k4", x: 9, y: 0, w: 3, h: 2, widgetId: "kpi-diesel-ytd", config: {} },

    { i: "c1", x: 0, y: 2, w: 6, h: 4, widgetId: "chart-wartung-pro-maschine", config: { stacked: true } },
    { i: "c2", x: 6, y: 2, w: 6, h: 4, widgetId: "chart-wartung-monatlich", config: {} },

    { i: "c3", x: 0, y: 6, w: 4, h: 4, widgetId: "chart-kostenverteilung", config: { donut: true } },
    { i: "c4", x: 4, y: 6, w: 4, h: 4, widgetId: "chart-maschinen-health", config: {} },
    { i: "c5", x: 8, y: 6, w: 4, h: 4, widgetId: "chart-diesel-monthly", config: { smooth: true, showLegend: true } },

    { i: "c6", x: 0, y: 10, w: 6, h: 4, widgetId: "chart-arbeitszeit-mitarbeiter", config: {} },
    { i: "c7", x: 6, y: 10, w: 6, h: 4, widgetId: "chart-kosten-vs-stunden", config: {} },

    { i: "c8", x: 0, y: 14, w: 12, h: 4, widgetId: "chart-wartung-heatmap", config: {} },
    { i: "c9", x: 0, y: 18, w: 12, h: 3, widgetId: "chart-einsatz-calendar", config: {} },
  ],
};

export function App() {
  const ctx = useMemo(() => ({ userId: "demo-user" }), []);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>
      <DashboardProvider defaultLayout={defaultLayout} ctx={ctx} storageKey="traqto-dashboard-kit-playground">
        <Workspace />
      </DashboardProvider>
    </div>
  );
}

function Workspace() {
  const { layout, editMode, ctx, removeWidget, updateItems } = useDashboard();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1336);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 1336));
    ro.observe(el);
    setWidth(el.clientWidth || 1336);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <DashboardToolbar
        title="traqto Dashboard-Kit · Playground"
        onAddWidget={() => setPickerOpen(true)}
      />
      <div ref={containerRef}>
        <DashboardGrid
          layout={layout}
          ctx={ctx}
          editMode={editMode}
          onLayoutChange={updateItems}
          onRemove={removeWidget}
          onConfigure={(id) => setConfigId(id)}
          width={width}
        />
      </div>
      <WidgetPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
      <WidgetConfigPanel itemId={configId} onClose={() => setConfigId(null)} />
    </>
  );
}