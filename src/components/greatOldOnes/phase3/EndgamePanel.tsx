/**
 * Endgame Panel - Week 10-11 UI
 * Display victory conditions, analytics, and New Game+ options
 */

import React from 'react';
import { Phase3State } from '../../../types/phase3Types';

interface EndgamePanelProps {
  phase3State: Phase3State;
  onStartNewGamePlus?: () => void;
}

export const EndgamePanel: React.FC<EndgamePanelProps> = ({
  phase3State,
  onStartNewGamePlus,
}) => {
  const { endgame } = phase3State;

  // Grade colors
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'text-yellow-300';
      case 'A': return 'text-green-300';
      case 'B': return 'text-blue-300';
      case 'C': return 'text-purple-300';
      case 'D': return 'text-orange-300';
      case 'F': return 'text-red-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="endgame-panel p-4 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">🌌 Endgame Status</h2>

      {/* Victory Conditions */}
      {endgame.availableVictories.length > 0 && (
        <div className="victories-section mb-6">
          <h3 className="text-xl font-semibold mb-2 text-yellow-300">
            Victory Conditions
          </h3>
          <div className="space-y-3">
            {endgame.availableVictories.map(victory => {
              const conditionsMet = Object.values(victory.conditionsMet).filter(c => c).length;
              const totalConditions = Object.values(victory.conditionsMet).length;
              const progress = (conditionsMet / totalConditions) * 100;

              return (
                <div
                  key={victory.type}
                  className={`p-4 rounded border ${
                    victory.type === endgame.achievedVictory?.type
                      ? 'bg-yellow-900 bg-opacity-50 border-yellow-500'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-yellow-300">{victory.name}</div>
                      <div className="text-sm text-gray-300">{victory.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {conditionsMet}/{totalConditions}
                      </div>
                      <div className="text-xs text-gray-400">{victory.variant}</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress === 100 ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    {Object.entries(victory.conditionsMet).map(([condition, met]) => (
                      <div key={condition} className="flex items-center gap-2">
                        <span className={met ? 'text-green-400' : 'text-gray-500'}>
                          {met ? '✓' : '○'}
                        </span>
                        <span>{condition.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    ))}
                  </div>

                  {victory.type === endgame.achievedVictory?.type && (
                    <div className="mt-3 p-2 bg-yellow-900 rounded">
                      <div className="text-sm font-semibold text-yellow-200 mb-1">
                        Victory Achieved! Score: {victory.score}
                      </div>
                      <div className="text-xs text-yellow-100 italic">
                        {victory.endingNarrative}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campaign Analytics */}
      {endgame.analytics && (
        <div className="analytics-section mb-6">
          <h3 className="text-xl font-semibold mb-2 text-blue-300">Campaign Analytics</h3>

          {/* Overall Score */}
          <div className="score-card mb-4 p-4 bg-gray-800 rounded">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-2xl font-bold">{endgame.analytics.overallScore}</div>
                <div className="text-sm text-gray-400">Final Score</div>
              </div>
              <div className={`text-5xl font-bold ${getGradeColor(endgame.analytics.grade)}`}>
                {endgame.analytics.grade}
              </div>
            </div>
          </div>

          {/* Doctrine Performance */}
          <div className="doctrine-stats mb-4 p-3 bg-gray-800 rounded">
            <div className="font-semibold text-blue-200 mb-2">Doctrine Performance</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Doctrine:</span>{' '}
                <span className="capitalize">{endgame.analytics.doctrinePerformance.doctrine}</span>
              </div>
              <div>
                <span className="text-gray-400">Efficiency:</span>{' '}
                <span>{endgame.analytics.doctrinePerformance.efficiency.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-400">Missions:</span>{' '}
                <span>{endgame.analytics.doctrinePerformance.missionsCompleted}</span>
              </div>
              <div>
                <span className="text-gray-400">Favor:</span>{' '}
                <span>{endgame.analytics.doctrinePerformance.favorGained}</span>
              </div>
            </div>
          </div>

          {/* Mission Statistics */}
          <div className="mission-stats mb-4 p-3 bg-gray-800 rounded">
            <div className="font-semibold text-blue-200 mb-2">Mission Statistics</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Total:</span>{' '}
                <span>{endgame.analytics.missionStats.total}</span>
              </div>
              <div>
                <span className="text-gray-400">Success Rate:</span>{' '}
                <span className="text-green-400">
                  {((endgame.analytics.missionStats.successful / endgame.analytics.missionStats.total) * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-gray-400">Perfect:</span>{' '}
                <span>{endgame.analytics.missionStats.perfectScores}</span>
              </div>
              <div>
                <span className="text-gray-400">Avg Difficulty:</span>{' '}
                <span>{endgame.analytics.missionStats.averageDifficulty.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Entity Summoning Log */}
          {endgame.analytics.entityLog.length > 0 && (
            <div className="entity-log mb-4 p-3 bg-gray-800 rounded">
              <div className="font-semibold text-blue-200 mb-2">
                Entities Summoned ({endgame.analytics.entityLog.length})
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {endgame.analytics.entityLog.map((entity, idx) => (
                  <div key={idx} className="text-xs p-2 bg-gray-700 rounded">
                    <div className="flex justify-between">
                      <span className="font-semibold text-purple-300">{entity.entityName}</span>
                      <span className="text-gray-400">{entity.tier}</span>
                    </div>
                    <div className="text-gray-500">
                      Terror: {entity.terrorCaused} | {entity.rampaged ? '⚠️ Rampaged' : '✓ Controlled'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corruption Map */}
          {endgame.analytics.corruptionMap.length > 0 && (
            <div className="corruption-map mb-4 p-3 bg-gray-800 rounded">
              <div className="font-semibold text-blue-200 mb-2">Regional Corruption</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {endgame.analytics.corruptionMap
                  .sort((a, b) => b.peakCorruption - a.peakCorruption)
                  .slice(0, 5)
                  .map(region => (
                    <div key={region.regionId} className="text-xs flex justify-between">
                      <span className="text-gray-400">{region.regionId}</span>
                      <span
                        className={
                          region.peakCorruption > 80
                            ? 'text-red-400'
                            : region.peakCorruption > 50
                            ? 'text-orange-400'
                            : 'text-yellow-400'
                        }
                      >
                        {region.peakCorruption.toFixed(0)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Lore Unlocked */}
          {endgame.analytics.loreUnlocked.length > 0 && (
            <div className="lore-unlocked p-3 bg-gray-800 rounded">
              <div className="font-semibold text-blue-200 mb-2">
                Lore Unlocked ({endgame.analytics.loreUnlocked.length})
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {endgame.analytics.loreUnlocked.map(lore => (
                  <div key={lore.id} className="text-xs p-2 bg-gray-700 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-cyan-300">{lore.title}</span>
                      <span className="text-xs text-gray-500">{lore.rarity}</span>
                    </div>
                    <div className="text-gray-400">{lore.content}</div>
                    <div className="text-gray-500 mt-1">Unlocked by: {lore.unlockedBy}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legacy Perks */}
      {endgame.legacyPerks.length > 0 && (
        <div className="legacy-section mb-6">
          <h3 className="text-xl font-semibold mb-2 text-purple-300">
            New Game+ Legacy Perks
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {endgame.legacyPerks.map(perk => (
              <div key={perk.id} className="p-3 bg-purple-900 bg-opacity-30 rounded border border-purple-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-purple-300">{perk.name}</div>
                    <div className="text-xs text-gray-400">{perk.description}</div>
                  </div>
                  <div className="text-xs text-purple-400">{perk.type}</div>
                </div>

                <div className="text-xs text-gray-400 mb-2">
                  Unlocked: {perk.unlockCondition}
                </div>

                <div className="text-xs text-purple-200">
                  Effects:
                  {perk.effects.resourceBonus && (
                    <span className="ml-2">+{perk.effects.resourceBonus}% resources</span>
                  )}
                  {perk.effects.startingCultists && (
                    <span className="ml-2">+{perk.effects.startingCultists} cultists</span>
                  )}
                  {perk.effects.startingSites && (
                    <span className="ml-2">+{perk.effects.startingSites} sites</span>
                  )}
                  {perk.effects.investigatorHandicap && (
                    <span className="ml-2">
                      {perk.effects.investigatorHandicap > 0 ? '+' : ''}
                      {perk.effects.investigatorHandicap}% investigator spawn
                    </span>
                  )}
                  {perk.effects.doctrineUnlock && (
                    <span className="ml-2">Doctrine unlocked early</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Game+ Button */}
      {endgame.achievedVictory && endgame.legacyPerks.length > 0 && onStartNewGamePlus && (
        <div className="newgameplus-button mt-6">
          <button
            onClick={onStartNewGamePlus}
            className="w-full px-6 py-3 bg-purple-700 hover:bg-purple-800 rounded-lg font-semibold text-lg"
          >
            🔄 Start New Game+ with {endgame.legacyPerks.length} Perks
          </button>
        </div>
      )}
    </div>
  );
};
