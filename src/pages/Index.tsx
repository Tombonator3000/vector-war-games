import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  bombers: number;
  defense: number;
  instability: number;
  counterIntel: number;
  warheads: Record<number, number>;
  production: number;
  uranium: number;
  intel: number;
  // Legacy for UI compatibility
  money: number;
  energy: number;
  culture: number;
  researchPoints: number;
  cities: number;
  satellites: number;
  researched: Record<string, boolean>;
  treaties: Record<string, { truceTurns: number }>;
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
  difficulty: 'easy' | 'normal' | 'hard';
  missiles: any[];
  bombers: any[];
  explosions: any[];
  particles: any[];
  radiationZones: any[];
  empEffects: any[];
  craters: any[];
  flashes: any[];
  screenShake: number;
  events: boolean;
}

// PlayerManager - Critical fix for player reference
class PlayerManager {
  private static _cached: Nation | null = null;
  
  static get(nations: Nation[]): Nation | null {
    // Return cached if valid
    if (this._cached && nations.includes(this._cached)) {
      return this._cached;
    }
    
    // Find player nation
    let player = nations.find(n => n && n.isPlayer);
    if (!player && nations.length > 0) {
      // Fallback: first nation is player
      player = nations[0];
      player.isPlayer = true;
    }
    
    // Cache and return
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
  static minutes = 7;
  
  static tick(amount = 0.5) {
    this.minutes = Math.max(0.5, this.minutes - amount);
    
    if (this.minutes <= 1) {
      // Increase AI aggression
    }
    
    if (this.minutes <= 0) {
      this.midnight();
    }
  }
  
  static improve(amount = 0.5) {
    this.minutes = Math.min(11, this.minutes + amount);
  }
  
  static midnight() {
    // MAD scenario - everyone launches everything
  }
  
  static getDisplay(): string {
    const mins = Math.floor(this.minutes);
    const secs = Math.floor((this.minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Leaders and Doctrines
const LEADERS = [
  {name: "Ronnie Raygun", ai: "aggressive", color: "#ff5555"},
  {name: "Tricky Dick", ai: "defensive", color: "#5599ff"},
  {name: "Jimi Farmer", ai: "balanced", color: "#55ff99"},
  {name: "E. Musk Rat", ai: "chaotic", color: "#ff55ff"},
  {name: "Donnie Trumpf", ai: "aggressive", color: "#ffaa55"}
];

interface Doctrine {
  name: string;
  desc: string;
  effects: string;
  missileBonus?: number;
  defenseMultiplier?: number;
  interceptBonus?: number;
  intelBonus?: number;
}

const DOCTRINES: Record<string, Doctrine> = {
  firstStrike: {
    name: "First Strike",
    desc: "Overwhelming offensive power",
    effects: "Missiles +3, Defense -20%, Aggression +30%",
    missileBonus: 3,
    defenseMultiplier: 0.8
  },
  fortress: {
    name: "Fortress", 
    desc: "Impenetrable defense",
    effects: "Defense +50%, Intercept +30%, Missiles -2",
    defenseMultiplier: 1.5,
    interceptBonus: 0.3,
    missileBonus: -2
  },
  diplomat: {
    name: "Diplomat",
    desc: "Peace through negotiation", 
    effects: "Trade costs -25%, Truce +1 turn, Intel +20%",
    intelBonus: 0.2
  }
};

// DEFCON Action Enforcement - NEW!
function canPerformAction(action: string, defcon: number): boolean {
  switch(action) {
    case 'build':
    case 'diplomacy':
      return true; // Always allowed
      
    case 'defense':
    case 'intel':
      return defcon <= 4;
      
    case 'conventional':
    case 'culture':
    case 'immigration':
      return defcon <= 3;
      
    case 'tactical': // ≤50MT nukes
      return defcon <= 2;
      
    case 'strategic': // >50MT nukes
    case 'attack':
      return defcon <= 1;
      
    default:
      return false;
  }
}

const NoradVector = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: string }>({ title: '', content: '' });
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    turn: 1,
    defcon: 5,
    phase: 'PLAYER',
    actionsRemaining: 1,
    paused: false,
    gameOver: false,
    selectedLeader: null,
    selectedDoctrine: null,
    difficulty: 'normal',
    missiles: [],
    bombers: [],
    explosions: [],
    particles: [],
    radiationZones: [],
    empEffects: [],
    craters: [],
    flashes: [],
    screenShake: 0,
    events: true
  });
  
  const [nations, setNations] = useState<Nation[]>([]);
  const [logMessages, setLogMessages] = useState<Array<{message: string, type: string, turn: number}>>([]);
  
  // Resource Mapping - NEW 3-resource system
  const mapResources = (nation: Nation) => {
    const cities = nation.cities || 1;
    nation.production = Math.floor(cities * 10);
    nation.uranium = Math.floor(cities * 3);
    nation.intel = Math.floor(nation.population / 10);
    
    // Map to old UI (keep display working)
    nation.money = nation.production;
    nation.energy = Math.floor(nation.production * 0.3);
    nation.culture = Math.floor(nation.intel * 0.4);
    nation.researchPoints = Math.floor(nation.intel * 0.6);
  };
  
  // Initialize Nations
  const initNations = () => {
    const playerNation: Nation = {
      id: 'player',
      isPlayer: true,
      name: 'PLAYER',
      leader: gameState.selectedLeader || 'Commander',
      doctrine: gameState.selectedDoctrine,
      lon: -95,
      lat: 40,
      color: '#00ffff',
      population: 100,
      missiles: 8,
      bombers: 2,
      defense: 5,
      instability: 0,
      counterIntel: 0,
      warheads: {10: 5, 20: 3, 40: 1},
      production: 100,
      uranium: 15,
      intel: 50,
      money: 100,
      energy: 30,
      culture: 20,
      researchPoints: 30,
      cities: 1,
      satellites: 0,
      researched: {},
      treaties: {}
    };
    
    // Apply doctrine bonuses
    if (gameState.selectedDoctrine && DOCTRINES[gameState.selectedDoctrine as keyof typeof DOCTRINES]) {
      const doctrine = DOCTRINES[gameState.selectedDoctrine as keyof typeof DOCTRINES];
      if (doctrine.missileBonus) playerNation.missiles += doctrine.missileBonus;
      if (doctrine.defenseMultiplier) playerNation.defense = Math.floor(playerNation.defense * doctrine.defenseMultiplier);
    }
    
    // Map resources
    mapResources(playerNation);
    
    // AI Nations
    const aiNations: Nation[] = [
      {
        id: 'ai_0',
        isPlayer: false,
        name: 'EURASIA',
        leader: 'Tricky Dick',
        ai: 'defensive',
        lon: 37,
        lat: 55,
        color: '#5599ff',
        population: 80,
        missiles: 6,
        bombers: 1,
        defense: 4,
        instability: 0,
        counterIntel: 0,
        warheads: {10: 4, 20: 2},
        production: 80,
        uranium: 12,
        intel: 40,
        money: 80,
        energy: 24,
        culture: 16,
        researchPoints: 24,
        cities: 1,
        satellites: 0,
        researched: {},
        treaties: {}
      }
    ];
    
    aiNations.forEach(mapResources);
    
    setNations([playerNation, ...aiNations]);
    addLogMessage('Game initialized', 'success');
  };
  
  const addLogMessage = (message: string, type: string = 'normal') => {
    setLogMessages(prev => [...prev, { message, type, turn: gameState.turn }]);
  };
  
  // Immigration System - FIXED Implementation
  const performImmigration = (type: string, target: Nation) => {
    const player = PlayerManager.get(nations);
    if (!player) {
      addLogMessage('Player nation not found!', 'alert');
      return false;
    }
    
    let success = false;
    
    switch(type) {
      case 'skilled':
        if (player.production >= 10 && player.intel >= 5) {
          const amt = Math.floor(player.population * 0.05);
          player.population -= amt;
          target.population += amt;
          target.instability = (target.instability || 0) + 15;
          target.defense += 1;
          player.production -= 10;
          player.intel -= 5;
          addLogMessage(`Skilled immigration: ${amt}M → ${target.name} (+15 instab, +1 def)`);
          success = true;
        }
        break;
        
      case 'mass':
        if (player.production >= 5 && player.intel >= 2) {
          const amt = Math.floor(player.population * 0.10);
          player.population -= amt;
          target.population += amt;
          const instab = 25 + Math.floor(Math.random() * 11);
          target.instability = (target.instability || 0) + instab;
          player.production -= 5;
          player.intel -= 2;
          addLogMessage(`Mass immigration: ${amt}M → ${target.name} (+${instab} instab)`);
          success = true;
        }
        break;
        
      case 'refugee':
        if (player.intel >= 15 && (player.instability || 0) >= 50) {
          const amt = Math.floor(player.population * 0.15);
          player.population -= amt;
          target.population += amt;
          target.instability = (target.instability || 0) + 40;
          player.instability = Math.max(0, player.instability - 20);
          player.intel -= 15;
          addLogMessage(`Refugee wave: ${amt}M → ${target.name} (+40 instab, your instab -20)`);
          success = true;
        }
        break;
        
      case 'brain':
        if (player.intel >= 20) {
          const amt = Math.floor(target.population * 0.03);
          target.population -= amt;
          player.population += amt;
          target.instability = (target.instability || 0) + 10;
          target.intel = Math.max(0, (target.intel || 0) - 2);
          player.intel -= 20;
          addLogMessage(`Brain drain: +${amt}M skilled from ${target.name}`);
          success = true;
        }
        break;
    }
    
    if (!success) {
      addLogMessage('Not enough resources!', 'warning');
    } else {
      // Update nations state
      setNations(prev => [...prev]);
      consumeAction();
    }
    
    return success;
  };
  
  const consumeAction = () => {
    setGameState(prev => ({
      ...prev,
      actionsRemaining: Math.max(0, prev.actionsRemaining - 1)
    }));
  };
  
  // Launch with DEFCON enforcement and warhead consumption fix
  const launch = (from: Nation, to: Nation, yieldMT: number): boolean => {
    // DEFCON check
    if (yieldMT > 50 && gameState.defcon > 1) {
      addLogMessage(`Strategic weapons require DEFCON 1 (current: ${gameState.defcon})`, 'warning');
      return false;
    }
    if (yieldMT <= 50 && gameState.defcon > 2) {
      addLogMessage(`Tactical nukes require DEFCON 2 or lower (current: ${gameState.defcon})`, 'warning');
      return false;
    }
    
    // CRITICAL FIX: Actually consume the warhead!
    if (!from.warheads || !from.warheads[yieldMT] || from.warheads[yieldMT] <= 0) {
      addLogMessage('No warheads of that type available!', 'warning');
      return false;
    }
    
    if (from.missiles <= 0) {
      addLogMessage('No missiles available!', 'warning');
      return false;
    }
    
    from.warheads[yieldMT]--;
    if (from.warheads[yieldMT] <= 0) {
      delete from.warheads[yieldMT];
    }
    from.missiles--;
    
    addLogMessage(`${from.name} → ${to.name}: LAUNCH ${yieldMT} MT`);
    
    // Set DEFCON to 1 on nuclear launch
    setGameState(prev => ({ ...prev, defcon: 1 }));
    DoomsdayClock.tick(0.3);
    
    // Add to missiles array for animation
    setGameState(prev => ({
      ...prev,
      missiles: [...prev.missiles, {
        from, to, t: 0,
        fromLon: from.lon, fromLat: from.lat,
        toLon: to.lon, toLat: to.lat,
        yield: yieldMT,
        target: to,
        color: from.color
      }]
    }));
    
    return true;
  };
  
  // Resolution Phase - NEW!
  const resolutionPhase = () => {
    setGameState(prev => ({ ...prev, phase: 'RESOLUTION' }));
    addLogMessage('=== RESOLUTION PHASE ===', 'success');
    
    // Process missiles
    gameState.missiles.forEach((missile, i) => {
      if (missile.t >= 1) {
        // Impact!
        const damage = missile.yield * (1 - missile.target.defense * 0.05);
        missile.target.population = Math.max(0, missile.target.population - damage);
        missile.target.instability = Math.min(100, (missile.target.instability || 0) + missile.yield);
        
        addLogMessage(`💥 ${missile.yield}MT detonation at ${missile.target.name}! -${Math.floor(damage)}M`, "alert");
        
        // Create explosion effects
        setGameState(prev => ({
          ...prev,
          explosions: [...prev.explosions, {
            x: missile.target.lon,
            y: missile.target.lat,
            yield: missile.yield,
            time: Date.now()
          }]
        }));
      }
    });
    
    // Clear resolved missiles
    setGameState(prev => ({
      ...prev,
      missiles: prev.missiles.filter(m => m.t < 1)
    }));
    
    setTimeout(() => {
      productionPhase();
    }, 2000);
  };
  
  // Production Phase
  const productionPhase = () => {
    setGameState(prev => ({ ...prev, phase: 'PRODUCTION' }));
    
    nations.forEach(n => {
      if (!n || n.population <= 0) return;
      
      // Resource generation
      mapResources(n);
      
      // Handle instability/revolts - FIXED
      if ((n.instability || 0) >= 50) {
        const revoltChance = Math.min(0.35, n.instability / 100 * 0.3);
        if (Math.random() < revoltChance) {
          const popLoss = Math.floor(3 + Math.random() * 8);
          n.population = Math.max(0, n.population - popLoss);
          n.defense = Math.max(0, n.defense - 1);
          n.instability = Math.max(0, n.instability - 15);
          addLogMessage(`REVOLT in ${n.name}! -${popLoss}M pop, -1 defense`, 'alert');
        }
      }
      
      // Natural instability decay
      n.instability = Math.max(0, (n.instability || 0) - 3);
    });
    
    // Advance turn
    const newActionsPerTurn = gameState.defcon >= 4 ? 1 : gameState.defcon >= 2 ? 2 : 3;
    setGameState(prev => ({
      ...prev,
      turn: prev.turn + 1,
      phase: 'PLAYER',
      actionsRemaining: newActionsPerTurn
    }));
    
    setNations(prev => [...prev]); // Trigger re-render
  };
  
  // End Turn with Resolution Phase
  const endTurn = () => {
    if (gameState.gameOver) return;
    
    setGameState(prev => ({ ...prev, actionsRemaining: 0 }));
    
    // AI Phase
    setGameState(prev => ({ ...prev, phase: 'AI' }));
    
    setTimeout(() => {
      resolutionPhase();
    }, 1500);
  };
  
  // Canvas drawing
  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      // Clear
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw world map (simplified)
      ctx.strokeStyle = 'rgba(0,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
      
      // Draw nations
      nations.forEach(n => {
        if (n.population <= 0) return;
        
        // Convert lon/lat to screen coordinates
        const x = ((n.lon + 180) / 360) * (canvas.width - 100) + 50;
        const y = ((90 - n.lat) / 180) * (canvas.height - 100) + 50;
        
        // Nation marker
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
        
        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.name, x, y - 35);
        
        // Population
        ctx.fillStyle = '#00ff00';
        ctx.font = '10px monospace';
        ctx.fillText(`${Math.floor(n.population)}M`, x, y + 30);
        
        ctx.restore();
      });
      
      // Draw explosions
      gameState.explosions.forEach((exp, i) => {
        const age = Date.now() - exp.time;
        if (age > 3000) {
          setGameState(prev => ({
            ...prev,
            explosions: prev.explosions.filter((_, idx) => idx !== i)
          }));
          return;
        }
        
        const x = ((exp.x + 180) / 360) * (canvas.width - 100) + 50;
        const y = ((90 - exp.y) / 180) * (canvas.height - 100) + 50;
        const scale = Math.sqrt(exp.yield / 20);
        const radius = (age / 3000) * 50 * scale;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, 'rgba(255,255,255,0.8)');
        grad.addColorStop(0.4, 'rgba(255,255,100,0.6)');
        grad.addColorStop(1, 'rgba(255,100,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [gameStarted, nations, gameState.explosions]);
  
  const startGame = () => {
    setGameStarted(true);
    initNations();
  };
  
  const player = PlayerManager.get(nations);
  
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-deep-space text-cyan flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 text-cyan animate-pulse" style={{textShadow: 'var(--glow-cyan)'}}>
            NORAD VECTOR
          </h1>
          <p className="text-xl mb-8 text-neon-green" style={{textShadow: 'var(--glow-green)'}}>
            SHALL WE PLAY A GAME?
          </p>
          <Button 
            onClick={startGame}
            className="bg-cyan hover:bg-cyan/80 text-deep-space font-bold px-8 py-4 text-lg border-cyan"
            style={{boxShadow: 'var(--glow-cyan)'}}
          >
            NEW GAME
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-deep-space text-cyan relative overflow-hidden">
      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-deep-space/80 border-b-2 border-cyan flex items-center justify-between px-4 z-50" style={{boxShadow: 'var(--glow-cyan)'}}>
        <div className="flex gap-4 items-center">
          <div className={`px-3 py-1 border-2 font-bold ${
            gameState.defcon <= 2 ? 'border-neon-red text-neon-red animate-pulse' : 'border-cyan text-cyan'
          }`} style={{textShadow: gameState.defcon <= 2 ? 'var(--glow-red)' : 'var(--glow-cyan)'}}>
            DEFCON {gameState.defcon}
          </div>
          <div className="text-cyan">TURN {gameState.turn}</div>
          <div className="text-cyan">ACTIONS: {gameState.actionsRemaining}</div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowModal(true)}
            disabled={gameState.actionsRemaining <= 0 || !canPerformAction('immigration', gameState.defcon)}
            className="border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-deep-space"
          >
            IMMIGRATION
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={endTurn}
            className="border-neon-red text-neon-red hover:bg-neon-red hover:text-deep-space"
          >
            END TURN
          </Button>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="text-neon-red font-bold" style={{textShadow: 'var(--glow-red)'}}>{DoomsdayClock.getDisplay()}</div>
        </div>
      </div>
      
      {/* Main Game Area */}
      <canvas 
        ref={canvasRef}
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Resource Panel */}
      <Card className="fixed top-16 left-4 bg-deep-space/90 border-cyan p-3 min-w-48">
        <div className="text-cyan font-bold mb-2" style={{textShadow: 'var(--glow-cyan)'}}>RESOURCES</div>
        {player && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neon-green">PRODUCTION:</span>
              <span className="text-cyan">{player.production}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green">URANIUM:</span>
              <span className="text-cyan">{player.uranium}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green">INTEL:</span>
              <span className="text-cyan">{player.intel}</span>
            </div>
          </div>
        )}
      </Card>
      
      {/* Nation Status */}
      <Card className="fixed bottom-4 right-4 bg-deep-space/90 border-cyan p-3 min-w-80">
        <div className="text-cyan font-bold mb-2" style={{textShadow: 'var(--glow-cyan)'}}>NATION STATUS</div>
        {player && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neon-green">POPULATION:</span>
              <span className="text-cyan">{Math.floor(player.population)}M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green">MISSILES:</span>
              <span className="text-cyan">{player.missiles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green">DEFENSE:</span>
              <span className="text-cyan">{player.defense}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green">INSTABILITY:</span>
              <span className={`${player.instability > 50 ? 'text-neon-red' : 'text-cyan'}`}>
                {Math.floor(player.instability || 0)}
              </span>
            </div>
          </div>
        )}
      </Card>
      
      {/* Log */}
      <Card className="fixed bottom-4 left-4 right-96 bg-deep-space/90 border-cyan p-3 h-32 overflow-y-auto">
        <div className="space-y-1">
          {logMessages.slice(-10).map((msg, i) => (
            <div key={i} className={`text-xs ${
              msg.type === 'alert' ? 'text-neon-red' :
              msg.type === 'success' ? 'text-neon-green' :
              msg.type === 'warning' ? 'text-neon-yellow' :
              'text-cyan'
            }`}>
              [T{msg.turn}] {msg.message}
            </div>
          ))}
        </div>
      </Card>
      
      {/* Immigration Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-deep-space border-neon-magenta text-cyan">
          <DialogHeader>
            <DialogTitle className="text-neon-magenta" style={{textShadow: 'var(--glow-magenta)'}}>IMMIGRATION OPERATIONS</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="border-cyan text-cyan hover:bg-cyan hover:text-deep-space p-4 h-auto"
              onClick={() => {
                const target = nations.find(n => !n.isPlayer && n.population > 0);
                if (target) {
                  performImmigration('skilled', target);
                  setShowModal(false);
                }
              }}
            >
              <div className="text-left">
                <div className="font-bold">SKILLED IMMIGRATION</div>
                <div className="text-xs opacity-80">-5% pop → target, +15 instab, +1 def</div>
                <div className="text-xs opacity-60">Cost: 10 PROD, 5 INTEL</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="border-cyan text-cyan hover:bg-cyan hover:text-deep-space p-4 h-auto"
              onClick={() => {
                const target = nations.find(n => !n.isPlayer && n.population > 0);
                if (target) {
                  performImmigration('mass', target);
                  setShowModal(false);
                }
              }}
            >
              <div className="text-left">
                <div className="font-bold">MASS IMMIGRATION</div>
                <div className="text-xs opacity-80">-10% pop → target, +25-35 instab</div>
                <div className="text-xs opacity-60">Cost: 5 PROD, 2 INTEL</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="border-cyan text-cyan hover:bg-cyan hover:text-deep-space p-4 h-auto"
              onClick={() => {
                const target = nations.find(n => !n.isPlayer && n.population > 0);
                if (target && (player?.instability || 0) >= 50) {
                  performImmigration('refugee', target);
                  setShowModal(false);
                }
              }}
              disabled={!player || (player.instability || 0) < 50}
            >
              <div className="text-left">
                <div className="font-bold">REFUGEE WAVE</div>
                <div className="text-xs opacity-80">Dump your instability on others</div>
                <div className="text-xs opacity-60">Cost: 15 INTEL (Req: 50+ instability)</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="border-cyan text-cyan hover:bg-cyan hover:text-deep-space p-4 h-auto"
              onClick={() => {
                const target = nations.find(n => !n.isPlayer && n.population > 0);
                if (target) {
                  performImmigration('brain', target);
                  setShowModal(false);
                }
              }}
            >
              <div className="text-left">
                <div className="font-bold">BRAIN DRAIN</div>
                <div className="text-xs opacity-80">Steal 3% skilled pop + tech</div>
                <div className="text-xs opacity-60">Cost: 20 INTEL</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Scanline Effect */}
      <div 
        className="fixed inset-0 pointer-events-none z-10 opacity-25"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,255,255,0.06) 1px, rgba(0,0,0,0) 1px)',
          backgroundSize: '100% 3px'
        }}
      />
    </div>
  );
};

export default NoradVector;
