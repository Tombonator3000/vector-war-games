/**
 * Economic Dashboard
 *
 * Unified dashboard combining Trade, Refinement, and Infrastructure systems.
 * Phase 3: Economic Depth - Hearts of Iron IV inspired.
 */

import React, { useState } from 'react';
import { EnhancedTradePanel } from './EnhancedTradePanel';
import { ResourceRefinementPanel } from './ResourceRefinementPanel';
import { EconomicInfrastructurePanel } from './EconomicInfrastructurePanel';
import type { Nation } from '@/types/game';
import type { EconomicDepthState, EconomicPower } from '@/types/economicDepth';
import {
  TrendingUp,
  DollarSign,
  Award,
  BarChart3,
  Building2,
  Factory,
  Ship,
  X,
} from 'lucide-react';

interface EconomicDashboardProps {
  currentNation: Nation;
  allNations: Nation[];
  economicState: EconomicDepthState;
  economicPower: EconomicPower;
  recommendations: string[];
  onClose?: () => void;

  // Trade actions
  onAcceptTradeProposal?: (proposalId: string) => void;
  onRejectTradeProposal?: (proposalId: string) => void;
  onCreateTradeProposal?: () => void;
  onCancelTradeAgreement?: (agreementId: string) => void;

  // Refinement actions
  onToggleRefinery?: (refineryId: string, pause: boolean) => void;
  onUpgradeRefinery?: (refineryId: string) => void;
  onBuildRefinery?: () => void;

  // Infrastructure actions
  onBuildInfrastructure?: () => void;
  onUpgradeInfrastructure?: (buildingId: string) => void;
  onRepairInfrastructure?: (buildingId: string) => void;
  onCreateEconomicZone?: () => void;
}

export function EconomicDashboard({
  currentNation,
  allNations,
  economicState,
  economicPower,
  recommendations,
  onClose,
  onAcceptTradeProposal,
  onRejectTradeProposal,
  onCreateTradeProposal,
  onCancelTradeAgreement,
  onToggleRefinery,
  onUpgradeRefinery,
  onBuildRefinery,
  onBuildInfrastructure,
  onUpgradeInfrastructure,
  onRepairInfrastructure,
  onCreateEconomicZone,
}: EconomicDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trade' | 'refinement' | 'infrastructure'>('overview');

  const refinedStockpile = economicState.refinedStockpiles.get(currentNation.id) || {
    fuel: 0,
    enriched_uranium: 0,
    advanced_materials: 0,
    steel: 0,
    electronics: 0,
    processed_food: 0,
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-blue-500/50 rounded-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Economic Dashboard
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Trade · Refinement · Infrastructure
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Economic Power Score */}
              <div className="bg-black/30 rounded-lg px-4 py-2 border border-purple-500/30">
                <div className="text-xs text-gray-400 mb-1">Economic Power</div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span className="text-2xl font-bold text-purple-400">
                    {economicPower.totalScore}
                  </span>
                  <span className="text-sm text-gray-400">
                    Rank #{economicPower.globalRank}
                  </span>
                </div>
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400 hover:text-red-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700 px-4 bg-gray-800/50">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'trade', label: 'Trade', icon: Ship },
            { id: 'refinement', label: 'Refinement', icon: Factory },
            { id: 'infrastructure', label: 'Infrastructure', icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="text-center text-gray-400 py-8">
              <p className="text-lg mb-2">Economic Overview</p>
              <p className="text-sm">Phase 3 Implementation Complete</p>
              <p className="text-xs mt-4">Trade Routes · Resource Refinement · Infrastructure</p>
            </div>
          )}

          {activeTab === 'trade' && (
            <EnhancedTradePanel
              currentNation={currentNation}
              allNations={allNations}
              tradeAgreements={economicState.tradeAgreements}
              tradeRoutes={economicState.tradeRoutes}
              tradeProposals={economicState.tradeProposals}
              economicSanctions={economicState.economicSanctions}
              onAcceptProposal={onAcceptTradeProposal}
              onRejectProposal={onRejectTradeProposal}
              onCreateProposal={onCreateTradeProposal}
              onCancelAgreement={onCancelTradeAgreement}
            />
          )}

          {activeTab === 'refinement' && (
            <ResourceRefinementPanel
              currentNation={currentNation}
              refineries={economicState.refineries.filter(
                (r) => r.nationId === currentNation.id
              )}
              refinedStockpile={refinedStockpile}
              onToggleRefinery={onToggleRefinery}
              onUpgradeRefinery={onUpgradeRefinery}
              onBuildRefinery={onBuildRefinery}
            />
          )}

          {activeTab === 'infrastructure' && (
            <EconomicInfrastructurePanel
              currentNation={currentNation}
              infrastructure={economicState.economicInfrastructure.filter(
                (i) => i.nationId === currentNation.id
              )}
              economicZones={economicState.economicZones.filter(
                (z) => z.nationId === currentNation.id
              )}
              onBuildInfrastructure={onBuildInfrastructure}
              onUpgradeInfrastructure={onUpgradeInfrastructure}
              onRepairInfrastructure={onRepairInfrastructure}
              onCreateEconomicZone={onCreateEconomicZone}
            />
          )}
        </div>
      </div>
    </div>
  );
}
