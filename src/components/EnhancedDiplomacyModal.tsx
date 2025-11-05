/**
 * Diplomatic Operations Modal
 *
 * Provides access to diplomatic mechanics:
 * - Trust building and favors
 * - Diplomatic promises and agreements
 * - Grievance resolution
 * - DIP currency actions
 */

import React, { useMemo, useState } from 'react';
import { X, Handshake, Gift, Scale, Shield, MessageCircle, AlertTriangle, Star, Users } from 'lucide-react';
import type { Nation } from '@/types/game';
import type { DiplomacyPhase3State } from '@/types/diplomacyPhase3';
import { DiplomacyPhase3Display } from './DiplomacyPhase3Display';
import { TrustAndFavorsDisplay } from '@/components/TrustAndFavorsDisplay';
import { getFavors } from '@/types/trustAndFavors';
import { getActivePromises } from '@/lib/trustAndFavorsUtils';
import { getActiveGrievances } from '@/lib/grievancesAndClaimsUtils';

interface EnhancedDiplomacyModalProps {
  player: Nation;
  nations: Nation[];
  phase3State?: DiplomacyPhase3State;
  onClose: () => void;
  onAction: (action: DiplomaticAction, target?: Nation) => void;
  onOpenLeadersScreen?: () => void;
}

export interface DiplomaticAction {
  id: string;
  title: string;
  subtitle: string;
  category: 'trust' | 'promises' | 'grievances' | 'council';
  dipCost?: number;
  requiresTarget: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export function EnhancedDiplomacyModal({
  player,
  nations,
  phase3State,
  onClose,
  onAction,
  onOpenLeadersScreen,
}: EnhancedDiplomacyModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('trust');
  const [selectedTarget, setSelectedTarget] = useState<Nation | null>(null);

  const categories = [
    { id: 'trust', name: 'Trust & Favors', icon: Handshake, color: 'text-green-400' },
    { id: 'promises', name: 'Promises', icon: MessageCircle, color: 'text-blue-400' },
    { id: 'grievances', name: 'Grievances', icon: AlertTriangle, color: 'text-yellow-400' },
    { id: 'council', name: 'Council Actions', icon: Shield, color: 'text-purple-400' },
  ];

  const diplomaticActions: DiplomaticAction[] = [
    // Trust & Favors
    {
      id: 'build-trust',
      title: 'BUILD TRUST',
      subtitle: 'Costs 10 DIP. Increases trust by +10 and relationship by +5. Demonstrates goodwill and reliability to strengthen diplomatic ties.',
      category: 'trust',
      dipCost: 10,  // Reduced from 15 to make early-game diplomacy more accessible (FASE 3.3)
      requiresTarget: true,
    },
    {
      id: 'grant-favor',
      title: 'GRANT FAVOR',
      subtitle: 'Costs 12 DIP. Grants a favor that they can call in later. Increases relationship by +3. Build leverage for future negotiations.',
      category: 'trust',
      dipCost: 12,  // Reduced from 20 to make early-game diplomacy more accessible (FASE 3.3)
      requiresTarget: true,
    },
    {
      id: 'call-in-favor',
      title: 'CALL IN FAVOR',
      subtitle: 'Costs 5 DIP. Requires at least 1 favor owed to you. Request assistance based on past help you provided to them.',
      category: 'trust',
      dipCost: 5,
      requiresTarget: true,
    },

    // Promises
    {
      id: 'make-promise',
      title: 'MAKE PROMISE',
      subtitle: 'Costs 10 DIP. Make a binding promise (no attack, defense support, no nukes, etc.). Increases trust by +10-15. WARNING: Breaking promises damages trust by -25 to -40.',
      category: 'promises',
      dipCost: 10,
      requiresTarget: true,
    },
    {
      id: 'verify-promise',
      title: 'VERIFY PROMISE',
      subtitle: 'Costs 15 DIP. Request proof that they are honoring their promises to you. Ensures accountability and builds diplomatic confidence.',
      category: 'promises',
      dipCost: 15,
      requiresTarget: true,
    },

    // Grievances
    {
      id: 'apologize',
      title: 'FORMAL APOLOGY',
      subtitle: 'Costs 25 DIP. Formally apologize for past wrongdoings. Resolves active grievances and improves relationship by +15-25. Shows willingness to reconcile.',
      category: 'grievances',
      dipCost: 25,
      requiresTarget: true,
    },
    {
      id: 'reparations',
      title: 'OFFER REPARATIONS',
      subtitle: 'Costs 30 DIP + resources. Provide material compensation for harm done. Resolves severe grievances and restores trust by +20-30. Demonstrates commitment to making amends.',
      category: 'grievances',
      dipCost: 30,
      requiresTarget: true,
    },

    // Council Actions
    {
      id: 'propose-resolution',
      title: 'PROPOSE RESOLUTION',
      subtitle: 'Costs 40 DIP. Submit a formal proposal to the International Council for voting. Can address global issues and establish international norms.',
      category: 'council',
      dipCost: 40,
      requiresTarget: false,
    },
    {
      id: 'call-session',
      title: 'CALL EMERGENCY SESSION',
      subtitle: 'Costs 50 DIP. Convene an urgent council meeting to address critical international crises. Requires strong justification.',
      category: 'council',
      dipCost: 50,
      requiresTarget: false,
    },
    {
      id: 'back-channel',
      title: 'BACK-CHANNEL COMMUNICATION',
      subtitle: 'Costs 20 DIP. Send a private diplomatic letter to secretly communicate with another nation away from public scrutiny.',
      category: 'council',
      dipCost: 20,
      requiresTarget: true,
    },
  ];

  const favorsWithTarget = selectedTarget ? getFavors(player, selectedTarget.id) : 0;
  const activePromisesFromTarget = selectedTarget
    ? getActivePromises(selectedTarget, player.id)
    : [];
  const grievancesFromTarget = selectedTarget
    ? getActiveGrievances(selectedTarget, player.id)
    : [];
  const playerDIP = player.diplomaticInfluence?.points || 0;

  const availableActions = useMemo(() => {
    return diplomaticActions
      .filter((action) => action.category === selectedCategory)
      .map((action) => {
        let disabled = false;
        let disabledReason: string | undefined;

        if (action.requiresTarget && !selectedTarget) {
          disabled = true;
          disabledReason = 'Select a target nation.';
        }

        if (!disabled && action.dipCost && playerDIP < action.dipCost) {
          disabled = true;
          disabledReason = 'Insufficient DIP influence.';
        }

        if (!disabled && selectedTarget) {
          switch (action.id) {
            case 'call-in-favor':
              if (favorsWithTarget <= 0) {
                disabled = true;
                disabledReason = `${selectedTarget.name} owes you no favors to call in.`;
              }
              break;
            case 'verify-promise':
              if (activePromisesFromTarget.length === 0) {
                disabled = true;
                disabledReason = `${selectedTarget.name} has no active promises to verify.`;
              }
              break;
            case 'apologize':
              if (grievancesFromTarget.length === 0) {
                disabled = true;
                disabledReason = `${selectedTarget.name} has no grievances against you.`;
              }
              break;
            case 'reparations':
              if (grievancesFromTarget.length === 0) {
                disabled = true;
                disabledReason = `${selectedTarget.name} has no grievances requiring reparations.`;
              }
              break;
            default:
              break;
          }
        }

        return { ...action, disabled, disabledReason };
      });
  }, [
    activePromisesFromTarget.length,
    diplomaticActions,
    favorsWithTarget,
    grievancesFromTarget.length,
    playerDIP,
    selectedCategory,
    selectedTarget,
  ]);

  const otherNations = nations.filter((n) => n.id !== player.id);

  const handleAction = (action: DiplomaticAction) => {
    if (action.disabled) {
      return;
    }

    if (action.requiresTarget && !selectedTarget) {
      return; // Need to select a target first
    }

    if (action.dipCost && playerDIP < action.dipCost) {
      return; // Not enough DIP
    }

    onAction(action, selectedTarget || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-6xl mx-4 h-[85vh] bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-cyan-500/40 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-cyan-500/30 bg-black/40 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-300 font-mono uppercase tracking-wider">
                Diplomatic Operations
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {onOpenLeadersScreen && (
                <button
                  onClick={() => {
                    onOpenLeadersScreen();
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded transition-colors"
                >
                  <Users className="w-4 h-4 text-blue-300" />
                  <span className="text-sm font-medium text-blue-200">Contact Leaders</span>
                </button>
              )}

              <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded border border-cyan-500/30">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">DIP:</span>
                <span className="text-lg font-bold text-cyan-300">{playerDIP}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100%-5rem)]">
          {/* Left Sidebar - Categories */}
          <div className="w-64 border-r border-cyan-500/30 bg-black/20 p-4 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Action Categories
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-800/50 border border-gray-700 text-gray-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : cat.color}`} />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Target Selection */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Target Nation
              </h3>
              <div className="space-y-2">
                {otherNations.map((nation) => (
                  <button
                    key={nation.id}
                    onClick={() => setSelectedTarget(nation)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                      selectedTarget?.id === nation.id
                        ? 'bg-green-500/20 border border-green-500/50'
                        : 'bg-slate-800/50 border border-gray-700 hover:bg-slate-700/50'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: nation.color }}
                    />
                    <span className="text-sm text-gray-300 truncate">{nation.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Actions */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {selectedTarget && (
                <div className="rounded-lg border border-cyan-500/30 bg-slate-900/40 p-3">
                  <TrustAndFavorsDisplay nation={player} targetNation={selectedTarget} />
                </div>
              )}

              {phase3State && phase3State.phase3Enabled ? (
                <div className="rounded-lg border border-cyan-500/30 bg-slate-900/40 p-3">
                  <DiplomacyPhase3Display
                    nation={player}
                    targetNation={selectedTarget ?? undefined}
                    phase3State={phase3State}
                    compact
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-cyan-500/30 bg-slate-900/40 p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-cyan-300" />
                      <h3 className="text-lg font-semibold text-cyan-200 font-mono">
                        Advanced Diplomacy Locked
                      </h3>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Complete Era III objectives or progress major treaties to unlock advanced diplomacy metrics. Once
                      enabled, you&apos;ll gain access to council influence, treaty leverage, and world opinion tracking for
                      every nation.
                    </p>
                    <p className="text-xs text-gray-400">
                      Tip: advancing the global era and resolving high-priority objectives accelerates access to these
                      insights.
                    </p>
                  </div>
                </div>
              )}

              {availableActions.map((action) => {
                const isEnabled = !action.disabled;

                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={!isEnabled}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isEnabled
                        ? 'bg-slate-800/50 border-cyan-500/30 hover:bg-slate-700/50 hover:border-cyan-500/50 cursor-pointer'
                        : 'bg-slate-900/30 border-gray-700/30 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-cyan-300 font-mono">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">{action.subtitle}</p>

                        {action.requiresTarget && selectedTarget && (
                          <p className="text-xs text-green-400 mt-2">
                            → Target: {selectedTarget.name}
                          </p>
                        )}

                        {!isEnabled && action.disabledReason && (
                          <p className="text-xs text-red-400 mt-2">{action.disabledReason}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {action.dipCost && (
                          <div
                            className={`flex items-center gap-1 px-3 py-1 rounded ${
                              playerDIP >= (action.dipCost ?? 0)
                                ? 'bg-yellow-500/10 border border-yellow-500/30'
                                : 'bg-red-500/10 border border-red-500/30'
                            }`}
                          >
                            <Star
                              className={`w-3 h-3 ${
                                playerDIP >= (action.dipCost ?? 0)
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}
                            />
                            <span
                              className={`text-sm font-semibold ${
                                playerDIP >= (action.dipCost ?? 0)
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {action.dipCost} DIP
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedDiplomacyModal;
