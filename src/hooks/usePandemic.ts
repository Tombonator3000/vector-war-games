import { useCallback, useMemo, useRef, useState } from 'react';
import type { NewsItem } from '@/components/NewsTicker';

export type PandemicStage = 'outbreak' | 'epidemic' | 'pandemic' | 'collapse';
export type PandemicOrigin = 'bio-terror' | 'unknown' | 'natural';

export interface PandemicOutbreak {
  region: string;
  infection: number; // 0-100 pressure in the theatre
  heat: number; // signals how visible the outbreak is
}

export interface PandemicState {
  active: boolean;
  strainName: string;
  pathogenType: string;
  origin: PandemicOrigin;
  stage: PandemicStage;
  globalInfection: number;
  mutationLevel: number;
  lethality: number;
  containmentEffort: number;
  vaccineProgress: number;
  casualtyTally: number;
  suspectedActors: string[];
  outbreaks: PandemicOutbreak[];
  lastMutation: string | null;
}

export interface PandemicTriggerPayload {
  severity: 'contained' | 'moderate' | 'severe';
  origin: PandemicOrigin;
  regions?: string[];
  suspectedActors?: string[];
  initialContainment?: number;
  initialInfection?: number;
  label?: string;
}

export interface PandemicCountermeasurePayload {
  type: 'containment' | 'vaccine' | 'mutation' | 'suppression' | 'intel';
  value?: number;
  region?: string;
  actor?: string;
  label?: string;
}

export interface PandemicTurnContext {
  turn: number;
  defcon: number;
  playerPopulation: number;
}

export interface PandemicTurnEffect {
  populationLoss?: number;
  productionPenalty?: number;
  instabilityIncrease?: number;
  actionsPenalty?: number;
  intelGain?: number;
  resolved?: boolean;
  summary?: string;
}

type AddNewsItem = (category: NewsItem['category'], text: string, priority: NewsItem['priority']) => void;

const INITIAL_STATE: PandemicState = {
  active: false,
  strainName: '',
  pathogenType: '',
  origin: 'unknown',
  stage: 'outbreak',
  globalInfection: 0,
  mutationLevel: 0,
  lethality: 0,
  containmentEffort: 0,
  vaccineProgress: 0,
  casualtyTally: 0,
  suspectedActors: [],
  outbreaks: [],
  lastMutation: null
};

const STAGE_THRESHOLDS: Record<PandemicStage, number> = {
  outbreak: 0,
  epidemic: 25,
  pandemic: 55,
  collapse: 80
};

const STAGE_ORDER: PandemicStage[] = ['outbreak', 'epidemic', 'pandemic', 'collapse'];

const STRAIN_PREFIXES = ['VX', 'HARBINGER', 'OMEGA', 'CERBERUS', 'BASILISK', 'SIREN', 'SPECTER', 'PHOENIX'];
const STRAIN_SUFFIXES = ['-19', '-Sigma', '-NX', '-Theta', '-Ichor', '-Nyx', '-Axiom', '-Haze'];
const PATHOGEN_TYPES = [
  'synthetic hemorrhagic fever',
  'neuropathic nanophage',
  'engineered prion cascade',
  'weaponized filament virus',
  'aerosolized fungal chimera',
  'adaptive retroviral swarm'
];
const MUTATION_TRAITS = [
  'airborne resilience',
  'antiviral resistance',
  'hyper-hemorrhagic expression',
  'neurological disruption',
  'cytokine storm amplification',
  'latent carrier dormancy'
];
const REGIONAL_THEATRES = [
  'CONUS missile crews',
  'Atlantic SSBN flotilla',
  'Western Europe radar net',
  'Pacific bomber squadrons',
  'Mediterranean carrier task force',
  'Arctic listening posts'
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickRandom<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function generateStrainName() {
  const prefix = pickRandom(STRAIN_PREFIXES);
  const suffix = pickRandom(STRAIN_SUFFIXES);
  const numeric = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${numeric}${suffix}`;
}

function buildOutbreaks(regions?: string[]): PandemicOutbreak[] {
  const sourceRegions = regions && regions.length > 0 ? regions : [pickRandom(REGIONAL_THEATRES)];
  return sourceRegions.map(region => ({
    region,
    infection: Math.floor(Math.random() * 15) + 10,
    heat: Math.floor(Math.random() * 40) + 30
  }));
}

export function usePandemic(addNewsItem: AddNewsItem) {
  const [pandemicState, setPandemicState] = useState<PandemicState>(INITIAL_STATE);
  const stageRef = useRef<PandemicStage>('outbreak');

  const triggerPandemic = useCallback((payload: PandemicTriggerPayload) => {
    let newsText: string | null = null;
    const newsPriority: NewsItem['priority'] = 'critical';

    setPandemicState(prev => {
      const active = prev.active;
      const strainName = active ? prev.strainName : generateStrainName();
      const pathogenType = active ? prev.pathogenType : pickRandom(PATHOGEN_TYPES);
      const lethalityBase = payload.severity === 'severe' ? 0.35 : payload.severity === 'moderate' ? 0.25 : 0.15;
      const containmentBoost = payload.initialContainment ?? (payload.severity === 'severe' ? 10 : payload.severity === 'moderate' ? 25 : 40);
      const infectionBoost = payload.initialInfection ?? (payload.severity === 'severe' ? 40 : payload.severity === 'moderate' ? 25 : 12);

      const suspectedActors = new Set(prev.suspectedActors);
      payload.suspectedActors?.forEach(actor => suspectedActors.add(actor));

      const outbreaks = active
        ? prev.outbreaks.map(outbreak => ({
            ...outbreak,
            infection: clamp(outbreak.infection + infectionBoost * 0.3, 0, 100),
            heat: clamp(outbreak.heat + 10, 0, 100)
          }))
        : buildOutbreaks(payload.regions);

      const desiredStage = payload.severity === 'severe' ? 'pandemic' : payload.severity === 'moderate' ? 'epidemic' : 'outbreak';
      const stageIndex = STAGE_ORDER.indexOf(desiredStage);
      const currentIndex = STAGE_ORDER.indexOf(prev.stage);
      const stage = active ? STAGE_ORDER[Math.max(currentIndex, stageIndex)] : desiredStage;

      newsText = payload.label
        ? payload.label
        : `Bio-weapon ${strainName} detected – ${pickRandom(['crews reporting hemorrhagic symptoms', 'NORAD medics overwhelmed', 'strategic readiness collapsing'])}`;

      const nextState: PandemicState = {
        active: true,
        strainName,
        pathogenType,
        origin: payload.origin,
        stage,
        globalInfection: clamp(active ? prev.globalInfection + infectionBoost * 0.6 : infectionBoost, 0, 100),
        mutationLevel: Math.max(prev.mutationLevel, payload.severity === 'severe' ? 4 : payload.severity === 'moderate' ? 2 : 1),
        lethality: active ? prev.lethality : lethalityBase,
        containmentEffort: clamp(active ? prev.containmentEffort + containmentBoost : containmentBoost, 0, 100),
        vaccineProgress: prev.vaccineProgress,
        casualtyTally: prev.casualtyTally,
        suspectedActors: Array.from(suspectedActors),
        outbreaks,
        lastMutation: prev.lastMutation
      };

      stageRef.current = nextState.stage;
      return nextState;
    });

    if (newsText) {
      addNewsItem('crisis', newsText, newsPriority);
    }
  }, [addNewsItem]);

  const applyCountermeasure = useCallback((payload: PandemicCountermeasurePayload) => {
    if (!pandemicState.active) return;

    let newsCategory: NewsItem['category'] = 'science';
    let newsPriority: NewsItem['priority'] = 'important';
    let newsMessage: string | null = null;

    setPandemicState(prev => {
      if (!prev.active) return prev;

      switch (payload.type) {
        case 'containment': {
          const value = payload.value ?? 15;
          const reducedInfection = value * 0.4;
          const outbreaks = prev.outbreaks.map(outbreak => ({
            ...outbreak,
            infection: clamp(outbreak.infection - reducedInfection * 0.5, 0, 100),
            heat: clamp(outbreak.heat + 5, 0, 100)
          }));
          newsMessage = payload.label ?? 'BioShield cordons tightened – infection pressure falling.';
          return {
            ...prev,
            containmentEffort: clamp(prev.containmentEffort + value, 0, 100),
            globalInfection: clamp(prev.globalInfection - reducedInfection, 0, 100),
            outbreaks,
            lastMutation: prev.lastMutation
          };
        }
        case 'vaccine': {
          const value = payload.value ?? 20;
          newsMessage = payload.label ?? 'Gene labs push experimental vaccine candidates into trials.';
          return {
            ...prev,
            vaccineProgress: clamp(prev.vaccineProgress + value, 0, 120),
            globalInfection: clamp(prev.globalInfection - value * 0.2, 0, 100),
            lastMutation: prev.lastMutation
          };
        }
        case 'mutation': {
          const value = payload.value ?? 5;
          newsCategory = value > 0 ? 'crisis' : 'science';
          newsPriority = value > 0 ? 'urgent' : 'important';
          newsMessage = payload.label ?? (value > 0
            ? `Pathogen ${prev.strainName} mutates beyond containment protocols.`
            : `Counter-genetics program destabilizes ${prev.strainName}.`);
          return {
            ...prev,
            mutationLevel: clamp(prev.mutationLevel + value, 0, 12),
            globalInfection: clamp(prev.globalInfection + value * 1.2, 0, 100),
            lastMutation: value > 0 ? (payload.label ?? 'Rapid mutation detected') : prev.lastMutation
          };
        }
        case 'suppression': {
          const value = payload.value ?? 20;
          const region = payload.region;
          const outbreaks = prev.outbreaks.map(outbreak =>
            region && outbreak.region !== region
              ? outbreak
              : {
                  ...outbreak,
                  infection: clamp(outbreak.infection - value, 0, 100),
                  heat: clamp(outbreak.heat - 10, 0, 100)
                }
          );
          newsMessage = payload.label ?? (region
            ? `Deep-clean teams report ${region} outbreak receding.`
            : 'Forward bases report infection clusters shrinking.');
          return {
            ...prev,
            outbreaks,
            globalInfection: clamp(prev.globalInfection - value * 0.3, 0, 100),
            lastMutation: prev.lastMutation
          };
        }
        case 'intel': {
          const actor = payload.actor;
          newsMessage = payload.label ?? (actor ? `SIGINT points to ${actor} engineering the pathogen.` : 'Bioforensics yields new intel on release vector.');
          newsCategory = 'intel';
          const suspectedActors = new Set(prev.suspectedActors);
          if (actor) {
            suspectedActors.add(actor);
          }
          return {
            ...prev,
            suspectedActors: Array.from(suspectedActors),
            containmentEffort: clamp(prev.containmentEffort + (payload.value ?? 5), 0, 100),
            lastMutation: prev.lastMutation
          };
        }
        default:
          return prev;
      }
    });

    if (newsMessage) {
      addNewsItem(newsCategory, newsMessage, newsPriority);
    }
  }, [addNewsItem, pandemicState.active]);

  const advancePandemicTurn = useCallback((context: PandemicTurnContext): PandemicTurnEffect | null => {
    if (!pandemicState.active) {
      return null;
    }

    const turnNews: Array<{ category: NewsItem['category']; text: string; priority: NewsItem['priority'] }> = [];

    let mutationDescriptor: string | null = null;
    let resolved = false;
    let summary: string | undefined;
    let populationLoss = 0;
    let productionPenalty = 0;
    let instabilityIncrease = 0;
    let actionsPenalty = 0;

    setPandemicState(prev => {
      if (!prev.active) return prev;

      const containmentBleed = prev.containmentEffort > 0 ? 1.5 : 0;
      const vaccineMomentum = prev.vaccineProgress / 20;
      const baseSpread = 6 + prev.outbreaks.length * 1.5 + prev.mutationLevel * 1.3;
      const containmentEffect = prev.containmentEffort * 0.12 + vaccineMomentum;
      const newGlobalInfection = clamp(prev.globalInfection + baseSpread - containmentEffect, 0, 100);
      const infectionDelta = newGlobalInfection - prev.globalInfection;

      const outbreaks = prev.outbreaks.map(outbreak => ({
        ...outbreak,
        infection: clamp(outbreak.infection + infectionDelta * 0.5 - containmentEffect * 0.3, 0, 100),
        heat: clamp(outbreak.heat + Math.max(0, infectionDelta) * 0.6 - containmentEffect * 0.2, 0, 100)
      }));

      const mutationChance = 0.12 + prev.mutationLevel * 0.03 - prev.containmentEffort * 0.002;
      let mutationLevel = prev.mutationLevel;
      if (Math.random() < clamp(mutationChance, 0.05, 0.45)) {
        mutationLevel = clamp(mutationLevel + 1, 0, 12);
        mutationDescriptor = pickRandom(MUTATION_TRAITS);
        turnNews.push({
          category: 'science',
          text: `${prev.strainName} expresses ${mutationDescriptor}.`,
          priority: 'urgent'
        });
      }

      const newContainment = clamp(prev.containmentEffort - containmentBleed, 0, 100);
      const newVaccine = clamp(prev.vaccineProgress + Math.max(0, prev.containmentEffort - 40) * 0.05, 0, 120);

      const lethality = prev.lethality + mutationLevel * 0.01;
      const casualtyBase = Math.max(0, infectionDelta) * (lethality + 0.1) * 50000;
      populationLoss = Math.round(casualtyBase * (context.playerPopulation > 0 ? clamp(context.playerPopulation / 300, 0.2, 2) : 1));
      productionPenalty = Math.round(newGlobalInfection * 0.2);
      instabilityIncrease = Math.round(Math.max(0, infectionDelta) * 0.5);
      actionsPenalty = newGlobalInfection >= 70 ? 1 : newGlobalInfection >= 45 ? 1 : 0;

      const newCasualtyTally = prev.casualtyTally + populationLoss;

      let stage: PandemicStage = prev.stage;
      if (newGlobalInfection >= STAGE_THRESHOLDS.collapse) {
        stage = 'collapse';
      } else if (newGlobalInfection >= STAGE_THRESHOLDS.pandemic) {
        stage = 'pandemic';
      } else if (newGlobalInfection >= STAGE_THRESHOLDS.epidemic) {
        stage = 'epidemic';
      } else {
        stage = 'outbreak';
      }

      if (stage !== stageRef.current) {
        const stageMessages: Record<PandemicStage, string> = {
          outbreak: `${prev.strainName} activity stabilizing but still present`,
          epidemic: `${prev.strainName} declared EPIDEMIC across strategic forces`,
          pandemic: `${prev.strainName} now PANDEMIC – readiness severely degraded`,
          collapse: `${prev.strainName} collapsing logistics and command nodes`
        };
        turnNews.push({
          category: 'crisis',
          text: stageMessages[stage],
          priority: stage === 'collapse' ? 'critical' : 'urgent'
        });
        stageRef.current = stage;
      }

      if (newGlobalInfection <= 5 && (newContainment > 70 || newVaccine >= 90)) {
        resolved = true;
        summary = `${prev.strainName} neutralized after claiming ${newCasualtyTally.toLocaleString()} lives.`;
        turnNews.push({
          category: 'science',
          text: summary,
          priority: 'important'
        });
      }

      const nextState: PandemicState = resolved
        ? {
            ...INITIAL_STATE,
            active: false,
            casualtyTally: newCasualtyTally,
            lastMutation: mutationDescriptor
          }
        : {
            ...prev,
            globalInfection: newGlobalInfection,
            mutationLevel,
            containmentEffort: newContainment,
            vaccineProgress: newVaccine,
            outbreaks,
            casualtyTally: newCasualtyTally,
            stage,
            lastMutation: mutationDescriptor ?? prev.lastMutation
          };

      if (resolved) {
        stageRef.current = 'outbreak';
      }

      return nextState;
    });

    if (turnNews.length > 0) {
      turnNews.forEach(item => addNewsItem(item.category, item.text, item.priority));
    }

    return {
      populationLoss,
      productionPenalty,
      instabilityIncrease,
      actionsPenalty,
      resolved,
      summary
    };
  }, [addNewsItem, pandemicState.active]);

  const derived = useMemo(() => pandemicState, [pandemicState]);

  return {
    pandemicState: derived,
    triggerPandemic,
    applyCountermeasure,
    advancePandemicTurn
  };
}
