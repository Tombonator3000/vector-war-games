/**
 * MapViewToggle - Polyglobe-inspired segmented toggle for map views
 * 
 * A sleek segmented control that switches between Globe and Flat map views
 * with smooth animations and visual feedback.
 */
import { memo, useState, useCallback, useEffect } from 'react';
import { Globe, Map, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GlobeSceneHandle } from '@/components/GlobeScene';

export interface MapViewToggleProps {
  /** Reference to the GlobeScene for controlling morphing */
  globeRef: React.RefObject<GlobeSceneHandle>;
  /** Whether the toggle should be visible */
  visible?: boolean;
  /** Optional className for positioning */
  className?: string;
  /** Compact mode for smaller screens */
  compact?: boolean;
}

function MapViewToggleComponent({
  globeRef,
  visible = true,
  className,
  compact = false,
}: MapViewToggleProps) {
  const [isFlat, setIsFlat] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Poll morph factor to update toggle state
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      const factor = globeRef.current?.getMorphFactor() ?? 0;
      setIsFlat(factor > 0.5);
    }, 50);

    return () => clearInterval(interval);
  }, [globeRef, visible]);

  const handleToggle = useCallback((targetFlat: boolean) => {
    if (isAnimating || targetFlat === isFlat) return;

    setIsAnimating(true);
    
    if (targetFlat) {
      globeRef.current?.morphToFlat();
    } else {
      globeRef.current?.morphToGlobe();
    }

    // Reset animating state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 1400);
  }, [globeRef, isAnimating, isFlat]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          globeRef.current?.toggleMorphView();
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1400);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globeRef]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'flex items-center rounded-full',
        'bg-slate-900/95 backdrop-blur-md',
        'border border-cyan-500/30',
        'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
        'p-1',
        className
      )}
    >
      {/* Globe Option */}
      <button
        type="button"
        onClick={() => handleToggle(false)}
        disabled={isAnimating}
        className={cn(
          'relative flex items-center gap-2 rounded-full px-4 py-2',
          'transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
          !isFlat
            ? 'bg-gradient-to-r from-cyan-500/30 to-cyan-400/20 text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
            : 'text-cyan-300/60 hover:text-cyan-200 hover:bg-white/5',
          isAnimating && 'cursor-wait',
          compact && 'px-3 py-1.5'
        )}
        aria-label="Globus visning"
        aria-pressed={!isFlat}
      >
        {isAnimating && !isFlat ? (
          <Loader2 className={cn('h-4 w-4 animate-spin', compact && 'h-3.5 w-3.5')} />
        ) : (
          <Globe className={cn('h-4 w-4', compact && 'h-3.5 w-3.5')} />
        )}
        {!compact && (
          <span className="text-xs font-medium uppercase tracking-wider">Globus</span>
        )}
        
        {/* Active indicator glow */}
        {!isFlat && (
          <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-pulse pointer-events-none" />
        )}
      </button>

      {/* Flat Map Option */}
      <button
        type="button"
        onClick={() => handleToggle(true)}
        disabled={isAnimating}
        className={cn(
          'relative flex items-center gap-2 rounded-full px-4 py-2',
          'transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
          isFlat
            ? 'bg-gradient-to-r from-cyan-500/30 to-cyan-400/20 text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
            : 'text-cyan-300/60 hover:text-cyan-200 hover:bg-white/5',
          isAnimating && 'cursor-wait',
          compact && 'px-3 py-1.5'
        )}
        aria-label="Flatt kart visning"
        aria-pressed={isFlat}
      >
        {isAnimating && isFlat ? (
          <Loader2 className={cn('h-4 w-4 animate-spin', compact && 'h-3.5 w-3.5')} />
        ) : (
          <Map className={cn('h-4 w-4', compact && 'h-3.5 w-3.5')} />
        )}
        {!compact && (
          <span className="text-xs font-medium uppercase tracking-wider">Flat</span>
        )}
        
        {/* Active indicator glow */}
        {isFlat && (
          <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-pulse pointer-events-none" />
        )}
      </button>

      {/* Keyboard hint */}
      {!compact && (
        <div className="ml-2 mr-1 text-[9px] font-mono text-cyan-500/50">
          <kbd className="rounded border border-cyan-500/20 bg-black/40 px-1 py-0.5">M</kbd>
        </div>
      )}
    </div>
  );
}

export const MapViewToggle = memo(MapViewToggleComponent);
MapViewToggle.displayName = 'MapViewToggle';

export default MapViewToggle;
