/**
 * Act-based Campaign System Implementation
 * Manages the three-act structure for Great Old Ones campaign
 */

import type {
  ActNumber,
  ActDefinition,
  StoryMission,
  StoryBeat,
  ActCampaignState,
  ActProgressionVote,
  ActUnlockConditions,
  MissionObjective,
} from '../types/actCampaign';
import type { GreatOldOnesState, Doctrine } from '../types/greatOldOnes';
import { addMissionLogEntry } from './greatOldOnesHelpers';

// ============================================================================
// ACT DEFINITIONS
// ============================================================================

/**
 * Act I: The Gathering
 * 7 missions - Establish the Order, recruit, build initial network
 */
const ACT_1: ActDefinition = {
  actNumber: 1,
  name: 'The Gathering',
  description: 'Establish the Order, recruit the inner circle, and perform the first rituals.',

  unlockConditions: {
    previousActComplete: false, // Act 1 starts unlocked
  },

  storyMissions: [
    {
      id: 'founding_vision',
      name: 'The Founding Vision',
      description: 'Experience first contact with an eldritch entity and receive your mission.',
      category: 'establishment',
      actNumber: 1,
      objectives: [
        {
          id: 'receive_vision',
          description: 'Meditate at the ritual site to receive the vision',
          type: 'ritual',
          completed: false,
        },
        {
          id: 'interpret_message',
          description: 'Interpret the cosmic message',
          type: 'choice',
          completed: false,
        },
      ],
      narrative: {
        intro: 'In your dreams, you see it. A vast, ancient presence reaching across the stars. It whispers of power, of transformation, of a new age. You awaken with a single purpose.',
        success: 'The vision is clear. The Great Old Ones have chosen you as their herald. You now understand what must be done.',
        failure: 'The vision fades, leaving only madness and confusion.',
      },
      rewards: {
        eldritchPower: 50,
        unlockedMechanics: ['basic_rituals'],
      },
      branches: [
        {
          id: 'interpret_domination',
          choiceText: 'The entity demands conquest and submission',
          description: 'Interpret the vision as a call for domination',
          consequences: {
            doctrineAffinity: 'domination',
            narrativeFlag: 'interpreted_as_domination',
          },
        },
        {
          id: 'interpret_corruption',
          choiceText: 'The entity seeks subtle infiltration',
          description: 'Interpret the vision as a call for corruption',
          consequences: {
            doctrineAffinity: 'corruption',
            narrativeFlag: 'interpreted_as_corruption',
          },
        },
        {
          id: 'interpret_convergence',
          choiceText: 'The entity offers enlightenment and transcendence',
          description: 'Interpret the vision as a call for convergence',
          consequences: {
            doctrineAffinity: 'convergence',
            narrativeFlag: 'interpreted_as_convergence',
          },
        },
      ],
    },
    {
      id: 'recruit_inner_circle',
      name: 'Recruitment of the Inner Circle',
      description: 'Gather five unique high priest characters to form your council.',
      category: 'establishment',
      actNumber: 1,
      objectives: [
        {
          id: 'recruit_mordecai',
          description: 'Recruit Mordecai Blackwood (Domination)',
          type: 'infiltration',
          completed: false,
        },
        {
          id: 'recruit_lilith',
          description: 'Recruit Lilith Ashford (Corruption)',
          type: 'infiltration',
          completed: false,
        },
        {
          id: 'recruit_thaddeus',
          description: 'Recruit Thaddeus Grey (Convergence)',
          type: 'infiltration',
          completed: false,
        },
      ],
      narrative: {
        intro: 'You cannot accomplish this task alone. Others have sensed the calling. Find them.',
        success: 'The High Priest Council is formed. Three brilliant minds united in cosmic purpose.',
        failure: 'The recruits reject your vision. You remain alone.',
      },
      rewards: {
        councilUnityChange: 30,
        eldritchPower: 25,
      },
      prerequisites: {
        missionsCompleted: ['founding_vision'],
      },
    },
    {
      id: 'first_blood_ritual',
      name: 'First Blood Ritual',
      description: 'Perform your first major working to establish credibility and power.',
      category: 'establishment',
      actNumber: 1,
      objectives: [
        {
          id: 'gather_components',
          description: 'Gather ritual components',
          type: 'harvest',
          target: { sanityFragments: 50 },
          completed: false,
        },
        {
          id: 'perform_ritual',
          description: 'Perform the Blood Moon ritual',
          type: 'ritual',
          completed: false,
        },
      ],
      narrative: {
        intro: 'Power requires sacrifice. Tonight, under the full moon, you will perform the first true ritual of the Order.',
        success: 'The ritual succeeds. Eldritch power surges through you. The entity acknowledges your devotion.',
        failure: 'The ritual fails catastrophically. The backlash costs you dearly.',
      },
      rewards: {
        eldritchPower: 100,
        sanityFragments: -50,
        corruptionBonus: 5,
        veilChange: -5,
      },
      prerequisites: {
        missionsCompleted: ['recruit_inner_circle'],
        minSanityFragments: 50,
      },
    },
    {
      id: 'investigator_appears',
      name: 'The Investigator Appears',
      description: 'A detective begins investigating strange occurrences. You must deal with them.',
      category: 'flashpoint',
      actNumber: 1,
      objectives: [
        {
          id: 'identify_threat',
          description: 'Identify the investigator tracking you',
          type: 'infiltration',
          completed: false,
        },
        {
          id: 'choose_response',
          description: 'Decide how to handle the investigator',
          type: 'choice',
          completed: false,
        },
      ],
      narrative: {
        intro: 'Detective Sarah Chen has been asking questions. She knows too much. How will you respond?',
        success: 'The investigator threat is neutralized... for now.',
        failure: 'The investigator escapes with evidence. Your operations are exposed.',
      },
      rewards: {
        veilChange: 5,
      },
      branches: [
        {
          id: 'silence_investigator',
          choiceText: 'Silence them permanently',
          description: 'Eliminate the investigator',
          consequences: {
            veilChange: -10,
            corruptionChange: 5,
            doctrineAffinity: 'domination',
            narrativeFlag: 'chen_eliminated',
          },
        },
        {
          id: 'corrupt_investigator',
          choiceText: 'Convert them to the Order',
          description: 'Show them the truth and recruit them',
          consequences: {
            councilUnityChange: 10,
            corruptionChange: 3,
            doctrineAffinity: 'corruption',
            narrativeFlag: 'chen_recruited',
          },
        },
        {
          id: 'mislead_investigator',
          choiceText: 'Feed them false leads',
          description: 'Redirect their investigation away from the Order',
          consequences: {
            veilChange: 5,
            doctrineAffinity: 'corruption',
            narrativeFlag: 'chen_misled',
          },
        },
      ],
      prerequisites: {
        missionsCompleted: ['first_blood_ritual'],
      },
    },
  ],

  proceduralMissionCount: 3,

  storyBeats: [
    {
      id: 'first_cultist_recruited',
      name: 'First Converts',
      description: 'Your first cultist cells are established.',
      trigger: {
        type: 'resource_threshold',
        conditions: {
          corruption: 10,
        },
      },
      narrative: {
        title: 'The Faithful Gather',
        body: 'Word of your power spreads in whispers. The desperate, the curious, the ambitious—they come seeking truth. Your first converts pledge themselves to the cause.',
      },
      effects: {
        councilUnityChange: 5,
      },
      triggered: false,
    },
    {
      id: 'doctrine_selected',
      name: 'The Path is Chosen',
      description: 'The Order commits to a doctrine.',
      trigger: {
        type: 'event',
        conditions: {},
      },
      narrative: {
        title: 'A Sacred Oath',
        body: 'The High Priest Council convenes. After intense debate, a path forward is chosen. The Order now has direction and purpose.',
      },
      effects: {
        councilUnityChange: 10,
      },
      triggered: false,
    },
  ],
};

/**
 * Act II: The Awakening
 * 9 missions - Major summonings, infiltrations, public manifestations
 */
const ACT_2: ActDefinition = {
  actNumber: 2,
  name: 'The Awakening',
  description: 'Escalate operations. Summon powerful entities, infiltrate governments, and spread madness.',

  unlockConditions: {
    previousActComplete: true,
    minCorruption: 30,
    minCorruptedRegions: {
      count: 3,
      corruptionThreshold: 30,
    },
    eldritchPowerStreak: {
      minPower: 100,
      consecutiveTurns: 5,
    },
    requiresCouncilVote: true,
  },

  storyMissions: [
    {
      id: 'first_manifestation',
      name: 'The First Manifestation',
      description: 'Successfully summon an entity visible to the public. Trigger a media frenzy.',
      category: 'flashpoint',
      actNumber: 2,
      objectives: [
        {
          id: 'prepare_summoning',
          description: 'Accumulate power for major summoning',
          type: 'ritual',
          target: { eldritchPower: 200 },
          completed: false,
        },
        {
          id: 'perform_summoning',
          description: 'Summon a Horror-tier entity publicly',
          type: 'summoning',
          target: { entityTier: 'horror' },
          completed: false,
        },
      ],
      narrative: {
        intro: 'The time for shadows has passed. Tonight, the world will witness the truth.',
        success: 'The entity manifests in the city center. Thousands witness it. Chaos erupts. The world will never be the same.',
        failure: 'The summoning fails. The entity tears through reality uncontrolled, causing devastation.',
      },
      rewards: {
        corruptionBonus: 20,
        veilChange: -30,
      },
      prerequisites: {
        minCorruption: 30,
      },
    },
    {
      id: 'great_schism',
      name: 'The Great Schism',
      description: 'Internal conflict threatens to split the Order. Resolve the crisis.',
      category: 'flashpoint',
      actNumber: 2,
      objectives: [
        {
          id: 'address_schism',
          description: 'Address the council schism',
          type: 'choice',
          completed: false,
        },
      ],
      narrative: {
        intro: 'The High Priests disagree on methods. Mordecai demands more aggression. Lilith counsels patience. Thaddeus speaks of a third way. The Order is fracturing.',
        success: 'Unity is restored, though at a cost. The Order survives.',
        failure: 'The Order splinters. Loyalists abandon you.',
      },
      rewards: {
        councilUnityChange: -20,
      },
      branches: [
        {
          id: 'side_with_domination',
          choiceText: 'Side with Mordecai - Escalate aggression',
          description: 'Embrace the path of domination',
          consequences: {
            doctrineAffinity: 'domination',
            councilUnityChange: -10,
            corruptionChange: 10,
          },
        },
        {
          id: 'side_with_corruption',
          choiceText: 'Side with Lilith - Maintain subtlety',
          description: 'Embrace the path of corruption',
          consequences: {
            doctrineAffinity: 'corruption',
            veilChange: 10,
          },
        },
        {
          id: 'side_with_convergence',
          choiceText: 'Side with Thaddeus - Seek enlightenment',
          description: 'Embrace the path of convergence',
          consequences: {
            doctrineAffinity: 'convergence',
            councilUnityChange: 5,
          },
        },
      ],
    },
    {
      id: 'celebrity_convert',
      name: 'The Celebrity Convert',
      description: 'A high-profile public figure joins the Order, providing massive influence.',
      category: 'escalation',
      actNumber: 2,
      objectives: [
        {
          id: 'identify_target',
          description: 'Identify vulnerable celebrity',
          type: 'infiltration',
          completed: false,
        },
        {
          id: 'convert_celebrity',
          description: 'Convert the celebrity to the Order',
          type: 'corruption',
          completed: false,
        },
      ],
      narrative: {
        intro: 'Renowned tech billionaire Marcus Chen is searching for meaning. This is your opportunity.',
        success: 'Marcus Chen publicly endorses "cosmic enlightenment philosophy." Millions of followers are exposed to your ideas.',
        failure: 'Chen rejects your overtures and goes public about the cult. Investigations intensify.',
      },
      rewards: {
        corruptionBonus: 15,
        councilUnityChange: 10,
        veilChange: -10,
      },
    },
    {
      id: 'investigator_strikes',
      name: 'The Investigator Strikes',
      description: 'A major raid on a ritual site. Defend or evacuate.',
      category: 'flashpoint',
      actNumber: 2,
      objectives: [
        {
          id: 'respond_to_raid',
          description: 'Respond to investigator raid',
          type: 'choice',
          completed: false,
        },
      ],
      narrative: {
        intro: 'Government agents storm your temple compound. You have seconds to decide.',
        success: 'You handle the raid effectively. Your operations continue.',
        failure: 'The raid devastates your infrastructure. Years of work destroyed.',
      },
      rewards: {},
      branches: [
        {
          id: 'defend_site',
          choiceText: 'Defend with summoned entities',
          description: 'Use your power to fight back',
          consequences: {
            veilChange: -20,
            corruptionChange: 10,
            councilUnityChange: -5,
          },
        },
        {
          id: 'evacuate_site',
          choiceText: 'Evacuate and preserve secrecy',
          description: 'Abandon the site to protect the Order',
          consequences: {
            veilChange: 5,
            councilUnityChange: -10,
          },
        },
        {
          id: 'false_flag',
          choiceText: 'Frame a rival organization',
          description: 'Use misdirection to blame others',
          consequences: {
            veilChange: 10,
            corruptionChange: 5,
          },
        },
      ],
    },
    {
      id: 'nightmare_plague',
      name: 'The Nightmare Plague',
      description: 'Unleash a mass sanity event affecting an entire city/region.',
      category: 'escalation',
      actNumber: 2,
      objectives: [
        {
          id: 'select_target_region',
          description: 'Select target region for nightmare plague',
          type: 'choice',
          completed: false,
        },
        {
          id: 'perform_dream_ritual',
          description: 'Perform mass dream invasion ritual',
          type: 'ritual',
          target: { eldritchPower: 150 },
          completed: false,
        },
      ],
      narrative: {
        intro: 'Tonight, an entire city will share the same nightmare. When they wake, they will be changed.',
        success: 'The nightmare spreads like wildfire. Asylum admissions skyrocket. The region descends into paranoia.',
        failure: 'The ritual backfires, affecting your own cultists. Madness spreads uncontrolled.',
      },
      rewards: {
        corruptionBonus: 25,
        sanityFragments: 200,
        veilChange: -15,
      },
    },
  ],

  proceduralMissionCount: 4,

  storyBeats: [
    {
      id: 'media_frenzy',
      name: 'Media Frenzy',
      description: 'Media coverage of supernatural events explodes.',
      trigger: {
        type: 'resource_threshold',
        conditions: {
          veilIntegrity: 60,
        },
      },
      narrative: {
        title: 'The World Takes Notice',
        body: 'News networks scramble to cover unexplained phenomena. Scientists offer rational explanations. Conspiracy theorists run wild. Truth becomes impossible to distinguish from fiction.',
      },
      effects: {
        corruptionChange: 10,
        veilChange: -5,
      },
      triggered: false,
    },
    {
      id: 'rival_cult_emerges',
      name: 'Rival Cult',
      description: 'Another cult emerges, serving a different Old One.',
      trigger: {
        type: 'turn_threshold',
        conditions: {
          turn: 20,
        },
      },
      narrative: {
        title: 'Rival Awakening',
        body: 'You are not alone. Intelligence reports suggest another cult has begun summoning rituals. They serve a different entity. Competition for cosmic favor has begun.',
      },
      effects: {
        spawnRivalCult: true,
      },
      triggered: false,
    },
  ],
};

/**
 * Act III: The Convergence
 * 6 missions + branching finale
 */
const ACT_3: ActDefinition = {
  actNumber: 3,
  name: 'The Convergence',
  description: 'The endgame approaches. Prepare for the final awakening or face total defeat.',

  unlockConditions: {
    previousActComplete: true,
    minCorruption: 50,
    requiresCouncilVote: true,
    requiresDynamicEvent: ['investigator_alliance', 'internal_schism'],
    requiresCrisisResolution: true,
  },

  storyMissions: [
    {
      id: 'truth_revealed',
      name: 'The Truth Revealed',
      description: 'Learn the actual nature of the entities you serve.',
      category: 'flashpoint',
      actNumber: 3,
      objectives: [
        {
          id: 'commune_with_entity',
          description: 'Perform deep communion ritual',
          type: 'ritual',
          target: { eldritchPower: 300 },
          completed: false,
        },
      ],
      narrative: {
        intro: 'You have served faithfully. Now, the entity will reveal its true nature to you. Are you prepared for the truth?',
        success: 'The truth shatters everything you believed. But you cannot turn back now.',
        failure: 'The revelation breaks your mind. You emerge changed, uncertain.',
      },
      rewards: {
        sanityFragments: -100,
        eldritchPower: 200,
      },
    },
    {
      id: 'final_sacrifice',
      name: 'The Final Sacrifice',
      description: 'A choice: sacrifice your inner circle for power, or find another way.',
      category: 'flashpoint',
      actNumber: 3,
      objectives: [
        {
          id: 'make_choice',
          description: 'Choose the path forward',
          type: 'choice',
          completed: false,
        },
      ],
      narrative: {
        intro: 'The ritual requires immense power. The traditional source is willing sacrifice. Will you ask your most loyal priests to give their lives?',
        success: 'The choice is made. There is no turning back.',
        failure: 'Hesitation dooms you. The ritual fails.',
      },
      rewards: {},
      branches: [
        {
          id: 'sacrifice_circle',
          choiceText: 'Perform the sacrifice',
          description: 'Sacrifice the High Priest Council',
          consequences: {
            councilUnityChange: -100,
            narrativeFlag: 'council_sacrificed',
          },
        },
        {
          id: 'alternative_power',
          choiceText: 'Seek alternative power source',
          description: 'Find another way to power the ritual',
          consequences: {
            narrativeFlag: 'council_spared',
          },
        },
      ],
    },
    {
      id: 'global_response',
      name: 'The Global Response',
      description: 'Face coordinated international counter-offensive.',
      category: 'flashpoint',
      actNumber: 3,
      objectives: [
        {
          id: 'survive_counteroffensive',
          description: 'Defend against coordinated attacks',
          type: 'choice',
          completed: false,
        },
      ],
      narrative: {
        intro: 'The world governments have united. A massive coordinated strike targets all known Order facilities simultaneously.',
        success: 'You weather the storm. Your network survives.',
        failure: 'The offensive shatters your organization. You are driven underground.',
      },
      rewards: {},
    },
    {
      id: 'rival_gambit',
      name: "The Rival's Gambit",
      description: 'Competing cult attempts to awaken their patron first.',
      category: 'flashpoint',
      actNumber: 3,
      objectives: [
        {
          id: 'counter_rival',
          description: 'Sabotage rival cult awakening',
          type: 'infiltration',
          completed: false,
        },
      ],
      narrative: {
        intro: 'The rival cult has accelerated their timeline. They will attempt to awaken Hastur in 72 hours. If they succeed first, your entity may never rise.',
        success: 'The rival ritual is disrupted. Their cult falls into chaos. The path is clear for your awakening.',
        failure: 'Hastur stirs. Your entity withdraws, unwilling to face a rival. All is lost.',
      },
      rewards: {
        corruptionBonus: 20,
      },
    },
  ],

  proceduralMissionCount: 2,

  finaleOptions: {
    domination: {
      id: 'finale_domination',
      name: 'The Stars Are Right',
      description: 'Awaken Cthulhu from R\'lyeh. Let the Great Old One walk the Earth.',
      category: 'finale',
      actNumber: 3,
      objectives: [
        {
          id: 'awaken_cthulhu',
          description: 'Complete the awakening ritual',
          type: 'summoning',
          target: { eldritchPower: 500, entityTier: 'great_old_one' },
          completed: false,
        },
      ],
      narrative: {
        intro: 'Ph\'nglui mglw\'nafh Cthulhu R\'lyeh wgah\'nagl fhtagn. In his house at R\'lyeh, dead Cthulhu waits dreaming. Tonight, he awakens.',
        success: 'The ocean boils. R\'lyeh rises from the depths. The Great Old One emerges. Humanity kneels or perishes. Your vision is complete.',
        failure: 'The ritual is incomplete. Cthulhu stirs but does not wake. He will slumber for another age.',
      },
      rewards: {
        corruptionBonus: 100,
      },
    },
    corruption: {
      id: 'finale_corruption',
      name: 'The New Order',
      description: 'Corrupted UN votes to serve the Old Ones. Shadow empire achieved.',
      category: 'finale',
      actNumber: 3,
      objectives: [
        {
          id: 'secure_un_vote',
          description: 'Ensure UN vote passes',
          type: 'corruption',
          target: { corruptionIncrease: 90 },
          completed: false,
        },
      ],
      narrative: {
        intro: 'The UN General Assembly convenes for an emergency session. Your puppet delegates will propose the Cosmic Enlightenment Treaty. If it passes, the world officially serves the Order.',
        success: 'The treaty passes. World governments pledge to facilitate the awakening. Democracy has voted for its own transcendence. Your shadow empire is complete.',
        failure: 'The vote fails. Your network is exposed. Governments turn against you.',
      },
      rewards: {
        corruptionBonus: 100,
      },
    },
    convergence: {
      id: 'finale_convergence',
      name: 'The Threshold',
      description: 'Humanity voluntarily crosses into cosmic enlightenment.',
      category: 'finale',
      actNumber: 3,
      objectives: [
        {
          id: 'open_threshold',
          description: 'Open the cosmic threshold',
          type: 'ritual',
          target: { eldritchPower: 400 },
          completed: false,
        },
      ],
      narrative: {
        intro: 'Millions have embraced the truth. They gather at sites around the world, ready to transcend. Tonight, you will open the threshold and lead them across.',
        success: 'The threshold opens. Millions willingly cross over, merging with cosmic consciousness. A new hybrid species emerges. Humanity has evolved.',
        failure: 'The threshold collapses. Those who crossed are lost between realities. Humanity remains unchanged, traumatized.',
      },
      rewards: {
        corruptionBonus: 100,
      },
    },
  },

  storyBeats: [
    {
      id: 'point_of_no_return',
      name: 'Point of No Return',
      description: 'The final act begins. There is no turning back.',
      trigger: {
        type: 'turn_threshold',
        conditions: {
          turn: 30,
        },
      },
      narrative: {
        title: 'The Final Hour',
        body: 'Events have been set in motion that cannot be stopped. The awakening is inevitable. The only question is: who will control it?',
      },
      effects: {
        veilChange: -20,
      },
      triggered: false,
    },
  ],
};

export const ACT_DEFINITIONS: Record<ActNumber, ActDefinition> = {
  1: ACT_1,
  2: ACT_2,
  3: ACT_3,
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize act campaign state
 */
export function initializeActCampaignState(): ActCampaignState {
  return {
    currentAct: 1,
    completedStoryMissions: [],
    proceduralMissionsCompleted: { 1: 0, 2: 0, 3: 0 },
    activeStoryMission: null,
    actStatus: {
      1: { unlocked: true, conditionsMet: true, voteStatus: 'not_required' },
      2: { unlocked: false, conditionsMet: false, voteStatus: 'not_required' },
      3: { unlocked: false, conditionsMet: false, voteStatus: 'not_required' },
    },
    triggeredStoryBeats: [],
    narrativeFlags: [],
    pendingVotes: [],
    eldritchPowerStreak: {
      currentStreak: 0,
      lastTurnPower: 0,
    },
    triggeredEvents: [],
  };
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Check if conditions for act unlock are met
 */
export function checkActUnlockConditions(
  actNumber: ActNumber,
  greatOldOnesState: GreatOldOnesState,
  actState: ActCampaignState
): boolean {
  const actDef = ACT_DEFINITIONS[actNumber];
  const conditions = actDef.unlockConditions;

  // Check if previous act is complete
  if (conditions.previousActComplete && actNumber > 1) {
    const previousAct = (actNumber - 1) as ActNumber;
    const previousActDef = ACT_DEFINITIONS[previousAct];
    const completedPreviousStory = previousActDef.storyMissions.every(m =>
      actState.completedStoryMissions.includes(m.id)
    );
    const completedPreviousProcedural =
      actState.proceduralMissionsCompleted[previousAct] >= previousActDef.proceduralMissionCount;

    if (!completedPreviousStory || !completedPreviousProcedural) {
      return false;
    }
  }

  // Check corruption threshold
  if (conditions.minCorruption && greatOldOnesState.resources.corruptionIndex < conditions.minCorruption) {
    return false;
  }

  // Check corrupted regions
  if (conditions.minCorruptedRegions) {
    const corruptedCount = greatOldOnesState.regions.filter(
      r => r.corruption >= conditions.minCorruptedRegions!.corruptionThreshold
    ).length;
    if (corruptedCount < conditions.minCorruptedRegions.count) {
      return false;
    }
  }

  // Check eldritch power streak
  if (conditions.eldritchPowerStreak) {
    if (actState.eldritchPowerStreak.currentStreak < conditions.eldritchPowerStreak.consecutiveTurns) {
      return false;
    }
  }

  // Check dynamic events
  if (conditions.requiresDynamicEvent) {
    const hasAllEvents = conditions.requiresDynamicEvent.every(event =>
      actState.triggeredEvents.includes(event)
    );
    if (!hasAllEvents) {
      return false;
    }
  }

  return true;
}

/**
 * Update act campaign state each turn
 */
export function updateActCampaignState(
  greatOldOnesState: GreatOldOnesState,
  actState: ActCampaignState,
  turn: number
): ActCampaignState {
  const updated = { ...actState };

  // Update eldritch power streak
  if (greatOldOnesState.resources.eldritchPower >= 100) {
    if (greatOldOnesState.resources.eldritchPower >= updated.eldritchPowerStreak.lastTurnPower) {
      updated.eldritchPowerStreak.currentStreak++;
    } else {
      updated.eldritchPowerStreak.currentStreak = 1;
    }
  } else {
    updated.eldritchPowerStreak.currentStreak = 0;
  }
  updated.eldritchPowerStreak.lastTurnPower = greatOldOnesState.resources.eldritchPower;

  // Check act unlock conditions
  ([2, 3] as ActNumber[]).forEach(actNum => {
    if (!updated.actStatus[actNum].unlocked) {
      const conditionsMet = checkActUnlockConditions(actNum, greatOldOnesState, updated);
      updated.actStatus[actNum].conditionsMet = conditionsMet;

      // If conditions met and vote required, initiate vote
      if (conditionsMet && ACT_DEFINITIONS[actNum].unlockConditions.requiresCouncilVote) {
        if (updated.actStatus[actNum].voteStatus === 'not_required') {
          const vote = initiateActProgressionVote(actNum, greatOldOnesState);
          updated.pendingVotes.push(vote);
          updated.actStatus[actNum].voteStatus = 'pending';
        }
      }

      // If conditions met and no vote required, unlock automatically
      if (conditionsMet && !ACT_DEFINITIONS[actNum].unlockConditions.requiresCouncilVote) {
        updated.actStatus[actNum].unlocked = true;
        if (updated.currentAct < actNum) {
          updated.currentAct = actNum;
        }
      }
    }
  });

  // Check and trigger story beats
  const currentActDef = ACT_DEFINITIONS[updated.currentAct];
  currentActDef.storyBeats.forEach(beat => {
    if (!updated.triggeredStoryBeats.includes(beat.id)) {
      if (checkStoryBeatTrigger(beat, greatOldOnesState, updated, turn)) {
        updated.triggeredStoryBeats.push(beat.id);
        // Apply effects
        applyStoryBeatEffects(beat, greatOldOnesState);
      }
    }
  });

  return updated;
}

/**
 * Check if a story beat should trigger
 */
function checkStoryBeatTrigger(
  beat: StoryBeat,
  gooState: GreatOldOnesState,
  actState: ActCampaignState,
  turn: number
): boolean {
  const { trigger } = beat;

  switch (trigger.type) {
    case 'mission_complete':
      if (trigger.conditions.missionId) {
        return actState.completedStoryMissions.includes(trigger.conditions.missionId);
      }
      return false;

    case 'turn_threshold':
      return turn >= (trigger.conditions.turn || 0);

    case 'resource_threshold':
      if (trigger.conditions.corruption !== undefined) {
        return gooState.resources.corruptionIndex >= trigger.conditions.corruption;
      }
      if (trigger.conditions.veilIntegrity !== undefined) {
        return gooState.veil.integrity <= trigger.conditions.veilIntegrity;
      }
      return false;

    case 'event':
      return true; // Event-based triggers are handled separately

    default:
      return false;
  }
}

/**
 * Apply story beat effects to game state
 */
function applyStoryBeatEffects(beat: StoryBeat, gooState: GreatOldOnesState): void {
  if (!beat.effects) return;

  if (beat.effects.corruptionChange) {
    gooState.resources.corruptionIndex = Math.max(
      0,
      Math.min(100, gooState.resources.corruptionIndex + beat.effects.corruptionChange)
    );
  }

  if (beat.effects.veilChange) {
    gooState.veil.integrity = Math.max(
      0,
      Math.min(100, gooState.veil.integrity + beat.effects.veilChange)
    );
    gooState.resources.veilIntegrity = gooState.veil.integrity;
  }

  if (beat.effects.councilUnityChange) {
    gooState.council.unity = Math.max(
      0,
      Math.min(100, gooState.council.unity + beat.effects.councilUnityChange)
    );
  }

  // Log the story beat
  addMissionLogEntry(gooState, {
    category: 'event',
    title: beat.name,
    description: beat.narrative.body,
    corruptionChange: beat.effects.corruptionChange,
    veilChange: beat.effects.veilChange,
  });
}

/**
 * Initiate council vote for act progression
 */
function initiateActProgressionVote(
  actNumber: ActNumber,
  gooState: GreatOldOnesState
): ActProgressionVote {
  // Calculate votes based on priest doctrine affinity and loyalty
  const votes = gooState.council.members.map(priest => {
    // Priests vote based on loyalty and whether their doctrine aligns
    const loyaltyThreshold = 50;
    const voteFor = priest.loyalty >= loyaltyThreshold;

    return {
      priestId: priest.id,
      vote: (voteFor ? 'for' : 'against') as 'for' | 'against' | 'abstain',
      reason: voteFor
        ? `${priest.name} supports progressing to the next act`
        : `${priest.name} believes we are not ready`,
    };
  });

  return {
    actNumber,
    status: 'pending',
    votes,
    requirements: {
      unanimousRequired: false,
      majorityRequired: 0.67, // 2/3 majority
      minCouncilUnity: 40,
    },
    emergencyOverrideAvailable: true,
    overrideCost: {
      eldritchPower: 100,
      councilUnityLoss: 30,
    },
  };
}

/**
 * Resolve council vote
 */
export function resolveActProgressionVote(
  vote: ActProgressionVote,
  gooState: GreatOldOnesState,
  actState: ActCampaignState,
  useOverride: boolean = false
): boolean {
  if (useOverride && vote.emergencyOverrideAvailable) {
    // Apply override costs
    if (vote.overrideCost) {
      gooState.resources.eldritchPower -= vote.overrideCost.eldritchPower;
      gooState.council.unity -= vote.overrideCost.councilUnityLoss;
    }

    vote.status = 'passed';
    actState.actStatus[vote.actNumber].voteStatus = 'passed';
    actState.actStatus[vote.actNumber].unlocked = true;
    if (actState.currentAct < vote.actNumber) {
      actState.currentAct = vote.actNumber;
    }

    addMissionLogEntry(gooState, {
      category: 'event',
      title: 'Emergency Override Used',
      description: `Act ${vote.actNumber} unlocked through emergency council override. Unity suffers.`,
      veilChange: -10,
    });

    return true;
  }

  // Calculate vote outcome
  const totalVotes = vote.votes.length;
  const votesFor = vote.votes.filter(v => v.vote === 'for').length;
  const majority = totalVotes > 0 ? votesFor / totalVotes : 0;

  let passed = false;

  if (vote.requirements.unanimousRequired && votesFor === totalVotes) {
    passed = true;
  } else if (vote.requirements.majorityRequired && majority >= vote.requirements.majorityRequired) {
    passed = true;
  }

  // Check council unity threshold
  if (vote.requirements.minCouncilUnity && gooState.council.unity < vote.requirements.minCouncilUnity) {
    passed = false;
  }

  vote.status = passed ? 'passed' : 'failed';
  actState.actStatus[vote.actNumber].voteStatus = vote.status;

  if (passed) {
    actState.actStatus[vote.actNumber].unlocked = true;
    if (actState.currentAct < vote.actNumber) {
      actState.currentAct = vote.actNumber;
    }

    addMissionLogEntry(gooState, {
      category: 'event',
      title: `Act ${vote.actNumber} Unlocked`,
      description: `The High Priest Council has voted to proceed to ${ACT_DEFINITIONS[vote.actNumber].name}.`,
      councilUnityChange: 10,
    });
  } else {
    addMissionLogEntry(gooState, {
      category: 'event',
      title: 'Council Vote Failed',
      description: `The High Priest Council rejected the proposal to advance to Act ${vote.actNumber}. Requirements must be met before re-voting.`,
      councilUnityChange: -5,
    });
  }

  return passed;
}

/**
 * Get available story missions for current act
 */
export function getAvailableStoryMissions(
  actState: ActCampaignState,
  gooState: GreatOldOnesState
): StoryMission[] {
  const currentActDef = ACT_DEFINITIONS[actState.currentAct];

  return currentActDef.storyMissions.filter(mission => {
    // Check if already completed
    if (actState.completedStoryMissions.includes(mission.id)) {
      return false;
    }

    // Check prerequisites
    if (mission.prerequisites) {
      if (mission.prerequisites.missionsCompleted) {
        const hasCompleted = mission.prerequisites.missionsCompleted.every(id =>
          actState.completedStoryMissions.includes(id)
        );
        if (!hasCompleted) return false;
      }

      if (mission.prerequisites.minCorruption !== undefined) {
        if (gooState.resources.corruptionIndex < mission.prerequisites.minCorruption) {
          return false;
        }
      }

      if (mission.prerequisites.minSanityFragments !== undefined) {
        if (gooState.resources.sanityFragments < mission.prerequisites.minSanityFragments) {
          return false;
        }
      }

      if (mission.prerequisites.doctrineRequired) {
        if (gooState.doctrine !== mission.prerequisites.doctrineRequired) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Complete a story mission
 */
export function completeStoryMission(
  missionId: string,
  actState: ActCampaignState,
  gooState: GreatOldOnesState,
  chosenBranchId?: string
): void {
  const currentActDef = ACT_DEFINITIONS[actState.currentAct];
  const mission = currentActDef.storyMissions.find(m => m.id === missionId);

  if (!mission) return;

  // Mark as completed
  actState.completedStoryMissions.push(missionId);
  actState.activeStoryMission = null;

  // Apply rewards
  if (mission.rewards) {
    if (mission.rewards.sanityFragments) {
      gooState.resources.sanityFragments += mission.rewards.sanityFragments;
    }
    if (mission.rewards.eldritchPower) {
      gooState.resources.eldritchPower += mission.rewards.eldritchPower;
    }
    if (mission.rewards.corruptionBonus) {
      gooState.resources.corruptionIndex = Math.min(
        100,
        gooState.resources.corruptionIndex + mission.rewards.corruptionBonus
      );
    }
    if (mission.rewards.councilUnityChange) {
      gooState.council.unity = Math.max(
        0,
        Math.min(100, gooState.council.unity + mission.rewards.councilUnityChange)
      );
    }
    if (mission.rewards.veilChange) {
      gooState.veil.integrity = Math.max(
        0,
        Math.min(100, gooState.veil.integrity + mission.rewards.veilChange)
      );
      gooState.resources.veilIntegrity = gooState.veil.integrity;
    }
  }

  // Apply branch consequences if a choice was made
  if (chosenBranchId && mission.branches) {
    const branch = mission.branches.find(b => b.id === chosenBranchId);
    if (branch) {
      if (branch.consequences.corruptionChange) {
        gooState.resources.corruptionIndex = Math.min(
          100,
          gooState.resources.corruptionIndex + branch.consequences.corruptionChange
        );
      }
      if (branch.consequences.veilChange) {
        gooState.veil.integrity = Math.max(
          0,
          Math.min(100, gooState.veil.integrity + branch.consequences.veilChange)
        );
        gooState.resources.veilIntegrity = gooState.veil.integrity;
      }
      if (branch.consequences.councilUnityChange) {
        gooState.council.unity = Math.max(
          0,
          Math.min(100, gooState.council.unity + branch.consequences.councilUnityChange)
        );
      }
      if (branch.consequences.narrativeFlag) {
        actState.narrativeFlags.push(branch.consequences.narrativeFlag);
      }
    }
  }

  // Log completion
  addMissionLogEntry(gooState, {
    category: 'event',
    title: `Mission Complete: ${mission.name}`,
    description: mission.narrative.success,
    corruptionChange: mission.rewards.corruptionBonus,
    veilChange: mission.rewards.veilChange,
  });
}
