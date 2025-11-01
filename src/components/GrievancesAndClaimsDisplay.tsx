/**
 * Grievances and Claims Display Component
 *
 * Shows active grievances and claims between nations
 */

import React from 'react';
import { AlertTriangle, Flag, Clock, X, Check } from 'lucide-react';
import { Nation } from '@/types/game';
import {
  getActiveGrievances,
  getActiveClaims,
  getGrievanceSeverityColor,
  getClaimStrengthColor,
  getTotalGrievanceWeight,
  getTotalClaimJustification,
} from '@/lib/grievancesAndClaimsUtils';
import {
  GrievanceDefinitions,
  ClaimDefinitions,
  type Grievance,
  type Claim,
} from '@/types/grievancesAndClaims';

interface GrievancesAndClaimsDisplayProps {
  nation: Nation;
  targetNation: Nation;
  compact?: boolean;
}

export function GrievancesAndClaimsDisplay({
  nation,
  targetNation,
  compact = false,
}: GrievancesAndClaimsDisplayProps) {
  const activeGrievances = getActiveGrievances(nation, targetNation.id);
  const activeClaims = getActiveClaims(nation, targetNation.id);
  const totalGrievanceWeight = getTotalGrievanceWeight(nation, targetNation.id);
  const totalClaimJustification = getTotalClaimJustification(nation, targetNation.id);

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-xs">
        {/* Grievances indicator */}
        {activeGrievances.length > 0 && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-red-400">{activeGrievances.length}</span>
          </div>
        )}

        {/* Claims indicator */}
        {activeClaims.length > 0 && (
          <div className="flex items-center gap-1">
            <Flag className="w-3 h-3 text-orange-400" />
            <span className="text-orange-400">{activeClaims.length}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-black/30 rounded border border-gray-700">
      {/* Grievances Section */}
      {activeGrievances.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-gray-300">Grievances</span>
            </div>
            <span className="text-xs text-red-400">Weight: {totalGrievanceWeight}</span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {activeGrievances.map((grievance) => (
              <GrievanceItem key={grievance.id} grievance={grievance} />
            ))}
          </div>

          <p className="text-xs text-gray-500 italic">
            Grievances cause diplomatic penalties and hinder cooperation
          </p>
        </div>
      )}

      {/* Claims Section */}
      {activeClaims.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-gray-300">Claims</span>
            </div>
            <span className="text-xs text-orange-400">
              War Justification: +{totalClaimJustification}
            </span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {activeClaims.map((claim) => (
              <ClaimItem key={claim.id} claim={claim} />
            ))}
          </div>

          <p className="text-xs text-gray-500 italic">
            Claims provide justification for war and increase public support
          </p>
        </div>
      )}

      {/* Empty state */}
      {activeGrievances.length === 0 && activeClaims.length === 0 && (
        <div className="text-center py-4">
          <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">
            No grievances or claims between these nations
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual grievance item
 */
function GrievanceItem({ grievance }: { grievance: Grievance }) {
  const severityColor = getGrievanceSeverityColor(grievance.severity);

  return (
    <div className="bg-black/20 rounded p-2 border border-gray-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase ${severityColor}`}>
              {grievance.severity}
            </span>
            {grievance.expiresIn > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {grievance.expiresIn} turns
              </span>
            )}
            {grievance.expiresIn === 0 && (
              <span className="text-xs text-red-400 font-semibold">PERMANENT</span>
            )}
          </div>
          <p className="text-xs text-gray-300 truncate">{grievance.description}</p>
          <div className="flex gap-3 mt-1 text-xs">
            <span className="text-red-400">Trust: {grievance.trustPenalty}</span>
            <span className="text-orange-400">
              Relationship: {grievance.relationshipPenalty}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual claim item
 */
function ClaimItem({ claim }: { claim: Claim }) {
  const strengthColor = getClaimStrengthColor(claim.strength);

  return (
    <div className="bg-black/20 rounded p-2 border border-gray-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase ${strengthColor}`}>
              {claim.strength}
            </span>
            <span className="text-xs text-gray-500 capitalize">{claim.type}</span>
          </div>
          <p className="text-xs text-gray-300 truncate">{claim.description}</p>
          <div className="flex gap-3 mt-1 text-xs">
            <span className="text-orange-400">
              Justification: +{claim.warJustification}
            </span>
            <span className="text-blue-400">Support: {claim.publicSupport}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline compact version for use in lists
 */
export function GrievancesAndClaimsInline({
  nation,
  targetNation,
}: {
  nation: Nation;
  targetNation: Nation;
}) {
  return (
    <GrievancesAndClaimsDisplay nation={nation} targetNation={targetNation} compact />
  );
}
