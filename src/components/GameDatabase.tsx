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
  ChevronLeft, Sparkles, ListTree
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
  {
    id: 'strategic-ledger',
    title: 'Strategisk Ledger',
    category: 'basics',
    icon: <ListTree className="h-5 w-5" />,
    summary: 'Tabellarisk makrooversikt over alle nasjoner, med ressurser, militær styrke og diplomatiske bånd i én skjerm.',
    details: 'Ledger-fanen i CivilizationInfoPanel kombinerer all tilgjengelig etterretning i et sortérbart og filtrerbart oppsett. Klikk på en rad for å hente samme detaljerte kort som Enemy Nations-fanen, eller bruk hurtigtasten Shift + L for å hoppe direkte til oversikten når panelet er åpent.',
    mechanics: [
      'Viser alle kjente nasjoner med sanntidsverdier for produksjon, uran, intel og militær styrke',
      'Filterchips isolerer allierte, fiender, nøytrale stater eller de 5 sterkeste militærmaktene',
      'Kolonneoverskrifter kan klikkes for å sortere stigende/synkende, og innstillingen beholdes til panelet lukkes',
      'Radklikk låser opp detaljerte etterretningskort uten å forlate ledgeren',
      'Shift + L fungerer som hurtigtast for å åpne ledger-fanen når CivilizationInfoPanel allerede er aktiv'
    ],
    tips: [
      'Bruk ledgeren før offensiver for å kontrollere om motstandere matcher din styrke eller ressurser',
      'Filtrer på “Topp 5 styrke” for raskt å identifisere hvem som kan true deg på kort sikt',
      'Hold øye med relasjonskolonnen for å reagere på diplomatiske svingninger uten å bytte til diplomatifanen'
    ]
  },
  {
    id: 'map-modes',
    title: 'Kartmodus & Overlays',
    category: 'basics',
    icon: <Globe className="h-5 w-5" />,
    summary: 'MapModeBar under topplinjen bytter mellom visuelle operasjonslag for diplomati, etterretning, ressurser og uro.',
    details: 'Kartmoduser kombinerer funksjonelle overlays med valgt estetikk. MapModeBar (eller hurtigtaster Alt + 1–5) veksler mellom Standard, Diplomatisk, Etterretning, Ressurser og Uro. Dataene trekkes fra diplomati-, etterretnings- og styringssystemene i sanntid, og fungerer både på Three.js-globen og Cesium-visningen.',
    mechanics: [
      'Alt + 1: Standard – klassisk kart med markører, DEFCON-rutenett og krystallklar natt/dag-estetikk',
      'Alt + 2: Diplomatisk – territorier fargekodes etter relasjonen til din regjering, med hurtig oversikt over venn/fiende',
      'Alt + 3: Etterretning – viser overvåkingsdekning, rekognoseringsnivå og satellittnettverkets status',
      'Alt + 4: Ressurser – fremhever strategiske reserver, produksjonsknutepunkter og markedspress',
      'Alt + 5: Uro – aktiverer Political Stability Overlay og markerer morale, opinion og instabilitet pr. nasjon'
    ],
    tips: [
      'Kartmoduser kan kombineres med enhver visuell stil (Realistisk, Natt, Wireframe osv.) uten å miste data-overlays',
      'Hold Alt nede og trykk på tallene i rekkefølge for rask scanning av globale situasjoner',
      'Uro-modusen oppdateres når governance-metrikker endres – bruk den etter politiske beslutninger for å se effekt umiddelbart'
    ],
    relatedTopics: ['diplomacy', 'intel-operations', 'governance']
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
    summary: 'Ikke-atomvåpen krigføring med hærer, flåter og luftstyrker for å erobre territorier.',
    details: 'Fra tur 11 kan du bygge konvensjonelle militære enheter og erobre territorier. Spillet bruker 8 globale territorier organisert i Risk-stil med nabolandsmekanikk. Du starter med ett territorium (North America) og kan ekspandere ved å angripe naboland med armies.',
    mechanics: [
      'Tre enhetstyper: Armored Corps (army), Carrier Strike Group (navy), Expeditionary Air Wing (air)',
      'Enheter deployes som "armies" til territorier',
      'Armored Corps: 12 prod + 5 oil = 5 armies (Attack: 7, Defense: 5)',
      'Carrier Strike Group: 16 prod + 2 uran + 6 oil = 4 armies (Attack: 6, Defense: 8, +1 defense die)',
      'Expeditionary Air Wing: 14 prod + 4 intel + 4 oil + 2 rare earths = 3 armies (Attack: 8, Defense: 4, +1 attack die)',
      'Border Conflict: Angrip naboland med Risk-style terningkamp',
      'Erobring: Eliminer alle forsvarerens armies for å ta territoriet',
      'Army Movement: Flytt armies mellom dine egne tilgrensende territorier'
    ],
    tips: [
      'Angrip nøytrale territorier først (arctic_circle, atlantic_corridor)',
      'Krever 2:1 army-fordel for sikker seier',
      'La alltid minst 1 army bli igjen i kildeområdet',
      'Luftenheter gir +1 angrepsterning per 3 enheter',
      'Marineenheter gir +1 forsvarsterning per 2 enheter',
      'Erobrede territorier gir produksjonsbonus og strategiske ressurser',
      'Kombinér konvensjonelle og atomvåpen for maksimal effekt'
    ],
    relatedTopics: ['military-units', 'territory-control', 'combat-system', 'reinforcements', 'victory-economic'],
    unlockTurn: 11
  },
  {
    id: 'territory-control',
    title: 'Territorial Kontroll',
    category: 'conventional',
    icon: <Globe className="h-5 w-5" />,
    summary: 'Erobre og kontroller territorier ved å eliminere forsvarerens armies.',
    details: 'Spillet har 8 globale territorier i Risk-stil. Hvert territorium har armies, naboland, strategisk verdi, og produksjonsbonus. Du erobrer territorier ved å angripe naboland og vinne terningkamper. Erobrede territorier gir produksjonsbonus, strategiske ressurser, og forsterkninger hver runde.',
    mechanics: [
      '8 territorier: north_america, eastern_bloc, indo_pacific, southern_front, equatorial_belt, proxy_middle_east, arctic_circle, atlantic_corridor',
      'Naboland: Kun tilgrensende territorier kan angripes',
      'Armies: Numerisk styrke i hvert territorium (fra enheter)',
      'Production Bonus: +2-4 produksjon per runde fra kontrollerte territorier',
      'Strategic Value: 2-5 (påvirker AI-prioriteringer)',
      'Erobring: Eliminer alle forsvarerens armies i Border Conflict',
      'Eierskapsendring: Erobrede territorier bytter controllingNationId',
      'Diplomatiske konsekvenser: -25 relasjon med forsvarer, -15 med allierte'
    ],
    tips: [
      'Start med nøytrale territorier (arctic_circle, atlantic_corridor)',
      'Kontroller nabolandskart før angrep',
      'Prioriter territorier med høy produksjonsbonus',
      'Komplett regioner for regionbonuser (+2-3 armies per runde)',
      'Behold minst 1 army i hvert territorium for forsvar',
      'Erobring senker din Readiness med 8 (seier) eller 15 (tap)',
      'Planlegg erobringsrute for kontinentbonus'
    ],
    relatedTopics: ['conventional-warfare', 'combat-system', 'reinforcements', 'strategic-resources-territories', 'victory-economic'],
    unlockTurn: 11
  },
  {
    id: 'military-units',
    title: 'Militære Enheter',
    category: 'conventional',
    icon: <Sword className="h-5 w-5" />,
    summary: 'Tre typer konvensjonelle enheter: Armored Corps, Carrier Strike Groups, og Expeditionary Air Wings.',
    details: 'Militære enheter deployes som "armies" til territorier. Hver enhetstype har unik kostnad, army-styrke, og kampbonuser. Enheter krever strategiske ressurser (oil, uranium, rare earths) i tillegg til produksjon.',
    mechanics: [
      'ARMORED CORPS (army): 12 prod + 5 oil → 5 armies',
      '  Attack: 7, Defense: 5',
      '  Standard landbasert styrke',
      'CARRIER STRIKE GROUP (navy): 16 prod + 2 uran + 6 oil → 4 armies',
      '  Attack: 6, Defense: 8',
      '  Bonus: +1 defense die per 2 navy units i territoriet',
      '  Styrke i sjøterritorier',
      'EXPEDITIONARY AIR WING (air): 14 prod + 4 intel + 4 oil + 2 rare earths → 3 armies',
      '  Attack: 8, Defense: 4',
      '  Bonus: +1 attack die per 3 air units i territoriet',
      '  Høyeste angrepsverdi',
      'Unit Composition: Armies teller proporsjonal enhetstype',
      'Strategic Resources: Krever oil, uranium, rare earths fra territorier'
    ],
    tips: [
      'Armored Corps = beste kostnad/army-ratio (5 armies)',
      'Air Wings = beste angrepsverdi (Attack 8 + bonus)',
      'Carrier Groups = beste forsvar (Defense 8 + bonus)',
      'Kombinér enhetstyper for balanced styrke',
      'Air Wings gir attack dice bonuser i kamp',
      'Navy gir defense dice bonuser i kamp',
      'Krev strategiske ressurser - erobre ressursterritorier først'
    ],
    relatedTopics: ['conventional-warfare', 'combat-system', 'strategic-resources-territories'],
    unlockTurn: 11
  },
  {
    id: 'combat-system',
    title: 'Kampsystem (Risk-stil)',
    category: 'conventional',
    icon: <Target className="h-5 w-5" />,
    summary: 'Border Conflicts bruker Risk-stil terningkamp for å avgjøre territorielle erobringer.',
    details: 'Når du angriper et naboland, løses kampen med terningkast. Angriper og forsvarer kaster terninger (1d6) basert på armies. Høyeste terninger sammenlignes, og taperen mister armies. Kampen fortsetter til angriper trekker seg tilbake eller forsvarer elimineres.',
    mechanics: [
      'TERNINGKAST:',
      '  Angriper: Opptil 3 terninger (basert på attacking armies)',
      '  Forsvarer: Opptil 2 terninger (basert på defending armies)',
      '  Hver terning = 1d6 (1-6)',
      'BONUSER FRA ENHETER:',
      '  Air units: +1 attack die per 3 air units',
      '  Navy units: +1 defense die per 2 navy units',
      'SAMMENLIGNING:',
      '  Høyeste vs høyeste terning',
      '  Nest-høyeste vs nest-høyeste (hvis begge har 2+)',
      '  Uavgjort = forsvarer vinner',
      'TAP:',
      '  Taper av hver sammenligning mister 1 army',
      '  Kampen fortsetter til slutt-betingelse',
      'SLUTT-BETINGELSER:',
      '  Angriper vinner: Forsvarer armies = 0 → Territorium erobret',
      '  Angriper taper: Angriper armies = 0 → Angrep mislyktes'
    ],
    tips: [
      'GYLNE REGEL: 2:1 eller 3:1 fordel anbefales',
      'Uavgjort favoriserer alltid forsvareren',
      'Enhetskomposisjon gir terningbonuser',
      'Mange terninger = høyere sjanse for høye kast',
      'Beregn forventet tap før angrep',
      'AI krever ofte 2:1 fordel før angrep',
      'Readiness påvirkes av utfall (-8 ved seier, -15 ved tap)'
    ],
    relatedTopics: ['conventional-warfare', 'military-units', 'territory-control'],
    unlockTurn: 11
  },
  {
    id: 'reinforcements',
    title: 'Forsterkningssystem',
    category: 'conventional',
    icon: <Shield className="h-5 w-5" />,
    summary: 'Motta gratis armies hver runde basert på antall territorier du kontrollerer.',
    details: 'Lik Risk-mekanikk: Du får forsterkninger basert på territoriecount delt på 3, pluss regionbonuser hvis du kontrollerer hele regioner. Forsterkninger kan plasseres i hvilken som helst kontrollert territorium.',
    mechanics: [
      'BEREGNING:',
      '  Base reinforcements = Math.max(3, territorier / 3)',
      '  Minimum = 3 armies selv med 1 territorium',
      '  Eksempel: 6 territorier = Math.max(3, 6/3) = 3 armies',
      'REGIONBONUSER (hvis kontrollerer alle territorier i region):',
      '  Western Hemisphere: +2 armies',
      '  Europe & Siberia: +3 armies',
      '  Pacific: +2 armies',
      '  Atlantic: +1 army',
      '  Arctic: +1 army',
      'PLASSERING:',
      '  Velg hvilket territorium armies plasseres i',
      '  Kan fordeles på flere territorier',
      '  Styrker forsvar eller forbereder angrep'
    ],
    tips: [
      'Prioriter å fullføre regioner for bonuser',
      'Plasser forsterkninger strategisk (grenseområder)',
      'Flere territorier = mer armies per runde',
      '3 territorier = 3 armies, 6 territorier = 3 armies (samme!)',
      '9 territorier = 4 armies (breakpoint)',
      'Regionbonuser gir betydelig fordel',
      'Kombiner med produserte enheter for rask ekspansjon'
    ],
    relatedTopics: ['territory-control', 'conventional-warfare'],
    unlockTurn: 11
  },
  {
    id: 'strategic-resources-territories',
    title: 'Strategiske Ressurser fra Territorier',
    category: 'conventional',
    icon: <Factory className="h-5 w-5" />,
    summary: 'Territorier gir produksjonsbonus og strategiske ressurser (oil, uranium, rare earths, intel).',
    details: 'Kontrollerte territorier genererer ressurser hver runde. Production bonus øker din produksjonsrate. Strategiske ressurser (oil, uranium, rare earths, intel) kreves for å bygge avanserte militære enheter. Erobring av ressurs-rike territorier er kritisk for militær utvikling.',
    mechanics: [
      'PRODUCTION BONUS: +2-4 produksjon per runde fra hvert territorium',
      'STRATEGISKE RESSURSER per territorium:',
      '  Oil: Kreves for Armored Corps (5) og Carrier Groups (6)',
      '  Uranium: Kreves for Carrier Groups (2)',
      '  Rare Earths: Kreves for Air Wings (2)',
      '  Intel: Kreves for Air Wings (4)',
      'RESSURS-AKKUMULERING:',
      '  Ressurser akkumuleres hver runde',
      '  Kan lagres for fremtidige enheter',
      '  Manglende ressurs = kan ikke bygge enhet',
      'EROBRINGSEFFEKT:',
      '  Umiddelbar tilgang til territoriets ressurser',
      '  Økt produksjonskapasitet',
      '  Kan låse fienden ute fra kritiske ressurser'
    ],
    tips: [
      'Identifiser hvilke territorier har hvilke ressurser',
      'Prioriter oil-territorier tidlig (kreves for de fleste enheter)',
      'Rare earths og intel kreves for Air Wings - erobre disse for luftdominans',
      'Kontroller ressurs-chokepoints for å blokkere fiender',
      'Produksjonsbonus akkumuleres - flere territorier = mer produksjon',
      'Strategiske ressurser gir militær fleksibilitet',
      'Tap av ressursterritorium kan lamme militærproduksjon'
    ],
    relatedTopics: ['territory-control', 'military-units', 'conventional-warfare'],
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

  // VICTORY CONDITIONS - STREAMLINED (4 PATHS)
  {
    id: 'victory-diplomatic',
    title: 'Diplomatisk Seier',
    category: 'victory',
    icon: <Trophy className="h-5 w-5" />,
    summary: 'Vinn gjennom diplomati og fred.',
    details: 'Form allianser med 60% av levende nasjoner og oppretthold fred i 5 runder.',
    mechanics: [
      'Krever: Alliert med 60% av levende nasjoner',
      'DEFCON: ≥4 i 5+ sammenhengende runder',
      'Tidligst: Tur 5',
      'Bonus: Fredelig seier uten militære tap'
    ],
    tips: [
      'Form allianser tidlig og ofte',
      'Unngå aggresjon - hold DEFCON høyt',
      'Bygg tillit med alle nasjoner',
      'Mest fredelig seiersvei'
    ],
    relatedTopics: ['diplomacy', 'alliances', 'trust-system'],
    unlockTurn: 1
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
    summary: 'Dominer globalt gjennom økonomisk makt.',
    details: 'Kontroller 10+ byer og oppretthold 200+ produksjon per runde.',
    mechanics: [
      'Krever: Kontroll over 10+ byer',
      'Produksjon: ≥200 per runde',
      'Tidligst: Tur 10',
      'Bonus: Kan oppnås med eller uten krig'
    ],
    tips: [
      'Bruk konvensjonelle styrker for erobring',
      'Prioriter by-erobring',
      'Bygg fabrikker for produksjon',
      'Beskytt dine økonomiske interesser'
    ],
    relatedTopics: ['conventional-warfare', 'territory-control'],
    unlockTurn: 1
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

  {
    id: 'strategic-outliner',
    title: 'Strategic Outliner & Makro-kommandoer',
    category: 'strategy',
    icon: <Sparkles className="h-5 w-5" />,
    summary: 'Neon-panel som grupperer produksjon, diplomati og krisevarsler i sanntid.',
    details:
      'Outlineren gir et komprimert overblikk over nasjonens makronivå-status: militær beredskap, ressurspuljer, DEFCON, ' +
      'pågående governance-hendelser og globale kriser. Panelet blinker ved kritiske hendelser og speiler kooperative makro-låser ' +
      'slik at du vet hvilke handlinger som er blokkert.',
    mechanics: [
      'Toggle med O – Shift+O åpner og fokuserer panelet umiddelbart.',
      'Produksjon & Militær viser readiness, tilgjengelige MAKROER (BUILD/RESEARCH) og siste slaglogg.',
      'Diplomati & Styresett sporer DEFCON, moral/opinion, regjeringskriser og status for DIPLOMACY/CULTURE-makroer.',
      'Etterretning & Krise fremhever aktive flashpoints, pandemiforløp og om INTEL/BIO makroene er klare.',
      'Kritiske kort pulserer rødt for å signalisere handling med høy prioritet.',
    ],
    tips: [
      'Bruk Shift+O når nyhetene blinker for å hoppe direkte til panelet.',
      'Koordiner med Approval Queue hvis en makro er låst – outlineren viser hvilke roller som holder tilbake.',
      'Hold øye med ressurspostene: lav produksjon kombinert med rødt readiness-kort betyr at du bør hvile eller reforsterke.',
    ],
    relatedTopics: ['defcon', 'resources', 'governance'],
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
