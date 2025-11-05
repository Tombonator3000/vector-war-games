/**
 * Leader Avatar Component
 *
 * Displays a leader's avatar with mood-based coloring.
 * Mood is determined by relationship level and displayed via border color.
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { LeaderMood } from '@/types/negotiation';

interface LeaderAvatarProps {
  leaderName: string;
  nationName: string;
  mood: LeaderMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  imageUrl?: string;
  className?: string;
}

/**
 * Get mood color for avatar border
 */
function getMoodColor(mood: LeaderMood): string {
  switch (mood) {
    case 'hostile':
      return 'border-red-500 ring-red-500/20';
    case 'unfriendly':
      return 'border-orange-500 ring-orange-500/20';
    case 'cautious':
      return 'border-yellow-500 ring-yellow-500/20';
    case 'neutral':
      return 'border-gray-400 ring-gray-400/20';
    case 'friendly':
      return 'border-blue-400 ring-blue-400/20';
    case 'cordial':
      return 'border-green-400 ring-green-400/20';
    case 'allied':
      return 'border-emerald-500 ring-emerald-500/20';
    default:
      return 'border-gray-400 ring-gray-400/20';
  }
}

/**
 * Get mood background gradient
 */
function getMoodGradient(mood: LeaderMood): string {
  switch (mood) {
    case 'hostile':
      return 'from-red-600 to-red-800';
    case 'unfriendly':
      return 'from-orange-600 to-orange-800';
    case 'cautious':
      return 'from-yellow-600 to-yellow-800';
    case 'neutral':
      return 'from-gray-600 to-gray-800';
    case 'friendly':
      return 'from-blue-600 to-blue-800';
    case 'cordial':
      return 'from-green-600 to-green-800';
    case 'allied':
      return 'from-emerald-600 to-emerald-800';
    default:
      return 'from-gray-600 to-gray-800';
  }
}

/**
 * Get size classes
 */
function getSizeClasses(size: 'sm' | 'md' | 'lg' | 'xl'): {
  container: string;
  text: string;
  border: string;
} {
  switch (size) {
    case 'sm':
      return {
        container: 'h-10 w-10',
        text: 'text-sm',
        border: 'border-2 ring-2',
      };
    case 'md':
      return {
        container: 'h-16 w-16',
        text: 'text-xl',
        border: 'border-3 ring-4',
      };
    case 'lg':
      return {
        container: 'h-24 w-24',
        text: 'text-3xl',
        border: 'border-4 ring-4',
      };
    case 'xl':
      return {
        container: 'h-32 w-32',
        text: 'text-4xl',
        border: 'border-4 ring-8',
      };
    default:
      return {
        container: 'h-16 w-16',
        text: 'text-xl',
        border: 'border-3 ring-4',
      };
  }
}

/**
 * Get initials from leader name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * LeaderAvatar Component
 */
export function LeaderAvatar({
  leaderName,
  nationName,
  mood,
  size = 'md',
  imageUrl,
  className,
}: LeaderAvatarProps) {
  const sizeClasses = getSizeClasses(size);
  const moodColor = getMoodColor(mood);
  const moodGradient = getMoodGradient(mood);
  const initials = getInitials(leaderName);

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar
        className={cn(
          sizeClasses.container,
          sizeClasses.border,
          moodColor,
          'transition-all duration-300'
        )}
      >
        {imageUrl && (
          <AvatarImage
            src={imageUrl}
            alt={`${leaderName} of ${nationName}`}
            onError={(e) => {
              // Hide broken image and show fallback instead
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <AvatarFallback
          className={cn(
            'bg-gradient-to-br',
            moodGradient,
            'text-white font-bold',
            sizeClasses.text
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Mood indicator tooltip */}
      <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className={cn(
          'text-xs px-2 py-1 rounded-full border',
          moodColor,
          'bg-background/90 backdrop-blur-sm whitespace-nowrap'
        )}>
          {mood.charAt(0).toUpperCase() + mood.slice(1)}
        </div>
      </div>
    </div>
  );
}

/**
 * LeaderAvatarWithTooltip - Extended version with hover info
 */
interface LeaderAvatarWithTooltipProps extends LeaderAvatarProps {
  relationship: number;
  trust: number;
  showTooltip?: boolean;
}

export function LeaderAvatarWithTooltip({
  showTooltip = true,
  relationship,
  trust,
  ...avatarProps
}: LeaderAvatarWithTooltipProps) {
  if (!showTooltip) {
    return <LeaderAvatar {...avatarProps} />;
  }

  return (
    <div className="group relative inline-block">
      <LeaderAvatar {...avatarProps} />

      {/* Tooltip */}
      <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2">
        <div className="bg-popover border rounded-lg shadow-lg p-3 whitespace-nowrap">
          <div className="text-sm font-semibold mb-1">{avatarProps.leaderName}</div>
          <div className="text-xs text-muted-foreground mb-2">{avatarProps.nationName}</div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-muted-foreground">Relationship:</span>
              <span className={cn(
                'font-medium',
                relationship > 50 ? 'text-green-400' :
                relationship > 0 ? 'text-blue-400' :
                relationship > -50 ? 'text-yellow-400' :
                'text-red-400'
              )}>
                {relationship > 0 ? '+' : ''}{relationship}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-muted-foreground">Trust:</span>
              <span className="font-medium">{trust}/100</span>
            </div>
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-muted-foreground">Mood:</span>
              <span className="font-medium capitalize">{avatarProps.mood}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
