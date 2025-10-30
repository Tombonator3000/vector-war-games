import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, DollarSign, ArrowRightLeft, AlertCircle } from 'lucide-react';
import type { TradeRoute, ResourceMarket, EconomicEvent, ResourceType } from '@/types/economy';
import { BASE_MARKET_PRICES } from '@/types/economy';

interface EconomicDashboardProps {
  tradeRoutes: TradeRoute[];
  market: ResourceMarket;
  activeEvents: EconomicEvent[];
  playerResources: {
    production: number;
    uranium: number;
    intel: number;
  };
  resourceIncome: {
    production: number;
    uranium: number;
    intel: number;
  };
  resourceExpenses: {
    production: number;
    uranium: number;
    intel: number;
  };
  isVisible: boolean;
}

export function EconomicDashboard({
  tradeRoutes,
  market,
  activeEvents,
  playerResources,
  resourceIncome,
  resourceExpenses,
  isVisible,
}: EconomicDashboardProps) {
  if (!isVisible) return null;

  const netIncome = {
    production: resourceIncome.production - resourceExpenses.production,
    uranium: resourceIncome.uranium - resourceExpenses.uranium,
    intel: resourceIncome.intel - resourceExpenses.intel,
  };

  const totalNetIncome =
    netIncome.production * market.prices.production +
    netIncome.uranium * market.prices.uranium +
    netIncome.intel * market.prices.intel;

  return (
    <Card className="bg-black/90 border-cyan-500/60 shadow-xl w-96">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-400" />
          <h3 className="text-sm font-bold text-cyan-100 uppercase tracking-wider">
            Economic Dashboard
          </h3>
        </div>

        <ScrollArea className="max-h-[600px]">
          {/* Active Events */}
          {activeEvents.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-orange-300 mb-2 uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Active Events ({activeEvents.length})
              </p>
              <div className="space-y-2">
                {activeEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-orange-900/20 border border-orange-500/30"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{event.icon}</span>
                      <p className="text-xs font-semibold text-orange-300">
                        {event.title}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-1">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500">
                        {event.duration} turns remaining
                      </span>
                      {event.effects.productionModifier && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${
                            event.effects.productionModifier > 0
                              ? 'border-green-500/50 text-green-400'
                              : 'border-red-500/50 text-red-400'
                          }`}
                        >
                          🏭 {event.effects.productionModifier > 0 ? '+' : ''}
                          {event.effects.productionModifier}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Prices */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-cyan-300 mb-2 uppercase">
              Market Prices
            </p>
            <div className="space-y-2">
              {Object.entries(market.prices).map(([resource, price]) => {
                const basePrice = BASE_MARKET_PRICES[resource as ResourceType];
                const priceChange = ((price - basePrice) / basePrice) * 100;
                const isUp = priceChange > 0;

                return (
                  <div
                    key={resource}
                    className="flex items-center justify-between p-2 rounded bg-gray-900/50"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {resource === 'production' && '🏭'}
                        {resource === 'uranium' && '⚛️'}
                        {resource === 'intel' && '🔍'}
                      </span>
                      <span className="text-xs text-gray-300 capitalize">
                        {resource}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-white">
                        {price.toFixed(1)}¢
                      </span>
                      <div
                        className={`flex items-center gap-1 text-[10px] ${
                          isUp ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {isUp ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {isUp ? '+' : ''}
                          {priceChange.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resource Balance */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-cyan-300 mb-2 uppercase">
              Resource Balance
            </p>
            <div className="space-y-2">
              {Object.entries(netIncome).map(([resource, net]) => {
                const income = resourceIncome[resource as ResourceType];
                const expense = resourceExpenses[resource as ResourceType];

                return (
                  <div key={resource} className="p-2 rounded bg-gray-900/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-300 capitalize">
                        {resource}
                      </span>
                      <span
                        className={`text-sm font-mono font-bold ${
                          net > 0
                            ? 'text-green-400'
                            : net < 0
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {net > 0 ? '+' : ''}
                        {net}/turn
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>↑ {income}</span>
                      <span>↓ {expense}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Net Worth */}
            <div className="mt-3 p-3 rounded bg-cyan-900/20 border border-cyan-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-300">
                  Net Income (Market Value)
                </span>
                <span
                  className={`text-lg font-mono font-bold ${
                    totalNetIncome > 0
                      ? 'text-green-400'
                      : totalNetIncome < 0
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  {totalNetIncome > 0 ? '+' : ''}
                  {totalNetIncome.toFixed(1)}¢/turn
                </span>
              </div>
            </div>
          </div>

          {/* Trade Routes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-purple-300 uppercase">
                Trade Routes
              </p>
              <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-400">
                {tradeRoutes.filter((r) => r.active).length} Active
              </Badge>
            </div>

            {tradeRoutes.length > 0 ? (
              <div className="space-y-2">
                {tradeRoutes.map((route) => {
                  const value = route.amountPerTurn * market.prices[route.resource];

                  return (
                    <div
                      key={route.id}
                      className={`p-2 rounded border ${
                        route.active
                          ? 'bg-purple-900/20 border-purple-500/30'
                          : 'bg-gray-900/50 border-gray-700/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-xs">
                          <ArrowRightLeft className="w-3 h-3 text-purple-400" />
                          <span className="text-gray-300">
                            {route.resource === 'production' && '🏭'}
                            {route.resource === 'uranium' && '⚛️'}
                            {route.resource === 'intel' && '🔍'}
                          </span>
                          <span className="text-gray-400">
                            {route.amountPerTurn}/turn
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-purple-400">
                          {value.toFixed(1)}¢/turn
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Maintenance: {route.maintenanceCost} Production
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <ArrowRightLeft className="w-8 h-8 mx-auto text-gray-600 mb-1" />
                <p className="text-xs text-gray-500">No trade routes established</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
