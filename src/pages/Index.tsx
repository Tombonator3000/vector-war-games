import { useEffect, useRef, useState, useCallback, useMemo, ReactNode } from 'react';
import { feature } from 'topojson-client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

// Storage wrapper for localStorage
const Storage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(`norad_${key}`);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(`norad_${key}`, value);
    } catch (e) {
      console.warn('Storage failed:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(`norad_${key}`);
    } catch (e) {
      console.warn('Storage removal failed:', e);
    }
  }
};

// Game State Types
interface Nation {
  id: string;
  isPlayer: boolean;
  name: string;
  leader: string;
  doctrine?: string;
  ai?: string;
  lon: number;
  lat: number;
  color: string;
  population: number;
  missiles: number;
  bombers?: number;
  submarines?: number;
  defense: number;
  instability?: number;
  production: number;
  uranium: number;
  intel: number;
  cities?: number;
  warheads: Record<number, number>;
  researched?: Record<string, boolean>;
  researchQueue?: { projectId: string; turnsRemaining: number; totalTurns: number } | null;
  treaties?: Record<string, any>;
  satellites?: Record<string, boolean>;
  bordersClosedTurns?: number;
  greenShiftTurns?: number;
  threats?: Record<string, number>;
  migrantsThisTurn?: number;
  migrantsTotal?: number;
}

interface GameState {
  turn: number;
  defcon: number;
  phase: 'PLAYER' | 'AI' | 'RESOLUTION' | 'PRODUCTION';
  actionsRemaining: number;
  paused: boolean;
  gameOver: boolean;
  selectedLeader: string | null;
  selectedDoctrine: string | null;
  playerName?: string;
  difficulty?: string;
  missiles: any[];
  bombers: any[];
  submarines?: any[];
  explosions: any[];
  particles: any[];
  radiationZones: any[];
  empEffects: any[];
  rings: any[];
  refugeeCamps?: any[];
  screenShake: number;
  overlay?: { text: string; ttl: number } | null;
  fx?: number;
  nuclearWinterLevel?: number;
  globalRadiation?: number;
  events?: boolean;
}

type ThemeId = 'synthwave' | 'retro80s' | 'wargames' | 'nightmode' | 'highcontrast';

const THEME_SETTINGS: Record<ThemeId, {
  mapOutline: string;
  grid: string;
  radar: string;
  ocean: string;
  cloud: string;
}> = {
  synthwave: {
    mapOutline: 'rgba(143,225,255,0.8)',
    grid: 'rgba(143,225,255,0.25)',
    radar: 'rgba(143,225,255,0.08)',
    ocean: 'rgba(40,100,220,0.6)',
    cloud: 'rgba(255,200,255,0.6)'
  },
  retro80s: {
    mapOutline: 'rgba(0,255,65,0.5)',
    grid: 'rgba(0,255,65,0.2)',
    radar: 'rgba(0,255,65,0.08)',
    ocean: 'rgba(30,70,160,0.65)',
    cloud: 'rgba(255,105,180,0.6)'
  },
  wargames: {
    mapOutline: 'rgba(0,255,0,0.4)',
    grid: 'rgba(0,255,0,0.1)',
    radar: 'rgba(0,255,0,0.05)',
    ocean: 'rgba(0,80,160,0.6)',
    cloud: 'rgba(150,150,150,0.6)'
  },
  nightmode: {
    mapOutline: 'rgba(102,204,255,0.5)',
    grid: 'rgba(102,204,255,0.18)',
    radar: 'rgba(102,204,255,0.07)',
    ocean: 'rgba(15,60,130,0.65)',
    cloud: 'rgba(160,200,240,0.45)'
  },
  highcontrast: {
    mapOutline: 'rgba(255,255,255,0.7)',
    grid: 'rgba(255,255,255,0.25)',
    radar: 'rgba(255,255,255,0.1)',
    ocean: 'rgba(20,80,160,0.7)',
    cloud: 'rgba(255,220,0,0.45)'
  }
};

const themeOptions: { id: ThemeId; label: string }[] = [
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'retro80s', label: 'Retro 80s' },
  { id: 'wargames', label: 'WARGAMES' },
  { id: 'nightmode', label: 'Night Mode' },
  { id: 'highcontrast', label: 'High Contrast' }
];

let currentTheme: ThemeId = 'synthwave';
let selectedTargetRefId: string | null = null;
let uiUpdateCallback: (() => void) | null = null;

// Global game state
let S: GameState = {
  turn: 1,
  defcon: 5,
  phase: 'PLAYER',
  actionsRemaining: 1,
  paused: false,
  gameOver: false,
  selectedLeader: null,
  selectedDoctrine: null,
  missiles: [],
  bombers: [],
  submarines: [],
  explosions: [],
  particles: [],
  radiationZones: [],
  empEffects: [],
  rings: [],
  refugeeCamps: [],
  screenShake: 0,
  fx: 1,
  nuclearWinterLevel: 0,
  globalRadiation: 0
};

let nations: Nation[] = [];
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let startCanvas: HTMLCanvasElement;
let startCtx: CanvasRenderingContext2D;
let W = 800, H = 600;

// Camera system
const cam = { x: 0, y: 0, zoom: 1, targetZoom: 1 };

// World data
let worldData: any = null;
let worldCountries: any = null;

// Leaders configuration
const leaders: { name: string; ai: string; color: string }[] = [
  { name: 'Ronnie Raygun', ai: 'aggressive', color: '#ff5555' },
  { name: 'Tricky Dick', ai: 'defensive', color: '#5599ff' },
  { name: 'Jimi Farmer', ai: 'balanced', color: '#55ff99' },
  { name: 'E. Musk Rat', ai: 'chaotic', color: '#ff55ff' },
  { name: 'Donnie Trumpf', ai: 'aggressive', color: '#ffaa55' },
  { name: 'Atom Hus-Bomb', ai: 'aggressive', color: '#ff3333' },
  { name: 'Krazy Re-Entry', ai: 'chaotic', color: '#cc44ff' },
  { name: 'Odd\'n Wild Card', ai: 'trickster', color: '#44ffcc' },
  { name: 'Oil-Stain Lint-Off', ai: 'balanced', color: '#88ff88' },
  { name: 'Ruin Annihilator', ai: 'aggressive', color: '#ff6600' }
];

// Doctrines configuration
const doctrines = {
  mad: {
    name: 'MUTUAL ASSURED DESTRUCTION',
    desc: 'Total retaliation doctrine',
    effects: '+2 missiles at start, -1 defense'
  },
  defense: {
    name: 'STRATEGIC DEFENSE',
    desc: 'Focus on protection systems',
    effects: '+3 defense at start, -1 missile'
  },
  firstStrike: {
    name: 'FIRST STRIKE',
    desc: 'Preemptive attack capability', 
    effects: '+1 100MT warhead, start at DEFCON 3'
  },
  detente: {
    name: 'DÉTENTE',
    desc: 'Diplomatic engagement',
    effects: '+10 intel, +2 production, peaceful start'
  }
};

// Costs configuration
const COSTS = {
  missile: { production: 8 },
  bomber: { production: 20 },
  defense: { production: 15 },
  warhead_10: { uranium: 5 },
  warhead_20: { uranium: 12 },
  warhead_40: { uranium: 18 },
  warhead_50: { uranium: 25 },
  warhead_100: { uranium: 50 },
  warhead_200: { uranium: 90 },
  immigration_skilled: { production: 10, intel: 5 },
  immigration_mass: { production: 5, intel: 2 },
  immigration_refugee: { intel: 15 },
  immigration_brain: { intel: 20 }
};

type ResourceCost = Partial<Record<'production' | 'intel' | 'uranium', number>>;

interface ResearchProject {
  id: string;
  name: string;
  description: string;
  category: 'warhead' | 'defense' | 'intel';
  turns: number;
  cost: ResourceCost;
  yield?: number;
  prerequisites?: string[];
  onComplete?: (nation: Nation) => void;
}

const RESEARCH_TREE: ResearchProject[] = [
  {
    id: 'warhead_20',
    name: 'Improved Fission Packages',
    description: 'Unlocks reliable 20MT warheads for tactical and strategic use.',
    category: 'warhead',
    turns: 2,
    cost: { production: 20, intel: 5 },
    yield: 20
  },
  {
    id: 'warhead_40',
    name: 'Boosted Fission Assembly',
    description: 'Doubles your fission output and enables 40MT warheads.',
    category: 'warhead',
    turns: 3,
    cost: { production: 30, intel: 10 },
    yield: 40,
    prerequisites: ['warhead_20']
  },
  {
    id: 'warhead_50',
    name: 'Thermonuclear Staging',
    description: 'Perfect layered staging to field 50MT strategic devices.',
    category: 'warhead',
    turns: 4,
    cost: { production: 40, intel: 15 },
    yield: 50,
    prerequisites: ['warhead_40']
  },
  {
    id: 'warhead_100',
    name: 'Titan-Class Weaponization',
    description: 'Authorize titanic 100MT warheads for deterrence.',
    category: 'warhead',
    turns: 5,
    cost: { production: 60, intel: 25 },
    yield: 100,
    prerequisites: ['warhead_50']
  },
  {
    id: 'warhead_200',
    name: 'Planet Cracker Initiative',
    description: 'Unlock 200MT devices capable of ending civilizations.',
    category: 'warhead',
    turns: 6,
    cost: { production: 80, intel: 35 },
    yield: 200,
    prerequisites: ['warhead_100']
  },
  {
    id: 'defense_grid',
    name: 'Orbital Defense Grid',
    description: 'Integrate lasers and interceptors for +2 permanent defense.',
    category: 'defense',
    turns: 4,
    cost: { production: 45, intel: 20 },
    onComplete: nation => {
      nation.defense += 2;
    }
  },
  {
    id: 'counterintel',
    name: 'Counterintelligence Suite',
    description: 'Deploy signals and HUMINT analysis to boost intel yields.',
    category: 'intel',
    turns: 3,
    cost: { production: 25, intel: 25 }
  }
];

const RESEARCH_LOOKUP: Record<string, ResearchProject> = RESEARCH_TREE.reduce((acc, project) => {
  acc[project.id] = project;
  return acc;
}, {} as Record<string, ResearchProject>);

const WARHEAD_RESEARCH_IDS = new Set(
  RESEARCH_TREE.filter(project => project.category === 'warhead' && project.yield)
    .map(project => project.id)
);

const WARHEAD_YIELD_TO_ID = new Map<number, string>(
  RESEARCH_TREE.filter(project => project.category === 'warhead' && project.yield)
    .map(project => [project.yield as number, project.id])
);

type ModalContentValue = string | ReactNode | (() => ReactNode);

// PlayerManager class
class PlayerManager {
  private static _cached: Nation | null = null;
  
  static get(): Nation | null {
    if (this._cached && nations.includes(this._cached)) {
      return this._cached;
    }
    
    const player = nations.find(n => n?.isPlayer);
    if (player) {
      this._cached = player;
      return player;
    }
    
    return null;
  }
  
  static reset() {
    this._cached = null;
  }
}

// Doomsday Clock
class DoomsdayClock {
  static minutes = 7.0;
  
  static tick(amount = 0.5) {
    this.minutes = Math.max(0, this.minutes - amount);
  }
  
  static improve(amount = 0.5) {
    this.minutes = Math.min(12, this.minutes + amount);
  }
  
  static update() {
    const display = document.getElementById('doomsdayTime');
    if (display) {
      const mins = Math.floor(this.minutes);
      const secs = Math.floor((this.minutes % 1) * 60);
      display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }
}

// Audio System
const AudioSys = {
  audioContext: null as AudioContext | null,
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.3,
  
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  },
  
  playSFX(type: string) {
    if (!this.sfxEnabled) return;
    // Simple beep sound generation
    if (!this.audioContext) this.init();
    
    const oscillator = this.audioContext!.createOscillator();
    const gainNode = this.audioContext!.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext!.destination);
    
    const freq = type === 'explosion' ? 80 : type === 'launch' ? 200 : 400;
    oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext!.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(this.audioContext!.currentTime + 0.3);
  },
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
  },
  
  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
  },
  
  setMusicVolume(volume: number) {
    this.musicVolume = volume;
  }
};

// Atmosphere effects
const Atmosphere = {
  clouds: [] as any[],
  stars: [] as any[],
  initialized: false,

  init() {
    if (this.initialized) return;
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.6,
        brightness: Math.random()
      });
    }

    this.clouds = [];
    for (let i = 0; i < 16; i++) {
      this.clouds.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        sizeX: 160 + Math.random() * 220,
        sizeY: 60 + Math.random() * 90,
        speed: 0.05 + Math.random() * 0.1
      });
    }
    this.initialized = true;
  },
  
  update() {
    this.clouds.forEach(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x - cloud.sizeX > W) {
        cloud.x = -cloud.sizeX;
      }
    });
  },
  
  draw(context: CanvasRenderingContext2D) {
    if (!this.initialized) return;

    const palette = THEME_SETTINGS[currentTheme];

    context.fillStyle = 'rgba(255,255,255,0.25)';
    this.stars.forEach(star => {
      context.globalAlpha = star.brightness * 0.4;
      context.fillRect(star.x, star.y, 1, 1);
    });
    context.globalAlpha = 1;

    this.clouds.forEach(cloud => {
      context.save();
      context.globalAlpha = 0.08;
      context.fillStyle = palette.cloud;
      context.beginPath();
      context.ellipse(cloud.x, cloud.y, cloud.sizeX, cloud.sizeY, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }
};

// Ocean effects
const Ocean = {
  waves: [] as any[],
  
  init() {
    this.waves = [];
    for (let i = 0; i < 10; i++) {
      this.waves.push({
        y: H * 0.7 + i * 5,
        offset: Math.random() * Math.PI * 2,
        amplitude: 2 + Math.random() * 3
      });
    }
  },
  
  update() {
    // Waves naturally animate via sin functions
  },
  
  draw(context: CanvasRenderingContext2D) {
    const time = Date.now() / 1000;
    const palette = THEME_SETTINGS[currentTheme];
    context.strokeStyle = palette.ocean;
    context.globalAlpha = 0.35;
    context.lineWidth = 1;

    this.waves.forEach(wave => {
      context.beginPath();
      for (let x = 0; x < W; x += 5) {
        const y = wave.y + Math.sin((x / 50) + time + wave.offset) * wave.amplitude;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    });
    context.globalAlpha = 1;
  }
};

// City Lights system
const CityLights = {
  cities: [] as any[],
  
  generate() {
    this.cities = [];
    nations.forEach(nation => {
      if (nation.population > 0) {
        const cityCount = Math.min(20, Math.floor(nation.population / 10));
        for (let i = 0; i < cityCount; i++) {
          const spread = 15;
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * spread;
          this.cities.push({
            lat: nation.lat + Math.sin(angle) * dist,
            lon: nation.lon + Math.cos(angle) * dist,
            brightness: 0.5 + Math.random() * 0.5
          });
        }
      }
    });
  },
  
  addCity(lat: number, lon: number, brightness: number) {
    this.cities.push({ lat, lon, brightness });
  },
  
  destroyNear(x: number, y: number, radius: number): number {
    let destroyed = 0;
    this.cities = this.cities.filter(city => {
      const [cx, cy] = project(city.lon, city.lat);
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < radius) {
        destroyed++;
        return false;
      }
      return true;
    });
    return destroyed;
  },
  
  draw(context: CanvasRenderingContext2D) {
    context.fillStyle = 'rgba(255,255,100,0.8)';
    this.cities.forEach(city => {
      const [x, y] = project(city.lon, city.lat);
      context.globalAlpha = city.brightness * 0.6;
      context.fillRect(x - 0.5, y - 0.5, 1, 1);
    });
    context.globalAlpha = 1;
  }
};

// Helper functions
function canAfford(nation: Nation, cost: any): boolean {
  return Object.entries(cost).every(([resource, amount]) => {
    const current = (nation as any)[resource] || 0;
    return current >= (amount as number);
  });
}

function pay(nation: Nation, cost: any) {
  Object.entries(cost).forEach(([resource, amount]) => {
    (nation as any)[resource] -= amount as number;
  });
}

function getCityCost(nation: Nation) {
  const cityCount = nation.cities || 1;
  return { production: 20 + (cityCount - 1) * 5 };
}

function canPerformAction(action: string, defcon: number): boolean {
  if (action === 'attack') return defcon <= 2;
  if (action === 'escalate') return defcon > 1;
  return true;
}

function startResearch(tier: number | string): boolean {
  const player = PlayerManager.get();
  if (!player) return false;

  const projectId = typeof tier === 'number' ? WARHEAD_YIELD_TO_ID.get(tier) || `warhead_${tier}` : tier;
  const project = RESEARCH_LOOKUP[projectId];

  if (!project) {
    toast({ title: 'Unknown research', description: 'The requested project does not exist.' });
    return false;
  }

  if (player.researchQueue) {
    toast({ title: 'Project already running', description: 'You must wait for the current research to complete before starting another.' });
    return false;
  }

  player.researched = player.researched || {};

  if (player.researched[project.id]) {
    toast({ title: 'Already unlocked', description: `${project.name} has already been researched.` });
    return false;
  }

  if (project.prerequisites && project.prerequisites.some(req => !player.researched?.[req])) {
    toast({ title: 'Prerequisites missing', description: 'Research previous tiers before starting this project.' });
    return false;
  }

  if (!canAfford(player, project.cost)) {
    toast({ title: 'Insufficient resources', description: 'You need more production or intel to begin this project.' });
    return false;
  }

  pay(player, project.cost);

  player.researchQueue = {
    projectId: project.id,
    turnsRemaining: project.turns,
    totalTurns: project.turns
  };

  log(`Research initiated: ${project.name}`);
  toast({ title: 'Research started', description: `${project.name} will complete in ${project.turns} turns.` });
  updateDisplay();
  return true;
}

function advanceResearch(nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') {
  if (!nation.researchQueue || nation.researchQueue.turnsRemaining <= 0) return;

  nation.researchQueue.turnsRemaining = Math.max(0, nation.researchQueue.turnsRemaining - 1);

  if (nation.researchQueue.turnsRemaining > 0) return;

  const project = RESEARCH_LOOKUP[nation.researchQueue.projectId];
  nation.researchQueue = null;

  if (!project) return;

  nation.researched = nation.researched || {};
  nation.researched[project.id] = true;

  if (project.onComplete) {
    project.onComplete(nation);
  }

  const message = `${nation.name} completes ${project.name}!`;
  log(message, 'success');

  if (nation.isPlayer) {
    toast({ title: 'Research complete', description: `${project.name} finished during ${phase.toLowerCase()} phase.` });
    updateDisplay();
  }
}

// Game initialization
function initNations() {
  nations = [];
  PlayerManager.reset();
  
  const playerLeaderName = S.selectedLeader || 'PLAYER';
  const playerLeaderConfig = leaders.find(l => l.name === playerLeaderName);
  const playerNation: Nation = {
    id: 'player',
    isPlayer: true,
    name: 'PLAYER',
    leader: playerLeaderName,
    doctrine: S.selectedDoctrine || undefined,
    lon: -95,
    lat: 39,
    color: playerLeaderConfig?.color || '#00ffff',
    population: 240,
    missiles: 5,
    bombers: 2,
    defense: 3,
    instability: 0,
    production: 25,
    uranium: 15,
    intel: 10,
    cities: 1,
    warheads: { 10: 3, 20: 2 },
    researched: { warhead_20: true },
    researchQueue: null,
    treaties: {},
    threats: {},
    migrantsThisTurn: 0,
    migrantsTotal: 0
  };

  // Apply doctrine bonuses
  if (S.selectedDoctrine) {
    const doctrine = doctrines[S.selectedDoctrine as keyof typeof doctrines];
    if (doctrine) {
      switch (S.selectedDoctrine) {
        case 'mad':
          playerNation.missiles += 2;
          playerNation.defense -= 1;
          break;
        case 'defense':
          playerNation.defense += 3;
          playerNation.missiles -= 1;
          break;
        case 'firstStrike':
          playerNation.warheads[100] = 1;
          playerNation.researched!['warhead_100'] = true;
          S.defcon = 3;
          break;
        case 'detente':
          playerNation.intel += 10;
          playerNation.production += 2;
          break;
      }
    }
  }

  nations.push(playerNation);

  const aiPositions = [
    { lon: 37, lat: 55, name: 'EURASIA' },
    { lon: 116, lat: 40, name: 'EASTASIA' },
    { lon: -60, lat: -15, name: 'SOUTHAM' },
    { lon: 20, lat: 0, name: 'AFRICA' }
  ];

  const doctrineKeys = Object.keys(doctrines);
  const availableLeaders = leaders.filter(l => l.name !== playerLeaderName);
  const shuffledLeaders = (availableLeaders.length ? availableLeaders : leaders)
    .slice()
    .sort(() => Math.random() - 0.5);

  aiPositions.forEach((pos, i) => {
    const leaderConfig = shuffledLeaders[i % shuffledLeaders.length];
    const aiDoctrine = doctrineKeys.length
      ? doctrineKeys[Math.floor(Math.random() * doctrineKeys.length)]
      : undefined;

    const nation: Nation = {
      id: `ai_${i}`,
      isPlayer: false,
      name: pos.name,
      leader: leaderConfig?.name || `AI_${i}`,
      ai: leaderConfig?.ai || 'balanced',
      doctrine: aiDoctrine,
      lon: pos.lon,
      lat: pos.lat,
      color: leaderConfig?.color || ['#ff0040', '#ff8000', '#40ff00', '#0040ff'][i % 4],
      population: 150 + Math.random() * 60,
      missiles: 4 + Math.floor(Math.random() * 4),
      bombers: Math.floor(Math.random() * 3),
      defense: 2 + Math.floor(Math.random() * 4),
      instability: Math.random() * 20,
      production: 25 + Math.floor(Math.random() * 35),
      uranium: 6 + Math.floor(Math.random() * 10),
      intel: 12 + Math.floor(Math.random() * 15),
      cities: 1,
      warheads: { 10: 2 + Math.floor(Math.random() * 3), 20: 1 + Math.floor(Math.random() * 2) },
      researched: { warhead_20: true },
      researchQueue: null,
      treaties: {},
      satellites: {},
      threats: {},
      migrantsThisTurn: 0,
      migrantsTotal: 0
    };

    nations.push(nation);
  });

  log('=== GAME START ===', 'success');
  log(`Leader: ${playerLeaderName}`, 'success');
  log(`Doctrine: ${S.selectedDoctrine}`, 'success');
}

// Banter system
function maybeBanter(nation: Nation, chance: number, pool?: string) {
  if (Math.random() > chance) return;
  
  const messages = [
    `${nation.name}: "The world will know our strength!"`,
    `${nation.name}: "This aggression will not stand!"`,
    `${nation.name}: "We are prepared for anything!"`
  ];
  
  log(messages[Math.floor(Math.random() * messages.length)], 'warning');
}

// Immigration functions
function performImmigration(type: string, target: Nation) {
  const player = PlayerManager.get();
  if (!player || !target) return false;
  
  switch (type) {
    case 'skilled':
      if (canAfford(player, COSTS.immigration_skilled)) {
        const amount = Math.floor(player.population * 0.05);
        player.population -= amount;
        target.population += amount;
        target.instability = (target.instability || 0) + 15;
        target.defense += 1;
        pay(player, COSTS.immigration_skilled);
        log(`Skilled immigration: ${amount}M → ${target.name}`);
        return true;
      }
      break;
    
    case 'mass':
      if (canAfford(player, COSTS.immigration_mass)) {
        const amount = Math.floor(player.population * 0.10);
        player.population -= amount;
        target.population += amount;
        target.instability = (target.instability || 0) + 30;
        pay(player, COSTS.immigration_mass);
        log(`Mass immigration: ${amount}M → ${target.name}`);
        return true;
      }
      break;
      
    case 'refugee':
      if (canAfford(player, COSTS.immigration_refugee) && (player.instability || 0) >= 50) {
        const amount = Math.floor(player.population * 0.15);
        player.population -= amount;
        target.population += amount;
        target.instability = (target.instability || 0) + 40;
        player.instability = Math.max(0, (player.instability || 0) - 20);
        pay(player, COSTS.immigration_refugee);
        log(`Refugee wave: ${amount}M → ${target.name}`);
        return true;
      }
      break;
      
    case 'brain':
      if (canAfford(player, COSTS.immigration_brain)) {
        const amount = Math.floor(target.population * 0.03);
        target.population -= amount;
        player.population += amount;
        target.instability = (target.instability || 0) + 10;
        pay(player, COSTS.immigration_brain);
        log(`Brain drain: +${amount}M from ${target.name}`);
        return true;
      }
      break;
  }
  
  return false;
}

// Launch function
function launch(from: Nation, to: Nation, yieldMT: number) {
  if (from.treaties?.[to.id]?.truceTurns > 0) {
    log(`Cannot attack ${to.name} - truce active!`, 'warning');
    return false;
  }
  
  if (yieldMT > 50 && S.defcon > 1) {
    log(`Strategic weapons require DEFCON 1`, 'warning');
    return false;
  }
  
  if (yieldMT <= 50 && S.defcon > 2) {
    log(`Tactical nukes require DEFCON 2 or lower`, 'warning');
    return false;
  }
  
  if (!from.warheads?.[yieldMT] || from.warheads[yieldMT] <= 0) {
    log('No warheads of that yield!', 'warning');
    return false;
  }

  if (from.isPlayer) {
    const requiredResearchId = WARHEAD_YIELD_TO_ID.get(yieldMT);
    if (requiredResearchId && !from.researched?.[requiredResearchId]) {
      const projectName = RESEARCH_LOOKUP[requiredResearchId]?.name || `${yieldMT}MT program`;
      toast({ title: 'Technology unavailable', description: `Research ${projectName} before deploying this warhead.` });
      return false;
    }
  }

  if (from.missiles <= 0) {
    log('No missiles available!', 'warning');
    return false;
  }
  
  from.warheads[yieldMT]--;
  if (from.warheads[yieldMT] <= 0) {
    delete from.warheads[yieldMT];
  }
  from.missiles--;
  
  S.missiles.push({
    from,
    to,
    t: 0,
    fromLon: from.lon,
    fromLat: from.lat,
    toLon: to.lon,
    toLat: to.lat,
    yield: yieldMT,
    target: to,
    color: from.color
  });
  
  log(`${from.name} → ${to.name}: LAUNCH ${yieldMT}MT`);
  AudioSys.playSFX('launch');
  DoomsdayClock.tick(0.3);
  
  return true;
}

// Resolution Phase
function resolutionPhase() {
  log('=== RESOLUTION PHASE ===', 'success');
  
  // Missile impacts and effects
  S.missiles.forEach(missile => {
    if (missile.t >= 1) {
      explode(
        project(missile.toLon, missile.toLat)[0],
        project(missile.toLon, missile.toLat)[1],
        missile.target,
        missile.yield
      );
    }
  });
  
  // Clear completed missiles
  S.missiles = S.missiles.filter(m => m.t < 1);
  
  // Process radiation zones
  S.radiationZones.forEach(zone => {
    zone.intensity *= 0.95;

    nations.forEach(n => {
      const [x, y] = project(n.lon, n.lat);
      const dist = Math.hypot(x - zone.x, y - zone.y);
      if (dist < zone.radius) {
        const damage = zone.intensity * 3;
        n.population = Math.max(0, n.population - damage);
      }
    });
  });

  nations.forEach(n => advanceResearch(n, 'RESOLUTION'));

  log('=== RESOLUTION PHASE COMPLETE ===', 'success');
  
  // Nuclear winter effects
  if (S.nuclearWinterLevel && S.nuclearWinterLevel > 0) {
    const winterSeverity = Math.min(S.nuclearWinterLevel / 10, 0.5);
    nations.forEach(n => {
      const popLoss = Math.floor((n.population || 0) * winterSeverity * 0.05);
      if (popLoss > 0) n.population = Math.max(0, (n.population || 0) - popLoss);
      if (typeof n.production === 'number') {
        n.production = Math.max(0, Math.floor(n.production * (1 - winterSeverity)));
      }
    });
    
    if (S.nuclearWinterLevel > 5) {
      log(`☢️ NUCLEAR WINTER! Global population declining!`, 'alert');
      S.overlay = { text: 'NUCLEAR WINTER', ttl: 2000 };
    }
    S.nuclearWinterLevel *= 0.95;
  }
}

// Production Phase
function productionPhase() {
  log('=== PRODUCTION PHASE ===', 'success');
  
  nations.forEach(n => {
    if (n.population <= 0) return;
    
    // Base production
    const baseProduction = Math.floor(n.population * 0.1);
    const baseProd = baseProduction + (n.cities || 1) * 10;
    const baseUranium = Math.floor(n.population * 0.02) + (n.cities || 1) * 3;
    const baseIntel = Math.floor(n.population * 0.03) + (n.cities || 1) * 2;
    
    // Apply green shift debuff if active
    let prodMult = 1;
    let uranMult = 1;
    if (n.greenShiftTurns && n.greenShiftTurns > 0) {
      prodMult = 0.7;
      uranMult = 0.5;
      n.greenShiftTurns--;
      if (n === PlayerManager.get()) {
        log('Eco movement reduces nuclear production', 'warning');
      }
    }
    
    n.production += Math.floor(baseProd * prodMult);
    n.uranium += Math.floor(baseUranium * uranMult);
    n.intel += baseIntel;
    
    // Instability effects
    if (n.instability && n.instability > 50) {
      const unrest = Math.floor(n.instability / 10);
      n.population = Math.max(0, n.population - unrest);
      n.production = Math.max(0, n.production - unrest);
      if (n.instability > 100) {
        log(`${n.name} suffers civil war! Major losses!`, 'alert');
        n.population *= 0.8;
        n.instability = 50;
      }
    }
    
    // Decay instability slowly
    if (n.instability) {
      n.instability = Math.max(0, n.instability - 2);
    }
    
    // Border closure effects
    if (n.bordersClosedTurns && n.bordersClosedTurns > 0) {
      n.bordersClosedTurns--;
    }

    if (n.researched?.counterintel) {
      const intelBonus = Math.ceil(baseIntel * 0.2);
      n.intel += intelBonus;
    }
  });

  nations.forEach(n => advanceResearch(n, 'PRODUCTION'));
}

// World map loading
async function loadWorld() {
  const CACHE_NAME = 'offlineTopo110m';
  
  try {
    const cached = Storage.getItem(CACHE_NAME);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.type === 'Topology' && data.objects) {
        worldData = data;
        worldCountries = feature(data, data.objects.countries || data.objects.land);
        log('World map loaded from cache');
        return;
      } else if (data.type === 'FeatureCollection') {
        worldCountries = data;
        log('World map loaded from cache (GeoJSON)');
        return;
      }
    }
  } catch (e) {
    console.warn('Cache load failed:', e);
  }

  try {
    log('Fetching world map from CDN...');
    const response = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
    if (response.ok) {
      const topo = await response.json();
      
      try {
        Storage.setItem(CACHE_NAME, JSON.stringify(topo));
      } catch (e) {
        console.warn('Could not cache map data');
      }
      
      if (topo.objects) {
        worldData = topo;
        worldCountries = feature(topo, topo.objects.countries || topo.objects.land);
        log('World map loaded from CDN');
        return;
      }
    }
  } catch (e) {
    console.warn('CDN fetch failed:', e);
  }

  // Fallback world data
  worldCountries = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Americas" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-170, 70], [-100, 71], [-80, 50], [-75, 25], [-80, 10], [-85, -10],
            [-75, -30], [-70, -55], [-75, -55], [-80, -30], [-85, -10], [-95, 0],
            [-105, 20], [-120, 35], [-130, 40], [-140, 50], [-160, 60], [-170, 70]
          ]]
        }
      },
      {
        type: "Feature",
        properties: { name: "Eurasia" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-10, 35], [0, 40], [10, 45], [30, 50], [50, 55], [80, 60], [120, 65],
            [140, 60], [160, 55], [170, 60], [180, 65], [180, 70], [140, 75],
            [80, 75], [20, 70], [-10, 60], [-10, 35]
          ]]
        }
      }
    ]
  };
  
  log('Using fallback continent outlines');
}

// Drawing functions
function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * W * cam.zoom + cam.x;
  const y = ((90 - lat) / 180) * H * cam.zoom + cam.y;
  return [x, y];
}

// Convert screen coordinates to longitude/latitude
function toLonLat(x: number, y: number): [number, number] {
  // Account for camera transformation
  const adjustedX = (x - cam.x) / cam.zoom;
  const adjustedY = (y - cam.y) / cam.zoom;
  const lon = (adjustedX / W) * 360 - 180;
  const lat = 90 - (adjustedY / H) * 180;
  return [lon, lat];
}

function drawWorld() {
  if (!worldCountries || !ctx) return;

  const palette = THEME_SETTINGS[currentTheme];

  ctx.save();
  ctx.strokeStyle = palette.mapOutline;
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  worldCountries.features.forEach((feature: any) => {
    ctx.beginPath();
    const coords = feature.geometry.coordinates;

    if (feature.geometry.type === 'Polygon') {
      drawWorldPath(coords[0]);
    } else if (feature.geometry.type === 'MultiPolygon') {
      coords.forEach((poly: any) => drawWorldPath(poly[0]));
    }

    ctx.stroke();
  });

  ctx.restore();

  // Grid lines
  ctx.save();
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 0.5;

  for (let lon = -180; lon <= 180; lon += 30) {
    ctx.beginPath();
    for (let lat = -90; lat <= 90; lat += 5) {
      const [x, y] = project(lon, lat);
      if (lat === -90) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (let lat = -90; lat <= 90; lat += 30) {
    ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 5) {
      const [x, y] = project(lon, lat);
      if (lon === -180) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();

  // Radar sweep
  const scanY = (Date.now() / 30) % H;
  ctx.fillStyle = palette.radar;
  ctx.fillRect(0, scanY, W, 2);
}

function drawWorldPath(coords: number[][]) {
  if (!ctx) return;
  coords.forEach((coord, i) => {
    const [x, y] = project(coord[0], coord[1]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
}

function drawNations() {
  if (!ctx || nations.length === 0) return;

  nations.forEach(n => {
    if (n.population <= 0) return;

    const [x, y] = project(n.lon, n.lat);

    if (isNaN(x) || isNaN(y)) return;

    const isSelectedTarget = selectedTargetRefId === n.id;
    if (isSelectedTarget) {
      const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
      const baseRadius = 42;
      const radius = baseRadius + pulse * 10;

      ctx.save();
      ctx.strokeStyle = n.color || '#ff6666';
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Nation marker (triangle)
    ctx.save();
    ctx.fillStyle = n.color;
    ctx.strokeStyle = n.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = n.color;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x - 15, y + 12);
    ctx.lineTo(x + 15, y + 12);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Nation labels
    const displayName = n.isPlayer
      ? (S.playerName || S.selectedLeader || 'PLAYER')
      : (n.leader || n.name);
    const nationName = n.name;

    const z = Math.max(0.9, Math.min(1.6, cam.zoom));
    const pad = 4 * z;

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = `bold ${Math.round(12 * z)}px monospace`;
    const w1 = ctx.measureText(displayName).width;

    ctx.font = `${Math.round(11 * z)}px monospace`;
    const w2 = ctx.measureText(nationName).width;

    const bw = Math.max(w1, w2) + pad * 2;
    const bh = (12 * z + 12 * z) + pad * 2;
    const lx = x;
    const lyTop = (y - 36 * z) - (bh - (12 * z));

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(lx - bw / 2, lyTop, bw, bh);

    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = n.color;
    ctx.strokeRect(lx - bw / 2, lyTop, bw, bh);
    ctx.globalAlpha = 1;

    ctx.font = `bold ${Math.round(12 * z)}px monospace`;
    ctx.fillStyle = n.color;
    ctx.shadowColor = n.color;
    ctx.shadowBlur = 8;
    ctx.fillText(displayName, lx, lyTop + pad + 12 * z);
    ctx.shadowBlur = 0;

    ctx.font = `${Math.round(11 * z)}px monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(nationName, lx, lyTop + pad + 12 * z + 12 * z);

    ctx.restore();

    // Population display
    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.font = `${Math.round(10 * z)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(n.population)}M`, x, y + 30 * z);
    ctx.restore();
  });
}

function drawMissiles() {
  if (!ctx) return;
  
  S.missiles.forEach((m: any, i: number) => {
    m.t = Math.min(1, m.t + 0.016);
    
    const [sx, sy] = project(m.fromLon, m.fromLat);
    const [tx, ty] = project(m.toLon, m.toLat);
    
    const u = 1 - m.t;
    const cx = (sx + tx) / 2;
    const cy = (sy + ty) / 2 - 150;
    const x = u * u * sx + 2 * u * m.t * cx + m.t * m.t * tx;
    const y = u * u * sy + 2 * u * m.t * cy + m.t * m.t * ty;
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    // Trajectory path
    ctx.strokeStyle = m.color || 'rgba(255,0,255,0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -(Date.now() / 60) % 100;
    ctx.shadowColor = typeof ctx.strokeStyle === 'string' ? ctx.strokeStyle : '#ff00ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cx, cy, tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Missile dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Incoming warning
    if (!m._tele && m.t > 0.8) {
      m._tele = true;
      S.rings.push({
        x: tx, y: ty, r: 2, max: 60 * (S.fx || 1), 
        speed: 3, alpha: 1, type: 'incoming', txt: 'INCOMING'
      });
    }

    // Impact
    if (m.t >= 1) {
      // MIRV split check
      if (m.from?.researched?.mirv && !m.isMirv && Math.random() < 0.5) {
        log(`MIRV ACTIVATED! Multiple warheads deployed`, 'warning');
        const splitYield = Math.floor(m.yield / 3);
        for (let j = 0; j < 2; j++) {
          setTimeout(() => {
            const offsetLon = m.toLon + (Math.random() - 0.5) * 5;
            const offsetLat = m.toLat + (Math.random() - 0.5) * 5;
            S.missiles.push({
              from: m.from,
              to: m.target,
              t: 0,
              fromLon: m.fromLon,
              fromLat: m.fromLat,
              toLon: offsetLon,
              toLat: offsetLat,
              yield: splitYield,
              target: m.target,
              color: '#ffff00',
              isMirv: true
            });
          }, j * 200);
        }
      }
      
      // Interception check
      if (m.t >= 0.95 && !m.interceptChecked) {
        m.interceptChecked = true;
        const allies = nations.filter(n => n.treaties?.[m.target.id]?.alliance && n.defense > 0);
        let totalIntercept = (m.target.defense || 0) / 16;
        allies.forEach(ally => {
          const allyIntercept = (ally.defense || 0) / 32;
          totalIntercept += allyIntercept;
          if (Math.random() < allyIntercept) {
            log(`${ally.name} helps defend ${m.target.name}!`, 'success');
          }
        });
        
        if (Math.random() < totalIntercept) {
          S.missiles.splice(i, 1);
          log(`Missile intercepted! Defense successful`, 'success');
          S.rings.push({ x: tx, y: ty, r: 1, max: 40, speed: 3, alpha: 1, type: 'intercept' });
          return;
        }
      }
      
      explode(tx, ty, m.target, m.yield);
      S.missiles.splice(i, 1);
    }
  });
}

function drawBombers() {
  if (!ctx) return;
  
  S.bombers.forEach((bomber: any, i: number) => {
    bomber.t += 0.016 / 3;
    
    // Detection at midpoint
    if (bomber.t > 0.5 && !bomber.detected && bomber.to) {
      bomber.detected = true;
      log(`⚠️ BOMBER DETECTED approaching ${bomber.to.name}!`, 'warning');
      
      // Intercept chance
      const stealthMod = bomber.from?.researched?.stealth ? 0.5 : 1.0;
      const interceptChance = (bomber.to.defense / 12) * stealthMod;
      
      if (Math.random() < interceptChance) {
        log(`✓ Bomber intercepted by ${bomber.to.name}!`, 'success');
        S.bombers.splice(i, 1);
        AudioSys.playSFX('explosion');
        return;
      }
    }
    
    const x = bomber.sx + (bomber.tx - bomber.sx) * bomber.t;
    const y = bomber.sy + (bomber.ty - bomber.sy) * bomber.t;
    
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,100,0.9)';
    ctx.strokeStyle = 'rgba(255,255,100,0.8)';
    ctx.lineWidth = 2;
    
    const dx = bomber.tx - bomber.sx;
    const dy = bomber.ty - bomber.sy;
    const angle = Math.atan2(dy, dx);
    
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-8, -4);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
    
    if (bomber.t >= 1.0) {
      explode(bomber.tx, bomber.ty, bomber.to, bomber.payload.yield);
      S.bombers.splice(i, 1);
    }
  });
}

function drawSubmarines() {
  if (!ctx) return;
  
  S.submarines = S.submarines || [];
  S.submarines.forEach((sub: any, i: number) => {
    ctx.save();
    if (sub.phase === 0) {
      // Surfacing
      sub.phaseProgress = Math.min(1, (sub.phaseProgress || 0) + 0.03);
      const p = sub.phaseProgress;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(100,200,255,${1-p})`;
      ctx.beginPath();
      ctx.arc(sub.x, sub.y, 30 * p, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.fillRect(sub.x - 15, sub.y - 3 + (1-p) * 10, 30, 6);
      if (p >= 1) {
        sub.phase = 1;
        // Launch missile
        const missile = {
          from: sub.from || null,
          to: sub.target,
          t: 0.5,
          fromLon: 0,
          fromLat: 0,
          toLon: sub.target.lon,
          toLat: sub.target.lat,
          yield: sub.yield,
          target: sub.target,
          color: '#00ffff',
          isSubmarine: true
        };
        S.missiles.push(missile);
        log(`SUBMARINE LAUNCH! Missile away!`, 'alert');
      }
    } else if (sub.phase === 1) {
      sub.phase = 2;
    } else if (sub.phase === 2) {
      sub.diveProgress = (sub.diveProgress || 0) + 0.02;
      ctx.globalAlpha = 1 - sub.diveProgress;
      ctx.fillStyle = '#333';
      ctx.fillRect(sub.x - 15, sub.y - 3 + sub.diveProgress * 10, 30, 6);
      if (sub.diveProgress >= 1) {
        S.submarines.splice(i, 1);
      }
    }
    ctx.restore();
  });
}

function drawParticles() {
  if (!ctx) return;
  
  S.particles = S.particles.filter((p: any) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 16;
    p.vx *= 0.98;
    p.vy *= 0.98;
    
    if (p.life <= 0) return false;
    
    const a = p.life / p.max;
    
    ctx.save();
    if (p.type === 'smoke') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = `rgba(180,180,180,${a * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      const g = 150 + Math.floor(Math.random() * 80);
      ctx.fillStyle = `rgba(255,${g},50,${a * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgba(255,255,100,${a * 0.9})`;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.restore();

    return true;
  });
}

function drawFX() {
  if (!ctx) return;
  
  if (S.screenShake && S.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * S.screenShake;
    const shakeY = (Math.random() - 0.5) * S.screenShake;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    S.screenShake *= 0.9;
  }
  
  // Rings and explosions
  S.rings = S.rings || [];
  S.rings.forEach((b: any, i: number) => {
    b.r += b.speed || 2;
    const a = (1 - b.r / b.max) * (b.alpha || 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let col = `rgba(255,121,198,${a})`;
    if (b.type === 'shock') col = `rgba(255,170,90,${a})`;
    if (b.type === 'heat') col = `rgba(255,120,60,${a})`;
    if (b.type === 'incoming') col = `rgba(255,255,255,${a})`;
    if (b.type === 'afterglow') col = `rgba(255,255,200,${a})`;
    if (b.type === 'sonar') col = `rgba(100,255,255,${a})`;
    if (b.type === 'flash') col = `rgba(255,255,255,${a})`;
    if (b.type === 'plasma') col = `rgba(255,70,180,${a})`;
    ctx.strokeStyle = col;
    ctx.lineWidth = b.type === 'flash' ? 4 : 3;
    let rx = typeof b.x === 'number' ? b.x : 0;
    let ry = typeof b.y === 'number' ? b.y : 0;
    if (b.lon !== undefined && b.lat !== undefined) {
      const projected = project(b.lon, b.lat);
      rx = projected[0];
      ry = projected[1];
    }
    ctx.beginPath();
    ctx.arc(rx, ry, b.r, 0, Math.PI * 2);
    ctx.stroke();
    if (b.txt) {
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.txt, rx, ry - 12);
    }
    ctx.restore();
    if (b.r >= b.max) S.rings.splice(i, 1);
  });
  
  // Radiation zones
  S.radiationZones.forEach((zone: any, i: number) => {
    if (zone.intensity < 0.01) {
      S.radiationZones.splice(i, 1);
      return;
    }
    
    ctx.save();
    const pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8;
    ctx.globalCompositeOperation = 'screen';
    
    const grad = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius);
    grad.addColorStop(0, `rgba(150,255,0,${zone.intensity * 0.3 * pulse})`);
    grad.addColorStop(1, `rgba(255,100,0,0)`);
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  
  // EMP effects
  S.empEffects.forEach((emp: any, i: number) => {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(emp.x, emp.y, 0, emp.x, emp.y, emp.radius);
    g.addColorStop(0, `rgba(100,200,255,${(emp.duration / 30) * 0.3})`);
    g.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(emp.x, emp.y, emp.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    emp.duration--;
    if (emp.duration <= 0) {
      S.empEffects.splice(i, 1);
      return;
    }
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    const arcs = 5;
    for (let j = 0; j < arcs; j++) {
      const angle = (Date.now() / 100 + j * Math.PI * 2 / arcs) % (Math.PI * 2);
      const x2 = emp.x + Math.cos(angle) * emp.radius;
      const y2 = emp.y + Math.sin(angle) * emp.radius;
      
      ctx.strokeStyle = `rgba(100,200,255,${emp.duration / 30})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(emp.x, emp.y);
      
      const segments = 8;
      for (let k = 1; k <= segments; k++) {
        const t = k / segments;
        const mx = emp.x + (x2 - emp.x) * t + (Math.random() - 0.5) * 20;
        const my = emp.y + (y2 - emp.y) * t + (Math.random() - 0.5) * 20;
        ctx.lineTo(mx, my);
      }
      ctx.stroke();
    }
    
    ctx.restore();
  });
  
  // Overlay text
  if (S.overlay && S.overlay.ttl > 0) {
    S.overlay.ttl -= 16;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeText(S.overlay.text, W / 2, 80);
    ctx.fillText(S.overlay.text, W / 2, 80);
    ctx.restore();
    if (S.overlay.ttl <= 0) S.overlay = null;
  }

  if (S.screenShake) {
    ctx.restore();
  }

  // Nuclear winter overlay
  if (S.nuclearWinterLevel && S.nuclearWinterLevel > 1) {
    ctx.save();
    ctx.fillStyle = `rgba(50,50,50,${Math.min(S.nuclearWinterLevel / 20, 0.4)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// Explosion function
function explode(x: number, y: number, target: Nation, yieldMT: number) {
  AudioSys.playSFX('explosion');
  
  const scale = Math.sqrt(yieldMT / 20);
  const particleCount = Math.floor(100 * scale);
  
  const blastRadius = Math.sqrt(yieldMT) * 10;
  const destroyed = CityLights.destroyNear(x, y, blastRadius);
  if (destroyed > 0) {
    log(`💡 ${destroyed} cities went dark`, 'warning');
  }
  
  if (target && !target.isPlayer) {
    maybeBanter(target, 0.7);
  }

  const [elon, elat] = toLonLat(x, y);

  for (let i = 0; i < particleCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = (1 + Math.random() * 3) * scale;
    S.particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 500 + Math.random() * 500,
      max: 1000
    });
  }

  S.rings.push({ lon: elon, lat: elat, r: 3, max: 120 * scale * (S.fx || 1), speed: 2, alpha: 1, type: 'shock' });
  S.rings.push({ lon: elon, lat: elat, r: 1, max: 40 * (S.fx || 1), speed: 1.5, alpha: 0.8, type: 'heat' });
  S.rings.push({ lon: elon, lat: elat, r: 2, max: 80 * scale * (S.fx || 1), speed: 2.5, alpha: 0.9, type: 'flash' });
  S.rings.push({ lon: elon, lat: elat, r: 4, max: 100 * scale * (S.fx || 1), speed: 1.5, alpha: 0.7, type: 'plasma' });

  const sparkCount = Math.floor(50 * scale);
  for (let j = 0; j < sparkCount; j++) {
    const a2 = Math.random() * Math.PI * 2;
    const spd = (0.5 + Math.random() * 2.5) * scale;
    S.particles.push({
      x, y,
      vx: Math.cos(a2) * spd,
      vy: Math.sin(a2) * spd,
      life: 300 + Math.random() * 300,
      max: 600,
      type: 'spark'
    });
  }

  S.radiationZones.push({
    x, y,
    radius: Math.sqrt(yieldMT) * 8,
    intensity: yieldMT / 100
  });

  // Nuclear winter accumulation
  if (yieldMT >= 50) {
    S.nuclearWinterLevel = (S.nuclearWinterLevel || 0) + (yieldMT || 0) / 100;
    S.globalRadiation = (S.globalRadiation || 0) + (yieldMT || 0) / 200;
  }

  if (yieldMT >= 50) {
    // Mushroom smoke
    for (let s = 0; s < 20 * (S.fx || 1); s++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * 8;
      S.particles.push({
        x: x + Math.cos(ang) * rad,
        y: y + Math.sin(ang) * rad,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.6 - Math.random() * 0.4,
        life: 900 + Math.random() * 600,
        max: 1500,
        type: 'smoke'
      });
    }

    S.empEffects.push({
      x, y,
      radius: Math.sqrt(yieldMT) * 15,
      duration: 30
    });
    
    nations.forEach(n => {
      const [nx, ny] = project(n.lon, n.lat);
      const dist = Math.hypot(nx - x, ny - y);
      if (dist < Math.sqrt(yieldMT) * 15) {
        n.defense = Math.max(0, n.defense - 3);
        n.missiles = Math.max(0, n.missiles - 2);
        log(`⚡ EMP disabled ${n.name}'s electronics!`, 'warning');
      }
    });
  }

  S.screenShake = Math.max(S.screenShake || 0, Math.min(20, yieldMT / 5));
  
  if (target) {
    const reduction = Math.max(0, 1 - target.defense * 0.05);
    const damage = yieldMT * reduction;
    target.population = Math.max(0, target.population - damage);
    target.instability = Math.min(100, (target.instability || 0) + yieldMT);
    
    log(`💥 ${yieldMT}MT detonation at ${target.name}! -${Math.floor(damage)}M`, "alert");
    
    if (yieldMT >= 50) {
      DoomsdayClock.tick(0.5);
    }
  }
  
  checkVictory();
}

// Launch submarine
function launchSubmarine(from: Nation, to: Nation, yieldMT: number) {
  const [fx, fy] = project(from.lon, from.lat);
  const [tx, ty] = project(to.lon, to.lat);
  S.submarines = S.submarines || [];
  S.submarines.push({
    x: fx + (Math.random() - 0.5) * 50,
    y: fy + (Math.random() - 0.5) * 50,
    phase: 0, // 0=surfacing,1=launching,2=diving
    targetX: tx,
    targetY: ty,
    yield: yieldMT,
    target: to,
    from
  });
  AudioSys.playSFX('launch');
  return true;
}

// Launch bomber
function launchBomber(from: Nation, to: Nation, payload: any) {
  const [sx, sy] = project(from.lon, from.lat);
  const [tx, ty] = project(to.lon, to.lat);
  
  S.bombers.push({
    from, to,
    t: 0,
    sx, sy, tx, ty,
    payload
  });
  
  return true;
}

// Victory check
function checkVictory() {
  if (S.gameOver) return;
  
  const player = PlayerManager.get();
  if (!player) return;
  
  const alive = nations.filter(n => n.population > 0);
  const totalPop = alive.reduce((sum, n) => sum + n.population, 0);
  
  if (player.population <= 0) {
    endGame(false, 'Your nation has been destroyed');
    return;
  }
  
  if (DoomsdayClock.minutes <= 0) {
    endGame(false, 'MUTUAL ASSURED DESTRUCTION');
    return;
  }
  
  if (alive.length === 1 && alive[0] === player) {
    endGame(true, 'TOTAL DOMINATION - You are the sole survivor!');
    return;
  }
  
  if ((player.cities || 1) >= 10) {
    endGame(true, 'ECONOMIC VICTORY - Industrial supremacy achieved!');
    return;
  }
  
  if (player.population / totalPop > 0.6 && (player.instability || 0) < 30) {
    endGame(true, 'DEMOGRAPHIC VICTORY - You control the world through immigration!');
    return;
  }
  
  if (S.turn >= 50 && player.population >= 50) {
    const score = S.turn * 10 + player.population * 5 + player.missiles * 20;
    endGame(true, `SURVIVAL VICTORY - Endured 50 turns! Score: ${score}`);
    return;
  }
}

// End game
function endGame(victory: boolean, message: string) {
  S.gameOver = true;
  
  const player = PlayerManager.get();
  const score = S.turn * 10 + (player?.population || 0) * 5;
  
  // Save highscore
  const highscores = JSON.parse(Storage.getItem('highscores') || '[]');
  highscores.push({
    name: S.playerName || S.selectedLeader || 'Player',
    doctrine: S.selectedDoctrine || null,
    score,
    turns: S.turn,
    date: new Date().toISOString()
  });
  highscores.sort((a: any, b: any) => b.score - a.score);
  Storage.setItem('highscores', JSON.stringify(highscores.slice(0, 10)));
  
  log(victory ? 'VICTORY!' : 'DEFEAT!', victory ? 'success' : 'alert');
  log(message, 'success');
  log(`Final Score: ${Math.floor(score)}`, 'success');
}

// Logging function
function log(msg: string, type: string = 'normal') {
  const logEl = document.getElementById('log');
  if (!logEl) return;
  
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[T${S.turn}] ${msg}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
  
  // Keep log size manageable
  if (logEl.children.length > 100) {
    logEl.removeChild(logEl.firstChild!);
  }
}

// AI Turn
function aiTurn(n: Nation) {
  S.overlay = { text: 'AI: ' + (n.leader || n.name), ttl: 800 };
  if (n.population <= 0) return;
  
  maybeBanter(n, 0.3);
  
  const r = Math.random();
  let aggressionMod = 0;
  if (n.ai === 'aggressive') aggressionMod = 0.2;
  else if (n.ai === 'defensive') aggressionMod = -0.1;
  else if (n.ai === 'balanced') aggressionMod = 0.0;
  else if (n.ai === 'isolationist') aggressionMod = -0.2;
  
  if (r < 0.3 + aggressionMod && S.defcon <= 2) {
    const targets = nations.filter(t => t !== n && t.population > 0 && !n.treaties?.[t.id]?.truceTurns);
    if (targets.length > 0) {
      const target = targets.sort((a, b) => {
        const compute = (t: Nation) => {
          const threat = n.threats ? (n.threats[t.id] || 0) : 0;
          let score = threat;
          const aiType = n.ai || '';
          if (aiType === 'balanced') score *= 1.0;
          else if (aiType === 'isolationist') score *= 1.5;
          else if (aiType === 'aggressive') score *= 1.2;
          const defWeight = aiType === 'aggressive' ? 0.4 : aiType === 'balanced' ? 0.6 : aiType === 'isolationist' ? 0.8 : 0.5;
          score -= (t.defense || 0) * defWeight;
          if (t.isPlayer) score += 5;
          return score;
        };
        return compute(b) - compute(a);
      })[0];
      
      const warheadTypes = Object.keys(n.warheads || {}).filter(k => (n.warheads as any)[k] > 0);
      if (warheadTypes.length > 0 && n.missiles > 0) {
        const yieldMT = parseInt(warheadTypes[0]);
        
        if ((yieldMT <= 50 && S.defcon <= 2) || (yieldMT > 50 && S.defcon === 1)) {
          (n.warheads as any)[yieldMT]--;
          if ((n.warheads as any)[yieldMT] <= 0) delete (n.warheads as any)[yieldMT];
          n.missiles--;
          
          launch(n, target, yieldMT);
          log(`${n.name} launches ${yieldMT}MT at ${target.name}`);
          maybeBanter(n, 0.7);
          
          if (target.isPlayer) {
            maybeBanter(n, 0.5);
          }
        }
      }
    }
  } else if (r < 0.5) {
    if (canAfford(n, COSTS.missile)) {
      pay(n, COSTS.missile);
      n.missiles++;
      log(`${n.name} builds missile`);
      maybeBanter(n, 0.2);
    } else if (canAfford(n, COSTS.warhead_20)) {
      pay(n, COSTS.warhead_20);
      n.warheads = n.warheads || {};
      n.warheads[20] = (n.warheads[20] || 0) + 1;
      log(`${n.name} builds 20MT warhead`);
    }
  } else if (r < 0.7) {
    if (canAfford(n, COSTS.defense)) {
      pay(n, COSTS.defense);
      n.defense += 2;
      log(`${n.name} upgrades defense`);
    } else if ((n.cities || 1) < 3) {
      const cityCost = getCityCost(n);
      if (canAfford(n, cityCost)) {
        pay(n, cityCost);
        n.cities = (n.cities || 1) + 1;
        
        const spread = 6;
        const angle = Math.random() * Math.PI * 2;
        const newLat = n.lat + Math.sin(angle) * spread;
        const newLon = n.lon + Math.cos(angle) * spread;
        CityLights.addCity(newLat, newLon, 1.0);
        
        log(`${n.name} builds city #${n.cities}`);
        maybeBanter(n, 0.3);
      }
    }
  } else {
    if (Math.random() < 0.5 && S.defcon > 1) {
      S.defcon--;
      log(`${n.name} escalates to DEFCON ${S.defcon}`);
      maybeBanter(n, 0.4);
    }
  }
}

// End turn
function endTurn() {
  if (S.gameOver || S.phase !== 'PLAYER') return;
  
  S.actionsRemaining = 0;
  S.phase = 'AI';
  updateDisplay();
  
  const aiNations = nations.filter(n => !n.isPlayer && n.population > 0);
  const actionsPerAI = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;
  
  let aiActionCount = 0;
  aiNations.forEach(ai => {
    for (let i = 0; i < actionsPerAI; i++) {
      setTimeout(() => aiTurn(ai), 500 * aiActionCount++);
    }
  });
  
  setTimeout(() => {
    S.phase = 'RESOLUTION';
    updateDisplay();
    resolutionPhase();
    
    setTimeout(() => {
      S.phase = 'PRODUCTION';
      productionPhase();
      
      S.turn++;
      S.phase = 'PLAYER';
      S.actionsRemaining = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;
      
      updateDisplay();
      checkVictory();
    }, 1500);
  }, aiActionCount * 500 + 500);
}

// Update display
function updateDisplay() {
  const player = PlayerManager.get();
  if (!player) return;
  
  const defconEl = document.getElementById('defcon');
  if (defconEl) defconEl.textContent = S.defcon.toString();
  
  const turnEl = document.getElementById('turn');
  if (turnEl) turnEl.textContent = S.turn.toString();
  
  const maxActions = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;
  const actionsEl = document.getElementById('actionsDisplay');
  if (actionsEl) actionsEl.textContent = `${S.actionsRemaining}/${maxActions}`;
  
  const phaseEl = document.getElementById('phaseBadge');
  if (phaseEl) phaseEl.textContent = `PHASE: ${S.phase}`;
  
  const productionEl = document.getElementById('productionDisplay');
  if (productionEl) productionEl.textContent = (player.production || 0).toString();
  
  const uraniumEl = document.getElementById('uraniumDisplay');
  if (uraniumEl) uraniumEl.textContent = (player.uranium || 0).toString();
  
  const intelEl = document.getElementById('intelDisplay');
  if (intelEl) intelEl.textContent = (player.intel || 0).toString();
  
  const citiesEl = document.getElementById('citiesDisplay');
  if (citiesEl) citiesEl.textContent = (player.cities || 1).toString();
  
  const popEl = document.getElementById('popDisplay');
  if (popEl) popEl.textContent = Math.floor(player.population).toString();
  
  const leaderEl = document.getElementById('leaderDisplay');
  if (leaderEl) leaderEl.textContent = player.leader;
  
  const doctrineEl = document.getElementById('doctrineDisplay');
  if (doctrineEl) doctrineEl.textContent = (player.doctrine || 'none').toUpperCase();
  
  const missileEl = document.getElementById('missileDisplay');
  if (missileEl) missileEl.textContent = player.missiles.toString();
  
  const bomberEl = document.getElementById('bomberDisplay');
  if (bomberEl) bomberEl.textContent = (player.bombers || 0).toString();
  
  const defenseEl = document.getElementById('defenseDisplay');
  if (defenseEl) defenseEl.textContent = player.defense.toString();
  
  const instabilityEl = document.getElementById('instabilityDisplay');
  if (instabilityEl) instabilityEl.textContent = Math.floor(player.instability || 0).toString();
  
  const warheadText = Object.entries(player.warheads || {})
    .map(([y, c]) => `${y}MT:${c}`)
    .join(' ');
  const warheadEl = document.getElementById('warheadDisplay');
  if (warheadEl) warheadEl.textContent = warheadText || 'NONE';

  updateScoreboard();
  DoomsdayClock.update();

  if (uiUpdateCallback) {
    uiUpdateCallback();
  }
}

function updateScoreboard() {
  const scoreList = document.getElementById('scoreList');
  if (!scoreList) return;
  
  scoreList.innerHTML = '';
  const sorted = [...nations].sort((a, b) => b.population - a.population);
  sorted.forEach(n => {
    const entry = document.createElement('div');
    entry.className = 'score-entry';
    entry.innerHTML = `<span style="color:${n.color}">${n.name}</span><span>${Math.floor(n.population)}M</span>`;
    scoreList.appendChild(entry);
  });
}

// Game loop
function gameLoop() {
  if (S.paused || S.gameOver || !ctx) {
    requestAnimationFrame(gameLoop);
    return;
  }

  ctx.imageSmoothingEnabled = !(currentTheme === 'retro80s' || currentTheme === 'wargames');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  Atmosphere.update();
  Atmosphere.draw(ctx);

  Ocean.update();
  Ocean.draw(ctx);
  
  cam.zoom += (cam.targetZoom - cam.zoom) * 0.1;
  
  drawWorld();
  CityLights.draw(ctx);
  drawNations();
  drawMissiles();
  drawBombers();
  drawSubmarines();
  drawParticles();
  drawFX();
  
  requestAnimationFrame(gameLoop);
}

// Consume action
function consumeAction() {
  S.actionsRemaining--;
  updateDisplay();
  
  if (S.actionsRemaining <= 0) {
    S.overlay = { text: 'NEXT ROUND', ttl: 1000 };
    setTimeout(endTurn, 500);
  }
}

// React Component
export default function NoradVector() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: ModalContentValue }>({ title: '', content: '' });
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
  const [selectedDoctrine, setSelectedDoctrine] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeId>('synthwave');
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [uiTick, setUiTick] = useState(0);
  const handleAttackRef = useRef<() => void>(() => {});

  useEffect(() => {
    const stored = Storage.getItem('theme');
    if (stored && themeOptions.some(opt => opt.id === stored)) {
      const valid = stored as ThemeId;
      setTheme(valid);
      currentTheme = valid;
    } else {
      currentTheme = 'synthwave';
    }
  }, []);

  useEffect(() => {
    currentTheme = theme;
    const classNames = themeOptions.map(opt => `theme-${opt.id}`);
    if (typeof document !== 'undefined') {
      document.body.classList.remove(...classNames);
      document.body.classList.add(`theme-${theme}`);
    }
    Storage.setItem('theme', theme);
    if (canvasRef.current) {
      canvasRef.current.style.imageRendering = theme === 'retro80s' || theme === 'wargames' ? 'pixelated' : 'auto';
    }
  }, [theme]);

  useEffect(() => {
    uiUpdateCallback = () => setUiTick(prev => prev + 1);
    return () => {
      uiUpdateCallback = null;
    };
  }, []);

  useEffect(() => {
    selectedTargetRefId = selectedTargetId;
  }, [selectedTargetId]);

  useEffect(() => {
    if (!selectedTargetId) return;
    const stillValid = nations.some(n => n.id === selectedTargetId && !n.isPlayer && n.population > 0);
    if (!stillValid) {
      setSelectedTargetId(null);
    }
  }, [selectedTargetId, uiTick]);

  useEffect(() => {
    if (!isGameStarted) {
      setSelectedTargetId(null);
    }
  }, [isGameStarted]);

  const targetableNations = useMemo(() => {
    void uiTick;
    return nations
      .filter(n => !n.isPlayer && n.population > 0)
      .sort((a, b) => b.population - a.population);
  }, [uiTick]);

  const handleTargetSelect = useCallback((nationId: string) => {
    setSelectedTargetId(prev => (prev === nationId ? null : nationId));
  }, []);

  const handleAttack = useCallback(() => {
    if (!isGameStarted || S.gameOver) return;

    const player = PlayerManager.get();
    if (!player) return;

    if (S.phase !== 'PLAYER') {
      toast({ title: 'Cannot launch', description: 'Attacks are only available during your phase.' });
      return;
    }

    if (S.actionsRemaining <= 0) {
      toast({ title: 'No actions remaining', description: 'You must end your turn before launching another strike.' });
      return;
    }

    if (!canPerformAction('attack', S.defcon)) {
      toast({ title: 'DEFCON too high', description: 'Escalate to DEFCON 2 or lower before ordering an attack.' });
      return;
    }

    if (!selectedTargetId) {
      toast({ title: 'Select a target', description: 'Choose a target nation from the list before launching.' });
      return;
    }

    const target = nations.find(n => n.id === selectedTargetId && !n.isPlayer);
    if (!target || target.population <= 0) {
      toast({ title: 'Target unavailable', description: 'The selected target is no longer a valid threat.' });
      setSelectedTargetId(null);
      return;
    }

    const warheadEntries = Object.entries(player.warheads || {})
      .map(([yieldStr, count]) => ({ yield: Number(yieldStr), count: count as number }))
      .filter(entry => {
        if (entry.count <= 0) return false;
        if (entry.yield <= 10) return true;
        const researchId = WARHEAD_YIELD_TO_ID.get(entry.yield);
        if (!researchId) return true;
        return !!player.researched?.[researchId];
      })
      .sort((a, b) => b.yield - a.yield);

    if (warheadEntries.length === 0) {
      toast({ title: 'No warheads ready', description: 'Build warheads before attempting to launch.' });
      return;
    }

    const availableWarhead = warheadEntries.find(entry => {
      const requiredDefcon = entry.yield > 50 ? 1 : 2;
      return S.defcon <= requiredDefcon;
    });

    if (!availableWarhead) {
      const minDefcon = Math.min(...warheadEntries.map(entry => (entry.yield > 50 ? 1 : 2)));
      toast({
        title: 'DEFCON restriction',
        description: `Lower DEFCON to ${minDefcon} or less to deploy available warheads.`,
      });
      return;
    }

    const yieldMT = availableWarhead.yield;
    const missileCount = player.missiles || 0;
    const bomberCount = player.bombers || 0;
    const submarineCount = player.submarines || 0;

    let delivery: 'missile' | 'bomber' | 'submarine' | null = null;
    if (missileCount > 0) delivery = 'missile';
    else if (bomberCount > 0) delivery = 'bomber';
    else if (submarineCount > 0) delivery = 'submarine';

    if (!delivery) {
      toast({ title: 'No launch platforms', description: 'Construct missiles, bombers, or submarines before attacking.' });
      return;
    }

    const requirement = yieldMT > 50 ? 1 : 2;
    const deliveryLabel = delivery === 'missile' ? 'ICBM' : delivery === 'bomber' ? 'Strategic Bomber' : 'Ballistic Submarine';
    const confirmMessage = [
      'AUTHORIZE NUCLEAR LAUNCH?',
      '',
      `Target: ${target.name}`,
      `Population Estimate: ${Math.floor(target.population)}M`,
      `Warhead Yield: ${yieldMT}MT`,
      `Delivery System: ${deliveryLabel}`,
      `Current DEFCON: ${S.defcon} (requires ≤ ${requirement})`,
      '',
      `Missiles Ready: ${missileCount}`,
      `Bombers Ready: ${bomberCount}`,
      `Submarines Ready: ${submarineCount}`,
      '',
      'Proceed with launch order?'
    ].join('\n');

    if (!window.confirm(confirmMessage)) {
      return;
    }

    let launchSucceeded = false;

    if (delivery === 'missile') {
      launchSucceeded = launch(player, target, yieldMT);
    } else {
      player.warheads = player.warheads || {};
      const remaining = (player.warheads[yieldMT] || 0) - 1;
      if (remaining <= 0) {
        delete player.warheads[yieldMT];
      } else {
        player.warheads[yieldMT] = remaining;
      }

      if (delivery === 'bomber') {
        player.bombers = Math.max(0, (player.bombers || 0) - 1);
        launchSucceeded = launchBomber(player, target, { yield: yieldMT });
        if (launchSucceeded) {
          log(`${player.name} dispatches bomber strike (${yieldMT}MT) toward ${target.name}`);
          DoomsdayClock.tick(0.3);
          AudioSys.playSFX('launch');
        }
      } else if (delivery === 'submarine') {
        player.submarines = Math.max(0, (player.submarines || 0) - 1);
        launchSucceeded = launchSubmarine(player, target, yieldMT);
        if (launchSucceeded) {
          log(`${player.name} launches submarine strike (${yieldMT}MT) toward ${target.name}`);
          DoomsdayClock.tick(0.3);
        }
      }
    }

    if (launchSucceeded) {
      consumeAction();
    }
  }, [isGameStarted, selectedTargetId]);

  const startGame = useCallback(() => {
    if (!selectedLeader || !selectedDoctrine) {
      return;
    }
    S.selectedLeader = selectedLeader;
    S.selectedDoctrine = selectedDoctrine;
    S.playerName = selectedLeader;
    setIsGameStarted(true);
  }, [selectedLeader, selectedDoctrine]);

  const openModal = useCallback((title: string, content: ModalContentValue) => {
    setModalContent({ title, content });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const renderResearchModal = useCallback((): ReactNode => {
    const player = PlayerManager.get();
    if (!player) {
      return <div className="text-sm text-cyan-200">No nation data available.</div>;
    }

    const activeQueue = player.researchQueue;
    const activeProject = activeQueue ? RESEARCH_LOOKUP[activeQueue.projectId] : null;
    const progress = activeQueue && activeQueue.totalTurns > 0
      ? Math.round(((activeQueue.totalTurns - activeQueue.turnsRemaining) / activeQueue.totalTurns) * 100)
      : 0;

    const categories: { id: ResearchProject['category']; label: string }[] = [
      { id: 'warhead', label: 'Warhead Programs' },
      { id: 'defense', label: 'Defense Initiatives' },
      { id: 'intel', label: 'Intelligence Operations' }
    ];

    const formatCost = (cost: ResourceCost) => {
      const parts = Object.entries(cost)
        .filter(([, amount]) => (amount || 0) > 0)
        .map(([resource, amount]) => `${amount} ${resource.toUpperCase()}`);
      return parts.length > 0 ? parts.join(' • ') : 'No cost';
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-cyan-300 mb-2">Research Focus</h3>
          {activeProject ? (
            <div className="border border-cyan-600/60 rounded p-4 bg-black/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-200">{activeProject.name}</span>
                <span className="text-sm text-cyan-300">{progress}%</span>
              </div>
              <p className="text-sm text-cyan-200/70">{activeProject.description}</p>
              <div className="h-2 bg-cyan-900 rounded overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <div className="text-xs text-cyan-200/80">
                Turns remaining: {activeQueue.turnsRemaining}/{activeQueue.totalTurns}
              </div>
            </div>
          ) : (
            <div className="text-sm text-cyan-200/80">
              No active project. Select a program below to begin research.
            </div>
          )}
        </div>

        {categories.map(category => {
          const projects = RESEARCH_TREE.filter(project => project.category === category.id);
          if (projects.length === 0) return null;

          return (
            <div key={category.id} className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-cyan-400">
                {category.label}
              </h4>
              {projects.map(project => {
                const isUnlocked = !!player.researched?.[project.id];
                const prerequisitesMet = (project.prerequisites || []).every(req => player.researched?.[req]);
                const affordable = canAfford(player, project.cost);
                const disabled = isUnlocked || !prerequisitesMet || !!activeQueue || !affordable;

                return (
                  <div key={project.id} className="border border-cyan-700/70 rounded p-4 bg-black/50 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-cyan-200">{project.name}</div>
                        <div className="text-xs text-cyan-200/70 uppercase">
                          {project.turns} turns • Cost: {formatCost(project.cost)}
                        </div>
                      </div>
                      {isUnlocked ? (
                        <span className="text-green-400 text-xs font-semibold">UNLOCKED</span>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-cyan-700 hover:bg-cyan-600 text-black"
                          disabled={disabled}
                          onClick={() => startResearch(project.id)}
                        >
                          START
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-cyan-100/80">{project.description}</p>
                    {project.yield ? (
                      <div className="text-xs text-cyan-200/70">
                        Unlocks deployment of {project.yield}MT warheads.
                      </div>
                    ) : null}
                    {project.prerequisites && project.prerequisites.length > 0 ? (
                      <div className="text-xs text-cyan-200/70">
                        Prerequisites:{' '}
                        {project.prerequisites.map(req => {
                          const met = !!player.researched?.[req];
                          const name = RESEARCH_LOOKUP[req]?.name || req;
                          return (
                            <span key={req} className={met ? 'text-green-400' : 'text-red-400'}>
                              {name}
                            </span>
                          );
                        }).reduce((acc, elem, idx, arr) => {
                          acc.push(elem);
                          if (idx < arr.length - 1) acc.push(<span key={`sep-${project.id}-${idx}`}> • </span>);
                          return acc;
                        }, [] as ReactNode[])}
                      </div>
                    ) : null}
                    {!isUnlocked && !prerequisitesMet ? (
                      <div className="text-xs text-yellow-300/80">
                        Complete prerequisite programs first.
                      </div>
                    ) : null}
                    {!isUnlocked && prerequisitesMet && !affordable ? (
                      <div className="text-xs text-yellow-300/80">
                        Additional resources required to begin this project.
                      </div>
                    ) : null}
                    {!isUnlocked && prerequisitesMet && affordable && activeQueue ? (
                      <div className="text-xs text-yellow-300/80">
                        Another project is currently underway.
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }, []);

  const handleBuild = useCallback(() => {
    const player = PlayerManager.get();
    if (!player) return;

    let content = `
      <div class="grid grid-cols-2 gap-4">
        <button class="p-4 border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black">
          BUILD MISSILE<br>
          <small>Cost: 8 PRODUCTION</small>
        </button>
        <button class="p-4 border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black">
          BUILD BOMBER<br>
          <small>Cost: 20 PRODUCTION</small>
        </button>
      </div>
    `;

    openModal('BUILD', content);
  }, [openModal]);

  const handleResearch = useCallback(() => {
    openModal('RESEARCH DIRECTORATE', renderResearchModal);
  }, [openModal, renderResearchModal]);

  useEffect(() => {
    handleAttackRef.current = handleAttack;
  }, [handleAttack]);

  useEffect(() => {
    if (canvasRef.current && isGameStarted) {
      canvas = canvasRef.current;
      ctx = canvas.getContext('2d')!;
      
      W = canvas.width = 1200;
      H = canvas.height = 800;
      
      // Initialize audio
      AudioSys.init();
      
      // Initialize game systems
      Atmosphere.init();
      Ocean.init();
      
      // Initialize game
      initNations();
      CityLights.generate();
      
      // Load world map
      loadWorld().then(() => {
        // Start game loop
        requestAnimationFrame(gameLoop);
      });
      
      // Setup mouse and touch controls
      let isDragging = false;
      let dragStart = { x: 0, y: 0 };
      let touching = false;
      let touchStart = { x: 0, y: 0 };
      let zoomedIn = false;

      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true;
        dragStart = { x: e.clientX - cam.x, y: e.clientY - cam.y };
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          cam.x = e.clientX - dragStart.x;
          cam.y = e.clientY - dragStart.y;
        }
      };

      const handleMouseUp = () => {
        isDragging = false;
      };

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        cam.targetZoom = Math.max(0.5, Math.min(3, cam.targetZoom * delta));
      };

      const handleTouchStart = (e: TouchEvent) => {
        if(e.touches.length === 1) {
          touching = true;
          touchStart = {x: e.touches[0].clientX, y: e.touches[0].clientY};
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if(!touching) return;
        if(e.touches.length === 1) { 
          const nx = e.touches[0].clientX, ny = e.touches[0].clientY; 
          cam.x += nx - touchStart.x; 
          cam.y += ny - touchStart.y; 
          touchStart = {x: nx, y: ny}; 
        }
      };

      const handleTouchEnd = () => { 
        touching = false; 
      };

      // Click handler for satellite intelligence
      const handleClick = (e: MouseEvent) => {
        if (isDragging) return;
        if (S.gameOver) return;
        const player = PlayerManager.get();
        if (!player || !player.satellites) return;
        
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        for (const n of nations) {
          if (n.isPlayer) continue;
          if (!player.satellites[n.id]) continue;
          if (n.population <= 0) continue;
          const [nx, ny] = project(n.lon, n.lat);
          const dist = Math.hypot(mx - nx, my - ny);
          
          if (dist < 20) {
            let intelHtml = `<div style="margin:8px 0;padding:6px;border:1px solid rgba(124,255,107,.3);">`;
            intelHtml += `<strong>${n.name}</strong><br>`;
            intelHtml += `Missiles: ${n.missiles} | Defense: ${n.defense}<br>`;
            intelHtml += `Warheads: ${Object.entries(n.warheads || {}).map(([k, v]) => `${k}MT×${v}`).join(', ')}<br>`;
            intelHtml += `Production: ${Math.floor(n.production || 0)} | Uranium: ${Math.floor(n.uranium || 0)} | Intel: ${Math.floor(n.intel || 0)}<br>`;
            intelHtml += `Migrants (This Turn / Total): ${(n.migrantsThisTurn || 0)} / ${(n.migrantsTotal || 0)}<br>`;
            intelHtml += `Population: ${Math.floor(n.population)}M | Instability: ${Math.floor(n.instability || 0)}`;
            intelHtml += `</div>`;
            openModal(`${n.name} INTEL`, intelHtml);
            break;
          }
        }
      };

      // Double-click zoom functionality
      const handleDoubleClick = (e: MouseEvent) => {
        if (isDragging) return;
        if (S.gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        if (zoomedIn) {
          cam.targetZoom = 1;
          cam.zoom = 1;
          cam.x = (W - W * cam.zoom) / 2;
          cam.y = (H - H * cam.zoom) / 2;
          zoomedIn = false;
          return;
        }
        
        const [lon, lat] = toLonLat(mx, my);
        const newZoom = Math.min(3, cam.targetZoom * 1.5);
        cam.targetZoom = newZoom;
        cam.zoom = newZoom;
        cam.x = W / 2 - ((lon + 180) / 360) * W * newZoom;
        cam.y = H / 2 - ((90 - lat) / 180) * H * newZoom;
        zoomedIn = true;
        
        let nearest = null;
        let minDist = Infinity;
        for (const nn of nations) {
          const d = Math.hypot((nn.lon || 0) - lon, (nn.lat || 0) - lat);
          if (d < minDist) { minDist = d; nearest = nn; }
        }
        
        if (nearest) {
          const lines = [];
          lines.push(`<strong>${nearest.name}</strong>`);
          if (nearest.leader) lines.push(`Leader: ${nearest.leader}`);
          if (nearest.doctrine) lines.push(`Doctrine: ${nearest.doctrine}`);
          lines.push(`Population: ${Math.floor(nearest.population || 0)}M`);
          lines.push(`Cities: ${nearest.cities || 0}`);
          lines.push(`Instability: ${Math.floor(nearest.instability || 0)}`);
          
          const currentPlayer = PlayerManager.get();
          const hasIntelCoverage = currentPlayer && currentPlayer.satellites && currentPlayer.satellites[nearest.id];
          if (hasIntelCoverage) {
            lines.push(`Missiles: ${nearest.missiles || 0}, Defense: ${nearest.defense || 0}`);
            lines.push(`Production: ${Math.floor(nearest.production || 0)}, Uranium: ${Math.floor(nearest.uranium || 0)}, Intel: ${Math.floor(nearest.intel || 0)}`);
          } else {
            lines.push(`Surveillance required to view military and resource data`);
          }
          const info = `<div style="margin:8px 0">${lines.join('<br>')}</div>`;
          openModal(`${nearest.name} REGION`, info);
        }
      };

      // Keyboard controls
      const handleKeyDown = (e: KeyboardEvent) => {
        if(S.gameOver) return;

        switch(e.key) {
          case '1': handleBuild(); break;
          case '2': /* research */ break;
          case '3': /* intel */ break;
          case '4': /* culture */ break;
          case '5': /* immigration */ break;
          case '6': /* diplomacy */ break;
          case '7':
            e.preventDefault();
            handleAttackRef.current?.();
            break;
          case 'Enter': /* end turn */ break;
          case ' ':
            e.preventDefault();
            S.paused = !S.paused;
            break;
          case 's':
          case 'S': /* save */ break;
        }

        if (e.code === 'Numpad7') {
          e.preventDefault();
          handleAttackRef.current?.();
        }
      };

      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('wheel', handleWheel);
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('dblclick', handleDoubleClick);
      canvas.addEventListener('touchstart', handleTouchStart, {passive: true});
      canvas.addEventListener('touchmove', handleTouchMove, {passive: true});
      canvas.addEventListener('touchend', handleTouchEnd, {passive: true});
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('dblclick', handleDoubleClick);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isGameStarted, handleBuild, openModal]);


  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-black text-cyan-500 flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-8 max-w-2xl">
          <pre
            aria-label="NORAD VECTOR"
            className="mx-auto mb-8 max-w-full overflow-x-auto rounded-lg border border-cyan-500/40 bg-black/60 p-6 font-mono text-[clamp(1.5rem,4vw,3.5rem)] leading-tight text-emerald-300 shadow-[0_0_20px_rgba(0,255,170,0.45)] drop-shadow-[0_0_18px_rgba(0,255,170,0.75)]"
          >{`███╗   ██╗ ██████╗ ██████╗  █████╗ ██████╗      ██╗   ██╗███████╗ ██████╗████████╗ ██████╗ ██████╗ 
████╗  ██║██╔═══██╗██╔══██╗██╔══██╗██╔══██╗     ██║   ██║██╔════╝██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
██╔██╗ ██║██║   ██║██████╔╝███████║██║  ██║     ██║   ██║█████╗  ██║        ██║   ██║   ██║██████╔╝
██║╚██╗██║██║   ██║██╔══██╗██╔══██║██║  ██║     ╚██╗ ██╔╝██╔══╝  ██║        ██║   ██║   ██║██╔══██╗
██║ ╚████║╚██████╔╝██║  ██║██║  ██║██████╔╝██████╚████╔╝ ███████╗╚██████╗   ██║   ╚██████╔╝██║  ██║
╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═════╝╚═══╝  ╚══════╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝`}
          </pre>
          <p className="text-xl mb-8">Nuclear War Simulation</p>
          
          {!selectedLeader && (
            <div>
              <h2 className="text-3xl mb-6 text-cyan-400">SELECT LEADER</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {leaders.map(leader => {
                  const isSelected = selectedLeader === leader.name;
                  return (
                    <Button
                      key={leader.name}
                      onClick={() => setSelectedLeader(leader.name)}
                      className="p-6 border transition-all duration-300 uppercase tracking-wide"
                      style={{
                        borderColor: leader.color,
                        backgroundColor: isSelected ? leader.color : 'rgba(0,0,0,0.6)',
                        color: isSelected ? '#000000' : leader.color,
                        boxShadow: isSelected ? `0 0 18px ${leader.color}` : '0 0 8px rgba(0,0,0,0.4)'
                      }}
                    >
                      <div>
                        <div className="font-bold">{leader.name}</div>
                        <div className="text-sm opacity-80">{leader.ai}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          
          {selectedLeader && !selectedDoctrine && (
            <div>
              <h2 className="text-3xl mb-6 text-cyan-400">SELECT DOCTRINE</h2>
              <div className="grid grid-cols-1 gap-4 mb-8">
                {Object.entries(doctrines).map(([key, doctrine]) => (
                  <Button
                    key={key}
                    onClick={() => setSelectedDoctrine(key)}
                    className="p-6 bg-black border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black text-left"
                  >
                    <div>
                      <div className="font-bold">{doctrine.name}</div>
                      <div className="text-sm">{doctrine.desc}</div>
                      <div className="text-xs text-yellow-400">{doctrine.effects}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {selectedLeader && selectedDoctrine && (
            <div>
              <h2 className="text-3xl mb-6 text-green-400">READY TO START</h2>
              <p className="mb-4">Leader: {selectedLeader}</p>
              <p className="mb-6">Doctrine: {doctrines[selectedDoctrine as keyof typeof doctrines].name}</p>
              <Button
                onClick={startGame}
                className="px-12 py-4 bg-green-600 hover:bg-green-700 text-white text-xl"
              >
                START GAME
              </Button>
            </div>
          )}

          <div className="mt-12">
            <h2 className="text-2xl mb-4 text-purple-300">VISUAL THEME</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {themeOptions.map(opt => {
                const isActive = theme === opt.id;
                return (
                  <Button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`px-4 py-2 border text-sm transition-all ${isActive ? 'bg-purple-500 text-black border-purple-300' : 'bg-transparent border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-black'}`}
                  >
                    {opt.label.toUpperCase()}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 overflow-hidden">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="block mx-auto cursor-crosshair"
        width={1200}
        height={800}
      />
      
      {/* HUD Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Top HUD */}
        <div id="gameHud" className="absolute top-4 left-4 right-4 flex justify-between pointer-events-auto">
          <div className="flex gap-4">
            <div className="defcon-display bg-red-900 border border-red-500 px-4 py-2 rounded">
              DEFCON: <span id="defcon">5</span>
            </div>
            <div className="bg-blue-900 border border-blue-500 px-4 py-2 rounded">
              TURN: <span id="turn">1</span>
            </div>
            <div className="bg-yellow-900 border border-yellow-500 px-4 py-2 rounded">
              ACTIONS: <span id="actionsDisplay">1/1</span>
            </div>
            <div className="bg-purple-900 border border-purple-500 px-4 py-2 rounded">
              <span id="phaseBadge">PHASE: PLAYER</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleBuild} className="bg-green-700 hover:bg-green-600">
              BUILD
            </Button>
            <Button onClick={handleResearch} className="bg-blue-700 hover:bg-blue-600">
              RESEARCH
            </Button>
            <Button className="bg-purple-700 hover:bg-purple-600">
              INTEL
            </Button>
            <Button className="bg-yellow-700 hover:bg-yellow-600">
              CULTURE
            </Button>
            <Button className="bg-orange-700 hover:bg-orange-600">
              IMMIGRATION
            </Button>
            <Button className="bg-cyan-700 hover:bg-cyan-600">
              DIPLOMACY
            </Button>
            <Button onClick={handleAttack} className="bg-red-700 hover:bg-red-600">
              ATTACK
            </Button>
            <Button onClick={endTurn} className="bg-gray-700 hover:bg-gray-600">
              END TURN
            </Button>
          </div>
        </div>
        
        {/* Left Panel - Resources */}
        <div id="resourcePanel" className="absolute top-20 left-4 bg-black bg-opacity-80 border border-green-500 p-4 rounded">
          <h3 className="text-green-400 mb-2">RESOURCES</h3>
          <div className="space-y-1 text-sm">
            <div>PRODUCTION: <span id="productionDisplay">0</span></div>
            <div>URANIUM: <span id="uraniumDisplay">0</span></div>
            <div>INTEL: <span id="intelDisplay">0</span></div>
            <div>CITIES: <span id="citiesDisplay">1</span></div>
            <div>POPULATION: <span id="popDisplay">0</span>M</div>
          </div>
        </div>
        
        {/* Right Panel - Status */}
        <div id="statusPanel" className="absolute top-20 right-4 bg-black bg-opacity-80 border border-cyan-500 p-4 rounded">
          <h3 className="text-cyan-400 mb-2">STATUS</h3>
          <div className="space-y-1 text-sm">
            <div>LEADER: <span id="leaderDisplay">-</span></div>
            <div>DOCTRINE: <span id="doctrineDisplay">-</span></div>
            <div>MISSILES: <span id="missileDisplay">0</span></div>
            <div>BOMBERS: <span id="bomberDisplay">0</span></div>
            <div>DEFENSE: <span id="defenseDisplay">0</span></div>
            <div>INSTABILITY: <span id="instabilityDisplay">0</span></div>
            <div>WARHEADS: <span id="warheadDisplay">NONE</span></div>
          </div>
        </div>

        {/* Targets Panel */}
        <div className="absolute top-20 right-72 bg-black bg-opacity-80 border border-red-500 p-4 rounded w-64 pointer-events-auto">
          <h3 className="text-red-400 mb-2">TARGETS</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {targetableNations.length === 0 ? (
              <div className="text-xs text-red-200/70">No viable enemy targets.</div>
            ) : (
              targetableNations.map(target => {
                const isActive = selectedTargetId === target.id;
                return (
                  <button
                    key={target.id}
                    onClick={() => handleTargetSelect(target.id)}
                    className={`w-full text-left px-3 py-2 border transition text-sm tracking-wide ${isActive ? 'bg-red-600 text-black border-red-300 shadow-[0_0_12px_rgba(255,0,0,0.45)]' : 'bg-transparent border-red-600/60 text-red-200 hover:bg-red-900/40'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{target.name}</span>
                      <span className="text-xs opacity-80">{Math.floor(target.population)}M</span>
                    </div>
                    <div className="text-[10px] uppercase text-red-200/70 mt-1">
                      DEF {target.defense} • MISS {target.missiles}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Doomsday Clock */}
        <div id="doomsdayPanel" className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-900 bg-opacity-80 border border-red-500 p-4 rounded text-center">
          <h3 className="text-red-400 mb-2">DOOMSDAY CLOCK</h3>
          <div className="text-2xl font-bold text-red-300">
            <span id="doomsdayTime">7:00</span>
          </div>
        </div>
        
        {/* Scoreboard */}
        <div id="scorePanel" className="absolute bottom-4 right-4 bg-black bg-opacity-80 border border-yellow-500 p-4 rounded w-64">
          <h3 className="text-yellow-400 mb-2">WORLD POWERS</h3>
          <div id="scoreList" className="space-y-1 text-sm">
            {/* Populated by updateScoreboard() */}
          </div>
        </div>
        
        {/* Event Log */}
        <div id="log" className="absolute bottom-4 left-4 bg-black bg-opacity-80 border border-green-500 p-4 rounded w-96 h-48 overflow-y-auto">
          <h3 className="text-green-400 mb-2">EVENT LOG</h3>
          {/* Populated by log() function */}
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 border border-purple-500 p-3 rounded pointer-events-auto">
          <h3 className="text-purple-300 text-xs tracking-[0.35em] mb-2 text-center">THEME</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {themeOptions.map(opt => {
              const active = theme === opt.id;
              return (
                <Button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`px-3 py-1 text-xs border transition ${active ? 'bg-purple-500 text-black border-purple-300' : 'bg-transparent text-purple-200 border-purple-500 hover:bg-purple-500 hover:text-black'}`}
                >
                  {opt.label.toUpperCase()}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-black border border-cyan-500 text-cyan-500 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-cyan-400">{modalContent.title}</DialogTitle>
          </DialogHeader>
          {(() => {
            const content = typeof modalContent.content === 'function' ? modalContent.content() : modalContent.content;
            if (typeof content === 'string') {
              return <div dangerouslySetInnerHTML={{ __html: content }} />;
            }
            return content ?? null;
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
