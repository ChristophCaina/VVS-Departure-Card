# VVS Departure Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/ChristophCaina/vvs-departure-card.svg)](https://github.com/ChristophCaina/vvs-departure-card/releases)

Custom Lovelace Card für die [VVS Departures Integration](https://github.com/ChristophCaina/vvs_departures).

Zeigt alle Abfahrten einer VVS/EFA-Haltestelle kompakt in einer Karte an — mit Verspätungsanzeige, Echtzeit-Status, Gleisinformation und Störungsmeldungen.

<img width="464" height="424" alt="grafik" src="https://github.com/user-attachments/assets/e667dc25-9725-4ea9-8e8c-a276832715a4" />



## Features

- 🚆 Alle Abfahrten einer Haltestelle auf einen Blick
- 🟢🟠🔴 Farbkodiertes Icon je nach Verspätung (< 3 / 3–9 / ≥ 10 Min)
- ⚠ Störungsmeldungen inline als zweite Zeile
- 🕐 Echtzeit-Kennzeichnung (`~` wenn kein Realtime)
- Gleisnummer rechts
- Tap auf Zeile öffnet More-Info Dialog
- Visueller Editor (kein YAML nötig)
- Folgt dem HA-Theme (light/dark)
- Unavailable Sensoren werden automatisch ausgeblendet

## Voraussetzungen

Diese Card benötigt die [VVS Departures Integration](https://github.com/ChristophCaina/ha-vvs-departures) als Datenquelle.

## Installation via HACS

1. HACS → Frontend → ⋮ → **Benutzerdefinierte Repositories**
2. URL: `https://github.com/ChristophCaina/ha-vvs-departure-card`
3. Kategorie: **Lovelace**
4. **Installieren** → Browser-Cache leeren (Strg+Shift+R)

## Manuelle Installation

1. `vvs-departure-card.js` nach `/config/www/vvs-departure-card/` kopieren
2. Einstellungen → Dashboard → Ressourcen → Hinzufügen:
   ```
   URL:  /local/vvs-departure-card/vvs-departure-card.js
   Typ:  JavaScript-Modul
   ```
3. Browser-Cache leeren

## Konfiguration

### Visueller Editor

Karte hinzufügen → **VVS Departure Card** auswählen → Sensoren, Titel und Optionen im Editor einstellen.

### YAML

```yaml
type: custom:vvs-departure-card
title: Renningen, Renningen       # Optional
max_departures: 4                 # Optional, Standard: alle
show_notices: true                # Störungsmeldungen anzeigen
notice_priorities:                # Welche Prioritäten anzeigen
  - veryHigh
  - high
  - normal
  - low
entities:
  - sensor.renningen_renningen_abfahrt_1
  - sensor.renningen_renningen_abfahrt_2
  - sensor.renningen_renningen_abfahrt_3
  - sensor.renningen_renningen_abfahrt_4
```

### Alternativ: Device ID (automatisch alle Sensoren)

```yaml
type: custom:vvs-departure-card
device_id: abc123def456           # Device ID der Haltestelle
title: Renningen, Renningen
max_departures: 4
```

**Device ID ermitteln:**
Einstellungen → Geräte & Dienste → VVS Departures → Haltestelle → URL enthält die Device ID.

## Farb-Legende

| Farbe | Bedeutung |
|-------|-----------|
| 🟢 Grün | Pünktlich (Verspätung < 3 Min) |
| 🟠 Orange | Leichte Verspätung (3–9 Min) |
| 🔴 Rot | Starke Verspätung (≥ 10 Min) |
| ⚠ Info | Aktive Störungsmeldung |
| `~` | Keine Echtzeit-Daten verfügbar |

## Störungsmeldungen filtern

```yaml
show_notices: true
notice_priorities:
  - veryHigh   # Sehr hoch
  - high       # Hoch
  # - normal   # Normal (auskommentiert = ausgeblendet)
  # - low      # Niedrig
```

## Changelog

### v1.0.0 – Initial Release
- Kompakte Abfahrtstafel für VVS-Haltestellen
- Farbkodiertes Icon nach Verspätung (grün / orange / rot)
- Störungsmeldungen inline mit Prioritätsfilter
- Gleisnummer, Echtzeit-Kennzeichnung
- Visueller Editor mit Entity-Auswahl
- Unavailable Sensoren werden automatisch ausgeblendet

