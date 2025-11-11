/**
 * Military Templates (Division Designer) System Types
 *
 * Hearts of Iron IV-inspired military unit customization system.
 * Players design custom unit templates with different compositions and capabilities.
 */

// Unit types that can be added to templates
export type UnitComponent =
  | 'infantry_battalion'
  | 'mechanized_battalion'
  | 'armor_battalion'
  | 'artillery_battalion'
  | 'anti_air_battalion'
  | 'anti_tank_battalion'
  | 'reconnaissance_company'
  | 'engineer_company'
  | 'signal_company'
  | 'logistics_company'
  | 'military_police_company';

export type TemplateSize = 'battalion' | 'regiment' | 'brigade' | 'division' | 'corps';

export type ArmyGroupPosture = 'offensive' | 'defensive' | 'reserve' | 'support';

export type ArmyGroupPriority = 'critical' | 'high' | 'standard' | 'low';

export type FrontlineStatus = 'stable' | 'pressured' | 'breakthrough' | 'stalled';

export type FrontlineSupplyState = 'secure' | 'strained' | 'critical';

export interface ArmyGroup {
  id: string;
  nationId: string;
  name: string;
  theater: string;
  posture: ArmyGroupPosture;
  priority: ArmyGroupPriority;
  readiness: number;
  supplyLevel: number;
  frontlineIds: string[];
  commander?: string;
  headquarters?: string;
  notes?: string;
}

export interface Frontline {
  id: string;
  nationId: string;
  armyGroupId: string | null;
  name: string;
  theater: string;
  axis: string;
  objective?: string;
  status: FrontlineStatus;
  supplyState: FrontlineSupplyState;
  readiness: number;
  contested: boolean;
  lastUpdatedTurn?: number;
}

export interface UnitComponentData {
  type: UnitComponent;
  name: string;
  description: string;
  icon: string;

  // Costs
  manpower: number;
  production: number;

  // Combat stats
  softAttack: number; // vs infantry
  hardAttack: number; // vs armor
  airAttack: number; // vs air
  defense: number;
  breakthrough: number; // offensive capability
  armor: number;
  piercing: number; // ability to damage armor

  // Support stats
  organization: number; // combat endurance
  recovery: number; // reorganization speed
  reconnaissance: number;
  suppression: number; // occupation/resistance control

  // Logistics
  supplyUse: number; // supply consumption per turn
  speed: number; // movement speed
  reliability: number; // equipment condition

  // Size
  combatWidth: number; // How much space it takes (max 25 per template)

  // Requirements
  requiresTech?: string[];
  requiresFocus?: string[];
  minTurn?: number;
}

export interface MilitaryTemplate {
  id: string;
  nationId: string;
  name: string;
  description: string;
  icon: string;
  size: TemplateSize;

  // Components
  mainComponents: UnitComponent[]; // Combat battalions (max 10)
  supportComponents: UnitComponent[]; // Support companies (max 5)

  // Calculated stats (sum of all components)
  stats: {
    totalManpower: number;
    totalProduction: number;

    // Combat
    softAttack: number;
    hardAttack: number;
    airAttack: number;
    defense: number;
    breakthrough: number;
    armor: number;
    piercing: number;

    // Support
    organization: number;
    recovery: number;
    reconnaissance: number;
    suppression: number;

    // Logistics
    supplyUse: number;
    speed: number;
    reliability: number;
    combatWidth: number;
  };

  // Metadata
  createdTurn: number;
  isActive: boolean; // Can be used for production
  isDefault: boolean; // Pre-defined template
  unitsDeployed: number; // How many units use this template
}

export interface DeployedUnit {
  id: string;
  nationId: string;
  templateId: string;
  name: string;

  // Location
  territoryId: string | null;
  armyGroupId?: string | null;
  frontlineId?: string | null;

  // Status
  health: number; // 0-100%
  organization: number; // 0-100%, combat readiness
  experience: number; // 0-100%, improves combat performance

  // Supply
  supplyLevel: number; // 0-100%, affects combat effectiveness
  isSupplied: boolean;

  // Combat
  isInCombat: boolean;
  lastCombatTurn?: number;

  // Metadata
  deployedTurn: number;
  veterancy: 'green' | 'regular' | 'veteran' | 'elite';
}

export interface ArmyGroupSummary {
  group: ArmyGroup;
  frontlines: Frontline[];
  units: DeployedUnit[];
  readiness: number;
  supplyLevel: number;
}

export interface TemplateDesignerState {
  nationId: string;
  templates: MilitaryTemplate[];
  deployedUnits: DeployedUnit[];
  armyGroups: ArmyGroup[];
  frontlines: Frontline[];

  // Designer state
  isDesignerOpen: boolean;
  editingTemplateId: string | null;
}

// Combat effectiveness modifiers based on supply, organization, and experience
export interface CombatModifiers {
  supplyModifier: number; // 0.5-1.0
  organizationModifier: number; // 0.5-1.0
  experienceModifier: number; // 1.0-1.5
  veterancyBonus: number; // 0-0.3
  professionalismModifier: number; // Quality emphasis multiplier
  traditionModifier: number; // Quantity emphasis multiplier
  doctrineBalanceModifier: number; // Penalty or bonus for extreme focus
  totalEffectiveness: number; // Combined modifier
}

// Template validation
export interface TemplateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  combatWidthStatus: 'under' | 'optimal' | 'over'; // 25 is optimal
  balanceRating: 'offensive' | 'defensive' | 'balanced' | 'support';
}
