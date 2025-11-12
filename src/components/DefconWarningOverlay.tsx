import type { FC } from 'react';

interface DefconWarningOverlayProps {
  isVisible: boolean;
}

export const DefconWarningOverlay: FC<DefconWarningOverlayProps> = ({ isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed top-24 left-1/2 z-[80] w-full max-w-3xl -translate-x-1/2 px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="relative overflow-hidden rounded-xl border border-red-500/60 bg-red-950/85 px-6 py-5 text-center shadow-[0_20px_45px_-20px_rgba(248,113,113,0.65)] backdrop-blur-md">
        <div className="absolute inset-x-6 top-2 h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 opacity-70" />
        <span className="text-xs font-semibold uppercase tracking-[0.55em] text-red-100/80">
          Critical Alert
        </span>
        <h2 className="mt-2 text-3xl font-black uppercase text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.35)] sm:text-4xl">
          DEFCON 1 WARNING
        </h2>
        <p className="mt-3 text-sm font-semibold text-red-100/90 sm:text-base">
          Immediate nuclear threat detected. Strategic command has escalated to maximum readiness.
        </p>
      </div>
    </div>
  );
};
