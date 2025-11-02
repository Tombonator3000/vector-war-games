# Interactive Negotiation System - Task List

**Status**: Ready for Implementation
**Total Estimated Time**: 6-10 weeks

---

## FASE 1: GRUNNLEGGENDE NEGOTIATION ENGINE (1-2 uker)

### Task 1.1: Definer TypeScript-typer ⏱️ 4-6 timer
- [ ] Create `src/types/negotiation.ts`
- [ ] Define `NegotiableItemType` union type
- [ ] Define `NegotiableItem` interface
- [ ] Define `NegotiationState` interface
- [ ] Define `NegotiationRound` interface
- [ ] Define `AIEvaluation` interface
- [ ] Define `CounterOffer` interface
- [ ] Define `LeaderContactState` interface
- [ ] Define `LeaderMood` type
- [ ] Define `VisibleLeaderInfo` interface
- [ ] Define `Agenda` interface
- [ ] Define `AgendaModifier` interface
- [ ] Define `DiplomaticAction` interface
- [ ] Define `AIInitiatedNegotiation` interface
- [ ] Define `NegotiationPurpose` type
- [ ] Add TSDoc comments to all types
- [ ] Export all types from index

**Acceptance Criteria**: All types compile without errors, well documented

---

### Task 1.2: Implementer negotiationUtils.ts ⏱️ 1-2 dager
- [ ] Create `src/lib/negotiationUtils.ts`
- [ ] Implement `createNegotiation()`
- [ ] Implement `addItemToOffer()`
- [ ] Implement `addItemToRequest()`
- [ ] Implement `removeItem()`
- [ ] Implement `calculateItemValue()` with all item types
- [ ] Implement `calculateTotalValue()`
- [ ] Implement `validateNegotiation()`
- [ ] Implement `canAffordItems()`
- [ ] Implement `applyNegotiationDeal()`
- [ ] Add context modifiers for item values
- [ ] Add relationship scaling for values

**Acceptance Criteria**: All functions work correctly, item values balanced

---

### Task 1.3: Implementer aiNegotiationEvaluator.ts ⏱️ 2-3 dager
- [ ] Create `src/lib/aiNegotiationEvaluator.ts`
- [ ] Implement `evaluateNegotiation()` with all factors
- [ ] Implement `generateCounterOffer()` with strategies
- [ ] Implement `generateNegotiationFeedback()` with templates
- [ ] Implement `aiConsiderInitiatingNegotiation()` with triggers
- [ ] Implement `shouldMakeCounterOffer()`
- [ ] Implement `getAIDesiredItems()`
- [ ] Implement `getAIOfferableItems()`
- [ ] Add personality biases
- [ ] Add relationship modifiers
- [ ] Add trust modifiers

**Acceptance Criteria**: AI evaluations logical, counter-offers reasonable

---

### Task 1.4: Implementer agendaSystem.ts ⏱️ 1-2 dager
- [ ] Create `src/lib/agendaSystem.ts`
- [ ] Define at least 6 primary agendas
- [ ] Define at least 6 hidden agendas
- [ ] Implement `assignAgendas()`
- [ ] Implement `checkAgendaViolations()`
- [ ] Implement `calculateAgendaModifier()`
- [ ] Implement `shouldRevealHiddenAgenda()`
- [ ] Implement `getAgendaFeedback()`
- [ ] Test each agenda's conditions

**Acceptance Criteria**: Agendas affect AI decisions, revelation works

---

### Task 1.5: Skriv Unit Tests for negotiationUtils ⏱️ 1 dag
- [ ] Create `src/lib/__tests__/negotiationUtils.test.ts`
- [ ] Test `createNegotiation()`
- [ ] Test `addItemToOffer()` and `addItemToRequest()`
- [ ] Test `removeItem()`
- [ ] Test `calculateItemValue()` for all item types
- [ ] Test `calculateTotalValue()`
- [ ] Test `validateNegotiation()` with valid and invalid cases
- [ ] Test `canAffordItems()`
- [ ] Test `applyNegotiationDeal()`
- [ ] Achieve >80% code coverage

**Acceptance Criteria**: All tests pass, >80% coverage

---

### Task 1.6: Skriv Integration Tests for aiNegotiationEvaluator ⏱️ 1-2 dager
- [ ] Create `src/lib/__tests__/aiNegotiationEvaluator.test.ts`
- [ ] Test `evaluateNegotiation()` with various scenarios
- [ ] Test `generateCounterOffer()` logic
- [ ] Test `generateNegotiationFeedback()` messages
- [ ] Test `aiConsiderInitiatingNegotiation()` triggers
- [ ] Test `shouldMakeCounterOffer()` conditions
- [ ] Test `getAIDesiredItems()` and `getAIOfferableItems()`
- [ ] Test all personality types
- [ ] Achieve >75% code coverage

**Acceptance Criteria**: All tests pass, major scenarios covered

---

### Task 1.7: Integrer med Eksisterende AI System ⏱️ 1 dag
- [ ] Modify `src/lib/aiDiplomacyEvaluator.ts` for multi-item support
- [ ] Modify `src/lib/aiDiplomacyActions.ts` to add `aiInitiateNegotiation()`
- [ ] Integrate with `aiAttemptDiplomacy()`
- [ ] Ensure backwards compatibility
- [ ] Run existing tests to verify no breaking changes

**Acceptance Criteria**: New system integrated, old tests still pass

---

## FASE 2: UI KOMPONENTER (2-3 uker)

### Task 2.1: Implementer LeaderContactModal ⏱️ 2-3 dager
- [ ] Create `src/components/LeaderContactModal.tsx`
- [ ] Design layout and structure
- [ ] Add leader avatar component
- [ ] Display relationship, trust, favors
- [ ] Display mood indicator
- [ ] Display known agendas
- [ ] Display recent events timeline
- [ ] Add action buttons (Propose Deal, Make Request, etc.)
- [ ] Implement responsive design
- [ ] Test on mobile and desktop

**Acceptance Criteria**: Modal displays all info, buttons work

---

### Task 2.2: Implementer NegotiationInterface ⏱️ 3-4 dager
- [ ] Create `src/components/NegotiationInterface.tsx`
- [ ] Design two-column layout (Offer / Request)
- [ ] Add item list displays
- [ ] Add "+ Add Item" buttons
- [ ] Implement real-time evaluation (debounced)
- [ ] Display AI feedback text
- [ ] Display acceptance probability bar
- [ ] Display deal balance indicator
- [ ] Add "Propose Deal" button with validation
- [ ] Handle counter-offers display
- [ ] Test performance with many items

**Acceptance Criteria**: Interface functional, real-time evaluation works

---

### Task 2.3: Implementer ItemPicker ⏱️ 2-3 dager
- [ ] Create `src/components/ItemPicker.tsx`
- [ ] Design modal layout
- [ ] Add category tabs (Resources, Agreements, Actions, etc.)
- [ ] Add checkboxes/inputs for each item type
- [ ] Add amount/duration inputs
- [ ] Add dropdowns for sub-types
- [ ] Implement validation (can't offer what you don't have)
- [ ] Add preview before adding
- [ ] Test all item types

**Acceptance Criteria**: All item types can be selected and configured

---

### Task 2.4: Integrer med Index.tsx ⏱️ 2-3 dager
- [ ] Add state variables to `src/pages/Index.tsx`
- [ ] Implement `handleContactLeader()`
- [ ] Implement `handleStartNegotiation()`
- [ ] Implement `handleUpdateNegotiation()`
- [ ] Implement `handleProposeDeal()` with AI evaluation
- [ ] Implement `handleCancelNegotiation()`
- [ ] Add render sections for modals
- [ ] Integrate AI-initiated negotiations in AI turn loop
- [ ] Display pending AI negotiations to player
- [ ] Test full integration

**Acceptance Criteria**: UI integrated, game loop works normally

---

### Task 2.5: Legg til Click Handlers på World Map ⏱️ 0.5-1 dag
- [ ] Modify `src/components/WorldMap.tsx` or relevant component
- [ ] Add click handler to nation markers
- [ ] Add "Contact Leader" option (button or context menu)
- [ ] Pass `onContactLeader` callback
- [ ] Test click functionality
- [ ] Test on mobile (touch)

**Acceptance Criteria**: Can click nations to open LeaderContactModal

---

### Task 2.6: Design og Implementer Leader Avatars ⏱️ 0.5-1 dag
- [ ] Create `src/components/LeaderAvatar.tsx`
- [ ] Implement simple approach (colored circle with initial)
- [ ] Add border color based on mood
- [ ] Define mood colors (Hostile=Red, Friendly=Blue, etc.)
- [ ] Make responsive sizing
- [ ] Polish design

**Acceptance Criteria**: Avatar looks clean and conveys mood

---

## FASE 3: AI PROAKTIV DIPLOMATI (1-2 uker) ✅ COMPLETED

### Task 3.1: Implementer AI Negotiation Triggers ⏱️ 2-3 dager ✅
- [x] Create `src/lib/aiNegotiationTriggers.ts`
- [x] Implement `checkThreatTrigger()`
- [x] Implement `checkResourceSurplusTrigger()`
- [x] Implement `checkReconciliationTrigger()`
- [x] Implement `checkCompensationDemandTrigger()`
- [x] Implement `checkMutualBenefitTrigger()`
- [x] Implement `checkWarningTrigger()`
- [x] Implement `checkAllTriggers()` with priority system
- [x] Add throttling to prevent spam
- [ ] Write unit tests for each trigger (TODO: Future enhancement)

**Acceptance Criteria**: ✅ Triggers activate appropriately, not too frequent

**Implementation Notes**:
- Created comprehensive trigger system with 6 different trigger types
- Implemented priority-based trigger selection
- Added global throttling (MIN_TURNS_BETWEEN_NEGOTIATIONS = 5)
- Added per-turn limit (MAX_NEGOTIATIONS_PER_TURN = 2)

---

### Task 3.2: Implementer AI Negotiation Content Generator ⏱️ 2-3 dager ✅
- [x] Create `src/lib/aiNegotiationContentGenerator.ts`
- [x] Implement `generateAINegotiationDeal()` master function
- [x] Implement `generateHelpRequest()`
- [x] Implement `generateAllianceOffer()`
- [x] Implement `generateReconciliationOffer()`
- [x] Implement `generateCompensationDemand()`
- [x] Implement `generateWarning()`
- [x] Implement `generateTradeOffer()`
- [x] Create message templates for each purpose
- [x] Add template variable filling
- [x] Test each generator

**Acceptance Criteria**: ✅ Generated deals are logical and contextual

**Implementation Notes**:
- Created message templates for all 9 negotiation purposes
- Implemented deal generation based on context and trigger type
- Added personality-aware message generation
- Dynamic expiration based on urgency level

---

### Task 3.3: Implementer AI Negotiation Notification System ⏱️ 1-2 dager ✅
- [x] Create `src/components/AINegotiationNotification.tsx`
- [x] Design notification layout
- [x] Add urgency indicator (red/yellow/green)
- [x] Add "View Proposal" and "Dismiss" buttons
- [x] Implement notification queue system
- [x] Add expiration handling
- [x] Test notification flow

**Acceptance Criteria**: ✅ Notifications display, queue works correctly

**Implementation Notes**:
- Created AINegotiationNotification component with urgency-based styling
- Implemented AINegotiationNotificationQueue for managing multiple notifications
- Added priority-based sorting (critical > high > medium > low)
- Shows counter badge when multiple negotiations pending

---

### Task 3.4: Implementer Diplomatic Inbox ⏱️ 1-2 dager ✅
- [x] Create `src/components/DiplomaticInbox.tsx`
- [x] Design inbox layout
- [x] Display pending negotiations with timers
- [x] Display completed negotiations history
- [x] Add filter options
- [x] Make accessible from main UI
- [x] Test functionality

**Acceptance Criteria**: ✅ Inbox shows all negotiations, timers work

**Implementation Notes**:
- Created full-featured diplomatic inbox component
- Implemented filters: all/pending/completed
- Added search by nation name
- Shows expiration warnings for negotiations expiring within 2 turns
- Visual distinction between pending and completed negotiations
- Shows outcome icons for completed negotiations (accepted/rejected/expired)

---

## FASE 4: AGENDA-SYSTEM & PERSONALITY (1-2 uker)

### Task 4.1: Definier Alle Agendaer ⏱️ 1-2 dager
- [ ] Create `src/lib/agendaDefinitions.ts`
- [ ] Define 6-8 primary agendas with full details
- [ ] Define 6-8 hidden agendas with full details
- [ ] Add check conditions for each
- [ ] Add modifiers for each
- [ ] Write clear descriptions
- [ ] Test each agenda's logic

**Acceptance Criteria**: At least 6 primary + 6 hidden agendas defined

---

### Task 4.2: Implementer Agenda Assignment ved Game Start ⏱️ 0.5 dag
- [ ] Modify `src/lib/gameInitialization.ts` or equivalent
- [ ] Implement `initializeNationAgendas()`
- [ ] Assign 1 primary + 1 hidden to each AI
- [ ] Ensure no duplicates
- [ ] Use seeded RNG for reproducibility
- [ ] Test assignment

**Acceptance Criteria**: Every AI gets unique agendas at game start

---

### Task 4.3: Implementer Agenda Revelation System ⏱️ 1 dag
- [ ] Create `src/lib/agendaRevelation.ts`
- [ ] Implement `checkAgendaRevelation()` with conditions
- [ ] Implement `revealHiddenAgenda()`
- [ ] Implement `processAgendaRevelations()` for turn processing
- [ ] Add notification when agenda revealed
- [ ] Test revelation conditions

**Acceptance Criteria**: Hidden agendas reveal over time correctly

---

### Task 4.4: Integrer Agendaer i AI Evaluation ⏱️ 1-2 dager
- [ ] Modify `src/lib/aiNegotiationEvaluator.ts`
- [ ] Add agenda modifier calculation in `evaluateNegotiation()`
- [ ] Apply agenda penalties/bonuses to final score
- [ ] Add agenda-based feedback messages
- [ ] Test each agenda's effect on decisions
- [ ] Verify personality differences

**Acceptance Criteria**: Agendas affect AI decisions, feedback mentions them

---

### Task 4.5: Vise Agendaer i UI ⏱️ 1 dag
- [ ] Modify `src/components/LeaderContactModal.tsx`
- [ ] Add agendas section to modal
- [ ] Display revealed agendas with descriptions
- [ ] Show "???" for hidden agendas
- [ ] Highlight violations in red
- [ ] Show bonuses in green
- [ ] Test display

**Acceptance Criteria**: Agendas displayed correctly, violations highlighted

---

## FASE 5: POLISHING & BALANCING (1-2 uker)

### Task 5.1: Balance Item Values ⏱️ 2-3 dager
- [ ] Create test scenarios for common negotiations
- [ ] Play through and collect acceptance rate data
- [ ] Adjust base values in `calculateItemValue()`
- [ ] Adjust context modifiers
- [ ] Adjust relationship scaling
- [ ] Target 60% acceptance for fair deals
- [ ] Test for exploits
- [ ] Iterate until balanced

**Acceptance Criteria**: Values feel fair, no exploits

---

### Task 5.2: Tweak AI Acceptance Thresholds ⏱️ 1-2 dager
- [ ] Run 100 simulated negotiations per personality
- [ ] Collect acceptance rate distributions
- [ ] Adjust thresholds in `aiNegotiationEvaluator.ts`
- [ ] Adjust personality modifiers
- [ ] Ensure personalities feel distinct
- [ ] Test with real gameplay
- [ ] Iterate

**Acceptance Criteria**: Acceptance rates match intended difficulty

---

### Task 5.3: Forbedre Feedback Messages ⏱️ 1-2 dager
- [ ] Write 3+ message templates per category
- [ ] Add context-specific messages (trust, agenda, grievance)
- [ ] Add personality-based tone variations
- [ ] Test message variety
- [ ] Ensure messages are helpful to player

**Acceptance Criteria**: Messages varied, helpful, and clear

---

### Task 5.4: Legg til Animations (Optional) ⏱️ 1-2 dager
- [ ] Install Framer Motion or use CSS
- [ ] Add modal open/close animations
- [ ] Add item add/remove animations
- [ ] Add evaluation update animations
- [ ] Add counter-offer appear animation
- [ ] Add notification pop animation
- [ ] Test performance
- [ ] Ensure no janky behavior

**Acceptance Criteria**: Smooth animations, good performance

---

### Task 5.5: Comprehensive Testing ⏱️ 2-3 dager
- [ ] Run all unit tests (verify >80% coverage)
- [ ] Run all integration tests
- [ ] Run all acceptance tests
- [ ] Manual testing: play through game
- [ ] Manual testing: try all negotiation types
- [ ] Manual testing: test all AI personalities
- [ ] Manual testing: verify mobile compatibility
- [ ] Performance testing: measure evaluation time
- [ ] Performance testing: check for memory leaks
- [ ] Create issues for bugs found
- [ ] Fix critical bugs

**Acceptance Criteria**: All tests pass, no critical bugs

---

### Task 5.6: Dokumentasjon ⏱️ 2-3 dager
- [ ] Write `docs/NEGOTIATION_SYSTEM.md` (architecture)
- [ ] Write `docs/NEGOTIATION_API.md` (API reference)
- [ ] Write `docs/NEGOTIATION_GUIDE.md` (player guide)
- [ ] Add code examples to docs
- [ ] Add diagrams/visuals
- [ ] Review and polish documentation

**Acceptance Criteria**: Complete documentation for devs and players

---

## MILESTONES

- **M1: Engine Complete** ✅ After Task 1.7
- **M2: UI Complete** ✅ After Task 2.6
- **M3: AI Proactive** ✅ After Task 3.4
- **M4: Personalities** ✅ After Task 4.5
- **M5: Release Ready** ✅ After Task 5.6

---

## PROGRESS TRACKING

**Fase 1**: ✅✅✅✅✅✅✅ 7/7 tasks (COMPLETED)
**Fase 2**: ⬜⬜⬜⬜⬜⬜ 0/6 tasks
**Fase 3**: ✅✅✅✅ 4/4 tasks (COMPLETED)
**Fase 4**: ⬜⬜⬜⬜⬜ 0/5 tasks
**Fase 5**: ⬜⬜⬜⬜⬜⬜ 0/6 tasks

**TOTAL PROGRESS**: 11/28 major tasks (39% complete)

---

## NOTES

- This task list is a living document
- Update checkboxes as tasks are completed
- Add notes/issues as discovered
- Adjust time estimates based on actual work

**Last Updated**: 2025-11-02
