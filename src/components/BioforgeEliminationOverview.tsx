import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skull, MapPin, AlertTriangle, CheckCircle, Eye, EyeOff, TrendingUp, Users } from 'lucide-react';
import type { PlagueState } from '@/types/biowarfare';
import type { CountryInfectionState } from '@/types/bioDeployment';

interface BioforgeEliminationOverviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plagueState: PlagueState;
  nationNames: Map<string, string>; // nationId -> nation name
}

export function BioforgeEliminationOverview({
  open,
  onOpenChange,
  plagueState,
  nationNames,
}: BioforgeEliminationOverviewProps) {
  // Calculate total stats
  const totalEliminated = plagueState.plagueCompletionStats.totalKills;
  const countriesDestabilized = plagueState.countryInfections.size;

  // Convert Map to array and sort by deaths (most impacted first)
  const infectedCountries = Array.from(plagueState.countryInfections.entries())
    .map(([nationId, state]) => ({
      nationId,
      nationName: nationNames.get(nationId) || nationId,
      ...state,
    }))
    .sort((a, b) => b.deaths - a.deaths);

  // Calculate severity level for a country
  const getSeverityLevel = (infectionLevel: number, deaths: number) => {
    if (infectionLevel >= 50 || deaths > 1000000) return 'critical';
    if (infectionLevel >= 20 || deaths > 100000) return 'severe';
    if (infectionLevel >= 5 || deaths > 10000) return 'moderate';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 border-red-500/60 bg-red-900/20';
      case 'severe': return 'text-orange-400 border-orange-500/60 bg-orange-900/20';
      case 'moderate': return 'text-yellow-400 border-yellow-500/60 bg-yellow-900/20';
      default: return 'text-cyan-400 border-cyan-500/60 bg-cyan-900/20';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-2 border-red-500/60 bg-black/95 backdrop-blur-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Skull className="h-8 w-8 text-red-400" />
            <div>
              <DialogTitle className="text-2xl font-bold text-red-400 uppercase tracking-wider">
                BIOFORGE ELIMINATION OVERVIEW
              </DialogTitle>
              <div className="text-sm text-gray-400 mt-1">
                Global Impact Assessment
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total Stats Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-red-500/40 rounded-lg p-5 bg-red-900/20">
              <div className="flex items-center gap-3 mb-2">
                <Skull className="h-6 w-6 text-red-400" />
                <div className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                  Total Eliminated
                </div>
              </div>
              <div className="text-4xl font-bold text-red-300">
                {formatNumber(totalEliminated)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Cumulative casualties across all deployments
              </div>
            </div>

            <div className="border border-orange-500/40 rounded-lg p-5 bg-orange-900/20">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-6 w-6 text-orange-400" />
                <div className="text-xs uppercase tracking-widest text-orange-400 font-semibold">
                  Countries Destabilized
                </div>
              </div>
              <div className="text-4xl font-bold text-orange-300">
                {countriesDestabilized}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Nations with active bioweapon infections
              </div>
            </div>
          </div>

          {/* Global Stats */}
          <div className="border border-white/20 rounded-lg p-4 bg-black/40">
            <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">
              Global Status:
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Eye className={`h-4 w-4 ${plagueState.globalSuspicionLevel > 60 ? 'text-red-400' : 'text-yellow-400'}`} />
                <span className="text-gray-300">Global Suspicion:</span>
                <span className={`font-semibold ${plagueState.globalSuspicionLevel > 60 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {plagueState.globalSuspicionLevel}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-cyan-400" />
                <span className="text-gray-300">Peak Infection:</span>
                <span className="text-cyan-300 font-semibold">
                  {plagueState.plagueCompletionStats.peakInfection.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <span className="text-gray-300">Nations Aware:</span>
                <span className="text-emerald-300 font-semibold">
                  {plagueState.nationsKnowingTruth.length}
                </span>
              </div>
            </div>
          </div>

          {/* Country-by-Country Breakdown */}
          {infectedCountries.length > 0 ? (
            <div className="border border-white/20 rounded-lg p-4 bg-black/40">
              <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">
                Country Impact Report:
              </div>
              <div className="space-y-3">
                {infectedCountries.map((country) => {
                  const severity = getSeverityLevel(country.infectionLevel, country.deaths);
                  const severityColor = getSeverityColor(severity);

                  return (
                    <div
                      key={country.nationId}
                      className={`border rounded-lg p-4 ${severityColor}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5" />
                          <div>
                            <div className="text-lg font-bold text-white">
                              {country.nationName}
                            </div>
                            <div className="text-xs text-gray-300 uppercase tracking-wide">
                              Severity: {severity}
                            </div>
                          </div>
                        </div>
                        {country.detectedBioWeapon ? (
                          <div className="flex items-center gap-1 text-xs text-red-300">
                            <Eye className="h-3 w-3" />
                            DETECTED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-green-300">
                            <EyeOff className="h-3 w-3" />
                            UNDETECTED
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Infection Level</div>
                          <div className="font-bold text-white">
                            {country.infectionLevel.toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Casualties</div>
                          <div className="font-bold text-red-300">
                            {formatNumber(country.deaths)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Death Rate</div>
                          <div className="font-bold text-orange-300">
                            {formatNumber(country.deathRate)}/turn
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Containment</div>
                          <div className="font-bold text-cyan-300">
                            {country.containmentLevel}%
                          </div>
                        </div>
                      </div>

                      {country.detectedBioWeapon && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs">
                          <AlertTriangle className="h-3 w-3 text-yellow-400" />
                          <span className="text-gray-300">
                            Suspicion Level: <span className="text-yellow-300 font-semibold">{country.suspicionLevel}%</span>
                          </span>
                          {country.detectionTurn && (
                            <span className="text-gray-400">
                              • Detected Turn {country.detectionTurn}
                            </span>
                          )}
                        </div>
                      )}

                      {country.spreadFrom && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-cyan-300">
                          <TrendingUp className="h-3 w-3" />
                          Spread from: {nationNames.get(country.spreadFrom) || country.spreadFrom}
                          {country.spreadMethod && ` (${country.spreadMethod})`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border border-white/20 rounded-lg p-8 bg-black/40 text-center">
              <Skull className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <div className="text-gray-400">
                No active bioweapon deployments
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Deploy a bioweapon to see elimination statistics
              </div>
            </div>
          )}

          {/* Warning if high suspicion */}
          {plagueState.globalSuspicionLevel > 75 && (
            <div className="border border-red-500/30 rounded-lg p-4 bg-red-900/10">
              <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                <AlertTriangle className="h-5 w-5" />
                CRITICAL WARNING
              </div>
              <div className="text-sm text-red-200">
                Global suspicion is extremely high ({plagueState.globalSuspicionLevel}%).
                Nations may be actively investigating and preparing countermeasures.
                Risk of attribution and retaliation is severe.
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-2"
          >
            CLOSE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
