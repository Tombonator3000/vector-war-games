/**
 * NGO OPERATIONS PANEL
 *
 * Manage NGO-sponsored immigration operations for destabilization
 * - Launch immigration operations
 * - View active operations
 * - Upgrade NGO infrastructure
 * - Monitor exposure risk
 */

import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, AlertTriangle, TrendingUp, Info, Eye, EyeOff, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Nation } from '@/types/game';
import type { NGOType, NGOOperation } from '@/types/ngoSystem';
import { NGO_OPERATION_TEMPLATES } from '@/lib/ngoOperationsData';
import {
  launchNGOOperation,
  cancelNGOOperation,
  upgradeNGOInfrastructure,
} from '@/lib/ngoTurnProcessor';

interface NGOOperationsPanelProps {
  player: Nation;
  allNations: Nation[];
  currentTurn: number;
  onRefresh?: () => void;
  onClose?: () => void;
}

const NGOOperationsPanelComponent = ({
  player,
  allNations,
  currentTurn,
  onRefresh,
  onClose,
}: NGOOperationsPanelProps) => {
  const [activeTab, setActiveTab] = useState<'launch' | 'active' | 'infrastructure'>('active');
  const [selectedNGOType, setSelectedNGOType] = useState<NGOType | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [operationDuration, setOperationDuration] = useState<number>(8);

  const ngoState = player.ngoState;
  if (!ngoState) {
    return (
      <div className="bg-gray-900/90 backdrop-blur-sm p-6 rounded-lg border border-gray-700 text-center">
        <p className="text-gray-400">NGO system not initialized for this nation.</p>
      </div>
    );
  }

  const activeOperations = ngoState.activeOperations.filter((op) => op.status === 'active');
  const completedOperations = ngoState.activeOperations.filter((op) => op.status === 'completed');
  const exposedOperations = ngoState.activeOperations.filter((op) => op.status === 'exposed');

  const handleLaunchOperation = () => {
    if (!selectedNGOType || !selectedSource || !selectedTarget) {
      alert('Please select NGO type, source nation, and target nation');
      return;
    }

    const result = launchNGOOperation(
      player,
      selectedSource,
      selectedTarget,
      selectedNGOType,
      operationDuration,
      currentTurn
    );

    if (result.success) {
      alert(`Success! ${result.message}`);
      setSelectedNGOType(null);
      setSelectedSource(null);
      setSelectedTarget(null);
      if (onRefresh) onRefresh();
    } else {
      alert(`Failed: ${result.message}`);
    }
  };

  const handleCancelOperation = (operationId: string) => {
    if (!confirm('Are you sure you want to cancel this operation?')) return;

    const result = cancelNGOOperation(player, operationId);
    if (result.success) {
      alert(result.message);
      if (onRefresh) onRefresh();
    } else {
      alert(`Failed: ${result.message}`);
    }
  };

  const handleUpgradeInfrastructure = () => {
    const result = upgradeNGOInfrastructure(player);
    if (result.success) {
      alert(`${result.message} - New level: ${result.newLevel}`);
      if (onRefresh) onRefresh();
    } else {
      alert(`Failed: ${result.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
            <Users className="w-6 h-6" />
            NGO Operations
          </h2>
          <p className="text-sm text-gray-400 mt-1">Sponsor immigration for strategic destabilization</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* NGO Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 p-3 rounded-lg border border-cyan-500/30">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-gray-400">Infrastructure:</span>
            <span className="text-cyan-300 font-semibold">{ngoState.ngoInfrastructure}/100</span>
          </div>
        </div>
        <div className="bg-gray-800/50 p-3 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Reputation:</span>
            <span className="text-purple-300 font-semibold">{ngoState.ngoReputation}/100</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Active Ops</div>
            <div className="text-lg font-semibold text-green-400">{activeOperations.length}/{ngoState.maxActiveOperations}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Total Migrants</div>
            <div className="text-lg font-semibold text-blue-400">{ngoState.totalMigrantsMoved.toFixed(1)}M</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Exposed</div>
            <div className="text-lg font-semibold text-red-400">{ngoState.exposedOperations}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'active'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Active Operations {activeOperations.length > 0 && (
            <Badge className="ml-1 bg-cyan-500/20 text-cyan-400 text-xs">{activeOperations.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('launch')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'launch'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Launch Operation
        </button>
        <button
          onClick={() => setActiveTab('infrastructure')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'infrastructure'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Infrastructure
        </button>
      </div>

      {/* Active Operations Tab */}
      {activeTab === 'active' && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeOperations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active NGO operations</p>
              <p className="text-xs mt-1">Launch an operation to begin destabilizing enemy nations</p>
            </div>
          ) : (
            activeOperations.map((op) => {
              const source = allNations.find((n) => n.id === op.sourceNationId);
              const target = allNations.find((n) => n.id === op.targetNationId);
              const template = NGO_OPERATION_TEMPLATES[op.ngoType];
              const isExposed = op.exposedToNations.length > 0;

              return (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gray-800/70 p-4 rounded-lg border ${
                    isExposed ? 'border-red-500/50' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{template.icon}</span>
                      <div>
                        <div className="font-semibold text-white">{op.name}</div>
                        <div className="text-xs text-gray-400">
                          {source?.name} → {target?.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {op.isCovert ? (
                        <EyeOff className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-blue-400" />
                      )}
                      {isExposed && (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-gray-400">Migrants/turn:</span>
                      <span className="ml-1 text-blue-300">{op.effects.immigrationRate.toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total moved:</span>
                      <span className="ml-1 text-blue-300">{op.totalMigrants.toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Instability:</span>
                      <span className="ml-1 text-orange-300">+{op.effects.targetInstability}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Turns left:</span>
                      <span className="ml-1 text-cyan-300">{op.turnsRemaining}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Exposure risk:</span>
                      <span
                        className={`text-xs font-semibold ${
                          op.exposureChance > 50
                            ? 'text-red-400'
                            : op.exposureChance > 30
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}
                      >
                        {op.exposureChance.toFixed(0)}%
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelOperation(op.id)}
                    >
                      Cancel
                    </Button>
                  </div>

                  {isExposed && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Exposed to: {op.exposedToNations.map(id => allNations.find(n => n.id === id)?.name).join(', ')}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Launch Operation Tab */}
      {activeTab === 'launch' && (
        <div className="space-y-4">
          {/* NGO Type Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">Select NGO Type</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(NGO_OPERATION_TEMPLATES) as NGOType[]).map((ngoType) => {
                const template = NGO_OPERATION_TEMPLATES[ngoType];
                const isSelected = selectedNGOType === ngoType;
                const canAfford =
                  (player.gold ?? 0) >= template.setupCost.gold &&
                  player.intel >= (template.setupCost.intel ?? 0) &&
                  player.production >= (template.setupCost.production ?? 0);
                const meetsRequirements =
                  ngoState.ngoInfrastructure >= (template.requirements.minNGOInfrastructure ?? 0) &&
                  player.intel >= (template.requirements.minIntel ?? 0);

                return (
                  <button
                    key={ngoType}
                    onClick={() => setSelectedNGOType(ngoType)}
                    disabled={!canAfford || !meetsRequirements}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    } ${!canAfford || !meetsRequirements ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{template.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="text-yellow-400">
                            💰 {template.setupCost.gold}
                            {template.setupCost.intel && ` | 🔍 ${template.setupCost.intel}`}
                          </span>
                          <span className="text-blue-400">
                            Migrants: {template.baseEffects.immigrationRate}M/turn
                          </span>
                          <span className="text-orange-400">
                            Instability: +{template.baseEffects.targetInstability}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nation Selection */}
          {selectedNGOType && (
            <>
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">Source Nation (losing population)</label>
                <select
                  value={selectedSource || ''}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="">Select source nation...</option>
                  {allNations
                    .filter((n) => !n.eliminated && n.id !== player.id)
                    .map((nation) => (
                      <option key={nation.id} value={nation.id}>
                        {nation.name} (Pop: {nation.population}M)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">Target Nation (receiving migrants)</label>
                <select
                  value={selectedTarget || ''}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="">Select target nation...</option>
                  {allNations
                    .filter((n) => !n.eliminated && n.id !== player.id && n.id !== selectedSource)
                    .map((nation) => (
                      <option key={nation.id} value={nation.id}>
                        {nation.name} (Instability: {(nation.instability || 0).toFixed(0)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Operation Duration: {operationDuration} turns
                </label>
                <input
                  type="range"
                  min={NGO_OPERATION_TEMPLATES[selectedNGOType].minDuration}
                  max={NGO_OPERATION_TEMPLATES[selectedNGOType].maxDuration}
                  value={operationDuration}
                  onChange={(e) => setOperationDuration(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{NGO_OPERATION_TEMPLATES[selectedNGOType].minDuration} turns</span>
                  <span>{NGO_OPERATION_TEMPLATES[selectedNGOType].maxDuration} turns</span>
                </div>
              </div>

              <Button
                onClick={handleLaunchOperation}
                disabled={!selectedSource || !selectedTarget}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                Launch Operation
              </Button>
            </>
          )}
        </div>
      )}

      {/* Infrastructure Tab */}
      {activeTab === 'infrastructure' && (
        <div className="space-y-4">
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              NGO Infrastructure
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Current Level</span>
                  <span className="text-cyan-300 font-semibold">{ngoState.ngoInfrastructure}/100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${ngoState.ngoInfrastructure}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-900/50 p-3 rounded text-sm">
                <div className="text-gray-300 mb-2">Benefits:</div>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>• Max operations: {ngoState.maxActiveOperations}</li>
                  <li>• Immigration rate bonus: +{(ngoState.ngoInfrastructure / 2).toFixed(0)}%</li>
                  <li>• Detection risk reduction: -{(ngoState.ngoInfrastructure / 10).toFixed(0)}%</li>
                </ul>
              </div>

              <Button
                onClick={handleUpgradeInfrastructure}
                disabled={ngoState.ngoInfrastructure >= 100}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Upgrade Infrastructure (200 💰, 50 🏭)
              </Button>

              <div className="text-xs text-gray-500">
                <Info className="w-3 h-3 inline mr-1" />
                Higher infrastructure improves operation effectiveness and reduces exposure risk
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-semibold text-purple-300 mb-3">Operation Statistics</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-400">Total Launched</div>
                <div className="text-white font-semibold">{ngoState.totalOperationsLaunched}</div>
              </div>
              <div>
                <div className="text-gray-400">Successful</div>
                <div className="text-green-400 font-semibold">{ngoState.successfulOperations}</div>
              </div>
              <div>
                <div className="text-gray-400">Exposed</div>
                <div className="text-red-400 font-semibold">{ngoState.exposedOperations}</div>
              </div>
              <div>
                <div className="text-gray-400">Completed</div>
                <div className="text-blue-400 font-semibold">{completedOperations.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const NGOOperationsPanel = memo(NGOOperationsPanelComponent);
