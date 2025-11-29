/**
 * MorphToggleButton - Toggle button for switching between globe and flat map views
 *
 * Displays a floating button that triggers the morphing animation
 * between 3D globe and 2D flat map projections.
 */
import { memo, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GlobeSceneHandle } from '@/components/GlobeScene';

export interface MorphToggleButtonProps {
  /** Reference to the GlobeScene for controlling morphing */
  globeRef: React.RefObject<GlobeSceneHandle>;
  /** Whether the button should be visible */
  visible?: boolean;
  /** Optional className for positioning */
  className?: string;
}

function MorphToggleButtonComponent({
  globeRef,
  visible = true,
  className,
}: MorphToggleButtonProps) {
  const [isFlat, setIsFlat] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Poll morph factor to update button state
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      const factor = globeRef.current?.getMorphFactor() ?? 0;
      setIsFlat(factor > 0.5);
    }, 100);

    return () => clearInterval(interval);
  }, [globeRef, visible]);

  const handleToggle = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    globeRef.current?.toggleMorphView();

    // Reset animating state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 1300); // Slightly longer than animation duration
  }, [globeRef, isAnimating]);

  if (!visible) return null;

  const Icon = isFlat ? Globe : Map;
  const label = isFlat ? 'Bytt til globus' : 'Bytt til flatt kart';
  const shortcut = 'M';

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleToggle}
          disabled={isAnimating}
          aria-label={label}
          className={cn(
            'h-10 w-10 rounded-full',
            'border-2 border-cyan-400/60',
            'bg-slate-900/90 backdrop-blur-sm',
            'text-cyan-200 hover:text-cyan-50',
            'hover:bg-cyan-500/20 hover:border-cyan-300',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
            'shadow-[0_0_15px_rgba(34,211,238,0.3)]',
            'hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]',
            isAnimating && 'animate-pulse cursor-wait',
            className
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5 transition-transform duration-300',
              isAnimating && 'animate-spin'
            )}
            aria-hidden="true"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        className="bg-slate-950/95 border border-cyan-500/40 text-cyan-100"
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
          {label}
        </div>
        <p className="mt-1 text-xs text-cyan-100/90">
          {isFlat
            ? 'Animer tilbake til 3D-globus visning'
            : 'Animer til 2D flatt kart visning'}
        </p>
        <div className="mt-2 text-[10px] font-mono text-cyan-400/80">
          Hurtigtast:{' '}
          <kbd className="mx-0.5 rounded border border-cyan-500/40 bg-black/60 px-1 py-0.5 text-[9px]">
            {shortcut}
          </kbd>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export const MorphToggleButton = memo(MorphToggleButtonComponent);
MorphToggleButton.displayName = 'MorphToggleButton';

export default MorphToggleButton;
