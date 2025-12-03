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

  // Poll morph factor to update button state - only during animation for efficiency
  useEffect(() => {
    if (!visible) return;

    // Initial state sync
    const factor = globeRef.current?.getMorphFactor() ?? 0;
    setIsFlat(factor > 0.5);

    // Only poll during animation for smooth feedback
    if (!isAnimating) return;

    const interval = setInterval(() => {
      const currentFactor = globeRef.current?.getMorphFactor() ?? 0;
      setIsFlat(currentFactor > 0.5);
    }, 32); // 30fps is sufficient for button state feedback

    return () => clearInterval(interval);
  }, [globeRef, visible, isAnimating]);

  const handleToggle = useCallback(() => {
    if (isAnimating) return;

    const currentFactor = globeRef.current?.getMorphFactor() ?? 0;
    const targetFlat = currentFactor < 0.5;

    setIsAnimating(true);
    globeRef.current?.toggleMorphView();

    // Poll for animation completion with safety timeout
    const startTime = Date.now();
    const maxDuration = 3000; // Safety timeout: 3 seconds max

    const checkCompletion = () => {
      const factor = globeRef.current?.getMorphFactor() ?? 0;
      const elapsed = Date.now() - startTime;
      const isComplete = targetFlat
        ? factor > 0.95
        : factor < 0.05;

      if (isComplete || elapsed > maxDuration) {
        setIsAnimating(false);
        // Use actual factor to determine final state (handles edge cases)
        const finalFactor = globeRef.current?.getMorphFactor() ?? (targetFlat ? 1 : 0);
        setIsFlat(finalFactor > 0.5);
      } else {
        requestAnimationFrame(checkCompletion);
      }
    };

    // Start checking after a small delay to let animation begin
    setTimeout(checkCompletion, 100);
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
