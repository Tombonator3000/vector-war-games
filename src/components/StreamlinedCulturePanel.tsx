/**
 * STREAMLINED CULTURE PANEL
 *
 * Simplified culture system replacing complex PopGroups management
 * - 3 propaganda types (down from 4)
 * - 3 cultural wonders (down from 5)
 * - 3 immigration policies (down from 5)
 * - Simple cultural power calculation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Building, Users, TrendingUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Nation } from '@/types/game';
import type { PropagandaType, CulturalWonderType, ImmigrationPolicy } from '@/types/streamlinedCulture';
import {
  PROPAGANDA_DEFINITIONS,
  CULTURAL_WONDERS,
  IMMIGRATION_POLICIES,
  calculateCulturalPower,
  getCulturalWonderBonuses,
} from '@/types/streamlinedCulture';

interface StreamlinedCulturePanelProps {
  player: Nation;
  enemies: Nation[];
  onLaunchPropaganda?: (type: PropagandaType, targetId: string) => void;
  onBuildWonder?: (wonderType: CulturalWonderType) => void;
  onSetImmigrationPolicy?: (policy: ImmigrationPolicy) => void;
  currentImmigrationPolicy?: ImmigrationPolicy;
  onClose?: () => void;
}

export function StreamlinedCulturePanel({
  player,
  enemies,
  onLaunchPropaganda,
  onBuildWonder,
  onSetImmigrationPolicy,
  currentImmigrationPolicy = 'restricted',
  onClose,
}: StreamlinedCulturePanelProps) {
  const [selectedPropagandaTarget, setSelectedPropagandaTarget] = useState<string | null>(null);

  const culturalPower = calculateCulturalPower(player);
  const wonderBonuses = getCulturalWonderBonuses(player);
  const builtWonders = player.culturalWonders || [];

  return (
    <div className="space-y-4">
      {/* Cultural Power Display */}
      <div className="bg-gray-800/50 p-3 rounded-lg border border-cyan-500/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="text-sm text-gray-400">Cultural Power:</span>
          <span className="text-cyan-300 font-semibold text-lg">{Math.round(culturalPower)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Cultural Wonders */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-yellow-300 flex items-center gap-2 mb-3">
            <Building className="w-4 h-4" />
            Cultural Wonders ({builtWonders.length}/3)
          </h3>

          <div className="space-y-2">
            {Object.entries(CULTURAL_WONDERS).map(([key, wonder]) => {
              const isBuilt = builtWonders.some((w: any) => w.type === key);
              const canAfford =
                player.production >= wonder.buildCost.production &&
                player.intel >= wonder.buildCost.intel;

              return (
                <div
                  key={key}
                  className={`p-2 rounded border ${
                    isBuilt ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-900/50 border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold">
                      {wonder.icon} {wonder.name}
                    </span>
                    {isBuilt && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">Built</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{wonder.description}</p>
                  {!isBuilt && (
                    <>
                      <div className="text-xs text-gray-500 mb-2">
                        Cost: {wonder.buildCost.production} Prod, {wonder.buildCost.intel} Intel
                      </div>
                      <Button
                        onClick={() => onBuildWonder?.(key as CulturalWonderType)}
                        disabled={!canAfford}
                        size="sm"
                        className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-xs disabled:opacity-50"
                      >
                        Build Wonder
                      </Button>
                    </>
                  )}
                  {isBuilt && (
                    <div className="text-xs text-green-400 space-y-0.5">
                      <div>+{wonder.productionBonus} Production</div>
                      <div>+{wonder.intelBonus} Intel</div>
                      <div>+{wonder.culturalPowerBonus} Cultural Power</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              Total bonuses: +{wonderBonuses.production} Prod, +{wonderBonuses.intel} Intel
            </p>
          </div>
        </div>

        {/* Propaganda Campaigns */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-purple-300 flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" />
            Propaganda
          </h3>

          <div className="space-y-2 mb-3">
            {(Object.entries(PROPAGANDA_DEFINITIONS) as [PropagandaType, any][]).map(([type, def]) => {
              const canAfford = player.intel >= def.intelCost;

              return (
                <div key={type} className="p-2 rounded bg-gray-900/50 border border-gray-700">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold">
                      {def.icon} {def.name}
                    </span>
                    <span className="text-xs text-gray-400">{def.intelCost} Intel</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{def.description}</p>
                  <div className="text-xs text-gray-500 mb-2">
                    Duration: {def.duration} turns
                  </div>
                  <select
                    value={selectedPropagandaTarget || ''}
                    onChange={(e) => {
                      setSelectedPropagandaTarget(e.target.value);
                      if (e.target.value && canAfford) {
                        onLaunchPropaganda?.(type, e.target.value);
                        setSelectedPropagandaTarget(null);
                      }
                    }}
                    disabled={!canAfford}
                    className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded disabled:opacity-50"
                  >
                    <option value="">Select target...</option>
                    {enemies.filter(e => !e.eliminated).map(enemy => (
                      <option key={enemy.id} value={enemy.id}>
                        {enemy.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-900/50 p-2 rounded text-xs text-gray-400">
            <p className="font-semibold mb-1">Effects:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Subversion: +8 instability, -10 relationship</li>
              <li>Attraction: +15 relationship</li>
              <li>Demoralization: -10 morale, -5 relationship</li>
            </ul>
          </div>
        </div>

        {/* Immigration Policy */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            Immigration Policy
          </h3>

          <div className="space-y-2">
            {(Object.entries(IMMIGRATION_POLICIES) as [ImmigrationPolicy, any][]).map(([policy, def]) => {
              const isActive = currentImmigrationPolicy === policy;

              return (
                <motion.div
                  key={policy}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onSetImmigrationPolicy?.(policy)}
                  className={`p-3 rounded cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-500/20 border-2 border-blue-500'
                      : 'bg-gray-900/50 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold">
                      {def.icon} {def.name}
                    </span>
                    {isActive && (
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">Active</Badge>
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className={def.populationGrowthModifier > 0 ? 'text-green-400' : 'text-gray-400'}>
                      Population growth: {def.populationGrowthModifier}x
                    </div>
                    <div className={def.instabilityModifier < 0 ? 'text-green-400' : def.instabilityModifier > 0 ? 'text-red-400' : 'text-gray-400'}>
                      Instability: {def.instabilityModifier > 0 ? '+' : ''}{def.instabilityModifier}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Current Status:</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Population:</span>
                <span className="text-gray-300">{Math.round(player.population / 1000000)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Morale:</span>
                <span className="text-gray-300">{player.morale}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Instability:</span>
                <span className={`${(player.instability || 0) > 50 ? 'text-red-400' : 'text-gray-300'}`}>
                  {player.instability || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 mt-0.5" />
          <div className="text-xs text-gray-400 space-y-1">
            <p>
              <strong className="text-gray-300">Cultural Power:</strong> Calculated from Intel ÷ 10 + Wonder bonuses
            </p>
            <p>
              <strong className="text-gray-300">Wonders:</strong> One-time buildings that provide permanent bonuses
            </p>
            <p>
              <strong className="text-gray-300">Propaganda:</strong> Temporary campaigns affecting enemy nations (30% discovery chance)
            </p>
            <p>
              <strong className="text-gray-300">Immigration:</strong> Higher immigration = faster population growth but more instability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
