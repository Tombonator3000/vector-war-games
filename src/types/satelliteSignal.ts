/**
 * Satellite Signal Simulation Types
 *
 * Defines types for a realistic satellite communication system including:
 * - Satellites with orbital mechanics
 * - Ground stations for receiving signals
 * - Signal transmission with delay and interference
 */

export interface OrbitalParameters {
  /** Semi-major axis in km (determines orbital period) */
  semiMajorAxis: number;
  /** Eccentricity (0 = circular, <1 = elliptical) */
  eccentricity: number;
  /** Inclination in degrees (0 = equatorial, 90 = polar) */
  inclination: number;
  /** Right ascension of ascending node in degrees */
  raan: number;
  /** Argument of periapsis in degrees */
  argumentOfPeriapsis: number;
  /** Mean anomaly at epoch in degrees */
  meanAnomaly: number;
  /** Epoch timestamp when orbital elements were defined */
  epoch: number;
}

export interface SignalSatellite {
  id: string;
  /** Owner nation ID */
  ownerId: string;
  /** Satellite name/designation */
  name: string;
  /** Type of satellite */
  type: 'communication' | 'reconnaissance' | 'navigation' | 'weather';
  /** Orbital parameters for position calculation */
  orbital: OrbitalParameters;
  /** Current calculated position */
  currentPosition: {
    lon: number;
    lat: number;
    altitude: number; // km above Earth surface
  };
  /** Signal transmission power in dBW */
  transmitPower: number;
  /** Antenna gain in dBi */
  antennaGain: number;
  /** Operating frequency in GHz */
  frequency: number;
  /** Whether satellite is operational */
  operational: boolean;
  /** Health status (0-100) */
  health: number;
  /** Deployment timestamp */
  deployedAt: number;
  /** Time-to-live in milliseconds */
  ttl: number;
}

export interface GroundStation {
  id: string;
  /** Owner nation ID */
  ownerId: string;
  /** Station name */
  name: string;
  /** Geographic position */
  lon: number;
  lat: number;
  /** Antenna dish diameter in meters */
  antennaDiameter: number;
  /** Receiver sensitivity in dBm */
  receiverSensitivity: number;
  /** Minimum elevation angle for satellite visibility (degrees) */
  minElevation: number;
  /** Whether station is operational */
  operational: boolean;
  /** Current received signals */
  receivedSignals: ReceivedSignal[];
  /** Signal history for display */
  signalHistory: SignalHistoryEntry[];
  /** Maximum history entries to keep */
  maxHistorySize: number;
}

export interface ReceivedSignal {
  id: string;
  /** Source satellite ID */
  satelliteId: string;
  /** Signal strength in dBm */
  signalStrength: number;
  /** Signal quality (0-100) */
  quality: number;
  /** Propagation delay in milliseconds */
  delay: number;
  /** Distance to satellite in km */
  distance: number;
  /** Elevation angle in degrees */
  elevation: number;
  /** Azimuth angle in degrees */
  azimuth: number;
  /** Timestamp when signal was received */
  receivedAt: number;
  /** Whether signal is currently being received */
  active: boolean;
  /** Data rate in Mbps */
  dataRate: number;
  /** Bit error rate */
  bitErrorRate: number;
}

export interface SignalHistoryEntry {
  timestamp: number;
  satelliteId: string;
  satelliteName: string;
  signalStrength: number;
  quality: number;
  status: 'received' | 'lost' | 'interference' | 'blocked';
  message?: string;
}

export interface SignalTransmission {
  id: string;
  /** Source satellite ID */
  satelliteId: string;
  /** Target ground station IDs (broadcast to all visible) */
  targetStationIds: string[];
  /** Start position (satellite) */
  startLon: number;
  startLat: number;
  startAlt: number;
  /** Current wave front position (0-1 for animation) */
  progress: number;
  /** Transmission start time */
  startedAt: number;
  /** Signal properties */
  frequency: number;
  power: number;
  /** Visual animation phase */
  wavePhase: number;
  /** Whether transmission is complete */
  completed: boolean;
}

export interface SignalInterference {
  id: string;
  /** Type of interference */
  type: 'atmospheric' | 'solar' | 'jamming' | 'obstruction' | 'multipath';
  /** Center location */
  lon: number;
  lat: number;
  /** Radius of effect in degrees */
  radius: number;
  /** Intensity (0-1, higher = more interference) */
  intensity: number;
  /** Start time */
  startedAt: number;
  /** Duration in milliseconds */
  duration: number;
  /** Description for logs */
  description: string;
}

export interface SatelliteSignalState {
  /** Active satellites in orbit */
  satellites: SignalSatellite[];
  /** Ground receiving stations */
  groundStations: GroundStation[];
  /** Active signal transmissions (for visualization) */
  activeTransmissions: SignalTransmission[];
  /** Active interference zones */
  interferenceZones: SignalInterference[];
  /** Global simulation settings */
  settings: SignalSimulationSettings;
  /** Last update timestamp */
  lastUpdate: number;
}

export interface SignalSimulationSettings {
  /** Speed of light for delay calculation (km/ms) */
  speedOfLight: number;
  /** Earth radius in km */
  earthRadius: number;
  /** Atmospheric attenuation factor */
  atmosphericAttenuation: number;
  /** Rain fade factor */
  rainFade: number;
  /** Update interval in ms */
  updateInterval: number;
  /** Whether to simulate random interference */
  randomInterference: boolean;
  /** Interference probability per update (0-1) */
  interferenceProbability: number;
  /** Signal visualization duration in ms */
  signalVisualizationDuration: number;
}

/** Orbital mechanics constants */
export const ORBITAL_CONSTANTS = {
  /** Gravitational parameter for Earth (km^3/s^2) */
  MU: 398600.4418,
  /** Earth equatorial radius (km) */
  EARTH_RADIUS: 6378.137,
  /** Degrees to radians */
  DEG_TO_RAD: Math.PI / 180,
  /** Radians to degrees */
  RAD_TO_DEG: 180 / Math.PI,
  /** Speed of light in vacuum (km/s) */
  SPEED_OF_LIGHT: 299792.458,
  /** Standard LEO altitude (km) */
  LEO_ALTITUDE: 400,
  /** Standard MEO altitude (km) */
  MEO_ALTITUDE: 20200,
  /** Geostationary altitude (km) */
  GEO_ALTITUDE: 35786,
};

/** Default signal simulation settings */
export const DEFAULT_SIGNAL_SETTINGS: SignalSimulationSettings = {
  speedOfLight: 299.792458, // km/ms
  earthRadius: 6378.137,
  atmosphericAttenuation: 0.1, // dB per km in atmosphere
  rainFade: 0.5, // additional dB loss
  updateInterval: 100, // ms
  randomInterference: true,
  interferenceProbability: 0.02, // 2% chance per update
  signalVisualizationDuration: 2000, // ms
};

/** Signal quality thresholds */
export const SIGNAL_QUALITY = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
  POOR: 20,
  LOST: 0,
};

/** Interference types with descriptions */
export const INTERFERENCE_DESCRIPTIONS: Record<SignalInterference['type'], string> = {
  atmospheric: 'Atmospheric disturbance affecting signal propagation',
  solar: 'Solar flare activity causing ionospheric disruption',
  jamming: 'Hostile electronic warfare jamming detected',
  obstruction: 'Physical obstruction blocking line-of-sight',
  multipath: 'Multipath interference from signal reflections',
};
