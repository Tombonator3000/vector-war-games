/**
 * Diplomacy Phase 3 Display Component
 *
 * Shows DIP (Diplomatic Influence Points), council membership, active incidents,
 * and ongoing covert operations.
 */

import React from 'react';
import {
  Coins,
  Users,
  AlertTriangle,
  Eye,
  Shield,
  TrendingUp,
  TrendingDown,
  Award,
} from 'lucide-react';
import type { Nation } from '@/types/game';
import type { DiplomacyPhase3State } from '@/types/diplomacyPhase3';
import { getDIP, getDIPPercentage, getDIPColor, getDIPStatus } from '@/lib/diplomaticCurrencyUtils';
import { getCouncilMembership } from '@/lib/internationalCouncilUtils';
import { getIncidentsForNation, getIncidentSeverityColor } from '@/lib/diplomaticIncidentsUtils';

interface DiplomacyPhase3DisplayProps {
  nation: Nation;
  targetNation?: Nation;
  phase3State?: DiplomacyPhase3State;
  compact?: boolean;
}

export function DiplomacyPhase3Display({
  nation,
  targetNation,
  phase3State,
  compact = false,
}: DiplomacyPhase3DisplayProps) {
  if (!phase3State || !phase3State.phase3Enabled) {
    return null;
  }

  const dip = getDIP(nation);
  const dipPercentage = getDIPPercentage(nation);
  const dipColor = getDIPColor(nation);
  const dipStatus = getDIPStatus(nation);

  const councilMembership = getCouncilMembership(
    phase3State.internationalCouncil,
    nation.id
  );

  const activeIncidents = getIncidentsForNation(phase3State.activeIncidents, nation.id);
  const urgentIncidents = activeIncidents.filter(
    (i) => i.escalationLevel >= 60 || i.severity === 'catastrophic' || i.severity === 'severe'
  );

  const ongoingOperations = phase3State.covertOperations.filter(
    (op) => op.operatorId === nation.id && (op.status === 'planning' || op.status === 'active')
  );

  const exposedOperations = phase3State.covertOperations.filter(
    (op) => op.operatorId === nation.id && op.status === 'exposed'
  );

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-xs">
        {/* DIP indicator */}
        <div className="flex items-center gap-1">
          <Coins className={`w-3 h-3 ${dipColor}`} />
          <span className={dipColor}>{dip}</span>
        </div>

        {/* Council membership */}
        {councilMembership !== 'none' && (
          <div className="flex items-center gap-1">
            <Users
              className={`w-3 h-3 ${
                councilMembership === 'permanent'
                  ? 'text-yellow-400'
                  : councilMembership === 'elected'
                  ? 'text-blue-400'
                  : 'text-gray-400'
              }`}
            />
            <span className="text-gray-300 capitalize">{councilMembership}</span>
          </div>
        )}

        {/* Urgent incidents */}
        {urgentIncidents.length > 0 && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-red-500">{urgentIncidents.length}</span>
          </div>
        )}

        {/* Active operations */}
        {ongoingOperations.length > 0 && (
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-purple-400" />
            <span className="text-purple-400">{ongoingOperations.length}</span>
          </div>
        )}

        {/* Exposed operations (warning) */}
        {exposedOperations.length > 0 && (
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-red-600 animate-pulse" />
            <span className="text-red-600">{exposedOperations.length}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-black/30 rounded border border-gray-700">
      {/* DIP Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className={`w-4 h-4 ${dipColor}`} />
            <span className="text-sm font-semibold text-gray-300">
              Diplomatic Influence
            </span>
          </div>
          <span className={`text-sm font-bold ${dipColor}`}>{dip} DIP</span>
        </div>

        {/* DIP bar */}
        <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              dipPercentage >= 80
                ? 'bg-green-500'
                : dipPercentage >= 50
                ? 'bg-green-400'
                : dipPercentage >= 30
                ? 'bg-yellow-400'
                : 'bg-orange-400'
            }`}
            style={{ width: `${dipPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">{dipStatus}</span>
          {nation.diplomaticInfluence && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-green-400">
                +{nation.diplomaticInfluence.perTurnIncome.total}/turn
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Council Membership */}
      {councilMembership !== 'none' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users
                className={`w-4 h-4 ${
                  councilMembership === 'permanent'
                    ? 'text-yellow-400'
                    : councilMembership === 'elected'
                    ? 'text-blue-400'
                    : 'text-gray-400'
                }`}
              />
              <span className="text-sm font-semibold text-gray-300">
                International Council
              </span>
            </div>
            <div className="flex items-center gap-1">
              {councilMembership === 'permanent' && (
                <Award className="w-3 h-3 text-yellow-400" />
              )}
              <span
                className={`text-sm font-bold capitalize ${
                  councilMembership === 'permanent'
                    ? 'text-yellow-400'
                    : councilMembership === 'elected'
                    ? 'text-blue-400'
                    : 'text-gray-400'
                }`}
              >
                {councilMembership}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {councilMembership === 'permanent' && 'Veto power • 2x voting weight'}
            {councilMembership === 'elected' && '1.5x voting weight'}
            {councilMembership === 'observer' && 'Can vote on resolutions'}
          </p>
        </div>
      )}

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`w-4 h-4 ${
                  urgentIncidents.length > 0 ? 'text-red-500 animate-pulse' : 'text-yellow-400'
                }`}
              />
              <span className="text-sm font-semibold text-gray-300">
                Diplomatic Incidents
              </span>
            </div>
            <span className="text-sm font-bold text-gray-400">
              {activeIncidents.length} active
            </span>
          </div>

          {/* Show urgent incidents */}
          {urgentIncidents.length > 0 && (
            <div className="space-y-1">
              {urgentIncidents.slice(0, 3).map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between text-xs p-1 bg-red-900/20 rounded border border-red-800/30"
                >
                  <span className="text-gray-300 truncate">{incident.title}</span>
                  <span className={getIncidentSeverityColor(incident.severity)}>
                    {incident.severity}
                  </span>
                </div>
              ))}
              {urgentIncidents.length > 3 && (
                <p className="text-xs text-gray-500 italic">
                  +{urgentIncidents.length - 3} more urgent
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Covert Operations */}
      {ongoingOperations.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-gray-300">
                Covert Operations
              </span>
            </div>
            <span className="text-sm font-bold text-purple-400">
              {ongoingOperations.length} active
            </span>
          </div>
          <p className="text-xs text-gray-500">Operations in progress...</p>
        </div>
      )}

      {/* Exposed Operations Warning */}
      {exposedOperations.length > 0 && (
        <div className="space-y-1 p-2 bg-red-900/20 rounded border border-red-800/30">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-600 animate-pulse" />
            <span className="text-sm font-semibold text-red-400">
              Operations Exposed!
            </span>
          </div>
          <p className="text-xs text-red-300">
            {exposedOperations.length} covert operation
            {exposedOperations.length > 1 ? 's have' : ' has'} been discovered.
            Expect diplomatic backlash.
          </p>
        </div>
      )}

      {/* Active Peace Conferences */}
      {targetNation && phase3State.peacePeaceConferences.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-gray-300">
              Peace Conferences
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {phase3State.peacePeaceConferences.length} active conference
            {phase3State.peacePeaceConferences.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Inline compact version for quick display
 */
export function DiplomacyPhase3Inline({
  nation,
  phase3State,
}: {
  nation: Nation;
  phase3State?: DiplomacyPhase3State;
}) {
  return (
    <DiplomacyPhase3Display
      nation={nation}
      phase3State={phase3State}
      compact={true}
    />
  );
}
