/**
 * Enhanced Trade System Panel
 *
 * Displays trade routes, agreements, proposals, and sanctions.
 * Part of Phase 3: Economic Depth implementation.
 */

import React, { useState } from 'react';
import type {
  TradeAgreement,
  EnhancedTradeRoute,
  TradeProposal,
  EconomicSanction,
} from '@/types/economicDepth';
import type { Nation } from '@/types/game';
import { RESOURCE_INFO } from '@/types/territorialResources';
import {
  TrendingUp,
  TrendingDown,
  Ship,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  Ban,
  Globe,
} from 'lucide-react';

interface EnhancedTradePanelProps {
  currentNation: Nation;
  allNations: Nation[];
  tradeAgreements: TradeAgreement[];
  tradeRoutes: EnhancedTradeRoute[];
  tradeProposals: TradeProposal[];
  economicSanctions: EconomicSanction[];
  onAcceptProposal?: (proposalId: string) => void;
  onRejectProposal?: (proposalId: string) => void;
  onCreateProposal?: () => void;
  onCancelAgreement?: (agreementId: string) => void;
  compact?: boolean;
}

export function EnhancedTradePanel({
  currentNation,
  allNations,
  tradeAgreements,
  tradeRoutes,
  tradeProposals,
  economicSanctions,
  onAcceptProposal,
  onRejectProposal,
  onCreateProposal,
  onCancelAgreement,
  compact = false,
}: EnhancedTradePanelProps) {
  const [activeTab, setActiveTab] = useState<'routes' | 'agreements' | 'proposals' | 'sanctions'>('routes');

  // Filter data for current nation
  const myTradeRoutes = tradeRoutes.filter(
    (route) =>
      route.fromNationId === currentNation.id ||
      route.toNationId === currentNation.id
  );

  const myAgreements = tradeAgreements.filter((agreement) =>
    agreement.participantIds.includes(currentNation.id)
  );

  const myProposals = tradeProposals.filter(
    (proposal) =>
      proposal.proposerId === currentNation.id ||
      proposal.targetNationId === currentNation.id
  );

  const relevantSanctions = economicSanctions.filter(
    (sanction) =>
      sanction.issuingNationId === currentNation.id ||
      sanction.targetNationId === currentNation.id
  );

  // Calculate trade stats
  const totalExports = myTradeRoutes
    .filter((route) => route.fromNationId === currentNation.id)
    .reduce((sum, route) => sum + route.amountPerTurn, 0);

  const totalImports = myTradeRoutes
    .filter((route) => route.toNationId === currentNation.id)
    .reduce((sum, route) => sum + route.amountPerTurn, 0);

  const tradeBalance = totalExports - totalImports;

  const tradePartners = new Set([
    ...myTradeRoutes.map((r) => r.fromNationId),
    ...myTradeRoutes.map((r) => r.toNationId),
  ]);
  tradePartners.delete(currentNation.id);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Trade Routes</span>
          <span className="text-green-400">{myTradeRoutes.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Trade Balance</span>
          <span
            className={
              tradeBalance > 0
                ? 'text-green-400'
                : tradeBalance < 0
                ? 'text-red-400'
                : 'text-gray-400'
            }
          >
            {tradeBalance > 0 ? '+' : ''}
            {tradeBalance}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Partners</span>
          <span className="text-blue-400">{tradePartners.size}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trade Statistics Header */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-400 text-xs font-semibold mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Exports</span>
          </div>
          <div className="text-xl font-bold">{totalExports}</div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
            <TrendingDown className="w-4 h-4" />
            <span>Imports</span>
          </div>
          <div className="text-xl font-bold">{totalImports}</div>
        </div>

        <div
          className={`${
            tradeBalance >= 0
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          } border rounded-lg p-3`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold mb-1">
            <Globe className="w-4 h-4" />
            <span>Balance</span>
          </div>
          <div
            className={`text-xl font-bold ${
              tradeBalance >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {tradeBalance > 0 ? '+' : ''}
            {tradeBalance}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-600/50">
        {[
          { id: 'routes', label: 'Trade Routes', count: myTradeRoutes.length },
          { id: 'agreements', label: 'Agreements', count: myAgreements.length },
          { id: 'proposals', label: 'Proposals', count: myProposals.length },
          { id: 'sanctions', label: 'Sanctions', count: relevantSanctions.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activeTab === 'routes' && (
          <>
            {myTradeRoutes.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No active trade routes
              </div>
            ) : (
              myTradeRoutes.map((route) => (
                <TradeRouteCard key={route.id} route={route} allNations={allNations} />
              ))
            )}
          </>
        )}

        {activeTab === 'agreements' && (
          <>
            {myAgreements.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No active trade agreements
              </div>
            ) : (
              myAgreements.map((agreement) => (
                <TradeAgreementCard
                  key={agreement.id}
                  agreement={agreement}
                  allNations={allNations}
                  onCancel={onCancelAgreement}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'proposals' && (
          <>
            {myProposals.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No pending trade proposals
                <button
                  onClick={onCreateProposal}
                  className="mt-2 block mx-auto px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-sm"
                >
                  Create New Proposal
                </button>
              </div>
            ) : (
              myProposals.map((proposal) => (
                <TradeProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  currentNationId={currentNation.id}
                  allNations={allNations}
                  onAccept={onAcceptProposal}
                  onReject={onRejectProposal}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'sanctions' && (
          <>
            {relevantSanctions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No active economic sanctions
              </div>
            ) : (
              relevantSanctions.map((sanction) => (
                <SanctionCard
                  key={sanction.id}
                  sanction={sanction}
                  allNations={allNations}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TradeRouteCard({
  route,
  allNations,
}: {
  route: EnhancedTradeRoute;
  allNations: Nation[];
}) {
  const fromNation = allNations.find((n) => n.id === route.fromNationId);
  const toNation = allNations.find((n) => n.id === route.toNationId);
  const resourceInfo = RESOURCE_INFO[route.resourceType];

  const statusColor =
    route.status === 'active'
      ? 'green'
      : route.status === 'disrupted'
      ? 'amber'
      : 'red';

  return (
    <div
      className={`bg-gray-800/50 border border-${statusColor}-500/30 rounded-lg p-3`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Ship className={`w-4 h-4 text-${statusColor}-400`} />
            <span className="font-semibold text-sm">
              {fromNation?.name || 'Unknown'} → {toNation?.name || 'Unknown'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span>{resourceInfo.icon}</span>
              <span>{resourceInfo.name}</span>
              <span className="font-bold text-blue-400">
                {route.amountPerTurn}/turn
              </span>
            </div>

            <div className="text-gray-400">
              Efficiency: {(route.efficiency * 100).toFixed(0)}%
            </div>
          </div>

          {route.status !== 'active' && (
            <div className="mt-2 text-xs text-amber-400">
              {route.lastDisruptionReason || 'Route disrupted'}
              {route.turnsDisrupted > 0 && ` (${route.turnsDisrupted} turns)`}
            </div>
          )}
        </div>

        <div className="text-right text-xs">
          <div className="font-semibold text-gray-400">Maintenance</div>
          <div className="text-amber-400">{route.maintenanceCost}/turn</div>
        </div>
      </div>
    </div>
  );
}

function TradeAgreementCard({
  agreement,
  allNations,
  onCancel,
}: {
  agreement: TradeAgreement;
  allNations: Nation[];
  onCancel?: (agreementId: string) => void;
}) {
  const participants = agreement.participantIds
    .map((id) => allNations.find((n) => n.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-sm">{agreement.name}</div>
          <div className="text-xs text-gray-400 mt-1">{participants}</div>
        </div>
        <div
          className={`text-xs px-2 py-1 rounded ${
            agreement.status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {agreement.status}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-gray-400">Duration: </span>
          <span>{agreement.duration} turns remaining</span>
        </div>

        {onCancel && agreement.status === 'active' && (
          <button
            onClick={() => onCancel(agreement.id)}
            className="text-red-400 hover:text-red-300"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function TradeProposalCard({
  proposal,
  currentNationId,
  allNations,
  onAccept,
  onReject,
}: {
  proposal: TradeProposal;
  currentNationId: string;
  allNations: Nation[];
  onAccept?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
}) {
  const proposer = allNations.find((n) => n.id === proposal.proposerId);
  const target = allNations.find((n) => n.id === proposal.targetNationId);
  const isReceiver = proposal.targetNationId === currentNationId;

  return (
    <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-sm">
            {isReceiver ? 'Incoming' : 'Outgoing'} Proposal
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {proposer?.name} → {target?.name}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Expires turn {proposal.expiresAtTurn}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-400 mb-1">Offering:</div>
          {Object.entries(proposal.offering).map(([resource, amount]) => (
            <div key={resource} className="flex items-center gap-1">
              <span>{RESOURCE_INFO[resource as keyof typeof RESOURCE_INFO]?.icon}</span>
              <span>{amount}</span>
            </div>
          ))}
        </div>

        <div>
          <div className="text-gray-400 mb-1">Requesting:</div>
          {Object.entries(proposal.requesting).map(([resource, amount]) => (
            <div key={resource} className="flex items-center gap-1">
              <span>{RESOURCE_INFO[resource as keyof typeof RESOURCE_INFO]?.icon}</span>
              <span>{amount}</span>
            </div>
          ))}
        </div>
      </div>

      {isReceiver && proposal.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          {onAccept && (
            <button
              onClick={() => onAccept(proposal.id)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded text-xs text-green-400"
            >
              <CheckCircle className="w-3 h-3" />
              Accept
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(proposal.id)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-xs text-red-400"
            >
              <XCircle className="w-3 h-3" />
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SanctionCard({
  sanction,
  allNations,
}: {
  sanction: EconomicSanction;
  allNations: Nation[];
}) {
  const issuer = allNations.find((n) => n.id === sanction.issuingNationId);
  const target = allNations.find((n) => n.id === sanction.targetNationId);

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
      <div className="flex items-start gap-2 mb-2">
        <Ban className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-sm text-red-400">
            {sanction.type.replace(/_/g, ' ').toUpperCase()}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {issuer?.name} → {target?.name}
          </div>
        </div>
      </div>

      <div className="text-xs space-y-1">
        <div>
          <span className="text-gray-400">Trade Reduction: </span>
          <span className="text-red-400">{sanction.tradeReduction}%</span>
        </div>
        <div>
          <span className="text-gray-400">Duration: </span>
          <span>{sanction.duration} turns</span>
        </div>
        {sanction.supportingNations.length > 0 && (
          <div>
            <span className="text-gray-400">Support: </span>
            <span className="text-blue-400">
              {sanction.supportingNations.length} nations
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
