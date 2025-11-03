# Immigration & Culture Warfare: Strategic Redesign
## Inspirert av Civilization, Stellaris, og Risk

---

## 🎯 Problemanalyse

**Nåværende svakheter:**
- Deterministiske formler uten variasjon eller risiko
- Ingen integrasjon med andre systemer (militær, diplomati, valg)
- Begrenset motspill (bare "lukk grenser")
- Befolkning er bare et tall - ingen lojalitet, ferdigheter, eller opprinnelse
- Lineær utvikling: velg → betal → vinn
- AI er forutsigbar og transparent

---

## 🌟 Hovedkonsepter (Inspirert av Stellaris & Civilization)

### 1. **POP-SYSTEM** (Stellaris-inspirert)

Befolkning deles inn i **pops** (population units) med dybde:

```typescript
interface PopGroup {
  id: string;
  size: number;              // Antall millioner
  origin: string;            // Hvilken nasjon de kom fra
  loyalty: number;           // 0-100, påvirker produktivitet og stabilitet
  culture: string;           // Kulturell identitet
  skills: 'low' | 'medium' | 'high';  // Utdanningsnivå
  assimilation: number;      // 0-100, hvor integrert de er
  happiness: number;         // 0-100, påvirker produktivitet
  yearsSinceArrival: number; // Tid siden immigrasjon
}

interface Nation {
  // ... existing fields
  popGroups: PopGroup[];     // Erstatter enkelt "population" number
  culturalIdentity: string;  // Nasjonal kultur
  culturalPower: number;     // Kulturell innflytelse (0-100)
  assimilationRate: number;  // Hvor fort pops integreres
  culturalPolicies: CulturalPolicy[];
}
```

**Gameplay-effekter:**
- **Lojalitet** påvirker produktivitet: lav lojalitet = redusert produksjon
- **Ferdigheter** påvirker økonomi: "high-skill" pops gir mer produksjon
- **Assimilering** tar tid: nye immigranter er ikke umiddelbart lojale
- **Opprinnelse** påvirker diplomati: å stjele befolkning skaper fiender

---

### 2. **KULTURELLE INNFLYTELSESONER** (Civilization-inspirert)

Kultur sprer seg som i Civilization:

```typescript
interface CulturalInfluence {
  sourceNation: string;
  targetNation: string;
  strength: number;         // 0-100
  growthRate: number;       // Hvor fort den vokser
  modifiers: string[];      // Faktorer som påvirker vekst
}

interface CulturalZone {
  dominantCulture: string;
  influences: CulturalInfluence[];
  contestedLevel: number;   // Hvor mye konkurranse om kultur
}
```

**Mekanismer:**
- **Kulturell styrke** basert på: intel, befolkning, forskningsbonuser, politikk
- **Geografisk nærhet** gir bonuser (som Risk - naboer påvirker hverandre mer)
- **Allianser** øker kulturell spredning mellom partnere
- **Kulturelle grenser** kan forskyves over tid
- **Cultural Victory** når du dominerer >50% av verdens kulturelle innflytelse

**Visualisering:**
- Kart viser kulturelle innflytelsesoner som gradienter
- Nasjoner kan se hvor deres kultur er sterk/svak

---

### 3. **IMMIGRATION POLICIES** (Strategiske valg)

I stedet for enkle "kjøp immigration"-knapper, velg **politikk**:

```typescript
type ImmigrationPolicy =
  | 'closed_borders'     // Ingen inn, ingen ut, +stabilitet
  | 'selective'          // Kun high-skill, dyre, +økonomi
  | 'humanitarian'       // Mange refugees, -stabilitet, +diplomati
  | 'open_borders'       // Maks innvandring, -stabilitet, +befolkning
  | 'cultural_exchange'  // Fokus på kulturell spredning
  | 'brain_drain_ops';   // Aggressiv talentjakt

interface ImmigrationPolicyEffect {
  stabilityModifier: number;
  economicGrowth: number;
  diplomaticImpact: number;
  culturalAssimilationRate: number;
  immigrationRate: number;
  cost: ResourceCost;
}
```

**Strategiske avveininger:**
- **Closed Borders**: Trygg, men ingen vekst
- **Selective**: Dyrt men kvalitet over kvantitet
- **Open Borders**: Rask vekst men ustabilt
- **Humanitarian**: Diplomatiske bonuser men kortvarig kaos

---

### 4. **KULTURKRIG-OPERASJONER** (Dypere mekanismer)

Erstatt enkle "meme wave" med strategiske kulturoperasjoner:

#### **A. Propaganda Campaigns** (Multi-turn investments)
```typescript
interface PropagandaCampaign {
  id: string;
  targetNation: string;
  type: 'subversion' | 'attraction' | 'demoralization' | 'conversion';
  investment: number;        // Intel per turn
  duration: number;          // Turns remaining
  effectiveness: number;     // Success chance
  discovered: boolean;       // Har målet oppdaget kampanjen?
  counterMeasures: number;   // Mållandets forsvar
}
```

**Mekanismer:**
- Krever **flere turns** med investeringer for å fungere
- Fienden kan **oppdage** og motvirke kampanjer
- **Risiko vs. belønning**: store kampanjer gir mer, men er lettere å oppdage
- **Diplomatiske konsekvenser**: å bli tatt sender relasjoner i dass

#### **B. Cultural Warfare Options**
```typescript
type CulturalOperation =
  | 'sponsor_dissidents'     // Langsom destabilisering
  | 'cultural_export'        // Fredelig, øker innflytelse
  | 'ideological_warfare'    // Aggressiv konvertering
  | 'fifth_column'           // Plant lojale agenter
  | 'mass_media_campaign'    // Bred men overflatisk påvirkning
  | 'academic_exchange';     // Langsiktig, stabil påvirkning

interface OperationOutcome {
  successChance: number;
  culturalInfluenceGain: number;
  populationConverted: number;
  stabilityDamage: number;
  discoveryRisk: number;
  diplomaticPenalty: number;
}
```

---

### 5. **MOTSPILL & FORSVAR** (Strategisk dybde)

Flere forsvarsalternativer enn bare "lukk grenser":

```typescript
interface CulturalDefense {
  type: 'border_security' | 'counter_propaganda' | 'cultural_preservation'
       | 'education_programs' | 'loyalty_incentives' | 'intelligence_sweep';
  cost: ResourceCost;
  effectiveness: number;
  duration: number;
}
```

**Forsvarsmuligheter:**
- **Border Security**: Reduserer immigration, høy kostnad
- **Counter-Propaganda**: Nøytraliserer fiendens kampanjer
- **Cultural Preservation**: Øker assimileringsrate og lojalitet
- **Education Programs**: Konverterer fiendtlige pops til lojale
- **Intelligence Sweep**: Avdekker skjulte operasjoner
- **Loyalty Incentives**: Dyre, men øker pop-happiness direkte

---

### 6. **SYSTEM-INTEGRASJON** (Feedback loops)

Integrer med eksisterende systemer:

#### **A. Diplomati**
```typescript
// Nye diplomatiske hendelser
type DiplomaticIncident =
  | 'population_theft_discovered'   // -30 relations
  | 'cultural_aggression_detected'  // -15 relations
  | 'refugee_acceptance'            // +20 relations
  | 'cultural_exchange_success';    // +10 relations

// Nye diplomatiske avtaler
type DiplomaticTreaty =
  | 'migration_pact'         // Gjensidig fri bevegelse
  | 'cultural_alliance'      // Delt kulturell makt
  | 'non_interference_pact'  // Stopp kulturkrig
  | 'refugee_sharing';       // Koordinert humanitært arbeid
```

#### **B. Valg & Public Opinion**
```typescript
interface ElectionImpact {
  immigrationPolicyApproval: number;   // Velgere bryr seg!
  culturalIdentityConcern: number;     // For mye innvandring = misnøye
  economicGrowthCredit: number;        // Vellykket immigration = popularitet
}

// Ny valgmekanikk
function calculateElectionOutcome(nation: Nation) {
  const immigrationIssue = calculateImmigrationSentiment(nation);
  const culturalAnxiety = calculateCulturalThreat(nation);

  // Høy innvandring uten assimilering = valgrisiko
  if (immigrationIssue.unassimilatedPops > 30) {
    nation.cabinetApproval -= 20;
  }
}
```

#### **C. Økonomi**
```typescript
interface EconomicImpact {
  laborForce: number;           // Flere pops = mer arbeidskraft
  skillBonus: number;           // High-skill pops = produksjonsbonus
  integrationCost: number;      // Nye pops krever investeringer
  brainDrainPenalty: number;    // Å miste pops reduserer økonomi
}
```

#### **D. Militær**
```typescript
// Pops kan rekrutteres til militæret
function recruitFromPops(nation: Nation, popGroup: PopGroup) {
  if (popGroup.loyalty < 50) {
    // Lav lojalitet = risiko for mytteri
    return { success: false, consequence: 'coup_attempt' };
  }

  // Konverter pops til militær styrke
  const militaryPower = popGroup.size * popGroup.loyalty / 100;
  return { success: true, militaryBonus: militaryPower };
}
```

---

### 7. **SEIERSBETINGELSER** (Mer dramatiske)

#### **Demographic Victory** (Stellaris-inspirert)
```
Krav:
✓ >60% av verdens totale befolkning
✓ Minst 3 allierte nasjoner
✓ <25% ustabilitet i 5 påfølgende runder
✓ Kulturell innflytelse >40 i minst 5 nasjoner
```

#### **Cultural Victory** (Civilization-inspirert)
```
Krav:
✓ Dominant kulturell innflytelse i >50% av nasjoner
✓ >100 kulturell makt (global score)
✓ Minst 2 "Great Cultural Wonders" bygd
✓ Ingen aktive kulturkonflikter (må være fredelig)
```

#### **Hegemonic Victory** (Risk-inspirert)
```
Krav:
✓ Kontroller >40% av verdens befolkning gjennom innflytelse
✓ Minst 60% av alle nasjoner er enten allierte eller vasaller
✓ Ingen nasjoner med >30 kulturell motstand mot deg
```

---

### 8. **CULTURAL WONDERS** (Nye strukturer)

Bygg kulturelle bygninger som gir permanente bonuser:

```typescript
interface CulturalWonder {
  id: string;
  name: string;
  cost: ResourceCost;
  buildTime: number;
  effects: {
    culturalPowerBonus: number;
    assimilationRateBonus: number;
    immigrationAttractionBonus: number;
    diplomaticInfluenceBonus: number;
  };
  uniqueAbility: string;
}

const CULTURAL_WONDERS = [
  {
    id: 'global_media_network',
    name: 'Global Media Network',
    cost: { production: 80, intel: 60 },
    buildTime: 6,
    effects: {
      culturalPowerBonus: 25,
      assimilationRateBonus: 0,
      immigrationAttractionBonus: 15,
      diplomaticInfluenceBonus: 10
    },
    uniqueAbility: 'propaganda_immunity' // Immun mot meme waves
  },
  {
    id: 'cultural_academy',
    name: 'Academy of Arts & Sciences',
    cost: { production: 60, intel: 40 },
    buildTime: 5,
    effects: {
      culturalPowerBonus: 15,
      assimilationRateBonus: 30,
      immigrationAttractionBonus: 20,
      diplomaticInfluenceBonus: 5
    },
    uniqueAbility: 'great_people_generation' // Generer "Great People"
  },
  {
    id: 'world_heritage_sites',
    name: 'World Heritage Sites',
    cost: { production: 50, intel: 30 },
    buildTime: 4,
    effects: {
      culturalPowerBonus: 20,
      assimilationRateBonus: 10,
      immigrationAttractionBonus: 25,
      diplomaticInfluenceBonus: 15
    },
    uniqueAbility: 'tourism_victory_progress' // Fremskritt mot cultural victory
  }
];
```

---

### 9. **RANDOM EVENTS** (Emergent gameplay)

Hendelser som skaper dynamikk:

```typescript
interface ImmigrationEvent {
  id: string;
  title: string;
  description: string;
  trigger: (nation: Nation) => boolean;
  choices: EventChoice[];
}

const IMMIGRATION_EVENTS = [
  {
    id: 'refugee_crisis',
    title: 'Refugee Crisis at Border',
    description: '5M refugees from war-torn nation seek asylum.',
    trigger: (n) => n.bordersClosedTurns === 0 && Math.random() < 0.1,
    choices: [
      {
        text: 'Accept all refugees',
        effects: { population: +5, instability: +15, diplomaticReputation: +20 }
      },
      {
        text: 'Accept selectively (skilled only)',
        effects: { population: +2, instability: +5, diplomaticReputation: +5 }
      },
      {
        text: 'Close borders',
        effects: { instability: -5, diplomaticReputation: -25 }
      }
    ]
  },
  {
    id: 'brain_drain_wave',
    title: 'Talent Exodus',
    description: 'Rival nation offers lucrative incentives to your scientists.',
    trigger: (n) => n.population > 50 && Math.random() < 0.08,
    choices: [
      {
        text: 'Counter-offer incentives',
        effects: { production: -20, loyalty: +10, population: 0 }
      },
      {
        text: 'Let them leave',
        effects: { population: -3, intel: -10, instability: +5 }
      },
      {
        text: 'Restrict emigration',
        effects: { instability: +20, diplomaticReputation: -15 }
      }
    ]
  },
  {
    id: 'cultural_renaissance',
    title: 'Cultural Renaissance',
    description: 'Your nation experiences a cultural golden age!',
    trigger: (n) => n.culturalPower > 70 && n.instability < 20,
    choices: [
      {
        text: 'Invest in the arts',
        effects: { production: -30, culturalPower: +25, happiness: +15 }
      },
      {
        text: 'Capitalize commercially',
        effects: { production: +20, culturalPower: +10 }
      }
    ]
  }
];
```

---

### 10. **AI-STRATEGI** (Mer sofistikert)

AI burde ha **langsiktige kulturstrategier** i stedet for tilfeldige valg:

```typescript
interface CulturalStrategy {
  name: string;
  priority: number;
  condition: (nation: Nation, gameState: GameState) => boolean;
  execute: (nation: Nation, targets: Nation[]) => void;
}

const AI_CULTURAL_STRATEGIES = [
  {
    name: 'hegemonic_assimilation',
    priority: 90,
    condition: (n) => n.culturalPower > 60 && n.population > 100,
    execute: (n, targets) => {
      // Fokuser på å assimilere svake naboer
      const weakNeighbors = targets.filter(t =>
        t.culturalPower < n.culturalPower * 0.5
      );
      // Start multi-turn propaganda campaigns
      weakNeighbors.forEach(t => startPropagandaCampaign(n, t, 'conversion'));
    }
  },
  {
    name: 'defensive_preservation',
    priority: 80,
    condition: (n) => n.culturalPower < 40 && n.instability > 30,
    execute: (n) => {
      // Fokuser på forsvar og kulturell bevaring
      investInCulturalDefense(n, 'cultural_preservation');
      closesBorders(n, 3); // Midlertidig stenging
    }
  },
  {
    name: 'opportunistic_brain_drain',
    priority: 70,
    condition: (n) => n.intel > 50,
    execute: (n, targets) => {
      // Målrett høyt-utdannede pops fra ustabile nasjoner
      const unstableTargets = targets.filter(t => t.instability > 50);
      unstableTargets.forEach(t =>
        executeBrainDrain(n, t, 'high_skill')
      );
    }
  }
];
```

---

## 🎮 IMPLEMENTERINGSPLAN

### **FASE 1: Grunnleggende Pop-System** (2-3 uker)
- [ ] Lag `PopGroup` datastruktur
- [ ] Migrer eksisterende `population` til `popGroups[]`
- [ ] Implementer lojalitet og assimilering
- [ ] Visualiser pop-komposisjon i UI

### **FASE 2: Kulturelle Innflytelsesoner** (2 uker)
- [ ] Lag `CulturalInfluence` system
- [ ] Implementer kulturell spredning per turn
- [ ] Visualiser kulturelle soner på kartet
- [ ] Lag kulturmålere i UI

### **FASE 3: Immigration Policies** (1 uke)
- [ ] Erstatt enkle immigration-knapper med policy-system
- [ ] Implementer policy-effekter
- [ ] Balansering og testing

### **FASE 4: Kulturkrig-operasjoner** (2 uker)
- [ ] Implementer multi-turn propaganda campaigns
- [ ] Lag oppdagelsessystem
- [ ] Diplomatiske konsekvenser
- [ ] Forsvarssystemer

### **FASE 5: System-integrasjon** (2 uker)
- [ ] Koble til diplomati-systemet
- [ ] Koble til valg-systemet
- [ ] Økonomiske effekter
- [ ] Militær rekruttering fra pops

### **FASE 6: Cultural Wonders & Events** (1-2 uker)
- [ ] Implementer Cultural Wonders
- [ ] Lag random event-system
- [ ] Balansering

### **FASE 7: AI-forbedringer** (1 uke)
- [ ] Implementer AI kulturstrategier
- [ ] Testing og tuning
- [ ] Balansering

---

## 📊 BALANSERING

### **Foreslåtte tall:**

**Pop Lojalitet:**
- Ny immigrant: 30-50 lojalitet
- Assimilering: +2-5 per turn (avhengig av policy)
- Full assimilering: 90+ lojalitet (5-10 turns)

**Kulturell innflytelse:**
- Base vekst: +1-3 per turn
- Med allianser: +5-10 per turn
- Med Cultural Wonders: +15-25 per turn
- Geografisk bonus: +2 for naboer

**Immigration rates:**
- Closed: 0 per turn
- Selective: 1-2M per turn, kun high-skill
- Open: 5-10M per turn, mixed skill
- Humanitarian: 3-8M per turn, mostly refugees

**Kulturkrig costs:**
- Propaganda campaign: 10-20 intel per turn, 3-5 turns
- Cultural conversion: 25 intel, 20% success chance
- Counter-propaganda: 15 intel, nøytraliserer 1 kampanje

---

## 🎯 KONKLUSJON

Dette redesignet vil transformere Immigration og Culture Warfare fra **enkle resource-to-outcome transaksjoner** til **dype strategiske systemer** med:

✅ **Emergent gameplay** gjennom pop-interaksjoner
✅ **Langsiktig planlegging** via multi-turn campaigns
✅ **Strategiske avveininger** i policies
✅ **Risiko og belønning** i kulturoperasjoner
✅ **System-integrasjon** med diplomati, økonomi, valg
✅ **Feedback loops** som skaper dynamikk
✅ **Motspill** og counter-strategies
✅ **AI-dybde** med langsiktige strategier

Dette vil gjøre systemene **konkurransedyktige** med Civilization, Stellaris, og andre grand strategy-spill! 🚀
