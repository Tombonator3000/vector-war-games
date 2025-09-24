import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { usePhaseTwoSimulation } from "@/hooks/use-phase-two-simulation";

const statusStyles: Record<string, string> = {
  Aktiv: "bg-emerald-400/20 text-emerald-200",
  Planlagt: "bg-slate-500/20 text-slate-200",
};

const logisticsStyles: Record<string, string> = {
  Stabil: "bg-emerald-400/20 text-emerald-200",
  Presset: "bg-amber-400/20 text-amber-200",
  Kritisk: "bg-red-500/20 text-red-200",
  Sårbar: "bg-cyan-400/20 text-cyan-100",
};

const defconLabel = (level: number) => {
  switch (level) {
    case 5:
      return "Peacetime";
    case 4:
      return "Increased Vigilance";
    case 3:
      return "Round-the-clock";
    case 2:
      return "Next-step";
    case 1:
      return "Maximum";
    default:
      return "Ukjent";
  }
};

const moraleState = (value: number) => {
  if (value >= 75) return "Høy";
  if (value >= 55) return "Stabil";
  return "Presset";
};

const intelState = (value: number) => {
  if (value >= 70) return "Overwatch";
  if (value >= 45) return "Operativ";
  return "Begrenset";
};

const integrityState = (value: number) => {
  if (value >= 75) return "Robust";
  if (value >= 55) return "Sårbar";
  return "Kritisk";
};

export default function PhaseTwo() {
  const {
    isLoading,
    metrics,
    activeSeason,
    logistics,
    threats,
    operations,
    protocols,
    timeline,
    currentEvent,
    canAdvance,
    canRewind,
    advance,
    rewind,
  } = usePhaseTwoSimulation();

  if (isLoading || !metrics || !currentEvent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Laster fase 2-simulering …</span>
        </div>
      </div>
    );
  }

  const moraleLabel = moraleState(metrics.morale);
  const intelLabel = intelState(metrics.intel);
  const integrityLabel = integrityState(metrics.logisticsIntegrity);
  const defconDescriptor = defconLabel(metrics.defcon);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-2 bg-emerald-500/20 text-emerald-300">
              Fase 2 – Minimum Viable Feature-set
            </Badge>
            <h1 className="text-3xl font-semibold text-cyan-200 sm:text-4xl">
              Operativ MVP og simulasjonsloop
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Dette dashbordet knytter fase 1-konseptene til en kjørbar MVP med datamodeller, hendelsesloop og
              handlingsanbefalinger. Bruk kontrollene for å gå gjennom runder og se hvordan logistikk, trusler og moral
              utvikler seg i sanntid.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="bg-slate-800 text-slate-200 hover:bg-slate-700">
              <Link to="/">Tilbake til simulasjonen</Link>
            </Button>
            <Button asChild variant="outline" className="border-cyan-500/60 text-cyan-200 hover:bg-cyan-500/20">
              <Link to="/fase-1">Vis fase 1</Link>
            </Button>
          </div>
        </header>

        <Card className="border-cyan-500/30 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-200">Operativ status</CardTitle>
            <CardDescription className="text-slate-300">
              Nøkkelindikatorer for MVP-simuleringen og gjeldende sesongfokus.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
                <div className="text-xs uppercase text-cyan-100/70">Runde</div>
                <div className="mt-2 text-2xl font-semibold text-cyan-50">{metrics.turn}</div>
                <p className="mt-1 text-xs text-cyan-100/70">Simuleringsrunde i MVP-loop</p>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="text-xs uppercase text-emerald-100/70">DEFCON</div>
                <div className="mt-2 text-2xl font-semibold text-emerald-50">{metrics.defcon}</div>
                <p className="mt-1 text-xs text-emerald-100/70">{defconDescriptor}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between text-xs uppercase text-emerald-100/80">
                  <span>Sivil moral</span>
                  <span>{moraleLabel}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold text-emerald-100">{metrics.morale}%</span>
                  <Badge className="bg-emerald-400/20 text-emerald-100">Humanitær</Badge>
                </div>
                <Progress value={metrics.morale} className="mt-3 h-2 bg-emerald-500/30" />
              </div>
              <div className="rounded-lg border border-sky-500/30 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between text-xs uppercase text-sky-100/80">
                  <span>Intel-nivå</span>
                  <span>{intelLabel}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold text-sky-100">{metrics.intel}%</span>
                  <Badge className="bg-sky-400/20 text-sky-100">Recon</Badge>
                </div>
                <Progress value={metrics.intel} className="mt-3 h-2 bg-sky-500/30" />
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-slate-950/50 p-4 sm:col-span-2">
                <div className="flex items-center justify-between text-xs uppercase text-amber-100/80">
                  <span>Logistikk-integritet</span>
                  <span>{integrityLabel}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold text-amber-100">{metrics.logisticsIntegrity}%</span>
                  <Badge className="bg-amber-400/20 text-amber-100">Supply</Badge>
                </div>
                <Progress value={metrics.logisticsIntegrity} className="mt-3 h-2 bg-amber-500/30" />
              </div>
            </div>
            <div className="rounded-lg border border-sky-500/30 bg-slate-950/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-sky-100">{activeSeason?.title}</h2>
                <Badge className="bg-sky-300/20 text-sky-100">Aktiv sesong</Badge>
              </div>
              <p className="mt-3 text-sm text-slate-300">{activeSeason?.description}</p>
              <Separator className="my-4 border-sky-500/20" />
              <ul className="space-y-2 text-sm text-slate-200">
                {activeSeason?.focus.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs uppercase tracking-wide text-sky-200/80">
                Belønning: {activeSeason?.reward}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-emerald-200">Simulasjonsloop</CardTitle>
            <CardDescription className="text-slate-300">
              Steg gjennom scriptede hendelser for å se hvordan MVP-en reagerer på press.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="border-emerald-500/60 text-emerald-200 hover:bg-emerald-500/20"
                  onClick={rewind}
                  disabled={!canRewind}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Forrige
                </Button>
                <Button
                  className="bg-emerald-500/80 text-slate-950 hover:bg-emerald-500"
                  onClick={advance}
                  disabled={!canAdvance}
                >
                  Neste <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-slate-300">
                <span className="font-semibold text-emerald-200">{currentEvent.title}</span> – Runde {currentEvent.turn}
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              {timeline.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "rounded-lg border p-4 transition",
                    event.status === "active" && "border-emerald-500/60 bg-emerald-500/10 shadow-lg",
                    event.status === "completed" && "border-emerald-500/30 bg-emerald-500/5",
                    event.status === "upcoming" && "border-slate-700 bg-slate-950/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-100">{event.title}</h3>
                      <p className="mt-1 text-sm text-slate-300">{event.summary}</p>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs",
                        event.status === "active" && "bg-emerald-500/80 text-slate-950",
                        event.status === "completed" && "bg-emerald-400/30 text-emerald-100",
                        event.status === "upcoming" && "bg-slate-700 text-slate-200",
                      )}
                    >
                      {event.status === "completed"
                        ? "Fullført"
                        : event.status === "active"
                        ? "Pågår"
                        : "Kø"}
                    </Badge>
                  </div>
                  <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-100/90">
                    Fokus: {event.focus}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-200">Aktiv hendelse</CardTitle>
            <CardDescription className="text-slate-300">
              Detaljer og anbefalte tiltak for hendelsen som er aktiv i simuleringen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-purple-100">{currentEvent.title}</h2>
                <Badge className="bg-purple-300/30 text-purple-100">Runde {currentEvent.turn}</Badge>
              </div>
              <p className="mt-3 text-sm text-purple-100/90">{currentEvent.summary}</p>
              <div className="mt-4 rounded-lg border border-purple-400/30 bg-purple-400/10 p-4 text-sm text-purple-50/80">
                <span className="font-semibold text-purple-100">Fokus</span>
                <p className="mt-2 text-purple-50/90">{currentEvent.focus}</p>
              </div>
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-purple-200">
                Anbefalte handlinger
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-purple-100/90">
                {currentEvent.response.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-sky-500/30 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-2xl text-sky-200">Logistikknettverk</CardTitle>
              <CardDescription className="text-slate-300">
                Status for forsyningsruter etter påførte hendelser og anbefalte tiltak.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-sky-500/20">
                    <TableHead className="text-slate-300">Rute</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Kapasitet</TableHead>
                    <TableHead className="text-slate-300">Risiko</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logistics.map((route) => (
                    <TableRow key={route.id} className="border-sky-500/10">
                      <TableCell>
                        <div className="text-sm font-semibold text-sky-100">{route.name}</div>
                        <div className="text-xs text-slate-400">{route.mode} · {route.priority}</div>
                        <div className="mt-1 text-xs text-slate-400">{route.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", logisticsStyles[route.status] ?? "bg-slate-700 text-slate-200")}>
                          {route.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-200">{route.capacity}%</div>
                        <div className="text-xs text-slate-400">Noder: {route.nodes.join(", ")}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-200">{route.risk}</div>
                        {route.notes.length > 0 && (
                          <ul className="mt-1 space-y-1 text-xs text-sky-100/70">
                            {route.notes.map((note) => (
                              <li key={`${route.id}-${note.id}`}>• {note.text}</li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-rose-500/30 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-2xl text-rose-200">Trusselanalyse</CardTitle>
              <CardDescription className="text-slate-300">
                Oppdatert intensitet og posture for identifiserte sektorer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {threats.map((sector) => (
                <div key={sector.id} className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-rose-100">{sector.title}</h3>
                    <Badge className="bg-rose-400/30 text-rose-100">{sector.posture}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-rose-50/80">{sector.narrative}</p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs uppercase text-rose-100/80">
                      <span>Intensitet</span>
                      <span>{sector.intensity}%</span>
                    </div>
                    <Progress value={sector.intensity} className="mt-2 h-2 bg-rose-500/30" />
                  </div>
                  {sector.notes.length > 0 && (
                    <ul className="mt-3 space-y-2 text-xs text-rose-100/70">
                      {sector.notes.map((note) => (
                        <li key={`${sector.id}-${note.id}`} className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3 w-3 text-rose-300" />
                          <span>{note.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-emerald-500/30 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-2xl text-emerald-200">Operasjoner</CardTitle>
              <CardDescription className="text-slate-300">
                MVP-funksjoner som låses opp etter hvert som hendelser fullføres.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {operations.map((operation) => (
                <div key={operation.id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-emerald-100">{operation.name}</h3>
                    <Badge className={cn("text-xs", statusStyles[operation.status])}>{operation.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-emerald-50/80">{operation.summary}</p>
                  <Separator className="my-3 border-emerald-500/20" />
                  <div className="space-y-2 text-xs text-emerald-100/70">
                    <div>
                      <span className="font-semibold text-emerald-100">Vindu:</span> {operation.window}
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-100">Krav:</span>
                      <ul className="mt-1 space-y-1">
                        {operation.requirements.map((req) => (
                          <li key={req}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-100">Belønning:</span> {operation.reward}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-200">Koordinering og varsler</CardTitle>
              <CardDescription className="text-slate-300">
                Protokoller for co-op synkronisering og logg over genererte varsler.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ScrollArea className="h-48 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="space-y-4">
                  {protocols.map((protocol) => (
                    <div key={protocol.id} className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-amber-100">{protocol.title}</h3>
                        <Badge className="bg-amber-300/20 text-amber-100">{protocol.owner}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-amber-50/80">{protocol.description}</p>
                      <ul className="mt-3 space-y-1 text-xs text-amber-50/70">
                        {protocol.actions.map((action) => (
                          <li key={action}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                <h3 className="text-sm font-semibold text-amber-100">Varslingslogg</h3>
                <Separator className="my-3 border-amber-500/20" />
                <ScrollArea className="h-36">
                  <div className="space-y-3 text-xs text-amber-50/80">
                    {metrics.alerts.length === 0 ? (
                      <p className="text-amber-50/60">Ingen varsler aktivert ennå.</p>
                    ) : (
                      metrics.alerts.map((alert) => (
                        <div key={`${alert.id}-${alert.text}`} className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3 w-3 text-amber-300" />
                          <span>{alert.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
