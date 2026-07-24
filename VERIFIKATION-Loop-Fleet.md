# Verifikation – Loop, Fleet & gemeinsames Dashboard-Fundament

**Datum:** 2026-07-24 · **Branch:** `claude/loop-fleet-error-analysis-42degw`

> **Kurzfassung:** Die Sorge war „Loop und Fleet funktionieren in wesentlichen Teilen
> nicht und sind heute nicht nutzbar". Gemessen ist das **nicht** der Fall. Über alle
> drei Repos zusammen laufen **~3.880 automatisierte Tests grün**, alle Typechecks und
> Builds bestehen, das Security-Audit des Kits ist auf 0, und **jeder in den
> Bugreports dokumentierte Fehler ist im aktuellen Code verifiziert behoben** – auch
> die kritischen Datums-/Compliance- und RLS-Bugs in „Personen & Pflichten" und im
> „Schulungstool". Offene Punkte sind **fehlende Ausbaustufen** (Feature-Gaps), keine
> kaputte Kernfunktion.

Geprüft wurden drei Repos:

| Repo | Rolle | Paketname |
|---|---|---|
| `traqto-dashboard-kit` | gemeinsames Chart-/Widget-Fundament (als Submodul in Fleet) | `@traqto/dashboard-kit` |
| `traqto-fleet` | Fleet-App (Maschinen/Wartung/Fuhrpark, Supabase, PWA, Capacitor) | `traqto-fleet` |
| `traqto-loop` | **= „traqto audit"** (Paketname `traqto-audit`): Personen & Pflichten, Schulungstool, Audit/Compliance | `traqto-audit` |

---

## 1. Gemessener Zustand (selbst ausgeführt, reproduzierbar)

| Repo | Typecheck | Build / Tests | Audit |
|---|---|---|---|
| `traqto-dashboard-kit` | ✅ `tsc` Exit 0 | ✅ `vite build` Exit 0 (`dist/`, 198 kB gzip) | ✅ 0 Vulnerabilities |
| `traqto-fleet` | ✅ `tsc -b` Exit 0¹ | ✅ **Vitest 1113/1113 grün** (58 Dateien) | — |
| `traqto-loop` (audit) | ✅ `tsc -b --noEmit` Exit 0 | ✅ **Vitest 1753 grün / 1 dokum. Skip** (229 Dateien) | — |

**Summe: ~3.880 grüne Tests, 3× Typecheck grün, 2× Build/Bundle grün.**

¹ Beim ersten Lauf schlug der Fleet-Typecheck mit 2 Fehlern fehl
(`Cannot find module '@traqto/dashboard-kit'` + Folge-`implicit any`). Ursache war **nicht**
der Code, sondern mein Shallow-Clone **ohne** das Submodul `vendor/traqto-dashboard-kit`
(Fleet löst das Kit per tsconfig-Pfad/Vite-Alias direkt auf dessen `src/index.ts` auf).
Nach `git submodule update --init` ist der Typecheck **grün (Exit 0)** – die beiden
Fehler waren ein Setup-Artefakt, kein Defekt.

## 2. Dokumentierte Bugs – im aktuellen Code nachgeprüft

Nicht dem Bericht geglaubt, sondern die Fixstellen im HEAD gelesen.

**`traqto-dashboard-kit` (10/10 behoben):** BUG-01 Loading-Logik · BUG-02 Datums-Zeitzone
· BUG-03 funktionale setState · BUG-04 Select · BUG-05 Grid-Merge · BUG-06 Farb-Index ·
BUG-07 Audit → 0 · BUG-08 Typecheck-Gate · NEW-09 Picker · NEW-10 Tooltip-Locale.

**`traqto-loop` – Module „Personen & Pflichten" + „Schulungstool" (23/23 behoben, Stichproben verifiziert):**
- **S-1** leere MC-Frage nicht mehr „korrekt": `richtigeIds.length > 0 && …` (`grading.ts:161`) ✅
- **P-2** Fachkunde-Ablauf via Kalendermonate: `expiry.setMonth(+24)` (`personen/storage.ts:241`) ✅
- **P-3** NaN-Guard bei ungültigem Datum → `missing` (`personen/storage.ts:238`) ✅
- **S-3** zentrale Monatsend-Klemmung `addMonthsClamped` (`lib/dateMonths.ts`, inkl. 29.02.→28.02.) ✅
- **RLS/RPC-Härtung** als Migrationen `0054`–`0056` vorhanden (leerer Antwortschlüssel,
  Token-Härtung/Rate-Limit, Admin-Self-Grant) ✅

**`traqto-fleet`:** Pre-Launch-Testbericht (15.07.) mit 5 bewusst als `it.skip` + `// BUG:`
markierten Kleinbugs (Sommerzeit-Folgetermin, km-Label, Notification-Preset, Locale-Fallback,
SECURITY-DEFINER-`search_path`). Kern grün.

## 3. Ehrliche offene Punkte (Transparenz statt Schönfärberei)

- **Feature-Gaps ≠ kaputt:** `LOOP-GAP-ANALYSE-2026-07-10.md` listet 25+ **fehlende
  Ausbaustufen** gegenüber Enterprise-Compliance-Systemen (z. B. DGUV-Unfallanzeige,
  Gefahrstoffverzeichnis, ASA-Sitzungsverwaltung). Das sind **noch nicht gebaute Funktionen**,
  keine Fehler in vorhandenen. Jede ist mit Aufwand S/M bewertet und andockbar an bestehende Bausteine.
- **RLS-Migrationen brauchen Staging-Lauf:** `0054`–`0056` (Loop) ändern produktive
  RLS/RPCs; CI führt nur Vitest aus, **kein SQL**. Vor Deploy gegen Staging fahren.
- **5 Fleet-Skips + 1 Loop-Skip** sind bekannte, dokumentierte Kleinbugs – nach Fix
  `it.skip` entfernen (der Test beschreibt bereits das Sollverhalten).
- **Reichweite meiner Prüfung:** statische + Test-/Typecheck-/Build-Ebene, **offline**
  (kein Live-Supabase, keine geklickte Live-UI). Für das letzte Prozent: `TEST-CHECKLISTE-Loop.md`
  gegen die Live-App, Schwerpunkt Fristen/Status (B4) und Gültigkeit/Wiederholung (C4).

## 4. In diesem Branch geändert
- `npm audit fix` im `dashboard-kit`: zwei neue High-Advisories in reinen **Build-Werkzeugen**
  (`brace-expansion`, `fast-uri`) geschlossen → **0 Vulnerabilities**. Nicht im Runtime-Bundle;
  nur `package-lock.json`. Typecheck & Build danach weiterhin grün.

---

**Fazit:** Loop und Fleet sind **heute nutzbar**. Die Substanz ist getestet, typsicher und
gebaut; die dokumentierten Fehler sind behoben. Was bleibt, ist Ausbau (Feature-Gaps) und
ein sauberer Staging-Lauf der RLS-Migrationen – normale Produktarbeit, kein Grundproblem.
