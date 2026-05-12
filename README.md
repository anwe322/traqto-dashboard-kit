# @traqto/dashboard-kit

Interaktiver, wiederverwendbarer Dashboard-Baukasten für alle traqto-Produkte
(fleet, hive, sure, audit, …).

**Features (Phase 1, aktueller Stand):**

- Widget-Registry — Widgets werden als Definitionen registriert, nicht hartkodiert
- Drei leuchtende Farbpaletten (Sunrise, Aurora, Earth) — pro Dashboard wählbar
- Recharts-basierte Charts mit hauseigenen Defaults (animiert, schöne Tooltips)
- `KpiCard` mit Sparkline und Trend
- `LineChart` mit Mehrfach-Serien, Smoothing, eigener Tooltip
- Dashboard-Provider + Toolbar + statisches CSS-Grid

**Geplant (Phasen 2–6):** Drag-and-Drop · Resize · Widget-Picker · Config-Panels ·
weitere Chart-Typen (Bar, Pie, Area, Scatter, Radar, Heatmap) · Supabase-Persistenz
pro User · fleet-Migration.

---

## Setup

```powershell
cd d:\Traqto\Code\traqto-dashboard-kit
npm install
npm run dev
```

`npm run dev` startet den Playground unter http://localhost:5180 — dort siehst du
4 KPI-Karten und 2 Charts mit Mock-Daten und kannst die Farbpalette umschalten.

## Build (als Paket)

```powershell
npm run build
```

Erzeugt `dist/` mit ESM + UMD + Typen — bereit für `npm publish` an GitHub Packages.

## Verwendung im Host-Projekt (Beispiel: fleet, hive)

```tsx
import {
  DashboardProvider,
  DashboardGrid,
  DashboardToolbar,
  useDashboard,
  registerWidget,
  LineChart,
  KpiCard,
} from "@traqto/dashboard-kit";

registerWidget({
  id: "my-widget",
  title: "Mein Widget",
  category: "chart",
  defaultSize: { w: 6, h: 4 },
  defaultConfig: {},
  loadData: async () => fetchMyData(),
  render: ({ data }) => <LineChart data={data} xKey="month" series={[{ key: "value" }]} />,
});
```

## Architektur

Siehe Plan: `C:\Users\PCUser\.claude\plans\gut-mache-einen-plan-zippy-umbrella.md`