/**
 * Card Story Modal Component
 *
 * Displays a narrative story panel when cards are played, inspired by Cultist Simulator.
 * Shows flavor text, card details, and atmospheric storytelling.
 *
 * Position can be configured in Options (left or right side of screen).
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Sparkles, BookOpen, Flame, Skull, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WarheadCard, DeliverySystem, SecretCard, SpecialEventCard } from '@/types/nuclearWarCampaign';

// Card story data for narrative flavor
export interface CardStory {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  category: 'warhead' | 'delivery' | 'secret' | 'event' | 'action';
  narrativeText: string;
  flavorQuote?: string;
  quoteAttribution?: string;
  consequences?: string[];
  lore?: string;
  timeCost?: number; // seconds
  colorScheme: 'destructive' | 'tactical' | 'covert' | 'chaotic' | 'neutral';
}

// Pre-defined card stories for warheads
const WARHEAD_STORIES: Record<number, Omit<CardStory, 'id' | 'title' | 'icon' | 'category'>> = {
  5: {
    subtitle: 'Tactical Warhead',
    narrativeText: 'A gentle nudge, they call it. The military minds who conceived this weapon spoke of "surgical strikes" and "acceptable losses." The truth is messier. Five megatons is enough to remind everyone what fire looks like.',
    flavorQuote: 'In war, the first casualty is the distinction between "tactical" and "monstrous."',
    quoteAttribution: 'General Marcus Cole, ret.',
    consequences: ['Eliminates localized population', 'Minimal fallout radius', 'Psychological impact on neighboring regions'],
    lore: 'First deployed during the Taiwan Strait Crisis simulations, this yield became the baseline for "proportional response" doctrine.',
    colorScheme: 'destructive',
  },
  10: {
    subtitle: 'City Buster',
    narrativeText: 'The city-buster. A term invented by strategists who never had to watch one detonate. Ten megatons turns a metropolis into a memory, a civilization into archaeology waiting to happen.',
    flavorQuote: 'Cities take centuries to build. We have learned to unmake them in seconds.',
    quoteAttribution: 'Unknown',
    consequences: ['Destroys major urban center', 'Creates significant fallout zone', 'Economic infrastructure eliminated'],
    lore: 'The 10MT yield represents the threshold where "victory" becomes indistinguishable from "mutual annihilation."',
    colorScheme: 'destructive',
  },
  15: {
    subtitle: 'Metropolitan Destroyer',
    narrativeText: 'Fifteen megatons. Enough to ensure that when the history books are written—if there are hands left to write them—this moment will be remembered as the point of no return.',
    flavorQuote: 'We have guided missiles and misguided men.',
    quoteAttribution: 'Martin Luther King Jr.',
    consequences: ['Catastrophic metropolitan destruction', 'Extended fallout contamination', 'Regional infrastructure collapse'],
    lore: 'Originally designed for hardened military targets, field commanders soon discovered its "secondary applications."',
    colorScheme: 'destructive',
  },
  25: {
    subtitle: 'Regional Annihilator',
    narrativeText: 'The regional annihilator needs no introduction. Twenty-five megatons of refined apocalypse, carefully engineered to transform geography itself. Mountains become craters. Rivers become steam.',
    flavorQuote: 'I am become Death, the destroyer of worlds.',
    quoteAttribution: 'J. Robert Oppenheimer',
    consequences: ['Multi-city destruction radius', 'Massive fallout cloud formation', 'Long-term environmental devastation'],
    lore: 'Strategic doctrine suggests these weapons exist purely for deterrence. Strategic doctrine has been wrong before.',
    colorScheme: 'destructive',
  },
  50: {
    subtitle: 'Tsar Bomba Lite',
    narrativeText: 'They call it "Tsar Bomba Lite" with the gallows humor of people who build these things. Fifty megatons—half the yield of the largest weapon ever detonated. As if that makes it reasonable.',
    flavorQuote: 'The survivors will envy the dead.',
    quoteAttribution: 'Nikita Khrushchev',
    consequences: ['Continental-scale destruction', 'Global atmospheric effects', 'Multi-generational contamination'],
    lore: 'Development of this yield class was theoretically banned by treaty. Theory and practice diverged years ago.',
    colorScheme: 'destructive',
  },
  100: {
    subtitle: 'Civilization Ender',
    narrativeText: 'One hundred megatons. The civilization ender. There are no tactical applications, no strategic benefits, no rational explanations. This weapon exists purely as a monument to human hubris—a final argument with no possible rebuttal.',
    flavorQuote: 'Now we are all sons of bitches.',
    quoteAttribution: 'Kenneth Bainbridge, Trinity Test Director',
    consequences: ['Extinction-level regional event', 'Nuclear winter contribution', 'End of organized society in blast zone'],
    lore: 'The last resort. The final card. When this is played, the game is already over—we are simply counting the dead.',
    colorScheme: 'destructive',
  },
};

// Stories for delivery systems
const DELIVERY_STORIES: Record<string, Omit<CardStory, 'id' | 'title' | 'icon' | 'category'>> = {
  ICBM: {
    subtitle: 'Intercontinental Ballistic Missile',
    narrativeText: 'The missile rises on a pillar of flame, breaching the clouds in under three minutes. At apogee, it is beautiful—a man-made comet streaking across the heavens. Then it descends. Twenty-eight minutes from launch to impact. Twenty-eight minutes to say goodbye.',
    flavorQuote: 'The missile knows where it is at all times.',
    quoteAttribution: 'USAF Guidance System Documentation',
    consequences: ['High reliability delivery', 'Detectable by early warning systems', 'Can be intercepted by ABM systems'],
    lore: 'The first ICBMs were called "city busters" by their creators. The name proved prophetic.',
    colorScheme: 'tactical',
  },
  Bomber: {
    subtitle: 'Strategic Bomber',
    narrativeText: 'The bomber takes off at 0400 hours, crew silent with the weight of their cargo. Hours of flight time over hostile territory. Hours to contemplate what waits in the bomb bay. The slowest, most human way to deliver the end of the world.',
    flavorQuote: 'We will not go quietly into the night.',
    quoteAttribution: 'Strategic Air Command',
    consequences: ['Can be recalled after launch', 'Vulnerable to air defenses', 'Crew may refuse orders'],
    lore: 'Bomber crews undergo special psychological screening. Some call it testing. Others call it finding people who can live with themselves afterward.',
    colorScheme: 'tactical',
  },
  Submarine: {
    subtitle: 'SLBM - Submarine Launched Ballistic Missile',
    narrativeText: 'Deep beneath the waves, invisible to satellites and sonar alike, the submarine waits. Its missiles need no order to launch—only the absence of one to stand down. The deadliest weapon in the arsenal is patience.',
    flavorQuote: 'We come in peace. We leave in pieces.',
    quoteAttribution: 'Unofficial USS Ohio motto',
    consequences: ['Undetectable launch platform', 'Highest reliability rating', 'Cannot be preemptively destroyed'],
    lore: 'A single ballistic missile submarine carries enough firepower to end civilization. There are currently 31 such submarines patrolling the world\'s oceans.',
    colorScheme: 'covert',
  },
  Cruise: {
    subtitle: 'Cruise Missile',
    narrativeText: 'It flies low, hugging terrain, invisible to radar until the final approach. The cruise missile is a patient hunter—hours of flight time, constantly calculating, adjusting, seeking. When it finds its target, there is no warning.',
    flavorQuote: 'Stealth is the best defense.',
    quoteAttribution: 'Modern Warfare Doctrine',
    consequences: ['Terrain-following flight profile', 'Difficult to detect until impact', 'Limited payload capacity'],
    lore: 'Originally designed for conventional warfare, nuclear cruise missiles represent the ultimate in plausible deniability—until detonation.',
    colorScheme: 'tactical',
  },
};

// Stories for secret cards
const SECRET_STORIES: Record<string, Omit<CardStory, 'id' | 'title' | 'icon' | 'category'>> = {
  antimissile: {
    subtitle: 'Anti-Missile Defense System',
    narrativeText: 'The defense network activates, tracking warheads moving at seventeen times the speed of sound. Interceptors launch in sequence, each one a precisely aimed bullet trying to hit another bullet. Success is measured in miracles.',
    flavorQuote: 'Trust, but verify. Then shoot it down.',
    quoteAttribution: 'Reagan-era Defense Briefing',
    consequences: ['Complete interception of incoming attack', 'One-time use only', 'Does not prevent retaliation'],
    lore: 'Anti-missile systems work flawlessly in simulations. Real warfare has a habit of not reading the script.',
    colorScheme: 'covert',
  },
  spynetwork: {
    subtitle: 'Intelligence Network Activation',
    narrativeText: 'Decades of careful cultivation—diplomats turned assets, cleaners with cameras, lovers with listening devices. The spy network is not a tool; it is a living organism, and tonight it bares its teeth.',
    flavorQuote: 'The best spy is the one whose existence is only confirmed by their death.',
    quoteAttribution: 'Unknown',
    consequences: ['Reveals opponent hand', 'Steal one warhead card', 'Risk of exposure'],
    lore: 'Every major power maintains networks of informants in every other major power. The game of nuclear chicken is played with marked cards.',
    colorScheme: 'covert',
  },
  doomsday: {
    subtitle: 'Doomsday Device Protocol',
    narrativeText: 'The dead man\'s switch. The final contingency. If we fall, we take everyone with us. There will be no victors, no survivors, no future—just the endless winter and the silence of empty cities.',
    flavorQuote: 'Deterrence only works if you\'re willing to use it.',
    quoteAttribution: 'STRANGELOVE Protocol Documentation',
    consequences: ['Activates upon elimination', 'Launches all remaining warheads', 'Targets all surviving nations'],
    lore: 'The existence of doomsday devices is neither confirmed nor denied by any government. This lack of denial is the whole point.',
    colorScheme: 'chaotic',
  },
};

export interface CardStoryModalProps {
  /** The card being played */
  card?: WarheadCard | DeliverySystem | SecretCard | SpecialEventCard | null;
  /** Card type for determining story */
  cardType?: 'warhead' | 'delivery' | 'secret' | 'event';
  /** Custom story override */
  customStory?: CardStory;
  /** Whether the modal is visible */
  isVisible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when action is confirmed */
  onConfirm?: () => void;
  /** Position of the modal (from settings) */
  position?: 'left' | 'right';
  /** Auto-dismiss after duration (ms) */
  autoDismissMs?: number;
  /** Whether to show the confirm button */
  showConfirm?: boolean;
  /** Custom confirm text */
  confirmText?: string;
}

export function CardStoryModal({
  card,
  cardType,
  customStory,
  isVisible,
  onClose,
  onConfirm,
  position = 'left',
  autoDismissMs,
  showConfirm = true,
  confirmText = 'Execute',
}: CardStoryModalProps) {
  const [progress, setProgress] = useState(0);

  // Generate story based on card type
  const getStory = useCallback((): CardStory | null => {
    if (customStory) return customStory;
    if (!card || !cardType) return null;

    switch (cardType) {
      case 'warhead': {
        const warheadCard = card as WarheadCard;
        const baseStory = WARHEAD_STORIES[warheadCard.megatons];
        if (!baseStory) return null;
        return {
          id: warheadCard.id,
          title: warheadCard.name,
          icon: warheadCard.icon,
          category: 'warhead',
          ...baseStory,
        };
      }
      case 'delivery': {
        const deliveryCard = card as DeliverySystem;
        const baseStory = DELIVERY_STORIES[deliveryCard.type];
        if (!baseStory) return null;
        return {
          id: deliveryCard.id,
          title: deliveryCard.name,
          icon: deliveryCard.icon,
          category: 'delivery',
          ...baseStory,
        };
      }
      case 'secret': {
        const secretCard = card as SecretCard;
        const baseStory = SECRET_STORIES[secretCard.id];
        if (!baseStory) return null;
        return {
          id: secretCard.id,
          title: secretCard.name,
          icon: '🕵️',
          category: 'secret',
          ...baseStory,
        };
      }
      case 'event': {
        const eventCard = card as SpecialEventCard;
        return {
          id: eventCard.id,
          title: eventCard.name,
          subtitle: eventCard.type,
          icon: eventCard.icon,
          category: 'event',
          narrativeText: eventCard.humorText,
          consequences: [eventCard.effect],
          colorScheme: 'chaotic',
        };
      }
      default:
        return null;
    }
  }, [card, cardType, customStory]);

  const story = getStory();

  // Auto-dismiss timer
  useEffect(() => {
    if (!isVisible || !autoDismissMs) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / autoDismissMs) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isVisible, autoDismissMs, onClose]);

  const colorSchemes = {
    destructive: {
      bg: 'from-red-950/95 via-red-900/90 to-orange-950/95',
      border: 'border-red-500/60',
      accent: 'text-red-400',
      highlight: 'bg-red-500/20',
      icon: Flame,
    },
    tactical: {
      bg: 'from-slate-950/95 via-slate-900/90 to-cyan-950/95',
      border: 'border-cyan-500/60',
      accent: 'text-cyan-400',
      highlight: 'bg-cyan-500/20',
      icon: Shield,
    },
    covert: {
      bg: 'from-purple-950/95 via-slate-900/90 to-violet-950/95',
      border: 'border-purple-500/60',
      accent: 'text-purple-400',
      highlight: 'bg-purple-500/20',
      icon: BookOpen,
    },
    chaotic: {
      bg: 'from-yellow-950/95 via-orange-900/90 to-red-950/95',
      border: 'border-yellow-500/60',
      accent: 'text-yellow-400',
      highlight: 'bg-yellow-500/20',
      icon: Sparkles,
    },
    neutral: {
      bg: 'from-gray-950/95 via-slate-900/90 to-gray-950/95',
      border: 'border-gray-500/60',
      accent: 'text-gray-400',
      highlight: 'bg-gray-500/20',
      icon: BookOpen,
    },
  };

  const scheme = story ? colorSchemes[story.colorScheme] : colorSchemes.neutral;
  const SchemeIcon = scheme.icon;

  // Position styles
  const positionStyles = position === 'left'
    ? 'left-4 right-auto'
    : 'right-4 left-auto';

  const slideAnimation = position === 'left'
    ? { initial: { x: -100, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -100, opacity: 0 } }
    : { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 100, opacity: 0 } };

  if (!story) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          {...slideAnimation}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed top-20 ${positionStyles} z-[9990] w-[420px] max-w-[calc(100vw-2rem)]`}
        >
          {/* Main Card Container */}
          <div
            className={`relative bg-gradient-to-br ${scheme.bg} backdrop-blur-xl rounded-lg border-2 ${scheme.border} shadow-2xl overflow-hidden`}
          >
            {/* Ambient glow effect */}
            <div className={`absolute inset-0 ${scheme.highlight} opacity-30 blur-3xl`} />

            {/* Progress bar for auto-dismiss */}
            {autoDismissMs && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-black/50">
                <motion.div
                  className={`h-full ${scheme.accent.replace('text-', 'bg-')}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="p-4 pb-3 border-b border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{story.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-wide">
                        {story.title}
                      </h2>
                      {story.subtitle && (
                        <p className={`text-sm ${scheme.accent} font-medium uppercase tracking-wider`}>
                          {story.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white/60 hover:text-white hover:bg-white/10 -mr-2 -mt-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Story Content */}
              <ScrollArea className="max-h-[50vh]">
                <div className="p-4 space-y-4">
                  {/* Narrative Text */}
                  <div className="space-y-3">
                    <p className="text-white/90 leading-relaxed text-sm italic">
                      {story.narrativeText}
                    </p>

                    {/* Quote */}
                    {story.flavorQuote && (
                      <blockquote className={`border-l-2 ${scheme.border} pl-3 py-1`}>
                        <p className="text-white/70 text-xs italic">
                          "{story.flavorQuote}"
                        </p>
                        {story.quoteAttribution && (
                          <footer className={`text-xs ${scheme.accent} mt-1`}>
                            — {story.quoteAttribution}
                          </footer>
                        )}
                      </blockquote>
                    )}
                  </div>

                  {/* Consequences */}
                  {story.consequences && story.consequences.length > 0 && (
                    <div className={`rounded p-3 ${scheme.highlight} border ${scheme.border.replace('/60', '/30')}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <SchemeIcon className={`w-4 h-4 ${scheme.accent}`} />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${scheme.accent}`}>
                          Consequences
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {story.consequences.map((consequence, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-white/80">
                            <span className={scheme.accent}>•</span>
                            <span>{consequence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lore */}
                  {story.lore && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-3 h-3 text-white/40" />
                        <span className="text-xs text-white/40 uppercase tracking-wider">Archive</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">
                        {story.lore}
                      </p>
                    </div>
                  )}

                  {/* Time cost indicator */}
                  {story.timeCost && (
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Clock className="w-3 h-3" />
                      <span>Operation time: {story.timeCost}s</span>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer Actions */}
              {showConfirm && (
                <div className="p-4 pt-3 border-t border-white/10 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      onConfirm?.();
                      onClose();
                    }}
                    className={`flex-1 ${scheme.accent.replace('text-', 'bg-').replace('400', '600')} text-white hover:opacity-90 font-semibold`}
                  >
                    {confirmText}
                  </Button>
                </div>
              )}
            </div>

            {/* Decorative elements */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/5 to-transparent rounded-tl-full" />
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-br-full" />
          </div>

          {/* Category badge */}
          <Badge
            className={`absolute -top-2 ${position === 'left' ? 'left-4' : 'right-4'} ${scheme.highlight} ${scheme.accent} border-0 uppercase text-[10px] tracking-widest`}
          >
            {story.category}
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing card story modal state
export function useCardStoryModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentCard, setCurrentCard] = useState<{
    card: WarheadCard | DeliverySystem | SecretCard | SpecialEventCard | null;
    cardType: 'warhead' | 'delivery' | 'secret' | 'event';
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const showStory = useCallback((
    card: WarheadCard | DeliverySystem | SecretCard | SpecialEventCard,
    cardType: 'warhead' | 'delivery' | 'secret' | 'event',
    onConfirm?: () => void
  ) => {
    setCurrentCard({ card, cardType });
    setPendingAction(() => onConfirm || null);
    setIsVisible(true);
  }, []);

  const hideStory = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentCard(null);
      setPendingAction(null);
    }, 300);
  }, []);

  const confirmAction = useCallback(() => {
    pendingAction?.();
    hideStory();
  }, [pendingAction, hideStory]);

  return {
    isVisible,
    currentCard,
    showStory,
    hideStory,
    confirmAction,
  };
}

export default CardStoryModal;
