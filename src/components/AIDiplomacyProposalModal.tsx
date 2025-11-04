/**
 * AI Diplomacy Proposal Modal - Civilization Style
 *
 * Large, dramatic modal displayed when an AI leader contacts the player with a proposal.
 * Features:
 * - Large leader portrait
 * - Diplomatic message from the AI
 * - Clear display of what's offered vs requested
 * - Accept/Reject buttons with consequences
 * - Relationship and mood indicators
 */

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getLeaderImage } from '@/lib/leaderImages';
import {
  Handshake,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  DollarSign,
  Gift,
  Scale,
  Heart,
  Swords,
  Users,
  Zap,
} from 'lucide-react';
import type { AIInitiatedNegotiation, NegotiableItem, LeaderMood, NegotiationPurpose } from '@/types/negotiation';
import type { Nation } from '@/types/game';

interface AIDiplomacyProposalModalProps {
  open: boolean;
  onClose: () => void;
  negotiation: AIInitiatedNegotiation;
  aiNation: Nation;
  playerNation: Nation;
  onAccept: () => void;
  onReject: () => void;
  relationship: number;
  trust: number;
}

/**
 * Calculate mood from relationship
 */
function calculateMood(relationship: number): LeaderMood {
  if (relationship < -50) return 'hostile';
  if (relationship < -25) return 'unfriendly';
  if (relationship < 0) return 'cautious';
  if (relationship < 25) return 'neutral';
  if (relationship < 50) return 'friendly';
  if (relationship < 75) return 'cordial';
  return 'allied';
}

/**
 * Get purpose icon
 */
function getPurposeIcon(purpose: NegotiationPurpose, className?: string) {
  switch (purpose) {
    case 'request-help':
      return <Shield className={className} />;
    case 'offer-alliance':
      return <Handshake className={className} />;
    case 'reconciliation':
      return <Heart className={className} />;
    case 'demand-compensation':
      return <Scale className={className} />;
    case 'warning':
      return <AlertTriangle className={className} />;
    case 'peace-offer':
      return <Handshake className={className} />;
    case 'trade-opportunity':
      return <Gift className={className} />;
    case 'mutual-defense':
      return <Shield className={className} />;
    case 'joint-venture':
      return <Users className={className} />;
    default:
      return <Handshake className={className} />;
  }
}

/**
 * Get purpose title
 */
function getPurposeTitle(purpose: NegotiationPurpose): string {
  switch (purpose) {
    case 'request-help':
      return 'Request for Assistance';
    case 'offer-alliance':
      return 'Alliance Proposal';
    case 'reconciliation':
      return 'Offer of Reconciliation';
    case 'demand-compensation':
      return 'Demand for Compensation';
    case 'warning':
      return 'Diplomatic Warning';
    case 'peace-offer':
      return 'Peace Proposal';
    case 'trade-opportunity':
      return 'Trade Opportunity';
    case 'mutual-defense':
      return 'Mutual Defense Pact';
    case 'joint-venture':
      return 'Joint Venture Proposal';
    default:
      return 'Diplomatic Proposal';
  }
}

/**
 * Get mood gradient for modal background
 */
function getMoodGradient(mood: LeaderMood): string {
  switch (mood) {
    case 'hostile':
      return 'from-red-950/90 via-red-900/80 to-gray-950/90';
    case 'unfriendly':
      return 'from-orange-950/90 via-orange-900/80 to-gray-950/90';
    case 'cautious':
      return 'from-yellow-950/90 via-yellow-900/80 to-gray-950/90';
    case 'neutral':
      return 'from-gray-950/90 via-gray-900/80 to-gray-950/90';
    case 'friendly':
      return 'from-blue-950/90 via-blue-900/80 to-gray-950/90';
    case 'cordial':
      return 'from-green-950/90 via-green-900/80 to-gray-950/90';
    case 'allied':
      return 'from-emerald-950/90 via-emerald-900/80 to-gray-950/90';
    default:
      return 'from-gray-950/90 via-gray-900/80 to-gray-950/90';
  }
}

/**
 * Get mood border color
 */
function getMoodBorderColor(mood: LeaderMood): string {
  switch (mood) {
    case 'hostile':
      return 'border-red-500/50';
    case 'unfriendly':
      return 'border-orange-500/50';
    case 'cautious':
      return 'border-yellow-500/50';
    case 'neutral':
      return 'border-gray-500/50';
    case 'friendly':
      return 'border-blue-500/50';
    case 'cordial':
      return 'border-green-500/50';
    case 'allied':
      return 'border-emerald-500/50';
    default:
      return 'border-gray-500/50';
  }
}

/**
 * Get icon for negotiable item
 */
function getItemIcon(type: string): React.ReactNode {
  switch (type) {
    case 'gold':
      return <DollarSign className="w-4 h-4" />;
    case 'intel':
      return <Zap className="w-4 h-4" />;
    case 'alliance':
      return <Handshake className="w-4 h-4" />;
    case 'treaty':
      return <Scale className="w-4 h-4" />;
    case 'military-support':
      return <Swords className="w-4 h-4" />;
    case 'join-war':
      return <Swords className="w-4 h-4" />;
    default:
      return <Gift className="w-4 h-4" />;
  }
}

/**
 * Format negotiable item for display
 */
function formatItem(item: NegotiableItem): string {
  let base = item.description || item.type;

  if (item.amount !== undefined) {
    base = `${item.amount} ${item.type}`;
  }

  if (item.duration !== undefined) {
    base += ` (${item.duration} turns)`;
  }

  return base;
}

/**
 * AIDiplomacyProposalModal Component
 */
export function AIDiplomacyProposalModal({
  open,
  onClose,
  negotiation,
  aiNation,
  playerNation,
  onAccept,
  onReject,
  relationship,
  trust,
}: AIDiplomacyProposalModalProps) {
  const mood = useMemo(() => calculateMood(relationship), [relationship]);
  const leaderImage = useMemo(() => getLeaderImage(aiNation.leaderName), [aiNation.leaderName]);
  const moodGradient = useMemo(() => getMoodGradient(mood), [mood]);
  const moodBorderColor = useMemo(() => getMoodBorderColor(mood), [mood]);

  const offerItems = negotiation.proposedDeal.offerItems;
  const requestItems = negotiation.proposedDeal.requestItems;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-5xl max-h-[95vh] overflow-hidden p-0",
          "bg-gradient-to-br",
          moodGradient,
          "border-4",
          moodBorderColor
        )}
        closeButton={false}
      >
        {/* Header with Leader Portrait */}
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent z-0" />

          {/* Leader portrait - large and centered */}
          <div className="relative z-10 flex flex-col items-center pt-8 pb-6">
            {/* Portrait */}
            <div className={cn(
              "relative w-48 h-48 rounded-full overflow-hidden",
              "border-8",
              moodBorderColor,
              "shadow-2xl",
              "bg-gray-900"
            )}>
              {leaderImage ? (
                <img
                  src={leaderImage}
                  alt={aiNation.leaderName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-white">
                  {aiNation.leaderName?.charAt(0) || '?'}
                </div>
              )}
            </div>

            {/* Leader name and nation */}
            <div className="mt-4 text-center">
              <h2 className="text-3xl font-bold text-white mb-1">
                {aiNation.leaderName || 'Unknown Leader'}
              </h2>
              <p className="text-xl text-gray-300">
                {getPurposeTitle(negotiation.purpose)}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={cn("text-sm", moodBorderColor)}
                  style={{ borderColor: aiNation.color }}
                >
                  {aiNation.name}
                </Badge>
                <Badge variant="outline" className="text-sm capitalize">
                  {mood}
                </Badge>
                {negotiation.urgency === 'critical' || negotiation.urgency === 'high' ? (
                  <Badge variant="destructive" className="text-sm animate-pulse">
                    {negotiation.urgency.toUpperCase()}
                  </Badge>
                ) : null}
              </div>
            </div>

            {/* Purpose icon */}
            <div
              className="absolute top-4 left-4 p-3 rounded-full border-2"
              style={{
                backgroundColor: `${aiNation.color}40`,
                borderColor: aiNation.color
              }}
            >
              {getPurposeIcon(negotiation.purpose, "w-6 h-6 text-white")}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 space-y-6">
          {/* Diplomatic Message */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <p className="text-lg text-gray-100 leading-relaxed italic">
              "{negotiation.message}"
            </p>
          </div>

          {/* Relationship Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Relationship</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                relationship > 50 ? 'text-green-400' :
                relationship > 0 ? 'text-blue-400' :
                relationship > -50 ? 'text-yellow-400' :
                'text-red-400'
              )}>
                {relationship > 0 ? '+' : ''}{relationship}
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Trust</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{trust}/100</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Expires</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">
                Turn {negotiation.expiresAtTurn}
              </p>
            </div>
          </div>

          {/* Proposal Details */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* They Offer */}
            <div className="bg-green-950/50 backdrop-blur-sm rounded-lg border-2 border-green-500/30 overflow-hidden">
              <div className="bg-green-900/50 px-4 py-3 border-b border-green-500/30">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold text-green-300 text-lg">They Offer</h3>
                </div>
              </div>
              <div className="p-4">
                {offerItems.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">Nothing</p>
                ) : (
                  <ul className="space-y-2">
                    {offerItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-green-100">
                        <div className="mt-1">{getItemIcon(item.type)}</div>
                        <span className="text-sm">{formatItem(item)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* They Request */}
            <div className="bg-blue-950/50 backdrop-blur-sm rounded-lg border-2 border-blue-500/30 overflow-hidden">
              <div className="bg-blue-900/50 px-4 py-3 border-b border-blue-500/30">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-blue-300 text-lg">They Request</h3>
                </div>
              </div>
              <div className="p-4">
                {requestItems.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">Nothing</p>
                ) : (
                  <ul className="space-y-2">
                    {requestItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-blue-100">
                        <div className="mt-1">{getItemIcon(item.type)}</div>
                        <span className="text-sm">{formatItem(item)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Consequences */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Potential Consequences
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="font-medium text-green-300">If Accepted:</span>
                </div>
                <ul className="space-y-1 text-gray-300 ml-6">
                  <li>• Deal terms will be applied</li>
                  <li>• Relationship may improve</li>
                  <li>• Trust may increase</li>
                  {negotiation.purpose === 'offer-alliance' && (
                    <li>• Alliance will be formed</li>
                  )}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="font-medium text-red-300">If Rejected:</span>
                </div>
                <ul className="space-y-1 text-gray-300 ml-6">
                  <li>• Relationship may deteriorate</li>
                  <li>• Trust may decrease</li>
                  {negotiation.urgency === 'critical' && (
                    <li>• Severe diplomatic consequences</li>
                  )}
                  {negotiation.purpose === 'warning' && (
                    <li>• They may take hostile action</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={onReject}
              variant="outline"
              size="lg"
              className="flex-1 h-14 text-lg font-bold border-2 border-red-500/50 bg-red-950/50 hover:bg-red-900/70 text-red-100"
            >
              <X className="w-5 h-5 mr-2" />
              Reject Proposal
            </Button>
            <Button
              onClick={onAccept}
              size="lg"
              className="flex-1 h-14 text-lg font-bold border-2 border-green-500/50 bg-green-700 hover:bg-green-600 text-white"
            >
              <Handshake className="w-5 h-5 mr-2" />
              Accept Proposal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
