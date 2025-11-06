/**
 * Advanced Propaganda Panel
 * UI for managing useful idiots, phobia campaigns, and religious weapons
 */

import React, { useState } from 'react';
import type { Nation, GameState } from '../types/game';
import {
  UsefulIdiot,
  UsefulIdiotType,
  RecruitmentOperation,
  PhobiaCampaign,
  PhobiaType,
  PhobiaIntensity,
  ReligiousWeapon,
  ReligiousWeaponType,
  USEFUL_IDIOT_CONFIG,
  PHOBIA_CAMPAIGN_CONFIG,
  RELIGIOUS_WEAPON_CONFIG,
} from '../types/advancedPropaganda';
import {
  initiateRecruitment,
  performIdiotAction,
  launchPhobiaCampaign,
  deployReligiousWeapon,
} from '../lib/advancedPropagandaManager';

interface AdvancedPropagandaPanelProps {
  gameState: GameState;
  nation: Nation;
  allNations: Nation[];
  onUpdate: (updatedGameState: GameState) => void;
  onLog: (message: string, type?: string) => void;
}

export function AdvancedPropagandaPanel({
  gameState,
  nation,
  allNations,
  onUpdate,
  onLog,
}: AdvancedPropagandaPanelProps) {
  const [activeTab, setActiveTab] = useState<'idiots' | 'phobias' | 'religious'>('idiots');
  const [selectedTarget, setSelectedTarget] = useState<string>('');

  if (!gameState.advancedPropaganda) {
    return (
      <div className="p-4 bg-gray-800 rounded text-white">
        <h3 className="text-xl font-bold mb-2">Advanced Propaganda</h3>
        <p className="text-gray-400">Advanced propaganda systems not initialized.</p>
      </div>
    );
  }

  const { advancedPropaganda } = gameState;

  // Filter by nation
  const myIdiots = advancedPropaganda.usefulIdiots.filter(
    i => i.recruiterNation === nation.id && i.status !== 'burned'
  );
  const myRecruitment = advancedPropaganda.recruitmentOperations.filter(
    r => r.recruiterNation === nation.id
  );
  const myPhobias = advancedPropaganda.phobiaCampaigns.filter(
    p => p.sourceNation === nation.id
  );
  const myReligious = advancedPropaganda.religiousWeapons.filter(
    w => w.sourceNation === nation.id
  );

  const targetNations = allNations.filter(n => !n.eliminated && n.id !== nation.id);

  // ============================================================================
  // USEFUL IDIOTS TAB
  // ============================================================================

  const renderIdiotsTab = () => {
    const handleRecruitment = (targetType: UsefulIdiotType, targetNation: string) => {
      const operation = initiateRecruitment(gameState, nation.id, targetNation, targetType);

      if (operation) {
        advancedPropaganda.recruitmentOperations.push(operation);
        onUpdate(gameState);
        onLog(
          `Initiated recruitment of ${targetType} in ${targetNation}. Cost: ${operation.intelInvestment} intel`,
          'success'
        );
      } else {
        onLog('Failed to initiate recruitment. Not enough intel?', 'warning');
      }
    };

    const handleIdiotAction = (idiot: UsefulIdiot, action: 'amplify' | 'protect' | 'burn' | 'extract') => {
      const result = performIdiotAction(gameState, idiot, action);
      if (result.success) {
        onUpdate(gameState);
        onLog(result.narrative, 'success');
      } else {
        onLog(result.narrative, 'warning');
      }
    };

    return (
      <div className="space-y-4">
        {/* Active Useful Idiots */}
        <div>
          <h4 className="text-lg font-semibold mb-2">Active Useful Idiots ({myIdiots.length})</h4>
          {myIdiots.length === 0 ? (
            <p className="text-gray-400 text-sm">No active useful idiots</p>
          ) : (
            <div className="space-y-2">
              {myIdiots.map(idiot => (
                <div key={idiot.id} className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold">{idiot.name}</h5>
                      <p className="text-xs text-gray-400">
                        {idiot.type} in {idiot.nation}
                      </p>
                      <p className="text-xs text-gray-300 italic mt-1">{idiot.coverStory}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded ${
                        idiot.status === 'active' ? 'bg-green-600' :
                        idiot.status === 'compromised' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}>
                        {idiot.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-gray-400">Influence:</span> {idiot.influence}
                    </div>
                    <div>
                      <span className="text-gray-400">Credibility:</span> {idiot.credibility}
                    </div>
                    <div>
                      <span className="text-gray-400">Alignment:</span> {idiot.ideologicalAlignment}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-gray-400">Suspicion:</span> {Math.round(idiot.suspicionLevel)}%
                    </div>
                    <div>
                      <span className="text-gray-400">Exposure Risk:</span> {Math.round(idiot.exposureRisk)}%
                    </div>
                    <div>
                      <span className="text-gray-400">Upkeep:</span> {idiot.intelCostPerTurn} intel/turn
                    </div>
                  </div>

                  <div className="text-xs mb-2">
                    <span className="text-gray-400">Total Impact:</span> {idiot.totalPropagandaValue} propaganda points
                  </div>

                  {idiot.status === 'active' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleIdiotAction(idiot, 'amplify')}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                      >
                        Amplify
                      </button>
                      <button
                        onClick={() => handleIdiotAction(idiot, 'protect')}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                      >
                        Protect
                      </button>
                      <button
                        onClick={() => handleIdiotAction(idiot, 'burn')}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                      >
                        Burn
                      </button>
                      <button
                        onClick={() => handleIdiotAction(idiot, 'extract')}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                      >
                        Extract
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ongoing Recruitment */}
        {myRecruitment.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-2">Ongoing Recruitment ({myRecruitment.length})</h4>
            <div className="space-y-2">
              {myRecruitment.map(op => (
                <div key={op.id} className="bg-gray-700 p-2 rounded text-sm">
                  <div className="flex justify-between">
                    <span>
                      {op.targetType} in {op.targetNation}
                    </span>
                    <span className="text-gray-400">
                      {op.turnsRemaining} turns • {op.successChance}% success
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recruit New Useful Idiot */}
        <div className="border-t border-gray-600 pt-4">
          <h4 className="text-lg font-semibold mb-2">Recruit New Useful Idiot</h4>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
            >
              <option value="">Select Target Nation</option>
              {targetNations.map(n => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTarget && (
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(USEFUL_IDIOT_CONFIG.TYPE_BONUSES) as UsefulIdiotType[]).map(type => {
                const bonus = USEFUL_IDIOT_CONFIG.TYPE_BONUSES[type];
                const cost = Math.floor(USEFUL_IDIOT_CONFIG.RECRUITMENT_BASE_COST * (bonus.cost / 100));

                return (
                  <button
                    key={type}
                    onClick={() => handleRecruitment(type, selectedTarget)}
                    disabled={nation.intel < cost}
                    className={`p-2 rounded text-xs text-left ${
                      nation.intel < cost
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{type}</div>
                    <div className="text-gray-400">
                      Inf: {bonus.influence} | Cred: {bonus.credibility}
                    </div>
                    <div className="text-yellow-400">Cost: {cost} intel</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // PHOBIA CAMPAIGNS TAB
  // ============================================================================

  const renderPhobiasTab = () => {
    const handleLaunchPhobia = (
      targetNation: string,
      type: PhobiaType,
      intensity: PhobiaIntensity
    ) => {
      const campaign = launchPhobiaCampaign(gameState, nation.id, targetNation, type, intensity);

      if (campaign) {
        advancedPropaganda.phobiaCampaigns.push(campaign);
        onUpdate(gameState);
        onLog(
          `Launched ${intensity} ${type} campaign against ${targetNation}`,
          'success'
        );
      } else {
        onLog('Failed to launch phobia campaign. Not enough intel?', 'warning');
      }
    };

    return (
      <div className="space-y-4">
        {/* Active Phobia Campaigns */}
        <div>
          <h4 className="text-lg font-semibold mb-2">Active Phobia Campaigns ({myPhobias.length})</h4>
          {myPhobias.length === 0 ? (
            <p className="text-gray-400 text-sm">No active phobia campaigns</p>
          ) : (
            <div className="space-y-2">
              {myPhobias.map(campaign => (
                <div key={campaign.id} className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold">{campaign.type}</h5>
                      <p className="text-xs text-gray-400">
                        Target: {campaign.targetNation} | {campaign.intensity}
                      </p>
                    </div>
                    {campaign.discovered && (
                      <span className="px-2 py-1 text-xs bg-red-600 rounded">DISCOVERED</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-gray-400">Fear Level:</span> {Math.round(campaign.currentPhobiaLevel)}%
                    </div>
                    <div>
                      <span className="text-gray-400">Paranoia:</span> {Math.round(campaign.paranoia)}%
                    </div>
                    <div>
                      <span className="text-gray-400">Radicalized:</span> {campaign.radicalizedPops}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Upkeep:</span> {campaign.intelCostPerTurn} intel/turn
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span> {campaign.turnsActive}/{campaign.totalDuration}
                    </div>
                  </div>

                  {campaign.violentIncidents > 0 && (
                    <div className="mt-2 text-xs text-red-400">
                      ⚠️ {campaign.violentIncidents} violent incidents
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Launch New Phobia Campaign */}
        <div className="border-t border-gray-600 pt-4">
          <h4 className="text-lg font-semibold mb-2">Launch Phobia Campaign</h4>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
            >
              <option value="">Select Target Nation</option>
              {targetNations.map(n => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTarget && (
            <div className="space-y-3">
              {(Object.keys(PHOBIA_CAMPAIGN_CONFIG.INTENSITY_COSTS) as PhobiaIntensity[]).map(intensity => (
                <div key={intensity} className="bg-gray-700 p-3 rounded">
                  <h5 className="font-semibold mb-2 capitalize">{intensity} Intensity</h5>
                  <div className="text-xs text-gray-400 mb-2">
                    Cost: {PHOBIA_CAMPAIGN_CONFIG.INTENSITY_COSTS[intensity]} intel |
                    Detection: {PHOBIA_CAMPAIGN_CONFIG.DETECTION_RISKS[intensity]}% |
                    Spread: {PHOBIA_CAMPAIGN_CONFIG.SPREAD_RATES[intensity]}/turn
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(PHOBIA_CAMPAIGN_CONFIG.EFFECTS_MULTIPLIER) as PhobiaType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => handleLaunchPhobia(selectedTarget, type, intensity)}
                        disabled={nation.intel < PHOBIA_CAMPAIGN_CONFIG.INTENSITY_COSTS[intensity]}
                        className={`p-2 rounded text-xs ${
                          nation.intel < PHOBIA_CAMPAIGN_CONFIG.INTENSITY_COSTS[intensity]
                            ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      >
                        {type.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RELIGIOUS WEAPONS TAB
  // ============================================================================

  const renderReligiousTab = () => {
    const handleDeployReligious = (targetNations: string[], type: ReligiousWeaponType) => {
      const weapon = deployReligiousWeapon(gameState, nation.id, targetNations, type);

      if (weapon) {
        advancedPropaganda.religiousWeapons.push(weapon);
        onUpdate(gameState);
        onLog(
          `Deployed ${type} against ${targetNations.join(', ')}`,
          'success'
        );
      } else {
        onLog('Failed to deploy religious weapon. Not enough intel or incompatible ideology?', 'warning');
      }
    };

    return (
      <div className="space-y-4">
        {/* Active Religious Weapons */}
        <div>
          <h4 className="text-lg font-semibold mb-2">Active Religious Weapons ({myReligious.length})</h4>
          {myReligious.length === 0 ? (
            <p className="text-gray-400 text-sm">No active religious weapons</p>
          ) : (
            <div className="space-y-2">
              {myReligious.map(weapon => (
                <div key={weapon.id} className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold">{weapon.type.replace(/_/g, ' ')}</h5>
                      <p className="text-xs text-gray-400">
                        Targets: {weapon.targetNations.join(', ')}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {weapon.turnsActive} turns active
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-gray-400">Fervor:</span> {Math.round(weapon.fervor)}
                    </div>
                    <div>
                      <span className="text-gray-400">Reach:</span> {Math.round(weapon.reach)}
                    </div>
                    <div>
                      <span className="text-gray-400">Conviction:</span> {Math.round(weapon.conviction)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="text-green-400">
                      +{weapon.populationMoraleBonus} Morale | +{weapon.unitCombatBonus} Combat
                    </div>
                    <div className="text-red-400">
                      {weapon.destabilizationEffect} Target Destab
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Upkeep:</span> {weapon.intelCostPerTurn} intel/turn
                    </div>
                    <div>
                      <span className="text-gray-400">Conversions:</span> {weapon.ideologicalConversion}
                    </div>
                    <div>
                      <span className="text-red-400">Extremism Risk:</span> {Math.round(weapon.extremismRisk)}%
                    </div>
                  </div>

                  {weapon.resistanceMovements > 0 && (
                    <div className="mt-2 text-xs text-yellow-400">
                      ⚠️ {weapon.resistanceMovements} resistance movements sparked
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deploy New Religious Weapon */}
        <div className="border-t border-gray-600 pt-4">
          <h4 className="text-lg font-semibold mb-2">Deploy Religious Weapon</h4>
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2">
              Current Ideology: {nation.ideologyState?.currentIdeology || 'none'}
            </p>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="bg-gray-700 text-white rounded px-2 py-1 text-sm w-full"
            >
              <option value="">Select Target Nation</option>
              {targetNations.map(n => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTarget && (
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(RELIGIOUS_WEAPON_CONFIG.BASE_COSTS) as ReligiousWeaponType[]).map(type => {
                const cost = RELIGIOUS_WEAPON_CONFIG.BASE_COSTS[type];
                const bonuses = RELIGIOUS_WEAPON_CONFIG.FERVOR_BONUSES[type];
                const compatible = RELIGIOUS_WEAPON_CONFIG.IDEOLOGY_COMPATIBILITY[type];
                const isCompatible = !nation.ideologyState?.currentIdeology ||
                  compatible.includes(nation.ideologyState.currentIdeology);

                return (
                  <button
                    key={type}
                    onClick={() => handleDeployReligious([selectedTarget], type)}
                    disabled={nation.intel < cost || !isCompatible}
                    className={`p-2 rounded text-xs text-left ${
                      !isCompatible
                        ? 'bg-red-900 text-gray-500 cursor-not-allowed'
                        : nation.intel < cost
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{type.replace(/_/g, ' ')}</div>
                    <div className="text-gray-400 text-xs">
                      {bonuses.morale && `+${bonuses.morale} morale`}
                      {bonuses.combat && ` +${bonuses.combat} combat`}
                    </div>
                    <div className="text-yellow-400">Cost: {cost} intel</div>
                    {!isCompatible && (
                      <div className="text-red-400 text-xs mt-1">Incompatible ideology</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="p-4 bg-gray-800 rounded text-white">
      <h3 className="text-xl font-bold mb-4">Advanced Propaganda Operations</h3>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
        <div className="bg-gray-700 p-2 rounded">
          <div className="text-gray-400">Active Idiots</div>
          <div className="text-2xl font-bold">{myIdiots.length}</div>
        </div>
        <div className="bg-gray-700 p-2 rounded">
          <div className="text-gray-400">Phobia Campaigns</div>
          <div className="text-2xl font-bold">{myPhobias.length}</div>
        </div>
        <div className="bg-gray-700 p-2 rounded">
          <div className="text-gray-400">Religious Weapons</div>
          <div className="text-2xl font-bold">{myReligious.length}</div>
        </div>
        <div className="bg-gray-700 p-2 rounded">
          <div className="text-gray-400">Intel Available</div>
          <div className="text-2xl font-bold text-yellow-400">{nation.intel}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('idiots')}
          className={`px-4 py-2 rounded ${
            activeTab === 'idiots' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Useful Idiots
        </button>
        <button
          onClick={() => setActiveTab('phobias')}
          className={`px-4 py-2 rounded ${
            activeTab === 'phobias' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Phobia Campaigns
        </button>
        <button
          onClick={() => setActiveTab('religious')}
          className={`px-4 py-2 rounded ${
            activeTab === 'religious' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Religious Weapons
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'idiots' && renderIdiotsTab()}
        {activeTab === 'phobias' && renderPhobiasTab()}
        {activeTab === 'religious' && renderReligiousTab()}
      </div>
    </div>
  );
}
