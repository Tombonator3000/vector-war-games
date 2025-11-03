/**
 * Doctrine Incident Modal Component
 *
 * Displays doctrine incidents to the player and handles their choices.
 * Shows the incident description, available choices, and consequences.
 */

import { Button } from '@/components/ui/button';
import type { DoctrineIncident, DoctrineIncidentChoice } from '@/types/doctrineIncidents';
import { AlertTriangle, Zap, TrendingUp, AlertCircle } from 'lucide-react';

export interface DoctrineIncidentModalProps {
  incident: DoctrineIncident;
  onChoose: (choiceId: string) => void;
  onDismiss?: () => void;
}

export function DoctrineIncidentModal({ incident, onChoose, onDismiss }: DoctrineIncidentModalProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-500 border-red-500 bg-red-500/10';
      case 'high':
        return 'text-orange-500 border-orange-500 bg-orange-500/10';
      case 'medium':
        return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-blue-500 border-blue-500 bg-blue-500/10';
      default:
        return 'text-cyan border-cyan bg-cyan/10';
    }
  };

  const getUrgencyIcon = (iconType?: string) => {
    switch (iconType) {
      case 'crisis':
        return <AlertTriangle className="w-8 h-8" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8" />;
      case 'opportunity':
        return <TrendingUp className="w-8 h-8" />;
      default:
        return <Zap className="w-8 h-8" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      minor: { text: 'MINOR', color: 'text-blue-400 bg-blue-400/20' },
      major: { text: 'MAJOR', color: 'text-yellow-400 bg-yellow-400/20' },
      critical: { text: 'CRITICAL', color: 'text-red-400 bg-red-400/20' },
    };
    const badge = badges[severity as keyof typeof badges] || badges.major;

    return (
      <span
        className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wider ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

  const getDoctrineAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'mad':
        return 'border-red-500 hover:bg-red-500/10';
      case 'defense':
        return 'border-blue-500 hover:bg-blue-500/10';
      case 'firstStrike':
        return 'border-orange-500 hover:bg-orange-500/10';
      case 'detente':
        return 'border-green-500 hover:bg-green-500/10';
      default:
        return 'border-gray-500 hover:bg-gray-500/10';
    }
  };

  const getChoiceConsequenceSummary = (choice: DoctrineIncidentChoice): string[] => {
    const consequences = choice.consequences;
    const summary: string[] = [];

    // Resource impacts
    if (consequences.goldCost) {
      summary.push(`💰 ${consequences.goldCost > 0 ? '-' : '+'}${Math.abs(consequences.goldCost)} Gold`);
    }
    if (consequences.productionCost) {
      summary.push(
        `🏭 ${consequences.productionCost > 0 ? '-' : '+'}${Math.abs(consequences.productionCost)} Production`
      );
    }
    if (consequences.intelCost) {
      summary.push(`🕵️ ${consequences.intelCost > 0 ? '-' : '+'}${Math.abs(consequences.intelCost)} Intel`);
    }

    // Military impacts
    if (consequences.missileDelta) {
      summary.push(`🚀 ${consequences.missileDelta > 0 ? '+' : ''}${consequences.missileDelta} Missiles`);
    }
    if (consequences.defenseDelta) {
      summary.push(`🛡️ ${consequences.defenseDelta > 0 ? '+' : ''}${consequences.defenseDelta} Defense`);
    }

    // Domestic impacts
    if (consequences.moraleDelta) {
      summary.push(`😊 ${consequences.moraleDelta > 0 ? '+' : ''}${consequences.moraleDelta} Morale`);
    }
    if (consequences.instabilityDelta) {
      summary.push(
        `⚠️ ${consequences.instabilityDelta > 0 ? '+' : ''}${consequences.instabilityDelta} Instability`
      );
    }

    // Diplomatic impacts
    if (consequences.globalRelationshipChange) {
      summary.push(
        `🌐 ${consequences.globalRelationshipChange > 0 ? '+' : ''}${consequences.globalRelationshipChange} Global Relations`
      );
    }
    if (consequences.deterrenceChange) {
      summary.push(
        `⚡ ${consequences.deterrenceChange > 0 ? '+' : ''}${consequences.deterrenceChange} Deterrence`
      );
    }

    // Doctrine shift
    if (consequences.doctrineShift) {
      summary.push(`📊 Shift toward ${consequences.doctrineShift.toward.toUpperCase()}`);
    }

    // Special effects
    if (consequences.triggerWar) {
      summary.push('⚔️ TRIGGERS WAR');
    }
    if (consequences.breakTreaties) {
      summary.push('📜 BREAKS TREATIES');
    }
    if (consequences.gainTech) {
      summary.push(`🔬 Gain Technology`);
    }

    return summary;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className={`max-w-4xl w-full bg-background border-2 rounded-lg shadow-2xl ${getUrgencyColor(incident.urgency)}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-current">
          <div className="flex items-start gap-4">
            <div className={getUrgencyColor(incident.urgency)}>{getUrgencyIcon(incident.iconType)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-mono font-bold text-neon-yellow tracking-wider">
                  {incident.title}
                </h2>
                {getSeverityBadge(incident.severity)}
              </div>
              <div className="text-sm font-mono text-muted-foreground">
                Doctrine: <span className="text-neon-magenta uppercase">{incident.doctrineType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 border-b border-gray-800">
          <p className="text-base leading-relaxed text-cyan font-mono">{incident.description}</p>
        </div>

        {/* Choices */}
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-mono font-bold text-neon-green mb-4">YOUR OPTIONS:</h3>

          {incident.choices.map((choice) => {
            const consequenceSummary = getChoiceConsequenceSummary(choice);

            return (
              <div
                key={choice.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${getDoctrineAlignmentColor(choice.doctrineAlignment)}`}
                onClick={() => onChoose(choice.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-mono font-bold text-white text-sm">{choice.text}</p>
                      {choice.doctrineAlignment !== 'neutral' && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                          {choice.doctrineAlignment.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Consequences */}
                    {consequenceSummary.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {consequenceSummary.map((consequence, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-mono px-2 py-1 rounded bg-black/40 text-gray-300"
                          >
                            {consequence}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChoose(choice.id);
                    }}
                  >
                    SELECT
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {onDismiss && (
          <div className="p-4 border-t border-gray-800 flex justify-end">
            <Button variant="ghost" onClick={onDismiss} className="font-mono text-xs">
              DISMISS (LATER)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
