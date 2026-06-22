# Test-Checkliste – loop.traqto.de

**Zweck:** Strukturierte manuelle Test-Checkliste für die Module **„Personen & Pflichten"**
und das **Schulungstool**. Zum Abhaken beim Durchklicken der Live-App.

**Umgebung / Vorbereitung**

| Feld | Wert |
|---|---|
| Getestete URL | https://loop.traqto.de |
| Datum / Tester | __________________ |
| Browser / Version | __________________ |
| Bildschirm / Gerät | Desktop ☐  Tablet ☐  Mobil ☐ |
| Testrolle(n) | Admin ☐  Manager ☐  normaler User ☐  ohne Login ☐ |

**Vor dem Start:** Browser-Konsole öffnen (F12 → „Console" + „Network"). Während des
Tests auf rote Fehler (JS-Errors) und fehlgeschlagene Requests (Status 4xx/5xx) achten
und unten notieren. Tipp: parallel im Inkognito-Fenster mit einer zweiten Rolle testen.

**Legende:** ✅ = funktioniert · ❌ = Bug (unten dokumentieren) · ➖ = nicht testbar/n.z.

---

## A) Allgemein / Querschnitt (für beide Module)

- [ ] Seite lädt ohne Konsolen-Fehler (keine roten Errors in der Console)
- [ ] Keine fehlgeschlagenen Netzwerk-Requests (4xx/5xx) beim Navigieren
- [ ] Navigation/Menü: alle Links führen zur richtigen Seite, kein 404
- [ ] Seite überlebt einen Reload (F5) im jeweiligen Modul ohne Datenverlust/Absturz
- [ ] Zurück-Button des Browsers funktioniert sinnvoll (kein „weißer Bildschirm")
- [ ] Deep-Link: direkte URL einer Detailseite aufrufen → lädt korrekt, kein Crash
- [ ] Berechtigungen: User ohne Rechte sieht die Daten **nicht** (kein direkter URL-Zugriff)
- [ ] Sprache/Texte: keine fehlenden Übersetzungen, keine Platzhalter wie `undefined`/`NaN`
- [ ] Darstellung mobil: keine abgeschnittenen Buttons, Tabellen scrollbar
- [ ] Lange Eingaben (z. B. 500 Zeichen Name) brechen das Layout nicht
- [ ] Sonderzeichen/Umlaute (ä, ö, ü, ß, é, &, „/", Emoji) werden korrekt gespeichert & angezeigt

---

## B) Modul „Personen & Pflichten"

### B1 – Personen: Anlegen
- [ ] Neue Person mit allen Pflichtfeldern anlegen → erscheint sofort in der Liste
- [ ] Anlegen **ohne** Pflichtfelder → klare Fehlermeldung, kein Speichern
- [ ] Ungültige E-Mail (`abc`, `a@b`, leer) → wird abgelehnt mit Hinweis
- [ ] Doppelte Person (gleiche E-Mail/Name) → wird verhindert oder sauber gewarnt
- [ ] Abbrechen im Anlege-Dialog → es wird **nichts** gespeichert
- [ ] Speichern mehrfach schnell klicken → Person wird **nicht doppelt** angelegt
- [ ] Sehr lange Namen / Sonderzeichen → korrekt gespeichert, Liste bleibt lesbar

### B2 – Personen: Bearbeiten & Löschen
- [ ] Person bearbeiten → Änderung wird gespeichert und in der Liste aktualisiert
- [ ] Bearbeiten, dann „Abbrechen" → alter Stand bleibt erhalten
- [ ] Person löschen → Sicherheitsabfrage erscheint
- [ ] Löschen einer Person **mit** zugewiesenen Pflichten/Schulungen → Verhalten korrekt
      (entweder blockiert mit Hinweis oder Verknüpfungen sauber entfernt – keine „Leichen")
- [ ] Nach Löschen: Person verschwindet aus allen Auswahllisten/Zuordnungen
- [ ] Zwei Tabs: Person in Tab A löschen, in Tab B bearbeiten → kein stiller Datenverlust

### B3 – Pflichten: Anlegen & Zuweisen
- [ ] Neue Pflicht anlegen (Titel, Beschreibung, Frist/Fälligkeit, Verantwortliche/r)
- [ ] Pflicht ohne Fälligkeitsdatum → korrektes Verhalten (Pflichtfeld oder „kein Datum")
- [ ] Pflicht einer Person zuweisen → erscheint bei der Person und in der Pflichten-Übersicht
- [ ] Pflicht mehreren Personen zuweisen (falls möglich) → alle korrekt verknüpft
- [ ] Zuweisung wieder entfernen → verschwindet auf beiden Seiten
- [ ] Wiederkehrende Pflicht (z. B. jährlich): nächste Fälligkeit wird korrekt berechnet

### B4 – Pflichten: Fristen & Status (kritisch!)
- [ ] Fälligkeit **heute** → Status korrekt (fällig/heute), nicht fälschlich „überfällig"
- [ ] Fälligkeit **gestern** → Status „überfällig", optische Hervorhebung
- [ ] Fälligkeit **morgen / in 30 Tagen** → Status „anstehend/offen"
- [ ] Pflicht als „erledigt" markieren → Status wechselt, Datum/erledigt-von wird gesetzt
- [ ] Erledigte Pflicht wieder auf „offen" setzen → funktioniert, Status konsistent
- [ ] Zeitzonen/Datum: Frist am Monats-/Jahreswechsel (31.12. → 01.01.) korrekt
- [ ] Schaltjahr: 29.02. als Fälligkeit → keine Verschiebung/Fehler
- [ ] Sortierung nach Fälligkeit → korrekte Reihenfolge (auch leere Datumswerte sinnvoll)
- [ ] Filter „überfällig / offen / erledigt" → zeigt jeweils die richtige Menge
- [ ] Zähler/Badges (z. B. „3 überfällig") stimmen mit der gefilterten Liste überein

### B5 – Personen & Pflichten: Übersicht / Auswertung
- [ ] Übersicht zeigt pro Person die richtige Anzahl offener/überfälliger Pflichten
- [ ] Suche nach Person/Pflicht → liefert passende Treffer, leere Suche = alle
- [ ] Pagination/Scroll bei vielen Einträgen → keine doppelten/fehlenden Zeilen
- [ ] Export (falls vorhanden: PDF/Excel/CSV) → Datei wird erzeugt, Inhalt vollständig
- [ ] Leerzustand (keine Personen/Pflichten) → freundliche Meldung statt leerer/kaputter Seite

---

## C) Schulungstool

### C1 – Schulung anlegen / verwalten
- [ ] Neue Schulung anlegen (Titel, Inhalt/Material, Gültigkeitsdauer, Intervall)
- [ ] Schulung ohne Pflichtfelder → wird abgelehnt mit Hinweis
- [ ] Material/Datei hochladen (falls möglich): zulässige Formate ok, zu große Datei → Fehlerhinweis
- [ ] Schulung bearbeiten → Änderung sichtbar bei bereits zugewiesenen Personen?
      (prüfen, ob bestehende Zuweisungen sinnvoll aktualisiert werden)
- [ ] Schulung löschen/archivieren → Verhalten bei laufenden Zuweisungen korrekt

### C2 – Zuweisung an Personen
- [ ] Schulung einer Person zuweisen → erscheint in deren „offene Schulungen"
- [ ] Schulung mehreren Personen / einer Gruppe zuweisen → alle korrekt erfasst
- [ ] Doppelte Zuweisung derselben Schulung → wird verhindert/zusammengeführt
- [ ] Zuweisung entfernen → verschwindet, bereits erfasster Fortschritt korrekt behandelt
- [ ] Fälligkeit/Frist der Schulung wird pro Person korrekt gesetzt

### C3 – Durchführung & Fortschritt (kritisch!)
- [ ] Schulung starten → Fortschritt beginnt bei 0 %
- [ ] Teilweise durcharbeiten, Seite verlassen, zurückkehren → Fortschritt bleibt erhalten
- [ ] Alle Schritte/Folien abschließen → Fortschritt erreicht **genau 100 %** (nicht 99 %/101 %)
- [ ] Abschluss wird gespeichert (Reload → bleibt „abgeschlossen")
- [ ] Test/Quiz (falls vorhanden): richtige Antworten → bestanden; falsche → nicht bestanden
- [ ] Quiz-Wertung an der Bestehensgrenze (z. B. genau 80 %) → korrekt als bestanden/durchgefallen
- [ ] Wiederholung nach Nichtbestehen möglich, Versuche werden korrekt gezählt
- [ ] Zertifikat/Nachweis (falls vorhanden) wird erst **nach** Abschluss erzeugt, mit korrektem Datum/Namen

### C4 – Gültigkeit, Erinnerungen & Wiederholung (kritisch!)
- [ ] Abgeschlossene Schulung mit Gültigkeit → Ablaufdatum korrekt berechnet (z. B. +12 Monate)
- [ ] Kurz vor Ablauf → Status „läuft ab/Erinnerung", korrekt hervorgehoben
- [ ] Nach Ablauf → Status „abgelaufen/erneut fällig", Person muss erneut absolvieren
- [ ] Wiederkehrende Schulung: nach Abschluss wird **nächste** Fälligkeit korrekt gesetzt
- [ ] Erinnerungs-/Benachrichtigungslogik: keine doppelten oder fehlenden Hinweise
- [ ] Datum am Jahreswechsel / Schaltjahr (siehe B4) auch hier prüfen

### C5 – Auswertung / Reporting
- [ ] Übersicht zeigt pro Person Status (offen / in Bearbeitung / abgeschlossen / abgelaufen)
- [ ] Quote/Statistik (z. B. „80 % abgeschlossen") stimmt mit Einzeldaten überein
- [ ] Filter nach Status/Schulung/Person → korrekte Ergebnismenge
- [ ] Export/Nachweisliste (falls vorhanden) → vollständig und korrekt
- [ ] Leerzustand (keine Schulungen zugewiesen) → saubere Meldung

---

## D) Robustheit & Sicherheit (für beide Module)

- [ ] Eingabe von HTML/Script in Textfeldern (`<script>alert(1)</script>`) → wird **nicht** ausgeführt (kein XSS)
- [ ] Sehr große Zahlen / negative Werte in Zahlenfeldern → sauber abgefangen
- [ ] Netzwerk trennen während Speichern → verständliche Fehlermeldung, kein „halber" Datensatz
- [ ] Session-Timeout / Logout während Bearbeitung → sauberer Redirect zum Login, kein Datenverlust ohne Warnung
- [ ] Zugriff auf fremde Datensätze per manipulierter URL/ID → wird verweigert
- [ ] Mehrfaches schnelles Klicken auf „Speichern"/„Abschließen" → keine Doppel-Einträge

---

## E) Gefundene Bugs – Dokumentation

> Für jeden ❌ einen Eintrag. Screenshot + Konsolen-/Network-Fehler beilegen.

### Bug #1
- **Modul / Bereich:** ☐ Personen & Pflichten  ☐ Schulungstool  ☐ Allgemein
- **Schweregrad:** ☐ kritisch (blockiert)  ☐ hoch  ☐ mittel  ☐ niedrig/kosmetisch
- **Titel (kurz):** ____________________________________________
- **Schritte zur Reproduktion:**
  1. ____________________________________________
  2. ____________________________________________
  3. ____________________________________________
- **Erwartetes Verhalten:** ____________________________________________
- **Tatsächliches Verhalten:** ____________________________________________
- **Konsole/Network-Fehler:** ____________________________________________
- **Browser/Rolle/URL:** ____________________________________________
- **Screenshot:** ☐ beigefügt

---

### Bug #2
- **Modul / Bereich:** ☐ Personen & Pflichten  ☐ Schulungstool  ☐ Allgemein
- **Schweregrad:** ☐ kritisch  ☐ hoch  ☐ mittel  ☐ niedrig
- **Titel (kurz):** ____________________________________________
- **Schritte zur Reproduktion:**
  1. ____________________________________________
  2. ____________________________________________
  3. ____________________________________________
- **Erwartetes Verhalten:** ____________________________________________
- **Tatsächliches Verhalten:** ____________________________________________
- **Konsole/Network-Fehler:** ____________________________________________
- **Browser/Rolle/URL:** ____________________________________________
- **Screenshot:** ☐ beigefügt

---

_(weitere Bugs nach gleichem Muster ergänzen)_

---

## F) Test-Zusammenfassung

| Bereich | getestet | ✅ | ❌ | Anmerkung |
|---|---|---|---|---|
| A) Allgemein | ☐ | | | |
| B) Personen & Pflichten | ☐ | | | |
| C) Schulungstool | ☐ | | | |
| D) Robustheit/Sicherheit | ☐ | | | |

**Gesamteindruck / Priorität der Fixes:**

____________________________________________________________________

____________________________________________________________________
