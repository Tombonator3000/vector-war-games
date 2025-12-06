/**
 * Satellite Ground Station Panel
 *
 * Displays satellite signal simulation status including:
 * - Active satellites and their orbits
 * - Ground station status and received signals
 * - Signal strength visualization
 * - Signal history and timestamps
 */

import React, { useMemo } from 'react';
import {
  SatelliteSignalState,
  SignalSatellite,
  GroundStation,
  ReceivedSignal,
  SignalHistoryEntry,
  SIGNAL_QUALITY,
} from '@/types/satelliteSignal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Satellite, Radio, SignalHigh, SignalLow, SignalMedium, SignalZero, Clock, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface SatelliteGroundStationPanelProps {
  state: SatelliteSignalState;
  playerId?: string;
  onDeploySatellite?: (type: SignalSatellite['type']) => void;
  onBuildStation?: (lon: number, lat: number) => void;
}

/**
 * Get signal quality icon based on quality percentage
 */
function getSignalIcon(quality: number) {
  if (quality >= SIGNAL_QUALITY.EXCELLENT) {
    return <SignalHigh className="w-4 h-4 text-green-400" />;
  } else if (quality >= SIGNAL_QUALITY.GOOD) {
    return <SignalMedium className="w-4 h-4 text-cyan-400" />;
  } else if (quality >= SIGNAL_QUALITY.FAIR) {
    return <SignalLow className="w-4 h-4 text-yellow-400" />;
  } else if (quality > SIGNAL_QUALITY.LOST) {
    return <SignalZero className="w-4 h-4 text-orange-400" />;
  }
  return <WifiOff className="w-4 h-4 text-red-400" />;
}

/**
 * Get quality label and color
 */
function getQualityLabel(quality: number): { label: string; color: string } {
  if (quality >= SIGNAL_QUALITY.EXCELLENT) {
    return { label: 'Excellent', color: 'text-green-400' };
  } else if (quality >= SIGNAL_QUALITY.GOOD) {
    return { label: 'Good', color: 'text-cyan-400' };
  } else if (quality >= SIGNAL_QUALITY.FAIR) {
    return { label: 'Fair', color: 'text-yellow-400' };
  } else if (quality > SIGNAL_QUALITY.LOST) {
    return { label: 'Poor', color: 'text-orange-400' };
  }
  return { label: 'Lost', color: 'text-red-400' };
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format delay in milliseconds to human readable
 */
function formatDelay(delayMs: number): string {
  if (delayMs < 1) {
    return `${(delayMs * 1000).toFixed(1)}µs`;
  } else if (delayMs < 1000) {
    return `${delayMs.toFixed(1)}ms`;
  }
  return `${(delayMs / 1000).toFixed(2)}s`;
}

/**
 * Satellite card component
 */
function SatelliteCard({ satellite, signals }: { satellite: SignalSatellite; signals: ReceivedSignal[] }) {
  const activeSignals = signals.filter((s) => s.active);
  const avgQuality = activeSignals.length > 0
    ? activeSignals.reduce((sum, s) => sum + s.quality, 0) / activeSignals.length
    : 0;

  const orbitType = satellite.currentPosition.altitude > 30000
    ? 'GEO'
    : satellite.currentPosition.altitude > 10000
    ? 'MEO'
    : 'LEO';

  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-600/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">{satellite.name}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${satellite.operational ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {satellite.operational ? 'ACTIVE' : 'OFFLINE'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-slate-400">
          Type: <span className="text-slate-300 capitalize">{satellite.type}</span>
        </div>
        <div className="text-slate-400">
          Orbit: <span className="text-slate-300">{orbitType}</span>
        </div>
        <div className="text-slate-400">
          Alt: <span className="text-slate-300">{Math.round(satellite.currentPosition.altitude)} km</span>
        </div>
        <div className="text-slate-400">
          Freq: <span className="text-slate-300">{satellite.frequency} GHz</span>
        </div>
        <div className="text-slate-400">
          Lon: <span className="text-slate-300">{satellite.currentPosition.lon.toFixed(1)}°</span>
        </div>
        <div className="text-slate-400">
          Lat: <span className="text-slate-300">{satellite.currentPosition.lat.toFixed(1)}°</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-600/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Health</span>
          <span className="text-slate-300">{satellite.health}%</span>
        </div>
        <Progress value={satellite.health} className="h-1 mt-1" />
      </div>

      {activeSignals.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-600/50">
          <div className="flex items-center gap-2 text-xs">
            {getSignalIcon(avgQuality)}
            <span className="text-slate-300">
              {activeSignals.length} station{activeSignals.length > 1 ? 's' : ''} receiving
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Ground station card component
 */
function GroundStationCard({ station, satellites }: { station: GroundStation; satellites: SignalSatellite[] }) {
  const activeSignals = station.receivedSignals.filter((s) => s.active);

  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-600/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-slate-200">{station.name}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${station.operational ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {station.operational ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-slate-400">
          Lon: <span className="text-slate-300">{station.lon.toFixed(1)}°</span>
        </div>
        <div className="text-slate-400">
          Lat: <span className="text-slate-300">{station.lat.toFixed(1)}°</span>
        </div>
        <div className="text-slate-400">
          Dish: <span className="text-slate-300">{station.antennaDiameter.toFixed(1)}m</span>
        </div>
        <div className="text-slate-400">
          Min El: <span className="text-slate-300">{station.minElevation.toFixed(0)}°</span>
        </div>
      </div>

      {/* Received signals */}
      {station.receivedSignals.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-slate-400 font-medium">Received Signals</div>
          {station.receivedSignals.map((signal) => {
            const sat = satellites.find((s) => s.id === signal.satelliteId);
            if (!sat) return null;

            const qualityInfo = getQualityLabel(signal.quality);

            return (
              <div
                key={signal.id}
                className={`bg-slate-900/50 rounded p-2 border ${signal.active ? 'border-cyan-500/30' : 'border-red-500/30'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSignalIcon(signal.quality)}
                    <span className="text-xs text-slate-300">{sat.name}</span>
                  </div>
                  <span className={`text-xs ${qualityInfo.color}`}>{qualityInfo.label}</span>
                </div>

                <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                  <div className="text-slate-500">
                    Strength: <span className="text-slate-400">{signal.signalStrength.toFixed(1)} dBm</span>
                  </div>
                  <div className="text-slate-500">
                    Quality: <span className="text-slate-400">{signal.quality.toFixed(0)}%</span>
                  </div>
                  <div className="text-slate-500">
                    Delay: <span className="text-slate-400">{formatDelay(signal.delay)}</span>
                  </div>
                  <div className="text-slate-500">
                    Distance: <span className="text-slate-400">{Math.round(signal.distance)} km</span>
                  </div>
                  <div className="text-slate-500">
                    Elevation: <span className="text-slate-400">{signal.elevation.toFixed(1)}°</span>
                  </div>
                  <div className="text-slate-500">
                    Data Rate: <span className="text-slate-400">{signal.dataRate.toFixed(1)} Mbps</span>
                  </div>
                </div>

                {/* Signal strength bar */}
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          signal.quality >= SIGNAL_QUALITY.EXCELLENT
                            ? 'bg-green-500'
                            : signal.quality >= SIGNAL_QUALITY.GOOD
                            ? 'bg-cyan-500'
                            : signal.quality >= SIGNAL_QUALITY.FAIR
                            ? 'bg-yellow-500'
                            : signal.quality > SIGNAL_QUALITY.LOST
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${signal.quality}%` }}
                      />
                    </div>
                    <Wifi className={`w-3 h-3 ${signal.active ? 'text-cyan-400 animate-pulse' : 'text-red-400'}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSignals.length === 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <WifiOff className="w-3 h-3" />
          <span>No active signals</span>
        </div>
      )}
    </div>
  );
}

/**
 * Signal history entry component
 */
function HistoryEntry({ entry }: { entry: SignalHistoryEntry }) {
  const statusColors = {
    received: 'text-green-400 bg-green-500/10',
    lost: 'text-red-400 bg-red-500/10',
    interference: 'text-yellow-400 bg-yellow-500/10',
    blocked: 'text-orange-400 bg-orange-500/10',
  };

  const statusIcons = {
    received: <Wifi className="w-3 h-3" />,
    lost: <WifiOff className="w-3 h-3" />,
    interference: <AlertTriangle className="w-3 h-3" />,
    blocked: <AlertTriangle className="w-3 h-3" />,
  };

  return (
    <div className={`flex items-start gap-2 p-2 rounded ${statusColors[entry.status]}`}>
      <div className="mt-0.5">{statusIcons[entry.status]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium truncate">{entry.satelliteName}</span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            {formatTimestamp(entry.timestamp)}
          </div>
        </div>
        {entry.message && (
          <div className="text-xs text-slate-400 mt-0.5">{entry.message}</div>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span>Signal: {entry.signalStrength.toFixed(1)} dBm</span>
          <span>Quality: {entry.quality.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Interference zone display
 */
function InterferenceDisplay({ state }: { state: SatelliteSignalState }) {
  if (state.interferenceZones.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-8">
        No active interference detected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {state.interferenceZones.map((zone) => {
        const elapsed = Date.now() - zone.startedAt;
        const remaining = Math.max(0, zone.duration - elapsed);
        const progress = (elapsed / zone.duration) * 100;

        return (
          <div
            key={zone.id}
            className="bg-red-500/10 rounded-lg p-3 border border-red-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-300 capitalize">
                  {zone.type} Interference
                </span>
              </div>
              <span className="text-xs text-red-400">
                {Math.round(zone.intensity * 100)}% intensity
              </span>
            </div>

            <div className="text-xs text-slate-400 mb-2">{zone.description}</div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-500">
                Location: <span className="text-slate-400">{zone.lon.toFixed(1)}°, {zone.lat.toFixed(1)}°</span>
              </div>
              <div className="text-slate-500">
                Radius: <span className="text-slate-400">{zone.radius.toFixed(0)}°</span>
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Duration</span>
                <span>{(remaining / 1000).toFixed(0)}s remaining</span>
              </div>
              <div className="h-1 bg-slate-700 rounded overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-200"
                  style={{ width: `${100 - progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Main panel component
 */
export function SatelliteGroundStationPanel({
  state,
  playerId,
  onDeploySatellite,
  onBuildStation,
}: SatelliteGroundStationPanelProps) {
  // Filter for player's assets
  const playerSatellites = useMemo(
    () => (playerId ? state.satellites.filter((s) => s.ownerId === playerId) : state.satellites),
    [state.satellites, playerId]
  );

  const playerStations = useMemo(
    () => (playerId ? state.groundStations.filter((s) => s.ownerId === playerId) : state.groundStations),
    [state.groundStations, playerId]
  );

  // Aggregate signal history from all stations
  const allHistory = useMemo(() => {
    const history: SignalHistoryEntry[] = [];
    playerStations.forEach((station) => {
      history.push(...station.signalHistory);
    });
    return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }, [playerStations]);

  // Calculate total signals
  const totalActiveSignals = playerStations.reduce(
    (sum, station) => sum + station.receivedSignals.filter((s) => s.active).length,
    0
  );

  // Get signals for each satellite
  const signalsPerSatellite = useMemo(() => {
    const map = new Map<string, ReceivedSignal[]>();
    playerStations.forEach((station) => {
      station.receivedSignals.forEach((signal) => {
        const existing = map.get(signal.satelliteId) || [];
        existing.push(signal);
        map.set(signal.satelliteId, existing);
      });
    });
    return map;
  }, [playerStations]);

  return (
    <div className="bg-slate-900/95 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-slate-800/50 px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-100">Satellite Communications</h2>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Satellite className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-300">{playerSatellites.filter((s) => s.operational).length} Satellites</span>
            </div>
            <div className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-amber-400" />
              <span className="text-slate-300">{playerStations.filter((s) => s.operational).length} Stations</span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-green-400" />
              <span className="text-slate-300">{totalActiveSignals} Active Signals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="satellites" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-slate-800/50 rounded-none border-b border-slate-700/50">
          <TabsTrigger value="satellites" className="text-xs">Satellites</TabsTrigger>
          <TabsTrigger value="stations" className="text-xs">Ground Stations</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Signal History</TabsTrigger>
          <TabsTrigger value="interference" className="text-xs">Interference</TabsTrigger>
        </TabsList>

        <TabsContent value="satellites" className="p-4 m-0">
          <ScrollArea className="h-[400px]">
            {playerSatellites.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <Satellite className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No satellites deployed</p>
                {onDeploySatellite && (
                  <button
                    onClick={() => onDeploySatellite('communication')}
                    className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm text-white transition-colors"
                  >
                    Deploy Satellite
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {playerSatellites.map((satellite) => (
                  <SatelliteCard
                    key={satellite.id}
                    satellite={satellite}
                    signals={signalsPerSatellite.get(satellite.id) || []}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="stations" className="p-4 m-0">
          <ScrollArea className="h-[400px]">
            {playerStations.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <Radio className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No ground stations built</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {playerStations.map((station) => (
                  <GroundStationCard
                    key={station.id}
                    station={station}
                    satellites={playerSatellites}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="p-4 m-0">
          <ScrollArea className="h-[400px]">
            {allHistory.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No signal history</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allHistory.map((entry, index) => (
                  <HistoryEntry key={`${entry.timestamp}-${entry.satelliteId}-${index}`} entry={entry} />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="interference" className="p-4 m-0">
          <ScrollArea className="h-[400px]">
            <InterferenceDisplay state={state} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SatelliteGroundStationPanel;
