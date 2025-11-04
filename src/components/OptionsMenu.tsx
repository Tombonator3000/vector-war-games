/**
 * OptionsMenu Component
 *
 * Unified options menu that can be used both in-game and on the start screen.
 * Manages its own state via localStorage to stay in sync across contexts.
 */

import { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { CoopStatusPanel } from '@/components/coop/CoopStatusPanel';
import { GameDatabase } from '@/components/GameDatabase';
import { ComprehensiveTutorial } from '@/components/ComprehensiveTutorial';
import type { MapStyle } from '@/components/GlobeScene';
import { BookOpen, GraduationCap } from 'lucide-react';

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
      // Silent failure - localStorage may be disabled or full
    }
  },
};

type ThemeId =
  | 'synthwave'
  | 'retro80s'
  | 'wargames'
  | 'nightmode'
  | 'highcontrast'
  | 'vectorclassic';

type LayoutDensity = 'expanded' | 'compact' | 'minimal';
type ScreenResolution = 'auto' | '1280x720' | '1600x900' | '1920x1080' | '2560x1440' | '3840x2160';

const MUSIC_TRACKS = [
  { id: 'vector-command', title: 'Vector Command Briefing', file: '/Muzak/vector-command.mp3' },
  { id: 'night-operations', title: 'Night Operations', file: '/Muzak/night-operations.mp3' },
  { id: 'diplomatic-channel', title: 'Diplomatic Channel', file: '/Muzak/diplomatic-channel.mp3' },
  { id: 'tactical-escalation', title: 'Tactical Escalation', file: '/Muzak/tactical-escalation.mp3' },
  { id: 'cthulhu-1', title: 'Church of Cthulhu I', file: '/Muzak/Church of Cthulhu 1.mp3' },
  { id: 'cthulhu-2', title: 'Church of Cthulhu II', file: '/Muzak/Church of Cthulhu 2.mp3' }
] as const;

type MusicTrack = (typeof MUSIC_TRACKS)[number];
type MusicTrackId = MusicTrack['id'];

const themeOptions: { id: ThemeId; label: string }[] = [
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'retro80s', label: 'Retro 80s' },
  { id: 'wargames', label: 'WARGAMES' },
  { id: 'nightmode', label: 'Night Mode' },
  { id: 'highcontrast', label: 'High Contrast' },
  { id: 'vectorclassic', label: 'Vector (Classic)' }
];

const MAP_STYLE_OPTIONS: { value: MapStyle; label: string; description: string }[] = [
  { value: 'realistic', label: 'Realistic', description: 'Satellite imagery with terrain overlays.' },
  { value: 'wireframe', label: 'Wireframe', description: 'Vector borders and topography outlines.' },
  { value: 'night', label: 'Night Lights', description: 'City illumination against a dark globe.' },
  { value: 'nightlights', label: 'Nightlights', description: 'NASA Black Marble - Earth at night imagery.' },
  { value: 'flat-nightlights', label: 'Flat Nightlights', description: 'Flat 2D NASA Black Marble nightlights map.' },
  { value: 'topo', label: 'Topographic', description: 'NASA topographic and bathymetric relief map.' },
  { value: 'political', label: 'Political', description: 'Colored territorial boundaries and claims.' },
  { value: 'flat', label: 'Flat', description: 'Orthographic projection with a 2D world canvas.' },
  {
    value: 'flat-realistic',
    label: 'Flat Realistic',
    description: 'High-resolution satellite texture rendered on the flat map.',
  },
];

const VIEWER_OPTIONS: { value: 'threejs' | 'cesium'; label: string; description: string }[] = [
  {
    value: 'threejs',
    label: 'Classic',
    description: 'Three.js tactical globe with retro vector styling.',
  },
  {
    value: 'cesium',
    label: 'Cesium',
    description: 'Photorealistic Cesium globe with geospatial overlays.',
  },
];

const RESOLUTION_OPTIONS: { value: ScreenResolution; label: string; description: string; width?: number; height?: number }[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Responsive - fits available screen space.',
  },
  {
    value: '1280x720',
    label: '1280x720',
    description: 'HD - Lower performance demand, higher framerate.',
    width: 1280,
    height: 720,
  },
  {
    value: '1600x900',
    label: '1600x900',
    description: 'HD+ - Balanced clarity and performance.',
    width: 1600,
    height: 900,
  },
  {
    value: '1920x1080',
    label: '1920x1080',
    description: 'Full HD - 1080p standard. Recommended for most users.',
    width: 1920,
    height: 1080,
  },
  {
    value: '2560x1440',
    label: '2560x1440',
    description: 'QHD - High detail rendering for powerful systems.',
    width: 2560,
    height: 1440,
  },
  {
    value: '3840x2160',
    label: '3840x2160',
    description: '4K UHD - Maximum visual fidelity, very demanding.',
    width: 3840,
    height: 2160,
  },
];

const layoutDensityOptions: { id: LayoutDensity; label: string; description: string }[] = [
  {
    id: 'expanded',
    label: 'Expanded',
    description: 'Full briefing overlay with maximum telemetry panels.',
  },
  {
    id: 'compact',
    label: 'Compact',
    description: 'Slimmed panels that free up more of the strategic map.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Ultralight HUD that keeps essentials while spotlighting the globe.',
  },
];

export interface OptionsMenuProps {
  /** Optional external theme state control */
  theme?: ThemeId;
  onThemeChange?: (theme: ThemeId) => void;

  /** Controlled map style selection */
  mapStyle: MapStyle;
  onMapStyleChange: (style: MapStyle) => void;

  /** Controlled globe viewer selection */
  viewerType: 'threejs' | 'cesium';
  onViewerTypeChange: (type: 'threejs' | 'cesium') => void;

  /** Whether to show in-game only features (like co-op, HUD layout) */
  showInGameFeatures?: boolean;

  /** Optional callback when options change */
  onChange?: () => void;

  /** Current game turn for database feature unlocking */
  currentTurn?: number;
}

export function OptionsMenu({
  theme: externalTheme,
  onThemeChange,
  mapStyle,
  onMapStyleChange,
  viewerType,
  onViewerTypeChange,
  showInGameFeatures = true,
  onChange,
  currentTurn = 1,
}: OptionsMenuProps) {
  // Theme state
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (externalTheme) return externalTheme;
    const stored = Storage.getItem('theme');
    if (stored && themeOptions.find(opt => opt.id === stored)) {
      return stored as ThemeId;
    }
    return 'synthwave';
  });

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme);
    Storage.setItem('theme', newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
    if (onChange) {
      onChange();
    }
  }, [onThemeChange, onChange]);

  useEffect(() => {
    Storage.setItem('map_style', mapStyle);
  }, [mapStyle]);

  useEffect(() => {
    Storage.setItem('viewer_type', viewerType);
  }, [viewerType]);

  const handleMapStyleChange = useCallback((style: MapStyle) => {
    if (mapStyle === style) {
      return;
    }

    const selectedOption = MAP_STYLE_OPTIONS.find(opt => opt.value === style);
    toast({
      title: 'Map style updated',
      description: selectedOption
        ? `${selectedOption.label}: ${selectedOption.description}`
        : `Display mode changed to ${style}`,
    });

    onMapStyleChange(style);
    if (onChange) {
      onChange();
    }
  }, [mapStyle, onMapStyleChange, onChange]);

  const handleViewerSelect = useCallback((nextType: 'threejs' | 'cesium') => {
    if (viewerType === nextType) {
      return;
    }

    const selectedOption = VIEWER_OPTIONS.find(opt => opt.value === nextType);
    toast({
      title: nextType === 'cesium' ? 'Switched to Cesium' : 'Switched to Three.js',
      description: selectedOption?.description ?? undefined,
    });

    onViewerTypeChange(nextType);
    if (onChange) {
      onChange();
    }
  }, [viewerType, onViewerTypeChange, onChange]);

  // Screen resolution state
  const [screenResolution, setScreenResolution] = useState<ScreenResolution>(() => {
    const stored = Storage.getItem('screen_resolution');
    if (stored === 'auto' || stored === '1280x720' || stored === '1600x900' ||
        stored === '1920x1080' || stored === '2560x1440' || stored === '3840x2160') {
      return stored;
    }
    return 'auto';
  });

  const handleResolutionSelect = useCallback((resolution: ScreenResolution) => {
    setScreenResolution(resolution);
    Storage.setItem('screen_resolution', resolution);
    const selectedOption = RESOLUTION_OPTIONS.find(opt => opt.value === resolution);
    toast({
      title: `Resolution: ${selectedOption?.label ?? resolution}`,
      description: selectedOption?.description ?? 'Resolution updated',
    });
    if (onChange) {
      onChange();
    }
  }, [onChange]);

  // Layout density state
  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>(() => {
    const stored = Storage.getItem('layout_density');
    if (stored === 'expanded' || stored === 'compact' || stored === 'minimal') {
      return stored;
    }
    return 'expanded';
  });

  const handleLayoutDensityChange = useCallback((density: LayoutDensity) => {
    setLayoutDensity(density);
    Storage.setItem('layout_density', density);
    toast({
      title: 'HUD layout updated',
      description: `Layout changed to ${density}`,
    });
    if (onChange) {
      onChange();
    }
  }, [onChange]);

  // Audio state
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const stored = Storage.getItem('audio_music_enabled');
    return stored !== 'false';
  });

  const [sfxEnabled, setSfxEnabled] = useState(() => {
    const stored = Storage.getItem('audio_sfx_enabled');
    return stored !== 'false';
  });

  const [musicVolume, setMusicVolume] = useState(() => {
    const stored = Storage.getItem('audio_music_volume');
    return stored ? parseFloat(stored) : 0.3;
  });

  const [musicSelection, setMusicSelection] = useState(() => {
    const stored = Storage.getItem('audio_music_track');
    return stored || 'random';
  });

  const handleMusicToggle = useCallback((checked: boolean) => {
    setMusicEnabled(checked);
    Storage.setItem('audio_music_enabled', String(checked));
    toast({
      title: checked ? 'Music enabled' : 'Music disabled',
    });
    if (onChange) {
      onChange();
    }
  }, [onChange]);

  const handleSfxToggle = useCallback((checked: boolean) => {
    setSfxEnabled(checked);
    Storage.setItem('audio_sfx_enabled', String(checked));
    toast({
      title: checked ? 'Sound FX enabled' : 'Sound FX disabled',
    });
    if (onChange) {
      onChange();
    }
  }, [onChange]);

  const handleMusicVolumeChange = useCallback((value: number[]) => {
    const volume = Math.min(1, Math.max(0, value[0] ?? 0));
    setMusicVolume(volume);
    Storage.setItem('audio_music_volume', String(volume));
    if (onChange) {
      onChange();
    }
  }, [onChange]);

  const handleMusicTrackChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setMusicSelection(value);
    Storage.setItem('audio_music_track', value);
    toast({
      title: 'Soundtrack changed',
      description: value === 'random' ? 'Random rotation' : MUSIC_TRACKS.find(t => t.id === value)?.title,
    });
    if (onChange) {
      onChange();
    }
  }, [onChange]);

  const handleNextTrack = useCallback(() => {
    toast({
      title: 'Track advanced',
      description: 'Skipping to next track',
    });
    if (onChange) {
      onChange();
    }
  }, [onChange]);

  // Co-op state
  const [coopEnabled, setCoopEnabled] = useState(() => {
    const stored = Storage.getItem('option_coop_enabled');
    return stored === 'true';
  });

  const handleCoopToggle = useCallback((enabled: boolean) => {
    setCoopEnabled(enabled);
    Storage.setItem('option_coop_enabled', String(enabled));
    toast({
      title: enabled ? 'Co-op approvals enabled' : 'Co-op approvals disabled',
      description: enabled
        ? 'Command approvals and multiplayer sync have been reactivated.'
        : 'Single-commander mode active. Actions will auto-approve until re-enabled.',
    });
    if (onChange) {
      onChange();
    }
  }, [onChange]);

  // Pandemic state
  const [pandemicIntegrationEnabled, setPandemicIntegrationEnabled] = useState(() => {
    const stored = Storage.getItem('option_pandemic_integration');
    return stored !== 'false';
  });

  const [bioWarfareEnabled, setBioWarfareEnabled] = useState(() => {
    const stored = Storage.getItem('option_biowarfare_conquest');
    return stored !== 'false';
  });

  const handlePandemicToggle = useCallback((value: boolean) => {
    setPandemicIntegrationEnabled(value);
    Storage.setItem('option_pandemic_integration', String(value));
    toast({
      title: value ? 'Pandemic integration enabled' : 'Pandemic integration disabled',
      description: value
        ? 'Bio-threat modelling now influences readiness, production, and conquest routes.'
        : 'All pathogen events suppressed pending command audit.'
    });
    if (onChange) {
      onChange();
    }
  }, [onChange]);

  const handleBioWarfareToggle = useCallback((value: boolean) => {
    setBioWarfareEnabled(value);
    Storage.setItem('option_biowarfare_conquest', String(value));
    toast({
      title: value ? 'Bio-weapon ops authorized' : 'Bio-weapon ops barred',
      description: value
        ? 'Pandemic flashpoints may now be weaponized in pursuit of domination.'
        : 'Offensive pathogen use disabled – only defensive monitoring remains.'
    });
    if (onChange) {
      onChange();
    }
  }, [onChange]);

  // Tutorial and Database state
  const [databaseOpen, setDatabaseOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const activeTrackMessage = useMemo(() => {
    if (!musicEnabled) {
      return 'Music disabled';
    }
    const track = MUSIC_TRACKS.find(t => t.id === musicSelection);
    if (track && musicSelection !== 'random') {
      return `Selected: ${track.title}`;
    }
    return 'Random rotation';
  }, [musicEnabled, musicSelection]);

  return (
    <div className="options-sheet__decor">
      {/* VISUAL THEMES */}
      <div className="options-section">
        <h3 className="options-section__heading">VISUAL THEMES</h3>
        <p className="options-section__subheading">Switch the world feed rendering profile.</p>
        <div className="theme-grid">
          {themeOptions.map(opt => {
            const active = theme === opt.id;
            return (
              <Button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`theme-chip${active ? ' is-active' : ''}`}
                type="button"
              >
                {opt.label.toUpperCase()}
              </Button>
            );
          })}
        </div>
      </div>

      {/* MAP DISPLAY STYLE */}
      <div className="options-section">
        <h3 className="options-section__heading">MAP DISPLAY STYLE</h3>
        <p className="options-section__subheading">Choose how the global map is rendered.</p>
        <div className="layout-grid">
          {MAP_STYLE_OPTIONS.map((option) => {
            const isActive = mapStyle === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleMapStyleChange(option.value)}
                className={`layout-chip${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
              >
                <span className="layout-chip__label">{option.label}</span>
                <span className="layout-chip__description">{option.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GLOBE RENDERER */}
      <div className="options-section">
        <h3 className="options-section__heading">GLOBE RENDERER</h3>
        <p className="options-section__subheading">Select the engine powering the strategic world view.</p>
        <div className="layout-grid">
          {VIEWER_OPTIONS.map((option) => {
            const isActive = viewerType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleViewerSelect(option.value)}
                className={`layout-chip${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
              >
                <span className="layout-chip__label">{option.label}</span>
                <span className="layout-chip__description">{option.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SCREEN RESOLUTION */}
      <div className="options-section">
        <h3 className="options-section__heading">SCREEN RESOLUTION</h3>
        <p className="options-section__subheading">Set canvas resolution to optimize performance for your PC monitor.</p>
        <div className="layout-grid">
          {RESOLUTION_OPTIONS.map((option) => {
            const isActive = screenResolution === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleResolutionSelect(option.value)}
                className={`layout-chip${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
              >
                <span className="layout-chip__label">{option.label}</span>
                <span className="layout-chip__description">{option.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* HUD LAYOUT - Only show in-game */}
      {showInGameFeatures && (
        <div className="options-section">
          <h3 className="options-section__heading">HUD LAYOUT</h3>
          <p className="options-section__subheading">Choose how much interface overlays the map.</p>
          <div className="layout-grid">
            {layoutDensityOptions.map((option) => {
              const isActive = layoutDensity === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleLayoutDensityChange(option.id)}
                  className={`layout-chip${isActive ? ' is-active' : ''}`}
                  aria-pressed={isActive}
                  title={option.description}
                >
                  <span className="layout-chip__label">{option.label}</span>
                  <span className="layout-chip__description">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CO-OP OPERATIONS - Only show in-game */}
      {showInGameFeatures && (
        <div className="options-section">
          <h3 className="options-section__heading">CO-OP OPERATIONS</h3>
          <p className="options-section__subheading">
            {coopEnabled
              ? 'Review allied readiness, sync status, and role assignments.'
              : 'Single-commander mode active; approvals and state sync are paused.'}
          </p>
          <div className="options-toggle">
            <div className="flex flex-col text-left">
              <span className="tracking-[0.2em] text-[10px] text-cyan-300 uppercase">Shared Command</span>
              <span className="text-[11px] text-cyan-400/80">
                {coopEnabled
                  ? 'Strategic actions may require allied approval to execute.'
                  : 'Approvals are bypassed and multiplayer messaging is suspended.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={coopEnabled}
                onCheckedChange={handleCoopToggle}
                aria-label="Toggle co-op approvals"
              />
              <Button
                type="button"
                variant="outline"
                className="border-cyan-700/60 text-cyan-200 hover:bg-cyan-800/40"
                onClick={() => handleCoopToggle(!coopEnabled)}
              >
                {coopEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>
          {coopEnabled ? (
            <div className="mt-4 space-y-3">
              <CoopStatusPanel />
            </div>
          ) : (
            <div className="mt-4 rounded border border-cyan-500/40 bg-black/40 p-3 text-xs text-cyan-200">
              Command approvals will be skipped and multiplayer sync paused until re-enabled.
            </div>
          )}
        </div>
      )}

      {/* AUDIO CONTROL */}
      <div className="options-section">
        <h3 className="options-section__heading">AUDIO CONTROL</h3>
        <p className="options-section__subheading">Manage strategic alert audio and briefing ambience.</p>
        <div className="options-toggle">
          <span>MUSIC</span>
          <Switch checked={musicEnabled} onCheckedChange={handleMusicToggle} aria-label="Toggle music" />
        </div>
        <div className="options-toggle">
          <span>SOUND FX</span>
          <Switch checked={sfxEnabled} onCheckedChange={handleSfxToggle} aria-label="Toggle sound effects" />
        </div>
        <div className="options-slider">
          <div className="options-slider__label">
            <span>MUSIC GAIN</span>
            <span>{Math.round(musicVolume * 100)}%</span>
          </div>
          <Slider
            value={[musicVolume]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={handleMusicVolumeChange}
            disabled={!musicEnabled}
            aria-label="Adjust music volume"
          />
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex flex-col text-left">
            <span className="tracking-[0.2em] text-[10px] text-cyan-300 uppercase">Soundtrack</span>
            <span className="text-[11px] text-cyan-400/80">{activeTrackMessage}</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="bg-black/60 border border-cyan-700 text-cyan-100 text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
              value={musicSelection}
              onChange={handleMusicTrackChange}
              disabled={!musicEnabled}
              aria-label="Select soundtrack"
            >
              <option value="random">Random Rotation</option>
              {MUSIC_TRACKS.map(track => (
                <option key={track.id} value={track.id}>
                  {track.title}
                </option>
              ))}
            </select>
            <Button
              type="button"
              className="bg-cyan-900/40 border border-cyan-700/60 text-cyan-200 hover:bg-cyan-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNextTrack}
              disabled={!musicEnabled}
            >
              Advance Track
            </Button>
          </div>
        </div>
      </div>

      {/* UNCONVENTIONAL WARFARE */}
      <div className="options-section">
        <h3 className="options-section__heading">UNCONVENTIONAL WARFARE</h3>
        <p className="options-section__subheading">Control how pandemic and bio-weapon systems factor into conquest planning.</p>
        <div className="options-toggle">
          <div className="flex flex-col text-left">
            <span className="tracking-[0.2em] text-[10px] text-cyan-300 uppercase">Pandemic Integration</span>
            <span className="text-[11px] text-cyan-400/80">Allow engineered outbreaks and containment play a role each turn.</span>
          </div>
          <Switch
            checked={pandemicIntegrationEnabled}
            onCheckedChange={handlePandemicToggle}
            aria-label="Toggle pandemic gameplay"
          />
        </div>
        <div className="options-toggle">
          <div className="flex flex-col text-left">
            <span className="tracking-[0.2em] text-[10px] text-cyan-300 uppercase">Bio-Weapon Conquest Ops</span>
            <span className="text-[11px] text-cyan-400/80">Enable offensive deployment of pathogens as a conquest vector. Changes are logged to the war-room audit trail.</span>
          </div>
          <Switch
            checked={bioWarfareEnabled}
            onCheckedChange={handleBioWarfareToggle}
            aria-label="Toggle bioweapon conquest options"
          />
        </div>
      </div>

      {/* TUTORIALS & REFERENCE */}
      <div className="options-section">
        <h3 className="options-section__heading">TUTORIALS & REFERENCE</h3>
        <p className="options-section__subheading">Access comprehensive game guides, tutorials, and mechanic references.</p>

        <div className="space-y-3 mt-4">
          <Button
            type="button"
            onClick={() => setDatabaseOpen(true)}
            className="w-full justify-start gap-3 bg-cyan-900/40 border border-cyan-700/60 text-cyan-100 hover:bg-cyan-800/60 h-auto py-4"
          >
            <BookOpen className="h-5 w-5" />
            <div className="flex flex-col text-left">
              <span className="font-semibold">Spill-database</span>
              <span className="text-xs text-cyan-300/80 font-normal">
                Komplett referanse for alle spillmekanikker, våpen, og strategier
              </span>
            </div>
          </Button>

          <Button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="w-full justify-start gap-3 bg-cyan-900/40 border border-cyan-700/60 text-cyan-100 hover:bg-cyan-800/60 h-auto py-4"
          >
            <GraduationCap className="h-5 w-5" />
            <div className="flex flex-col text-left">
              <span className="font-semibold">Komplett Tutorial</span>
              <span className="text-xs text-cyan-300/80 font-normal">
                Interaktiv trinn-for-trinn guide gjennom alle spillsystemer
              </span>
            </div>
          </Button>
        </div>

        <div className="mt-4 p-3 rounded border border-cyan-500/40 bg-black/40">
          <p className="text-xs text-cyan-200">
            <strong>Tips:</strong> Bruk databasen som oppslagsverk under spilling.
            Tutorialen dekker alt fra grunnleggende mekanikker til avanserte strategier.
          </p>
        </div>
      </div>

      {/* Modals */}
      <GameDatabase
        open={databaseOpen}
        onClose={() => setDatabaseOpen(false)}
        currentTurn={currentTurn}
      />
      <ComprehensiveTutorial
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
    </div>
  );
}
