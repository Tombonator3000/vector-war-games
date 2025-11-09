import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import React from 'react';

const ensureActionMock = vi.fn(async () => true);
const registerStateListenerMock = vi.fn(() => vi.fn());
const publishStateMock = vi.fn();
const canExecuteMock = vi.fn(() => true);

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

class AudioContextMock {
  createGain() {
    return {
      connect() {},
      gain: { value: 1 },
    };
  }

  createBufferSource() {
    return {
      connect() {},
      start() {},
      stop() {},
      onended: null,
    };
  }

  decodeAudioData() {
    return Promise.resolve(null);
  }

  resume() {
    return Promise.resolve();
  }

  suspend() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }

  get destination() {
    return {};
  }

  addEventListener() {}

  removeEventListener() {}
}

vi.stubGlobal('AudioContext', AudioContextMock);
vi.stubGlobal('webkitAudioContext', AudioContextMock);

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/components/NewsTicker', () => ({
  NewsTicker: ({ items }: { items: unknown[] }) => (
    <div data-testid="news-ticker">{items.length}</div>
  ),
}));

vi.mock('@/components/PandemicPanel', () => ({
  PandemicPanel: () => <div data-testid="pandemic-panel" />,
}));

vi.mock('@/components/BioWarfareLab', () => ({
  BioWarfareLab: () => <div data-testid="bio-warfare-lab" />,
}));

vi.mock('@/components/FlashpointModal', () => ({
  FlashpointModal: () => null,
}));

vi.mock('@/components/GlobeScene', async () => {
  const ReactActual = await vi.importActual<typeof React>('react');
  const GlobeScene = ReactActual.forwardRef<any, any>((props, ref) => {
    ReactActual.useEffect(() => {
      if (typeof props.onPickerReady === 'function') {
        props.onPickerReady(() => null);
      }
      if (typeof props.onProjectorReady === 'function') {
        props.onProjectorReady(() => ({ x: 0, y: 0, visible: true }));
      }
    }, [props.onPickerReady, props.onProjectorReady]);

    if (typeof ref === 'function') {
      ref({
        overlayCanvas: document.createElement('canvas'),
        projectLonLat: () => ({ x: 0, y: 0, visible: true }),
        pickLonLat: () => null,
        fireMissile: vi.fn(() => 'mock-missile'),
        addExplosion: vi.fn(),
        clearMissiles: vi.fn(),
        clearExplosions: vi.fn(),
      });
    } else if (ref) {
      (ref as React.MutableRefObject<any>).current = {
        overlayCanvas: document.createElement('canvas'),
        projectLonLat: () => ({ x: 0, y: 0, visible: true }),
        pickLonLat: () => null,
        fireMissile: vi.fn(() => 'mock-missile'),
        addExplosion: vi.fn(),
        clearMissiles: vi.fn(),
        clearExplosions: vi.fn(),
      };
    }

    return <div data-testid="globe" />;
  });

  return {
    default: GlobeScene,
    PickerFn: () => null,
    ProjectorFn: () => null,
    DEFAULT_MAP_STYLE: { visual: 'realistic', mode: 'standard' },
  };
});

vi.mock('@/components/TutorialGuide', () => ({
  TutorialGuide: () => null,
}));

vi.mock('@/components/TutorialOverlay', () => ({
  TutorialOverlay: () => null,
}));

vi.mock('@/components/GameHelper', () => ({
  GameHelper: () => null,
}));

vi.mock('@/components/coop/CoopStatusPanel', () => ({
  CoopStatusPanel: () => <div data-testid="coop-status" />,
}));

vi.mock('@/components/coop/ApprovalQueue', () => ({
  ApprovalQueue: () => <div data-testid="approval-queue" />,
}));

vi.mock('@/components/coop/ConflictResolutionDialog', () => ({
  ConflictResolutionDialog: () => null,
}));

vi.mock('@/components/ConventionalForcesPanel', () => ({
  ConventionalForcesPanel: () => <div data-testid="conventional-panel" />,
}));

vi.mock('@/components/TerritoryMapPanel', () => ({
  TerritoryMapPanel: () => <div data-testid="territory-panel" />,
}));

vi.mock('@/components/MapModeBar', () => ({
  MapModeBar: () => <div data-testid="map-mode-bar" />,
}));

vi.mock('@/components/governance/GovernanceEventDialog', () => ({
  GovernanceEventDialog: () => null,
}));

vi.mock('@/components/governance/ElectionCountdownWidget', () => ({
  ElectionCountdownWidget: () => <div data-testid="election-widget" />,
}));

vi.mock('@/hooks/useFlashpoints', () => ({
  useFlashpoints: () => ({
    activeFlashpoint: null,
    triggerRandomFlashpoint: vi.fn(),
    resolveFlashpoint: vi.fn(),
    dismissFlashpoint: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFogOfWar', () => ({
  useFogOfWar: () => ({
    distortNationIntel: (nation: unknown) => nation,
    generateFalseIntel: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePandemic', () => ({
  usePandemic: () => ({
    pandemicState: { outbreaks: [], traits: {}, stage: 'STABLE' },
    triggerPandemic: vi.fn(),
    applyCountermeasure: vi.fn(),
    advancePandemicTurn: vi.fn(),
    upgradeTrait: vi.fn(),
    downgradeTrait: vi.fn(),
    resetTraits: vi.fn(),
    deployTraits: vi.fn(),
  }),
}));

vi.mock('@/hooks/useConventionalWarfare', () => ({
  useConventionalWarfare: () => ({
    state: {},
    units: [],
    territories: [],
    templates: {},
    logs: [],
    trainUnit: vi.fn(),
    deployUnit: vi.fn(),
    resolveBorderConflict: vi.fn(),
    resolveProxyEngagement: vi.fn(),
    getUnitsForNation: vi.fn(() => []),
  }),
  createDefaultConventionalState: () => ({ units: {}, territories: {} }),
  createDefaultNationConventionalProfile: () => ({
    readiness: 75,
    reserve: 2,
    professionalism: 55,
    tradition: 55,
    focus: 'army',
    deployedUnits: [],
  }),
}));

vi.mock('@/hooks/useCyberWarfare', () => ({
  useCyberWarfare: () => ({
    getActionAvailability: vi.fn(() => ({ canExecute: true, cost: 0 })),
    launchAttack: vi.fn(),
    launchFalseFlag: vi.fn(),
    hardenNetworks: vi.fn(),
    advanceTurn: vi.fn(),
    runAiPlan: vi.fn(),
  }),
  createDefaultNationCyberProfile: () => ({}),
  applyCyberResearchUnlock: vi.fn(),
}));

vi.mock('@/hooks/useGovernance', () => ({
  useGovernance: () => ({
    metrics: {
      player: {
        morale: 50,
        electionTimer: 10,
        publicOpinion: 50,
        cabinetApproval: 50,
      },
    },
    activeEvent: null,
    selectOption: vi.fn(),
    dismissEvent: vi.fn(),
  }),
  calculateMoraleProductionMultiplier: () => 1,
  calculateMoraleRecruitmentModifier: () => 0,
}));

vi.mock('@/hooks/useTutorial', () => ({
  useTutorial: () => ({
    showTutorial: false,
    handleComplete: vi.fn(),
    handleSkip: vi.fn(),
  }),
}));

vi.mock('@/components/setup/LeaderSelectionScreen', () => ({
  LeaderSelectionScreen: ({ onSelectLeader }: { onSelectLeader: (name: string) => void }) => (
    <div>
      <button onClick={() => onSelectLeader('Ronnie Raygun')}>Ronnie Raygun</button>
      <button onClick={() => onSelectLeader('Fidel Castro')}>Fidel Castro</button>
    </div>
  ),
}));

vi.mock('@/contexts/TutorialContext', () => ({
  useTutorialContext: () => ({
    showTutorial: false,
    currentStep: null,
    advanceStep: vi.fn(),
    resetTutorial: vi.fn(),
  }),
}));

vi.mock('@/contexts/RNGContext', () => ({
  useRNG: () => ({
    random: () => 0.5,
    seed: 'test-seed',
    reseed: vi.fn(),
  }),
}));

vi.mock('@/contexts/MultiplayerProvider', () => ({
  useMultiplayer: () => ({
    ensureAction: ensureActionMock,
    registerStateListener: registerStateListenerMock,
    publishState: publishStateMock,
    canExecute: canExecuteMock,
  }),
}));

import Index from '@/pages/Index';

describe('Index co-op toggle', () => {
  beforeEach(() => {
    ensureActionMock.mockClear();
    registerStateListenerMock.mockImplementation(() => vi.fn());
    publishStateMock.mockClear();
    canExecuteMock.mockReturnValue(true);
    window.localStorage.clear();
  });

  it('bypasses approval requests when co-op is disabled', async () => {
    window.localStorage.setItem('norad_option_coop_enabled', 'false');

    render(<Index />);

    fireEvent.click(await screen.findByRole('button', { name: /start game/i }));
    fireEvent.click(await screen.findByText('Ronnie Raygun'));

    const buildButton = await screen.findByRole('button', { name: /^build$/i });
    fireEvent.click(buildButton);

    expect(ensureActionMock).not.toHaveBeenCalled();
    const modalHeading = await screen.findByText('STRATEGIC PRODUCTION');
    expect(modalHeading).toBeTruthy();
  });

  it('allows activating a leader ability and updates panel state', async () => {
    window.localStorage.setItem('norad_option_coop_enabled', 'false');

    render(<Index />);

    fireEvent.click(await screen.findByRole('button', { name: /start game/i }));
    fireEvent.click(await screen.findByText('Fidel Castro'));

    const activateButton = await screen.findByRole('button', { name: /activate ability/i });
    expect((activateButton as HTMLButtonElement).disabled).toBe(false);
    await screen.findByText(/2\s*\/\s*2/);

    fireEvent.click(activateButton);

    const dialog = await screen.findByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: /^activate$/i });
    fireEvent.click(confirmButton);

    await screen.findByText(/1\s*\/\s*2/);
    await screen.findAllByText(/10 turns/i);
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /activate ability/i }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });
});
