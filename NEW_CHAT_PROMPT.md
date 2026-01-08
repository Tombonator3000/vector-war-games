# 🎮 VECTOR WAR GAMES - GAME STARTUP FEIL

Hei! Jeg trenger hjelp med å fikse spillet mitt som krasjer ved oppstart.

## 📍 REPO INFO
- **Repo:** https://github.com/Tombonator3000/vector-war-games
- **Hovedbranch:** main
- **Sist merged PR:** #852 (fix game startup after Index refactoring)

## ⚠️ PROBLEMET

**Spillet krasjer når jeg prøver å starte gameplay (etter meny).**

### Hva fungerer:
✅ Meny laster
✅ Kan velge scenario
✅ Kompilering går uten TypeScript errors

### Hva IKKE fungerer:
❌ Spillet krasjer når jeg klikker "Start Game"
❌ Runtime error i console

---

## 🔍 KJENT HISTORIKK

### Tidligere fikset (allerede i main via PR #852):
1. ✅ Reserved word `yield` → `kilotons` (gameInitialization.ts:82)
2. ✅ Manglende GameState properties (game.ts)
3. ✅ Feil import path @/types/core → @/types/game (cultureHandlers.tsx:9)
4. ✅ DEFCON constants export/import (gameUtilityFunctions.ts + Index.tsx)

**DISSE TRENGER IKKE FIKSES IGJEN!**

---

## 🚨 NYE FEIL SOM MÅ FIKSES

**Se screenshot/console error jeg har sendt.**

Typiske feil kan være:
- Runtime ReferenceError (variabel ikke definert)
- Import/export mangler
- TypeScript type errors som ikke ble fanget
- Initialiserings-feil

---

## 📋 VIKTIG Å VITE

### Utviklingsmiljø:
- **Jeg kjører i Lovable IDE** (cloud-based, ikke lokal maskin)
- Dev server MÅ kjøres med `--host` flag
- URL er IKKE localhost - det er en Lovable preview URL
- Lovable har noen ganger strengere type-checking enn terminal

### Filstruktur:
```
src/
├── pages/
│   └── Index.tsx          # Hovedfil (16000+ linjer, refactored)
├── lib/
│   ├── gameInitialization.ts
│   ├── gameUtilityFunctions.ts
│   ├── cultureHandlers.tsx
│   └── ... (mange andre)
├── types/
│   └── game.ts
└── state/
    ├── GameStateManager.ts
    ├── PlayerManager.ts
    └── index.ts
```

### Viktige moduler:
- **GameStateManager:** Håndterer global state (tidligere S object)
- **Index.tsx:** Hovedkomponent (NoradVector)
- **gameUtilityFunctions.ts:** Pure utility functions
- **DEFCON constants:** CSS-klasser for DEFCON indicator

---

## 🎯 HJELP MEG MED:

1. **Analyser error message** jeg sender
2. **Finn hva som mangler:**
   - Er det en variabel som ikke er definert?
   - Er det en import/export som mangler?
   - Er det en type error?
3. **Fiks problemet:**
   - Export konstanter/funksjoner som trengs
   - Import dem der de brukes
   - Sjekk at types er korrekte
4. **Test at det fungerer:**
   - Dev server kompilerer uten errors
   - Game starter uten crash

---

## ⚡ WORKING PROCESS

### Gjør DETTE:
1. ✅ Les error message nøye
2. ✅ Søk i kodebasen etter variabelen/funksjonen
3. ✅ Sjekk om den er eksportert der den er definert
4. ✅ Sjekk om den er importert der den brukes
5. ✅ Fiks export/import
6. ✅ Commit og push til ny branch: `claude/fix-XXX-[session-id]`

### IKKE gjør dette:
❌ Ikke endre kode som allerede fungerer
❌ Ikke refaktorer ting som ikke er relatert til error
❌ Ikke anta at noe er globalt tilgjengelig
❌ Ikke bruk Bash-kommandoer for filoperasjoner (bruk Read/Edit/Write tools)

---

## 📚 DOKUMENTASJON

Alt er dokumentert i `log.md`:
- Session 16: Dev server og node_modules fix
- Session 17: Compilation errors (yield, GameState, imports)
- Session 18: DEFCON constants export/import

**Les log.md hvis du trenger mer kontekst!**

---

## 🔴 START HER:

**Send meg error screenshot/message først, så finner vi løsningen sammen!**

Fortell meg:
1. Hva er error message?
2. Hvilken fil krasjer?
3. Hvilken linje?
4. Hva er variabel/funksjon navnet?

Så løser vi det systematisk! 🚀

---

## 📝 REFERANSE: Siste fixes (allerede merged)

```typescript
// gameInitialization.ts:82
warheads: { [kilotons: number]: number };  // yield → kilotons

// game.ts (GameState interface)
conventionalMovements?: unknown[];
conventionalUnits?: unknown[];

// cultureHandlers.tsx:9
import type { Nation } from '@/types/game';  // core → game

// gameUtilityFunctions.ts:21-23
export const DEFCON_BADGE_BASE_CLASSES = '...';
export const DEFCON_VALUE_BASE_CLASSES = '...';

// Index.tsx imports
import {
  DEFCON_BADGE_BASE_CLASSES,
  DEFCON_VALUE_BASE_CLASSES,
  // ...
} from '@/lib/gameUtilityFunctions';
```
