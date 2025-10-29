import { Dna } from 'lucide-react';

interface DNAPointsDisplayProps {
  dnaPoints: number;
  className?: string;
}

export function DNAPointsDisplay({ dnaPoints, className = '' }: DNAPointsDisplayProps) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2
        bg-emerald-500/10 border border-emerald-400/40 rounded
        ${className}
      `}
    >
      <Dna className="h-5 w-5 text-emerald-400 animate-pulse" />
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.25em] text-emerald-400/80">
          DNA POINTS
        </span>
        <span className="text-xl font-bold text-emerald-300 tabular-nums leading-none">
          {dnaPoints}
        </span>
      </div>
    </div>
  );
}
