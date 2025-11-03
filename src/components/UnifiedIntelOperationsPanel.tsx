/**
 * Unified Intel Operations Panel
 *
 * Consolidates 6 intel types (espionage, cyber, satellites, cover ops, deep recon, diplomatic espionage)
 * into 3 clear, distinct operations:
 *
 * 1. Deploy Satellite - Reveals enemy stats
 * 2. Sabotage Operation - Destroys enemy missiles/warheads
 * 3. Cyber Attack - Disables enemy systems temporarily
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Satellite, Bomb, Laptop, Target, Clock, Zap, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Nation } from '@/types/game';
import { INTEL_OPERATIONS, canExecuteIntelOperation, type IntelOperationType } from '@/types/unifiedIntelOperations';

interface UnifiedIntelOperationsPanelProps {
  player: Nation;
  enemies: Nation[];
  onDeploySatellite?: (targetId: string) => void;
  onSabotageOperation?: (targetId: string, targetType: 'missiles' | 'warheads') => void;
  onCyberAttack?: (targetId: string) => void;
  operationCooldowns?: Record<string, number>; // cooldown turns remaining per operation type
}

export function UnifiedIntelOperationsPanel({
  player,
  enemies,
  onDeploySatellite,
  onSabotageOperation,
  onCyberAttack,
  operationCooldowns = {},
}: UnifiedIntelOperationsPanelProps) {
  const [selectedOperation, setSelectedOperation] = useState<IntelOperationType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [sabotageTargetType, setSabotageTargetType] = useState<'missiles' | 'warheads'>('missiles');

  const operations = [
    {
      type: 'satellite' as IntelOperationType,
      icon: Satellite,
      color: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10',
      hoverBg: 'hover:bg-blue-500/20',
    },
    {
      type: 'sabotage' as IntelOperationType,
      icon: Bomb,
      color: 'text-red-400',
      borderColor: 'border-red-500/30',
      bgColor: 'bg-red-500/10',
      hoverBg: 'hover:bg-red-500/20',
    },
    {
      type: 'cyber-attack' as IntelOperationType,
      icon: Laptop,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-500/10',
      hoverBg: 'hover:bg-purple-500/20',
    },
  ];

  const handleExecuteOperation = () => {
    if (!selectedOperation || !selectedTarget) return;

    switch (selectedOperation) {
      case 'satellite':
        onDeploySatellite?.(selectedTarget);
        break;
      case 'sabotage':
        onSabotageOperation?.(selectedTarget, sabotageTargetType);
        break;
      case 'cyber-attack':
        onCyberAttack?.(selectedTarget);
        break;
    }

    // Reset selection
    setSelectedOperation(null);
    setSelectedTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-bold text-cyan-100 uppercase tracking-wider">
          Intel Operations
        </h3>
      </div>

      {/* Current Intel */}
      <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Available Intel</span>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-lg font-bold text-cyan-100">{Math.floor(player.intel)}</span>
          </div>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 gap-3">
        {operations.map(({ type, icon: Icon, color, borderColor, bgColor, hoverBg }) => {
          const opData = INTEL_OPERATIONS[type];
          const canExecute = canExecuteIntelOperation(player, type);
          const cooldownRemaining = operationCooldowns[type] || 0;
          const isOnCooldown = cooldownRemaining > 0;
          const isSelected = selectedOperation === type;

          return (
            <motion.div
              key={type}
              whileHover={{ scale: canExecute.canExecute && !isOnCooldown ? 1.02 : 1 }}
              className={`border rounded-lg overflow-hidden transition-all cursor-pointer ${borderColor} ${
                isSelected ? bgColor : 'bg-gray-900/20'
              } ${!canExecute.canExecute || isOnCooldown ? 'opacity-50' : hoverBg}`}
              onClick={() => {
                if (canExecute.canExecute && !isOnCooldown) {
                  setSelectedOperation(type);
                  setSelectedTarget(null);
                }
              }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${color}`} />
                    <div>
                      <h4 className={`text-sm font-semibold ${color}`}>
                        {opData.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {opData.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-400" />
                    <span className="text-gray-300">
                      Cost: <span className="font-bold">{opData.intelCost}</span> intel
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">
                      Cooldown: <span className="font-bold">{opData.cooldown}</span> turns
                    </span>
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {isOnCooldown && (
                    <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {cooldownRemaining} turns
                    </Badge>
                  )}
                  {!canExecute.canExecute && !isOnCooldown && (
                    <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-400">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {canExecute.reason}
                    </Badge>
                  )}
                  {type === 'satellite' && (
                    <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-300">
                      <Info className="w-3 h-3 mr-1" />
                      Always visible
                    </Badge>
                  )}
                  {type === 'sabotage' && (
                    <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-300">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      40% detection
                    </Badge>
                  )}
                  {type === 'cyber-attack' && (
                    <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-300">
                      <Info className="w-3 h-3 mr-1" />
                      25% detection
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Target Selection */}
      <AnimatePresence>
        {selectedOperation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-cyan-500/30 rounded-lg overflow-hidden bg-gray-900/40"
          >
            <div className="p-4">
              <h4 className="text-sm font-semibold text-cyan-100 mb-3">Select Target</h4>

              {/* Sabotage type selection */}
              {selectedOperation === 'sabotage' && (
                <div className="mb-3 p-3 bg-gray-800/50 rounded">
                  <label className="text-xs text-gray-300 mb-2 block">Target Type</label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={sabotageTargetType === 'missiles' ? 'default' : 'outline'}
                      onClick={() => setSabotageTargetType('missiles')}
                      className="flex-1"
                    >
                      Missiles
                    </Button>
                    <Button
                      size="sm"
                      variant={sabotageTargetType === 'warheads' ? 'default' : 'outline'}
                      onClick={() => setSabotageTargetType('warheads')}
                      className="flex-1"
                    >
                      Warheads
                    </Button>
                  </div>
                </div>
              )}

              {/* Target nation selection */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {enemies.map((enemy) => (
                  <div
                    key={enemy.id}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedTarget === enemy.id
                        ? 'bg-cyan-500/20 border-cyan-500'
                        : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedTarget(enemy.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: enemy.color }}
                        />
                        <span className="text-sm font-medium text-gray-200">
                          {enemy.name}
                        </span>
                      </div>
                      {player.satellites?.[enemy.id] && (
                        <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-400">
                          <Satellite className="w-3 h-3 mr-1" />
                          Satellite Active
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Execute button */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedOperation(null);
                    setSelectedTarget(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecuteOperation}
                  disabled={!selectedTarget}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500"
                >
                  Execute Operation
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Satellites */}
      {player.satellites && Object.keys(player.satellites).length > 0 && (
        <div className="border border-blue-500/30 rounded-lg p-3 bg-blue-500/5">
          <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
            <Satellite className="w-4 h-4" />
            Active Satellites
          </h4>
          <div className="space-y-1">
            {Object.entries(player.satellites).map(([targetId, active]) => {
              if (!active) return null;
              const target = enemies.find(e => e.id === targetId);
              if (!target) return null;

              return (
                <div key={targetId} className="text-xs text-blue-200 flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: target.color }}
                  />
                  <span>{target.name}</span>
                  <span className="text-blue-400/60 ml-auto">• Coverage Active</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 text-center p-2">
        Intel operations allow you to gather intelligence, sabotage enemies, and disrupt their capabilities
      </div>
    </div>
  );
}
