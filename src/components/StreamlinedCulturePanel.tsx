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
  currentImmigrationPolicy = 'selective',
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

        {/* Immigration Policy - Strategic Warfare System */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            Immigration Strategy
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {(Object.entries(IMMIGRATION_POLICIES) as [ImmigrationPolicy, any][]).map(([policy, def]) => {
              const isActive = currentImmigrationPolicy === policy;
              const canAfford = player.intel >= def.intelCostPerTurn;

              return (
                <motion.div
                  key={policy}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => canAfford && onSetImmigrationPolicy?.(policy)}
                  className={`p-2.5 rounded cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-500/20 border-2 border-blue-500'
                      : canAfford
                      ? 'bg-gray-900/50 border border-gray-700 hover:border-gray-600'
                      : 'bg-gray-900/30 border border-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-xs font-semibold">
                      {def.icon} {def.name}
                    </span>
                    {isActive && (
                      <Badge className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5">Active</Badge>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-400 mb-1.5 leading-tight">{def.description}</p>

                  <div className="text-[10px] space-y-0.5">
                    {/* Population Growth */}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pop Growth:</span>
                      <span className={def.populationGrowthModifier > 0 ? 'text-green-400' : 'text-gray-400'}>
                        {def.populationGrowthModifier}x
                      </span>
                    </div>

                    {/* Economic Bonus */}
                    {def.economicGrowthBonus !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Production:</span>
                        <span className={def.economicGrowthBonus > 0 ? 'text-green-400' : 'text-red-400'}>
                          {def.economicGrowthBonus > 0 ? '+' : ''}{def.economicGrowthBonus}/turn
                        </span>
                      </div>
                    )}

                    {/* Stability Impact */}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stability:</span>
                      <span className={def.instabilityModifier < 0 ? 'text-green-400' : def.instabilityModifier > 0 ? 'text-red-400' : 'text-gray-400'}>
                        {def.instabilityModifier > 0 ? '-' : def.instabilityModifier < 0 ? '+' : ''}{Math.abs(def.instabilityModifier)}
                      </span>
                    </div>

                    {/* Diplomatic Impact */}
                    {def.diplomaticImpact !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Reputation:</span>
                        <span className={def.diplomaticImpact > 0 ? 'text-green-400' : 'text-red-400'}>
                          {def.diplomaticImpact > 0 ? '+' : ''}{def.diplomaticImpact}
                        </span>
                      </div>
                    )}

                    {/* Costs */}
                    <div className="flex justify-between pt-0.5 border-t border-gray-800">
                      <span className="text-gray-500">Intel Cost:</span>
                      <span className={canAfford ? 'text-cyan-400' : 'text-red-400'}>
                        {def.intelCostPerTurn}/turn
                      </span>
                    </div>

                    {def.productionCostPerTurn && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Prod Cost:</span>
                        <span className="text-yellow-400">{def.productionCostPerTurn}/turn</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700">
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

      {/* Immigration Warfare Guide */}
      <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
        <div className="flex items-start gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-300 mb-1">⚔️ Immigration Warfare Guide</h3>
            <p className="text-xs text-gray-400">Immigration is a strategic weapon. Use it to strengthen your economy, weaken enemies, or gain diplomatic influence.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Defensive Policies */}
          <div className="bg-gray-900/50 p-2 rounded">
            <h4 className="font-semibold text-green-400 mb-1.5">🛡️ Defensive Policies</h4>
            <ul className="space-y-1 text-gray-400">
              <li><strong className="text-white">Closed Borders:</strong> No immigration. Maximize stability at cost of growth.</li>
              <li><strong className="text-white">Selective:</strong> High-skill only. Expensive but strong economic boost (+8 prod/turn).</li>
            </ul>
          </div>

          {/* Balanced Policies */}
          <div className="bg-gray-900/50 p-2 rounded">
            <h4 className="font-semibold text-blue-400 mb-1.5">⚖️ Balanced Policies</h4>
            <ul className="space-y-1 text-gray-400">
              <li><strong className="text-white">Humanitarian:</strong> Accept refugees. Major reputation boost (+10) but reduces stability.</li>
              <li><strong className="text-white">Cultural Exchange:</strong> Balanced immigration with +8 reputation. Good for diplomacy.</li>
            </ul>
          </div>

          {/* Aggressive Policies */}
          <div className="bg-gray-900/50 p-2 rounded">
            <h4 className="font-semibold text-red-400 mb-1.5">⚔️ Aggressive Warfare</h4>
            <ul className="space-y-1 text-gray-400">
              <li><strong className="text-white">Brain Drain Ops:</strong> Steal elite talent from unstable enemies. Damages their economy and reputation (-10).</li>
              <li><strong className="text-white">Open Borders:</strong> Rapid growth (2x) but high instability. Use when you need population fast.</li>
            </ul>
          </div>

          {/* Strategic Tips */}
          <div className="bg-gray-900/50 p-2 rounded">
            <h4 className="font-semibold text-yellow-400 mb-1.5">💡 Strategic Tips</h4>
            <ul className="space-y-1 text-gray-400 list-disc list-inside">
              <li>Brain Drain targets weakest nations automatically</li>
              <li>High morale increases immigration effectiveness</li>
              <li>Policies cost intel/production per turn</li>
              <li>Switch policies based on game phase</li>
            </ul>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-400">Population System:</strong> Immigrants are tracked as separate groups with loyalty, skills, and assimilation rates.
            High-skill immigrants provide economic bonuses. Low-loyalty populations cause instability.
            Brain Drain directly steals 0.2% of enemy population per turn.
          </p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
