/**
 * Dialogue Template System
 *
 * Contains dialogue templates for all advisor roles and game events.
 * Templates use ${variable} syntax for dynamic content injection.
 *
 * Based on specifications from agents.md
 */

import { DialogueTemplate, GameEventType } from '@/types/advisor.types';

/**
 * Dialogue templates organized by event type and advisor role
 */
export const DIALOGUE_TEMPLATES: DialogueTemplate[] = [
  // ========================================
  // DEFCON CHANGES
  // ========================================
  {
    eventType: 'defcon_change',
    advisorRole: 'military',
    priority: 'urgent',
    templates: [
      "DEFCON ${level} confirmed, Mr. President. Recommend immediate alert posture.",
      "We've moved to DEFCON ${level}. All forces on alert. Ready to strike on your command.",
      "DEFCON ${level}. Our response time is now ${seconds} seconds.",
      "Escalation to DEFCON ${level} complete. God help us all.",
    ],
  },
  {
    eventType: 'defcon_change',
    advisorRole: 'science',
    priority: 'urgent',
    templates: [
      "DEFCON ${level}... the probability of nuclear exchange just jumped to ${percent}%.",
      "We're at DEFCON ${level}. At this rate, we'll trigger nuclear winter by month's end.",
      "DEFCON ${level}. Mr. President, the environmental consequences of this escalation are catastrophic.",
    ],
  },
  {
    eventType: 'defcon_change',
    advisorRole: 'diplomatic',
    priority: 'urgent',
    templates: [
      "DEFCON ${level} sends a dangerous message. We should pursue de-escalation immediately.",
      "Mr. President, going to DEFCON ${level} closes diplomatic doors. Reconsider.",
      "DEFCON ${level}. Every allied embassy is calling. They're terrified we'll start a war.",
    ],
  },

  // ========================================
  // RESEARCH COMPLETION
  // ========================================
  {
    eventType: 'research_complete',
    advisorRole: 'science',
    priority: 'important',
    templates: [
      "Research complete: ${techName}. I pray we never use it.",
      "${techName} research finished. The implications are... profound.",
      "We've unlocked ${techName}. Science has given us power beyond imagination.",
    ],
  },
  {
    eventType: 'research_complete',
    advisorRole: 'military',
    priority: 'important',
    templates: [
      "${techName} is operational. This changes the battlefield calculus entirely.",
      "Excellent. ${techName} gives us a significant tactical advantage.",
      "With ${techName}, we can finally achieve military superiority.",
    ],
  },

  // ========================================
  // NUCLEAR LAUNCH
  // ========================================
  {
    eventType: 'nuclear_launch',
    advisorRole: 'military',
    priority: 'critical',
    templates: [
      "Nuclear launch detected! Recommend immediate retaliation!",
      "INCOMING ICBM! Impact in ${minutes} minutes! Orders, sir?",
      "Multiple warheads detected. This is it, Mr. President.",
    ],
  },
  {
    eventType: 'nuclear_launch',
    advisorRole: 'science',
    priority: 'critical',
    templates: [
      "Nuclear detonation confirmed. The fallout will spread for thousands of miles.",
      "Oh god... the radiation models show ${casualties} dead within hours.",
      "This is the end of civilization as we know it. Nuclear winter is inevitable now.",
    ],
  },
  {
    eventType: 'nuclear_launch',
    advisorRole: 'diplomatic',
    priority: 'critical',
    templates: [
      "A nuclear strike is a war crime! We must exhaust all diplomatic options!",
      "Mr. President, once we launch, there's no going back. Think of the consequences!",
    ],
  },
  {
    eventType: 'nuclear_launch',
    advisorRole: 'pr',
    priority: 'critical',
    templates: [
      "Sir, the world is watching. How we respond defines humanity's future.",
      "This will be broadcast globally. Every word, every decision... history is watching.",
    ],
  },

  // ========================================
  // RESOURCE WARNINGS
  // ========================================
  {
    eventType: 'resource_low',
    advisorRole: 'economic',
    priority: 'urgent',
    templates: [
      "Mr. President, we're burning through ${resourceName} reserves at an unsustainable rate.",
      "${resourceName} supplies are critically low. We need trade agreements, not more missiles.",
      "Economic alert: ${resourceName} shortage imminent. Production will grind to a halt.",
    ],
  },
  {
    eventType: 'resource_critical',
    advisorRole: 'economic',
    priority: 'urgent',
    templates: [
      "CRITICAL: ${resourceName} reserves depleted! We have ${days} days until complete shortage!",
      "The economy is in freefall. ${resourceName} shortage is crippling our war effort.",
    ],
  },
  {
    eventType: 'resource_low',
    advisorRole: 'military',
    priority: 'urgent',
    templates: [
      "Low ${resourceName} is affecting military readiness. We need supplies NOW.",
      "General Stone here. Without ${resourceName}, our forces can't maintain operational tempo.",
    ],
  },

  // ========================================
  // MORALE
  // ========================================
  {
    eventType: 'morale_drop',
    advisorRole: 'pr',
    priority: 'important',
    templates: [
      "Mr. President, public approval just dropped ${points} points. The people want peace.",
      "Morale crisis! Protests in every major city. They're burning flags and calling for your resignation.",
      "The press is going wild. We need a statement NOW.",
    ],
  },
  {
    eventType: 'morale_surge',
    advisorRole: 'pr',
    priority: 'routine',
    templates: [
      "National morale is soaring! Your leadership is inspiring the nation.",
      "Public support at ${percent}%. Keep this momentum going, Mr. President.",
      "The polls are looking fantastic. This is exactly what we needed.",
    ],
  },

  // ========================================
  // INTELLIGENCE
  // ========================================
  {
    eventType: 'intel_success',
    advisorRole: 'intel',
    priority: 'urgent',
    templates: [
      "Our asset in ${location} confirms: ${intelligence}.",
      "Sir, we've been compromised. Someone leaked our ${secretInfo}.",
      "Satellite recon shows something... unusual. ${description}.",
      "Intelligence breakthrough: ${discovery}. Trust no one, Mr. President.",
    ],
  },
  {
    eventType: 'enemy_buildup',
    advisorRole: 'intel',
    priority: 'urgent',
    templates: [
      "Satellite imagery confirms massive military buildup in ${location}.",
      "Enemy force concentration detected. ${unitCount} units moving toward ${target}.",
      "Intelligence shows ${nation} is preparing something big. Recommend elevated alert.",
    ],
  },
  {
    eventType: 'enemy_buildup',
    advisorRole: 'military',
    priority: 'urgent',
    templates: [
      "Enemy missile silos operational. We should strike first while we have the advantage.",
      "Intelligence shows massive troop movements in ${location}. This is it.",
      "Enemy ABM systems coming online. Our window for a first strike is closing.",
    ],
  },

  // ========================================
  // TREATIES & DIPLOMACY
  // ========================================
  {
    eventType: 'treaty_signed',
    advisorRole: 'diplomatic',
    priority: 'important',
    templates: [
      "Treaty signed with ${nation}. This is a triumph for diplomacy, Mr. President.",
      "We've secured a non-aggression pact with ${nation}. It's fragile, but it holds.",
      "Historic moment: the ${treatyName} treaty is now in effect.",
    ],
  },
  {
    eventType: 'treaty_broken',
    advisorRole: 'diplomatic',
    priority: 'urgent',
    templates: [
      "${nation} has violated the treaty! Our credibility is on the line.",
      "Treaty breach by ${nation}. The international community demands a response.",
      "They broke their word. Every ally is watching how we respond.",
    ],
  },
  {
    eventType: 'treaty_broken',
    advisorRole: 'military',
    priority: 'urgent',
    templates: [
      "${nation} broke the treaty. I told you diplomacy was useless. Time for action.",
      "They've shown their true colors. Recommend immediate military response.",
    ],
  },
  {
    eventType: 'treaty_signed',
    advisorRole: 'military',
    priority: 'routine',
    templates: [
      "Treaty with ${nation}... I hope this doesn't make us complacent.",
      "Paper promises won't stop missiles, Mr. President. Stay vigilant.",
    ],
  },

  // ========================================
  // FLASHPOINTS
  // ========================================
  {
    eventType: 'flashpoint_triggered',
    advisorRole: 'military',
    priority: 'urgent',
    templates: [
      "Crisis alert: ${flashpointTitle}. Recommend immediate tactical response.",
      "Flashpoint in ${location}. Military assets are ready to deploy on your order.",
    ],
  },
  {
    eventType: 'flashpoint_triggered',
    advisorRole: 'diplomatic',
    priority: 'urgent',
    templates: [
      "Crisis developing: ${flashpointTitle}. Diplomacy can still resolve this.",
      "Flashpoint alert. We need to de-escalate before this spirals out of control.",
    ],
  },
  {
    eventType: 'flashpoint_resolved',
    advisorRole: 'military',
    priority: 'routine',
    conditions: (event) => event.data.success,
    templates: [
      "Mission accomplished. The ${flashpointTitle} crisis has been neutralized.",
      "Successful resolution. Our forces performed admirably.",
    ],
  },
  {
    eventType: 'flashpoint_resolved',
    advisorRole: 'diplomatic',
    priority: 'routine',
    conditions: (event) => event.data.success,
    templates: [
      "Excellent work, Mr. President. The ${flashpointTitle} crisis was resolved peacefully.",
      "Diplomacy prevailed. This is how we build lasting peace.",
    ],
  },

  // ========================================
  // PANDEMIC
  // ========================================
  {
    eventType: 'pandemic_stage',
    advisorRole: 'science',
    priority: 'urgent',
    templates: [
      "Pandemic escalation: Stage ${stage}. Infection rate now ${rate}%.",
      "The virus has mutated. We're now at Stage ${stage} pandemic severity.",
      "Medical alert: ${casualties} casualties projected if we don't act now.",
    ],
  },
  {
    eventType: 'pandemic_stage',
    advisorRole: 'pr',
    priority: 'important',
    templates: [
      "The public is panicking about the pandemic. We need a clear health message.",
      "Stage ${stage} pandemic alert is causing mass hysteria. Control the narrative!",
    ],
  },

  // ========================================
  // ECONOMIC WARFARE
  // ========================================
  {
    eventType: 'economic_crisis',
    advisorRole: 'economic',
    priority: 'urgent',
    templates: [
      "Economic crisis! GDP down ${percent}%, unemployment rising.",
      "Sanctions are crippling their economy. Another month and they'll collapse.",
      "Trade has collapsed. We're looking at a recession unless we act.",
    ],
  },

  // ========================================
  // SPY OPERATIONS
  // ========================================
  {
    eventType: 'spy_discovered',
    advisorRole: 'intel',
    priority: 'urgent',
    templates: [
      "One of our assets has been compromised in ${location}.",
      "Spy network breach. They know about ${operation}.",
      "Counterintelligence failure. We've been exposed.",
    ],
  },

  // ========================================
  // TURN EVENTS
  // ========================================
  {
    eventType: 'turn_start',
    advisorRole: 'military',
    priority: 'routine',
    templates: [
      "Morning briefing, sir. All forces remain at current alert status.",
      "DEFCON ${defcon}. All systems nominal. Ready for your orders.",
    ],
  },
  {
    eventType: 'turn_end',
    advisorRole: 'intel',
    priority: 'routine',
    templates: [
      "End of day intelligence summary: ${summary}.",
      "Daily intelligence brief complete. No immediate threats detected.",
    ],
  },
];

/**
 * Helper function to get templates for a specific event and advisor
 */
export function getDialogueTemplates(
  eventType: GameEventType,
  advisorRole: string
): DialogueTemplate[] {
  return DIALOGUE_TEMPLATES.filter(
    (template) => template.eventType === eventType && template.advisorRole === advisorRole
  );
}

/**
 * Helper function to get all advisor roles that react to an event type
 */
export function getAdvisorsForEvent(eventType: GameEventType): string[] {
  const advisors = new Set<string>();
  DIALOGUE_TEMPLATES.forEach((template) => {
    if (template.eventType === eventType) {
      advisors.add(template.advisorRole);
    }
  });
  return Array.from(advisors);
}
