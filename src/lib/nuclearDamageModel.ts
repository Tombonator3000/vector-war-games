import type { Nation } from '@/types/game';

export type NuclearDamageStage = 'shockwave' | 'thermal' | 'radiation';

export interface NuclearStageReport {
  stage: NuclearDamageStage;
  casualties: number;
  cityLosses: number;
  productionLoss: number;
  instabilityIncrease: number;
  missileLosses: number;
  bomberLosses: number;
  submarineLosses: number;
  uraniumLoss: number;
  defenseLoss: number;
  refugees: number;
  summary: string;
}

export interface NuclearImpactResult {
  totalCasualties: number;
  totalRefugees: number;
  totalCityLosses: number;
  productionLoss: number;
  instabilityIncrease: number;
  missileLosses: number;
  bomberLosses: number;
  submarineLosses: number;
  uraniumLoss: number;
  defenseLoss: number;
  winterDelta: number;
  radiationDelta: number;
  humanitarianSummary: string;
  environmentalSummary: string;
  overlayMessage: string;
  severity: number;
  stageReports: NuclearStageReport[];
}

export interface NuclearImpactInput {
  yieldMT: number;
  defense: number;
  population: number;
  cities?: number;
  production: number;
  missiles: number;
  bombers?: number;
  submarines?: number;
  uranium: number;
  nationName?: string;
}

function formatMillions(value: number): string {
  if (value <= 0) return '0';
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return value.toFixed(1).replace(/\.0$/, '');
  if (value >= 1) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function calculateNuclearImpact(input: NuclearImpactInput): NuclearImpactResult {
  const yieldMT = Math.max(0, input.yieldMT);
  const mitigation = Math.max(0.15, 1 - Math.max(0, input.defense) * 0.05);
  const intensityBase = Math.log10(yieldMT + 1) * mitigation;
  const severity = Math.max(0, intensityBase * 1.4);

  const stageBlueprints = [
    {
      stage: 'shockwave' as const,
      multiplier: 1.25,
      casualtyScale: 7,
      cityScale: 0.45,
      productionScale: 6,
      instabilityScale: 5,
      missileScale: 0.35,
      bomberScale: 0.25,
      submarineScale: 0.2,
      uraniumScale: 0.12,
      defenseScale: 1.8,
      refugeeFactor: 0.15,
      narrative: 'Shockwave shatters urban cores and critical infrastructure.',
    },
    {
      stage: 'thermal' as const,
      multiplier: 1.0,
      casualtyScale: 6,
      cityScale: 0.35,
      productionScale: 5,
      instabilityScale: 4,
      missileScale: 0.25,
      bomberScale: 0.25,
      submarineScale: 0.15,
      uraniumScale: 0.1,
      defenseScale: 1.4,
      refugeeFactor: 0.25,
      narrative: 'Thermal pulse ignites planet-wide firestorms.',
    },
    {
      stage: 'radiation' as const,
      multiplier: 0.75,
      casualtyScale: 4,
      cityScale: 0.25,
      productionScale: 4,
      instabilityScale: 6,
      missileScale: 0.2,
      bomberScale: 0.2,
      submarineScale: 0.12,
      uraniumScale: 0.18,
      defenseScale: 1.6,
      refugeeFactor: 0.35,
      narrative: 'Radiation renders wide swaths uninhabitable.',
    },
  ];

  let remainingPopulation = Math.max(0, input.population);
  let remainingCities = Math.max(0, input.cities ?? 0);
  let missiles = Math.max(0, input.missiles);
  let bombers = Math.max(0, input.bombers ?? 0);
  let submarines = Math.max(0, input.submarines ?? 0);

  let totalCasualties = 0;
  let totalRefugees = 0;
  let totalCityLosses = 0;
  let productionLoss = 0;
  let instabilityIncrease = 0;
  let missileLosses = 0;
  let bomberLosses = 0;
  let submarineLosses = 0;
  let uraniumLoss = 0;
  let defenseLoss = 0;

  const stageReports: NuclearStageReport[] = [];

  stageBlueprints.forEach(stage => {
    if (intensityBase <= 0) {
      return;
    }

    const stageIntensity = intensityBase * stage.multiplier;
    const stageCasualties = Math.min(remainingPopulation, stageIntensity * stage.casualtyScale);
    remainingPopulation = Math.max(0, remainingPopulation - stageCasualties);
    totalCasualties += stageCasualties;

    const rawCityLoss = stageIntensity * stage.cityScale;
    const stageCityLosses = Math.min(remainingCities, Math.round(rawCityLoss));
    remainingCities = Math.max(0, remainingCities - stageCityLosses);
    totalCityLosses += stageCityLosses;

    const stageProductionLoss = Math.round(stageIntensity * stage.productionScale);
    productionLoss += stageProductionLoss;

    const stageInstability = Math.round(stageIntensity * stage.instabilityScale);
    instabilityIncrease += stageInstability;

    const missileScale = Math.max(1, missiles / 8);
    const bomberScale = Math.max(1, bombers / 6);
    const submarineScale = Math.max(1, submarines / 5);

    const stageMissileLosses = Math.min(missiles, Math.round(stageIntensity * stage.missileScale * missileScale));
    missiles = Math.max(0, missiles - stageMissileLosses);
    missileLosses += stageMissileLosses;

    const stageBomberLosses = Math.min(bombers, Math.round(stageIntensity * stage.bomberScale * bomberScale));
    bombers = Math.max(0, bombers - stageBomberLosses);
    bomberLosses += stageBomberLosses;

    const stageSubmarineLosses = Math.min(submarines, Math.round(stageIntensity * stage.submarineScale * submarineScale));
    submarines = Math.max(0, submarines - stageSubmarineLosses);
    submarineLosses += stageSubmarineLosses;

    const stageUraniumLoss = Math.round(stageIntensity * stage.uraniumScale);
    uraniumLoss += stageUraniumLoss;

    const stageDefenseLoss = Math.round(stageIntensity * stage.defenseScale);
    defenseLoss += stageDefenseLoss;

    const stageRefugees = Math.round(stageCasualties * stage.refugeeFactor);
    totalRefugees += stageRefugees;

    const stageSummaryParts: string[] = [];
    if (stageCasualties > 0) {
      stageSummaryParts.push(`${formatMillions(stageCasualties)}M dead`);
    }
    if (stageCityLosses > 0) {
      stageSummaryParts.push(`${stageCityLosses} cities erased`);
    }
    if (stageProductionLoss > 0) {
      stageSummaryParts.push(`production -${stageProductionLoss}`);
    }
    if (stageRefugees > 0) {
      stageSummaryParts.push(`${formatMillions(stageRefugees)}M fleeing`);
    }

    stageReports.push({
      stage: stage.stage,
      casualties: stageCasualties,
      cityLosses: stageCityLosses,
      productionLoss: stageProductionLoss,
      instabilityIncrease: stageInstability,
      missileLosses: stageMissileLosses,
      bomberLosses: stageBomberLosses,
      submarineLosses: stageSubmarineLosses,
      uraniumLoss: stageUraniumLoss,
      defenseLoss: stageDefenseLoss,
      refugees: stageRefugees,
      summary: stageSummaryParts.length > 0
        ? `${stage.narrative} ${stageSummaryParts.join(', ')}.`
        : stage.narrative,
    });
  });

  const winterDelta = severity * 0.8 + totalCityLosses * 0.1;
  const radiationDelta = severity * 0.6 + totalCityLosses * 0.05;

  const humanitarianSummary = totalCasualties > 0 || totalRefugees > 0
    ? `${formatMillions(totalCasualties)}M dead, ${formatMillions(totalRefugees)}M displaced.`
    : 'Minimal human casualties reported.';

  const environmentalSummary = winterDelta > 0 || radiationDelta > 0
    ? `Firestorms elevate nuclear winter by +${winterDelta.toFixed(1)}, radiation +${radiationDelta.toFixed(1)}.`
    : 'Environmental impact contained.';

  const overlayMessage = totalCasualties > 0
    ? `${input.nationName ?? 'Target'} engulfed in nuclear horror`
    : `${input.nationName ?? 'Target'} rocked by nuclear detonation`;

  return {
    totalCasualties,
    totalRefugees,
    totalCityLosses,
    productionLoss,
    instabilityIncrease,
    missileLosses,
    bomberLosses,
    submarineLosses,
    uraniumLoss,
    defenseLoss,
    winterDelta,
    radiationDelta,
    humanitarianSummary,
    environmentalSummary,
    overlayMessage,
    severity,
    stageReports,
  };
}

export function applyNuclearImpactToNation(nation: Nation, impact: NuclearImpactResult): void {
  nation.population = Math.max(0, nation.population - impact.totalCasualties);
  if (typeof nation.cities === 'number') {
    nation.cities = Math.max(0, nation.cities - impact.totalCityLosses);
  }
  nation.production = Math.max(0, nation.production - impact.productionLoss);
  nation.instability = Math.min(100, Math.max(0, (nation.instability ?? 0) + impact.instabilityIncrease));
  nation.defense = Math.max(0, nation.defense - impact.defenseLoss);
  nation.missiles = Math.max(0, nation.missiles - impact.missileLosses);
  if (typeof nation.bombers === 'number') {
    nation.bombers = Math.max(0, nation.bombers - impact.bomberLosses);
  }
  if (typeof nation.submarines === 'number') {
    nation.submarines = Math.max(0, nation.submarines - impact.submarineLosses);
  }
  nation.uranium = Math.max(0, nation.uranium - impact.uraniumLoss);
  const refugeeIndividuals = impact.totalRefugees * 1_000_000;
  nation.migrantsThisTurn = (nation.migrantsThisTurn || 0) + refugeeIndividuals;
  nation.migrantsTotal = (nation.migrantsTotal || 0) + refugeeIndividuals;
}
