# Vollscan-Befunde — verifiziert (Loop & Fleet)

**Datum:** 2026-07-25 · **Methode:** Datei-fuer-Datei-Audit (111 Agenten, 792 Dateien) + adversariale Verifikation jedes critical/high-Fundes gegen Code, spaetere Migrationen und Tests.

## Ergebnis der Verifikation (23 ernste Rohfunde)
- **19 real bestaetigt** (davon 1 bereits als N-1 gemeldet)
- **2 bereits behoben** (Fehlalarm durch isolierte Migrations-Betrachtung): loop `0051` Grader → durch `0054` gefixt; loop `0001` verwaister Tenant → durch `0056` gefixt.
- **2 Fehlalarme**: fleet `migrateDefects.ts` (Dedup vorhanden), fleet `AgrardieselPage` Frist (Analyse unzutreffend).

> Die 47 medium/low-Rohfunde sind **nicht einzeln verifiziert** — als Roh-Triage-Liste im Anhang (`audit-findings.json`).

## Verifizierte reale Funde (nach Schwere)

### [HIGH] traqto-fleet · `supabase/migrations/001_multi_tenancy_and_rls.sql:155`
**SECURITY DEFINER RLS-Helper user_org_ids()/user_has_role() ohne SET search_path -> Cross-Tenant-Bypass ueber pg_temp**

- **Szenario:** Ein authentifizierter Nutzer von Org A legt eine Temp-Tabelle an: CREATE TEMP TABLE memberships(organization_id uuid, user_id uuid); INSERT INTO memberships VALUES ('<org-B-id>', auth.uid()); Da PostgreSQL pg_temp bei Relationen implizit ZUERST durchsucht und diese beiden Funktionen kein search_path pinnen, aufloest 'SELECT organization_id FROM memberships' innerhalb der SECURITY-DEFINER-Funktion auf pg_temp.memberships. user_org_ids() liefert dann die org-B-id. Jede org_select_*-Policy (USING organization_id IN (SELECT user_org_ids())) gibt daraufhin die kompletten Fuhrpark-/Compliance-Daten 
- **Verifikation:** Beide RLS-Helper user_org_ids()/user_has_role() sind SECURITY DEFINER ohne SET search_path und werden in keiner spaeteren Migration gehaertet — realer Defekt, aber ohne DDL-Endpoint in Supabase nicht trivial exploitierbar, daher high statt critical.
- **Fix:** Beiden Funktionen 'SET search_path = public' (bzw. pg_catalog, public) hinzufuegen, analog zu allen Funktionen in 004.

### [HIGH] traqto-fleet · `src/components/CsvImport.tsx:263`
**CSV-Maschinenimport: fehlerhafte Default-Auswahl importiert Fehlerzeilen und verliert gültige Zeilen**

- **Szenario:** CSV mit 3 Datenzeilen: Zeile 2 ohne Name (Fehler, parsed-Index 0), Zeile 3 'Fendt 728' (Index 1), Zeile 4 'Claas Lexion' (Index 2). `machines.filter(errors.length===0).map((_,i)=>i)` liefert [0,1] (Index innerhalb des gefilterten Arrays), gemeint sind aber die Indizes im vollständigen parsed-Array. selected={0,1}. handleImport (Zeile 277) importiert `parsed.filter((_,i)=>selected.has(i))` ohne Fehler-Guard: Index 0 = Fehlerzeile mit leerem Namen wird importiert -> Maschine ohne Namen in den Stammdaten; Index 2 = gültige 'Claas Lexion' ist nicht in {0,1} -> wird stillschweigend gar nicht import
- **Verifikation:** Bestaetigt: CsvImport.tsx:263 (Filter-vor-Map Index-Fehler) + :277 (kein errors-Guard) importieren namenlose Fehlerzeilen und verlieren gueltige Zeilen; die Haertung existiert nur in der Schwester ContainerCsvImport, nicht hier.
- **Fix:** Default-Auswahl auf echte Indizes umstellen: `setSelected(new Set(machines.map((m,i)=>m.errors.length===0?i:-1).filter(i=>i>=0)))`. Zusätzlich handleImport härten wie in ContainerCsvImport: `const toImport = parsed.filter((p,i)=>selected.has(i)&&p.errors.length===0).map(p=>p.data);` Auch der Header-'Alle wählen'-Handler (Zeile 379ff) sollte nur fehlerfreie Indizes setzen.

### [HIGH] traqto-fleet · `src/components/MaintenancePresetDialog.tsx:154`
**applyLibrary verwirft intervalKm — km-basierte Standard-Wartung wird nie fällig**

- **Szenario:** User waehlt im Dialog "Standard-Vorschlaege uebernehmen" einen Wartungstyp mit basis="km" (z.B. km-Intervall wie Inspektion alle 15000 km, in der Library als "alle 15000 km" angezeigt) und klickt "anlegen". Der erzeugte MaintenancePlan bekommt intervalHours=null, intervalDays=null und KEIN intervalKm. In berechneFaelligkeit (serviceLogic.ts) bleibt kmBisFaellig=null, alle Trigger null -> status faellt auf "ok" (Zeile 263). Der Plan zeigt dauerhaft gruen und wird nie faellig -> die km-Wartung wird lautlos nie ausgeloest.
- **Verifikation:** applyLibrary laesst intervalKm weg (nur hours/days gesetzt), obwohl km-Wartungstypen im selben Dialog waehlbar sind — der km-Plan bleibt dauerhaft "ok" und wird nie faellig; real, high.
- **Fix:** Im Plan-Objekt in applyLibrary analog zu applyOcr ergaenzen: intervalKm: t.basis === "km" ? t.defaultInterval : null.

### [HIGH] traqto-fleet · `src/views/InviteClaimPage.tsx:71`
**Auto-Claim-Effekt feuert claimInvite in Endlosschleife bei jedem Claim-Fehler**

- **Szenario:** Ein User ist mit der zur Einladung passenden E-Mail eingeloggt und oeffnet einen /invite/:token-Link, dessen Einladung bereits angenommen/abgelaufen/widerrufen ist (oder ein transienter RPC-Fehler tritt auf). claimInvite liefert {ok:false,...}. Der Effekt ruft im .then setClaiming(false) auf. Da 'claiming' in der Dependency-Liste steht und der Guard (Zeile 72) nur 'claiming' prueft, aber weder claimError noch einen bereits-versucht-Flag, laeuft der Effekt sofort erneut: Guard passiert (claiming=false), E-Mail passt (Mismatch waere schon in Zeile 73 zurueckgekehrt), setClaiming(true) + claimInv
- **Verifikation:** Der Auto-Claim-Effekt loopt bei jedem non-OK claimInvite (abgelaufene/widerrufene/bereits-angenommene Einladung), weil der Guard nur `claiming` prueft und `setClaiming(false)` im Fehlerpfad den Effekt ueber die Dependency erneut ausloest — realer Bug.
- **Fix:** Vor dem Claim auch auf einen bereits gesetzten Fehler bzw. einen bereits erfolgten Versuch pruefen, z.B. Guard erweitern: `if (!token || !user || preview.status !== 'ok' || claiming || claimError) return;` oder einen useRef claimedRef verwenden, der nach dem ersten Versuch gesetzt wird und weitere Aufrufe blockiert.

### [HIGH] traqto-fleet · `supabase/migrations/002_data_tables.sql:261`
**Feld-Maskierung der Kosten-/Preisfelder (Migration 004) durch offene Direkt-SELECT-Policy auf den Basistabellen umgehbar**

- **Szenario:** Ein 'monteur' oder 'mitarbeiter' ohne Permission 'costs.machine.purchase' ruft statt der maskierten RPC read_machines_masked() einfach die Tabelle direkt ab: supabase.from('machines').select('data'). Die org_select_machines-Policy erlaubt SELECT der kompletten data-JSONB fuer jedes Org-Mitglied. Er sieht dadurch kaufpreis/verkaufspreis/leasingrate/kosten_pro_stunde bzw. bei refuellings/fuel_purchases die Preisfelder und bei maintenance_events cost/lohnkosten/materialkosten - genau die Felder, die 004 vor dem Client verbergen soll.
- **Verifikation:** Real: Die Feld-Maskierung aus 004 ist rein opt-in per RPC; direktes SELECT der `data`-JSONB bleibt in 002 und auch in der neuesten RLS-Migration 024 fuer jedes Org-Mitglied offen, ohne REVOKE oder Spaltenschutz — sensible Kosten-/Preisdaten sind trivial abrufbar.
- **Fix:** Direktes SELECT auf machines/refuellings/maintenance_events/fuel_purchases fuer 'authenticated' entziehen (REVOKE) bzw. org_select-Policy dieser Tabellen so einschraenken, dass Lesen nur ueber die maskierten RPCs erfolgt; alternativ die sensiblen Felder in separate, streng gescopte Tabellen auslagern.

### [HIGH] traqto-fleet · `supabase/migrations/013_driver_licenses.sql:43`
**RLS auf driver_licenses ist nur org-scoped statt user-/rollen-scoped -> jeder Mitarbeiter liest fremde Fuehrerschein-PII**

- **Szenario:** Ein normaler Member (role != owner/admin) ruft direkt die PostgREST-API auf: GET /rest/v1/driver_licenses?select=* . Die SELECT-Policy USING (organization_id IN (SELECT user_org_ids())) gibt ihm ALLE Fuehrerschein-Datensaetze der Org zurueck (Name, Fuehrerscheinklassen, Ablaufdaten, memberId aller Kollegen), obwohl er laut Design nur seine eigenen sehen und die Org-weite Sicht nur Admins vorbehalten sein soll.
- **Verifikation:** Real: die SELECT-Policy auf driver_licenses ist im wirksamen Schema durchgehend nur org-scoped (013 + bekraeftigt durch 024), sodass jeder authentifizierte Member ueber die PostgREST-API die Fuehrerschein-PII aller Kollegen lesen kann; kein spaeteres Migrat/Guard behebt das.
- **Fix:** SELECT-Policy einschraenken: entweder auf den Eigentuemer (USING (user_id = auth.uid())) fuer normale Member, plus separate Admin-Policy die role in ('owner','admin') via memberships prueft; oder eine SECURITY-DEFINER-RPC fuer die Admin-Gesamtsicht. Die reine org-scoped Policy ist fuer PII zu weit.

### [HIGH] traqto-fleet · `supabase/migrations/019_fix_memberships_recursion.sql:42`
**memberships Admin-UPDATE/DELETE-Policy ohne owner-Schutz/Rollen-Guard umgeht die 021-RPC-Härtung**

- **Szenario:** Ein eingeladener admin (nicht owner) einer Org ruft direkt PostgREST auf: PATCH /rest/v1/memberships?id=eq.<eigene_membership> mit {"role":"owner"} bzw. PATCH auf die owner-Zeile mit {"role":"mitarbeiter"} oder DELETE der owner-Zeile. Die USING-Bedingung (organization_id IN user_admin_org_ids()) ist fuer den admin erfuellt, es gibt KEINE WITH-CHECK-/Rollenwert-Pruefung und keinen owner-Schutz. Ergebnis: der admin macht sich selbst zum owner bzw. stuft den echten owner zurueck/entfernt ihn -> Owner-Uebernahme bzw. Owner-Lockout, obwohl die Anwendung ueber update_member_role/remove_member (021) 
- **Verifikation:** Die in 019 wirksame memberships-UPDATE/DELETE-Policy hat kein WITH CHECK/owner-Guard und wird von keiner spaeteren Migration korrigiert, sodass ein eingeladener Admin sich per direktem PostgREST-Write selbst zum owner machen bzw. den owner entfernen kann.
- **Fix:** WITH CHECK an der UPDATE-Policy ergaenzen, das (a) den Ziel-role auf ('admin','mitarbeiter','monteur') begrenzt und (b) das Aendern/Loeschen einer Zeile mit role='owner' ausschliesst; analog die DELETE-Policy um NOT (role='owner') erweitern. Alternativ direkte Schreibzugriffe auf memberships per RLS unterbinden und ausschliesslich ueber die gehaerteten RPCs (update_member_role/remove_member) zulas

### [HIGH] traqto-fleet · `supabase/migrations/025_fix_merge_upsert_deletions.sql:48`
**Merge-Upsert-RPCs prüfen Org-Zugehörigkeit der Zielzeile nicht (cross-tenant Datenüberschreibung)**

- **Szenario:** Ein Nutzer ist Mitglied von Org A. Er ruft z.B. upsert_refuelling_merged(p_id = <ID einer Betankung, die zu Org B gehört>, p_org = A, p_data = <eigene Daten>) auf. Der Membership-Check (Zeilen 61-66) prüft nur, dass der Aufrufer Mitglied von p_org=A ist. Der INSERT kollidiert auf (id) mit der Zeile aus Org B, und ON CONFLICT DO UPDATE überschreibt data/updated_at dieser fremden Zeile. organization_id bleibt B, RLS ist per SECURITY DEFINER umgangen. Ergebnis: Kunde B sieht in seiner Betankung/Maschine/Wartung stillschweigend fremde/falsche Werte, ohne dass ein Fehler geworfen wird.
- **Verifikation:** Cross-tenant write is real: the merge-upsert RPCs' ON CONFLICT DO UPDATE lacks any organization_id = p_org guard, so a member of one org can silently overwrite another org's row data given its UUID.
- **Fix:** Im ON CONFLICT DO UPDATE eine WHERE-Klausel ergänzen, die die Org bindet, z.B. `ON CONFLICT (id) DO UPDATE SET data = ..., updated_at = now() WHERE <table>.organization_id = p_org;` — oder vor dem INSERT explizit prüfen, dass eine ggf. existierende Zeile mit p_id zu p_org gehört (RAISE EXCEPTION sonst).

### [HIGH] traqto-loop · `src/components/StoffstromImportDrawer.tsx:52`
**parseMenge zerstoert Dezimal-Mengen aus KI-Import (Punkt als Tausendertrenner) -> 10x/100x zu hohe Stoffstrom-Menge**

- **Szenario:** KI-Parser liefert menge als JS-number (importParser.ts:78-87, importTypes.ts:15 -> number|null). Drawer setzt menge: String(e.menge) (Zeile 159). Fuer 12.5 t zeigt das Review-Feld exakt "12.5"; der Nutzer prueft, aendert nichts und klickt Uebernehmen. Beim Commit (Zeile 202) laeuft parseMenge("12.5"): s.replace(/\./g,'') entfernt ALLE Punkte -> "125" -> parseFloat = 125. 0.75 t -> "075" -> 75. Gespeichert wird 125 bzw. 75 statt 12,5 bzw. 0,75 — Anzeige und gespeicherter Wert weichen still um Faktor 10-100 ab.
- **Verifikation:** Real: die lokale parseMenge im Drawer (StoffstromImportDrawer.tsx:53, genutzt Z.201) strippt alle Punkte und macht aus dem Prefill "12.5" 125 — ein stiller 10-100x-Mengenfehler auf rechtlich relevanten Stoffstrom-Daten; die Fix-Migration auf parseDe erfolgte nur im Parser, nicht im Drawer.
- **Fix:** Zahl als number durchreichen statt String(e.menge)+Reparse, oder parseMenge so bauen, dass ein einzelner Punkt ohne Komma als Dezimalpunkt gilt (Punkte nur entfernen, wenn zusaetzlich ein Komma vorhanden ist). Alternativ Prefill via toLocaleString('de-DE').

### [HIGH] traqto-loop · `src/features/aufgaben/generators/nachweisGenerator.ts:91`
**Fehlende Nachweis-Perioden aus dem Vorjahr werden nie geprüft (Jahresgrenzen-Lücke)**

- **Szenario:** Betrieb mit periodischer Pflicht (z. B. monatliches Betriebstagebuch, EfB). Der Dezember-2025-Nachweis fehlt. In Dezember 2025 erzeugt generateFehlendePerioden noch den Task nachweis_periode:...:2025-12 (fällig 2025-12-31). Am 1.1.2026 liefert expectedPeriods(req.cadence, today.getFullYear()) nur noch Perioden für 2026 — die Periode 2025-12 wird nicht mehr produziert. Der offene 'Dezember 2025 — Nachweis fehlt'-Task wird vom Reaper (dokumentiertes Muster: 'der Reaper verwirft die Aufgabe automatisch') abgeräumt, GENAU wenn das fehlende Monatsdokument überfällig wird. Ebenso: wer im Januar 2026
- **Verifikation:** Bestaetigt: generateFehlendePerioden fragt via expectedPeriods(...today.getFullYear()) nur das laufende Jahr ab, daher fallen Dez-/Q4-/Jahres-Vorjahresperioden an jeder Jahresgrenze still aus der Fehlt-Erkennung und der Reaper verwirft den offenen Task genau bei Ueberfaelligkeit.
- **Fix:** expectedPeriods zusätzlich für das Vorjahr aufrufen und beide Listen zusammenführen (z. B. [...expectedPeriods(cadence, year-1), ...expectedPeriods(cadence, year)]), oder in expectedPeriods einen Rückblick-Parameter ergänzen. Der bestehende monthsAhead>1-Filter begrenzt die Zukunft weiterhin korrekt; monthsAhead darf dann auch stärker negativ sein, was für die zuletzt fällige Vorjahresperiode gewü

### [HIGH] traqto-loop · `src/features/fleet_ingest/translate.ts:118`
**Nicht-UVV-Fahrzeugregime (eichung/awsv/dguv_v3/feuerloescher/rolltore) ueberschreiben letzte_uvv_pruefung und setzen das UVV-Intervall zurueck**

- **Szenario:** Fleet exportiert fuer ein Fahrzeug (loop_target='fahrzeug', kennzeichen gesetzt, passed=true) eine Eichung (regime='eichung', default_intervall 24) oder AwSV-Pruefung (regime='awsv', default 60). In buildAssetPatch trifft der Zweig `else if (resolveRegime(event.regime))` zu (er ist fuer JEDES gemappte Regime truthy, nicht nur die UVV-Familie) und setzt patch.letzte_uvv_pruefung = Pruefdatum sowie patch.uvv_intervall_monate = 24 bzw. 60. fahrzeugGenerator.ts (Zeile 82/88) berechnet die UVV-Frist als addMonthsIso(letzte_uvv_pruefung, uvv_intervall_monate). Eine tatsaechlich ueberfaellige jaehrli
- **Verifikation:** Real: der generische resolveRegime-Zweig in translate.ts:111-119 laesst eichung/awsv/dguv_v3/feuerloescher/rolltore auf einem Fahrzeug letzte_uvv_pruefung ueberschreiben und das UVV-Intervall auf 24/60 Monate setzen, wodurch eine ueberfaellige jaehrliche UVV/DGUV-V70 faelschlich gruen erscheint — im wirksamen Code, parser-erreichbar, ohne Test/Guard.
- **Fix:** In buildAssetPatch den Fahrzeug-UVV-Zweig auf die tatsaechliche UVV-Familie einschraenken statt auf `resolveRegime(...)` generell, z. B. `else if (event.regime === 'uvv' || event.regime === 'kran')` (bzw. eine explizite Allowlist der Regime, die wirklich auf letzte_uvv_pruefung abbilden). Andere gemappte Fahrzeugregime duerfen letzte_uvv_pruefung/uvv_intervall_monate nicht anfassen; ihr Nachweis r

### [HIGH] traqto-loop · `src/features/gefahrstoffe/storage.ts:52`
**CSV-Re-Import: mergeByName matcht nur betrieb_id+bezeichnung, ignoriert standort_id — gleichnamiger Stoff an zwei Standorten kollabiert zu einem Eintrag**

- **Szenario:** Betrieb b1 fuehrt 'Aceton' an Standort 'Werk Ingolstadt' (s1) UND 'Aceton' an 'Werk Nuernberg' (s2) — ein vom Fachmodell ausdruecklich erlaubtes Szenario (derselbe Stoff an mehreren Standorten; siehe Kommentar Z.44-45 + manuelles Anlegen nutzt bewusst mergeByName:false). CSV-Import (csv/schemas.ts:1630 save:(input)=>saveGefahrstoff(input), Default mergeByName=true) mit beiden Zeilen: Zeile Aceton/Ingolstadt legt gst1(s1) an; Zeile Aceton/Nuernberg findet ueber betrieb_id+bezeichnung (Z.52-57, standort_id NICHT im Filter) genau gst1 und ueberschreibt dessen standort_id auf s2 (Z.62 standort_id:
- **Verifikation:** CSV-Re-Import merged gleichnamige Stoffe nur ueber betrieb_id+bezeichnung, ignoriert standort_id, wodurch ein Aceton@Ingolstadt-Eintrag beim Import von Aceton@Nuernberg stillschweigend zu einem einzigen Nuernberg-Datensatz kollabiert — realer Datenverlust im Pflichtverzeichnis.
- **Fix:** Im mergeByName-Zweig (Z.52-57) zusaetzlich g.standort_id===input.standort_id in die find-Bedingung aufnehmen, damit der Upsert-Schluessel standortscharf ist (betrieb_id+standort_id+bezeichnung); alternativ standort_name als Teil des CSV-Upsert-Schluessels dokumentieren.

### [HIGH] traqto-loop · `src/features/tool_users/sessionBootstrap.ts:61`
**Admin-Upgrade beim Login setzt preset='admin', laesst aber die alten (niedrigeren) permissions stehen -> Tenant-Admin bleibt rechtlos / voll gesperrt**

- **Szenario:** Ein Tenant-Owner hat tenant_members.role='admin', sein lokaler tool_users-Eintrag wurde aber frueher mit niedrigerem Preset angelegt (z. B. per Personen-Einladung als 'mitarbeiter' oder 'readonly'). Beim Login matcht ensureSessionToolUser den bestehenden Eintrag und ruft saveToolUser({ ...existing, preset: 'admin' }). saveToolUser (storage.ts:52-54) uebernimmt permissions nur neu (applyPreset), wenn input.permissions KEIN Array ist; existing traegt aber immer ein permissions-Array (jeder gespeicherte Tool-User hat eins, migrateLegacy garantiert es). Ergebnis: preset='admin', aber permissions =
- **Verifikation:** Real: Admin-Upgrade beim Login setzt nur preset='admin', lässt das alte permissions-Array stehen, sodass der Tenant-Admin lokal unter-privilegiert bzw. bei ex-readonly komplett schreibgesperrt bleibt.
- **Fix:** Beim Upgrade Permissions mitziehen: saveToolUser({ ...existing, preset: 'admin', permissions: applyPreset('admin') }) (applyPreset aus permissions.ts importieren). Alternativ saveToolUser so aendern, dass bei geaendertem preset das permissions-Array neu berechnet wird. Test um Assertion auf hasPermission(matched,'tool_user.verwalten')===true erweitern.

### [HIGH] traqto-loop · `src/features/vorsorge/recordsCloud.ts:189`
**Aenderungen an bestehenden Vorsorge-Datensaetzen synchronisieren nie (sameIdSet vergleicht nur IDs)**

- **Szenario:** Geraet B traegt fuer Person X eine durchgefuehrte Untersuchung ein (untersuchungDurchgefuehrt -> saveVorsorge aktualisiert letzte_untersuchung/updated_at auf der BESTEHENDEN Zeile v1) und pusht das Chiffrat in die Cloud. Geraet A synchronisiert: threeWayMergeById waehlt korrekt die neuere Cloud-Zeile fuer v1 (Test 'bei gleicher id gewinnt der neuere Datensatz' belegt das). Aber reconcileTable ruft applyRemoteToLocal nur auf, wenn sich die ID-MENGE aendert: `if (!sameIdSet(merged, local))` (Z.189). Da v1 auf beiden Geraeten existiert, ist die ID-Menge identisch -> merged wird NICHT in den lokal
- **Verifikation:** Beide Sync-Guards (recordsCloud.ts:189/194) gaten auf die ID-Menge via sameIdSet, sodass Feldaenderungen an bestehenden Zeilen (z.B. untersuchungDurchgefuehrt) weder gepullt noch gepusht werden und Vorsorge-Faelligkeiten geraeteuebergreifend veralten.
- **Fix:** Statt sameIdSet einen inhaltsbasierten Vergleich verwenden: applyRemoteToLocal aufrufen, wenn merged sich inhaltlich von local unterscheidet (z.B. JSON-Stringify der nach id sortierten Zeilen oder Feld-/Zeitstempelvergleich), und den Push ausloesen, wenn merged sich inhaltlich von remote unterscheidet - nicht nur bei Aenderung der ID-Menge.

### [HIGH] traqto-loop · `src/lib/cloudSync.ts:357`
**Cloud-Merge spiegelt reine Inhalts-/Status-Updates nicht in den lokalen Cache — Gerät zeigt veralteten (falsch-grünen) Zertifikatsstatus**

- **Szenario:** Mandant mit zwei Geräten/Nutzern. Gerät A hat beim Login Zertifikat X als 'aktiv' im lokalen Cache. Danach setzt Gerät B X auf 'abgelaufen' (bzw. 'ausgesetzt'); upsert() vergibt dabei ein neueres updated_at, das in die Cloud gepusht wird. Gerät A editiert anschließend — ohne Reload/Neu-Pull — ein ANDERES Zertifikat Y. Das löst pushToCloud('zertifikate', <lokales Array inkl. stale X='aktiv'>) aus. doUpsert liest den Cloud-Stand (X='abgelaufen'), threeWayMergeById/pickNewer wählt für X korrekt die neuere Remote-Version → merged enthält X='abgelaufen'. Cloud-Update und writeBase(merged) laufen ko
- **Verifikation:** Real: der Mirror-Gate (cloudSync.ts:356-359) vergleicht nur ID-Menge/Länge, nicht Feldwerte, sodass ein reiner Remote-Status-Merge (z.B. Zertifikat 'aktiv'→'abgelaufen') nicht in den lokalen Cache gespiegelt wird und die UI bis zum nächsten Login veralteten, zu-grünen Status zeigt.
- **Fix:** Den Mirror auslösen, sobald sich merged strukturell ODER inhaltlich von value unterscheidet, z. B. Deep-Compare statt ID-Mengen/Länge: if (JSON.stringify(merged) !== JSON.stringify(value)) mirrorMergedLocally(table, merged). So werden auch reine Status-/Feldänderungen aus dem Merge in den lokalen Cache übernommen und das change-Event feuert.

### [HIGH] traqto-loop · `src/views/BeauftragungsZeitleistePage.tsx:58`
**Gantt-Balken zeigt unsignierte 'bestellt'-Bestellungen als gruen/besetzt**

- **Szenario:** Gleiche Datenlage wie oben (status='bestellt', bestellt_am gesetzt). segmenteFuer filtert b.status !== 'vorgesehen' und erzeugt fuer die noch nicht unterschriebene Bestellung ein gruenes 'besetzt'-Segment mit Personennamen. Die Zeitleiste stellt die Stelle also durchgehend als besetzt dar, waehrend Ampel/Card sie als unbesetzt (rot) fuehren -> der Kunde sieht einen gruenen Deckungsbalken fuer einen Zeitraum, in dem die Stelle real unbesetzt ist.
- **Verifikation:** Die Zeitleiste rendert unsignierte 'bestellt'-Bestellungen als gruenen Besetzt-Balken, waehrend die kanonische Regel (status==='aktiv') und damit Ampel/Card die Stelle als unbesetzt fuehren — im wirksamen Code vorhanden, nicht behoben.
- **Fix:** Im Filter b.status !== 'vorgesehen' durch b.status === 'aktiv' ersetzen (bzw. zaehltBestellungAlsBesetzt-analoge Signatur-Pruefung), damit besetzt-Segmente nur fuer wirklich wirksame Bestellungen entstehen.

### [HIGH] traqto-loop · `src/views/SchulungTestRunnerPage.tsx:168` _(bereits gemeldet als N-1)_
**Bestandene Zuweisung wird bei Wiederholung stumm auf 'nicht_bestanden' zurueckgestuft (Zertifikat bleibt bestehen)**

- **Szenario:** Ein Mitarbeiter hat den Test bereits bestanden (zuweisung.status='bestanden', gueltiges Zertifikat). Ueber das Editor-Bulk 'Test (intern)' (bulkTestIntern, Zeile 833) oder die per-Row-Aktionen bei bestandener Zuweisung ohne zertifikat_nachweis_id (Zeile 1153-1165) wird der Runner erneut geoeffnet. Im Test-Modus fehlt jeder Endzustands-Guard: starten()/abgeben() pruefen status nie, und limitErreicht (Zeile 87) ist bei 'bestanden' immer false, also erscheint 'Test starten'. Faellt die Person diesmal durch, setzt abgeben() unbedingt status='nicht_bestanden' (Zeile 168) und feuert SCHULUNG_TEST_NI
- **Verifikation:** Real: eine bereits bestandene Zuweisung kann ueber den Bulk-Button 'Test (intern)' (gewaehlt ist nicht status-gefiltert) erneut in den ungeguardeten Runner geoeffnet und bei Durchfallen still auf 'nicht_bestanden' herabgestuft werden, waehrend das gueltige Zertifikat erhalten bleibt.
- **Fix:** Im Test-Modus eine bereits bestandene Zuweisung als Endzustand behandeln: Intro bei zuweisung.status==='bestanden' analog zur Kenntnisnahme nur Zertifikat/'Bereits bestanden' anzeigen (kein 'Test starten'), und in abgeben() eine bestandene Zuweisung nie auf 'nicht_bestanden' herabstufen (frueh returnen oder Downgrade unterdruecken). Zusaetzlich in einladen()/bulkTestIntern bestandene Zuweisungen a

### [MEDIUM] traqto-loop · `src/features/genehmigungen/storage.ts:183`
**daysToExpiry: Zeitzonen-Off-by-one — Genehmigung am letzten Gueltigkeitstag als 'ueberfaellig' (rot) angezeigt**

- **Szenario:** gueltig_bis = '2026-12-31' (Date-only). Aufruf am 31.12.2026 nachmittags dt. Zeit (z.B. 14:00 CET = 13:00 UTC): new Date('2026-12-31')=2026-12-31T00:00:00Z, Date.now() liegt ~13h danach, Differenz negativ, Math.floor(-0.54)=-1. GenehmigungenPage.tsx:238 rendert daraufhin '1d ueberfaellig' in var(--danger)/rot — obwohl die behoerdliche Genehmigung (BImSchG/KrWG) an diesem Tag rechtlich noch gilt.
- **Verifikation:** Der Off-by-one existiert in genehmigungen/storage.ts:183 unverändert (Zertifikat-Fix wurde nicht übernommen) und rendert die Genehmigung am letzten Gültigkeitstag nachmittags fälschlich rot als '1d überfällig' — real, aber nur Anzeige-Fehler in einem Ein-Tages-Fenster, daher medium.
- **Fix:** Implementierung 1:1 aus zertifikate/storage.ts uebernehmen: const ziel=new Date(g.gueltig_bis); if(Number.isNaN(ziel.getTime())) return null; ziel.setUTCHours(0,0,0,0); const heute=new Date(); heute.setUTCHours(0,0,0,0); return Math.round((ziel.getTime()-heute.getTime())/86400000)

### [MEDIUM] traqto-loop · `src/views/BeauftragungsZeitleistePage.tsx:175`
**Org-Snapshot zaehlt unsignierte 'bestellt'-Bestellungen als besetzt -> falsche Audit-Antwort 'wer war zustaendig'**

- **Szenario:** Eine Bestellung fuer Anforderung X hat status='bestellt' (Urkunde erstellt, signatur_status='pending_papier'), bestellt_am=2026-01-10, kein abberufen_am/gueltig_bis. Card-View/Ampel/Cockpit fuehren die Stelle korrekt als UNBESETZT/rot (zaehltBestellungAlsBesetzt verlangt status==='aktiv'). Der Org-Snapshot zum Stichtag findet die Bestellung aber ueber die Bedingung x.status !== 'vorgesehen' und nennt die Person als am Stichtag 'zustaendig'. Die EfB-Ueberwachungsfrage 'wer war am ... zustaendig?' wird damit mit einer Person beantwortet, obwohl die Stelle rechtlich/laut Produktregel unbesetzt wa
- **Verifikation:** Real: Der Org-Snapshot (Audit-Ansicht) laesst unsignierte 'bestellt'-Bestellungen durch (status !== 'vorgesehen') und widerspricht damit der Produktregel status==='aktiv', die Ampel/Card verwenden.
- **Fix:** Bedingung x.status !== 'vorgesehen' durch x.status === 'aktiv' ersetzen (die stichtagsbezogenen abberufen_am/gueltig_bis-Pruefungen bleiben, da sie historisch statt 'heute' bewerten).
