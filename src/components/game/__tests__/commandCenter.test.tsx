import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PlayerManager, GameStateManager } from '@/state';
import type { Nation } from '@/types/game';
import { MAX_DEFENSE_LEVEL } from '@/lib/nuclearDamage';
import { getQueueProgress, getResourceShortfall, shouldIgnoreGameShortcut } from '@/lib/commandPresentation';
import { BuildModal } from '../BuildModal';
import { ResearchModal } from '../ResearchModal';
import { TurnControl } from '../TurnControl';
import { TurnBriefing } from '../TurnBriefing';
import { CommandDock } from '../CommandDock';

function createNation(): Nation {
  return {
    id: 'player', isPlayer: true, name: 'Test nation', leader: 'Test leader', lon: 0, lat: 0,
    color: '#fff', population: 100, production: 100, uranium: 100, intel: 100,
    missiles: 1, bombers: 0, defense: 0, cities: 1, warheads: {}, researched: {},
    resourceStockpile: { oil: 50, uranium: 100, rare_earths: 40, food: 60 },
  };
}
function handlers() {
  return { buildMissile: vi.fn(), buildBomber: vi.fn(), buildCity: vi.fn(), buildDefense: vi.fn(), buildWarhead: vi.fn() };
}
beforeEach(() => { GameStateManager.reset(); PlayerManager.setNations([createNation()]); GameStateManager.setPhase('PLAYER'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('production decisions', () => {
  it('shows the strategic stockpile and blocks a repeat city order', () => {
    const player = PlayerManager.get()!;
    player.cityConstructionQueue = { turnsRemaining: 2, totalTurns: 3 };
    const callbacks = handlers();
    render(<BuildModal isGameStarted {...callbacks} />);
    const city = screen.getByRole('button', { name: 'Build city #2' }) as HTMLButtonElement;
    expect(city.disabled).toBe(true);
    expect(screen.getByText(/City construction already running/)).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'City #2' }).getAttribute('aria-valuenow')).toBe('33');
    fireEvent.click(city);
    expect(callbacks.buildCity).not.toHaveBeenCalled();
  });

  it('offers affordable orders, explains shortfalls and respects the defense cap', () => {
    const player = PlayerManager.get()!;
    player.production = 8;
    player.defense = MAX_DEFENSE_LEVEL;
    player.researched = { defense_grid: true };
    player.resourceStockpile!.uranium = 0;
    const callbacks = handlers();
    render(<BuildModal isGameStarted {...callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: 'Build missile' }));
    expect(callbacks.buildMissile).toHaveBeenCalledOnce();
    expect((screen.getByRole('button', { name: 'Build bomber' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Need 12 more production')).toBeTruthy();
    expect(screen.getByText('Defense grid is at maximum capacity.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Assemble 10MT warhead' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Need 5 more uranium')).toBeTruthy();
  });

  it('does not issue orders outside the player phase', () => {
    GameStateManager.setPhase('AI');
    render(<BuildModal isGameStarted {...handlers()} />);
    expect((screen.getByRole('button', { name: 'Build missile' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('research workspace', () => {
  it('searches canonical programs and starts the selected project', () => {
    const start = vi.fn();
    render(<ResearchModal startResearch={start} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search programs' }), { target: { value: 'Improved Fission' } });
    expect(screen.getByText('1 program shown')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start Improved Fission Packages' }));
    expect(start).toHaveBeenCalledWith('warhead_20');
  });

  it('keeps the queue visible and blocks new starts while a project runs', () => {
    const player = PlayerManager.get()!;
    player.researchQueue = { projectId: 'warhead_20', turnsRemaining: 1, totalTurns: 2 };
    render(<ResearchModal startResearch={vi.fn()} />);
    expect(screen.getByRole('progressbar', { name: 'Improved Fission Packages' }).getAttribute('aria-valuenow')).toBe('50');
    expect((screen.getByRole('button', { name: 'Start Improved Fission Packages' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Program status'), { target: { value: 'completed' } });
    expect(screen.getByText(/No matching programs/)).toBeTruthy();
  });

  it('disables research during opponent turns', () => {
    GameStateManager.setPhase('AI');
    render(<ResearchModal startResearch={vi.fn()} />);
    expect((screen.getByRole('button', { name: 'Start Improved Fission Packages' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('turn controls and briefing', () => {
  const base = { turn: 3, phase: 'PLAYER' as const, actionsRemaining: 2, paused: false, gameOver: false };

  it('reviews unused actions, supports cancellation and confirms once', () => {
    const end = vi.fn();
    render(<TurnControl {...base} onEndTurn={end} researchIdle />);
    fireEvent.click(screen.getByRole('button', { name: 'End turn' }));
    expect(end).not.toHaveBeenCalled();
    expect(screen.getByText(/2 unused actions/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue planning' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'End turn' }));
    fireEvent.click(screen.getByRole('button', { name: 'End turn anyway' }));
    expect(end).toHaveBeenCalledOnce();
  });

  it('ends directly when actions are exhausted and disables during resolution or pause', () => {
    const end = vi.fn();
    const view = render(<TurnControl {...base} actionsRemaining={0} onEndTurn={end} />);
    fireEvent.click(screen.getByRole('button', { name: 'End turn' }));
    expect(end).toHaveBeenCalledOnce();
    view.rerender(<TurnControl {...base} phase="RESOLUTION" onEndTurn={end} />);
    expect((screen.getByRole('button', { name: 'End turn' }) as HTMLButtonElement).disabled).toBe(true);
    view.rerender(<TurnControl {...base} paused onEndTurn={end} />);
    expect((screen.getByRole('button', { name: 'End turn' }) as HTMLButtonElement).disabled).toBe(true);
    view.rerender(<TurnControl {...base} gameOver revealPending onEndTurn={end} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show outcome' }));
    expect(end).toHaveBeenCalledTimes(2);
  });

  it('preserves event entries when the briefing is collapsed and re-rendered', () => {
    const nation = createNation();
    const view = render(<TurnBriefing nation={nation} onResearch={vi.fn()} onBuild={vi.fn()} />);
    const log = document.getElementById('log')!;
    log.appendChild(Object.assign(document.createElement('div'), { textContent: 'City complete' }));
    const toggle = screen.getByRole('button', { name: /Briefing & events/ });
    fireEvent.click(toggle);
    expect(within(screen.getByRole('log')).getByText('City complete')).toBeTruthy();
    fireEvent.click(toggle);
    view.rerender(<TurnBriefing nation={{ ...nation, production: 80 }} onResearch={vi.fn()} onBuild={vi.fn()} />);
    fireEvent.click(toggle);
    expect(screen.getByText('City complete')).toBeTruthy();
  });

  it('keeps co-op requests clickable and exposes secondary actions through More', () => {
    const build = vi.fn(), leader = vi.fn();
    render(<CommandDock actions={[{ id: 'build', onSelect: build, roleLocked: true }, { id: 'leader', onSelect: leader }]} turn={{ ...base, onEndTurn: vi.fn() }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Build' }));
    expect(build).toHaveBeenCalledOnce();
    fireEvent.keyDown(screen.getByRole('button', { name: 'More' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Leader' }));
    expect(leader).toHaveBeenCalledOnce();
  });
});

describe('presentation safety', () => {
  it('uses strategic stocks rather than stale legacy resource mirrors', () => {
    const nation = createNation();
    nation.resourceStockpile!.uranium = 3;
    nation.resourceStockpile!.rare_earths = 2;
    expect(getResourceShortfall(nation, { uranium: 5, rare_earths: 8 })).toBe('Need 2 more uranium and 6 more rare earths');
  });

  it('clamps malformed queue progress', () => {
    expect(getQueueProgress({ totalTurns: 0, turnsRemaining: 0 })).toBe(0);
    expect(getQueueProgress({ totalTurns: 3, turnsRemaining: -2 })).toBe(100);
    expect(getQueueProgress({ totalTurns: 3, turnsRemaining: 8 })).toBe(0);
  });

  it('lets typing and modal decisions consume their own keys', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const typing = new KeyboardEvent('keydown', { key: '1', bubbles: true });
    input.dispatchEvent(typing);
    expect(shouldIgnoreGameShortcut(typing)).toBe(true);
    input.remove();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    expect(shouldIgnoreGameShortcut(new KeyboardEvent('keydown', { key: '7' }))).toBe(true);
    dialog.remove();
    expect(shouldIgnoreGameShortcut(new KeyboardEvent('keydown', { key: '1' }))).toBe(false);
    expect(shouldIgnoreGameShortcut(new KeyboardEvent('keydown', { key: '1', ctrlKey: true }))).toBe(true);
  });
});
