/**
 * Regional Sanity Overlay
 * Displays sanity levels as color overlays on the map (similar to political view)
 * Shows detailed info when clicking on a region
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingDown,
  Eye,
  Users,
  Skull,
  Activity,
  Shield,
  X,
} from 'lucide-react';
import type { GreatOldOnesState, RegionalState, CulturalTrait } from '@/types/greatOldOnes';
import { Button } from '@/components/ui/button';

interface RegionalSanityOverlayProps {
  state: GreatOldOnesState;
  onToggleOverlay: () => void;
  showOverlay: boolean;
}

export const RegionalSanityOverlay: React.FC<RegionalSanityOverlayProps> = ({
  state,
  onToggleOverlay,
  showOverlay,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionalState | null>(null);

  return (
    <>
      {/* Toggle Button - Bottom right area */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleOverlay}
        className={`fixed bottom-20 right-4 z-50 shadow-lg ${
          showOverlay ? 'bg-pink-500/20 border-pink-500' : ''
        }`}
        title="Toggle Regional Sanity Overlay"
      >
        <Brain className="w-4 h-4 mr-2" />
        Sanity Map
      </Button>

      {/* Regional Grid Overlay - Compact view */}
      {showOverlay && (
        <div className="fixed bottom-36 right-4 z-50 w-96 max-h-[60vh] overflow-y-auto bg-slate-900/95 border border-pink-500/30 rounded-lg shadow-2xl backdrop-blur-sm pointer-events-auto">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Brain className="w-5 h-5 text-pink-400" />
              Regional Sanity
            </h3>
            <button onClick={onToggleOverlay} className="text-slate-400 hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-3 space-y-2">
            {state.regions.map((region) => (
              <div
                key={region.regionId}
                onClick={() => setSelectedRegion(region)}
                className="p-3 bg-slate-800 hover:bg-slate-750 rounded-lg cursor-pointer transition-colors border border-slate-700 hover:border-pink-500/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-100 text-sm">{region.regionName}</span>
                  <span className={`text-sm font-bold ${getSanityColor(region.sanitySanity)}`}>
                    {region.sanitySanity}%
                  </span>
                </div>
                <Progress value={region.sanitySanity} className="h-1.5" />
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    {region.corruption}% corrupt
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {region.cultistCells} cells
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Region Detail Modal - Shows when clicking a region */}
      {selectedRegion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-auto">
          <Card className="bg-slate-900 border-purple-700 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-pink-500" />
                  {selectedRegion.regionName}
                </CardTitle>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="text-slate-400 hover:text-slate-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={<Brain className="w-5 h-5 text-pink-500" />}
                  label="Sanity Level"
                  value={selectedRegion.sanitySanity}
                  max={100}
                  suffix="%"
                  color={getSanityColor(selectedRegion.sanitySanity)}
                />
                <StatCard
                  icon={<TrendingDown className="w-5 h-5 text-red-500" />}
                  label="Corruption"
                  value={selectedRegion.corruption}
                  max={100}
                  suffix="%"
                  color="text-red-400"
                />
                <StatCard
                  icon={<Eye className="w-5 h-5 text-cyan-500" />}
                  label="Investigation Heat"
                  value={selectedRegion.investigationHeat}
                  max={100}
                  suffix="%"
                  color="text-cyan-400"
                />
                <StatCard
                  icon={<Activity className="w-5 h-5 text-amber-500" />}
                  label="Cult Activity"
                  value={selectedRegion.cultistCells + selectedRegion.ritualSites.length}
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
                <div className="flex flex-wrap gap-2">
                  {selectedRegion.culturalTraits.map((trait) => (
                    <Badge key={trait} variant="outline" className="text-xs">
                      {formatTraitName(trait)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-purple-400">
                    {selectedRegion.cultistCells}
                  </div>
                  <div className="text-xs text-slate-500">Cultist Cells</div>
                </div>
                <div className="text-center">
                  <Eye className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-cyan-400">
                    {state.investigators.filter(inv => inv.regionId === selectedRegion.regionId).length}
                  </div>
                  <div className="text-xs text-slate-500">Investigators</div>
                </div>
                <div className="text-center">
                  <Skull className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-red-400">
                    {state.summonedEntities.filter(e => e.regionId === selectedRegion.regionId).length}
                  </div>
                  <div className="text-xs text-slate-500">Entities</div>
                </div>
              </div>

              {/* Recent Events */}
              {selectedRegion.recentEvents.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-slate-300 mb-2">Recent Events</h5>
                  <div className="space-y-1">
                    {selectedRegion.recentEvents.slice(0, 5).map((event, index) => (
                      <p key={index} className="text-xs text-slate-400 italic">
                        • {event}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

// Helper Components

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

// Helper Functions

function getSanityColor(sanity: number): string {
  if (sanity >= 70) return 'text-green-400';
  if (sanity >= 50) return 'text-yellow-400';
  if (sanity >= 30) return 'text-orange-400';
  return 'text-red-400';
}

function getSanityOverlayColor(sanity: number): string {
  if (sanity >= 70) return '#22c55e'; // green
  if (sanity >= 50) return '#eab308'; // yellow
  if (sanity >= 30) return '#f97316'; // orange
  return '#ef4444'; // red
}

function formatTraitName(trait: CulturalTrait): string {
  return trait.charAt(0).toUpperCase() + trait.slice(1);
}
