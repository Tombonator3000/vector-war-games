import { Biohazard, Activity, ShieldCheck, FlaskConical } from 'lucide-react';
import type { PandemicState } from '@/hooks/usePandemic';

interface PandemicPanelProps {
  state: PandemicState;
  enabled?: boolean;
  biowarfareEnabled?: boolean;
}

const STAGE_CONFIG = {
  outbreak: {
    label: 'OUTBREAK',
    color: 'text-yellow-300',
    border: 'border-yellow-400/40'
  },
  epidemic: {
    label: 'EPIDEMIC',
    color: 'text-orange-300',
    border: 'border-orange-400/40'
  },
  pandemic: {
    label: 'PANDEMIC',
    color: 'text-red-400',
    border: 'border-red-400/50'
  },
  collapse: {
    label: 'SYSTEM FAILURE',
    color: 'text-red-500 font-semibold',
    border: 'border-red-500/70'
  }
} as const;

function ProgressBar({ value, color, background = 'bg-cyan-500/10' }: { value: number; color: string; background?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`h-2 rounded ${background}`}>
      <div className={`h-2 rounded ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function PandemicPanel({ state, enabled = true, biowarfareEnabled = true }: PandemicPanelProps) {
  const stage = STAGE_CONFIG[state.stage] ?? STAGE_CONFIG.outbreak;
  const infection = Math.round(state.globalInfection);
  const containment = Math.round(state.containmentEffort);
  const vaccine = Math.round(Math.min(state.vaccineProgress, 100));
  const mutation = Math.round(Math.min(state.mutationLevel * 8, 100));
  const disabledMessage = !enabled
    ? 'Pandemic integration disabled – biosurveillance lattice offline by command directive.'
    : !biowarfareEnabled
      ? 'Bio-weapon conquest options disabled – monitoring only for compliance audit.'
      : null;

    return (
      <div className={`fixed bottom-20 right-4 z-50 w-80 bg-black/80 backdrop-blur-md border ${stage.border} rounded-lg shadow-xl shadow-cyan-900/30 pointer-events-auto text-[11px] font-mono text-cyan-200`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/30">
        <div className="flex items-center gap-2 uppercase tracking-[0.35em] text-[10px] text-cyan-300">
          <Biohazard className="h-4 w-4 text-red-400" />
          BIOSHIELD
        </div>
        <span className={`${stage.color} text-[10px] tracking-wide`}>{stage.label}</span>
      </div>

      {disabledMessage ? (
        <div className="px-3 py-4 text-cyan-200/80 space-y-2">
          <div className="uppercase text-[10px] text-cyan-400 tracking-[0.3em]">Protocols Locked</div>
          <div>{disabledMessage}</div>
          {state.active && enabled && (
            <div className="text-[10px] text-cyan-300/80">
              {state.strainName} remains under containment watch. Metrics frozen until directives change.
            </div>
          )}
        </div>
      ) : state.active ? (
        <div className="space-y-3 px-3 py-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-cyan-200 uppercase">
              <span>{state.strainName || 'UNKNOWN STRAIN'}</span>
              <span className="text-cyan-400/70">{infection}%</span>
            </div>
            <div className="text-[10px] text-cyan-400/80">
              {state.pathogenType || 'bio-agent classifying...'}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase text-cyan-300">
                <span className="flex items-center gap-1"><Activity className="h-3 w-3" />Infection Pressure</span>
                <span>{infection}%</span>
              </div>
              <ProgressBar value={infection} color="bg-red-500/70" background="bg-red-500/10" />
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] uppercase text-cyan-300">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Containment</span>
                <span>{containment}%</span>
              </div>
              <ProgressBar value={containment} color="bg-cyan-400/80" />
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] uppercase text-cyan-300">
                <span className="flex items-center gap-1"><FlaskConical className="h-3 w-3" />Vaccine</span>
                <span>{vaccine}%</span>
              </div>
              <ProgressBar value={vaccine} color="bg-green-400/70" background="bg-green-500/10" />
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] uppercase text-cyan-300">
                <span>Mutation Index</span>
                <span>{Math.round(state.mutationLevel)}</span>
              </div>
              <ProgressBar value={mutation} color="bg-purple-400/70" background="bg-purple-500/10" />
              {state.lastMutation && (
                <div className="text-[10px] text-purple-300/80 mt-1 uppercase tracking-wide">
                  Last shift: {state.lastMutation}
                </div>
              )}
            </div>
          </div>

          <div className="border border-cyan-500/20 rounded p-2 space-y-1 bg-black/40">
            <div className="text-[9px] uppercase text-cyan-400/80 tracking-wide">Outbreak Theatres</div>
            {state.outbreaks.length === 0 ? (
              <div className="text-[10px] text-cyan-200/70">Surveillance nodes scanning...</div>
            ) : (
              state.outbreaks.map(outbreak => (
                <div key={outbreak.region} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-cyan-200">
                    <span>{outbreak.region}</span>
                    <span>{Math.round(outbreak.infection)}%</span>
                  </div>
                  <ProgressBar value={outbreak.infection} color="bg-red-400/80" background="bg-red-500/10" />
                </div>
              ))
            )}
          </div>

          {state.suspectedActors.length > 0 && (
            <div className="text-[10px] uppercase text-cyan-300">
              Suspected actors: {state.suspectedActors.join(', ')}
            </div>
          )}

          <div className="text-[10px] text-cyan-300/80">
            Casualties: {state.casualtyTally.toLocaleString()} personnel affected
          </div>
        </div>
      ) : (
        <div className="px-3 py-4 text-cyan-200/80 space-y-1">
          <div className="uppercase text-[10px] text-cyan-400 tracking-[0.3em]">No Active Pathogen</div>
          <div>
            {state.casualtyTally > 0
              ? `Last strain neutralized after ${state.casualtyTally.toLocaleString()} casualties.`
              : 'Bio-defense network standing by.'}
          </div>
        </div>
      )}
    </div>
  );
}
