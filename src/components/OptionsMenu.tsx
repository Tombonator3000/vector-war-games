/**
 * OptionsMenu Component
 *
 * Unified options menu that can be used both in-game and on the start screen.
 * Manages its own state via localStorage to stay in sync across contexts.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { CoopStatusPanel } from '@/components/coop/CoopStatusPanel';
import { GameDatabase } from '@/components/GameDatabase';
import { ComprehensiveTutorial } from '@/components/ComprehensiveTutorial';
import type { MapStyle, MapVisualStyle } from '@/components/GlobeScene';
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
  | 'wargames';

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

export type MusicTrack = (typeof MUSIC_TRACKS)[number];
export type MusicTrackId = MusicTrack['id'];

const DEFAULT_AMBIENT_VOLUME = 0.45;

const themeOptions: { id: ThemeId; label: string }[] = [
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'wargames', label: 'WARGAMES' }
];

const MAP_STYLE_OPTIONS: { value: MapVisualStyle; label: string; description: string }[] = [
  { value: 'realistic', label: 'Realistic', description: 'Satellite imagery with terrain overlays.' },
  {
    value: 'wireframe',
    label: 'Vector',
    description: 'Neon vector grid with luminous borders and elevation lines.',
  },
  {
    value: 'flat-realistic',
    label: 'Flat Realistic',
    description: 'High-resolution satellite texture rendered on the flat map.',
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
  onMapStyleChange: (style: MapVisualStyle) => void;
  dayNightAutoCycleEnabled: boolean;
  onDayNightAutoCycleToggle: (enabled: boolean) => void;

  /** Whether to show in-game only features (like co-op, HUD layout) */
  showInGameFeatures?: boolean;

  /** Optional callback when options change */
  onChange?: () => void;

  /** Current game turn for database feature unlocking */
  currentTurn?: number;

  /** Controlled audio state */
  musicEnabled?: boolean;
  onMusicToggle?: (enabled: boolean) => void;
  sfxEnabled?: boolean;
  onSfxToggle?: (enabled: boolean) => void;
  ambientEnabled?: boolean;
  onAmbientToggle?: (enabled: boolean) => void;
  musicVolume?: number;
  onMusicVolumeChange?: (volume: number) => void;
  ambientVolume?: number;
  onAmbientVolumeChange?: (volume: number) => void;
  musicSelection?: string;
  onMusicTrackChange?: (selection: string) => void;
  onNextTrack?: () => void;
  activeTrackMessage?: string;
  musicTracks?: MusicTrack[];
}

export function OptionsMenu({
  theme: externalTheme,
  onThemeChange,
  mapStyle,
  onMapStyleChange,
  dayNightAutoCycleEnabled,
  onDayNightAutoCycleToggle,
  showInGameFeatures = true,
  onChange,
  currentTurn = 1,
  musicEnabled: controlledMusicEnabled,
  onMusicToggle,
  sfxEnabled: controlledSfxEnabled,
  onSfxToggle,
  ambientEnabled: controlledAmbientEnabled,
  onAmbientToggle,
  musicVolume: controlledMusicVolume,
  onMusicVolumeChange,
  ambientVolume: controlledAmbientVolume,
  onAmbientVolumeChange,
  musicSelection: controlledMusicSelection,
  onMusicTrackChange,
  onNextTrack,
  activeTrackMessage: externalActiveTrackMessage,
  musicTracks,
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
    Storage.setItem('map_style_visual', mapStyle.visual);
    Storage.setItem('map_style', mapStyle.visual);
  }, [mapStyle.visual]);

  const handleMapStyleChange = useCallback((style: MapVisualStyle) => {
    if (mapStyle.visual === style) {
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
  }, [mapStyle.visual, onMapStyleChange, onChange]);

  const handleDayNightAutoCycleToggle = useCallback((enabled: boolean) => {
    onDayNightAutoCycleToggle(enabled);
    toast({
      title: enabled ? 'Auto day/night cycle enabled' : 'Auto day/night cycle disabled',
      description: enabled
        ? 'Map lighting will transition between daybreak and nightfall automatically.'
        : 'Lighting will remain fixed until manually adjusted.',
    });
    if (onChange) {
      onChange();
    }
  }, [onDayNightAutoCycleToggle, onChange]);

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

  const [ambientEnabled, setAmbientEnabled] = useState(() => {
    const stored = Storage.getItem('audio_ambient_enabled');
    return stored !== 'false';
  });

  // Always start at 30% volume
  const [musicVolume, setMusicVolume] = useState(0.3);

  const [ambientVolume, setAmbientVolume] = useState(() => {
    const stored = Storage.getItem('audio_ambient_volume');
    if (stored) {
      const parsed = parseFloat(stored);
      if (!Number.isNaN(parsed)) {
        return Math.min(1, Math.max(0, parsed));
      }
    }
    return DEFAULT_AMBIENT_VOLUME;
  });

  const [musicSelection, setMusicSelection] = useState(() => {
    const stored = Storage.getItem('audio_music_track');
    return stored || 'random';
  });

  const isMusicControlled = typeof controlledMusicEnabled === 'boolean';
  const isSfxControlled = typeof controlledSfxEnabled === 'boolean';
  const isAmbientControlled = typeof controlledAmbientEnabled === 'boolean';
  const isVolumeControlled = typeof controlledMusicVolume === 'number';
  const isAmbientVolumeControlled = typeof controlledAmbientVolume === 'number';
  const isSelectionControlled = typeof controlledMusicSelection === 'string';

  const resolvedMusicEnabled = isMusicControlled ? controlledMusicEnabled : musicEnabled;
  const resolvedSfxEnabled = isSfxControlled ? controlledSfxEnabled : sfxEnabled;
  const resolvedAmbientEnabled = isAmbientControlled ? controlledAmbientEnabled : ambientEnabled;
  const resolvedMusicVolume = isVolumeControlled ? controlledMusicVolume : musicVolume;
  const resolvedAmbientVolume = isAmbientVolumeControlled ? controlledAmbientVolume : ambientVolume;
  const resolvedMusicSelection = isSelectionControlled ? controlledMusicSelection : musicSelection;
  const availableMusicTracks = musicTracks ?? MUSIC_TRACKS;

  const handleMusicToggle = useCallback((checked: boolean) => {
    if (!isMusicControlled) {
      setMusicEnabled(checked);
      Storage.setItem('audio_music_enabled', String(checked));
    }
    toast({
      title: checked ? 'Music enabled' : 'Music disabled',
    });
    if (onMusicToggle) {
      onMusicToggle(checked);
    }
    if (onChange) {
      onChange();
    }
  }, [isMusicControlled, onMusicToggle, onChange]);

  const handleSfxToggle = useCallback((checked: boolean) => {
    if (!isSfxControlled) {
      setSfxEnabled(checked);
      Storage.setItem('audio_sfx_enabled', String(checked));
    }
    toast({
      title: checked ? 'Sound FX enabled' : 'Sound FX disabled',
    });
    if (onSfxToggle) {
      onSfxToggle(checked);
    }
    if (onChange) {
      onChange();
    }
  }, [isSfxControlled, onSfxToggle, onChange]);

  const handleAmbientToggle = useCallback((checked: boolean) => {
    if (!isAmbientControlled) {
      setAmbientEnabled(checked);
      Storage.setItem('audio_ambient_enabled', String(checked));
    }
    toast({
      title: checked ? 'Ambient alerts enabled' : 'Ambient alerts muted',
    });
    if (onAmbientToggle) {
      onAmbientToggle(checked);
    }
    if (onChange) {
      onChange();
    }
  }, [isAmbientControlled, onAmbientToggle, onChange]);

  const handleMusicVolumeChange = useCallback((value: number[]) => {
    const rawValue = value[0] ?? 0;
    const volume = Math.min(1, Math.max(0, rawValue / 100));
    if (!isVolumeControlled) {
      setMusicVolume(volume);
      // Don't save to storage - always reset to 30% on page load
    }
    if (onMusicVolumeChange) {
      onMusicVolumeChange(volume);
    }
    if (onChange) {
      onChange();
    }
  }, [isVolumeControlled, onMusicVolumeChange, onChange]);

  const handleAmbientVolumeChangeInternal = useCallback((value: number[]) => {
    const rawValue = value[0] ?? 0;
    const volume = Math.min(1, Math.max(0, rawValue / 100));
    if (!isAmbientVolumeControlled) {
      setAmbientVolume(volume);
      Storage.setItem('audio_ambient_volume', volume.toString());
    }
    if (onAmbientVolumeChange) {
      onAmbientVolumeChange(volume);
    }
    if (onChange) {
      onChange();
    }
  }, [isAmbientVolumeControlled, onAmbientVolumeChange, onChange]);

  const handleMusicTrackChange = useCallback((value: string) => {
    if (!isSelectionControlled) {
      setMusicSelection(value);
      Storage.setItem('audio_music_track', value);
    }
    toast({
      title: 'Soundtrack changed',
      description: value === 'random' ? 'Random rotation' : availableMusicTracks.find(t => t.id === value)?.title,
    });
    if (onMusicTrackChange) {
      onMusicTrackChange(value);
    }
    if (onChange) {
      onChange();
    }
  }, [availableMusicTracks, isSelectionControlled, onMusicTrackChange, onChange]);

  const handleNextTrack = useCallback(() => {
    if (onNextTrack) {
      onNextTrack();
    }
    toast({
      title: 'Track advanced',
      description: 'Skipping to next track',
    });
    if (onChange) {
      onChange();
    }
  }, [onNextTrack, onChange]);

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

  const fallbackActiveTrackMessage = useMemo(() => {
    if (!resolvedMusicEnabled) {
      return 'Music disabled';
    }
    const track = availableMusicTracks.find(t => t.id === resolvedMusicSelection);
    if (track && resolvedMusicSelection !== 'random') {
      return `Selected: ${track.title}`;
    }
    return 'Random rotation';
  }, [availableMusicTracks, resolvedMusicEnabled, resolvedMusicSelection]);

  const activeTrackMessage = externalActiveTrackMessage ?? fallbackActiveTrackMessage;

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
            const isActive = mapStyle.visual === option.value;
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
        <div className="options-toggle mt-4">
          <div className="flex flex-col text-left">
            <span className="tracking-[0.2em] text-[10px] text-cyan-300 uppercase">Auto Day/Night Cycle</span>
            <span className="text-[11px] text-cyan-400/80">
              Rotate the flat-realistic map lighting between daylight and nightfall automatically.
            </span>
          </div>
          <Switch
            checked={dayNightAutoCycleEnabled}
            onCheckedChange={handleDayNightAutoCycleToggle}
            aria-label="Toggle automatic day and night transitions"
          />
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
          <Switch checked={resolvedMusicEnabled} onCheckedChange={handleMusicToggle} aria-label="Toggle music" />
        </div>
        <div className="options-toggle">
          <span>SOUND FX</span>
          <Switch checked={resolvedSfxEnabled} onCheckedChange={handleSfxToggle} aria-label="Toggle sound effects" />
        </div>
        <div className="options-toggle">
          <span>AMBIENT ALERTS</span>
          <Switch checked={resolvedAmbientEnabled} onCheckedChange={handleAmbientToggle} aria-label="Toggle ambient alerts" />
        </div>
        <div className="options-slider">
          <div className="options-slider__label">
            <span>MUSIC GAIN</span>
            <span>{Math.round(resolvedMusicVolume * 100)}%</span>
          </div>
          <Slider
            value={[resolvedMusicVolume * 100]}
            min={0}
            max={100}
            step={5}
            onValueChange={handleMusicVolumeChange}
            disabled={!resolvedMusicEnabled}
            aria-label="Adjust music volume"
          />
        </div>
        <div className="options-slider">
          <div className="options-slider__label">
            <span>AMBIENT GAIN</span>
            <span>{Math.round(resolvedAmbientVolume * 100)}%</span>
          </div>
          <Slider
            value={[resolvedAmbientVolume * 100]}
            min={0}
            max={100}
            step={5}
            onValueChange={handleAmbientVolumeChangeInternal}
            disabled={!resolvedAmbientEnabled}
            aria-label="Adjust ambient volume"
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
              value={resolvedMusicSelection}
              onChange={(event) => handleMusicTrackChange(event.target.value)}
              disabled={!resolvedMusicEnabled}
              aria-label="Select soundtrack"
            >
              <option value="random">Random Rotation</option>
              {availableMusicTracks.map(track => (
                <option key={track.id} value={track.id}>
                  {track.title}
                </option>
              ))}
            </select>
            <Button
              type="button"
              className="bg-cyan-900/40 border border-cyan-700/60 text-cyan-200 hover:bg-cyan-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNextTrack}
              disabled={!resolvedMusicEnabled}
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
              <span className="font-semibold">Game Database</span>
              <span className="text-xs text-cyan-300/80 font-normal">
                Complete reference for all game mechanics, weapons, and strategies
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
              <span className="font-semibold">Complete Tutorial</span>
              <span className="text-xs text-cyan-300/80 font-normal">
                Interactive step-by-step guide through all game systems
              </span>
            </div>
          </Button>
        </div>

        <div className="mt-4 p-3 rounded border border-cyan-500/40 bg-black/40">
          <p className="text-xs text-cyan-200">
            <strong>Tip:</strong> Use the database as a reference during gameplay.
            The tutorial covers everything from basic mechanics to advanced strategies.
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
