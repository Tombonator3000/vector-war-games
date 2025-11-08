# Diplomacy System Refactoring Prompt

Use this prompt to begin fixing the diplomacy system in a new chat session.

---

## CONTEXT

I have a comprehensive audit of my diplomacy system saved in `DIPLOMACY_AUDIT_FINDINGS.md`. The audit identified critical bugs, architectural conflicts, and design inconsistencies across the diplomacy implementation.

The main issue is that there are **two parallel relationship systems** with conflicting threshold values, decay algorithms, and acceptance modifiers:
- `src/types/unifiedDiplomacy.ts` (used by UI)
- `src/lib/relationshipUtils.ts` (used by game logic)

Additionally, there's a critical bug at `src/pages/Index.tsx:6554` where `modifyRelationship()` is called with the wrong signature.

---

## YOUR TASK

Please read the audit findings in `DIPLOMACY_AUDIT_FINDINGS.md` and help me fix the diplomacy system following these priorities:

### PRIORITY 1: CRITICAL FIXES (Do First)

1. **Fix the broken function call at `src/pages/Index.tsx:6554`**
   - The `modifyRelationship()` call has wrong parameters
   - It's passing `nations` array instead of single `Nation`
   - Missing `reason` and `currentTurn` parameters
   - Not using the returned `Nation` object
   - This breaks relationship changes from conventional warfare

2. **Consolidate the dual relationship systems**
   - We have two conflicting implementations:
     - `src/types/unifiedDiplomacy.ts` (alliance threshold: 60)
     - `src/lib/relationshipUtils.ts` (alliance threshold: 25)
   - **DECISION NEEDED:** Which thresholds should we use?
     - Option A: Use unifiedDiplomacy thresholds (60 for alliance)
     - Option B: Use relationshipUtils thresholds (25 for alliance)
     - Option C: Design new balanced thresholds
   - After deciding, consolidate into ONE authoritative source
   - Update all imports across the codebase

3. **Merge conflicting RelationshipDeltas constants**
   - `FORM_ALLIANCE`: 40 vs 20
   - `BREAK_TREATY`: -35 vs -25
   - Decay algorithms are completely different
   - Create single source of truth

### PRIORITY 2: HIGH PRIORITY FIXES

4. **Clarify and document system architecture**
   - Are Phase 1/2/3 systems deprecated or still active?
   - If still active: document how they interact with unified system
   - If deprecated: add deprecation warnings and migration plan
   - Document which system is authoritative for each use case

5. **Implement proposal expiration**
   - Add validation to reject proposals older than 10 turns
   - Auto-cleanup expired proposals to prevent memory bloat

6. **Fix alliance threshold confusion**
   - UI and game logic must use same threshold
   - Update `UnifiedDiplomacyPanel.tsx` to match chosen system

### PRIORITY 3: MEDIUM PRIORITY

7. **Audit and fix penalty stacking**
   - When treaty breaks, verify we're not double-counting penalties
   - Document interaction between grievances and relationship scores
   - Ensure migration system doesn't unintentionally stack modifiers

8. **Add alliance obligation enforcement**
   - Military alliances should create grievances when you don't defend ally
   - Economic alliances should have consequences for not sharing
   - Make alliances meaningful beyond stat bonuses

9. **Verify AI proactive diplomacy**
   - Check if `checkAINegotiationTriggers()` is actually called in game loop
   - If not, integrate it into turn processing
   - Add debug logging for AI-initiated proposals

### PRIORITY 4: OPTIONAL ENHANCEMENTS

10. **Implement peace treaty compliance tracking**
11. **Optimize relationship decay for large nation counts**
12. **Consolidate relationship history tracking**

---

## DESIGN DECISIONS I NEED YOU TO HELP ME MAKE

Before fixing, please help me decide:

### Decision 1: Alliance Formation Threshold
- **Option A:** Require relationship >= 60 (more restrictive, alliances are special)
- **Option B:** Require relationship >= 25 (more permissive, easier diplomacy)
- **Recommendation:** Which feels better for gameplay balance?

### Decision 2: Relationship Decay Rate
- **Option A:** Fixed 0.5/turn (slow, stable relationships)
- **Option B:** Dynamic 1-2/turn based on value (faster convergence to neutral)
- **Recommendation:** Which creates better diplomatic dynamics?

### Decision 3: Phase System Architecture
- **Option A:** Fully deprecate Phase 1/2/3, only use Unified system
- **Option B:** Keep phases as internal modifiers that feed into Unified
- **Option C:** Allow players to choose which system to use
- **Recommendation:** What's the cleanest architecture?

### Decision 4: Acceptance Modifier Scaling
- **Option A:** Linear (relationship 100 = 2.0x multiplier)
- **Option B:** Conservative (relationship 100 = 1.5x multiplier)
- **Recommendation:** Which prevents AI being too predictable?

---

## APPROACH

Please use this step-by-step approach:

### Step 1: Analysis & Decision Making (30 min)
1. Read the full audit in `DIPLOMACY_AUDIT_FINDINGS.md`
2. Search the codebase to verify current usage patterns
3. Help me make the 4 design decisions above
4. Create a detailed implementation plan

### Step 2: Critical Bug Fixes (1-2 hours)
1. Fix `Index.tsx:6554` relationship callback
2. Choose ONE relationship system as authoritative
3. Update all imports to use single system
4. Consolidate RelationshipDeltas constants
5. Test that basic diplomacy works

### Step 3: System Consolidation (2-4 hours)
1. Merge duplicate functions (getRelationshipCategory, canFormAlliance, etc.)
2. Remove or deprecate redundant files
3. Update UI components to use consolidated system
4. Update AI logic to use consolidated system
5. Add migration logic if needed for save games

### Step 4: Documentation & Validation (1 hour)
1. Add inline comments explaining the chosen architecture
2. Document how phases interact with unified system
3. Create test cases for edge cases (threshold boundaries)
4. Verify no double-counting of penalties

### Step 5: Enhancements (Optional, 2-4 hours)
1. Implement proposal expiration
2. Add alliance obligation enforcement
3. Verify AI proactive diplomacy
4. Any other priority 3/4 items

---

## FILES TO FOCUS ON

### Must Review:
- ✅ `DIPLOMACY_AUDIT_FINDINGS.md` (the audit)
- 🔴 `src/pages/Index.tsx` (line 6554 - broken call)
- 🔴 `src/types/unifiedDiplomacy.ts` (option A for system)
- 🔴 `src/lib/relationshipUtils.ts` (option B for system)
- 🔴 `src/lib/unifiedDiplomacyMigration.ts` (maintains dual state)

### May Need Updates:
- `src/components/UnifiedDiplomacyPanel.tsx` (UI imports)
- `src/lib/aiUnifiedDiplomacy.ts` (AI imports)
- `src/lib/diplomacyPhase2Integration.ts` (penalty stacking)
- `src/lib/aiNegotiationEvaluator.ts` (evaluation logic)
- `src/lib/aiNegotiationTriggers.ts` (verify it's called)

### May Deprecate:
- Phase 1, 2, 3 files (depending on Decision 3)

---

## SUCCESS CRITERIA

The refactoring is successful when:

1. ✅ **No duplicate systems** - One authoritative relationship system
2. ✅ **Consistent thresholds** - UI and game logic agree on when alliances can form
3. ✅ **No broken calls** - `modifyRelationship()` used correctly everywhere
4. ✅ **Clear architecture** - Documentation explains which systems are active
5. ✅ **No double-counting** - Penalties applied once, not stacked unintentionally
6. ✅ **Tests pass** - Alliance formation works at correct thresholds
7. ✅ **AI works** - Nations correctly evaluate and initiate diplomacy

---

## TESTING CHECKLIST

After implementing fixes, verify:

- [ ] Can form alliance at the correct relationship threshold
- [ ] Cannot form alliance below threshold
- [ ] UI displays correct relationship category
- [ ] Alliance button enabled/disabled matches actual ability to form alliance
- [ ] Breaking treaty applies penalty exactly once (not double-counted)
- [ ] Conventional warfare correctly modifies relationships
- [ ] AI accepts/rejects proposals logically based on relationship
- [ ] Relationship decay works consistently
- [ ] No TypeScript errors
- [ ] No runtime errors in console

---

## COMMIT STRATEGY

Please create commits in this order:

1. `fix: correct modifyRelationship call signature at Index.tsx:6554`
2. `refactor: consolidate relationship systems into single source of truth`
3. `refactor: merge RelationshipDeltas constants`
4. `docs: document diplomacy system architecture and phase interactions`
5. `feat: implement proposal expiration validation`
6. `feat: add alliance obligation enforcement` (optional)
7. `test: add diplomacy threshold edge case tests` (optional)

---

## QUESTIONS TO ASK ME

Before you start, please ask me:

1. Which alliance threshold do I prefer? (25 or 60 or custom?)
2. Which decay algorithm feels better for my game?
3. Should we fully deprecate Phase 1/2/3 or keep them as internal modifiers?
4. Do I want to maintain backward compatibility with existing save games?
5. Should AI be more or less likely to accept deals at high relationships?

---

## FINAL NOTE

This is a significant refactoring. Please:
- Start with the critical bugs (Priority 1)
- Make one decision at a time
- Test after each major change
- Ask clarifying questions when unsure
- Focus on correctness first, optimization later

The audit is comprehensive, so you have all the context needed. Let's fix this systematically!

---

**BEGIN HERE:**

"I have read the DIPLOMACY_AUDIT_FINDINGS.md file. Before I start fixing, let me ask you the 5 design decision questions..."
