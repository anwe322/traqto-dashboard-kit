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
- **Freigabe-Link** — Dashboard-Ansicht (Layout + Palette + Widget-Konfiguration)
  per Link teilen, Empfänger sehen sie schreibgeschützt (`readOnly`)

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

## Freigabe-Link (Dashboard teilen)

Die Toolbar zeigt standardmäßig einen **🔗 Freigabe-Link**-Button: Er serialisiert
das aktuelle Layout (Widgets, Positionen, Konfiguration, Palette) in einen
URL-sicheren String und kopiert einen Link der Form `…#share=<payload>` in die
Zwischenablage. Der Payload liegt im URL-Fragment und landet damit nicht in
Server-Logs. Im Link stecken **keine Daten** — der Empfänger lädt die
Widget-Daten über seine eigene Registry/Session.

```tsx
import { parseShareLink, createShareLink, DashboardProvider } from "@traqto/dashboard-kit";

// Beim App-Start: liegt ein Freigabe-Link vor?
const shared = parseShareLink(); // liest window.location, null wenn keiner da ist

<DashboardProvider defaultLayout={shared ?? defaultLayout} readOnly={!!shared} …>
```

- `readOnly` deaktiviert Edit-Modus, alle Mutationen und die localStorage-Persistenz;
  die Toolbar zeigt statt der Edit-Buttons ein „Freigegebene Ansicht"-Badge.
- Eigene Link-Behandlung: `<DashboardToolbar onShareLink={(url) => …} />`,
  Basis-URL überschreiben mit `shareBaseUrl`, Button ausblenden mit
  `showShareButton={false}`.
- Low-level-API: `encodeShareLayout` / `decodeShareLayout` /
  `sanitizeSharedLayout` (validiert fremde Payloads).

Ausprobieren im Playground: Dashboard anpassen → „🔗 Freigabe-Link" → Link in
neuem (privaten) Fenster öffnen → read-only Ansicht mit Banner.

## Architektur

Siehe Plan: `C:\Users\PCUser\.claude\plans\gut-mache-einen-plan-zippy-umbrella.md`