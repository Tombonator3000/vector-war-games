/**
 * ID Generation Utilities
 *
 * Simple utility for generating unique IDs without external dependencies
 */

/**
 * Generate a unique ID using timestamp and random string
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Generate a diplomatic incident ID
 */
export function generateIncidentId(): string {
  return generateId('incident');
}

/**
 * Generate a council resolution ID
 */
export function generateResolutionId(): string {
  return generateId('resolution');
}

/**
 * Generate a peace conference ID
 */
export function generateConferenceId(): string {
  return generateId('conference');
}

/**
 * Generate a peace treaty ID
 */
export function generateTreatyId(): string {
  return generateId('treaty');
}

/**
 * Generate a peace proposal ID
 */
export function generateProposalId(): string {
  return generateId('proposal');
}

/**
 * Generate a covert operation ID
 */
export function generateOperationId(): string {
  return generateId('operation');
}

/**
 * Generate an investigation ID
 */
export function generateInvestigationId(): string {
  return generateId('investigation');
}

/**
 * Generate an agenda item ID
 */
export function generateAgendaItemId(): string {
  return generateId('agenda');
}

/**
 * Generate a resolution option ID
 */
export function generateResolutionOptionId(): string {
  return generateId('option');
}
