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

const coreMechanics = [
  {
    id: "seasonal-campaigns",
    title: "Sesongbaserte kampanjer",
    summary:
      "Fire sesonger gir tempojustering, værhendelser og begrensede belønninger som styrer prioriteringene dine gjennom året.",
    focus: [
      "Prototyp event-generator og sesongkort",
      "Definer KPI-er for progresjon pr. sesong",
      "Knytt belønninger til logistikk- og moralstatistikk",
    ],
    outcome: "Gir rammeverket for Fase 2 hendelsesløkken.",
  },
  {
    id: "logistics-network",
    title: "Logistikknettverk",
    summary:
      "Land-, sjø- og luftkorridorer leverer våpen, drivstoff og hjelpesendinger; spillerne må sikre og vedlikeholde rutene.",
    focus: [
      "Lag noder og ruter med tilhørende tilstand (stabilitet, kapasitet)",
      "Visualiser belastning via UI-overlegg",
      "Forbered hooks for sabotasje- og redningshendelser",
    ],
    outcome: "Baner vei for ressursøkonomi og samarbeidsoppdrag.",
  },
  {
    id: "adaptive-enemies",
    title: "Adaptive fiender",
    summary:
      "Trussel-heatmap analyserer spillerens valg og skrur opp fiendens målretting, våpenbruk og sabotasje.",
    focus: [
      "Prototype heatmap på grid-nivå",
      "Kartlegg variabler som påvirker aggressivitet",
      "Planlegg telemetri for balanse-testing",
    ],
    outcome: "Holder presset dynamisk uten full AI-implementering ennå.",
  },
] as const;

const overlayLayers = [
  {
    id: "threat",
    label: "Trusselintensitet",
    gradient: "from-red-700 via-orange-500 to-yellow-300",
    description:
      "Fremhever fiendtlige hotzones, taktiske våpenoppsett og kommende angrepslinjer basert på heatmap-data.",
    metrics: [
      { label: "Identifiserte hotzones", value: "5" },
      { label: "Infiltrasjonssannsynlighet", value: "Høy" },
      { label: "Anbefalt respons", value: "Fordel interceptorer" },
    ],
  },
  {
    id: "logistics",
    label: "Logistikkstatus",
    gradient: "from-sky-800 via-cyan-500 to-emerald-300",
    description:
      "Viser kapasitet på forsyningsruter, forsinkelser og behov for eskorte basert på nodehelse.",
    metrics: [
      { label: "Kritiske korridorer", value: "Arktisk luftbro" },
      { label: "Driftsgrad", value: "82%" },
      { label: "Varsling", value: "Storm front om 2 runder" },
    ],
  },
  {
    id: "morale",
    label: "Befolkningsmoral",
    gradient: "from-indigo-800 via-purple-500 to-pink-300",
    description:
      "Kobler sivile tiltak og forsvarsresultater til opinion og risiko for uro.",
    metrics: [
      { label: "Global opinion", value: "Stabil" },
      { label: "Sosiale medier", value: "Positive" },
      { label: "Risiko for uro", value: "Lav" },
    ],
  },
] as const;

const seasonTimeline = [
  {
    id: "winter",
    title: "Vinteroffensiv",
    hook: "Ekstrem kulde og radarskygge gir fordel for langtrekkende missiler.",
    beats: [
      "Ekstra forsvarsordre åpnes",
      "Logistikk via sjø stenges midlertidig",
      "Unik belønning: Kaldstart-protokoll (hurtigrespons)",
    ],
  },
  {
    id: "spring",
    title: "Vår-tøvær",
    hook: "Smeltevann åpner nye landruter men forårsaker oversvømmelser.",
    beats: [
      "Diplomatiske vinduer for humanitær hjelp",
      "Sivil moral boost ved vellykket evakuering",
      "Unik belønning: Rekognoseringsdrone",
    ],
  },
  {
    id: "summer",
    title: "Sommerstorm",
    hook: "Tropiske stormer avbryter luftbroer men gir solenergibonus.",
    beats: [
      "Risikofaser for sabotasje mot kraftnett",
      "Avslør hemmelige baser via satellitt",
      "Unik belønning: Solar-reserve",
    ],
  },
  {
    id: "autumn",
    title: "Høstbrann",
    hook: "Tørre forhold øker sannsynligheten for naturbranner og sivile kriser.",
    beats: [
      "Rask respons kreves for å holde moral høy",
      "Logistikkens bakketransport får bonus",
      "Unik belønning: Krisesamband",
    ],
  },
] as const;

const logisticsRoutes = [
  {
    id: "polar",
    name: "Arktisk luftbro",
    status: "Stabil",
    risk: "Lav ising",
    throughput: "+2 avanserte komponenter",
  },
  {
    id: "atlantic",
    name: "Atlanterhavskonvoi",
    status: "Presset",
    risk: "U-båtaktivitet",
    throughput: "+4 forsyningscontainere",
  },
  {
    id: "silk",
    name: "Silkevei express",
    status: "Sårbar",
    risk: "Politisk press",
    throughput: "+3 diplomatiske poeng",
  },
] as const;

const heatmapInsights = [
  {
    id: "pattern",
    title: "Mønsteranalyse",
    detail:
      "Fienden følger opp missilslått mål med cyberangrep etter 2 runder. Planlegg brannmur-boost før angrep trigger.",
  },
  {
    id: "response",
    title: "Responsregler",
    detail:
      "Når heatmap>70 på grenseregioner aktiveres automatisk eskortebestilling og moral-sjekk.",
  },
  {
    id: "telemetry",
    title: "Telemetri",
    detail:
      "Logg forsvarsvalg, moral og logistikkstatus per runde for å justere adaptivitet i Fase 3.",
  },
] as const;

const technicalStack = [
  {
    id: "state",
    title: "State management",
    notes: [
      "Utvid eksisterende global state med sesong- og logistikkmoduler (React Query holder fjernsynk).",
      "Definer type-sikre modeller for ruter, sesonger og heatmapcells i `lib`-laget.",
    ],
  },
  {
    id: "data",
    title: "Dataflyt",
    notes: [
      "Sesonger publiserer hendelser via observer-pattern slik at UI-paneler kan abonnere.",
      "Logistikkoppdateringer caches lokalt og pushes til server når co-op aktiveres.",
    ],
  },
  {
    id: "network",
    title: "Nettverkslag",
    notes: [
      "Planlegg WebSocket-kanaler for co-op deling av heatmap- og rutedata.",
      "Bruk differensielle payloads for å minimere båndbredde ved hyppige heatmap-oppdateringer.",
    ],
  },
  {
    id: "integration",
    title: "Integrasjon",
    notes: [
      "UI-overlegg injiseres som modulære lag på eksisterende kartcanvas.",
      "Sesongkort trigges fra event-loop etter `endTurn` uten å blokkere animasjoner.",
    ],
  },
] as const;

const launchStreams = [
  {
    id: "soft-launch",
    title: "Soft launch/beta",
    summary:
      "Sikre robust innsikt gjennom telemetri og KPI-sporing før full lansering.",
    pillars: [
      {
        label: "Telemetrioppsett",
        items: [
          "Definér presise eventer (oppdragsstart/-slutt, abort, menyvalg).",
          "Implementer anonymisert datainnsamling i klient og backend.",
          "Sett opp dashboards for sanntidsovervåking (Looker/Data Studio/Superset).",
        ],
      },
      {
        label: "KPI-definisjoner",
        items: [
          "Sessionslengde segmentert på modus og plattform.",
          "Oppdragsfullføring med årsakslogging for avbrudd.",
          "Retention-mål på D1/D7/D30 for å validere interesse.",
        ],
      },
      {
        label: "Testplan",
        items: [
          "Planlegg A/B-tester på onboarding, vanskelighetsgrad eller økonomi.",
          "Etabler bug triage-prosess med responstid og ansvarlige.",
        ],
      },
    ],
  },
  {
    id: "live-updates",
    title: "Live-oppdateringer",
    summary:
      "Planlagt rotasjon av sesongtemaer, politiske eventer og rådgivere for kontinuerlig innhold.",
    pillars: [
      {
        label: "Sesongtemaer",
        items: [
          "Produser 3–4 måneders kalender med planlagte temaer og assets.",
          "Forbered fallback-planer for forsinkelser via gjenbruk av innhold.",
        ],
      },
      {
        label: "Eventer og rådgivere",
        items: [
          "Bygg mekanikker for dynamisk aktivering og belønninger.",
          "Synk story- og gameplay-team for balanse og tonalitet.",
        ],
      },
      {
        label: "Drift",
        items: [
          "Etabler release-pipeline med rollback-strategi.",
          "QA-sjekklister for hver oppdatering (kompatibilitet, ytelse, lokalisering).",
        ],
      },
    ],
  },
  {
    id: "community",
    title: "Community feedback-loop",
    summary:
      "Etabler dedikerte kanaler for forslag og prioriter iterasjoner basert på respons.",
    pillars: [
      {
        label: "Kanaler",
        items: [
          "Start Discord/forum med kategorier for bugs, forslag og lore.",
          "Utnevn moderasjonsteam og retningslinjer for trygg tone.",
        ],
      },
      {
        label: "Feedback-prosess",
        items: [
          "Ukentlig eller biukentlig gjennomgang og tagging av tilbakemeldinger.",
          "Månedlig oppdatering til community om prioriteringer.",
        ],
      },
      {
        label: "Engasjement",
        items: [
          "Planlegg AMA-er, utviklerdagbøker og spotlight av bidragsytere.",
          "Belønn aktive medlemmer med kosmetikk eller titler.",
        ],
      },
    ],
  },
] as const;

const resourceSupport = {
  roles: [
    "LiveOps-produsent",
    "Dataanalytiker",
    "Community manager",
    "Supportteam",
  ] as const,
  tools: [
    "Telemetri: Amplitude, Firebase",
    "Ticket-håndtering: Jira eller Trello",
    "Kommunikasjon: Discord, Discourse",
  ] as const,
  risks: [
    "Datakvalitet – etabler validering og fallback-logging.",
    "Overoppdatering – bruk data til å balansere frekvens.",
    "Negativ feedback – proaktiv moderasjon og tydelig kommunikasjon.",
  ] as const,
} as const;

const milestoneTimeline = [
  {
    week: "Uke 1–2",
    focus: "Telemetri & KPI",
    deliverables: ["Event-skjema", "Dashboards", "Testplan"],
  },
  {
    week: "Uke 3–4",
    focus: "Beta-launch",
    deliverables: ["Invite-prosess", "Bug triage", "Første datareview"],
  },
  {
    week: "Uke 5–6",
    focus: "Live-innhold",
    deliverables: ["Sesongplan", "Assets produksjon", "QA"],
  },
  {
    week: "Uke 7–8",
    focus: "Community",
    deliverables: ["Discord/forum live", "Moderasjonsguide", "Første AMA"],
  },
  {
    week: "Uke 9+",
    focus: "Kontinuerlig drift",
    deliverables: ["Månedlige innholdsdrop", "Feedback-samlinger", "KPI-review"],
  },
] as const;

const followUpSteps = [
  "Bekreft ressurser og ansvarlige for hver aktivitet.",
  "Prioriter telemetri og KPI-er før beta for å sikre målegrunnlag.",
  "Sett opp community-kanaler tidlig og kommuniser roadmap.",
  "Etabler månedlige analyser av data og feedback for å justere planene.",
] as const;

export default function PhaseOne() {
  const [activeLayer, setActiveLayer] = useState<(typeof overlayLayers)[number]["id"]>(
    overlayLayers[0]?.id ?? "threat",
  );
  const layer = useMemo(
    () => overlayLayers.find((item) => item.id === activeLayer) ?? overlayLayers[0],
    [activeLayer],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-2 bg-emerald-500/20 text-emerald-300">
              Fase 1 – Konsept og prototyping
            </Badge>
            <h1 className="text-3xl font-semibold text-cyan-200 sm:text-4xl">
              Implementeringstavle for videre utvikling
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Dette dashbordet samler prioriterte mekanikker, UI-overlegg og tekniske notater for den
              første iterasjonen. Bruk det som referanse når prototyper og dokumentasjon skal synkes med
              hovedsimulasjonen.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="bg-slate-800 text-slate-200 hover:bg-slate-700">
              <Link to="/">Tilbake til simulasjonen</Link>
            </Button>
            <Button asChild variant="outline" className="border-cyan-400 text-cyan-200 hover:bg-cyan-500/10">
              <Link to="/fase-2">Fase 2 – Kart &amp; kontroll</Link>
            </Button>
          </div>
        </header>

        <Card className="border-cyan-500/30 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-200">Prioriterte kjernefunksjoner</CardTitle>
            <CardDescription className="text-slate-300">
              Velg mekanikker med høyest verdi for Fase 1; de blir grunnlaget for videre bygging.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            {coreMechanics.map((mechanic) => (
              <div key={mechanic.id} className="rounded-lg border border-cyan-500/20 bg-slate-950/40 p-4 shadow-lg">
                <h2 className="text-xl font-semibold text-cyan-100">{mechanic.title}</h2>
                <p className="mt-2 text-sm text-slate-300">{mechanic.summary}</p>
                <Separator className="my-3 border-cyan-500/30" />
                <ul className="space-y-2 text-sm text-slate-200">
                  {mechanic.focus.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs uppercase tracking-wide text-emerald-300/80">
                  Resultat: {mechanic.outcome}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-emerald-200">UI-overlegg og prototyper</CardTitle>
            <CardDescription className="text-slate-300">
              Klikk deg gjennom konseptuelle visninger for å visualisere hvordan lagene informerer
              beslutninger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeLayer} onValueChange={(value) => setActiveLayer(value as typeof activeLayer)}>
              <TabsList className="flex flex-wrap gap-3 bg-slate-800/50 p-2">
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
                  <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br p-6 shadow-2xl">
                      <div className={`rounded-xl border border-white/10 bg-gradient-to-br ${overlay.gradient} p-6 text-slate-900`}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold uppercase tracking-wide text-slate-900">
                            {overlay.label}
                          </h3>
                          <Badge className="bg-white/20 text-slate-900">Prototype</Badge>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-slate-900/90">{overlay.description}</p>
                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                          {overlay.metrics.map((metric) => (
                            <div
                              key={`${overlay.id}-${metric.label}`}
                              className="rounded-lg border border-white/30 bg-white/20 p-3 text-center"
                            >
                              <div className="text-xs uppercase text-slate-900/70">{metric.label}</div>
                              <div className="text-lg font-semibold text-slate-900">{metric.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                        <h4 className="text-sm font-semibold text-emerald-200">Designnotater</h4>
                        <p className="mt-2 text-sm text-slate-300">
                          Overlegget mates av heatmap-data og logistikk-/moralskår. Panelet viser hvordan
                          rådata oversettes til tydelige handlinger for spilleren.
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                        <h4 className="text-sm font-semibold text-emerald-200">Neste steg</h4>
                        <ul className="mt-2 space-y-2 text-sm text-slate-300">
                          <li>• Lag mock-data i `lib` for å drive canvas-overlay.</li>
                          <li>• Synk varsler med hoved-HUD når terskler passeres.</li>
                          <li>• Forbered datakroker for co-op deling av lagstatus.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-200">Sesongprototyper</CardTitle>
            <CardDescription className="text-slate-300">
              Laveffekts-sesongkort som kan testes uten full hendelsesmotor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72 rounded-lg border border-purple-500/20 bg-slate-950/50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                {seasonTimeline.map((season) => (
                  <div key={season.id} className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-purple-100">{season.title}</h3>
                      <Badge className="bg-purple-300/20 text-purple-200">Prototypekort</Badge>
                    </div>
                    <p className="mt-2 text-sm text-purple-100/90">{season.hook}</p>
                    <ul className="mt-3 space-y-2 text-sm text-purple-50/90">
                      {season.beats.map((beat) => (
                        <li key={beat} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-300" />
                          <span>{beat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-sky-500/30 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-sky-200">Logistikk og trusselinnsikt</CardTitle>
            <CardDescription className="text-slate-300">
              Visualisering av rutenett, kapasitetsstatus og hvordan heatmapet påvirker planlegging.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {logisticsRoutes.map((route) => (
                <div key={route.id} className="rounded-lg border border-sky-500/20 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-sky-100">{route.name}</h3>
                    <Badge className="bg-sky-300/20 text-sky-100">{route.status}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
                    <div>
                      <div className="text-xs uppercase text-slate-400">Risiko</div>
                      <div>{route.risk}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs uppercase text-slate-400">Leveranse</div>
                      <div>{route.throughput}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {heatmapInsights.map((insight) => (
                <div key={insight.id} className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
                  <h4 className="text-sm font-semibold text-emerald-200">{insight.title}</h4>
                  <p className="mt-2 text-sm text-slate-300">{insight.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-200">Teknisk vurdering</CardTitle>
            <CardDescription className="text-slate-300">
              Oppsummering av arkitekturvalg og forberedelser til Fase 2.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {technicalStack.map((section) => (
              <div key={section.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <h3 className="text-lg font-semibold text-amber-100">{section.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-amber-50/90">
                  {section.notes.map((note) => (
                    <li key={note} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-slate-900/60">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl text-emerald-200">Fase 5 – Launch og oppfølging</CardTitle>
                <CardDescription className="text-slate-300">
                  LiveOps-plan som dekker soft launch, kontinuerlige oppdateringer og community-arbeid.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-400/20 text-emerald-200">LiveOps</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              {launchStreams.map((stream) => (
                <div key={stream.id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-emerald-100">{stream.title}</h3>
                    <Badge className="bg-emerald-300/20 text-emerald-100">Kjerne</Badge>
                  </div>
                  <p className="mt-2 text-sm text-emerald-50/80">{stream.summary}</p>
                  <Separator className="my-3 border-emerald-500/30" />
                  <div className="space-y-3">
                    {stream.pillars.map((pillar) => (
                      <div key={`${stream.id}-${pillar.label}`}>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                          {pillar.label}
                        </h4>
                        <ul className="mt-1 space-y-2 text-sm text-emerald-50/90">
                          {pillar.items.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="border-emerald-500/20" />

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-emerald-500/20 bg-slate-950/50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Teamroller</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {resourceSupport.roles.map((role) => (
                    <li key={role} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      <span>{role}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-slate-950/50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Verktøy</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {resourceSupport.tools.map((tool) => (
                    <li key={tool} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      <span>{tool}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-slate-950/50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Risikofaktorer</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {resourceSupport.risks.map((risk) => (
                    <li key={risk} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator className="border-emerald-500/20" />

            <div className="rounded-lg border border-emerald-500/20">
              <div className="grid grid-cols-[0.8fr_1fr_1.2fr] gap-3 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100">
                <span>Uke</span>
                <span>Fokus</span>
                <span>Leveranser</span>
              </div>
              <div className="divide-y divide-emerald-500/10">
                {milestoneTimeline.map((milestone) => (
                  <div
                    key={milestone.week}
                    className="grid grid-cols-[0.8fr_1fr_1.2fr] gap-3 px-4 py-3 text-sm text-slate-200"
                  >
                    <span className="font-semibold text-emerald-200">{milestone.week}</span>
                    <span>{milestone.focus}</span>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {milestone.deliverables.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 h-1 w-1 rounded-full bg-emerald-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="border-emerald-500/20" />

            <div className="rounded-lg border border-emerald-500/20 bg-slate-950/50 p-4">
              <h3 className="text-sm font-semibold text-emerald-200">Neste steg</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {followUpSteps.map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
