export type LogisticsStatus = "Stabil" | "Presset" | "Kritisk" | "Sårbar";

export interface PhaseTwoSeason {
  id: string;
  title: string;
  description: string;
  focus: string[];
  reward: string;
}

export interface LogisticsRouteDefinition {
  id: string;
  name: string;
  mode: "Luft" | "Sjø" | "Land";
  priority: "Høy" | "Middels" | "Lav";
  baseStatus: LogisticsStatus;
  baseCapacity: number;
  baseRisk: string;
  nodes: string[];
  description: string;
}

export interface ThreatSectorDefinition {
  id: string;
  title: string;
  vector: string;
  baseIntensity: number;
  posture: string;
  narrative: string;
}

export interface OperationDefinition {
  id: string;
  name: string;
  summary: string;
  window: string;
  requirements: string[];
  reward: string;
}

export interface ProtocolDefinition {
  id: string;
  title: string;
  owner: string;
  description: string;
  actions: string[];
}

export interface PhaseTwoEventEffect {
  defconDelta?: number;
  moraleDelta?: number;
  intelDelta?: number;
  seasonId?: string;
  operationsUnlocked?: string[];
  alerts?: string[];
  logistics?: Array<{
    id: string;
    status?: LogisticsStatus;
    capacityDelta?: number;
    risk?: string;
    note?: string;
  }>;
  threats?: Array<{
    id: string;
    intensityDelta?: number;
    posture?: string;
    note?: string;
  }>;
}

export interface PhaseTwoEvent {
  id: string;
  turn: number;
  title: string;
  summary: string;
  seasonId: string;
  focus: string;
  response: string[];
  effects: PhaseTwoEventEffect;
}

export interface PhaseTwoData {
  base: {
    turn: number;
    defcon: number;
    morale: number;
    intel: number;
    activeSeasonId: string;
  };
  seasons: PhaseTwoSeason[];
  logistics: LogisticsRouteDefinition[];
  threatSectors: ThreatSectorDefinition[];
  operations: OperationDefinition[];
  protocols: ProtocolDefinition[];
  script: PhaseTwoEvent[];
}

export const phaseTwoData: PhaseTwoData = {
  base: {
    turn: 12,
    defcon: 4,
    morale: 68,
    intel: 44,
    activeSeasonId: "winter",
  },
  seasons: [
    {
      id: "winter",
      title: "Vinteroffensiv",
      description:
        "Arktiske stormer og radarskygger krever hurtige avskjæringer og backup-kanaler for kommunikasjon.",
      focus: [
        "Hold luftbroene åpne med redundans",
        "Forbered hurtigstart av anti-hypersoniske skjold",
        "Styrk satellittdekningen for å motvirke blackout",
      ],
      reward: "Kaldstart-modul som reduserer responstiden på interceptorer",
    },
    {
      id: "spring",
      title: "Vår-tøvær",
      description:
        "Smeltevann åpner nye forsyningslinjer men oversvømmelser truer både moral og landoperasjoner.",
      focus: [
        "Aktiver humanitære konvoier for å holde opinionen stabil",
        "Etabler midlertidige depoter langs nye landruter",
        "Del rekognosering med allierte for å utnytte åpne fronter",
      ],
      reward: "Felles rekognoseringsdrone som øker intel-gain pr. runde",
    },
    {
      id: "summer",
      title: "Sommerstorm",
      description:
        "Tropiske stormer og soloverflod skaper ustabile luftvinduer men øker kapasiteten for solenergidrevne systemer.",
      focus: [
        "Monitorer sabotasjevinduer mot kraftnett",
        "Utvid dronepatruljer for å kartlegge nye trusler",
        "Aktiver sol-reserver for å stabilisere forsyning",
      ],
      reward: "Solar-reserve som kutter energikost ved høyt DEFCON",
    },
    {
      id: "autumn",
      title: "Høstbrann",
      description:
        "Tørre forhold krever fokus på krisehåndtering og sivile evakueringer for å hindre uro og nedgang i moral.",
      focus: [
        "Prioriter evakueringskorridorer i urbane soner",
        "Koble sivile tiltak til strategisk kommunikasjon",
        "Støtt koalisjonens brann- og redningsteam",
      ],
      reward: "Krisesamband som låser opp ekstra støtteaksjoner",
    },
  ],
  logistics: [
    {
      id: "polar",
      name: "Arktisk luftbro",
      mode: "Luft",
      priority: "Høy",
      baseStatus: "Stabil",
      baseCapacity: 92,
      baseRisk: "Lav ising",
      nodes: ["Thule", "Bodø", "Tromsø"],
      description:
        "Leverer avanserte komponenter og hurtigrespons-team til polare baser; kritisk ved høy DEFCON.",
    },
    {
      id: "atlantic",
      name: "Atlanterhavskonvoi",
      mode: "Sjø",
      priority: "Høy",
      baseStatus: "Presset",
      baseCapacity: 78,
      baseRisk: "U-båtaktivitet",
      nodes: ["Halifax", "Reykjavik", "Bergen"],
      description:
        "Storskala forsyninger og humanitære sendinger; krever kontinuerlig eskorte og anti-substøtte.",
    },
    {
      id: "silk",
      name: "Silkevei express",
      mode: "Land",
      priority: "Middels",
      baseStatus: "Sårbar",
      baseCapacity: 64,
      baseRisk: "Diplomatisk press",
      nodes: ["Astana", "Warszawa", "Hamburg"],
      description:
        "Høyverdi elektronikk og humanitær støtte gjennom komplekse diplomatiske korridorer.",
    },
    {
      id: "orbital",
      name: "Orbital drop",
      mode: "Luft",
      priority: "Lav",
      baseStatus: "Stabil",
      baseCapacity: 55,
      baseRisk: "Romskrap",
      nodes: ["LEO", "Kiruna", "Colorado"],
      description:
        "Eksperimentell leveransekanal via gjenbrukbare kapsler; supplerer kritiske ressurser i korte vinduer.",
    },
  ],
  threatSectors: [
    {
      id: "polar-front",
      title: "Polarfronten",
      vector: "Hypersonisk / elektronisk krigføring",
      baseIntensity: 48,
      posture: "Opptrapping",
      narrative:
        "Fienden tester hypersoniske våpen under radarskyggen og sender samtidig jamming-pulser mot satellitter.",
    },
    {
      id: "euro-corridor",
      title: "Eurasiatisk korridor",
      vector: "Hybrid (land + cyber)",
      baseIntensity: 36,
      posture: "Snikangrep",
      narrative:
        "Langs Silkevei express aktiveres sleeper-celler og forsøker å avskjære logistikk via sabotasje.",
    },
    {
      id: "atlantic-gap",
      title: "Atlanterhavsgapet",
      vector: "Sjøbaserte sværm-angrep",
      baseIntensity: 42,
      posture: "Målrettet press",
      narrative:
        "U-båter og droner forsøker å splitte konvoier og slå ut eskortefartøy under nattlige operasjoner.",
    },
    {
      id: "orbital-band",
      title: "Orbital band",
      vector: "Anti-satellitt",
      baseIntensity: 28,
      posture: "Overvåkning",
      narrative:
        "Lavintensivt press på satellitter for å teste reaksjonstiden vår og kartlegge svakheter i nettverket.",
    },
  ],
  operations: [
    {
      id: "rapid-response",
      name: "Rapid Response Wings",
      summary:
        "Omfordel hurtigstart-team til polare baser og aktiver kaldstart-protokoller for interceptorene.",
      window: "Triggeres når DEFCON ≤ 3",
      requirements: ["Minst én luftbro operativ", "Intel ≥ 40"],
      reward: "Gir ekstra avskjæringshandling pr. runde",
    },
    {
      id: "aid-corridor",
      name: "Humanitær korridor",
      summary:
        "Aktiver co-op vindu for humanitære leveranser som stabiliserer moral gjennom vårsesongen.",
      window: "Sesong: Vår-tøvær",
      requirements: ["Morale ≥ 60", "Silkevei express ikke kritisk"],
      reward: "Hever moral med +6 og gir bonus-intel",
    },
    {
      id: "counter-sabotage",
      name: "Counter Sabotage Sweep",
      summary:
        "Distribuer cyberteam og spesialstyrker langs logistikkårene for å neutralisere sleeper-celler.",
      window: "Når to ruter er Presset eller verre",
      requirements: ["Intel ≥ 45", "Aktiv alliert støtte"],
      reward: "Reduserer risiko og gjenoppretter kapasitet på to ruter",
    },
    {
      id: "stabilization",
      name: "Stabilization Uplift",
      summary:
        "Samkjør koalisjonen for felles luftbro og diplomatisk offensiv som demper presset.",
      window: "Sesongfinale",
      requirements: ["DEFCON ≥ 3", "Morale ≥ 65"],
      reward: "Resetter logistikkstatus til minst Presset",
    },
  ],
  protocols: [
    {
      id: "co-op-sync",
      title: "Ko-op synkroniseringsmøte",
      owner: "Alliert kommandopost",
      description: "Oppdater felles situasjonsbilde og fordeler responsansvar mellom koalisjonspartnerne.",
      actions: [
        "Del heatmap-data og status på ruter",
        "Fordel interceptor- og eskortekvoter",
        "Planlegg neste 2 runder i taktisk tidslinje",
      ],
    },
    {
      id: "logistics-hardening",
      title: "Logistikkforsterkning",
      owner: "NORAD logistikk",
      description: "Aktiver redundans, harden noder og oppdater tilstand med feltteam.",
      actions: [
        "Deploy mobile reparasjonsteam",
        "Rerout lav-prioriterte forsendelser",
        "Synk varsling med civil beredskap",
      ],
    },
    {
      id: "civic-briefing",
      title: "Civic messaging",
      owner: "Kommunikasjon",
      description: "Koordiner pressebrief og sosiale kanaler for å dempe uro og holde moral stabil.",
      actions: [
        "Publiser statusoppdatering med tiltak",
        "Aktiver hjelpelinjer og lokale støttesentre",
        "Følg opp sentiment og oppdater morale-feed",
      ],
    },
  ],
  script: [
    {
      id: "polar-blackout",
      turn: 12,
      title: "Polar blackout",
      summary:
        "Elektromagnetisk storm over polområdene slår ut radar og senker kapasiteten på luftbroen.",
      seasonId: "winter",
      focus: "Hold interceptorer og nødkanaler operative gjennom stormen.",
      response: [
        "Aktiver hurtigpatruljer for å dekke radarskygger",
        "Rerout reservedeler via Atlanterhavskonvoien",
        "Forbered deployering av Rapid Response Wings",
      ],
      effects: {
        defconDelta: -1,
        moraleDelta: -4,
        intelDelta: 3,
        operationsUnlocked: ["rapid-response"],
        alerts: [
          "Polar blackout reduserer luftbro-kapasitet med 18%",
          "Hypersonisk lanseringsvindu oppdaget nord for Tromsø",
        ],
        logistics: [
          {
            id: "polar",
            status: "Presset",
            capacityDelta: -18,
            risk: "Ising og EMP-debris",
            note: "Kapasitet må prioriteres til kritiske deler",
          },
        ],
        threats: [
          {
            id: "polar-front",
            intensityDelta: 22,
            posture: "Hypersonisk sprint",
            note: "Radar blackout gir fienden vindu for hurtigangrep",
          },
        ],
      },
    },
    {
      id: "thaw-window",
      turn: 13,
      title: "Tøværskorridor åpnes",
      summary:
        "Smeltevann åpner nye landforbindelser mens flom truer kritiske sivile områder.",
      seasonId: "spring",
      focus: "Utnytt vårvinduet uten å miste kontroll på humanitære behov.",
      response: [
        "Aktiver humanitær korridor for å stabilisere moral",
        "Forsterk Silkevei express med diplomatiske eskorter",
        "Del rekognosering fra dronesvermer",
      ],
      effects: {
        moraleDelta: 6,
        intelDelta: 5,
        seasonId: "spring",
        operationsUnlocked: ["aid-corridor"],
        alerts: [
          "Humanitær etterspørsel øker langs flomsoner",
          "Ny landrute mulig via Astana – Warsawa",
        ],
        logistics: [
          {
            id: "polar",
            status: "Presset",
            capacityDelta: 6,
            risk: "Veksling mellom ising og sludd",
            note: "Ekstra flyvninger tilgjengelig ved vær-vindu",
          },
          {
            id: "atlantic",
            status: "Stabil",
            capacityDelta: 8,
            risk: "Eskorte forsterket av allierte",
            note: "Koalisjonens fregatter reduserer ubåtpress",
          },
          {
            id: "silk",
            status: "Sårbar",
            capacityDelta: -10,
            risk: "Politisk press intensiveres",
            note: "Diplomatisk press krever forhandlinger for å holde ruten åpen",
          },
        ],
        threats: [
          {
            id: "euro-corridor",
            intensityDelta: 12,
            posture: "Koordinert sabotasje",
            note: "Sleeper-celler forsøker å kutte landruten",
          },
          {
            id: "atlantic-gap",
            intensityDelta: -6,
            posture: "Dempet",
            note: "Alliert eskorte presser tilbake ubåter midlertidig",
          },
        ],
      },
    },
    {
      id: "sabotage-ambush",
      turn: 14,
      title: "Sabotasje i transitt",
      summary:
        "Koordinerte cyberangrep og bakholdsangrep mot forsyningskolonner presser rutenettet hardt.",
      seasonId: "spring",
      focus: "Avdekk og nøytraliser sleeper-celler før logistikk kollapser.",
      response: [
        "Deploy Counter Sabotage Sweep",
        "Synk cyberforsvar med koalisjonspartnere",
        "Rerout lav-prioriterte forsendelser til Orbital drop",
      ],
      effects: {
        moraleDelta: -5,
        intelDelta: 2,
        alerts: [
          "Cyberangrep registrert mot Silkevei express",
          "Atlanterhavskonvoi mister 9% kapasitet",
        ],
        operationsUnlocked: ["counter-sabotage"],
        logistics: [
          {
            id: "silk",
            status: "Kritisk",
            capacityDelta: -20,
            risk: "Aktive sabotasje-celler",
            note: "Behov for spesialstyrker langs koridoren",
          },
          {
            id: "atlantic",
            status: "Presset",
            capacityDelta: -9,
            risk: "Sjøminer i transittkorridor",
            note: "Behov for ekstra minesveip",
          },
        ],
        threats: [
          {
            id: "euro-corridor",
            intensityDelta: 18,
            posture: "Full offensiv",
            note: "Sabotasje-celler aktiverer koordinert angrep",
          },
          {
            id: "orbital-band",
            intensityDelta: 9,
            posture: "Aggressiv kartlegging",
            note: "Anti-satellitt tester mot Orbital drop",
          },
        ],
      },
    },
    {
      id: "coalition-lift",
      turn: 15,
      title: "Koalisjonsløft",
      summary:
        "Alliert luftbro og diplomatisk offensiv stabiliserer frontene og åpner for felles operasjoner.",
      seasonId: "spring",
      focus: "Utnytt momentumet til å stabilisere nettverket og løfte moralen.",
      response: [
        "Aktiver Stabilization Uplift",
        "Fordel overskuddskapasitet til pressede sektorer",
        "Planlegg sommerens operasjonsvinduer",
      ],
      effects: {
        defconDelta: 1,
        moraleDelta: 7,
        intelDelta: 4,
        alerts: [
          "Koalisjonsstøtte gir +12% kapasitet på luftbro",
          "Diplomatisk støtte reduserer press mot Silkevei express",
        ],
        operationsUnlocked: ["stabilization"],
        logistics: [
          {
            id: "polar",
            status: "Stabil",
            capacityDelta: 12,
            risk: "Været lysner",
            note: "Luftbro normaliseres ved hjelp av allierte",
          },
          {
            id: "atlantic",
            status: "Stabil",
            capacityDelta: 10,
            risk: "Sjøminer fjernet",
            note: "Koalisjonseskorte holder gapet åpent",
          },
          {
            id: "silk",
            status: "Presset",
            capacityDelta: 14,
            risk: "Diplomatisk støtte",
            note: "Forhandlinger reduserer politisk press",
          },
          {
            id: "orbital",
            status: "Stabil",
            capacityDelta: 8,
            risk: "Orbital korridor klar",
            note: "Anti-satellitt angrep avverget",
          },
        ],
        threats: [
          {
            id: "polar-front",
            intensityDelta: -12,
            posture: "Stabilisert",
            note: "Hypersonisk aktivitet avtar",
          },
          {
            id: "euro-corridor",
            intensityDelta: -14,
            posture: "Disruptert",
            note: "Counter Sabotage Sweep lykkes",
          },
          {
            id: "atlantic-gap",
            intensityDelta: -8,
            posture: "Presset tilbake",
            note: "Konvoi i sikker formasjon",
          },
        ],
      },
    },
  ],
};
