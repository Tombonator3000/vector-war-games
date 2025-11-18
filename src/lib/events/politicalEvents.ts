export interface GovernanceDelta {
  morale?: number;
  publicOpinion?: number;
  electionTimer?: number;
  cabinetApproval?: number;
  instability?: number;
  production?: number;
  intel?: number;
  uranium?: number;
}

export interface PoliticalEventOutcome {
  id: string;
  description: string;
  effects: GovernanceDelta;
  chance?: number;
}

export interface PoliticalEventOption {
  id: string;
  label: string;
  description: string;
  outcomes: PoliticalEventOutcome[];
}

export type PoliticalEventThresholdKey =
  | 'moraleBelow'
  | 'publicOpinionBelow'
  | 'cabinetApprovalBelow';

export interface PoliticalEventDefinition {
  id: string;
  title: string;
  summary: string;
  severity: 'routine' | 'serious' | 'critical';
  cooldownTurns?: number;
  conditions?: {
    moraleBelow?: number;
    publicOpinionBelow?: number;
    cabinetApprovalBelow?: number;
    electionImminent?: boolean;
    minTurn?: number;
    requireAny?: PoliticalEventThresholdKey[];
    customCondition?: (nation: any, currentTurn: number) => boolean; // Custom condition function
  };
  options: PoliticalEventOption[];
  fallbackDelta?: GovernanceDelta;
  fallbackSummary?: string;
}

export const politicalEvents: PoliticalEventDefinition[] = [
  {
    id: 'election_cycle',
    title: 'Election Year Showdown',
    summary: 'Campaign season peaks as factions vie for control of the legislature.',
    severity: 'serious',
    cooldownTurns: 6,
    conditions: {
      electionImminent: true,
      publicOpinionBelow: 55,
      cabinetApprovalBelow: 55,
      requireAny: ['publicOpinionBelow', 'cabinetApprovalBelow'],
    },
    options: [
      {
        id: 'unity_ticket',
        label: 'Form a Unity Ticket',
        description: 'Bring rival factions into a broad coalition to project stability.',
        outcomes: [
          {
            id: 'unity_success',
            description: 'Coalition resonates with voters and markets rally.',
            chance: 0.6,
            effects: { morale: 8, publicOpinion: 10, cabinetApproval: 6, electionTimer: 12 },
          },
          {
            id: 'unity_fail',
            description: 'Coalition fractures over policy disputes. Legislative math collapses.',
            chance: 0.4,
            effects: { morale: -6, publicOpinion: -8, cabinetApproval: -10, instability: 6, electionTimer: 12 },
          },
        ],
      },
      {
        id: 'hardline_campaign',
        label: 'Run a Hardline Campaign',
        description: 'Lean into security rhetoric and promise decisive action against rivals.',
        outcomes: [
          {
            id: 'hardline_mandate',
            description: 'The electorate rallies behind the strong stance. Mandate secured.',
            chance: 0.5,
            effects: { morale: 6, publicOpinion: 4, cabinetApproval: 3, production: 5, electionTimer: 12 },
          },
          {
            id: 'hardline_backlash',
            description: 'Public backlash erupts over inflammatory rhetoric.',
            chance: 0.5,
            effects: { morale: -8, publicOpinion: -10, cabinetApproval: -6, instability: 10, electionTimer: 12 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -4, publicOpinion: -6, instability: 5, electionTimer: 12 },
    fallbackSummary: 'Election indecision sparks a constitutional crisis.',
  },
  {
    id: 'morale_crisis',
    title: 'Nationwide Morale Crisis',
    summary: 'Economic stagnation and media pessimism erode frontline morale.',
    severity: 'serious',
    cooldownTurns: 4,
    conditions: {
      moraleBelow: 55,
    },
    options: [
      {
        id: 'cultural_program',
        label: 'Launch Cultural Resilience Program',
        description: 'Fund arts, sports, and morale tours to reconnect the homefront.',
        outcomes: [
          {
            id: 'culture_resurgence',
            description: 'Cultural ambassadors ignite a sense of unity.',
            chance: 0.65,
            effects: { morale: 10, publicOpinion: 6, cabinetApproval: 4, production: 4 },
          },
          {
            id: 'culture_flat',
            description: 'Initiative lands flat amid accusations of propaganda.',
            chance: 0.35,
            effects: { morale: -4, publicOpinion: -3, cabinetApproval: -5, instability: 4 },
          },
        ],
      },
      {
        id: 'hazard_pay',
        label: 'Authorize Hazard Pay for Forces',
        description: 'Direct resources to frontline units to reward sacrifice.',
        outcomes: [
          {
            id: 'hazard_boost',
            description: 'Forces feel valued; productivity spikes despite cost overruns.',
            chance: 0.55,
            effects: { morale: 8, cabinetApproval: 3, production: -6, uranium: -2 },
          },
          {
            id: 'hazard_budget',
            description: 'Budget watchdogs revolt over unchecked spending.',
            chance: 0.45,
            effects: { morale: 2, publicOpinion: -6, cabinetApproval: -8, instability: 8, production: -10 },
          },
        ],
      },
    ],
  },
  {
    id: 'cabinet_scandal',
    title: 'Cabinet Scandal Explodes',
    summary: 'Investigative reporters expose graft at the highest levels of government.',
    severity: 'critical',
    cooldownTurns: 5,
    conditions: {
      cabinetApprovalBelow: 50,
      minTurn: 5,
    },
    options: [
      {
        id: 'purge_cabinet',
        label: 'Purge the Cabinet',
        description: 'Sacrifice scandal-tainted ministers to restore confidence.',
        outcomes: [
          {
            id: 'purge_success',
            description: 'Swift accountability stabilizes the administration.',
            chance: 0.7,
            effects: { morale: 5, publicOpinion: 8, cabinetApproval: 12, instability: -6 },
          },
          {
            id: 'purge_power_vacuum',
            description: 'Power vacuum triggers intra-party feuding.',
            chance: 0.3,
            effects: { morale: -6, publicOpinion: -4, cabinetApproval: -8, instability: 12 },
          },
        ],
      },
      {
        id: 'double_down',
        label: 'Double Down on Loyalists',
        description: 'Deny allegations and reward loyal ministers with greater authority.',
        outcomes: [
          {
            id: 'loyalty_reward',
            description: 'Base consolidates; loyalists rally to defend leadership.',
            chance: 0.45,
            effects: { morale: 4, publicOpinion: -2, cabinetApproval: 6, production: 3 },
          },
          {
            id: 'loyalty_collapse',
            description: 'Evidence mounts; opposition surges in polls.',
            chance: 0.55,
            effects: { morale: -10, publicOpinion: -12, cabinetApproval: -14, instability: 15 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -8, publicOpinion: -10, cabinetApproval: -12, instability: 10 },
    fallbackSummary: 'Scandal festers unchecked, crippling legitimacy.',
  },
  {
    id: 'mass_uprising',
    title: 'Mass Uprising Threatens Government',
    summary: 'Widespread protests and civil unrest paralyze the capital. Military loyalty questioned.',
    severity: 'critical',
    cooldownTurns: 8,
    conditions: {
      moraleBelow: 35,
      publicOpinionBelow: 35,
      minTurn: 8,
      requireAny: ['moraleBelow', 'publicOpinionBelow'],
    },
    options: [
      {
        id: 'negotiate_protesters',
        label: 'Negotiate with Opposition',
        description: 'Open dialogue with protest leaders and make concessions to restore order.',
        outcomes: [
          {
            id: 'negotiation_success',
            description: 'Talks succeed. Protests dissipate as reforms are announced.',
            chance: 0.55,
            effects: { morale: 12, publicOpinion: 15, cabinetApproval: 8, instability: -15 },
          },
          {
            id: 'negotiation_fail',
            description: 'Opposition rejects offers. Demands for regime change intensify.',
            chance: 0.45,
            effects: { morale: -8, publicOpinion: -10, cabinetApproval: -12, instability: 20 },
          },
        ],
      },
      {
        id: 'military_crackdown',
        label: 'Deploy Security Forces',
        description: 'Use military and police to restore order through force.',
        outcomes: [
          {
            id: 'crackdown_success',
            description: 'Protests crushed. Order restored but at terrible cost to legitimacy.',
            chance: 0.4,
            effects: { morale: -5, publicOpinion: -15, cabinetApproval: -10, instability: 10 },
          },
          {
            id: 'crackdown_backfire',
            description: 'Security forces refuse orders! Government authority collapses!',
            chance: 0.6,
            effects: { morale: -20, publicOpinion: -20, cabinetApproval: -25, instability: 30 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -15, publicOpinion: -18, cabinetApproval: -20, instability: 25 },
    fallbackSummary: 'Government paralyzed by street protests. Authority crumbling.',
  },
  {
    id: 'government_crisis',
    title: 'Government Legitimacy Crisis',
    summary: 'Coalition fracturing. Ministers resign. Opposition demands immediate elections.',
    severity: 'critical',
    cooldownTurns: 6,
    conditions: {
      cabinetApprovalBelow: 30,
      publicOpinionBelow: 35,
      minTurn: 6,
    },
    options: [
      {
        id: 'snap_elections',
        label: 'Call Snap Elections',
        description: 'Hold emergency elections to restore democratic legitimacy.',
        outcomes: [
          {
            id: 'election_mandate',
            description: 'Surprise victory! Fresh mandate silences critics.',
            chance: 0.35,
            effects: { morale: 15, publicOpinion: 18, cabinetApproval: 20, instability: -20, electionTimer: 12 },
          },
          {
            id: 'election_defeat',
            description: 'Crushing defeat. Opposition assumes power peacefully.',
            chance: 0.65,
            effects: { morale: -12, publicOpinion: -15, cabinetApproval: -18, instability: 15, electionTimer: 12 },
          },
        ],
      },
      {
        id: 'emergency_powers',
        label: 'Invoke Emergency Powers',
        description: 'Suspend normal procedures and rule by decree to stabilize situation.',
        outcomes: [
          {
            id: 'emergency_stabilize',
            description: 'Decisive action breaks political deadlock. Crisis contained.',
            chance: 0.3,
            effects: { morale: 8, publicOpinion: -5, cabinetApproval: 10, instability: -8 },
          },
          {
            id: 'emergency_autocracy',
            description: 'International condemnation! Branded as authoritarian coup!',
            chance: 0.7,
            effects: { morale: -10, publicOpinion: -25, cabinetApproval: -15, instability: 25 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -12, publicOpinion: -15, cabinetApproval: -18, instability: 20 },
    fallbackSummary: 'Government paralysis deepens. Calls for regime change multiply.',
  },
  {
    id: 'military_unrest',
    title: 'Military Loyalty Questioned',
    summary: 'Reports of dissent in officer corps. Coup rumors circulate in capital.',
    severity: 'critical',
    cooldownTurns: 10,
    conditions: {
      moraleBelow: 30,
      cabinetApprovalBelow: 30,
      minTurn: 10,
    },
    options: [
      {
        id: 'purge_officers',
        label: 'Purge Disloyal Officers',
        description: 'Remove suspected coup plotters and promote loyalists.',
        outcomes: [
          {
            id: 'purge_prevents_coup',
            description: 'Coup plot disrupted. Loyalist officers strengthen grip.',
            chance: 0.5,
            effects: { morale: 5, cabinetApproval: 8, instability: -12, production: -5 },
          },
          {
            id: 'purge_triggers_coup',
            description: 'Purge backfires! Officers launch preemptive coup!',
            chance: 0.5,
            effects: { morale: -25, publicOpinion: -30, cabinetApproval: -35, instability: 40 },
          },
        ],
      },
      {
        id: 'appease_military',
        label: 'Increase Military Budget',
        description: 'Boost defense spending and grant military greater autonomy.',
        outcomes: [
          {
            id: 'appease_success',
            description: 'Military satisfied. Coup threat recedes for now.',
            chance: 0.65,
            effects: { morale: 8, cabinetApproval: 6, instability: -10, production: -15, uranium: 5 },
          },
          {
            id: 'appease_emboldened',
            description: 'Military emboldened by weakness. Demand even more control!',
            chance: 0.35,
            effects: { morale: -5, publicOpinion: -8, cabinetApproval: -10, instability: 15, production: -20 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -15, publicOpinion: -12, cabinetApproval: -20, instability: 22 },
    fallbackSummary: 'Military unrest festers. Civil-military relations deteriorate.',
  },
  {
    id: 'war_exhaustion',
    title: 'War Exhaustion Crisis',
    summary: 'Years of conflict have drained national morale. Citizens demand an end to the bloodshed.',
    severity: 'serious',
    cooldownTurns: 6,
    conditions: {
      moraleBelow: 60,
      minTurn: 8, // Simulates prolonged conflict
    },
    options: [
      {
        id: 'rotate_units',
        label: 'Rotate Frontline Units',
        description: 'Pull exhausted troops from the front and deploy fresh reserves to restore fighting spirit.',
        outcomes: [
          {
            id: 'rotation_success',
            description: 'Fresh troops reinvigorate the war effort. Morale rebounds despite logistical strain.',
            chance: 0.75,
            effects: { morale: 12, cabinetApproval: 6, production: -8, instability: -4 },
          },
          {
            id: 'rotation_logistics_fail',
            description: 'Rotation causes operational chaos. Front lines weakened during transition.',
            chance: 0.25,
            effects: { morale: 4, cabinetApproval: -6, production: -12, instability: 8 },
          },
        ],
      },
      {
        id: 'peace_campaign',
        label: 'Launch Peace Talks Media Campaign',
        description: 'Launch a public relations campaign framing negotiations as patriotic and strategic.',
        outcomes: [
          {
            id: 'campaign_resonates',
            description: 'Peace messaging resonates with war-weary public. Diplomatic efforts gain legitimacy.',
            chance: 0.7,
            effects: { morale: 8, publicOpinion: 10, cabinetApproval: 4, instability: -6 },
          },
          {
            id: 'campaign_weakness',
            description: 'Opposition brands you as weak. Hawks demand total victory!',
            chance: 0.3,
            effects: { morale: -6, publicOpinion: -4, cabinetApproval: -8, instability: 10 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -8, publicOpinion: -6, instability: 12 },
    fallbackSummary: 'War exhaustion deepens. Desertion rates climb as public demands peace.',
  },
  {
    id: 'nuclear_ptsd',
    title: 'Nuclear Strike Trauma',
    summary: 'The atomic strike has left deep psychological scars. Citizens demand action or comfort.',
    severity: 'critical',
    cooldownTurns: 6,
    conditions: {
      moraleBelow: 65,
      customCondition: (nation: any, currentTurn: number) => {
        // Check if nation was nuked in the last 3 turns
        return nation.lastNukedTurn !== undefined && currentTurn - nation.lastNukedTurn <= 3;
      },
    },
    options: [
      {
        id: 'aid_reconstruction',
        label: 'Massive Aid & Reconstruction',
        description: 'Deploy all available resources to rebuild affected areas and provide trauma support.',
        outcomes: [
          {
            id: 'reconstruction_success',
            description: 'Swift response demonstrates government commitment. Public morale rebounds despite costs.',
            chance: 0.7,
            effects: { morale: 15, publicOpinion: 10, cabinetApproval: 8, production: -25, instability: -10 },
          },
          {
            id: 'reconstruction_inadequate',
            description: 'Aid efforts overwhelmed by scale of devastation. Survivors feel abandoned.',
            chance: 0.3,
            effects: { morale: 5, publicOpinion: -8, cabinetApproval: -6, production: -30, instability: 15 },
          },
        ],
      },
      {
        id: 'rally_retaliation',
        label: 'Rally for Retaliation',
        description: 'Channel public rage into calls for revenge. Promise swift nuclear response.',
        outcomes: [
          {
            id: 'retaliation_accepted',
            description: 'Public rallies behind promise of vengeance. War fever grips the nation.',
            chance: 0.6,
            effects: { morale: 10, publicOpinion: 6, cabinetApproval: 4, instability: 20 },
          },
          {
            id: 'retaliation_horror',
            description: 'Many reject calls for further nuclear war. Peace movements surge!',
            chance: 0.4,
            effects: { morale: -8, publicOpinion: -12, cabinetApproval: -10, instability: 25 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -15, publicOpinion: -12, instability: 30 },
    fallbackSummary: 'Nuclear trauma festers. Mass exodus from contaminated zones as panic spreads.',
  },
  {
    id: 'refugee_crisis',
    title: 'Refugee Crisis',
    summary: 'Mass displacement from conflict zones overwhelms border infrastructure. Humanitarian crisis unfolds.',
    severity: 'critical',
    cooldownTurns: 8,
    conditions: {
      customCondition: (nation: any, currentTurn: number) => {
        // Trigger if: instability > 60 (proxy for war/bombing) OR recently nuked
        const highInstability = (nation.instability ?? 0) > 60;
        const recentlyNuked = nation.lastNukedTurn !== undefined && currentTurn - nation.lastNukedTurn <= 5;
        return highInstability || recentlyNuked;
      },
    },
    options: [
      {
        id: 'accept_refugees',
        label: 'Accept Refugees',
        description: 'Open borders and provide humanitarian aid to displaced populations.',
        outcomes: [
          {
            id: 'refugee_integration_success',
            description: 'International community praises humanitarian response. Refugees begin integration.',
            chance: 0.65,
            effects: { morale: -5, publicOpinion: 10, cabinetApproval: 5, production: -10, instability: -8 },
          },
          {
            id: 'refugee_strain',
            description: 'Infrastructure strained by refugee influx. Local protests erupt over resources.',
            chance: 0.35,
            effects: { morale: -10, publicOpinion: 5, cabinetApproval: -5, production: -15, instability: 12 },
          },
        ],
      },
      {
        id: 'close_borders',
        label: 'Close Borders',
        description: 'Seal borders and deploy military to prevent refugee entry. Protect national resources.',
        outcomes: [
          {
            id: 'borders_secured',
            description: 'Borders secured. Nationalist base rallies behind strong stance.',
            chance: 0.6,
            effects: { morale: 8, publicOpinion: -15, cabinetApproval: -8, instability: 10 },
          },
          {
            id: 'international_condemnation',
            description: 'Humanitarian catastrophe at borders sparks international outrage!',
            chance: 0.4,
            effects: { morale: 5, publicOpinion: -20, cabinetApproval: -12, instability: 15 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -8, publicOpinion: -10, instability: 15 },
    fallbackSummary: 'Refugee crisis escalates. Border camps overwhelmed as humanitarian disaster unfolds.',
  },
  {
    id: 'veterans_revolt',
    title: "Veterans' Revolt",
    summary: 'Wounded soldiers and discharged veterans protest government neglect. Military loyalty questioned.',
    severity: 'critical',
    cooldownTurns: 10,
    conditions: {
      moraleBelow: 45,
      minTurn: 8,
      customCondition: (nation: any, currentTurn: number) => {
        // Trigger if at war or recently in conflict (high instability as proxy)
        const inConflict = (nation.instability ?? 0) > 40;
        const hasAlliances = nation.alliances && nation.alliances.length > 0;
        return inConflict || hasAlliances;
      },
    },
    options: [
      {
        id: 'veterans_benefits',
        label: "Establish Veterans' Benefits Program",
        description: 'Fund comprehensive healthcare, pensions, and job placement for veterans.',
        outcomes: [
          {
            id: 'benefits_restore_trust',
            description: 'Veterans stand down. Military morale stabilizes as government honors its commitments.',
            chance: 0.7,
            effects: { morale: 10, publicOpinion: 8, cabinetApproval: 8, production: -15, instability: -12 },
          },
          {
            id: 'benefits_insufficient',
            description: 'Program deemed inadequate. Protests continue despite massive expenditure.',
            chance: 0.3,
            effects: { morale: 4, publicOpinion: -2, cabinetApproval: -4, production: -20, instability: 8 },
          },
        ],
      },
      {
        id: 'crackdown_veterans',
        label: 'Crack Down on Protests',
        description: 'Deploy security forces to disperse veteran protests and restore order.',
        outcomes: [
          {
            id: 'crackdown_backfire',
            description: 'Military refuses to attack their own! Officers threaten coup if repression continues!',
            chance: 0.4,
            effects: { morale: -15, publicOpinion: -20, cabinetApproval: -18, instability: 30 },
          },
          {
            id: 'crackdown_temporary_order',
            description: 'Protests suppressed but resentment festers. Military loyalty severely damaged.',
            chance: 0.6,
            effects: { morale: -10, publicOpinion: -10, cabinetApproval: -8, instability: 20 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -12, publicOpinion: -15, cabinetApproval: -10, instability: 25 },
    fallbackSummary: "Veterans' revolt intensifies. Reports of armed confrontations with security forces.",
  },
  {
    id: 'economic_depression',
    title: 'Economic Depression Crisis',
    summary: 'Economic collapse triggers nationwide despair. Unemployment and poverty soar.',
    severity: 'serious',
    cooldownTurns: 8,
    conditions: {
      moraleBelow: 55,
      customCondition: (nation: any, currentTurn: number) => {
        // Trigger if production is critically low (< 40 as proxy for economic collapse)
        return nation.production < 40;
      },
    },
    options: [
      {
        id: 'public_works_program',
        label: 'Launch Public Works Program',
        description: 'Massive infrastructure investment to create jobs and stimulate the economy.',
        outcomes: [
          {
            id: 'works_program_success',
            description: 'Infrastructure projects provide employment. Economic recovery begins slowly.',
            chance: 0.65,
            effects: { morale: 6, publicOpinion: 8, cabinetApproval: 5, production: 8, uranium: -5, instability: -6 },
          },
          {
            id: 'works_program_debt',
            description: 'Spending triggers debt crisis. Credit markets freeze as deficit explodes!',
            chance: 0.35,
            effects: { morale: 2, publicOpinion: -4, cabinetApproval: -8, production: 4, uranium: -8, instability: 10 },
          },
        ],
      },
      {
        id: 'emergency_austerity',
        label: 'Implement Emergency Austerity',
        description: 'Slash government spending and cut social programs to balance the budget.',
        outcomes: [
          {
            id: 'austerity_recovery',
            description: 'Fiscal discipline restores investor confidence. Long-term recovery begins.',
            chance: 0.45,
            effects: { morale: -8, publicOpinion: -12, cabinetApproval: -6, production: 15, instability: 8 },
          },
          {
            id: 'austerity_unrest',
            description: 'Austerity sparks mass protests! Public services collapse amid cuts!',
            chance: 0.55,
            effects: { morale: -12, publicOpinion: -18, cabinetApproval: -12, production: 8, instability: 20 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -10, publicOpinion: -12, production: -5, instability: 15 },
    fallbackSummary: 'Economic depression deepens. Breadlines form as middle class collapses.',
  },
  {
    id: 'youth_antiwar_movement',
    title: 'Youth Anti-War Movement',
    summary: 'Young generation rises up against endless war. Campus protests spread to major cities.',
    severity: 'serious',
    cooldownTurns: 6,
    conditions: {
      moraleBelow: 50,
      publicOpinionBelow: 60,
      minTurn: 10,
      customCondition: (nation: any, currentTurn: number) => {
        // Trigger if nation has been in prolonged conflict (has alliances or high instability)
        const prolongedConflict = (nation.instability ?? 0) > 35;
        const hasAlliances = nation.alliances && nation.alliances.length > 0;
        return prolongedConflict || hasAlliances;
      },
    },
    options: [
      {
        id: 'dialogue_protesters',
        label: 'Open Dialogue with Protesters',
        description: 'Meet with youth leaders and address their concerns about endless conflict.',
        outcomes: [
          {
            id: 'dialogue_success',
            description: 'Youth leaders welcome dialogue. Anti-war sentiment channeled into constructive reform.',
            chance: 0.6,
            effects: { morale: 8, publicOpinion: 12, cabinetApproval: 6, instability: -10 },
          },
          {
            id: 'dialogue_weakness',
            description: 'Hawks brand you as weak! Opposition exploits concessions to anti-war movement!',
            chance: 0.4,
            effects: { morale: -4, publicOpinion: -6, cabinetApproval: -10, instability: 15 },
          },
        ],
      },
      {
        id: 'reinstate_draft',
        label: 'Reinstate Military Draft',
        description: 'Expand conscription to bolster military strength and demonstrate resolve.',
        outcomes: [
          {
            id: 'draft_riots',
            description: 'Draft dodging becomes epidemic! Street riots erupt in every major city!',
            chance: 0.65,
            effects: { morale: -15, publicOpinion: -20, cabinetApproval: -12, instability: 25 },
          },
          {
            id: 'draft_reluctant_acceptance',
            description: 'Draft implemented but deeply unpopular. Military recruitment increases marginally.',
            chance: 0.35,
            effects: { morale: -8, publicOpinion: -15, cabinetApproval: -6, production: 5, instability: 18 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -10, publicOpinion: -12, instability: 18 },
    fallbackSummary: 'Youth movement grows. Universities shut down as student strikes spread nationwide.',
  },
  {
    id: 'dictatorship_coup_threat',
    title: 'Coup Conspiracy Uncovered',
    summary: 'Intelligence reports reveal military officers plotting to overthrow the government.',
    severity: 'critical',
    cooldownTurns: 15,
    conditions: {
      minTurn: 8,
      moraleBelow: 45,
      customCondition: (nation: any) => {
        const govType = nation.governmentState?.currentGovernment;
        return govType === 'dictatorship' || govType === 'military_junta';
      },
    },
    options: [
      {
        id: 'purge_officers',
        label: 'Purge the Officer Corps',
        description: 'Arrest suspected conspirators and replace them with loyalists.',
        outcomes: [
          {
            id: 'purge_success',
            description: 'Coup plotters arrested. Loyalist officers promoted. Government secure.',
            chance: 0.6,
            effects: { morale: -5, publicOpinion: -8, cabinetApproval: 5, instability: 15 },
          },
          {
            id: 'purge_backfire',
            description: 'Purge triggers immediate coup attempt! Military seizes power!',
            chance: 0.4,
            effects: { morale: -20, publicOpinion: -25, cabinetApproval: -40, instability: 50 },
          },
        ],
      },
      {
        id: 'buy_loyalty',
        label: 'Buy Military Loyalty',
        description: 'Increase military salaries and benefits to secure their support.',
        outcomes: [
          {
            id: 'loyalty_secured',
            description: 'Generous pay raises defuse coup plot. Military remains loyal.',
            chance: 0.7,
            effects: { morale: 5, cabinetApproval: 8, production: -10, instability: -10 },
          },
          {
            id: 'loyalty_insufficient',
            description: 'Pay raises buy time but conspirators remain active.',
            chance: 0.3,
            effects: { morale: -2, production: -10, instability: 10 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -15, publicOpinion: -20, instability: 30 },
    fallbackSummary: 'Coup plot spreads. Military loyalty uncertain.',
  },
  {
    id: 'democracy_constitutional_crisis',
    title: 'Constitutional Crisis',
    summary: 'Legislature deadlocked over crucial reforms. Constitutional procedures in question.',
    severity: 'serious',
    cooldownTurns: 12,
    conditions: {
      minTurn: 6,
      cabinetApprovalBelow: 50,
      customCondition: (nation: any) => {
        const govType = nation.governmentState?.currentGovernment;
        return govType === 'democracy' || govType === 'constitutional_monarchy';
      },
    },
    options: [
      {
        id: 'compromise_solution',
        label: 'Negotiate Cross-Party Compromise',
        description: 'Work with opposition to find middle ground on reforms.',
        outcomes: [
          {
            id: 'compromise_success',
            description: 'Bipartisan deal reached. Democracy strengthened.',
            chance: 0.6,
            effects: { morale: 8, publicOpinion: 10, cabinetApproval: 12, instability: -15 },
          },
          {
            id: 'compromise_fail',
            description: 'Negotiations collapse. Both sides harden positions.',
            chance: 0.4,
            effects: { morale: -5, publicOpinion: -8, cabinetApproval: -10, instability: 12 },
          },
        ],
      },
      {
        id: 'executive_action',
        label: 'Use Emergency Executive Powers',
        description: 'Bypass legislature using emergency constitutional provisions.',
        outcomes: [
          {
            id: 'executive_backlash',
            description: 'Opposition cries tyranny! Democratic norms eroded.',
            chance: 0.6,
            effects: { morale: 5, publicOpinion: -15, cabinetApproval: -8, instability: 18 },
          },
          {
            id: 'executive_accepted',
            description: 'Public accepts emergency measures as necessary.',
            chance: 0.4,
            effects: { morale: 8, publicOpinion: 5, cabinetApproval: 3, instability: 8 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -8, publicOpinion: -12, cabinetApproval: -15, instability: 20 },
    fallbackSummary: 'Constitutional gridlock worsens. Public confidence in democracy fading.',
  },
  {
    id: 'monarchy_succession_crisis',
    title: 'Royal Succession Crisis',
    summary: 'Rival claimants to the throne emerge. Succession law ambiguous.',
    severity: 'critical',
    cooldownTurns: 20,
    conditions: {
      minTurn: 10,
      customCondition: (nation: any) => {
        const govType = nation.governmentState?.currentGovernment;
        const successionClarity = nation.governmentState?.successionClarity ?? 100;
        return (govType === 'absolute_monarchy' || govType === 'constitutional_monarchy') && successionClarity < 60;
      },
    },
    options: [
      {
        id: 'support_heir',
        label: 'Support Legitimate Heir',
        description: 'Back the traditional line of succession against rival claimants.',
        outcomes: [
          {
            id: 'heir_secured',
            description: 'Legitimate heir confirmed. Rival claimants withdraw.',
            chance: 0.7,
            effects: { morale: 10, publicOpinion: 8, cabinetApproval: 12, instability: -10 },
          },
          {
            id: 'civil_war_threat',
            description: 'Rival claimants refuse to yield. Civil war threatens!',
            chance: 0.3,
            effects: { morale: -15, publicOpinion: -10, cabinetApproval: -8, instability: 40 },
          },
        ],
      },
      {
        id: 'reform_succession',
        label: 'Reform Succession Laws',
        description: 'Use crisis to modernize and clarify succession procedures.',
        outcomes: [
          {
            id: 'reform_success',
            description: 'New succession law enacted. Crisis resolved peacefully.',
            chance: 0.5,
            effects: { morale: 12, publicOpinion: 15, cabinetApproval: 10, instability: -20 },
          },
          {
            id: 'reform_traditionalist_backlash',
            description: 'Traditionalists outraged! Reform seen as attack on monarchy.',
            chance: 0.5,
            effects: { morale: -10, publicOpinion: -12, cabinetApproval: -5, instability: 25 },
          },
        ],
      },
    ],
    fallbackDelta: { morale: -20, publicOpinion: -18, instability: 35 },
    fallbackSummary: 'Succession crisis deepens. Royal family divided.',
  },
  {
    id: 'authoritarian_propaganda_success',
    title: 'Propaganda Triumph',
    summary: 'State media campaign achieves exceptional success in shaping public opinion.',
    severity: 'routine',
    cooldownTurns: 8,
    conditions: {
      minTurn: 5,
      moraleBelow: 60,
      customCondition: (nation: any) => {
        const govType = nation.governmentState?.currentGovernment;
        return govType === 'dictatorship' || govType === 'military_junta' || govType === 'one_party_state';
      },
    },
    options: [
      {
        id: 'exploit_propaganda',
        label: 'Capitalize on Success',
        description: 'Launch major policy initiative while public opinion is favorable.',
        outcomes: [
          {
            id: 'initiative_success',
            description: 'Policy initiative succeeds. Public rallies behind leadership.',
            chance: 0.7,
            effects: { morale: 12, publicOpinion: 15, cabinetApproval: 10, production: 8 },
          },
          {
            id: 'overreach',
            description: 'Initiative seen as exploitative. Propaganda backlash.',
            chance: 0.3,
            effects: { morale: -5, publicOpinion: -8, instability: 10 },
          },
        ],
      },
      {
        id: 'maintain_narrative',
        label: 'Maintain Current Narrative',
        description: 'Continue successful propaganda without major changes.',
        outcomes: [
          {
            id: 'steady_gains',
            description: 'Consistent messaging gradually improves public mood.',
            chance: 1.0,
            effects: { morale: 6, publicOpinion: 8, cabinetApproval: 5 },
          },
        ],
      },
    ],
  },
];
