import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { NuclearAftermathEntry } from '@/hooks/useNuclearAftermath';
import type { FalloutSeverity } from '@/lib/falloutEffects';
import type { NuclearAftermathMedia } from '@/state/nuclearAftermathEvents';

interface NuclearAftermathModalProps {
  open: boolean;
  aftermath: NuclearAftermathEntry | null;
  onClose: () => void;
}

const DEFAULT_IMAGES: NuclearAftermathMedia[] = [
  {
    src: '/images/hiroshima-ground-level.svg',
    alt: 'Stylised dome building and collapsed skyline evoking Hiroshima street-level devastation.',
    caption: 'Original vector illustration inspired by 1945 Hiroshima aftermath — created for Vector War Games.',
  },
  {
    src: '/images/hiroshima-mushroom-cloud.svg',
    alt: 'Stylised nuclear mushroom cloud rising over a river delta inspired by Hiroshima.',
    caption: 'Original vector illustration of the Hiroshima blast cloud — created for Vector War Games.',
  },
];

const severityCopy: Record<FalloutSeverity, { label: string; tone: string }> = {
  none: { label: 'Minimal Fallout Detected', tone: 'bg-slate-700 text-slate-100 border border-slate-500' },
  elevated: { label: 'Elevated Radiation Hazard', tone: 'bg-amber-600/40 text-amber-200 border border-amber-400/60' },
  severe: { label: 'Severe Fallout Threat', tone: 'bg-orange-700/40 text-orange-200 border border-orange-500/70' },
  deadly: { label: 'Deadly Fallout Zone', tone: 'bg-rose-700/40 text-rose-100 border border-rose-500/70' },
};

function formatMillions(value?: number): string {
  if (!value || value <= 0) {
    return '0';
  }
  if (value >= 100) {
    return Math.round(value).toLocaleString();
  }
  if (value >= 10) {
    return value.toFixed(1).replace(/\.0$/, '');
  }
  if (value >= 1) {
    return value.toFixed(1).replace(/\.0$/, '');
  }
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function NuclearAftermathModal({ open, aftermath, onClose }: NuclearAftermathModalProps) {
  if (!aftermath) {
    return null;
  }

  const images = aftermath.imagery ?? DEFAULT_IMAGES;
  const falloutSeverity = aftermath.falloutSeverity ?? 'none';
  const severityMeta = severityCopy[falloutSeverity];
  const stagedSummaries = aftermath.stageSummaries.filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-3xl bg-slate-950/95 text-slate-100 border border-cyan-500/30 shadow-[0_0_45px_rgba(34,211,238,0.35)]">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xs font-semibold tracking-[0.35em] uppercase text-cyan-300">
            Crisis Aftermath Bulletin
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Filed Turn {aftermath.turnCreated} — {aftermath.nationName.toUpperCase()} reels from thermonuclear devastation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm leading-relaxed">
          <section className="bg-slate-900/40 border border-slate-700/60 rounded-lg p-4 shadow-inner">
            <h3 className="text-xl font-semibold text-slate-50 tracking-wide">
              Humanitarian collapse in {aftermath.nationName}
            </h3>
            <p className="mt-2 text-slate-200 text-base">
              {aftermath.humanitarianSummary}
            </p>
            <p className="mt-2 text-slate-300">
              {aftermath.environmentalSummary}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
              <Badge variant="outline" className="border-cyan-400/60 text-cyan-200 bg-cyan-500/10">
                Severity Index {aftermath.severity.toFixed(2)}
              </Badge>
              {typeof aftermath.totalRefugees === 'number' && aftermath.totalRefugees > 0 && (
                <Badge variant="outline" className="border-rose-400/60 text-rose-200 bg-rose-500/10">
                  ≈ {formatMillions(aftermath.totalRefugees)}M displaced
                </Badge>
              )}
              <Badge variant="outline" className={`${severityMeta.tone} uppercase tracking-wide`}> 
                {severityMeta.label}
              </Badge>
            </div>
          </section>

          {stagedSummaries.length > 0 && (
            <section className="bg-slate-900/30 border-l-4 border-cyan-400/70 pl-5 py-3 rounded-r-lg shadow-lg shadow-cyan-500/10">
              <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">Impact Timeline</h4>
              <ul className="mt-2 space-y-2 text-slate-200">
                {stagedSummaries.map((summary, index) => (
                  <li key={`${aftermath.id}-stage-${index}`} className="flex gap-3">
                    <span className="text-cyan-300/80">{index + 1}.</span>
                    <span>{summary}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            {images.map((image) => (
              <figure key={image.src} className="overflow-hidden rounded-lg border border-slate-700/60 bg-slate-900/40 shadow-lg">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-40 w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                />
                <figcaption className="p-3 text-xs text-slate-300/90 uppercase tracking-wide">
                  {image.caption}
                </figcaption>
              </figure>
            ))}
          </section>

          <section className="space-y-2 rounded-lg border border-rose-500/40 bg-rose-950/40 p-4 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">Emergency Warnings</h4>
            <p className="text-sm text-rose-100/90">
              Civil defence agencies report cascading infrastructure failures, mass displacement, and acute radiation sickness.
              Fallout plumes will contaminate supply corridors for weeks. International relief teams are urged to mobilise with
              iodine stockpiles, shelter kits, and trauma support specialists.
            </p>
            <p className="text-xs text-rose-200/80">
              Evacuation corridors require continuous monitoring for looting, unrest, and secondary blasts. Maintain DEFCON
              readiness and prepare for retaliatory escalation across neighbouring theatres.
            </p>
          </section>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Intelligence memo archived for command review.
          </p>
          <Button variant="secondary" className="bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/40" onClick={onClose}>
            Acknowledge Briefing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
