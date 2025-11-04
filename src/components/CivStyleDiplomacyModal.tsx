/**
 * Civilization-Style Diplomacy Modal
 * 
 * Elegant diplomacy interface inspired by Civilization games
 * Features:
 * - Beautiful card-based action system
 * - Support/Accept/Reject flow
 * - Influence currency cost display
 * - Decorative borders and ornaments
 */

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Handshake,
  Shield,
  Gift,
  Users,
  Sword,
  Brain,
  Hammer,
  AlertCircle,
  Megaphone,
  X,
  Globe,
} from 'lucide-react';
import type { Nation } from '@/types/game';
import { cn } from '@/lib/utils';

interface DiplomaticAction {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'endeavor' | 'sanction' | 'espionage';
  influenceCost: number;
  supportInfluenceCost?: number;
  requiresSupport: boolean;
  effects: {
    accepted?: string;
    supported?: string;
    rejected?: string;
  };
  relationshipChange: {
    accepted: number;
    supported?: number;
    rejected?: number;
  };
  duration?: number;
  requirements?: string;
  isAvailable?: boolean;
}

interface CivStyleDiplomacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Nation;
  target: Nation;
  onAction: (actionId: string, response?: 'accept' | 'support' | 'reject') => void;
}

// Diplomatic actions inspired by Civilization
const DIPLOMATIC_ACTIONS: DiplomaticAction[] = [
  // ENDEAVORS (Helpful actions)
  {
    id: 'research-collaboration',
    name: 'Research Collaboration',
    description: 'Do a Research Collaboration with another Leader.',
    icon: Brain,
    category: 'endeavor',
    influenceCost: 60,
    supportInfluenceCost: 15,
    requiresSupport: true,
    effects: {
      accepted: 'You receive +4 Science per turn. Other Leader receives +2 Science per turn.',
      supported: 'Both Leaders receive +6 Science per turn.',
      rejected: 'No effect.',
    },
    relationshipChange: {
      accepted: 5,
      supported: 12,
      rejected: 0,
    },
    duration: 15,
  },
  {
    id: 'military-aid',
    name: 'Military Aid',
    description: 'Provide military equipment and training to strengthen an ally.',
    icon: Sword,
    category: 'endeavor',
    influenceCost: 60,
    requiresSupport: false,
    effects: {
      accepted: 'Target receives +3 Defense and +2 Missiles.',
    },
    relationshipChange: {
      accepted: 8,
      rejected: -3,
    },
  },
  {
    id: 'economic-support',
    name: 'Economic Support',
    description: 'Send financial aid to help stabilize their economy.',
    icon: Gift,
    category: 'endeavor',
    influenceCost: 50,
    requiresSupport: false,
    effects: {
      accepted: 'Target receives +500 Gold and +5 Production per turn for 10 turns.',
    },
    relationshipChange: {
      accepted: 10,
      rejected: -2,
    },
    duration: 10,
  },
  {
    id: 'cultural-exchange',
    name: 'Cultural Exchange',
    description: 'Establish cultural programs to improve relations.',
    icon: Users,
    category: 'endeavor',
    influenceCost: 40,
    requiresSupport: false,
    effects: {
      accepted: 'Both nations gain +2 Cultural Power. Relationship improves over time.',
    },
    relationshipChange: {
      accepted: 15,
      rejected: 0,
    },
    duration: 20,
  },
  {
    id: 'reconciliation',
    name: 'Reconciliation',
    description: 'Attempt to mend past grievances and improve relations.',
    icon: Handshake,
    category: 'endeavor',
    influenceCost: 60,
    requiresSupport: false,
    requirements: 'You need at least a Relationship of Hostile to start this Diplomatic Action.',
    effects: {
      accepted: 'Resolves one grievance and improves relationship significantly.',
    },
    relationshipChange: {
      accepted: 20,
      rejected: -5,
    },
  },

  // SANCTIONS (Harmful actions)
  {
    id: 'hinder-research',
    name: 'Hinder Research',
    description: 'Impose restrictions that slow their scientific progress.',
    icon: AlertCircle,
    category: 'sanction',
    influenceCost: 80,
    requiresSupport: false,
    effects: {
      accepted: 'Target loses -30% Research speed for 12 turns.',
    },
    relationshipChange: {
      accepted: -15,
    },
    duration: 12,
  },
  {
    id: 'hinder-production',
    name: 'Hinder Military Production',
    description: 'Economic sanctions that reduce their military capability.',
    icon: Hammer,
    category: 'sanction',
    influenceCost: 80,
    requiresSupport: false,
    effects: {
      accepted: 'Target loses -40% Production for 12 turns.',
    },
    relationshipChange: {
      accepted: -15,
    },
    duration: 12,
  },
  {
    id: 'denounce',
    name: 'Denounce',
    description: 'Publicly condemn their actions on the world stage.',
    icon: Megaphone,
    category: 'sanction',
    influenceCost: 60,
    requiresSupport: false,
    effects: {
      accepted: 'Target loses -10 relationship with all other nations.',
    },
    relationshipChange: {
      accepted: -20,
    },
  },

  // ESPIONAGE (Hidden actions)
  {
    id: 'steal-tech',
    name: 'Steal Technology',
    description: 'Covertly acquire their research secrets.',
    icon: Brain,
    category: 'espionage',
    influenceCost: 100,
    requiresSupport: false,
    effects: {
      accepted: 'Copy one of their completed research projects. Risk of detection: 30%',
    },
    relationshipChange: {
      accepted: 0, // Hidden unless detected
    },
  },
  {
    id: 'sabotage',
    name: 'Sabotage Production',
    description: 'Secretly disrupt their military production.',
    icon: Hammer,
    category: 'espionage',
    influenceCost: 90,
    requiresSupport: false,
    effects: {
      accepted: 'Target loses 25% of current missiles and production capacity for 5 turns. Risk of detection: 40%',
    },
    relationshipChange: {
      accepted: 0, // Hidden unless detected
    },
    duration: 5,
  },
];

export function CivStyleDiplomacyModal({
  isOpen,
  onClose,
  player,
  target,
  onAction,
}: CivStyleDiplomacyModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'endeavor' | 'sanction' | 'espionage'>('all');
  const [selectedAction, setSelectedAction] = useState<DiplomaticAction | null>(null);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const playerInfluence = (player.diplomaticInfluence as any)?.currentInfluence || 0;
  const relationship = player.relationships?.[target.id] || 0;

  const filteredActions = DIPLOMATIC_ACTIONS.filter(action => 
    selectedCategory === 'all' || action.category === selectedCategory
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'endeavor': return 'text-blue-400 border-blue-500/30';
      case 'sanction': return 'text-red-400 border-red-500/30';
      case 'espionage': return 'text-purple-400 border-purple-500/30';
      default: return 'text-cyan-400 border-cyan-500/30';
    }
  };

  const getRelationshipColor = (rel: number) => {
    if (rel >= 50) return 'text-green-400';
    if (rel >= 0) return 'text-blue-400';
    if (rel >= -50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const canAfford = (cost: number) => playerInfluence >= cost;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-600/50">
        {/* Decorative Header */}
        <div className="relative border-b-2 border-amber-600/50 bg-gradient-to-r from-slate-800 via-amber-900/20 to-slate-800 p-6">
          {/* Ornamental corners */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-amber-500/50"></div>
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-amber-500/50"></div>
          
          <div className="text-center">
            <h2 className="text-3xl font-serif text-amber-300 tracking-widest uppercase mb-2">
              {target.name}
            </h2>
            <p className="text-sm text-gray-400 uppercase tracking-wider">
              Leader of the {target.name} Civilization
            </p>
            
            {/* Leader Icon */}
            <div className="mt-4 flex justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-amber-500 bg-slate-700 flex items-center justify-center">
                <Globe className="w-10 h-10 text-amber-400" />
              </div>
            </div>

            {/* Relationship Status */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <Badge variant="outline" className={cn("text-base px-4 py-1", getRelationshipColor(relationship))}>
                Relationship: {relationship}
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-1 text-cyan-400 border-cyan-500/30">
                <Globe className="w-4 h-4 mr-1" />
                Influence: {playerInfluence}
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-amber-400 hover:text-amber-300"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center py-2 bg-slate-800/50">
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          <div className="mx-4 text-amber-400">◆</div>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
        </div>

        {/* Info Text */}
        <div className="px-6 py-3 bg-slate-800/30">
          <p className="text-center text-sm text-gray-300">
            You can start a variety of Diplomatic Actions with another Leader by spending{' '}
            <Globe className="inline w-4 h-4 text-cyan-400" />{' '}
            <span className="text-cyan-400 font-semibold">Influence</span>.
            These Actions can have a variety of effects and generally last for a fixed period of time.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-6 py-3 bg-slate-800/50">
          {[
            { id: 'all', label: 'All Actions', icon: Users },
            { id: 'endeavor', label: 'Endeavors', icon: Handshake },
            { id: 'sanction', label: 'Sanctions', icon: AlertCircle },
            { id: 'espionage', label: 'Espionage', icon: Shield },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <Button
                key={cat.id}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  "flex-1 border-2 transition-all",
                  isSelected 
                    ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/50" 
                    : "bg-slate-700/50 border-slate-600 text-gray-300 hover:border-amber-500/50"
                )}
                onClick={() => setSelectedCategory(cat.id as any)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Actions Grid */}
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-3 pb-6">
            {filteredActions.map((action) => {
              const Icon = action.icon;
              const isHovered = hoveredAction === action.id;
              const isSelected = selectedAction?.id === action.id;
              const affordable = canAfford(action.influenceCost);

              return (
                <div
                  key={action.id}
                  className={cn(
                    "relative border-2 rounded-lg p-4 transition-all cursor-pointer",
                    isSelected 
                      ? "bg-amber-900/30 border-amber-500 shadow-lg shadow-amber-500/30"
                      : "bg-slate-800/50 border-slate-700 hover:border-amber-500/50",
                    !affordable && "opacity-50"
                  )}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  onClick={() => setSelectedAction(action)}
                >
                  {/* Action Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-full border-2 flex items-center justify-center",
                        getCategoryColor(action.category),
                        "bg-slate-900"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-amber-300">{action.name}</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">
                          {action.category}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={cn(
                        "text-sm px-3 py-1",
                        affordable ? "bg-cyan-600 text-white" : "bg-gray-600 text-gray-300"
                      )}>
                        <Globe className="w-3 h-3 mr-1" />
                        {action.influenceCost}
                      </Badge>
                      {action.supportInfluenceCost && (
                        <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                          Support: {action.supportInfluenceCost}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Description */}
                  <p className="text-sm text-gray-300 mb-3">{action.description}</p>

                  {/* Effects (shown on hover or select) */}
                  {(isHovered || isSelected) && (
                    <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
                      {action.effects.accepted && (
                        <div className="text-xs">
                          <span className="text-green-400 font-semibold">Accepted:</span>
                          <span className="text-gray-300 ml-2">{action.effects.accepted}</span>
                        </div>
                      )}
                      {action.effects.supported && (
                        <div className="text-xs">
                          <span className="text-blue-400 font-semibold">Supported:</span>
                          <span className="text-gray-300 ml-2">{action.effects.supported}</span>
                        </div>
                      )}
                      {action.effects.rejected && (
                        <div className="text-xs">
                          <span className="text-red-400 font-semibold">Rejected:</span>
                          <span className="text-gray-300 ml-2">{action.effects.rejected}</span>
                        </div>
                      )}
                      {action.duration && (
                        <div className="text-xs text-amber-400">
                          Duration: {action.duration} turns
                        </div>
                      )}
                      {action.requirements && (
                        <div className="text-xs text-red-400">
                          {action.requirements}
                        </div>
                      )}
                      <div className="text-xs">
                        <span className="text-gray-400">Relationship changes:</span>
                        {action.relationshipChange.accepted && (
                          <span className="text-green-400 ml-2">Accept: +{action.relationshipChange.accepted}</span>
                        )}
                        {action.relationshipChange.supported && (
                          <span className="text-blue-400 ml-2">Support: +{action.relationshipChange.supported}</span>
                        )}
                        {action.relationshipChange.rejected && (
                          <span className="text-red-400 ml-2">Reject: {action.relationshipChange.rejected}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Propose Button (shown when selected) */}
                  {isSelected && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white border-2 border-amber-500"
                        disabled={!affordable}
                        onClick={() => {
                          onAction(action.id, 'accept');
                          setSelectedAction(null);
                        }}
                      >
                        Propose Action
                      </Button>
                      <Button
                        variant="outline"
                        className="border-slate-600 text-gray-300"
                        onClick={() => setSelectedAction(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Bottom Action Bar */}
        <div className="border-t-2 border-amber-600/50 bg-slate-900 p-4 flex justify-between items-center">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="border-2 border-amber-600 text-amber-400 hover:bg-amber-600/20"
            >
              <Shield className="w-4 h-4 mr-2" />
              Form Alliance
            </Button>
            <Button
              variant="outline"
              className="border-2 border-red-600 text-red-400 hover:bg-red-600/20"
            >
              <Sword className="w-4 h-4 mr-2" />
              Declare War
            </Button>
          </div>
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            Close Diplomacy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
