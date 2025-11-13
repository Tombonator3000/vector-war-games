# TURN SYSTEM FIX PLAN

**Basert på:** TURN_SYSTEM_AUDIT.md
**Prioritet:** 🔴 KRITISK
**Estimert arbeid:** 4-6 timer

---

## STRATEGI

Vi har 2 hovedalternativer:

### Alternativ A: Quick Fix (Anbefalt for nå)
Integrer de 6 manglende systemene inn i eksisterende turn-syklus uten større refaktorering.

**Pros:**
- Rask implementering (2-3 timer)
- Lav risiko for å ødelegge eksisterende systemer
- Umiddelbar verdi for brukeren

**Cons:**
- Fortsetter eksisterende arkitektur-problemer
- Ingen forbedring av maintainability

### Alternativ B: Full Refactor
Konsolider all turn-prosessering i ett dedikert system.

**Pros:**
- Ren arkitektur
- Enklere å vedlikeholde fremover
- Konsistent pattern

**Cons:**
- Større risiko for regresjoner
- Tar lengre tid (6-8 timer)
- Krever omfattende testing

**ANBEFALING: Start med Alternativ A, planlegg Alternativ B senere**

---

## ALTERNATIV A: QUICK FIX IMPLEMENTATION

### Steg 1: Instansier manglende hooks i Index.tsx

**Fil:** `/src/pages/Index.tsx`

#### 1.1 Legg til imports (etter linje ~100)

```typescript
import { useWarSupport } from '@/hooks/useWarSupport';
import { usePoliticalFactions } from '@/hooks/usePoliticalFactions';
import { useRegionalMorale } from '@/hooks/useRegionalMorale';
import { useMediaWarfare } from '@/hooks/useMediaWarfare';
import { useProductionQueue } from '@/hooks/useProductionQueue';
import { useResourceRefinement } from '@/hooks/useResourceRefinement';
```

#### 1.2 Instansier hooks (rundt linje ~8000, etter andre hooks)

```typescript
// War Support System
const warSupport = useWarSupport({
  currentTurn: S.turn,
  nations,
});

// Political Factions System
const politicalFactions = usePoliticalFactions({
  currentTurn: S.turn,
  nations,
});

// Regional Morale System
const regionalMorale = useRegionalMorale({
  territories: conventionalState?.territories || {},
  currentTurn: S.turn,
  nations,
});

// Media Warfare System
const mediaWarfare = useMediaWarfare({
  currentTurn: S.turn,
  nations,
  onCampaignExposed: (campaignId: string) => {
    log('⚠️ Propaganda campaign exposed!', 'warning');
  },
  onMediaEvent: (event: any) => {
    // Handle media events
    if (event.type === 'propaganda_success') {
      log('📰 Propaganda campaign successful', 'info');
    }
  },
});

// Production Queue System
const productionQueue = useProductionQueue({
  nations,
  currentTurn: S.turn,
  onProductionComplete: (completion: any) => {
    const nation = nations.find(n => n.id === completion.nationId);
    if (nation?.isPlayer) {
      log(`✅ Production complete: ${completion.itemName}`, 'success');
    }
  },
});

// Resource Refinement System
const resourceRefinement = useResourceRefinement({
  nations,
  currentTurn: S.turn,
});
```

#### 1.3 Expose APIs to window (etter linje ~8267)

```typescript
// Expose War Support API
useEffect(() => {
  if (warSupport) {
    (window as any).warSupportApi = warSupport;
    return () => {
      (window as any).warSupportApi = null;
    };
  }
}, [warSupport]);

// Expose Political Factions API
useEffect(() => {
  if (politicalFactions) {
    (window as any).politicalFactionsApi = politicalFactions;
    return () => {
      (window as any).politicalFactionsApi = null;
    };
  }
}, [politicalFactions]);

// Expose Regional Morale API
useEffect(() => {
  if (regionalMorale) {
    (window as any).regionalMoraleApi = regionalMorale;
    return () => {
      (window as any).regionalMoraleApi = null;
    };
  }
}, [regionalMorale]);

// Expose Media Warfare API
useEffect(() => {
  if (mediaWarfare) {
    (window as any).mediaWarfareApi = mediaWarfare;
    return () => {
      (window as any).mediaWarfareApi = null;
    };
  }
}, [mediaWarfare]);

// Expose Production Queue API
useEffect(() => {
  if (productionQueue) {
    (window as any).productionQueueApi = productionQueue;
    return () => {
      (window as any).productionQueueApi = null;
    };
  }
}, [productionQueue]);

// Expose Resource Refinement API
useEffect(() => {
  if (resourceRefinement) {
    (window as any).resourceRefinementApi = resourceRefinement;
    return () => {
      (window as any).resourceRefinementApi = null;
    };
  }
}, [resourceRefinement]);
```

---

### Steg 2: Kall processTurn-metoder i gamePhaseHandlers.ts

**Fil:** `/src/lib/gamePhaseHandlers.ts`

#### 2.1 Legg til i production phase (etter linje 826, før closing brace)

```typescript
  // Phase 3: War Support - Process war support and stability
  if (typeof window !== 'undefined' && (window as any).warSupportApi) {
    try {
      const warSupportApi = (window as any).warSupportApi;
      warSupportApi.processTurnWarSupport();
      log('✅ War support and stability processed', 'success');
    } catch (error) {
      console.error('[Production Phase] Error processing war support:', error);
    }
  }

  // Phase 4: Political Factions - Process faction satisfaction and demands
  if (typeof window !== 'undefined' && (window as any).politicalFactionsApi) {
    try {
      const politicalFactionsApi = (window as any).politicalFactionsApi;
      politicalFactionsApi.processTurnUpdates();
      log('✅ Political factions processed', 'success');
    } catch (error) {
      console.error('[Production Phase] Error processing political factions:', error);
    }
  }

  // Phase 5: Regional Morale - Process protests, strikes, and morale spread
  if (typeof window !== 'undefined' && (window as any).regionalMoraleApi) {
    try {
      const regionalMoraleApi = (window as any).regionalMoraleApi;
      regionalMoraleApi.processTurnUpdates();

      // Also trigger morale spread to neighboring territories
      if (regionalMoraleApi.processMoraleSpread) {
        regionalMoraleApi.processMoraleSpread();
      }

      log('✅ Regional morale and protests processed', 'success');
    } catch (error) {
      console.error('[Production Phase] Error processing regional morale:', error);
    }
  }

  // Phase 6: Media Warfare - Process campaigns and detection
  if (typeof window !== 'undefined' && (window as any).mediaWarfareApi) {
    try {
      const mediaWarfareApi = (window as any).mediaWarfareApi;
      mediaWarfareApi.processTurnUpdates();
      log('✅ Media warfare campaigns processed', 'success');
    } catch (error) {
      console.error('[Production Phase] Error processing media warfare:', error);
    }
  }

  // Phase 7: Production Queue - Process all production lines
  if (typeof window !== 'undefined' && (window as any).productionQueueApi) {
    try {
      const productionQueueApi = (window as any).productionQueueApi;
      productionQueueApi.processTurnProduction();
      log('✅ Production queues processed', 'success');
    } catch (error) {
      console.error('[Production Phase] Error processing production queues:', error);
    }
  }

  // Phase 8: Resource Refinement - Process refinement orders
  if (typeof window !== 'undefined' && (window as any).resourceRefinementApi) {
    try {
      const resourceRefinementApi = (window as any).resourceRefinementApi;
      resourceRefinementApi.processTurn();
      log('✅ Resource refinement processed', 'success');
    } catch (error) {
      console.error('[Production Phase] Error processing resource refinement:', error);
    }
  }
```

---

### Steg 3: Verifiser at hooks eksporterer riktige metoder

Sjekk at alle hooks returnerer sine processTurn-metoder:

#### 3.1 useWarSupport.ts

```typescript
return {
  // ... existing exports
  processTurnWarSupport,  // ✅ Already exported (line 535)
};
```

#### 3.2 usePoliticalFactions.ts

```typescript
return {
  // ... existing exports
  processTurnUpdates,  // ✅ Already exported (line 636)
};
```

#### 3.3 useRegionalMorale.ts

```typescript
return {
  // ... existing exports
  processTurnUpdates,  // ✅ Already exported (line 613)
  processMoraleSpread, // Check if this exists
};
```

#### 3.4 useMediaWarfare.ts

```typescript
return {
  // ... existing exports
  processTurnUpdates,  // ✅ Already exported (line 495)
};
```

#### 3.5 useProductionQueue.ts

```typescript
return {
  // ... existing exports
  processTurnProduction,  // ✅ Already exported (line 446)
};
```

#### 3.6 useResourceRefinement.ts

```typescript
return {
  // ... existing exports
  processTurn,  // ✅ Already exported (line 179)
};
```

---

### Steg 4: Testing Checklist

Etter implementering, test følgende:

#### 4.1 War Support
- [ ] Start en krig
- [ ] Legg til temporary war support modifier
- [ ] Kjør flere turns
- [ ] Verifiser at modifier duration decrements
- [ ] Verifiser at modifier expires etter X turns

#### 4.2 Political Factions
- [ ] Create faction demands
- [ ] La demands expire uten å oppfylle dem
- [ ] Kjør turns og verifiser satisfaction penalties
- [ ] Verifiser at expired demands fjernes fra listen

#### 4.3 Regional Morale
- [ ] Start en protest i et territory
- [ ] Kjør turns og verifiser at duration incrementer
- [ ] Verifiser at morale reduseres over tid
- [ ] La morale øke over 60
- [ ] Verifiser at protests kan fade

#### 4.4 Media Warfare
- [ ] Launch en propaganda campaign med 5 turns duration
- [ ] Kjør 5 turns
- [ ] Verifiser at campaign expires
- [ ] Sjekk om detection skjer randomly
- [ ] Verifiser exposed campaigns

#### 4.5 Production Queue
- [ ] Queue opp en production item
- [ ] Kjør turns og verifiser at progress incrementer
- [ ] Verifiser at efficiency ramps opp fra initial til 100%
- [ ] Verifiser at item completes når progress >= 100%
- [ ] Sjekk at completion callback triggers

#### 4.6 Resource Refinement
- [ ] Create refinement order
- [ ] Kjør turns og verifiser at turnsRemaining decrements
- [ ] Verifiser at outputProduced incrementer
- [ ] Verifiser at order fjernes når turnsRemaining = 0
- [ ] Sjekk refinery efficiency increase

---

## ALTERNATIV B: FULL REFACTOR (For senere)

### Arkitektur-forbedringer

#### 1. Opprett dedikert Turn Manager

```typescript
// /src/lib/turnManager.ts

interface TurnProcessor {
  name: string;
  phase: 'EARLY' | 'PRODUCTION' | 'LATE';
  priority: number;
  process: () => void | Promise<void>;
  required: boolean; // If true, turn fails if this errors
}

class TurnManager {
  private processors: TurnProcessor[] = [];

  register(processor: TurnProcessor) {
    this.processors.push(processor);
    this.processors.sort((a, b) => a.priority - b.priority);
  }

  async processTurn(phase: 'EARLY' | 'PRODUCTION' | 'LATE') {
    const phaseProcessors = this.processors.filter(p => p.phase === phase);

    for (const processor of phaseProcessors) {
      try {
        await processor.process();
        console.log(`✅ ${processor.name} processed`);
      } catch (error) {
        console.error(`❌ ${processor.name} failed:`, error);

        if (processor.required) {
          throw new Error(`Critical turn processor failed: ${processor.name}`);
        }
      }
    }
  }
}

export const turnManager = new TurnManager();
```

#### 2. Register alle systemer

```typescript
// In Index.tsx or dedicated registration file

turnManager.register({
  name: 'War Support',
  phase: 'PRODUCTION',
  priority: 100,
  required: false,
  process: () => warSupportApi?.processTurnWarSupport(),
});

turnManager.register({
  name: 'Political Factions',
  phase: 'PRODUCTION',
  priority: 110,
  required: false,
  process: () => politicalFactionsApi?.processTurnUpdates(),
});

// ... etc for all systems
```

#### 3. Kall fra turn cycle

```typescript
// In gamePhaseHandlers.ts

export async function productionPhase(nations, S, log) {
  await turnManager.processTurn('PRODUCTION');
}
```

### Fordeler med refactor:
- Centralized turn management
- Automatic error handling
- Clear execution order via priority
- Easy to add new systems
- Self-documenting (all processors listed in one place)

---

## KRITISKE NOTATER

### Timing Issues

Vær oppmerksom på **når** hooks mottar oppdaterte props:

```typescript
// Current turn increments at Index.tsx:6042
S.turn++;

// But hooks may not re-render immediately with new turn value
// Ensure processTurn() is called AFTER S.turn++ with updated state
```

**Løsning:** Kall processTurn-metoder etter `S.turn++` i post-turn processing.

### Dependency Issues

Noen hooks kan ha dependencies på andre hooks:

- **Regional Morale** trenger `territories` fra Conventional Warfare
- **Production Queue** trenger `nations` med oppdaterte production values
- **War Support** trenger `nations` med oppdaterte war states

**Viktig:** Kjør processors i riktig rekkefølge!

**Anbefalt rekkefølge:**
1. Territory & Resource systems (already done)
2. Economic systems (already done)
3. Military systems (already done)
4. **NEW: War Support** (depends on wars)
5. **NEW: Political Factions** (depends on nation state)
6. **NEW: Regional Morale** (depends on territories)
7. **NEW: Media Warfare** (independent)
8. **NEW: Production Queue** (depends on resources)
9. **NEW: Resource Refinement** (independent)

### Performance Considerations

Processing 6 additional systems hver turn kan påvirke performance:

**Optimizations:**
- Only process factions/morale for nations that have them
- Batch state updates where possible
- Consider useMemo for expensive calculations
- Profile after implementation

---

## ESTIMERT TIMELINE

### Quick Fix (Alternativ A)
- **Steg 1:** Instansier hooks - 1 time
- **Steg 2:** Legg til processTurn calls - 30 min
- **Steg 3:** Verifiser exports - 15 min
- **Steg 4:** Testing - 1-2 timer
- **Total:** 3-4 timer

### Full Refactor (Alternativ B)
- **Design:** 1 time
- **Implementation:** 2-3 timer
- **Migration:** 1-2 timer
- **Testing:** 2-3 timer
- **Total:** 6-9 timer

---

## RISIKO-ANALYSE

### Lav Risiko:
✅ Hooks er allerede ferdig implementert
✅ ProcessTurn metoder er testet (vi kan se fra test files)
✅ Følger existing pattern (window APIs)

### Medium Risiko:
⚠️ Kan påvirke performance (6 nye processors)
⚠️ Dependencies mellom hooks kan skape problemer
⚠️ State management kan bli kompleks

### Høy Risiko:
🔴 Hvis hooks krever props vi ikke har exposed
🔴 Hvis timing av state updates skaper race conditions
🔴 Hvis callbacks (onCampaignExposed, etc.) mangler implementering

**Mitigering:**
- Start med én hook om gangen
- Test grundig etter hver hook
- Ha rollback plan (git branches)
- Monitor console for errors

---

## NEXT STEPS

1. ✅ **Du er her:** Review audit og fix plan
2. ⏭️ Implementer Quick Fix (Alternativ A)
3. ⏭️ Test alle 6 systemer
4. ⏭️ Deploy og monitor
5. ⏭️ Planlegg Full Refactor (Alternativ B) hvis nødvendig

**Spørsmål før vi starter implementering?**
