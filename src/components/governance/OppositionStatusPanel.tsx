import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, TrendingDown, AlertCircle, Flag } from 'lucide-react';
import type { OppositionState } from '@/types/opposition';
import { getOppositionPlatformDescription } from '@/types/opposition';

interface OppositionStatusPanelProps {
  oppositionState?: OppositionState;
  electionTimer: number;
  nationName: string;
}

export function OppositionStatusPanel({
  oppositionState,
  electionTimer,
  nationName,
}: OppositionStatusPanelProps) {
  if (!oppositionState) {
    return (
      <Card className="bg-slate-900/50 border-cyan-500/20 p-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Opposition Status</h3>
        </div>
        <p className="text-sm text-slate-400 mt-2">No organized opposition detected</p>
      </Card>
    );
  }

  const { strength, platform, recentActions, mobilizing } = oppositionState;

  // Determine strength level
  const getStrengthColor = (str: number) => {
    if (str < 30) return 'text-green-400';
    if (str < 50) return 'text-yellow-400';
    if (str < 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStrengthLabel = (str: number) => {
    if (str < 30) return 'Weak';
    if (str < 50) return 'Moderate';
    if (str < 70) return 'Strong';
    return 'Very Strong';
  };

  const platformColors: Record<string, string> = {
    dovish: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    hawkish: 'bg-red-500/20 text-red-400 border-red-500/40',
    isolationist: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    internationalist: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    populist: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    technocratic: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
  };

  return (
    <Card className="bg-slate-900/50 border-cyan-500/20 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Opposition Status</h3>
        </div>
        {mobilizing && (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/40">
            <Flag className="h-3 w-3 mr-1" />
            Mobilizing
          </Badge>
        )}
      </div>

      {/* Opposition Strength */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-300">Opposition Strength</span>
          <span className={`text-sm font-semibold ${getStrengthColor(strength)}`}>
            {getStrengthLabel(strength)} ({strength.toFixed(0)})
          </span>
        </div>
        <Progress value={strength} className="h-2" />
      </div>

      {/* Platform */}
      <div className="space-y-1">
        <div className="text-sm text-slate-300">Platform</div>
        <Badge className={platformColors[platform] || 'bg-slate-500/20 text-slate-400'}>
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </Badge>
        <p className="text-xs text-slate-400 mt-1">
          {getOppositionPlatformDescription(platform)}
        </p>
      </div>

      {/* Election Threat */}
      {electionTimer <= 5 && (
        <div className={`p-2 rounded-md border ${
          strength > 60
            ? 'bg-red-500/10 border-red-500/30'
            : strength > 45
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-green-500/10 border-green-500/30'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-4 w-4 ${
              strength > 60
                ? 'text-red-400'
                : strength > 45
                ? 'text-yellow-400'
                : 'text-green-400'
            }`} />
            <span className="text-sm font-medium text-slate-200">
              {strength > 60
                ? 'High election loss risk!'
                : strength > 45
                ? 'Competitive election ahead'
                : 'Election outlook favorable'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Election in {electionTimer} turn{electionTimer !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Recent Opposition Actions */}
      {recentActions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-slate-300 font-medium">Recent Actions</div>
          <div className="space-y-1">
            {recentActions.slice(0, 3).map((action, index) => (
              <div
                key={action.id}
                className="text-xs p-2 rounded bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-2">
                  {action.type === 'no_confidence' && <TrendingDown className="h-3 w-3 text-red-400" />}
                  {action.type === 'protest' && <Users className="h-3 w-3 text-orange-400" />}
                  {action.type === 'leak' && <AlertCircle className="h-3 w-3 text-yellow-400" />}
                  {action.type === 'scandal' && <TrendingDown className="h-3 w-3 text-red-400" />}
                  {action.type === 'promise_reform' && <TrendingUp className="h-3 w-3 text-cyan-400" />}
                  <span className="text-slate-300">{action.description}</span>
                </div>
                <div className="text-slate-500 mt-1">Turn {action.turn}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
