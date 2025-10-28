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
];
