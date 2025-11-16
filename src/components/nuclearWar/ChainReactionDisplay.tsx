/**
 * Chain Reaction Display Component
 * 
 * Visual display of cascading nuclear retaliations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RetaliationEvent } from '@/lib/nuclearWarRetaliation';
import type { Nation } from '@/types/game';

interface ChainReactionDisplayProps {
  retaliations: RetaliationEvent[];
  nations: Nation[];
}

export function ChainReactionDisplay({ retaliations, nations }: ChainReactionDisplayProps) {
  if (retaliations.length === 0) return null;

  const getNationName = (id: string) => nations.find(n => n.id === id)?.name || 'Unknown';

  return (
    <Card className="bg-destructive/10 border-destructive/30 border-2 animate-pulse">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">⛓️</span>
          <span>CHAIN REACTION!</span>
          <Badge variant="destructive" className="ml-auto">
            {retaliations.length} Retaliations
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {retaliations.map((retaliation, idx) => {
              const attacker = getNationName(retaliation.attackerId);
              const target = getNationName(retaliation.targetId);
              
              return (
                <div 
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded bg-background/50 border border-border"
                >
                  <Badge variant="outline" className="shrink-0">
                    #{idx + 1}
                  </Badge>
                  
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-medium">{attacker}</span>
                    <span className="text-2xl">
                      {retaliation.deliverySystem.icon}
                    </span>
                    <span className="text-lg">→</span>
                    <span className="font-medium">{target}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {retaliation.retaliationCards.map((card, cardIdx) => (
                      <Badge key={cardIdx} variant="destructive">
                        {card.icon} {card.megatons}MT
                      </Badge>
                    ))}
                    
                    {retaliation.hitSuccessful ? (
                      <Badge variant="destructive">
                        💀 {(retaliation.casualties / 1000000).toFixed(1)}M killed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        ❌ Missed
                      </Badge>
                    )}
                    
                    {retaliation.chainReaction && (
                      <Badge variant="default" className="animate-pulse">
                        ⚡ Triggered!
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
