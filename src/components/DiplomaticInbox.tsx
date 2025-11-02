import React, { useState } from 'react';
import {
  X,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Eye,
  Trash2,
} from 'lucide-react';
import type { AIInitiatedNegotiation, NegotiationPurpose, NegotiationUrgency } from '@/types/negotiation';
import type { Nation } from '@/types/game';

interface DiplomaticInboxProps {
  isOpen: boolean;
  onClose: () => void;
  pendingNegotiations: AIInitiatedNegotiation[];
  completedNegotiations: CompletedNegotiation[];
  allNations: Nation[];
  currentTurn: number;
  onViewNegotiation: (negotiation: AIInitiatedNegotiation) => void;
  onDeleteNegotiation: (negotiationId: string) => void;
}

export interface CompletedNegotiation {
  negotiation: AIInitiatedNegotiation;
  outcome: 'accepted' | 'rejected' | 'expired';
  resolvedTurn: number;
}

type FilterType = 'all' | 'pending' | 'completed';

// ============================================================================
// Helper Functions
// ============================================================================

function getUrgencyColor(urgency: NegotiationUrgency): string {
  switch (urgency) {
    case 'critical': return 'text-red-400';
    case 'high': return 'text-orange-400';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-blue-400';
  }
}

function getUrgencyIcon(urgency: NegotiationUrgency): React.ReactNode {
  switch (urgency) {
    case 'critical':
    case 'high':
      return <AlertCircle className="w-4 h-4" />;
    case 'medium':
      return <Clock className="w-4 h-4" />;
    case 'low':
      return <Inbox className="w-4 h-4" />;
  }
}

function getPurposeLabel(purpose: NegotiationPurpose): string {
  const labels: Record<NegotiationPurpose, string> = {
    'request-help': 'Help Request',
    'offer-alliance': 'Alliance',
    'reconciliation': 'Reconciliation',
    'demand-compensation': 'Compensation',
    'warning': 'Warning',
    'peace-offer': 'Peace',
    'trade-opportunity': 'Trade',
    'mutual-defense': 'Defense Pact',
    'joint-venture': 'Joint Venture',
  };
  return labels[purpose];
}

function getOutcomeIcon(outcome: CompletedNegotiation['outcome']): React.ReactNode {
  switch (outcome) {
    case 'accepted':
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'expired':
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

// ============================================================================
// Component
// ============================================================================

export function DiplomaticInbox({
  isOpen,
  onClose,
  pendingNegotiations,
  completedNegotiations,
  allNations,
  currentTurn,
  onViewNegotiation,
  onDeleteNegotiation,
}: DiplomaticInboxProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) {
    return null;
  }

  // Filter negotiations
  const filteredPending = pendingNegotiations.filter(neg => {
    if (filter === 'completed') return false;
    const aiNation = allNations.find(n => n.id === neg.aiNationId);
    if (searchTerm && aiNation) {
      return aiNation.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const filteredCompleted = completedNegotiations.filter(comp => {
    if (filter === 'pending') return false;
    const aiNation = allNations.find(n => n.id === comp.negotiation.aiNationId);
    if (searchTerm && aiNation) {
      return aiNation.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Inbox className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Diplomatic Inbox</h2>
              <p className="text-xs text-gray-400">
                {filteredPending.length} pending, {filteredCompleted.length} completed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 p-4 bg-black/20 border-b border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`
                px-3 py-1 rounded text-sm font-medium transition-colors
                ${filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`
                px-3 py-1 rounded text-sm font-medium transition-colors
                ${filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              Pending ({pendingNegotiations.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`
                px-3 py-1 rounded text-sm font-medium transition-colors
                ${filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              Completed ({completedNegotiations.length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Search by nation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              flex-1 px-3 py-1 rounded text-sm
              bg-gray-700 border border-gray-600
              text-white placeholder-gray-400
              focus:outline-none focus:border-blue-500
            "
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Pending Negotiations */}
          {filteredPending.length > 0 && (
            <div className="space-y-2">
              {filter !== 'completed' && (
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Pending
                </h3>
              )}
              {filteredPending.map((negotiation) => {
                const aiNation = allNations.find(n => n.id === negotiation.aiNationId);
                if (!aiNation) return null;

                const turnsRemaining = negotiation.expiresAtTurn - currentTurn;
                const isExpiringSoon = turnsRemaining <= 2;

                return (
                  <div
                    key={negotiation.proposedDeal.id}
                    className={`
                      bg-gradient-to-r from-gray-800/50 to-gray-700/30
                      border rounded-lg p-3
                      hover:border-blue-500/50 transition-colors
                      ${isExpiringSoon ? 'border-orange-500/50' : 'border-gray-600'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="w-3 h-3 rounded-full mt-1"
                          style={{ backgroundColor: aiNation.color }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white text-sm">
                              {aiNation.name}
                            </h4>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">
                              {getPurposeLabel(negotiation.purpose)}
                            </span>
                            <div className={`flex items-center gap-1 ${getUrgencyColor(negotiation.urgency)}`}>
                              {getUrgencyIcon(negotiation.urgency)}
                              <span className="text-xs">{negotiation.urgency}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {negotiation.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-green-400">
                              Offers: {negotiation.proposedDeal.offerItems.length}
                            </span>
                            <span className="text-blue-400">
                              Requests: {negotiation.proposedDeal.requestItems.length}
                            </span>
                            <span className={isExpiringSoon ? 'text-orange-400 font-semibold' : 'text-gray-400'}>
                              Expires: {turnsRemaining} turn{turnsRemaining !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewNegotiation(negotiation)}
                          className="
                            p-2 rounded
                            bg-blue-600 hover:bg-blue-500
                            text-white transition-colors
                          "
                          title="View negotiation"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteNegotiation(negotiation.proposedDeal.id)}
                          className="
                            p-2 rounded
                            bg-gray-700 hover:bg-gray-600
                            text-gray-300 transition-colors
                          "
                          title="Dismiss"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed Negotiations */}
          {filteredCompleted.length > 0 && (
            <div className="space-y-2">
              {filter !== 'pending' && (
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mt-4">
                  Completed
                </h3>
              )}
              {filteredCompleted.map((completed) => {
                const aiNation = allNations.find(n => n.id === completed.negotiation.aiNationId);
                if (!aiNation) return null;

                return (
                  <div
                    key={completed.negotiation.proposedDeal.id}
                    className="
                      bg-gradient-to-r from-gray-800/30 to-gray-700/20
                      border border-gray-700 rounded-lg p-3
                      opacity-75
                    "
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1"
                        style={{ backgroundColor: aiNation.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getOutcomeIcon(completed.outcome)}
                          <h4 className="font-semibold text-gray-300 text-sm">
                            {aiNation.name}
                          </h4>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {getPurposeLabel(completed.negotiation.purpose)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({completed.outcome})
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Resolved on turn {completed.resolvedTurn}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredPending.length === 0 && filteredCompleted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Inbox className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm">No negotiations found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 bg-black/20 border-t border-gray-700">
          <button
            onClick={onClose}
            className="
              px-4 py-2 rounded font-medium text-sm
              bg-gray-700 hover:bg-gray-600
              text-white transition-colors
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
