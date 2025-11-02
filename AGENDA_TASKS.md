# Agenda-System - Task List

**Status**: Ready for Implementation
**Total Estimated Time**: 1-1.5 weeks

---

## FASE 4: AGENDA-SYSTEM FOR UNIQUE LEADER PERSONALITIES

### ✅ COMPLETED - Agenda Definitions & Core Logic

#### Task 4.0.1: Definer Primary Agendas ✅ DONE
- [x] Create `src/lib/agendaDefinitions.ts`
- [x] Define 8 primary agendas
- [x] Add conditions for each agenda
- [x] Add relationship modifiers
- [x] Add evaluation bonuses
- [x] Add descriptions

**Implemented Agendas**:
- [x] Nuclear Pacifist (Anti-Nuclear)
- [x] Warmonger Hater
- [x] Loyal Friend
- [x] Isolationist
- [x] Peacemonger
- [x] Resource Guardian
- [x] Military Supremacist
- [x] Ideological Purist

---

#### Task 4.0.2: Definer Hidden Agendas ✅ DONE
- [x] Define 8 hidden agendas
- [x] Add conditions for each agenda
- [x] Add relationship modifiers
- [x] Add evaluation bonuses
- [x] Add descriptions

**Implemented Agendas**:
- [x] Expansionist
- [x] Resource Hungry
- [x] Tech Enthusiast
- [x] Militarist
- [x] Diplomat
- [x] Opportunist
- [x] Trade Partner
- [x] Cultural Preservationist

---

#### Task 4.0.3: Implementer Agenda System Core ✅ DONE
- [x] Create `src/lib/agendaSystem.ts`
- [x] Implement `assignAgendas()`
- [x] Implement `initializeNationAgendas()`
- [x] Implement `checkAgendaViolations()`
- [x] Implement `calculateAgendaModifier()`
- [x] Implement `calculateAgendaNegotiationBonus()`
- [x] Implement `getAgendaFeedback()`
- [x] Implement `shouldRevealHiddenAgenda()`
- [x] Implement `revealHiddenAgenda()`
- [x] Implement `processAgendaRevelations()`
- [x] Implement helper query functions

---

### ⏳ PENDING - Integration Tasks

#### Task 4.1: Integrer Agenda Assignment ved Game Start ⏱️ 0.5-1 dag
- [ ] Find game initialization code in `src/pages/Index.tsx`
- [ ] Import `initializeNationAgendas` from agendaSystem
- [ ] Call function after nations created but before game starts
- [ ] Use seeded RNG for reproducibility
- [ ] Log agendas for debugging
- [ ] Test that each AI gets 2 agendas (1 primary, 1 hidden)
- [ ] Verify primary is revealed, hidden is not
- [ ] Verify player nation gets no agendas
- [ ] Verify no duplicate agendas (primary !== hidden)

**Acceptance Criteria**:
- [ ] Each AI nation has `agendas` array with 2 items
- [ ] Primary agenda has `isRevealed: true`
- [ ] Hidden agenda has `isRevealed: false`
- [ ] Player nation has no agendas
- [ ] Same seed produces same agendas
- [ ] Agendas logged to console

**Estimated Time**: 2-3 hours

---

#### Task 4.2: Integrer Agendaer i AI Evaluation ⏱️ 1 dag
- [ ] Open `src/lib/aiNegotiationEvaluator.ts`
- [ ] Import agenda functions
- [ ] In `evaluateNegotiation()`:
  - [ ] Calculate `agendaBonus` using `calculateAgendaNegotiationBonus()`
  - [ ] Add `agendaBonus` to final score
  - [ ] Check for violations using `checkAgendaViolations()`
  - [ ] Get agenda feedback using `getAgendaFeedback()`
  - [ ] Add feedback to rejection messages
  - [ ] Return `agendaBonus` in evaluation result
- [ ] Test Anti-Nuclear violation scenario
- [ ] Test Loyal Friend bonus scenario
- [ ] Test hidden agenda (Resource Hungry) scenario
- [ ] Verify agendas affect acceptance probability
- [ ] Verify feedback messages include agenda info

**Test Scenarios**:

**Scenario A: Anti-Nuclear Violation**:
- [ ] Setup: AI with Anti-Nuclear, player with nukes
- [ ] Propose alliance
- [ ] Expected: agendaBonus = -100, low acceptance, feedback mentions nukes

**Scenario B: Loyal Friend Bonus**:
- [ ] Setup: AI with Loyal Friend, 30+ turn alliance
- [ ] Propose trade
- [ ] Expected: agendaBonus = +60, high acceptance, positive feedback

**Scenario C: Hidden Agenda (Not Revealed)**:
- [ ] Setup: AI with Resource Hungry (hidden), player offers resources
- [ ] Propose deal
- [ ] Expected: agendaBonus = +50, NO feedback (since hidden)

**Acceptance Criteria**:
- [ ] `agendaBonus` calculated correctly
- [ ] Bonus affects final score
- [ ] Violations reduce acceptance significantly
- [ ] Bonuses increase acceptance significantly
- [ ] Feedback includes agenda violations (revealed only)
- [ ] All 3 test scenarios pass

**Estimated Time**: 4-6 hours

---

#### Task 4.3: Integrer Agendaer i Diplomatic Triggers ⏱️ 0.5 dag
- [ ] Open `src/lib/aiNegotiationTriggers.ts`
- [ ] Import `checkAgendaViolations` from agendaSystem
- [ ] In `checkWarningTrigger()`:
  - [ ] Check for agenda violations
  - [ ] Return true if violations exist AND relationship > -30
- [ ] Open `src/lib/aiNegotiationContentGenerator.ts`
- [ ] In `generateWarning()`:
  - [ ] Get violations
  - [ ] Create warning message mentioning specific agenda
  - [ ] Example: "Your nuclear buildup violates my Nuclear Pacifist values..."
- [ ] Test warning trigger fires on violation
- [ ] Test message mentions specific agenda
- [ ] Verify only triggers for revealed agendas

**Test Scenario**:
- [ ] Setup: Player acquires many warheads, AI has Anti-Nuclear
- [ ] Advance turn
- [ ] Expected: AI sends warning with agenda-specific message

**Acceptance Criteria**:
- [ ] Warnings trigger on agenda violations
- [ ] Warning messages include agenda name and description
- [ ] Only triggers for revealed agendas (not hidden)
- [ ] Test scenario passes

**Estimated Time**: 2-3 hours

---

#### Task 4.4: Integrer Agenda Revelation i Turn Processing ⏱️ 0.5 dag
- [ ] Find turn processing code in `src/pages/Index.tsx`
- [ ] Import `processAgendaRevelations` from agendaSystem
- [ ] In end-of-turn or start-of-turn logic:
  - [ ] Call `processAgendaRevelations(nations, playerNation, turn)`
  - [ ] Update nations state with revealed agendas
  - [ ] Show log messages for revelations
  - [ ] Store revelation for notification (Task 4.6)
- [ ] Test high relationship revelation (>25 rel, >60 trust, >10 turns)
- [ ] Test long contact revelation (>30 turns)
- [ ] Test alliance revelation (>15 turns with alliance)
- [ ] Verify agendas become `isRevealed: true`

**Test Scenarios**:

**Scenario A: High Relationship Revelation**:
- [ ] Setup: Relationship 30, Trust 70, 11 turns
- [ ] Expected: Hidden agenda revealed

**Scenario B: Long Contact Revelation**:
- [ ] Setup: Neutral relationship, 31 turns
- [ ] Expected: Hidden agenda revealed

**Scenario C: Alliance Revelation**:
- [ ] Setup: Alliance exists for 16 turns
- [ ] Expected: Hidden agenda revealed

**Acceptance Criteria**:
- [ ] `processAgendaRevelations()` called each turn
- [ ] Revelations trigger based on conditions
- [ ] Nations updated with `isRevealed: true`
- [ ] Log messages shown to player
- [ ] All 3 test scenarios pass

**Estimated Time**: 2-3 hours

---

### ⏳ PENDING - UI Tasks

#### Task 4.5: Implementer Agenda Display i LeaderContactModal ⏱️ 1 dag
- [ ] Open `src/components/LeaderContactModal.tsx`
- [ ] Import agenda functions
- [ ] Get nation's agendas using `getNationAgendas()`
- [ ] Check violations using `checkAgendaViolations()`
- [ ] Add "Leader Traits" section to modal
- [ ] For each agenda:
  - [ ] Show agenda icon (⭐ for primary, 🔍 for hidden)
  - [ ] Show agenda name
  - [ ] Show agenda description
  - [ ] If revealed:
    - [ ] Show full details
    - [ ] Highlight violations in red
    - [ ] Show bonuses in green
  - [ ] If not revealed:
    - [ ] Show "Unknown Trait" placeholder
    - [ ] Add hint for how to reveal
- [ ] Add CSS styling:
  - [ ] Agenda cards with proper spacing
  - [ ] Violation warning styling (red)
  - [ ] Bonus styling (green)
  - [ ] Hidden agenda styling (dashed border, opacity)
- [ ] Test display with various scenarios
- [ ] Ensure responsive design

**UI Elements to Add**:
- [ ] Section title: "Leader Traits"
- [ ] Agenda cards (one per agenda)
- [ ] Agenda icon (emoji or symbol)
- [ ] Agenda name (bold)
- [ ] Agenda description
- [ ] Violation warnings (if applicable)
- [ ] Bonus indicators (if applicable)
- [ ] Hidden agenda placeholder
- [ ] Revelation hints

**Acceptance Criteria**:
- [ ] Primary agenda displays correctly
- [ ] Hidden agenda shows as "Unknown" if not revealed
- [ ] Revealed hidden agenda shows full info
- [ ] Violations highlighted in red
- [ ] Bonuses highlighted in green
- [ ] Hints show for hidden agendas
- [ ] Clean, readable design
- [ ] Responsive (works on mobile and desktop)

**Estimated Time**: 4-6 hours

---

#### Task 4.6: Implementer Agenda Revelation Notification ⏱️ 0.5 dag
- [ ] Create `src/components/AgendaRevelationNotification.tsx`
- [ ] Design notification modal:
  - [ ] Header with icon (💡)
  - [ ] "New Insight Discovered" title
  - [ ] Nation name
  - [ ] Agenda name and description
  - [ ] "Got it" button
- [ ] Add CSS styling:
  - [ ] Modal overlay (semi-transparent background)
  - [ ] Card with gradient background
  - [ ] Slide-in animation
  - [ ] Hover effects on button
- [ ] Integrate in `src/pages/Index.tsx`:
  - [ ] Add state for revelation notification
  - [ ] When revelation occurs, set notification state
  - [ ] Render notification modal
  - [ ] Clear on close
- [ ] Test notification appears on revelation
- [ ] Test notification dismisses correctly
- [ ] Test smooth animations

**Acceptance Criteria**:
- [ ] Notification shows when agenda revealed
- [ ] Clean, attractive design
- [ ] Shows nation name, agenda name, description
- [ ] Can be dismissed with button
- [ ] Smooth slide-in animation
- [ ] Only one notification at a time

**Estimated Time**: 2-3 hours

---

### ⏳ PENDING - Testing & Polish

#### Task 4.7: Testing og Debugging ⏱️ 1 dag

**Unit Tests**:
- [ ] Test agenda assignment
  - [ ] Each AI gets 2 agendas
  - [ ] Primary is revealed, hidden is not
  - [ ] No duplicates
- [ ] Test agenda checking
  - [ ] Violations detected correctly
  - [ ] Modifiers calculated correctly
- [ ] Test agenda revelation
  - [ ] High relationship trigger
  - [ ] Long contact trigger
  - [ ] Alliance trigger

**Integration Tests**:
- [ ] Test agenda affects negotiation evaluation
  - [ ] Anti-Nuclear violation reduces acceptance
  - [ ] Loyal Friend bonus increases acceptance
- [ ] Test agenda revelation during gameplay
  - [ ] Advances turn, checks revelation
  - [ ] Notification appears
- [ ] Test UI displays agendas correctly
  - [ ] LeaderContactModal shows agendas
  - [ ] Violations highlighted

**Manual Testing**:
- [ ] Start new game
  - [ ] Verify all AIs have agendas
  - [ ] Check console logs
- [ ] Open LeaderContactModal
  - [ ] Verify primary agenda visible
  - [ ] Verify hidden agenda shows as "Unknown"
- [ ] Build relationship over time
  - [ ] Verify hidden agenda reveals
  - [ ] Verify notification appears
- [ ] Violate agenda (use nukes with Anti-Nuclear AI)
  - [ ] Verify relationship drops
  - [ ] Verify feedback shown in negotiation
- [ ] Try negotiation with various AIs
  - [ ] Verify agendas affect acceptance
  - [ ] Verify feedback mentions agendas
- [ ] Multiple playthroughs
  - [ ] Verify different hidden agendas each time

**Bug Tracking**:
- [ ] Create issues for bugs found
- [ ] Prioritize critical vs minor
- [ ] Fix critical bugs
- [ ] Document known issues

**Acceptance Criteria**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing checklist completed
- [ ] No critical bugs
- [ ] Performance acceptable

**Estimated Time**: 6-8 hours

---

#### Task 4.8: Dokumentasjon og Polish ⏱️ 0.5 dag

**Documentation Updates**:
- [ ] Update `NEGOTIATION_TASKS.md`:
  - [ ] Mark Phase 4 tasks as completed
  - [ ] Update progress tracking
- [ ] Update this file (`AGENDA_TASKS.md`):
  - [ ] Mark completed tasks
  - [ ] Add completion notes
- [ ] Add code comments:
  - [ ] Ensure all functions have TSDoc
  - [ ] Add inline comments for complex logic
- [ ] Create player guide section:
  - [ ] How agendas work
  - [ ] How to reveal hidden agendas
  - [ ] Tips for managing agenda violations

**Code Polishing**:
- [ ] Remove console.logs (or use proper logging)
- [ ] Fix any TypeScript warnings
- [ ] Remove @ts-ignore if possible
- [ ] Ensure consistent code style
- [ ] Refactor messy code
- [ ] Add proper error handling

**Acceptance Criteria**:
- [ ] Documentation complete and up-to-date
- [ ] Code well-commented
- [ ] No unnecessary console.logs
- [ ] No TypeScript errors or warnings
- [ ] Clean, maintainable code

**Estimated Time**: 2-3 hours

---

## OPPSUMMERING

### Progress Tracking

**Completed** ✅:
- [x] Task 4.0.1: Primary Agendas Defined (8 agendas)
- [x] Task 4.0.2: Hidden Agendas Defined (8 agendas)
- [x] Task 4.0.3: Core Agenda System Implemented

**In Progress** ⏳:
- [ ] Task 4.1: Game Initialization Integration
- [ ] Task 4.2: AI Evaluation Integration
- [ ] Task 4.3: Diplomatic Triggers Integration
- [ ] Task 4.4: Turn Processing Integration
- [ ] Task 4.5: UI Display
- [ ] Task 4.6: Notification Component
- [ ] Task 4.7: Testing
- [ ] Task 4.8: Documentation

**Total Progress**: 3/11 tasks (27%)

---

### Time Estimates

| Task | Time |
|------|------|
| 4.1: Initialization | 2-3 hours |
| 4.2: AI Evaluation | 4-6 hours |
| 4.3: Triggers | 2-3 hours |
| 4.4: Turn Processing | 2-3 hours |
| 4.5: UI Display | 4-6 hours |
| 4.6: Notifications | 2-3 hours |
| 4.7: Testing | 6-8 hours |
| 4.8: Documentation | 2-3 hours |

**TOTAL**: **24-35 hours** (3-4.5 work days or 1-1.5 weeks)

---

### Critical Path

```
Task 4.1 (Init)
  ↓
Task 4.2 (Evaluation) ←──┐
Task 4.3 (Triggers) ←────┤ Parallel
Task 4.4 (Turn Proc) ←───┘
  ↓
Task 4.5 (UI)
Task 4.6 (Notifications) ← Parallel
  ↓
Task 4.7 (Testing)
  ↓
Task 4.8 (Docs)
```

---

### Milestones

**M1: Core Integration Complete** ✅ When Tasks 4.1-4.4 done:
- Agendas assigned at game start
- Agendas affect AI decisions
- Agendas reveal over time
- Backend complete

**M2: UI Complete** ✅ When Tasks 4.5-4.6 done:
- Players can see agendas
- Revelations look good
- Full player experience

**M3: Release Ready** ✅ When Tasks 4.7-4.8 done:
- Tested thoroughly
- No critical bugs
- Documented
- Ready for merge

---

## DOCUMENTATION REFERENCES

📄 **AGENDA_SYSTEM_RESEARCH.md** - Full research and design
📄 **AGENDA_SYSTEM_IMPLEMENTATION_PLAN.md** - Detailed implementation guide
📄 **AGENDA_SYSTEM_SUMMARY.md** - High-level overview
📄 **This file (AGENDA_TASKS.md)** - Task tracking checklist

---

## NOTES

- Core agenda system (definitions + logic) already complete ✅
- Focus on integration and UI
- Testing is critical - agendas must feel meaningful
- Start with Task 4.1 (initialization)

---

## CURRENT STATUS

**Last Updated**: 2025-11-02
**Status**: Ready to start implementation
**Next Task**: Task 4.1 - Agenda Assignment Integration
**Estimated Completion**: 1-1.5 weeks from start

---

## COMPLETION SUMMARY (To Be Filled)

**Completion Date**: _TBD_
**Actual Time Taken**: _TBD_
**Challenges Encountered**: _TBD_
**Lessons Learned**: _TBD_
