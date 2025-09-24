# Fase 1 – Konsept og prototyping

Dette notatet dokumenterer leveransene i fase 1 slik de er implementert i repoet.

## Prioriterte kjernefunksjoner

1. **Sesongbaserte kampanjer** – definert gjennom konseptkort i `PhaseOne`-dashbordet og skal drive tempojustering gjennom året.
2. **Logistikknettverk** – ruter og noder er prototypet for å gjøre ressursflyt synlig og prioritert.
3. **Adaptive fiender** – heatmap-innsikt og responsregler etablerer grunnlaget for dynamisk trusseljustering.

## UI-overlegg og prototyper

- Tre nøkkellag (`Trusselintensitet`, `Logistikkstatus`, `Befolkningsmoral`) kan klikkes gjennom på `/fase-1` for å validere informasjonsarkitektur.
- Sesongkort og logistikkpaneler gir lav-fidelity interaksjoner som kan testes med teamet uten å påvirke hovedsimulasjonen.

## Teknisk vurdering (konsis)

- **State management:** Nye datamodeller planlagt i global state, med React Query for synkronisering.
- **Dataflyt:** Observer-pattern for sesonghendelser, mellomlagring for logistikkoppdateringer.
- **Nettverk:** Planlagte WebSocket-kanaler for co-op synk, differensielle payloads for heatmap.
- **Integrasjon:** Overlay-lag festes på eksisterende canvas, sesongkort trigges etter `endTurn`.

## Neste steg før Fase 2

- Lage mock-data og hooks i `lib`-laget som speiler strukturene beskrevet i dashbordet.
- Planlegge brukertest av konsepttavlen for å samle feedback før full implementering.
- Opprette Jira/linear-oppgaver basert på punktene i dashbordet for å sikre oppfølging i utviklingsløpet.
