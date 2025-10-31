# Phase 7 Implementation Plan: Simplify Main NoradVector Component

**Status:** Planned (Not Yet Implemented)
**Estimated Effort:** 12-16 hours
**Current Component Size:** 5,336 lines (line 4286-9622)
**Target Size:** <3,000 lines
**Required Reduction:** ~2,336 lines (44%)

---

## Overview

Phase 7 is the final and most complex phase of the Index.tsx refactoring. The NoradVector component currently contains 5,336 lines of React code including state management, event handlers, modal rendering, and complex UI logic.

---

## Analysis

### Current Component Structure (5,336 lines)

**State Management (~800 lines)**
- 40+ useState declarations
- useRef declarations for DOM and mutable state
- State initialization and default values

**Event Handlers & Callbacks (~1,200 lines)**
- Game action handlers (build, research, launch, etc.)
- UI event handlers (modals, panels, buttons)
- Multiplayer coordination callbacks
- Audio and effect triggers

**Modal Rendering Functions (~882 lines)**
- `renderMilitaryModal` (172 lines) - Conventional warfare interface
- `renderResearchModal` (327 lines) - Research tree and queue management
- `renderBuildModal` (383 lines) - Production and construction interface

**Intro/Setup Screens (~176 lines)**
- `renderIntroScreen` (92 lines) - Main menu and high scores
- `renderLeaderSelection` (42 lines) - Leader choice interface
- `renderDoctrineSelection` (42 lines) - Doctrine selection

**useEffect Hooks (~600 lines)**
- Game initialization
- Multiplayer synchronization
- Audio management
- Display updates
- Keyboard shortcuts

**Main JSX Return (~1,000 lines)**
- Game UI layout
- Status displays
- Action buttons
- Canvas/viewer integration
- Overlays and dialogs

**Helper Functions & Utilities (~678 lines)**
- Display update functions
- Resource calculations
- Game loop management

---

## Proposed Extraction Plan

### Priority 1: Extract Modal Components (882 lines)

**1. MilitaryModal Component (172 lines)**
- Path: `src/components/game/MilitaryModal.tsx`
- Dependencies: conventional warfare hooks, PlayerManager
- Props needed: ~15 (handlers, state, refs)
- Complexity: Medium

**2. ResearchModal Component (327 lines)**
- Path: `src/components/game/ResearchModal.tsx`
- Dependencies: RESEARCH_LOOKUP, player state
- Props needed: ~10 (handlers, research state)
- Complexity: Medium

**3. BuildModal Component (383 lines)**
- Path: `src/components/game/BuildModal.tsx`
- Dependencies: COSTS, build handlers, player state
- Props needed: ~12 (build functions, game state)
- Complexity: High (many sub-options)

### Priority 2: Extract Screen Components (176 lines)

**4. IntroScreen Component (92 lines)**
- Path: `src/components/intro/IntroScreen.tsx`
- Uses existing: IntroLogo, Starfield, SpinningEarth
- Props needed: ~5 (handlers, scenario state)
- Complexity: Low

**5. LeaderSelectionScreen Component (42 lines)**
- Path: `src/components/setup/LeaderSelectionScreen.tsx`
- Props needed: ~4 (leaders, selection handler)
- Complexity: Low

**6. DoctrineSelectionScreen Component (42 lines)**
- Path: `src/components/setup/DoctrineSelectionScreen.tsx`
- Props needed: ~4 (doctrines, selection handler)
- Complexity: Low

### Priority 3: Create Custom Hooks (400-600 lines reduction)

**7. useModalManager Hook**
- Path: `src/hooks/useModalManager.ts`
- Centralizes: modal state, open/close logic
- Returns: openModal, closeModal, modalState
- Reduces: ~80 lines from main component

**8. useGameAudio Hook**
- Path: `src/hooks/useGameAudio.ts`
- Centralizes: music/SFX state, AudioSys integration
- Returns: audio controls, state getters/setters
- Reduces: ~120 lines from main component

**9. useNewsManager Hook**
- Path: `src/hooks/useNewsManager.ts`
- Centralizes: news items state, add/clear functions
- Returns: newsItems, addNewsItem, clearNews
- Reduces: ~60 lines from main component

**10. useGameInitialization Hook**
- Path: `src/hooks/useGameInitialization.ts`
- Centralizes: game setup, nation initialization
- Returns: initGame, isInitialized
- Reduces: ~150 lines from main component

**11. useGameLoop Hook**
- Path: `src/hooks/useGameLoop.ts`
- Centralizes: animation loop, rendering updates
- Returns: startLoop, stopLoop, frameRef
- Reduces: ~100 lines from main component

### Priority 4: Extract UI Components (400-600 lines reduction)

**12. GameHeader Component**
- Path: `src/components/game/GameHeader.tsx`
- Content: DEFCON, turn, actions, date, cyber status bar
- Props needed: ~8 (state values, handlers)
- Reduces: ~100 lines

**13. ResourcePanel Component**
- Path: `src/components/game/ResourcePanel.tsx`
- Content: Production, uranium, intel display
- Props needed: ~5 (player state)
- Reduces: ~80 lines

**14. ActionButtonGrid Component**
- Path: `src/components/game/ActionButtonGrid.tsx`
- Content: Main action buttons (build, research, intel, etc.)
- Props needed: ~15 (handlers, permissions)
- Reduces: ~200 lines

**15. GameCanvas Component**
- Path: `src/components/game/GameCanvas.tsx`
- Content: GlobeScene/CesiumViewer wrapper with HUD layers
- Props needed: ~20 (canvas props, refs, handlers)
- Reduces: ~150 lines

**16. GameOverlays Component**
- Path: `src/components/game/GameOverlays.tsx`
- Content: All modals, dialogs, overlays, panels
- Props needed: ~30 (state, handlers for all overlays)
- Reduces: ~300 lines

---

## Implementation Steps

### Week 1: Modal Extraction (6-8 hours)

**Day 1-2: Extract Modal Components**
1. Create `src/components/game/` directory
2. Extract MilitaryModal component
3. Extract ResearchModal component
4. Extract BuildModal component
5. Update Index.tsx imports
6. Test all modal functionality
7. Verify build succeeds

### Week 2: Hooks & Screens (4-6 hours)

**Day 3: Create Custom Hooks**
1. Create `src/hooks/game/` directory
2. Implement useModalManager
3. Implement useGameAudio
4. Implement useNewsManager
5. Update Index.tsx to use hooks
6. Test functionality

**Day 4: Extract Screen Components**
1. Create `src/components/setup/` directory
2. Extract IntroScreen
3. Extract LeaderSelectionScreen
4. Extract DoctrineSelectionScreen
5. Update Index.tsx
6. Test game flow

### Week 3: UI Components (4-6 hours)

**Day 5: Extract UI Components**
1. Extract GameHeader component
2. Extract ResourcePanel component
3. Extract ActionButtonGrid component
4. Update Index.tsx
5. Test UI interactions

**Day 6: Advanced Extractions**
1. Create useGameInitialization hook
2. Create useGameLoop hook
3. Extract GameCanvas component
4. Extract GameOverlays component
5. Final integration testing

**Day 7: Polish & Documentation**
1. Verify all functionality
2. Update REFACTORING_SUMMARY.md
3. Update AUDIT_PROGRESS.md
4. Create pull request
5. Code review

---

## Technical Considerations

### Prop Passing Strategy

Many extracted components will need numerous props. Consider:
- **Prop drilling**: Simple but can get verbose
- **Context API**: For deeply nested components
- **Composition**: Pass rendered components as children

### State Management Migration

Current state is managed via useState. Consider:
- Keep useState for component-local UI state
- Use custom hooks for shared game state
- GameStateManager already provides centralized game state

### Testing Strategy

Each extracted component should be:
- **Testable**: Pure functions where possible
- **Mockable**: External dependencies injectable
- **Verifiable**: Build succeeds, no TypeScript errors
- **Functional**: Manual testing of all features

### Breaking Changes

**None Expected:**
- All extractions are internal refactoring
- No API changes
- No prop interface changes for existing exported components
- All game logic preserved

---

## Expected Outcomes

### Line Count Targets

| Component | Current | Target | Reduction |
|-----------|---------|--------|-----------|
| Modal Functions | 882 | 0 | -882 |
| Screen Renders | 176 | 0 | -176 |
| Custom Hooks | 0 | +500 | (new files) |
| UI Components | 1,000 | 200 | -800 |
| Event Handlers | 1,200 | 600 | -600 |
| Main JSX | 1,000 | 500 | -500 |
| **Total** | **5,336** | **<3,000** | **-2,336** |

### File Structure After Phase 7

```
src/
├── components/
│   ├── game/
│   │   ├── GameHeader.tsx
│   │   ├── ResourcePanel.tsx
│   │   ├── ActionButtonGrid.tsx
│   │   ├── GameCanvas.tsx
│   │   ├── GameOverlays.tsx
│   │   ├── MilitaryModal.tsx
│   │   ├── ResearchModal.tsx
│   │   └── BuildModal.tsx
│   ├── setup/
│   │   ├── IntroScreen.tsx
│   │   ├── LeaderSelectionScreen.tsx
│   │   └── DoctrineSelectionScreen.tsx
│   └── intro/ (existing)
├── hooks/
│   └── game/
│       ├── useModalManager.ts
│       ├── useGameAudio.ts
│       ├── useNewsManager.ts
│       ├── useGameInitialization.ts
│       └── useGameLoop.ts
├── state/ (existing from Phase 6)
└── pages/
    └── Index.tsx (~3,000 lines)
```

### Code Quality Improvements

- **Better Organization**: Clear component hierarchy
- **Improved Testability**: Smaller, focused units
- **Easier Maintenance**: Changes isolated to specific files
- **Better Performance**: Potential for React.memo optimization
- **Clearer Dependencies**: Explicit prop passing
- **Reusability**: Components usable in other contexts

---

## Risks & Mitigation

### Risk 1: Prop Drilling Complexity
**Impact:** High number of props makes components hard to use
**Mitigation:**
- Use Context API for deeply shared state
- Group related props into config objects
- Document prop interfaces thoroughly

### Risk 2: Breaking Existing Functionality
**Impact:** Game features stop working after extraction
**Mitigation:**
- Extract one component at a time
- Test thoroughly after each extraction
- Keep git commits atomic for easy rollback

### Risk 3: Performance Degradation
**Impact:** More components = more renders
**Mitigation:**
- Use React.memo for expensive components
- Optimize prop passing (avoid inline objects)
- Profile before/after with React DevTools

### Risk 4: Type Safety Issues
**Impact:** TypeScript errors during extraction
**Mitigation:**
- Define clear prop interfaces upfront
- Use strict TypeScript checking
- Leverage type inference where possible

---

## Success Criteria

Phase 7 is complete when:

✅ Main NoradVector component is **under 3,000 lines**
✅ All 3 modal functions extracted to separate components
✅ All 3 intro/setup screens extracted
✅ At least 3 custom hooks created and integrated
✅ At least 3 UI components extracted
✅ **Zero TypeScript compilation errors**
✅ **All game functionality works** (manual testing)
✅ **Build succeeds** (npm run build)
✅ **Documentation updated** (REFACTORING_SUMMARY.md, AUDIT_PROGRESS.md)

---

## Future Enhancements (Post-Phase 7)

After completing Phase 7, consider:

1. **Add unit tests** for extracted components
2. **Implement React.memo** for performance
3. **Add Storybook** for component documentation
4. **Create E2E tests** for critical game flows
5. **Migrate to Zustand/Redux** for advanced state management
6. **Add TypeScript strict mode** for better type safety
7. **Implement code splitting** for faster initial load
8. **Add performance monitoring** (React Profiler)

---

## Notes

- Phase 7 is the largest and most complex refactoring phase
- Estimated 12-16 hours is realistic given the scope
- Can be done incrementally over multiple sessions
- Each extraction should be committed separately
- Testing is critical - don't skip manual verification
- Document any breaking changes immediately

---

**Document Created:** 2025-10-31
**Phase Status:** Planned (Awaiting Implementation)
**Prerequisites:** Phase 6 Complete ✅
