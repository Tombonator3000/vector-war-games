/**
 * Diplomatic Espionage Panel
 * Allows players to conduct espionage operations against other nations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Shield, AlertTriangle, Target, Coins } from 'lucide-react';
import type { Nation } from '@/types/game';
import type { EspionageTargetType } from '@/types/diplomaticEspionage';
import { ESPIONAGE_COSTS, ESPIONAGE_DETECTION_RISKS } from '@/types/diplomaticEspionage';
import { getEspionageSuccessRate, canAffordEspionage } from '@/lib/diplomaticEspionageHelpers';

interface DiplomaticEspionagePanelProps {
  player: Nation;
  target: Nation;
  onExecuteEspionage: (targetType: EspionageTargetType) => void;
}

const ESPIONAGE_OPTIONS: {
  type: EspionageTargetType;
  name: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'hidden-agendas',
    name: 'Reveal Hidden Agendas',
    description: 'Uncover their secret diplomatic traits and motivations',
    icon: <Eye className="w-5 h-5" />,
  },
  {
    type: 'ongoing-negotiations',
    name: 'Spy on Negotiations',
    description: 'See what deals they are making with other nations',
    icon: <Search className="w-5 h-5" />,
  },
  {
    type: 'military-plans',
    name: 'Uncover Military Plans',
    description: 'Learn their intended military targets and timing',
    icon: <Target className="w-5 h-5" />,
  },
  {
    type: 'resource-stockpiles',
    name: 'Assess Resources',
    description: 'Get exact counts of their production, intel, and weapons',
    icon: <Coins className="w-5 h-5" />,
  },
  {
    type: 'research-progress',
    name: 'Steal Research Intel',
    description: 'Discover their current research projects and progress',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    type: 'alliance-intentions',
    name: 'Learn Alliance Plans',
    description: 'Find out who they want to ally with',
    icon: <Search className="w-5 h-5" />,
  },
];

export const DiplomaticEspionagePanel: React.FC<DiplomaticEspionagePanelProps> = ({
  player,
  target,
  onExecuteEspionage,
}) => {
  const [selectedOperation, setSelectedOperation] = useState<EspionageTargetType | null>(null);

  const selectedOption = ESPIONAGE_OPTIONS.find((opt) => opt.type === selectedOperation);
  const canAfford = selectedOperation ? canAffordEspionage(player, selectedOperation) : false;
  const successRate = selectedOperation
    ? getEspionageSuccessRate(player, target, selectedOperation)
    : 0;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Intelligence Operations
        </CardTitle>
        <CardDescription className="text-slate-400">
          Conduct espionage against {target.name}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Available Operations */}
        <div className="space-y-2">
          {ESPIONAGE_OPTIONS.map((option) => {
            const cost = ESPIONAGE_COSTS[option.type];
            const canAffordThis = player.intel >= cost;
            const isSelected = selectedOperation === option.type;

            return (
              <button
                key={option.type}
                onClick={() => setSelectedOperation(option.type)}
                disabled={!canAffordThis}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-cyan-500 bg-slate-700'
                    : canAffordThis
                      ? 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                      : 'border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-cyan-400 mt-1">{option.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-200">{option.name}</span>
                        <Badge className="text-xs bg-slate-700 text-slate-300 border-slate-600">
                          {cost} Intel
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{option.description}</p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Operation Details */}
        {selectedOption && (
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-200">Operation Details</h4>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Intel Cost:</span>
                  <span className="font-bold text-slate-200">
                    {ESPIONAGE_COSTS[selectedOperation]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Success Rate:</span>
                  <span
                    className={`font-bold ${
                      successRate >= 70
                        ? 'text-green-400'
                        : successRate >= 50
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {successRate}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Detection Risk:</span>
                  <span
                    className={`font-bold ${
                      100 - successRate < 30
                        ? 'text-green-400'
                        : 100 - successRate < 50
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {100 - successRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">If Caught:</span>
                  <span className="font-bold text-red-400">-20 Relationship</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-900/20 rounded border border-amber-700">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-300">
                If detected, {target.name} will know you spied on them and relations will suffer
                significantly.
              </p>
            </div>

            <Button
              onClick={() => onExecuteEspionage(selectedOperation)}
              disabled={!canAfford}
              className={`w-full ${
                canAfford
                  ? 'bg-cyan-600 hover:bg-cyan-700'
                  : 'bg-slate-700 cursor-not-allowed opacity-50'
              }`}
            >
              {canAfford ? 'Execute Operation' : 'Insufficient Intel'}
            </Button>
          </div>
        )}

        {/* Player Intel Display */}
        <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Your Available Intel:</span>
            <span className="text-lg font-bold text-cyan-400">{player.intel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
