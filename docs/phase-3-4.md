# Fase 3 – Utvidelser og balanse

Denne fasen varer i fire uker og bygger videre på fundamentet fra fase 1 og 2. Fokus ligger på å åpne opp kooperativ spillopplevelse, innføre moralske og politiske variabler, samt levere audiovisuelle tilbakemeldinger som forsterker simulasjonen.

## Kooperativ modus

- **Synkroniseringsmekanismer:**
  - Etabler WebSocket-kanal `co-op-sync` for deling av turdata, kartoppdateringer og hendelseslogg i sanntid.
  - Implementer låsestrategier i klientstate ("optimistic lock" pr. region) slik at to spillere ikke overstyrer samme ressursmodul.
  - Legg inn "turn heartbeat"-meldinger hver 5. sekund for å oppdage bortfall og trigge reconnect.
- **Delte ressurser:**
  - Opprett ressursfond for drivstoff, forsyninger og luftstøtte som begge spillere kan disponere, med kvoter basert på rolle (strateg vs. taktiker).
  - Innfør felles "command queue" hvor planlagte handlinger må bekreftes av begge parter for å utføres i felt.
- **UI-indikatorer:**
  - Statuspanel for spillerroller med synlig ressursbalanse og buff/debuff-effekter.
  - Overlegg med ikonografi som viser hvilke områder som er låst av medspillerens pågående ordre.
  - Notifikasjoner i høyre kolonne som oppsummerer synk-suksess, ventende bekreftelser og konflikter.

## Moralsystem og politiske hendelser

- **Event-generator:**
  - Modul `moraleEventService` som trekker scenarier fra datasett basert på frontlinje-status, sivile tap og internasjonalt press.
  - Scheduler som injiserer hendelser hvert 3.–5. trekk, med sannsynlighetsvekting per region.
- **Påvirkning på gameplayvariabler:**
  - Moralsk indeks pr. region justerer produksjon, rekruttering og motstandsvilje.
  - Politisk støtte påvirker ressursdrop og diplomatiske buffere (f.eks. forsinkelse i fiendens opptrapping).
  - Negative hendelser kan trigge "policy choice"-dialoger der spillerne må velge kompromiss med ulike konsekvenser.
- **Analyse & logging:**
  - Lag dashboard-panel som viser moraltrend og politisk temperatur over tid.
  - Eksporter hendelseslogg til `analytics/morale.csv` for videre tuning i fase 4.

## Audio og feedback

- **Dynamiske lydspor:**
  - Lag et tre-lags lydsystem (strategisk ro, taktisk spenning, krisesone) styrt av trusselnivå, moral og co-op-synk.
  - Integrer adaptiv lydmotor som crossfader mellom spor basert på heatmap-verdier og hendelsesintensitet.
- **Adviser-kommentarer:**
  - Voicelines trigges når moralscore krysser terskler, når ressurser blir kritisk lave, eller når kooperativ handling lykkes/mislykkes.
  - Tekst- og lydfeedback skal alltid ha referanse til hvilke beslutninger som utløste den (lenke til logg-ID i UI).
- **Tilgjengelighet:**
  - Undertekster og tekstlogg for all adviser-dialog.
  - Separate volumkontroller for musikk, adviser og effekter.

## Leveranser og milepæler

- Uke 1: Backend synkrammeverk og grunnleggende event-generator.
- Uke 2: UI-prototyper for co-op og moralpaneler, samt første versjon av delte ressurser.
- Uke 3: Integrere moral-/politikkdata i gameplay og aktivere adviser-kommentarer.
- Uke 4: Full A/B-test av dynamiske lydspor og stabilitetstest av kooperativ modus.

# Fase 4 – Testing og finpuss

Denne fasen varer i 2–3 uker og fokuserer på kvalitetssikring, balansering og polering før release-kandidat.

## Playtesting-runder

- **Fokusgrupper:** Kjør tre runder med blandede erfaringsnivåer for å validere kompleksitet, forståelighet og tempo.
- **Måleparametere:** Fullføringsgrad, tid pr. tur, kooperativ koordinasjon og respons på moralevents.
- **Rapportering:** Hver runde avsluttes med rapport i Confluence med anbefalte endringer.

## Balansetesting

- **Trusselfrekvens:** Iterativ tuning av fiendens spawn-rate og adaptivitet basert på heatmap-telemetri.
- **Ressursflyt:** Simulerer 1000 auto-kjørte kamper for å justere inflow/outflow i delte ressurser.
- **Belønningsstruktur:** Juster oppdragspoeng og adviser-boosts slik at "snowballing" hindres og comeback-muligheter styrkes.

## Bugfix og polering

- **UI-harmoni:** Standardiser typografi, spacing og ikonbruk i nye kooperativ- og moralelementer.
- **Animasjoner:** Finjuster overgangsanimasjoner på overlays, adviser-panel og ressurspåminnelser.
- **Tilgangsjustering:** Implementer skjermleser-etiketter, høy kontrast-modus og tilpasset gamepad-navigasjon.
- **Performance-optimalisering:** Profilér WebSocket- og lydmotoren for å sikre stabil FPS og lav latency.

## Exit-kriterier

- Alle kritiske bugs (P0/P1) lukket, og stabilitet bekreftet gjennom 24-timers soak-test.
- Balansetest viser <5 % avvik i ressursunderskudd over 100 simuleringer.
- Brukertester rapporterer ≥80 % forståelighet på moralsystem og kooperativ UI.

