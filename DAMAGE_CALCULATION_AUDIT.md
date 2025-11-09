# Damage Calculation Audit Report
**Date**: 2025-11-09
**Scope**: Complete audit of damage calculations for rockets, missiles, radioactivity, and all warfare systems

---

## Executive Summary

This audit examined all damage calculation systems in the Vector War Games codebase. **2 critical bugs** and **1 design inconsistency** were identified that affect gameplay balance and correctness.

### Findings Overview:
- ✅ **8 damage systems verified** - Nuclear missiles, radiation, bio-weapons, nuclear winter, orbital strikes, EMP, bombers, conventional warfare
- ❌ **2 critical bugs found** - Double explosion vulnerability, array iteration bug
- ⚠️ **1 design inconsistency** - Interception rate differences between missiles and bombers

---

## Damage Systems Analyzed

### 1. Nuclear Missile Damage ✅
**Location**: `src/pages/Index.tsx:4051-4056`

**Formula**:
```typescript
const reduction = Math.max(0, 1 - target.defense * 0.05);
const damage = yieldMT * reduction;
target.population = Math.max(0, target.population - damage);
target.instability = Math.min(100, (target.instability || 0) + yieldMT);
```

**Analysis**: ✅ CORRECT
- Each defense point reduces damage by 5%
- Damage scales linearly with warhead yield
- Population loss is capped at 0 (no underflow)
- Instability is capped at 100 (no overflow)

**Example**: 50MT warhead vs 10 defense
- Reduction: 1 - (10 × 0.05) = 0.5
- Damage: 50 × 0.5 = 25 million population loss

---

### 2. Radiation Zone Damage ✅
**Location**: `src/lib/gamePhaseHandlers.ts:244-256`

**Formula**:
```typescript
zone.intensity *= 0.95;  // 5% decay per turn
const damage = zone.intensity * 3;
const mitigatedDamage = damage * (1 - radiationMitigation);
n.population = Math.max(0, n.population - mitigatedDamage);
```

**Creation** (`src/pages/Index.tsx:4003-4007`):
```typescript
S.radiationZones.push({
  x, y,
  radius: Math.sqrt(yieldMT) * 8,
  intensity: yieldMT / 100
});
```

**Analysis**: ✅ CORRECT
- Radiation zones decay by 5% per turn
- Initial intensity: yieldMT / 100
- Damage multiplier: 3
- Bio-defense research can provide mitigation
- Zones are cleaned up when intensity < 0.01

**Example**: 50MT warhead radiation
- Initial intensity: 50 / 100 = 0.5
- Turn 1 damage: 0.5 × 3 = 1.5M per turn (before mitigation)
- Turn 2 damage: 0.475 × 3 = 1.425M per turn
- Radius: √50 × 8 ≈ 56.6 units
- Total damage over 20 turns: ~28.5M population

---

### 3. Bio-Weapon Damage ✅
**Location**: `src/types/simplifiedBiowarfare.ts:107-119`

**Formula**:
```typescript
const basePercentLoss = 0.03 + Math.random() * 0.02;  // 3-5% per turn
const baseDamage = targetPopulation * basePercentLoss;
const actualDamage = baseDamage * (1 - defense.damageReduction);
```

**Defense Levels**:
- Level 0: 0% reduction
- Level 1: 30% reduction
- Level 2: 50% reduction
- Level 3: 75% reduction

**Duration**: 5-8 turns random

**Analysis**: ✅ CORRECT
- Random damage percentage creates variability
- Defense levels provide meaningful reduction
- Duration is reasonable for game balance

**Example**: 100M population, level 1 defense
- Base damage: 100M × 0.04 (avg) = 4M per turn
- After defense: 4M × (1 - 0.30) = 2.8M per turn
- Total over 6 turns: ~16.8M population loss

---

### 4. Bio-Warfare Food Production Damage ✅
**Location**: `src/lib/simplifiedBioWarfareLogic.ts:208-216`

**Formula**:
```typescript
const damagePerAttack = 0.10;  // 10% per attack
const totalFoodDamage = Math.min(0.90, damagePerAttack * activeBioAttacks.length);
territoryResources.productionPenalty = Math.max(0, Math.min(1, (productionPenalty || 1.0) - damagePercent));
```

**Analysis**: ✅ CORRECT
- Each active bio-attack reduces food production by 10%
- Maximum reduction capped at 90% (prevents total shutdown)
- Applied to all controlled territories

---

### 5. Nuclear Winter ✅
**Location**: `src/lib/gamePhaseHandlers.ts:264-279`

**Accumulation** (`src/pages/Index.tsx:4011`):
```typescript
if (yieldMT >= 50) {
  S.nuclearWinterLevel = (S.nuclearWinterLevel || 0) + yieldMT / 100;
  S.globalRadiation = (S.globalRadiation || 0) + yieldMT / 200;
}
```

**Damage Formula**:
```typescript
const winterSeverity = Math.min(S.nuclearWinterLevel / 10, 0.5);  // Max 50%
const popLoss = Math.floor((n.population || 0) * winterSeverity * 0.05);
n.production = Math.max(0, Math.floor(n.production * (1 - winterSeverity)));
S.nuclearWinterLevel *= 0.95;  // 5% decay per turn
```

**Analysis**: ✅ CORRECT
- Only triggered by large warheads (≥50MT)
- Severity capped at 50% (prevents excessive damage)
- Affects all nations equally (global catastrophe)
- Decays over time
- Reduces both population (up to 2.5% per turn) and production

**Example**: 5× 100MT detonations
- Nuclear winter level: 5 × (100/100) = 5.0
- Severity: 5.0 / 10 = 0.5 (50%)
- Population loss: population × 0.5 × 0.05 = 2.5% per turn
- Production reduction: 50%

---

### 6. Orbital Strike ✅
**Location**: `src/pages/Index.tsx:8857-8887`

**Formula**:
```typescript
const popLoss = Math.floor(target.population * 0.15);      // 15% population
const prodLoss = Math.floor((target.production || 0) * 0.20); // 20% production
const warheadsDestroyed = Math.min(3, warheadTypes.length);   // Up to 3 warheads

target.population = Math.max(0, target.population - popLoss);
target.production = Math.max(0, (target.production || 0) - prodLoss);
```

**Cost**: 50 intel + 30 uranium

**Analysis**: ✅ CORRECT
- Fixed percentage damage (not affected by defense)
- Destroys up to 3 random warhead types (1 of each type)
- Reasonable cost for powerful effect
- Limited availability (requires research/construction)

---

### 7. EMP (Electromagnetic Pulse) ✅
**Location**: `src/pages/Index.tsx:4031-4046`

**Trigger**: Strategic warheads only (≥50MT)

**Formula**:
```typescript
S.empEffects.push({
  x, y,
  radius: Math.sqrt(yieldMT) * 15,
  duration: 30  // turns
});

nations.forEach(n => {
  const dist = Math.hypot(nx - x, ny - y);
  if (dist < Math.sqrt(yieldMT) * 15) {
    n.defense = Math.max(0, n.defense - 3);
    n.missiles = Math.max(0, n.missiles - 2);
  }
});
```

**Analysis**: ✅ CORRECT
- Only large warheads create EMP
- Radius scales with yield: √yieldMT × 15
- Fixed degradation: -3 defense, -2 missiles
- Visual effect persists for 30 turns

**Example**: 100MT warhead
- EMP radius: √100 × 15 = 150 units
- All nations within radius: -3 defense, -2 missiles

---

### 8. Bomber & Missile Interception ⚠️
**Bombers**: `src/lib/research.ts:20-26`
```typescript
const stealthModifier = from?.researched?.stealth ? 0.5 : 1;
return (targetDefense / 12) * stealthModifier;
```

**Missiles**: `src/pages/Index.tsx:3337-3340`
```typescript
let totalIntercept = (m.target.defense || 0) / 16;
allies.forEach(ally => {
  const allyIntercept = (ally.defense || 0) / 32;
  totalIntercept += allyIntercept;
});
```

**Analysis**: ⚠️ DESIGN INCONSISTENCY
- **Bombers without stealth**: defense / 12 (EASIER to intercept)
- **Missiles**: defense / 16 (HARDER to intercept)
- **Bombers with stealth**: defense / 24 (HARDEST to intercept)

| Defense Level | Missile Intercept | Bomber (no stealth) | Bomber (stealth) |
|--------------|------------------|---------------------|------------------|
| 8            | 50%              | 67%                 | 33%              |
| 12           | 75%              | 100%                | 50%              |
| 16           | 100%             | 100%                | 67%              |

**Note**: This may be intentional for game balance, but creates counter-intuitive gameplay where missiles are harder to intercept than bombers (without stealth research).

---

## 🔴 Critical Bugs Found

### BUG #1: Missile Double Explosion Vulnerability
**Severity**: CRITICAL
**Location**:
- `src/pages/Index.tsx:3354` (render loop explosion)
- `src/lib/gamePhaseHandlers.ts:232` (resolution phase explosion)

**Problem**:
Missiles can explode TWICE - once in the render loop and once in the resolution phase:

1. **Render Loop** (runs continuously at ~60 FPS):
```typescript
// Index.tsx:3306-3356
if (m.t >= 1) {
  // ... MIRV and interception checks ...
  explode(tx, ty, m.target, m.yield);  // EXPLOSION #1
  S.missiles.splice(i, 1);             // Remove missile
}
```

2. **Resolution Phase** (runs at turn start):
```typescript
// gamePhaseHandlers.ts:226-237
S.missiles.forEach((missile: any) => {
  if (missile.t >= 1) {
    const { x, y, visible } = projectLocal(missile.toLon, missile.toLat);
    if (!visible) return;
    explode(x, y, missile.target, missile.yield);  // EXPLOSION #2
  }
});
S.missiles = S.missiles.filter((m: any) => m.t < 1);
```

**Impact**:
- Missiles could deal DOUBLE damage
- Population loss calculated twice
- Radiation zones created twice
- Nuclear winter accumulates twice
- Statistics (nukes launched/received) counted incorrectly

**Reproduction Scenario**:
1. Missile is launched with t close to 1.0
2. Resolution phase runs before next render frame
3. Resolution phase explodes the missile
4. Render loop explodes the same missile again (if not removed fast enough)

**Recommended Fix**:
Add an explosion flag or consolidate all missile processing into either the render loop OR the resolution phase (not both).

```typescript
// Option 1: Add explosion flag
if (m.t >= 1 && !m.hasExploded) {
  m.hasExploded = true;
  explode(tx, ty, m.target, m.yield);
}

// Option 2: Remove explosion logic from one location
// Keep explosion only in render loop (drawMissiles)
// Remove lines 226-234 from gamePhaseHandlers.ts
```

---

### BUG #2: Array Modification During forEach
**Severity**: MEDIUM
**Location**: `src/pages/Index.tsx:3252-3356`

**Problem**:
```typescript
S.missiles.forEach((m: any, i: number) => {
  // ... processing ...
  if (m.t >= 1) {
    // ... impact logic ...
    S.missiles.splice(i, 1);  // ❌ DANGEROUS: modifying array during iteration
  }
});
```

**Impact**:
- When removing element at index `i`, the next element shifts to index `i`
- forEach continues to `i+1`, skipping the shifted element
- Can cause missiles to be skipped and not explode
- Inconsistent behavior depending on launch order

**Example**:
```
Initial: [missile_A, missile_B, missile_C]  (all at t >= 1)
i=0: Remove missile_A, array becomes [missile_B, missile_C]
i=1: Process index 1 (missile_C), SKIP missile_B ❌
```

**Recommended Fix**:
Use filter or iterate backwards:
```typescript
// Option 1: Filter (cleaner)
S.missiles = S.missiles.filter((m: any) => {
  if (m.t >= 1) {
    explode(...);
    return false;  // Remove
  }
  return true;  // Keep
});

// Option 2: Iterate backwards
for (let i = S.missiles.length - 1; i >= 0; i--) {
  const m = S.missiles[i];
  if (m.t >= 1) {
    explode(...);
    S.missiles.splice(i, 1);
  }
}
```

---

## Recommended Fixes Summary

### Priority 1: Fix Missile Double Explosion
**Files to modify**:
1. `src/pages/Index.tsx` - Add `hasExploded` flag check before calling explode
2. `src/lib/gamePhaseHandlers.ts` - Add same flag check OR remove missile explosion logic entirely

### Priority 2: Fix Array Iteration Bug
**Files to modify**:
1. `src/pages/Index.tsx:3252-3356` - Replace forEach+splice with filter or reverse iteration

### Priority 3: Review Interception Rate Balance (Optional)
**Consideration**: Evaluate if current interception rates are intentional for gameplay balance or should be adjusted.

---

## Test Recommendations

1. **Double Explosion Test**:
   - Launch multiple missiles simultaneously
   - Monitor population damage and compare to expected values
   - Check if radiation zones are created multiple times at same location

2. **Array Iteration Test**:
   - Launch 3+ missiles to same target with similar arrival times
   - Verify all missiles explode (none skipped)

3. **Interception Rate Test**:
   - Test interception at various defense levels
   - Compare missile vs bomber interception rates
   - Verify stealth research properly reduces bomber interception

---

## Conclusion

The damage calculation formulas themselves are **mathematically correct** and well-balanced. However, the **implementation has critical bugs** in the missile processing logic that can cause:
- Double damage from missiles
- Skipped missile explosions
- Incorrect game statistics

These bugs should be fixed before the next release to ensure consistent and fair gameplay.

**Overall Assessment**:
- ✅ Damage formulas: CORRECT
- ❌ Missile processing: CRITICAL BUGS FOUND
- ⚠️ Game balance: Minor inconsistency in interception rates

---

**Auditor Note**: All damage systems use proper safeguards (Math.max for lower bounds, Math.min for upper bounds) to prevent underflow/overflow. No integer overflow or divide-by-zero vulnerabilities were found.
