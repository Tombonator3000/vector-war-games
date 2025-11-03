/**
 * Leader Images Mapping
 * 
 * Maps leader names to their portrait images.
 * Images are stored in public/leaders/ folder.
 */

export const leaderImages: Record<string, string> = {
  // Historical leaders from Cold War era
  'John F. Kennedy': '/leaders/john-f-kennedy.jpg',
  'John F Kennedy': '/leaders/john-f-kennedy.jpg',
  'JFK': '/leaders/john-f-kennedy.jpg',
  'Kennedy': '/leaders/john-f-kennedy.jpg',
  
  'Nikita Khrushchev': '/leaders/nikita-khrushchev.jpg',
  'Khrushchev': '/leaders/nikita-khrushchev.jpg',
  
  'Fidel Castro': '/leaders/fidel-castro.jpg',
  'Castro': '/leaders/fidel-castro.jpg',
};

/**
 * Get leader image URL by name (case-insensitive)
 */
export function getLeaderImage(leaderName: string | undefined): string | undefined {
  if (!leaderName) return undefined;
  
  // Try exact match first
  if (leaderImages[leaderName]) {
    return leaderImages[leaderName];
  }
  
  // Try case-insensitive match
  const lowerName = leaderName.toLowerCase();
  const matchingKey = Object.keys(leaderImages).find(
    key => key.toLowerCase() === lowerName
  );
  
  return matchingKey ? leaderImages[matchingKey] : undefined;
}
