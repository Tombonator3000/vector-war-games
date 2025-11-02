/**
 * ComprehensiveTutorial Component
 *
 * Detaljert, interaktiv tutorial-system som dekker alle spillmekanikker.
 * Progressiv læring med praktiske eksempler og øvingsoppgaver.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft, ChevronRight, X, Target, Shield, Zap, Users, Radio, Factory,
  Rocket, Bomb, Skull, AlertTriangle, Satellite, Network, Biohazard,
  Trophy, Vote, Sword, Eye, BookOpen, CheckCircle2, Circle, PlayCircle
} from 'lucide-react';

interface TutorialSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  unlockTurn: number;
  lessons: TutorialLesson[];
}

interface TutorialLesson {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  practiceTask?: string;
  warningTips?: string[];
  proTips?: string[];
}

// Comprehensive tutorial sections
const TUTORIAL_SECTIONS: TutorialSection[] = [
  // SECTION 1: BASICS
  {
    id: 'basics',
    title: 'Grunnleggende Mekanikker',
    icon: <Target className="h-5 w-5" />,
    description: 'Lær grunnleggende spillmekanikker og kontroller',
    unlockTurn: 1,
    lessons: [
      {
        id: 'welcome',
        title: 'Velkommen til Vector War Games',
        content: 'Du er kommandør for en supermakt i den kalde krigens atomtidsalder. Ditt mål er å overleve og dominere gjennom militær makt, diplomati, eller økonomisk styrke. Spillet foregår i runder hvor du og AI-motstandere tar handlinger, etterfulgt av oppgjør og ressursproduksjon.',
        keyPoints: [
          'Hver runde består av: Spiller-fase → AI-fase → Oppgjør → Produksjon',
          'Du har begrenset antall handlinger per runde',
          'Planlegg nøye - AI-motstandere reagerer på dine handlinger',
          'Spillet har progressive faser med nye funksjoner som låses opp'
        ],
        practiceTask: 'Gjennomfør din første runde ved å observere UI og tilgjengelige knapper',
        proTips: [
          'Lagre ofte - spillet kan være uforutsigbart',
          'Bruk pause-funksjonen (ESC) for å planlegge',
          'Les alle meldinger nøye - de gir viktig informasjon'
        ]
      },
      {
        id: 'resources',
        title: 'Ressurssystemet',
        content: 'Tre hovedressurser driver din nasjon: Produksjon (gul), Uran (grønn), og Intel (blå). Hver ressurs har spesifikke bruksområder og regenereres hver runde.',
        keyPoints: [
          'PRODUKSJON: Bygg raketter, bombefly, forsvar og konvensjonelle styrker',
          'URAN: Nødvendig for å skape atomstridshoder (10MT til 200MT)',
          'INTEL: Forskning, spionasje, satellitter og cyber-operasjoner',
          'Ressurser akkumuleres hvis de ikke brukes',
          'Produksjonsrate avhenger av nasjonens kapasitet og hendelser'
        ],
        practiceTask: 'Observer ressurspanelet øverst i skjermen. Prøv å bruke noen ressurser og se hvordan de regenereres neste runde.',
        warningTips: [
          'Ikke bruk ALT på én ressurs - balanser bruken',
          'Visse hendelser kan redusere ressursproduksjon',
          'Atomic-angrep kan ødelegge produksjonskapasitet'
        ],
        proTips: [
          'Spar ressurser for nødsituasjoner',
          'Counterintelligence-forskning øker Intel-produksjon',
          'Erobrede byer øker Produksjon'
        ]
      },
      {
        id: 'defcon',
        title: 'DEFCON-systemet',
        content: 'DEFCON (Defense Condition) måler krigsberedskap fra 5 (fred) til 1 (nukleær krig). Dette systemet påvirker hvilke våpen du kan deployere og hvordan andre nasjoner reagerer.',
        keyPoints: [
          'DEFCON 5: Fred - normal produksjon, full diplomati mulig',
          'DEFCON 4: Økt beredskap - overvåking og spionasje aktivert',
          'DEFCON 3: Høy beredskap - diplomatiske straffer begynner',
          'DEFCON 2: Krigstilstand nær - strategiske våpen låses opp',
          'DEFCON 1: Nukleær krig - alle våpen tilgjengelige, diplomati umulig'
        ],
        practiceTask: 'Observer DEFCON-indikatoren. Merk hvordan den endres basert på handlinger.',
        warningTips: [
          'Lavere DEFCON = dårligere relasjoner med andre nasjoner',
          'Diplomatisk seier krever DEFCON ≥4 i 4+ runder',
          'DEFCON 1 betyr total krig - forvent massive tap'
        ],
        proTips: [
          'Overvåk andre nasjoners DEFCON-nivå',
          'Bruk diplomati for å heve DEFCON',
          'DEFCON 2 kreves for å deployere tyngste våpen'
        ]
      },
      {
        id: 'turn-structure',
        title: 'Rundestruktur og Timing',
        content: 'Forstå hvordan hver runde fungerer er kritisk for suksess. Timing av handlinger og forståelse av sekvensen gir deg strategisk fordel.',
        keyPoints: [
          'SPILLER-FASE: Ta dine handlinger (bygg, angrip, forsk, diplomat)',
          'AI-FASE: AI-nasjoner tar sine handlinger',
          'OPPGJØR: Angrep løses, skader beregnes, effekter anvendes',
          'PRODUKSJON: Ressurser regenereres, effekter avtar'
        ],
        practiceTask: 'Observer nøye hver fase i én fullstendig runde. Merk timing og sekvens.',
        warningTips: [
          'AI kan reagere på dine handlinger i samme runde',
          'Visse handlinger tar flere runder å fullføre',
          'Planlegg alltid minst 3-5 runder frem'
        ],
        proTips: [
          'Bruk "END TURN" kun når du er helt sikker',
          'Sjekk alle systemer før du bekrefter',
          'Koordiner flere handlinger for maksimal effekt'
        ]
      }
    ]
  },

  // SECTION 2: NUCLEAR WARFARE
  {
    id: 'nuclear',
    title: 'Atomvåpen og Strategisk Krigføring',
    icon: <Skull className="h-5 w-5" />,
    description: 'Lær om ICBMs, bombefly, stridshoder og nukleær strategi',
    unlockTurn: 1,
    lessons: [
      {
        id: 'icbms',
        title: 'ICBMs - Interkontinentale Ballistiske Missiler',
        content: 'ICBMs er dine primære angrepsvåpen. De kan nå ethvert mål på jorden og leverer atomstridshoder med enorm kraft.',
        keyPoints: [
          'Kostnad: 30 Produksjon + Uran (avhengig av stridshode)',
          'Rekkevidde: Global - kan nå ethvert mål',
          'Hastighet: Rask - treffer samme runde',
          'Kan avskjæres: Fiendens missilforsvar kan stoppe raketter',
          'Stridshoder: 10MT, 20MT, 50MT, 100MT, 200MT (krever forskning)'
        ],
        practiceTask: 'Bygg din første ICBM med et 10MT stridshode. Observer kostnadene og deployment-prosessen.',
        warningTips: [
          'ICBMs kan IKKE kalles tilbake etter avfyring',
          'Forvent gjengjeldelse - bygg forsvar først',
          'Større stridshoder = mer Uran-kostnad',
          'Missilforsvar kan stoppe 70-90% av angrep'
        ],
        proTips: [
          'Koordiner flere ICBMs for å overvelde forsvar',
          'Target fiendtlige baser for å redusere gjengjeldelsesevne',
          '200MT "Planet Cracker" kan ødelegge flere mål'
        ]
      },
      {
        id: 'bombers',
        title: 'Strategiske Bombefly',
        content: 'Bombefly er saktere enn raketter men tilbyr fleksibilitet - de kan kalles tilbake og gjenbrukes.',
        keyPoints: [
          'Kostnad: 40 Produksjon + Uran for stridshode',
          'Hastighet: Sakte - 2-3 runder til mål',
          'Kan kalles tilbake: Før målet er nådd',
          'Gjenbrukbare: Hvis de overlever kan de returnere og gjenbrukes',
          'Kan avskjæres: Av luftforsvar og jagerfly'
        ],
        practiceTask: 'Deploy ett bombefly. Observer hvordan det beveger seg mot målet over flere runder.',
        warningTips: [
          'Tar flere runder å nå mål - fienden kan forberede seg',
          'Luftforsvar kan skyte ned bombefly',
          'Må returnere til base for å gjenbrukes'
        ],
        proTips: [
          'Bruk bombefly for diplomatiske situasjoner hvor du kan kalle dem tilbake',
          'Koordiner med rakett-angrep for å overvelde forsvar',
          'Bombefly kan bære de tyngste stridshoder'
        ]
      },
      {
        id: 'warheads',
        title: 'Atomstridshoder og Ødeleggelseskraft',
        content: 'Stridshoder bestemmer ødeleggelseskraften til dine våpen. Fra 10MT grunnstridshoder til 200MT "Planet Crackers".',
        keyPoints: [
          '10MT: 5 Uran - Grunnleggende, tilgjengelig fra start',
          '20MT: 10 Uran - Dobbel kraft, moderat kostnad',
          '50MT: 25 Uran - Kraftig, krever forskning',
          '100MT: 50 Uran - Strategisk, krever avansert forskning',
          '200MT: 100 Uran - "Planet Cracker", kan ødelegge flere mål'
        ],
        practiceTask: 'Sammenlign kostnader for ulike stridshoder. Planlegg hvilke du vil bruke tidlig vs sent i spillet.',
        warningTips: [
          'Større stridshoder bruker MYE mer Uran',
          '200MT krever omfattende forskning',
          'Overdriven kraft kan være bortkastet på små mål'
        ],
        proTips: [
          'Start med 10-20MT for kostnadseffektivitet',
          'Forsk frem 50MT rundt midten av spillet',
          '200MT er beste for å eliminere flere trusler samtidig'
        ]
      },
      {
        id: 'submarines',
        title: 'Atomubåter - Skjulte Andregangs-angrep',
        content: 'Ubåter gir en skjult andregangs-angrepskapasitet. De er vanskeligere å oppdage og avskjære.',
        keyPoints: [
          'Kostnad: 60 Produksjon + Uran for stridshoder',
          'Deteksjonssjanse: Kun 30% (vs 90% for ICBMs)',
          'Avskjæringsrate: Betydelig redusert',
          'Kan bære multiple stridshoder',
          'Låses opp: Krever forskning (tilgjengelig rundt tur 15)'
        ],
        practiceTask: 'Når tilgjengelig, bygg en atomubåt og sammenlign dens evner med ICBMs.',
        warningTips: [
          'Dyrere enn ICBMs',
          'Krever forskning for å låse opp',
          'Kan fortsatt oppdages og avskjæres (bare mindre sjanse)'
        ],
        proTips: [
          'Ubåter er beste forsikring mot første-angrep',
          'Kombiner med landbaserte systemer for total avskrekking',
          'Invester i ubåter for overlevelsesstrategier'
        ]
      }
    ]
  },

  // SECTION 3: DEFENSE SYSTEMS
  {
    id: 'defense',
    title: 'Forsvarssystemer',
    icon: <Shield className="h-5 w-5" />,
    description: 'Lær om missilforsvar, Orbital Defense og overlevelse',
    unlockTurn: 1,
    lessons: [
      {
        id: 'missile-defense',
        title: 'Missilforsvar',
        content: 'Missilforsvar er kritisk for overlevelse. Hvert system kan avskjære ett innkommende angrep.',
        keyPoints: [
          'Kostnad: 25 Produksjon per enhet',
          'Avskjæringsrate: 70-90% avhengig av teknologi',
          'Forbrukes ved bruk: Må bygges på nytt etter avskjæring',
          'Avskjærer både raketter og bombefly',
          'Kan forbedres gjennom forskning'
        ],
        practiceTask: 'Bygg 3-5 misselforsvarssystemer. Beregn hvor mange du trenger for å overleve et angrep.',
        warningTips: [
          'Forsvar forbrukes når de avskjærer angrep',
          'Ikke 100% pålitelige - bygg ekstra',
          'Massive angrep kan overvelde forsvar'
        ],
        proTips: [
          'Bygg forsvar TIDLIG - du vil bli angrepet',
          'Beregn: (antall fiendtlige våpen × 1.5) = forsvar du trenger',
          'Kombiner med Orbital Defense for best beskyttelse'
        ]
      },
      {
        id: 'orbital-defense',
        title: 'Orbital Defense Grid',
        content: 'Det ultimate forsvarssystemet. Satellitt-basert, permanent beskyttelse som ikke forbrukes.',
        keyPoints: [
          'Kostnad: 200 Produksjon + 100 Intel (engangs)',
          'Avskjæringsrate: 85% permanent',
          'Forbrukes IKKE ved bruk',
          'Beskytter mot alle typer angrep',
          'Krever avansert forskning (tilgjengelig rundt tur 20)'
        ],
        practiceTask: 'Planlegg når du skal investere i Orbital Defense. Regn ut payback-perioden.',
        warningTips: [
          'Meget dyr - krever langsiktig planlegging',
          'Krever omfattende forskning først',
          'Ikke 100% - kombiner med annet forsvar'
        ],
        proTips: [
          'Prioriter denne forskningen i midten av spillet',
          'Investeringen lønner seg etter 3-5 runder',
          'Kombinér med konvensjonelt forsvar for nær-uovervinnelighet'
        ]
      },
      {
        id: 'bunkers',
        title: 'Befolkningsforsvar og Bunkers',
        content: 'Beskytt din sivilbefolkning mot atomeksplosjoner og radiasjon.',
        keyPoints: [
          'Bunkerbygging: Reduserer sivilbefolkning-tap',
          'Evakueringsplaner: Gir ekstra tid ved angrep',
          'Forurensningskontroll: Reduserer langtidseffekter',
          'Medisinsk beredskap: Behandler strålingsofre'
        ],
        practiceTask: 'Observer befolkningspanelet. Planlegg beskyttelsestiltak.',
        warningTips: [
          'Befolkningstap kan føre til regime-skifte',
          '50M befolkning kreves for overlevelsesseier',
          'Radiasjon har langtidseffekter'
        ],
        proTips: [
          'Bygg bunkers tidlig i spillet',
          'Evakueringsplaner må være på plass før krig',
          'Kombinér med medisinsk forskning'
        ]
      }
    ]
  },

  // SECTION 4: RESEARCH & TECHNOLOGY
  {
    id: 'research',
    title: 'Forskning og Teknologi',
    icon: <Radio className="h-5 w-5" />,
    description: 'Lær å forske frem avanserte våpen og teknologier',
    unlockTurn: 6,
    lessons: [
      {
        id: 'research-basics',
        title: 'Grunnleggende Forskningsmekanikk',
        content: 'Forskning bruker Intel-ressurser over flere runder for å låse opp nye teknologier.',
        keyPoints: [
          'Klikk på RESEARCH-knappen for å åpne forskningsmenyen',
          'Hver teknologi koster Intel og tar flere runder',
          'Kun én forskning om gangen',
          'Noen teknologier krever forutgående forskning',
          'Forskning kan ikke avbrytes når startet'
        ],
        practiceTask: 'Åpne Research-menyen. Utforsk tech-tree og planlegg din forskningsvei.',
        warningTips: [
          'Forskning binder opp Intel-ressurser',
          'Planlegg nøye - du kan ikke avbryte',
          'Noen teknologier tar 6-8 runder'
        ],
        proTips: [
          'Planlegg hele forskningsveien fra start',
          'Prioriter basert på din strategi',
          'Counterintelligence tidlig øker Intel-produksjon'
        ]
      },
      {
        id: 'research-priority',
        title: 'Forskningsprioriteringer',
        content: 'Velg forskning basert på din strategi og motstanders trusler.',
        keyPoints: [
          'Offensiv strategi: 50MT → 100MT → 200MT stridshoder',
          'Defensiv strategi: Missile Defense → Orbital Defense',
          'Økonomisk strategi: Produksjonsforbedringer → Handelsteknologi',
          'Diplomatisk strategi: Propaganda → Kulturell innflytelse',
          'Balansert: Kombiner forsvar og angrep'
        ],
        practiceTask: 'Velg din strategi og planlegg de første 5 forskningene.',
        warningTips: [
          'Ikke forsøm forsvar selv med offensiv strategi',
          'Visse teknologier krever andre først',
          'Fiender vil forske også - hold tritt'
        ],
        proTips: [
          '50MT rundt tur 6-8 er god timing',
          'Orbital Defense rundt tur 20 er kritisk',
          'Counterintelligence først øker total Intel'
        ]
      }
    ]
  },

  // SECTION 5: DIPLOMACY
  {
    id: 'diplomacy',
    title: 'Diplomati og Allianser',
    icon: <Users className="h-5 w-5" />,
    description: 'Lær å forme allianser og bruke diplomati effektivt',
    unlockTurn: 1,
    lessons: [
      {
        id: 'diplomacy-basics',
        title: 'Grunnleggende Diplomati',
        content: 'Diplomati lar deg forhandle med andre nasjoner uten å ty til våpen.',
        keyPoints: [
          'Åpne Diplomacy-menyen for å se relasjoner',
          'Hver nasjon har et forhold til deg (-100 til +100)',
          'Positive handlinger øker relasjoner',
          'Negative handlinger (angrep, trusler) reduserer relasjoner',
          'Visse handlinger krever minimum relasjonsnivå'
        ],
        practiceTask: 'Åpne Diplomacy-menyen. Observer relasjoner og tilgjengelige handlinger.',
        warningTips: [
          'Brudd på avtaler straffer relasjoner kraftig (-50)',
          'Lavt DEFCON gjør diplomati vanskeligere',
          'AI husker dine handlinger permanent'
        ],
        proTips: [
          'Bygg relasjoner tidlig, før du trenger dem',
          'Small favors (små favører) bygger tillit over tid',
          'Overvåk relasjoner mellom andre nasjoner'
        ]
      },
      {
        id: 'alliances',
        title: 'Allianser og Traktater',
        content: 'Form allianser for gjensidig beskyttelse og samarbeid.',
        keyPoints: [
          'Militær allianse: Gjensidig forsvar mot angrep',
          'Økonomisk allianse: Ressursdeling og handelsbonuser',
          'Forskningsallianse: Delt teknologiutvikling',
          'Allierte forsvarer hverandre automatisk',
          'Diplomatisk seier krever 60% av nasjoner i allianser'
        ],
        practiceTask: 'Form din første allianse med en nøytral eller vennlig nasjon.',
        warningTips: [
          'Brudd på allianse = massive relasjonstraff',
          'Allierte kan dra deg inn i kriger',
          'Overvåk alliertes handlinger'
        ],
        proTips: [
          'Form allianser med nasjoner nær dine fiender',
          'Spesialiserte allianser gir unike bonuser',
          'Tre sterke allianser bedre enn fem svake'
        ]
      },
      {
        id: 'trust-favors',
        title: 'Tillit og Favørsystemet',
        content: 'Relasjoner styres av tillit (0-100) og favører (gjeld/kreditt).',
        keyPoints: [
          'Tillit: 0-100 skala, påvirker diplomati-suksessrate',
          'Favører: Gjeld/kreditt-system mellom nasjoner',
          'Be om favør: Få ressurser eller hjelp (øker gjeld)',
          'Innfri favør: Hjelp alliert (øker tillit)',
          'Høy tillit = lettere forhandlinger'
        ],
        practiceTask: 'Observer Trust & Favors-panelet. Identifiser hvem som stoler på deg.',
        warningTips: [
          'Ikke be om for mange favører - det reduserer tillit',
          'Innfri favører raskt for å bygge gode relasjoner',
          'Brudd på favøravtaler ødelegger relasjoner'
        ],
        proTips: [
          'Gjør små favører tidlig for å bygge tillit',
          'Høy tillit gir bedre handelsbetingelser',
          'Bruk favørsystemet for å isolere fiender'
        ]
      }
    ]
  },

  // SECTION 6: CONVENTIONAL WARFARE
  {
    id: 'conventional',
    title: 'Konvensjonell Krigføring',
    icon: <Sword className="h-5 w-5" />,
    description: 'Lær om hærer, flåter og territorial erobring',
    unlockTurn: 11,
    lessons: [
      {
        id: 'conventional-basics',
        title: 'Introduksjon til Konvensjonell Krigføring',
        content: 'Fra tur 11 kan du bygge konvensjonelle styrker for å erobre territorier uten atomvåpen.',
        keyPoints: [
          'HÆRER: Landbaserte styrker for erobring',
          'FLÅTER: Sjømakt for maritim kontroll',
          'LUFTSTYRKER: Luftherredømme og støtte',
          'Erobring: Ta kontroll over byer og territorier',
          'Garnisjoner: Behold erobret territorium'
        ],
        practiceTask: 'Bygg din første hær. Observer kostnader og deploymentmuligheter.',
        warningTips: [
          'Konvensjonelle styrker er sårbare for atomvåpen',
          'Erobring uten garnisjoner fører til gjenerobring',
          'Luftherredømme er kritisk for suksess'
        ],
        proTips: [
          'Kombiner konvensjonelle og atomvåpen',
          'Erobre ressurs-rike byer først',
          'Etabler forsyningslinjer'
        ]
      },
      {
        id: 'territory-control',
        title: 'Territorial Kontroll og Okkupasjon',
        content: 'Erobre og administrer byer for ressurser og seiersbetingelser.',
        keyPoints: [
          'Hver by gir ressurser og befolkning',
          'Erobring krever hærer og evt. luftstøtte',
          'Garnisjoner holder erobret land',
          'Okkupasjon krever administrasjon',
          '10+ byer kreves for økonomisk seier'
        ],
        practiceTask: 'Planlegg hvilke byer du vil erobre. Prioriter basert på ressurser.',
        warningTips: [
          'Okkupasjon senker moral hos erobret befolkning',
          'Oppstand kan forekomme uten garnisjoner',
          'Overutvidelse kan svekke forsvaret hjemme'
        ],
        proTips: [
          'Prioriter strategisk viktige byer',
          'Kystbyer gir havnetilgang',
          'Grensebyer letter videre ekspansjon'
        ]
      }
    ]
  },

  // SECTION 7: CYBER WARFARE
  {
    id: 'cyber',
    title: 'Cyberkrigføring',
    icon: <Network className="h-5 w-5" />,
    description: 'Lær om hacking, sabotasje og digitale angrep',
    unlockTurn: 11,
    lessons: [
      {
        id: 'cyber-basics',
        title: 'Introduksjon til Cyber-operasjoner',
        content: 'Cyber-angrep er billigere enn militære angrep og kan svekke fiender uten direkte vold.',
        keyPoints: [
          'INTRUSION: Stjel data og hemmeligheter',
          'SABOTAGE: Ødelegg infrastruktur og produksjon',
          'FALSE-FLAG: Skyld på andre nasjoner',
          'Deteksjon: 40-70% sjanse for å bli oppdaget',
          'Attributering: Fiender kan spore angrep tilbake'
        ],
        practiceTask: 'Utfør din første cyber-intrusion. Observer resultat og deteksjonsrisiko.',
        warningTips: [
          'Deteksjon reduserer relasjoner',
          'False-flag kan mislykkes og avsløre deg',
          'Motfiender kan gjengjelde med cyber-angrep'
        ],
        proTips: [
          'Invester i cyber-forsvar for å beskytte deg',
          'Bruk false-flag for å starte kriger mellom andre',
          'Cyber-sabotasje før militært angrep svekker fienden'
        ]
      }
    ]
  },

  // SECTION 8: BIO-WARFARE
  {
    id: 'bio',
    title: 'Biologisk Krigføring',
    icon: <Biohazard className="h-5 w-5" />,
    description: 'Lær om biologiske våpen og pandemi-mekanikk',
    unlockTurn: 26,
    lessons: [
      {
        id: 'bio-basics',
        title: 'Introduksjon til Bio-krigføring',
        content: 'Fra tur 26 kan du utvikle biologiske våpen i Plague Inc.-stil. Utvikle patogener og deploy mot fiender.',
        keyPoints: [
          '7 plague-typer: Bacteria, Virus, Fungus, Parasite, Prion, Nano-virus, Bio-weapon',
          'DNA Points: Valuta for evolusjon',
          'Transmission: Hvordan patogenet sprer seg',
          'Symptoms: Effekter på smittede',
          'Deployment: Multi-nasjons deployment med attributering'
        ],
        practiceTask: 'Åpne Bio-Warfare Lab. Utforsk plague-typer og evolusjonstre.',
        warningTips: [
          'Bio-våpen kan spre seg ukontrollert',
          'For dødelige symptomer tidlig trekker oppmerksomhet',
          'Kureutvikl ing kan nøytralisere ditt våpen'
        ],
        proTips: [
          'Start med Bacteria - lettest å bruke',
          'Evolve transmission først for spredning',
          'Vent med dødelige symptomer til bred infeksjon',
          'Bruk false-flag deployment for å skjule ansvar'
        ]
      },
      {
        id: 'evolution-tree',
        title: 'Evolusjonstre og DNA Points',
        content: 'Bruk DNA Points for å utvikle ditt biologiske våpen.',
        keyPoints: [
          'TRANSMISSION: Luft, vann, blod, insekt, fugl, gnager',
          'SYMPTOMS: Mild til dødelig alvorlighet',
          'ABILITIES: Resistens, genetisk hardening',
          'DNA Points opptjenes ved infeksjon',
          'Evolusjoner kan ikke refunderes'
        ],
        practiceTask: 'Planlegg din første evolusjonssekvens. Balanser spredning og dødelighet.',
        warningTips: [
          'DNA Points er begrenset - bruk klokt',
          'Evolusjoner øker kostnaden',
          'Total lethality stopper spredning'
        ],
        proTips: [
          'Prioriter transmission tidlig (3-4 evolusjoner)',
          'Abilities beskytter mot motstiltak',
          'Kombiner bio-våpen med konvensjonell krigføring'
        ]
      }
    ]
  },

  // SECTION 9: INTELLIGENCE
  {
    id: 'intelligence',
    title: 'Etterretning og Spionasje',
    icon: <Eye className="h-5 w-5" />,
    description: 'Lær om overvåking, satellitter og spionasje',
    unlockTurn: 1,
    lessons: [
      {
        id: 'intel-basics',
        title: 'Grunnleggende Etterretning',
        content: 'Etterretning gir deg informasjon om fienders planer og kapasitet.',
        keyPoints: [
          'OVERVÅKING: Engangsspionasje på én nasjon',
          'SATELLITTER: Permanent overvåking',
          'SABOTAGE: Reduser fiendtlig produksjon',
          'COUNTERINTEL: Beskytt mot fiendtlig spionasje',
          'Kostnad: 20-80 Intel per operasjon'
        ],
        practiceTask: 'Overvåk din største trussel. Analyser informasjonen du får.',
        warningTips: [
          'Overvåking er engangs - satellitter er permanente',
          'Counterintel reduserer fiendtlig suksessrate',
          'Visse nasjoner har bedre spionasje'
        ],
        proTips: [
          'Deploy satellitter tidlig over største trusler',
          'Overvåk før store offensive operasjoner',
          'Counterintel-forskning øker Intel-produksjon også'
        ]
      }
    ]
  },

  // SECTION 10: VICTORY CONDITIONS
  {
    id: 'victory',
    title: 'Seiersbetingelser',
    icon: <Trophy className="h-5 w-5" />,
    description: 'Lær om alle seks seiersbetingelser',
    unlockTurn: 1,
    lessons: [
      {
        id: 'victory-overview',
        title: 'Oversikt over Seiersbetingelser',
        content: 'Det finnes 6 forskjellige måter å vinne spillet på. Velg din strategi tidlig.',
        keyPoints: [
          '1. DIPLOMATISK: 60% allianser, DEFCON ≥4, 120+ innflytelse (tur 10+)',
          '2. DOMINANS: Eliminer alle fiender (når som helst)',
          '3. ØKONOMISK: 10+ byer, 4+ handelsruter, +50 ressurser/runde (tur 11+)',
          '4. DEMOGRAFISK: 60% global befolkning, <30 ustabilitet (tur 15+)',
          '5. OVERLEVELSE: Overlev 50 runder, 50M+ befolkning',
          '6. KULTURELL: Propaganda-teknologi, konverter fiender (tur 26+)'
        ],
        practiceTask: 'Velg din primære og sekundære seiersstrategi. Planlegg veien dit.',
        warningTips: [
          'Noen seiere krever spesifikke runder (tidligst)',
          'Fiender vil aktivt motarbeide din seiersstrategi',
          'Ha alltid en backup-plan'
        ],
        proTips: [
          'Diplomatisk seier er raskest (tur 10+)',
          'Overlevelse er enklest men tar lengst tid',
          'Kombinér strategier for fleksibilitet'
        ]
      },
      {
        id: 'victory-diplomatic',
        title: 'Diplomatisk Seier - Detaljert Guide',
        content: 'Vinn gjennom allianser og diplomati uten krig.',
        keyPoints: [
          'KRAV: Allianser med 60% av nasjoner',
          'Hold DEFCON ≥4 i minimum 4 runder',
          'Oppnå 120+ global innflytelse',
          'Tidligst: Tur 10',
          'Bonus: Ingen militære tap'
        ],
        practiceTask: 'Åpne Victory Progress-panelet. Spor fremgang mot diplomatisk seier.',
        warningTips: [
          'Aggressive handlinger senker DEFCON',
          'Brudd på avtaler ødelegger diplomati permanent',
          'AI kan bryte allianser hvis provosert'
        ],
        proTips: [
          'Form allianser fra tur 1',
          'Små favører tidlig bygger tillit',
          'Beskytt allierte mot aggresjon',
          'Unngå konflikter helt - fokuser på diplomati'
        ]
      }
    ]
  },

  // SECTION 11: GOVERNANCE
  {
    id: 'governance',
    title: 'Styresett og Moral',
    icon: <Vote className="h-5 w-5" />,
    description: 'Lær å administrere befolkning og moral',
    unlockTurn: 1,
    lessons: [
      {
        id: 'governance-basics',
        title: 'Befolkningstilfredshet og Moral',
        content: 'Din befolkning reagerer på dine handlinger. Lav moral kan føre til regime-skifte.',
        keyPoints: [
          'Moral: 0-100 skala',
          'Påvirkes av: Militære tap, økonomisk suksess, trusler',
          'Lav moral (<30): Risiko for regime change',
          'Valg: Hver 12. runde (>40% approval kreves)',
          'Game over: Hvis du mister valg eller regime change'
        ],
        practiceTask: 'Observer moral-panelet. Identifiser hva som påvirker moralen.',
        warningTips: [
          'Massive tap senker moral kraftig',
          'Regime change = game over',
          'Tapte valg = game over'
        ],
        proTips: [
          'Hold moral over 50 for stabilitet',
          'Forsvar befolkningen aktivt',
          'Diplomatiske seire øker moral'
        ]
      }
    ]
  }
];

export function ComprehensiveTutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const section = TUTORIAL_SECTIONS[currentSection];
  const lesson = section?.lessons[currentLesson];

  const totalLessons = TUTORIAL_SECTIONS.reduce((sum, s) => sum + s.lessons.length, 0);
  const completedCount = completedLessons.size;
  const progressPercent = (completedCount / totalLessons) * 100;

  const handleNext = () => {
    if (lesson && !completedLessons.has(lesson.id)) {
      setCompletedLessons(prev => new Set(prev).add(lesson.id));
    }

    if (currentLesson < section.lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else if (currentSection < TUTORIAL_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentLesson(0);
    }
  };

  const handlePrevious = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setCurrentLesson(TUTORIAL_SECTIONS[currentSection - 1].lessons.length - 1);
    }
  };

  const handleSectionSelect = (sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    setCurrentLesson(0);
  };

  const handleMarkComplete = () => {
    if (lesson) {
      setCompletedLessons(prev => new Set(prev).add(lesson.id));
    }
  };

  const isFirstLesson = currentSection === 0 && currentLesson === 0;
  const isLastLesson = currentSection === TUTORIAL_SECTIONS.length - 1 &&
                       currentLesson === section.lessons.length - 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                <div>
                  <DialogTitle className="text-2xl">Komplett Tutorial</DialogTitle>
                  <DialogDescription className="mt-1">
                    Lær alle spillmekanikker trinn for trinn
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  {completedCount} / {totalLessons} leksjoner fullført
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <Progress value={progressPercent} className="h-2" />
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Sections */}
            <div className="w-64 border-r overflow-y-auto">
              <div className="p-4 space-y-2">
                {TUTORIAL_SECTIONS.map((sec, idx) => {
                  const sectionCompleted = sec.lessons.every(l => completedLessons.has(l.id));
                  const sectionProgress = sec.lessons.filter(l => completedLessons.has(l.id)).length;
                  const isActive = idx === currentSection;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => handleSectionSelect(idx)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isActive ? 'bg-accent border-primary' : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="text-primary mt-0.5">{sec.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{sec.title}</h4>
                            {sectionCompleted && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {sec.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress
                              value={(sectionProgress / sec.lessons.length) * 100}
                              className="h-1"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {sectionProgress}/{sec.lessons.length}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs mt-2">
                            Tur {sec.unlockTurn}+
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main content - Lesson */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-6">
                {lesson && (
                  <div className="max-w-3xl space-y-6">
                    {/* Lesson header */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          Leksjon {currentLesson + 1} av {section.lessons.length}
                        </Badge>
                        {completedLessons.has(lesson.id) ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Fullført
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkComplete}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Marker som fullført
                          </Button>
                        )}
                      </div>
                      <h2 className="text-3xl font-bold">{lesson.title}</h2>
                    </div>

                    {/* Lesson content */}
                    <div className="prose prose-sm max-w-none">
                      <p className="text-base leading-relaxed">{lesson.content}</p>
                    </div>

                    {/* Key points */}
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Nøkkelpunkter
                      </h3>
                      <ul className="space-y-2">
                        {lesson.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">▸</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Practice task */}
                    {lesson.practiceTask && (
                      <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-lg">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <PlayCircle className="h-4 w-4 text-primary" />
                          Øvingsoppgave
                        </h3>
                        <p className="text-sm">{lesson.practiceTask}</p>
                      </div>
                    )}

                    {/* Warning tips */}
                    {lesson.warningTips && lesson.warningTips.length > 0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                          <AlertTriangle className="h-4 w-4" />
                          Viktige Advarsler
                        </h3>
                        <ul className="space-y-2">
                          {lesson.warningTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-yellow-600 dark:text-yellow-500 mt-1">⚠</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Pro tips */}
                    {lesson.proTips && lesson.proTips.length > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-500">
                          <Zap className="h-4 w-4" />
                          Pro-tips
                        </h3>
                        <ul className="space-y-2">
                          {lesson.proTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-blue-600 dark:text-blue-500 mt-1">💡</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Navigation footer */}
              <div className="border-t p-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isFirstLesson}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Forrige
                </Button>

                <div className="text-sm text-muted-foreground">
                  Seksjon {currentSection + 1} / {TUTORIAL_SECTIONS.length}
                </div>

                {isLastLesson ? (
                  <Button onClick={onClose}>
                    Fullfør Tutorial
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Neste
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
