/**
 * Leader Biographies and Strategy Tips - Phase 4
 *
 * Provides historical/thematic background and gameplay strategy for each leader
 */

export interface LeaderBiography {
  name: string;
  title: string;
  biography: string;
  strategyTips: string[];
  recommendedDoctrine?: string;
  playstyle: 'aggressive' | 'defensive' | 'balanced' | 'diplomatic' | 'chaotic';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export const LEADER_BIOGRAPHIES: Record<string, LeaderBiography> = {
  // ============================================================================
  // HISTORICAL CUBAN CRISIS LEADERS
  // ============================================================================

  'John F. Kennedy': {
    name: 'John F. Kennedy',
    title: '35th President of the United States',
    biography:
      'The youngest elected President of the United States, JFK faced the Cuban Missile Crisis in October 1962. His leadership during those 13 days prevented nuclear war through careful diplomacy, naval blockade, and secret negotiations. Known for his charisma and commitment to peace, Kennedy sought to de-escalate tensions while maintaining American strength.',
    strategyTips: [
      'Use Crisis Resolution ability when surrounded by multiple enemies',
      'Focus on building strong alliances early to avoid multi-front wars',
      'Invest in diplomatic influence to maximize negotiation success',
      'Save your ability for critical moments when war threatens your survival',
      'Build defensive capabilities while pursuing peaceful solutions',
    ],
    recommendedDoctrine: 'Convergence (Diplomatic approach)',
    playstyle: 'diplomatic',
    difficulty: 'medium',
  },

  'Nikita Khrushchev': {
    name: 'Nikita Khrushchev',
    title: 'First Secretary of the Communist Party of the Soviet Union',
    biography:
      'Leader of the Soviet Union during the Cold War\'s most dangerous moments, Khrushchev oversaw the placement of missiles in Cuba and the subsequent crisis. Known for his brinkmanship and willingness to take risks, he ultimately backed down to avoid nuclear war. A pragmatic leader who combined threats with diplomacy.',
    strategyTips: [
      'Use Iron Curtain Strike for devastating first strike capability',
      'Build massive missile arsenals to maintain nuclear superiority',
      'Employ brinkmanship: threaten war to gain diplomatic concessions',
      'Time your ability use carefully - you only get one shot',
      'Focus on military research to maximize strike effectiveness',
    ],
    recommendedDoctrine: 'Domination (Military supremacy)',
    playstyle: 'aggressive',
    difficulty: 'medium',
  },

  'Fidel Castro': {
    name: 'Fidel Castro',
    title: 'Prime Minister and President of Cuba',
    biography:
      'Revolutionary leader who transformed Cuba into a communist state and allied with the Soviet Union. Castro\'s Cuba became the flashpoint for the Cuban Missile Crisis. Known for his fiery rhetoric, resilience, and ability to mobilize his people against overwhelming odds. A master of asymmetric warfare and propaganda.',
    strategyTips: [
      'Revolutionary Uprising gives excellent economic boosts - use early and often',
      'Play as the underdog: use guerrilla tactics and asymmetric warfare',
      'Form strong alliances with major powers for protection',
      'Use morale boosts to maintain public support during difficult times',
      'Focus on production efficiency to compete with larger nations',
    ],
    recommendedDoctrine: 'Corruption (Revolutionary subversion)',
    playstyle: 'balanced',
    difficulty: 'easy',
  },

  // ============================================================================
  // GREAT OLD ONES
  // ============================================================================

  'Cthulhu': {
    name: 'Cthulhu',
    title: 'The Great Dreamer, High Priest of the Great Old Ones',
    biography:
      'In his house at R\'lyeh, dead Cthulhu waits dreaming. The most iconic of the Great Old Ones, Cthulhu represents cosmic horror incarnate. His very presence drives mortals to madness. When the stars are right, R\'lyeh will rise from the ocean depths, and humanity will learn the true meaning of terror.',
    strategyTips: [
      'R\'lyeh Awakening devastates coastal populations - target island nations',
      'Focus on summoning powerful entities for overwhelming force',
      'Use terror campaigns to break enemy morale before military strikes',
      'Build ritual sites near oceans for bonus summoning power',
      'Accept high veil damage - domination through fear requires visibility',
    ],
    recommendedDoctrine: 'Domination (Overwhelming terror)',
    playstyle: 'aggressive',
    difficulty: 'hard',
  },

  'Azathoth': {
    name: 'Azathoth',
    title: 'The Blind Idiot God, Nuclear Chaos',
    biography:
      'At the center of ultimate chaos, Azathoth writhes blindly, piping to the tune of unseen flutes. The embodiment of pure cosmic chaos, reality itself warps in his presence. Neither good nor evil, Azathoth simply exists beyond comprehension, and those who glimpse his true nature are forever changed.',
    strategyTips: [
      'Chaos Storm creates unpredictable results - high risk, high reward',
      'Embrace randomness: this leader rewards adaptability',
      'Stockpile resources before using ability to survive negative outcomes',
      'Use ability when desperate - chaos can turn losing games around',
      'Expect the unexpected and plan for multiple scenarios',
    ],
    recommendedDoctrine: 'Any (Chaos transcends order)',
    playstyle: 'chaotic',
    difficulty: 'extreme',
  },

  'Nyarlathotep': {
    name: 'Nyarlathotep',
    title: 'The Crawling Chaos, Messenger of the Outer Gods',
    biography:
      'The most deceptive and cunning of the Outer Gods, Nyarlathotep walks among mortals in a thousand forms. Unlike other cosmic entities, he delights in causing suffering through manipulation and deceit. The Crawling Chaos whispers in the ears of leaders, turning allies against each other while advancing his unfathomable agenda.',
    strategyTips: [
      'Master Deceiver allows false flag attacks - frame your enemies',
      'Focus on espionage and intel gathering for maximum deception',
      'Turn enemies against each other through manufactured incidents',
      'Build corruption networks to infiltrate all major powers',
      'Use subtle methods: let others destroy themselves',
    ],
    recommendedDoctrine: 'Corruption (Deception and infiltration)',
    playstyle: 'diplomatic',
    difficulty: 'hard',
  },

  'Hastur': {
    name: 'Hastur',
    title: 'The King in Yellow, Him Who Is Not to Be Named',
    biography:
      'Hastur dwells in the star Aldebaran in the Hyades, and those who read the play "The King in Yellow" fall under his influence. His symbol corrupts all who see it, spreading madness like a plague. Hastur represents the horror of art and beauty twisted into instruments of corruption and control.',
    strategyTips: [
      'Yellow Sign converts population through cultural corruption',
      'Use cultural movements and enlightenment programs effectively',
      'Target high-population regions for maximum conversion impact',
      'Build pilgrimage sites to increase voluntary conversion rates',
      'Balance conversion speed with maintaining the veil of secrecy',
    ],
    recommendedDoctrine: 'Convergence (Cultural transformation)',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Shub-Niggurath': {
    name: 'Shub-Niggurath',
    title: 'The Black Goat of the Woods with a Thousand Young',
    biography:
      'The fertility goddess of cosmic horror, Shub-Niggurath births endless abominations. Her dark young roam the earth, spreading terror and corruption. She represents the horror of unchecked creation and perverse fertility. Where she treads, forests become twisted mockeries of nature.',
    strategyTips: [
      'Dark Young Swarm provides multiple entities - use for overwhelming force',
      'Focus on entity production and control mechanics',
      'Use swarm tactics: multiple weak entities can overwhelm defenses',
      'Build ritual sites in forested regions for thematic bonuses',
      'Summon frequently and accept the cost - quantity over quality',
    ],
    recommendedDoctrine: 'Domination (Endless summoning)',
    playstyle: 'aggressive',
    difficulty: 'medium',
  },

  'Yog-Sothoth': {
    name: 'Yog-Sothoth',
    title: 'The Key and the Gate, Lurker at the Threshold',
    biography:
      'Yog-Sothoth exists outside of time and space, simultaneously experiencing all moments. He is the gate through which the Old Ones will return. Knowledge of past and future alike flows through him. To contact Yog-Sothoth is to glimpse the true nature of reality - a revelation that breaks most minds.',
    strategyTips: [
      'Temporal Manipulation grants an extra turn - plan carefully',
      'Use ability for critical multi-step operations',
      'Build eldritch power reserves before use for maximum impact',
      'Combine with other operations for devastating combo effects',
      'Save for endgame when one extra turn can win the game',
    ],
    recommendedDoctrine: 'Any (Temporal mastery transcends doctrines)',
    playstyle: 'balanced',
    difficulty: 'hard',
  },

  // ============================================================================
  // COLD WAR ERA HISTORICAL LEADERS
  // ============================================================================

  'Ronald Reagan': {
    name: 'Ronald Reagan',
    title: '40th President of the United States',
    biography: 'The Great Communicator who ended the Cold War through "Peace through Strength." Former Hollywood actor turned politician, Reagan\'s Strategic Defense Initiative and aggressive military buildup pressured the Soviet Union while his diplomatic relationship with Gorbachev helped end decades of nuclear tension.',
    strategyTips: [
      'Invest heavily in missile defense systems - your SDI program can neutralize enemy attacks',
      'Use aggressive rhetoric but seek diplomatic solutions - "Trust but verify"',
      'Build massive nuclear arsenals to negotiate from strength',
      'Form strong alliances with Western nations for economic and military support',
    ],
    recommendedDoctrine: 'mad',
    playstyle: 'defensive',
    difficulty: 'medium',
  },

  'Mikhail Gorbachev': {
    name: 'Mikhail Gorbachev',
    title: 'General Secretary of the Soviet Union',
    biography: 'The reformer who ended the Cold War. Introduced Glasnost (openness) and Perestroika (restructuring), fundamentally changing Soviet policy. Negotiated major arms reduction treaties with the West and chose dialogue over confrontation, ultimately leading to the dissolution of the Soviet Union.',
    strategyTips: [
      'Prioritize diplomatic solutions and arms reduction treaties',
      'Reduce military spending to invest in economy and infrastructure',
      'Seek cooperation with Western nations rather than confrontation',
      'Use transparency and openness to build international trust',
    ],
    recommendedDoctrine: 'detente',
    playstyle: 'diplomatic',
    difficulty: 'hard',
  },

  'Margaret Thatcher': {
    name: 'Margaret Thatcher',
    title: 'Prime Minister of the United Kingdom',
    biography: 'The Iron Lady of British politics. Strong advocate for Western unity during the Cold War, close ally of Reagan. Maintained Britain\'s independent nuclear deterrent while supporting NATO and challenging Soviet expansionism with unwavering resolve.',
    strategyTips: [
      'Maintain strong defensive capabilities - your independent deterrent is non-negotiable',
      'Form close alliances with the USA for mutual support',
      'Stand firm against aggression - never back down from confrontation',
      'Balance military strength with economic development',
    ],
    recommendedDoctrine: 'defense',
    playstyle: 'defensive',
    difficulty: 'medium',
  },

  'Mao Zedong': {
    name: 'Mao Zedong',
    title: 'Chairman of the Communist Party of China',
    biography: 'Revolutionary leader who transformed China into a nuclear power. Developed the doctrine of "People\'s War" and massive retaliation. Initially allied with the USSR but later pursued an independent path, playing both superpowers against each other during the Sino-Soviet split.',
    strategyTips: [
      'Develop nuclear weapons quickly - your deterrent must be credible',
      'Use your massive population as strategic leverage',
      'Play superpowers against each other for maximum advantage',
      'Pursue aggressive expansion to secure your borders',
    ],
    recommendedDoctrine: 'mad',
    playstyle: 'aggressive',
    difficulty: 'hard',
  },

  'Charles de Gaulle': {
    name: 'Charles de Gaulle',
    title: 'President of France',
    biography: 'Architect of French independence and the Force de Frappe nuclear deterrent. Withdrew France from NATO\'s integrated military command to maintain sovereignty while still supporting Western values. Believed in a "Europe from the Atlantic to the Urals" independent of both superpowers.',
    strategyTips: [
      'Build an independent nuclear force - rely on no one else for your security',
      'Maintain diplomatic flexibility between East and West',
      'Invest in technology and military innovation',
      'Pursue French grandeur and strategic autonomy above all',
    ],
    recommendedDoctrine: 'defense',
    playstyle: 'balanced',
    difficulty: 'hard',
  },

  'Indira Gandhi': {
    name: 'Indira Gandhi',
    title: 'Prime Minister of India',
    biography: 'Leader of the Non-Aligned Movement who developed India\'s nuclear program. Balanced relations between the USA and USSR while pursuing India\'s independent interests. Demonstrated that middle powers could chart their own course during the Cold War.',
    strategyTips: [
      'Maintain neutrality between superpowers while building your own strength',
      'Develop nuclear weapons for regional security and global respect',
      'Use diplomacy to extract benefits from both sides',
      'Focus on strategic autonomy and self-reliance',
    ],
    recommendedDoctrine: 'defense',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Leonid Brezhnev': {
    name: 'Leonid Brezhnev',
    title: 'General Secretary of the Soviet Union',
    biography: 'Led the USSR during its period of nuclear parity with the USA. Oversaw massive military buildup and the "Brezhnev Doctrine" of limited sovereignty for Warsaw Pact nations. Pursued détente while simultaneously expanding Soviet influence globally.',
    strategyTips: [
      'Achieve nuclear parity with your opponents through massive arsenals',
      'Maintain control over your sphere of influence at all costs',
      'Use arms control talks as diplomatic cover for military expansion',
      'Project power globally through proxy conflicts',
    ],
    recommendedDoctrine: 'mad',
    playstyle: 'aggressive',
    difficulty: 'medium',
  },

  'Richard Nixon': {
    name: 'Richard Nixon',
    title: '37th President of the United States',
    biography: 'Architect of détente and the opening to China. Master of realpolitik who negotiated SALT I arms control treaty and Anti-Ballistic Missile Treaty. Despite Watergate scandal, his foreign policy achievements reshaped the Cold War balance of power.',
    strategyTips: [
      'Use diplomatic triangulation - play rivals against each other',
      'Negotiate arms control treaties while maintaining strategic advantage',
      'Open unexpected diplomatic channels for strategic surprise',
      'Pursue peace through calculated risk-taking',
    ],
    recommendedDoctrine: 'detente',
    playstyle: 'diplomatic',
    difficulty: 'medium',
  },

  'Jimmy Carter': {
    name: 'Jimmy Carter',
    title: '39th President of the United States',
    biography: 'Moralist president who emphasized human rights in foreign policy. Negotiated SALT II treaty and Camp David Accords. Faced challenges with Iran hostage crisis and Soviet invasion of Afghanistan, but maintained commitment to peace and arms control.',
    strategyTips: [
      'Prioritize human rights and diplomatic solutions',
      'Negotiate comprehensive arms control agreements',
      'Build international coalitions based on shared values',
      'Be prepared for unexpected crises - moral clarity is your strength',
    ],
    recommendedDoctrine: 'detente',
    playstyle: 'diplomatic',
    difficulty: 'hard',
  },

  'Dwight D. Eisenhower': {
    name: 'Dwight D. Eisenhower',
    title: '34th President of the United States',
    biography: 'Supreme Allied Commander in WWII who became president during early Cold War. Developed "New Look" policy emphasizing nuclear deterrence over conventional forces. Warned against the "military-industrial complex" while maintaining American nuclear superiority.',
    strategyTips: [
      'Rely on nuclear weapons for cost-effective deterrence',
      'Avoid expensive conventional force buildups',
      'Use covert operations and intelligence rather than direct confrontation',
      'Maintain technological superiority through research investment',
    ],
    recommendedDoctrine: 'defense',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Lyndon B. Johnson': {
    name: 'Lyndon B. Johnson',
    title: '36th President of the United States',
    biography: 'Escalated Vietnam War while pursuing Great Society reforms at home. Continued Kennedy\'s containment policy with massive military commitment. Struggled to balance domestic programs with Cold War military spending.',
    strategyTips: [
      'Commit fully to containment - prevent enemy expansion at all costs',
      'Build overwhelming military superiority',
      'Balance military spending with domestic development',
      'Use escalation to demonstrate resolve and force negotiations',
    ],
    recommendedDoctrine: 'mad',
    playstyle: 'aggressive',
    difficulty: 'hard',
  },

  'Gerald Ford': {
    name: 'Gerald Ford',
    title: '38th President of the United States',
    biography: 'Assumed presidency after Nixon\'s resignation. Continued détente policies and signed Helsinki Accords. Maintained stability during turbulent transition period while managing the end of Vietnam War and ongoing Cold War tensions.',
    strategyTips: [
      'Maintain continuity and stability in nuclear policy',
      'Continue arms control negotiations started by predecessors',
      'Focus on defensive preparations and alliance management',
      'Navigate crises with steady, measured responses',
    ],
    recommendedDoctrine: 'defense',
    playstyle: 'defensive',
    difficulty: 'easy',
  },

  'Winston Churchill': {
    name: 'Winston Churchill',
    title: 'Prime Minister of the United Kingdom',
    biography:
      'The bulldog of Britain who rallied the free world during World War II, Churchill returned to office in the early Cold War warning of an "Iron Curtain" descending across Europe. His leadership emphasized unshakable alliances, strategic deterrence, and inspiring rhetoric to keep Western democracies united against authoritarian expansion.',
    strategyTips: [
      'Forge strong alliances early—shared defense is your greatest asset',
      'Maintain high morale with propaganda investments to weather crises',
      'Focus on defensive research to make island strongholds impregnable',
      'Use naval and air power to project influence without overextending',
    ],
    recommendedDoctrine: 'defense',
    playstyle: 'defensive',
    difficulty: 'medium',
  },

  'Harry S. Truman': {
    name: 'Harry S. Truman',
    title: '33rd President of the United States',
    biography:
      'Truman shepherded the United States through the dawn of the Cold War—launching the Marshall Plan, founding NATO, and articulating the Truman Doctrine to contain communism. His decisions in Korea and Berlin showcased a willingness to blend diplomacy with firm military resolve.',
    strategyTips: [
      'Balance aid spending with military readiness to keep allies loyal',
      'Deploy rapid response forces to suppress crises before they escalate',
      'Use airlift-style logistics boosts to sustain distant operations',
      'Maintain a healthy intelligence network to anticipate surprise moves',
    ],
    recommendedDoctrine: 'mad',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Joseph Stalin': {
    name: 'Joseph Stalin',
    title: 'General Secretary of the Communist Party of the Soviet Union',
    biography:
      'Stalin emerged from World War II commanding a vast Eurasian empire, enforcing rigid control over Eastern Europe while accelerating nuclear and industrial programs. His regime wielded fear, purges, and aggressive expansion to secure Soviet dominance, making him the archetype of hardline Cold War confrontation.',
    strategyTips: [
      'Invest heavily in heavy industry to sustain massive military builds',
      'Use intimidation tactics to keep neighbors in line and gain concessions',
      'Maintain strict internal security to avoid morale shocks from dissent',
      'Strike decisively when opponents show weakness—hesitation invites resistance',
    ],
    recommendedDoctrine: 'mad',
    playstyle: 'aggressive',
    difficulty: 'hard',
  },

  'Pierre Trudeau': {
    name: 'Pierre Trudeau',
    title: '15th Prime Minister of Canada',
    biography:
      'A charismatic intellectual, Trudeau steered Canada through constitutional reform, bilingual nation-building, and a nuanced posture between superpowers. Advocating a "Just Society," he favored diplomacy, peacekeeping, and domestic unity while quietly modernizing Canada\'s defenses.',
    strategyTips: [
      'Invest in culture and domestic policies to boost morale and stability',
      'Play mediator between rivals to gain diplomatic favor and intel',
      'Specialize in technology that enhances defensive capabilities',
      'Use peacekeeping deployments to de-escalate hotspots and gain influence',
    ],
    recommendedDoctrine: 'detente',
    playstyle: 'diplomatic',
    difficulty: 'easy',
  },

  'Zhou Enlai': {
    name: 'Zhou Enlai',
    title: 'Premier of the People\'s Republic of China',
    biography:
      'Zhou served as the PRC\'s consummate diplomat, orchestrating revolutionary consolidation at home while opening channels abroad—from the Bandung Conference to the rapprochement with the United States. His subtle balancing of ideology and pragmatism stabilized China during turbulent decades.',
    strategyTips: [
      'Focus on diplomacy techs to unlock powerful negotiation leverage',
      'Maintain a flexible military posture capable of both offense and defense',
      'Use espionage to stay informed about rival blocs and exploit divisions',
      'Build infrastructure to convert economic growth into strategic options',
    ],
    recommendedDoctrine: 'detente',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Deng Xiaoping': {
    name: 'Deng Xiaoping',
    title: 'Paramount Leader of China',
    biography:
      'Architect of China\'s Reform and Opening, Deng shifted the nation from Maoist mass campaigns to pragmatic modernization. He emphasized economic liberalization, technology acquisition, and a calm foreign policy that bought time for development while maintaining core security interests.',
    strategyTips: [
      'Prioritize economic reforms to turbocharge production and research',
      'Use patient diplomacy to avoid overextension and lure investment',
      'Invest in defensive systems while expanding technological capabilities',
      'Time power plays after economic upgrades to maximize their impact',
    ],
    recommendedDoctrine: 'defense',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Ho Chi Minh': {
    name: 'Ho Chi Minh',
    title: 'President of the Democratic Republic of Vietnam',
    biography:
      'Founding father of modern Vietnam, Ho combined nationalism and communism to wage a decades-long struggle against colonialism and foreign intervention. Master of guerrilla warfare and political organization, he forged a resilient movement that endured immense pressure.',
    strategyTips: [
      'Exploit guerilla tactics to bleed stronger foes over time',
      'Invest in morale and propaganda to keep population support unwavering',
      'Use terrain advantages—jungles and mountains—to offset tech gaps',
      'Engage in limited offensives to provoke negotiations on favorable terms',
    ],
    recommendedDoctrine: 'firstStrike',
    playstyle: 'aggressive',
    difficulty: 'hard',
  },

  'Josip Broz Tito': {
    name: 'Josip Broz Tito',
    title: 'President of Yugoslavia',
    biography:
      'Leader of the Non-Aligned Movement, Tito defied both superpowers while keeping a multiethnic federation unified. His brand of market-socialism, decentralized governance, and strategic balancing made Yugoslavia an independent power broker in the Cold War order.',
    strategyTips: [
      'Maintain non-aligned status to trade with both blocs and gather intel',
      'Use diplomatic flexibility to mediate conflicts for strategic rewards',
      'Balance military investments across services to stay adaptable',
      'Quell internal unrest quickly to preserve federation stability',
    ],
    recommendedDoctrine: 'detente',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Gamal Abdel Nasser': {
    name: 'Gamal Abdel Nasser',
    title: 'President of the United Arab Republic (Egypt)',
    biography:
      'Champion of Arab nationalism, Nasser nationalized the Suez Canal, forged the United Arab Republic, and positioned Cairo as the voice of anti-colonialism. Balancing Soviet aid with regional ambitions, he pursued modernization and charismatic leadership to reshape the Middle East.',
    strategyTips: [
      'Control strategic waterways and chokepoints to project influence',
      'Invest in infrastructure to support rapid mobilization in crises',
      'Cultivate regional alliances to deter foreign intervention',
      'Blend propaganda and reform to keep domestic factions aligned',
    ],
    recommendedDoctrine: 'firstStrike',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Jawaharlal Nehru': {
    name: 'Jawaharlal Nehru',
    title: 'Prime Minister of India',
    biography:
      'Nehru guided newly independent India with a vision of secular democracy, state-led development, and Non-Aligned leadership. While wary of militarism, he built a capable defense to guard against regional threats and championed peaceful coexistence on the world stage.',
    strategyTips: [
      'Invest in science and education to unlock long-term technological advantages',
      'Use diplomatic conferences to expand soft power without provoking rivals',
      'Maintain a strong defensive perimeter to deter incursions on multiple fronts',
      'Balance domestic reforms with selective military modernization',
    ],
    recommendedDoctrine: 'defense',
    playstyle: 'balanced',
    difficulty: 'easy',
  },

  'Konrad Adenauer': {
    name: 'Konrad Adenauer',
    title: 'Chancellor of the Federal Republic of Germany',
    biography:
      'Adenauer rebuilt West Germany from the ruins of war, anchoring it firmly within the Western alliance while pursuing reconciliation with former enemies. His focus on economic revival and NATO integration created a stable bulwark against Soviet influence in Europe.',
    strategyTips: [
      'Prioritize economic recovery to unlock powerful industrial bonuses',
      'Strengthen NATO ties for mutual defense and technology sharing',
      'Deploy counterintelligence to guard against infiltration and subversion',
      'Invest in missile defense to shield industrial heartlands',
    ],
    recommendedDoctrine: 'defense',
    playstyle: 'defensive',
    difficulty: 'easy',
  },

  'Willy Brandt': {
    name: 'Willy Brandt',
    title: 'Chancellor of the Federal Republic of Germany',
    biography:
      'Brandt\'s Ostpolitik thawed relations with Eastern Europe through treaties and human-centered diplomacy. While maintaining NATO commitments, he leveraged dialogue and economic engagement to ease Cold War tensions and open new avenues for reunification.',
    strategyTips: [
      'Use détente initiatives to lower threat levels and gain diplomatic capital',
      'Invest in cultural exchanges to improve relationships with rivals',
      'Maintain a credible defense to negotiate from a position of strength',
      'Capitalize on reduced tensions to reallocate spending into tech and welfare',
    ],
    recommendedDoctrine: 'detente',
    playstyle: 'diplomatic',
    difficulty: 'medium',
  },

  'Helmut Kohl': {
    name: 'Helmut Kohl',
    title: 'Chancellor of reunified Germany',
    biography:
      'Kohl oversaw the peaceful reunification of East and West Germany, steering Europe through the end of the Cold War. His tenure emphasized fiscal discipline, deep NATO cooperation, and the creation of the European Union\'s single market.',
    strategyTips: [
      'Focus on economic integration policies to absorb new territories efficiently',
      'Use strong alliances to back ambitious diplomatic initiatives',
      'Invest in defensive technologies to protect reunified borders',
      'Stagger modernization efforts to avoid overstretch during absorption phases',
    ],
    recommendedDoctrine: 'defense',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'François Mitterrand': {
    name: 'François Mitterrand',
    title: 'President of the French Republic',
    biography:
      'Mitterrand blended socialist reforms with staunch European integration, co-leading the push for the euro and balancing France\'s independent deterrent. His diplomacy harmonized with Germany while asserting France\'s global voice from Africa to the Middle East.',
    strategyTips: [
      'Invest in culture and social programs to keep domestic stability high',
      'Coordinate with allies to unlock joint research and defense projects',
      'Maintain a strategic nuclear deterrent as bargaining leverage',
      'Use intelligence assets to stay proactive in overseas operations',
    ],
    recommendedDoctrine: 'detente',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Sukarno': {
    name: 'Sukarno',
    title: 'President of Indonesia',
    biography:
      'Indonesia\'s founding president championed anti-colonial solidarity through guided democracy and bold regional maneuvers. Sukarno balanced superpower courtship with militant nationalism, seeking to forge a "Third World" axis while commanding vast archipelagic resources.',
    strategyTips: [
      'Control sea lanes and straits to tax trade and project power',
      'Use revolutionary rhetoric to stir uprisings in rival colonies',
      'Develop a mobile military capable of island-hopping operations',
      'Invest in propaganda to offset instability from aggressive moves',
    ],
    recommendedDoctrine: 'firstStrike',
    playstyle: 'aggressive',
    difficulty: 'hard',
  },

  // ============================================================================
  // PARODY LEADERS
  // ============================================================================

  'Ronnie Raygun': {
    name: 'Ronnie Raygun',
    title: 'Former Actor, Nuclear Enthusiast',
    biography:
      'A charismatic former actor turned political leader, Ronnie Raygun believes in "peace through superior firepower." Famous for his Strategic Defense Initiative (nicknamed "Star Wars"), he dreams of making nuclear weapons obsolete through technology. His folksy charm masks a hardline anti-communist stance and willingness to spend vast sums on defense.',
    strategyTips: [
      'Star Wars Defense provides missile immunity - time it perfectly',
      'Build massive missile arsenals while protected',
      'Invest heavily in military research for technological superiority',
      'Use defensive period to prepare devastating counteroffensive',
      'Combine with economic boom for maximum military buildup',
    ],
    recommendedDoctrine: 'Any (Technology-focused)',
    playstyle: 'defensive',
    difficulty: 'easy',
  },

  'Tricky Dick': {
    name: 'Tricky Dick',
    title: 'Master of Covert Operations',
    biography:
      'A paranoid but brilliant political operator, Tricky Dick excels at espionage, surveillance, and dirty tricks. His secretive nature and willingness to use any means necessary make him a formidable opponent. Though scandal often follows in his wake, his strategic mind and ruthless efficiency cannot be denied.',
    strategyTips: [
      'Covert Operation ability provides intel and resources - use frequently',
      'Invest heavily in espionage and cyber warfare capabilities',
      'Steal critical resources from rivals before major operations',
      'Use intel advantage to predict and counter enemy moves',
      'Build deniable operations to avoid diplomatic penalties',
    ],
    recommendedDoctrine: 'Corruption (Espionage and subversion)',
    playstyle: 'defensive',
    difficulty: 'medium',
  },

  'Jimi Farmer': {
    name: 'Jimi Farmer',
    title: 'Peace-Loving Humanitarian',
    biography:
      'A gentle soul who stumbled into politics, Jimi Farmer genuinely wants everyone to get along. His idealistic vision of world peace and human rights often clashes with geopolitical realities. While others see him as naive, his genuine compassion and diplomatic skill have resolved conflicts that brinkmanship only inflamed.',
    strategyTips: [
      'Peace Summit boosts all relationships - build universal alliances',
      'Focus on diplomatic victory through friendship',
      'Use aid and humanitarian actions to build reputation',
      'Form protective alliances early to avoid military confrontation',
      'Trade and cooperation over military buildup',
    ],
    recommendedDoctrine: 'Convergence (Peace through cooperation)',
    playstyle: 'diplomatic',
    difficulty: 'hard',
  },

  'E. Musk Rat': {
    name: 'E. Musk Rat',
    title: 'Visionary Entrepreneur and Chaos Agent',
    biography:
      'An eccentric billionaire industrialist with grand visions of the future, E. Musk Rat revolutionizes industries while maintaining an active social media presence. His ventures range from electric vehicles to space exploration to neural interfaces. Brilliant but erratic, his innovations change the world while his tweets change the news cycle.',
    strategyTips: [
      'Innovation Breakthrough unlocks tech and boosts production',
      'Focus on research and technological advancement',
      'Use economic advantage to fund massive projects',
      'Build production capacity before using ability for maximum benefit',
      'Leverage tech superiority for military and economic dominance',
    ],
    recommendedDoctrine: 'Any (Innovation-focused)',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Donnie Trumpf': {
    name: 'Donnie Trumpf',
    title: 'Master of Media Manipulation',
    biography:
      'A bombastic real estate mogul turned political leader, Donnie Trumpf understands that controlling the narrative is power. His Twitter storms shape public opinion and distract from controversies. Love him or hate him, his ability to dominate media cycles and rally supporters is undeniable. In his world, perception is reality.',
    strategyTips: [
      'Twitter Storm provides propaganda waves - use for public opinion control',
      'Build strong domestic approval to enable aggressive foreign policy',
      'Use media manipulation to shape diplomatic perceptions',
      'Combine with diplomatic actions for amplified effects',
      'Control the narrative to justify controversial actions',
    ],
    recommendedDoctrine: 'Corruption (Media manipulation)',
    playstyle: 'aggressive',
    difficulty: 'easy',
  },

  'Atom Hus-Bomb': {
    name: 'Atom Hus-Bomb',
    title: 'The Apocalypse Enthusiast',
    biography:
      'A militant theocrat who believes nuclear weapons are instruments of divine will, Atom Hus-Bomb sees armageddon as both inevitable and desirable. His fiery rhetoric and willingness to use nuclear weapons make him one of the most dangerous leaders on the world stage. To him, martyrdom is not a risk but a goal.',
    strategyTips: [
      'Nuclear Armageddon launches multiple strikes - target carefully',
      'Build massive nuclear arsenals early game',
      'Accept international isolation for nuclear supremacy',
      'Use ability as game-ending move to eliminate rivals',
      'Pair with defensive capabilities to survive retaliation',
    ],
    recommendedDoctrine: 'Domination (Nuclear supremacy)',
    playstyle: 'aggressive',
    difficulty: 'hard',
  },

  'Krazy Re-Entry': {
    name: 'Krazy Re-Entry',
    title: 'The Unpredictable Wildcard',
    biography:
      'An erratic and impulsive leader whose actions defy prediction or logic, Krazy Re-Entry keeps everyone guessing. His decisions seem random, but there may be method to the madness. Or perhaps not. Allying with him is like befriending a tornado - exciting, dangerous, and likely to end in disaster.',
    strategyTips: [
      'Wild Card ability is completely random - embrace chaos',
      'Build strong economy to survive negative random outcomes',
      'Use ability when losing - nothing to lose, everything to gain',
      'Expect alliances to form and break unpredictably',
      'Adaptability is key - plan for any scenario',
    ],
    recommendedDoctrine: 'Any (Chaos incarnate)',
    playstyle: 'chaotic',
    difficulty: 'extreme',
  },

  'Odd\'n Wild Card': {
    name: 'Odd\'n Wild Card',
    title: 'The Ultimate Gambler',
    biography:
      'A secretive autocrat who treats geopolitics like a high-stakes poker game, Odd\'n Wild Card is willing to bet everything on a coin flip. His all-or-nothing approach has either led to spectacular victories or catastrophic defeats. In his world, fortune favors the bold, and moderation is for cowards.',
    strategyTips: [
      'Ultimate Gambit is a coin flip - use when desperate or ahead',
      'Build strong position before using ability',
      'Prepare for both total victory and complete defeat',
      'Use as game-ending move when conventional victory is impossible',
      'High risk, high reward - not for the faint of heart',
    ],
    recommendedDoctrine: 'Any (All or nothing)',
    playstyle: 'chaotic',
    difficulty: 'extreme',
  },

  'Oil-Stain Lint-Off': {
    name: 'Oil-Stain Lint-Off',
    title: 'The Oligarch',
    biography:
      'A former intelligence officer turned autocrat, Oil-Stain Lint-Off has built a kleptocratic empire through resource extraction and corruption. His vast network of oligarchs and puppet states extends his influence across the globe. Ruthless and calculating, he views nations as assets to be acquired or competitors to be eliminated.',
    strategyTips: [
      'Oligarch Network steals resources from multiple nations',
      'Build vast resource stockpiles through theft',
      'Use espionage to identify wealthy targets',
      'Expand through puppet states and corruption',
      'Maintain deniability while enriching your nation',
    ],
    recommendedDoctrine: 'Corruption (Kleptocracy)',
    playstyle: 'balanced',
    difficulty: 'medium',
  },

  'Ruin Annihilator': {
    name: 'Ruin Annihilator',
    title: 'The Destroyer of Worlds',
    biography:
      'A nihilistic tyrant who believes the world deserves to burn, Ruin Annihilator pursues destruction for its own sake. His scorched earth tactics leave nothing but ashes in their wake. To negotiate with him is pointless - he seeks not conquest but annihilation. The ultimate accelerationist, he wants to watch civilization collapse.',
    strategyTips: [
      'Total Annihilation devastates a nation completely - choose wisely',
      'Use as finishing move against strongest rival',
      'Accept global condemnation for maximum destruction',
      'Build overwhelming military before using ability',
      'Prepare for total war - peace is not an option',
    ],
    recommendedDoctrine: 'Domination (Total destruction)',
    playstyle: 'aggressive',
    difficulty: 'hard',
  },
};

/**
 * Get biography for a leader by name
 */
export function getLeaderBiography(leaderName: string): LeaderBiography | null {
  return LEADER_BIOGRAPHIES[leaderName] || null;
}

/**
 * Get strategy tips for a leader
 */
export function getLeaderStrategyTips(leaderName: string): string[] {
  const bio = LEADER_BIOGRAPHIES[leaderName];
  return bio?.strategyTips || [];
}

/**
 * Get recommended doctrine for a leader
 */
export function getRecommendedDoctrine(leaderName: string): string | undefined {
  const bio = LEADER_BIOGRAPHIES[leaderName];
  return bio?.recommendedDoctrine;
}
