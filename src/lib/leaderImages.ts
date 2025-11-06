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
  
  // Great Old Ones
  'Cthulhu': '/leaders/cthulhu.jpg',
  'Azathoth': '/leaders/azathoth.jpg',
  'Nyarlathotep': '/leaders/nyarlathotep.jpg',
  'Hastur': '/leaders/hastur.jpg',
  'Shub-Niggurath': '/leaders/shub-niggurath.jpg',
  'Yog-Sothoth': '/leaders/yog-sothoth.jpg',
  
  // Cold War Era Historical Leaders - United States
  'Ronald Reagan': '/leaders/ronald-reagan.jpg',
  'Richard Nixon': '/leaders/richard-nixon.jpg',
  'Jimmy Carter': '/leaders/jimmy-carter.jpg',
  'Dwight D. Eisenhower': '/leaders/dwight-eisenhower.jpg',
  'Dwight Eisenhower': '/leaders/dwight-eisenhower.jpg',
  'Lyndon B. Johnson': '/leaders/lyndon-johnson.jpg',
  'Lyndon Johnson': '/leaders/lyndon-johnson.jpg',
  'Gerald Ford': '/leaders/gerald-ford.jpg',
  'Harry S. Truman': '/leaders/harry-truman.jpg',
  'Harry Truman': '/leaders/harry-truman.jpg',
  
  // Soviet Union Leaders
  'Mikhail Gorbachev': '/leaders/mikhail-gorbachev.jpg',
  'Leonid Brezhnev': '/leaders/leonid-brezhnev.jpg',
  'Joseph Stalin': '/leaders/joseph-stalin.jpg',
  'Stalin': '/leaders/joseph-stalin.jpg',
  
  // British Leaders
  'Margaret Thatcher': '/leaders/margaret-thatcher.jpg',
  'Winston Churchill': '/leaders/winston-churchill.jpg',
  'Churchill': '/leaders/winston-churchill.jpg',
  
  // French Leaders
  'Charles de Gaulle': '/leaders/charles-de-gaulle.jpg',
  'François Mitterrand': '/leaders/francois-mitterrand.jpg',
  'Francois Mitterrand': '/leaders/francois-mitterrand.jpg',
  'Mitterrand': '/leaders/francois-mitterrand.jpg',
  
  // Chinese Leaders
  'Mao Zedong': '/leaders/mao-zedong.jpg',
  'Zhou Enlai': '/leaders/zhou-enlai.jpg',
  'Deng Xiaoping': '/leaders/deng-xiaoping.jpg',
  
  // Indian Leaders
  'Indira Gandhi': '/leaders/indira-gandhi.jpg',
  'Jawaharlal Nehru': '/leaders/jawaharlal-nehru.jpg',
  'Nehru': '/leaders/jawaharlal-nehru.jpg',
  
  // German Leaders
  'Konrad Adenauer': '/leaders/konrad-adenauer.jpg',
  'Willy Brandt': '/leaders/willy-brandt.jpg',
  'Helmut Kohl': '/leaders/helmut-kohl.jpg',
  
  // Other World Leaders
  'Pierre Trudeau': '/leaders/pierre-trudeau.jpg',
  'Ho Chi Minh': '/leaders/ho-chi-minh.jpg',
  'Josip Broz Tito': '/leaders/josip-broz-tito.jpg',
  'Tito': '/leaders/josip-broz-tito.jpg',
  'Gamal Abdel Nasser': '/leaders/gamal-abdel-nasser.jpg',
  'Nasser': '/leaders/gamal-abdel-nasser.jpg',
  'Sukarno': '/leaders/sukarno.jpg',
  
  // Parody leaders
  'Ronnie Raygun': '/leaders/ronnie-raygun.jpg',
  'Tricky Dick': '/leaders/tricky-dick.jpg',
  'Jimi Farmer': '/leaders/jimi-farmer.jpg',
  'E. Musk Rat': '/leaders/e-musk-rat.jpg',
  'Donnie Trumpf': '/leaders/donnie-trumpf.jpg',
  'Atom Hus-Bomb': '/leaders/atom-hus-bomb.jpg',
  'Krazy Re-Entry': '/leaders/krazy-re-entry.jpg',
  "Odd'n Wild Card": '/leaders/oddn-wild-card.jpg',
  'Oil-Stain Lint-Off': '/leaders/oil-stain-lint-off.jpg',
  'Ruin Annihilator': '/leaders/ruin-annihilator.jpg',
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
