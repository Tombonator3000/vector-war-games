/**
 * Doctrine Selection Panel
 * Allows player to choose their path: Domination, Corruption, or Convergence
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skull, Eye, Sparkles, TrendingUp, TrendingDown, Lock } from 'lucide-react';
import type { Doctrine, DoctrineConfig } from '@/types/greatOldOnes';
import { DOCTRINES } from '@/types/greatOldOnes';

interface DoctrineSelectionPanelProps {
  onSelectDoctrine: (doctrine: Doctrine) => void;
  canSelect: boolean;
}

const DOCTRINE_ICONS: Record<Doctrine, React.ReactNode> = {
  domination: <Skull className="w-8 h-8" />,
  corruption: <Eye className="w-8 h-8" />,
  convergence: <Sparkles className="w-8 h-8" />,
};

const DOCTRINE_COLORS: Record<Doctrine, string> = {
  domination: 'text-red-500',
  corruption: 'text-purple-500',
  convergence: 'text-blue-500',
};

export const DoctrineSelectionPanel: React.FC<DoctrineSelectionPanelProps> = ({
  onSelectDoctrine,
  canSelect,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl mb-2 text-slate-100">
              Choose Your Path
            </CardTitle>
            <CardDescription className="text-lg text-slate-300">
              The Esoteric Order stands at a crossroads. How shall we bring about the awakening of
              the Great Old Ones?
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(DOCTRINES).map(([key, doctrine]) => (
                <DoctrineCard
                  key={key}
                  doctrine={doctrine}
                  icon={DOCTRINE_ICONS[key as Doctrine]}
                  color={DOCTRINE_COLORS[key as Doctrine]}
                  onSelect={() => onSelectDoctrine(key as Doctrine)}
                  canSelect={canSelect}
                />
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300 text-center">
                <strong className="text-amber-400">Warning:</strong> Once a doctrine is chosen, it
                cannot be changed except through a Council Schism event. Choose wisely.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface DoctrineCardProps {
  doctrine: DoctrineConfig;
  icon: React.ReactNode;
  color: string;
  onSelect: () => void;
  canSelect: boolean;
}

const DoctrineCard: React.FC<DoctrineCardProps> = ({
  doctrine,
  icon,
  color,
  onSelect,
  canSelect,
}) => {
  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className={color}>{icon}</div>
          <CardTitle className="text-2xl text-slate-100">{doctrine.name}</CardTitle>
        </div>
        <div className={`text-sm font-semibold ${color}`}>{doctrine.tagline}</div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-slate-300">{doctrine.description}</p>

        {/* Bonuses */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-green-400 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Bonuses
          </h4>
          <div className="space-y-1">
            {Object.entries(doctrine.bonuses)
              .filter(([_, value]) => value !== undefined)
              .map(([key, value]) => (
                <BonusItem key={key} name={formatBonusName(key)} value={value!} isBonus={true} />
              ))}
          </div>
        </div>

        {/* Penalties */}
        {Object.keys(doctrine.penalties).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-red-400 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              Penalties
            </h4>
            <div className="space-y-1">
              {Object.entries(doctrine.penalties)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => (
                  <BonusItem key={key} name={formatBonusName(key)} value={value!} isBonus={false} />
                ))}
            </div>
          </div>
        )}

        {/* Unlocked Mechanics */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1">
            <Lock className="w-4 h-4" />
            Unlocks
          </h4>
          <div className="flex flex-wrap gap-1">
            {doctrine.unlockedMechanics.map(mechanic => (
              <Badge key={mechanic} variant="outline" className="text-xs bg-slate-700 text-slate-300">
                {formatMechanicName(mechanic)}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={onSelect}
          disabled={!canSelect}
          className={`w-full ${color.replace('text-', 'bg-').replace('500', '600')} hover:${color.replace('text-', 'bg-').replace('500', '700')}`}
        >
          Choose {doctrine.name}
        </Button>
      </CardContent>
    </Card>
  );
};

interface BonusItemProps {
  name: string;
  value: number;
  isBonus: boolean;
}

const BonusItem: React.FC<BonusItemProps> = ({ name, value, isBonus }) => {
  const displayValue = value > 1 ? `+${Math.round((value - 1) * 100)}%` : `${Math.round((1 - value) * 100)}%`;
  const color = isBonus ? 'text-green-400' : 'text-red-400';

  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{name}</span>
      <span className={color}>{displayValue}</span>
    </div>
  );
};

function formatBonusName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatMechanicName(mechanic: string): string {
  return mechanic
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
