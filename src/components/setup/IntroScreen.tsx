/**
 * IntroScreen Component
 *
 * Main menu screen with game start options, scenario selection, and high score display.
 *
 * Phase 7 Refactoring: Extracted from Index.tsx
 */

import { IntroLogo } from '@/components/intro/IntroLogo';
import { Starfield } from '@/components/intro/Starfield';
import { SpinningEarth } from '@/components/intro/SpinningEarth';
import { ScenarioSelectionPanel } from '@/components/ScenarioSelectionPanel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OptionsMenu } from '@/components/OptionsMenu';
import type { MusicTrack } from '@/components/OptionsMenu';
import type { MapStyle, MapVisualStyle } from '@/components/GlobeScene';
import { CreditsDialog } from '@/components/setup/CreditsDialog';
import type { ScenarioConfig } from '@/types/scenario';
import { useState } from 'react';

interface HighScore {
  name: string;
  score: number;
  turns: number;
}

export interface IntroScreenProps {
  /** Available scenario options */
  scenarioOptions: ScenarioConfig[];
  /** Currently selected scenario ID */
  selectedScenarioId: string;
  /** Currently selected scenario config */
  selectedScenario: ScenarioConfig;
  /** Whether scenario panel is open */
  isScenarioPanelOpen: boolean;
  /** High scores from storage */
  highscores: HighScore[];
  /** Handler for starting the game */
  onStart: () => void;
  /** Handler for scenario selection */
  onScenarioSelect: (scenarioId: string) => void;
  /** Handler for opening scenario panel */
  onOpenScenarioPanel: () => void;
  /** Handler for closing scenario panel */
  onCloseScenarioPanel: (open: boolean) => void;
  /** Current map style */
  mapStyle: MapStyle;
  /** Change handler for map style */
  onMapStyleChange: (style: MapVisualStyle) => void;
  /** Current viewer type */
  viewerType: 'threejs' | 'cesium';
  /** Change handler for viewer type */
  onViewerTypeChange: (type: 'threejs' | 'cesium') => void;

  musicEnabled?: boolean;
  onMusicToggle?: (enabled: boolean) => void;
  sfxEnabled?: boolean;
  onSfxToggle?: (enabled: boolean) => void;
  musicVolume?: number;
  onMusicVolumeChange?: (volume: number) => void;
  musicSelection?: string;
  onMusicTrackChange?: (selection: string) => void;
  onNextTrack?: () => void;
  activeTrackMessage?: string;
  musicTracks?: MusicTrack[];
}

export function IntroScreen({
  scenarioOptions,
  selectedScenarioId,
  selectedScenario,
  isScenarioPanelOpen,
  highscores,
  onStart,
  onScenarioSelect,
  onOpenScenarioPanel,
  onCloseScenarioPanel,
  mapStyle,
  onMapStyleChange,
  viewerType,
  onViewerTypeChange,
  musicEnabled,
  onMusicToggle,
  sfxEnabled,
  onSfxToggle,
  musicVolume,
  onMusicVolumeChange,
  musicSelection,
  onMusicTrackChange,
  onNextTrack,
  activeTrackMessage,
  musicTracks,
}: IntroScreenProps) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  return (
    <>
      <ScenarioSelectionPanel
        open={isScenarioPanelOpen}
        onOpenChange={onCloseScenarioPanel}
        scenarios={scenarioOptions}
        selectedScenarioId={selectedScenarioId}
        onSelect={onScenarioSelect}
      />
      <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <DialogContent className="options-sheet max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="options-sheet__title">COMMAND OPTIONS</DialogTitle>
            <DialogDescription className="options-sheet__description">
              Tune the command interface to match your control room preferences.
            </DialogDescription>
          </DialogHeader>
          <OptionsMenu
            showInGameFeatures={false}
            mapStyle={mapStyle}
            onMapStyleChange={onMapStyleChange}
            viewerType={viewerType}
            onViewerTypeChange={onViewerTypeChange}
            musicEnabled={musicEnabled}
            onMusicToggle={onMusicToggle}
            sfxEnabled={sfxEnabled}
            onSfxToggle={onSfxToggle}
            musicVolume={musicVolume}
            onMusicVolumeChange={onMusicVolumeChange}
            musicSelection={musicSelection}
            onMusicTrackChange={onMusicTrackChange}
            onNextTrack={onNextTrack}
            activeTrackMessage={activeTrackMessage}
            musicTracks={musicTracks}
          />
        </DialogContent>
      </Dialog>
      <CreditsDialog open={isCreditsOpen} onOpenChange={setIsCreditsOpen} />
      <div className="intro-screen">
        <Starfield />
        <div className="intro-screen__scanlines" aria-hidden="true" />

        <div className="intro-screen__left">
          <SpinningEarth />

          {/* Highscore Section */}
          {highscores.length > 0 && (
            <div className="absolute bottom-8 left-8 bg-black/80 border border-cyan-500/50 rounded-lg p-4 w-80 backdrop-blur-sm z-10">
              <h3 className="text-lg font-mono text-cyan-400 mb-3 tracking-wider uppercase flex items-center gap-2">
                <span className="text-yellow-400">★</span>
                Hall of Fame
                <span className="text-yellow-400">★</span>
              </h3>
              <div className="space-y-2">
                {highscores.map((hs, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between text-xs font-mono p-2 rounded ${
                      index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                      index === 1 ? 'bg-gray-500/20 border border-gray-500/30' :
                      index === 2 ? 'bg-orange-500/20 border border-orange-500/30' :
                      'bg-cyan-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        index === 2 ? 'text-orange-400' :
                        'text-cyan-400'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="text-cyan-200 truncate max-w-[120px]">{hs.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-yellow-400 font-bold">{hs.score.toLocaleString()}</span>
                      <span className="text-cyan-300/70 text-[10px]">{hs.turns} turns</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="intro-screen__right">
          <IntroLogo />

          <p className="intro-screen__tagline">Want to play a game?</p>

          <div className="intro-screen__menu">
            <button onClick={onStart} className="intro-screen__menu-btn intro-screen__menu-btn--primary">
              <span className="intro-screen__menu-btn-icon">▶</span>
              Start Game
              <span className="mt-1 block text-[10px] uppercase tracking-[0.35em] text-cyan-300">
                {selectedScenario.name}
              </span>
            </button>
            <button className="intro-screen__menu-btn" onClick={onOpenScenarioPanel}>
              <span className="intro-screen__menu-btn-icon">⚔</span>
              Campaigns
            </button>
            <button className="intro-screen__menu-btn" onClick={() => setIsOptionsOpen(true)}>
              <span className="intro-screen__menu-btn-icon">⚙</span>
              Options
            </button>
            <button className="intro-screen__menu-btn" onClick={() => setIsCreditsOpen(true)}>
              <span className="intro-screen__menu-btn-icon">★</span>
              Credits
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
