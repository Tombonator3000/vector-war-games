/**
 * Order Command Panel
 * Main UI for Great Old Ones campaign mode
 * Displays resources, cosmic alignment, and High Priest council
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Zap,
  Eye,
  TrendingUp,
  Moon,
  Star,
  Users,
  BookOpen,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { GreatOldOnesState, HighPriest } from '@/types/greatOldOnes';
import { calculateVeilStatus, DOCTRINES } from '@/types/greatOldOnes';

interface OrderCommandPanelProps {
  state: GreatOldOnesState;
  onClose?: () => void;
}

export const OrderCommandPanel: React.FC<OrderCommandPanelProps> = ({ state, onClose }) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'council' | 'calendar' | 'log'>('resources');

  return (
    <Card className="bg-slate-900 border-slate-700 max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-slate-100 flex items-center gap-2">
            <Eye className="w-6 h-6 text-purple-500" />
            Esoteric Order Command
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400">
              ×
            </Button>
          )}
        </div>
        {state.doctrine && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Doctrine:</span>
            <Badge variant="outline" className="bg-purple-900/30 text-purple-300">
              {DOCTRINES[state.doctrine].name}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-700">
          <TabButton
            active={activeTab === 'resources'}
            onClick={() => setActiveTab('resources')}
            icon={<Zap className="w-4 h-4" />}
          >
            Resources
          </TabButton>
          <TabButton
            active={activeTab === 'council'}
            onClick={() => setActiveTab('council')}
            icon={<Users className="w-4 h-4" />}
          >
            Council
          </TabButton>
          <TabButton
            active={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
            icon={<Moon className="w-4 h-4" />}
          >
            Alignment
          </TabButton>
          <TabButton
            active={activeTab === 'log'}
            onClick={() => setActiveTab('log')}
            icon={<BookOpen className="w-4 h-4" />}
          >
            Mission Log
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'resources' && <ResourcesTab state={state} />}
          {activeTab === 'council' && <CouncilTab state={state} />}
          {activeTab === 'calendar' && <CalendarTab state={state} />}
          {activeTab === 'log' && <MissionLogTab state={state} />}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// TAB COMPONENTS
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

// ============================================================================
// RESOURCES TAB
// ============================================================================

const ResourcesTab: React.FC<{ state: GreatOldOnesState }> = ({ state }) => {
  const { resources, limits, veil } = state;

  return (
    <div className="space-y-4">
      {/* Primary Resources */}
      <div className="grid grid-cols-2 gap-4">
        <ResourceCard
          icon={<Brain className="w-5 h-5 text-pink-500" />}
          name="Sanity Fragments"
          value={resources.sanityFragments}
          max={limits.maxSanityFragments}
          color="pink"
          description="Harvested from broken minds"
        />
        <ResourceCard
          icon={<Zap className="w-5 h-5 text-purple-500" />}
          name="Eldritch Power"
          value={resources.eldritchPower}
          max={limits.maxEldritchPower}
          color="purple"
          description={`Decays ${limits.eldritchPowerDecayRate}% per turn`}
        />
      </div>

      {/* Secondary Resources */}
      <div className="grid grid-cols-2 gap-4">
        <VeilIntegrityCard veil={veil} />
        <CorruptionCard corruption={resources.corruptionIndex} />
      </div>

      {/* Global Statistics */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-sm text-slate-300">Global Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatRow
            label="Cultist Cells"
            value={state.cultistCells.length}
            icon={<Users className="w-4 h-4 text-blue-400" />}
          />
          <StatRow
            label="Ritual Sites"
            value={state.regions.reduce((sum, r) => sum + r.ritualSites.length, 0)}
            icon={<Star className="w-4 h-4 text-amber-400" />}
          />
          <StatRow
            label="Summoned Entities"
            value={state.summonedEntities.length}
            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
          />
          <StatRow
            label="Active Investigators"
            value={state.investigators.length}
            icon={<Eye className="w-4 h-4 text-cyan-400" />}
            warning={state.investigators.length > 5}
          />
        </CardContent>
      </Card>
    </div>
  );
};

interface ResourceCardProps {
  icon: React.ReactNode;
  name: string;
  value: number;
  max: number;
  color: string;
  description: string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ icon, name, value, max, color, description }) => {
  const percentage = Math.floor((value / max) * 100);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-sm font-semibold text-slate-300">{name}</span>
        </div>
        <div className="text-2xl font-bold text-slate-100 mb-1">
          {value.toLocaleString()} / {max.toLocaleString()}
        </div>
        <Progress value={percentage} className="h-2 mb-1" />
        <p className="text-xs text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
};

const VeilIntegrityCard: React.FC<{ veil: GreatOldOnesState['veil'] }> = ({ veil }) => {
  const statusColors = {
    hidden: 'text-green-400',
    rumors: 'text-yellow-400',
    known: 'text-orange-400',
    crisis: 'text-red-400',
    shattered: 'text-purple-400',
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-semibold text-slate-300">Veil Integrity</span>
        </div>
        <div className="text-2xl font-bold text-slate-100 mb-1">{veil.integrity}%</div>
        <Progress value={veil.integrity} className="h-2 mb-2" />
        <Badge variant="outline" className={`${statusColors[veil.status]} text-xs`}>
          Status: {veil.status.toUpperCase()}
        </Badge>
        <p className="text-xs text-slate-400 mt-1">Public Awareness: {veil.publicAwareness}%</p>
      </CardContent>
    </Card>
  );
};

const CorruptionCard: React.FC<{ corruption: number }> = ({ corruption }) => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-red-500" />
          <span className="text-sm font-semibold text-slate-300">Corruption Index</span>
        </div>
        <div className="text-2xl font-bold text-slate-100 mb-1">{corruption}%</div>
        <Progress value={corruption} className="h-2 mb-1" />
        <p className="text-xs text-slate-400">Global societal decay</p>
      </CardContent>
    </Card>
  );
};

const StatRow: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  warning?: boolean;
}> = ({ label, value, icon, warning }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm text-slate-400">{label}</span>
    </div>
    <span className={`text-sm font-semibold ${warning ? 'text-red-400' : 'text-slate-300'}`}>
      {value}
    </span>
  </div>
);

// ============================================================================
// COUNCIL TAB
// ============================================================================

const CouncilTab: React.FC<{ state: GreatOldOnesState }> = ({ state }) => {
  const { council } = state;

  return (
    <div className="space-y-4">
      {/* Council Unity */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Council Unity</span>
            <span className="text-lg font-bold text-slate-100">{council.unity}%</span>
          </div>
          <Progress value={council.unity} className="h-2" />
          <p className="text-xs text-slate-400 mt-1">
            {council.unity >= 80 && 'The council stands united in purpose.'}
            {council.unity >= 50 && council.unity < 80 && 'Minor disagreements simmer beneath the surface.'}
            {council.unity < 50 && 'The council is fractured. Schism is imminent.'}
          </p>
        </CardContent>
      </Card>

      {/* High Priests */}
      <div className="space-y-3">
        {council.members.map(priest => (
          <HighPriestCard key={priest.id} priest={priest} />
        ))}
      </div>

      {/* Current Agenda */}
      {council.currentAgenda && (
        <Card className="bg-purple-900/20 border-purple-700">
          <CardHeader>
            <CardTitle className="text-sm text-purple-300">Current Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold text-slate-100 mb-1">{council.currentAgenda.title}</h4>
            <p className="text-sm text-slate-400 mb-2">{council.currentAgenda.description}</p>
            <Progress
              value={(council.currentAgenda.currentVotes / council.currentAgenda.requiredVotes) * 100}
              className="h-2"
            />
            <p className="text-xs text-slate-400 mt-1">
              Votes: {council.currentAgenda.currentVotes} / {council.currentAgenda.requiredVotes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const HighPriestCard: React.FC<{ priest: HighPriest }> = ({ priest }) => {
  const doctrineColors = {
    domination: 'text-red-400',
    corruption: 'text-purple-400',
    convergence: 'text-blue-400',
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold text-slate-100">{priest.name}</h4>
            <p className="text-xs text-slate-400">{priest.title}</p>
          </div>
          <Badge variant="outline" className={`${doctrineColors[priest.doctrineAffinity]} text-xs`}>
            {priest.doctrineAffinity}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-xs text-slate-400">Loyalty</div>
            <Progress value={priest.loyalty} className="h-1.5 mt-1" />
            <div className="text-xs text-slate-300 mt-0.5">{priest.loyalty}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Influence</div>
            <Progress value={priest.influence} className="h-1.5 mt-1" />
            <div className="text-xs text-slate-300 mt-0.5">{priest.influence}%</div>
          </div>
        </div>

        {priest.agenda && (
          <p className="text-xs text-slate-400 italic">"{priest.agenda}"</p>
        )}

        <div className="flex flex-wrap gap-1 mt-2">
          {priest.abilities.map(ability => (
            <Badge key={ability} variant="outline" className="text-xs bg-slate-700 text-slate-400">
              {ability.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// CALENDAR TAB
// ============================================================================

const CalendarTab: React.FC<{ state: GreatOldOnesState }> = ({ state }) => {
  const { alignment } = state;

  const lunarPhases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];

  return (
    <div className="space-y-4">
      {/* Ritual Power Modifier */}
      <Card className="bg-purple-900/20 border-purple-700">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-purple-300">Ritual Power Modifier</span>
            <span className="text-2xl font-bold text-purple-100">×{alignment.ritualPowerModifier.toFixed(2)}</span>
          </div>
          <p className="text-xs text-slate-400">
            {alignment.ritualPowerModifier >= 2.0 && 'The cosmos aligns perfectly! Maximum ritual power!'}
            {alignment.ritualPowerModifier >= 1.5 && alignment.ritualPowerModifier < 2.0 && 'Excellent alignment. Rituals are strongly empowered.'}
            {alignment.ritualPowerModifier >= 1.0 && alignment.ritualPowerModifier < 1.5 && 'Good alignment. Rituals receive moderate bonuses.'}
            {alignment.ritualPowerModifier < 1.0 && 'Poor alignment. Wait for better celestial conditions.'}
          </p>
        </CardContent>
      </Card>

      {/* Lunar Phase */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold text-slate-300">Lunar Phase</span>
          </div>
          <div className="text-lg font-bold text-slate-100 mb-1">
            {lunarPhases[alignment.lunarPhase]}
          </div>
          <Progress value={(alignment.lunarPhase / 7) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Planetary Alignment */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold text-slate-300">Planetary Alignment</span>
          </div>
          <div className="text-lg font-bold text-slate-100 mb-1">
            {alignment.planetaryAlignment}%
          </div>
          <Progress value={alignment.planetaryAlignment} className="h-2" />
        </CardContent>
      </Card>

      {/* Celestial Events */}
      {alignment.celestialEvents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Star className="w-4 h-4" />
            Active Celestial Events
          </h4>
          {alignment.celestialEvents.map(event => (
            <Card key={event.id} className="bg-amber-900/20 border-amber-700">
              <CardContent className="pt-3">
                <div className="flex items-start justify-between mb-1">
                  <h5 className="font-semibold text-amber-300">{event.name}</h5>
                  <Badge variant="outline" className="text-amber-400 text-xs">
                    ×{event.powerBonus.toFixed(1)}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">{event.description}</p>
                <p className="text-xs text-slate-500 mt-1">Duration: {event.duration} turns</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MISSION LOG TAB
// ============================================================================

const MissionLogTab: React.FC<{ state: GreatOldOnesState }> = ({ state }) => {
  const recentLogs = state.missionLog.slice(-20).reverse();

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      {recentLogs.length === 0 ? (
        <p className="text-center text-slate-400 py-8">No mission log entries yet.</p>
      ) : (
        recentLogs.map((entry, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700">
            <CardContent className="pt-3">
              <div className="flex items-start justify-between mb-1">
                <h5 className="font-semibold text-slate-200 text-sm">{entry.title}</h5>
                <span className="text-xs text-slate-500">Turn {entry.turn}</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">{entry.description}</p>
              {(entry.sanityChange || entry.corruptionChange || entry.veilChange) && (
                <div className="flex gap-3 text-xs">
                  {entry.sanityChange && (
                    <span className={entry.sanityChange > 0 ? 'text-pink-400' : 'text-pink-600'}>
                      Sanity: {entry.sanityChange > 0 ? '+' : ''}{entry.sanityChange}
                    </span>
                  )}
                  {entry.corruptionChange && (
                    <span className={entry.corruptionChange > 0 ? 'text-red-400' : 'text-red-600'}>
                      Corruption: {entry.corruptionChange > 0 ? '+' : ''}{entry.corruptionChange}
                    </span>
                  )}
                  {entry.veilChange && (
                    <span className={entry.veilChange < 0 ? 'text-blue-400' : 'text-blue-600'}>
                      Veil: {entry.veilChange > 0 ? '+' : ''}{entry.veilChange}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
