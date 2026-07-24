# Korrektheits-Befunde – ausgelieferte Funktionen (Loop & Fleet)

**Datum:** 2026-07-24 · **Frage:** „Funktioniert das, was gebaut ist und an Kunden verkauft
wird?" · **Methode:** Production-Builds + volle Unit-/Integrations-Suiten + Playwright-E2E im
echten Browser + drei adversariale Korrektheits-Audits der *verkauften* Kernlogik (Fokus:
still-falsche Ergebnisse, nicht Feature-Lücken).

> **Gesamturteil:** Die **Kernrechnung beider Produkte ist korrekt und breit getestet** –
> Fristen/Fälligkeiten, Fachkunde, Pflicht-/Quotenstatus, Schulungs-Bewertung, Zertifikats-
> Gültigkeit, DATEV-Buchung, Führerschein-Status, Mandantentrennung. Die früher
> dokumentierten Bugs (Loop 23, Fleet-Bericht 5, dashboard-kit 10) sind im HEAD **behoben**.
> Der Audit hat **5 neue, bisher undokumentierte Korrektheits-Bugs** gefunden – alle in
> **abgeleiteten Anzeigen / Randfällen**, nicht in der Kernlogik. Alle 5 sind klein und
> fixbar. Kein Befund ist ein „Grundproblem", aber vier davon zeigen einem Kunden in
> bestimmten Fällen etwas Falsches und sollten vor breitem Produktivbetrieb geschlossen werden.

## Mess-Evidenz

| Prüfung | traqto-loop (audit) | traqto-fleet |
|---|---|---|
| Production-Build | ✅ Exit 0 | ✅ Exit 0 (+ Offline-Build + PWA) |
| Typecheck | ✅ `tsc -b` | ✅ `tsc -b` (mit Vendor-Submodul) |
| Unit/Integration (Vitest) | ✅ 1753 grün / 1 Skip | ✅ 1113 grün |
| E2E (Playwright, echtes Chromium) | siehe VERIFIKATION-Doc | siehe VERIFIKATION-Doc |

---

## Die 5 neuen Befunde

### N-1 · Schulungstest ohne „bereits bestanden"-Sperre → Duplikat-Zertifikat / stille Rückstufung
**Repo/Datei:** traqto-loop · `src/views/SchulungTestRunnerPage.tsx:86-87, 89-96, 111-192` ·
**Schwere: Mittel** · **selbst am Code verifiziert ✅**

`limitErreicht` schließt `status !== 'bestanden'` aus, `starten()` hat keine Statusprüfung.
Öffnet ein Mitarbeiter einen **bereits bestandenen** Test erneut und macht ihn nochmal:
- besteht wieder → `erstelleKursZertifikat` (nicht idempotent) erzeugt ein **zweites Zertifikat**
  (PDF, Teilnehmer-Mail, öffentliche Verify-Zeile);
- fällt durch → Status wird auf `nicht_bestanden` **zurückgestuft**, `letzter_score`/`abgeschlossen_am`
  überschrieben; bei gesetztem Versuchslimit bleibt die Person **dauerhaft gesperrt**, obwohl sie bestanden hatte.

Der Kenntnisnahme-Pfad hat diese Sperre bereits (S-7); nur der Test-Pfad nicht.
**Fix:** In der Intro bei `zuweisung.status === 'bestanden'` einen „bereits abgeschlossen"-Zustand
zeigen und `starten()`/`abgeben()` als No-op absichern (spiegelt S-7).

### D-1 · Cockpit-KPI „Beauftragung" zeigt falsches Grün bei pro-Standort-Pflichten
**Repo/Datei:** traqto-loop · `src/views/PflichtenCockpitPage.tsx:676`,
`src/features/personen/pflichtenStatus.ts:226-236` (Feld `ist` betriebsweit statt `effektivIst`),
`src/features/compliance/warnings.ts:199` · **Schwere: Mittel (sicherheitsrelevant)**

Für **pro-Arbeitsstätte-Pflichten** (Brandschutzhelfer/Ersthelfer) in Mehr-Standort-Betrieben:
Sind alle Helfer an Standort A und Standort B unbesetzt, zeigt die **Cockpit-Kachel**
„vollständig besetzt" (grün), obwohl ein Standort leer ist. Immer *fail-open* (nie fälschlich rot).
Die eigentliche **Pflicht-Ampel** (Banner/Assessment) ist **korrekt** rot – nur die abgeleitete
Leitungs-KPI rechnet betriebsweit statt standortscharf.
**Fix:** `effektivIst` im `PflichtStatus` exponieren und in Cockpit/`warnings.ts` statt `p.ist` nutzen.

### F-1 · Team-Wochenplaner um einen Tag verschoben (Zeitzone)
**Repo/Datei:** traqto-fleet · `src/views/maintenance/MaintenanceTeamView.tsx:46-48, 58-59, 275`
· **Schwere: Mittel**

`isoDate()` = `toISOString().slice(0,10)` auf **lokal** gebaute Mitternacht liefert in Europe/Berlin
den **Vortag**. Folge: die als „Mo 20.07." beschriftete Spalte umfasst tatsächlich So–Sa; ein
**Sonntags-Termin** landet in der falschen Woche. In Berlin dauerhaft, kein Test deckt es ab.
**Fix:** durchgängig `localIsoDate()` statt `toISOString()`.

### F-2 · Gantt markiert „überfällig" einen Tag zu spät
**Repo/Datei:** traqto-fleet · `src/views/maintenance/MaintenanceGanttView.tsx:43-44, 360-363`
· **Schwere: Niedrig–Mittel**

Gleiche Zeitzonen-Wurzel: ein **gestern** fälliger, offener Termin wird **nicht** überfällig
eingefärbt (erst ab 2 Tagen Verzug), während die „Heute"-Linie korrekt sitzt → sichtbare Inkonsistenz.
**Fix:** dieselbe `localIsoDate()`-Korrektur.

### F-3 · Maschinen-Wizard: Monatsende-Überlauf bei Prüf-/HU-Fälligkeit
**Repo/Datei:** traqto-fleet · `src/components/MachineWizard.tsx:736-740` (`addMonthsIso`) ·
**Schwere: Mittel** · **selbst am Code verifiziert ✅**

Naive Monatsaddition `new Date(dateStr).setMonth(+months)` **ohne** Monatsende-Klemme:
31.01. + 1 Monat → **03.03.** statt 28.02.; 29.02.2024 + 12 Monate → 01.03.2025 statt 28.02.
Bei Anlage einer Maschine mit Anker am Monatsletzten (TÜV/UVV/Erstzulassung) landet die
gesetzlich relevante Prüf-Fälligkeit 1–3 Tage zu spät im falschen Monat. Der korrekte Helfer
`calculateNextDate`/`addMonthsClamped` existiert, wird hier aber nicht genutzt.
**Fix:** `calculateNextDate()` aus `inspectionUtils.ts` verwenden.

---

## Was ausdrücklich korrekt ist (Auszug, gegen Code + grüne Tests geprüft)
- **Loop Kern-Engine** `pflichtenStatus.ts`: Trigger-Auswertung, Schwellen, standortscharfes
  `effektivIst`-Capping, Ausschluss Ausgeschiedener, Bestellungs-Veto – korrekt, breit getestet.
- **Loop Schulung:** Auto-Bewertung/Bestehensgrenze, S-1-Leer-Korrekt-Guard, Zertifikats-
  Gültigkeit (`addMonthsClamped`, Schaltjahr), Reconcile-Guards, Lösungsschlüssel-Schutz (0054/0055).
- **Loop Personen:** Fachkunde `setMonth(+24)` + NaN-Guard, `profilReview` Kalendermonate,
  `beauftragenGate` (ausgeschieden + abgelaufen), Datumsvalidierung Bestellungsurkunde.
- **Fleet lib:** `dueStatus`, `geschaeftsjahr` (Grenztage/Schaltjahr), `datevExport` (Konten/
  Vorzeichen/BOM), `driverLicense` (alle Grenztage), `terminFollowUp` (DST-fest) – korrekt.

## Empfohlene Priorität
1. **N-1** (Duplikat-Zertifikat / Aussperrung) und **F-3** (gesetzliche Prüffrist zu spät) – zuerst.
2. **D-1** (falsches Grün bei Sicherheits-Beauftragungen) – Leitungskennzahl, sicherheitsrelevant.
3. **F-1/F-2** (Zeitzonen-Anzeige im Wartungsplaner) – zusammen mit einer `localIsoDate()`-Sweep.
