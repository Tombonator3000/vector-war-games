# DEFCON SYSTEM COMPREHENSIVE AUDIT

## 1. DEFCON DEFINITION AND STORAGE

### Type Definition
- **File**: `/home/user/vector-war-games/src/types/game.ts` (lines 45-53)
- **Structure**: `DefconChangeEvent` interface tracking all DEFCON changes
  ```typescript
  interface DefconChangeEvent {
    turn: number;
    previousDefcon: number;
    newDefcon: number;
    reason: string;
    category: 'escalation' | 'de-escalation';
    triggeredBy: 'player' | 'ai' | 'event' | 'system';
    timestamp: number;
  }
  ```

### State Management
- **Primary Storage**: `/home/user/vector-war-games/src/state/GameStateManager.ts` (lines 93, 310-319)
  - Initial value: `defcon: 5` (FADE OUT - most peaceful)
  - Clamped range: 1-5 (Math.max(1, Math.min(5, defcon)))
  - Public getter: `static getDefcon(): number`
  - Public setter: `static setDefcon(defcon: number): void`
  - History tracking: `defconHistory` array with `addDefconChangeEvent()` method

### DEFCON Levels Explained
- **Level 5 (FADE OUT)**: Peace, minimal threat
- **Level 4 (DOUBLE TAKE)**: Heightened readiness
- **Level 3 (ROUND HOUSE)**: Increased alert
- **Level 2 (FAST PACE)**: Danger imminent, armed forces ready
- **Level 1 (NUCLEAR WAR)**: Maximum alert, nuclear war imminent

### Scenario Starting Values
- **File**: `/home/user/vector-war-games/src/types/scenario.ts` (lines 81, 122-234)
  - `coldWar`: startingDefcon: 5
  - `cubanCrisis`: startingDefcon: 3
  - `modernEra`: startingDefcon: 5
  - `longGame`: startingDefcon: 5
  - `greatOldOnes`: startingDefcon: 2 (cosmic threat)

---

## 2. MECHANISMS THAT RAISE DEFCON (De-escalation, lower number)

### A. FLASHPOINT OUTCOMES
- **File**: `/home/user/vector-war-games/src/hooks/useFlashpoints.ts`
- **Processing**: `/home/user/vector-war-games/src/pages/Index.tsx` (lines 14016-14036)
- When flashpoint outcomes contain a `defcon` field, it's applied directly to game state
- Examples of de-escalating flashpoint outcomes (DEFCON increases - NUMBER GOES UP):
  - Line 280: `success: { defcon: 4, diplomacy: +25, newAlliance: true }`
  - Line 326: `success: { morale: -25, defcon: 1, isolationComplete: true }` [escalation]
  - Line 348: `success: { regimeFalls: true, millionsSaved: true, defcon: 3 }`
  - Line 490: `success: { diplomaticOpening: true, defcon: 3, negotiationPath: true }`
  - Line 518: `success: { falseAlarm: true, disasterAvoided: true, defcon: 3 }`
  - Multiple defcon: 2, 3, 4 outcomes scattered throughout

### B. AI ACTIONS
- **File**: `/home/user/vector-war-games/src/pages/Index.tsx` (lines 5291-5311)
  - AI escalation: `handleDefconChange(-1, "${n.name} escalates tensions through aggressive posturing", 'ai')`
  - AI de-escalation: `handleDefconChange(1, "${n.name} proposes diplomatic de-escalation", 'ai')`

### C. CUBAN CRISIS SPECIFIC FLASHPOINTS
- **File**: `/home/user/vector-war-games/src/hooks/useCubaCrisisFlashpointsEnhanced.ts`
- Examples:
  - Line 126: `success: { defcon: 2, ... }` (Naval Quarantine success)
  - Line 132: `failure: { ..., defcon: 1, ... }` (Soviet breakthrough escalation)
  - Line 321: `success: { defcon: 3, ... }`
  - Line 646: `success: { defcon: 3, ... }`
  - Line 845: `success: { defcon: 2, ... }`

### D. NUCLEAR LAUNCH CONSEQUENCES
- **File**: `/home/user/vector-war-games/src/lib/consequenceCalculator.ts` (lines 73-77)
  - Calculation logic for missile launch outcomes
  ```typescript
  let defconChange = 0;
  if (currentDefcon > 2) defconChange = -1;  // Escalate if above DEFCON 2
  if (currentDefcon > 3 && warheadYield >= 10) defconChange = -2;  // Double escalate
  const newDefcon = Math.max(1, currentDefcon + defconChange);
  ```
- Applied when nuclear missiles are launched by player

### E. SYSTEM EVENTS AND ORBITAL STRIKES
- **File**: `/home/user/vector-war-games/src/pages/Index.tsx`
  - Line 5291: AI aggressive posturing escalates (delta: -1)
  - Line 5306: AI diplomatic de-escalation reduces (delta: +1)
  - Line 7359: System event handling
  - Line 7451: Pandemic/biological escalation
  - Line 9000: War declaration (delta: -1)
  - Line 9662: Orbital strike escalation

---

## 3. MECHANISMS THAT LOWER DEFCON (Escalation, higher number)

Note: In game terms, LOWERING DEFCON means ESCALATING danger (DEFCON 5→1).
In terms of de-escalation, we RAISE the DEFCON number.

### A. DIPLOMATIC DE-ESCALATION
- **File**: `/home/user/vector-war-games/src/pages/Index.tsx` (line 5306)
  - AI proposes diplomatic de-escalation: `handleDefconChange(1, "${n.name} proposes diplomatic de-escalation", 'ai')`
  - Increases DEFCON (reduces danger) by 1

### B. PEACEFUL FLASHPOINT OUTCOMES
- Multiple flashpoint outcomes set DEFCON to 3 or 4
- Examples of de-escalating outcomes (numbers HIGHER than previous):
  - When quarantine succeeds, defcon goes to 2 but from crisis state
  - Diplomatic breakthroughs, false alarms, negotiated settlements

### C. TIME PASSING (Gradual De-escalation)
- **File**: `/home/user/vector-war-games/src/pages/Index.tsx` (lines 7359, 7451)
- System can gradually increase DEFCON during production/resolution phases
- Not automatic - controlled by game logic

---

## 4. ACTIONABLE TRIGGERS FOR DEFCON CHANGES

### A. CENTRALIZED DEFCON HANDLER
- **File**: `/home/user/vector-war-games/src/lib/gameUtils.ts` (lines 145-200)
- **Function**: `handleDefconChange(delta, reason, triggeredBy, callbacks)`
- **Parameters**:
  - `delta`: numeric change (-1 escalates, +1 de-escalates)
  - `reason`: descriptive text for DEFCON change
  - `triggeredBy`: 'player' | 'ai' | 'event' | 'system'
  - `callbacks`: Optional audio, logging, modal display, news generation
- **History Tracking**: Adds event to GameStateManager.defconHistory
- **Bounds**: Clamped to 1-5 range

### B. MODAL DISPLAY COMPONENT
- **File**: `/home/user/vector-war-games/src/components/DefconChangeModal.tsx` (lines 1-171)
- Displays DEFCON changes with:
  - Color coding (Red=1, Orange=2, Yellow=3, Blue=4, Green=5)
  - Previous/New DEFCON display
  - Reason for change
  - Trigger source (Player/AI/Event/System)
  - Critical warnings at DEFCON 1-2
  - Lovecraftian theme support for Great Old Ones scenario

### C. PLAYER-TRIGGERED CHANGES
1. **Nuclear Launch** (line 5285+): Forces DEFCON reduction
2. **War Declaration** (line 9000): Forces DEFCON reduction by 1
3. **Orbital Strikes** (line 9662): Forces DEFCON reduction with message
4. **Flashpoint Decisions**: Any flashpoint outcome can set DEFCON

### D. AI-TRIGGERED CHANGES
- **Aggressive Posturing**: Line 5291, escalates (delta: -1)
- **Diplomatic De-escalation**: Line 5306, de-escalates (delta: +1)
- Influenced by AI personality and current game state

### E. EVENT-TRIGGERED CHANGES
- **Flashpoint Outcomes**: Line 14016-14036
  - Process outcome.defcon field
  - Call handleDefconChange with 'event' source
  - Generate news, play audio, show modal
- **Pandemic/Biological Events**: Line 7451+
- **Accidental Launch Scenarios**: Various flashpoints

---

## 5. DEFCON EFFECTS ON GAMEPLAY

### A. ACTION RESTRICTIONS
- **File**: `/home/user/vector-war-games/src/lib/gameUtils.ts` (lines 102-106)
```typescript
export function canPerformAction(action: string, defcon: number): boolean {
  if (action === 'attack') return defcon <= 2;        // Attack only at DEFCON 2 or lower
  if (action === 'escalate') return defcon > 1;       // Can't escalate at DEFCON 1
  return true;
}
```

### B. VICTORY CONDITION IMPACT
- **File**: `/home/user/vector-war-games/src/lib/consequenceCalculator.ts` (lines 166-172)
  - Diplomatic victory BLOCKED if newDefcon <= 2
  - Nuclear warfare incompatible with peace victory

### C. FLASHPOINT PROBABILITY
- **File**: `/home/user/vector-war-games/src/hooks/useFlashpoints.ts` (lines 3453-3465)
```typescript
export function calculateFlashpointProbability(turn: number, defcon: number) {
  const baseProbability = 0.06;
  const turnMultiplier = 1 + Math.min(normalizedTurn / 75, 1.5);
  const probability = baseProbability * (6 - normalizedDefcon) * turnMultiplier;
  return Math.min(Math.max(probability, 0), 1);
}
```
- **Impact**: Lower DEFCON = Higher flashpoint probability
  - DEFCON 1: 5x base probability
  - DEFCON 2: 4x base probability
  - DEFCON 3: 3x base probability
  - DEFCON 4: 2x base probability
  - DEFCON 5: 1x base probability

### D. NEWS GENERATION
- **File**: `/home/user/vector-war-games/src/lib/politicalNews.ts` (lines 260-283)
```typescript
export function generateTensionNews(defcon: number, turn: number) {
  const chance = defcon <= 3 ? 0.3 : 0.15;  // 30% at low DEFCON, 15% at high
  return { priority: defcon <= 2 ? 'urgent' : 'important' };
}
```
- More tension news generated at lower DEFCON
- Higher priority news at critical levels

### E. PAYMENT RESTRICTIONS
- **File**: `/home/user/vector-war-games/src/pages/Index.tsx` (line 5204)
  - Some actions have DEFCON-based conditions for affordability/availability

---

## 6. DEFCON HISTORY AND TRACKING

### A. History Storage
- **File**: `/home/user/vector-war-games/src/state/GameStateManager.ts` (lines 324-336)
- Method: `getDefconHistory(): DefconChangeEvent[]`
- Method: `addDefconChangeEvent(event: DefconChangeEvent): void`
- Maintains chronological list of all DEFCON changes

### B. Event Recording
Every DEFCON change via `handleDefconChange()` creates:
- Turn number
- Previous/New DEFCON values
- Reason string
- Category ('escalation' or 'de-escalation')
- Trigger source ('player', 'ai', 'event', 'system')
- Timestamp

---

## 7. SPECIAL SCENARIO MECHANICS

### A. CUBAN MISSILE CRISIS
- **File**: `/home/user/vector-war-games/src/hooks/useCubaCrisisFlashpointsEnhanced.ts`
- Starting DEFCON: 3
- Multiple flashpoint chains affecting DEFCON
- Diplomatic integration with trust/favors system
- Third-party nation reactions affect outcomes

### B. GREAT OLD ONES SCENARIO
- **File**: `/home/user/vector-war-games/src/types/scenario.ts` (lines 214-234)
- Starting DEFCON: 2 (cosmic threat alert)
- Lovecraftian reskinning of DEFCON system:
  - "Veil Integrity" instead of DEFCON
  - Level labels: APOTHEOSIS, VEIL SHATTERED, VEIL FRACTURING, VEIL THINNING, VEIL INTACT
- **File**: `/home/user/vector-war-games/src/components/DefconChangeModal.tsx` (lines 35-43)
  - Custom labels for Great Old Ones scenario

---

## 8. COMPLETE FILE REFERENCE

### Core DEFCON System Files
1. **GameStateManager**: `/home/user/vector-war-games/src/state/GameStateManager.ts`
   - Lines 93, 310-319: DEFCON storage and accessors
   - Lines 324-336: History management

2. **Game Types**: `/home/user/vector-war-games/src/types/game.ts`
   - Lines 45-53: DefconChangeEvent interface
   - Line 321: defcon field in GameState

3. **Game Utilities**: `/home/user/vector-war-games/src/lib/gameUtils.ts`
   - Lines 102-106: Action restrictions by DEFCON
   - Lines 145-200: Central DEFCON change handler

4. **Scenarios**: `/home/user/vector-war-games/src/types/scenario.ts`
   - Lines 81, 122-234: DEFCON configuration per scenario

5. **Main Game Loop**: `/home/user/vector-war-games/src/pages/Index.tsx`
   - Lines 5204-5311: AI DEFCON actions and conditions
   - Lines 6491: Initial DEFCON from scenario
   - Lines 7359-7451: System event DEFCON changes
   - Lines 9000-9662: Player action DEFCON escalation
   - Lines 14016-14036: Flashpoint outcome application

### Flashpoint System Files
1. **Flashpoints**: `/home/user/vector-war-games/src/hooks/useFlashpoints.ts`
   - Lines 280-2034: 50+ flashpoint definitions with defcon outcomes
   - Lines 3453-3465: Flashpoint probability calculation

2. **Cuban Crisis**: `/home/user/vector-war-games/src/hooks/useCubaCrisisFlashpointsEnhanced.ts`
   - Lines 105-850+: Enhanced Cuban Crisis flashpoints

### Consequence and News Files
1. **Consequence Calculator**: `/home/user/vector-war-games/src/lib/consequenceCalculator.ts`
   - Lines 73-77: Nuclear launch DEFCON consequences

2. **Political News**: `/home/user/vector-war-games/src/lib/politicalNews.ts`
   - Lines 260-283: Tension news generation by DEFCON

3. **Manifestation Events**: `/home/user/vector-war-games/src/lib/manifestationEventSystem.ts`
   - Veil integrity tracking for Great Old Ones scenario

### UI Components
1. **DEFCON Modal**: `/home/user/vector-war-games/src/components/DefconChangeModal.tsx`
   - Lines 1-171: Display DEFCON changes to player

---

## 9. KEY SUMMARY

### Rising DEFCON (De-escalation - Safer)
- Player diplomatic victories
- AI proposing de-escalation
- Successful peaceful flashpoint resolutions
- Time passing during peaceful turns

### Lowering DEFCON (Escalation - Danger)
- Nuclear weapon launches
- War declarations
- Aggressive military actions
- Failed peaceful flashpoint resolutions
- AI aggressive posturing
- Accidental escalations

### Critical DEFCON Triggers
- DEFCON 1: Nuclear war imminent, most flashpoints likely
- DEFCON 2-3: High tension, frequent events
- DEFCON 4-5: Stable, fewer random events

### Player Control Points
1. Flashpoint decision outcomes
2. Nuclear weapons usage
3. War declarations
4. Military escalation actions
5. Diplomacy/negotiation choices

### AI Control Points
1. Personality-based escalation decisions
2. Response to player actions
3. Aggressive posturing
4. De-escalation proposals

### System Control Points
1. Flashpoint random generation (probability × DEFCON)
2. News generation frequency
3. Victory condition impacts
4. Action availability

---

