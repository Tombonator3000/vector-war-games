# Agenda-System for AI Leder-Personligheter - Oppsummering

**Dato**: 2025-11-02
**Status**: Implementation Ready
**Fase**: Phase 4 av Diplomacy System

---

## SAMMENDRAG

Phase 4 implementerer et **Agenda-System** som gir hver AI leder unique personlighet gjennom:
- **1 Primary Agenda**: Alltid synlig, representerer core values
- **1 Hidden Agenda**: Avsløres over tid, representerer hidden motivations
- **Dynamic Reactions**: AI reagerer på spillerens handlinger basert på agendaer
- **Discovery Mechanic**: Spilleren lærer AI's personlighet over tid

---

## HOVEDMÅL

### 1. Unique AI Personligheter
**Problem**: Alle AI av samme type (f.eks. "aggressive") oppfører seg identisk.

**Løsning**: Hver AI får unique kombinasjon av agendaer:
- 8 Primary Agendas × 8 Hidden Agendas = 64 mulige kombinasjoner
- Samme personality type kan ha helt forskjellige agendaer
- Eksempel: "Aggressive + Anti-Nuclear" vs "Aggressive + Militarist" = to helt forskjellige ledere

### 2. Context-Aware AI Reactions
**Problem**: AI gir generiske avslag uten forklaring.

**Løsning**: AI reagerer på spillerens spesifikke handlinger:
- Bruker nukes → Anti-Nuclear leder blir fiendtlig
- Bygger lang alliance → Loyal Friend gir bonus
- Deler ressurser → Resource Hungry blir vennlig
- Konkret feedback basert på agendaer

### 3. Discovery Progression
**Problem**: All AI-informasjon synlig fra start, ingen learning curve.

**Løsning**: Hidden agendas avsløres gradvis:
- High relationship + trust → Reveal etter 10+ turns
- Long-term contact → Reveal etter 30+ turns
- Alliance → Reveal etter 15+ turns
- Gir spilleren noe å lære og oppdage

### 4. Strategic Depth
**Problem**: Diplomati er shallow, ingen meaningful choices.

**Løsning**: Agendaer skaper trade-offs:
- Bruker nukes for forsvar BUT mister Anti-Nuclear alliance
- Declarer krig for å vinne BUT Warmonger Hater blir fiende
- Bygger militær → Respekt fra Militarist BUT trussel for Peacemonger

---

## AGENDA-TYPER

### Primary Agendas (8 stk - Alltid Synlige)

1. **Nuclear Pacifist** - Hater atomvåpen
2. **Warmonger Hater** - Misliker aggressive nasjoner
3. **Loyal Friend** - Verdsetter lange allianser
4. **Isolationist** - Foretrekker minimal diplomacy
5. **Peacemonger** - Søker fred
6. **Resource Guardian** - Beskytter miljøet
7. **Military Supremacist** - Krever militær dominans
8. **Ideological Purist** - Strong ideological beliefs

### Hidden Agendas (8 stk - Avsløres Over Tid)

1. **Expansionist** - Respekterer territorial expansion
2. **Resource Hungry** - Ønsker ressurser
3. **Tech Enthusiast** - Verdsetter forskning
4. **Militarist** - Respekterer militær styrke
5. **Diplomat** - Verdsetter diplomati
6. **Opportunist** - Flexibel, self-interested
7. **Trade Partner** - Fokus på økonomi
8. **Cultural Preservationist** - Beskytter kultur

---

## HVORDAN DET FUNGERER

### Game Start
```
1. Hver AI får random primary agenda (synlig fra start)
2. Hver AI får random hidden agenda (ikke synlig)
3. Spilleren ser primary agenda i Leader Contact modal
4. Hidden agenda påvirker AI decisions men spilleren vet ikke hvilken
```

### During Game
```
1. AI evaluerer spillerens handlinger mot agendaer
2. Agendaer gir +/- relationship modifiers
3. Agendaer påvirker acceptance av proposals
4. AI gir feedback når agendaer krenkes/respekteres
```

### Over Time
```
1. Systemet sjekker revelation conditions hver turn
2. Når conditions er oppfylt → Hidden agenda avsløres
3. Spilleren får notification
4. Agenda nå synlig i UI
5. Spilleren kan nå strategize basert på begge agendaer
```

### Example Flow
```
Turn 1:
  - First contact with "Russia"
  - Primary: "Military Supremacist"
  - Hidden: ??? (unknown)

Turn 5:
  - Player builds large military
  - Russia: Relationship +10 (Military Supremacist approves)
  - Player notices Russia likes military strength

Turn 15:
  - Player builds alliance with Russia
  - High relationship (35), good trust (65)
  - After 15 turns → Hidden agenda revealed!
  - Russia: "Militarist" (respects military prowess)

Turn 20:
  - Player negotiates with Russia
  - Both agendas give bonuses
  - Much easier to get favorable deals
```

---

## TEKNISK OVERSIKT

### Eksisterende Implementasjon (Allerede Ferdig)

✅ **`src/lib/agendaDefinitions.ts`**:
- 8 primary agendas definert
- 8 hidden agendas definert
- Conditions og modifiers implementert

✅ **`src/lib/agendaSystem.ts`**:
- `assignAgendas()` - Assign agendas til AI
- `checkAgendaViolations()` - Sjekk om spiller bryter agendaer
- `calculateAgendaModifier()` - Beregn relationship impact
- `calculateAgendaNegotiationBonus()` - Beregn negotiation impact
- `shouldRevealHiddenAgenda()` - Sjekk om reveal
- `revealHiddenAgenda()` - Reveal hidden agenda
- `processAgendaRevelations()` - Process all revelations per turn

✅ **`src/types/negotiation.ts`**:
- `Agenda` interface
- `AgendaModifier` interface

### Mangler Implementasjon (Må Gjøres)

⏳ **Game Initialization**:
- Kalle `initializeNationAgendas()` ved game start
- Give alle AI nations agendaer

⏳ **AI Evaluation Integration**:
- Kalle `calculateAgendaNegotiationBonus()` i `evaluateNegotiation()`
- Add agenda feedback til rejection messages

⏳ **Turn Processing**:
- Kalle `processAgendaRevelations()` hver turn
- Show notifications når agendaer avsløres

⏳ **UI Components**:
- Display agendaer i `LeaderContactModal`
- Show violations og bonuses
- Revelation notifications

⏳ **Testing**:
- Unit tests for integration
- Manual testing for UX

---

## PÅVIRKNING PÅ GAMEPLAY

### For Spilleren

**Early Game**:
- Ser kun primary agendas
- Må spekulere på hidden agendas
- Prøver å unngå å krenke kjente agendaer

**Mid Game**:
- Hidden agendas begynner å avsløres
- Bedre forståelse av hver leder
- Kan strategize mer effektivt

**Late Game**:
- Alle agendaer known
- Full forståelse av AI motivations
- Kan leverage agendaer for optimal diplomacy

### For AI

**Consistent Behavior**:
- Agendaer er konstante (ikke random per decision)
- Spilleren kan lære patterns
- Forutsigbar men interessant

**Meaningful Feedback**:
- Ikke bare "Rejected"
- "Rejected: Your use of nuclear weapons violates my Nuclear Pacifist values"
- Spilleren vet nøyaktig hvorfor

**Strategic Relevance**:
- Agendaer faktisk påvirker decisions
- Ikke bare flavor text
- Real impact på relationship og negotiation success

---

## IMPLEMENTASJONS-PLAN

### Timeline: 1-1.5 Uker

**Uke 1 (Integration)**:
- Dag 1: Game initialization integration
- Dag 2: AI evaluation integration
- Dag 3: Turn processing integration
- Dag 4-5: UI components

**Uke 2 (Polish)**:
- Dag 1: Notification system
- Dag 2: Testing
- Dag 3: Documentation og polish

### Kritisk Sti

```
Game Init → AI Evaluation → Turn Processing → UI → Testing
```

Alle må være ferdig før systemet fungerer fullstendig.

---

## SUKSESS-KRITERIER

### Technical Success
- [ ] Hver AI har 2 agendaer (1 primary, 1 hidden)
- [ ] Agendaer påvirker relationship (±15-30)
- [ ] Agendaer påvirker negotiation evaluation (±20-100)
- [ ] Hidden agendas avsløres basert på conditions
- [ ] No crashes, no bugs

### UX Success
- [ ] Spilleren forstår agendaer uten tutorial
- [ ] Agendaer føles relevant og meningsfulle
- [ ] Discovery mechanic er rewarding
- [ ] AI føles mer unique
- [ ] Feedback hjelper spilleren forstå hvorfor AI aksepterer/avviser

### Balance Success
- [ ] Agendaer ikke for sterke (can't ignore them)
- [ ] Agendaer ikke for svake (can ignore them)
- [ ] Revelation timing feels good (ikke for tidlig/sent)
- [ ] Alle agendaer like viable

---

## EKSEMPEL-SCENARIER

### Scenario 1: Gandhi Problem

**Setup**:
- AI: "India" med Anti-Nuclear primary agenda
- Player: Building nukes for defense

**Turn 10**:
- Player builds 5 warheads
- India: Relationship -30
- Feedback: "Your nuclear buildup is unacceptable to us"

**Turn 15**:
- Player proposes alliance
- AI evaluation: -100 bonus (Anti-Nuclear violation)
- Rejected: "We cannot ally with a nation that threatens nuclear war"

**Player Choice**:
- Option A: Dismantle nukes → Alliance possible
- Option B: Keep nukes → No alliance with India
- Option C: Find different allies who don't care

### Scenario 2: Loyal Friend Discovery

**Setup**:
- AI: "France" med Loyal Friend primary, Diplomat hidden
- Player: Builds alliance early

**Turn 1-10**:
- Alliance formed (Turn 1)
- Good relationship (30)

**Turn 30**:
- Alliance has lasted 30 turns
- Loyal Friend bonus: +25 relationship
- Hidden agenda revealed: Diplomat
- Now player knows France values trust AND loyalty

**Turn 35**:
- Player negotiates trade
- Bonus from Loyal Friend (+60 evaluation)
- Bonus from Diplomat (+40 trust)
- Much easier to get favorable deals

### Scenario 3: Opportunist Surprise

**Setup**:
- AI: "Venice" med Trade Partner primary, Opportunist hidden
- Player: Economic powerhouse

**Turn 1-20**:
- Venice likes player's production (Trade Partner)
- Relationship good (25)

**Turn 21**:
- Hidden agenda revealed: Opportunist
- "Ah, so they're flexible and self-interested"

**Turn 25**:
- Another AI offers Venice better deal
- Venice breaks alliance with player
- Opportunist doesn't care about loyalty

**Player Learning**:
- "I can't trust Opportunists for long-term alliances"
- "But they're good for short-term deals"

---

## FREMTIDIGE UTVIDELSER (Post-MVP)

### More Agendas
- Legg til 5-10 flere agendaer
- Situational agendas (triggered by events)
- Leader-specific agendas (hvis vi legger til named leaders)

### Agenda Interactions
- Some agendas conflict (Warmonger vs Peacemonger)
- Some agendas synergize (Diplomat + Loyal Friend)

### Player Agendas
- Spilleren kan velge egne agendaer?
- AI reagerer på spillerens agendaer

### Advanced Revelation
- Different revelation methods (espionage, embassy, etc.)
- Partial revelations (hints før full reveal)

### Agenda Events
- Special events triggered by agendas
- "France proposes Loyalty Pact" (Loyal Friend agenda)

---

## DOKUMENTASJON

### For Utviklere
📄 **AGENDA_SYSTEM_RESEARCH.md** - Forskning og design
📄 **AGENDA_SYSTEM_IMPLEMENTATION_PLAN.md** - Detaljert implementasjonsplan
📄 Dette dokumentet - High-level oversikt

### For Spillere
- In-game tooltips
- Leader traits display i UI
- Discovery hints

---

## NESTE STEG

1. ✅ Research complete
2. ✅ Implementation plan complete
3. ✅ Summary complete
4. ⏭️ Create task tracker (AGENDA_TASKS.md)
5. ⏭️ **Start implementation** (Task 4.1: Game Initialization)
6. ⏭️ Test continuously
7. ⏭️ Iterate based on feedback

---

## KONTAKT

For spørsmål eller feedback om agenda-systemet, kontakt prosjektets maintainers.

**Last Updated**: 2025-11-02
**Status**: Klar for implementering
**Estimert Tid**: 1-1.5 uker
