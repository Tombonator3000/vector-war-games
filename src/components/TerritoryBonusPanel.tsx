import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, TrendingUp, MapPin } from 'lucide-react';
import type {
  TerritoryBonus,
  ContinentBonus,
  TerritoryImprovement,
} from '@/types/territory';
import { CONTINENT_BONUSES, getNearControlContinents } from '@/types/territory';

interface TerritoryBonusPanelProps {
  controlledTerritories: string[];
  improvements: TerritoryImprovement[];
  totalBonus: TerritoryBonus;
  isVisible: boolean;
}

export function TerritoryBonusPanel({
  controlledTerritories,
  improvements,
  totalBonus,
  isVisible,
}: TerritoryBonusPanelProps) {
  if (!isVisible) return null;

  const controlledContinents = Object.values(CONTINENT_BONUSES).filter((continent) =>
    continent.requiredTerritories.every((territory) =>
      controlledTerritories.includes(territory)
    )
  );

  const nearControlContinents = getNearControlContinents(controlledTerritories);

  return (
    <Card className="bg-black/90 border-cyan-500/60 shadow-xl w-80">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-cyan-100 uppercase tracking-wider">
            Territory Bonuses
          </h3>
        </div>

        <ScrollArea className="max-h-[500px]">
          {/* Total Bonuses Summary */}
          <div className="mb-4 p-3 rounded bg-cyan-900/20 border border-cyan-500/30">
            <p className="text-xs font-semibold text-cyan-300 mb-2 uppercase">
              Active Bonuses
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {totalBonus.productionPerTurn! > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-green-400">🏭</span>
                  <span className="text-gray-300">
                    +{totalBonus.productionPerTurn}/turn
                  </span>
                </div>
              )}
              {totalBonus.uraniumPerTurn! > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-green-400">⚛️</span>
                  <span className="text-gray-300">
                    +{totalBonus.uraniumPerTurn}/turn
                  </span>
                </div>
              )}
              {totalBonus.intelPerTurn! > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-purple-400">🔍</span>
                  <span className="text-gray-300">+{totalBonus.intelPerTurn}/turn</span>
                </div>
              )}
              {totalBonus.defenseBonus! > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-400">🛡️</span>
                  <span className="text-gray-300">+{totalBonus.defenseBonus}%</span>
                </div>
              )}
              {totalBonus.missileCapacity! > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-red-400">🚀</span>
                  <span className="text-gray-300">+{totalBonus.missileCapacity}</span>
                </div>
              )}
              {totalBonus.researchSpeedBonus! > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-cyan-400">🔬</span>
                  <span className="text-gray-300">
                    +{totalBonus.researchSpeedBonus}%
                  </span>
                </div>
              )}
            </div>
            {Object.values(totalBonus).every((val) => val === 0) && (
              <p className="text-xs text-gray-500">No active bonuses</p>
            )}
          </div>

          {/* Controlled Continents */}
          {controlledContinents.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <p className="text-xs font-semibold text-yellow-300 uppercase">
                  Controlled Continents
                </p>
              </div>
              <div className="space-y-2">
                {controlledContinents.map((continent) => (
                  <ContinentCard key={continent.continentId} continent={continent} />
                ))}
              </div>
            </div>
          )}

          {/* Near Control */}
          {nearControlContinents.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <p className="text-xs font-semibold text-orange-300 uppercase">
                  Near Control
                </p>
              </div>
              <div className="space-y-2">
                {nearControlContinents.map(({ continent, territoriesNeeded }) => (
                  <div
                    key={continent.continentId}
                    className="p-2 rounded bg-orange-900/10 border border-orange-500/30"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{continent.icon}</span>
                      <p className="text-xs font-semibold text-orange-300">
                        {continent.name}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-1">
                      Need: {territoriesNeeded.join(', ')}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-orange-400">
                      <span>Bonus:</span>
                      {continent.productionPerTurn && (
                        <span>🏭+{continent.productionPerTurn}</span>
                      )}
                      {continent.uraniumPerTurn && (
                        <span>⚛️+{continent.uraniumPerTurn}</span>
                      )}
                      {continent.intelPerTurn && (
                        <span>🔍+{continent.intelPerTurn}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Territory Improvements */}
          {improvements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-cyan-300 mb-2 uppercase">
                Improvements ({improvements.length})
              </p>
              <div className="space-y-1">
                {improvements.map((improvement, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-gray-900/50 border border-gray-700/30 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{improvement.improvement.icon}</span>
                        <span className="text-gray-300">{improvement.improvement.name}</span>
                      </div>
                      <span className="text-gray-500 text-[10px]">
                        {improvement.territoryId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {controlledContinents.length === 0 &&
            nearControlContinents.length === 0 &&
            improvements.length === 0 && (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">No territories controlled</p>
                <p className="text-xs text-gray-600 mt-1">
                  Capture territories to gain bonuses
                </p>
              </div>
            )}
        </ScrollArea>
      </div>
    </Card>
  );
}

function ContinentCard({ continent }: { continent: ContinentBonus }) {
  return (
    <div className="p-3 rounded bg-yellow-900/20 border border-yellow-500/30">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{continent.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-yellow-300">{continent.name}</p>
          <p className="text-[10px] text-gray-400">{continent.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
        {continent.productionPerTurn && (
          <Badge variant="outline" className="border-green-500/50 text-green-400">
            🏭 +{continent.productionPerTurn}/turn
          </Badge>
        )}
        {continent.uraniumPerTurn && (
          <Badge variant="outline" className="border-green-500/50 text-green-400">
            ⚛️ +{continent.uraniumPerTurn}/turn
          </Badge>
        )}
        {continent.intelPerTurn && (
          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
            🔍 +{continent.intelPerTurn}/turn
          </Badge>
        )}
        {continent.defenseBonus && (
          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
            🛡️ +{continent.defenseBonus}%
          </Badge>
        )}
        {continent.missileCapacity && (
          <Badge variant="outline" className="border-red-500/50 text-red-400">
            🚀 +{continent.missileCapacity}
          </Badge>
        )}
        {continent.researchSpeedBonus && (
          <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
            🔬 +{continent.researchSpeedBonus}%
          </Badge>
        )}
      </div>
    </div>
  );
}
