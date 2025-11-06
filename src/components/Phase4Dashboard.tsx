/**
 * Hearts of Iron Phase 4 Dashboard
 *
 * Basic UI demonstration for Phase 4 features
 * This is a starter component - can be expanded into full-featured panels
 */

import React from 'react';
import type {
  IntelligenceAgency,
  OccupiedTerritory,
  EnhancedPeaceConference,
} from '@/types/heartsOfIronPhase4';

interface Phase4DashboardProps {
  agency: IntelligenceAgency | null;
  occupations: OccupiedTerritory[];
  conferences: EnhancedPeaceConference[];
}

export function Phase4Dashboard({ agency, occupations, conferences }: Phase4DashboardProps) {
  return (
    <div className="phase4-dashboard space-y-4 p-4 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold">Hearts of Iron Phase 4</h2>

      {/* Intelligence Agency Section */}
      <div className="intelligence-agency border border-gray-700 rounded p-3">
        <h3 className="text-xl font-semibold mb-2">Intelligence Agency</h3>
        {agency ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Level:</span>
              <span className="font-bold">{agency.level}</span>
            </div>
            <div className="flex justify-between">
              <span>Reputation:</span>
              <span className="font-bold capitalize">{agency.reputation}</span>
            </div>
            <div className="flex justify-between">
              <span>Operatives:</span>
              <span className="font-bold">
                {agency.activeOperatives} / {agency.maxOperatives}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Experience:</span>
              <span className="font-bold">{agency.experience}/100</span>
            </div>

            {/* Capabilities */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <h4 className="font-semibold mb-2">Capabilities</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Cryptology: {agency.capabilities.cryptology}</div>
                <div>Infiltration: {agency.capabilities.infiltration}</div>
                <div>Counter-Intel: {agency.capabilities.counterIntelligence}</div>
                <div>Propaganda: {agency.capabilities.propaganda}</div>
                <div>Sabotage: {agency.capabilities.sabotage}</div>
              </div>
            </div>

            {/* Active Operations */}
            {agency.activeOperations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <h4 className="font-semibold mb-2">Active Operations</h4>
                <div className="space-y-1 text-sm">
                  {agency.activeOperations.map(op => (
                    <div key={op.id} className="flex justify-between">
                      <span>{op.type.replace(/_/g, ' ')}</span>
                      <span>{Math.floor(op.progress)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upgrades */}
            {agency.upgrades.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <h4 className="font-semibold mb-2">Upgrades</h4>
                <div className="space-y-1 text-sm">
                  {agency.upgrades.map(upgrade => (
                    <div key={upgrade.id} className="text-green-400">
                      ✓ {upgrade.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400">No intelligence agency established</p>
        )}
      </div>

      {/* Occupation Section */}
      <div className="occupation border border-gray-700 rounded p-3">
        <h3 className="text-xl font-semibold mb-2">Occupied Territories</h3>
        {occupations.length > 0 ? (
          <div className="space-y-3">
            {occupations.map(occ => (
              <div key={occ.territoryId} className="border-l-4 border-red-500 pl-3">
                <div className="font-bold">{occ.territoryId}</div>
                <div className="text-sm space-y-1 mt-1">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`font-semibold ${
                        occ.status === 'stable'
                          ? 'text-green-400'
                          : occ.status === 'uprising'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                      }`}
                    >
                      {occ.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Policy:</span>
                    <span className="font-semibold capitalize">{occ.policy.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resistance:</span>
                    <span
                      className={`font-semibold ${
                        occ.resistance.level > 70
                          ? 'text-red-400'
                          : occ.resistance.level > 40
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      }`}
                    >
                      {occ.resistance.level}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compliance:</span>
                    <span
                      className={`font-semibold ${
                        occ.resistance.compliance > 70
                          ? 'text-green-400'
                          : occ.resistance.compliance > 40
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {occ.resistance.compliance}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Garrison:</span>
                    <span
                      className={`font-semibold ${
                        occ.garrison.totalStrength >= occ.garrison.requiredStrength
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {occ.garrison.totalStrength} / {occ.garrison.requiredStrength}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Extraction Efficiency:</span>
                    <span className="font-semibold">
                      {Math.floor(occ.resourceExtraction.efficiency * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No occupied territories</p>
        )}
      </div>

      {/* Peace Conferences Section */}
      <div className="peace-conferences border border-gray-700 rounded p-3">
        <h3 className="text-xl font-semibold mb-2">Peace Conferences</h3>
        {conferences.length > 0 ? (
          <div className="space-y-3">
            {conferences.map(conf => (
              <div key={conf.id} className="border-l-4 border-blue-500 pl-3">
                <div className="font-bold">{conf.name}</div>
                <div className="text-sm space-y-1 mt-1">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`font-semibold capitalize ${
                        conf.status === 'concluded'
                          ? 'text-green-400'
                          : conf.status === 'collapsed'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                      }`}
                    >
                      {conf.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Round:</span>
                    <span className="font-semibold">
                      {conf.currentRound} / {conf.maxRounds}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Participants:</span>
                    <span className="font-semibold">
                      {conf.participants.filter(p => p.attended).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demands:</span>
                    <span className="font-semibold">
                      {conf.demands.filter(d => d.status === 'accepted').length} accepted /{' '}
                      {conf.demands.length} total
                    </span>
                  </div>

                  {/* Show top contributors */}
                  {conf.participants.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <h4 className="text-xs font-semibold mb-1">Top Contributors</h4>
                      <div className="space-y-1">
                        {conf.participants
                          .filter(p => p.side === 'victor')
                          .sort((a, b) => b.totalWarscore - a.totalWarscore)
                          .slice(0, 3)
                          .map(p => (
                            <div key={p.nationId} className="flex justify-between text-xs">
                              <span>{p.nationId}</span>
                              <span className="text-yellow-400">{p.totalWarscore} warscore</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No active peace conferences</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="quick-stats border border-gray-700 rounded p-3">
        <h3 className="text-xl font-semibold mb-2">Phase 4 Statistics</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {agency?.activeOperations.length || 0}
            </div>
            <div className="text-xs text-gray-400">Active Operations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{occupations.length}</div>
            <div className="text-xs text-gray-400">Occupied Territories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {conferences.filter(c => c.status === 'concluded').length}
            </div>
            <div className="text-xs text-gray-400">Concluded Treaties</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example usage in main game component:
 *
 * import { useHeartsOfIronPhase4 } from '@/hooks/useHeartsOfIronPhase4';
 * import { Phase4Dashboard } from '@/components/Phase4Dashboard';
 *
 * function GameUI() {
 *   const phase4 = useHeartsOfIronPhase4();
 *   const playerNation = gameState.nations.find(n => n.isPlayer);
 *
 *   return (
 *     <Phase4Dashboard
 *       agency={phase4.getAgency(playerNation.id)}
 *       occupations={phase4.phase4State.occupations.filter(o => o.occupierId === playerNation.id)}
 *       conferences={phase4.phase4State.peaceConferences}
 *     />
 *   );
 * }
 */
