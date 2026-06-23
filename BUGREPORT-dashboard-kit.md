# Bug-Report – traqto-dashboard-kit

> **Wichtiger Hinweis zum Auftrag:** Getestet werden sollten „Personen & Pflichten"
> und das Schulungstool von **loop.traqto.de**. Diese Module liegen im Repo
> `anwe322/traqto-loop`, auf das diese Session **keinen Zugriff** hat, und die
> Live-Seite ist aus der Umgebung nicht interaktiv erreichbar (`HTTP 403`).
>
> Dieser Report deckt daher das **hier verfügbare** Repo `traqto-dashboard-kit` ab
> (Chart-/Widget-Bibliothek, die u. a. Dashboards in den traqto-Produkten rendert).
> Mehrere Befunde – v. a. die **Datums-/Zeitzonen-Logik** und das **Lade-/Leerzustands-Handling** –
> sind direkt übertragbar auf die Fristen- und Schulungs-Module und sollten dort
> ebenfalls geprüft werden.

**Durchgeführte Tests**

| Test | Ergebnis |
|---|---|
| `npm install` | ✅ ok (npm audit: 1 low, 1 **high**) |
| `npm run build` | ✅ ok – `dist/` erzeugt (Bundle ~876 kB / 198 kB gzip) |
| `npm run typecheck` | ❌ Fehler – ausschließlich in `examples/playground` (s. BUG-08) |
| Statisches Code-Audit `src/` | 7 Befunde (s. u.) |

Schweregrade: 🔴 hoch · 🟠 mittel · 🟡 niedrig · ⚪ Info

> **Status:** Alle Befunde (BUG-01 bis BUG-08) sind in diesem Branch **behoben**.
> Verifiziert: `npm run typecheck` ✅, `npm run build` ✅, `npm audit` → **0 vulnerabilities**.

---

## 🔴 BUG-01 – Widget zeigt endloses Ladeskelett bei leerem/`null`-Ergebnis
**Datei:** `src/core/WidgetHost.tsx:77-84`

Die Render-Verzweigung des Widget-Bodies entscheidet anhand von `data == null`,
**nicht** anhand des `loading`-States:

```tsx
const body =
  error != null ? <ErrorState .../>
  : data == null ? <LoadingSkeleton />   // <-- Problem
  : def.render({ data, cfg, loading, error });
```

Wenn `loadData()` legitim `null`/`undefined` liefert (z. B. „keine Daten vorhanden",
leeres KPI-Resultat), wird `loading` zwar auf `false` gesetzt, aber `data == null`
bleibt `true` → das Shimmer-Skelett läuft **dauerhaft** weiter. Der Nutzer sieht nie
einen Leerzustand oder Inhalt.

- **Erwartet:** Nach Ladeende wird Inhalt bzw. ein Leerzustand angezeigt.
- **Tatsächlich:** Endlose Ladeanimation bei `null`-Daten.
- **Fix:** Verzweigung auf `loading` stützen, z. B.
  `loading ? <LoadingSkeleton/> : error ? ... : def.render(...)`, und im Renderer den
  Leerzustand behandeln. (`loading` wird aktuell berechnet, aber für den Body nie genutzt.)

---

## 🟠 BUG-02 – Zeitzonen-Off-by-one bei String-Datumswerten (Kalender-Heatmap)
**Datei:** `src/charts/CalendarHeatmap.tsx:45-47, 95`

```ts
function toDate(v: string | Date): Date {
  return v instanceof Date ? new Date(v.getFullYear(), v.getMonth(), v.getDate())
                           : new Date(v);   // String -> UTC-Mitternacht
}
```

Ein String wie `"2026-06-22"` wird von `new Date(...)` als **UTC-Mitternacht** geparst.
Anschließend werden über `startOfDay()`/`isoKey()` die **lokalen** Felder (`getDate()` …)
gelesen. In Zeitzonen mit negativem UTC-Offset (z. B. Amerika) rutscht das Datum dadurch
um einen Tag nach hinten → Werte landen in der falschen Zelle.

- **Erwartet:** Datum landet unabhängig von der Zeitzone im richtigen Tag.
- **Tatsächlich:** In Zeitzonen `< UTC` Verschiebung um einen Tag.
- **Relevanz:** Dieselbe Klasse von Fehler ist typisch für **Fristen/Fälligkeiten** und
  **Schulungs-Gültigkeiten** – dort dringend mitprüfen.
- **Fix:** Datumsstrings explizit als lokales Datum parsen (`new Date(y, m-1, d)` aus
  den Bestandteilen) oder durchgängig in UTC rechnen.

---

## 🟠 BUG-03 – Verlorene State-Updates durch nicht-funktionale setState-Aufrufe
**Datei:** `src/core/DashboardProvider.tsx:74-86`

`addWidget`, `removeWidget`, `updateWidgetConfig`, `updateItems`, `setPalette` und
`resetLayout` bauen den neuen State aus der **geschlossenen** Variable `layout`:

```tsx
addWidget: (item) => setLayout({ ...layout, items: [...layout.items, ...] }),
```

Werden zwei dieser Aktionen im selben Render-Zyklus ausgelöst (z. B. zwei Widgets in
schneller Folge hinzufügen, oder Hinzufügen + Konfig-Update), arbeiten beide auf
demselben `layout`-Snapshot → die zweite Änderung überschreibt die erste (lost update).

- **Fix:** Funktionale Updates verwenden: `setLayoutState(prev => ({ ...prev, ... }))`.

---

## 🟡 BUG-04 – Select-Feld ohne passende Option erzeugt State/UI-Mismatch
**Datei:** `src/editor/WidgetConfigPanel.tsx:181-188`

```tsx
<select value={(value as string) ?? ""} ...>
  {field.options.map(opt => <option .../> )}
</select>
```

Ist der aktuelle Wert leer oder nicht in `options` enthalten, zeigt der Browser optisch
die **erste** Option an, der State bleibt aber `""`/abweichend. Ein Absenden ohne
Interaktion speichert dann einen anderen Wert als dargestellt.

- **Fix:** Leer-/Platzhalter-Option ergänzen oder Wert gegen `options` validieren und
  ggf. auf `default` normalisieren.

---

## 🟡 BUG-05 – Layout-Merge erzeugt „leere" Items für unbekannte IDs
**Datei:** `src/core/DashboardGrid.tsx:55-60`

```tsx
const prev = byId.get(n.i);
if (!prev) return { i: n.i, x, y, w, h, widgetId: "", config: {} };
```

Liefert das Grid eine ID, die nicht in `layout.items` existiert (Desync zwischen Grid und
State), entsteht ein Item mit leerem `widgetId` → es wird als „Unbekanntes Widget"
gerendert und der ursprüngliche Datensatz ist verloren.

- **Fix:** Unbekannte IDs überspringen (`filter(Boolean)`) statt Platzhalter-Items zu erzeugen.

---

## 🟡 BUG-06 – Negativer Serien-Index liefert `undefined`-Farbe
**Datei:** `src/charts/colors.ts:4-7`

```ts
return colors[index % colors.length];
```

Bei negativem `index` ist `index % len` in JS negativ → `colors[-1]` = `undefined`
(Chart-Linie ohne Farbe). Defensive Normalisierung fehlt.

- **Fix:** `colors[((index % len) + len) % len]`.

---

## ⚪ BUG-07 / Hinweis – `npm audit`: 1 high-severity Vulnerability ✅ behoben
`npm install` meldete **2 Vulnerabilities (1 low, 1 high)** in Dev-Abhängigkeiten
(`@babel/core`, `vite`/`launch-editor`). Per `npm audit fix` auf gepatchte Versionen
innerhalb der bestehenden Ranges aktualisiert → `npm audit` meldet jetzt
**0 vulnerabilities** (nur `package-lock.json` betroffen).

---

## ⚪ BUG-08 – `npm run typecheck` schlägt durch Beispiel-Code fehl ✅ behoben
Der Typecheck (`tsc --noEmit` über die Root-`tsconfig`) bezieht `examples/playground` ein
und scheitert dort an:
- `Cannot find module '@traqto/dashboard-kit'` (Paket erst nach `build` auflösbar),
- `Cannot find name '__dirname' / module 'node:path'` (fehlende `@types/node`),
- mehreren impliziten `any` (`noImplicitAny`).

Die **Bibliothek selbst** (`tsconfig.build.json`) baut fehlerfrei. **Fix:** Eigene
`tsconfig.typecheck.json` (nur `src`) ergänzt und `typecheck`-Script darauf umgestellt
(`tsc -p tsconfig.typecheck.json`) → `npm run typecheck` ist jetzt als CI-Gate grün.

---

---

# Nachtrag – vertieftes Audit der übrigen Komponenten

Zweiter Durchgang über `WidgetFrame`, `DashboardToolbar`, `WidgetPicker`,
`HeatmapChart`, `PieChart`, `BarChart`, `AreaChart`, `ScatterChart`, `RadarChart`,
`ChartTooltip`, `EmptyState`, `tokens`. Ergebnis: zwei kleinere Bugs (behoben),
ein kosmetischer Hinweis.

## 🟡 NEW-09 – WidgetPicker zeigt spät registrierte Widgets nicht ✅ behoben
**Datei:** `src/editor/WidgetPicker.tsx:35`

`const all = useMemo(() => listWidgets(), [])` liest die Widget-Registry nur einmal beim
ersten Mount. Werden Widgets erst danach registriert (lazy/asynchron), fehlen sie dauerhaft
im Picker, weil die Komponente montiert bleibt (sie rendert nur `null`, wenn geschlossen).

- **Fix:** Abhängigkeit `[open]` → Registry wird bei jedem Öffnen neu gelesen.

## 🟡 NEW-10 – ChartTooltip: Zahlen < 1000 ohne de-DE-Format ✅ behoben
**Datei:** `src/charts/ChartTooltip.tsx:43-48`

Werte ≥ 1000 wurden mit `toLocaleString("de-DE")` formatiert (z. B. `1.234,5`), Werte < 1000
dagegen über `String(Math.round(v*100)/100)` mit **Dezimalpunkt** (`12.5`). Inkonsistentes
Trennzeichen im selben Tooltip.

- **Fix:** Auch den Klein-Werte-Zweig über `toLocaleString("de-DE", { maximumFractionDigits: 2 })`.

## ⚪ NEW-11 – Hinweis: ungenutzte Drag-Handle-Klassen (kosmetisch, nicht behoben)
`WidgetFrame` setzt `tdk-widget-handle`, `WidgetHost` `tdk-kpi-drag-handle` – react-grid-layout
zieht aber über `.tdk-drag-handle` am Item-Wrapper (ganze Karte ist Anfasser). Die
Header-Klassen sind toter Code; funktional unkritisch. Optional aufräumen oder
`draggableHandle` auf den Header umstellen, falls nur dort gezogen werden soll.

---

## Empfohlene nächste Schritte
1. BUG-01 und BUG-03 zeitnah fixen (sichtbare bzw. datenrelevante Fehler).
2. **Datums-/Fristenlogik** (BUG-02-Muster) gezielt im Repo `traqto-loop` prüfen –
   Fälligkeiten in „Pflichten" und Gültigkeiten im Schulungstool.
3. Für die eigentlichen Modul-Tests eine Session auf `anwe322/traqto-loop` starten
   (siehe `TEST-CHECKLISTE-Loop.md` für die manuellen Live-Testfälle).
