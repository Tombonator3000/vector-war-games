/**
 * Negotiation Interface Component
 *
 * Main interface for conducting multi-item negotiations.
 * Features:
 * - Two-column layout (Offer / Request)
 * - Real-time AI evaluation
 * - Counter-offer handling
 * - Deal balance visualization
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ItemPicker } from './ItemPicker';
import type { Nation } from '@/types/game';
import type {
  NegotiationState,
  NegotiableItem,
  AIEvaluation,
  CounterOffer,
} from '@/types/negotiation';
import { removeItem } from '@/lib/negotiationUtils';
import { evaluateNegotiation } from '@/lib/aiNegotiationEvaluator';
import {
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface NegotiationInterfaceProps {
  negotiation: NegotiationState;
  playerNation: Nation;
  otherNation: Nation;
  allNations: Nation[];
  currentTurn: number;
  onUpdateNegotiation: (negotiation: NegotiationState) => void;
  onProposeDeal: () => void;
  onAcceptCounterOffer?: (counterOffer: CounterOffer) => void;
  onCancel: () => void;
  isPlayerInitiator: boolean;
}

/**
 * Format item for display
 */
function formatItem(item: NegotiableItem, nations: Nation[]): string {
  const parts: string[] = [];

  // Type label
  const typeLabel = item.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  parts.push(typeLabel);

  // Amount
  if (item.amount !== undefined) {
    parts.push(`(${item.amount})`);
  }

  // Subtype
  if (item.subtype) {
    const subtypeLabel = item.subtype.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    parts.push(`- ${subtypeLabel}`);
  }

  // Duration
  if (item.duration !== undefined) {
    parts.push(`for ${item.duration} turns`);
  }

  // Target
  if (item.targetId) {
    const target = nations.find(n => n.id === item.targetId);
    if (target) {
      parts.push(`vs ${target.name}`);
    }
  }

  return parts.join(' ');
}

/**
 * Get evaluation status color
 */
function getEvaluationColor(probability: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (probability >= 80) {
    return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' };
  } else if (probability >= 60) {
    return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' };
  } else if (probability >= 40) {
    return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' };
  } else if (probability >= 20) {
    return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' };
  } else {
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' };
  }
}

/**
 * NegotiationInterface Component
 */
export function NegotiationInterface({
  negotiation,
  playerNation,
  otherNation,
  allNations,
  currentTurn,
  onUpdateNegotiation,
  onProposeDeal,
  onAcceptCounterOffer,
  onCancel,
  isPlayerInitiator,
}: NegotiationInterfaceProps) {
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemPickerSide, setItemPickerSide] = useState<'offer' | 'request'>('offer');

  // Debounced AI evaluation
  const aiEvaluation = useMemo(() => {
    // Only evaluate if other nation is AI
    if (otherNation.isPlayer) return null;

    // Only evaluate if there are items
    if (negotiation.offerItems.length === 0 && negotiation.requestItems.length === 0) {
      return null;
    }

    return evaluateNegotiation(
      negotiation,
      otherNation,
      playerNation,
      allNations,
      currentTurn
    );
  }, [negotiation, otherNation, playerNation, allNations, currentTurn]);

  // Handle add item
  const handleAddItem = useCallback((item: NegotiableItem) => {
    const updatedNegotiation = { ...negotiation };
    if (itemPickerSide === 'offer') {
      updatedNegotiation.offerItems = [...negotiation.offerItems, item];
    } else {
      updatedNegotiation.requestItems = [...negotiation.requestItems, item];
    }
    onUpdateNegotiation(updatedNegotiation);
  }, [negotiation, itemPickerSide, onUpdateNegotiation]);

  // Handle remove item
  const handleRemoveItem = useCallback((index: number, side: 'offer' | 'request') => {
    const updatedNegotiation = removeItem(negotiation, index, side);
    onUpdateNegotiation(updatedNegotiation);
  }, [negotiation, onUpdateNegotiation]);

  // Open item picker
  const openItemPicker = useCallback((side: 'offer' | 'request') => {
    setItemPickerSide(side);
    setItemPickerOpen(true);
  }, []);

  // Get evaluation colors
  const evalColors = aiEvaluation
    ? getEvaluationColor(aiEvaluation.acceptanceProbability)
    : { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' };

  // Can propose deal?
  const canPropose = negotiation.offerItems.length > 0 || negotiation.requestItems.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Negotiation with {otherNation.name}</h2>
          <p className="text-sm text-muted-foreground">
            Build a deal by adding items to offer and request
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Round {negotiation.currentRound} / {negotiation.maxRounds}
        </Badge>
      </div>

      {/* Deal Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Offer Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              You Offer
            </CardTitle>
            <CardDescription>
              Items you will give to {otherNation.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {negotiation.offerItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No items offered yet
              </div>
            ) : (
              negotiation.offerItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md bg-blue-500/10 border border-blue-500/20"
                >
                  <span className="text-sm">{formatItem(item, allNations)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index, 'offer')}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openItemPicker('offer')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardFooter>
        </Card>

        {/* Request Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-400" />
              You Request
            </CardTitle>
            <CardDescription>
              Items you want from {otherNation.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {negotiation.requestItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No items requested yet
              </div>
            ) : (
              negotiation.requestItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md bg-green-500/10 border border-green-500/20"
                >
                  <span className="text-sm">{formatItem(item, allNations)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index, 'request')}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openItemPicker('request')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Separator />

      {/* AI Evaluation Display */}
      {aiEvaluation && (
        <Card className={cn('border-2', evalColors.border, evalColors.bg)}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className={cn('h-5 w-5', evalColors.text)} />
              AI Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Acceptance Probability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Acceptance Probability</span>
                <span className={cn('text-2xl font-bold', evalColors.text)}>
                  {Math.round(aiEvaluation.acceptanceProbability)}%
                </span>
              </div>
              <Progress
                value={aiEvaluation.acceptanceProbability}
                className="h-2"
              />
            </div>

            {/* Deal Balance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deal Balance</span>
                <span className={cn(
                  'font-medium',
                  aiEvaluation.netValue > 100 ? 'text-green-400' :
                  aiEvaluation.netValue > -100 ? 'text-yellow-400' :
                  'text-red-400'
                )}>
                  {aiEvaluation.netValue > 0 ? '+' : ''}{Math.round(aiEvaluation.netValue)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-muted-foreground">You Offer</div>
                  <div className="font-medium">{Math.round(aiEvaluation.offerValue)}</div>
                </div>
                <div className="text-center flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">You Request</div>
                  <div className="font-medium">{Math.round(aiEvaluation.requestValue)}</div>
                </div>
              </div>
            </div>

            {/* AI Feedback */}
            {aiEvaluation.feedback && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {aiEvaluation.feedback}
                </AlertDescription>
              </Alert>
            )}

            {/* Counter Offer */}
            {aiEvaluation.counterOffer && onAcceptCounterOffer && (
              <div className="p-3 bg-accent rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className="h-4 w-4" />
                  Counter-Offer Available
                </div>
                <p className="text-sm text-muted-foreground">
                  {aiEvaluation.counterOffer.explanation}
                </p>
                <div className="space-y-1 text-xs">
                  {aiEvaluation.counterOffer.changes.map((change, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {change.type === 'add' && <Plus className="h-3 w-3 text-green-400" />}
                      {change.type === 'remove' && <Minus className="h-3 w-3 text-red-400" />}
                      {change.type === 'modify' && <AlertCircle className="h-3 w-3 text-yellow-400" />}
                      <span>
                        {change.type.charAt(0).toUpperCase() + change.type.slice(1)}{' '}
                        {formatItem(change.item, allNations)} ({change.side})
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAcceptCounterOffer(aiEvaluation.counterOffer!)}
                  className="w-full mt-2"
                >
                  Accept Counter-Offer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={onProposeDeal}
          disabled={!canPropose}
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Propose Deal
        </Button>
      </div>

      {/* Item Picker Modal */}
      <ItemPicker
        open={itemPickerOpen}
        onClose={() => setItemPickerOpen(false)}
        onAddItem={handleAddItem}
        nation={playerNation}
        otherNation={otherNation}
        side={itemPickerSide}
        existingItems={
          itemPickerSide === 'offer'
            ? negotiation.offerItems
            : negotiation.requestItems
        }
        availableNations={allNations}
      />
    </div>
  );
}
