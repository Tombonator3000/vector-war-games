/**
 * Warhead Hand Display Component
 * 
 * Shows a nation's current hand of warhead cards in the Nuclear War campaign
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { NuclearWarHandState } from '@/types/nuclearWarCampaign';

interface WarheadHandDisplayProps {
  hand: NuclearWarHandState;
  nationName: string;
  isPlayer: boolean;
  compact?: boolean;
}

export function WarheadHandDisplay({ 
  hand, 
  nationName, 
  isPlayer,
  compact = false 
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
                    <TooltipTrigger>
                      <Badge 
                        variant="destructive" 
                        className="text-base py-1 px-3 cursor-help"
                      >
                        {card.icon} {card.megatons}MT
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <div className="font-bold">{card.name}</div>
                        <div className="text-xs text-muted-foreground">{card.description}</div>
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
                    <TooltipTrigger>
                      <Badge variant="outline" className="gap-1 cursor-help">
                        {system.icon} {system.type}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <div className="font-bold">{system.name}</div>
                        <div className="text-xs">Reliability: {(system.reliability * 100).toFixed(0)}%</div>
                        <div className="text-xs">Speed: {system.speed}</div>
                        <div className="text-xs">
                          {system.interceptable ? '⚠️ Interceptable' : '✓ Uninterceptable'}
                        </div>
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
                    <TooltipTrigger>
                      <Badge 
                        variant={secret.used ? "secondary" : "default"}
                        className="gap-1 cursor-help"
                      >
                        🕵️ {secret.name}
                        {secret.used && " (Used)"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <div className="font-bold">{secret.name}</div>
                        <div className="text-xs">{secret.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {secret.usageLimit === 'once' ? 'One-time use' : 'Permanent'}
                        </div>
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
