/**
 * Phase 2 Doctrine Specialization Panel
 * Displays doctrine-specific Phase 2 mechanics (Weeks 4-7)
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Skull,
  Network,
  Sparkles,
  Zap,
  Eye,
  Target,
  Users,
  Brain,
  Heart,
  Flame,
  Shield,
  AlertTriangle,
  TrendingUp,
  Lock,
  Unlock,
} from 'lucide-react';
import type { GreatOldOnesState, Doctrine, OccultVictoryType } from '@/types/greatOldOnes';
import { OCCULT_VICTORY_CONDITIONS } from '@/types/greatOldOnes';
import type { Phase2State } from '@/lib/phase2Integration';
import { checkPhase2UnlockConditions } from '@/lib/phase2Integration';
import type { InstitutionBenefit } from '@/lib/corruptionPath';

const BENEFIT_LABELS: Record<InstitutionBenefit['type'], string> = {
  resource_generation: 'Resource Generation',
  investigation_suppression: 'Investigation Suppression',
  veil_protection: 'Veil Protection',
  cultist_recruitment: 'Cultist Recruitment',
  ritual_support: 'Ritual Support',
};

function formatInstitutionBenefit(benefit: InstitutionBenefit): string {
  const label = BENEFIT_LABELS[benefit.type];
  return `${label} +${benefit.value}`;
}

export interface Phase2Operation {
  type: string;
  cost: Record<string, number>;
}

interface Phase2DoctrinePanelProps {
  state: GreatOldOnesState;
  phase2State: Phase2State;
  onClose?: () => void;
  onOperation?: (operation: Phase2Operation) => void;
}

export const Phase2DoctrinePanel: React.FC<Phase2DoctrinePanelProps> = ({
  state,
  phase2State,
  onClose,
  onOperation,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'progress'>('overview');

  if (!phase2State.unlocked) {
    return <Phase2LockedView state={state} phase2State={phase2State} />;
  }

  const doctrine = state.doctrine;

  return (
    <Card className="bg-slate-900 border-slate-700 max-w-5xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-slate-100 flex items-center gap-2">
            {getDoctrineIcon(doctrine)}
            Phase 2: Doctrine Specialization
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400">
              ×
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Week {phase2State.currentWeek} •</span>
          <Badge variant="outline" className={getDoctrineColorClass(doctrine)}>
            {getDoctrineTitle(doctrine)}
          </Badge>
          <span className="ml-auto">Doctrine Points: {phase2State.doctrinePoints}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-700">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<Eye className="w-4 h-4" />}
          >
            Overview
          </TabButton>
          <TabButton
            active={activeTab === 'operations'}
            onClick={() => setActiveTab('operations')}
            icon={<Target className="w-4 h-4" />}
          >
            Operations
          </TabButton>
          <TabButton
            active={activeTab === 'progress'}
            onClick={() => setActiveTab('progress')}
            icon={<TrendingUp className="w-4 h-4" />}
          >
            Progress
          </TabButton>
        </div>

        {/* Doctrine-Specific Content */}
        <div className="min-h-[500px]">
          {activeTab === 'overview' && (
            <>
              {doctrine === 'domination' && (
                <DominationOverview state={state} phase2State={phase2State} />
              )}
              {doctrine === 'corruption' && (
                <CorruptionOverview state={state} phase2State={phase2State} />
              )}
              {doctrine === 'convergence' && (
                <ConvergenceOverview state={state} phase2State={phase2State} />
              )}
            </>
          )}

          {activeTab === 'operations' && (
            <>
              {doctrine === 'domination' && (
                <DominationOperations state={state} phase2State={phase2State} onOperation={onOperation} />
              )}
              {doctrine === 'corruption' && (
                <CorruptionOperations state={state} phase2State={phase2State} onOperation={onOperation} />
              )}
              {doctrine === 'convergence' && (
                <ConvergenceOperations state={state} phase2State={phase2State} onOperation={onOperation} />
              )}
            </>
          )}

          {activeTab === 'progress' && (
            <ProgressView state={state} phase2State={phase2State} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// LOCKED VIEW (Pre-unlock)
// ============================================================================

const Phase2LockedView: React.FC<{ state: GreatOldOnesState; phase2State: Phase2State }> = ({
  state,
  phase2State,
}) => {
  const unlockCheck = checkPhase2UnlockConditions(state);

  return (
    <Card className="bg-slate-900 border-slate-700 max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-slate-100 flex items-center gap-2">
          <Lock className="w-6 h-6 text-amber-500" />
          Phase 2: Doctrine Specialization
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Advance your Order to unlock powerful doctrine-specific abilities
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DoctrinePreview
            doctrine="domination"
            title="Path of Domination"
            description="Summon powerful entities, spread terror, and awaken Great Old Ones"
            features={['Entity Summoning', 'Terror Campaigns', 'Military Confrontation', 'Beast Awakening']}
          />
          <DoctrinePreview
            doctrine="corruption"
            title="Path of Corruption"
            description="Infiltrate institutions, spread memetic viruses, and control puppet governments"
            features={['Influence Networks', 'Memetic Warfare', 'Dream Invasion', 'Puppet Governments']}
          />
          <DoctrinePreview
            doctrine="convergence"
            title="Path of Convergence"
            description="Offer enlightenment, transform humanity, and achieve transcendence"
            features={['Enlightenment Programs', 'Cultural Transformation', 'Voluntary Sacrifice', 'True Intentions']}
          />
        </div>

        <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/50">
          <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Unlock className="w-5 h-5 text-amber-500" />
            Unlock Requirements
          </h3>

          <div className="space-y-3">
            {unlockCheck.shouldUnlock ? (
              <div className="text-green-400 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>All requirements met! Phase 2 will unlock next turn.</span>
              </div>
            ) : (
              <div className="text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>{unlockCheck.reason}</span>
              </div>
            )}

            <RequirementItem
              label="Corrupted Regions (>30%)"
              current={state.regions.filter(r => r.corruption > 30).length}
              required={3}
            />
            <RequirementItem
              label="Council Unity"
              current={state.council.unity}
              required={60}
              isPercentage
            />
            <RequirementItem
              label="Ritual Sites"
              current={state.regions.reduce((sum, r) => sum + r.ritualSites.length, 0)}
              required={5}
            />
            <RequirementItem
              label="Eldritch Power"
              current={state.resources.eldritchPower}
              required={100}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// DOMINATION PATH COMPONENTS
// ============================================================================

const DominationOverview: React.FC<{ state: GreatOldOnesState; phase2State: Phase2State }> = ({
  state,
  phase2State,
}) => {
  const dom = phase2State.domination;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Skull className="w-5 h-5 text-red-400" />}
          label="Summoned Entities"
          value={state.summonedEntities.length}
          className="bg-red-900/20 border-red-800"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          label="Global Fear Level"
          value={`${dom.fearLevel.toFixed(0)}%`}
          className="bg-orange-900/20 border-orange-800"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />}
          label="Terror Campaigns"
          value={dom.terrorCampaigns.length}
          className="bg-yellow-900/20 border-yellow-800"
        />
        <StatCard
          icon={<Eye className="w-5 h-5 text-purple-400" />}
          label="Rampaging Entities"
          value={dom.entityRampages.length}
          className="bg-purple-900/20 border-purple-800"
        />
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">Entity Control Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {state.summonedEntities.length === 0 ? (
              <p className="text-slate-400 text-sm">No entities summoned yet</p>
            ) : (
              state.summonedEntities.slice(0, 5).map(entity => (
                <div key={entity.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded">
                  <div>
                    <div className="font-medium text-slate-200">{entity.name}</div>
                    <div className="text-xs text-slate-400">{entity.tier} • {entity.task}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Binding</div>
                      <Progress
                        value={entity.bindingStrength}
                        className="w-24 h-2"
                      />
                      <div className="text-xs mt-1">{entity.bindingStrength}%</div>
                    </div>
                    <Badge variant={entity.bound ? 'default' : 'destructive'}>
                      {entity.bound ? 'Bound' : 'Free'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">Great Old One Awakenings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dom.greatOldOneAwakenings.length === 0 ? (
              <p className="text-slate-400 text-sm">No awakening rituals in progress</p>
            ) : (
              dom.greatOldOneAwakenings.map(awakening => (
                <div key={awakening.entityName} className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-200 text-lg">{awakening.entityName}</h3>
                    <Badge variant="outline" className="bg-purple-900/30 text-purple-300">
                      Stage {awakening.currentStage + 1}/{awakening.stages.length}
                    </Badge>
                  </div>
                  <Progress value={awakening.progress} className="mb-2" />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Progress: {awakening.progress.toFixed(0)}%</span>
                    <span>Sites: {awakening.sitesActivated.length}/{awakening.sitesRequired}</span>
                  </div>
                  {awakening.requiresStarsRight && !awakening.starsAligned && (
                    <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Final stage requires stellar alignment
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DominationOperations: React.FC<{
  state: GreatOldOnesState;
  phase2State: Phase2State;
  onOperation?: (operation: Phase2Operation) => void;
}> = ({ state, phase2State, onOperation }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OperationCard
          title="Summoning Ritual"
          description="Summon eldritch entities to serve the Order"
          icon={<Skull className="w-6 h-6" />}
          cost={{ sanityFragments: 50, eldritchPower: 30, cultists: 8 }}
          available={state.resources.sanityFragments >= 50 && state.resources.eldritchPower >= 30}
          onExecute={() => onOperation?.({ type: 'summon-entity', cost: { sanityFragments: 50, eldritchPower: 30, cultists: 8 } })}
        />
        <OperationCard
          title="Terror Campaign"
          description="Spread fear through public manifestations"
          icon={<Flame className="w-6 h-6" />}
          cost={{ eldritchPower: 20, entities: 2 }}
          available={state.summonedEntities.filter(e => e.bound).length >= 2}
          onExecute={() => onOperation?.({ type: 'terror-campaign', cost: { eldritchPower: 20, entities: 2 } })}
        />
        <OperationCard
          title="Military Assault"
          description="Direct combat against conventional forces"
          icon={<Target className="w-6 h-6" />}
          cost={{ entities: 3 }}
          available={state.summonedEntities.filter(e => e.bound).length >= 3}
          onExecute={() => onOperation?.({ type: 'military-assault', cost: { entities: 3 } })}
        />
        <OperationCard
          title="Awakening Ritual"
          description="Progress Great Old One awakening"
          icon={<Eye className="w-6 h-6" />}
          cost={{ sanityFragments: 300, eldritchPower: 200, cultists: 50 }}
          available={false}
          onExecute={() => onOperation?.({ type: 'awakening-ritual', cost: { sanityFragments: 300, eldritchPower: 200, cultists: 50 } })}
        />
      </div>
    </div>
  );
};

// ============================================================================
// CORRUPTION PATH COMPONENTS
// ============================================================================

const CorruptionOverview: React.FC<{ state: GreatOldOnesState; phase2State: Phase2State }> = ({
  state,
  phase2State,
}) => {
  const cor = phase2State.corruption;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Network className="w-5 h-5 text-blue-400" />}
          label="Influence Nodes"
          value={cor.influenceNetwork.nodes.length}
          className="bg-blue-900/20 border-blue-800"
        />
        <StatCard
          icon={<Brain className="w-5 h-5 text-purple-400" />}
          label="Memetic Campaigns"
          value={cor.memeticCampaigns.length}
          className="bg-purple-900/20 border-purple-800"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-green-400" />}
          label="Puppet Governments"
          value={cor.puppetGovernments.length}
          className="bg-green-900/20 border-green-800"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-red-400" />}
          label="Global Infiltration"
          value={`${cor.globalInfiltration.toFixed(0)}%`}
          className="bg-red-900/20 border-red-800"
        />
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">Influence Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cor.influenceNetwork.nodes.length === 0 ? (
              <p className="text-slate-400 text-sm">No influence nodes established</p>
            ) : (
              cor.influenceNetwork.nodes.slice(0, 5).map(node => (
                <div
                  key={node.id}
                  className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-3 bg-slate-900/50 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-200">{node.name}</div>
                    <div className="text-xs text-slate-400">{node.institutionType} • {node.regionId}</div>
                    {node.benefits.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {node.benefits.map(benefit => (
                          <div
                            key={`${node.id}-${benefit.type}-${benefit.description}`}
                            className="flex flex-wrap items-center gap-2 text-xs"
                          >
                            <Badge
                              variant="outline"
                              className="border-slate-700 bg-slate-900/70 text-slate-100"
                            >
                              {formatInstitutionBenefit(benefit)}
                            </Badge>
                            <span className="text-slate-400">{benefit.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Corruption</div>
                      <Progress value={node.corruptionLevel} className="w-24 h-2" />
                      <div className="text-xs mt-1">{node.corruptionLevel.toFixed(0)}%</div>
                    </div>
                    <Badge variant={node.underInvestigation ? 'destructive' : 'default'}>
                      {node.underInvestigation ? 'Under Investigation' : 'Secure'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">Active Memetic Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cor.memeticCampaigns.length === 0 ? (
              <p className="text-slate-400 text-sm">No memetic campaigns active</p>
            ) : (
              cor.memeticCampaigns.map(campaign => (
                <div key={campaign.id} className="p-3 bg-slate-900/50 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-slate-200">{campaign.agent.name}</div>
                      <div className="text-xs text-slate-400">{campaign.agent.type}</div>
                    </div>
                    <Badge>{campaign.targetRegionId}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Reach:</span>{' '}
                      <span className="text-slate-200">{campaign.agent.reach.toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Virality:</span>{' '}
                      <span className="text-slate-200">{campaign.agent.virality.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Resistance:</span>{' '}
                      <span className="text-slate-200">{campaign.agent.resistance.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CorruptionOperations: React.FC<{
  state: GreatOldOnesState;
  phase2State: Phase2State;
  onOperation?: (operation: Phase2Operation) => void;
}> = ({ state, phase2State, onOperation }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OperationCard
          title="Infiltrate Institution"
          description="Establish influence in a new institution"
          icon={<Network className="w-6 h-6" />}
          cost={{ cultists: 5, eldritchPower: 20 }}
          available={true}
          onExecute={() => onOperation?.({ type: 'infiltrate-institution', cost: { cultists: 5, eldritchPower: 20 } })}
        />
        <OperationCard
          title="Launch Memetic Agent"
          description="Create and spread an idea virus"
          icon={<Brain className="w-6 h-6" />}
          cost={{ eldritchPower: 30 }}
          available={state.resources.eldritchPower >= 30}
          onExecute={() => onOperation?.({ type: 'launch-memetic-agent', cost: { eldritchPower: 30 } })}
        />
        <OperationCard
          title="Dream Invasion"
          description="Mass nightmare ritual targeting region"
          icon={<Moon className="w-6 h-6" />}
          cost={{ eldritchPower: 50, ritualSite: 1 }}
          available={state.resources.eldritchPower >= 50}
          onExecute={() => onOperation?.({ type: 'dream-invasion', cost: { eldritchPower: 50, ritualSite: 1 } })}
        />
        <OperationCard
          title="Activate Sleeper Cells"
          description="Coordinate network-wide operation"
          icon={<Target className="w-6 h-6" />}
          cost={{ networkNodes: 3 }}
          available={phase2State.corruption.influenceNetwork.nodes.length >= 3}
          onExecute={() => onOperation?.({ type: 'activate-sleeper-cells', cost: { networkNodes: 3 } })}
        />
      </div>
    </div>
  );
};

// ============================================================================
// CONVERGENCE PATH COMPONENTS
// ============================================================================

const ConvergenceOverview: React.FC<{ state: GreatOldOnesState; phase2State: Phase2State }> = ({
  state,
  phase2State,
}) => {
  const conv = phase2State.convergence;
  const meter = conv.trueIntentionsMeter;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Sparkles className="w-5 h-5 text-cyan-400" />}
          label="Enlightenment Programs"
          value={conv.enlightenmentPrograms.length}
          className="bg-cyan-900/20 border-cyan-800"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          label="Cultural Movements"
          value={conv.culturalMovements.length}
          className="bg-blue-900/20 border-blue-800"
        />
        <StatCard
          icon={<Heart className="w-5 h-5 text-pink-400" />}
          label="Hybrids Created"
          value={conv.hybridsCreated}
          className="bg-pink-900/20 border-pink-800"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-400" />}
          label="Conversion Rate"
          value={`${conv.voluntaryConversionRate.toFixed(0)}%`}
          className="bg-green-900/20 border-green-800"
        />
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">True Intentions Meter</CardTitle>
          <p className="text-xs text-slate-400">Your honesty vs. deception with converts</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Morality Score</span>
                <span className={getMoralityColor(meter.moralityScore)}>
                  {meter.moralityScore > 0 ? '+' : ''}{meter.moralityScore}
                </span>
              </div>
              <Progress
                value={((meter.moralityScore + 100) / 200) * 100}
                className="h-3"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Evil (-100)</span>
                <span>Neutral (0)</span>
                <span>Good (+100)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Public Trust</div>
                <div className="text-slate-200 font-semibold">{meter.publicTrust.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-slate-400">Deception Level</div>
                <div className="text-slate-200 font-semibold">{meter.deceptionLevel.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-slate-400">Promises Made</div>
                <div className="text-slate-200 font-semibold">{meter.promises.length}</div>
              </div>
              <div>
                <div className="text-slate-400">Betrayals</div>
                <div className="text-red-400 font-semibold">{meter.betrayals.length}</div>
              </div>
            </div>

            {meter.redemptionAvailable ? (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 p-2 rounded">
                <Unlock className="w-4 h-4" />
                <span>Redemption path still available</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 p-2 rounded">
                <Lock className="w-4 h-4" />
                <span>Redemption locked - too many betrayals</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">Enlightenment Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conv.enlightenmentPrograms.length === 0 ? (
              <p className="text-slate-400 text-sm">No enlightenment programs established</p>
            ) : (
              conv.enlightenmentPrograms.map(program => (
                <div key={program.id} className="p-3 bg-slate-900/50 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-slate-200">{program.name}</div>
                      <div className="text-xs text-slate-400">{program.type} • {program.regionId}</div>
                    </div>
                    <Badge variant="outline">Stage {program.currentStage + 1}/{program.stages.length}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Enrolled:</span>{' '}
                      <span className="text-slate-200">{program.enrollmentCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Conversion:</span>{' '}
                      <span className="text-slate-200">{program.conversionRate.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Truth:</span>{' '}
                      <span className="text-slate-200">{program.truthLevel.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ConvergenceOperations: React.FC<{
  state: GreatOldOnesState;
  phase2State: Phase2State;
  onOperation?: (operation: Phase2Operation) => void;
}> = ({ state, phase2State, onOperation }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OperationCard
          title="Establish Program"
          description="Create new enlightenment program"
          icon={<Sparkles className="w-6 h-6" />}
          cost={{ eldritchPower: 30, sanityFragments: 20 }}
          available={state.resources.eldritchPower >= 30}
          onExecute={() => onOperation?.({ type: 'establish-program', cost: { eldritchPower: 30, sanityFragments: 20 } })}
        />
        <OperationCard
          title="Cultural Movement"
          description="Start new philosophical/artistic movement"
          icon={<Users className="w-6 h-6" />}
          cost={{ eldritchPower: 25 }}
          available={state.resources.eldritchPower >= 25}
          onExecute={() => onOperation?.({ type: 'cultural-movement', cost: { eldritchPower: 25 } })}
        />
        <OperationCard
          title="Celebrity Endorsement"
          description="Recruit high-profile endorser"
          icon={<Star className="w-6 h-6" />}
          cost={{ sanityFragments: 50, eldritchPower: 40 }}
          available={state.resources.sanityFragments >= 50}
          onExecute={() => onOperation?.({ type: 'celebrity-endorsement', cost: { sanityFragments: 50, eldritchPower: 40 } })}
        />
        <OperationCard
          title="Redemption Act"
          description="Attempt to redeem past betrayals"
          icon={<Heart className="w-6 h-6" />}
          cost={{ doctrinePoints: 50 }}
          available={phase2State.convergence.trueIntentionsMeter.redemptionAvailable}
          onExecute={() => onOperation?.({ type: 'redemption-act', cost: { doctrinePoints: 50 } })}
        />
      </div>
    </div>
  );
};

// ============================================================================
// SHARED PROGRESS VIEW
// ============================================================================

const ProgressView: React.FC<{ state: GreatOldOnesState; phase2State: Phase2State }> = ({
  state,
  phase2State,
}) => {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">Elder One Favor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(phase2State.elderOneFavor).map(([entity, favor]) => (
              <div key={entity}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-200 capitalize">{entity.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-slate-400">{favor}</span>
                </div>
                <Progress value={(favor / 100) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Victory Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm mb-4">
            Track your progress toward doctrine-specific victory conditions
          </p>

          {(() => {
            // Get victory conditions for current doctrine
            const currentDoctrine = state.doctrine || 'domination';
            const availableVictories = Object.values(OCCULT_VICTORY_CONDITIONS).filter(
              vc => vc.doctrinesAllowed.includes(currentDoctrine)
            );

            if (availableVictories.length === 0) {
              return (
                <div className="text-xs text-slate-500">
                  No victory conditions available for this doctrine
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {availableVictories.map(victory => {
                  const conditions = victory.conditions;
                  let totalProgress = 0;
                  let totalConditions = 0;
                  const conditionDetails: Array<{ label: string; current: number; required: number; progress: number }> = [];

                  // Corruption Threshold
                  if (conditions.corruptionThreshold !== undefined) {
                    totalConditions++;
                    const regions = state.regions || [];
                    const avgCorruption = regions.length > 0
                      ? regions.reduce((sum, r) => sum + (r.corruption || 0), 0) / regions.length
                      : 0;
                    const progress = Math.min(100, (avgCorruption / conditions.corruptionThreshold) * 100);
                    totalProgress += progress;
                    conditionDetails.push({
                      label: 'Corruption Level',
                      current: Math.round(avgCorruption),
                      required: conditions.corruptionThreshold,
                      progress,
                    });
                  }

                  // Entities Awakened
                  if (conditions.entitiesAwakened !== undefined) {
                    totalConditions++;
                    const awakened = (state.summonedEntities || []).filter(e => e.tier === 'great_old_one').length;
                    const progress = Math.min(100, (awakened / conditions.entitiesAwakened) * 100);
                    totalProgress += progress;
                    conditionDetails.push({
                      label: 'Great Old Ones Awakened',
                      current: awakened,
                      required: conditions.entitiesAwakened,
                      progress,
                    });
                  }

                  // Regions Controlled
                  if (conditions.regionsControlled !== undefined) {
                    totalConditions++;
                    const controlled = (state.regions || []).filter(r => (r.cultistCells || 0) >= 80).length;
                    const progress = Math.min(100, (controlled / conditions.regionsControlled) * 100);
                    totalProgress += progress;
                    conditionDetails.push({
                      label: 'Regions Controlled',
                      current: controlled,
                      required: conditions.regionsControlled,
                      progress,
                    });
                  }

                  // Voluntary Conversion Rate
                  if (conditions.voluntaryConversionRate !== undefined) {
                    totalConditions++;
                    const regions = state.regions || [];
                    const totalPop = regions.reduce((sum, r) => sum + 1000000, 0);
                    const convertedPop = regions.reduce((sum, r) => sum + (r.cultistCells * 1000), 0);
                    const conversionRate = totalPop > 0 ? (convertedPop / totalPop) * 100 : 0;
                    const progress = Math.min(100, (conversionRate / conditions.voluntaryConversionRate) * 100);
                    totalProgress += progress;
                    conditionDetails.push({
                      label: 'Voluntary Conversion Rate',
                      current: Math.round(conversionRate),
                      required: conditions.voluntaryConversionRate,
                      progress,
                    });
                  }

                  // Sanity Threshold
                  if (conditions.sanityThreshold !== undefined) {
                    totalConditions++;
                    const regions = state.regions || [];
                    const avgSanity = regions.length > 0
                      ? regions.reduce((sum, r) => sum + (r.sanitySanity || 100), 0) / regions.length
                      : 100;
                    // Lower sanity is better for some victories
                    const progress = avgSanity <= conditions.sanityThreshold
                      ? 100
                      : Math.max(0, 100 - ((avgSanity - conditions.sanityThreshold) * 2));
                    totalProgress += progress;
                    conditionDetails.push({
                      label: 'Population Sanity',
                      current: Math.round(avgSanity),
                      required: conditions.sanityThreshold,
                      progress,
                    });
                  }

                  const overallProgress = totalConditions > 0 ? totalProgress / totalConditions : 0;
                  const isAchievable = overallProgress >= 100;

                  return (
                    <div
                      key={victory.type}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        isAchievable
                          ? 'bg-green-900/20 border-green-500/50'
                          : 'bg-slate-900 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                            {isAchievable && <Zap className="w-4 h-4 text-green-400" />}
                            {victory.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">{victory.description}</p>
                        </div>
                        <Badge
                          variant={isAchievable ? 'default' : 'secondary'}
                          className={isAchievable ? 'bg-green-600' : ''}
                        >
                          {Math.round(overallProgress)}%
                        </Badge>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Overall Progress</span>
                          <span>{Math.round(overallProgress)}%</span>
                        </div>
                        <Progress value={overallProgress} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        {conditionDetails.map((detail, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="flex items-center justify-between text-slate-300 mb-1">
                              <span>{detail.label}</span>
                              <span className="font-medium">
                                {detail.current} / {detail.required}
                              </span>
                            </div>
                            <Progress value={detail.progress} className="h-1.5" />
                          </div>
                        ))}
                      </div>

                      {isAchievable && (
                        <div className="mt-3 p-2 bg-green-900/30 rounded border border-green-500/30">
                          <p className="text-xs text-green-300 flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            Victory conditions met! This ending is now achievable.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? 'text-purple-400 border-b-2 border-purple-400'
        : 'text-slate-400 hover:text-slate-300'
    }`}
  >
    {icon}
    {children}
  </button>
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}> = ({ icon, label, value, className = '' }) => (
  <div className={`p-4 rounded-lg border ${className}`}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    <div className="text-2xl font-bold text-slate-100">{value}</div>
  </div>
);

const DoctrinePreview: React.FC<{
  doctrine: Doctrine;
  title: string;
  description: string;
  features: string[];
}> = ({ doctrine, title, description, features }) => (
  <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/50">
    <div className="flex items-center gap-2 mb-3">
      {getDoctrineIcon(doctrine)}
      <h3 className="font-semibold text-slate-200">{title}</h3>
    </div>
    <p className="text-sm text-slate-400 mb-4">{description}</p>
    <div className="space-y-1">
      {features.map((feature, i) => (
        <div key={i} className="text-xs text-slate-500 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-purple-500"></span>
          {feature}
        </div>
      ))}
    </div>
  </div>
);

const RequirementItem: React.FC<{
  label: string;
  current: number;
  required: number;
  isPercentage?: boolean;
}> = ({ label, current, required, isPercentage = false }) => {
  const met = current >= required;
  const percentage = Math.min(100, (current / required) * 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={met ? 'text-green-400' : 'text-slate-400'}>
          {current.toFixed(0)}{isPercentage ? '%' : ''} / {required}{isPercentage ? '%' : ''}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};

const OperationCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  cost: Record<string, number>;
  available: boolean;
  onExecute?: () => void;
}> = ({ title, description, icon, cost, available, onExecute }) => (
  <Card className={`bg-slate-800 border-slate-700 ${!available ? 'opacity-50' : ''}`}>
    <CardHeader className="pb-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-900/30 rounded-lg text-purple-400">
          {icon}
        </div>
        <div className="flex-1">
          <CardTitle className="text-base text-slate-200">{title}</CardTitle>
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(cost).map(([resource, amount]) => (
          <Badge key={resource} variant="outline" className="text-xs">
            {resource}: {amount}
          </Badge>
        ))}
      </div>
      <Button
        size="sm"
        disabled={!available}
        onClick={onExecute}
        className="w-full"
      >
        {available ? 'Launch Operation' : 'Requirements Not Met'}
      </Button>
    </CardContent>
  </Card>
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDoctrineIcon(doctrine: Doctrine | null) {
  switch (doctrine) {
    case 'domination':
      return <Skull className="w-6 h-6 text-red-500" />;
    case 'corruption':
      return <Network className="w-6 h-6 text-blue-500" />;
    case 'convergence':
      return <Sparkles className="w-6 h-6 text-cyan-500" />;
    default:
      return <Eye className="w-6 h-6 text-purple-500" />;
  }
}

function getDoctrineTitle(doctrine: Doctrine | null): string {
  switch (doctrine) {
    case 'domination':
      return 'Path of Domination';
    case 'corruption':
      return 'Path of Corruption';
    case 'convergence':
      return 'Path of Convergence';
    default:
      return 'No Doctrine Selected';
  }
}

function getDoctrineColorClass(doctrine: Doctrine | null): string {
  switch (doctrine) {
    case 'domination':
      return 'bg-red-900/30 text-red-300';
    case 'corruption':
      return 'bg-blue-900/30 text-blue-300';
    case 'convergence':
      return 'bg-cyan-900/30 text-cyan-300';
    default:
      return 'bg-purple-900/30 text-purple-300';
  }
}

function getMoralityColor(score: number): string {
  if (score > 50) return 'text-green-400';
  if (score > 0) return 'text-blue-400';
  if (score > -50) return 'text-yellow-400';
  return 'text-red-400';
}

// Missing imports
import { CheckCircle, Moon, Star } from 'lucide-react';
