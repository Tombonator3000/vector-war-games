# Implementasjonsplan: Interaktivt Forhandlingssystem

**Opprettet**: 2025-11-02
**Status**: Planlegging
**Estimert Total Tid**: 8-12 uker

---

## OVERSIKT

Dette dokumentet beskriver den detaljerte implementasjonsplanen for det nye interaktive forhandlingssystemet inspirert av Civilization. Systemet er delt inn i 5 faser med spesifikke oppgaver for hver fase.

---

## FASE 1: GRUNNLEGGENDE NEGOTIATION ENGINE
**Varighet**: 1-2 uker
**Prioritet**: Kritisk (må være ferdig først)

### Oppgave 1.1: Definer TypeScript-typer
**Fil**: `src/types/negotiation.ts`

**Beskrivelse**: Lag alle nødvendige TypeScript interfaces og types for forhandlingssystemet.

**Typer som skal lages**:
```typescript
- NegotiableItemType (union type)
- NegotiableItem (interface)
- NegotiationState (interface)
- NegotiationRound (interface)
- AIEvaluation (interface)
- CounterOffer (interface)
- LeaderContactState (interface)
- LeaderMood (type)
- VisibleLeaderInfo (interface)
- Agenda (interface)
- AgendaModifier (interface)
- DiplomaticAction (interface)
- AIInitiatedNegotiation (interface)
- NegotiationPurpose (type)
```

**Akseptanskriterier**:
- [ ] Alle typer kompilerer uten feil
- [ ] Typene er godt dokumentert med TSDoc comments
- [ ] Typene eksporteres korrekt fra index

**Estimert Tid**: 4-6 timer

---

### Oppgave 1.2: Implementer negotiationUtils.ts
**Fil**: `src/lib/negotiationUtils.ts`

**Beskrivelse**: Implementer core utility-funksjoner for å håndtere forhandlinger.

**Funksjoner som skal implementeres**:
```typescript
✅ createNegotiation()
✅ addItemToOffer()
✅ addItemToRequest()
✅ removeItem()
✅ calculateItemValue()
✅ calculateTotalValue()
✅ validateNegotiation()
✅ canAffordItems()
✅ applyNegotiationDeal()
```

**Item Value Calculations**:
- **Gold**: Direct value (1:1)
- **Intel**: 3x value of gold
- **Production**: 2x value of gold
- **Alliance**: Base value 1000, modified by relationship
- **Treaty**: Base value 300-800 depending on type
- **Promise**: Base value 200-500 depending on type
- **Join War**: Highly variable (500-2000) based on target strength
- **Share Tech**: Variable based on tech value
- **Open Borders**: Base value 200
- **Sanction Lift**: Base value 300
- **Grievance Apology**: Variable based on grievance severity

**Validation Rules**:
- Player must have enough resources to offer
- Items must be valid for current game state
- Cannot request items that target doesn't have
- No duplicate items of same type (unless accumulative like gold)

**Akseptanskriterier**:
- [ ] Alle funksjoner implementert og eksportert
- [ ] Item values beregnes korrekt basert på game state
- [ ] Validering fanger alle edge cases
- [ ] Deal application oppdaterer begge nasjoner korrekt
- [ ] Unit tests passerer (se Oppgave 1.5)

**Estimert Tid**: 1-2 dager

---

### Oppgave 1.3: Implementer aiNegotiationEvaluator.ts
**Fil**: `src/lib/aiNegotiationEvaluator.ts`

**Beskrivelse**: Implementer AI-logikk for å evaluere forhandlinger og generere counter-offers.

**Funksjoner som skal implementeres**:
```typescript
✅ evaluateNegotiation()
✅ generateCounterOffer()
✅ generateNegotiationFeedback()
✅ aiConsiderInitiatingNegotiation()
✅ shouldMakeCounterOffer()
✅ getAIDesiredItems()
✅ getAIOfferableItems()
```

**Evaluering-algoritme**:
```
1. Calculate offer value (sum of items player offers)
2. Calculate request value (sum of items player requests)
3. Net value = offer value - request value
   - Positive = good for AI
   - Negative = bad for AI

4. Apply modifiers:
   - Relationship modifier: -50% to +50% based on relationship
   - Trust modifier: -30% to +30% based on trust
   - Favor modifier: +5% per 10 favors owed to player
   - Personality bias: varies by item type and AI personality
   - Strategic value: context-dependent bonus
   - Grievance penalty: -10% per active grievance
   - Random factor: -10% to +10%

5. Final Score = Net Value + All Modifiers

6. Acceptance Thresholds:
   - Score > 200: 90% acceptance
   - Score > 100: 70% acceptance
   - Score > 0: 50% acceptance
   - Score > -100: 30% acceptance + counter-offer likely
   - Score > -200: 10% acceptance + counter-offer very likely
   - Score < -200: 0% acceptance, flat rejection
```

**Counter-Offer Strategier**:
1. **Add to Player's Offer**: Ber om mer ressurser
2. **Remove from Player's Request**: Tilbyr mindre
3. **Suggest Alternative**: Foreslår andre items av samme verdi
4. **Bundle Deals**: Kombinerer flere small items

**Feedback Messages**:
- Positive: "I'm interested in this proposal"
- Neutral: "This could work with some adjustments"
- Negative: "This is not acceptable to me"
- Very Negative: "This is insulting!"

**AI-Initiated Triggers**:
- Under threat (threat level > 10): Request defensive alliance
- Has excess resources: Offer trade
- Player broke promise/treaty: Demand compensation
- Opportunity for joint war: Propose joint-war pact
- Low relationship but wants improvement: Offer reconciliation deal

**Akseptanskriterier**:
- [ ] Evaluering returnerer logiske scores
- [ ] Counter-offers er meningsfulle og realizable
- [ ] Feedback messages matcher evaluation score
- [ ] AI-initiated negotiations oppstår i passende situasjoner
- [ ] Personality biases fungerer som forventet
- [ ] Integration tests passerer (se Oppgave 1.6)

**Estimert Tid**: 2-3 dager

---

### Oppgave 1.4: Implementer agendaSystem.ts
**Fil**: `src/lib/agendaSystem.ts`

**Beskrivelse**: Implementer agenda-system for å gi AI-ledere unike personligheter.

**Agenda-kategorier**:

**Primary Agendas** (alltid synlige):
1. **Anti-Nuclear**: Hater atomvåpen
2. **Warmonger Hater**: Misliker aggressive nasjoner
3. **Loyal Friend**: Verdsetter lange allianser
4. **Isolationist**: Foretrekker å være alene
5. **Peacemonger**: Ønsker fred
6. **Resource Guardian**: Beskytter naturen

**Hidden Agendas** (avsløres over tid):
1. **Expansionist**: Respekterer territoriell ekspansjon
2. **Resource Hungry**: Vil ha ressurser
3. **Tech Enthusiast**: Verdsetter forskning
4. **Militarist**: Respekterer militær styrke
5. **Diplomat**: Verdsetter diplomati
6. **Opportunist**: Bytter side lett

**Funksjoner**:
```typescript
✅ assignAgendas(nation, rng)
✅ checkAgendaViolations(player, ai, gameState)
✅ calculateAgendaModifier(player, ai, gameState)
✅ shouldRevealHiddenAgenda(relationship, trust, turns)
✅ getAgendaFeedback(player, ai, agenda)
```

**Revelation System**:
- Hidden agenda avsløres når:
  - Relationship > 25 AND 10+ turns of contact
  - OR Embassy established
  - OR 30+ turns of contact

**Akseptanskriterier**:
- [ ] Minst 6 primary + 6 hidden agendas definert
- [ ] Hver AI får én primary + én hidden agenda ved game start
- [ ] Agenda violations detekteres korrekt
- [ ] Modifiers påvirker AI decisions
- [ ] Hidden agendas avsløres over tid
- [ ] Unit tests passerer

**Estimert Tid**: 1-2 dager

---

### Oppgave 1.5: Skriv Unit Tests for negotiationUtils
**Fil**: `src/lib/__tests__/negotiationUtils.test.ts`

**Test Cases**:

```typescript
describe('negotiationUtils', () => {
  describe('createNegotiation', () => {
    it('should create a new negotiation with correct initial state')
    it('should assign unique ID')
  })

  describe('addItemToOffer', () => {
    it('should add item to offer list')
    it('should handle duplicate items correctly')
  })

  describe('addItemToRequest', () => {
    it('should add item to request list')
  })

  describe('removeItem', () => {
    it('should remove item from offer')
    it('should remove item from request')
    it('should handle invalid index gracefully')
  })

  describe('calculateItemValue', () => {
    it('should calculate gold value correctly')
    it('should calculate intel value correctly')
    it('should calculate alliance value based on relationship')
    it('should calculate treaty value based on type')
    it('should calculate join-war value based on target strength')
    it('should return 0 for invalid items')
  })

  describe('calculateTotalValue', () => {
    it('should sum up multiple item values')
    it('should handle empty list')
  })

  describe('validateNegotiation', () => {
    it('should pass for valid negotiation')
    it('should fail if player cannot afford offer')
    it('should fail if request is impossible')
    it('should fail for empty negotiation')
  })

  describe('canAffordItems', () => {
    it('should return true if nation has enough resources')
    it('should return false if nation lacks gold')
    it('should return false if nation lacks intel')
  })

  describe('applyNegotiationDeal', () => {
    it('should transfer resources correctly')
    it('should create alliance when requested')
    it('should create treaty when offered')
    it('should update both nations')
    it('should log deal completion')
  })
})
```

**Akseptanskriterier**:
- [ ] Minimum 80% code coverage
- [ ] Alle edge cases dekket
- [ ] Tests kjører raskt (<1s totalt)
- [ ] Alle tests passerer

**Estimert Tid**: 1 dag

---

### Oppgave 1.6: Skriv Integration Tests for aiNegotiationEvaluator
**Fil**: `src/lib/__tests__/aiNegotiationEvaluator.test.ts`

**Test Cases**:

```typescript
describe('aiNegotiationEvaluator', () => {
  describe('evaluateNegotiation', () => {
    it('should accept very favorable deals')
    it('should reject very unfavorable deals')
    it('should consider relationship in evaluation')
    it('should consider trust in evaluation')
    it('should consider personality in evaluation')
    it('should apply random factor within bounds')
  })

  describe('generateCounterOffer', () => {
    it('should generate counter-offer for marginally bad deals')
    it('should not generate counter-offer for terrible deals')
    it('should suggest adding resources')
    it('should suggest removing requests')
    it('should respect AI resource limits')
  })

  describe('generateNegotiationFeedback', () => {
    it('should generate positive feedback for good deals')
    it('should generate negative feedback for bad deals')
    it('should mention agendas when relevant')
    it('should mention trust issues when relevant')
  })

  describe('aiConsiderInitiatingNegotiation', () => {
    it('should initiate when under threat')
    it('should initiate when opportunity exists')
    it('should not initiate too frequently')
    it('should not initiate when hostile')
  })

  describe('shouldMakeCounterOffer', () => {
    it('should return true for defensive personality with alliance request')
    it('should return false for very hostile relationships')
    it('should consider evaluation score')
  })

  describe('getAIDesiredItems', () => {
    it('should desire gold when low on resources')
    it('should desire alliance when under threat')
    it('should desire grievance apology when grievances exist')
  })

  describe('getAIOfferableItems', () => {
    it('should offer alliance when friendly')
    it('should not offer alliance when hostile')
    it('should offer resources when has excess')
  })
})
```

**Akseptanskriterier**:
- [ ] Minimum 75% code coverage
- [ ] All major scenarios tested
- [ ] Tests kjører raskt (<2s totalt)
- [ ] Alle tests passerer

**Estimert Tid**: 1-2 dager

---

### Oppgave 1.7: Integrer med Eksisterende AI System
**Filer**:
- `src/lib/aiDiplomacyEvaluator.ts` (modifiser)
- `src/lib/aiDiplomacyActions.ts` (modifiser)

**Beskrivelse**: Integrer det nye negotiation-systemet med eksisterende AI diplomacy system.

**Endringer**:

1. **I `aiDiplomacyEvaluator.ts`**:
   - Legg til støtte for multi-item evaluering
   - Utvid `evaluateProposal()` til å håndtere `NegotiationState`
   - Behold backwards compatibility for enkle proposals

2. **I `aiDiplomacyActions.ts`**:
   - Legg til `aiInitiateNegotiation()` funksjon
   - Integrer med `aiAttemptDiplomacy()`

**Akseptanskriterier**:
- [ ] Eksisterende proposal-system fungerer fortsatt
- [ ] Nye negotiation-funksjoner integrert
- [ ] Ingen breaking changes
- [ ] Eksisterende tests passerer fortsatt

**Estimert Tid**: 1 dag

---

## FASE 2: UI KOMPONENTER
**Varighet**: 2-3 uker
**Prioritet**: Høy (trengs for å teste Fase 1)

### Oppgave 2.1: Implementer LeaderContactModal
**Fil**: `src/components/LeaderContactModal.tsx`

**Beskrivelse**: Lag hovedinterface for å kontakte en AI-leder.

**Layout**:
```
┌──────────────────────────────────────────┐
│  Contact [Nation Name]           [X]     │
├──────────────────────────────────────────┤
│  ┌─────────┐  [Nation Name]              │
│  │         │  Leader: [Leader Name]      │
│  │ Avatar  │  Mood: Friendly ●●●●○       │
│  │         │                              │
│  └─────────┘  Relationship: +45          │
│               Trust: 72/100               │
│               Favors: +8                  │
├──────────────────────────────────────────┤
│  Known Agendas:                          │
│  ● Loyal Friend (Primary)                │
│  ● ??? (Hidden)                           │
├──────────────────────────────────────────┤
│  Recent Events:                          │
│  • Alliance formed 5 turns ago           │
│  • Received aid 2 turns ago              │
├──────────────────────────────────────────┤
│  Actions:                                │
│  [Propose Deal]  [Make Request]          │
│  [Discuss]       [View History]          │
└──────────────────────────────────────────┘
```

**Props**:
```typescript
interface LeaderContactModalProps {
  targetNationId: string
  playerNation: Nation
  allNations: Nation[]
  currentTurn: number
  onClose: () => void
  onStartNegotiation: (negotiation: NegotiationState) => void
  onMakeRequest: (request: DiplomaticRequest) => void
}
```

**Komponenter som trengs**:
- Leader avatar (kan bruke nation color circle med initial)
- Relationship bar (color-coded)
- Trust bar (color-coded)
- Favor indicator (+/- with color)
- Mood indicator (emoji eller text)
- Agenda list (show known, hide unknown)
- Recent events timeline
- Action buttons

**Funksjoner**:
- [ ] Vise leder-informasjon
- [ ] Vise relationship metrics
- [ ] Vise kjente agendaer
- [ ] Vise recent events
- [ ] Knapp for å starte negotiation
- [ ] Knapp for å gjøre request (bruker favors)
- [ ] Knapp for å diskutere relationship
- [ ] Knapp for å se history
- [ ] Responsivt design

**Akseptanskriterier**:
- [ ] Modal vises korrekt
- [ ] All informasjon vises korrekt
- [ ] Buttons funker og kaller riktige handlers
- [ ] Design er konsistent med resten av UI
- [ ] Fungerer på mobile og desktop

**Estimert Tid**: 2-3 dager

---

### Oppgave 2.2: Implementer NegotiationInterface
**Fil**: `src/components/NegotiationInterface.tsx`

**Beskrivelse**: Lag interaktiv forhandlings-interface.

**Layout**:
```
┌────────────────────────────────────────────────┐
│  Negotiation with [Nation]  Round: 1/5  [X]   │
├────────────────────────────────────────────────┤
│  ┌────────────────┐    ┌────────────────┐     │
│  │ YOU OFFER:     │    │ YOU REQUEST:   │     │
│  │                │    │                │     │
│  │ • 500 Gold [X] │    │ • Alliance [X] │     │
│  │ • Intel 10 [X] │    │   Type: [▼]    │     │
│  │                │    │                │     │
│  │ [+ Add Item]   │    │ [+ Add Item]   │     │
│  │                │    │                │     │
│  │ Total: ~800    │    │ Total: ~1200   │     │
│  └────────────────┘    └────────────────┘     │
├────────────────────────────────────────────────┤
│  AI Response:                                  │
│  ┌──────────────────────────────────────────┐ │
│  │ "Not quite enough. This alliance is very│ │
│  │  valuable to me. Add a Non-Aggression   │ │
│  │  Pact and we have a deal."              │ │
│  │                                          │ │
│  │  Acceptance Chance: 35% ●●●○○○○○○○       │ │
│  │  Deal Balance: [████░░░░] Favors Them   │ │
│  └──────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│  [Propose Deal]  [Cancel]                     │
└────────────────────────────────────────────────┘
```

**Props**:
```typescript
interface NegotiationInterfaceProps {
  negotiation: NegotiationState
  playerNation: Nation
  targetNation: Nation
  allNations: Nation[]
  currentTurn: number
  onUpdateNegotiation: (updated: NegotiationState) => void
  onProposeDeal: (negotiation: NegotiationState) => void
  onCancel: () => void
}
```

**State Management**:
```typescript
const [localNegotiation, setLocalNegotiation] = useState(negotiation)
const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null)
const [isEvaluating, setIsEvaluating] = useState(false)

// Debounced evaluation
useEffect(() => {
  const timer = setTimeout(() => {
    evaluateCurrentDeal()
  }, 500)
  return () => clearTimeout(timer)
}, [localNegotiation.offerItems, localNegotiation.requestItems])
```

**Funksjoner**:
- [ ] Vise offer og request lister
- [ ] Legg til items via ItemPicker
- [ ] Fjern items
- [ ] Real-time evaluering (debounced)
- [ ] Visuell balance indicator
- [ ] AI feedback tekst
- [ ] Acceptance probability bar
- [ ] Propose deal button (validering)
- [ ] Handle counter-offers

**Akseptanskriterier**:
- [ ] Items kan legges til og fjernes
- [ ] Evaluering kjører automatisk
- [ ] Feedback vises tydelig
- [ ] Balance indicator oppdateres
- [ ] Propose knapp disabled hvis invalid
- [ ] Counter-offers vises og kan aksepteres
- [ ] Performance er god (ingen lag)

**Estimert Tid**: 3-4 dager

---

### Oppgave 2.3: Implementer ItemPicker
**Fil**: `src/components/ItemPicker.tsx`

**Beskrivelse**: Modal for å velge items å legge til i forhandling.

**Layout**:
```
┌────────────────────────────────────────┐
│  Add Item to Offer             [X]     │
├────────────────────────────────────────┤
│  Categories:                           │
│  [Resources] [Agreements] [Actions]    │
├────────────────────────────────────────┤
│  Resources:                            │
│  ┌──────────────────────────────────┐ │
│  │ □ Gold      [Amount: ___]        │ │
│  │ □ Intel     [Amount: ___]        │ │
│  │ □ Production [Amount: ___]       │ │
│  └──────────────────────────────────┘ │
├────────────────────────────────────────┤
│  [Add Selected]  [Cancel]              │
└────────────────────────────────────────┘
```

**Props**:
```typescript
interface ItemPickerProps {
  availableItemTypes: NegotiableItemType[]
  nation: Nation  // For available resources
  context: 'offer' | 'request'
  onSelectItem: (item: NegotiableItem) => void
  onClose: () => void
}
```

**Item Categories**:

1. **Resources**:
   - Gold (slider/input)
   - Intel (slider/input)
   - Production (slider/input)

2. **Agreements**:
   - Alliance (dropdown for type)
   - Treaty (dropdown for type + duration)
   - Open Borders (duration)
   - Non-Aggression (duration)

3. **Actions**:
   - Join War (dropdown for target)
   - Share Tech (dropdown for tech)
   - Lift Sanctions
   - Grievance Apology (dropdown for grievance)

4. **Promises**:
   - Promise No Attack
   - Promise Help if Attacked
   - Promise No Ally With
   - Promise No Nukes

5. **Favors**:
   - Favor Exchange (amount)

**Funksjoner**:
- [ ] Kategori-tabs
- [ ] Checkboxes for item selection
- [ ] Input fields for amounts/durations
- [ ] Dropdowns for sub-types
- [ ] Validation (kan ikke tilby det du ikke har)
- [ ] Preview av item before adding
- [ ] Add button

**Akseptanskriterier**:
- [ ] Alle item types kan velges
- [ ] Input validering funker
- [ ] Dropdowns viser relevante valg
- [ ] Disabled items vises grayed out
- [ ] Add button kaller onSelectItem korrekt
- [ ] Modal lukkes etter adding

**Estimert Tid**: 2-3 dager

---

### Oppgave 2.4: Integrer med Index.tsx
**Fil**: `src/pages/Index.tsx`

**Beskrivelse**: Integrer de nye komponentene i main game loop.

**Nye State Variables**:
```typescript
const [activeLeaderContact, setActiveLeaderContact] = useState<string | null>(null)
const [activeNegotiation, setActiveNegotiation] = useState<NegotiationState | null>(null)
const [pendingAINegotiations, setPendingAINegotiations] = useState<AIInitiatedNegotiation[]>([])
```

**Nye Handlers**:
```typescript
const handleContactLeader = (nationId: string) => { ... }
const handleStartNegotiation = (negotiation: NegotiationState) => { ... }
const handleUpdateNegotiation = (updated: NegotiationState) => { ... }
const handleProposeDeal = (negotiation: NegotiationState) => { ... }
const handleCancelNegotiation = () => { ... }
```

**Integrasjonspunkter**:

1. **Render Section**:
```tsx
{activeLeaderContact && (
  <LeaderContactModal
    targetNationId={activeLeaderContact}
    playerNation={playerNation}
    allNations={nations}
    currentTurn={turn}
    onClose={() => setActiveLeaderContact(null)}
    onStartNegotiation={handleStartNegotiation}
  />
)}

{activeNegotiation && (
  <NegotiationInterface
    negotiation={activeNegotiation}
    playerNation={playerNation}
    targetNation={nations.find(n => n.id === activeNegotiation.respondentId)!}
    allNations={nations}
    currentTurn={turn}
    onUpdateNegotiation={handleUpdateNegotiation}
    onProposeDeal={handleProposeDeal}
    onCancel={handleCancelNegotiation}
  />
)}
```

2. **AI Turn Logic** (legg til i existing AI loop):
```typescript
if (Math.random() < 0.15) {
  const initiated = aiConsiderInitiatingNegotiation(
    aiNation,
    playerNation,
    nations,
    turn,
    Math.random
  )
  if (initiated) {
    setPendingAINegotiations(prev => [...prev, initiated])
    log(`${aiNation.name} wants to discuss diplomacy.`)
  }
}
```

3. **Player Phase** (show pending AI negotiations):
```typescript
if (pendingAINegotiations.length > 0) {
  const next = pendingAINegotiations[0]
  // Show notification/modal
  setPendingAINegotiations(prev => prev.slice(1))
}
```

**Akseptanskriterier**:
- [ ] LeaderContactModal vises når triggered
- [ ] NegotiationInterface vises når negotiation started
- [ ] Handlers oppdaterer state korrekt
- [ ] AI-initiated negotiations vises til player
- [ ] Ingen breaking changes til existing code
- [ ] Game loop fortsetter normalt

**Estimert Tid**: 2-3 dager

---

### Oppgave 2.5: Legg til Click Handlers på World Map
**Fil**: `src/components/WorldMap.tsx` (eller hvor nation markers er)

**Beskrivelse**: Legg til mulighet for å klikke på nasjoner for å kontakte ledere.

**Endringer**:

1. **I Nation Marker/Button**:
```tsx
<button
  onClick={() => onContactLeader(nation.id)}
  className="nation-marker"
>
  {/* existing marker content */}
</button>
```

2. **I Parent Component**:
```tsx
<WorldMap
  nations={nations}
  onContactLeader={handleContactLeader}
  // ... other props
/>
```

3. **Alternativt: Context Menu**:
Right-click på nation → "Contact Leader" option

**Akseptanskriterier**:
- [ ] Kan klikke på nation markers
- [ ] LeaderContactModal åpnes
- [ ] Fungerer på mobile (touch)
- [ ] Visual feedback ved hover

**Estimert Tid**: 0.5-1 dag

---

### Oppgave 2.6: Design og Implementer Leader Avatars
**Fil**: `src/components/LeaderAvatar.tsx`

**Beskrivelse**: Lag visuell representasjon av ledere.

**Approach 1: Simple (MVP)**:
- Colored circle med nation color
- Initial letter av nation name
- Border color basert på mood

**Approach 2: Advanced (Future)**:
- Generated avatars (f.eks. boring avatars API)
- Faction symbols
- Animated mood indicators

**MVP Implementation**:
```tsx
<div
  className="leader-avatar"
  style={{
    backgroundColor: nation.color,
    borderColor: moodColor,
  }}
>
  {nation.name[0]}
</div>
```

**Mood Colors**:
- Hostile: Red
- Unfriendly: Orange
- Neutral: Gray
- Friendly: Light Blue
- Allied: Green

**Akseptanskriterier**:
- [ ] Avatar vises korrekt
- [ ] Colors reflekterer nation og mood
- [ ] Responsiv sizing
- [ ] Clean og polished design

**Estimert Tid**: 0.5-1 dag

---

## FASE 3: AI PROAKTIV DIPLOMATI
**Varighet**: 1-2 uker
**Prioritet**: Medium (forbedrer opplevelsen)

### Oppgave 3.1: Implementer AI Negotiation Triggers
**Fil**: `src/lib/aiNegotiationTriggers.ts` (new)

**Beskrivelse**: Definer når og hvorfor AI skal initiere forhandlinger.

**Trigger Typer**:

1. **Under Threat**:
```typescript
function checkThreatTrigger(
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[]
): boolean {
  const threatLevel = aiNation.threats[playerNation.id] || 0
  const hasCommonEnemy = allNations.some(n =>
    aiNation.threats[n.id] > 15 &&
    playerNation.relationships[n.id] < -20
  )

  return (threatLevel > 12) || hasCommonEnemy
}

// Purpose: Request defensive alliance or join-war pact
```

2. **Resource Surplus**:
```typescript
function checkResourceSurplusTrigger(
  aiNation: Nation
): boolean {
  return aiNation.gold > 2000 ||
         aiNation.intel > 100 ||
         aiNation.production > 500
}

// Purpose: Offer trade/aid for favors or other benefits
```

3. **Reconciliation**:
```typescript
function checkReconciliationTrigger(
  aiNation: Nation,
  playerNation: Nation,
  currentTurn: number
): boolean {
  const relationship = getRelationship(aiNation, playerNation.id)
  const grievances = getGrievances(aiNation, playerNation.id)
  const oldestGrievance = grievances[0]

  // Time has passed since grievance
  const timeHealed = oldestGrievance &&
    (currentTurn - oldestGrievance.createdTurn) > 20

  return relationship < -20 && timeHealed
}

// Purpose: Offer peace/apology to improve relations
```

4. **Demand Compensation**:
```typescript
function checkCompensationDemandTrigger(
  aiNation: Nation,
  playerNation: Nation
): boolean {
  const grievances = getGrievances(aiNation, playerNation.id)
  const severeGrievances = grievances.filter(g =>
    g.severity === 'severe' || g.severity === 'major'
  )

  return severeGrievances.length > 0 &&
         getTrust(aiNation, playerNation.id) < 40
}

// Purpose: Demand apology, reparations, or other compensation
```

5. **Opportunity for Mutual Benefit**:
```typescript
function checkMutualBenefitTrigger(
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[]
): boolean {
  const relationship = getRelationship(aiNation, playerNation.id)
  const hasComplementaryAlliances = checkComplementaryAlliances(aiNation, playerNation)

  return relationship > 25 &&
         hasComplementaryAlliances &&
         !hasAlliance(aiNation, playerNation.id)
}

// Purpose: Propose specialized alliance
```

6. **Warning/Ultimatum**:
```typescript
function checkWarningTrigger(
  aiNation: Nation,
  playerNation: Nation
): boolean {
  const agendaViolations = checkAgendaViolations(playerNation, aiNation, gameState)
  const relationship = getRelationship(aiNation, playerNation.id)

  return agendaViolations.length > 0 && relationship > -30
}

// Purpose: Warn player to stop behavior before relations deteriorate
```

**Master Function**:
```typescript
export function checkAllTriggers(
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[],
  currentTurn: number,
  rng: () => number
): AIInitiatedNegotiation | null {

  // Check triggers in priority order
  const triggers = [
    { check: checkThreatTrigger, purpose: 'request-help', priority: 10 },
    { check: checkCompensationDemandTrigger, purpose: 'demand-compensation', priority: 9 },
    { check: checkWarningTrigger, purpose: 'warning', priority: 8 },
    { check: checkReconciliationTrigger, purpose: 'reconciliation', priority: 5 },
    { check: checkMutualBenefitTrigger, purpose: 'offer-alliance', priority: 4 },
    { check: checkResourceSurplusTrigger, purpose: 'trade-opportunity', priority: 2 },
  ]

  // Find highest priority triggered
  for (const trigger of triggers) {
    if (trigger.check(aiNation, playerNation, allNations)) {
      // Random chance based on priority
      if (rng() < trigger.priority / 10) {
        return createAINegotiation(aiNation, playerNation, trigger.purpose, currentTurn)
      }
    }
  }

  return null
}
```

**Akseptanskriterier**:
- [ ] 6+ trigger types implementert
- [ ] Triggers aktiveres i passende situasjoner
- [ ] Priority system fungerer
- [ ] Ikke for mange negotiations (throttling)
- [ ] Unit tests for hver trigger

**Estimert Tid**: 2-3 dager

---

### Oppgave 3.2: Implementer AI Negotiation Content Generator
**Fil**: `src/lib/aiNegotiationContentGenerator.ts` (new)

**Beskrivelse**: Generer meningsfullt innhold for AI-initierte forhandlinger.

**Funksjoner**:

```typescript
// Generate negotiation based on purpose
export function generateAINegotiationDeal(
  purpose: NegotiationPurpose,
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[],
  currentTurn: number
): {
  negotiation: NegotiationState
  message: string
}

// For each purpose:

function generateHelpRequest(ai, player, nations): Deal {
  // AI asks for defensive alliance or join-war
  // AI offers: Gold, resources, promises
  // AI requests: Alliance or join-war against threat
}

function generateAllianceOffer(ai, player): Deal {
  // AI proposes specialized alliance
  // AI offers: Alliance, open borders
  // AI requests: Mutual defense promise, maybe some gold
}

function generateReconciliationOffer(ai, player): Deal {
  // AI tries to repair relationship
  // AI offers: Apology, gold, promise not to attack
  // AI requests: Forgiveness (clear grievances)
}

function generateCompensationDemand(ai, player): Deal {
  // AI demands reparations
  // AI offers: Nothing or minimal (lift sanctions)
  // AI requests: Gold, apology, promise
}

function generateWarning(ai, player): Deal {
  // AI warns player to change behavior
  // Not really a negotiation, more of a message
  // No deal proposed, just warning
}

function generateTradeOffer(ai, player): Deal {
  // AI has resources to trade
  // AI offers: Gold, intel, or production
  // AI requests: Favors, promises, or other resources
}
```

**Message Templates**:
```typescript
const MESSAGES = {
  'request-help': [
    "We face a common threat. Let us stand together against {enemy}.",
    "I need your assistance. Will you help me against {enemy}?",
    "Our interests align. Join me in war against {enemy}."
  ],
  'offer-alliance': [
    "Our nations would benefit from a formal alliance.",
    "Let us strengthen our friendship with an alliance.",
    "I propose we unite our interests."
  ],
  'reconciliation': [
    "Our relations have been poor. I wish to make amends.",
    "Let us put the past behind us.",
    "I offer you a chance to rebuild our relationship."
  ],
  'demand-compensation': [
    "You have wronged me. I demand compensation.",
    "Your actions require reparations.",
    "I will not forget what you did. Pay what you owe."
  ],
  'warning': [
    "Your actions concern me. Change course or face consequences.",
    "I warn you: continue this behavior and we will have problems.",
    "This is your final warning."
  ],
  'trade-opportunity': [
    "I have resources you might find useful.",
    "Perhaps we can arrange a mutually beneficial trade?",
    "I offer you a trade opportunity."
  ]
}
```

**Akseptanskriterier**:
- [ ] Generering for alle 6 purposes
- [ ] Deals er logiske og realizable
- [ ] Messages er varied og contextual
- [ ] Template variables fylles inn (enemy, resources, etc.)
- [ ] Unit tests for hver generator

**Estimert Tid**: 2-3 dager

---

### Oppgave 3.3: Implementer AI Negotiation Notification System
**Fil**: `src/components/AINegotiationNotification.tsx` (new)

**Beskrivelse**: Vise AI-initierte negotiations til spilleren.

**Layout**:
```
┌────────────────────────────────────────┐
│  📨 Diplomatic Message                 │
├────────────────────────────────────────┤
│  From: [Nation Name]                   │
│  Urgency: High 🔴                      │
├────────────────────────────────────────┤
│  Message:                              │
│  "We face a common threat. Let us      │
│   stand together against Nation X."    │
├────────────────────────────────────────┤
│  [View Proposal]  [Dismiss]            │
└────────────────────────────────────────┘
```

**Props**:
```typescript
interface AINegotiationNotificationProps {
  negotiation: AIInitiatedNegotiation
  onView: () => void
  onDismiss: () => void
}
```

**Notification System**:
- Queue av pending AI negotiations
- Vises én om gangen
- Kan dismisses (goes to "Diplomatic Inbox")
- Urgency indicator (red/yellow/green)
- Expires after X turns

**Akseptanskriterier**:
- [ ] Notification vises når AI initierer
- [ ] View button åpner NegotiationInterface
- [ ] Dismiss button sender til inbox
- [ ] Urgency colors vises korrekt
- [ ] Queue system fungerer (ikke spam)

**Estimert Tid**: 1-2 dager

---

### Oppgave 3.4: Implementer Diplomatic Inbox
**Fil**: `src/components/DiplomaticInbox.tsx` (new)

**Beskrivelse**: Sted for å se alle pending/dismissed negotiations.

**Layout**:
```
┌──────────────────────────────────────────┐
│  Diplomatic Inbox                  [X]   │
├──────────────────────────────────────────┤
│  Pending Negotiations (2):              │
│  ┌────────────────────────────────────┐ │
│  │ 📨 Nation A - Help Request         │ │
│  │    Expires in: 3 turns             │ │
│  │    [View]                          │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ 📨 Nation B - Trade Offer          │ │
│  │    Expires in: 5 turns             │ │
│  │    [View]                          │ │
│  └────────────────────────────────────┘ │
├──────────────────────────────────────────┤
│  Completed Negotiations (3):            │
│  • Nation C - Alliance (Accepted)      │
│  • Nation D - Trade (Rejected)         │
│  • Nation E - Reconciliation (Expired) │
└──────────────────────────────────────────┘
```

**Features**:
- List pending negotiations
- Show expiration timers
- View button opens negotiation
- History of completed negotiations
- Filter by nation/type

**Akseptanskriterier**:
- [ ] Shows all pending negotiations
- [ ] Expiration timers accurate
- [ ] View button works
- [ ] History log complete
- [ ] Accessible from main UI

**Estimert Tid**: 1-2 dager

---

## FASE 4: AGENDA-SYSTEM & PERSONALITY
**Varighet**: 1-2 uker
**Prioritet**: Medium (adds depth)

### Oppgave 4.1: Definier Alle Agendaer
**Fil**: `src/lib/agendaDefinitions.ts` (new)

**Beskrivelse**: Definere alle primary og hidden agendas i detalj.

**Format**:
```typescript
export const PRIMARY_AGENDAS: AgendaDefinition[] = [
  {
    id: 'anti-nuclear',
    name: 'Nuclear Pacifist',
    type: 'primary',
    description: 'Despises the use of nuclear weapons and will not tolerate it.',
    modifiers: [
      {
        condition: 'player used nukes',
        effect: -30,
        description: 'You have used nuclear weapons'
      }
    ],
    checkCondition: (player, ai, state) => player.nuclearWeaponsUsed > 0
  },
  // ... more agendas
]

export const HIDDEN_AGENDAS: AgendaDefinition[] = [
  {
    id: 'expansionist',
    name: 'Expansionist',
    type: 'hidden',
    description: 'Respects nations with large territories.',
    modifiers: [
      {
        condition: 'player has many territories',
        effect: +15,
        description: 'Impressed by your territorial expansion'
      }
    ],
    checkCondition: (player, ai, state) => player.territories.length > 10
  },
  // ... more agendas
]
```

**Agendaer å implementere**:

**Primary (6-8)**:
1. ✅ Anti-Nuclear
2. ✅ Warmonger Hater
3. ✅ Loyal Friend
4. ✅ Isolationist
5. ✅ Peacemonger
6. ✅ Resource Guardian
7. Military Superiority
8. Ideological Purist

**Hidden (6-8)**:
1. ✅ Expansionist
2. ✅ Resource Hungry
3. ✅ Tech Enthusiast
4. ✅ Militarist
5. ✅ Diplomat
6. ✅ Opportunist
7. Trade Partner
8. Cultural Preservationist

**Akseptanskriterier**:
- [ ] Minst 6 primary agendas
- [ ] Minst 6 hidden agendas
- [ ] Hver har check condition
- [ ] Hver har modifiers
- [ ] Descriptions er clear

**Estimert Tid**: 1-2 dager

---

### Oppgave 4.2: Implementer Agenda Assignment ved Game Start
**Fil**: `src/lib/gameInitialization.ts` (modify)

**Beskrivelse**: Assign agendaer til AI nations ved game start.

**Implementasjon**:
```typescript
function initializeNationAgendas(
  nation: Nation,
  rng: () => number
): Nation {

  // Pick random primary agenda
  const primaryIndex = Math.floor(rng() * PRIMARY_AGENDAS.length)
  const primary = PRIMARY_AGENDAS[primaryIndex]

  // Pick random hidden agenda (different from primary)
  const hiddenCandidates = HIDDEN_AGENDAS.filter(a =>
    a.id !== primary.id
  )
  const hiddenIndex = Math.floor(rng() * hiddenCandidates.length)
  const hidden = hiddenCandidates[hiddenIndex]

  return {
    ...nation,
    agendas: [
      { ...primary, isRevealed: true },
      { ...hidden, isRevealed: false }
    ]
  }
}

// Call during game initialization
nations = nations.map(n => {
  if (n.id !== playerNation.id) {
    return initializeNationAgendas(n, seededRng)
  }
  return n
})
```

**Akseptanskriterier**:
- [ ] Every AI gets 1 primary + 1 hidden
- [ ] Primary is revealed by default
- [ ] Hidden is not revealed initially
- [ ] No duplicates (primary ≠ hidden)
- [ ] Seeded RNG for reproducibility

**Estimert Tid**: 0.5 dag

---

### Oppgave 4.3: Implementer Agenda Revelation System
**Fil**: `src/lib/agendaRevelation.ts` (new)

**Beskrivelse**: System for å gradvis avsløre hidden agendas.

**Revelation Conditions**:
```typescript
export function checkAgendaRevelation(
  playerNation: Nation,
  aiNation: Nation,
  currentTurn: number
): boolean {

  const relationship = getRelationship(aiNation, playerNation.id)
  const trust = getTrust(aiNation, playerNation.id)
  const firstContactTurn = aiNation.firstContactTurn[playerNation.id] || currentTurn
  const turnsKnown = currentTurn - firstContactTurn

  // Conditions for revelation:
  // 1. High relationship + good trust + time
  if (relationship > 25 && trust > 60 && turnsKnown > 10) {
    return true
  }

  // 2. Very long contact (even if neutral)
  if (turnsKnown > 30) {
    return true
  }

  // 3. Embassy established (future feature)
  if (aiNation.hasEmbassyWith?.[playerNation.id]) {
    return true
  }

  return false
}

export function revealHiddenAgenda(
  aiNation: Nation,
  playerNation: Nation,
  currentTurn: number
): Nation {

  if (!checkAgendaRevelation(playerNation, aiNation, currentTurn)) {
    return aiNation
  }

  const hiddenAgenda = aiNation.agendas?.find(a => !a.isRevealed)

  if (!hiddenAgenda) {
    return aiNation
  }

  return {
    ...aiNation,
    agendas: aiNation.agendas.map(a =>
      a.id === hiddenAgenda.id ? { ...a, isRevealed: true } : a
    )
  }
}

// Call during turn processing
export function processAgendaRevelations(
  nations: Nation[],
  playerNation: Nation,
  currentTurn: number
): Nation[] {

  return nations.map(nation => {
    if (nation.id === playerNation.id) return nation
    return revealHiddenAgenda(nation, playerNation, currentTurn)
  })
}
```

**Notification**:
When agenda revealed:
```
"You have learned more about [Nation]'s motivations.
 They are a [Agenda Name]: [Description]"
```

**Akseptanskriterier**:
- [ ] Hidden agendas reveal over time
- [ ] Revelation based on relationship/trust/time
- [ ] Player gets notification when revealed
- [ ] Revealed agendas show in LeaderContactModal

**Estimert Tid**: 1 dag

---

### Oppgave 4.4: Integrer Agendaer i AI Evaluation
**Fil**: `src/lib/aiNegotiationEvaluator.ts` (modify)

**Beskrivelse**: Agendaer skal påvirke AI-beslutninger i forhandlinger.

**Endringer i `evaluateNegotiation()`**:
```typescript
// Add agenda modifier calculation
const agendaModifier = calculateAgendaModifier(
  playerNation,
  aiNation,
  gameState
)

// Apply to final score
finalScore += agendaModifier

// Add to feedback if significant
if (Math.abs(agendaModifier) > 10) {
  const violatedAgenda = aiNation.agendas.find(a =>
    a.checkCondition(playerNation, aiNation, gameState)
  )

  if (violatedAgenda) {
    feedback += ` Your actions violate my ${violatedAgenda.name} values.`
  }
}
```

**Test Cases**:
- Anti-Nuclear AI rejects alliance if player used nukes
- Warmonger Hater demands compensation if player declared many wars
- Loyal Friend gives bonus to long-term allies
- Expansionist respects large empires

**Akseptanskriterier**:
- [ ] Agendas affect evaluation scores
- [ ] Violations result in rejections or penalties
- [ ] Bonuses apply for aligned actions
- [ ] Feedback mentions agendas when relevant
- [ ] Tests verify each agenda's effect

**Estimert Tid**: 1-2 dager

---

### Oppgave 4.5: Vise Agendaer i UI
**Fil**: `src/components/LeaderContactModal.tsx` (modify)

**Beskrivelse**: Vise agendaer i leader contact modal.

**UI Section**:
```tsx
<div className="agendas-section">
  <h3>Known Traits</h3>
  {nation.agendas?.map(agenda => (
    agenda.isRevealed ? (
      <div key={agenda.id} className="agenda-item">
        <strong>{agenda.name}</strong>
        <p>{agenda.description}</p>

        {/* Show if player is violating */}
        {agenda.checkCondition(playerNation, nation, gameState) && (
          <div className="violation-warning">
            ⚠️ Your actions concern them
          </div>
        )}
      </div>
    ) : (
      <div key="hidden" className="agenda-hidden">
        ❓ Hidden Trait (Build better relations to learn more)
      </div>
    )
  ))}
</div>
```

**Features**:
- Show revealed agendas with descriptions
- Show "???" for hidden agendas with hint
- Highlight violations in red
- Show bonuses in green

**Akseptanskriterier**:
- [ ] Revealed agendas display correctly
- [ ] Hidden agendas show as unknown
- [ ] Violations highlighted
- [ ] Clean, readable design

**Estimert Tid**: 1 dag

---

## FASE 5: POLISHING & BALANCING
**Varighet**: 1-2 uker
**Prioritet**: High (essential for good UX)

### Oppgave 5.1: Balance Item Values
**Fil**: `src/lib/negotiationUtils.ts` (modify)

**Beskrivelse**: Tweak item values basert på testing og feedback.

**Balancing Approach**:
1. **Baseline Values** (i calculateItemValue):
   - Gold: 1:1
   - Intel: 3x gold (scarce resource)
   - Production: 2x gold
   - Alliance: 1000 base (varies by relationship)
   - Treaty: 300-800 (varies by type and duration)
   - Promise: 200-500 (varies by type)
   - Join War: 500-2000 (varies by target power)
   - Share Tech: varies by tech tier (100-1000)
   - Open Borders: 200
   - Sanction Lift: 300
   - Grievance Apology: 200-800 (varies by severity)

2. **Context Modifiers**:
   - Under threat: Alliance value increases
   - Resource scarcity: Resource values increase
   - Desperate: All player offers valued higher
   - Satisfied: All player offers valued lower

3. **Relationship Scaling**:
   - Hostile (-50): Player must offer 2x value
   - Unfriendly (-25): 1.5x value
   - Neutral (0): 1x value
   - Friendly (+25): 0.8x value
   - Allied (+50): 0.6x value

**Testing Process**:
1. Create test scenarios
2. Play through negotiations
3. Collect data on acceptance rates
4. Adjust values to target 50-70% acceptance for fair deals
5. Iterate

**Akseptanskriterier**:
- [ ] Fair deals accepted ~60% of time
- [ ] Very favorable deals accepted ~90% of time
- [ ] Unfavorable deals rejected ~80% of time
- [ ] Values feel balanced to players
- [ ] No exploits (too cheap items)

**Estimert Tid**: 2-3 dager

---

### Oppgave 5.2: Tweak AI Acceptance Thresholds
**Fil**: `src/lib/aiNegotiationEvaluator.ts` (modify)

**Beskrivelse**: Adjust thresholds for AI acceptance basert på testing.

**Current Thresholds** (tentative):
```typescript
const THRESHOLDS = {
  AUTO_ACCEPT: 300,      // >300: 95% acceptance
  VERY_LIKELY: 200,      // >200: 80% acceptance
  LIKELY: 100,           // >100: 60% acceptance
  POSSIBLE: 0,           // >0: 40% acceptance
  COUNTER_OFFER: -100,   // >-100: 20% accept, 60% counter-offer
  UNLIKELY: -200,        // >-200: 5% accept, 30% counter-offer
  REJECT: -Infinity      // <-200: Flat rejection
}
```

**Personality Adjustments**:
- **Aggressive**: Lower thresholds (-20%)
- **Defensive**: Higher thresholds (+20%)
- **Balanced**: No adjustment
- **Isolationist**: Much higher for alliances (+50%)
- **Trickster**: Random (±30%)
- **Chaotic**: Very random (±50%)

**Testing**:
- Run 100 simulated negotiations per personality
- Check acceptance rate distributions
- Adjust thresholds until distributions feel right

**Akseptanskriterier**:
- [ ] Acceptance rates match intended difficulty
- [ ] Personalities feel distinct
- [ ] Not too easy or too hard
- [ ] Player feedback positive

**Estimert Tid**: 1-2 dager

---

### Oppgave 5.3: Forbedre Feedback Messages
**Fil**: `src/lib/aiNegotiationEvaluator.ts` (modify)

**Beskrivelse**: Gjøre AI feedback mer informative og varied.

**Message Categories**:

1. **Very Positive** (score > 200):
   - "This is an excellent proposal. I accept."
   - "You are most generous. We have a deal."
   - "I appreciate this offer and gladly accept."

2. **Positive** (score 100-200):
   - "This seems fair. I accept your terms."
   - "I find this acceptable."
   - "We have ourselves a deal."

3. **Neutral** (score 0-100):
   - "This could work, but I'd like a bit more."
   - "We're close. Add [X] and we have a deal."
   - "Almost there. What else can you offer?"

4. **Negative** (score -100-0):
   - "This doesn't quite work for me. I counter-propose..."
   - "Not enough. Here's what I need..."
   - "I'm afraid I need more than this."

5. **Very Negative** (score < -100):
   - "This is completely unacceptable."
   - "Are you insulting me with this offer?"
   - "I cannot even consider this."

**Context-Specific Messages**:
- If trust issue: "I don't trust you enough for this."
- If agenda violation: "Your [action] goes against my principles."
- If grievance: "We have unresolved issues between us."
- If threat: "I'm in no position to help you right now."

**Variation**:
- Multiple templates per category
- Randomly select to avoid repetition
- Include nation personality in tone

**Akseptanskriterier**:
- [ ] 3+ messages per category
- [ ] Context-aware messages
- [ ] Varied tone by personality
- [ ] Clear and helpful to player

**Estimert Tid**: 1-2 dagar

---

### Oppgave 5.4: Legg til Animations (Optional)
**Filer**: Various component files

**Beskrivelse**: Polere UI med smooth animations.

**Animations å legge til**:
1. **Modal Open/Close**: Fade in/out + scale
2. **Item Add/Remove**: Slide in/out
3. **Evaluation Update**: Progress bar animation
4. **Counter-Offer Appear**: Slide down + highlight
5. **Notification Pop**: Slide in from right

**Implementation med Framer Motion eller CSS**:
```tsx
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence>
  {showModal && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <LeaderContactModal ... />
    </motion.div>
  )}
</AnimatePresence>
```

**Akseptanskriterier**:
- [ ] Smooth transitions
- [ ] No janky performance
- [ ] Enhances UX without distracting
- [ ] Consistent animation timing

**Estimert Tid**: 1-2 dagar (optional)

---

### Oppgave 5.5: Comprehensive Testing
**Beskrivelse**: Grundig testing av hele systemet.

**Test Types**:

1. **Unit Tests**:
   - All utility functions
   - AI evaluation logic
   - Agenda system
   - Item value calculations

2. **Integration Tests**:
   - Full negotiation flow
   - AI-initiated negotiations
   - Counter-offer generation
   - Agenda revelation

3. **Acceptance Tests**:
   - Common scenarios (alliance request, trade, etc.)
   - Edge cases (empty deals, invalid items)
   - AI personality differences
   - Multi-round negotiations

4. **Manual Testing**:
   - Play through game
   - Try all negotiation types
   - Test with different AI personalities
   - Verify UI responsiveness
   - Check mobile compatibility

5. **Performance Testing**:
   - Measure evaluation time
   - Check for memory leaks
   - Ensure smooth animations
   - Test with many nations

**Bug Tracking**:
- Create issues for bugs found
- Prioritize critical vs. minor
- Fix critical before release

**Akseptanskriterier**:
- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass
- [ ] All acceptance tests pass
- [ ] No critical bugs
- [ ] Performance acceptable (<100ms evaluations)

**Estimert Tid**: 2-3 dagar

---

### Oppgave 5.6: Dokumentasjon
**Filer**:
- `docs/NEGOTIATION_SYSTEM.md`
- `docs/NEGOTIATION_API.md`
- `docs/NEGOTIATION_GUIDE.md`

**Beskrivelse**: Dokumentere systemet for utviklere og spillere.

**Developer Docs** (`NEGOTIATION_SYSTEM.md`):
- Architecture overview
- Component descriptions
- API reference
- Extension points
- Testing guidelines

**API Docs** (`NEGOTIATION_API.md`):
- All public functions
- Type definitions
- Usage examples
- Integration guide

**Player Guide** (`NEGOTIATION_GUIDE.md`):
- How to contact leaders
- How to negotiate
- Understanding AI responses
- Tips for successful negotiations
- Agenda system explained

**Akseptanskriterier**:
- [ ] Developer docs complete
- [ ] API fully documented
- [ ] Player guide helpful
- [ ] Code examples included
- [ ] Diagrams/visuals added

**Estimert Tid**: 2-3 dagar

---

## SUMMARY & TIMELINE

### Total Estimated Time
- **Fase 1**: 1-2 uker (Engine)
- **Fase 2**: 2-3 uker (UI)
- **Fase 3**: 1-2 uker (AI Proactive)
- **Fase 4**: 1-2 uker (Agendas)
- **Fase 5**: 1-2 uker (Polish)

**TOTAL**: 6-10 uker (med en utvikler, full-time)

### Dependencies
```
Fase 1 (Engine)
  ↓
Fase 2 (UI) ← Must wait for Fase 1
  ↓
Fase 3 (AI Proactive) ← Can be parallel with Fase 4
Fase 4 (Agendas) ← Can be parallel with Fase 3
  ↓
Fase 5 (Polish) ← Requires all previous phases
```

### Milestones
1. **M1: Engine Complete** (End of Fase 1)
   - Basic negotiation works programmatically
   - Tests pass

2. **M2: UI Complete** (End of Fase 2)
   - Players can negotiate via UI
   - Basic playable experience

3. **M3: AI Proactive** (End of Fase 3)
   - AI initiates negotiations
   - Feels more alive

4. **M4: Personalities** (End of Fase 4)
   - Each AI feels unique
   - Agendas working

5. **M5: Release Ready** (End of Fase 5)
   - Polished and balanced
   - Documented
   - Tested

### Risk Mitigation
- Start with MVP (Fase 1-2)
- Test early and often
- Get user feedback after M2
- Adjust plan based on feedback
- Keep scope flexible (Fase 3-4 can be reduced if needed)

---

## NEXT STEPS

1. **Review this plan** with team/stakeholders
2. **Prioritize** phases (might skip Fase 3-4 for MVP)
3. **Set up** project tracking (GitHub Projects, Jira, etc.)
4. **Create** individual tickets for each task
5. **Start** with Oppgave 1.1 (Type definitions)

---

## CONTACT & UPDATES

This is a living document. Updates will be made as implementation progresses.

**Last Updated**: 2025-11-02
**Status**: Planning Complete, Ready for Implementation
