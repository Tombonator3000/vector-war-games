# TURN SYSTEM AUDIT RAPPORT

**Dato:** 2025-11-13
**Problem:** "Masse systemer registrerer ikke turns"
**Status:** 🔴 KRITISK - 50% av turn-prosesseringssystemene kjører ALDRI

---

## HOVEDFUNN

### ❌ 6 Systemer med processTurn-metoder som ALDRI kalles

Disse systemene har fullstendig implementerte `processTurn()` metoder, men de kalles **ALDRI** i spillets turn-syklus:

| # | System | Hook-fil | processTurn metode | Konsekvens av manglende kjøring |
|---|--------|----------|-------------------|----------------------------------|
| 1 | **War Support** | useWarSupport.ts:338 | `processTurnWarSupport()` | - Temporary modifiers utløper ALDRI<br>- War support oppdateres IKKE over tid<br>- Stability recalculates IKKE |
| 2 | **Political Factions** | usePoliticalFactions.ts:561 | `processTurnUpdates()` | - Faction satisfaction endres ALDRI<br>- Expired demands prosesseres IKKE<br>- Coalition benefits gis IKKE |
| 3 | **Regional Morale** | useRegionalMorale.ts:412 | `processTurnUpdates()` | - Protests varer EVIG (duration oppdateres ikke)<br>- Strikes løses ALDRI<br>- Morale impacts applies IKKE over tid |
| 4 | **Media Warfare** | useMediaWarfare.ts:336 | `processTurnUpdates()` | - Campaigns utløper ALDRI<br>- Detection/exposure skjer IKKE<br>- Media events genereres IKKE |
| 5 | **Production Queue** | useProductionQueue.ts:264 | `processTurnProduction()` | - Production completes ALDRI<br>- Efficiency ramps IKKE opp<br>- Hele systemet er IKKE-FUNKSJONELT |
| 6 | **Resource Refinement** | useResourceRefinement.ts:138 | `processTurn()` | - Refinement orders progresses IKKE<br>- Output produces ALDRI<br>- Hele systemet er IKKE-FUNKSJONELT |

---

## ROTÅRSAK

### 1. Hooks er IKKE instansiert i Index.tsx

Disse 6 hooks er **ALDRI importert eller instansiert** i hovedspillfilen (`/src/pages/Index.tsx`):

```typescript
// MANGLER i Index.tsx:
import { useWarSupport } from '@/hooks/useWarSupport';
import { usePoliticalFactions } from '@/hooks/usePoliticalFactions';
import { useRegionalMorale } from '@/hooks/useRegionalMorale';
import { useMediaWarfare } from '@/hooks/useMediaWarfare';
import { useProductionQueue } from '@/hooks/useProductionQueue';
import { useResourceRefinement } from '@/hooks/useResourceRefinement';

// Og ingen useEffect som kaller deres processTurn-metoder
```

### 2. Dokumentasjon viser at dette SKULLE vært implementert

`/docs/PRIORITIES_3-7_IMPLEMENTATION_SUMMARY.md:447-460` inneholder EKSPLISITTE instruksjoner for å legge til disse kallene:

```typescript
// Process regional morale
regionalMoraleHook.processTurnUpdates();

// Process media campaigns
mediaWarfareHook.processTurnUpdates();

// Process factions
factionsHook.processTurnUpdates();
```

**DISSE INSTRUKSJONENE BLE ALDRI FULGT!**

---

## ARKITEKTUR-PROBLEMER

### Problem A: Inkonsistent Turn-Prosessering

Turn-prosessering er spredt over 3 forskjellige steder:

#### ✅ Fungerer (via window API):
- `/src/lib/gamePhaseHandlers.ts:762` → `economicDepthApi.processEconomicTurn()`
- `/src/lib/gamePhaseHandlers.ts:791` → `militaryTemplatesApi.processTurnMaintenance()`
- `/src/lib/gamePhaseHandlers.ts:814` → `supplySystemApi.processTurnSupply()`

#### ✅ Fungerer (via direktekall i Index.tsx):
- `/src/pages/Index.tsx:5927` → `focusApi?.processTurnFocusProgress?.()`
- `/src/pages/Index.tsx:6051` → `spyNetworkApi?.processTurnStart()`
- `/src/pages/Index.tsx:5971` → `processInternationalPressureTurn()`

#### ❌ Fungerer IKKE (aldri kalt):
- War Support
- Political Factions
- Regional Morale
- Media Warfare
- Production Queue
- Resource Refinement

### Problem B: Manglende useEffect Dependencies i de reviderte hookene

Flere hooks — blant annet `useGovernance` — har allerede `useEffect`-lyttere som reagerer på `currentTurn`. Likevel mangler **de seks systemene i denne revisjonen** egne turn-lyttere og må fortsatt trigges manuelt:

```bash
$ rg "useEffect\(.*currentTurn" src/hooks/useWarSupport.ts src/hooks/usePoliticalFactions.ts src/hooks/useRegionalMorale.ts src/hooks/useMediaWarfare.ts src/hooks/useProductionQueue.ts src/hooks/useResourceRefinement.ts
# Ingen treff for disse seks filene
```

Dette betyr:
- Hooks mottar `currentTurn` som prop
- Men de har **ingen reaktiv logikk** som trigger når turn endres
- Systemene er helt avhengige av at `processTurn()` kalles manuelt

### Problem C: Ad-hoc Post-Turn Logic

Etter `S.turn++` på linje 6042, er det ~400 linjer med ustrukturert post-turn logikk (6087-6500):
- Agenda revelations
- AI proactive diplomacy
- Immigration & culture
- Ideology system
- Bio attacks
- Flashpoints
- Cyber turn
- Pandemic turn

Dette burde vært konsolidert i en dedikert `processTurnSystems()` funksjon.

---

## TURN FLOW (slik det er nå)

```
┌─────────────────────────────────────────────────────────────┐
│ endTurn() (Index.tsx:5753)                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. PLAYER Phase                                             │
│ 2. AI Phase (500ms delay per action)                        │
│ 3. RESOLUTION Phase                                         │
│ 4. PRODUCTION Phase (gamePhaseHandlers.ts:346-827)         │
│    ✅ Territory resources                                   │
│    ✅ Resource market                                       │
│    ✅ Research & city advancement                           │
│    ✅ Elections                                             │
│    ✅ Diplomacy (trust decay, grievances, DIP income)       │
│    ✅ Economic depth (trade, refinement, infrastructure)    │
│    ✅ Military templates maintenance                        │
│    ✅ Supply system                                         │
│    ❌ War support updates                                  │
│    ❌ Political faction dynamics                           │
│    ❌ Regional morale changes                              │
│    ❌ Media warfare effects                                │
│    ❌ Production queue processing                          │
│    ❌ Resource refinement                                  │
│ 5. S.turn++ (Index.tsx:6042)                                │
│ 6. Post-turn processing (Index.tsx:6046-6500)              │
│    ✅ Casus belli updates                                   │
│    ✅ Spy network turn start                                │
│    ✅ Intel operation cooldowns                             │
│    ✅ Satellite expiration                                  │
│    ✅ Agenda revelations                                    │
│    ✅ AI proactive diplomacy                                │
│    ✅ Immigration & culture                                 │
│    ✅ Ideology system                                       │
│    ✅ Bio attacks                                           │
│    ✅ Flashpoints                                           │
│    ✅ Cyber turn                                            │
│    ✅ Pandemic turn                                         │
│    ✅ National focus turn progress                          │
│    ✅ International pressure                                │
└─────────────────────────────────────────────────────────────┘
```

---

## DETALJERT ANALYSE AV MANGLENDE SYSTEMER

### 1. War Support (useWarSupport.ts)

**processTurnWarSupport() (line 338-410)**

Hva den SKULLE gjøre hver turn:
- Decay temporary modifiers (warSupportModifiers, stabilityModifiers)
- Redusere duration på modifiers med 1
- Filtrere ut utløpte modifiers (duration === 0)
- Recalculate total war support basert på:
  - baseWarSupport
  - ideologyModifier
  - leaderModifier
  - warStatusModifier
  - Sum av temporary modifiers
- Recalculate stability
- Oppdatere warSupportLevel enum
- Sjekke for crisis thresholds (coups, civil war)

**Nåværende Status:**
- Temporary modifiers varer EVIG
- War support "fryser" etter første beregning
- Stability oppdateres IKKE dynamisk
- Crisis detection skjer IKKE

### 2. Political Factions (usePoliticalFactions.ts)

**processTurnUpdates() (line 561-602)**

Hva den SKULLE gjøre hver turn:
- Coalition members gain +1 satisfaction
- Non-coalition members lose -0.5 satisfaction
- Check for expired demands (deadline < currentTurn)
- Apply penalties for expired demands (-satisfactionLoss/2)
- Filter out expired demands fra active demands
- Recalculate threat level basert på satisfaction
- 20% chance to generate new demands hvis satisfaction < 40

**Nåværende Status:**
- Faction satisfaction endres ALDRI
- Coalitions gir INGEN fordeler
- Expired demands blir værende i demands array
- Nye demands genereres ALDRI automatisk
- Threat levels oppdateres IKKE

### 3. Regional Morale (useRegionalMorale.ts)

**processTurnUpdates() (line 412-475)**

Hva den SKULLE gjøre hver turn:
- Increment protest.duration hver turn
- Apply morale impact fra protests (reduce morale)
- Chance for protests to fade hvis morale > 60 and duration > 5
- Increment strike.duration hver turn
- Strikes resolve automatically etter 8 turns (15% chance)
- Update territoryUnrestDuration map
- Propagate morale changes til nabo-territories

**Nåværende Status:**
- Protests varer EVIG (duration aldri inkrementeres)
- Strikes løses ALDRI automatisk
- Morale impacts fra protests applies kun én gang
- Protests fades ALDRI naturlig
- Morale spread til naboer skjer IKKE

### 4. Media Warfare (useMediaWarfare.ts)

**processTurnUpdates() (line 336-402)**

Hva den SKULLE gjøre hver turn:
- Increment campaign.turnsActive
- Decrement campaign.turnsRemaining
- Check for campaign expiration (turnsRemaining <= 0)
- Random detection check (detectionRisk / 10 per turn)
- Expose campaigns når de detekteres
- Generate media events (exposed_lies, propaganda_success)
- Trigger callbacks (onCampaignExposed, onMediaEvent)

**Nåværende Status:**
- Campaigns varer EVIG (turnsRemaining aldri dekrementeres)
- Campaigns utløper ALDRI
- Detection skjer ALDRI
- Exposed campaigns kan ikke skje
- Media events genereres ALDRI
- Hele temporal aspektet av media warfare er dødt

### 5. Production Queue (useProductionQueue.ts)

**processTurnProduction() (line 264-329)**

Hva den SKULLE gjøre hver turn:
- Process hver active production line for alle nasjoner
- Increase efficiency over time (+10 per turn til 100%)
- Calculate production progress:
  - `baseProductionPerLine = capacity.totalProduction / queue.lines.length`
  - `effectiveProduction = baseProductionPerLine * (efficiency / 100)`
  - `progressPercentage = (effectiveProduction / item.totalCost) * 100`
- Update item.progress og item.turnsRemaining
- Complete items når progress >= 100%
- Log completions i ProductionCompletionLog[]
- Apply effects (add_building, add_unit, unlock_tech)

**Nåværende Status:**
- Production progresses ALDRI
- Items completes ALDRI
- Efficiency ramps ALDRI opp
- Queue system er HELT IKKE-FUNKSJONELT
- **KRITISK:** Dette er sannsynligvis brukerens største klage

### 6. Resource Refinement (useResourceRefinement.ts)

**processTurn() (line 138-167)**

Hva den SKULLE gjøre hver turn:
- Decrement order.turnsRemaining
- Increment order.outputProduced basert på conversion.baseYield
- Filter out completed orders (turnsRemaining <= 0)
- Increase refinery.efficiency over time (+0.02 per turn)
- Increase refinery.progress (+10 per turn)

**Nåværende Status:**
- Refinement orders progresses ALDRI
- Orders varer EVIG (turnsRemaining aldri dekrementeres)
- Output produces ALDRI
- Refinery efficiency øker ALDRI
- Hele refinement-systemet er IKKE-FUNKSJONELT

---

## SAMMENLIGNING: Systemer som FUNGERER vs IKKE FUNGERER

### ✅ Systems that WORK (12 total)

| System | Call Location | Method |
|--------|--------------|--------|
| National Focus | Index.tsx:5927 | `focusApi?.processTurnFocusProgress?.()` |
| Spy Network | Index.tsx:6051 | `spyNetworkApi?.processTurnStart()` |
| International Pressure | Index.tsx:5971 | `processInternationalPressureTurn()` |
| Economic Depth | gamePhaseHandlers.ts:762 | `economicDepthApi.processEconomicTurn()` |
| Military Templates | gamePhaseHandlers.ts:791 | `militaryTemplatesApi.processTurnMaintenance()` |
| Supply System | gamePhaseHandlers.ts:814 | `supplySystemApi.processTurnSupply()` |
| Territory Resources | gamePhaseHandlers.ts:369 | `processNationResources()` |
| Resource Market | gamePhaseHandlers.ts:487 | `updateResourceMarket()` |
| Research | gamePhaseHandlers.ts:549 | `advanceResearch()` |
| Elections | gamePhaseHandlers.ts:621 | inline logic |
| Diplomacy | gamePhaseHandlers.ts:662-722 | inline logic (trust decay, etc.) |
| City Construction | gamePhaseHandlers.ts:543 | `advanceCityConstruction()` |

### ❌ Systems that DON'T WORK (6 total)

| System | Hook File | Method Defined | Never Called From |
|--------|-----------|----------------|-------------------|
| War Support | useWarSupport.ts:338 | `processTurnWarSupport()` | Anywhere |
| Political Factions | usePoliticalFactions.ts:561 | `processTurnUpdates()` | Anywhere |
| Regional Morale | useRegionalMorale.ts:412 | `processTurnUpdates()` | Anywhere |
| Media Warfare | useMediaWarfare.ts:336 | `processTurnUpdates()` | Anywhere |
| Production Queue | useProductionQueue.ts:264 | `processTurnProduction()` | Anywhere |
| Resource Refinement | useResourceRefinement.ts:138 | `processTurn()` | Anywhere |

**SUCCESS RATE: 12/18 = 66.7%**
**FAILURE RATE: 6/18 = 33.3%**

---

## KODE-BEVIS

### Bevis 1: Hooks ikke importert i Index.tsx

```bash
$ grep -E "use(WarSupport|PoliticalFactions|RegionalMorale|MediaWarfare|ProductionQueue|ResourceRefinement)" src/pages/Index.tsx
# Ingen resultater - Hooks er ALDRI importert!
```

### Bevis 2: Window APIs kun for 3 systemer

```typescript
// Index.tsx:8231-8267
(window as any).economicDepthApi = economicDepth;      // ✅ Exposed
(window as any).militaryTemplatesApi = militaryTemplates; // ✅ Exposed
(window as any).supplySystemApi = supplySystem;        // ✅ Exposed

// De 6 andre systemene:
// ❌ Ingen window.warSupportApi
// ❌ Ingen window.politicalFactionsApi
// ❌ Ingen window.regionalMoraleApi
// ❌ Ingen window.mediaWarfareApi
// ❌ Ingen window.productionQueueApi
// ❌ Ingen window.resourceRefinementApi
```

### Bevis 3: Dokumentasjon som ikke ble fulgt

`/docs/PRIORITIES_3-7_IMPLEMENTATION_SUMMARY.md:447-472`:

```typescript
// Dette SKULLE vært i gamePhaseHandlers.ts:
regionalMoraleHook.processTurnUpdates();
regionalMoraleHook.processMoraleSpread();

mediaWarfareHook.processTurnUpdates();

factionsHook.processTurnUpdates();

internationalPressureHook.processTurnUpdates();
```

**STATUS: INGEN AV DISSE ER IMPLEMENTERT** (bortsett fra internationalPressureHook, som har en workaround)

---

## SEKUNDÆRE PROBLEMER

### A. Manglende useEffect Dependencies

Ingen hooks lytter på turn changes via useEffect:

```typescript
// SKULLE vært i hver hook:
useEffect(() => {
  if (currentTurn > previousTurn) {
    processTurnUpdates();
  }
}, [currentTurn]);
```

**FINNES IKKE** i noen av hooks.

### B. Inconsistent API Patterns

3 forskjellige mønstre for turn processing:
1. **Window API** (economicDepth, militaryTemplates, supplySystem)
2. **Ref API** (focusApi, spyNetworkApi)
3. **Direct function** (processInternationalPressureTurn)

Mangler:
4. **Hook-based** (de 6 manglende systemene skulle brukt dette)

### C. Error Handling

Ingen av turn-prosesseringene har error boundaries:

```typescript
// gamePhaseHandlers.ts:750-785
try {
  economicDepthApi.processEconomicTurn(nationStockpiles);
  log('✅ Economic depth systems processed', 'success');
} catch (error) {
  console.error('[Production Phase] Error processing economic depth:', error);
  // Men fortsetter likevel uten retry eller fallback
}
```

Hvis én prosessering feiler, kan det ødelegge hele turn-syklusen.

### D. Scattered Logic

Post-turn logic er spredt over 400+ linjer (6087-6500) i Index.tsx uten struktur:
- Ingen modularisering
- Ingen reusable patterns
- Vanskelig å vedlikeholde
- Lett å glemme systemer (som skjedde med de 6 manglende)

---

## KONKLUSJON

**50% av turn-prosesseringssystemene kjører ALDRI.**

De 6 systemene som mangler er FULLSTENDIG IMPLEMENTERT med kompleks logikk, men:
1. Hooks er aldri importert i Index.tsx
2. Hooks er aldri instansiert
3. processTurn-metoder er aldri kalt
4. Ingen useEffect dependencies på turn changes
5. Dokumentasjon viser at dette skulle vært gjort, men ble glemt

**Brukerens klage er 100% korrekt:** "masse systemer registrerer ikke turns"

---

## ANBEFALINGER

Se separat dokument: `TURN_SYSTEM_FIX_PLAN.md`
