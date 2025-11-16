/**
 * Nuclear War Phase Display Component
 * 
 * Shows the current game phase and relevant information
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { NuclearWarPhase } from '@/types/nuclearWarCampaign';

interface NuclearWarPhaseDisplayProps {
  currentPhase: NuclearWarPhase;
  round: number;
  doomsdayClock: number;
}

const PHASE_INFO: Record<NuclearWarPhase, { icon: string; title: string; description: string; color: string }> = {
  STOCKPILE: {
    icon: '🎴',
    title: 'Stockpile Phase',
    description: 'All nations draw warhead cards',
    color: 'bg-blue-500/20 border-blue-500/30',
  },
  TARGETING: {
    icon: '🎯',
    title: 'Targeting Phase',
    description: 'Choose targets and delivery systems',
    color: 'bg-yellow-500/20 border-yellow-500/30',
  },
  LAUNCH: {
    icon: '🚀',
    title: 'Launch Phase',
    description: 'Simultaneous nuclear strikes',
    color: 'bg-orange-500/20 border-orange-500/30',
  },
  RETALIATION: {
    icon: '⚡',
    title: 'Retaliation Phase',
    description: 'Automatic counterattacks',
    color: 'bg-red-500/20 border-red-500/30',
  },
  FALLOUT: {
    icon: '☢️',
    title: 'Fallout Phase',
    description: 'Calculating casualties and damage',
    color: 'bg-purple-500/20 border-purple-500/30',
  },
  AFTERMATH: {
    icon: '💀',
    title: 'Aftermath Phase',
    description: 'Checking victory conditions',
    color: 'bg-gray-500/20 border-gray-500/30',
  },
};

export function NuclearWarPhaseDisplay({ 
  currentPhase, 
  round, 
  doomsdayClock 
}: NuclearWarPhaseDisplayProps) {
  const phaseInfo = PHASE_INFO[currentPhase];
  
  return (
    <Card className={`${phaseInfo.color} border-2`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{phaseInfo.icon}</span>
              <div>
                <h3 className="text-lg font-bold">{phaseInfo.title}</h3>
                <p className="text-sm text-muted-foreground">{phaseInfo.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Round</div>
              <Badge variant="outline" className="text-lg font-bold">
                {round}
              </Badge>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Doomsday Clock</div>
              <Badge 
                variant={doomsdayClock >= 90 ? 'destructive' : doomsdayClock >= 70 ? 'default' : 'secondary'}
                className="text-lg font-bold"
              >
                {doomsdayClock}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
