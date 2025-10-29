# Tech Tree Implementation Plan
**Date:** 2025-10-29
**Based on:** COMPREHENSIVE-TECH-TREE-GAMEPLAY-AUDIT-2025.md
**Timeline:** 6 weeks
**Developer:** Solo developer with AI assistance

---

## Plan (Overordnet Plan)

### Mål
Utvide og balansere alle teknologitrær i NORAD VECTOR for å skape:
1. **Dybde:** Flere strategiske valg per spillsystem
2. **Balanse:** Alle seiersbetingelser like levedyktige
3. **Fullstendighet:** Fikse kritiske bugs og manglende systemer
4. **Engasjement:** Teknologier som påvirker spillopplevelsen merkbart

### Faser

#### **Fase 1: Kritiske Fikser** (Uke 1)
**Formål:** Fjerne blokkere og kritiske bugs
- Fullføre cure deployment-system
- Fikse plague type unlocking
- Rebalansere bio-lab konstruksjonstider

**Suksesskriterier:**
- Bio-warfare seiersbetingelse fungerer fullstendig
- Plague progression tydelig og testbar
- Bio-labs nåelig innen normal spillengde (30-50 turns)

#### **Fase 2: Høyprioriterte Utvidelser** (Uke 2-3)
**Formål:** Legge til manglende kjerneteknologier
- Utvide cyber warfare tech tree (2 → 7 techs)
- Lage production/economy tech tree (0 → 5 techs)
- Lage culture/diplomacy tech tree (0 → 5 techs)

**Suksesskriterier:**
- Cyber warfare føles like dypt som nuclear warfare
- Økonomisk seier oppnåelig gjennom tech progression
- Kulturell seier har tydelig tech-støtte

#### **Fase 3: Mellomprioriterte Tillegg** (Uke 3-5)
**Formål:** Utvide eksisterende systemer
- Lage satellite/space tech tree (0 → 5 techs)
- Utvide conventional warfare tech tree (3 → 7 techs)
- Implementere tech tree visualisering UI
- Lage intelligence operations tech tree (1 → 5 techs)

**Suksesskriterier:**
- Alle hovedspillsystemer har dedikert tech tree
- Spillere kan visuelt se tech dependencies
- Conventi onal warfare konkurransedyktig med nuclear

#### **Fase 4: Avanserte Features** (Uke 5-6)
**Formål:** Polering og avanserte mekanikker
- Research queue system (multiple samtidig forskning)
- Tech synergies (bonuser for kombinasjoner)
- Prestige tech system (ultra-dyre late-game techs)

**Suksesskriterier:**
- Spillere kan forske på 2-3 techs samtidig
- Tech combos gir meningsfulle bonuser
- Late-game har interessante tech-valg

---

## Oppgaver (Detaljerte Tasks)

### Uke 1: Kritiske Fikser

#### Oppgave 1.1: Fullføre Cure Deployment System
**Prioritet:** P0-CRITICAL
**Estimat:** 8 timer
**Ansvarlig:** Developer + AI

**Beskrivelse:**
Implementere manglende cure deployment-effekter i bio-warfare systemet. Nåværende TODO på linje 219 i `useBioWarfare.ts` blokkerer bio-warfare seiersbetingelse.

**Steg:**
1. Definer cure effectiveness-formel:
   ```typescript
   cureEffectiveness = (labTier * 15) + (researchInvested * 0.5) + (DNAspent * 2)
   // Range: 0-100%
   ```
2. Implementer cure application:
   - Reduser infection rate med `cureEffectiveness * 0.01` per turn
   - Reduser lethality med `cureEffectiveness * 0.005` per turn
   - Øk cure resistance cost med 20% når cure deployed
3. Legg til AI cure deployment logic:
   ```typescript
   if (globalInfection > 40% && labTier >= 2) {
     deployCure(mostInfectedRegion);
   }
   ```
4. Test bio-warfare victory med cure mechanics

**Filer som endres:**
- `/src/hooks/useBioWarfare.ts` (linje 219 + cure logic)
- `/src/hooks/usePandemic.ts` (cure integration)
- `/src/lib/aiBioWarfare.ts` (AI cure deployment)

**Akseptansekriterier:**
- [ ] Cure reduces infection over time
- [ ] AI deploys cures strategically
- [ ] Bio-warfare victory achievable with cure mechanic
- [ ] Unit tests pass for cure effectiveness calculation

---

#### Oppgave 1.2: Fikse Plague Type Unlocking
**Prioritet:** P0-CRITICAL
**Estimat:** 4 timer

**Beskrivelse:**
Definer og implementer "plague completion" kriterier som trigger unlocking av neste plague type. Nåværende system har undefined "Complete X plague" requirements.

**Steg:**
1. Definer completion kriterier:
   ```typescript
   interface PlagueCompletion {
     infectionThreshold: number; // 50%+ global infection
     killThreshold: number;      // 1000+ total deaths
     turnMinimum: number;        // Min 10 turns active
   }
   ```
2. Track plague milestones per nation
3. Check completion hver turn:
   ```typescript
   if (globalInfection >= 50 || totalKills >= 1000) {
     unlockNextPlagueType();
     toast.success("New plague type unlocked: Fungus");
   }
   ```
4. Lagre unlocks i localStorage

**Filer som endres:**
- `/src/lib/evolutionData.ts` (completion criteria)
- `/src/hooks/useBioLab.ts` (unlock logic)
- `/src/hooks/useBioWarfare.ts` (milestone tracking)

**Akseptansekriterier:**
- [ ] Plague completion clearly defined
- [ ] Unlocks trigger automatically when criteria met
- [ ] Notification shows when new plague type available
- [ ] Progress persists across game sessions

---

#### Oppgave 1.3: Rebalansere Bio-Lab Konstruksjonstider
**Prioritet:** P1-HIGH
**Estimat:** 1 time

**Beskrivelse:**
Reduser total konstruksjonstid fra 40 turns til 31 turns for å gjøre Tier 4 lab oppnåelig i normal spillengde.

**Endringer:**
```typescript
// GAMMEL: 5, 8, 12, 15 turns (40 total)
// NY:     4, 6, 9, 12 turns (31 total)

BIO_LAB_TIERS = {
  tier1: { turns: 4, ... },
  tier2: { turns: 6, ... },
  tier3: { turns: 9, ... },
  tier4: { turns: 12, ... },
}
```

**Filer som endres:**
- `/src/types/bioLab.ts` (linje 67-151)

**Akseptansekriterier:**
- [ ] Total construction time reduced to 31 turns
- [ ] Costs remain balanced
- [ ] Existing saves compatible (migration script if needed)

---

### Uke 2: Cyber Warfare Expansion

#### Oppgave 2.1: Utvide Cyber Warfare Tech Tree
**Prioritet:** P1-HIGH
**Estimat:** 12 timer

**Beskrivelse:**
Legge til 5 nye cyber warfare research projects for å gjøre systemet like dypt som nuclear warfare.

**Nye teknologier:**

**1. Advanced Offensive Algorithms**
```typescript
{
  id: 'cyber_advanced_offense',
  name: 'Advanced Offensive Algorithms',
  description: 'AI-driven attack optimization reduces intrusion costs and increases success rate',
  cost: { production: 35, intel: 30 },
  turns: 4,
  requires: ['cyber_ids'],
  effects: {
    offense: +10,
    intrusionCostReduction: 0.2, // -20%
  }
}
```

**2. Stealth Protocols**
```typescript
{
  id: 'cyber_stealth',
  name: 'Stealth Protocols',
  description: 'Advanced obfuscation techniques reduce detection chance',
  cost: { production: 30, intel: 35 },
  turns: 3,
  requires: ['cyber_ids'],
  effects: {
    detectionReduction: 0.15, // -15% detection on all ops
  }
}
```

**3. Attribution Obfuscation**
```typescript
{
  id: 'cyber_attribution_obfuscation',
  name: 'Attribution Obfuscation',
  description: 'False flag operations and proxy networks confuse attribution',
  cost: { production: 40, intel: 40 },
  turns: 4,
  requires: ['cyber_ids'],
  effects: {
    attributionReduction: 0.25, // -25% accuracy when attacking you
  }
}
```

**4. AI-Driven Cyber Defenses**
```typescript
{
  id: 'cyber_ai_defense',
  name: 'AI-Driven Cyber Defenses',
  description: 'Autonomous defense systems counter-attack intruders',
  cost: { production: 50, intel: 45 },
  turns: 5,
  requires: ['cyber_firewalls'],
  effects: {
    defense: +10,
    counterattackChance: 0.2, // 20% chance to damage attacker
  }
}
```

**5. Cyber Superweapon**
```typescript
{
  id: 'cyber_superweapon',
  name: 'Cyber Superweapon',
  description: 'Devastating one-time cyber attack that cripples target infrastructure',
  cost: { production: 80, intel: 60, uranium: 20 },
  turns: 6,
  requires: ['cyber_advanced_offense', 'cyber_attribution_obfuscation'],
  effects: {
    unlockAction: 'cyber_nuke', // Disable target for 3 turns
  }
}
```

**Implementasjonssteg:**
1. Legg til techs i RESEARCH_TREE (Index.tsx)
2. Implementer effekt-applikasjon i applyCyberResearchUnlock
3. Oppdater AI research logic for cyber techs
4. Legg til UI for cyber nuke action
5. Test full tech tree progression

**Filer som endres:**
- `/src/pages/Index.tsx` (RESEARCH_TREE)
- `/src/hooks/useCyberWarfare.ts` (effects + cyber nuke action)
- `/src/lib/aiBioWarfare.ts` (AI cyber research priority)

**Akseptansekriterier:**
- [ ] All 5 techs researchable
- [ ] Effects apply correctly
- [ ] AI researches cyber techs strategically
- [ ] Cyber nuke action functional and balanced

---

### Uke 3: Economy & Culture Tech Trees

#### Oppgave 2.2: Lage Production/Economy Tech Tree
**Prioritet:** P1-HIGH
**Estimat:** 10 timer

**Beskrivelse:**
Lage helt ny tech tree for økonomisk utvikling, som støtter economic victory path.

**Nye teknologier:**

**1. Industrial Automation**
```typescript
{
  id: 'economy_automation',
  name: 'Industrial Automation',
  description: 'Automated factories increase production efficiency',
  cost: { production: 20 },
  turns: 2,
  effects: {
    productionRateBonus: 0.15, // +15% production per turn
  }
}
```

**2. Advanced Resource Extraction**
```typescript
{
  id: 'economy_extraction',
  name: 'Advanced Resource Extraction',
  description: 'Deep mining and advanced refining increase uranium output',
  cost: { production: 30, intel: 10 },
  turns: 3,
  effects: {
    uraniumPerTurn: +1,
  }
}
```

**3. Economic Efficiency**
```typescript
{
  id: 'economy_efficiency',
  name: 'Economic Efficiency',
  description: 'Streamlined production reduces all construction costs',
  cost: { production: 25, intel: 15 },
  turns: 3,
  effects: {
    buildCostReduction: 0.1, // -10% on all builds
  }
}
```

**4. Total Mobilization**
```typescript
{
  id: 'economy_mobilization',
  name: 'Total Mobilization',
  description: 'War economy maximizes output but increases domestic tension',
  cost: { production: 40, intel: 20 },
  turns: 4,
  effects: {
    productionRateBonus: 0.2, // +20%
    instabilityIncrease: 0.05, // +5% instability
  }
}
```

**5. Resource Stockpiling**
```typescript
{
  id: 'economy_stockpiling',
  name: 'Resource Stockpiling',
  description: 'Strategic reserves increase maximum resource capacity',
  cost: { production: 15 },
  turns: 2,
  effects: {
    maxStorageIncrease: 50, // +50 to all resource caps
  }
}
```

**Implementasjonssteg:**
1. Legg til "economy" category i RESEARCH_TREE
2. Implementer production rate calculation endringer
3. Oppdater build cost calculations
4. Legg til resource cap system hvis ikke eksisterer
5. Test economic victory with tech support

**Filer som endres:**
- `/src/pages/Index.tsx` (RESEARCH_TREE + production logic)
- `/src/types/game.ts` (add resource caps if needed)

**Akseptansekriterier:**
- [ ] All 5 economy techs researchable
- [ ] Production bonuses stack correctly
- [ ] Build cost reduction applies to all construction
- [ ] Economic victory achievable faster with techs

---

#### Oppgave 3.1: Lage Culture/Diplomacy Tech Tree
**Prioritet:** P1-HIGH
**Estimat:** 10 timer

**Beskrivelse:**
Lage ny tech tree for kulturell innflytelse og diplomati, støtter cultural victory.

**Nye teknologier:**

**1. Social Media Dominance**
```typescript
{
  id: 'culture_social_media',
  name: 'Social Media Dominance',
  description: 'Global social networks amplify cultural influence',
  cost: { production: 20, intel: 20 },
  turns: 2,
  effects: {
    cultureBombCostReduction: 0.25, // -25% cost
  }
}
```

**2. Global Influence Network**
```typescript
{
  id: 'culture_influence',
  name: 'Global Influence Network',
  description: 'Diplomatic channels enable more simultaneous treaties',
  cost: { production: 30, intel: 30 },
  turns: 3,
  effects: {
    treatySlots: +1,
  }
}
```

**3. Soft Power Projection**
```typescript
{
  id: 'culture_soft_power',
  name: 'Soft Power Projection',
  description: 'Cultural appeal attracts skilled immigrants',
  cost: { production: 35, intel: 35 },
  turns: 4,
  effects: {
    immigrationAttractionBonus: 0.2, // +20% immigration success
  }
}
```

**4. Cultural Hegemony**
```typescript
{
  id: 'culture_hegemony',
  name: 'Cultural Hegemony',
  description: 'Total cultural dominance converts stolen population faster',
  cost: { production: 50, intel: 50 },
  turns: 5,
  effects: {
    stolenPopConversionBonus: 0.5, // +50% faster conversion
  }
}
```

**5. Diplomatic Immunity**
```typescript
{
  id: 'culture_immunity',
  name: 'Diplomatic Immunity',
  description: 'Ironclad treaties cannot be broken by AI for extended period',
  cost: { production: 25, intel: 40 },
  turns: 3,
  effects: {
    treatyLockDuration: 5, // Treaties locked for 5 turns
  }
}
```

**Implementasjonssteg:**
1. Legg til "culture" category i RESEARCH_TREE
2. Implementer treaty lock system
3. Oppdater culture bomb cost calculations
4. Modify immigration attraction logic
5. Test cultural victory with tech support

**Filer som endres:**
- `/src/pages/Index.tsx` (RESEARCH_TREE + culture logic)
- Treaty system (add lock mechanism)

**Akseptansekriterier:**
- [ ] All 5 culture/diplomacy techs researchable
- [ ] Treaty slots increase correctly
- [ ] Cultural victory achievable with tech progression
- [ ] AI respects treaty locks

---

### Uke 4: Space & Conventional Expansion

#### Oppgave 2.3: Lage Satellite/Space Tech Tree
**Prioritet:** P2-MEDIUM
**Estimat:** 12 timer

**Nye teknologier:**

**1. Advanced Satellite Network**
- Effect: +1 orbit slot (allows more satellites)

**2. Enhanced Recon Optics**
- Effect: +50% intel gathered from satellites

**3. Anti-Satellite Weapons (ASAT)**
- Effect: New action to destroy enemy satellites

**4. Space Weapon Platform**
- Effect: One-time orbital strike capability

**5. GPS Warfare**
- Effect: -20% enemy missile accuracy

*(Full implementation details similar to above tasks)*

---

#### Oppgave 2.4: Utvide Conventional Warfare Tech Tree
**Prioritet:** P2-MEDIUM
**Estimat:** 10 timer

**Nye teknologier:**

**1. Combined Arms Doctrine**
- Effect: +10% attack when multiple unit types deployed together

**2. Advanced Logistics**
- Effect: +1 readiness regeneration per turn for all units

**3. Electronic Warfare Suite**
- Effect: -20% enemy detection in controlled territories

**4. Force Modernization**
- Effect: Permanent upgrade to all existing units (+1 attack/defense)

*(Full implementation details similar to above tasks)*

---

### Uke 5-6: Advanced Features

#### Oppgave 4.1: Implementere Tech Tree Visualisering
**Prioritet:** P2-MEDIUM
**Estimat:** 20 timer

**Beskrivelse:**
Lage interaktiv node-based graph UI for å visualisere tech dependencies og progression.

**Features:**
- Clickable nodes showing tech details
- Lines connecting prerequisites
- Color coding (available, locked, in progress, completed)
- Zoom/pan for large trees
- Hover tooltips with costs and effects

**Teknologi:** React Flow library

**Filer:**
- `/src/components/TechTreeVisualization.tsx` (new)
- `/src/pages/Index.tsx` (integrate component)

---

#### Oppgave 4.2: Research Queue System
**Prioritet:** P3-LOW
**Estimat:** 8 timer

**Beskrivelse:**
Tillat 2-3 simultane research projects med redusert hastighet.

**Regler:**
- Main project: 100% speed
- Secondary: 50% speed (costs +50% resources)
- Tertiary: 25% speed (costs +100% resources)

---

#### Oppgave 4.3: Tech Synergies
**Prioritet:** P3-LOW
**Estimat:** 12 timer

**Eksempler:**
- All nuclear techs complete = "Nuclear Supremacy" (+20% warhead damage)
- All cyber techs complete = "Cyber Dominance" (+20% all cyber stats)
- All production techs = "Industrial Powerhouse" (+25% production)

---

## Milepæler

### Uke 1 Slutt
- [ ] Bio-warfare fully functional with cure system
- [ ] Plague unlocking testable and clear
- [ ] Bio-labs reachable in normal game length

### Uke 3 Slutt
- [ ] Cyber warfare as deep as nuclear
- [ ] Economy tech tree enables economic victory
- [ ] Culture tech tree enables cultural victory

### Uke 5 Slutt
- [ ] All major game systems have tech trees
- [ ] Tech tree visualization functional
- [ ] Conventional warfare competitive

### Uke 6 Slutt (FERDIG)
- [ ] Research queue system working
- [ ] Tech synergies implemented
- [ ] All tests passing
- [ ] Documentation complete

---

## Ressurser Nødvendig

### Utvikler
- 40 timer/uke i 6 uker = 240 timer total
- Breakpoint: P0-P1 tasks = 70 timer (prioritet hvis tidsbegrenset)

### Testing
- 20 timer for unit/integration tests
- 10 timer for balance testing (simulations)

### Design
- Tech tree visualization design: 5 timer
- UI/UX review: 3 timer

**Total:** ~280 timer (~7 ukers arbeid for solo developer)

---

## Risiko & Mitigering

### Høy Risiko
1. **Scope creep** - Adding too many techs
   - **Mitigering:** Stick to defined tech list, defer extras to Phase 2

2. **Balance issues** - New techs too powerful/weak
   - **Mitigering:** Playtesting + AI simulations after each phase

### Medium Risiko
1. **Tech tree visualization complexity**
   - **Mitigering:** Use proven library (React Flow), start simple

2. **Research queue bugs**
   - **Mitigering:** Extensive testing, fallback to single-queue if needed

---

**Dokument Status:** FERDIG
**Neste Steg:** Begynn Oppgave 1.1 (Cure Deployment System)
**Sist Oppdatert:** 2025-10-29
