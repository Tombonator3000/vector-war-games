import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react';
import React from 'react';
import { PlayerManager } from '@/state';
import { toast } from '@/components/ui/use-toast';

const toastMock = toast as unknown as ReturnType<typeof vi.fn>;

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

vi.mock('@/components/BioWarfareLab', () => {
  const BioWarfareLab = ({ open }: { open: boolean }) => (
    <div data-testid="bio-warfare-lab" data-open={open ? 'true' : 'false'} />
  );

  return {
    BioWarfareLab,
  };
});

vi.mock('@/components/SimplifiedBioWarfarePanel', () => ({
  SimplifiedBioWarfarePanel: () => <div data-testid="simplified-bio-panel" />,
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/hooks/useBioWarfare', async () => {
  const ReactActual = await vi.importActual<typeof React>('react');

  type LabFacility = {
    tier: number;
    active: boolean;
    underConstruction: boolean;
    constructionProgress: number;
    constructionTarget: number;
    targetTier: number;
    productionInvested: number;
    uraniumInvested: number;
    suspicionLevel: number;
    knownByNations: string[];
    lastIntelAttempt: number;
    researchSpeed: number;
    sabotaged: boolean;
    sabotageTurnsRemaining: number;
  };

  const createLabFacility = (tier: number): LabFacility => ({
    tier,
    active: tier > 0,
    underConstruction: false,
    constructionProgress: 0,
    constructionTarget: 0,
    targetTier: tier,
    productionInvested: 0,
    uraniumInvested: 0,
    suspicionLevel: 0,
    knownByNations: [],
    lastIntelAttempt: 0,
    researchSpeed: 1,
    sabotaged: false,
    sabotageTurnsRemaining: 0,
  });

  const basePlagueState = {
    plagueStarted: false,
    dnaPoints: 0,
    calculatedStats: {
      totalInfectivity: 0,
      totalSeverity: 0,
      totalLethality: 0,
      cureResistance: 0,
      vaccineAcceleration: 0,
      radiationMitigation: 0,
    },
    unlockedNodes: new Set<string>(),
    selectedPlagueType: null,
    deploymentHistory: [],
    countryInfections: new Map(),
    plagueCompletionStats: {
      totalKills: 0,
      peakInfection: 0,
      nationsInfected: 0,
    },
  };

  let labFacilityState = createLabFacility(2);
  const labSubscribers = new Set<ReactActual.Dispatch<ReactActual.SetStateAction<LabFacility>>>();

  const selectPlagueType = vi.fn();
  const evolveNode = vi.fn();
  const devolveNode = vi.fn();
  const deployBioWeapon = vi.fn();

  const useBioWarfare = () => {
    const [labFacility, setLabFacility] = ReactActual.useState<LabFacility>(labFacilityState);

    ReactActual.useEffect(() => {
      labSubscribers.add(setLabFacility);
      return () => {
        labSubscribers.delete(setLabFacility);
      };
    }, []);

    return {
      pandemicState: { outbreaks: [], traits: {}, stage: 'STABLE' },
      plagueState: basePlagueState,
      labFacility,
      applyCountermeasure: vi.fn(),
      selectPlagueType,
      evolveNode,
      devolveNode,
      addDNAPoints: vi.fn(),
      startLabConstruction: vi.fn(),
      cancelLabConstruction: vi.fn(),
      getConstructionOptions: vi.fn(() => []),
      deployBioWeapon,
      triggerBioWarfare: vi.fn(),
      advanceBioWarfareTurn: vi.fn(),
      onCountryInfected: vi.fn(),
      availableNodes: [],
      calculateSpreadModifiers: vi.fn(),
    };
  };

  const setLabTier = (tier: number) => {
    labFacilityState = { ...labFacilityState, tier };
    labSubscribers.forEach(setState => {
      setState(prev => ({ ...prev, tier }));
    });
  };

  const resetLabMock = () => {
    labFacilityState = createLabFacility(2);
    labSubscribers.forEach(setState => {
      setState(() => labFacilityState);
    });
  };

  return {
    useBioWarfare,
    __setLabTier: setLabTier,
    __resetLabMock: resetLabMock,
  };
});

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

vi.mock('@/hooks/usePandemic', () => {
  let pandemicState = {
    outbreaks: [],
    traits: {},
    stage: 'STABLE',
    casualtyTally: 0,
  };

  const usePandemic = (_addNewsItem: unknown, _rng: unknown) => ({
    pandemicState,
    triggerPandemic: vi.fn(),
    applyCountermeasure: vi.fn(),
    advancePandemicTurn: vi.fn(),
    upgradeTrait: vi.fn(),
    downgradeTrait: vi.fn(),
    resetTraits: vi.fn(),
    deployTraits: vi.fn(),
  });

  const setPandemicCasualties = (value: number) => {
    pandemicState = { ...pandemicState, casualtyTally: value };
  };

  const resetPandemicMock = () => {
    pandemicState = { ...pandemicState, casualtyTally: 0 };
  };

  return {
    usePandemic,
    __setPandemicCasualties: setPandemicCasualties,
    __resetPandemicMock: resetPandemicMock,
  };
});

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

let lastLeaderSelectHandler: ((leader: string) => void) | null = null;

vi.mock('@/components/setup/LeaderSelectionScreen', () => ({
  LeaderSelectionScreen: ({ onSelectLeader }: { onSelectLeader: (name: string) => void }) => {
    lastLeaderSelectHandler = onSelectLeader;
    return (
      <div>
        <button onClick={() => onSelectLeader('Ronnie Raygun')}>Ronnie Raygun</button>
        <button onClick={() => onSelectLeader('Fidel Castro')}>Fidel Castro</button>
      </div>
    );
  },
}));

vi.mock('@/contexts/TutorialContext', () => ({
  useTutorialContext: () => ({
    showTutorial: false,
    currentStep: null,
    advanceStep: vi.fn(),
    resetTutorial: vi.fn(),
  }),
}));

const rngSequence = [0.17, 0.83, 0.42, 0.67];
let rngIndex = 0;
const baseSeed = 1337;

const nextValue = () => {
  const value = rngSequence[rngIndex % rngSequence.length];
  rngIndex += 1;
  return value;
};

const rngMock: any = {
  next: vi.fn(() => nextValue()),
};

rngMock.nextInt = vi.fn((min: number, max: number) => {
  const value = rngMock.next();
  return Math.floor(value * (max - min + 1)) + min;
});
rngMock.nextBool = vi.fn((probability: number = 0.5) => rngMock.next() < probability);
rngMock.choice = vi.fn(<T,>(array: T[]) => {
  if (array.length === 0) {
    throw new Error('Cannot choose from empty array');
  }
  const index = Math.floor(rngMock.next() * array.length) % array.length;
  return array[index];
});
rngMock.shuffle = vi.fn(<T,>(array: T[]) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rngMock.next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
});
rngMock.nextGaussian = vi.fn((mean: number = 0, stdDev: number = 1) => mean + stdDev * (rngMock.next() - 0.5));
rngMock.nextRange = vi.fn((min: number, max: number) => rngMock.next() * (max - min) + min);
rngMock.getSeed = vi.fn(() => baseSeed);
rngMock.getState = vi.fn(() => rngIndex);
rngMock.setState = vi.fn((state: number) => {
  rngIndex = state;
});
rngMock.reset = vi.fn(() => {
  rngIndex = 0;
});
rngMock.clone = vi.fn(() => rngMock);

const resetRNGMock = vi.fn(() => {
  rngIndex = 0;
});
const reseedRNGMock = vi.fn((_seed: number) => {
  rngIndex = 0;
});
const getRNGStateMock = vi.fn(() => ({ seed: baseSeed, state: rngIndex }));
const setRNGStateMock = vi.fn((_seed: number, state: number) => {
  rngIndex = state;
});

vi.mock('@/contexts/RNGContext', () => ({
  useRNG: () => ({
    rng: rngMock,
    resetRNG: resetRNGMock,
    reseedRNG: reseedRNGMock,
    getRNGState: getRNGStateMock,
    setRNGState: setRNGStateMock,
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
  beforeEach(async () => {
    ensureActionMock.mockClear();
    registerStateListenerMock.mockImplementation(() => vi.fn());
    publishStateMock.mockClear();
    canExecuteMock.mockReturnValue(true);
    window.localStorage.clear();
    // Provide minimal world map data so Index doesn't attempt network fetch
    // Storage helper prefixes keys with 'norad_'
    window.localStorage.setItem(
      'norad_offlineTopo110m-v2',
      JSON.stringify({ type: 'FeatureCollection', features: [] }),
    );
    PlayerManager.reset();
    PlayerManager.setNations([] as any);
    toastMock.mockClear();
    lastLeaderSelectHandler = null;

    rngIndex = 0;
    rngMock.next.mockClear();
    rngMock.nextInt.mockClear();
    rngMock.nextBool.mockClear();
    rngMock.choice.mockClear();
    rngMock.shuffle.mockClear();
    rngMock.nextGaussian.mockClear();
    rngMock.nextRange.mockClear();
    rngMock.getSeed.mockClear();
    rngMock.getState.mockClear();
    rngMock.setState.mockClear();
    rngMock.reset.mockClear();
    rngMock.clone.mockClear();
    resetRNGMock.mockClear();
    reseedRNGMock.mockClear();
    getRNGStateMock.mockClear();
    setRNGStateMock.mockClear();

    const bioWarfareModule = await import('@/hooks/useBioWarfare');
    (bioWarfareModule as any).__resetLabMock?.();

    const pandemicModule = await import('@/hooks/usePandemic');
    (pandemicModule as any).__resetPandemicMock?.();
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

    // Open the leader overview dialog via the dock button
    const leaderDockButton = await screen.findByRole('button', { name: /leader/i });
    fireEvent.click(leaderDockButton);

    const activateButton = await screen.findByRole('button', { name: /activate ability/i });
    expect((activateButton as HTMLButtonElement).disabled).toBe(false);
    await screen.findByText(/2\s*\/\s*2/);

    fireEvent.click(activateButton);

    const dialogs = await screen.findAllByRole('dialog');
    const confirmDialog = dialogs.find(d => within(d).queryByRole('button', { name: /^activate$/i }));
    expect(confirmDialog).toBeTruthy();
    const confirmButton = within(confirmDialog!).getByRole('button', { name: /^activate$/i });
    fireEvent.click(confirmButton);

    // Dialog closes after activation; re-open to verify state
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /activate ability/i })).toBeNull();
    });

    const reopenButton = await screen.findByRole('button', { name: /leader/i });
    fireEvent.click(reopenButton);

    await screen.findByText(/1\s*\/\s*2/);
    await screen.findAllByText(/10 turns/i);
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /activate ability/i }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });

  it('resets RNG sequence when starting consecutive campaigns', async () => {
    window.localStorage.setItem('norad_option_coop_enabled', 'false');

    render(<Index />);

    fireEvent.click(await screen.findByRole('button', { name: /start game/i }));

    expect(typeof lastLeaderSelectHandler).toBe('function');

    act(() => {
      lastLeaderSelectHandler?.('Ronnie Raygun');
    });

    const firstDraw = rngMock.next();

    act(() => {
      lastLeaderSelectHandler?.('Ronnie Raygun');
    });

    expect(resetRNGMock).toHaveBeenCalledTimes(2);

    const secondDraw = rngMock.next();

    expect(secondDraw).toBe(firstDraw);

    const thirdDraw = rngMock.next();
    expect(thirdDraw).not.toBe(firstDraw);
  });

  it('auto-opens advanced bio lab when facility reaches tier 3', async () => {
    window.localStorage.setItem('norad_option_coop_enabled', 'false');
    window.localStorage.setItem('option_pandemic_integration', 'true');
    window.localStorage.setItem('option_biowarfare_conquest', 'true');

    render(<Index />);

    fireEvent.click(await screen.findByRole('button', { name: /start game/i }));
    fireEvent.click(await screen.findByText('Ronnie Raygun'));

    await waitFor(() => {
      expect(PlayerManager.get()).not.toBeNull();
    });

    const bioWarfareModule = await import('@/hooks/useBioWarfare');
    const setLabTier = (bioWarfareModule as any).__setLabTier as (tier: number) => void;

    await act(async () => {
      setLabTier(3);
    });

    await waitFor(() => {
      const labs = screen.getAllByTestId('bio-warfare-lab');
      const openLab = labs.find(el => el.getAttribute('data-open') === 'true');
      expect(openLab).toBeTruthy();
    });

    expect(screen.queryByTestId('simplified-bio-panel')).toBeNull();
    expect(toastMock).toHaveBeenCalled();
    expect(PlayerManager.get()?.bioLab?.tier).toBe(3);
  });

  it('renders the global casualty badge when casualties accrue', async () => {
    window.localStorage.setItem('norad_option_coop_enabled', 'false');

    const pandemicModule = await import('@/hooks/usePandemic');
    (pandemicModule as any).__setPandemicCasualties?.(1_500_000);

    render(<Index />);

    fireEvent.click(await screen.findByRole('button', { name: /start game/i }));
    fireEvent.click(await screen.findByText('Ronnie Raygun'));

    const casualtyBadge = await screen.findByRole('status', {
      name: /global casualties 1,500,000/i,
    });

    expect(casualtyBadge.textContent).toMatch(/casualties/i);
  });
});
