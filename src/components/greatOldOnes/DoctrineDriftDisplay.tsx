/**
 * Doctrine Drift Display
 * Shows how player actions are shifting their doctrine over time
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, Info } from 'lucide-react';
import type { Doctrine, DoctrineDrift } from '@/types/greatOldOnes';
import { DOCTRINES } from '@/types/greatOldOnes';
import { getDriftPercentage, getDominantDrift } from '@/lib/hybridDoctrineHelpers';
import { checkDriftWarning, getDriftCorrectiveActions } from '@/lib/doctrineDriftIntegration';

interface DoctrineDriftDisplayProps {
  drift: DoctrineDrift;
  currentDoctrine: Doctrine | null;
}

const DOCTRINE_COLORS: Record<Doctrine, string> = {
  domination: 'text-red-400',
  corruption: 'text-purple-400',
  convergence: 'text-blue-400',
};

const DOCTRINE_BG_COLORS: Record<Doctrine, string> = {
  domination: 'bg-red-500',
  corruption: 'bg-purple-500',
  convergence: 'bg-blue-500',
};

export const DoctrineDriftDisplay: React.FC<DoctrineDriftDisplayProps> = ({
  drift,
  currentDoctrine,
}) => {
  if (!drift.active) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <p className="text-sm text-slate-400">Doctrine Drift is currently disabled.</p>
        </CardContent>
      </Card>
    );
  }

  const dominantDrift = getDominantDrift(drift);
  const warning = checkDriftWarning({
    doctrineDrift: drift,
    doctrine: currentDoctrine,
  } as any);

  const correctiveActions = currentDoctrine ? getDriftCorrectiveActions(currentDoctrine) : [];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Doctrine Drift
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your actions shape the Order's philosophy
            </CardDescription>
          </div>
          {!drift.active && (
            <Badge className="bg-slate-700 text-slate-400">Disabled</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Drift Warning */}
        {warning.warning && warning.driftingToward && (
          <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-300">Doctrine Drift Warning!</p>
                <p className="text-xs text-amber-200 mt-1">
                  Your actions are shifting the Order toward{' '}
                  <span className="font-bold">{DOCTRINES[warning.driftingToward].name}</span>{' '}
                  ({warning.percentageToThreshold}% to threshold). If drift reaches 100%, your
                  doctrine will automatically change.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Drift Values */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300">Drift Toward Each Doctrine</h4>

          {(Object.keys(drift.driftValues) as Doctrine[]).map((doctrine) => {
            const driftValue = drift.driftValues[doctrine];
            const percentage = getDriftPercentage(drift, doctrine);
            const isCurrent = doctrine === currentDoctrine;

            return (
              <div key={doctrine} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${DOCTRINE_COLORS[doctrine]}`}>
                      {DOCTRINES[doctrine].name}
                    </span>
                    {isCurrent && (
                      <Badge className="text-xs bg-cyan-900 text-cyan-300 border-cyan-700">
                        Current
                      </Badge>
                    )}
                  </div>
                  <span className="text-slate-400">
                    {driftValue} / {drift.driftThreshold}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${DOCTRINE_BG_COLORS[doctrine]}`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <p className="text-xs text-slate-500">{DOCTRINES[doctrine].tagline}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Actions */}
        {drift.recentActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-300">Recent Drift-Causing Actions</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {drift.recentActions.slice(0, 5).map((action, index) => (
                <div
                  key={`${action.turn}-${index}`}
                  className="flex items-center justify-between p-2 bg-slate-900/50 rounded text-xs"
                >
                  <span className="text-slate-400 flex-1">
                    <span className="text-slate-500">T{action.turn}:</span> {action.description}
                  </span>
                  <span className={`font-bold ml-2 ${DOCTRINE_COLORS[action.doctrineAffinity]}`}>
                    +{action.driftAmount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corrective Actions */}
        {warning.warning && correctiveActions.length > 0 && (
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <div className="flex items-start gap-2 mb-2">
              <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <h4 className="text-sm font-bold text-cyan-400">
                To maintain {currentDoctrine && DOCTRINES[currentDoctrine].name}:
              </h4>
            </div>
            <ul className="space-y-1 ml-6">
              {correctiveActions.map((action, index) => (
                <li key={index} className="text-xs text-slate-400">
                  • {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Info Notice */}
        <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
          <p className="text-xs text-slate-400">
            <strong>Doctrine Drift:</strong> Your actions gradually shift your doctrine. Summoning
            entities increases Domination drift, infiltration operations increase Corruption drift,
            and enlightenment programs increase Convergence drift. Drift slowly decays over time
            toward neutral.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
