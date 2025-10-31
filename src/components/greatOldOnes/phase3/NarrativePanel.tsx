/**
 * Narrative Panel - Week 8 UI
 * Display motivation, Great Truth, Order politics, and rival cults
 */

import React from 'react';
import { Phase3State } from '../../../types/phase3Types';

interface NarrativePanelProps {
  phase3State: Phase3State;
  onInterpretTruth?: (interpretation: 'malevolent' | 'indifferent' | 'benevolent') => void;
  onResolveSchism?: (schismId: string, resolution: 'unity' | 'purge_rebels' | 'compromise' | 'civil_war') => void;
  onInteractWithRival?: (cultId: string, action: 'ally' | 'destroy' | 'sabotage' | 'ignore') => void;
}

export const NarrativePanel: React.FC<NarrativePanelProps> = ({
  phase3State,
  onInterpretTruth,
  onResolveSchism,
  onInteractWithRival,
}) => {
  const { narrative } = phase3State;

  return (
    <div className="narrative-panel p-4 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">🌑 Narrative & Politics</h2>

      {/* Motivation Branch */}
      {narrative.motivationBranch && (
        <div className="motivation-section mb-6 p-4 bg-gray-800 rounded">
          <h3 className="text-xl font-semibold mb-2 text-purple-300">
            Your True Motivation: {narrative.motivationBranch.name}
          </h3>
          <p className="text-gray-300 mb-2">{narrative.motivationBranch.description}</p>

          <div className="progress-bar mb-2">
            <div className="text-sm mb-1">Revelation Progress: {narrative.motivationBranch.revelationProgress.toFixed(0)}%</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${narrative.motivationBranch.revelationProgress}%` }}
              />
            </div>
          </div>

          {narrative.motivationBranch.flashbacksUnlocked.length > 0 && (
            <div className="flashbacks mt-3">
              <div className="text-sm font-semibold text-purple-200">Unlocked Memories:</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {narrative.motivationBranch.flashbacksUnlocked.map(fb => (
                  <span key={fb} className="px-2 py-1 bg-purple-900 rounded text-xs">
                    {fb}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Great Truth */}
      <div className="truth-section mb-6 p-4 bg-gray-800 rounded">
        <h3 className="text-xl font-semibold mb-2 text-cyan-300">The Great Truth</h3>

        <div className="progress-bar mb-3">
          <div className="text-sm mb-1">
            Revelation: {narrative.greatTruth.revelationLevel.toFixed(0)}%
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all"
              style={{ width: `${narrative.greatTruth.revelationLevel}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div>
            <span className="text-gray-400">Interpretation:</span>{' '}
            <span className="font-semibold text-cyan-300">
              {narrative.greatTruth.interpretation}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Your Stance:</span>{' '}
            <span className="font-semibold text-cyan-300">
              {narrative.greatTruth.playerStance || 'Undecided'}
            </span>
          </div>
        </div>

        {narrative.greatTruth.revelationLevel >= 100 && !narrative.greatTruth.playerStance && onInterpretTruth && (
          <div className="interpretation-choice mt-3 p-3 bg-gray-700 rounded">
            <div className="text-sm font-semibold mb-2">Choose Your Interpretation:</div>
            <div className="flex gap-2">
              <button
                onClick={() => onInterpretTruth('malevolent')}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                They are Evil
              </button>
              <button
                onClick={() => onInterpretTruth('indifferent')}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
              >
                They are Indifferent
              </button>
              <button
                onClick={() => onInterpretTruth('benevolent')}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                They will Save Us
              </button>
            </div>
          </div>
        )}

        {narrative.greatTruth.contradictions.length > 0 && (
          <div className="contradictions mt-3">
            <div className="text-sm font-semibold text-cyan-200 mb-1">Contradictions:</div>
            <div className="space-y-2">
              {narrative.greatTruth.contradictions.map(c => (
                <div key={c.id} className="p-2 bg-gray-700 rounded text-xs">
                  <div className="font-semibold text-yellow-300">{c.title}</div>
                  <div className="text-gray-400">{c.description}</div>
                  <div className="text-gray-500 text-xs mt-1">
                    Weight: {c.weight}/10
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Factions */}
      <div className="factions-section mb-6">
        <h3 className="text-xl font-semibold mb-2 text-yellow-300">Order Factions</h3>
        <div className="grid grid-cols-1 gap-2">
          {narrative.orderFactions.map(faction => (
            <div key={faction.faction} className="p-3 bg-gray-800 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-yellow-200">{faction.name}</div>
                  <div className="text-xs text-gray-400">Led by {faction.leader.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Power: {faction.power}%</div>
                  <div
                    className={`text-xs ${
                      faction.playerRelation > 0 ? 'text-green-400' : faction.playerRelation < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}
                  >
                    Relation: {faction.playerRelation > 0 ? '+' : ''}{faction.playerRelation}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-300">{faction.description}</div>
              <div className="text-xs text-gray-500 mt-1 italic">{faction.agenda}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Schisms */}
      {narrative.activeSchisms.length > 0 && (
        <div className="schisms-section mb-6">
          <h3 className="text-xl font-semibold mb-2 text-red-300">⚠️ Active Schisms</h3>
          <div className="space-y-3">
            {narrative.activeSchisms.map(schism => (
              <div key={schism.id} className="p-3 bg-red-900 bg-opacity-30 rounded border border-red-700">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-red-300">{schism.name}</div>
                  <div className="text-sm text-red-400">Severity: {schism.severity}%</div>
                </div>
                <div className="text-sm text-gray-300 mb-2">{schism.cause}</div>

                <div className="text-xs text-gray-400 mb-2">
                  Factions: {schism.factions.join(', ')}
                </div>

                {schism.consequences.length > 0 && (
                  <div className="text-xs text-red-300 mb-2">
                    Consequences: {schism.consequences.join(', ')}
                  </div>
                )}

                {onResolveSchism && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => onResolveSchism(schism.id, 'unity')}
                      className="px-2 py-1 bg-green-700 hover:bg-green-800 rounded text-xs"
                      disabled={!schism.resolvable}
                    >
                      Seek Unity
                    </button>
                    <button
                      onClick={() => onResolveSchism(schism.id, 'compromise')}
                      className="px-2 py-1 bg-blue-700 hover:bg-blue-800 rounded text-xs"
                    >
                      Compromise
                    </button>
                    <button
                      onClick={() => onResolveSchism(schism.id, 'purge_rebels')}
                      className="px-2 py-1 bg-red-700 hover:bg-red-800 rounded text-xs"
                    >
                      Purge Rebels
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rival Cults */}
      {narrative.rivalCults.length > 0 && (
        <div className="rivals-section">
          <h3 className="text-xl font-semibold mb-2 text-orange-300">Rival Cults</h3>
          <div className="grid grid-cols-1 gap-2">
            {narrative.rivalCults.map(cult => (
              <div key={cult.id} className="p-3 bg-gray-800 rounded border border-orange-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-orange-300">{cult.name}</div>
                    <div className="text-xs text-gray-400">Serves {cult.patronEntity}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Power: {cult.power}%</div>
                    <div className="text-xs">Progress: {cult.progress}%</div>
                  </div>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-1 mb-2">
                  <div
                    className="bg-orange-500 h-1 rounded-full"
                    style={{ width: `${cult.progress}%` }}
                  />
                </div>

                {cult.currentOperation && (
                  <div className="text-xs text-orange-200 mb-2">
                    Current: {cult.currentOperation}
                  </div>
                )}

                <div className="text-xs text-gray-400 mb-2">
                  Status: {cult.relationshipType.replace('_', ' ')}
                </div>

                {onInteractWithRival && (
                  <div className="flex gap-2 mt-2">
                    {cult.relationshipType === 'potential_ally' && (
                      <button
                        onClick={() => onInteractWithRival(cult.id, 'ally')}
                        className="px-2 py-1 bg-green-700 hover:bg-green-800 rounded text-xs"
                      >
                        Ally
                      </button>
                    )}
                    <button
                      onClick={() => onInteractWithRival(cult.id, 'sabotage')}
                      className="px-2 py-1 bg-yellow-700 hover:bg-yellow-800 rounded text-xs"
                    >
                      Sabotage
                    </button>
                    <button
                      onClick={() => onInteractWithRival(cult.id, 'destroy')}
                      className="px-2 py-1 bg-red-700 hover:bg-red-800 rounded text-xs"
                    >
                      Destroy
                    </button>
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
