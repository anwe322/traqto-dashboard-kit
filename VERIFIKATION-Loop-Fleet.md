# Verifikation – Zustand `traqto-dashboard-kit` (Fundament für Loop & Fleet)

**Datum:** 2026-07-24 · **Branch:** `claude/loop-fleet-error-analysis-42degw`

> **Kurzfassung:** Das gemeinsame Dashboard-Fundament, das Loop *und* Fleet zum
> Rendern ihrer Dashboards nutzen, ist **grün und lauffähig**. Typecheck, Build und
> Security-Audit bestehen; alle zehn dokumentierten Bugs sind im echten Quellcode
> **verifiziert behoben** (nicht nur „als behoben markiert"). Es wurden **keine neuen
> Logik-, Frontend- oder Workflow-Fehler** gefunden.

---

## Was tatsächlich gemessen wurde (reproduzierbar)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Abhängigkeiten | `npm install` | ✅ 194 Pakete, sauber |
| Typprüfung (CI-Gate) | `npm run typecheck` | ✅ **Exit 0**, keine Typfehler |
| Produktions-Build | `npm run build` | ✅ **Exit 0** – `dist/` mit ESM + UMD + Typen + CSS |
| Security-Audit | `npm audit` | ✅ **0 Vulnerabilities** (siehe unten) |

Bundle: `dashboard-kit.js` 876 kB / **198 kB gzip**, `.umd.cjs` 610 kB / 165 kB gzip,
CSS 5,5 kB / 1,4 kB gzip. 713 Module transformiert, Deklarationsdateien generiert.

## Die 10 dokumentierten Bugs – im Code nachgeprüft

Jeder Fix wurde in der genannten Datei tatsächlich gelesen, nicht nur der Bugreport geglaubt.

| # | Thema | Datei | Status |
|---|---|---|---|
| BUG-01 | Endlos-Ladeskelett bei `null`-Daten | `WidgetHost.tsx:77` — verzweigt jetzt auf `loading`, nicht `data == null` | ✅ behoben |
| BUG-02 | Zeitzonen-Off-by-one bei Datumsstrings | `CalendarHeatmap.tsx:45–51` — ISO-Strings werden **lokal** geparst | ✅ behoben |
| BUG-03 | Verlorene State-Updates (nicht-funktionales setState) | `DashboardProvider.tsx:74–96` — durchgängig `setLayoutState(prev => …)` | ✅ behoben |
| BUG-04 | Select ohne passende Option (State/UI-Mismatch) | `WidgetConfigPanel.tsx:181–195` — Platzhalter-Option bei unbekanntem Wert | ✅ behoben |
| BUG-05 | Leere Items für unbekannte IDs (Grid-Desync) | `DashboardGrid.tsx:55–64` — unbekannte IDs werden übersprungen (`filter`) | ✅ behoben |
| BUG-06 | Negativer Serien-Index → `undefined`-Farbe | `colors.ts:7` — `((i % len) + len) % len` | ✅ behoben |
| BUG-07 | Audit-Vulnerability | `package-lock.json` | ✅ 0 Vulnerabilities |
| BUG-08 | Typecheck scheiterte an Beispiel-Code | eigene `tsconfig.typecheck.json` (nur `src`) | ✅ behoben |
| NEW-09 | Picker zeigt spät registrierte Widgets nicht | `WidgetPicker.tsx:37` — Registry-Reread bei jedem Öffnen (`[open]`) | ✅ behoben |
| NEW-10 | Tooltip: inkonsistentes Zahlenformat | `ChartTooltip.tsx:43–48` — beide Zweige `de-DE` | ✅ behoben |

## Zusätzlicher, frischer Audit (über den Bugreport hinaus)

Unabhängiger, skeptischer Blick auf die Workflow-tragenden Teile:
**Widget-Registry, Export-Pipeline (CSV/SVG/PNG), Grid-Merge, öffentliche API-Exports,
Playground-Verdrahtung**. Ergebnis: kohärent, keine neuen Defekte.
- Export: CSV mit UTF-8-BOM (Excel-tauglich), korrektes Escaping, Object-URL-Cleanup, Fehlerbehandlung.
- `src/index.ts`: vollständige, konsistente öffentliche API — jeder Export zeigt auf eine existierende Datei.
- Provider/Grid/Toolbar/Picker/ConfigPanel greifen sauber ineinander (ResizeObserver-gestützte Breite, localStorage-Persistenz mit Fallback).

## In diesem Branch geändert
- `npm audit fix`: zwei **neue** High-Advisories in reinen **Build-Werkzeugen**
  (`brace-expansion` via glob, `fast-uri` via dts-Generator) geschlossen. Beide sind
  **nicht** im ausgelieferten Runtime-Bundle enthalten (Runtime-Deps: recharts,
  react-grid-layout, react-resizable). Nur `package-lock.json` betroffen →
  `npm audit` meldet wieder **0 Vulnerabilities**. Typecheck & Build danach weiterhin grün.

---

## Ehrliche Grenze dieser Verifikation

Die eigentlichen Loop-Module **„Personen & Pflichten"** und das **Schulungstool** liegen im
Repo **`anwe322/traqto-loop`**, auf das diese Session **keinen Zugriff** hat; `loop.traqto.de`
ist aus dieser Umgebung nicht interaktiv erreichbar (HTTP 403). Dieses Dokument zertifiziert
daher das **gemeinsame Rendering-Fundament**, nicht die Live-App Ende-zu-Ende.

**Empfohlene nächste Schritte für die volle Gewissheit:**
1. Session mit Zugriff auf `anwe322/traqto-loop` starten → dann kann dort dieselbe
   Prüftiefe (Build/Typecheck + Datums-/Fristenlogik + Leerzustände) angewandt werden.
2. `TEST-CHECKLISTE-Loop.md` gegen die Live-App durchklicken — besonders **B4 (Fristen/Status)**
   und **C4 (Gültigkeit/Wiederholung)**, weil die Datumsklasse aus BUG-02 dort erfahrungsgemäß
   am ehesten auftritt.
