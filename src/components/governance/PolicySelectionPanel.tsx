import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Shield,
  Users,
  Globe,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target
} from 'lucide-react';
import { policies, getPolicyById, checkPolicyConflict, calculatePolicySynergies } from '@/lib/policyData';
import type { Policy, PolicyCategory, ActivePolicy } from '@/types/policy';
import type { AvailableFocus, NationalFocus } from '@/types/nationalFocus';

type ActiveFocusInfo = {
  focus: NationalFocus;
  progress: number;
  turnsRemaining: number;
};

interface PolicySelectionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activePolicies: ActivePolicy[];
  availableGold: number;
  availableProduction: number;
  availableIntel: number;
  currentTurn: number;
  onEnactPolicy: (policyId: string) => void;
  onRepealPolicy: (policyId: string) => void;
  playerActiveFocus?: ActiveFocusInfo | null;
  focusPaths?: Record<string, NationalFocus[]> | null;
  availableFocusLookup?: Map<string, AvailableFocus> | null;
  onStartFocus?: (focus: AvailableFocus) => void;
  onCancelFocus?: () => void;
}

export function PolicySelectionPanel({
  open,
  onOpenChange,
  activePolicies,
  availableGold,
  availableProduction,
  availableIntel,
  currentTurn,
  onEnactPolicy,
  onRepealPolicy,
  playerActiveFocus,
  focusPaths,
  availableFocusLookup,
  onStartFocus,
  onCancelFocus
}: PolicySelectionPanelProps) {
  const activePolicyIds = activePolicies.map(p => p.policyId);
  const synergies = calculatePolicySynergies(activePolicyIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-cyan-500/40 text-cyan-100 max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-cyan-300">
            National Policy Management
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="economic" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-slate-900/50">
            <TabsTrigger value="economic">
              <TrendingUp className="h-4 w-4 mr-2" />
              Economic
            </TabsTrigger>
            <TabsTrigger value="military">
              <Shield className="h-4 w-4 mr-2" />
              Military
            </TabsTrigger>
            <TabsTrigger value="social">
              <Users className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="foreign">
              <Globe className="h-4 w-4 mr-2" />
              Foreign
            </TabsTrigger>
            <TabsTrigger value="active">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Active ({activePolicies.length})
            </TabsTrigger>
            <TabsTrigger value="focus">
              <Target className="h-4 w-4 mr-2" />
              Focus
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="economic" className="space-y-3">
              <CategoryPolicyList
                category="economic"
                activePolicyIds={activePolicyIds}
                synergies={synergies}
                availableGold={availableGold}
                availableProduction={availableProduction}
                availableIntel={availableIntel}
                currentTurn={currentTurn}
                onEnact={onEnactPolicy}
              />
            </TabsContent>

            <TabsContent value="military" className="space-y-3">
              <CategoryPolicyList
                category="military"
                activePolicyIds={activePolicyIds}
                synergies={synergies}
                availableGold={availableGold}
                availableProduction={availableProduction}
                availableIntel={availableIntel}
                currentTurn={currentTurn}
                onEnact={onEnactPolicy}
              />
            </TabsContent>

            <TabsContent value="social" className="space-y-3">
              <CategoryPolicyList
                category="social"
                activePolicyIds={activePolicyIds}
                synergies={synergies}
                availableGold={availableGold}
                availableProduction={availableProduction}
                availableIntel={availableIntel}
                currentTurn={currentTurn}
                onEnact={onEnactPolicy}
              />
            </TabsContent>

            <TabsContent value="foreign" className="space-y-3">
              <CategoryPolicyList
                category="foreign"
                activePolicyIds={activePolicyIds}
                synergies={synergies}
                availableGold={availableGold}
                availableProduction={availableProduction}
                availableIntel={availableIntel}
                currentTurn={currentTurn}
                onEnact={onEnactPolicy}
              />
            </TabsContent>

            <TabsContent value="active" className="space-y-3">
              <ActivePoliciesList
                activePolicies={activePolicies}
                synergies={synergies}
                onRepeal={onRepealPolicy}
                availableGold={availableGold}
                availableProduction={availableProduction}
                availableIntel={availableIntel}
              />
            </TabsContent>

            <TabsContent value="focus" className="space-y-4">
              <FocusManagementTab
                activeFocus={playerActiveFocus ?? null}
                focusPaths={focusPaths ?? null}
                availableFocusLookup={availableFocusLookup ?? null}
                onStartFocus={onStartFocus}
                onCancelFocus={onCancelFocus}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface CategoryPolicyListProps {
  category: PolicyCategory;
  activePolicyIds: string[];
  synergies: Map<string, any>;
  availableGold: number;
  availableProduction: number;
  availableIntel: number;
  currentTurn: number;
  onEnact: (policyId: string) => void;
}

function CategoryPolicyList({
  category,
  activePolicyIds,
  synergies,
  availableGold,
  availableProduction,
  availableIntel,
  currentTurn,
  onEnact
}: CategoryPolicyListProps) {
  const categoryPolicies = policies.filter(p => p.category === category);
  
  return (
    <div className="space-y-3">
      {categoryPolicies.map(policy => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          isActive={activePolicyIds.includes(policy.id)}
          hasSynergy={synergies.has(policy.id)}
          conflictWith={checkPolicyConflict(policy.id, activePolicyIds)}
          canAfford={canAffordPolicy(policy, availableGold, availableProduction, availableIntel)}
          meetsPrerequisites={checkPrerequisites(policy, currentTurn)}
          onEnact={onEnact}
        />
      ))}
    </div>
  );
}

interface PolicyCardProps {
  policy: Policy;
  isActive: boolean;
  hasSynergy: boolean;
  conflictWith: string | null;
  canAfford: boolean;
  meetsPrerequisites: boolean;
  onEnact: (policyId: string) => void;
}

function PolicyCard({
  policy,
  isActive,
  hasSynergy,
  conflictWith,
  canAfford,
  meetsPrerequisites,
  onEnact
}: PolicyCardProps) {
  const canEnact = !isActive && !conflictWith && canAfford && meetsPrerequisites;

  return (
    <Card className={`p-4 ${
      isActive ? 'bg-cyan-950/30 border-cyan-500/40' : 
      'bg-slate-900/50 border-cyan-500/20'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-semibold text-cyan-200">{policy.name}</h4>
            <Badge variant="outline" className="text-xs">
              Tier {policy.tier}
            </Badge>
            {isActive && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
            {hasSynergy && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">
                <Zap className="h-3 w-3 mr-1" />
                Synergy
              </Badge>
            )}
          </div>
          <p className="text-sm text-cyan-100/80 mb-2">{policy.description}</p>
          {policy.flavorText && (
            <p className="text-xs italic text-cyan-400/60 mb-3">"{policy.flavorText}"</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <h5 className="text-xs font-semibold text-cyan-400 mb-2">Enactment Cost</h5>
          <div className="space-y-1 text-xs">
            {policy.enactmentCost.gold && (
              <div className="flex justify-between">
                <span className="text-cyan-300">Gold:</span>
                <span className="font-mono text-cyan-100">{policy.enactmentCost.gold}</span>
              </div>
            )}
            {policy.enactmentCost.production && (
              <div className="flex justify-between">
                <span className="text-cyan-300">Production:</span>
                <span className="font-mono text-cyan-100">{policy.enactmentCost.production}</span>
              </div>
            )}
            {policy.enactmentCost.intel && (
              <div className="flex justify-between">
                <span className="text-cyan-300">Intel:</span>
                <span className="font-mono text-cyan-100">{policy.enactmentCost.intel}</span>
              </div>
            )}
          </div>
        </div>

        {policy.maintenanceCost && (
          <div>
            <h5 className="text-xs font-semibold text-cyan-400 mb-2">Per Turn Cost</h5>
            <div className="space-y-1 text-xs">
              {policy.maintenanceCost.gold && (
                <div className="flex justify-between">
                  <span className="text-cyan-300">Gold:</span>
                  <span className="font-mono text-red-300">-{policy.maintenanceCost.gold}</span>
                </div>
              )}
              {policy.maintenanceCost.intel && (
                <div className="flex justify-between">
                  <span className="text-cyan-300">Intel:</span>
                  <span className="font-mono text-red-300">-{policy.maintenanceCost.intel}</span>
                </div>
              )}
              {policy.maintenanceCost.moralePerTurn && (
                <div className="flex justify-between">
                  <span className="text-cyan-300">Morale:</span>
                  <span className="font-mono text-red-300">{policy.maintenanceCost.moralePerTurn}/turn</span>
                </div>
              )}
              {policy.maintenanceCost.approvalPerTurn && (
                <div className="flex justify-between">
                  <span className="text-cyan-300">Approval:</span>
                  <span className="font-mono text-red-300">{policy.maintenanceCost.approvalPerTurn}/turn</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mb-3">
        <h5 className="text-xs font-semibold text-cyan-400 mb-2">Effects</h5>
        <p className="text-xs text-emerald-300">{policy.effects.description}</p>
      </div>

      {conflictWith && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded">
          <div className="flex items-center gap-2 text-xs text-red-300">
            <AlertTriangle className="h-3 w-3" />
            Conflicts with: {conflictWith}
          </div>
        </div>
      )}

      {!meetsPrerequisites && (
        <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
          <div className="flex items-center gap-2 text-xs text-yellow-300">
            <Lock className="h-3 w-3" />
            Prerequisites not met
          </div>
        </div>
      )}

      <div className="flex justify-end">
        {isActive ? (
          <Badge variant="outline" className="text-emerald-400 border-emerald-400">
            Currently Active
          </Badge>
        ) : (
          <Button
            variant={canEnact ? 'default' : 'ghost'}
            size="sm"
            disabled={!canEnact}
            onClick={() => onEnact(policy.id)}
            className={canEnact ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
          >
            {conflictWith ? 'Conflicts' : !meetsPrerequisites ? 'Locked' : !canAfford ? 'Cannot Afford' : 'Enact Policy'}
          </Button>
        )}
      </div>
    </Card>
  );
}

interface ActivePoliciesListProps {
  activePolicies: ActivePolicy[];
  synergies: Map<string, any>;
  onRepeal: (policyId: string) => void;
  availableGold: number;
  availableProduction: number;
  availableIntel: number;
}

function ActivePoliciesList({
  activePolicies,
  synergies,
  onRepeal,
  availableGold,
  availableProduction,
  availableIntel
}: ActivePoliciesListProps) {
  if (activePolicies.length === 0) {
    return (
      <div className="text-center py-12 text-cyan-400/60">
        <p>No policies currently active</p>
        <p className="text-sm mt-2">Enact policies from other tabs to gain strategic advantages</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activePolicies.map(activePolicy => {
        const policy = getPolicyById(activePolicy.policyId);
        if (!policy) return null;

        const hasSynergy = synergies.has(policy.id);
        const canAffordRepeal = policy.repealCost ? 
          canAffordPolicy({ ...policy, enactmentCost: policy.repealCost }, availableGold, availableProduction, availableIntel) :
          true;

        return (
          <Card key={policy.id} className="p-4 bg-cyan-950/20 border-cyan-500/30">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-semibold text-cyan-200">{policy.name}</h4>
                  {hasSynergy && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">
                      <Zap className="h-3 w-3 mr-1" />
                      Synergy Active!
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-cyan-100/80 mb-2">{policy.description}</p>
                <p className="text-xs text-cyan-400/80">
                  Active for {activePolicy.turnsActive} turns (since turn {activePolicy.enactedTurn})
                </p>
              </div>
            </div>

            <div className="mb-3">
              <h5 className="text-xs font-semibold text-cyan-400 mb-2">Active Effects</h5>
              <p className="text-xs text-emerald-300">{policy.effects.description}</p>
              {hasSynergy && policy.synergyBonus && (
                <p className="text-xs text-yellow-300 mt-1">
                  + Synergy: {policy.synergyBonus.description}
                </p>
              )}
            </div>

            {policy.canRepeal && (
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!canAffordRepeal}
                  onClick={() => onRepeal(policy.id)}
                >
                  {policy.repealCost ? 
                    `Repeal (${policy.repealCost.gold || 0}💰)` : 
                    'Repeal Policy'
                  }
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

interface FocusManagementTabProps {
  activeFocus: ActiveFocusInfo | null;
  focusPaths: Record<string, NationalFocus[]> | null;
  availableFocusLookup: Map<string, AvailableFocus> | null;
  onStartFocus?: (focus: AvailableFocus) => void;
  onCancelFocus?: () => void;
}

function FocusManagementTab({
  activeFocus,
  focusPaths,
  availableFocusLookup,
  onStartFocus,
  onCancelFocus
}: FocusManagementTabProps) {
  if (!focusPaths || !availableFocusLookup || availableFocusLookup.size === 0) {
    return (
      <div className="rounded-lg border border-cyan-500/30 bg-slate-950/60 p-6 text-center text-sm text-cyan-300/80">
        National focus information will appear here once a nation with an initialized focus tree is selected.
      </div>
    );
  }

  const pathEntries = Object.entries(focusPaths).filter(([, focuses]) => focuses.length > 0);

  return (
    <div className="space-y-6">
      <Card className="border-cyan-500/40 bg-slate-950/60 p-4">
        {activeFocus ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-cyan-200">{activeFocus.focus.name}</h3>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">Active</Badge>
                </div>
                <p className="mt-1 text-sm text-cyan-300/80">{activeFocus.focus.description}</p>
              </div>
              {onCancelFocus ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onCancelFocus}
                  className="self-start"
                >
                  Cancel Focus
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-cyan-300/70">
                <span>Progress</span>
                <span>{Math.round(activeFocus.progress)}%</span>
              </div>
              <Progress value={activeFocus.progress} className="h-2 bg-slate-900" />
              <p className="text-xs text-cyan-400/80">
                {activeFocus.turnsRemaining} turn{activeFocus.turnsRemaining === 1 ? '' : 's'} remaining
              </p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-cyan-300/80">
            No active focus. Start one from the list below to guide your nation's long-term strategy.
          </div>
        )}
      </Card>

      {pathEntries.length === 0 ? (
        <div className="rounded-lg border border-cyan-500/30 bg-slate-950/60 p-6 text-center text-sm text-cyan-300/80">
          No focus branches are currently available for this nation.
        </div>
      ) : (
        <div className="space-y-6">
          {pathEntries.map(([path, focuses]) => (
            <div key={path} className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold capitalize text-cyan-200">{formatFocusPathLabel(path)}</h4>
                <Badge variant="outline" className="text-xs text-cyan-300 border-cyan-500/40">
                  {focuses.length} focuses
                </Badge>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {focuses.map(focus => {
                  const focusDetails = availableFocusLookup.get(focus.id);
                  if (!focusDetails) return null;

                  const canStart = focusDetails.canStart && !focusDetails.isActive;
                  const missingPrereqs = focusDetails.missingPrerequisites;
                  const statusBadges: ReactNode[] = [];

                  if (focusDetails.isActive) {
                    statusBadges.push(
                      <Badge
                        key="active"
                        className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      >
                        Active
                      </Badge>
                    );
                  }

                  if (focusDetails.isCompleted) {
                    statusBadges.push(
                      <Badge
                        key="completed"
                        className="bg-cyan-500/20 text-cyan-200 border-cyan-500/40"
                      >
                        Completed
                      </Badge>
                    );
                  }

                  if (focusDetails.isLocked && !focusDetails.isActive && !focusDetails.isCompleted) {
                    statusBadges.push(
                      <Badge
                        key="locked"
                        variant="outline"
                        className="border-yellow-500/40 text-yellow-300"
                      >
                        Locked
                      </Badge>
                    );
                  }

                  const disabledReason = (() => {
                    if (focusDetails.isCompleted) return 'Completed';
                    if (focusDetails.isActive) return 'In Progress';
                    if (focusDetails.isLocked) return 'Locked';
                    if (missingPrereqs.length > 0) return `Requires: ${missingPrereqs.join(', ')}`;
                    if (!focusDetails.canStart) return 'Unavailable';
                    return null;
                  })();

                  return (
                    <Card
                      key={focus.id}
                      className="flex flex-col gap-3 border-cyan-500/20 bg-slate-900/60 p-4"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="text-base font-semibold text-cyan-200">{focus.name}</h5>
                          {statusBadges}
                        </div>
                        <p className="text-sm text-cyan-300/80">{focus.description}</p>
                      </div>

                      <div className="grid gap-2 text-xs text-cyan-300/70 sm:grid-cols-2">
                        <div>
                          <p className="font-semibold text-cyan-200/80">Completion Time</p>
                          <p>{focus.completionTime} turns</p>
                        </div>
                        <div>
                          <p className="font-semibold text-cyan-200/80">Political Power Cost</p>
                          <p>{focus.ppCost}</p>
                        </div>
                      </div>

                      {missingPrereqs.length > 0 && (
                        <div className="rounded border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
                          <p className="font-semibold">Missing Prerequisites</p>
                          <p>{missingPrereqs.join(', ')}</p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant={canStart ? 'default' : 'ghost'}
                          disabled={!canStart || !onStartFocus}
                          onClick={() => focusDetails && onStartFocus?.(focusDetails)}
                          className={canStart ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                        >
                          {canStart ? 'Start Focus' : disabledReason || 'Unavailable'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatFocusPathLabel(path: string): string {
  switch (path) {
    case 'diplomatic':
      return 'Diplomatic Path';
    case 'economic':
      return 'Economic Path';
    case 'intelligence':
      return 'Intelligence Path';
    case 'military':
      return 'Military Path';
    case 'special':
      return 'Special Projects';
    default:
      return path.charAt(0).toUpperCase() + path.slice(1);
  }
}

function canAffordPolicy(
  policy: Policy, 
  gold: number, 
  production: number, 
  intel: number
): boolean {
  const cost = policy.enactmentCost;
  if (cost.gold && gold < cost.gold) return false;
  if (cost.production && production < cost.production) return false;
  if (cost.intel && intel < cost.intel) return false;
  return true;
}

function checkPrerequisites(policy: Policy, currentTurn: number): boolean {
  for (const prereq of policy.prerequisites) {
    if (prereq.type === 'turn' && currentTurn < (prereq.value as number)) {
      return false;
    }
    // Add other prerequisite checks as needed
  }
  return true;
}
