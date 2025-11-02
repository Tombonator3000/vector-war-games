# Forskning: Agenda-System for AI Leder-Personligheter

**Dato**: 2025-11-02
**Formål**: Implementere unique leder-personligheter gjennom et agenda-system inspirert av Civilization

---

## 1. CIVILIZATION 6 AGENDA-SYSTEM - ANALYSE

### 1.1 Hvordan Civilization's Agenda-System Fungerer

#### To Typer Agendaer

**1. Leader Agenda (Primary)**:
- Hver leder har én unik agenda som alltid er den samme
- Synlig for spilleren fra første møte
- Eksempler:
  - Gandhi: "Peacekeeper" - Hater land som bruker atomvåpen
  - Gilgamesh: "Enkidu's Ally" - Elsker allierte, blir venn for livet
  - Alexander: "To the World's End" - Vil kontrollere alle bystater
  - Montezuma: "Gift for the Tlatoani" - Verdsetter luksusvarer

**2. Hidden Agenda**:
- Hver leder får én tilfeldig agenda fra en pool
- Endres fra spill til spill (gir replay value)
- Ikke synlig fra start - må oppdages over tid
- Eksempler:
  - "Exploiter": Respekterer land med mange ressurser
  - "Nuke Happy": Liker land som har atomvåpen
  - "Money Grubber": Verdsetter store gullreserver
  - "Standing Army": Respekterer sterke militærmakter

#### Agenda-Mekanikker

**Synlighets-System**:
1. **Første Kontakt**: Kun leader agenda synlig
2. **Etter Delegasjon Sendt**: Hidden agenda kan oppdages
3. **Etter Ambassade Etablert**: Hidden agenda garantert avslørt
4. **Alternativt**: Over tid med god relationship (20-30 turns)

**Påvirkning på AI-Beslutninger**:
- Agendaer gir +/- modifiers til relationship
- Påvirker alle diplomatiske beslutninger
- AI vil kommentere når agenda blir krenket/respektert
- Kan være årsak til krig eller fredelig samarbeid

**Eksempel - Gandhi's "Peacekeeper"**:
```
IF player uses nuclear weapons:
  - Relationship: -30 (permanent penalty)
  - Will denounce player
  - Extremely unlikely to ally
  - May declare war if relationship drops low enough

IF player has no nukes AND promotes peace:
  - Relationship: +10 (bonus)
  - More likely to accept alliances
  - Will support player in World Congress
```

### 1.2 Hvorfor Agendaer Fungerer Godt

**1. Forutsigbar Variasjon**:
- Leader agenda er konstant → Spilleren kan lære den
- Hidden agenda er random → Hver playthrough føles forskjellig
- Balance mellom predictability og surprise

**2. Personlighet Uten Dialog**:
- Gir AI "personlighet" uten å måtte skrive masse dialog
- Handlinger snakker for seg selv
- Spilleren lærer ved å observere reaksjoner

**3. Strategic Depth**:
- Spilleren må tilpasse diplomati basert på agendaer
- Kan velge å bryte agendaer hvis fordelene er større
- Risk/reward decisions

**4. Storytelling**:
- Skaper naturlige narrativer ("Gandhi hater meg fordi jeg brukte nukes")
- Gir kontekst til AI-handlinger
- Spilleren husker interaksjoner bedre

---

## 2. VECTOR WAR GAMES - NÅVÆRENDE TILSTAND

### 2.1 Eksisterende Personlighets-System

**AI Personality Types** (allerede implementert):
- `aggressive` - Offensive, høy militær prioritet
- `defensive` - Fokus på forsvar og sikkerhet
- `balanced` - Balansert tilnærming
- `isolationist` - Unngår allianser
- `trickster` - Upredictable, kan bryte avtaler
- `chaotic` - Meget random beslutninger

**Hvordan de Fungerer Nå**:
```typescript
// I aiDiplomacyEvaluator.ts
switch (nation.type) {
  case 'aggressive':
    personalityBias = -20  // Less likely to accept peace
    break
  case 'defensive':
    personalityBias = +15  // More likely to accept alliances
    break
  // ...etc
}
```

### 2.2 Gap-Analyse

**Hva Mangler**:

1. **Ingen Unique Traits**:
   - Alle "aggressive" AI oppfører seg likt
   - Ingen way til å skille mellom to aggressive ledere
   - Ikke unique motivasjoner

2. **Ikke Lærbart**:
   - Spilleren kan ikke "lære" en AI's preferanser over tid
   - Ingen progression i forståelse av AI

3. **Mangler Context-Aware Reactions**:
   - AI reagerer ikke på spillerens spesifikke handlinger
   - Ingen "Gandhi hater meg for nukes"-øyeblikk
   - Generiske avslag uten forklaring

4. **Ingen Hidden Information**:
   - All informasjon om AI synlig fra start
   - Ikke noe å oppdage eller lære

---

## 3. FORESLÅTT LØSNING: AGENDA-SYSTEM

### 3.1 Design-Prinsipper

**1. Byggepå Eksisterende System**:
- Agendaer utfyller personality types
- Aggressive + Anti-Nuclear = Unique kombinasjon
- Ikke erstatte, men utvide

**2. Simple & Forståelig**:
- Maksimum 2 agendaer per AI (1 primary, 1 hidden)
- Klare conditions og effects
- Tydelig feedback til spilleren

**3. Strategisk Relevant**:
- Agendaer må faktisk påvirke gameplay
- Ikke bare flavor text
- Gir spilleren meaningful choices

**4. Discovery Mechanic**:
- Hidden agendas skaper progression
- Belønner long-term diplomacy
- Gir grunn til å bygge relationship

### 3.2 Agenda-Kategorier

Vi definerer 2 hovedkategorier:

#### Primary Agendas (8 stk)

Alltid synlige, knyttet til core values:

1. **Anti-Nuclear** ("Nuclear Pacifist")
   - **Beskrivelse**: "Despises the use of nuclear weapons"
   - **Trigger**: Player uses nukes OR has many warheads
   - **Effect**: Relationship -30 hvis nukes brukt
   - **Bonus**: +10 hvis player har 0 nukes

2. **Warmonger Hater** ("Warmonger Hater")
   - **Beskrivelse**: "Dislikes aggressive nations that declare many wars"
   - **Trigger**: Player declares 3+ wars
   - **Effect**: Relationship -25
   - **Bonus**: +15 hvis player aldri startet krig

3. **Loyal Friend** ("Loyal Friend")
   - **Beskrivelse**: "Values long-term alliances"
   - **Trigger**: Alliance exists for 30+ turns
   - **Effect**: +25 relationship
   - **Penalty**: -40 hvis alliance broken

4. **Isolationist** ("Isolationist")
   - **Beskrivelse**: "Prefers minimal foreign entanglements"
   - **Trigger**: Player has many alliances (3+)
   - **Effect**: -15 relationship
   - **Bonus**: +10 hvis player respekterer isolation

5. **Peacemonger** ("Peacemonger")
   - **Beskrivelse**: "Seeks peace and diplomacy above all"
   - **Trigger**: Player at war
   - **Effect**: -15 relationship
   - **Bonus**: +20 hvis player promotes peace

6. **Resource Guardian** ("Resource Guardian")
   - **Beskrivelse**: "Values environmental protection"
   - **Trigger**: Player damages environment (future: pollution mechanic)
   - **Effect**: -20 relationship
   - **Bonus**: +15 hvis player protects resources

7. **Military Supremacist** ("Military Superiority")
   - **Beskrivelse**: "Believes in military dominance"
   - **Trigger**: Player's military > AI's military
   - **Effect**: -25 relationship (sees as threat)
   - **Bonus**: +10 hvis player respects supremacy

8. **Ideological Purist** ("Ideological Purist")
   - **Beskrivelse**: "Strong ideological beliefs"
   - **Trigger**: Player has different doctrine
   - **Effect**: -25 relationship
   - **Bonus**: +20 hvis same doctrine

#### Hidden Agendas (8 stk)

Ikke synlige fra start, må oppdages:

1. **Expansionist** ("Expansionist")
   - **Trigger**: Player controls many cities (5+)
   - **Effect**: +15 relationship
   - **Why Hidden**: Ikke morally obvious

2. **Resource Hungry** ("Resource Hungry")
   - **Trigger**: Player shares resources (high favor balance)
   - **Effect**: +20 relationship
   - **Why Hidden**: Selvinteressert, ikke stolt av det

3. **Tech Enthusiast** ("Tech Enthusiast")
   - **Trigger**: Player has advanced tech
   - **Effect**: +15 relationship
   - **Why Hidden**: Admiration, ikke core value

4. **Militarist** ("Militarist")
   - **Trigger**: Player has strong military
   - **Effect**: +15 relationship
   - **Why Hidden**: Respekt for strength, ikke ideologi

5. **Diplomat** ("Diplomat")
   - **Trigger**: Player has high trust (70+)
   - **Effect**: +20 relationship
   - **Why Hidden**: Soft power preference

6. **Opportunist** ("Opportunist")
   - **Trigger**: Situation is mutually beneficial
   - **Effect**: +10 relationship
   - **Why Hidden**: Selvinteressert, ikke ærlig

7. **Trade Partner** ("Trade Partner")
   - **Trigger**: Player has high production
   - **Effect**: +15 relationship
   - **Why Hidden**: Economic focus

8. **Cultural Preservationist** ("Cultural Preservationist")
   - **Trigger**: Player respects culture (future mechanic)
   - **Effect**: +15 relationship
   - **Why Hidden**: Cultural pride

### 3.3 Teknisk Arkitektur

#### Agenda Data Structure

```typescript
interface Agenda {
  id: string
  type: 'primary' | 'hidden' | 'situational'
  name: string
  description: string
  isRevealed: boolean
  modifiers: AgendaModifier[]
  checkCondition: (player: Nation, ai: Nation, gameState: any) => boolean
}

interface AgendaModifier {
  condition: string
  effect: number  // Relationship modifier
  description: string
  evaluationBonus?: number  // Bonus for negotiation evaluation
}
```

#### Agenda Assignment

```typescript
// Ved game start
function initializeNationAgendas(nations: Nation[], playerNationId: string) {
  return nations.map(nation => {
    if (nation.id === playerNationId) return nation

    // Pick random primary agenda
    const primary = pickRandom(PRIMARY_AGENDAS)
    primary.isRevealed = true

    // Pick random hidden agenda (different from primary)
    const hidden = pickRandom(HIDDEN_AGENDAS.filter(a => a.id !== primary.id))
    hidden.isRevealed = false

    return {
      ...nation,
      agendas: [primary, hidden]
    }
  })
}
```

#### Agenda Checking

```typescript
// I AI evaluation
function evaluateProposal(proposal, aiNation, playerNation, gameState) {
  // ... existing evaluation logic

  // Add agenda modifier
  const agendaModifier = calculateAgendaModifier(playerNation, aiNation, gameState)
  finalScore += agendaModifier

  // Add agenda feedback
  if (Math.abs(agendaModifier) > 10) {
    const violations = checkAgendaViolations(playerNation, aiNation, gameState)
    if (violations.length > 0) {
      feedback += ` Your actions violate my ${violations[0].name} values.`
    }
  }

  return evaluation
}
```

#### Agenda Revelation

```typescript
// Hver turn
function processAgendaRevelations(nations, playerNation, currentTurn) {
  return nations.map(nation => {
    if (nation.id === playerNation.id) return nation

    const relationship = getRelationship(nation, playerNation.id)
    const trust = getTrust(nation, playerNation.id)
    const turnsKnown = currentTurn - nation.firstContactTurn[playerNation.id]

    // Reveal hidden agenda if:
    // 1. High relationship (>25) AND good trust (>60) AND time (>10 turns)
    // 2. Very long contact (>30 turns)
    // 3. Alliance established (>15 turns)

    if (shouldRevealAgenda(relationship, trust, turnsKnown)) {
      const hiddenAgenda = nation.agendas.find(a => !a.isRevealed)
      if (hiddenAgenda) {
        hiddenAgenda.isRevealed = true
        log(`You've learned more about ${nation.name}'s motivations: ${hiddenAgenda.name}`)
      }
    }

    return nation
  })
}
```

### 3.4 Integrasjons-Punkter

**1. Game Initialization** (`Index.tsx` eller equivalent):
```typescript
// Ved game start
nations = initializeNationAgendas(nations, playerNationId)
```

**2. AI Evaluation** (`aiNegotiationEvaluator.ts`):
```typescript
const agendaBonus = calculateAgendaNegotiationBonus(playerNation, aiNation, gameState)
finalScore += agendaBonus
```

**3. Turn Processing** (`Index.tsx` AI turn eller end turn):
```typescript
const { nations: updated, revelations } = processAgendaRevelations(nations, playerNation, turn)
setNations(updated)

revelations.forEach(r => {
  log(`💡 ${r.nation.name} revealed: ${r.agenda.name} - ${r.agenda.description}`)
})
```

**4. UI Display** (`LeaderContactModal.tsx`):
```typescript
<div className="agendas-section">
  <h3>Known Traits</h3>
  {nation.agendas?.map(agenda => (
    agenda.isRevealed ? (
      <div key={agenda.id} className="agenda-item">
        <strong>{agenda.name}</strong>
        <p>{agenda.description}</p>
        {checkAgendaViolation(agenda) && (
          <div className="warning">⚠️ Your actions concern them</div>
        )}
      </div>
    ) : (
      <div key="hidden" className="agenda-hidden">
        ❓ Unknown Trait (Build relationship to learn more)
      </div>
    )
  ))}
</div>
```

---

## 4. BALANSERING OG TUNING

### 4.1 Relationship Modifiers

**Retningslinjer**:
- Primary agendas: **±15 til ±30** (sterkere impact)
- Hidden agendas: **±10 til ±20** (moderate impact)
- Violations: Negative modifiers større enn bonuses (straff > belønning)

**Eksempler**:
- Anti-Nuclear: -30 hvis nukes brukt, +10 hvis ingen nukes
- Loyal Friend: +25 for lang alliance, -40 hvis broken
- Expansionist: +15 for mange byer

### 4.2 Evaluation Bonuses

**Retningslinjer**:
- Multiply relationship modifiers by 2-4 for negotiation context
- Violations kan blokkere deals helt

**Eksempler**:
- Anti-Nuclear violation: -100 evaluation bonus (nesten umulig å ally)
- Loyal Friend bonus: +60 (mye lettere å få favorable deals)
- Resource Hungry: +50 hvis player offers resources

### 4.3 Revelation Timing

**Balansering**:
- Ikke for tidlig: Spilleren må "jobbe" for informasjonen
- Ikke for sent: Spilleren må kunne bruke kunnskapen

**Testede Thresholds**:
- **High Trust Path**: Relationship >25 AND Trust >60 AND 10+ turns
- **Time Path**: 30+ turns of contact (selv uten high relationship)
- **Alliance Path**: Alliance established for 15+ turns
- **Future: Embassy Path**: Automatic revelation when embassy built

---

## 5. PLAYER EXPERIENCE

### 5.1 Discovery Flow

**Turn 1-5**: Første kontakt
- Ser kun primary agenda
- "This leader is an Isolationist. They value independence."

**Turn 10-20**: Bygge relationship
- Prøver å unngå å krenke primary agenda
- Spekulerer på hidden agenda
- "Why do they like me more when I send aid? Maybe Resource Hungry?"

**Turn 20-30**: Revelation
- Hidden agenda avsløres
- "Aha! They are a Diplomat. That's why trust matters so much."

**Turn 30+**: Strategic Leverage
- Kan nå spille på begge agendaer
- "I'll maintain high trust and avoid nukes to keep them happy"

### 5.2 Strategic Choices

**Scenario 1: Anti-Nuclear Leder**:
- **Dilemma**: Trenger nukes for forsvar, men vil ha alliance
- **Choice**:
  - Bruker nukes → Mister alliance
  - Ingen nukes → Får alliance men er sårbar
  - Strategisk: Allier med dem FØRST, så build nukes senere

**Scenario 2: Warmonger Hater + Militarist (Hidden)**:
- **Dilemma**: Hater kriger, men respekterer militær styrke
- **Choice**:
  - Build stor defensiv hær → Oppfyller hidden agenda
  - Ikke declarer kriger → Oppfyller primary agenda
  - Perfect balance mulig!

**Scenario 3: Loyal Friend**:
- **Dilemma**: Annen nation tilbyr bedre alliance
- **Choice**:
  - Bryt alliance → -40 permanent penalty
  - Behold alliance → Mister bedre tilbud
  - Langsiktig loyalty kan betale seg

### 5.3 Feedback og Learning

**Positive Feedback**:
- "Our relationship improves as you respect our isolation" (+10)
- "Your peaceful ways align with our values" (+20)
- "Our alliance has proven its worth over time" (+25)

**Negative Feedback**:
- "Your use of nuclear weapons is unacceptable to us" (-30)
- "You have declared too many wars" (-25)
- "You betrayed our trust" (-40)

**Revelation Feedback**:
- "💡 You've learned more about [Nation]'s motivations:"
- "They are a [Agenda Name]: [Description]"
- "This explains their previous reactions to your actions."

---

## 6. IMPLEMENTASJONS-FORDELER

### 6.1 Code Reuse

**Eksisterende Systemer som Kan Brukes**:
- Relationship system (allerede har modifiers)
- Trust system (kan trigger revelations)
- Favor system (noen agendaer relatert til aid)
- Grievance system (violations kan skape grievances)
- AI personality types (kombinerer med agendaer)

**Minimal New Code**:
- Agenda definitions (~200 lines)
- Agenda checking logic (~100 lines)
- Revelation system (~50 lines)
- UI display (~100 lines)
- **Total: ~450 lines ny kode**

### 6.2 Replay Value

**Før**:
- Alle spill føles like
- AI oppfører seg likt hver gang
- Ingen discovery mechanic

**Etter**:
- Hver AI har unique combination (8 x 8 = 64 mulige kombinasjoner)
- Hidden agendas endres per playthrough
- Discovery av agendaer gir progression
- Strategic choices basert på agendaer

### 6.3 AI Depth

**Før**:
- "Russia rejected my proposal" (ingen forklaring)
- Spilleren gjetter hvorfor

**Etter**:
- "Russia rejected my proposal: 'Your use of nuclear weapons is unacceptable to us'"
- Spilleren vet nøyaktig hvorfor
- Kan tilpasse strategi basert på feedback

---

## 7. RISIKO-ANALYSE

### 7.1 Potensielle Problemer

**1. Balansering**:
- **Risk**: Agendaer kan være for sterke/svake
- **Mitigation**: Start conservative, iterate basert på testing
- **Fallback**: Juster modifiers i agendaDefinitions.ts

**2. Too Predictable**:
- **Risk**: Spilleren kan "game" systemet for lett
- **Mitigation**: Hidden agendas gir variasjon, random assignment
- **Fallback**: Legg til flere hidden agendas over tid

**3. Not Impactful Enough**:
- **Risk**: Agendaer føles som flavor text, ikke strategic
- **Mitigation**: Sørg for at modifiers faktisk påvirker deals
- **Fallback**: Øk evaluation bonuses

**4. UI Complexity**:
- **Risk**: For mye informasjon kan overvelde spilleren
- **Mitigation**: Progressive disclosure (reveal over time)
- **Fallback**: Simplify display, fokus på violations

### 7.2 Mitigations

**Testing Plan**:
1. Implementer basic system
2. Test med konservative modifiers
3. Samle feedback på om agendaer føles meningsfulle
4. Iterate på values
5. Legg til flere agendaer hvis nødvendig

**Fallback Strategi**:
- Hvis systemet ikke fungerer, kan vi disable uten å ødelegge existing code
- Agendaer er additive, ikke destructive

---

## 8. REFERANSER

### 8.1 Civilization Resources

- [Civilization VI: Leader Agendas](https://civilization.fandom.com/wiki/Leader_Agendas_(Civ6))
- [Civ VI: Hidden Agendas](https://civilization.fandom.com/wiki/Hidden_agenda_(Civ6))
- [r/civ discussions on agenda system](https://www.reddit.com/r/civ/search?q=agenda+system)

### 8.2 Game Design

- "Designing Emergent AI Personality" - GDC Talk
- "Making AI Memorable Without Dialogue" - Gamasutra Article
- "Reputation Systems in Strategy Games" - Game AI Pro

---

## 9. KONKLUSJON

Agenda-systemet vil gi hver AI i Vector War Games unique personlighet og motivasjoner. Ved å kombinere:
- **Primary agendas** (synlige, core values)
- **Hidden agendas** (discovery mechanic)
- **Eksisterende personality types**

Får vi AI som føles:
- **Distinkt**: Hver leder er unik
- **Lærbar**: Spilleren kan forstå og tilpasse
- **Strategic**: Reelle consequences for handlinger
- **Dynamic**: Hidden agendas gir replay value

**Implementation er rett frem**:
- Definere agendaer (~200 lines)
- Checking logic (~100 lines)
- Revelation system (~50 lines)
- UI display (~100 lines)
- Integration (~50 lines)

**Total: ~500 lines ny kode for major feature**

**Neste steg**: Implementation Plan (se AGENDA_SYSTEM_IMPLEMENTATION_PLAN.md)
