import React from 'react';
import {
  X,
  Handshake,
  Shield,
  AlertTriangle,
  Gift,
  Users,
  Heart,
  Scale,
  DollarSign,
  Swords
} from 'lucide-react';
import type { AIInitiatedNegotiation, NegotiationPurpose, NegotiationUrgency } from '@/types/negotiation';
import type { Nation } from '@/types/game';

interface AINegotiationNotificationProps {
  negotiation: AIInitiatedNegotiation;
  aiNation: Nation;
  onView: () => void;
  onDismiss: () => void;
}

// ============================================================================
// Visual Configuration
// ============================================================================

const purposeIcons: Record<NegotiationPurpose, React.ReactNode> = {
  'request-help': <Shield className="w-6 h-6" />,
  'offer-alliance': <Handshake className="w-6 h-6" />,
  'reconciliation': <Heart className="w-6 h-6" />,
  'demand-compensation': <Scale className="w-6 h-6" />,
  'warning': <AlertTriangle className="w-6 h-6" />,
  'peace-offer': <Handshake className="w-6 h-6 text-green-400" />,
  'trade-opportunity': <Gift className="w-6 h-6" />,
  'mutual-defense': <Shield className="w-6 h-6" />,
  'joint-venture': <Users className="w-6 h-6" />,
};

const purposeTitles: Record<NegotiationPurpose, string> = {
  'request-help': 'Request for Assistance',
  'offer-alliance': 'Alliance Proposal',
  'reconciliation': 'Reconciliation Offer',
  'demand-compensation': 'Demand for Compensation',
  'warning': 'Diplomatic Warning',
  'peace-offer': 'Peace Proposal',
  'trade-opportunity': 'Trade Opportunity',
  'mutual-defense': 'Mutual Defense Pact',
  'joint-venture': 'Joint Venture Proposal',
};

const urgencyColors: Record<NegotiationUrgency, string> = {
  'low': 'from-blue-900/50 to-blue-800/30 border-blue-500/30',
  'medium': 'from-yellow-900/50 to-yellow-800/30 border-yellow-500/30',
  'high': 'from-orange-900/50 to-orange-800/30 border-orange-500/30',
  'critical': 'from-red-900/50 to-red-800/30 border-red-500/30',
};

const urgencyBadgeColors: Record<NegotiationUrgency, string> = {
  'low': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  'medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  'high': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  'critical': 'bg-red-500/20 text-red-300 border-red-500/50',
};

// ============================================================================
// Component
// ============================================================================

export function AINegotiationNotification({
  negotiation,
  aiNation,
  onView,
  onDismiss
}: AINegotiationNotificationProps) {
  const icon = purposeIcons[negotiation.purpose];
  const title = purposeTitles[negotiation.purpose];
  const colorGradient = urgencyColors[negotiation.urgency];
  const badgeColor = urgencyBadgeColors[negotiation.urgency];

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div
        className={`
          bg-gradient-to-br ${colorGradient}
          backdrop-blur-md border rounded-lg shadow-2xl
          w-96 max-w-full
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${aiNation.color}40` }}
            >
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                {aiNation.name}
              </h3>
              <p className="text-xs text-gray-400">
                {title}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Urgency Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`
                px-2 py-1 rounded text-xs font-medium border
                ${badgeColor}
              `}
            >
              {negotiation.urgency.toUpperCase()} PRIORITY
            </span>
            <span className="text-xs text-gray-400">
              Expires: Turn {negotiation.expiresAtTurn}
            </span>
          </div>

          {/* Message */}
          <div className="bg-black/30 rounded p-3 border border-gray-700/30">
            <p className="text-sm text-gray-200 leading-relaxed">
              {negotiation.message}
            </p>
          </div>

          {/* Deal Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
              <p className="text-green-400 font-medium mb-1">They Offer:</p>
              <p className="text-gray-300">
                {negotiation.proposedDeal.offerItems.length} item(s)
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
              <p className="text-blue-400 font-medium mb-1">They Request:</p>
              <p className="text-gray-300">
                {negotiation.proposedDeal.requestItems.length} item(s)
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 bg-black/20 border-t border-gray-700/30">
          <button
            onClick={onView}
            className="
              flex-1 px-4 py-2 rounded font-medium text-sm
              bg-blue-600 hover:bg-blue-500
              text-white transition-colors
            "
          >
            View Proposal
          </button>
          <button
            onClick={onDismiss}
            className="
              px-4 py-2 rounded font-medium text-sm
              bg-gray-700 hover:bg-gray-600
              text-gray-300 transition-colors
            "
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Notification Queue Component
 * Manages multiple AI-initiated negotiations
 */
interface NotificationQueueProps {
  negotiations: AIInitiatedNegotiation[];
  allNations: Nation[];
  onView: (negotiation: AIInitiatedNegotiation) => void;
  onDismiss: (negotiationId: string) => void;
}

export function AINegotiationNotificationQueue({
  negotiations,
  allNations,
  onView,
  onDismiss
}: NotificationQueueProps) {
  // Show only the most urgent/recent one at a time
  const sortedNegotiations = [...negotiations].sort((a, b) => {
    const urgencyPriority = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = urgencyPriority[b.urgency] - urgencyPriority[a.urgency];
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdTurn - a.createdTurn;
  });

  const currentNegotiation = sortedNegotiations[0];

  if (!currentNegotiation) {
    return null;
  }

  const aiNation = allNations.find(n => n.id === currentNegotiation.aiNationId);

  if (!aiNation) {
    return null;
  }

  return (
    <>
      <AINegotiationNotification
        negotiation={currentNegotiation}
        aiNation={aiNation}
        onView={() => onView(currentNegotiation)}
        onDismiss={() => onDismiss(currentNegotiation.proposedDeal.id)}
      />

      {/* Counter badge if more negotiations pending */}
      {sortedNegotiations.length > 1 && (
        <div className="fixed top-4 right-4 z-40 pointer-events-none">
          <div className="
            absolute -top-2 -right-2
            bg-red-500 text-white text-xs font-bold
            w-6 h-6 rounded-full flex items-center justify-center
            animate-pulse
          ">
            {sortedNegotiations.length}
          </div>
        </div>
      )}
    </>
  );
}
