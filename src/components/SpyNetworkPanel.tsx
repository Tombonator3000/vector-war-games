/**
 * Spy Network Panel
 *
 * Comprehensive interface for managing individual spies, missions, and counter-intelligence
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  UserPlus,
  Target,
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  Skull,
  Users,
  Award,
  Activity,
  Zap,
  Factory,
  Search,
  Info,
} from 'lucide-react';
import type { Nation } from '@/types/game';
import type {
  SpyAgent,
  SpyMission,
  SpyMissionType,
  SpyNetworkState,
  SpyCoverType,
  SpyTrainingLevel,
  SpySpecialization,
} from '@/types/spySystem';
import { SPY_COSTS, MISSION_DURATIONS, BASE_DETECTION_RISKS } from '@/types/spySystem';
import { getMissionEffectDescription, getMissionRiskLevel } from '@/lib/spyMissionExecutor';

interface SpyNetworkPanelProps {
  player: Nation;
  enemies: Nation[];
  onRecruitSpy?: (cover: SpyCoverType, targetNation?: string, specialization?: SpySpecialization) => void;
  onLaunchMission?: (spyId: string, targetNationId: string, missionType: SpyMissionType) => void;
  onLaunchCounterIntel?: () => void;
  calculateMissionSuccessChance?: (
    spyId: string,
    targetNationId: string,
    missionType: SpyMissionType
  ) => number;
  calculateDetectionRisk?: (
    spyId: string,
    targetNationId: string,
    missionType: SpyMissionType
  ) => number;
}

const COVER_OPTIONS: { value: SpyCoverType; label: string; icon: string }[] = [
  { value: 'diplomat', label: 'Diplomat', icon: '🎩' },
  { value: 'trader', label: 'Trader', icon: '💼' },
  { value: 'journalist', label: 'Journalist', icon: '📰' },
  { value: 'businessman', label: 'Businessman', icon: '👔' },
  { value: 'scientist', label: 'Scientist', icon: '🔬' },
  { value: 'military-attache', label: 'Military Attaché', icon: '🎖️' },
  { value: 'student', label: 'Student', icon: '🎓' },
  { value: 'aid-worker', label: 'Aid Worker', icon: '🏥' },
  { value: 'tourist', label: 'Tourist', icon: '📷' },
  { value: 'refugee', label: 'Refugee', icon: '🛫' },
];

const MISSION_OPTIONS: {
  type: SpyMissionType;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'offensive' | 'intelligence' | 'influence' | 'counter';
}[] = [
  {
    type: 'steal-tech',
    name: 'Steal Technology',
    description: 'Steal a random completed research',
    icon: <Search className="w-4 h-4" />,
    category: 'offensive',
  },
  {
    type: 'sabotage-production',
    name: 'Sabotage Production',
    description: 'Reduce production by 30%',
    icon: <Factory className="w-4 h-4" />,
    category: 'offensive',
  },
  {
    type: 'sabotage-military',
    name: 'Sabotage Military',
    description: 'Destroy 20% of missiles',
    icon: <Target className="w-4 h-4" />,
    category: 'offensive',
  },
  {
    type: 'rig-election',
    name: 'Rig Election',
    description: 'Trigger early elections, reduce morale',
    icon: <Users className="w-4 h-4" />,
    category: 'influence',
  },
  {
    type: 'sow-dissent',
    name: 'Sow Dissent',
    description: 'Reduce trust with other nations',
    icon: <AlertTriangle className="w-4 h-4" />,
    category: 'influence',
  },
  {
    type: 'assassination',
    name: 'Assassination',
    description: 'Kill leader - EXTREME RISK',
    icon: <Skull className="w-4 h-4" />,
    category: 'offensive',
  },
  {
    type: 'gather-intel',
    name: 'Gather Intel',
    description: 'Gain +40 Intel',
    icon: <Eye className="w-4 h-4" />,
    category: 'intelligence',
  },
  {
    type: 'propaganda',
    name: 'Propaganda',
    description: 'Reduce morale and opinion',
    icon: <Activity className="w-4 h-4" />,
    category: 'influence',
  },
  {
    type: 'cyber-assist',
    name: 'Cyber Assist',
    description: 'Weaken cyber defenses',
    icon: <Zap className="w-4 h-4" />,
    category: 'offensive',
  },
  {
    type: 'false-flag',
    name: 'False Flag',
    description: 'Frame another nation',
    icon: <Shield className="w-4 h-4" />,
    category: 'influence',
  },
  {
    type: 'counter-intel',
    name: 'Counter-Intel',
    description: 'Hunt enemy spies',
    icon: <Shield className="w-4 h-4" />,
    category: 'counter',
  },
];

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'on-mission':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    case 'idle':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    case 'captured':
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    case 'eliminated':
      return 'bg-red-900/20 text-red-500 border-red-900/50';
    case 'burned':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
};

const getReputationColor = (reputation: string): string => {
  switch (reputation) {
    case 'legendary':
      return 'text-purple-400';
    case 'elite':
      return 'text-cyan-400';
    case 'professional':
      return 'text-blue-400';
    case 'competent':
      return 'text-green-400';
    case 'novice':
      return 'text-yellow-400';
    case 'notorious':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

export const SpyNetworkPanel: React.FC<SpyNetworkPanelProps> = ({
  player,
  enemies,
  onRecruitSpy,
  onLaunchMission,
  onLaunchCounterIntel,
  calculateMissionSuccessChance,
  calculateDetectionRisk,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'spies' | 'missions' | 'recruit'>(
    'overview'
  );
  const [selectedSpy, setSelectedSpy] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<SpyMissionType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [recruitCover, setRecruitCover] = useState<SpyCoverType>('diplomat');

  const spyNetwork = player.spyNetwork;
  const spies = spyNetwork?.spies || [];
  const activeMissions = spyNetwork?.activeMissions || [];
  const canRecruitNow = player.intel >= SPY_COSTS.RECRUIT_BASE.intel &&
    player.production >= SPY_COSTS.RECRUIT_BASE.production &&
    (spyNetwork?.recruitmentCooldown || 0) === 0;

  const selectedSpyData = spies.find((s) => s.id === selectedSpy);

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
          <Eye className="w-6 h-6 text-purple-400" />
          Spy Network
        </CardTitle>
        <CardDescription className="text-slate-400">
          Manage spies, conduct covert operations, and hunt enemy agents
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="spies">
              Spies ({spies.length})
            </TabsTrigger>
            <TabsTrigger value="missions">
              Missions ({activeMissions.length})
            </TabsTrigger>
            <TabsTrigger value="recruit">Recruit</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {spyNetwork ? (
              <>
                {/* Network Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-400 mb-1">Network Reputation</div>
                    <div className={`text-lg font-bold ${getReputationColor(spyNetwork.reputation)}`}>
                      {spyNetwork.reputation.toUpperCase()}
                    </div>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-400 mb-1">Success Rate</div>
                    <div className="text-lg font-bold text-green-400">
                      {spyNetwork.totalSuccessfulMissions + spyNetwork.totalSpiesLost > 0
                        ? Math.round(
                            (spyNetwork.totalSuccessfulMissions /
                              (spyNetwork.totalSuccessfulMissions + spyNetwork.totalSpiesLost)) *
                              100
                          )
                        : 0}
                      %
                    </div>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-400 mb-1">Active Spies</div>
                    <div className="text-lg font-bold text-cyan-400">
                      {spies.filter((s) => s.status === 'active' || s.status === 'on-mission').length}/
                      {spies.length}
                    </div>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-400 mb-1">Total Missions</div>
                    <div className="text-lg font-bold text-blue-400">
                      {spyNetwork.totalSuccessfulMissions}
                    </div>
                  </div>
                </div>

                {/* Lifetime Stats */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <h4 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    Lifetime Statistics
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Successful Missions</span>
                      <span className="text-green-400 font-bold">
                        {spyNetwork.totalSuccessfulMissions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Spies Captured</span>
                      <span className="text-orange-400 font-bold">
                        {spyNetwork.totalSpiesCaptured}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Spies Lost</span>
                      <span className="text-red-400 font-bold">{spyNetwork.totalSpiesLost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Incidents</span>
                      <span className="text-yellow-400 font-bold">{spyNetwork.incidents.length}</span>
                    </div>
                  </div>
                </div>

                {/* Counter-Intelligence */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <h4 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    Counter-Intelligence
                  </h4>
                  <p className="text-sm text-slate-400 mb-3">
                    Launch operations to detect and capture enemy spies operating in your territory.
                  </p>
                  <Button
                    onClick={() => onLaunchCounterIntel?.()}
                    disabled={player.intel < 30}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Launch Counter-Intel (30 Intel)
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
                <Eye className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">No spy network established yet.</p>
                <Button
                  onClick={() => setActiveTab('recruit')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Recruit First Spy
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Spies Tab */}
          <TabsContent value="spies" className="space-y-3 mt-4">
            {spies.length === 0 ? (
              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">No spies recruited yet.</p>
                <Button
                  onClick={() => setActiveTab('recruit')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Recruit Spy
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {spies.map((spy) => (
                  <div
                    key={spy.id}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedSpy === spy.id
                        ? 'border-purple-500 bg-slate-800'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                    onClick={() => setSelectedSpy(spy.id === selectedSpy ? null : spy.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-200">{spy.name}</span>
                          <Badge className={`text-xs ${getStatusColor(spy.status)}`}>
                            {spy.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>Cover: {spy.cover}</span>
                          <span>Skill: {spy.skill}</span>
                          <span>Level: {spy.trainingLevel}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-slate-400">{spy.experience} XP</span>
                      </div>
                    </div>

                    {selectedSpy === spy.id && (
                      <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Morale:</span>
                            <span className="ml-2 text-slate-200">{spy.morale}/100</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Discovery Risk:</span>
                            <span className="ml-2 text-slate-200">{spy.discoveryRisk}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Missions:</span>
                            <span className="ml-2 text-slate-200">{spy.missionHistory.length}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Recruited:</span>
                            <span className="ml-2 text-slate-200">Turn {spy.recruitedTurn}</span>
                          </div>
                        </div>

                        {spy.specializations && spy.specializations.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {spy.specializations.map((spec) => (
                              <Badge
                                key={spec}
                                className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50"
                              >
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {spy.status === 'active' || spy.status === 'idle' ? (
                          <Button
                            onClick={() => {
                              setSelectedSpy(spy.id);
                              setActiveTab('missions');
                            }}
                            size="sm"
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            <Target className="w-3 h-3 mr-2" />
                            Assign Mission
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="space-y-4 mt-4">
            {/* Active Missions */}
            {activeMissions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Active Missions ({activeMissions.length})
                </h4>
                {activeMissions.map((mission) => {
                  const spy = spies.find((s) => s.id === mission.spyId);
                  const target = enemies.find((e) => e.id === mission.targetNationId);
                  const turnsRemaining = mission.completionTurn - (player.spyNetwork?.activeMissions[0]?.startTurn || 0);

                  return (
                    <div
                      key={mission.id}
                      className="p-3 bg-slate-800 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-slate-200">{spy?.name}</div>
                          <div className="text-xs text-slate-400">
                            {mission.type} in {target?.name}
                          </div>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                          <Clock className="w-3 h-3 mr-1" />
                          {mission.duration} turns
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Success:</span>
                          <span className="text-green-400">{mission.successChance}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Detection:</span>
                          <span className="text-orange-400">{mission.detectionRisk}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mission Assignment */}
            {selectedSpyData &&
            (selectedSpyData.status === 'active' || selectedSpyData.status === 'idle') ? (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-200">
                  Assign Mission for {selectedSpyData.name}
                </h4>

                {/* Select Target */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Select Target Nation</label>
                  <div className="grid grid-cols-2 gap-2">
                    {enemies.map((enemy) => (
                      <button
                        key={enemy.id}
                        onClick={() => setSelectedTarget(enemy.id)}
                        className={`p-2 rounded border-2 text-sm transition-all ${
                          selectedTarget === enemy.id
                            ? 'border-purple-500 bg-slate-800'
                            : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                        }`}
                      >
                        {enemy.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select Mission */}
                {selectedTarget && (
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Select Mission Type</label>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {MISSION_OPTIONS.map((option) => {
                        const cost = SPY_COSTS[option.type.toUpperCase().replace(/-/g, '_') as keyof typeof SPY_COSTS] as number || 30;
                        const canAfford = player.intel >= cost;
                        const isSelected = selectedMission === option.type;

                        return (
                          <button
                            key={option.type}
                            onClick={() => setSelectedMission(option.type)}
                            disabled={!canAfford}
                            className={`w-full p-2 rounded border-2 text-left transition-all text-sm ${
                              isSelected
                                ? 'border-purple-500 bg-slate-800'
                                : canAfford
                                  ? 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                                  : 'border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {option.icon}
                                <span className="text-slate-200">{option.name}</span>
                              </div>
                              <Badge className="text-xs bg-slate-700 text-slate-300">
                                {cost} Intel
                              </Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mission Details & Launch */}
                {selectedMission && selectedTarget && (
                  <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-3">
                    <h5 className="font-bold text-slate-200">Mission Details</h5>

                    <div className="text-xs text-slate-400">
                      {getMissionEffectDescription(selectedMission)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-slate-400 mb-1">Duration</div>
                        <div className="text-slate-200">
                          {MISSION_DURATIONS[selectedMission.toUpperCase().replace(/-/g, '_') as keyof typeof MISSION_DURATIONS] || 2} turns
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-1">Risk Level</div>
                        <div className="text-slate-200">
                          {getMissionRiskLevel(
                            BASE_DETECTION_RISKS[selectedMission.toUpperCase().replace(/-/g, '_') as keyof typeof BASE_DETECTION_RISKS] || 50
                          ).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {calculateMissionSuccessChance && calculateDetectionRisk && (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-slate-400 mb-1">Success Chance</div>
                          <div className="text-green-400 font-bold">
                            {calculateMissionSuccessChance(
                              selectedSpyData.id,
                              selectedTarget,
                              selectedMission
                            )}
                            %
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-1">Detection Risk</div>
                          <div className="text-orange-400 font-bold">
                            {calculateDetectionRisk(
                              selectedSpyData.id,
                              selectedTarget,
                              selectedMission
                            )}
                            %
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 p-2 bg-amber-900/20 rounded border border-amber-700">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-300">
                        If caught, your spy may be captured or killed, and diplomatic relations will suffer.
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        if (selectedTarget && selectedMission) {
                          onLaunchMission?.(selectedSpyData.id, selectedTarget, selectedMission);
                          setSelectedMission(null);
                          setSelectedTarget(null);
                          setSelectedSpy(null);
                        }
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Launch Mission
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
                <Info className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  Select an available spy from the Spies tab to assign a mission.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Recruit Tab */}
          <TabsContent value="recruit" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-200">Recruit New Spy</h4>

              {/* Cover Selection */}
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Select Cover Identity</label>
                <div className="grid grid-cols-2 gap-2">
                  {COVER_OPTIONS.map((cover) => (
                    <button
                      key={cover.value}
                      onClick={() => setRecruitCover(cover.value)}
                      className={`p-3 rounded border-2 transition-all ${
                        recruitCover === cover.value
                          ? 'border-purple-500 bg-slate-800'
                          : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cover.icon}</div>
                      <div className="text-xs text-slate-200">{cover.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost Display */}
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h5 className="font-bold text-slate-200 mb-3">Recruitment Cost</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Intel:</span>
                    <span
                      className={
                        player.intel >= SPY_COSTS.RECRUIT_BASE.intel
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {SPY_COSTS.RECRUIT_BASE.intel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Production:</span>
                    <span
                      className={
                        player.production >= SPY_COSTS.RECRUIT_BASE.production
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {SPY_COSTS.RECRUIT_BASE.production}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cooldown Warning */}
              {spyNetwork && spyNetwork.recruitmentCooldown > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-900/20 rounded border border-amber-700">
                  <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-300">
                    Recruitment on cooldown: {spyNetwork.recruitmentCooldown} turns remaining
                  </p>
                </div>
              )}

              {/* Recruit Button */}
              <Button
                onClick={() => onRecruitSpy?.(recruitCover)}
                disabled={!canRecruitNow}
                className={`w-full ${
                  canRecruitNow
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-slate-700 cursor-not-allowed opacity-50'
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {canRecruitNow
                  ? 'Recruit Spy'
                  : !canRecruitNow && spyNetwork?.recruitmentCooldown
                    ? 'On Cooldown'
                    : 'Insufficient Resources'}
              </Button>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-blue-900/20 rounded border border-blue-700">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-300">
                  <p className="mb-1">New spies start with:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Skill: 30-45 (improves with missions)</li>
                    <li>Training: Operative level</li>
                    <li>2 turn recruitment cooldown</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
