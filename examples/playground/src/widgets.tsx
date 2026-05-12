import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  ScatterChart,
  RadarChart,
  HeatmapChart,
  CalendarHeatmap,
  KpiCard,
  registerWidget,
  type HeatmapCell,
  type CalendarHeatmapPoint,
} from "@traqto/dashboard-kit";

const monthLabels = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function mockMonthly(seed: number, base: number, spread: number) {
  const r = rand(seed);
  return monthLabels.map((m) => ({ month: m, value: Math.round(base + (r() - 0.5) * spread) }));
}

function mockDieselSeries() {
  const ra = rand(17);
  const rb = rand(91);
  return monthLabels.map((m) => ({
    month: m,
    diesel: Math.round(2800 + (ra() - 0.5) * 1600),
    agrar: Math.round(1900 + (rb() - 0.5) * 1100),
  }));
}

function mockMaintenanceCostsByMachine() {
  return [
    { machine: "Fendt 724", arbeit: 4200, ersatzteile: 6800, fremd: 1200 },
    { machine: "JD 6155R", arbeit: 3800, ersatzteile: 5200, fremd: 900 },
    { machine: "Claas Axion", arbeit: 2900, ersatzteile: 4100, fremd: 600 },
    { machine: "Kuhn Häcksler", arbeit: 1600, ersatzteile: 2400, fremd: 400 },
    { machine: "MB Trac", arbeit: 1200, ersatzteile: 1800, fremd: 250 },
  ];
}

function mockMaintenanceCostsMonthly() {
  const r = rand(33);
  return monthLabels.map((m) => ({
    month: m,
    plan: Math.round(1800 + (r() - 0.5) * 600),
    ungeplant: Math.round(900 + (r() - 0.5) * 700),
  }));
}

function mockCostBreakdown() {
  return [
    { name: "Arbeitszeit", value: 13700 },
    { name: "Ersatzteile", value: 20300 },
    { name: "Fremdleistung", value: 3350 },
    { name: "Schmierstoffe", value: 1480 },
  ];
}

function mockWorkHoursByEmployee() {
  return [
    { name: "Max", wartung: 142, einsatz: 380, fahrt: 90 },
    { name: "Anna", wartung: 88, einsatz: 410, fahrt: 105 },
    { name: "Lukas", wartung: 167, einsatz: 220, fahrt: 60 },
    { name: "Petra", wartung: 54, einsatz: 480, fahrt: 130 },
    { name: "Tom", wartung: 110, einsatz: 290, fahrt: 75 },
  ];
}

function mockMachineHealth() {
  return [
    { dim: "Verfügbarkeit", a: 88, b: 72 },
    { dim: "Effizienz", a: 76, b: 82 },
    { dim: "Wartungs-Compliance", a: 92, b: 65 },
    { dim: "Kosten / h", a: 70, b: 80 },
    { dim: "Auslastung", a: 84, b: 68 },
    { dim: "CO₂", a: 65, b: 78 },
  ];
}

function mockCostVsHours() {
  const r = rand(7);
  return Array.from({ length: 24 }, (_, i) => ({
    stunden: Math.round(100 + r() * 900),
    kosten: Math.round(2000 + r() * 18000),
    name: `Maschine ${i + 1}`,
  }));
}

function mockMaintenanceHeatmap(): HeatmapCell[] {
  const machines = ["Fendt 724", "JD 6155R", "Claas Axion", "Kuhn Häcksler", "MB Trac"];
  const cells: HeatmapCell[] = [];
  const r = rand(41);
  for (const m of machines) {
    for (const month of monthLabels) {
      const peak = month === "Mär" || month === "Okt" ? 3 : 1;
      cells.push({ x: month, y: m, value: Math.round(r() * 5 * peak) });
    }
  }
  return cells;
}

function mockEinsatzCalendar(): CalendarHeatmapPoint[] {
  const r = rand(2026);
  const today = new Date();
  const points: CalendarHeatmapPoint[] = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (364 - i));
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const month = d.getMonth();
    const isHarvestSeason = month === 6 || month === 7 || month === 8 || month === 9;
    const base = isWeekend ? 0.15 : 0.55;
    const seasonal = isHarvestSeason ? 0.55 : 0;
    const noise = r();
    const intensity = (base + seasonal) * noise;
    if (intensity < 0.1) continue;
    points.push({ date: d, value: Math.round(intensity * 12) });
  }
  return points;
}

export function registerDemoWidgets() {
  // ---------------- KPI Widgets ----------------

  registerWidget({
    id: "kpi-wartungskosten-ytd",
    title: "Wartungskosten YTD",
    category: "kpi",
    defaultSize: { w: 3, h: 2 },
    defaultConfig: {},
    loadData: () => ({
      value: "38.430",
      unit: "€",
      trend: { value: 12.3, label: "vs. Vorjahr" },
      sparkline: mockMonthly(55, 3000, 1800).map((p) => p.value),
    }),
    render: ({ data }) => {
      const d = data as { value: string; unit: string; trend: { value: number; label: string }; sparkline: number[] };
      return <KpiCard label="Wartungskosten YTD" value={d.value} unit={d.unit} trend={d.trend} sparkline={d.sparkline} colorIndex={0} />;
    },
  });

  registerWidget({
    id: "kpi-arbeitszeit",
    title: "Arbeitszeit",
    category: "kpi",
    defaultSize: { w: 3, h: 2 },
    defaultConfig: {},
    loadData: () => ({
      value: 4_318,
      unit: "h",
      trend: { value: 6.4, label: "vs. Vorjahr" },
      sparkline: mockMonthly(72, 350, 120).map((p) => p.value),
    }),
    render: ({ data }) => {
      const d = data as { value: number; unit: string; trend: { value: number; label: string }; sparkline: number[] };
      return <KpiCard label="Arbeitszeit" value={d.value} unit={d.unit} trend={d.trend} sparkline={d.sparkline} colorIndex={1} />;
    },
  });

  registerWidget({
    id: "kpi-stillstand",
    title: "Stillstand",
    category: "kpi",
    defaultSize: { w: 3, h: 2 },
    defaultConfig: {},
    loadData: () => ({
      value: 184,
      unit: "h",
      trend: { value: -9.8, label: "vs. Vorjahr" },
      sparkline: mockMonthly(13, 20, 30).map((p) => p.value),
    }),
    render: ({ data }) => {
      const d = data as { value: number; unit: string; trend: { value: number; label: string }; sparkline: number[] };
      return <KpiCard label="Stillstand" value={d.value} unit={d.unit} trend={d.trend} sparkline={d.sparkline} colorIndex={2} />;
    },
  });

  registerWidget({
    id: "kpi-diesel-ytd",
    title: "Diesel YTD",
    category: "kpi",
    defaultSize: { w: 3, h: 2 },
    defaultConfig: {},
    loadData: () => ({
      value: 27_412,
      unit: "L",
      trend: { value: -4.2, label: "vs. Vorjahr" },
      sparkline: mockMonthly(11, 2500, 1400).map((p) => p.value),
    }),
    render: ({ data }) => {
      const d = data as { value: number; unit: string; trend: { value: number; label: string }; sparkline: number[] };
      return <KpiCard label="Diesel YTD" value={d.value} unit={d.unit} trend={d.trend} sparkline={d.sparkline} colorIndex={3} />;
    },
  });

  // ---------------- Wartungs- & Arbeitszeit-Widgets ----------------

  registerWidget({
    id: "chart-wartung-pro-maschine",
    title: "Wartungskosten pro Maschine",
    category: "chart",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    defaultConfig: { stacked: true },
    loadData: () => mockMaintenanceCostsByMachine(),
    render: ({ data, cfg }) => {
      const c = cfg as { stacked: boolean };
      return (
        <BarChart
          data={data as Array<Record<string, unknown>>}
          xKey="machine"
          series={[
            { key: "arbeit", label: "Arbeitszeit" },
            { key: "ersatzteile", label: "Ersatzteile" },
            { key: "fremd", label: "Fremdleistung" },
          ]}
          stacked={c.stacked}
          layout="vertical"
          yFormatter={(v) => `${(v / 1000).toFixed(1)}k €`}
        />
      );
    },
  });

  registerWidget({
    id: "chart-wartung-monatlich",
    title: "Wartung: Geplant vs. Ungeplant",
    category: "chart",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    defaultConfig: {},
    loadData: () => mockMaintenanceCostsMonthly(),
    render: ({ data }) => (
      <AreaChart
        data={data as Array<Record<string, unknown>>}
        xKey="month"
        series={[
          { key: "plan", label: "Geplant" },
          { key: "ungeplant", label: "Ungeplant" },
        ]}
        stacked
        yFormatter={(v) => `${v.toLocaleString("de-DE")} €`}
      />
    ),
  });

  registerWidget({
    id: "chart-kostenverteilung",
    title: "Kostenverteilung",
    category: "chart",
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    defaultConfig: { donut: true },
    loadData: () => mockCostBreakdown(),
    render: ({ data, cfg }) => {
      const c = cfg as { donut: boolean };
      const total = (data as Array<{ value: number }>).reduce((acc, d) => acc + d.value, 0);
      return (
        <PieChart
          data={data as Array<{ name: string; value: number }>}
          donut={c.donut}
          centerLabel="Gesamt"
          centerValue={`${total.toLocaleString("de-DE")} €`}
        />
      );
    },
  });

  registerWidget({
    id: "chart-arbeitszeit-mitarbeiter",
    title: "Arbeitszeit pro Mitarbeiter",
    category: "chart",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    defaultConfig: {},
    loadData: () => mockWorkHoursByEmployee(),
    render: ({ data }) => (
      <BarChart
        data={data as Array<Record<string, unknown>>}
        xKey="name"
        series={[
          { key: "wartung", label: "Wartung" },
          { key: "einsatz", label: "Einsatz" },
          { key: "fahrt", label: "Fahrt" },
        ]}
        stacked
        yFormatter={(v) => `${v} h`}
      />
    ),
  });

  registerWidget({
    id: "chart-maschinen-health",
    title: "Maschinen-Health (Radar)",
    category: "chart",
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    defaultConfig: {},
    loadData: () => mockMachineHealth(),
    render: ({ data }) => (
      <RadarChart
        data={data as Array<Record<string, unknown>>}
        axisKey="dim"
        series={[
          { key: "a", label: "Fendt 724" },
          { key: "b", label: "JD 6155R" },
        ]}
      />
    ),
  });

  registerWidget({
    id: "chart-kosten-vs-stunden",
    title: "Kosten vs. Stunden (Scatter)",
    category: "chart",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    defaultConfig: {},
    loadData: () => mockCostVsHours(),
    render: ({ data }) => (
      <ScatterChart
        series={[{ key: "maschinen", label: "Maschinen", data: data as Array<Record<string, unknown>> }]}
        xKey="stunden"
        yKey="kosten"
        xFormatter={(v) => `${v} h`}
        yFormatter={(v) => `${(v / 1000).toFixed(0)}k €`}
      />
    ),
  });

  registerWidget({
    id: "chart-wartung-heatmap",
    title: "Wartungs-Aktivität pro Maschine × Monat",
    category: "chart",
    defaultSize: { w: 12, h: 4 },
    minSize: { w: 6, h: 3 },
    defaultConfig: {},
    loadData: () => mockMaintenanceHeatmap(),
    render: ({ data }) => (
      <HeatmapChart
        data={data as HeatmapCell[]}
        valueFormatter={(v) => `${v}`}
      />
    ),
  });

  registerWidget({
    id: "chart-einsatz-calendar",
    title: "Einsatztage (letzte 12 Monate)",
    description: "Tageskalender, Farbintensität = Einsatzstunden",
    category: "chart",
    defaultSize: { w: 12, h: 3 },
    minSize: { w: 8, h: 3 },
    defaultConfig: {},
    loadData: () => mockEinsatzCalendar(),
    render: ({ data }) => (
      <CalendarHeatmap
        data={data as CalendarHeatmapPoint[]}
        valueFormatter={(v) => `${v} h Einsatz`}
      />
    ),
  });

  registerWidget({
    id: "chart-diesel-monthly",
    title: "Diesel & Agrardiesel pro Monat",
    category: "chart",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    defaultConfig: { smooth: true, showLegend: true },
    loadData: () => mockDieselSeries(),
    render: ({ data, cfg }) => {
      const c = cfg as { smooth: boolean; showLegend: boolean };
      return (
        <LineChart
          data={data as Array<Record<string, unknown>>}
          xKey="month"
          series={[
            { key: "diesel", label: "Diesel" },
            { key: "agrar", label: "Agrardiesel" },
          ]}
          smooth={c.smooth}
          showLegend={c.showLegend}
          yFormatter={(v) => `${v.toLocaleString("de-DE")} L`}
        />
      );
    },
  });
}
