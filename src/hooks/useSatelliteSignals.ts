/**
 * Satellite Signal Simulation Hook
 *
 * Provides a complete simulation of satellite communication including:
 * - Simplified orbital mechanics for satellite positioning
 * - Signal transmission with realistic delay calculations
 * - Ground station signal reception
 * - Random interference and signal loss simulation
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SignalSatellite,
  GroundStation,
  SignalTransmission,
  SignalInterference,
  SatelliteSignalState,
  ReceivedSignal,
  OrbitalParameters,
  SignalHistoryEntry,
  ORBITAL_CONSTANTS,
  DEFAULT_SIGNAL_SETTINGS,
  SIGNAL_QUALITY,
  INTERFERENCE_DESCRIPTIONS,
} from '@/types/satelliteSignal';
import type { Nation } from '@/types/game';

interface UseSatelliteSignalsConfig {
  /** Current game turn */
  currentTurn: number;
  /** Get nation by ID */
  getNation: (id: string) => Nation | undefined;
  /** All nations */
  nations: Nation[];
  /** Callback for logging events */
  onLog?: (message: string) => void;
  /** Callback for news events */
  onNews?: (headline: string, details: string) => void;
  /** Whether simulation is enabled */
  enabled?: boolean;
}

interface UseSatelliteSignalsReturn {
  /** Current simulation state */
  state: SatelliteSignalState;
  /** Deploy a new satellite */
  deploySatellite: (ownerId: string, type: SignalSatellite['type'], name?: string) => SignalSatellite | null;
  /** Build a ground station */
  buildGroundStation: (ownerId: string, lon: number, lat: number, name?: string) => GroundStation | null;
  /** Trigger a signal transmission from a satellite */
  transmitSignal: (satelliteId: string) => void;
  /** Add interference zone */
  addInterference: (type: SignalInterference['type'], lon: number, lat: number, intensity?: number) => void;
  /** Get satellites visible from a ground station */
  getVisibleSatellites: (stationId: string) => SignalSatellite[];
  /** Get signal status for a nation */
  getNationSignalStatus: (nationId: string) => {
    satellites: number;
    groundStations: number;
    activeSignals: number;
    averageQuality: number;
  };
  /** Update simulation (called each frame) */
  update: (deltaMs: number) => void;
  /** Reset simulation */
  reset: () => void;
}

/**
 * Calculate satellite position using simplified Keplerian orbital mechanics
 */
function calculateSatellitePosition(
  orbital: OrbitalParameters,
  currentTime: number
): { lon: number; lat: number; altitude: number } {
  const { MU, DEG_TO_RAD, RAD_TO_DEG, EARTH_RADIUS } = ORBITAL_CONSTANTS;

  // Calculate orbital period (seconds)
  const a = orbital.semiMajorAxis;
  const period = 2 * Math.PI * Math.sqrt((a * a * a) / MU);

  // Time since epoch in seconds
  const dt = (currentTime - orbital.epoch) / 1000;

  // Mean motion (rad/s)
  const n = (2 * Math.PI) / period;

  // Current mean anomaly
  const M = (orbital.meanAnomaly * DEG_TO_RAD + n * dt) % (2 * Math.PI);

  // Solve Kepler's equation for eccentric anomaly (simplified Newton-Raphson)
  let E = M;
  const e = orbital.eccentricity;
  for (let i = 0; i < 10; i++) {
    E = M + e * Math.sin(E);
  }

  // True anomaly
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const nu = Math.atan2(Math.sqrt(1 - e * e) * sinE, cosE - e);

  // Distance from Earth center
  const r = a * (1 - e * cosE);

  // Position in orbital plane
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  // Convert orbital elements to geocentric coordinates
  const inc = orbital.inclination * DEG_TO_RAD;
  const raan = orbital.raan * DEG_TO_RAD;
  const omega = orbital.argumentOfPeriapsis * DEG_TO_RAD;

  // Rotation matrices
  const cosOmega = Math.cos(omega);
  const sinOmega = Math.sin(omega);
  const cosRaan = Math.cos(raan);
  const sinRaan = Math.sin(raan);
  const cosInc = Math.cos(inc);
  const sinInc = Math.sin(inc);

  // Earth-Centered Inertial (ECI) coordinates
  const x =
    (cosRaan * cosOmega - sinRaan * sinOmega * cosInc) * xOrb +
    (-cosRaan * sinOmega - sinRaan * cosOmega * cosInc) * yOrb;
  const y =
    (sinRaan * cosOmega + cosRaan * sinOmega * cosInc) * xOrb +
    (-sinRaan * sinOmega + cosRaan * cosOmega * cosInc) * yOrb;
  const z = sinInc * sinOmega * xOrb + sinInc * cosOmega * yOrb;

  // Convert to geographic coordinates
  // Simplified: assume Earth rotation (we ignore sidereal time for game simplicity)
  const earthRotation = (dt / 86400) * 360; // degrees per day
  const lon = ((Math.atan2(y, x) * RAD_TO_DEG - earthRotation) % 360 + 540) % 360 - 180;
  const lat = Math.asin(z / r) * RAD_TO_DEG;
  const altitude = r - EARTH_RADIUS;

  return { lon, lat, altitude };
}

/**
 * Calculate distance between satellite and ground station
 */
function calculateDistance(
  satLon: number,
  satLat: number,
  satAlt: number,
  gsLon: number,
  gsLat: number
): number {
  const { EARTH_RADIUS, DEG_TO_RAD } = ORBITAL_CONSTANTS;

  // Convert to radians
  const lat1 = gsLat * DEG_TO_RAD;
  const lat2 = satLat * DEG_TO_RAD;
  const dLon = (satLon - gsLon) * DEG_TO_RAD;

  // Ground station position (on Earth surface)
  const gsX = EARTH_RADIUS * Math.cos(lat1) * Math.cos(0);
  const gsY = EARTH_RADIUS * Math.cos(lat1) * Math.sin(0);
  const gsZ = EARTH_RADIUS * Math.sin(lat1);

  // Satellite position
  const satR = EARTH_RADIUS + satAlt;
  const satX = satR * Math.cos(lat2) * Math.cos(dLon);
  const satY = satR * Math.cos(lat2) * Math.sin(dLon);
  const satZ = satR * Math.sin(lat2);

  // Euclidean distance
  const dx = satX - gsX;
  const dy = satY - gsY;
  const dz = satZ - gsZ;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate elevation angle from ground station to satellite
 */
function calculateElevation(
  satLon: number,
  satLat: number,
  satAlt: number,
  gsLon: number,
  gsLat: number
): number {
  const { EARTH_RADIUS, DEG_TO_RAD, RAD_TO_DEG } = ORBITAL_CONSTANTS;

  const dLon = (satLon - gsLon) * DEG_TO_RAD;
  const lat1 = gsLat * DEG_TO_RAD;
  const lat2 = satLat * DEG_TO_RAD;

  // Satellite radius
  const satR = EARTH_RADIUS + satAlt;

  // Calculate nadir angle
  const cosNadir =
    Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const nadir = Math.acos(Math.max(-1, Math.min(1, cosNadir)));

  // Calculate elevation
  const sinElevation =
    (satR * cosNadir - EARTH_RADIUS) /
    Math.sqrt(EARTH_RADIUS * EARTH_RADIUS + satR * satR - 2 * EARTH_RADIUS * satR * cosNadir);

  return Math.asin(Math.max(-1, Math.min(1, sinElevation))) * RAD_TO_DEG;
}

/**
 * Calculate azimuth angle from ground station to satellite
 */
function calculateAzimuth(satLon: number, satLat: number, gsLon: number, gsLat: number): number {
  const { DEG_TO_RAD, RAD_TO_DEG } = ORBITAL_CONSTANTS;

  const dLon = (satLon - gsLon) * DEG_TO_RAD;
  const lat1 = gsLat * DEG_TO_RAD;
  const lat2 = satLat * DEG_TO_RAD;

  const x = Math.sin(dLon) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const azimuth = Math.atan2(x, y) * RAD_TO_DEG;
  return (azimuth + 360) % 360;
}

/**
 * Calculate signal strength using free-space path loss model
 */
function calculateSignalStrength(
  transmitPower: number,
  antennaGain: number,
  receiverGain: number,
  frequency: number,
  distance: number,
  atmosphericLoss: number = 0
): number {
  // Free-space path loss (dB)
  // FSPL = 20*log10(d) + 20*log10(f) + 20*log10(4*pi/c)
  const c = ORBITAL_CONSTANTS.SPEED_OF_LIGHT; // km/s
  const fspl = 20 * Math.log10(distance) + 20 * Math.log10(frequency * 1e9) + 20 * Math.log10((4 * Math.PI) / (c * 1000));

  // Received power (dBm)
  const receivedPower = transmitPower + antennaGain + receiverGain - fspl - atmosphericLoss;

  return receivedPower;
}

/**
 * Calculate signal quality from signal strength
 */
function calculateSignalQuality(signalStrength: number, receiverSensitivity: number): number {
  // Signal margin above receiver sensitivity
  const margin = signalStrength - receiverSensitivity;

  // Convert to 0-100 quality scale
  // -10 dB margin = 0%, +20 dB margin = 100%
  const quality = ((margin + 10) / 30) * 100;

  return Math.max(0, Math.min(100, quality));
}

/**
 * Calculate bit error rate based on signal quality
 */
function calculateBitErrorRate(quality: number): number {
  // Simplified BER model
  if (quality >= SIGNAL_QUALITY.EXCELLENT) return 1e-9;
  if (quality >= SIGNAL_QUALITY.GOOD) return 1e-7;
  if (quality >= SIGNAL_QUALITY.FAIR) return 1e-5;
  if (quality >= SIGNAL_QUALITY.POOR) return 1e-3;
  return 1e-1;
}

/**
 * Calculate data rate based on signal quality
 */
function calculateDataRate(quality: number, baseRate: number = 100): number {
  // Adaptive modulation simulation
  const efficiency = quality / 100;
  return baseRate * efficiency * efficiency;
}

/**
 * Generate random orbital parameters for a new satellite
 */
function generateOrbitalParameters(type: SignalSatellite['type']): OrbitalParameters {
  const { EARTH_RADIUS, LEO_ALTITUDE, MEO_ALTITUDE, GEO_ALTITUDE } = ORBITAL_CONSTANTS;

  let altitude: number;
  let inclination: number;

  switch (type) {
    case 'communication':
      // GEO or MEO
      altitude = Math.random() > 0.5 ? GEO_ALTITUDE : MEO_ALTITUDE;
      inclination = altitude === GEO_ALTITUDE ? Math.random() * 5 : 45 + Math.random() * 20;
      break;
    case 'reconnaissance':
      // LEO, sun-synchronous-like
      altitude = LEO_ALTITUDE + Math.random() * 400;
      inclination = 80 + Math.random() * 20; // Near polar
      break;
    case 'navigation':
      // MEO
      altitude = MEO_ALTITUDE + Math.random() * 2000;
      inclination = 55 + Math.random() * 10;
      break;
    case 'weather':
      // Various
      altitude = Math.random() > 0.3 ? GEO_ALTITUDE : LEO_ALTITUDE + Math.random() * 500;
      inclination = altitude === GEO_ALTITUDE ? Math.random() * 5 : 70 + Math.random() * 30;
      break;
    default:
      altitude = LEO_ALTITUDE;
      inclination = 45;
  }

  return {
    semiMajorAxis: EARTH_RADIUS + altitude,
    eccentricity: Math.random() * 0.01, // Nearly circular
    inclination,
    raan: Math.random() * 360,
    argumentOfPeriapsis: Math.random() * 360,
    meanAnomaly: Math.random() * 360,
    epoch: Date.now(),
  };
}

/**
 * Main satellite signal simulation hook
 */
export function useSatelliteSignals(config: UseSatelliteSignalsConfig): UseSatelliteSignalsReturn {
  const { currentTurn, getNation, nations, onLog, onNews, enabled = true } = config;

  const [state, setState] = useState<SatelliteSignalState>({
    satellites: [],
    groundStations: [],
    activeTransmissions: [],
    interferenceZones: [],
    settings: DEFAULT_SIGNAL_SETTINGS,
    lastUpdate: Date.now(),
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const satelliteCounter = useRef(0);
  const stationCounter = useRef(0);
  const transmissionCounter = useRef(0);
  const interferenceCounter = useRef(0);

  /**
   * Deploy a new satellite
   */
  const deploySatellite = useCallback(
    (ownerId: string, type: SignalSatellite['type'], name?: string): SignalSatellite | null => {
      const nation = getNation(ownerId);
      if (!nation) return null;

      const id = `sat_${ownerId}_${++satelliteCounter.current}`;
      const orbital = generateOrbitalParameters(type);
      const position = calculateSatellitePosition(orbital, Date.now());

      const satellite: SignalSatellite = {
        id,
        ownerId,
        name: name || `${nation.name.substring(0, 3).toUpperCase()}-SAT-${satelliteCounter.current}`,
        type,
        orbital,
        currentPosition: position,
        transmitPower: type === 'communication' ? 20 : 15, // dBW
        antennaGain: type === 'communication' ? 35 : 25, // dBi
        frequency: type === 'navigation' ? 1.575 : type === 'weather' ? 8.0 : 12.0, // GHz
        operational: true,
        health: 100,
        deployedAt: Date.now(),
        ttl: 3600000 * 2, // 2 hours
      };

      setState((prev) => ({
        ...prev,
        satellites: [...prev.satellites, satellite],
      }));

      onLog?.(`[SATELLITE] ${nation.name} deployed ${satellite.name} (${type}) at altitude ${Math.round(position.altitude)} km`);

      return satellite;
    },
    [getNation, onLog]
  );

  /**
   * Build a ground station
   */
  const buildGroundStation = useCallback(
    (ownerId: string, lon: number, lat: number, name?: string): GroundStation | null => {
      const nation = getNation(ownerId);
      if (!nation) return null;

      const id = `gs_${ownerId}_${++stationCounter.current}`;

      const station: GroundStation = {
        id,
        ownerId,
        name: name || `${nation.name.substring(0, 3).toUpperCase()}-GS-${stationCounter.current}`,
        lon,
        lat,
        antennaDiameter: 10 + Math.random() * 20, // 10-30 meters
        receiverSensitivity: -120 - Math.random() * 20, // -120 to -140 dBm
        minElevation: 5 + Math.random() * 5, // 5-10 degrees
        operational: true,
        receivedSignals: [],
        signalHistory: [],
        maxHistorySize: 50,
      };

      setState((prev) => ({
        ...prev,
        groundStations: [...prev.groundStations, station],
      }));

      onLog?.(`[GROUND STATION] ${nation.name} built ${station.name} at (${lon.toFixed(1)}°, ${lat.toFixed(1)}°)`);

      return station;
    },
    [getNation, onLog]
  );

  /**
   * Trigger a signal transmission
   */
  const transmitSignal = useCallback((satelliteId: string) => {
    const satellite = stateRef.current.satellites.find((s) => s.id === satelliteId);
    if (!satellite || !satellite.operational) return;

    // Find all visible ground stations
    const visibleStations = stateRef.current.groundStations.filter((gs) => {
      if (!gs.operational) return false;
      const { lon, lat, altitude } = satellite.currentPosition;
      const elevation = calculateElevation(lon, lat, altitude, gs.lon, gs.lat);
      return elevation >= gs.minElevation;
    });

    if (visibleStations.length === 0) return;

    const transmission: SignalTransmission = {
      id: `tx_${++transmissionCounter.current}`,
      satelliteId,
      targetStationIds: visibleStations.map((s) => s.id),
      startLon: satellite.currentPosition.lon,
      startLat: satellite.currentPosition.lat,
      startAlt: satellite.currentPosition.altitude,
      progress: 0,
      startedAt: Date.now(),
      frequency: satellite.frequency,
      power: satellite.transmitPower,
      wavePhase: 0,
      completed: false,
    };

    setState((prev) => ({
      ...prev,
      activeTransmissions: [...prev.activeTransmissions, transmission],
    }));
  }, []);

  /**
   * Add interference zone
   */
  const addInterference = useCallback(
    (type: SignalInterference['type'], lon: number, lat: number, intensity: number = 0.5) => {
      const interference: SignalInterference = {
        id: `int_${++interferenceCounter.current}`,
        type,
        lon,
        lat,
        radius: 10 + Math.random() * 20,
        intensity: Math.max(0, Math.min(1, intensity)),
        startedAt: Date.now(),
        duration: 5000 + Math.random() * 25000, // 5-30 seconds
        description: INTERFERENCE_DESCRIPTIONS[type],
      };

      setState((prev) => ({
        ...prev,
        interferenceZones: [...prev.interferenceZones, interference],
      }));

      onLog?.(`[INTERFERENCE] ${type} detected at (${lon.toFixed(1)}°, ${lat.toFixed(1)}°) - ${interference.description}`);
    },
    [onLog]
  );

  /**
   * Get satellites visible from a ground station
   */
  const getVisibleSatellites = useCallback(
    (stationId: string): SignalSatellite[] => {
      const station = stateRef.current.groundStations.find((s) => s.id === stationId);
      if (!station) return [];

      return stateRef.current.satellites.filter((sat) => {
        if (!sat.operational) return false;
        const { lon, lat, altitude } = sat.currentPosition;
        const elevation = calculateElevation(lon, lat, altitude, station.lon, station.lat);
        return elevation >= station.minElevation;
      });
    },
    []
  );

  /**
   * Get signal status for a nation
   */
  const getNationSignalStatus = useCallback(
    (nationId: string) => {
      const satellites = stateRef.current.satellites.filter((s) => s.ownerId === nationId && s.operational);
      const groundStations = stateRef.current.groundStations.filter((s) => s.ownerId === nationId && s.operational);

      let totalSignals = 0;
      let totalQuality = 0;

      groundStations.forEach((gs) => {
        gs.receivedSignals.forEach((sig) => {
          if (sig.active) {
            totalSignals++;
            totalQuality += sig.quality;
          }
        });
      });

      return {
        satellites: satellites.length,
        groundStations: groundStations.length,
        activeSignals: totalSignals,
        averageQuality: totalSignals > 0 ? totalQuality / totalSignals : 0,
      };
    },
    []
  );

  /**
   * Update simulation
   */
  const update = useCallback(
    (deltaMs: number) => {
      if (!enabled) return;

      const now = Date.now();
      const settings = stateRef.current.settings;

      setState((prev) => {
        // Update satellite positions
        const satellites = prev.satellites
          .filter((sat) => now - sat.deployedAt < sat.ttl)
          .map((sat) => ({
            ...sat,
            currentPosition: calculateSatellitePosition(sat.orbital, now),
          }));

        // Remove expired interference
        const interferenceZones = prev.interferenceZones.filter(
          (iz) => now - iz.startedAt < iz.duration
        );

        // Random interference generation
        if (settings.randomInterference && Math.random() < settings.interferenceProbability) {
          const types: SignalInterference['type'][] = ['atmospheric', 'solar', 'multipath'];
          const type = types[Math.floor(Math.random() * types.length)];
          const lon = Math.random() * 360 - 180;
          const lat = Math.random() * 180 - 90;
          interferenceZones.push({
            id: `int_auto_${now}`,
            type,
            lon,
            lat,
            radius: 15 + Math.random() * 30,
            intensity: 0.3 + Math.random() * 0.4,
            startedAt: now,
            duration: 10000 + Math.random() * 20000,
            description: INTERFERENCE_DESCRIPTIONS[type],
          });
        }

        // Update ground station signals
        const groundStations = prev.groundStations.map((gs) => {
          if (!gs.operational) return gs;

          const receivedSignals: ReceivedSignal[] = [];

          satellites.forEach((sat) => {
            if (!sat.operational || sat.ownerId !== gs.ownerId) return;

            const { lon, lat, altitude } = sat.currentPosition;
            const elevation = calculateElevation(lon, lat, altitude, gs.lon, gs.lat);

            if (elevation < gs.minElevation) return;

            const distance = calculateDistance(lon, lat, altitude, gs.lon, gs.lat);
            const azimuth = calculateAzimuth(lon, lat, gs.lon, gs.lat);
            const delay = distance / settings.speedOfLight;

            // Calculate atmospheric loss
            let atmosphericLoss = settings.atmosphericAttenuation * Math.min(altitude, 100);

            // Add interference effects
            interferenceZones.forEach((iz) => {
              const izDist = Math.sqrt(
                Math.pow(gs.lon - iz.lon, 2) + Math.pow(gs.lat - iz.lat, 2)
              );
              if (izDist < iz.radius) {
                atmosphericLoss += iz.intensity * 20 * (1 - izDist / iz.radius);
              }
            });

            // Random signal loss (obstruction simulation)
            if (Math.random() < 0.05) {
              atmosphericLoss += 30;
            }

            const receiverGain = 10 * Math.log10(gs.antennaDiameter);
            const signalStrength = calculateSignalStrength(
              sat.transmitPower,
              sat.antennaGain,
              receiverGain,
              sat.frequency,
              distance,
              atmosphericLoss
            );

            const quality = calculateSignalQuality(signalStrength, gs.receiverSensitivity);
            const active = quality > SIGNAL_QUALITY.LOST;

            receivedSignals.push({
              id: `sig_${sat.id}_${gs.id}`,
              satelliteId: sat.id,
              signalStrength,
              quality,
              delay,
              distance,
              elevation,
              azimuth,
              receivedAt: now,
              active,
              dataRate: calculateDataRate(quality),
              bitErrorRate: calculateBitErrorRate(quality),
            });
          });

          // Update signal history
          const signalHistory = [...gs.signalHistory];
          receivedSignals.forEach((sig) => {
            const sat = satellites.find((s) => s.id === sig.satelliteId);
            if (!sat) return;

            const lastEntry = signalHistory.find(
              (h) => h.satelliteId === sig.satelliteId && now - h.timestamp < 5000
            );

            if (!lastEntry) {
              const status = sig.active
                ? sig.quality >= SIGNAL_QUALITY.GOOD
                  ? 'received'
                  : 'interference'
                : 'lost';

              signalHistory.push({
                timestamp: now,
                satelliteId: sig.satelliteId,
                satelliteName: sat.name,
                signalStrength: sig.signalStrength,
                quality: sig.quality,
                status,
                message:
                  status === 'received'
                    ? `Signal acquired from ${sat.name}`
                    : status === 'interference'
                    ? `Degraded signal from ${sat.name}`
                    : `Signal lost from ${sat.name}`,
              });
            }
          });

          // Trim history
          while (signalHistory.length > gs.maxHistorySize) {
            signalHistory.shift();
          }

          return {
            ...gs,
            receivedSignals,
            signalHistory,
          };
        });

        // Update transmissions
        const activeTransmissions = prev.activeTransmissions
          .map((tx) => {
            const elapsed = now - tx.startedAt;
            const duration = settings.signalVisualizationDuration;
            const progress = Math.min(1, elapsed / duration);
            const wavePhase = (tx.wavePhase + deltaMs * 0.01) % (Math.PI * 2);

            return {
              ...tx,
              progress,
              wavePhase,
              completed: progress >= 1,
            };
          })
          .filter((tx) => !tx.completed);

        // Auto-transmit from satellites periodically
        satellites.forEach((sat) => {
          if (sat.operational && Math.random() < 0.02) {
            const hasVisibleStation = groundStations.some((gs) => {
              if (!gs.operational || gs.ownerId !== sat.ownerId) return false;
              const elevation = calculateElevation(
                sat.currentPosition.lon,
                sat.currentPosition.lat,
                sat.currentPosition.altitude,
                gs.lon,
                gs.lat
              );
              return elevation >= gs.minElevation;
            });

            if (hasVisibleStation) {
              const existingTx = activeTransmissions.find((tx) => tx.satelliteId === sat.id);
              if (!existingTx) {
                activeTransmissions.push({
                  id: `tx_auto_${now}_${sat.id}`,
                  satelliteId: sat.id,
                  targetStationIds: groundStations
                    .filter((gs) => gs.ownerId === sat.ownerId && gs.operational)
                    .map((gs) => gs.id),
                  startLon: sat.currentPosition.lon,
                  startLat: sat.currentPosition.lat,
                  startAlt: sat.currentPosition.altitude,
                  progress: 0,
                  startedAt: now,
                  frequency: sat.frequency,
                  power: sat.transmitPower,
                  wavePhase: 0,
                  completed: false,
                });
              }
            }
          }
        });

        return {
          ...prev,
          satellites,
          groundStations,
          activeTransmissions,
          interferenceZones,
          lastUpdate: now,
        };
      });
    },
    [enabled]
  );

  /**
   * Reset simulation
   */
  const reset = useCallback(() => {
    setState({
      satellites: [],
      groundStations: [],
      activeTransmissions: [],
      interferenceZones: [],
      settings: DEFAULT_SIGNAL_SETTINGS,
      lastUpdate: Date.now(),
    });
    satelliteCounter.current = 0;
    stationCounter.current = 0;
    transmissionCounter.current = 0;
    interferenceCounter.current = 0;
  }, []);

  // Auto-update loop
  useEffect(() => {
    if (!enabled) return;

    let lastTime = Date.now();
    let animationId: number;

    const loop = () => {
      const now = Date.now();
      const deltaMs = now - lastTime;
      lastTime = now;

      if (deltaMs > 0) {
        update(deltaMs);
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [enabled, update]);

  // Initialize default ground stations for player nation
  useEffect(() => {
    if (!enabled) return;

    const player = nations.find((n) => n.isPlayer);
    if (player && stateRef.current.groundStations.length === 0) {
      // Build initial ground stations near the player's capital
      buildGroundStation(player.id, player.lon, player.lat, `${player.name} Primary`);
      buildGroundStation(
        player.id,
        player.lon + 20 + Math.random() * 20,
        player.lat + (Math.random() - 0.5) * 30,
        `${player.name} Secondary`
      );
      buildGroundStation(
        player.id,
        player.lon - 20 - Math.random() * 20,
        player.lat + (Math.random() - 0.5) * 30,
        `${player.name} Tertiary`
      );
    }
  }, [enabled, nations, buildGroundStation]);

  // Expose state to window for canvas rendering
  useEffect(() => {
    (window as any).__satelliteSignalState = state;
  }, [state]);

  return {
    state,
    deploySatellite,
    buildGroundStation,
    transmitSignal,
    addInterference,
    getVisibleSatellites,
    getNationSignalStatus,
    update,
    reset,
  };
}

export default useSatelliteSignals;
