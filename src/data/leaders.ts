/**
 * Leader Definitions
 *
 * Defines all available leaders across different scenarios.
 * Extracted from Index.tsx to support modularization.
 */

export type LeaderScenarioTag = 'default' | 'cubanCrisis' | 'greatOldOnes' | 'nuclearWar';

export interface LeaderDefinition {
  name: string;
  ai: string;
  color: string;
  isHistoricalCubanCrisis?: boolean;
  isLovecraftian?: boolean;
  scenarios?: LeaderScenarioTag[];
}

export const leaders: LeaderDefinition[] = [
  // Historical leaders (for Cuban Crisis scenario)
  { name: 'John F. Kennedy', ai: 'balanced', color: '#0047AB', isHistoricalCubanCrisis: true, scenarios: ['cubanCrisis'] }, // US President, balanced approach during crisis
  { name: 'Nikita Khrushchev', ai: 'aggressive', color: '#CC0000', isHistoricalCubanCrisis: true, scenarios: ['cubanCrisis'] }, // Soviet Premier, aggressive but pragmatic
  { name: 'Fidel Castro', ai: 'aggressive', color: '#CE1126', isHistoricalCubanCrisis: true, scenarios: ['cubanCrisis'] }, // Cuban leader, revolutionary and aggressive

  // Cold War Historical Leaders
  { name: 'Ronald Reagan', ai: 'aggressive', color: '#C8102E', scenarios: ['default'] }, // 40th US President, aggressive Cold Warrior
  { name: 'Mikhail Gorbachev', ai: 'balanced', color: '#DA291C', scenarios: ['default'] }, // Soviet leader, reformist
  { name: 'Margaret Thatcher', ai: 'defensive', color: '#0087DC', scenarios: ['default'] }, // UK Prime Minister, Iron Lady
  { name: 'Mao Zedong', ai: 'aggressive', color: '#DE2910', scenarios: ['default'] }, // Chinese Communist leader
  { name: 'Charles de Gaulle', ai: 'defensive', color: '#002395', scenarios: ['default'] }, // French President, nationalist
  { name: 'Indira Gandhi', ai: 'balanced', color: '#FF9933', scenarios: ['default'] }, // Indian Prime Minister
  { name: 'Leonid Brezhnev', ai: 'defensive', color: '#DA291C', scenarios: ['default'] }, // Soviet General Secretary
  { name: 'Richard Nixon', ai: 'balanced', color: '#0047AB', scenarios: ['default'] }, // 37th US President
  { name: 'Jimmy Carter', ai: 'balanced', color: '#0047AB', scenarios: ['default'] }, // 39th US President, peace-focused
  { name: 'Dwight D. Eisenhower', ai: 'balanced', color: '#0047AB', scenarios: ['default'] }, // 34th US President, general
  { name: 'Lyndon B. Johnson', ai: 'aggressive', color: '#0047AB', scenarios: ['default'] }, // 36th US President
  { name: 'Gerald Ford', ai: 'balanced', color: '#0047AB', scenarios: ['default'] }, // 38th US President
  { name: 'Winston Churchill', ai: 'defensive', color: '#00247D', scenarios: ['default'] }, // UK Prime Minister, steadfast defender
  { name: 'Harry S. Truman', ai: 'balanced', color: '#3C3B6E', scenarios: ['default'] }, // US President, Truman Doctrine
  { name: 'Joseph Stalin', ai: 'aggressive', color: '#CC0000', scenarios: ['default'] }, // Soviet Premier, hardline expansionist
  { name: 'Pierre Trudeau', ai: 'balanced', color: '#FF0000', scenarios: ['default'] }, // Canadian Prime Minister, charismatic centrist
  { name: 'Zhou Enlai', ai: 'balanced', color: '#DE2910', scenarios: ['default'] }, // Chinese Premier, master diplomat
  { name: 'Deng Xiaoping', ai: 'defensive', color: '#D62828', scenarios: ['default'] }, // Chinese leader, pragmatic reformer
  { name: 'Ho Chi Minh', ai: 'aggressive', color: '#DA251D', scenarios: ['default'] }, // Vietnamese revolutionary leader
  { name: 'Josip Broz Tito', ai: 'balanced', color: '#0C4076', scenarios: ['default'] }, // Yugoslav president, non-aligned strategist
  { name: 'Gamal Abdel Nasser', ai: 'balanced', color: '#CE1126', scenarios: ['default'] }, // Egyptian president, pan-Arab champion
  { name: 'Jawaharlal Nehru', ai: 'defensive', color: '#FF9933', scenarios: ['default'] }, // Indian Prime Minister, non-aligned architect
  { name: 'Konrad Adenauer', ai: 'defensive', color: '#000000', scenarios: ['default'] }, // West German chancellor, pro-West builder
  { name: 'Willy Brandt', ai: 'balanced', color: '#00008B', scenarios: ['default'] }, // West German chancellor, Ostpolitik pioneer
  { name: 'Helmut Kohl', ai: 'defensive', color: '#1C1C1C', scenarios: ['default'] }, // German chancellor, unification steward
  { name: 'François Mitterrand', ai: 'balanced', color: '#0055A4', scenarios: ['default'] }, // French president, European integrationist
  { name: 'Sukarno', ai: 'aggressive', color: '#E30A17', scenarios: ['default'] }, // Indonesian president, revolutionary nationalist

  // Lovecraftian leaders (for Great Old Ones scenario)
  { name: 'Cthulhu', ai: 'aggressive', color: '#004d00', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Great Dreamer, aggressive domination
  { name: 'Azathoth', ai: 'chaotic', color: '#1a0033', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Blind Idiot God, chaotic and unpredictable
  { name: 'Nyarlathotep', ai: 'trickster', color: '#330033', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Crawling Chaos, deceptive and manipulative
  { name: 'Hastur', ai: 'balanced', color: '#4d1a00', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Unspeakable One, balanced corruption
  { name: 'Shub-Niggurath', ai: 'aggressive', color: '#003300', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Black Goat, aggressive expansion
  { name: 'Yog-Sothoth', ai: 'defensive', color: '#1a1a33', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Gate and the Key, strategic defense

  // Parody leaders (for Nuclear War: Last Man Standing campaign)
  { name: 'Ronnie Raygun', ai: 'aggressive', color: '#ff5555', scenarios: ['nuclearWar'] },
  { name: 'Tricky Dick', ai: 'defensive', color: '#5599ff', scenarios: ['nuclearWar'] },
  { name: 'Jimi Farmer', ai: 'balanced', color: '#55ff99', scenarios: ['nuclearWar'] },
  { name: 'E. Musk Rat', ai: 'chaotic', color: '#ff55ff', scenarios: ['nuclearWar'] },
  { name: 'Donnie Trumpf', ai: 'aggressive', color: '#ffaa55', scenarios: ['nuclearWar'] },
  { name: 'Atom Hus-Bomb', ai: 'aggressive', color: '#ff3333', scenarios: ['nuclearWar'] },
  { name: 'Krazy Re-Entry', ai: 'chaotic', color: '#cc44ff', scenarios: ['nuclearWar'] },
  { name: 'Odd\'n Wild Card', ai: 'trickster', color: '#44ffcc', scenarios: ['nuclearWar'] },
  { name: 'Oil-Stain Lint-Off', ai: 'balanced', color: '#88ff88', scenarios: ['nuclearWar'] },
  { name: 'Ruin Annihilator', ai: 'aggressive', color: '#ff6600', scenarios: ['nuclearWar']}
];
