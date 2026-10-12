import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import '@/styles/command-center.css';
import { CommandDock } from '@/components/game/CommandDock';
import { CommandStatus } from '@/components/game/CommandStatus';
import { TurnBriefing } from '@/components/game/TurnBriefing';
import { BuildModal } from '@/components/game/BuildModal';
import { ResearchModal } from '@/components/game/ResearchModal';
import { MapModeBar } from '@/components/MapModeBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCommandHudLayout } from '@/hooks/game/useCommandHudLayout';
import { GameStateManager, PlayerManager } from '@/state';
import type { GameState, Nation } from '@/types/game';
import type { MapMode } from '@/components/GlobeScene';
import { buildMissileExtracted, buildBomberExtracted, buildDefenseExtracted, buildCityExtracted, buildWarheadExtracted, type BuildHandlerDependencies } from '@/lib/buildHandlers';
import { startResearch, advanceResearch, advanceCityConstruction } from '@/lib/researchHandlers';

const player: Nation = {
  id: 'player', name: 'United States', leader: 'Test leader', isPlayer: true,
  lat: 38, lon: -98, color: '#22d3ee', population: 100, production: 100, intel: 100, uranium: 100,
  missiles: 1, bombers: 0, defense: 0, warheads: {}, researched: {}, cities: 1,
  resourceStockpile: { oil: 50, uranium: 100, rare_earths: 40, food: 100 },
};
GameStateManager.reset();
PlayerManager.setNations([player]);
GameStateManager.setPhase('PLAYER');
GameStateManager.setDefcon(3);
GameStateManager.setActionsRemaining(2);
let snapshot: () => { turn: number; phase: string; actions: number; production: number; research: Nation['researchQueue']; construction: Nation['cityConstructionQueue']; completed: boolean };
declare global { interface Window { commandSmoke: { snapshot: typeof snapshot; phase: (value: GameState['phase']) => void; theme: (value: string) => void }; } }

function Fixture() {
  const ref = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);
  const [modal, setModal] = useState<'build' | 'research' | 'leader' | null>(null);
  const [mode, setMode] = useState<MapMode>('standard');
  useCommandHudLayout(ref, true);
  const update = () => setTick(value => value + 1);
  const close = () => setModal(null);
  const state = GameStateManager.getState();
  const deps: BuildHandlerDependencies = {
    S: state, isGameStarted: true, AudioSys: { playSFX: () => {} }, log: message => {
      const entry = document.createElement('div'); entry.textContent = message; document.getElementById('log')?.appendChild(entry);
    },
    updateDisplay: update, consumeAction: () => { GameStateManager.consumeAction(); update(); }, closeModal: close,
    openModal: () => {}, requestApproval: async () => true, setCivInfoDefaultTab: () => {}, setCivInfoPanelOpen: () => {},
  };
  const researchDeps = { ...deps, PlayerManager, toast: () => {} };
  const end = () => {
    advanceResearch(player, 'PRODUCTION', researchDeps);
    advanceCityConstruction(player, 'PRODUCTION', researchDeps);
    GameStateManager.nextTurn(); GameStateManager.setActionsRemaining(2); update();
  };
  useEffect(() => {
    window.commandSmoke = {
      snapshot: () => ({ turn: state.turn, phase: state.phase, actions: state.actionsRemaining, production: player.production, research: player.researchQueue, construction: player.cityConstructionQueue, completed: !!player.researched?.warhead_20 }),
      phase: value => { GameStateManager.setPhase(value); update(); },
      theme: value => { document.body.className = `theme-${value}`; },
    };
  });
  return (
    <TooltipProvider>
      <div className="command-interface command-interface--compact command-center" ref={ref}>
        <div className="map-shell" style={{ background: 'radial-gradient(ellipse at 55% 40%, #10425c, #020610 65%)' }} />
        <div className="game-top-stack">
          <header className="game-top-bar">
            <CommandStatus state={state} nation={player} date="October 1962" />
            <div className="game-top-bar__actions"><MapModeBar mode={mode} onModeChange={setMode} /></div>
          </header>
          <div className="game-top-ticker text-xs">NORAD · Strategic command · Situation stable</div>
        </div>
        <TurnBriefing nation={player} onBuild={() => setModal('build')} onResearch={() => setModal('research')} />
        <CommandDock actions={[
          { id: 'build', onSelect: () => setModal('build') },
          { id: 'research', onSelect: () => setModal('research') },
          { id: 'intel', onSelect: () => {} }, { id: 'diplomacy', onSelect: () => {} },
          { id: 'leader', onSelect: () => setModal('leader') },
          { id: 'satcom', onSelect: () => {} }, { id: 'attack', onSelect: () => {} },
        ]} turn={{ turn: state.turn, phase: state.phase, actionsRemaining: state.actionsRemaining, paused: state.paused, gameOver: state.gameOver, onEndTurn: end, researchIdle: !player.researchQueue }} />
        <Dialog open={modal !== null} onOpenChange={open => { if (!open) close(); }}>
          <DialogContent className="max-w-6xl">
            <DialogHeader><DialogTitle>{modal === 'build' ? 'Strategic production' : modal === 'research' ? 'Research programs' : 'Leader abilities'}</DialogTitle><DialogDescription>Issue and review strategic orders.</DialogDescription></DialogHeader>
            {modal === 'build' && <BuildModal isGameStarted buildMissile={() => buildMissileExtracted(deps)} buildBomber={() => buildBomberExtracted(deps)} buildCity={() => buildCityExtracted(deps)} buildDefense={() => buildDefenseExtracted(deps)} buildWarhead={yieldMT => buildWarheadExtracted(yieldMT, deps)} />}
            {modal === 'research' && <ResearchModal closeModal={close} startResearch={id => startResearch(id, researchDeps)} />}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
