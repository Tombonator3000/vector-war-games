import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const overlayLayers = [
  {
    id: "threat",
    label: "Trusselintensitet",
    gradient: "from-red-800 via-orange-500 to-yellow-300",
    summary:
      "Heatmap-beregninger markerer aktive frontlinjer, kommende missilbaner og cyberangrepstrusler.",
    highlights: [
      { label: "Aktive hotzones", value: "6" },
      { label: "Prioritert respons", value: "Avskjær luftbro" },
      { label: "Risikovindu", value: "3 runder" },
    ],
  },
  {
    id: "logistics",
    label: "Logistikkstatus",
    gradient: "from-sky-900 via-cyan-500 to-emerald-300",
    summary:
      "Forsyningslinjer overvåkes i sanntid og flagges med gjennomstrømming, sårbarhet og eskortebehov.",
    highlights: [
      { label: "Kapasitet", value: "78%" },
      { label: "Kritisk rute", value: "Silkevei Express" },
      { label: "Avvik", value: "+12 timer" },
    ],
  },
  {
    id: "morale",
    label: "Befolkningsmoral",
    gradient: "from-indigo-900 via-purple-500 to-pink-300",
    summary:
      "Opinionsdata, humanitære tiltak og mediesentiment blandes for å indikere risiko for uro eller støtte.",
    highlights: [
      { label: "Globalt sentiment", value: "Stabil" },
      { label: "Krisepunkt", value: "Østkysten" },
      { label: "Tiltak", value: "Koordiner hjelpedropp" },
    ],
  },
  {
    id: "weather",
    label: "Vær",
    gradient: "from-slate-900 via-blue-500 to-amber-200",
    summary:
      "Værmodellering viser stormbånd, sikt og temperatur som påvirker både offensiver og logistikk.",
    highlights: [
      { label: "Stormer", value: "2 aktive" },
      { label: "Sikt", value: "Lav i nord" },
      { label: "Vind", value: "Økende" },
    ],
  },
  {
    id: "political",
    label: "Politiske soner",
    gradient: "from-emerald-900 via-lime-500 to-amber-300",
    summary:
      "Diplomatiske grenser og påvirkningssfærer illustreres for å avdekke insentiv- og sanksjonssoner.",
    highlights: [
      { label: "Sanksjoner", value: "Aktiv Fase III" },
      { label: "Forhandling", value: "Nordfront" },
      { label: "Sporingsnivå", value: "Høy" },
    ],
  },
] as const;

const focusRegions = [
  {
    id: "arctic",
    name: "Arktisk vaktsektor",
    stats: [
      { label: "Trusselnivå", value: "81%" },
      { label: "Forsyning", value: "Luftbro" },
      { label: "Moralscore", value: "Moderat" },
    ],
    tasks: [
      "Omprioriter satellittbaner for bedre radar",
      "Distribuer mobile AA-plattformer",
      "Planlegg evakuering av forskningsbase",
    ],
    briefing:
      "Isfronten skjuler taktiske ubåter. Holografisk utsnitt fremhever undervannsruter og høydeprofil.",
  },
  {
    id: "atlantic",
    name: "Atlanterhavskorridor",
    stats: [
      { label: "Trusselnivå", value: "63%" },
      { label: "Forsyning", value: "Konvoi" },
      { label: "Moralscore", value: "Høy" },
    ],
    tasks: [
      "Aktiver stealth-eskorte for flaggskipet",
      "Sikre drivstoffdepoter i havn",
      "Brief diplomater om handelsavtale",
    ],
    briefing:
      "Hologrammet viser konvoiens lagdelte formasjon. Energi-projeksjon markerer fiendtlige sensorer.",
  },
  {
    id: "equator",
    name: "Ekvatorial triade",
    stats: [
      { label: "Trusselnivå", value: "44%" },
      { label: "Forsyning", value: "Hybrid" },
      { label: "Moralscore", value: "Sårbar" },
    ],
    tasks: [
      "Rull ut psyops-kampanje mot opprørsledere",
      "Koordiner medisinske droner",
      "Optimaliser vannrensing",
    ],
    briefing:
      "Terrengkartet poppes ut i 3D for å avsløre jungel-linjer og høyspent master som påvirker droner.",
  },
] as const;

const contextAssets = [
  {
    id: "oslo",
    name: "Oslo",
    type: "Urban sone",
    status: "Stabil",
    actions: ["Forsterk beredskap", "Deploy informasjonskampanje", "Planlegg evakueringsøvelse"],
    history: [
      "Oppgradert luftvern forrige runde",
      "Moral økte etter vellykket hjelpedropp",
      "Ingen kritiske hendelser siste 24 timer",
    ],
  },
  {
    id: "fjord",
    name: "Nordfjord Base",
    type: "Marinebase",
    status: "Under press",
    actions: ["Reparer sonar", "Utvid anti-torpedoskjold", "Send logistikk forsterkninger"],
    history: [
      "Rapporterte forsøk på sabotasje",
      "Ubåtflåte returnerte med moderate skader",
      "Sikkerhetsnivå oppjustert til oransje",
    ],
  },
  {
    id: "fleet",
    name: "Task Force Orion",
    type: "Flåte",
    status: "Pågående operasjon",
    actions: ["Initier elektronisk krigføring", "Koble til luftstøtte", "Omplassér forsyningsskip"],
    history: [
      "Stanset fiendtlig rakettkrysser",
      "Trenger reparasjon innen 2 runder",
      "Samkjører med allierte for koordinerte angrep",
    ],
  },
] as const;

const briefingQueue = [
  {
    id: "intel",
    title: "Oppdrag: Bryt radar-slør",
    urgency: "Høy",
    eta: "1 runde",
    recommendation: "Distribuer stealth-droner til polarbaner.",
  },
  {
    id: "relief",
    title: "Humanitær korridor",
    urgency: "Medium",
    eta: "3 runder",
    recommendation: "Koordiner med sivile organisasjoner for støtte.",
  },
  {
    id: "counter",
    title: "Planlegg motangrep",
    urgency: "Kritisk",
    eta: "Tidsvindu åpner om 2 runder",
    recommendation: "Alloker presisjonsmissiler og støttefartøy.",
  },
  {
    id: "diplomacy",
    title: "Diplomatisk utsending",
    urgency: "Lav",
    eta: "5 runder",
    recommendation: "Forbered felles uttalelse med allierte.",
  },
] as const;

const timelineBeats = [
  {
    id: "turn-12",
    label: "Runde 12",
    status: "Historikk",
    details: [
      "Fiendens missilbarrage møtt med 80% avskjæring",
      "Logistikk-kjede rerutet gjennom Island",
      "NPC-rådgiver Falcon anbefalte reserveplan",
    ],
  },
  {
    id: "turn-13",
    label: "Runde 13",
    status: "Historikk",
    details: [
      "Kritisk moralhendelse avverget gjennom mediekampanje",
      "Arktisk base gjenopprettet sonar",
      "Fiendtlig drone-sverm nøytralisert",
    ],
  },
  {
    id: "turn-14",
    label: "Nå",
    status: "Aktiv",
    details: [
      "Tidskritisk storm nærmer seg logistikk-node",
      "Diplomatisk vindu åpnet i sørsonen",
      "Trusselheatmap signaliserer fokus i vest",
    ],
  },
  {
    id: "turn-15",
    label: "Prognose",
    status: "Fremskrevet",
    details: [
      "Motangrep mulig hvis ressurser flyttes innen 2 runder",
      "Værmodell åpner luftstøtte-korridor",
      "NPC Solstice foreslår å styrke psyops",
    ],
  },
  {
    id: "turn-16",
    label: "Fremskrevet",
    status: "Fremskrevet",
    details: [
      "Trusselnivå forventet å falle i nord ved vellykket offensiv",
      "Planlagt oppgradering av forsyningshub",
      "Moral boost hvis hjelpekjede lykkes",
    ],
  },
] as const;

const accessibilitySettings = [
  {
    id: "contrast",
    label: "Høy kontrast",
    description: "Øker kontrast på kart og paneler for bedre lesbarhet.",
  },
  {
    id: "colorblind",
    label: "Fargeblind-profiler",
    description: "Tilpasser fargevalg for ulike typer fargeblindhet.",
  },
  {
    id: "tts",
    label: "Talesyntese",
    description: "Leser opp kritiske alarmer og briefingpunkter automatisk.",
  },
  {
    id: "textsize",
    label: "Tekststørrelse",
    description: "Justerer global tekstskalering for HUD-elementer.",
  },
] as const;

const liveStreams = [
  {
    id: "news",
    source: "Nyhetsnett",
    headline: "Allierte styrker stabiliserer nordfronten",
    tone: "Positiv",
    timestamp: "14:03",
  },
  {
    id: "sat",
    source: "Satellittfeed",
    headline: "Termiske signaturer oppdaget i polarsonen",
    tone: "Varsel",
    timestamp: "14:07",
  },
  {
    id: "chat",
    source: "Taktisk chat",
    headline: "Team Beta bekrefter klar bane for konvoi",
    tone: "Informativ",
    timestamp: "14:11",
  },
  {
    id: "ops",
    source: "Operativ logg",
    headline: "Cyberforsvar oppgraderer brannmur",
    tone: "Stabil",
    timestamp: "14:14",
  },
] as const;

const audioStates = [
  {
    id: "threat",
    title: "Trusselmusikk",
    status: "Aktiv",
    description: "Dynamiske synther intensiveres når heatmap overstiger 70%.",
  },
  {
    id: "logistics",
    title: "Logistikk-tema",
    status: "Adaptiv",
    description: "Rolig puls som øker i tempo når forsyningsruter presses.",
  },
  {
    id: "calm",
    title: "Strategisk ro",
    status: "Standby",
    description: "Demper alarmer når spilleren vurderer i tidslinjen for å redusere stress.",
  },
] as const;

const npcAdvisors = [
  {
    id: "falcon",
    name: "Kommandør Falcon",
    role: "Taktisk strateg",
    mood: "Analytisk",
    quote: "Fienden tester radarlinjen. Vi avleder dem med falske signaler i vest.",
  },
  {
    id: "solstice",
    name: "Rådgiver Solstice",
    role: "Psyops ekspert",
    mood: "Oppløftet",
    quote: "Bytt informasjonskampanje til positiv narrativ – moralvinduet er åpent nå.",
  },
  {
    id: "warden",
    name: "Admiral Warden",
    role: "Logistikkdirigent",
    mood: "Fokusert",
    quote: "Konvoien trenger omdirigering. Jeg foreslår å splitte i to og skjule signaturer.",
  },
] as const;

export default function PhaseTwo() {
  const [activeLayer, setActiveLayer] = useState<(typeof overlayLayers)[number]["id"]>(
    overlayLayers[0]?.id ?? "threat",
  );
  const [focusedRegion, setFocusedRegion] = useState<(typeof focusRegions)[number]["id"]>(
    focusRegions[0]?.id ?? "arctic",
  );
  const [selectedAsset, setSelectedAsset] = useState<(typeof contextAssets)[number]["id"]>(
    contextAssets[0]?.id ?? "oslo",
  );
  const [timelineIndex, setTimelineIndex] = useState(2);
  const [contrastEnabled, setContrastEnabled] = useState(true);
  const [colorblindEnabled, setColorblindEnabled] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [textScale, setTextScale] = useState(1.1);

  const region = useMemo(
    () => focusRegions.find((item) => item.id === focusedRegion) ?? focusRegions[0],
    [focusedRegion],
  );

  const asset = useMemo(
    () => contextAssets.find((item) => item.id === selectedAsset) ?? contextAssets[0],
    [selectedAsset],
  );

  const timelineEvent = timelineBeats[timelineIndex] ?? timelineBeats[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="secondary" className="mb-2 bg-cyan-500/20 text-cyan-200">
              Fase 2 – Operativ kommandogrensesnitt
            </Badge>
            <h1 className="text-3xl font-semibold text-cyan-100 sm:text-4xl">
              Kart- og beslutningssenter
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Dette panelet beskriver hvordan lagdelte overlegg, holografiske utsnitt og kontekstuelle
              handlinger samles i et helhetlig kontrollrom. Målet er å gi spilleren taktisk oversikt,
              raske handlinger og tydelige tilbakemeldinger på ett sted.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="bg-slate-800 text-slate-200 hover:bg-slate-700">
              <Link to="/">Tilbake til simulasjonen</Link>
            </Button>
            <Button asChild variant="outline" className="border-cyan-400 text-cyan-200 hover:bg-cyan-500/10">
              <Link to="/fase-1">Fase 1 oversikt</Link>
            </Button>
          </div>
        </header>

        <Card className="border-cyan-500/30 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-200">Kart og informasjonslag</CardTitle>
            <CardDescription className="text-slate-300">
              Veksle mellom lag for trusselintensitet, logistikkstatus, befolkningsmoral, vær og politiske
              soner. UI-et kombinerer data til handlingsklare anbefalinger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeLayer} onValueChange={(value) => setActiveLayer(value as typeof activeLayer)}>
              <TabsList className="flex flex-wrap gap-2 bg-slate-800/60 p-2">
                {overlayLayers.map((overlay) => (
                  <TabsTrigger
                    key={overlay.id}
                    value={overlay.id}
                    className="data-[state=active]:bg-cyan-500/80 data-[state=active]:text-slate-950"
                  >
                    {overlay.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {overlayLayers.map((overlay) => (
                <TabsContent key={overlay.id} value={overlay.id} className="mt-6">
                  <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-xl border border-white/10 bg-gradient-to-br p-6 shadow-2xl">
                      <div
                        className={`rounded-xl border border-white/20 bg-gradient-to-br ${overlay.gradient} p-6 text-slate-900 shadow-inner`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold uppercase tracking-wide text-slate-900">
                            {overlay.label}
                          </h3>
                          <Badge className="bg-white/30 text-slate-900">Live</Badge>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-slate-900/80">{overlay.summary}</p>
                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                          {overlay.highlights.map((highlight) => (
                            <div
                              key={`${overlay.id}-${highlight.label}`}
                              className="rounded-lg border border-white/30 bg-white/20 p-3 text-center"
                            >
                              <div className="text-xs uppercase text-slate-900/70">{highlight.label}</div>
                              <div className="text-lg font-semibold text-slate-900">{highlight.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
                        <h4 className="text-sm font-semibold text-cyan-200">Kartkommandoer</h4>
                        <p className="mt-2 text-sm text-slate-300">
                          Lagvelgeren styrer hvilke data som legges over kartet. Når et lag aktiveres,
                          trigges varsler, logg og lydprofiler slik at spilleren får både visuell og auditiv
                          bekreftelse på situasjonen.
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
                        <h4 className="text-sm font-semibold text-cyan-200">Anbefalte handlinger</h4>
                        <ul className="mt-2 space-y-2 text-sm text-slate-300">
                          <li>• Synk data til høyre briefingpanel for koordinert respons.</li>
                          <li>• Flag kritiske soner for holografisk utsnitt under.</li>
                          <li>• Del aktivt lag med co-op operatører via delt sesjon.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <Separator className="border-slate-700" />

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-200">3D/holografisk fokus</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Pop ut kritiske regioner som minikart med detaljerte stats og oppgaver. Velg sektor for å
                      vise topografi, forsyningslinjer og anbefalt tiltak.
                    </p>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={focusedRegion}
                    onValueChange={(value) => value && setFocusedRegion(value as typeof focusedRegion)}
                    className="flex flex-wrap justify-end gap-2"
                  >
                    {focusRegions.map((item) => (
                      <ToggleGroupItem
                        key={item.id}
                        value={item.id}
                        className="data-[state=on]:bg-cyan-500/80 data-[state=on]:text-slate-950"
                      >
                        {item.name}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-cyan-200/80">Holo-brief</h4>
                    <p className="mt-2 text-sm text-slate-300">{region.briefing}</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      {region.stats.map((stat) => (
                        <div
                          key={`${region.id}-${stat.label}`}
                          className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3 text-center"
                        >
                          <div className="text-xs uppercase text-cyan-200/80">{stat.label}</div>
                          <div className="text-lg font-semibold text-cyan-100">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6">
                    <h4 className="text-sm font-semibold text-cyan-200">Tilordnede oppgaver</h4>
                    <ul className="mt-3 space-y-3 text-sm text-slate-300">
                      {region.tasks.map((task) => (
                        <li key={task} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-slate-950/60 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-200">Kontekstuelle verktøy</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Klikk på byer, baser eller flåter for å åpne modulære paneler med status, tiltak og
                      historikk.
                    </p>
                  </div>
                  <Tabs
                    value={selectedAsset}
                    onValueChange={(value) => setSelectedAsset(value as typeof selectedAsset)}
                    className="w-full md:w-auto"
                  >
                    <TabsList className="flex flex-wrap gap-2 bg-slate-800/60 p-2">
                      {contextAssets.map((item) => (
                        <TabsTrigger
                          key={item.id}
                          value={item.id}
                          className="data-[state=active]:bg-emerald-500/80 data-[state=active]:text-slate-950"
                        >
                          {item.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-5">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-200/80">
                      {asset.type}
                    </h4>
                    <p className="mt-2 text-sm text-emerald-50/90">Status: {asset.status}</p>
                    <Separator className="my-4 border-emerald-400/40" />
                    <h5 className="text-xs font-semibold uppercase text-emerald-200/70">Tiltak</h5>
                    <ul className="mt-2 space-y-2 text-sm text-emerald-50/90">
                      {asset.actions.map((action) => (
                        <li key={action} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-5">
                    <h5 className="text-xs font-semibold uppercase text-emerald-200/70">Historikk</h5>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                      {asset.history.map((log) => (
                        <li key={log} className="rounded border border-slate-700/70 bg-slate-900/70 p-3">
                          {log}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-200">Kontroll- og feedbackpaneler</CardTitle>
            <CardDescription className="text-slate-300">
              Briefingsenteret prioriterer oppdrag, mens tidslinjen lar deg spole tilbake og planlegge kommende
              vinduer for motangrep. Tilgjengelighetslag sørger for at alle operatører får nødvendig støtte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.9fr]">
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-100">Dynamisk briefingsenter</h3>
                    <p className="mt-1 text-sm text-amber-50/90">
                      Automatisk sortering av aktive oppdrag, anbefalte handlinger og tidskritiske varsler.
                    </p>
                  </div>
                  <Badge className="bg-amber-300/40 text-amber-900">Oppdatert</Badge>
                </div>
                <ScrollArea className="mt-4 h-56 rounded-lg border border-amber-300/20 bg-slate-950/70 p-3">
                  <div className="space-y-3">
                    {briefingQueue.map((item) => (
                      <div key={item.id} className="rounded border border-amber-400/30 bg-amber-400/10 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-amber-100">{item.title}</span>
                          <Badge className="bg-amber-200/40 text-amber-900">{item.urgency}</Badge>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-wide text-amber-100/70">Forfall: {item.eta}</p>
                        <p className="mt-2 text-sm text-amber-50/90">{item.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="rounded-xl border border-sky-400/20 bg-slate-950/60 p-6">
                <h3 className="text-lg font-semibold text-sky-200">Interaktiv tidslinje</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Skru tilbake for å se event-historikk og prognoser. Slideren markerer hvilke vinduer som gir
                  best effekt for et kommende motangrep.
                </p>
                <div className="mt-6 space-y-4">
                  <Slider
                    value={[timelineIndex]}
                    min={0}
                    max={timelineBeats.length - 1}
                    step={1}
                    onValueChange={(value) => setTimelineIndex(value[0] ?? 0)}
                    className="w-full"
                  />
                  <div className="rounded-lg border border-sky-400/30 bg-sky-400/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase text-sky-200/80">{timelineEvent.status}</p>
                        <h4 className="text-lg font-semibold text-sky-100">{timelineEvent.label}</h4>
                      </div>
                      <Badge className="bg-sky-300/40 text-slate-900">Analyse</Badge>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {timelineEvent.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-400/20 bg-slate-950/60 p-6">
                <h3 className="text-lg font-semibold text-emerald-200">Tilgjengelighetslag</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Juster kontrast, fargeprofiler, talesyntese og tekstskalering for å støtte ulike operatører.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-100">{accessibilitySettings[0].label}</p>
                      <p className="text-xs text-slate-400">{accessibilitySettings[0].description}</p>
                    </div>
                    <Switch checked={contrastEnabled} onCheckedChange={setContrastEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-100">{accessibilitySettings[1].label}</p>
                      <p className="text-xs text-slate-400">{accessibilitySettings[1].description}</p>
                    </div>
                    <Switch checked={colorblindEnabled} onCheckedChange={setColorblindEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-100">{accessibilitySettings[2].label}</p>
                      <p className="text-xs text-slate-400">{accessibilitySettings[2].description}</p>
                    </div>
                    <Switch checked={ttsEnabled} onCheckedChange={setTtsEnabled} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-100">{accessibilitySettings[3].label}</p>
                    <p className="text-xs text-slate-400">{accessibilitySettings[3].description}</p>
                    <Slider
                      value={[textScale]}
                      min={0.9}
                      max={1.4}
                      step={0.05}
                      onValueChange={(value) => setTextScale(value[0] ?? 1)}
                      className="mt-3"
                    />
                    <p className="mt-2 text-xs text-slate-400">Aktiv skala: {(textScale * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-200">Immersive detaljer</CardTitle>
            <CardDescription className="text-slate-300">
              Live datastreams, hendelsesbasert lyd og responderende rådgivere gjør at kontrollrommet føles
              levende og reagerer på spilleren.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[1fr_1fr_0.9fr]">
            <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 p-6">
              <h3 className="text-lg font-semibold text-purple-100">Live datastreams</h3>
              <p className="mt-1 text-sm text-purple-50/90">
                Minivinduer simulerer nyhetsoppslag, satellittfeeds og taktiske chat-logger for atmosfære.
              </p>
              <ScrollArea className="mt-4 h-56 rounded-lg border border-purple-300/20 bg-slate-950/70 p-3">
                <div className="space-y-3">
                  {liveStreams.map((stream) => (
                    <div key={stream.id} className="rounded border border-purple-400/30 bg-purple-400/10 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-purple-100">{stream.source}</span>
                        <Badge className="bg-purple-300/40 text-slate-900">{stream.tone}</Badge>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-wide text-purple-100/70">{stream.timestamp}</p>
                      <p className="mt-2 text-sm text-purple-50/90">{stream.headline}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-6">
              <h3 className="text-lg font-semibold text-fuchsia-100">Hendelsesbasert musikk &amp; lyd</h3>
              <p className="mt-1 text-sm text-fuchsia-50/90">
                Audiotrigger-systemet endrer seg basert på trusselnivå, logistikkstatus og spillerens fokus.
              </p>
              <div className="mt-4 space-y-3">
                {audioStates.map((audio) => (
                  <div key={audio.id} className="rounded border border-fuchsia-400/30 bg-fuchsia-400/10 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-fuchsia-100">{audio.title}</h4>
                        <p className="text-xs uppercase tracking-wide text-fuchsia-200/70">{audio.status}</p>
                      </div>
                      <Badge className="bg-fuchsia-300/40 text-slate-900">Lydprofil</Badge>
                    </div>
                    <p className="mt-2 text-sm text-fuchsia-50/90">{audio.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-6">
              <h3 className="text-lg font-semibold text-indigo-100">Reagerende NPC-rådgivere</h3>
              <p className="mt-1 text-sm text-indigo-50/90">
                Virtuelle rådgivere med distinkte personligheter gir kontekstuelle kommentarer basert på
                systemstatus.
              </p>
              <div className="mt-4 space-y-4">
                {npcAdvisors.map((advisor) => (
                  <div key={advisor.id} className="rounded border border-indigo-400/30 bg-indigo-400/10 p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-indigo-300/40 bg-slate-950/80">
                        <AvatarFallback className="text-indigo-200">
                          {advisor.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-semibold text-indigo-100">{advisor.name}</h4>
                        <p className="text-xs uppercase tracking-wide text-indigo-200/70">
                          {advisor.role} • {advisor.mood}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-indigo-50/90">“{advisor.quote}”</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
