/**
 * Counter-Occult Panel - Week 9 UI
 * Display resistance research, global unity, and human counter-operations
 */

import React from 'react';
import { Phase3State } from '../../../types/phase3Types';

interface CounterOccultPanelProps {
  phase3State: Phase3State;
}

export const CounterOccultPanel: React.FC<CounterOccultPanelProps> = ({ phase3State }) => {
  const { counterOccult } = phase3State;

  // Threat level colors
  const getThreatColor = (unity: number) => {
    if (unity < 30) return 'text-green-400';
    if (unity < 50) return 'text-yellow-400';
    if (unity < 70) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="counter-occult-panel p-4 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-red-400">⚔️ Human Resistance</h2>

      {/* Global Unity */}
      <div className="unity-section mb-6 p-4 bg-gray-800 rounded">
        <h3 className="text-xl font-semibold mb-2 text-red-300">Global Unity</h3>

        <div className="progress-bar mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Unity Score</span>
            <span className={getThreatColor(counterOccult.globalUnity.unityScore)}>
              {counterOccult.globalUnity.unityScore.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                counterOccult.globalUnity.unityScore < 30
                  ? 'bg-green-500'
                  : counterOccult.globalUnity.unityScore < 50
                  ? 'bg-yellow-500'
                  : counterOccult.globalUnity.unityScore < 70
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${counterOccult.globalUnity.unityScore}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">Alliances:</span>{' '}
            <span className="font-semibold">{counterOccult.globalUnity.alliances.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Active Ops:</span>{' '}
            <span className="font-semibold">{counterOccult.globalUnity.jointOperations.length}</span>
          </div>
        </div>

        {counterOccult.globalUnity.victoryPossible && (
          <div className="mt-3 p-2 bg-red-900 bg-opacity-50 rounded text-sm text-red-300">
            ⚠️ WARNING: Human victory is now possible!
          </div>
        )}
      </div>

      {/* Resistance Research */}
      <div className="research-section mb-6">
        <h3 className="text-xl font-semibold mb-2 text-blue-300">Resistance Research</h3>
        <div className="grid grid-cols-1 gap-2">
          {counterOccult.resistanceResearch.map(research => (
            <div key={research.path} className="p-3 bg-gray-800 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-blue-200">{research.name}</div>
                  <div className="text-xs text-gray-400">{research.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{research.progress.toFixed(0)}%</div>
                  <div className="text-xs text-gray-400">
                    Effectiveness: {research.effectivenessAgainstOrder}%
                  </div>
                </div>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${research.progress}%` }}
                />
              </div>

              {research.unlockedTech.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-blue-200 mb-1">
                    Unlocked Tech ({research.unlockedTech.length}):
                  </div>
                  <div className="space-y-1">
                    {research.unlockedTech.map(tech => (
                      <div key={tech.id} className="p-2 bg-gray-700 rounded text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-blue-300">{tech.name}</div>
                            <div className="text-gray-400">{tech.description}</div>
                            <div className="text-gray-500 mt-1">
                              Counters: {tech.counters.join(', ')}
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-xs">Eff: {tech.effectiveness}%</div>
                            <div className="text-xs text-gray-400">
                              Deployed: {tech.deployment}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Human Alliances */}
      {counterOccult.globalUnity.alliances.length > 0 && (
        <div className="alliances-section mb-6">
          <h3 className="text-xl font-semibold mb-2 text-green-300">Human Alliances</h3>
          <div className="grid grid-cols-1 gap-2">
            {counterOccult.globalUnity.alliances.map(alliance => (
              <div key={alliance.id} className="p-3 bg-gray-800 rounded border border-green-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-green-300">{alliance.name}</div>
                    <div className="text-xs text-gray-400">{alliance.type}</div>
                  </div>
                  <div className="text-sm text-green-400">Strength: {alliance.strength}%</div>
                </div>

                <div className="text-xs text-gray-400 mb-2">
                  Members: {alliance.members.join(', ')}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Funding:</span>{' '}
                    <span className="text-green-300">${alliance.resources.funding}M</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Personnel:</span>{' '}
                    <span className="text-green-300">{alliance.resources.personnel}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tech:</span>{' '}
                    <span className="text-green-300">{alliance.resources.technology}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Joint Operations */}
      {counterOccult.globalUnity.jointOperations.length > 0 && (
        <div className="operations-section mb-6">
          <h3 className="text-xl font-semibold mb-2 text-yellow-300">
            ⚠️ Incoming Operations
          </h3>
          <div className="space-y-3">
            {counterOccult.globalUnity.jointOperations.map(op => (
              <div key={op.id} className="p-3 bg-yellow-900 bg-opacity-30 rounded border border-yellow-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-yellow-300">{op.name}</div>
                    <div className="text-xs text-gray-400">
                      Type: {op.type} | Target: {op.targetType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-yellow-400">
                      Success: {op.successChance.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {op.turnsUntilLaunch} turns
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-xs text-gray-400 mb-1">
                    Preparation: {op.preparation.toFixed(0)}%
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ width: `${op.preparation}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  Participating: {op.participants.length} alliance(s)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Forces */}
      {counterOccult.taskForces.length > 0 && (
        <div className="taskforces-section mb-6">
          <h3 className="text-xl font-semibold mb-2 text-purple-300">Elite Task Forces</h3>
          <div className="grid grid-cols-1 gap-2">
            {counterOccult.taskForces.map(tf => (
              <div key={tf.id} className="p-3 bg-gray-800 rounded border border-purple-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-purple-300">{tf.name}</div>
                    <div className="text-xs text-gray-400">
                      Led by {tf.leader.name} ({tf.leader.specialization})
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-gray-500">Investigation:</span>{' '}
                    <span className="text-purple-300">{tf.capabilities.investigation.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Combat:</span>{' '}
                    <span className="text-purple-300">{tf.capabilities.combat.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Occult:</span>{' '}
                    <span className="text-purple-300">{tf.capabilities.occultKnowledge.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Psychic Res:</span>{' '}
                    <span className="text-purple-300">{tf.capabilities.psychicResistance.toFixed(0)}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Abilities: {tf.leader.abilities.join(', ')}
                </div>

                {tf.currentMission && (
                  <div className="mt-2 p-2 bg-purple-900 bg-opacity-30 rounded text-xs">
                    <div className="text-purple-200">
                      Investigating: {tf.currentMission.target}
                    </div>
                    <div className="text-gray-400">
                      Progress: {tf.currentMission.progress.toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sanity Restoration Programs */}
      {counterOccult.sanityRestoration.length > 0 && (
        <div className="restoration-section">
          <h3 className="text-xl font-semibold mb-2 text-cyan-300">Sanity Restoration</h3>
          <div className="grid grid-cols-1 gap-2">
            {counterOccult.sanityRestoration.map(program => (
              <div key={program.id} className="p-3 bg-gray-800 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-cyan-300">{program.name}</div>
                    <div className="text-xs text-gray-400">{program.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Eff: {program.effectiveness}%</div>
                    <div className="text-xs text-gray-400">
                      +{program.restorationRate.toFixed(1)}/turn
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  Active in: {program.activeRegions.join(', ')}
                </div>

                {program.vulnerable && (
                  <div className="mt-2 text-xs text-yellow-300">
                    ⚠️ Vulnerable to Order counter-operations
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
