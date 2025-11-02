# Interaktivt Forhandlingssystem - Oppsummering

**Dato**: 2025-11-02
**Status**: Planlegging Fullført

---

## SAMMENDRAG

Dette prosjektet vil transformere diplomati-systemet i Vector War Games fra et enkelt forslag/svar-system til en interaktiv, dynamisk forhandlingsopplevelse inspirert av Civilization-serien.

---

## HOVEDMÅL

### 1. Multi-Item Forhandlinger
**Problem**: For øyeblikket kan spilleren bare sende én type forslag om gangen (alliance, truce, etc.)

**Løsning**: Nytt system der spilleren kan kombinere flere items i én forhandling:
- "Jeg gir deg 500 gull + open borders, og du gir meg military alliance"
- Komplekse deals med flere elementer på hver side

### 2. AI Counter-Offers
**Problem**: AI kan bare si JA eller NEI, ingen frem-og-tilbake.

**Løsning**: AI kan nå:
- Foreslå endringer: "Legg til non-aggression pact så aksepterer jeg"
- Gi tydelig feedback på hvorfor de avviser
- Komme med alternative forslag

### 3. Proaktiv AI Diplomati
**Problem**: AI reagerer bare på spillerens handlinger.

**Løsning**: AI kan nå initiere forhandlinger:
- "Jeg trenger din hjelp mot Nation X"
- "La oss inngå en allianse"
- "Du må kompensere meg for dine handlinger"

### 4. Leder-Personligheter og Agendaer
**Problem**: AI føles like, ingen unikhet.

**Løsning**: Agenda-system som gir hver leder:
- 1 primary agenda (alltid synlig): "Anti-Nuclear", "Warmonger Hater", etc.
- 1 hidden agenda (avsløres over tid): "Expansionist", "Resource Hungry", etc.
- Agendaer påvirker alle diplomatiske beslutninger

### 5. Leader Contact Interface
**Problem**: Ingen dedikert måte å "møte" en leder.

**Løsning**: Nytt modal-vindu for å kontakte ledere:
- Se leder-info, relationship, trust, favors
- Se kjente agendaer og preferanser
- Starte forhandlinger eller gjøre requests
- Se historikk av interaksjoner

---

## TEKNISK ARKITEKTUR

### Nye Komponenter

**1. Type Definitions** (`src/types/negotiation.ts`)
- `NegotiableItem`: Items som kan forhandles (gold, alliance, treaty, etc.)
- `NegotiationState`: State for en pågående forhandling
- `AIEvaluation`: AI's evaluering av et tilbud
- `Agenda`: Leder-personlighetsagenda

**2. Core Logic** (`src/lib/negotiationUtils.ts`)
- `createNegotiation()`: Start ny forhandling
- `calculateItemValue()`: Beregn verdi av items
- `validateNegotiation()`: Sjekk om deal er valid
- `applyNegotiationDeal()`: Gjennomfør avtale

**3. AI Evaluator** (`src/lib/aiNegotiationEvaluator.ts`)
- `evaluateNegotiation()`: AI evaluerer tilbud
- `generateCounterOffer()`: AI lager motforslag
- `aiConsiderInitiatingNegotiation()`: AI bestemmer om den skal initiere

**4. Agenda System** (`src/lib/agendaSystem.ts`)
- `assignAgendas()`: Gi AI-ledere agendaer
- `checkAgendaViolations()`: Sjekk om spiller bryter agendaer
- `calculateAgendaModifier()`: Påvirkning på relationship

**5. UI Components**
- `LeaderContactModal.tsx`: Hovedinterface for å kontakte leder
- `NegotiationInterface.tsx`: Interaktiv forhandling
- `ItemPicker.tsx`: Velge items å tilby/be om
- `AINegotiationNotification.tsx`: Notifikasjon for AI-initiert diplomati

### Evaluerings-Algoritme

AI evaluerer tilbud basert på:
1. **Value**: Verdi av items tilbudt vs. forespurt
2. **Relationship**: Bedre forhold = lettere å få deals
3. **Trust**: Høyere trust = større sannsynlighet for aksept
4. **Favors**: Favors owed gir bonus
5. **Personality**: AI-type påvirker (aggressive, defensive, etc.)
6. **Agendas**: Brudd på agendaer gir straff
7. **Strategic Value**: Kontekst-avhengig verdi
8. **Random Factor**: Litt uforutsigbarhet

**Final Score** → Acceptance Probability (0-100%)

---

## IMPLEMENTASJONS-FASER

### Fase 1: Grunnleggende Engine (1-2 uker)
- Definer TypeScript-typer
- Implementer negotiationUtils.ts
- Implementer aiNegotiationEvaluator.ts
- Skriv unit tests
- Integrer med eksisterende AI system

**Suksesskriterier**: AI kan evaluere multi-item deals korrekt

### Fase 2: UI Komponenter (2-3 uker)
- Implementer LeaderContactModal
- Implementer NegotiationInterface
- Implementer ItemPicker
- Integrer med Index.tsx
- Legg til click handlers på world map

**Suksesskriterier**: Spilleren kan forhandle via UI

### Fase 3: AI Proaktiv Diplomati (1-2 uker)
- Implementer AI negotiation triggers
- Implementer AI negotiation content generator
- Implementer notification system
- Implementer diplomatic inbox

**Suksesskriterier**: AI kontakter spilleren proaktivt med meningsfulle tilbud

### Fase 4: Agenda-System (1-2 uker)
- Definer alle agendaer (6+ primary, 6+ hidden)
- Implementer agenda assignment ved game start
- Implementer agenda revelation system
- Integrer agendaer i AI evaluation
- Vise agendaer i UI

**Suksesskriterier**: Hver AI føles unik, agendaer påvirker beslutninger

### Fase 5: Polishing & Balancing (1-2 uker)
- Balance item values
- Tweak AI acceptance thresholds
- Forbedre feedback messages
- Legg til animations (optional)
- Comprehensive testing
- Dokumentasjon

**Suksesskriterier**: Systemet føles polished, balanced, og intuitiv

---

## ESTIMERT TIDSRAMME

**Total**: 6-10 uker (en utvikler, full-time)

**MVP** (Minimum Viable Product): Fase 1 + Fase 2 = 3-5 uker
- Basic multi-item negotiations fungerer
- UI lar spilleren forhandle
- AI kan akseptere/avvise med feedback

**Full Release**: Alle 5 faser = 6-10 uker
- AI initierer proaktivt
- Agendaer gir dybde
- Polished og balanced

---

## HVA SYSTEMET BYGGER PÅ

Det eksisterende diplomati-systemet er allerede sofistikert:

### Eksisterende Systemer som Utvides
1. **Proposal System**: Utvides til multi-item negotiations
2. **AI Evaluator**: Utvides til å håndtere komplekse deals
3. **Trust & Favors**: Integreres i negotiation evaluation
4. **Grievances**: Påvirker AI's villighet til å forhandle
5. **Specialized Alliances**: Kan nå forhandles som del av deals
6. **Diplomatic Influence (DIP)**: Kan brukes i forhandlinger

### Nye Systemer
1. **Multi-Item Negotiations**: Helt nytt
2. **Counter-Offers**: Helt nytt
3. **AI-Initiated Negotiations**: Helt nytt
4. **Agenda System**: Helt nytt
5. **Leader Contact Interface**: Helt nytt

---

## NØKKEL-FUNKSJONER

### For Spilleren
✅ Kontakt enhver leder når som helst
✅ Bygg komplekse deals med flere items
✅ Se real-time feedback på deal-balance
✅ Få tydelig forklaring når AI avviser
✅ Motta counter-offers og juster tilbud
✅ Lær AI-lederes personligheter og agendaer
✅ Motta proaktive tilbud fra AI

### For AI
✅ Evaluere komplekse multi-item deals
✅ Generere meningsfulle counter-offers
✅ Initiere forhandlinger basert på situation
✅ Ha unike personligheter via agendaer
✅ Gi konstruktiv feedback til spilleren

---

## EKSEMPEL-SCENARIO

### Før (Gammelt System)
**Spiller**: *Sender alliance proposal*
**AI**: "Rejected. Relationship too low."
**Spiller**: *Prøver igjen med gull først... rejected... prøver noe annet...*

### Etter (Nytt System)
**Spiller**: *Klikker på Nation A → "Contact Leader"*

**Modal viser**:
- Nation A: Relationship +15 (Neutral)
- Trust: 55/100
- Known Agenda: "Loyal Friend" (values alliances)

**Spiller**: *Starter negotiation*

**Spiller tilbyr**:
- 500 Gold
- Open Borders (10 turns)

**Spiller ber om**:
- Military Alliance

**AI Response**: "Not quite enough. This alliance is very valuable to me. Add a Non-Aggression Pact (5 turns) and we have a deal."

**Spiller**: *Legger til Non-Aggression Pact*

**AI Response**: "I accept. We are now allies." ✅

---

## DOKUMENTASJON

### For Utviklere
📄 `docs/DIPLOMACY_NEGOTIATION_SYSTEM_RESEARCH.md`
   - Komplett forskningsrapport
   - Civilization-analyse
   - Eksisterende system-oversikt
   - Gap-analyse
   - Foreslått løsning

📄 `docs/DIPLOMACY_NEGOTIATION_IMPLEMENTATION_PLAN.md`
   - Detaljerte oppgaver for hver fase
   - Akseptanskriterier
   - Estimert tid per oppgave
   - Test cases
   - Dependencies

📄 Dette dokumentet (`NEGOTIATION_SYSTEM_SUMMARY.md`)
   - Høynivå oversikt
   - Mål og motivasjon
   - Arkitektur-oversikt

---

## NESTE STEG

1. ✅ Forskning gjennomført
2. ✅ Plan laget
3. ✅ Dokumentasjon skrevet
4. ⏭️ **Review med team/stakeholders**
5. ⏭️ **Prioriter faser** (bestem om MVP eller full release)
6. ⏭️ **Set opp project tracking** (GitHub Projects)
7. ⏭️ **Start implementering** (Oppgave 1.1: Type definitions)

---

## KONTAKT

For spørsmål eller feedback, kontakt prosjektets maintainers.

**Last Updated**: 2025-11-02
**Status**: Klar for review og godkjenning
