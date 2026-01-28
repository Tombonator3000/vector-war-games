/**
 * Advisor Panel Component
 *
 * Main UI panel displaying active advisor commentary, all advisor states,
 * and system controls (volume, enable/disable).
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Settings, ChevronDown, ChevronUp, AlertTriangle, RefreshCw, Mic } from 'lucide-react';
import { AdvisorRole } from '@/types/advisor.types';
import { ADVISOR_CONFIGS } from '@/data/advisors.data';
import { useAdvisorSystem } from '@/hooks/useAdvisorSystem';
import { AdvisorAvatar } from './AdvisorAvatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdvisorPanelProps {
  position?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-left' | 'bottom-right';
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
    processGameEvent,
    ttsStatus,
    ttsProvider,
    retryTTS,
  } = useAdvisorSystem();

  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showSettings, setShowSettings] = useState(false);
  const [consultingAdvisor, setConsultingAdvisor] = useState<AdvisorRole | null>(null);

  // Handle clicking on an advisor to consult them
  const handleConsultAdvisor = (role: AdvisorRole) => {
    console.log('[AdvisorPanel] Consulting advisor:', role);
    setConsultingAdvisor(role);

    // Trigger an advisor consultation event
    processGameEvent({
      type: 'ADVISOR_CONSULTED',
      priority: 'important',
      timestamp: Date.now(),
      data: {
        advisorRole: role,
        requestType: 'general_briefing',
      },
    });

    // Clear consultation state after a moment
    setTimeout(() => setConsultingAdvisor(null), 3000);
  };

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
    'bottom-left': 'bottom-4 left-4 w-auto max-w-md',
    'bottom-right': 'bottom-4 right-4 w-auto max-w-md',
  };

  if (!enabled) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-[100]',
        positionStyles[position],
        className
      )}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="relative"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Collapsed header */}
        {collapsed && (
          <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-2 flex items-center justify-between">
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
              onClick={(e) => {
                e.stopPropagation();
                console.log('[AdvisorPanel] Expand button clicked');
                setCollapsed(false);
              }}
              className="h-6 w-6 p-0 hover:bg-cyan-500/30 active:bg-cyan-500/50 cursor-pointer"
              style={{ pointerEvents: 'auto' }}
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

              <div className="flex items-center gap-2 relative z-10">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[AdvisorPanel] Toggle voice clicked, current:', voiceEnabled);
                    toggleVoice();
                  }}
                  className="h-8 w-8 p-0 hover:bg-cyan-500/30 active:bg-cyan-500/50 cursor-pointer border border-transparent hover:border-cyan-500/50"
                  style={{ pointerEvents: 'auto' }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[AdvisorPanel] Settings button clicked');
                    setShowSettings(!showSettings);
                  }}
                  className="h-8 w-8 p-0 hover:bg-cyan-500/30 active:bg-cyan-500/50 cursor-pointer border border-transparent hover:border-cyan-500/50"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Settings className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[AdvisorPanel] Collapse button clicked');
                    setCollapsed(true);
                  }}
                  className="h-8 w-8 p-0 hover:bg-cyan-500/30 active:bg-cyan-500/50 cursor-pointer border border-transparent hover:border-cyan-500/50"
                  style={{ pointerEvents: 'auto' }}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* TTS Status Warning */}
            {ttsStatus === 'unavailable' && (
              <div className="p-3 border-b border-yellow-500/30 bg-yellow-900/20">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">
                    TTS server ikke tilgjengelig. Start med: <code className="bg-black/40 px-1 rounded">npm run tts:dev</code>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => retryTTS()}
                    className="h-6 px-2 text-xs hover:bg-yellow-500/20"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Settings panel */}
            {showSettings && (
              <div className="p-4 border-b border-cyan-500/30 bg-black/40">
                <div className="space-y-3">
                  {/* TTS Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80 flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      TTS Status
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        ttsStatus === 'available' ? 'bg-green-500/20 text-green-400' :
                        ttsStatus === 'checking' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      )}>
                        {ttsStatus === 'available' ? 'Online' :
                         ttsStatus === 'checking' ? 'Checking...' : 'Offline'}
                      </span>
                      <span className="text-xs text-white/50">({ttsProvider})</span>
                    </div>
                  </div>

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

                  {/* Retry TTS button */}
                  {ttsStatus === 'unavailable' && (
                    <div className="pt-2 border-t border-cyan-500/20">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryTTS()}
                        className="w-full text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Retry TTS Connection
                      </Button>
                    </div>
                  )}
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
                        "{currentlyPlaying.text}"
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

            {/* All advisors - click to consult */}
            <div className="p-4">
              <p className="text-white/50 text-xs text-center mb-3">Click an advisor to consult</p>
              <div className="flex flex-wrap gap-4 justify-center">
                {(Object.keys(advisors) as AdvisorRole[]).map((role) => (
                  <AdvisorAvatar
                    key={role}
                    role={role}
                    state={{
                      ...advisors[role],
                      isActive: advisors[role].isActive || consultingAdvisor === role,
                    }}
                    size="sm"
                    showTrust
                    showName
                    onClick={handleConsultAdvisor}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-2 text-center border-t border-cyan-500/30">
              <p className="text-white/40 text-xs flex items-center justify-center gap-2">
                AI Advisor System v1.0 |
                <span className={cn(
                  'inline-flex items-center gap-1',
                  ttsStatus === 'available' ? 'text-green-400/60' : 'text-yellow-400/60'
                )}>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    ttsStatus === 'available' ? 'bg-green-400' :
                    ttsStatus === 'checking' ? 'bg-blue-400 animate-pulse' : 'bg-yellow-400'
                  )} />
                  {ttsProvider === 'edge-tts' ? 'Edge-TTS (FREE)' : 'ElevenLabs'}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
