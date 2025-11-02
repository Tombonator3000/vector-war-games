# Agenda System Testing Checklist

**Phase 4: Agenda System for Unique Leader Personalities**
**Status**: Implementation Complete - Ready for Testing
**Date**: 2025-11-02

---

## PRE-TESTING SETUP

### Environment Check
- [ ] All dependencies installed (`npm install`)
- [ ] Project builds successfully (`npm run build`)
- [ ] Development server starts (`npm run dev`)
- [ ] No TypeScript errors in console
- [ ] No React warnings in console

### Files to Verify
- [ ] `src/lib/agendaDefinitions.ts` - Contains 16 agendas
- [ ] `src/lib/agendaSystem.ts` - Core functions present
- [ ] `src/pages/Index.tsx` - Integration complete
- [ ] `src/lib/aiNegotiationEvaluator.ts` - Agenda bonus integrated
- [ ] `src/lib/aiNegotiationTriggers.ts` - Warnings integrated
- [ ] `src/components/LeaderContactModal.tsx` - UI updated
- [ ] `src/components/AgendaRevelationNotification.tsx` - Component exists

---

## UNIT TESTS

### Test 1: Agenda Assignment at Game Start

**Setup**: Start a new game

**Test Cases**:
1. **Each AI gets 2 agendas**
   - [ ] Open browser console
   - [ ] Look for "=== LEADER AGENDAS ASSIGNED ===" log
   - [ ] Verify each AI nation has Primary and Hidden agenda listed
   - [ ] Count: Should be 2 agendas per AI (1 primary, 1 hidden)

2. **Primary is revealed, hidden is not**
   - [ ] Check console logs: Primary should say "(visible)"
   - [ ] Hidden should say "(concealed)"
   - [ ] Verify `isRevealed: true` for primary
   - [ ] Verify `isRevealed: false` for hidden

3. **No duplicate agendas**
   - [ ] Verify primary agenda ID ≠ hidden agenda ID for each AI
   - [ ] Each AI should have unique combination

4. **Player nation has no agendas**
   - [ ] Check player nation doesn't appear in agenda logs
   - [ ] Verify player nation has no `agendas` property

**Expected Results**:
```
=== LEADER AGENDAS ASSIGNED ===
Russia:
  Primary: Military Supremacist (visible)
  Hidden: Resource Hungry (concealed)
China:
  Primary: Warmonger Hater (visible)
  Hidden: Tech Enthusiast (concealed)
...etc
```

**Pass Criteria**: All 4 test cases pass

---

### Test 2: Agenda Violation Detection

**Setup**: Start game, build nuclear warheads

**Test Scenario A: Anti-Nuclear Violation**
1. [ ] Identify an AI with "Nuclear Pacifist" agenda (check console logs)
2. [ ] Build 5+ warheads
3. [ ] Open LeaderContactModal for that AI
4. [ ] Verify agenda shows "Violation Detected" warning in red
5. [ ] Check relationship has dropped (negative modifier)

**Test Scenario B: No Violation**
1. [ ] Find AI without Anti-Nuclear agenda
2. [ ] Build warheads
3. [ ] Open LeaderContactModal for that AI
4. [ ] Verify no violation warning
5. [ ] Relationship should not drop due to agendas

**Expected Results**:
- Red violation box appears for Anti-Nuclear AI
- AlertTriangle icon visible
- Text: "Your actions conflict with this leader's values"
- Relationship drops by ~30 points

**Pass Criteria**: Violations detected correctly, false positives = 0

---

### Test 3: Agenda Revelation Mechanics

**Test Scenario A: High Relationship Revelation**

**Setup**:
- [ ] Start game
- [ ] Build strong relationship with an AI (relationship > 25)
- [ ] Ensure trust > 60
- [ ] Play for 10+ turns

**Expected Result**:
- [ ] After 10+ turns, hidden agenda should reveal
- [ ] Console log: "💡 AGENDA REVEALED: [Nation] - [Agenda]"
- [ ] Game log shows success message
- [ ] Notification modal appears with lightbulb icon
- [ ] Agenda now visible in LeaderContactModal

**Test Scenario B: Long Contact Revelation**

**Setup**:
- [ ] Start game
- [ ] Make first contact with an AI
- [ ] Maintain neutral relationship (don't build relationship)
- [ ] Play for 30+ turns

**Expected Result**:
- [ ] After 30+ turns, hidden agenda should reveal
- [ ] Notification appears
- [ ] Agenda becomes visible

**Test Scenario C: Alliance Revelation**

**Setup**:
- [ ] Start game
- [ ] Form alliance with an AI
- [ ] Maintain alliance for 15+ turns

**Expected Result**:
- [ ] After 15+ turns of alliance, hidden agenda reveals
- [ ] Notification appears
- [ ] Agenda visible in modal

**Pass Criteria**: All 3 revelation triggers work correctly

---

## INTEGRATION TESTS

### Test 4: Agenda Impact on Negotiation

**Test Scenario A: Negative Impact (Anti-Nuclear)**

**Setup**:
1. [ ] Find AI with Anti-Nuclear agenda
2. [ ] Build many warheads (5+)
3. [ ] Open LeaderContactModal
4. [ ] Click "Propose Deal"
5. [ ] Create a fair deal (e.g., offer resources for resources)
6. [ ] Submit proposal

**Expected Result**:
- [ ] AI rejects deal despite fairness
- [ ] Rejection message mentions nuclear weapons
- [ ] Example: "Your use of nuclear weapons violates my Nuclear Pacifist values"
- [ ] Console shows agendaModifier = -100

**Test Scenario B: Positive Impact (Loyal Friend)**

**Setup**:
1. [ ] Find AI with Loyal Friend agenda
2. [ ] Form alliance
3. [ ] Maintain alliance for 30+ turns
4. [ ] Open LeaderContactModal
5. [ ] Propose a slightly unfavorable deal
6. [ ] Submit proposal

**Expected Result**:
- [ ] AI accepts deal despite slight unfairness
- [ ] Console shows agendaModifier = +60
- [ ] Acceptance rate much higher than without bonus

**Test Scenario C: Hidden Agenda (Not Revealed)**

**Setup**:
1. [ ] Early game (turn 5-10)
2. [ ] AI has Resource Hungry hidden agenda (not yet revealed)
3. [ ] Offer generous resource package
4. [ ] Submit proposal

**Expected Result**:
- [ ] AI accepts more easily (hidden agenda affects decision)
- [ ] NO feedback message (agenda still hidden)
- [ ] Console shows agendaModifier = +50
- [ ] Player doesn't know why AI is so happy

**Pass Criteria**: Agendas affect acceptance rates as expected

---

### Test 5: Agenda Warnings

**Test Scenario: Nuclear Buildup Warning**

**Setup**:
1. [ ] Find AI with Anti-Nuclear agenda
2. [ ] Start with 0 warheads
3. [ ] Build 5 warheads in one turn
4. [ ] End turn

**Expected Result**:
- [ ] AI sends warning message
- [ ] Warning mentions Nuclear Pacifist agenda
- [ ] Example: "Your nuclear buildup violates my Nuclear Pacifist values..."
- [ ] Warning appears in diplomatic inbox/log

**Pass Criteria**: Warnings trigger correctly for violations

---

### Test 6: UI Display

**Test Case A: LeaderContactModal - Primary Agenda**

**Setup**:
1. [ ] Start game
2. [ ] Open LeaderContactModal for any AI

**Verify**:
- [ ] "Leader Traits" section visible
- [ ] Primary agenda card displayed
- [ ] Eye icon (👁) visible
- [ ] Badge shows "⭐ Primary"
- [ ] Agenda name displayed (e.g., "Nuclear Pacifist")
- [ ] Agenda description displayed
- [ ] No "Unknown Trait" placeholder for primary

**Test Case B: LeaderContactModal - Hidden Agenda**

**Setup**:
1. [ ] Early game before revelation
2. [ ] Open LeaderContactModal for any AI

**Verify**:
- [ ] "Unknown Trait" card displayed
- [ ] EyeOff icon (👁‍🗨) visible
- [ ] Badge shows "Hidden"
- [ ] Hint text: "Build a stronger relationship to discover this trait"
- [ ] Hint text: "💡 Hint: High relationship, trust, or long-term alliance"
- [ ] Card has dashed border
- [ ] Card is semi-transparent (opacity-60)

**Test Case C: LeaderContactModal - Revealed Hidden Agenda**

**Setup**:
1. [ ] Late game after revelation (30+ turns)
2. [ ] Open LeaderContactModal for AI with revealed agenda

**Verify**:
- [ ] Hidden agenda now fully visible
- [ ] Eye icon visible (not EyeOff)
- [ ] Badge shows "🔍 Revealed"
- [ ] Full name and description shown
- [ ] No longer has dashed border

**Test Case D: LeaderContactModal - Violations**

**Setup**:
1. [ ] Violate an agenda (e.g., build nukes with Anti-Nuclear AI)
2. [ ] Open LeaderContactModal

**Verify**:
- [ ] Agenda card has red background (bg-red-900/20)
- [ ] Border is red (border-red-500/50)
- [ ] Violation warning box visible
- [ ] AlertTriangle icon in red
- [ ] Text: "Violation Detected"
- [ ] Text: "Your actions conflict with this leader's values"

**Test Case E: LeaderContactModal - Bonuses**

**Setup**:
1. [ ] Align with an agenda (e.g., no nukes with Anti-Nuclear AI)
2. [ ] Open LeaderContactModal

**Verify**:
- [ ] Agenda card has green background (bg-green-900/20)
- [ ] Border is green (border-green-500/50)
- [ ] Bonus indicator visible
- [ ] Star icon in green
- [ ] Text: "Your actions align with this leader's values"

**Test Case F: LeaderContactModal - Feedback Messages**

**Setup**:
1. [ ] Have active violations
2. [ ] Open LeaderContactModal

**Verify**:
- [ ] "Leader's Perspective" section visible
- [ ] Blue background box (bg-blue-900/20)
- [ ] MessageSquare icon
- [ ] Feedback message in quotes
- [ ] Example: "Your use of nuclear weapons is unacceptable to us"

**Test Case G: AgendaRevelationNotification**

**Setup**:
1. [ ] Play until hidden agenda reveals (10-30 turns)
2. [ ] End turn when revelation occurs

**Verify**:
- [ ] Modal appears automatically
- [ ] Gradient background visible
- [ ] Glowing lightbulb icon (💡) with pulse animation
- [ ] Title: "New Insight Discovered"
- [ ] Description mentions nation name
- [ ] Agenda card with blue border
- [ ] Eye icon visible
- [ ] Badge shows "Hidden Trait"
- [ ] Full agenda name and description
- [ ] Hint text about Leader Contact screen
- [ ] "Got it" button with gradient style
- [ ] Button has hover effect
- [ ] Modal closes on button click

**Pass Criteria**: All UI elements render correctly

---

## MANUAL TESTING SCENARIOS

### Scenario 1: Fresh Game Playthrough

**Objective**: Verify complete system works from start to finish

**Steps**:
1. [ ] Start new game
2. [ ] Check console for agenda assignments
3. [ ] Note which AIs have which agendas
4. [ ] Play first 10 turns normally
5. [ ] Contact each AI and check their primary agendas
6. [ ] Verify hidden agendas show as "Unknown Trait"
7. [ ] Build relationship with one AI to 30+
8. [ ] Build trust to 70+
9. [ ] Play until turn 15
10. [ ] Verify hidden agenda reveals with notification
11. [ ] Open LeaderContactModal again
12. [ ] Verify hidden agenda now visible
13. [ ] Continue to turn 30-40
14. [ ] Verify all high-relationship AIs reveal agendas
15. [ ] Check no crashes or errors occurred

**Pass Criteria**: Full playthrough with no errors

---

### Scenario 2: Violation Testing

**Objective**: Test all violation scenarios

**Test Matrix**:

| Agenda | Violation Action | Expected Result |
|--------|------------------|-----------------|
| Anti-Nuclear | Build 5+ warheads | Relationship -30, rejection -100 |
| Warmonger Hater | Declare 3+ wars | Relationship -25, rejection -80 |
| Loyal Friend | Break alliance | Relationship -40, rejection -120 |
| Isolationist | Player has 4+ alliances | Relationship -15, rejection -40 |
| Peacemonger | Declare war | Relationship -15, rejection -30 |
| Resource Guardian | Pollution/environment damage | Relationship -20, rejection -50 |
| Military Supremacist | Player military > AI military | Relationship -25, rejection -60 |
| Ideological Purist | Player doctrine ≠ AI doctrine | Relationship -25, rejection -65 |

**Steps for Each**:
1. [ ] Find AI with target agenda
2. [ ] Perform violation action
3. [ ] Check relationship drop
4. [ ] Open LeaderContactModal
5. [ ] Verify violation warning
6. [ ] Try negotiation
7. [ ] Verify rejection with agenda feedback

**Pass Criteria**: All 8 violations work as expected

---

### Scenario 3: Multiple Playthroughs

**Objective**: Verify randomization and variety

**Playthrough 1**:
- [ ] Start new game
- [ ] Note agenda assignments
- [ ] Take screenshot or note agendas

**Playthrough 2**:
- [ ] Restart game (new seed)
- [ ] Note agenda assignments
- [ ] Compare to Playthrough 1
- [ ] Verify different agendas assigned

**Playthrough 3**:
- [ ] Restart game again
- [ ] Note agenda assignments
- [ ] Compare to previous playthroughs

**Expected Results**:
- [ ] Each playthrough has different agenda combinations
- [ ] All 8 primary agendas appear across playthroughs
- [ ] All 8 hidden agendas appear across playthroughs
- [ ] No single agenda appears too frequently

**Pass Criteria**: Good variety across playthroughs

---

## EDGE CASES

### Edge Case 1: Multiple Violations

**Setup**: Violate multiple agendas simultaneously

**Steps**:
1. [ ] Find AI with Anti-Nuclear + Warmonger Hater (if possible)
2. [ ] Build nukes AND declare wars
3. [ ] Open LeaderContactModal
4. [ ] Verify both violations shown
5. [ ] Try negotiation
6. [ ] Verify rejection mentions multiple violations

**Pass Criteria**: Multiple violations stack correctly

---

### Edge Case 2: Multiple Revelations Same Turn

**Setup**: High relationships with multiple AIs

**Steps**:
1. [ ] Build high relationship with 3+ AIs
2. [ ] Reach revelation threshold simultaneously
3. [ ] End turn
4. [ ] Verify only ONE notification appears
5. [ ] Close notification
6. [ ] Check console logs for all revelations
7. [ ] Verify all agendas revealed (check LeaderContactModal)

**Pass Criteria**: No UI bugs with multiple revelations

---

### Edge Case 3: Revelation During War

**Setup**: At war with AI

**Steps**:
1. [ ] Form alliance with AI
2. [ ] Maintain for 15 turns
3. [ ] Break alliance and declare war on turn 16
4. [ ] Verify revelation still occurs (or doesn't due to war)
5. [ ] Check if notification appears during war

**Pass Criteria**: Graceful handling of revelation during conflict

---

### Edge Case 4: Player Nation Check

**Setup**: Verify player never gets agendas

**Steps**:
1. [ ] Start game
2. [ ] Open browser dev console
3. [ ] Run: `PlayerManager.get().agendas`
4. [ ] Verify returns `undefined` or empty
5. [ ] Player should never have agendas assigned

**Pass Criteria**: Player nation never gets agendas

---

## PERFORMANCE TESTS

### Performance Test 1: Revelation Processing

**Setup**: Late game with many nations

**Steps**:
1. [ ] Play to turn 50+
2. [ ] End turn
3. [ ] Check console for processing time
4. [ ] Verify no lag or freezing
5. [ ] Verify smooth transitions

**Pass Criteria**: No performance degradation

---

### Performance Test 2: UI Rendering

**Setup**: Open LeaderContactModal repeatedly

**Steps**:
1. [ ] Open modal for AI #1
2. [ ] Close modal
3. [ ] Open modal for AI #2
4. [ ] Repeat for all AIs
5. [ ] Verify no memory leaks
6. [ ] Check React DevTools for unnecessary re-renders

**Pass Criteria**: Smooth UI performance

---

## BUG TRACKING

### Known Issues
_To be filled during testing_

| ID | Severity | Description | Steps to Reproduce | Status |
|----|----------|-------------|-------------------|--------|
| | | | | |

---

## ACCEPTANCE CRITERIA

### Technical Success ✅ or ❌

- [ ] Each AI has exactly 2 agendas (1 primary, 1 hidden)
- [ ] Agendas affect relationship (±15-30)
- [ ] Agendas affect negotiation evaluation (±20-100)
- [ ] Hidden agendas reveal based on conditions
- [ ] No crashes or game-breaking bugs
- [ ] No TypeScript errors
- [ ] No React warnings
- [ ] Good performance (no lag)

### UX Success ✅ or ❌

- [ ] Player understands agendas without tutorial
- [ ] Agendas feel relevant and meaningful
- [ ] Discovery mechanic is rewarding
- [ ] AI feels more unique with agendas
- [ ] Feedback helps player understand rejections
- [ ] Revelation notification is exciting
- [ ] UI is clear and intuitive

### Balance Success ✅ or ❌

- [ ] Agendas not too strong (can't steamroll)
- [ ] Agendas not too weak (still impactful)
- [ ] Revelation timing feels good (not too early/late)
- [ ] All agendas equally viable
- [ ] No dominant strategy emerges

---

## TESTING COMPLETION

**Tester Name**: _________________
**Date Completed**: _________________
**Total Tests Passed**: _____ / _____
**Critical Bugs Found**: _____
**Minor Bugs Found**: _____

**Overall Assessment**:
- [ ] Ready for production
- [ ] Needs minor fixes
- [ ] Needs major revision

**Notes**:
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

## NEXT STEPS

After testing complete:
1. Fix any critical bugs found
2. Update AGENDA_TASKS.md with results
3. Create bug fix commits if needed
4. Final polish and documentation (Task 4.8)
5. Merge to main branch

---

**Last Updated**: 2025-11-02
**Status**: Ready for Testing
**Phase**: Phase 4 - Agenda System
