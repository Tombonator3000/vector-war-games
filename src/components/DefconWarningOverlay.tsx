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
      className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-red-950/90 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.6em] text-red-200/80">
          Critical Alert
        </span>
        <h2 className="text-4xl font-black uppercase text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.45)] sm:text-5xl md:text-6xl">
          WARNING: DEFCON 1
        </h2>
        <p className="text-base font-semibold text-red-100/90 sm:text-lg">
          Immediate nuclear threat detected. Strategic command has escalated to maximum readiness.
        </p>
      </div>
    </div>
  );
};
