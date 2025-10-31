/**
 * Sanity Heat Map Panel
 * Visualizes regional sanity levels, cultural traits, and threat status
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingDown,
  AlertTriangle,
  Shield,
  Eye,
  Users,
  Skull,
  Activity,
} from 'lucide-react';
import type { GreatOldOnesState, RegionalState, CulturalTrait } from '@/types/greatOldOnes';
import { getGlobalSanityAverage, getCrisisRegions } from '@/lib/sanityHeatMap';

interface SanityHeatMapPanelProps {
  state: GreatOldOnesState;
}

export const SanityHeatMapPanel: React.FC<SanityHeatMapPanelProps> = ({ state }) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionalState | null>(null);

  const globalSanity = getGlobalSanityAverage(state);
  const crisisRegions = getCrisisRegions(state);

  return (
    <div className="space-y-4">
      {/* Global Overview */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
            <Brain className="w-5 h-5 text-pink-500" />
            Global Sanity Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Average Global Sanity</span>
              <span className={`text-lg font-bold ${getSanityColor(globalSanity)}`}>
                {globalSanity}%
              </span>
            </div>
            <Progress value={globalSanity} className="h-3" />
            <p className="text-xs text-slate-500 mt-1">{getSanityDescription(globalSanity)}</p>
          </div>

          {crisisRegions.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-300">
                  {crisisRegions.length} Region{crisisRegions.length > 1 ? 's' : ''} in Crisis
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {crisisRegions.map(region => (
                  <Badge key={region.regionId} variant="outline" className="text-xs text-red-400 border-red-700">
                    {region.regionName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Heat Map */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Regional Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.regions.map(region => (
              <RegionCard
                key={region.regionId}
                region={region}
                investigators={state.investigators.filter(inv => inv.regionId === region.regionId)}
                entities={state.summonedEntities.filter(e => e.regionId === region.regionId)}
                onClick={() => setSelectedRegion(region)}
                isSelected={selectedRegion?.regionId === region.regionId}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Region Detail Panel */}
      {selectedRegion && (
        <RegionDetailPanel
          region={selectedRegion}
          investigators={state.investigators.filter(inv => inv.regionId === selectedRegion.regionId)}
          cultistCells={state.cultistCells.filter(c => c.regionId === selectedRegion.regionId)}
          entities={state.summonedEntities.filter(e => e.regionId === selectedRegion.regionId)}
          onClose={() => setSelectedRegion(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// REGION CARD
// ============================================================================

interface RegionCardProps {
  region: RegionalState;
  investigators: any[];
  entities: any[];
  onClick: () => void;
  isSelected: boolean;
}

const RegionCard: React.FC<RegionCardProps> = ({
  region,
  investigators,
  entities,
  onClick,
  isSelected,
}) => {
  const threatLevel = calculateThreatLevel(region, investigators, entities);
  const threatColor = getThreatColor(threatLevel);

  return (
    <Card
      className={`cursor-pointer transition-all hover:border-slate-500 ${
        isSelected ? 'border-purple-500 bg-purple-900/10' : 'bg-slate-800 border-slate-700'
      }`}
      onClick={onClick}
    >
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-slate-100 text-sm">{region.regionName}</h4>
          <Badge variant="outline" className={`text-xs ${threatColor}`}>
            {threatLevel}
          </Badge>
        </div>

        {/* Sanity Level */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Sanity</span>
            <span className={getSanityColor(region.sanitySanity)}>{region.sanitySanity}%</span>
          </div>
          <Progress value={region.sanitySanity} className="h-1.5" />
        </div>

        {/* Corruption Level */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Corruption</span>
            <span className="text-red-400">{region.corruption}%</span>
          </div>
          <Progress value={region.corruption} className="h-1.5" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-1 pt-2">
          <QuickStat icon={<Users className="w-3 h-3" />} value={region.cultistCells} label="Cells" />
          <QuickStat icon={<Eye className="w-3 h-3" />} value={investigators.length} label="Investigators" color="text-cyan-400" />
          <QuickStat icon={<Skull className="w-3 h-3" />} value={entities.length} label="Entities" color="text-red-400" />
        </div>

        {/* Cultural Traits */}
        <div className="flex flex-wrap gap-1 pt-1">
          {region.culturalTraits.map(trait => (
            <Badge key={trait} variant="outline" className="text-xs bg-slate-700 text-slate-400">
              {formatTraitName(trait)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const QuickStat: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  color?: string;
}> = ({ icon, value, label, color = 'text-slate-400' }) => (
  <div className="flex items-center gap-1">
    <div className={color}>{icon}</div>
    <div>
      <div className={`text-xs font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  </div>
);

// ============================================================================
// REGION DETAIL PANEL
// ============================================================================

interface RegionDetailPanelProps {
  region: RegionalState;
  investigators: any[];
  cultistCells: any[];
  entities: any[];
  onClose: () => void;
}

const RegionDetailPanel: React.FC<RegionDetailPanelProps> = ({
  region,
  investigators,
  cultistCells,
  entities,
  onClose,
}) => {
  return (
    <Card className="bg-slate-900 border-purple-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-slate-100">{region.regionName}</CardTitle>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<Brain className="w-5 h-5 text-pink-500" />}
            label="Sanity Level"
            value={region.sanitySanity}
            max={100}
            suffix="%"
            color={getSanityColor(region.sanitySanity)}
          />
          <StatCard
            icon={<TrendingDown className="w-5 h-5 text-red-500" />}
            label="Corruption"
            value={region.corruption}
            max={100}
            suffix="%"
            color="text-red-400"
          />
          <StatCard
            icon={<Eye className="w-5 h-5 text-cyan-500" />}
            label="Investigation Heat"
            value={region.investigationHeat}
            max={100}
            suffix="%"
            color="text-cyan-400"
          />
          <StatCard
            icon={<Activity className="w-5 h-5 text-amber-500" />}
            label="Cult Activity"
            value={region.cultistCells + region.ritualSites.length}
            max={20}
            suffix=" sites"
            color="text-amber-400"
          />
        </div>

        {/* Cultural Traits */}
        <div>
          <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Cultural Traits
          </h5>
          <div className="space-y-1">
            {region.culturalTraits.map(trait => (
              <div key={trait} className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">{formatTraitName(trait)}</span>
                {' - '}
                {getTraitDescription(trait)}
              </div>
            ))}
          </div>
        </div>

        {/* Assets & Threats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Cultist Cells */}
          <div>
            <h5 className="text-sm font-semibold text-purple-400 mb-2">Cultist Cells ({cultistCells.length})</h5>
            {cultistCells.length === 0 ? (
              <p className="text-xs text-slate-500">No cells in this region</p>
            ) : (
              <div className="space-y-1">
                {cultistCells.slice(0, 3).map(cell => (
                  <div key={cell.id} className="text-xs text-slate-400">
                    <Badge variant="outline" className="text-xs mr-1">
                      {cell.tier}
                    </Badge>
                    {cell.count} members
                    {cell.compromised && <span className="text-red-400 ml-1">(COMPROMISED)</span>}
                  </div>
                ))}
                {cultistCells.length > 3 && (
                  <p className="text-xs text-slate-500">+{cultistCells.length - 3} more</p>
                )}
              </div>
            )}
          </div>

          {/* Investigators */}
          <div>
            <h5 className="text-sm font-semibold text-cyan-400 mb-2">Investigators ({investigators.length})</h5>
            {investigators.length === 0 ? (
              <p className="text-xs text-slate-500">No active investigators</p>
            ) : (
              <div className="space-y-1">
                {investigators.slice(0, 3).map(inv => (
                  <div key={inv.id} className="text-xs text-slate-400">
                    <span className="font-semibold text-cyan-300">{inv.name}</span>
                    <br />
                    <span className="text-slate-500">{inv.type.replace('_', ' ')}</span>
                  </div>
                ))}
                {investigators.length > 3 && (
                  <p className="text-xs text-slate-500">+{investigators.length - 3} more</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ritual Sites */}
        {region.ritualSites.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-amber-400 mb-2">
              Ritual Sites ({region.ritualSites.length})
            </h5>
            <div className="space-y-2">
              {region.ritualSites.map(site => (
                <div key={site.id} className="bg-slate-800 rounded p-2 text-xs">
                  <div className="font-semibold text-slate-200">{site.name}</div>
                  <div className="text-slate-400">
                    {site.type} • {site.biome}
                  </div>
                  {site.activeRitual && (
                    <Badge variant="outline" className="text-xs text-purple-400 mt-1">
                      Active Ritual
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events */}
        {region.recentEvents.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-slate-300 mb-2">Recent Events</h5>
            <div className="space-y-1">
              {region.recentEvents.map((event, index) => (
                <p key={index} className="text-xs text-slate-400 italic">
                  • {event}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  suffix: string;
  color: string;
}> = ({ icon, label, value, max, suffix, color }) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    <div className={`text-lg font-bold ${color}`}>
      {value}{suffix}
    </div>
    <Progress value={(value / max) * 100} className="h-1.5 mt-1" />
  </div>
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateThreatLevel(
  region: RegionalState,
  investigators: any[],
  entities: any[]
): 'Low' | 'Moderate' | 'High' | 'Critical' {
  let score = 0;

  // Investigator presence
  score += investigators.length * 10;

  // Investigation heat
  score += region.investigationHeat / 2;

  // Low sanity is a risk
  if (region.sanitySanity < 40) {
    score += (40 - region.sanitySanity);
  }

  // Entity presence (could attract attention)
  score += entities.length * 15;

  if (score > 80) return 'Critical';
  if (score > 50) return 'High';
  if (score > 25) return 'Moderate';
  return 'Low';
}

function getThreatColor(threat: string): string {
  switch (threat) {
    case 'Critical':
      return 'text-red-400 border-red-700';
    case 'High':
      return 'text-orange-400 border-orange-700';
    case 'Moderate':
      return 'text-yellow-400 border-yellow-700';
    default:
      return 'text-green-400 border-green-700';
  }
}

function getSanityColor(sanity: number): string {
  if (sanity >= 70) return 'text-green-400';
  if (sanity >= 50) return 'text-yellow-400';
  if (sanity >= 30) return 'text-orange-400';
  return 'text-red-400';
}

function getSanityDescription(sanity: number): string {
  if (sanity >= 80) return 'Humanity remains largely sane and functional.';
  if (sanity >= 60) return 'Increasing reports of mental illness. Cause for concern.';
  if (sanity >= 40) return 'Widespread psychological distress. Society straining.';
  if (sanity >= 20) return 'Mass psychosis spreading. Civilization fraying.';
  return 'Societal collapse imminent. Madness reigns.';
}

function formatTraitName(trait: CulturalTrait): string {
  return trait.charAt(0).toUpperCase() + trait.slice(1);
}

function getTraitDescription(trait: CulturalTrait): string {
  const descriptions: Record<CulturalTrait, string> = {
    rationalist: 'Resistant to mystical corruption',
    superstitious: 'Vulnerable to fear campaigns',
    academic: 'Strong investigation support',
    isolated: 'Slower corruption spread',
    urban: 'Ideal for rapid corruption',
    faithful: 'Faith provides protection',
  };
  return descriptions[trait];
}
