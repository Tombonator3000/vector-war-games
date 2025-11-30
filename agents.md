# AI Agent Guidelines for Vector War Games

This document provides guidelines and rules for AI agents (such as Claude, GPT, etc.) working on the Vector War Games codebase.

## Project Overview

Vector War Games is a strategic Cold War crisis management simulation game built with React, TypeScript, Three.js, and Vite. The game features complex systems including nuclear warfare, diplomacy, espionage, pandemics, and geopolitical crisis management.

---

## Mandatory Requirements

### 1. Change Logging

**Every PR must include an update to `log.md`**

When pushing changes via a Pull Request, agents MUST:

1. Update the `log.md` file in the project root
2. Include the following information:
   - Date and time of changes
   - Brief description of what was changed
   - Files modified/added/deleted
   - Reason for the changes
   - Any breaking changes or important notes

Example log entry:
```markdown
## 2025-11-30

### Feature: Added new flashpoint system
- **Agent:** Claude
- **Files changed:**
  - `src/lib/flashpoints.ts` (modified)
  - `src/components/game/FlashpointCard.tsx` (added)
- **Description:** Implemented new flashpoint event system for Southeast Asia region
- **Breaking changes:** None
- **Notes:** Requires testing with multiplayer mode
```

### 2. Game Rule Compliance

**All game mechanics must follow the official rulebook**

The game rules are defined in `deep-regrets-rulebook.pdf`. When implementing or modifying game mechanics:

- Read and understand the relevant sections of the rulebook
- Ensure all implementations align with the documented rules
- If rules are unclear or conflicting, document the interpretation used
- Never implement "house rules" or custom mechanics without explicit approval

---

## Development Guidelines

### Code Standards

1. **TypeScript:** All new code must be written in TypeScript with proper typing
2. **Components:** Follow the existing component structure in `src/components/`
3. **Hooks:** Game logic should be encapsulated in custom hooks (`src/hooks/`)
4. **Utilities:** Reusable functions go in `src/lib/`
5. **Types:** Define types in `src/types/`

### Before Making Changes

1. **Explore first:** Understand the existing codebase structure before modifying
2. **Check documentation:** Review relevant docs in `/docs/` and root-level `.md` files
3. **Identify dependencies:** Understand how systems connect before changing them
4. **Test impact:** Consider how changes affect related systems

### Commit Messages

Use clear, descriptive commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `style:` for formatting changes
- `test:` for adding tests

Example: `feat: Add radiation decay system for nuclear fallout zones`

### Branch Naming

When creating branches, use the format:
```
claude/<description>-<session-id>
```

---

## Architecture Awareness

### Key Systems to Understand

| System | Location | Description |
|--------|----------|-------------|
| Flashpoints | `src/hooks/useFlashpoints.ts`, `src/lib/flashpoints/` | Crisis event system |
| Pandemic | `src/hooks/usePandemic.ts`, `src/components/pandemic/` | Disease spread simulation |
| Diplomacy | `src/lib/diplomacy/`, `src/components/governance/` | International relations |
| Nuclear | `src/components/nuclearWar/`, `src/lib/nuclear/` | Nuclear warfare mechanics |
| Espionage | `src/components/spy/`, `src/lib/spy/` | Intelligence operations |
| 3D Globe | `src/rendering/`, `src/components/game/` | Map visualization |

### State Management

- Game state is managed through React hooks and context
- Use the existing patterns in `src/contexts/` and `src/state/`
- The RNG context provides deterministic random numbers for reproducibility

### UI Components

- Uses shadcn-ui components from `src/components/ui/`
- Styling is done with Tailwind CSS
- Follow existing patterns for consistency

---

## Testing Requirements

1. Run existing tests before pushing: `npm run test`
2. Add tests for new functionality when appropriate
3. Ensure no type errors: `npm run build`
4. Test in browser for UI changes

---

## Documentation

When adding new features or systems:

1. Add inline code comments for complex logic
2. Update relevant documentation files
3. Consider adding a new doc file for major features (in `/docs/`)
4. Always update `log.md`

---

## Communication

### When Uncertain

If you encounter:
- Ambiguous requirements → Ask for clarification
- Conflicting rules → Document both interpretations and ask
- Missing information → Research existing code first, then ask
- Breaking changes → Warn before implementing

### Important Files to Know

| File | Purpose |
|------|---------|
| `log.md` | Change log (MUST update with every PR) |
| `agents.md` | This file - agent guidelines |
| `deep-regrets-rulebook.pdf` | Official game rules |
| `README.md` | Project overview |
| `/docs/` | Feature documentation |

---

## Prohibited Actions

1. **DO NOT** push directly to main/master branch
2. **DO NOT** implement game mechanics that contradict the rulebook
3. **DO NOT** delete or overwrite existing game data without backup
4. **DO NOT** introduce security vulnerabilities
5. **DO NOT** make changes without logging them
6. **DO NOT** modify multiplayer/Supabase configurations without explicit approval

---

## Quick Start Checklist

Before starting work:
- [ ] Read this document
- [ ] Review `log.md` for recent changes
- [ ] Understand the task requirements
- [ ] Check relevant documentation

When finishing work:
- [ ] Run tests (`npm run test`)
- [ ] Run build (`npm run build`)
- [ ] Update `log.md` with your changes
- [ ] Create descriptive commit messages
- [ ] Push to the correct branch

---

*Last updated: 2025-11-30*
