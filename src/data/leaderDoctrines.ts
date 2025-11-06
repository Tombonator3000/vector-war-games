/**
 * Leader Default Doctrines for Base Cold War Game
 *
 * Maps each leader to their default military doctrine.
 * When a leader is selected, their doctrine is automatically assigned.
 */

import type { DoctrineKey } from '@/types/doctrineIncidents';

export const LEADER_DEFAULT_DOCTRINES: Record<string, DoctrineKey> = {
  // ============================================================================
  // HISTORICAL CUBAN CRISIS LEADERS
  // ============================================================================

  'John F. Kennedy': 'detente', // Diplomatic approach, avoided war during Cuban Crisis
  'Nikita Khrushchev': 'mad', // Brinkmanship, mutual deterrence strategy
  'Fidel Castro': 'firstStrike', // Revolutionary, willing to take risks

  // ============================================================================
  // MODERN LEADERS
  // ============================================================================

  'Donnie Trumpf': 'firstStrike', // Aggressive, unpredictable
  'Vlad the Impaler': 'mad', // Strong deterrence, power projection
  'Xi Jinpooh': 'defense', // Long-term strategic patience
  'Boris Yeltsin': 'detente', // Reform-minded, diplomatic
  'Kim Jong Boom': 'mad', // Massive retaliation doctrine
  'Ayatollah Nukem': 'firstStrike', // Revolutionary ideology

  // ============================================================================
  // COLD WAR ERA LEADERS
  // ============================================================================

  'Ronald Reagan': 'mad', // "Peace through strength", SDI program
  'Mikhail Gorbachev': 'detente', // Glasnost, perestroika, arms reduction
  'Margaret Thatcher': 'defense', // Iron Lady, strong defense
  'Mao Zedong': 'mad', // Massive retaliation, people's war
  'Charles de Gaulle': 'defense', // Independent deterrence, Force de Frappe
  'Indira Gandhi': 'defense', // Non-alignment, strategic autonomy
  'Leonid Brezhnev': 'mad', // Nuclear parity with USA
  'Richard Nixon': 'detente', // Détente policy, SALT treaties
  'Jimmy Carter': 'detente', // Human rights focus, arms control
  'Gerald Ford': 'defense', // Continuity, defensive posture
  'Lyndon B. Johnson': 'mad', // Vietnam escalation, containment
  'Dwight D. Eisenhower': 'defense', // "New Look" policy, massive retaliation
  'Winston Churchill': 'defense', // Island fortress, allied solidarity
  'Harry S. Truman': 'mad', // Truman Doctrine containment
  'Joseph Stalin': 'mad', // Hardline expansion and deterrence
  'Pierre Trudeau': 'detente', // Peacekeeping and diplomacy
  'Zhou Enlai': 'detente', // Master diplomat, non-aligned outreach
  'Deng Xiaoping': 'defense', // Pragmatic modernization, patience
  'Ho Chi Minh': 'firstStrike', // Guerrilla offensives and surprise
  'Josip Broz Tito': 'detente', // Non-aligned balancing
  'Gamal Abdel Nasser': 'firstStrike', // Preemptive regional gambits
  'Jawaharlal Nehru': 'defense', // Non-aligned but vigilant borders
  'Konrad Adenauer': 'defense', // NATO integration and security
  'Willy Brandt': 'detente', // Ostpolitik rapprochement
  'Helmut Kohl': 'defense', // Reunification under protective umbrella
  'François Mitterrand': 'detente', // European integration diplomacy
  'Sukarno': 'firstStrike', // Revolutionary offensives and brinkmanship

  // ============================================================================
  // ALTERNATIVE HISTORY / FICTIONAL
  // ============================================================================

  'Dr. Strangelove': 'mad', // Doomsday machine mentality
  'General Buck Turgidson': 'firstStrike', // "Preemptive war" advocate
  'President Merkin Muffley': 'detente', // Peaceful resolution seeker

  // ============================================================================
  // GREAT OLD ONES CAMPAIGN (Compatibility)
  // Note: These map to base game doctrines, not Great Old Ones doctrines
  // ============================================================================

  'Cthulhu': 'mad', // Overwhelming power and terror
  'Nyarlathotep': 'firstStrike', // Chaos and deception
  'Yog-Sothoth': 'defense', // Patient, strategic
  'Azathoth': 'mad', // Blind idiot god, destructive chaos
  'Shub-Niggurath': 'defense', // Slow corruption and growth
  'Hastur': 'detente', // Subtle manipulation, the Yellow King
};

/**
 * Get the default doctrine for a leader
 * Falls back to 'mad' if leader not found
 */
export function getLeaderDefaultDoctrine(leaderName: string): DoctrineKey {
  return LEADER_DEFAULT_DOCTRINES[leaderName] || 'mad';
}

/**
 * Get doctrine display name
 */
export function getDoctrineName(doctrine: DoctrineKey): string {
  const names: Record<DoctrineKey, string> = {
    mad: 'Mutual Assured Destruction',
    defense: 'Strategic Defense',
    firstStrike: 'First Strike',
    detente: 'Détente',
  };
  return names[doctrine];
}

/**
 * Get doctrine description
 */
export function getDoctrineDescription(doctrine: DoctrineKey): string {
  const descriptions: Record<DoctrineKey, string> = {
    mad: 'Total retaliation doctrine - maintain massive arsenals for deterrence',
    defense: 'Focus on protection systems - invest in ABM and defensive capabilities',
    firstStrike: 'Preemptive attack capability - strike first when threatened',
    detente: 'Diplomatic engagement - pursue peace through negotiation',
  };
  return descriptions[doctrine];
}
