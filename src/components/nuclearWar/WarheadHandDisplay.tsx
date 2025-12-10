/**
 * Warhead Hand Display Component
 *
 * Shows a nation's current hand of warhead cards in the Nuclear War campaign.
 * When clicked, cards can trigger story modals with narrative flavor text.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { NuclearWarHandState, WarheadCard, DeliverySystem, SecretCard } from '@/types/nuclearWarCampaign';

interface WarheadHandDisplayProps {
  hand: NuclearWarHandState;
  nationName: string;
  isPlayer: boolean;
  compact?: boolean;
  /** Callback when a warhead card is clicked */
  onWarheadClick?: (card: WarheadCard) => void;
  /** Callback when a delivery system is clicked */
  onDeliveryClick?: (system: DeliverySystem) => void;
  /** Callback when a secret card is clicked */
  onSecretClick?: (secret: SecretCard) => void;
  /** Whether cards are selectable/clickable */
  interactive?: boolean;
}

export function WarheadHandDisplay({
  hand,
  nationName,
  isPlayer,
  compact = false,
  onWarheadClick,
  onDeliveryClick,
  onSecretClick,
  interactive = false,
}: WarheadHandDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{nationName}:</span>
        <Badge variant="destructive" className="gap-1">
          💣 {hand.warheadCards.length}
        </Badge>
        <Badge variant="secondary" className="gap-1">
          👥 {hand.populationCards}M
        </Badge>
        {hand.secrets.length > 0 && (
          <Badge variant="outline" className="gap-1">
            🕵️ {hand.secrets.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-card/50 border-destructive/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{nationName}'s Arsenal</span>
          <div className="flex gap-2">
            <Badge variant="secondary">👥 {hand.populationCards}M people</Badge>
            {isPlayer && hand.secrets.length > 0 && (
              <Badge variant="outline">🕵️ {hand.secrets.length} secrets</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Warhead Cards */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            Warhead Cards ({hand.warheadCards.length})
          </h4>
          {isPlayer ? (
            <div className="flex flex-wrap gap-2">
              {hand.warheadCards.map((card, idx) => (
                <TooltipProvider key={`${card.id}-${idx}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => interactive && onWarheadClick?.(card)}
                        disabled={!interactive}
                        className="focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded disabled:cursor-default"
                      >
                        <Badge
                          variant="destructive"
                          className={`text-base py-1 px-3 transition-all ${
                            interactive
                              ? 'cursor-pointer hover:scale-110 hover:shadow-lg hover:shadow-red-500/30 active:scale-95'
                              : 'cursor-help'
                          }`}
                        >
                          {card.icon} {card.megatons}MT
                        </Badge>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <div className="font-bold">{card.name}</div>
                        <div className="text-xs text-muted-foreground">{card.description}</div>
                        {interactive && (
                          <div className="text-xs text-cyan-400 mt-1">Click to view story</div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              {Array.from({ length: hand.warheadCards.length }).map((_, idx) => (
                <Badge key={idx} variant="secondary" className="text-base">
                  🎴
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Delivery Systems */}
        {isPlayer && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              Delivery Systems
            </h4>
            <div className="flex flex-wrap gap-2">
              {hand.deliverySystems.map(system => (
                <TooltipProvider key={system.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => interactive && onDeliveryClick?.(system)}
                        disabled={!interactive}
                        className="focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded disabled:cursor-default"
                      >
                        <Badge
                          variant="outline"
                          className={`gap-1 transition-all ${
                            interactive
                              ? 'cursor-pointer hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/30 hover:border-cyan-400 active:scale-95'
                              : 'cursor-help'
                          }`}
                        >
                          {system.icon} {system.type}
                        </Badge>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <div className="font-bold">{system.name}</div>
                        <div className="text-xs">Reliability: {(system.reliability * 100).toFixed(0)}%</div>
                        <div className="text-xs">Speed: {system.speed}</div>
                        <div className="text-xs">
                          {system.interceptable ? '⚠️ Interceptable' : '✓ Uninterceptable'}
                        </div>
                        {interactive && (
                          <div className="text-xs text-cyan-400 mt-1">Click to view story</div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        {/* Secrets (only visible to player) */}
        {isPlayer && hand.secrets.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              Secret Cards
            </h4>
            <div className="flex flex-wrap gap-2">
              {hand.secrets.map(secret => (
                <TooltipProvider key={secret.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => interactive && !secret.used && onSecretClick?.(secret)}
                        disabled={!interactive || secret.used}
                        className="focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded disabled:cursor-default"
                      >
                        <Badge
                          variant={secret.used ? 'secondary' : 'default'}
                          className={`gap-1 transition-all ${
                            interactive && !secret.used
                              ? 'cursor-pointer hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95'
                              : secret.used
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-help'
                          }`}
                        >
                          🕵️ {secret.name}
                          {secret.used && ' (Used)'}
                        </Badge>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <div className="font-bold">{secret.name}</div>
                        <div className="text-xs">{secret.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {secret.usageLimit === 'once' ? 'One-time use' : 'Permanent'}
                        </div>
                        {interactive && !secret.used && (
                          <div className="text-xs text-purple-400 mt-1">Click to view story</div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
