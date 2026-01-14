/**
 * Advisor Avatar Component
 *
 * Displays individual advisor with visual feedback for speaking state,
 * trust level, and personality indicators.
 */

import React from 'react';
import { Shield, Brain, Users, Target, DollarSign, Megaphone } from 'lucide-react';
import { AdvisorRole, AdvisorState } from '@/types/advisor.types';
import { ADVISOR_CONFIGS } from '@/data/advisors.data';
import { cn } from '@/lib/utils';

interface AdvisorAvatarProps {
  role: AdvisorRole;
  state: AdvisorState;
  size?: 'sm' | 'md' | 'lg';
  showTrust?: boolean;
  showName?: boolean;
  className?: string;
}

/**
 * Icon mapping for advisor roles
 */
const ADVISOR_ICONS: Record<AdvisorRole, React.ComponentType<any>> = {
  military: Shield,
  science: Brain,
  diplomatic: Users,
  intel: Target,
  economic: DollarSign,
  pr: Megaphone,
};

/**
 * Color schemes for each advisor
 */
const ADVISOR_COLORS: Record<AdvisorRole, { bg: string; border: string; active: string }> = {
  military: {
    bg: 'bg-red-900/20',
    border: 'border-red-500/60',
    active: 'border-red-400 shadow-red-500/50',
  },
  science: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-500/60',
    active: 'border-blue-400 shadow-blue-500/50',
  },
  diplomatic: {
    bg: 'bg-green-900/20',
    border: 'border-green-500/60',
    active: 'border-green-400 shadow-green-500/50',
  },
  intel: {
    bg: 'bg-purple-900/20',
    border: 'border-purple-500/60',
    active: 'border-purple-400 shadow-purple-500/50',
  },
  economic: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500/60',
    active: 'border-yellow-400 shadow-yellow-500/50',
  },
  pr: {
    bg: 'bg-pink-900/20',
    border: 'border-pink-500/60',
    active: 'border-pink-400 shadow-pink-500/50',
  },
};

/**
 * Size configurations
 */
const SIZE_CONFIG = {
  sm: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    text: 'text-xs',
  },
  md: {
    container: 'w-16 h-16',
    icon: 'w-8 h-8',
    text: 'text-sm',
  },
  lg: {
    container: 'w-24 h-24',
    icon: 'w-12 h-12',
    text: 'text-base',
  },
};

/**
 * Get trust level color
 */
function getTrustColor(trust: number): string {
  if (trust >= 75) return 'text-green-400';
  if (trust >= 50) return 'text-yellow-400';
  if (trust >= 25) return 'text-orange-400';
  return 'text-red-400';
}

export function AdvisorAvatar({
  role,
  state,
  size = 'md',
  showTrust = false,
  showName = false,
  className,
}: AdvisorAvatarProps) {
  const config = ADVISOR_CONFIGS[role];
  const Icon = ADVISOR_ICONS[role];
  const colors = ADVISOR_COLORS[role];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Avatar Circle */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 transition-all duration-300',
          sizeConfig.container,
          colors.bg,
          state.isActive ? colors.active : colors.border,
          state.isActive && 'shadow-lg animate-pulse'
        )}
        title={`${config.name} (Trust: ${state.trustLevel}%)`}
      >
        <Icon className={cn(sizeConfig.icon, 'text-white/90')} />

        {/* Speaking indicator */}
        {state.isActive && (
          <div className="absolute -top-1 -right-1">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full" />
            </div>
          </div>
        )}

        {/* Trust level ring */}
        {showTrust && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/10"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${state.trustLevel * 2.83} 283`}
              className={getTrustColor(state.trustLevel)}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
        )}
      </div>

      {/* Name and title */}
      {showName && (
        <div className="flex flex-col items-center text-center">
          <div className={cn('font-bold text-white/90', sizeConfig.text)}>
            {config.name.split(' ')[0]}
          </div>
          <div className={cn('text-white/60', sizeConfig.text)}>{config.title}</div>
        </div>
      )}

      {/* Trust percentage */}
      {showTrust && (
        <div className={cn('font-mono', getTrustColor(state.trustLevel), sizeConfig.text)}>
          {state.trustLevel}%
        </div>
      )}
    </div>
  );
}
