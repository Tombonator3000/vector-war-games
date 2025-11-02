# Implementasjonsplan: Agenda-System for AI Leder-Personligheter

**Opprettet**: 2025-11-02
**Status**: Implementation Ready
**Estimert Total Tid**: 1-2 uker

---

## OVERSIKT

Dette dokumentet beskriver den detaljerte implementasjonsplanen for Phase 4 av diplomati-systemet: Agenda-System for Unique Leader Personalities. Systemet vil gi hver AI leder:
- 1 Primary Agenda (alltid synlig)
- 1 Hidden Agenda (avsløres over tid)
- Unique personlighet som påvirker alle diplomatiske beslutninger

**Status av Eksisterende Implementasjon**:
- ✅ `src/lib/agendaDefinitions.ts` - 8 primary + 8 hidden agendas definert
- ✅ `src/lib/agendaSystem.ts` - Core functionality implementert
- ✅ `src/types/negotiation.ts` - Agenda types definert
- ⏳ Integration med game initialization - IKKE GJORT
- ⏳ Integration med AI evaluation - IKKE GJORT
- ⏳ Integration med turn processing - IKKE GJORT
- ⏳ UI components - IKKE GJORT
- ⏳ Testing - IKKE GJORT

---

## OPPGAVER

### Oppgave 4.1: Integrer Agenda Assignment ved Game Start

**Fil**: `src/pages/Index.tsx` eller equivalent game initialization
**Varighet**: 0.5-1 dag

**Beskrivelse**: Kalle `initializeNationAgendas()` når spillet starter for å gi alle AI nations agendaer.

**Implementasjon**:

```typescript
import { initializeNationAgendas } from '@/lib/agendaSystem';

// I game initialization (finn existing nation setup code)
// Etter at nations er opprettet, men før spillet starter:

const nationsWithAgendas = initializeNationAgendas(
  nations,
  playerNationId,
  seededRng  // Bruk seeded RNG for reproducibility
);

setNations(nationsWithAgendas);

// Log for debugging
log('=== LEADER AGENDAS ===');
nationsWithAgendas.forEach(nation => {
  if (nation.id !== playerNationId) {
    const primary = nation.agendas?.find(a => a.type === 'primary');
    const hidden = nation.agendas?.find(a => a.type === 'hidden');
    log(`${nation.name}:`);
    log(`  Primary: ${primary?.name}`);
    log(`  Hidden: ${hidden?.name} (not revealed)`);
  }
});
```

**Steg**:
1. Finn hvor nations initialiseres i Index.tsx
2. Import `initializeNationAgendas` fra agendaSystem
3. Kall funksjonen etter nations er opprettet
4. Test at hver AI får agendaer
5. Verifiser at player nation ikke får agendaer
6. Verifiser at primary er revealed, hidden ikke revealed

**Akseptanskriterier**:
- [ ] Hver AI nation har `agendas` array med 2 items
- [ ] Primary agenda har `isRevealed: true`
- [ ] Hidden agenda har `isRevealed: false`
- [ ] Player nation har ingen agendaer
- [ ] Bruker seeded RNG (samme seed = samme agendaer)
- [ ] Logger agendaer for debugging

**Estimert Tid**: 2-3 timer

---

### Oppgave 4.2: Integrer Agendaer i AI Evaluation System

**Fil**: `src/lib/aiNegotiationEvaluator.ts`
**Varighet**: 1 dag

**Beskrivelse**: Agendaer skal påvirke AI's evaluering av forhandlinger.

**Endringer i `evaluateNegotiation()`**:

```typescript
import {
  calculateAgendaNegotiationBonus,
  getAgendaFeedback,
  checkAgendaViolations
} from '@/lib/agendaSystem';

export function evaluateNegotiation(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[],
  currentTurn: number
): AIEvaluation {
  // ... existing evaluation logic ...

  // ADD: Calculate agenda bonus/penalty
  const agendaBonus = calculateAgendaNegotiationBonus(
    playerNation,
    aiNation,
    { nations: allNations, turn: currentTurn }
  );

  // ADD: Apply agenda bonus to final score
  const finalScore = modifiedValue + personalityBonus + strategicValue + agendaBonus;

  // ... existing acceptance probability calculation ...

  // ADD: Check for agenda violations
  const violations = checkAgendaViolations(
    playerNation,
    aiNation,
    { nations: allNations, turn: currentTurn }
  );

  // ADD: Generate agenda-aware feedback
  let feedback = generateNegotiationFeedback(evaluation, aiNation, playerNation);

  if (violations.length > 0 && Math.abs(agendaBonus) > 20) {
    const agendaMessages = getAgendaFeedback(
      playerNation,
      aiNation,
      { nations: allNations, turn: currentTurn }
    );

    if (agendaMessages.length > 0) {
      feedback += ` ${agendaMessages[0]}`;
    }
  }

  return {
    // ... existing fields ...
    agendaBonus,  // ADD this field
    feedback,     // Now includes agenda feedback
  };
}
```

**Steg**:
1. Import agenda functions i aiNegotiationEvaluator.ts
2. Add `agendaBonus` calculation
3. Apply to final score
4. Check for violations
5. Add violation messages to feedback
6. Test med forskjellige scenarier
7. Verify at agendaer faktisk påvirker acceptance

**Test Scenarier**:

**Test 1: Anti-Nuclear Violation**:
```typescript
// Setup:
// - AI has Anti-Nuclear primary agenda
// - Player has used nukes (player.warheads > 0)
//
// Expected:
// - agendaBonus: -100
// - Acceptance probability drastically reduced
// - Feedback: "Your use of nuclear weapons is unacceptable to us"
```

**Test 2: Loyal Friend Bonus**:
```typescript
// Setup:
// - AI has Loyal Friend primary agenda
// - Player has alliance for 30+ turns
//
// Expected:
// - agendaBonus: +60
// - Acceptance probability increased
// - Feedback: "Our alliance has stood the test of time"
```

**Test 3: Resource Hungry (Hidden, Not Revealed)**:
```typescript
// Setup:
// - AI has Resource Hungry hidden agenda (NOT revealed)
// - Player offers resources
//
// Expected:
// - agendaBonus: +50 (still applies internally)
// - NO feedback about agenda (since hidden)
```

**Akseptanskriterier**:
- [ ] `agendaBonus` kalkuleres korrekt
- [ ] Bonus påvirker final score
- [ ] Violations reduserer acceptance
- [ ] Bonuses øker acceptance
- [ ] Feedback inkluderer agenda violations
- [ ] Hidden agendas påvirker evaluation BUT feedback bare for revealed
- [ ] Tests passerer for alle 3 scenarier

**Estimert Tid**: 4-6 timer

---

### Oppgave 4.3: Integrer Agendaer i Diplomatic Triggers (AI Proactive Diplomacy)

**Fil**: `src/lib/aiNegotiationTriggers.ts` eller `src/lib/aiNegotiationContentGenerator.ts`
**Varighet**: 0.5 dag

**Beskrivelse**: AI bør ta hensyn til agendaer når de vurderer å initiere diplomati.

**Endringer i AI Trigger Logic**:

```typescript
import { checkAgendaViolations } from '@/lib/agendaSystem';

// I checkWarningTrigger() eller lignende:
export function checkWarningTrigger(
  aiNation: Nation,
  playerNation: Nation,
  gameState: any
): boolean {
  const relationship = getRelationship(aiNation, playerNation.id);

  // ADD: Check agenda violations
  const violations = checkAgendaViolations(playerNation, aiNation, gameState);

  // If player violates agenda AND relationship not too bad yet
  return violations.length > 0 && relationship > -30;
}

// I generateWarning():
export function generateWarning(
  aiNation: Nation,
  playerNation: Nation,
  gameState: any
): { negotiation: NegotiationState; message: string } {
  const violations = checkAgendaViolations(playerNation, aiNation, gameState);

  let message = 'Your actions concern me.';

  if (violations.length > 0) {
    const violation = violations[0];
    message = `Your actions violate my ${violation.name} values. ${violation.description}. Change course or face consequences.`;
  }

  // ... create negotiation ...

  return { negotiation, message };
}
```

**Steg**:
1. Import `checkAgendaViolations` i trigger files
2. Check agendas i warning trigger
3. Use agenda info i warning messages
4. Test at AI gir warnings ved violations
5. Verify at messages er specific til agendaer

**Test Scenari**:

**Test: Anti-Nuclear Warning**:
```typescript
// Setup:
// - AI has Anti-Nuclear agenda
// - Player acquires many warheads
//
// Expected:
// - Warning trigger fires
// - Message: "Your nuclear buildup violates my Nuclear Pacifist values. Your use of nuclear weapons is unacceptable to us. Change course or face consequences."
```

**Akseptanskriterier**:
- [ ] Warnings trigger basert på agenda violations
- [ ] Warning messages inkluderer agenda info
- [ ] Only triggers for revealed agendas (ikke hidden)
- [ ] Test scenario passerer

**Estimert Tid**: 2-3 timer

---

### Oppgave 4.4: Integrer Agenda Revelation i Turn Processing

**Fil**: `src/pages/Index.tsx`
**Varighet**: 0.5 dag

**Beskrivelse**: Hver turn skal systemet sjekke om hidden agendas bør avsløres.

**Implementasjon**:

```typescript
import { processAgendaRevelations } from '@/lib/agendaSystem';

// I end-of-turn processing eller start-of-turn:
// (Finn eksisterende turn update logic)

function endTurn() {
  // ... existing turn logic ...

  // ADD: Process agenda revelations
  const { nations: nationsAfterRevelations, revelations } = processAgendaRevelations(
    nations,
    playerNation,
    turn
  );

  // Update nations with revealed agendas
  setNations(nationsAfterRevelations);

  // Show notifications for revelations
  revelations.forEach(revelation => {
    const nation = nationsAfterRevelations.find(n => n.id === revelation.nationId);

    log(`💡 You've learned more about ${nation?.name}'s motivations:`);
    log(`   ${revelation.agenda.name}: ${revelation.agenda.description}`);

    // Optional: Show modal notification
    // setNotification({
    //   type: 'agenda-revealed',
    //   nation: nation,
    //   agenda: revelation.agenda
    // });
  });

  // ... rest of turn logic ...
}
```

**Steg**:
1. Finn turn processing logic i Index.tsx
2. Import `processAgendaRevelations`
3. Kall funksjonen hver turn
4. Update nations state
5. Show notifications for revelations
6. Test at agendaer avsløres over tid

**Test Scenario**:

**Test: High Relationship Revelation**:
```typescript
// Setup:
// - Turn 1: First contact with AI
// - Build relationship to >25
// - Build trust to >60
// - Wait 10 turns
//
// Expected:
// - Turn 11: Hidden agenda revealed
// - Notification shown
// - Agenda now visible in UI
```

**Test: Long Contact Revelation**:
```typescript
// Setup:
// - Neutral relationship (0-20)
// - Low/medium trust (30-50)
// - Wait 30 turns
//
// Expected:
// - Turn 31: Hidden agenda revealed (time-based)
```

**Akseptanskriterier**:
- [ ] `processAgendaRevelations` kalles hver turn
- [ ] Revelations trigger basert på conditions
- [ ] Notifications vises til player
- [ ] Agendas oppdateres til `isRevealed: true`
- [ ] Test scenarier passerer

**Estimert Tid**: 2-3 timer

---

### Oppgave 4.5: Implementer Agenda Display i LeaderContactModal

**Fil**: `src/components/LeaderContactModal.tsx`
**Varighet**: 1 dag

**Beskrivelse**: Vise agendaer i Leader Contact Modal.

**UI Design**:

```tsx
import { getNationAgendas, checkAgendaViolations } from '@/lib/agendaSystem';

// I LeaderContactModal component:

const agendas = getNationAgendas(targetNation);
const violations = checkAgendaViolations(playerNation, targetNation, {
  nations: allNations,
  turn: currentTurn
});

return (
  <div className="leader-contact-modal">
    {/* ... existing modal content ... */}

    {/* ADD: Agendas Section */}
    <div className="agendas-section">
      <h3 className="section-title">Leader Traits</h3>

      {agendas.length === 0 ? (
        <p className="no-agendas">No known traits yet</p>
      ) : (
        <div className="agendas-list">
          {agendas.map((agenda, index) => {
            const isViolated = violations.some(v => v.id === agenda.id);

            return agenda.isRevealed ? (
              <div
                key={agenda.id}
                className={`agenda-item ${isViolated ? 'violated' : ''}`}
              >
                <div className="agenda-header">
                  <span className="agenda-type">
                    {agenda.type === 'primary' ? '⭐' : '🔍'}
                  </span>
                  <strong className="agenda-name">{agenda.name}</strong>
                </div>

                <p className="agenda-description">{agenda.description}</p>

                {isViolated && (
                  <div className="violation-warning">
                    ⚠️ Your actions concern them
                  </div>
                )}

                {/* Show matching modifiers */}
                {agenda.checkCondition?.(playerNation, targetNation, {
                  nations: allNations,
                  turn: currentTurn
                }) && (
                  <div className="agenda-effect">
                    {agenda.modifiers
                      .filter(m => m.effect !== 0)
                      .map((modifier, i) => (
                        <span
                          key={i}
                          className={`modifier ${modifier.effect > 0 ? 'positive' : 'negative'}`}
                        >
                          {modifier.description}
                        </span>
                      ))
                    }
                  </div>
                )}
              </div>
            ) : (
              <div key={`hidden-${index}`} className="agenda-item agenda-hidden">
                <div className="agenda-header">
                  <span className="agenda-type">❓</span>
                  <strong className="agenda-name">Unknown Trait</strong>
                </div>
                <p className="agenda-description">
                  Build a better relationship to learn more about this leader
                </p>
                <div className="revelation-hint">
                  <small>
                    High relationship (>25) and trust (>60) for 10+ turns, or 30+ turns of contact
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* ... rest of modal ... */}
  </div>
);
```

**CSS Styling** (add to component or global styles):

```css
.agendas-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
  color: #fff;
}

.agendas-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.agenda-item {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  transition: all 0.2s;
}

.agenda-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.agenda-item.violated {
  border-color: rgba(255, 100, 100, 0.5);
  background: rgba(255, 100, 100, 0.1);
}

.agenda-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.agenda-type {
  font-size: 1.2rem;
}

.agenda-name {
  font-size: 0.95rem;
  color: #fff;
}

.agenda-description {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
}

.violation-warning {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 100, 100, 0.2);
  border-left: 3px solid rgba(255, 100, 100, 0.8);
  font-size: 0.8rem;
  color: #ffcccc;
  margin-top: 0.5rem;
}

.agenda-effect {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.modifier {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

.modifier.positive {
  background: rgba(100, 255, 100, 0.15);
  color: #aaffaa;
  border-left: 3px solid rgba(100, 255, 100, 0.8);
}

.modifier.negative {
  background: rgba(255, 100, 100, 0.15);
  color: #ffaaaa;
  border-left: 3px solid rgba(255, 100, 100, 0.8);
}

.agenda-hidden {
  opacity: 0.7;
  border-style: dashed;
}

.revelation-hint {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(100, 100, 255, 0.1);
  border-left: 3px solid rgba(100, 100, 255, 0.5);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}
```

**Steg**:
1. Import agenda functions i LeaderContactModal.tsx
2. Get agendas for target nation
3. Check for violations
4. Render agendas section
5. Style revealed vs hidden agendas differently
6. Highlight violations
7. Show positive/negative modifiers
8. Add revelation hints for hidden agendas
9. Test display for various scenarios

**Akseptanskriterier**:
- [ ] Primary agenda vises alltid (hvis assigned)
- [ ] Hidden agenda vises som "Unknown" hvis ikke revealed
- [ ] Revealed agendas viser full info
- [ ] Violations highlightes i red
- [ ] Bonuses highlightes i green
- [ ] Hints vises for hvordan reveal hidden agendas
- [ ] Responsive design
- [ ] Clean, readable styling

**Estimert Tid**: 4-6 timer

---

### Oppgave 4.6: Legg til Agenda Revelation Notification Component

**Fil**: `src/components/AgendaRevelationNotification.tsx` (new)
**Varighet**: 0.5 dag

**Beskrivelse**: Vise en pen notification når hidden agenda avsløres.

**Component**:

```tsx
import React from 'react';
import type { Nation } from '@/types/game';
import type { Agenda } from '@/types/negotiation';

interface AgendaRevelationNotificationProps {
  nation: Nation;
  agenda: Agenda;
  onClose: () => void;
}

export function AgendaRevelationNotification({
  nation,
  agenda,
  onClose
}: AgendaRevelationNotificationProps) {
  return (
    <div className="agenda-revelation-notification">
      <div className="notification-overlay" onClick={onClose} />

      <div className="notification-card">
        <div className="notification-header">
          <span className="icon">💡</span>
          <h3>New Insight Discovered</h3>
        </div>

        <div className="notification-body">
          <p className="nation-name">{nation.name}</p>

          <div className="agenda-info">
            <strong className="agenda-name">{agenda.name}</strong>
            <p className="agenda-description">{agenda.description}</p>
          </div>

          <p className="insight-text">
            You now understand this leader's motivations better. Use this knowledge
            in your diplomatic negotiations.
          </p>
        </div>

        <div className="notification-footer">
          <button onClick={onClose} className="close-btn">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
```

**CSS**:

```css
.agenda-revelation-notification {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.notification-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
}

.notification-card {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid rgba(100, 150, 255, 0.5);
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.notification-header .icon {
  font-size: 2rem;
}

.notification-header h3 {
  font-size: 1.5rem;
  color: #fff;
  margin: 0;
}

.notification-body {
  margin-bottom: 1.5rem;
}

.nation-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: rgba(100, 150, 255, 1);
  margin-bottom: 1rem;
}

.agenda-info {
  padding: 1rem;
  background: rgba(100, 150, 255, 0.1);
  border-left: 4px solid rgba(100, 150, 255, 0.8);
  border-radius: 4px;
  margin-bottom: 1rem;
}

.agenda-name {
  font-size: 1.1rem;
  color: #fff;
  display: block;
  margin-bottom: 0.5rem;
}

.agenda-description {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.insight-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.notification-footer {
  display: flex;
  justify-content: center;
}

.close-btn {
  padding: 0.75rem 2rem;
  background: rgba(100, 150, 255, 0.8);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(100, 150, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 150, 255, 0.4);
}
```

**Integration in Index.tsx**:

```typescript
import { AgendaRevelationNotification } from '@/components/AgendaRevelationNotification';

// State for revelation notification
const [agendaRevelation, setAgendaRevelation] = useState<{
  nation: Nation;
  agenda: Agenda;
} | null>(null);

// In endTurn() or wherever revelations are processed:
revelations.forEach(revelation => {
  const nation = nationsAfterRevelations.find(n => n.id === revelation.nationId);

  if (nation) {
    // Show notification
    setAgendaRevelation({
      nation,
      agenda: revelation.agenda
    });
  }
});

// In render:
{agendaRevelation && (
  <AgendaRevelationNotification
    nation={agendaRevelation.nation}
    agenda={agendaRevelation.agenda}
    onClose={() => setAgendaRevelation(null)}
  />
)}
```

**Akseptanskriterier**:
- [ ] Notification vises når agenda avsløres
- [ ] Clean, attractive design
- [ ] Shows nation name, agenda name, and description
- [ ] Can be dismissed
- [ ] Smooth animations
- [ ] Only one notification at a time (queue if multiple)

**Estimert Tid**: 2-3 timer

---

### Oppgave 4.7: Testing og Debugging

**Varighet**: 1 dag

**Beskrivelse**: Grundig testing av hele agenda-systemet.

**Test Cases**:

**1. Initialization Test**:
```typescript
test('Each AI nation gets agendas on game start', () => {
  // Start new game
  // Verify each AI has 2 agendas
  // Verify primary is revealed, hidden is not
  // Verify no duplicates (primary !== hidden)
});
```

**2. Evaluation Test**:
```typescript
test('Anti-Nuclear agenda affects negotiation', () => {
  // Setup: AI with Anti-Nuclear, player with nukes
  // Propose alliance
  // Expect: Low acceptance, negative feedback
});

test('Loyal Friend gives bonus', () => {
  // Setup: AI with Loyal Friend, 30+ turn alliance
  // Propose trade
  // Expect: Higher acceptance, positive feedback
});
```

**3. Revelation Test**:
```typescript
test('Hidden agenda reveals after high relationship', () => {
  // Setup: Relationship 30, trust 70
  // Advance 10 turns
  // Expect: Hidden agenda revealed, notification shown
});

test('Hidden agenda reveals after long contact', () => {
  // Setup: Neutral relationship
  // Advance 30 turns
  // Expect: Hidden agenda revealed
});
```

**4. UI Test**:
```typescript
test('Agendas display correctly in LeaderContactModal', () => {
  // Open modal for AI with agendas
  // Verify primary agenda visible
  // Verify hidden agenda shows as "Unknown"
  // Verify violations highlighted
});
```

**5. Trigger Test**:
```typescript
test('AI warns player about agenda violation', () => {
  // Setup: Player violates Anti-Nuclear agenda
  // Advance turn
  // Expect: AI sends warning negotiation
});
```

**Manual Testing Checklist**:
- [ ] Start new game → All AIs get agendas
- [ ] Check logs → Agendas logged correctly
- [ ] Open LeaderContactModal → Agendas display
- [ ] Build relationship → Hidden agenda reveals
- [ ] Violate agenda → Relationship drops, feedback shown
- [ ] Try negotiation → Agendas affect acceptance
- [ ] Multiple playthroughs → Different hidden agendas

**Bug Tracking**:
- [ ] Create GitHub issues for bugs found
- [ ] Fix critical bugs before completion
- [ ] Document known issues

**Akseptanskriterier**:
- [ ] All unit tests pass
- [ ] Manual testing checklist completed
- [ ] No critical bugs
- [ ] Performance acceptable

**Estimert Tid**: 6-8 timer

---

### Oppgave 4.8: Dokumentasjon og Polishing

**Varighet**: 0.5 dag

**Beskrivelse**: Oppdatere dokumentasjon og polere systemet.

**Documentation Updates**:

1. **Update NEGOTIATION_TASKS.md**:
   - Mark Phase 4 tasks as completed
   - Update progress tracking

2. **Update README** (hvis relevant):
   - Add section on agenda system
   - Explain how it works for players

3. **Code Documentation**:
   - Ensure all functions have TSDoc comments
   - Add inline comments for complex logic

4. **Player Guide**:
   - Hvordan agendaer fungerer
   - Hvordan avsløre hidden agendas
   - Tips for å unngå violations

**Code Polishing**:
- [ ] Remove console.logs (eller bruk proper logging)
- [ ] Check TypeScript types (no @ts-ignore hvis mulig)
- [ ] Ensure consistent code style
- [ ] Refactor any messy code

**Akseptanskriterier**:
- [ ] Documentation updated
- [ ] Code clean and well-commented
- [ ] No unnecessary console.logs
- [ ] TypeScript types proper

**Estimert Tid**: 2-3 timer

---

## OPPSUMMERING

### Total Estimert Tid

| Oppgave | Tid |
|---------|-----|
| 4.1: Agenda Assignment Integration | 0.5 dag |
| 4.2: AI Evaluation Integration | 1 dag |
| 4.3: Diplomatic Triggers Integration | 0.5 dag |
| 4.4: Turn Processing Integration | 0.5 dag |
| 4.5: UI Display | 1 dag |
| 4.6: Notification Component | 0.5 dag |
| 4.7: Testing | 1 dag |
| 4.8: Documentation | 0.5 dag |

**TOTAL**: **5-6 dager** (1-1.5 uker)

### Dependencies

```
Oppgave 4.1 (Initialization)
  ↓
Oppgave 4.2 (Evaluation) ←──┐
Oppgave 4.3 (Triggers) ←────┤ Can be parallel
Oppgave 4.4 (Turn Processing) ←┤
  ↓
Oppgave 4.5 (UI Display)
Oppgave 4.6 (Notifications)
  ↓
Oppgave 4.7 (Testing)
  ↓
Oppgave 4.8 (Documentation)
```

### Milestones

**M1: Core Integration Complete** (After 4.1-4.4):
- Agendas assigned at game start
- Agendas affect AI decisions
- Agendas reveal over time

**M2: UI Complete** (After 4.5-4.6):
- Players can see agendas
- Revelations look good

**M3: Release Ready** (After 4.7-4.8):
- Tested and polished
- Documented

---

## NESTE STEG

1. ✅ Research complete (AGENDA_SYSTEM_RESEARCH.md)
2. ✅ Implementation plan complete (this document)
3. ⏭️ Start Implementation (Oppgave 4.1)
4. ⏭️ Test as you go
5. ⏭️ Create Summary and Task Tracker

---

## NOTATER

- Agenda definitions og core logic allerede implementert
- Fokus på integration og UI
- Should be straightforward implementation
- Testing viktig for å verifisere at agendas faktisk matter

**Last Updated**: 2025-11-02
**Status**: Klar for implementering
