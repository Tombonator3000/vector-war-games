/**
 * Specialized Alliance Display Component
 *
 * Shows specialized alliance types, levels, and benefits between nations
 */

import React from 'react';
import { Shield, Swords, Coins, Microscope, TrendingUp, Star, Award } from 'lucide-react';
import { Nation } from '@/types/game';
import {
  getAllianceBetween,
  getAllianceConfig,
  getAllianceLevelColor,
  getCooperationColor,
} from '@/types/specializedAlliances';
import type { SpecializedAlliance, AllianceType } from '@/types/specializedAlliances';

interface SpecializedAllianceDisplayProps {
  nation: Nation;
  targetNation: Nation;
  compact?: boolean;
}

export function SpecializedAllianceDisplay({
  nation,
  targetNation,
  compact = false,
}: SpecializedAllianceDisplayProps) {
  const alliance = getAllianceBetween(nation, targetNation.id);

  if (!alliance || !alliance.active) {
    if (compact) return null;

    return (
      <div className="text-center py-4 text-xs text-gray-500">
        No specialized alliance
      </div>
    );
  }

  const config = getAllianceConfig(alliance.type);
  const levelColor = getAllianceLevelColor(alliance.level);
  const cooperationColor = getCooperationColor(alliance.cooperation);

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        {/* Alliance type icon */}
        <div className="flex items-center gap-1">
          {getAllianceIcon(alliance.type, 'w-3 h-3')}
          <span className={config.color}>{config.name}</span>
        </div>

        {/* Level */}
        <div className="flex items-center gap-1">
          <Star className={`w-3 h-3 ${levelColor}`} />
          <span className={levelColor}>L{alliance.level}</span>
        </div>

        {/* Cooperation */}
        <div className="flex items-center gap-1">
          <TrendingUp className={`w-3 h-3 ${cooperationColor}`} />
          <span className={cooperationColor}>{alliance.cooperation}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-black/30 rounded border border-gray-700">
      {/* Alliance Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getAllianceIcon(alliance.type, 'w-5 h-5')}
            <span className={`text-sm font-semibold ${config.color}`}>
              {config.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className={`w-4 h-4 ${levelColor}`} />
            <span className={`text-sm font-bold ${levelColor}`}>Level {alliance.level}</span>
          </div>
        </div>

        <p className="text-xs text-gray-400">{config.description}</p>
      </div>

      {/* Cooperation Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Cooperation</span>
          <span className={`text-xs font-semibold ${cooperationColor}`}>
            {alliance.cooperation}%
          </span>
        </div>

        <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              alliance.cooperation >= 80
                ? 'bg-green-500'
                : alliance.cooperation >= 60
                ? 'bg-green-400'
                : alliance.cooperation >= 40
                ? 'bg-yellow-400'
                : alliance.cooperation >= 20
                ? 'bg-orange-400'
                : 'bg-red-400'
            }`}
            style={{ width: `${alliance.cooperation}%` }}
          />
        </div>
      </div>

      {/* Active Benefits */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-semibold text-gray-300">Active Benefits</span>
        </div>

        <div className="space-y-1 max-h-32 overflow-y-auto">
          {alliance.benefits
            .filter((b) => b.active)
            .map((benefit, index) => (
              <div
                key={`${benefit.type}-${index}`}
                className="bg-black/20 rounded px-2 py-1 border border-gray-800"
              >
                <p className="text-xs text-gray-300">{benefit.description}</p>
              </div>
            ))}
        </div>

        {alliance.level < 5 && (
          <p className="text-xs text-gray-500 italic">
            Increase cooperation to unlock Level {alliance.level + 1} benefits
          </p>
        )}
      </div>

      {/* Obligations */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-gray-300">Obligations</span>
        </div>

        <div className="space-y-1 max-h-24 overflow-y-auto">
          {alliance.obligations.map((obligation, index) => (
            <div
              key={`${obligation.type}-${index}`}
              className="bg-black/20 rounded px-2 py-1 border border-gray-800"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-gray-300 flex-1">{obligation.description}</p>
                {obligation.mandatory && (
                  <span className="text-xs text-red-400 font-semibold">REQUIRED</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Get icon component for alliance type
 */
function getAllianceIcon(type: AllianceType, className: string) {
  switch (type) {
    case 'military':
      return <Swords className={`${className} text-red-500`} />;
    case 'defensive':
      return <Shield className={`${className} text-blue-500`} />;
    case 'economic':
      return <Coins className={`${className} text-green-500`} />;
    case 'research':
      return <Microscope className={`${className} text-purple-500`} />;
  }
}

/**
 * Inline compact version for use in lists
 */
export function SpecializedAllianceInline({
  nation,
  targetNation,
}: {
  nation: Nation;
  targetNation: Nation;
}) {
  return <SpecializedAllianceDisplay nation={nation} targetNation={targetNation} compact />;
}

/**
 * Show all alliances for a nation
 */
export function AllAlliancesDisplay({ nation }: { nation: Nation }) {
  const alliances = nation.specializedAlliances?.filter((a) => a.active) ?? [];

  if (alliances.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-gray-500">No active alliances</div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <Shield className="w-4 h-4" />
        Active Alliances ({alliances.length})
      </h3>

      <div className="space-y-2">
        {alliances.map((alliance) => {
          const config = getAllianceConfig(alliance.type);
          const partnerId =
            alliance.nation1Id === nation.id ? alliance.nation2Id : alliance.nation1Id;

          return (
            <div
              key={alliance.id}
              className="bg-black/20 rounded p-2 border border-gray-800 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAllianceIcon(alliance.type, 'w-4 h-4')}
                  <span className={`text-xs font-semibold ${config.color}`}>
                    {config.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star
                    className={`w-3 h-3 ${getAllianceLevelColor(alliance.level)}`}
                  />
                  <span className="text-xs text-gray-400">L{alliance.level}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Partner: {partnerId}</span>
                <span className={getCooperationColor(alliance.cooperation)}>
                  {alliance.cooperation}% cooperation
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
