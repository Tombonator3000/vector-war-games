import React from 'react';
import { X, Handshake, Shield, Gift, Scale, Sword, Flag } from 'lucide-react';
import { DiplomacyProposal, ProposalType } from '@/types/diplomacy';
import { Nation } from '@/types/game';
import { TrustAndFavorsDisplay } from './TrustAndFavorsDisplay';

interface DiplomacyProposalOverlayProps {
  proposal: DiplomacyProposal;
  proposer: Nation;
  target: Nation;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

const proposalIcons: Record<ProposalType, React.ReactNode> = {
  alliance: <Handshake className="w-8 h-8" />,
  truce: <Flag className="w-8 h-8" />,
  'non-aggression': <Shield className="w-8 h-8" />,
  'aid-request': <Gift className="w-8 h-8" />,
  'sanction-lift': <Scale className="w-8 h-8" />,
  'joint-war': <Sword className="w-8 h-8" />,
  'demand-surrender': <Flag className="w-8 h-8 text-red-500" />,
  'peace-offer': <Handshake className="w-8 h-8 text-green-500" />
};

const proposalTitles: Record<ProposalType, string> = {
  alliance: 'Alliance Proposal',
  truce: 'Truce Proposal',
  'non-aggression': 'Non-Aggression Pact',
  'aid-request': 'Request for Aid',
  'sanction-lift': 'Sanction Lift Request',
  'joint-war': 'Joint Military Campaign',
  'demand-surrender': 'Demand for Tribute',
  'peace-offer': 'Peace Offer'
};

const proposalColors: Record<ProposalType, string> = {
  alliance: 'from-green-900/50 to-green-800/30',
  truce: 'from-blue-900/50 to-blue-800/30',
  'non-aggression': 'from-cyan-900/50 to-cyan-800/30',
  'aid-request': 'from-yellow-900/50 to-yellow-800/30',
  'sanction-lift': 'from-purple-900/50 to-purple-800/30',
  'joint-war': 'from-red-900/50 to-red-800/30',
  'demand-surrender': 'from-red-950/50 to-red-900/30',
  'peace-offer': 'from-emerald-900/50 to-emerald-800/30'
};

export function DiplomacyProposalOverlay({
  proposal,
  proposer,
  target,
  onAccept,
  onReject,
  onClose
}: DiplomacyProposalOverlayProps) {
  const icon = proposalIcons[proposal.type];
  const title = proposalTitles[proposal.type];
  const colorGradient = proposalColors[proposal.type];

  const renderProposalDetails = () => {
    switch (proposal.type) {
      case 'alliance':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <span className="text-yellow-400">Cost:</span> 10 Production, 40 Intel
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-green-400">Benefits:</span> Permanent peace, shared vision, mutual defense
            </p>
          </div>
        );

      case 'truce':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <span className="text-blue-400">Duration:</span> {proposal.terms.duration} turns
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-green-400">Effect:</span> Temporary ceasefire, no hostile actions
            </p>
          </div>
        );

      case 'non-aggression':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <span className="text-yellow-400">Cost:</span> 15 Intel
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-blue-400">Duration:</span> 5 turns
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-green-400">Effect:</span> No attacks, improved relations
            </p>
          </div>
        );

      case 'aid-request':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <span className="text-yellow-400">Cost:</span> 20 Production
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-green-400">Benefit:</span> Improved relations with {proposer.name}
            </p>
            <p className="text-sm text-gray-400 italic">
              {proposer.name} is experiencing instability and requests aid.
            </p>
          </div>
        );

      case 'sanction-lift':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              Lift economic sanctions against {proposer.name}
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-green-400">Effect:</span> Restore trade relations
            </p>
          </div>
        );

      case 'joint-war':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              Join {proposer.name} in war against a common enemy
            </p>
            <p className="text-sm text-red-400">
              <span className="font-semibold">Warning:</span> This will declare war
            </p>
          </div>
        );

      case 'demand-surrender':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <span className="text-red-400">Tribute Demanded:</span> {proposal.terms.tributeAmount} Production
            </p>
            <p className="text-sm text-red-400">
              <span className="font-semibold">Warning:</span> Refusing may provoke retaliation
            </p>
          </div>
        );

      case 'peace-offer':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              End hostilities and restore peaceful relations
            </p>
            <p className="text-sm text-green-400">
              <span className="text-green-400">Effect:</span> Immediate ceasefire
            </p>
          </div>
        );
    }
  };

  const getThreatLevel = () => {
    const threat = target.threats?.[proposer.id] || 0;
    if (threat >= 15) return { text: 'Hostile', color: 'text-red-500' };
    if (threat >= 8) return { text: 'Tense', color: 'text-orange-500' };
    if (threat >= 3) return { text: 'Cautious', color: 'text-yellow-500' };
    return { text: 'Neutral', color: 'text-green-500' };
  };

  const threatLevel = getThreatLevel();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative w-full max-w-2xl mx-4 bg-gradient-to-br ${colorGradient} border border-gray-700 rounded-lg shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="relative border-b border-gray-700 bg-black/40 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-black/40 rounded-full border border-gray-600">
              {icon}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="text-sm text-gray-400 mt-1">
                From: <span className="font-semibold" style={{ color: proposer.color }}>{proposer.name}</span>
                {' '}({proposer.leader})
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Diplomatic Message */}
          <div className="bg-black/40 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-2">Diplomatic Message:</p>
            <p className="text-white italic">"{proposal.message}"</p>
          </div>

          {/* Proposal Details */}
          <div className="bg-black/40 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-3">Proposal Details:</p>
            {renderProposalDetails()}
          </div>

          {/* Current Relations */}
          <div className="bg-black/40 border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-400">Current Relations:</p>
                <p className={`text-lg font-semibold ${threatLevel.color}`}>{threatLevel.text}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Military Power:</p>
                <div className="flex items-center gap-2">
                  <div className="text-sm">
                    <span className="text-white font-semibold">{proposer.missiles}</span>
                    <span className="text-gray-400 text-xs ml-1">missiles</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-white font-semibold">{proposer.defense}</span>
                    <span className="text-gray-400 text-xs ml-1">defense</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust and Favors Display */}
            <TrustAndFavorsDisplay nation={target} targetNation={proposer} />
          </div>

          {/* Terms Reminder */}
          {proposal.terms?.reason && (
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
              <p className="text-sm text-amber-300">
                <span className="font-semibold">Note:</span> {proposal.terms.reason}
              </p>
            </div>
          )}
        </div>

        {/* Footer - Action Buttons */}
        <div className="border-t border-gray-700 bg-black/40 p-6">
          <div className="flex gap-4">
            <button
              onClick={onReject}
              className="flex-1 px-6 py-3 bg-red-900/50 hover:bg-red-800/50 border border-red-700 text-white rounded-lg transition-colors font-semibold"
            >
              Reject
            </button>
            <button
              onClick={onAccept}
              className="flex-1 px-6 py-3 bg-green-900/50 hover:bg-green-800/50 border border-green-700 text-white rounded-lg transition-colors font-semibold"
            >
              Accept
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            Rejecting this proposal will damage relations with {proposer.name}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DiplomacyProposalOverlay;
