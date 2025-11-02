/**
 * GameDatabase Component
 *
 * Comprehensive game reference database covering all game mechanics, systems, and features.
 * Accessible from the Options menu for easy reference during gameplay.
 */

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Target, Zap, Shield, Radio, Factory, Users,
  AlertTriangle, Sword, Skull, Biohazard, Network,
  Trophy, Vote, Globe, Flame, Eye, Search, X,
  Rocket, Bomb, ShieldAlert, Satellite, Lock, Unlock,
  ChevronLeft
} from 'lucide-react';

interface DatabaseEntry {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  summary: string;
  details: string;
  mechanics?: string[];
  tips?: string[];
  unlockTurn?: number;
  relatedTopics?: string[];
}

// Comprehensive database of all game mechanics
const DATABASE_ENTRIES: DatabaseEntry[] = [
  // BASIC MECHANICS
  {
    id: 'resources',
    title: 'Ressurssystem',
    category: 'basics',
    icon: <Factory className="h-5 w-5" />,
    summary: 'Tre hovedressurser driver din nasjon: Produksjon, Uran og Intel.',
    details: 'Ressurser regenereres hver runde basert på din nasjons produksjonskapasitet. Produksjon brukes til å bygge militærutstyr, Uran for å skape atomstridshoder, og Intel for forskning og spionasje.',
    mechanics: [
      'Produksjon: 50-200 per runde avhengig av nasjon',
      'Uran: 10-50 per runde, nødvendig for stridshoder',
      'Intel: 20-100 per runde, brukes til forskning og operasjoner',
      'Ressurser akkumuleres hvis de ikke brukes',
      'Visse hendelser kan redusere ressursproduksjon'
    ],
    tips: [
      'Balanser ressursbruk - ikke bruk alt på én type våpen',
      'Spar ressurser for nødsituasjoner',
      'Forsk frem teknologier som øker ressursproduksjon'
    ]
  },
  {
    id: 'defcon',
    title: 'DEFCON-system',
    category: 'basics',
    icon: <AlertTriangle className="h-5 w-5" />,
    summary: 'DEFCON (Defense Condition) måler krigsberedskap fra 5 (fred) til 1 (nukleær krig).',
    details: 'DEFCON-nivået påvirker hvilke våpen du kan deployere, hvordan andre nasjoner reagerer, og seiersbetingelsene. Aggressive handlinger senker DEFCON, mens diplomati kan heve det.',
    mechanics: [
      'DEFCON 5: Fred - normal produksjon, full diplomati',
      'DEFCON 4: Økt beredskap - overvåking aktivert',
      'DEFCON 3: Høy beredskap - diplomatiske straffer',
      'DEFCON 2: Krigstilstand nær - strategiske våpen låst opp',
      'DEFCON 1: Nukleær krig - alle våpen tilgjengelige'
    ],
    tips: [
      'Hold DEFCON høyt for diplomatisk seier',
      'DEFCON 2 kreves for å deployere tyngste våpen',
      'Overvåk andre nasjoners DEFCON-nivå',
      'Hvert DEFCON-nivå har unike konsekvenser'
    ],
    relatedTopics: ['diplomacy', 'victory-diplomatic']
  },
  {
    id: 'turn-structure',
    title: 'Rundestruktur',
    category: 'basics',
    icon: <Target className="h-5 w-5" />,
    summary: 'Hver runde består av fire faser: Spiller, AI, Oppgjør og Produksjon.',
    details: 'Spillet går fremover i strukturerte runder hvor hver nasjon får mulighet til å handle, etterfulgt av oppgjør av alle handlinger og regenerering av ressurser.',
    mechanics: [
      'SPILLER-fase: Du tar dine handlinger (bygg, angrip, forsk, etc.)',
      'AI-fase: Alle AI-nasjoner tar sine handlinger',
      'OPPGJØR-fase: Angrep løses, skader beregnes, effekter anvendes',
      'PRODUKSJONS-fase: Ressurser regenereres, effekter avtar'
    ],
    tips: [
      'Planlegg handlinger før du bekrefter runden',
      'AI kan reagere på dine handlinger',
      'Visse handlinger tar flere runder å fullføre'
    ]
  },

  // NUCLEAR WARFARE
  {
    id: 'icbms',
    title: 'ICBMs (Interkontinentale Ballistiske Missiler)',
    category: 'nuclear',
    icon: <Rocket className="h-5 w-5" />,
    summary: 'Langtrekkende atomraketter som kan nå ethvert mål globalt.',
    details: 'ICBMs er dine primære angrepsvåpen. De kan utstyres med stridshoder fra 10MT til 200MT. Større stridshoder gjør mer skade men koster mer Uran.',
    mechanics: [
      'Kostnad: 30 Produksjon + Uran (avhengig av stridshode)',
      'Rekkevidde: Global',
      'Hastighet: Rask (treffer samme runde)',
      'Kan avskjæres av misselforsvar',
      'Stridshoder: 10MT, 20MT, 50MT, 100MT, 200MT'
    ],
    tips: [
      'Bygg misselforsvar før du angriper - forvent gjengjeldelse',
      'Større stridshoder = mer ødeleggelse = mer Uran',
      'ICBMs kan ikke returneres etter avfyring',
      '200MT "Planet Cracker" krever avansert forskning'
    ],
    relatedTopics: ['warheads', 'missile-defense', 'research-nuclear']
  },
  {
    id: 'bombers',
    title: 'Strategiske Bombefly',
    category: 'nuclear',
    icon: <Bomb className="h-5 w-5" />,
    summary: 'Atomvåpenbærende fly som kan returnere til base.',
    details: 'Bombefly er saktere enn raketter men kan kalles tilbake og gjenbrukes. De kan også bære tunge stridshoder.',
    mechanics: [
      'Kostnad: 40 Produksjon + Uran for stridshode',
      'Hastighet: Sakte (2-3 runder til mål)',
      'Kan kalles tilbake før målet nås',
      'Kan avskjæres av luftforsvar',
      'Kan gjenbrukes hvis de overlever'
    ],
    tips: [
      'Bruk bombefly for fleksibilitet',
      'Kall tilbake hvis fienden kapitulerer',
      'Bombefly kan koordineres med rakett-angrep',
      'Forsvar mot fiendtlig luftforsvar'
    ],
    relatedTopics: ['icbms', 'air-defense', 'warheads']
  },
  {
    id: 'warheads',
    title: 'Atomstridshoder',
    category: 'nuclear',
    icon: <Skull className="h-5 w-5" />,
    summary: 'Atomladninger fra 10MT til 200MT som monteres på våpen.',
    details: 'Stridshoder bestemmer et våpens ødeleggelseskraft. Større stridshoder krever mer Uran og avansert forskning.',
    mechanics: [
      '10MT: 5 Uran - Grunnleggende stridshode',
      '20MT: 10 Uran - Forbedret ødeleggelse',
      '50MT: 25 Uran - Kraftig stridshode (krever forskning)',
      '100MT: 50 Uran - Strategisk stridshode (krever forskning)',
      '200MT: 100 Uran - "Planet Cracker" (krever avansert forskning)'
    ],
    tips: [
      'Start med 10-20MT stridshoder',
      'Forsk deg opp til større stridshoder',
      '200MT kan ødelegge flere mål samtidig',
      'Balanser kraft mot kostnad'
    ],
    relatedTopics: ['research-nuclear', 'icbms', 'bombers'],
    unlockTurn: 1
  },
  {
    id: 'missile-defense',
    title: 'Missilforsvar',
    category: 'nuclear',
    icon: <ShieldAlert className="h-5 w-5" />,
    summary: 'Forsvarssystemer som avskjærer innkommende raketter og bombefly.',
    details: 'Missilforsvar er kritisk for overlevelse. Hvert forsvarssystem kan avskjære ett angrep per runde.',
    mechanics: [
      'Kostnad: 25 Produksjon per enhet',
      'Avskjæringsrate: 70-90% avhengig av teknologi',
      'Kan avskjære raketter og bombefly',
      'Forbrukes ved bruk (må bygges på nytt)',
      'Orbital Defense Grid gir permanent forsvar'
    ],
    tips: [
      'Bygg forsvar tidlig - du vil bli angrepet',
      'Beregn hvor mye forsvar du trenger',
      'Orbital Defense Grid er beste langsiktige investering',
      'Forsvar beskytter også mot fiendtlig gjengjeldelse'
    ],
    relatedTopics: ['orbital-defense', 'research-defense', 'icbms']
  },
  {
    id: 'submarines',
    title: 'Atomubåter',
    category: 'nuclear',
    icon: <Target className="h-5 w-5" />,
    summary: 'Ubåter utstyrt med atomraketter, vanskeligere å oppdage og avskjære.',
    details: 'Atomubåter gir en skjult andregangs-angrepskapasitet. De er vanskeligere å oppdage og avskjære enn landbaserte raketter.',
    mechanics: [
      'Kostnad: 60 Produksjon + Uran for stridshode',
      'Deteksjonssjanse: 30% (vs 90% for ICBMs)',
      'Avskjæringsrate: Redusert',
      'Kan bære multiple stridshoder',
      'Krever forskning å låse opp'
    ],
    tips: [
      'Ubåter er beste forsikring mot første-angrep',
      'Vanskeligere for fienden å forsvare seg mot',
      'Invester i ubåter for overlevelses-strategi',
      'Kombinér med landbaserte systemer'
    ],
    relatedTopics: ['icbms', 'research-nuclear'],
    unlockTurn: 15
  },

  // DEFENSE SYSTEMS
  {
    id: 'orbital-defense',
    title: 'Orbital Defense Grid',
    category: 'defense',
    icon: <Satellite className="h-5 w-5" />,
    summary: 'Satellitt-basert forsvarssystem som gir permanent beskyttelse.',
    details: 'Det ultimate forsvarssystemet. Når det er bygget, gir det permanent missilavskjæring uten å forbrukes.',
    mechanics: [
      'Kostnad: 200 Produksjon, 100 Intel (engangs)',
      'Avskjæringsrate: 85% permanent',
      'Forbrukes ikke ved bruk',
      'Beskytter mot alle typer angrep',
      'Krever avansert forskning'
    ],
    tips: [
      'Prioriter denne forskningen i midten av spillet',
      'Investeringen betaler seg over tid',
      'Kombinér med konvensjonelt forsvar',
      'Beskytter mot både raketter og bombefly'
    ],
    relatedTopics: ['missile-defense', 'research-defense'],
    unlockTurn: 20
  },
  {
    id: 'force-fields',
    title: 'Kraftfelt-teknologi',
    category: 'defense',
    icon: <Shield className="h-5 w-5" />,
    summary: 'Avansert energi-skjold som kan blokkere atomeksplosjoner.',
    details: 'Den mest avanserte forsvarsteknologien. Kraftfelt kan delvis absorbere atomeksplosjoner.',
    mechanics: [
      'Kostnad: 300 Produksjon, 150 Intel',
      'Skadeabsorpsjon: 50%',
      'Virker mot alle typer angrep',
      'Permanent når bygget',
      'Krever meget avansert forskning'
    ],
    tips: [
      'Sene-spill teknologi',
      'Kombinér med Orbital Defense',
      'Kan gjøre deg nær usårbar',
      'Prioriter hvis du planlegger lang krig'
    ],
    relatedTopics: ['orbital-defense', 'research-defense'],
    unlockTurn: 30
  },

  // RESEARCH & TECHNOLOGY
  {
    id: 'research-system',
    title: 'Forskningssystem',
    category: 'research',
    icon: <Radio className="h-5 w-5" />,
    summary: 'Lås opp avanserte våpen, forsvar og evner gjennom forskning.',
    details: 'Forskning bruker Intel-ressurser over flere runder for å låse opp nye teknologier. Noen teknologier krever forutgående forskning.',
    mechanics: [
      'Kostnad: Varierer (50-300 Intel)',
      'Varighet: 2-8 runder',
      'Kan kun forske én ting om gangen',
      'Noen teknologier har forutsetninger',
      'Forskning kan ikke avbrytes'
    ],
    tips: [
      'Planlegg forskningsveien din tidlig',
      'Prioriter basert på din strategi',
      'Counterintelligence øker Intel-produksjon',
      'Ikke forsøm forsvar-forskning'
    ],
    relatedTopics: ['research-nuclear', 'research-defense', 'research-cyber'],
    unlockTurn: 6
  },
  {
    id: 'research-nuclear',
    title: 'Atomvåpen-forskning',
    category: 'research',
    icon: <Skull className="h-5 w-5" />,
    summary: 'Forsk frem større og mer effektive atomvåpen.',
    details: 'Atomvåpen-forskning låser opp større stridshoder, forbedret nøyaktighet, og spesialiserte våpensystemer.',
    mechanics: [
      '50MT Warhead (100 Intel, 3 runder)',
      '100MT Warhead (150 Intel, 4 runder, krever 50MT)',
      '200MT Planet Cracker (250 Intel, 6 runder, krever 100MT)',
      'Forbedret rakettmotorer (80 Intel, 2 runder)',
      'Ubåt-teknologi (120 Intel, 4 runder)'
    ],
    tips: [
      'Start med 50MT forskning rundt tur 6-8',
      '200MT er spillendrende - prioriter i mid-game',
      'Ubåter gir andregangs-angrepskapasitet'
    ],
    relatedTopics: ['research-system', 'warheads', 'submarines'],
    unlockTurn: 6
  },
  {
    id: 'research-defense',
    title: 'Forsvarsforskning',
    category: 'research',
    icon: <Shield className="h-5 w-5" />,
    summary: 'Forbedr forsvarssystemer og overlevelsesevne.',
    details: 'Forsvarsforskning øker missilavskjæringsrate, låser opp Orbital Defense, og gir beskyttelse mot angrep.',
    mechanics: [
      'Forbedret Missile Defense (80 Intel, 2 runder)',
      'Orbital Defense Grid (200 Intel, 5 runder)',
      'Force Field teknologi (300 Intel, 7 runder, krever Orbital Defense)',
      'Bunkerbygging (60 Intel, 2 runder)'
    ],
    tips: [
      'Forsvar-forskning er like viktig som angrep',
      'Prioriter Orbital Defense Grid tidlig',
      'Force Fields er ultimate forsvar'
    ],
    relatedTopics: ['research-system', 'orbital-defense', 'force-fields'],
    unlockTurn: 6
  },
  {
    id: 'research-cyber',
    title: 'Cyber-forskning',
    category: 'research',
    icon: <Network className="h-5 w-5" />,
    summary: 'Lås opp cyber-angrep og digital forsvar.',
    details: 'Cyber-forskning gir tilgang til hacking, sabotasje, og digitalt forsvar.',
    mechanics: [
      'Basic Cyber Ops (100 Intel, 3 runder) - Låser opp cyber-angrep',
      'Advanced Firewalls (120 Intel, 3 runder)',
      'AI Defense Systems (180 Intel, 4 runder)',
      'Cyber Superweapons (250 Intel, 6 runder)'
    ],
    tips: [
      'Cyber-angrep er billigere enn militære angrep',
      'Kan sabotere fiendtlig produksjon',
      'Forsvar deg mot fiendtlige cyber-angrep'
    ],
    relatedTopics: ['research-system', 'cyber-warfare'],
    unlockTurn: 11
  },

  // DIPLOMACY
  {
    id: 'diplomacy',
    title: 'Diplomatisystem',
    category: 'diplomacy',
    icon: <Users className="h-5 w-5" />,
    summary: 'Bruk diplomati for å forme allianser, traktater og fredelig sameksistens.',
    details: 'Diplomati lar deg forhandle med andre nasjoner, forme allianser, inngå traktater, og påvirke globale relasjoner.',
    mechanics: [
      'Fredsforslag: Midlertidig våpenhvile',
      'Allianser: Militært samarbeid',
      'Ikke-angrepspakter: Gjensidig beskyttelse',
      'Økonomisk bistand: Ressursdeling',
      'Sansjoner: Økonomiske straffer',
      'Kapitulasjonskrav: Tvinge overgivelse'
    ],
    tips: [
      'Bygg tillit over tid',
      'Bryt ikke løfter - det reduserer tillit permanent',
      'Allianser kan vinne spillet',
      'Overvåk andre nasjoners relasjoner'
    ],
    relatedTopics: ['victory-diplomatic', 'trust-system', 'alliances'],
    unlockTurn: 1
  },
  {
    id: 'trust-system',
    title: 'Tillit og Favører',
    category: 'diplomacy',
    icon: <Users className="h-5 w-5" />,
    summary: 'Relasjoner mellom nasjoner måles i tillit (0-100) og favører (gjeld/kreditt).',
    details: 'Hver nasjon har et tillitsnivå til andre nasjoner. Høy tillit gjør diplomati lettere, lav tillit gjør det vanskeligere.',
    mechanics: [
      'Tillit: 0-100 skala per nasjon',
      'Positive handlinger øker tillit',
      'Negative handlinger reduserer tillit',
      'Favører: Gjeld/kreditt-system',
      'Be om favører for å få hjelp',
      'Innfri favører for å bygge tillit'
    ],
    tips: [
      'Høy tillit = lettere diplomati',
      'Ikke bryt løfter - tilliten faller drastisk',
      'Gjør favører for å bygge allianser',
      'Overvåk hvem som skylder hvem'
    ],
    relatedTopics: ['diplomacy', 'alliances'],
    unlockTurn: 16
  },
  {
    id: 'alliances',
    title: 'Allianser',
    category: 'diplomacy',
    icon: <Users className="h-5 w-5" />,
    summary: 'Form militære, økonomiske eller forsknings-allianser med andre nasjoner.',
    details: 'Allianser gir bonuser og beskyttelse. Spesialiserte allianser gir unike fordeler.',
    mechanics: [
      'Militær allianse: Gjensidig forsvar',
      'Økonomisk allianse: Ressursdeling',
      'Forsknings-allianse: Delt teknologi',
      'Allianse-medlemmer forsvarer hverandre',
      'Brudd på allianse straffer tillit kraftig'
    ],
    tips: [
      'Form allianser tidlig for diplomatisk seier',
      'Spesialiserte allianser gir unike bonuser',
      'Beskytt allierte - de beskytte deg',
      'Kreves for diplomatisk seier (60% av nasjoner)'
    ],
    relatedTopics: ['diplomacy', 'trust-system', 'victory-diplomatic'],
    unlockTurn: 10
  },

  // CONVENTIONAL WARFARE
  {
    id: 'conventional-warfare',
    title: 'Konvensjonell Krigføring',
    category: 'conventional',
    icon: <Sword className="h-5 w-5" />,
    summary: 'Ikke-atomvåpen krigføring med hærer, flåter og luftstyrker.',
    details: 'Fra tur 11 kan du bygge konvensjonelle styrker for å erobre territorier uten atomvåpen.',
    mechanics: [
      'Hærer: Landbaserte styrker for erobring',
      'Flåter: Sjømakt for marinekontroll',
      'Luftstyrker: Luftdominans og støtte',
      'Erobring: Ta kontroll over territorier',
      'Garnisjoner: Behold erobret land'
    ],
    tips: [
      'Kombinér konvensjonelle og atomvåpen',
      'Bruk konvensjonell krigføring for økonomisk seier',
      'Garnisjoner forhindrer gjenerobring',
      'Luftherredømme gir store fordeler'
    ],
    relatedTopics: ['territory-control', 'victory-economic'],
    unlockTurn: 11
  },
  {
    id: 'territory-control',
    title: 'Territorial Kontroll',
    category: 'conventional',
    icon: <Globe className="h-5 w-5" />,
    summary: 'Erobre og kontroller byer og territorier for økonomisk makt.',
    details: 'Konvensjonelle styrker kan erobre byer og territorier, som gir ressurser og bidrar til økonomisk seier.',
    mechanics: [
      'Byer: Gir ressurser og befolkning',
      'Erobring: Krever hærer og luftstøtte',
      'Garnisjoner: Hold erobret territorium',
      'Okkupasjon: Administrer erobret land',
      'Befolkningskontroll: 60% kreves for demografisk seier'
    ],
    tips: [
      'Prioriter strategisk viktige byer',
      '10+ byer kreves for økonomisk seier',
      'Garnisjoner forhindrer oppstand',
      'Balancer erobring og forsvar'
    ],
    relatedTopics: ['conventional-warfare', 'victory-economic', 'victory-demographic'],
    unlockTurn: 11
  },

  // CYBER WARFARE
  {
    id: 'cyber-warfare',
    title: 'Cyberkrigføring',
    category: 'cyber',
    icon: <Network className="h-5 w-5" />,
    summary: 'Digitale angrep for å stjele data, sabotere infrastruktur, og villlede fiender.',
    details: 'Fra tur 11 kan du utføre cyber-angrep. Disse er billigere enn militære angrep men har sine egne risikoer.',
    mechanics: [
      'Intrusion: Stjel data og hemmeligheter',
      'Sabotasje: Ødelegg infrastruktur',
      'False-flag: Skyld på andre nasjoner',
      'Deteksjon: 40-70% sjanse for å bli oppdaget',
      'Attributering: Fiender kan spore angrep tilbake'
    ],
    tips: [
      'Cyber-angrep er billigere enn militære angrep',
      'False-flag kan starte kriger mellom andre',
      'Invester i cyber-forsvar',
      'Kombiner med konvensjonell krigføring'
    ],
    relatedTopics: ['research-cyber', 'intelligence'],
    unlockTurn: 11
  },

  // BIO-WARFARE
  {
    id: 'bio-warfare',
    title: 'Biologisk Krigføring',
    category: 'bio',
    icon: <Biohazard className="h-5 w-5" />,
    summary: 'Utvikle og deploy biologiske våpen for å ødelegge fiendtlige nasjoner.',
    details: 'Fra tur 26 kan du forske frem biologiske våpen i Plague Inc.-stil. Utvikle patogener, evolve symptomer, og deploy mot fiender.',
    mechanics: [
      'Plague-typer: Bacteria, Virus, Fungus, Parasite, Prion, Nano-virus, Bio-weapon',
      'DNA Points: Valuta for å kjøpe evolusjoner',
      'Transmission: Luft, vann, blod, insekt, fugl, gnager',
      'Symptoms: Mild til dødelig alvorlighet',
      'Abilities: Resistens, genetisk hardening',
      'Deployment: Multi-nasjons deployment med attributering'
    ],
    tips: [
      'Start med Bacteria - lettest å bruke',
      'Evolve transmission tidlig for spredning',
      'Unngå for dødelige symptomer tidlig - det trekker oppmerksomhet',
      'False-flag deployment kan skjule din rolle',
      'Combine med konvensjonelle og atomvåpen'
    ],
    relatedTopics: ['plague-types', 'evolution-tree', 'dna-points'],
    unlockTurn: 26
  },
  {
    id: 'plague-types',
    title: 'Plague-typer',
    category: 'bio',
    icon: <Biohazard className="h-5 w-5" />,
    summary: 'Syv typer biologiske våpen, hver med unike egenskaper.',
    details: 'Hver plague-type har egne styrker, svakheter, og evolusjonsmønstre.',
    mechanics: [
      'Bacteria: Balansert, lett å bruke, god for nybegynnere',
      'Virus: Hurtig mutasjon, vanskeligere å kontrollere',
      'Fungus: Langsom spredning, men vanskelig å kurere',
      'Parasite: Subtil, vanskeligere å oppdage',
      'Prion: Ekstrem langsomhet, nesten umulig å kurere',
      'Nano-virus: Hurtig men ustabil, krever konstant evolusjon',
      'Bio-weapon: Dødeligst, men trekker massiv oppmerksomhet'
    ],
    tips: [
      'Start med Bacteria for å lære systemet',
      'Virus er beste for hurtig eliminering',
      'Prion er beste for stealth-approach',
      'Bio-weapon for total annihilering'
    ],
    relatedTopics: ['bio-warfare', 'evolution-tree'],
    unlockTurn: 26
  },
  {
    id: 'evolution-tree',
    title: 'Evolusjonstre',
    category: 'bio',
    icon: <Radio className="h-5 w-5" />,
    summary: 'Utvikle dine biologiske våpen med transmission, symptomer, og evner.',
    details: 'Bruk DNA Points for å kjøpe evolusjoner i tre kategorier: Transmission, Symptoms, og Abilities.',
    mechanics: [
      'Transmission: Hvordan patogenet sprer seg (luft, vann, insekt, etc.)',
      'Symptoms: Effekter på smittede (mild til dødelig)',
      'Abilities: Resistens og defensive evner',
      'DNA Points: Opptjen ved infeksjon og spredning',
      'Evolution-cost: Øker med hvert nivå'
    ],
    tips: [
      'Prioriter transmission tidlig',
      'Vent med dødelige symptomer til bred spredning',
      'Abilities beskytter mot motstiltak',
      'Balanser spredning og dødelighet'
    ],
    relatedTopics: ['bio-warfare', 'dna-points', 'plague-types'],
    unlockTurn: 26
  },
  {
    id: 'dna-points',
    title: 'DNA Points',
    category: 'bio',
    icon: <Target className="h-5 w-5" />,
    summary: 'Valuta for å kjøpe evolusjoner i biologiske våpen.',
    details: 'DNA Points opptjenes ved å infisere mennesker, spre patogenet, og nå milepæler.',
    mechanics: [
      'Opptjen: 1-5 DNA per infeksjon',
      'Bonus: Første infeksjon i nytt land',
      'Milestones: 100, 1000, 10000 infeksjoner',
      'Kostnad: Evolusjoner koster 5-50 DNA',
      'Ikke kan refunderes - velg klokt'
    ],
    tips: [
      'Spre til mange land for bonuser',
      'Spar DNA til kritiske evolusjoner',
      'Evolve transmission tidlig for mer DNA',
      'Planlegg evolusjonsveien din'
    ],
    relatedTopics: ['bio-warfare', 'evolution-tree'],
    unlockTurn: 26
  },

  // PANDEMIC SYSTEM
  {
    id: 'pandemic',
    title: 'Pandemisystem',
    category: 'pandemic',
    icon: <Biohazard className="h-5 w-5" />,
    summary: 'Globale sykdommer kan spre seg naturlig eller som våpen.',
    details: 'Pandemier kan oppstå naturlig eller som resultat av bio-våpen. De påvirker befolkning, produksjon, og stabilitet.',
    mechanics: [
      'Naturlige pandemier: Tilfeldig spredning',
      'Våpeniserte pandemier: Bevisst deployment',
      'Spredning: Land til land basert på handel og reise',
      'Mutasjon: Sykdommer kan mutere',
      'Countermeasures: Vaksiner, karantener, forskning'
    ],
    tips: [
      'Pandemier kan ødelegge fiendens økonomi',
      'Beskytt din egen befolkning med motstiltak',
      'Naturlige pandemier er uforutsigbare',
      'Vaccine-forskning tar tid - start tidlig'
    ],
    relatedTopics: ['bio-warfare', 'governance'],
    unlockTurn: 20
  },

  // GOVERNANCE
  {
    id: 'governance',
    title: 'Styresett og Moral',
    category: 'governance',
    icon: <Vote className="h-5 w-5" />,
    summary: 'Administrer din nasjon gjennom valg, opinion, og stabilitet.',
    details: 'Din befolkning reagerer på dine handlinger. Lav moral kan føre til regime-skifte og game over.',
    mechanics: [
      'Moral: 0-100 befolkningstilfredshet',
      'Valg: Hver 12. runde',
      'Cabinet approval: Regjeringens støtte',
      'Regime change: Hvis moral < 30',
      'Immigration: Påvirket av leveforhold'
    ],
    tips: [
      'Hold moral over 50 for stabilitet',
      'Aggressive handlinger senker moral',
      'Forsvar befolkningen for å øke moral',
      'Valg kan fjerne deg fra makten'
    ],
    relatedTopics: ['elections', 'stability'],
    unlockTurn: 1
  },
  {
    id: 'elections',
    title: 'Valg',
    category: 'governance',
    icon: <Vote className="h-5 w-5" />,
    summary: 'Demokratiske nasjoner holder valg hver 12. runde.',
    details: 'Hvis din popularitet er for lav, kan du miste valget og game over.',
    mechanics: [
      'Frekvens: Hver 12. runde',
      'Threshold: >40% approval for å vinne',
      'Påvirket av: Moral, militære tap, økonomisk suksess',
      'Konsekvens: Tap = game over',
      'Unngåelse: Høy moral og suksess'
    ],
    tips: [
      'Overvåk approval ratings',
      'Unngå store tap før valg',
      'Diplomatiske seiere øker popularitet',
      'Beskytt befolkningen'
    ],
    relatedTopics: ['governance', 'stability'],
    unlockTurn: 12
  },

  // INTELLIGENCE
  {
    id: 'intelligence',
    title: 'Etterretning og Spionasje',
    category: 'intelligence',
    icon: <Eye className="h-5 w-5" />,
    summary: 'Overvåk fiender, sabotér produksjon, og stjel hemmeligheter.',
    details: 'Intel-operasjoner gir deg informasjon om fiendtlige planer og kan svekke deres kapasitet.',
    mechanics: [
      'Overvåking: Avslør fiendtlige planer',
      'Satellitter: Permanent overvåking',
      'Sabotasje: Reduser fiendtlig produksjon',
      'Counterintelligence: Beskytt mot spionasje',
      'Kostnad: 20-80 Intel per operasjon'
    ],
    tips: [
      'Overvåk største trussel',
      'Satellitter gir kontinuerlig info',
      'Sabotasje før store angrep',
      'Counterintelligence beskytter deg'
    ],
    relatedTopics: ['satellites', 'cyber-warfare'],
    unlockTurn: 1
  },
  {
    id: 'satellites',
    title: 'Spionasjesatellitter',
    category: 'intelligence',
    icon: <Satellite className="h-5 w-5" />,
    summary: 'Satellitter gir permanent overvåking av fiendtlige nasjoner.',
    details: 'Når en satellitt er i bane, får du kontinuerlig informasjon om målnasjonen.',
    mechanics: [
      'Kostnad: 40 Intel',
      'Overvåking: Permanent til satellitten ødelegges',
      'Informasjon: Militær styrke, ressurser, planer',
      'Kan ødelegges: Fienden kan skyte ned satellitter',
      'Multippel deployment: Overvåk flere nasjoner'
    ],
    tips: [
      'Deploy satellitter tidlig',
      'Overvåk største trusler',
      'Erstatning hvis ødelagt',
      'Kombinér med andre intel-operasjoner'
    ],
    relatedTopics: ['intelligence', 'research-system'],
    unlockTurn: 8
  },

  // VICTORY CONDITIONS
  {
    id: 'victory-diplomatic',
    title: 'Diplomatisk Seier',
    category: 'victory',
    icon: <Trophy className="h-5 w-5" />,
    summary: 'Vinn gjennom diplomati og allianser uten krig.',
    details: 'Form allianser med 60% av nasjoner, hold DEFCON høyt, og oppnå global innflytelse.',
    mechanics: [
      'Krever: 60% av nasjoner i allianser',
      'DEFCON: ≥4 i 4+ runder',
      'Global innflytelse: ≥120 poeng',
      'Tidligst: Tur 10',
      'Bonus: Ingen militære tap'
    ],
    tips: [
      'Form allianser tidlig og ofte',
      'Unngå aggresjon - hold DEFCON høyt',
      'Bygg tillit med alle nasjoner',
      'Mest fredelig seiersvei'
    ],
    relatedTopics: ['diplomacy', 'alliances', 'trust-system'],
    unlockTurn: 10
  },
  {
    id: 'victory-domination',
    title: 'Total Dominans',
    category: 'victory',
    icon: <Skull className="h-5 w-5" />,
    summary: 'Eliminer alle rivaliserende nasjoner.',
    details: 'Beseir alle fiender gjennom militær makt - atomvåpen, konvensjonelle styrker, eller bio-våpen.',
    mechanics: [
      'Krever: Eliminering av alle fiender',
      'Metoder: Atomvåpen, konvensjonell krigføring, bio-våpen',
      'Ingen tidsbegrensning',
      'Vanskeligst: Høy risiko for gjengjeldelse',
      'Konsekvens: Massive tap'
    ],
    tips: [
      'Bygg sterkt forsvar først',
      'Eliminer svakeste fiender først',
      'Kombiner angrepsmetoder',
      'Forvent massive gjengjeldelsesangrep'
    ],
    relatedTopics: ['icbms', 'conventional-warfare', 'bio-warfare'],
    unlockTurn: 1
  },
  {
    id: 'victory-economic',
    title: 'Økonomisk Seier',
    category: 'victory',
    icon: <Factory className="h-5 w-5" />,
    summary: 'Dominer globalt gjennom økonomisk makt og handel.',
    details: 'Kontroller byer, etabler handelsruter, og oppretthold positiv ressursbalanse.',
    mechanics: [
      'Krever: 10+ byer kontrollert',
      '4+ handelsruter etablert',
      'Ressursbalanse: +50/runde',
      'Tidligst: Tur 11',
      'Bonus: Minimal militær aktivitet'
    ],
    tips: [
      'Bruk konvensjonelle styrker for erobring',
      'Prioriter ressurs-rike byer',
      'Etabler handelsruter tidlig',
      'Beskytt dine økonomiske interesser'
    ],
    relatedTopics: ['conventional-warfare', 'territory-control'],
    unlockTurn: 11
  },
  {
    id: 'victory-demographic',
    title: 'Demografisk Seier',
    category: 'victory',
    icon: <Globe className="h-5 w-5" />,
    summary: 'Kontroller majoritet av verdens befolkning.',
    details: 'Oppnå kontroll over 60% av verdens befolkning mens du holder ustabilitet lav.',
    mechanics: [
      'Krever: 60% av global befolkning',
      'Ustabilitet: <30',
      'Metode: Erobring og anneksjon',
      'Immigration: Kan øke befolkning',
      'Tidligst: Tur 15'
    ],
    tips: [
      'Erobr tett befolkede områder',
      'Hold befolkningen lykkelig',
      'Unngå massiv død fra våpen',
      'Balancer erobring og stabilitet'
    ],
    relatedTopics: ['territory-control', 'governance'],
    unlockTurn: 15
  },
  {
    id: 'victory-survival',
    title: 'Overlevelsesseier',
    category: 'victory',
    icon: <Shield className="h-5 w-5" />,
    summary: 'Overlev 50 runder med 50M+ befolkning.',
    details: 'Enkleste seiersbetingelse - bare overlev og beskytt befolkningen.',
    mechanics: [
      'Krever: Overleve til runde 50',
      'Befolkning: ≥50 millioner',
      'Ingen andre krav',
      'Bonus: Kan oppnås passivt'
    ],
    tips: [
      'Fokuser på forsvar',
      'Unngå konflikter når mulig',
      'Beskytt befolkningen',
      'Bygg bunkers og forsvarssystemer'
    ],
    relatedTopics: ['missile-defense', 'governance'],
    unlockTurn: 1
  },
  {
    id: 'victory-cultural',
    title: 'Kulturell/Propaganda Seier',
    category: 'victory',
    icon: <Radio className="h-5 w-5" />,
    summary: 'Spre din kultur og påvirkning globalt.',
    details: 'Bruk propaganda for å konvertere fiendtlig lederskap og spre din innflytelse.',
    mechanics: [
      'Krever: Propaganda-teknologi',
      'Konverter fiendtlig lederskap',
      'Spre kulturell innflytelse',
      'Tidligst: Tur 26',
      'Bonus: Minimal vold'
    ],
    tips: [
      'Forsk propaganda-teknologi',
      'Target svake fiender først',
      'Kombinér med diplomati',
      'Pasifistisk seiersvei'
    ],
    relatedTopics: ['research-system', 'diplomacy'],
    unlockTurn: 26
  },

  // GREAT OLD ONES (BONUS CAMPAIGN)
  {
    id: 'great-old-ones',
    title: 'Great Old Ones Kampanje',
    category: 'special',
    icon: <Eye className="h-5 w-5" />,
    summary: 'Alternativ kampanje med Lovecraftian horror-tema.',
    details: 'Spill som en kult som forsøker å bringe tilbake Great Old Ones. Helt annen spillstil med unike mekanikker.',
    mechanics: [
      'Tre doktriner: Domination, Corruption, Convergence',
      'Sanity harvesting: Høst galskap fra befolkningen',
      'Veil integrity: Hvor godt du skjuler deg',
      'Ritual sites: Bestemme steder for ritualer',
      'Investigator spawning: Motstandere som må håndteres',
      'Summoning: Kall frem entities og monstre'
    ],
    tips: [
      'Helt annen spillopplevelse enn hovedkampanjen',
      'Fokus på stealth og subversjon',
      'Balanser Veil integrity - ikke bli oppdaget',
      'Hver doktrine har unik spillstil'
    ],
    relatedTopics: [],
    unlockTurn: 1
  },

  // ADVANCED TIPS
  {
    id: 'advanced-strategy',
    title: 'Avansert Strategi',
    category: 'strategy',
    icon: <Target className="h-5 w-5" />,
    summary: 'Avanserte tips for erfarne spillere.',
    details: 'Mestrings-tips for å dominere spillet.',
    mechanics: [
      'Action economy: Maksimer handlinger per runde',
      'Timing: Når å angripe og når å vente',
      'Diplomacy chains: Påvirk flere nasjoner samtidig',
      'False-flag ops: Få fiender til å sloss mot hverandre',
      'Resource management: Optimal ressursbruk',
      'Tech timing: Når å forske hva'
    ],
    tips: [
      'Kombiner flere angrepstyper samtidig',
      'Bruk false-flag cyber-angrep for å starte kriger',
      'Bygg forsvar før du angriper',
      'Planlegg 5-10 runder frem i tid',
      'Kombiner diplomatiske og militære strategier'
    ],
    relatedTopics: [],
    unlockTurn: 1
  }
];

const CATEGORIES = [
  { id: 'basics', label: 'Grunnleggende', icon: <Target className="h-4 w-4" /> },
  { id: 'nuclear', label: 'Atomvåpen', icon: <Skull className="h-4 w-4" /> },
  { id: 'defense', label: 'Forsvar', icon: <Shield className="h-4 w-4" /> },
  { id: 'research', label: 'Forskning', icon: <Radio className="h-4 w-4" /> },
  { id: 'diplomacy', label: 'Diplomati', icon: <Users className="h-4 w-4" /> },
  { id: 'conventional', label: 'Konvensjonell Krigføring', icon: <Sword className="h-4 w-4" /> },
  { id: 'cyber', label: 'Cyberkrigføring', icon: <Network className="h-4 w-4" /> },
  { id: 'bio', label: 'Bio-krigføring', icon: <Biohazard className="h-4 w-4" /> },
  { id: 'pandemic', label: 'Pandemier', icon: <Biohazard className="h-4 w-4" /> },
  { id: 'governance', label: 'Styresett', icon: <Vote className="h-4 w-4" /> },
  { id: 'intelligence', label: 'Etterretning', icon: <Eye className="h-4 w-4" /> },
  { id: 'victory', label: 'Seiersbetingelser', icon: <Trophy className="h-4 w-4" /> },
  { id: 'special', label: 'Spesielle Moduser', icon: <Flame className="h-4 w-4" /> },
  { id: 'strategy', label: 'Strategi', icon: <Target className="h-4 w-4" /> },
];

interface GameDatabaseProps {
  open: boolean;
  onClose: () => void;
  currentTurn?: number;
}

export function GameDatabase({ open, onClose, currentTurn = 1 }: GameDatabaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<DatabaseEntry | null>(null);

  // Filter entries based on search and category
  const filteredEntries = DATABASE_ENTRIES.filter(entry => {
    const matchesSearch = searchQuery === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group entries by category
  const entriesByCategory = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, DatabaseEntry[]>);

  const handleEntryClick = (entry: DatabaseEntry) => {
    setSelectedEntry(entry);
  };

  const handleBackToList = () => {
    setSelectedEntry(null);
  };

  // Check if entry is locked
  const isLocked = (entry: DatabaseEntry) => {
    return entry.unlockTurn !== undefined && currentTurn < entry.unlockTurn;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
        {!selectedEntry ? (
          // List view
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <div>
                    <SheetTitle className="text-2xl">Spill-database</SheetTitle>
                    <SheetDescription className="mt-1">
                      Komplett referanse for alle spillmekanikker og systemer
                    </SheetDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter mekanikker, våpen, strategier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </SheetHeader>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
              <div className="border-b px-6 overflow-x-auto">
                <TabsList className="inline-flex w-auto gap-2 bg-transparent p-0 h-auto">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    Alle
                  </TabsTrigger>
                  {CATEGORIES.map(cat => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap"
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {selectedCategory === 'all' ? (
                  // Show all categories
                  <div className="space-y-6">
                    {CATEGORIES.filter(cat => entriesByCategory[cat.id]?.length > 0).map(cat => (
                      <div key={cat.id}>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          {cat.icon}
                          {cat.label}
                        </h3>
                        <div className="grid gap-3">
                          {entriesByCategory[cat.id].map(entry => (
                            <button
                              key={entry.id}
                              onClick={() => handleEntryClick(entry)}
                              className="text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
                              disabled={isLocked(entry)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-primary mt-0.5">
                                  {isLocked(entry) ? <Lock className="h-5 w-5" /> : entry.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                                      {entry.title}
                                    </h4>
                                    {isLocked(entry) && (
                                      <Badge variant="outline" className="text-xs">
                                        Låses opp runde {entry.unlockTurn}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {isLocked(entry) ? 'Denne funksjonen er ikke låst opp ennå.' : entry.summary}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {filteredEntries.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ingen resultater funnet</p>
                        <p className="text-sm mt-1">Prøv et annet søk eller kategori</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Show single category
                  <div className="grid gap-3">
                    {filteredEntries.map(entry => (
                      <button
                        key={entry.id}
                        onClick={() => handleEntryClick(entry)}
                        className="text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
                        disabled={isLocked(entry)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-primary mt-0.5">
                            {isLocked(entry) ? <Lock className="h-5 w-5" /> : entry.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold group-hover:text-primary transition-colors">
                                {entry.title}
                              </h4>
                              {isLocked(entry) && (
                                <Badge variant="outline" className="text-xs">
                                  Låses opp runde {entry.unlockTurn}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {isLocked(entry) ? 'Denne funksjonen er ikke låst opp ennå.' : entry.summary}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredEntries.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ingen innlegg i denne kategorien</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        ) : (
          // Detail view
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" onClick={handleBackToList}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-primary">
                      {isLocked(selectedEntry) ? <Lock className="h-6 w-6" /> : selectedEntry.icon}
                    </div>
                    <SheetTitle className="text-2xl">{selectedEntry.title}</SheetTitle>
                  </div>
                  {isLocked(selectedEntry) && (
                    <Badge variant="outline" className="mb-2">
                      <Lock className="h-3 w-3 mr-1" />
                      Låses opp runde {selectedEntry.unlockTurn}
                    </Badge>
                  )}
                  <SheetDescription>{selectedEntry.summary}</SheetDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!isLocked(selectedEntry) ? (
                <>
                  {/* Details */}
                  <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wide opacity-70 mb-2">
                      Detaljer
                    </h3>
                    <p className="text-sm leading-relaxed">{selectedEntry.details}</p>
                  </div>

                  {/* Mechanics */}
                  {selectedEntry.mechanics && selectedEntry.mechanics.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm uppercase tracking-wide opacity-70 mb-2">
                        Mekanikker
                      </h3>
                      <ul className="space-y-2">
                        {selectedEntry.mechanics.map((mechanic, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">▸</span>
                            <span>{mechanic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {selectedEntry.tips && selectedEntry.tips.length > 0 && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold text-sm uppercase tracking-wide flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Strategiske Tips
                      </h3>
                      <ul className="space-y-2">
                        {selectedEntry.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Related Topics */}
                  {selectedEntry.relatedTopics && selectedEntry.relatedTopics.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm uppercase tracking-wide opacity-70 mb-2">
                        Relaterte Emner
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.relatedTopics.map(topicId => {
                          const relatedEntry = DATABASE_ENTRIES.find(e => e.id === topicId);
                          if (!relatedEntry) return null;
                          return (
                            <Button
                              key={topicId}
                              variant="outline"
                              size="sm"
                              onClick={() => handleEntryClick(relatedEntry)}
                              className="gap-2"
                              disabled={isLocked(relatedEntry)}
                            >
                              {isLocked(relatedEntry) ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                relatedEntry.icon
                              )}
                              {relatedEntry.title}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">Funksjon Låst</p>
                  <p>Denne funksjonen låses opp i runde {selectedEntry.unlockTurn}.</p>
                  <p className="text-sm mt-1">Nåværende runde: {currentTurn}</p>
                </div>
              )}
            </div>

            <div className="border-t p-4">
              <Button variant="outline" onClick={handleBackToList} className="w-full">
                Tilbake til oversikt
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
