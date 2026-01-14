/**
 * Advisor Trigger System
 *
 * Determines which advisors should speak in response to game events,
 * generates contextual dialogue, and manages trigger conditions.
 */

import {
  GameEvent,
  GameEventType,
  AdvisorRole,
  AdvisorComment,
  DialogueTemplate,
} from '@/types/advisor.types';
import {
  DIALOGUE_TEMPLATES,
  getDialogueTemplates,
  getAdvisorsForEvent,
} from '@/data/dialogueTemplates.data';
import { ADVISOR_CONFIGS } from '@/data/advisors.data';

/**
 * Generate unique comment ID
 */
let commentIdCounter = 0;
function generateCommentId(): string {
  return `comment_${Date.now()}_${commentIdCounter++}`;
}

/**
 * Select random template with optional weighting
 */
function selectRandomTemplate(templates: DialogueTemplate[]): DialogueTemplate | null {
  if (templates.length === 0) return null;

  const totalWeight = templates.reduce((sum, t) => sum + (t.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (const template of templates) {
    random -= template.weight || 1;
    if (random <= 0) {
      return template;
    }
  }

  return templates[0];
}

/**
 * Inject dynamic data into dialogue template
 */
function injectTemplateData(template: string, data: Record<string, any>): string {
  let result = template;

  // Replace all ${variable} placeholders
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `\${${key}}`;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
  }

  return result;
}

/**
 * AdvisorTriggerSystem manages event-based advisor commentary
 */
export class AdvisorTriggerSystem {
  /**
   * Process game event and generate advisor comments
   *
   * @param event - The game event that occurred
   * @param gameState - Current game state for context
   * @returns Array of advisor comments triggered by this event
   */
  processEvent(event: GameEvent, gameState: any): AdvisorComment[] {
    const comments: AdvisorComment[] = [];

    // Get all advisors that react to this event type
    const reactingAdvisors = getAdvisorsForEvent(event.type);

    for (const advisorRole of reactingAdvisors) {
      const comment = this.generateComment(advisorRole as AdvisorRole, event, gameState);
      if (comment) {
        comments.push(comment);
      }
    }

    return comments;
  }

  /**
   * Generate a comment for a specific advisor based on event
   */
  generateComment(
    advisorRole: AdvisorRole,
    event: GameEvent,
    gameState: any
  ): AdvisorComment | null {
    // Get templates for this advisor and event
    const templates = getDialogueTemplates(event.type, advisorRole);

    if (templates.length === 0) {
      return null;
    }

    // Filter templates by conditions
    const validTemplates = templates.filter((template) => {
      if (!template.conditions) return true;
      return template.conditions(event, gameState);
    });

    if (validTemplates.length === 0) {
      return null;
    }

    // Select random template
    const selected = selectRandomTemplate(validTemplates);
    if (!selected) return null;

    // Pick random text from template array
    const templateText =
      selected.templates[Math.floor(Math.random() * selected.templates.length)];

    // Inject dynamic data
    const finalText = injectTemplateData(templateText, {
      ...event.data,
      ...this.getContextualData(event, gameState),
    });

    return {
      id: generateCommentId(),
      advisorRole,
      text: finalText,
      priority: selected.priority,
      timestamp: Date.now(),
      event,
    };
  }

  /**
   * Get contextual data for template injection
   */
  private getContextualData(event: GameEvent, gameState: any): Record<string, any> {
    const data: Record<string, any> = {};

    // Add DEFCON if available
    if (gameState?.defcon !== undefined) {
      data.defcon = gameState.defcon;
    }

    // Add turn number
    if (event.turn !== undefined) {
      data.turn = event.turn;
    }

    // Add common calculations
    if (event.type === 'defcon_change') {
      data.seconds = this.getResponseTime(event.data.level || gameState?.defcon || 5);
    }

    // Add resource context
    if (event.type === 'resource_low' || event.type === 'resource_critical') {
      data.days = this.estimateDaysRemaining(event.data.amount, event.data.burnRate);
    }

    return data;
  }

  /**
   * Calculate response time based on DEFCON level
   */
  private getResponseTime(defcon: number): number {
    const responseTimes = {
      1: 180,    // 3 minutes
      2: 300,    // 5 minutes
      3: 900,    // 15 minutes
      4: 1800,   // 30 minutes
      5: 3600,   // 60 minutes
    };
    return responseTimes[defcon as keyof typeof responseTimes] || 3600;
  }

  /**
   * Estimate days remaining for resource
   */
  private estimateDaysRemaining(amount: number, burnRate: number): number {
    if (burnRate <= 0) return 999;
    return Math.floor(amount / burnRate);
  }

  /**
   * Check if advisor should speak based on personality and event
   */
  shouldAdvisorReact(
    advisorRole: AdvisorRole,
    event: GameEvent,
    trustLevel: number
  ): boolean {
    const config = ADVISOR_CONFIGS[advisorRole];
    if (!config) return false;

    const personality = config.personality;

    // Trust affects reaction frequency
    // Low trust = speak less often to avoid annoying player
    const trustThreshold = Math.random() * 100;
    if (trustLevel < trustThreshold) {
      return false;
    }

    // Personality-based reactions
    switch (event.type) {
      case 'defcon_change':
        // Hawkish advisors always react to DEFCON changes
        return personality.hawkish > 50 || Math.random() > 0.5;

      case 'treaty_signed':
        // Idealistic advisors care more about treaties
        return personality.idealistic > 50 || Math.random() > 0.6;

      case 'resource_low':
        // Pragmatic advisors care about resources
        return personality.pragmatic > 50 || Math.random() > 0.5;

      case 'morale_drop':
        // Image-conscious advisors react to morale
        return personality.imageConscious > 50 || Math.random() > 0.5;

      case 'intel_success':
        // Secretive advisors care about intelligence
        return personality.secretive > 50 || Math.random() > 0.6;

      default:
        // Default reaction probability
        return Math.random() > 0.4;
    }
  }

  /**
   * Get priority for event type
   */
  getEventPriority(eventType: GameEventType): 'critical' | 'urgent' | 'important' | 'routine' {
    const criticalEvents: GameEventType[] = ['nuclear_launch'];
    const urgentEvents: GameEventType[] = [
      'defcon_change',
      'treaty_broken',
      'enemy_buildup',
      'resource_critical',
      'intel_success',
      'spy_discovered',
    ];
    const importantEvents: GameEventType[] = [
      'flashpoint_triggered',
      'research_complete',
      'treaty_signed',
      'morale_drop',
      'pandemic_stage',
      'economic_crisis',
    ];

    if (criticalEvents.includes(eventType)) return 'critical';
    if (urgentEvents.includes(eventType)) return 'urgent';
    if (importantEvents.includes(eventType)) return 'important';
    return 'routine';
  }
}

/**
 * Singleton instance
 */
export const advisorTriggerSystem = new AdvisorTriggerSystem();
