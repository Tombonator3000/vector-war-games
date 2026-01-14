/**
 * Advisor Panel Component
 *
 * Main UI panel displaying active advisor commentary, all advisor states,
 * and system controls (volume, enable/disable).
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Settings, X, ChevronDown, ChevronUp } from 'lucide-react';
import { AdvisorRole } from '@/types/advisor.types';
import { ADVISOR_CONFIGS } from '@/data/advisors.data';
import { useAdvisorSystem } from '@/hooks/useAdvisorSystem';
import { AdvisorAvatar } from './AdvisorAvatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdvisorPanelProps {
  position?: 'top' | 'bottom' | 'left' | 'right';
  defaultCollapsed?: boolean;
  className?: string;
}

export function AdvisorPanel({
  position = 'bottom',
  defaultCollapsed = false,
  className,
}: AdvisorPanelProps) {
  const {
    advisors,
    currentlyPlaying,
    enabled,
    voiceEnabled,
    volume,
    toggleEnabled,
    toggleVoice,
    setVolume,
    queueSize,
  } = useAdvisorSystem();

  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showSettings, setShowSettings] = useState(false);

  // Get currently speaking advisor
  const speakingAdvisor = currentlyPlaying
    ? {
        role: currentlyPlaying.advisorRole,
        config: ADVISOR_CONFIGS[currentlyPlaying.advisorRole],
        state: advisors[currentlyPlaying.advisorRole],
      }
    : null;

  // Position-specific styles
  const positionStyles = {
    top: 'top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl',
    left: 'left-0 top-1/2 -translate-y-1/2 h-full max-h-screen',
    right: 'right-0 top-1/2 -translate-y-1/2 h-full max-h-screen',
  };

  if (!enabled) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        positionStyles[position],
        className
      )}
    >
      <div className="pointer-events-auto">
        {/* Collapsed header */}
        {collapsed && (
          <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-t-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white/80">Advisors</span>
              {queueSize > 0 && (
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                  {queueSize}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(false)}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Expanded panel */}
        {!collapsed && (
          <div className="bg-black/90 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-3 flex items-center justify-between border-b border-cyan-500/30">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-white font-bold text-sm">NORAD Advisory Panel</h3>
                  <p className="text-white/60 text-xs">Strategic Command Advisors</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Queue indicator */}
                {queueSize > 0 && (
                  <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-cyan-400 text-xs font-mono">
                    {queueSize} queued
                  </div>
                )}

                {/* Controls */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleVoice}
                  className="h-8 w-8 p-0"
                  title={voiceEnabled ? 'Mute advisors' : 'Unmute advisors'}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCollapsed(true)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Settings panel */}
            {showSettings && (
              <div className="p-4 border-b border-cyan-500/30 bg-black/40">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-white/80 mb-2 block">Volume</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume * 100}
                      onChange={(e) => setVolume(Number(e.target.value) / 100)}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Voice Enabled</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleVoice}
                      className={cn(
                        'h-6 px-3 text-xs',
                        voiceEnabled ? 'bg-green-500/20 border-green-500/50' : ''
                      )}
                    >
                      {voiceEnabled ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Active commentary */}
            {speakingAdvisor && (
              <div className="p-4 border-b border-cyan-500/30 bg-gradient-to-b from-black/40 to-transparent">
                <div className="flex gap-4">
                  <AdvisorAvatar
                    role={speakingAdvisor.role}
                    state={speakingAdvisor.state}
                    size="md"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cyan-400 font-bold text-sm">
                        {speakingAdvisor.config.name}
                      </span>
                      <span className="text-white/60 text-xs">
                        ({speakingAdvisor.config.title})
                      </span>
                    </div>

                    <div className="bg-black/40 border border-cyan-500/20 rounded p-3 relative">
                      <p className="text-white/90 text-sm leading-relaxed">
                        "{/* Text would come from TTS or stored comment */}
                        Currently speaking..."
                      </p>

                      {/* Speaking indicator wave */}
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-cyan-400 rounded-full animate-pulse"
                            style={{
                              height: `${8 + Math.sin(Date.now() / 200 + i) * 4}px`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All advisors */}
            <div className="p-4">
              <div className="flex flex-wrap gap-4 justify-center">
                {(Object.keys(advisors) as AdvisorRole[]).map((role) => (
                  <AdvisorAvatar
                    key={role}
                    role={role}
                    state={advisors[role]}
                    size="sm"
                    showTrust
                    showName
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-2 text-center border-t border-cyan-500/30">
              <p className="text-white/40 text-xs">
                AI Advisor System v1.0 | ElevenLabs TTS Integration
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
