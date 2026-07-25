# Triage — medium/low-Rohfunde (Vollscan)

**Stand:** 2026-07-25 · 47 Funde (medium/low), NICHT einzeln verifiziert.

Sortiert nach Prioritaet. `verified`/`likely` = Agenten-Selbsteinschaetzung am Code; 
vor einem Fix jeweils wie bei den high-Funden kurz gegenpruefen.

## MEDIUM (28)

| Conf | Repo | Datei:Zeile | Titel |
|---|---|---|---|
| verified | fleet | `MachineWizard.tsx:736` | addMonthsIso beim Prüfungs-Seeding ohne Monatsende-Klemme -> Frist um Tage in die Zukunft verschoben |
| verified | fleet | `inspectionMatrix.ts:164` | AU (Abgasuntersuchung) wird an HU gekoppelt und faelschlich fuer motorlose Anhaenger als Pflicht vorgeschlagen |
| verified | fleet | `useAnalyticsData.ts:144` | Vorjahresvergleich paart Monate per Array-Index statt per Kalendermonat -> falsche Vergleichswerte bei luckenh |
| verified | fleet | `agrardieselCsv.ts:73` | CSV-Tankvorgang-Export wendet die PKW/LKW-Ausschlussregel (K3) NICHT an — CSV weist Erstattung fuer nicht begu |
| verified | fleet | `AppShell.tsx:236` | Wartungs-/Reparatur-Badge wird an nicht existierenden Nav-Pfad "/service" gehängt und dadurch nie angezeigt |
| verified | fleet | `AnalyticsPage.tsx:1594` | Maschinen-Vergleich unterzaehlt Arbeitsstunden (Vorfenster-Basis ist toter Code) |
| verified | fleet | `InspectionsPage.tsx:376` | KPI-Kacheln/Filter-Chips zaehlen Pruefungen archivierter Maschinen mit — Tabelle nicht (M13 verletzt) |
| verified | fleet | `widgets.tsx:296` | WartungProMaschineChart zählt Fremdleistung bei Werkstatt-Events mit Kostenpositionen doppelt |
| verified | fleet | `widgets.tsx:333` | WartungMonatlichChart (und YTD-Sparkline) ignorieren Kostenpositionen -> Kosten-Unterzählung |
| verified | fleet | `MaintenanceBoardView.tsx:262` | Bulk-Verschiebung verliert einen Tag ueber die Sommerzeit-Umstellung (DST off-by-one) |
| verified | fleet | `MaintenanceGanttView.tsx:363` | Ueberfaellig-Markierung um einen Tag verschoben: isoDay(today) via toISOString() liefert in DE-Zeitzone den Vo |
| verified | fleet | `MaintenanceTeamView.tsx:47` | Wochenraster der Team-Auslastung um einen Tag verschoben (toISOString auf lokale Mitternacht) |
| verified | fleet | `DriverLicenseDialog.tsx:113` | checkedBy wird bei jeder Bearbeitung auf den aktuellen Editor ueberschrieben, nicht nur bei tatsaechlicher Kon |
| verified | fleet | `010_notifications_schema.sql:350` | notify_effective_pref: SECURITY DEFINER an authenticated ohne Identitaets-/Org-Pruefung -> Cross-User/Cross-Or |
| verified | fleet | `019_fix_memberships_recursion.sql:23` | user_admin_org_ids() ist SECURITY DEFINER ohne gepinnten search_path |
| verified | loop | `pathwaySelector.ts:76` | Transportdistanz > 10000 km faellt auf die guenstigste Entfernungsklasse (1-500 km) zurueck |
| verified | loop | `AuditorViewPage.tsx:3682` | Erfolgreicher Cloud-Finding-Submit aktualisiert die lokal abgeleitete Findings-Anzeige nicht -> Duplikate |
| verified | loop | `EigeneUntersuchungenPage.tsx:311` | Turnus einer eigenen Untersuchung laesst sich nicht auf 'einmalig' zuruecksetzen |
| verified | loop | `SchulungskatalogPage.tsx:262` | Turnus einer Schulungsart laesst sich nicht auf einmalig zuruecksetzen - recurring bleibt stillschweigend erha |
| likely | fleet | `MachineAnalyticsTab.tsx:206` | Betriebsstunden-KPI ignoriert den Zeitraumfilter (zeigt Lebenslauf-Zaehlerstand statt Periodenwert) |
| likely | fleet | `RefuellingPage.tsx:820` | Gemischt-Betankung mit leerem Split (0/0) wird still ohne Warnung gespeichert und verschluckt Agrardiesel-Lite |
| likely | fleet | `001_multi_tenancy_and_rls.sql:300` | INSERT/UPDATE/DELETE-Policies der Datentabellen ohne Rollenpruefung - jeder Nutzer (auch monteur) darf loesche |
| likely | loop | `storage.ts:79` | saveAnlage: AwSV-/Wartungsfelder fallen beim Merge-Update NICHT auf existing zurueck -> stiller Datenverlust d |
| likely | loop | `unitConversion.ts:46` | Feuchtegehalt ohne Ober-/Untergrenze -> negative bzw. absurde t-atro-Menge fliesst still in die Bilanz |
| likely | loop | `erklaerung.ts:177` | GF-unterschriebene Compliance-Erklärung behauptet volle Einhaltung, obwohl Anforderungen unbewertet (offen) si |
| likely | loop | `berechnen.ts:141` | Auditplan 'Letztes Audit (Ist)' ignoriert den Stichtag — bei rückwirkender Bewertung wird ein Audit NACH dem B |
| likely | loop | `serverMirror.ts:68` | Server-Spiegel-Watermark laesst nachtraeglich gemergte aeltere Events dauerhaft aus (stille Luecke in der revi |
| likely | loop | `BeauftragungsZeitleistePage.tsx:83` | segmenteFuer: Cursor laeuft bei ueberlappenden Bestellungen zurueck -> falsche Luecke ueber besetzten Zeitraum |

## LOW (19)

| Conf | Repo | Datei:Zeile | Titel |
|---|---|---|---|
| verified | fleet | `analyticsCalc.ts:38` | Monatsende-Ueberlauf im 6-Monats-Zeitfenster (new Date(y, m-6, d) ohne Tagesklemme) |
| verified | fleet | `ContainersPage.tsx:290` | UVV-Pruefdatum wird per UTC (toISOString) statt lokal vorbelegt — Off-by-one um Mitternacht |
| verified | loop | `TimelineStrip.tsx:46` | Zeitzonen-Off-by-one: heute fällige Events fallen von der Zeitlinie |
| verified | loop | `TimelineGantt.tsx:55` | Zeitzonen-Off-by-one: heute fällige Events fehlen in der Gantt-Bahn |
| verified | loop | `reviewGenerator.ts:52` | Review-Frist im Nie-reviewed-Zweig nutzt rohes setMonth ohne Monatsend-Klemmung |
| verified | loop | `storage.ts:858` | Nachhaltigkeitsquote (sustainableStockRatio) ungeklemmt -> KPI kann >100 % / negativ anzeigen |
| verified | loop | `storage.ts:50` | Norm-Update direkt als 'in_kraft' angelegt erzeugt falsches Trail-Event (ANGEKUENDIGT statt IN_KRAFT) |
| verified | loop | `storage.ts):241` | fachkundeStatus nutzt setMonth(+24) ohne Monatsend-Klemme (Schaltjahr Feb 29) |
| verified | loop | `calculator.ts:306` | Überwachungsaudit-Frist rechnet mit 30-Tage-Monaten statt Kalendermonaten |
| verified | loop | `AuditDetailPage.tsx:483` | Zertifikat-Restlaufzeit: Zeitzonen-Off-by-one zeigt gueltiges Zertifikat am letzten Gueltigkeitstag als 'abgel |
| verified | loop | `DokumenteGeneratorPage.tsx:575` | Unterschriften-Frist per toISOString (UTC) berechnet -> Off-by-one-Tag ostlich von UTC |
| likely | fleet | `smartInsights.ts:180` | L/h-Vergleich zählt die Liter der ersten Tankung mit, obwohl das Std-Fenster erst ab ihr läuft (Verbrauch syst |
| likely | fleet | `InspectionsPage.tsx:256` | Direkt-Upload fabriziert bei offener Pruefung einen 'bestanden'-Historieneintrag |
| likely | fleet | `018_signature_request_tokens.sql:127` | submit_signature UPDATE ohne status-Guard -> last-writer-wins bei gleichzeitiger Doppel-Signatur |
| likely | loop | `zellStatus.ts:34` | Ueberfaellige Schulung wird bis zu ~12h nach Ablauf gelb statt rot angezeigt (Math.round-Grenze) |
| likely | loop | `storage.ts:90` | earliestExpiry.days off-by-one: raw Date.now() statt date-only-Klemmung (Abweichung von der App-TZ-Konvention) |
| likely | loop | `signatureStorage.ts:162` | revokeSignatureToken kann einen bereits 'signed'-Token still auf 'revoked' herabstufen (fehlender Endzustands- |
| likely | loop | `NormPflichtenVorschau.tsx:70` | Abgelaufenes/geplantes Zertifikat wird in der Pflichten-Vorschau als gruenes '✓ aktiv' angezeigt |
| likely | loop | `SchulungZertifikateArchivPage.tsx:27` | dateDe reintroduziert Zeitzonen-Drift, den formatDateDe gezielt vermeidet |
