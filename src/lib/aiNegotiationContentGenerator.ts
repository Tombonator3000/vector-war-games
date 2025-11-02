/**
 * AI Negotiation Content Generator
 *
 * Generates AI-initiated negotiation deals and diplomatic messages
 * based on the purpose and context of the negotiation.
 */

import type { Nation } from '@/types/game';
import type {
  AIInitiatedNegotiation,
  NegotiationPurpose,
  NegotiationUrgency,
  NegotiationState,
  NegotiableItem,
} from '@/types/negotiation';
import { createNegotiation, addItemToOffer, addItemToRequest } from './negotiationUtils';
import { getRelationship } from './relationshipUtils';
import { getTrust } from '@/types/trustAndFavors';
import type { TriggerResult } from './aiNegotiationTriggers';

// ============================================================================
// Message Templates
// ============================================================================

const MESSAGE_TEMPLATES: Record<NegotiationPurpose, string[]> = {
  'request-help': [
    'We face a dire threat and request your assistance in our defense.',
    'Our intelligence indicates a serious threat to our security. We need your help.',
    'A powerful enemy threatens our sovereignty. Will you stand with us?',
  ],
  'offer-alliance': [
    'We believe our nations share common interests. Let us formalize our cooperation.',
    'Together we are stronger. I propose an alliance between our peoples.',
    'Our shared values and mutual threats make us natural allies.',
  ],
  'reconciliation': [
    'Recent events have strained our relationship. Perhaps we can find common ground.',
    'Our past conflicts benefit neither of us. Let us work towards peace.',
    'I wish to repair the damage between our nations and move forward.',
  ],
  'demand-compensation': [
    'Your recent actions have caused significant harm to our nation. Compensation is required.',
    'We demand reparations for the damages you have inflicted upon us.',
    'You must make amends for your transgressions against our people.',
  ],
  'warning': [
    'Your recent behavior is unacceptable. Change course or face the consequences.',
    'This is a warning: continue your current actions and we will respond with force.',
    'Your provocations will not be tolerated much longer. Consider this your final warning.',
  ],
  'peace-offer': [
    'This war serves neither of us. Let us negotiate a peaceful resolution.',
    'Too much blood has been spilled. I offer you terms for peace.',
    'The time has come to end this conflict. Here are my peace terms.',
  ],
  'trade-opportunity': [
    'We have resources in surplus and thought you might be interested in trade.',
    'A mutually beneficial trade arrangement could serve both our interests.',
    'I have a proposal for economic cooperation that would benefit both our nations.',
  ],
  'mutual-defense': [
    'The world grows more dangerous. Let us pledge to defend each other.',
    'A mutual defense pact would ensure our security in these uncertain times.',
    'Together we can deter aggression. I propose a defensive alliance.',
  ],
  'joint-venture': [
    'I have identified an opportunity for our nations to cooperate.',
    'By pooling our resources, we can achieve what neither could alone.',
    'I propose a joint initiative that would benefit both our peoples.',
  ],
};

// ============================================================================
// Deal Generation Functions
// ============================================================================

/**
 * Generate help request deal (AI needs assistance against threat)
 */
function generateHelpRequest(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  // AI requests: Military alliance or join-war
  if (context.targetNation) {
    const joinWarItem: NegotiableItem = {
      type: 'join-war',
      targetId: context.targetNation,
      description: `Join war against ${allNations.find(n => n.id === context.targetNation)?.name}`,
    };
    addItemToRequest(negotiation, joinWarItem);
  } else {
    const allianceItem: NegotiableItem = {
      type: 'alliance',
      subtype: 'military',
      duration: 20,
      description: 'Military alliance (20 turns)',
    };
    addItemToRequest(negotiation, allianceItem);
  }

  // AI offers: Gold and/or intel as payment
  const goldAmount = Math.floor((aiNation.production || 0) * 0.3);
  if (goldAmount > 0) {
    addItemToOffer(negotiation, {
      type: 'gold',
      amount: goldAmount,
      description: `${goldAmount} production points`,
    });
  }

  const intelAmount = Math.floor((aiNation.intel || 0) * 0.2);
  if (intelAmount > 10) {
    addItemToOffer(negotiation, {
      type: 'intel',
      amount: intelAmount,
      description: `${intelAmount} intelligence points`,
    });
  }

  // Also offer favor
  addItemToOffer(negotiation, {
    type: 'favor-exchange',
    amount: 2,
    description: 'Owe you 2 favors',
  });

  return negotiation;
}

/**
 * Generate alliance offer deal
 */
function generateAllianceOffer(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  const relationship = getRelationship(aiNation, targetNation.id);

  // AI offers: Military alliance + open borders
  addItemToOffer(negotiation, {
    type: 'alliance',
    subtype: 'military',
    duration: 30,
    description: 'Military alliance (30 turns)',
  });

  addItemToOffer(negotiation, {
    type: 'open-borders',
    duration: 30,
    description: 'Open borders (30 turns)',
  });

  // AI requests: Same from target
  addItemToRequest(negotiation, {
    type: 'alliance',
    subtype: 'military',
    duration: 30,
    description: 'Military alliance (30 turns)',
  });

  addItemToRequest(negotiation, {
    type: 'open-borders',
    duration: 30,
    description: 'Open borders (30 turns)',
  });

  // If relationship is really good, also add non-aggression
  if (relationship > 40) {
    addItemToOffer(negotiation, {
      type: 'treaty',
      subtype: 'non-aggression',
      duration: 50,
      description: 'Non-aggression pact (50 turns)',
    });

    addItemToRequest(negotiation, {
      type: 'treaty',
      subtype: 'non-aggression',
      duration: 50,
      description: 'Non-aggression pact (50 turns)',
    });
  }

  return negotiation;
}

/**
 * Generate reconciliation offer deal
 */
function generateReconciliationOffer(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  // AI offers: Apology for grievances + some compensation
  const ourGrievances = (targetNation.grievances || []).filter(
    g => g.againstNationId === aiNation.id
  );

  if (ourGrievances.length > 0) {
    addItemToOffer(negotiation, {
      type: 'grievance-apology',
      grievanceId: ourGrievances[0].id,
      description: `Apology for: ${ourGrievances[0].description}`,
    });
  }

  // Offer some gold as goodwill
  const goldAmount = Math.floor((aiNation.production || 0) * 0.15);
  if (goldAmount > 0) {
    addItemToOffer(negotiation, {
      type: 'gold',
      amount: goldAmount,
      description: `${goldAmount} production as goodwill`,
    });
  }

  // Request: They apologize too if they have grievances
  const theirGrievances = (aiNation.grievances || []).filter(
    g => g.againstNationId === targetNation.id
  );

  if (theirGrievances.length > 0) {
    addItemToRequest(negotiation, {
      type: 'grievance-apology',
      grievanceId: theirGrievances[0].id,
      description: `Apology for: ${theirGrievances[0].description}`,
    });
  }

  // Request non-aggression pact
  addItemToRequest(negotiation, {
    type: 'treaty',
    subtype: 'non-aggression',
    duration: 20,
    description: 'Non-aggression pact (20 turns)',
  });

  return negotiation;
}

/**
 * Generate compensation demand deal
 */
function generateCompensationDemand(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  // AI demands: Compensation based on grievance severity
  const severity = context.totalSeverity || 3;
  const compensationAmount = severity * 30;

  addItemToRequest(negotiation, {
    type: 'gold',
    amount: compensationAmount,
    description: `${compensationAmount} production as reparations`,
  });

  // Also demand apology
  if (context.grievanceId) {
    addItemToRequest(negotiation, {
      type: 'grievance-apology',
      grievanceId: context.grievanceId,
      description: 'Formal apology',
    });
  }

  // AI offers: Will drop grievances and restore relationship
  addItemToOffer(negotiation, {
    type: 'promise',
    subtype: 'drop-grievances',
    description: 'Drop all grievances against you',
  });

  // Offer non-aggression if they comply
  addItemToOffer(negotiation, {
    type: 'treaty',
    subtype: 'non-aggression',
    duration: 15,
    description: 'Non-aggression pact (15 turns)',
  });

  return negotiation;
}

/**
 * Generate warning (ultimatum) deal
 */
function generateWarning(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  // AI demands: Stop aggressive behavior
  addItemToRequest(negotiation, {
    type: 'promise',
    subtype: 'cease-aggression',
    duration: 20,
    description: 'Promise to cease aggressive actions (20 turns)',
  });

  // Demand some compensation
  const compensationAmount = 50;
  addItemToRequest(negotiation, {
    type: 'gold',
    amount: compensationAmount,
    description: `${compensationAmount} production as compensation`,
  });

  // AI offers: Will not retaliate if demands met
  addItemToOffer(negotiation, {
    type: 'promise',
    subtype: 'no-retaliation',
    duration: 10,
    description: 'Promise not to retaliate (10 turns)',
  });

  return negotiation;
}

/**
 * Generate trade offer deal
 */
function generateTradeOffer(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  const resourceType = context.resourceType || 'gold';

  // AI offers: Surplus resource
  if (resourceType === 'gold') {
    addItemToOffer(negotiation, {
      type: 'gold',
      amount: 80,
      description: '80 production points',
    });
  } else if (resourceType === 'intel') {
    addItemToOffer(negotiation, {
      type: 'intel',
      amount: 40,
      description: '40 intelligence points',
    });
  } else if (resourceType === 'uranium') {
    addItemToOffer(negotiation, {
      type: 'production',
      amount: 50,
      description: '50 uranium',
    });
  }

  // AI requests: Resources they need
  const targetResources = [];
  if ((targetNation.production || 0) > 100) targetResources.push('gold');
  if ((targetNation.intel || 0) > 50) targetResources.push('intel');

  if (targetResources.length > 0) {
    const requestType = targetResources[0];
    if (requestType === 'gold') {
      addItemToRequest(negotiation, {
        type: 'gold',
        amount: 60,
        description: '60 production points',
      });
    } else {
      addItemToRequest(negotiation, {
        type: 'intel',
        amount: 30,
        description: '30 intelligence points',
      });
    }
  } else {
    // Request favor instead
    addItemToRequest(negotiation, {
      type: 'favor-exchange',
      amount: 1,
      description: 'Owe me 1 favor',
    });
  }

  return negotiation;
}

// ============================================================================
// Master Generation Function
// ============================================================================

/**
 * Generate complete AI-initiated negotiation based on trigger result
 */
export function generateAINegotiationDeal(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  triggerResult: TriggerResult,
  currentTurn: number
): AIInitiatedNegotiation {
  let proposedDeal: NegotiationState;

  // Generate deal based on purpose
  switch (triggerResult.purpose) {
    case 'request-help':
      proposedDeal = generateHelpRequest(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'offer-alliance':
      proposedDeal = generateAllianceOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'reconciliation':
      proposedDeal = generateReconciliationOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'demand-compensation':
      proposedDeal = generateCompensationDemand(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'warning':
      proposedDeal = generateWarning(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'trade-opportunity':
      proposedDeal = generateTradeOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'mutual-defense':
      proposedDeal = generateAllianceOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'peace-offer':
      proposedDeal = generateReconciliationOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'joint-venture':
      proposedDeal = generateTradeOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    default:
      proposedDeal = createNegotiation(aiNation.id, targetNation.id, currentTurn);
  }

  // Add purpose to negotiation
  proposedDeal.purpose = triggerResult.purpose;

  // Select message template
  const templates = MESSAGE_TEMPLATES[triggerResult.purpose] || ['I wish to negotiate with you.'];
  const message = templates[Math.floor(Math.random() * templates.length)];

  // Calculate expiration
  const expirationTurns = triggerResult.urgency === 'critical' ? 2 :
                          triggerResult.urgency === 'high' ? 3 :
                          triggerResult.urgency === 'medium' ? 5 : 10;

  const result: AIInitiatedNegotiation = {
    aiNationId: aiNation.id,
    targetNationId: targetNation.id,
    purpose: triggerResult.purpose,
    proposedDeal,
    message: `${message}\n\n${triggerResult.context.reason}`,
    urgency: triggerResult.urgency,
    expiresAtTurn: currentTurn + expirationTurns,
    createdTurn: currentTurn,
  };

  return result;
}

/**
 * Get diplomatic message based on personality and context
 */
export function getPersonalizedMessage(
  aiNation: Nation,
  targetNation: Nation,
  purpose: NegotiationPurpose,
  context: string
): string {
  const personality = aiNation.ai || 'balanced';
  const relationship = getRelationship(aiNation, targetNation.id);

  let tone = '';

  // Adjust tone based on personality
  if (personality === 'aggressive') {
    tone = relationship > 0 ? 'firm but respectful' : 'assertive and demanding';
  } else if (personality === 'defensive') {
    tone = 'cautious and diplomatic';
  } else if (personality === 'trickster') {
    tone = 'cunning and persuasive';
  } else {
    tone = 'balanced and pragmatic';
  }

  // Get base template
  const templates = MESSAGE_TEMPLATES[purpose] || ['I wish to negotiate.'];
  const baseMessage = templates[Math.floor(Math.random() * templates.length)];

  return `${baseMessage}\n\n${context}`;
}
