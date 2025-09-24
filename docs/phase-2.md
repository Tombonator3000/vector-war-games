# Fase 2 – Minimum Viable Feature-set

Dette notatet beskriver hva som inngår i fase 2-leveransen og hvordan MVP-simuleringen bygger videre på konseptene fra fase 1.

## Nye leveranser

- **/fase-2-dashbord:** Et operativt grensesnitt hvor man kan steppe gjennom en scriptet hendelsesloop og observere hvordan logistikk, trussel og moral endres.
- **Datagrunnlag:** Sterkt typet datasett (`src/lib/phase-two.ts`) for sesonger, logistikkruter, trusselsfaktorer, operasjoner og protokoller.
- **Simulerings-hook:** `usePhaseTwoSimulation` kalkulerer avledet tilstand (aktuell sesong, aggregert moral/intel/DEFCON, loggnivåer) og tilbyr kontrollmetoder (advance/rewind) til UI-laget.
- **Dokumentasjon:** Denne siden fungerer som kilde for videre utvikling og testing, samt kobler Fase 2 til planlagt Fase 3.

## Simulasjonsflyt

1. **Initialiser base state:** Hooken starter med definerte baseline-verdier (turn 12, DEFCON 4, moral 68, intel 44 og vinter-sesong).
2. **Hendelses-script:** Fire hendelser (`polar-blackout`, `thaw-window`, `sabotage-ambush`, `coalition-lift`) oppdaterer tallene og trigger unlocks/varsler.
3. **Avledede visninger:** UI-komponenter viser løpende logistikkstatus, trusselnivåer, aktive operasjoner og anbefalte tiltak.
4. **Varslingslogg:** Alle varsler som trigges lagres i hooken og rulles ut i panel for etterprøving.

## Neste steg før Fase 3

- Implementer persistens av simulasjonssteget slik at rundevalg beholdes ved navigasjon/refresh.
- Koble hooken til faktiske backend-endepunkt eller WebSocket-feed for sanntidsdata.
- Utvid hendelses-scriptet med branching-logikk og spillerhandlinger for større gjenspillingsverdi.
- Integrer KPI-sporing (moral, logistikk-integritet, defcon) direkte med telemetrilag i hovedapplikasjonen.
