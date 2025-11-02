/**
 * Item Picker Component
 *
 * Modal for selecting and configuring negotiable items to add to a negotiation.
 * Supports all item types with appropriate input fields for amounts, durations, subtypes, etc.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { NegotiableItem, NegotiableItemType } from '@/types/negotiation';
import type { Nation } from '@/types/game';
import { Coins, Zap, Wrench, Shield, FileText, Handshake, Scale, Gift, Users, Share2, DollarSign, AlertTriangle } from 'lucide-react';

interface ItemPickerProps {
  open: boolean;
  onClose: () => void;
  onAddItem: (item: NegotiableItem) => void;
  nation: Nation; // The nation whose perspective we're viewing from
  otherNation: Nation; // The other party in negotiation
  side: 'offer' | 'request'; // Whether we're offering or requesting
  existingItems?: NegotiableItem[]; // Items already in the deal
  availableNations?: Nation[]; // All nations for join-war targets
}

/**
 * Item categories for organization
 */
const ITEM_CATEGORIES = {
  resources: {
    label: 'Resources',
    icon: Coins,
    items: ['gold', 'intel', 'production'] as NegotiableItemType[],
  },
  agreements: {
    label: 'Agreements',
    icon: FileText,
    items: ['alliance', 'treaty', 'open-borders', 'trade-agreement'] as NegotiableItemType[],
  },
  diplomatic: {
    label: 'Diplomatic',
    icon: Handshake,
    items: ['promise', 'favor-exchange', 'grievance-apology'] as NegotiableItemType[],
  },
  actions: {
    label: 'Actions',
    icon: Shield,
    items: ['join-war', 'military-support', 'sanction-lift', 'resource-share', 'share-tech'] as NegotiableItemType[],
  },
};

/**
 * Item type display information
 */
const ITEM_INFO: Record<NegotiableItemType, {
  label: string;
  icon: React.ElementType;
  description: string;
  hasAmount: boolean;
  hasDuration: boolean;
  hasSubtype: boolean;
  hasTarget: boolean;
  subtypes?: { value: string; label: string }[];
}> = {
  'gold': {
    label: 'Gold',
    icon: Coins,
    description: 'Transfer gold to the other nation',
    hasAmount: true,
    hasDuration: false,
    hasSubtype: false,
    hasTarget: false,
  },
  'intel': {
    label: 'Intelligence',
    icon: Zap,
    description: 'Share intelligence points',
    hasAmount: true,
    hasDuration: false,
    hasSubtype: false,
    hasTarget: false,
  },
  'production': {
    label: 'Production',
    icon: Wrench,
    description: 'Transfer production points',
    hasAmount: true,
    hasDuration: false,
    hasSubtype: false,
    hasTarget: false,
  },
  'alliance': {
    label: 'Alliance',
    icon: Users,
    description: 'Form an alliance with the other nation',
    hasAmount: false,
    hasDuration: false,
    hasSubtype: true,
    hasTarget: false,
    subtypes: [
      { value: 'basic', label: 'Basic Alliance' },
      { value: 'military', label: 'Military Alliance' },
      { value: 'economic', label: 'Economic Alliance' },
      { value: 'research', label: 'Research Alliance' },
      { value: 'intelligence', label: 'Intelligence Alliance' },
    ],
  },
  'treaty': {
    label: 'Treaty',
    icon: FileText,
    description: 'Sign a treaty with specific terms',
    hasAmount: false,
    hasDuration: true,
    hasSubtype: true,
    hasTarget: false,
    subtypes: [
      { value: 'non-aggression', label: 'Non-Aggression Pact' },
      { value: 'truce', label: 'Truce' },
      { value: 'peace', label: 'Peace Treaty' },
      { value: 'mutual-defense', label: 'Mutual Defense' },
    ],
  },
  'promise': {
    label: 'Promise',
    icon: Handshake,
    description: 'Make a diplomatic promise',
    hasAmount: false,
    hasDuration: true,
    hasSubtype: true,
    hasTarget: false,
    subtypes: [
      { value: 'not-attack', label: 'Promise Not to Attack' },
      { value: 'support-war', label: 'Promise to Support in War' },
      { value: 'not-compete', label: 'Promise Not to Compete' },
      { value: 'share-intel', label: 'Promise to Share Intelligence' },
    ],
  },
  'favor-exchange': {
    label: 'Favor Exchange',
    icon: Gift,
    description: 'Exchange diplomatic favors',
    hasAmount: true,
    hasDuration: false,
    hasSubtype: false,
    hasTarget: false,
  },
  'sanction-lift': {
    label: 'Lift Sanctions',
    icon: DollarSign,
    description: 'Remove economic sanctions',
    hasAmount: false,
    hasDuration: false,
    hasSubtype: false,
    hasTarget: false,
  },
  'join-war': {
    label: 'Join War',
    icon: Shield,
    description: 'Join a war against a target nation',
    hasAmount: false,
    hasDuration: false,
    hasSubtype: false,
    hasTarget: true,
  },
  'share-tech': {
    label: 'Share Technology',
    icon: Share2,
    description: 'Share a specific technology',
    hasAmount: false,
    hasDuration: false,
    hasSubtype: false,
    hasTarget: false, // Actually uses techId but simplified for now
  },
  'open-borders': {
    label: 'Open Borders',
    icon: Scale,
    description: 'Allow free movement between nations',
    hasAmount: false,
    hasDuration: true,
    hasSubtype: false,
    hasTarget: false,
  },
  'grievance-apology': {
    label: 'Apologize for Grievance',
    icon: AlertTriangle,
    description: 'Formally apologize for a past action',
    hasAmount: false,
    hasDuration: false,
    hasSubtype: false,
    hasTarget: false, // Actually uses grievanceId but simplified for now
  },
  'resource-share': {
    label: 'Resource Sharing',
    icon: Share2,
    description: 'Share resources over time',
    hasAmount: true,
    hasDuration: true,
    hasSubtype: false,
    hasTarget: false,
  },
  'military-support': {
    label: 'Military Support',
    icon: Shield,
    description: 'Provide military assistance',
    hasAmount: false,
    hasDuration: true,
    hasSubtype: false,
    hasTarget: false,
  },
  'trade-agreement': {
    label: 'Trade Agreement',
    icon: DollarSign,
    description: 'Establish ongoing trade',
    hasAmount: false,
    hasDuration: true,
    hasSubtype: false,
    hasTarget: false,
  },
};

/**
 * ItemPicker Component
 */
export function ItemPicker({
  open,
  onClose,
  onAddItem,
  nation,
  otherNation,
  side,
  existingItems = [],
  availableNations = [],
}: ItemPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof ITEM_CATEGORIES>('resources');
  const [selectedType, setSelectedType] = useState<NegotiableItemType | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [duration, setDuration] = useState<number>(10);
  const [subtype, setSubtype] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedType(null);
      setAmount(100);
      setDuration(10);
      setSubtype('');
      setTargetId('');
    }
  }, [open]);

  // Get item info for selected type
  const selectedInfo = selectedType ? ITEM_INFO[selectedType] : null;

  const getResourceStockpile = useCallback(
    (type: 'gold' | 'intel' | 'production') => {
      switch (type) {
        case 'gold':
        case 'production':
          return nation.production ?? 0;
        case 'intel':
          return nation.intel ?? 0;
        default:
          return 0;
      }
    },
    [nation]
  );

  const availableResourceAmount = useMemo(() => {
    if (!selectedType) return 0;
    if (selectedType === 'intel') {
      return getResourceStockpile('intel');
    }
    if (selectedType === 'gold' || selectedType === 'production') {
      return getResourceStockpile('production');
    }
    return 0;
  }, [selectedType, getResourceStockpile]);

  // Can the nation afford/provide this item?
  const canAfford = useMemo(() => {
    if (!selectedType || side !== 'offer') return true;

    switch (selectedType) {
      case 'gold':
      case 'production':
        return getResourceStockpile('production') >= amount;
      case 'intel':
        return getResourceStockpile('intel') >= amount;
      default:
        return true; // Other items don't have resource costs
    }
  }, [selectedType, side, amount, getResourceStockpile]);

  // Validation
  const isValid = useMemo(() => {
    if (!selectedType) return false;
    if (!canAfford) return false;

    const info = ITEM_INFO[selectedType];
    if (info.hasAmount && amount <= 0) return false;
    if (info.hasDuration && duration <= 0) return false;
    if (info.hasSubtype && !subtype) return false;
    if (info.hasTarget && !targetId) return false;

    return true;
  }, [selectedType, amount, duration, subtype, targetId, canAfford]);

  // Handle add item
  const handleAdd = () => {
    if (!selectedType || !isValid) return;

    const info = ITEM_INFO[selectedType];
    const item: NegotiableItem = {
      type: selectedType,
      ...(info.hasAmount && { amount }),
      ...(info.hasDuration && { duration }),
      ...(info.hasSubtype && { subtype }),
      ...(info.hasTarget && { targetId }),
    };

    onAddItem(item);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {side === 'offer' ? 'Add Item to Offer' : 'Add Item to Request'}
          </DialogTitle>
          <DialogDescription>
            {side === 'offer'
              ? `Select an item to offer to ${otherNation.name}`
              : `Select an item to request from ${otherNation.name}`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(ITEM_CATEGORIES).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(ITEM_CATEGORIES).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-4 space-y-2">
              {category.items.map((itemType) => {
                const info = ITEM_INFO[itemType];
                const Icon = info.icon;
                const isSelected = selectedType === itemType;

                return (
                  <button
                    key={itemType}
                    onClick={() => setSelectedType(itemType)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn('h-5 w-5 mt-0.5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{info.label}</div>
                        <div className="text-sm text-muted-foreground">{info.description}</div>
                      </div>
                      {isSelected && <Badge variant="default">Selected</Badge>}
                    </div>
                  </button>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>

        {/* Configuration Section */}
        {selectedInfo && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Configure {selectedInfo.label}</h3>

            {/* Amount Input */}
            {selectedInfo.hasAmount && (
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount {selectedType === 'gold' ? '(Gold)' :
                          selectedType === 'intel' ? '(Intel)' :
                          selectedType === 'production' ? '(Production)' :
                          selectedType === 'favor-exchange' ? '(Favor Points)' :
                          selectedType === 'resource-share' ? '(Per Turn)' : ''}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className={cn(!canAfford && 'border-red-500')}
                />
                {!canAfford && side === 'offer' && (
                  <p className="text-sm text-red-500">
                    Insufficient resources. You have {availableResourceAmount}.
                  </p>
                )}
              </div>
            )}

            {/* Duration Input */}
            {selectedInfo.hasDuration && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Turns)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="100"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                />
              </div>
            )}

            {/* Subtype Select */}
            {selectedInfo.hasSubtype && selectedInfo.subtypes && (
              <div className="space-y-2">
                <Label htmlFor="subtype">Type</Label>
                <Select value={subtype} onValueChange={setSubtype}>
                  <SelectTrigger id="subtype">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedInfo.subtypes.map((st) => (
                      <SelectItem key={st.value} value={st.value}>
                        {st.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Target Select (for join-war) */}
            {selectedInfo.hasTarget && (
              <div className="space-y-2">
                <Label htmlFor="target">Target Nation</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger id="target">
                    <SelectValue placeholder="Select target..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNations
                      .filter((n) => n.id !== nation.id && n.id !== otherNation.id)
                      .map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!isValid}>
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
