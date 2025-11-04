/**
 * Resource Market Panel
 *
 * Displays resource market prices, trends, and allows trading
 */

import React from 'react';
import type { ResourceMarket } from '@/lib/resourceMarketSystem';
import type { StrategyResourceType } from '@/types/territorialResources';
import { RESOURCE_INFO } from '@/types/territorialResources';
import { getMarketTrendIndicator, getPriceChangePercent } from '@/lib/resourceMarketSystem';
import { TrendingUp, TrendingDown, AlertCircle, Activity } from 'lucide-react';

interface ResourceMarketPanelProps {
  market: ResourceMarket;
  compact?: boolean;
}

export function ResourceMarketPanel({ market, compact = false }: ResourceMarketPanelProps) {
  const resources: StrategyResourceType[] = ['oil', 'uranium', 'rare_earths', 'food'];

  if (compact) {
    return (
      <div className="space-y-2">
        {resources.map(resource => {
          const info = RESOURCE_INFO[resource];
          const price = Math.round(market.prices[resource]);
          const priceChange = getPriceChangePercent(resource, market);
          const isUp = priceChange > 0;

          return (
            <div key={resource} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span>{info.icon}</span>
                <span className="font-semibold">{info.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono">{price}💰</span>
                {priceChange !== 0 && (
                  <span className={`flex items-center gap-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{Math.abs(priceChange).toFixed(1)}%</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Market Event Banner */}
      {market.activeEvent && (
        <div className="bg-amber-500/20 border border-amber-500/60 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300">{market.activeEvent.name}</div>
              <div className="text-xs text-amber-200/80 mt-1">{market.activeEvent.description}</div>
              <div className="text-xs text-amber-300/60 mt-1">
                {market.eventDuration} turns remaining
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Volatility */}
      <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold">Market Volatility</span>
          </div>
          <span className={`text-sm font-bold ${
            market.volatility > 0.5 ? 'text-red-400' :
            market.volatility > 0.3 ? 'text-amber-400' :
            'text-green-400'
          }`}>
            {(market.volatility * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Resource Prices */}
      <div className="space-y-2">
        {resources.map(resource => {
          const info = RESOURCE_INFO[resource];
          const price = Math.round(market.prices[resource]);
          const basePrice = market.basePrices[resource];
          const priceChange = getPriceChangePercent(resource, market);
          const trend = market.trend[resource];
          const trendIndicator = getMarketTrendIndicator(trend);
          const isUp = priceChange > 0;
          const vsBase = ((price - basePrice) / basePrice) * 100;

          return (
            <div key={resource} className="bg-gray-800/50 p-3 rounded-lg border border-gray-600/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.icon}</span>
                  <div>
                    <div className="font-semibold text-sm">{info.name}</div>
                    <div className="text-xs text-gray-400">{info.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono">{price}💰</div>
                  <div className="text-xs text-gray-400">Base: {basePrice}💰</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${
                    trend > 0.1 ? 'text-green-400' :
                    trend < -0.1 ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {trendIndicator}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {priceChange !== 0 && (
                    <span className={`flex items-center gap-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isUp ? '+' : ''}{priceChange.toFixed(1)}%</span>
                    </span>
                  )}
                  <span className={`font-mono ${
                    vsBase > 20 ? 'text-red-400' :
                    vsBase > 0 ? 'text-amber-400' :
                    vsBase < -20 ? 'text-green-400' :
                    'text-gray-400'
                  }`}>
                    {vsBase > 0 ? '+' : ''}{vsBase.toFixed(0)}% vs base
                  </span>
                </div>
              </div>

              {/* Price bar */}
              <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (price / (basePrice * 3)) * 100)}%`,
                    backgroundColor: info.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Trading Tips */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
        <div className="text-xs text-cyan-200">
          <div className="font-semibold mb-1">💡 Trading Tips</div>
          <ul className="space-y-1 text-cyan-200/80">
            <li>• Buy low during market crashes and oversupply events</li>
            <li>• Sell high during crises and shortages</li>
            <li>• High volatility = more risk but more opportunity</li>
            <li>• Secure long-term trade agreements to hedge against price swings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact market status badge
 */
export function MarketStatusBadge({ market }: { market: ResourceMarket }) {
  const hasEvent = !!market.activeEvent;
  const highVolatility = market.volatility > 0.5;

  if (hasEvent) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 border border-amber-500/60 rounded text-xs">
        <AlertCircle className="w-3 h-3 text-amber-400" />
        <span className="text-amber-300 font-semibold">{market.activeEvent.name}</span>
      </div>
    );
  }

  if (highVolatility) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/60 rounded text-xs">
        <Activity className="w-3 h-3 text-red-400" />
        <span className="text-red-300 font-semibold">High Volatility</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/60 rounded text-xs">
      <Activity className="w-3 h-3 text-green-400" />
      <span className="text-green-300 font-semibold">Stable Market</span>
    </div>
  );
}
