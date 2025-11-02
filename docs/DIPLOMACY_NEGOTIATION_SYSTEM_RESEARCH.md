# Forskning: Interaktivt Forhandlingssystem for Diplomati

**Dato**: 2025-11-02
**Formål**: Forbedre diplomati-systemet med interaktive forhandlinger inspirert av Civilization

---

## 1. CIVILIZATION 6 DIPLOMATI-SYSTEM - ANALYSE

### 1.1 Nøkkelfunksjoner fra Civilization 6

#### AI Leder-Personligheter og Agendaer
- **Personlige Agendaer**: Hver leder har en unik agenda som alltid er den samme
  - Eks: Gandhi hater sivilisasjoner som bruker atomvåpen
  - Eks: Gilgamesh elsker allierte og vil beskytte dem
- **Skjulte Agendaer**: Tilfeldig tildelt, endres fra spill til spill
  - Gir variasjon og gjør AI mindre forutsigbar
- **Agendaer påvirker alle diplomatiske beslutninger**

#### Forhold og Scoring-System
- **Akkumulerende Score**: Alle handlinger de siste 30-50 runder teller
- **Terskelverdier for Diplomati**:
  - Score < -5: Risiko for denonsering
  - Score > -4: Unngår denonsering
- **Modifikatorer**:
  - Delegasjoner: Koster 25 gull, gir bonus til forhold
  - Ambassader: Gir bedre forhold og mer informasjon
  - Handelsavtaler: Forbedrer forhold over tid
  - Krigshandlinger: Kraftig negativ effekt

#### Synlighetssystem
1. **Første Kontakt**: Minimal informasjon
2. **Delegasjon Sendt**: Kan se noen agendaer
3. **Ambassade**: Full informasjon om agendaer og preferanser

#### Forhandlingssystem
- **Multi-item Forhandlinger**: Kan tilby/kreve flere ting samtidig
  - Gull, ressurser, byer, avtaler
- **Gjensidighet**: AI evaluerer om handelen er rettferdig
- **Historikk Påvirker**: Tidligere brudd på avtaler gjør AI mindre tilbøyelig

#### Grievance-System
- **Automatiske Grievances**: Genereres av aggressive handlinger
  - Kriger uten årsak: Stor grievance
  - Spionasje oppdaget: Mindre grievance
- **Tidsbasert Nedgang**: Grievances reduseres over tid
- **Påvirker Krigsoppslutning**: Legitimerer krig

---

## 2. EKSISTERENDE SYSTEM I VECTOR WAR GAMES

### 2.1 Nåværende Styrker

#### Omfattende 3-Fase System
Spillet har allerede et sofistikert diplomati-system:

**Fase 1 - Grunnleggende + Trust & Favors**:
- Proposal-system med 8 typer (alliance, truce, non-aggression, aid, sanction-lift, joint-war, demand-surrender, peace-offer)
- Trust-system (0-100): Påvirker alle diplomatiske interaksjoner
- Favors-system (-100 til +100): Skyld og forpliktelser
- Diplomatic Promises: Bindende løfter med konsekvenser

**Fase 2 - Grievances & Specialized Alliances**:
- Automatiske Grievances: 15+ typer med severity og varighet
- Claims-system: Legitimerer krig
- 4 typer Spesialiserte Allianser (Military, Defensive, Economic, Research)
- Alliance levels 1-5 med økende bonuser

**Fase 3 - Diplomatisk Valuta (DIP)**:
- Diplomatic Influence Points: Valuta for avanserte handlinger
- International Council: Medlemskap, votesystem, resolusjoner
- Dynamiske Incidents: 15 typer som kan eskalere til krig
- Peace Conferences: Multi-party forhandlinger

#### AI-beslutningssystem
- **Multifaktoriell Evaluering**: 7+ faktorer vurderes
  - Threat level, Military ratio, Relationship score
  - Trust modifier, Favors owed, Grievances penalty
  - Personality bias, Strategic value, Random factor
- **Personality-typer**: 6 AI-personligheter (aggressive, defensive, balanced, isolationist, trickster, chaotic)
- **Proposal-spesifikke Terskler**: Hver proposaltype har sin egen threshold

### 2.2 Gap-Analyse: Hva Mangler

#### 1. **Interaktive Forhandlinger**
**Problem**:
- Spilleren sender én proposal med faste terms
- AI svarer bare JA/NEI
- Ingen frem-og-tilbake forhandling
- Ingen mulighet til å justere tilbudet basert på AI-respons

**Civilization gjør**:
- Spilleren kan lage komplekse tilbud med flere elementer
- AI kan si "NEI, men jeg vil akseptere hvis du legger til X"
- Spilleren kan se hva AI vil ha og justere tilbud i sanntid

#### 2. **Mangler Direkte "Kontakt Leder"-Interface**
**Problem**:
- Ingen dedikert skjerm for å "møte" en leder
- Ingen visuell leder-representasjon
- Ikke lett å se lederens personlighet og preferanser

**Civilization gjør**:
- Klikkbart leder-portrett
- Animert leder som "snakker"
- Viser lederens humør og holdning tydelig

#### 3. **AI Motforslag Mangler**
**Problem**:
- AI kan bare akseptere eller avvise
- AI kan ikke komme med motforslag
- Spilleren må gjette hva som vil fungere

**Civilization gjør**:
- "What would make this deal work?"
- AI kan foreslå alternative deals
- AI kan initiere forhandlinger proaktivt

#### 4. **Begrenset Info om Hvorfor AI Avviser**
**Problem**:
- Spilleren får liten feedback om HVORFOR AI sa nei
- Vanskelig å lære hva som fungerer

**Civilization gjør**:
- Tydelige agendaer vises
- AI forklarer "Du bryter min agenda om X"
- Viser nøyaktig relationship-modifikatorer

#### 5. **Ikke Multi-Item Deals**
**Problem**:
- Kan ikke lage komplekse deals med flere elementer
- Ikke "jeg gir deg X og Y for at du gir meg Z"

**Civilization gjør**:
- Kan kombinere gull, ressurser, avtaler, byer i én deal
- AI evaluerer total verdi

---

## 3. FORESLÅTT LØSNING: INTERAKTIVT FORHANDLINGSSYSTEM

### 3.1 Overordnet Arkitektur

```
┌─────────────────────────────────────────────────┐
│         LEADER CONTACT INTERFACE                │
│  ┌───────────────────────────────────────────┐  │
│  │  [Leder Portrett] │ "Relationship: +45"   │  │
│  │                   │ Trust: 72/100          │  │
│  │  "Hva vil du?"    │ Favors: +8             │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  [Propose Deal]  [Ask About Relationship]       │
│  [Make Request]  [View History]                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         NEGOTIATION INTERFACE                   │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │ You Offer:       │  │ You Request:     │    │
│  │ □ 500 Gold       │  │ □ Alliance       │    │
│  │ □ 10 Intel       │  │ □ 200 Gold       │    │
│  │ □ Open Borders   │  │ □ Tech Share     │    │
│  └──────────────────┘  └──────────────────┘    │
│                                                  │
│  AI Response: "Not enough. Add non-aggression   │
│                pact and I'll consider."         │
│                                                  │
│  [Adjust Offer]  [Accept Their Terms]  [Cancel] │
└─────────────────────────────────────────────────┘
```

### 3.2 Nye Komponenter

#### A. **LeaderContactModal**
Hovedinterface for å kontakte en leder.

**Funksjoner**:
- Viser leder-avatar/portrett
- Viser nåværende relationship, trust, favors
- Viser lederens personlighet og kjente agendaer
- Menyalternativer:
  - "Propose Deal" → Åpner NegotiationInterface
  - "Make Request" → Ber om noe (bruker favors)
  - "Discuss Relationship" → Ser modifikatorer
  - "View History" → Tidligere interaksjoner
  - "Promise" → Lover noe
  - "Accuse" → Konfronterer om grievance

**Teknisk**:
```typescript
interface LeaderContactState {
  targetLeaderId: string
  leaderMood: 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'allied'
  visibleAgendas: Agenda[]
  relationshipModifiers: RelationshipModifier[]
  activeConversation?: ConversationNode
}
```

#### B. **NegotiationInterface**
Interaktivt forhandlingsvindu.

**Funksjoner**:
- To kolonner: "You Offer" og "You Request"
- Drag-and-drop eller checkboxes for å legge til items
- Real-time evaluering: "Deal leaning towards them/you/fair"
- AI feedback: "I'm interested" / "Not enough" / "Insulting!"
- Counter-offer system: AI kan foreslå endringer

**Negotiable Items**:
```typescript
type NegotiableItem =
  | { type: 'gold', amount: number }
  | { type: 'intel', amount: number }
  | { type: 'production', amount: number }
  | { type: 'alliance', allianceType: AllianceType }
  | { type: 'treaty', treatyType: TreatyType, duration: number }
  | { type: 'promise', promiseType: PromiseType, duration: number }
  | { type: 'favor-exchange', amount: number }
  | { type: 'sanction-lift' }
  | { type: 'join-war', targetId: string }
  | { type: 'share-tech', techId: string }
  | { type: 'open-borders', duration: number }
  | { type: 'grievance-apology', grievanceId: string }
```

**Teknisk**:
```typescript
interface NegotiationState {
  offerItems: NegotiableItem[]
  requestItems: NegotiableItem[]
  aiEvaluation: {
    score: number  // -100 to +100, negative means deal favors player
    acceptanceProbability: number  // 0 to 100%
    feedback: string
    counterOffer?: NegotiationState
  }
  negotiationRound: number  // Track rounds of back-and-forth
}
```

#### C. **AI Negotiation Engine**
Utvidet AI-system for å håndtere forhandlinger.

**Ny Funksjon: `evaluateNegotiation()`**
```typescript
function evaluateNegotiation(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  context: GameState
): NegotiationResponse {
  // 1. Calculate value of items offered by player
  const offerValue = calculateItemsValue(negotiation.offerItems, aiNation)

  // 2. Calculate value of items requested by player
  const requestValue = calculateItemsValue(negotiation.requestItems, aiNation)

  // 3. Calculate net value (positive = good for AI)
  const netValue = offerValue - requestValue

  // 4. Apply relationship modifiers
  const modifiedValue = applyRelationshipModifiers(netValue, relationship)

  // 5. Check personality preferences
  const personalityBonus = getPersonalityBonus(negotiation, aiPersonality)

  // 6. Check strategic importance
  const strategicValue = calculateStrategicValue(negotiation, gameState)

  // 7. Final acceptance score
  const finalScore = modifiedValue + personalityBonus + strategicValue

  // 8. Decide response
  if (finalScore > ACCEPTANCE_THRESHOLD) {
    return { accept: true }
  } else if (finalScore > COUNTER_OFFER_THRESHOLD) {
    return { accept: false, counterOffer: generateCounterOffer(...) }
  } else {
    return { accept: false, feedback: generateRejectionReason(...) }
  }
}
```

**Ny Funksjon: `generateCounterOffer()`**
```typescript
function generateCounterOffer(
  originalNegotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  deficitValue: number  // How much more AI wants
): NegotiationState {
  // AI modifies the deal to make it acceptable

  // Strategy 1: Ask for more from player
  if (canRequestMore) {
    addItemToRequest(mostDesiredItem)
  }

  // Strategy 2: Offer less to player
  if (canOfferLess) {
    removeItemFromOffer(leastImportantItem)
  }

  // Strategy 3: Suggest alternative items of similar value
  if (hasAlternatives) {
    replaceItemWithAlternative()
  }

  return modifiedNegotiation
}
```

#### D. **AI Proactive Negotiation**
AI kan initiere forhandlinger, ikke bare reagere.

**Scenarier**:
1. **AI ønsker noe fra spiller**:
   - "I need your help against Nation X. Let's discuss terms."

2. **AI ser en mulighet for win-win**:
   - "We both benefit from an economic alliance. Interested?"

3. **AI vil reparere forhold**:
   - "Our relations have been poor. What can I do to improve them?"

4. **AI reagerer på spillerens handlinger**:
   - "You broke your promise. I demand compensation."

**Teknisk**:
```typescript
function aiConsiderInitiatingNegotiation(
  aiNation: Nation,
  playerNation: Nation,
  gameState: GameState
): DiplomacyProposal | null {

  // Check various triggers
  if (aiNeedsHelp(aiNation, gameState)) {
    return createHelpRequest(aiNation, playerNation)
  }

  if (aiSeesOpportunity(aiNation, playerNation, gameState)) {
    return createProposal(aiNation, playerNation)
  }

  if (aiWantsReconciliation(aiNation, playerNation)) {
    return createReconciliationOffer(aiNation, playerNation)
  }

  if (aiWantsToPunish(aiNation, playerNation)) {
    return createDemand(aiNation, playerNation)
  }

  return null
}
```

### 3.3 Forhandlingsflyt (Flow)

```
┌─────────────────────────────────────────────────┐
│ SPILLER: Klikker på nation → "Contact Leader"  │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ SYSTEM: Viser LeaderContactModal                │
│ - Lederinfo, relationship, mood                 │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ SPILLER: Velger "Propose Deal"                  │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ SYSTEM: Viser NegotiationInterface              │
│ - Tom "Offer" og "Request" liste                │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ SPILLER: Legger til items i begge lister        │
│ - Offer: 500 Gold, Open Borders                │
│ - Request: Alliance                             │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ SYSTEM: Real-time evaluering                    │
│ → evaluateNegotiation()                         │
│ Result: "Not enough. 35% chance of acceptance"  │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ SPILLER: Legger til Non-Aggression Pact         │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ SYSTEM: Oppdatert evaluering                    │
│ Result: "Better. 65% chance of acceptance"      │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ SPILLER: Klikker "Propose Deal"                 │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ AI: Evaluerer final deal                        │
│ → Rolls 1-100, compares to acceptance chance    │
│                                                  │
│ IF ACCEPT: Apply all terms, show confirmation   │
│ IF REJECT: Generate counter-offer eller reason  │
└────────────────────┬────────────────────────────┘
                     ↓
         ┌───────────┴───────────┐
         ↓                       ↓
┌────────────────┐      ┌────────────────────┐
│ AI ACCEPTED    │      │ AI COUNTER-OFFER   │
│ Deal complete  │      │ Show new terms     │
└────────────────┘      └────┬───────────────┘
                             ↓
                ┌────────────────────────────┐
                │ SPILLER: Kan akseptere,    │
                │ justere, eller avslå       │
                └────────────────────────────┘
```

### 3.4 Avvisningssystem med Feedback

Når AI avviser et tilbud, gir systemet konkret feedback:

**Kategorier av Avvisningsgrunner**:

1. **Utilstrekkelig Verdi**:
   - "This deal heavily favors you. I need more."
   - → Counter-offer: AI legger til krav eller fjerner tilbud

2. **Agendakonflikt**:
   - "I cannot ally with someone who uses nuclear weapons." (hvis spiller har brukt nukes)
   - "Your aggressive expansion worries me." (hvis spiller er expansionist)
   - → Ingen counter-offer, må fikse atferd først

3. **Tillitsproblem**:
   - "You broke our last treaty. I don't trust you." (lav trust)
   - → Krever kompensasjon eller tid for å gjenoppbygge trust

4. **Strategisk Ugunstig**:
   - "An alliance with you would anger Nation X, my current ally."
   - "I cannot join a war against Nation Y, they are too strong."
   - → Foreslår alternativ eller venter

5. **Ressursmangel**:
   - "I don't have the resources to commit to this right now."
   - → AI foreslår senere tidspunkt eller mindre omfattende deal

6. **Humør/Personlighet**:
   - "I'm not interested in diplomacy with you at this time." (hostile relationship)
   - → Må forbedre forhold først

**Implementasjon**:
```typescript
function generateRejectionFeedback(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  evaluationFactors: EvaluationFactors
): RejectionFeedback {

  const reasons: string[] = []

  // Check value deficit
  if (evaluationFactors.netValue < -30) {
    reasons.push("This deal heavily favors you. I need more.")
  }

  // Check trust
  if (getTrust(aiNation, playerNation.id) < 30) {
    reasons.push("Your past actions make me hesitant to trust you.")
  }

  // Check agendas
  const agendaViolations = checkAgendaViolations(playerNation, aiNation.agendas)
  if (agendaViolations.length > 0) {
    reasons.push(`I cannot ally with someone who ${agendaViolations[0]}`)
  }

  // Check grievances
  const grievances = getGrievances(aiNation, playerNation.id)
  if (grievances.length > 0) {
    reasons.push(`We have unresolved grievances between us.`)
  }

  // Pick most important reason
  return {
    primaryReason: reasons[0],
    allReasons: reasons,
    suggestion: generateSuggestion(evaluationFactors)
  }
}
```

---

## 4. TEKNISK IMPLEMENTASJONSPLAN

### 4.1 Nye TypeScript Typer

**Fil**: `src/types/negotiation.ts`

```typescript
// Negotiable items
export type NegotiableItemType =
  | 'gold'
  | 'intel'
  | 'production'
  | 'alliance'
  | 'treaty'
  | 'promise'
  | 'favor-exchange'
  | 'sanction-lift'
  | 'join-war'
  | 'share-tech'
  | 'open-borders'
  | 'grievance-apology'
  | 'resource-share'
  | 'military-support'

export interface NegotiableItem {
  type: NegotiableItemType
  amount?: number
  duration?: number
  targetId?: string  // For join-war, share-tech
  subtype?: string   // For alliance types, treaty types, etc.
  metadata?: Record<string, any>
}

// Negotiation state
export interface NegotiationState {
  id: string
  initiatorId: string
  respondentId: string
  offerItems: NegotiableItem[]
  requestItems: NegotiableItem[]
  currentRound: number
  maxRounds: number
  status: 'active' | 'accepted' | 'rejected' | 'expired'
  aiEvaluation?: AIEvaluation
  history: NegotiationRound[]
  createdTurn: number
}

export interface NegotiationRound {
  round: number
  offerItems: NegotiableItem[]
  requestItems: NegotiableItem[]
  response: 'pending' | 'counter-offer' | 'accepted' | 'rejected'
  feedback?: string
}

export interface AIEvaluation {
  offerValue: number
  requestValue: number
  netValue: number
  relationshipModifier: number
  personalityBonus: number
  strategicValue: number
  finalScore: number
  acceptanceProbability: number
  feedback: string
  counterOffer?: CounterOffer
}

export interface CounterOffer {
  offerItems: NegotiableItem[]
  requestItems: NegotiableItem[]
  explanation: string
}

// Leader contact
export interface LeaderContactState {
  leaderId: string
  playerNationId: string
  mood: LeaderMood
  visibleInfo: VisibleLeaderInfo
  availableActions: DiplomaticAction[]
  activeNegotiation?: NegotiationState
}

export type LeaderMood =
  | 'hostile'      // Relationship < -50
  | 'unfriendly'   // Relationship -50 to -25
  | 'cautious'     // Relationship -24 to 0
  | 'neutral'      // Relationship 0 to 24
  | 'friendly'     // Relationship 25 to 49
  | 'cordial'      // Relationship 50 to 74
  | 'allied'       // Relationship 75+

export interface VisibleLeaderInfo {
  name: string
  nation: string
  personality: AIPersonality
  knownAgendas: Agenda[]
  relationship: number
  trust: number
  favors: number
  activeAlliances: string[]
  activeTreaties: string[]
  grievances: Grievance[]
  recentActions: DiplomaticEvent[]
}

export interface Agenda {
  id: string
  type: 'primary' | 'hidden' | 'situational'
  name: string
  description: string
  isRevealed: boolean
  modifiers: AgendaModifier[]
}

export interface AgendaModifier {
  condition: string  // e.g., "player uses nukes"
  effect: number     // Relationship modifier
  description: string
}

export interface DiplomaticAction {
  id: string
  label: string
  type: 'propose-deal' | 'make-request' | 'discuss' | 'accuse' | 'apologize'
  enabled: boolean
  disabledReason?: string
  cost?: ResourceCost
}

// AI proactive diplomacy
export interface AIInitiatedNegotiation {
  aiNationId: string
  targetNationId: string
  purpose: NegotiationPurpose
  proposedDeal: NegotiationState
  urgency: 'low' | 'medium' | 'high'
  expiresAtTurn: number
}

export type NegotiationPurpose =
  | 'request-help'         // AI needs player assistance
  | 'offer-alliance'       // AI sees mutual benefit
  | 'reconciliation'       // AI wants to repair relationship
  | 'demand-compensation'  // AI wants payback for grievance
  | 'warning'             // AI gives ultimatum
  | 'peace-offer'         // AI wants to end war
  | 'trade-opportunity'   // AI has resources to trade
```

### 4.2 Nye Komponenter

#### Component 1: `LeaderContactModal.tsx`

**Lokasjon**: `src/components/LeaderContactModal.tsx`

**Props**:
```typescript
interface LeaderContactModalProps {
  targetNationId: string
  playerNation: Nation
  allNations: Nation[]
  onClose: () => void
  onStartNegotiation: (negotiation: NegotiationState) => void
  onMakeRequest: (request: DiplomaticRequest) => void
  currentTurn: number
}
```

**Funksjoner**:
- Viser leder-avatar (kan bruke eksisterende nation farger/symboler)
- Viser relationship, trust, favors med fargekodet bars
- Viser kjente agendaer (basert på synlighetsnivå)
- Viser nylige hendelser og modifikatorer
- Knapper for ulike diplomatiske handlinger
- Integrasjon med eksisterende TrustAndFavorsDisplay

#### Component 2: `NegotiationInterface.tsx`

**Lokasjon**: `src/components/NegotiationInterface.tsx`

**Props**:
```typescript
interface NegotiationInterfaceProps {
  negotiation: NegotiationState
  playerNation: Nation
  targetNation: Nation
  allNations: Nation[]
  onUpdateNegotiation: (updated: NegotiationState) => void
  onProposeDeal: (negotiation: NegotiationState) => void
  onCancel: () => void
  currentTurn: number
}
```

**Layout**:
```
┌──────────────────────────────────────────────┐
│  Negotiation with [Nation Name]              │
│  Round: 1/5          [Close]                 │
├──────────────────────────────────────────────┤
│  ┌───────────────┐      ┌───────────────┐   │
│  │ YOU OFFER:    │      │ YOU REQUEST:  │   │
│  │               │      │               │   │
│  │ □ Gold: [500] │      │ □ Alliance    │   │
│  │ □ Intel: [10] │      │   Type: [▼]   │   │
│  │ □ Open Borders│      │ □ Gold: [200] │   │
│  │   [+Add Item] │      │   [+Add Item] │   │
│  └───────────────┘      └───────────────┘   │
├──────────────────────────────────────────────┤
│  AI Response:                                │
│  ┌────────────────────────────────────────┐ │
│  │ "Not enough. This alliance is valuable│ │
│  │  to me. Add a Non-Aggression Pact and │ │
│  │  I'll consider it."                    │ │
│  │                                        │ │
│  │  Acceptance Probability: 35%           │ │
│  │  Deal Balance: [██░░░░░░] Favors Them │ │
│  └────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  [Adjust Offer]  [Propose Deal]  [Cancel]   │
└──────────────────────────────────────────────┘
```

**Funksjoner**:
- Real-time evaluering av deal (uppdateres når items legges til/fjernes)
- Visuell indikator for deal-balance
- AI feedback og acceptance probability
- Counter-offer visning
- Item-picker for å legge til forskjellige items

#### Component 3: `ItemPicker.tsx`

**Lokasjon**: `src/components/ItemPicker.tsx`

Modal for å velge hva som skal legges til i forhandlingen:

```typescript
interface ItemPickerProps {
  availableItems: NegotiableItemType[]
  onSelectItem: (item: NegotiableItem) => void
  onClose: () => void
  nation: Nation  // For å vise tilgjengelige ressurser
}
```

**Kategorier**:
- Resources (Gold, Intel, Production)
- Agreements (Alliance, Treaty, Open Borders)
- Actions (Join War, Share Tech, Lift Sanctions)
- Promises (Various promise types)
- Favors & Apologies

### 4.3 Nye Utility-funksjoner

#### File: `src/lib/negotiationUtils.ts`

**Hovedfunksjoner**:

```typescript
// Create new negotiation
export function createNegotiation(
  initiatorId: string,
  respondentId: string,
  turn: number
): NegotiationState

// Add/remove items
export function addItemToOffer(
  negotiation: NegotiationState,
  item: NegotiableItem
): NegotiationState

export function addItemToRequest(
  negotiation: NegotiationState,
  item: NegotiableItem
): NegotiationState

export function removeItem(
  negotiation: NegotiationState,
  itemIndex: number,
  side: 'offer' | 'request'
): NegotiationState

// Calculate item values
export function calculateItemValue(
  item: NegotiableItem,
  evaluator: Nation,
  context: GameState
): number

export function calculateTotalValue(
  items: NegotiableItem[],
  evaluator: Nation,
  context: GameState
): number

// Validation
export function validateNegotiation(
  negotiation: NegotiationState,
  initiator: Nation,
  respondent: Nation
): ValidationResult

export function canAffordItems(
  nation: Nation,
  items: NegotiableItem[]
): boolean

// Apply deal
export function applyNegotiationDeal(
  negotiation: NegotiationState,
  initiator: Nation,
  respondent: Nation,
  allNations: Nation[],
  turn: number
): { initiator: Nation; respondent: Nation; allNations: Nation[] }
```

#### File: `src/lib/aiNegotiationEvaluator.ts`

Utvidet AI-evaluering for forhandlinger:

```typescript
// Main evaluation function
export function evaluateNegotiation(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[],
  currentTurn: number
): AIEvaluation

// Generate counter-offer
export function generateCounterOffer(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  evaluation: AIEvaluation,
  allNations: Nation[]
): CounterOffer | null

// Generate feedback
export function generateNegotiationFeedback(
  evaluation: AIEvaluation,
  aiNation: Nation,
  playerNation: Nation
): string

// AI-initiated negotiations
export function aiConsiderInitiatingNegotiation(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number,
  rng: () => number
): AIInitiatedNegotiation | null

// Helper: Check if AI should make counter-offer
export function shouldMakeCounterOffer(
  evaluation: AIEvaluation,
  aiPersonality: AIPersonality,
  relationship: number
): boolean

// Helper: What items does AI want?
export function getAIDesiredItems(
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[]
): NegotiableItem[]

// Helper: What items is AI willing to give?
export function getAIOfferableItems(
  aiNation: Nation,
  playerNation: Nation,
  relationship: number
): NegotiableItem[]
```

#### File: `src/lib/agendaSystem.ts`

Nytt agenda-system inspirert av Civilization:

```typescript
// Agenda definitions
export interface AgendaDefinition {
  id: string
  name: string
  type: 'primary' | 'hidden'
  description: string
  modifiers: AgendaModifier[]
  checkCondition: (player: Nation, ai: Nation, gameState: GameState) => boolean
}

export const AGENDAS: Record<string, AgendaDefinition> = {
  ANTI_NUCLEAR: {
    id: 'anti-nuclear',
    name: 'Nuclear Pacifist',
    type: 'primary',
    description: 'Hates nations that use nuclear weapons',
    modifiers: [{
      condition: 'player used nukes',
      effect: -30,
      description: 'You have used nuclear weapons'
    }],
    checkCondition: (player, ai, state) => player.nuclearWeaponsUsed > 0
  },
  EXPANSIONIST: {
    id: 'expansionist',
    name: 'Expansionist',
    type: 'hidden',
    description: 'Respects strong territorial expansion',
    modifiers: [{
      condition: 'player has many territories',
      effect: +15,
      description: 'Respects your territorial expansion'
    }],
    checkCondition: (player, ai, state) => player.territories.length > 10
  },
  WARMONGER_HATER: {
    id: 'warmonger-hater',
    name: 'Warmonger Hater',
    type: 'primary',
    description: 'Dislikes aggressive warmongers',
    modifiers: [{
      condition: 'player declares many wars',
      effect: -20,
      description: 'You have declared too many wars'
    }],
    checkCondition: (player, ai, state) => player.warsStarted > 3
  },
  LOYAL_FRIEND: {
    id: 'loyal-friend',
    name: 'Loyal Friend',
    type: 'hidden',
    description: 'Values long-term alliances',
    modifiers: [{
      condition: 'long alliance with player',
      effect: +25,
      description: 'Our alliance has stood the test of time'
    }],
    checkCondition: (player, ai, state) => {
      const alliance = ai.specializedAlliances?.find(a =>
        (a.nation1Id === player.id || a.nation2Id === player.id) && a.active
      )
      return alliance && (state.turn - alliance.createdTurn) > 30
    }
  },
  ISOLATIONIST: {
    id: 'isolationist',
    name: 'Isolationist',
    type: 'primary',
    description: 'Prefers minimal foreign entanglements',
    modifiers: [{
      condition: 'player has many alliances',
      effect: -10,
      description: 'Your many alliances concern me'
    }],
    checkCondition: (player, ai, state) => {
      const playerAlliances = state.nations.filter(n =>
        n.treaties[player.id]?.type === 'alliance'
      ).length
      return playerAlliances > 3
    }
  },
  RESOURCE_HUNGRY: {
    id: 'resource-hungry',
    name: 'Resource Hungry',
    type: 'hidden',
    description: 'Wants access to resources',
    modifiers: [{
      condition: 'player shares resources',
      effect: +20,
      description: 'You generously share your resources'
    }],
    checkCondition: (player, ai, state) => {
      // Check if player has sent aid recently
      return ai.favorBalances?.[player.id]?.history?.some(h =>
        h.reason === 'aid-sent' && (state.turn - h.turn) < 10
      ) || false
    }
  }
}

// Assign agendas to AI
export function assignAgendas(
  nation: Nation,
  rng: () => number
): { primary: Agenda; hidden: Agenda }

// Check agenda violations
export function checkAgendaViolations(
  player: Nation,
  ai: Nation,
  gameState: GameState
): AgendaViolation[]

// Calculate agenda modifier to relationship
export function calculateAgendaModifier(
  player: Nation,
  ai: Nation,
  gameState: GameState
): number

// Reveal hidden agenda (based on relationship level)
export function shouldRevealHiddenAgenda(
  relationship: number,
  trust: number,
  turn: number,
  firstContactTurn: number
): boolean
```

### 4.4 Integrasjon med Eksisterende Systemer

#### A. Integrasjon i `Index.tsx`

**Nye State Variables**:
```typescript
const [activeLeaderContact, setActiveLeaderContact] = useState<string | null>(null)
const [activeNegotiation, setActiveNegotiation] = useState<NegotiationState | null>(null)
const [pendingAINegotiations, setPendingAINegotiations] = useState<AIInitiatedNegotiation[]>([])
```

**Nye Handlers**:
```typescript
const handleContactLeader = (nationId: string) => {
  setActiveLeaderContact(nationId)
}

const handleStartNegotiation = (negotiation: NegotiationState) => {
  setActiveNegotiation(negotiation)
}

const handleProposeDeal = (negotiation: NegotiationState) => {
  const playerNation = nations.find(n => n.id === negotiation.initiatorId)!
  const targetNation = nations.find(n => n.id === negotiation.respondentId)!

  // Validate
  const validation = validateNegotiation(negotiation, playerNation, targetNation)
  if (!validation.valid) {
    log(`Cannot propose deal: ${validation.reason}`)
    return
  }

  // AI evaluates
  const evaluation = evaluateNegotiation(
    negotiation,
    targetNation,
    playerNation,
    nations,
    turn
  )

  // Roll for acceptance
  const roll = Math.random() * 100

  if (roll <= evaluation.acceptanceProbability) {
    // ACCEPTED
    const { initiator, respondent, allNations: updated } = applyNegotiationDeal(
      negotiation,
      playerNation,
      targetNation,
      nations,
      turn
    )

    setNations(updated)
    log(`${targetNation.name} accepted your proposal!`)
    setActiveNegotiation(null)
  } else {
    // REJECTED or COUNTER-OFFER
    if (evaluation.counterOffer && shouldMakeCounterOffer(evaluation, targetNation.type, getRelationship(targetNation, playerNation.id))) {
      // Counter-offer
      const counterNegotiation = {
        ...negotiation,
        offerItems: evaluation.counterOffer.requestItems,  // Flip perspective
        requestItems: evaluation.counterOffer.offerItems,
        currentRound: negotiation.currentRound + 1
      }

      log(`${targetNation.name} made a counter-offer: ${evaluation.counterOffer.explanation}`)
      setActiveNegotiation(counterNegotiation)
    } else {
      // Flat rejection
      log(`${targetNation.name} rejected your proposal: ${evaluation.feedback}`)
      setActiveNegotiation(null)
    }
  }
}
```

**AI Turn Integration**:
```typescript
// In AI turn processing
if (Math.random() < 0.15) {  // 15% chance per turn
  const initiatedNegotiation = aiConsiderInitiatingNegotiation(
    aiNation,
    playerNation,
    nations,
    turn,
    Math.random
  )

  if (initiatedNegotiation) {
    setPendingAINegotiations(prev => [...prev, initiatedNegotiation])
    log(`${aiNation.name} wants to discuss diplomacy with you.`)
  }
}
```

#### B. UI Integration Points

1. **World Map**: Klikk på nation → "Contact Leader" knapp i popup
2. **Diplomacy Tab**: Liste over alle ledere med "Contact" knapp
3. **Notifications**: AI-initierte forhandlinger dukker opp som notifikasjoner

#### C. Backwards Compatibility

Det nye forhandlingssystemet skal fungere side-om-side med eksisterende proposal-system:
- Enkle proposals (kun én handling) kan fortsatt bruke gammelt system
- Komplekse multi-item deals bruker nytt system
- Begge systemer bruker samme AI evaluator backend

---

## 5. IMPLEMENTASJONS-FASER

### Fase 1: Grunnleggende Negotiation Engine (1-2 uker)
**Oppgaver**:
1. ✅ Definer TypeScript-typer (`negotiation.ts`)
2. ✅ Implementer `negotiationUtils.ts`
3. ✅ Implementer `aiNegotiationEvaluator.ts`
4. ✅ Skriv enhetstester for evaluator
5. ✅ Integrer med eksisterende AI decision-making

**Suksesskriterier**:
- AI kan evaluere multi-item deals
- Item values beregnes korrekt
- Counter-offers genereres logisk

### Fase 2: UI Komponenter (2-3 uker)
**Oppgaver**:
1. ✅ Implementer `LeaderContactModal.tsx`
2. ✅ Implementer `NegotiationInterface.tsx`
3. ✅ Implementer `ItemPicker.tsx`
4. ✅ Integrer med `Index.tsx`
5. ✅ Legg til click-handlers på world map
6. ✅ Design og implementer leder-avatars (bruk nation colors/symbols)

**Suksesskriterier**:
- Spilleren kan kontakte AI-ledere
- Spilleren kan bygge multi-item deals
- Real-time feedback vises
- UI er responsiv og intuitiv

### Fase 3: AI Proaktiv Diplomati (1-2 uker)
**Oppgaver**:
1. ✅ Implementer `aiConsiderInitiatingNegotiation()`
2. ✅ Definer triggers for AI-initierte forhandlinger
3. ✅ Implementer notification system
4. ✅ Legg til AI "moods" og personlighet-variasjon
5. ✅ Integrer med eksisterende AI turn logic

**Suksesskriterier**:
- AI kontakter spilleren proaktivt
- AI-initierte forhandlinger er meningsfulle
- AI responderer på spillerens handlinger

### Fase 4: Agenda-System (1-2 uker)
**Oppgaver**:
1. ✅ Implementer `agendaSystem.ts`
2. ✅ Definer 10-15 ulike agendaer
3. ✅ Implementer agenda assignment ved game start
4. ✅ Implementer agenda revelation system
5. ✅ Integrer agendaer i AI evaluation
6. ✅ Vis agendaer i LeaderContactModal

**Suksesskriterier**:
- Hver AI har unique primary + hidden agenda
- Agendaer påvirker AI-beslutninger
- Spilleren kan lære agendaer over tid
- Agendaer gir tydelig feedback

### Fase 5: Polishing & Balancing (1-2 uker)
**Oppgaver**:
1. ✅ Balance item values
2. ✅ Tweak AI acceptance thresholds
3. ✅ Forbedre feedback messages
4. ✅ Legg til sound effects / animations (optional)
5. ✅ Testing og bugfixing
6. ✅ Dokumentasjon

**Suksesskriterier**:
- Systemet føles rettferdig
- AI oppfører seg logisk
- Spilleren forstår hvorfor AI aksepterer/avviser
- Performance er god

---

## 6. TEKNISKE UTFORDRINGER & LØSNINGER

### Utfordring 1: Item Value Balancing
**Problem**: Vanskelig å balansere verdien av forskjellige items.

**Løsning**:
- Bruk base values fra eksisterende ressurs-costs
- Juster basert på game state (knapphet, strategisk verdi)
- AI personality modifiers
- Iterativ testing og tuning

### Utfordring 2: AI Counter-Offers
**Problem**: AI kan foreslå ulogiske counter-offers.

**Løsning**:
- Constraint-basert generering (kun realistiske items)
- Template-baserte counter-offers for vanlige scenarier
- Fallback til flat rejection hvis counter-offer ikke gir mening

### Utfordring 3: Performance
**Problem**: Real-time evaluering kan være treg.

**Løsning**:
- Debounce evaluering (kun etter 500ms pause)
- Cache item values
- Pre-calculate strategic values
- Optimize lookup tables

### Utfordring 4: UI Complexity
**Problem**: Mange items og alternativer kan overvelde spilleren.

**Løsning**:
- Kategorisering av items
- Search/filter funksjonalitet
- Suggested items basert på context
- Progressive disclosure (start enkelt, vis mer ved behov)

### Utfordring 5: AI Unpredictability vs. Logic
**Problem**: Balance mellom å være forutsigbar og interessant.

**Løsning**:
- Random factor (±10%) i evaluering
- Mood swings basert på recent events
- Hidden agendas som spiller må lære
- Men alltid intern logikk som kan reverse-engineeres

---

## 7. TESTING-STRATEGI

### Unit Tests
**Fil**: `src/lib/__tests__/negotiationUtils.test.ts`

Test:
- Item value calculations
- Deal validation
- Item addition/removal
- Deal application

### Integration Tests
**Fil**: `src/lib/__tests__/aiNegotiationEvaluator.test.ts`

Test:
- AI evaluation logic
- Counter-offer generation
- Personality biases
- Edge cases (empty deals, impossible deals)

### Acceptance Tests
**Fil**: `src/lib/__tests__/negotiation.acceptance.test.ts`

Test:
- Full negotiation flow
- AI proactive diplomacy
- Multi-round negotiations
- Complex multi-item deals

### Manual Testing Scenarios
1. **Basic Alliance Request**:
   - Offer: 500 gold + open borders
   - Request: Military alliance
   - Expected: AI accepts if relationship > 30

2. **Unfair Deal**:
   - Offer: 100 gold
   - Request: All AI's resources
   - Expected: AI rejects with clear feedback

3. **Counter-Offer Scenario**:
   - Offer: 300 gold
   - Request: Alliance
   - Expected: AI counters with "Add non-aggression pact"

4. **Agenda Violation**:
   - Player used nukes
   - Request: Alliance from anti-nuclear AI
   - Expected: Flat rejection citing agenda

5. **AI-Initiated**:
   - AI under threat from third party
   - Expected: AI contacts player requesting defensive alliance

---

## 8. FREMTIDIGE UTVIDELSER (Post-MVP)

### 8.1 Advanced Negotiation Mechanics

**Dynamic Pricing**:
- Item prices change based on supply/demand
- Desperate AI pays more
- Luxury goods have variable value

**Time-Limited Offers**:
- "This offer expires in 3 turns"
- Creates urgency

**Auction System**:
- Multiple AI nations bid for player's alliance
- Player can play them against each other

### 8.2 Deeper Personality System

**Personality Evolution**:
- AI personality changes based on experiences
- Betrayed AI becomes more cautious
- Loyal ally becomes more trusting

**Relationship Memories**:
- AI remembers specific negotiations
- References past deals: "Last time you offered more..."

**Emotional Responses**:
- AI shows anger, gratitude, suspicion
- Affects negotiation tone

### 8.3 Advanced UI Features

**Negotiation History Log**:
- Review all past negotiations
- See what worked/failed

**Deal Templates**:
- Save common deal structures
- Quick-propose saved deals

**AI Personality Profiles**:
- Detailed dossier on each leader
- Track their preferences and patterns

**Visualization**:
- Graphs showing relationship trends
- Visual timeline of diplomatic events

### 8.4 Multiplayer Support

**Player-to-Player Negotiations**:
- Same interface for human opponents
- Async negotiation turns
- Deal proposals can be left pending

---

## 9. REFERANSER OG KILDER

### Civilization 6 Resources
- Civilization Wiki: Diplomacy (Civ6)
- r/civ discussions on AI diplomacy
- Civ 6 AI behavior analysis videos

### Game Design Articles
- "Designing AI Opponents: Personality vs. Logic"
- "Making Fair but Interesting Negotiations"
- "UI/UX for Complex Strategy Games"

### Academic Papers
- "Multi-Agent Negotiation in Games"
- "Personality Models for Game AI"

---

## 10. RISIKO-ANALYSE

### Høy Risiko
1. **AI Counter-Offers føles ulogiske**
   - Mitigation: Extensive testing og rule-based fallbacks

2. **Performance problemer med real-time evaluering**
   - Mitigation: Caching, debouncing, optimization

3. **UI blir for komplekst**
   - Mitigation: User testing, iterative simplification

### Medium Risiko
1. **Balansering tar lang tid**
   - Mitigation: Start med konservative values, iterate

2. **AI personality ikke differentiated nok**
   - Mitigation: Strong personality biases, varied agendas

### Lav Risiko
1. **Integration med eksisterende systemer**
   - Mitigation: Systemet er allerede godt strukturert

2. **TypeScript type safety**
   - Mitigation: Sterk typing fanger feil tidlig

---

## KONKLUSJON

Dette systemet vil transformere diplomati i Vector War Games fra et enkelt ja/nei-system til en dynamisk, interaktiv forhandlingsopplevelse inspirert av Civilization's beste features, samtidig som det bygger på spillets allerede sofistikerte trust/favor/grievance-system.

**Nøkkel-forbedringer**:
1. ✅ Multi-item negotiations
2. ✅ AI counter-offers og feedback
3. ✅ Proaktiv AI diplomati
4. ✅ Personality-driven agendas
5. ✅ Interaktiv Leader Contact interface

**Estimert Utviklingstid**: 8-12 uker for full implementasjon

**Neste Steg**: Start med Fase 1 (Negotiation Engine)
