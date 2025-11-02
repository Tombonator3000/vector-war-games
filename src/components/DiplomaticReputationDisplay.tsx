/**
 * Diplomatic Reputation Display
 * Shows player's global reputation and its effects
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Award, AlertTriangle, Shield } from 'lucide-react';
import type { DiplomaticReputation } from '@/types/diplomaticReputation';
import {
  getReputationColor,
  getReputationDescription,
} from '@/types/diplomaticReputation';
import { getReputationBreakdown } from '@/lib/diplomaticReputationHelpers';

interface DiplomaticReputationDisplayProps {
  reputation: DiplomaticReputation;
}

const REPUTATION_ICONS: Record<string, React.ReactNode> = {
  trusted: <Award className="w-5 h-5" />,
  reliable: <TrendingUp className="w-5 h-5" />,
  neutral: <Shield className="w-5 h-5" />,
  untrustworthy: <TrendingDown className="w-5 h-5" />,
  pariah: <AlertTriangle className="w-5 h-5" />,
};

export const DiplomaticReputationDisplay: React.FC<DiplomaticReputationDisplayProps> = ({
  reputation,
}) => {
  const breakdown = getReputationBreakdown(reputation);
  const reputationColor = getReputationColor(reputation.level);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-slate-100">International Reputation</CardTitle>
            <CardDescription className="text-slate-400">
              Your standing on the world stage
            </CardDescription>
          </div>
          <div className={reputationColor}>{REPUTATION_ICONS[reputation.level]}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Reputation Score</span>
            <span className={`text-2xl font-bold ${reputationColor}`}>{reputation.score}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${
                reputation.score >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min(100, Math.abs(reputation.score))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Badge className={`${reputationColor} border-current`}>
              {reputation.level.toUpperCase()}
            </Badge>
            <span className="text-xs text-slate-500">
              Modifier: {reputation.globalRelationshipModifier >= 0 ? '+' : ''}
              {reputation.globalRelationshipModifier} to all relationships
            </span>
          </div>

          <p className="text-sm text-slate-400 mt-3">{getReputationDescription(reputation.level)}</p>
        </div>

        {/* Reputation Breakdown */}
        <div>
          <h4 className="text-sm font-bold text-slate-300 mb-2">Reputation Sources</h4>
          <div className="space-y-2">
            {breakdown.map((item) => (
              <div
                key={item.source}
                className="flex items-center justify-between p-2 bg-slate-900/50 rounded"
              >
                <div className="flex-1">
                  <p className="text-sm text-slate-200">{item.source}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    item.value > 0
                      ? 'text-green-400'
                      : item.value < 0
                        ? 'text-red-400'
                        : 'text-slate-500'
                  }`}
                >
                  {item.value > 0 ? '+' : ''}
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Actions */}
        {reputation.recentActions.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-300 mb-2">Recent Actions</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {reputation.recentActions.slice(0, 5).map((action, index) => (
                <div
                  key={`${action.turn}-${index}`}
                  className="flex items-center justify-between p-2 bg-slate-900/30 rounded text-xs"
                >
                  <span className="text-slate-400">
                    Turn {action.turn}: {action.description}
                  </span>
                  <span
                    className={`font-bold ${
                      action.reputationChange > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {action.reputationChange > 0 ? '+' : ''}
                    {action.reputationChange}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Notice */}
        <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
          <p className="text-xs text-slate-400">
            Your reputation affects how other nations perceive you. A higher reputation makes
            diplomatic agreements easier, while a poor reputation increases suspicion and
            hostility.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
