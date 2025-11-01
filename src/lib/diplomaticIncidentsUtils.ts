/**
 * Diplomatic Incidents Utilities
 *
 * Handles dynamic diplomatic incidents and crises that can occur between nations.
 * Incidents can escalate to war if not properly managed.
 */

import type { Nation } from '@/types/game';
import type {
  DiplomaticIncident,
  IncidentType,
  IncidentResolution,
  IncidentProbability,
} from '@/types/diplomacyPhase3';
import { generateId } from './idGenerator';
import { getTrust } from '@/types/trustAndFavors';
import { getActiveGrievances } from '@/lib/grievancesAndClaimsUtils';

/**
 * Incident templates with descriptions and impacts
 */
const INCIDENT_TEMPLATES: Record<
  IncidentType,
  {
    titleTemplate: string;
    descriptionTemplate: string;
    baseRelationshipImpact: number;
    baseTrustImpact: number;
    baseSeverity: DiplomaticIncident['severity'];
  }
> = {
  'border-skirmish': {
    titleTemplate: 'Border Skirmish',
    descriptionTemplate:
      'Military forces clashed along the border, resulting in casualties on both sides.',
    baseRelationshipImpact: -15,
    baseTrustImpact: -10,
    baseSeverity: 'moderate',
  },
  'spy-caught': {
    titleTemplate: 'Espionage Exposed',
    descriptionTemplate:
      'Intelligence operatives were caught conducting espionage operations.',
    baseRelationshipImpact: -20,
    baseTrustImpact: -15,
    baseSeverity: 'serious',
  },
  'diplomatic-insult': {
    titleTemplate: 'Diplomatic Insult',
    descriptionTemplate:
      'Public statements insulted national honor and leadership.',
    baseRelationshipImpact: -10,
    baseTrustImpact: -5,
    baseSeverity: 'minor',
  },
  'trade-dispute': {
    titleTemplate: 'Trade Dispute',
    descriptionTemplate:
      'Disagreement over trade terms and tariffs has escalated into a serious dispute.',
    baseRelationshipImpact: -12,
    baseTrustImpact: -8,
    baseSeverity: 'moderate',
  },
  'refugee-crisis': {
    titleTemplate: 'Refugee Crisis',
    descriptionTemplate:
      'Mass migration across borders has created humanitarian and political tensions.',
    baseRelationshipImpact: -18,
    baseTrustImpact: -10,
    baseSeverity: 'serious',
  },
  'territory-dispute': {
    titleTemplate: 'Territorial Dispute',
    descriptionTemplate:
      'Competing claims over territory have led to heightened tensions.',
    baseRelationshipImpact: -25,
    baseTrustImpact: -15,
    baseSeverity: 'serious',
  },
  'assassination-attempt': {
    titleTemplate: 'Assassination Attempt',
    descriptionTemplate:
      'An attempt on the life of a high-ranking official has been traced back to foreign operatives.',
    baseRelationshipImpact: -40,
    baseTrustImpact: -30,
    baseSeverity: 'catastrophic',
  },
  'cyberattack': {
    titleTemplate: 'Cyberattack',
    descriptionTemplate:
      'Critical infrastructure was targeted in a sophisticated cyberattack.',
    baseRelationshipImpact: -22,
    baseTrustImpact: -18,
    baseSeverity: 'serious',
  },
  'environmental-damage': {
    titleTemplate: 'Environmental Incident',
    descriptionTemplate:
      'Pollution or environmental disaster has crossed borders, causing damage to neighboring territories.',
    baseRelationshipImpact: -15,
    baseTrustImpact: -10,
    baseSeverity: 'moderate',
  },
  'cultural-offense': {
    titleTemplate: 'Cultural Offense',
    descriptionTemplate:
      'Actions or policies have deeply offended cultural or religious sensibilities.',
    baseRelationshipImpact: -18,
    baseTrustImpact: -12,
    baseSeverity: 'moderate',
  },
  'arms-buildup': {
    titleTemplate: 'Threatening Arms Buildup',
    descriptionTemplate:
      'Massive military buildup near borders is seen as a direct threat.',
    baseRelationshipImpact: -20,
    baseTrustImpact: -15,
    baseSeverity: 'serious',
  },
  'false-flag': {
    titleTemplate: 'Suspected False Flag',
    descriptionTemplate:
      'Evidence suggests an attack was staged to frame another nation.',
    baseRelationshipImpact: -35,
    baseTrustImpact: -25,
    baseSeverity: 'severe',
  },
  'hostage-crisis': {
    titleTemplate: 'Hostage Crisis',
    descriptionTemplate:
      'Citizens are being held hostage, and negotiations have broken down.',
    baseRelationshipImpact: -30,
    baseTrustImpact: -20,
    baseSeverity: 'severe',
  },
  'maritime-incident': {
    titleTemplate: 'Maritime Incident',
    descriptionTemplate:
      'Naval vessels clashed in disputed waters, resulting in damage and casualties.',
    baseRelationshipImpact: -18,
    baseTrustImpact: -12,
    baseSeverity: 'serious',
  },
  'airspace-violation': {
    titleTemplate: 'Airspace Violation',
    descriptionTemplate:
      'Military aircraft violated sovereign airspace, prompting defensive responses.',
    baseRelationshipImpact: -15,
    baseTrustImpact: -10,
    baseSeverity: 'moderate',
  },
};

/**
 * Create a diplomatic incident
 */
export function createIncident(
  type: IncidentType,
  primaryNation: Nation,
  targetNation: Nation,
  currentTurn: number,
  involvedNations: string[] = [],
  customDescription?: string
): DiplomaticIncident {
  const template = INCIDENT_TEMPLATES[type];

  const incident: DiplomaticIncident = {
    id: generateId(),
    type,
    title: template.titleTemplate,
    description: customDescription || template.descriptionTemplate,
    primaryNationId: primaryNation.id,
    targetNationId: targetNation.id,
    involvedNations,
    occurredTurn: currentTurn,
    severity: template.baseSeverity,
    relationshipImpact: template.baseRelationshipImpact,
    trustImpact: template.baseTrustImpact,
    resolvable: true,
    resolutionOptions: generateResolutionOptions(type, template.baseSeverity),
    status: 'active',
    escalationLevel: 20, // Start with some tension
    escalationRate: 5, // Increases by 5 per turn if not addressed
    deadlineTurn: currentTurn + 10, // 10 turns to resolve
    consequences: generateConsequences(type, template.baseSeverity),
  };

  return incident;
}

/**
 * Generate resolution options for an incident
 */
function generateResolutionOptions(
  type: IncidentType,
  severity: DiplomaticIncident['severity']
): IncidentResolution[] {
  const options: IncidentResolution[] = [];

  // Apologize option (always available for minor/moderate incidents)
  if (severity === 'minor' || severity === 'moderate') {
    options.push({
      id: generateId(),
      type: 'apologize',
      name: 'Issue Formal Apology',
      description: 'Publicly apologize and take responsibility for the incident.',
      relationshipChange: 10,
      trustChange: 5,
      escalationChange: -30,
      acceptanceChance: 70,
    });
  }

  // Compensate option
  options.push({
    id: generateId(),
    type: 'compensate',
    name: 'Offer Compensation',
    description: 'Provide economic compensation for damages.',
    economicCost: severity === 'catastrophic' ? 50 : severity === 'severe' ? 30 : 20,
    relationshipChange: 15,
    trustChange: 8,
    escalationChange: -40,
    acceptanceChance: 80,
  });

  // Negotiate option
  options.push({
    id: generateId(),
    type: 'negotiate',
    name: 'Diplomatic Negotiation',
    description: 'Engage in diplomatic talks to find a mutually acceptable solution.',
    dipCost: 20,
    relationshipChange: 12,
    trustChange: 10,
    escalationChange: -50,
    acceptanceChance: 75,
  });

  // Concede option (for serious incidents)
  if (severity === 'serious' || severity === 'severe' || severity === 'catastrophic') {
    options.push({
      id: generateId(),
      type: 'concede',
      name: 'Make Concessions',
      description: 'Agree to major concessions to resolve the crisis.',
      dipCost: 30,
      economicCost: 25,
      relationshipChange: 20,
      trustChange: 15,
      escalationChange: -70,
      acceptanceChance: 90,
      requiresCouncilApproval: severity === 'catastrophic',
    });
  }

  // Mediation option
  options.push({
    id: generateId(),
    type: 'mediation',
    name: 'Request Third-Party Mediation',
    description: 'Invite neutral party to mediate the dispute.',
    dipCost: 25,
    relationshipChange: 8,
    trustChange: 12,
    escalationChange: -60,
    acceptanceChance: 85,
    requiresCouncilApproval: false,
  });

  // Threaten option (risky)
  options.push({
    id: generateId(),
    type: 'threaten',
    name: 'Issue Counter-Threat',
    description: 'Respond with threats and show of force. High risk of escalation.',
    relationshipChange: -10,
    trustChange: -15,
    escalationChange: 20, // Increases escalation!
    acceptanceChance: 30,
  });

  // Ignore option (also risky)
  options.push({
    id: generateId(),
    type: 'ignore',
    name: 'Ignore and Wait',
    description: 'Take no action and hope the situation improves. May escalate.',
    relationshipChange: -5,
    trustChange: -8,
    escalationChange: 10,
    acceptanceChance: 50,
  });

  return options;
}

/**
 * Generate consequences if incident is unresolved
 */
function generateConsequences(
  type: IncidentType,
  severity: DiplomaticIncident['severity']
): string[] {
  const consequences: string[] = [];

  if (severity === 'catastrophic' || severity === 'severe') {
    consequences.push('High likelihood of war declaration');
    consequences.push('Severe relationship breakdown');
    consequences.push('Formation of hostile alliances');
  }

  if (severity === 'serious') {
    consequences.push('Possible military escalation');
    consequences.push('Major diplomatic fallout');
    consequences.push('International condemnation');
  }

  if (severity === 'moderate') {
    consequences.push('Strained diplomatic relations');
    consequences.push('Economic sanctions possible');
  }

  consequences.push('Trust permanently damaged');

  return consequences;
}

/**
 * Calculate probability of incident occurring
 */
export function calculateIncidentProbability(
  nation1: Nation,
  nation2: Nation,
  areNeighbors: boolean = false
): number {
  let probability = 5; // Base 5%

  // Check relationship
  const relationship = nation1.relationships?.[nation2.id] ?? 0;
  if (relationship < -30) {
    probability *= 2.0; // Low relationship doubles chance
  }

  // Check for active grievances
  const grievances = getActiveGrievances(nation1, nation2.id);
  if (grievances.length > 0) {
    probability *= 1.3;
  }

  // Check trust
  const trust = getTrust(nation1, nation2.id);
  if (trust < 30) {
    probability *= 1.4;
  }

  // Border adjacency
  if (areNeighbors) {
    probability *= 1.5;
  }

  return Math.min(100, probability);
}

/**
 * Escalate an incident
 */
export function escalateIncident(
  incident: DiplomaticIncident,
  currentTurn: number
): DiplomaticIncident {
  const newEscalationLevel = Math.min(100, incident.escalationLevel + incident.escalationRate);

  let newStatus = incident.status;
  if (newEscalationLevel >= 80) {
    newStatus = 'escalating';
  }

  if (newEscalationLevel >= 100) {
    newStatus = 'led-to-war';
  }

  return {
    ...incident,
    escalationLevel: newEscalationLevel,
    status: newStatus,
  };
}

/**
 * De-escalate an incident
 */
export function deEscalateIncident(
  incident: DiplomaticIncident,
  amount: number
): DiplomaticIncident {
  const newEscalationLevel = Math.max(0, incident.escalationLevel - amount);

  let newStatus = incident.status;
  if (newEscalationLevel < 20 && incident.status !== 'resolved') {
    newStatus = 'de-escalating';
  }

  return {
    ...incident,
    escalationLevel: newEscalationLevel,
    status: newStatus,
  };
}

/**
 * Resolve an incident with a chosen resolution option
 */
export function resolveIncident(
  incident: DiplomaticIncident,
  resolutionOption: IncidentResolution,
  currentTurn: number
): { incident: DiplomaticIncident; accepted: boolean } {
  // Calculate if the resolution is accepted
  const accepted = Math.random() * 100 < resolutionOption.acceptanceChance;

  if (accepted) {
    return {
      incident: {
        ...incident,
        status: 'resolved',
        escalationLevel: Math.max(
          0,
          incident.escalationLevel + resolutionOption.escalationChange
        ),
      },
      accepted: true,
    };
  } else {
    // Resolution rejected, escalation increases
    return {
      incident: {
        ...incident,
        escalationLevel: Math.min(100, incident.escalationLevel + 15),
        status: incident.escalationLevel + 15 >= 80 ? 'escalating' : incident.status,
      },
      accepted: false,
    };
  }
}

/**
 * Check if incident has reached deadline
 */
export function isIncidentExpired(
  incident: DiplomaticIncident,
  currentTurn: number
): boolean {
  if (!incident.deadlineTurn) return false;
  return currentTurn >= incident.deadlineTurn;
}

/**
 * Process incident deadline (auto-escalate if not resolved)
 */
export function processIncidentDeadline(
  incident: DiplomaticIncident,
  currentTurn: number
): DiplomaticIncident {
  if (isIncidentExpired(incident, currentTurn) && incident.status === 'active') {
    // Force escalation to maximum
    return {
      ...incident,
      escalationLevel: 100,
      status: 'led-to-war',
    };
  }

  return incident;
}

/**
 * Get incident severity color for UI
 */
export function getIncidentSeverityColor(severity: DiplomaticIncident['severity']): string {
  switch (severity) {
    case 'minor':
      return 'text-yellow-400';
    case 'moderate':
      return 'text-orange-400';
    case 'serious':
      return 'text-orange-600';
    case 'severe':
      return 'text-red-500';
    case 'catastrophic':
      return 'text-red-700';
  }
}

/**
 * Get escalation level color for UI
 */
export function getEscalationColor(escalationLevel: number): string {
  if (escalationLevel >= 80) return 'text-red-700';
  if (escalationLevel >= 60) return 'text-red-500';
  if (escalationLevel >= 40) return 'text-orange-500';
  if (escalationLevel >= 20) return 'text-yellow-500';
  return 'text-green-500';
}

/**
 * Get incident status description
 */
export function getIncidentStatusDescription(status: DiplomaticIncident['status']): string {
  switch (status) {
    case 'active':
      return 'Active - Requires attention';
    case 'escalating':
      return 'Escalating - War imminent!';
    case 'de-escalating':
      return 'De-escalating - Improving';
    case 'resolved':
      return 'Resolved - Crisis averted';
    case 'led-to-war':
      return 'Led to War - Diplomacy failed';
  }
}

/**
 * Get all active incidents involving a nation
 */
export function getIncidentsForNation(
  incidents: DiplomaticIncident[],
  nationId: string
): DiplomaticIncident[] {
  return incidents.filter(
    (incident) =>
      incident.primaryNationId === nationId ||
      incident.targetNationId === nationId ||
      incident.involvedNations.includes(nationId)
  );
}

/**
 * Get incidents between two specific nations
 */
export function getIncidentsBetweenNations(
  incidents: DiplomaticIncident[],
  nation1Id: string,
  nation2Id: string
): DiplomaticIncident[] {
  return incidents.filter(
    (incident) =>
      (incident.primaryNationId === nation1Id && incident.targetNationId === nation2Id) ||
      (incident.primaryNationId === nation2Id && incident.targetNationId === nation1Id)
  );
}

/**
 * Update all incidents for turn processing
 */
export function processIncidents(
  incidents: DiplomaticIncident[],
  currentTurn: number
): DiplomaticIncident[] {
  return incidents.map((incident) => {
    if (incident.status === 'active') {
      let updated = escalateIncident(incident, currentTurn);
      updated = processIncidentDeadline(updated, currentTurn);
      return updated;
    }
    return incident;
  });
}
