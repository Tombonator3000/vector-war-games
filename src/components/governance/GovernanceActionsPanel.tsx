import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Megaphone, Users, Flag, Building, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { GovernanceAction } from '@/lib/governanceActions';
import { governanceActions, canPerformGovernanceAction } from '@/lib/governanceActions';

interface GovernanceActionsPanelProps {
  nation: {
    id: string;
    name: string;
    production: number;
    intel: number;
    uranium: number;
    electionTimer: number;
    publicOpinion: number;
    governanceActionCooldowns?: Record<string, number>;
  };
  currentTurn: number;
  actionsRemaining: number;
  onExecuteAction: (actionId: string) => void;
}

export function GovernanceActionsPanel({
  nation,
  currentTurn,
  actionsRemaining,
  onExecuteAction,
}: GovernanceActionsPanelProps) {
  const [selectedAction, setSelectedAction] = useState<GovernanceAction | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const getActionIcon = (actionId: string) => {
    switch (actionId) {
      case 'campaign_rally':
        return <Megaphone className="h-5 w-5" />;
      case 'war_address':
        return <Flag className="h-5 w-5" />;
      case 'diplomatic_victory_publicity':
        return <Users className="h-5 w-5" />;
      case 'infrastructure_announcement':
        return <Building className="h-5 w-5" />;
      default:
        return <Megaphone className="h-5 w-5" />;
    }
  };

  const getCostString = (action: GovernanceAction): string => {
    const costs: string[] = [];
    if (action.cost.production) costs.push(`${action.cost.production} Prod`);
    if (action.cost.intel) costs.push(`${action.cost.intel} Intel`);
    if (action.cost.uranium) costs.push(`${action.cost.uranium} Uranium`);
    if (action.cost.actionPoints) costs.push(`${action.cost.actionPoints} AP`);
    return costs.join(', ');
  };

  const handleActionClick = (action: GovernanceAction) => {
    setSelectedAction(action);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (selectedAction) {
      onExecuteAction(selectedAction.id);
      setConfirmDialogOpen(false);
      setSelectedAction(null);
    }
  };

  return (
    <>
      <Card className="bg-slate-900/50 border-cyan-500/20 p-4">
        <div className="flex items-center gap-2 text-cyan-400 mb-4">
          <Megaphone className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Governance Actions</h3>
        </div>

        <div className="space-y-2">
          {governanceActions.map((action) => {
            const check = canPerformGovernanceAction(
              action,
              nation,
              nation.governanceActionCooldowns || {},
              currentTurn,
              actionsRemaining
            );

            return (
              <div
                key={action.id}
                className={`p-3 rounded-md border transition-all ${
                  check.canPerform
                    ? 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/40 cursor-pointer'
                    : 'bg-slate-800/30 border-slate-700/30 opacity-60'
                }`}
                onClick={() => check.canPerform && handleActionClick(action)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-0.5 ${check.canPerform ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {getActionIcon(action.id)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${check.canPerform ? 'text-cyan-100' : 'text-slate-400'}`}>
                          {action.name}
                        </span>
                        {!check.canPerform && (
                          <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
                            <Clock className="h-3 w-3 mr-1" />
                            {check.reason}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs bg-slate-700/30 text-slate-300 border-slate-600">
                          Cost: {getCostString(action)}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-slate-700/30 text-slate-300 border-slate-600">
                          Cooldown: {action.cooldownTurns} turns
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {check.canPerform ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {actionsRemaining === 0 && (
          <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">No actions remaining this turn</span>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="bg-slate-950 border-cyan-500/40 text-cyan-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-cyan-300">
              {selectedAction?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedAction?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-md bg-slate-900/50 border border-slate-700/50">
              <div className="text-sm font-medium text-slate-300 mb-2">Cost</div>
              <div className="text-sm text-slate-400">{selectedAction && getCostString(selectedAction)}</div>
            </div>

            <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Outcomes vary based on circumstances</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Success rate and effects depend on your current political situation.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="bg-cyan-600 hover:bg-cyan-700">
              Execute Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
