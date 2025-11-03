/**
 * SIMPLIFIED BIO-WARFARE PANEL
 *
 * Replaces complex evolution tree system with simple deploy/defend interface
 * - Research bio-weapons (one-time)
 * - Deploy bio-weapon against target (costs intel + uranium)
 * - Upgrade bio-defense (4 levels: 0-3)
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Skull,
  Shield,
  Target,
  Droplet,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Nation } from '@/types/game';
import type { BioAttackDeployment } from '@/types/simplifiedBiowarfare';
import {
  BIO_WEAPON_RESEARCH_REQUIREMENTS,
  BIO_DEFENSE_LEVELS,
  BIO_WEAPON_DEPLOYMENT_COST,
  canAffordBioDefenseUpgrade,
  getBioDefense,
} from '@/types/simplifiedBiowarfare';

interface SimplifiedBioWarfarePanelProps {
  player: Nation;
  enemies: Nation[];
  activeBioAttacks?: BioAttackDeployment[];
  onResearchBioWeapon?: () => void;
  onUpgradeBioDefense?: () => void;
  onDeployBioWeapon?: (targetId: string) => void;
  onClose?: () => void;
}

export function SimplifiedBioWarfarePanel({
  player,
  enemies,
  activeBioAttacks = [],
  onResearchBioWeapon,
  onUpgradeBioDefense,
  onDeployBioWeapon,
  onClose,
}: SimplifiedBioWarfarePanelProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const bioWeaponResearched = player.bioWeaponResearched || false;
  const bioDefenseLevel = player.bioDefenseLevel || 0;
  const currentDefense = getBioDefense(bioDefenseLevel);
  const nextDefense = bioDefenseLevel < 3 ? getBioDefense(bioDefenseLevel + 1) : null;

  const canAffordWeaponResearch =
    player.production >= BIO_WEAPON_RESEARCH_REQUIREMENTS.productionCost &&
    player.intel >= BIO_WEAPON_RESEARCH_REQUIREMENTS.intelCost;

  const canAffordDeployment =
    bioWeaponResearched &&
    player.intel >= BIO_WEAPON_DEPLOYMENT_COST.intel &&
    (player.uranium || 0) >= BIO_WEAPON_DEPLOYMENT_COST.uranium;

  const canAffordDefenseUpgrade =
    bioDefenseLevel < 3 &&
    canAffordBioDefenseUpgrade(bioDefenseLevel, player.production, player.intel);

  const livingEnemies = enemies.filter(e => !e.eliminated);

  return (
    <Card className="bg-gray-900/95 border-purple-500/30 p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Droplet className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-purple-400">Bio-Warfare Operations</h2>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Research & Defense */}
        <div className="space-y-4">
          {/* Bio-Weapon Research */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-purple-300 flex items-center gap-2">
                <Skull className="w-4 h-4" />
                Bio-Weapon Development
              </h3>
              {bioWeaponResearched && (
                <Badge className="bg-green-500/20 text-green-400 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>

            {!bioWeaponResearched ? (
              <>
                <p className="text-sm text-gray-400 mb-3">
                  Research biological weapons to deploy against enemy populations.
                </p>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Cost:</span>
                    <span className="text-gray-300">
                      {BIO_WEAPON_RESEARCH_REQUIREMENTS.productionCost} Production,{' '}
                      {BIO_WEAPON_RESEARCH_REQUIREMENTS.intelCost} Intel
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Time:</span>
                    <span className="text-gray-300">
                      {BIO_WEAPON_RESEARCH_REQUIREMENTS.turnsToComplete} turns
                    </span>
                  </div>
                </div>
                <Button
                  onClick={onResearchBioWeapon}
                  disabled={!canAffordWeaponResearch}
                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 disabled:opacity-50"
                >
                  Research Bio-Weapons
                </Button>
                {!canAffordWeaponResearch && (
                  <p className="text-xs text-red-400 mt-2">Insufficient resources</p>
                )}
              </>
            ) : (
              <div className="bg-green-500/10 p-3 rounded border border-green-500/30">
                <p className="text-sm text-green-400">
                  Bio-weapons ready for deployment. Costs {BIO_WEAPON_DEPLOYMENT_COST.intel} Intel
                  and {BIO_WEAPON_DEPLOYMENT_COST.uranium} Uranium per attack.
                </p>
              </div>
            )}
          </div>

          {/* Bio-Defense */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-semibold text-blue-300 flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" />
              Bio-Defense System
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Current Level:</span>
                <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                  Level {bioDefenseLevel} - {currentDefense.name}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Damage Reduction:</span>
                  <span className="text-blue-400 font-semibold">
                    {Math.round(currentDefense.damageReduction * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Detection Chance:</span>
                  <span className="text-blue-400 font-semibold">
                    {Math.round(currentDefense.detectionChance * 100)}%
                  </span>
                </div>
              </div>

              {nextDefense && (
                <>
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-xs text-gray-400 mb-2">
                      Next level: <span className="text-blue-300">{nextDefense.name}</span>
                    </p>
                    <div className="space-y-1 text-xs mb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cost:</span>
                        <span className="text-gray-400">
                          {nextDefense.productionCost} Production, {nextDefense.intelCost} Intel
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time:</span>
                        <span className="text-gray-400">{nextDefense.turnsToComplete} turns</span>
                      </div>
                    </div>
                    <Button
                      onClick={onUpgradeBioDefense}
                      disabled={!canAffordDefenseUpgrade}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-sm disabled:opacity-50"
                    >
                      Upgrade to Level {bioDefenseLevel + 1}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Deployment & Active Attacks */}
        <div className="space-y-4">
          {/* Deploy Bio-Weapon */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-semibold text-red-300 flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" />
              Deploy Bio-Weapon
            </h3>

            {!bioWeaponResearched ? (
              <div className="bg-gray-900/50 p-3 rounded border border-gray-700 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-sm text-gray-400">
                  Research bio-weapons first to enable deployment
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {livingEnemies.map(enemy => (
                    <Button
                      key={enemy.id}
                      onClick={() => {
                        if (canAffordDeployment) {
                          onDeployBioWeapon?.(enemy.id);
                        }
                      }}
                      disabled={!canAffordDeployment}
                      className="w-full justify-between bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 disabled:opacity-50"
                    >
                      <span>{enemy.name}</span>
                      <span className="text-xs text-gray-400">
                        {Math.round(enemy.population / 1000000)}M pop
                      </span>
                    </Button>
                  ))}
                </div>

                <div className="bg-gray-900/50 p-2 rounded text-xs text-gray-400">
                  <div className="flex justify-between mb-1">
                    <span>Cost per deployment:</span>
                    <span className="text-gray-300">
                      {BIO_WEAPON_DEPLOYMENT_COST.intel} Intel,{' '}
                      {BIO_WEAPON_DEPLOYMENT_COST.uranium} Uranium
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your resources:</span>
                    <span className={canAffordDeployment ? 'text-green-400' : 'text-red-400'}>
                      {player.intel} Intel, {player.uranium || 0} Uranium
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Active Bio-Attacks */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-semibold text-yellow-300 flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" />
              Active Bio-Attacks
            </h3>

            {activeBioAttacks.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No active bio-warfare campaigns
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeBioAttacks.map(attack => {
                  const target = enemies.find(e => e.id === attack.targetId);
                  const attacker = attack.attackerId === player.id ? 'You' : 'Enemy';

                  return (
                    <motion.div
                      key={attack.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-900/50 p-3 rounded border border-yellow-500/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">
                            {attacker} → {target?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {attack.totalPopulationLost.toLocaleString()} casualties so far
                          </p>
                        </div>
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {attack.turnsRemaining} turns
                        </Badge>
                      </div>
                      <Progress
                        value={(1 - attack.turnsRemaining / attack.durationTurns) * 100}
                        className="h-1.5 bg-gray-700"
                      />
                      {attack.discovered && (
                        <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Discovered!
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-6 bg-gray-800/30 p-3 rounded-lg border border-gray-700">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5" />
          <div className="text-xs text-gray-400 space-y-1">
            <p>
              <strong className="text-gray-300">Bio-Weapons:</strong> Cause 3-5% population loss
              per turn for 5-8 turns
            </p>
            <p>
              <strong className="text-gray-300">Defense:</strong> Reduces damage and increases
              detection chance
            </p>
            <p>
              <strong className="text-gray-300">Diplomacy:</strong> Using bio-weapons severely
              damages relationships (-45)
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
