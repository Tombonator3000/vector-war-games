import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Shield, Users, AlertTriangle, Target } from 'lucide-react';
import type { Nation } from '@/types/game';

export type LedgerStatus = 'self' | 'allied' | 'truce' | 'friendly' | 'neutral' | 'rival' | 'hostile';

export interface LedgerRow {
  id: string;
  nation: Nation;
  name: string;
  leader: string;
  doctrine?: string;
  color: string;
  isPlayer: boolean;
  relationship: number;
  diplomaticStatus: LedgerStatus;
  truceTurns: number;
  allianceActive: boolean;
  militaryPower: number;
  production: number;
  uranium: number;
  intel: number;
  population: number;
  threatLevel: number;
  trustValue: number;
  hasIntelCoverage: boolean;
  victoryProgress: number;
  dominationProgress: number;
  economicProgress: number;
  survivalProgress: number;
  cities: number;
}

type LedgerSortKey =
  | 'name'
  | 'diplomaticStatus'
  | 'relationship'
  | 'trustValue'
  | 'threatLevel'
  | 'militaryPower'
  | 'production'
  | 'uranium'
  | 'intel'
  | 'cities'
  | 'victoryProgress';

type LedgerFilter =
  | 'all'
  | 'allies'
  | 'enemies'
  | 'top5'
  | 'intelGaps'
  | 'highTrust';

interface LedgerTableProps {
  rows: LedgerRow[];
  playerId: string;
  selectedNationId: string | null;
  onSelectNation: (nationId: string) => void;
}

const FILTER_CONFIG: { id: LedgerFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'allies', label: 'Allies' },
  { id: 'enemies', label: 'Rivals' },
  { id: 'top5', label: 'Top 5 Power' },
  { id: 'intelGaps', label: 'Intel Gaps' },
  { id: 'highTrust', label: 'High Trust' },
];

const STATUS_LABELS: Record<LedgerStatus, string> = {
  self: 'You',
  allied: 'Allied',
  truce: 'Truce',
  friendly: 'Friendly',
  neutral: 'Neutral',
  rival: 'Rival',
  hostile: 'Hostile',
};

const STATUS_CLASSNAMES: Record<LedgerStatus, string> = {
  self: 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/40',
  allied: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/40',
  truce: 'bg-blue-500/15 text-blue-200 border border-blue-400/40',
  friendly: 'bg-sky-500/15 text-sky-200 border border-sky-400/40',
  neutral: 'bg-gray-700/40 text-gray-200 border border-gray-500/50',
  rival: 'bg-amber-500/15 text-amber-200 border border-amber-400/40',
  hostile: 'bg-red-500/15 text-red-200 border border-red-400/40',
};

const formatNumber = (value: number) => value.toLocaleString();

const getSortIndicator = (active: boolean, direction: 'asc' | 'desc') => {
  if (!active) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />;
  }

  return (
    <ArrowUpDown
      className={cn(
        'h-3.5 w-3.5 transition-transform text-cyan-300',
        direction === 'desc' ? 'rotate-180' : 'rotate-0'
      )}
    />
  );
};

export const LedgerTable: React.FC<LedgerTableProps> = React.memo(({
  rows,
  playerId,
  selectedNationId,
  onSelectNation,
}) => {
  const [sortKey, setSortKey] = React.useState<LedgerSortKey>('militaryPower');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [activeFilter, setActiveFilter] = React.useState<LedgerFilter>('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  const topFivePowerIds = React.useMemo(() => {
    return [...rows]
      .filter(row => !row.isPlayer)
      .sort((a, b) => b.militaryPower - a.militaryPower)
      .slice(0, 5)
      .map(row => row.id);
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    return rows.filter(row => {
      if (searchTerm) {
        const haystack = `${row.name} ${row.leader} ${row.doctrine ?? ''}`.toLowerCase();
        if (!haystack.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      switch (activeFilter) {
        case 'allies':
          return row.diplomaticStatus === 'allied';
        case 'enemies':
          return ['hostile', 'rival'].includes(row.diplomaticStatus);
        case 'top5':
          return topFivePowerIds.includes(row.id);
        case 'intelGaps':
          return row.id !== playerId && !row.hasIntelCoverage;
        case 'highTrust':
          return row.trustValue >= 70;
        default:
          return true;
      }
    });
  }, [rows, activeFilter, topFivePowerIds, searchTerm, playerId]);

  const sortedRows = React.useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

      const valueA = a[sortKey];
      const valueB = b[sortKey];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return valueA.localeCompare(valueB) * directionMultiplier;
      }

      return ((valueA as number) - (valueB as number)) * directionMultiplier;
    });

    return sorted;
  }, [filteredRows, sortKey, sortDirection]);

  const handleSort = (key: LedgerSortKey) => {
    setSortKey(prevKey => {
      if (prevKey === key) {
        setSortDirection(prevDirection => (prevDirection === 'asc' ? 'desc' : 'asc'));
        return prevKey;
      }

      setSortDirection('desc');
      return key;
    });
  };

  const handleRowClick = (row: LedgerRow) => {
    onSelectNation(row.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_CONFIG.map(filter => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-colors',
                activeFilter === filter.id
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                  : 'border-gray-700 text-gray-300 hover:border-cyan-400 hover:text-cyan-100'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search nations"
            className="bg-gray-900/70 border border-gray-700 text-sm text-gray-200 placeholder:text-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="min-w-full divide-y divide-gray-800 text-sm">
          <thead className="bg-gray-900/60">
            <tr>
              {(
                [
                  { key: 'name', label: 'Civilization' },
                  { key: 'diplomaticStatus', label: 'Status' },
                  { key: 'relationship', label: 'Relation' },
                  { key: 'trustValue', label: 'Trust' },
                  { key: 'threatLevel', label: 'Threat' },
                  { key: 'militaryPower', label: 'Military' },
                  { key: 'production', label: 'Production' },
                  { key: 'uranium', label: 'Uranium' },
                  { key: 'intel', label: 'Intel' },
                  { key: 'cities', label: 'Cities' },
                  { key: 'victoryProgress', label: 'Victory %' },
                ] satisfies { key: LedgerSortKey; label: string }[]
              ).map(column => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400"
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-2 text-gray-300 hover:text-white"
                  >
                    {column.label}
                    {getSortIndicator(sortKey === column.key, sortDirection)}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                Intel
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedRows.map(row => {
              const isSelected = row.id === selectedNationId;
              return (
                <tr
                  key={row.id}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-gray-800/70',
                    isSelected ? 'bg-gray-800/80' : undefined
                  )}
                  onClick={() => handleRowClick(row)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">{row.name}</div>
                        <div className="text-xs text-gray-500">{row.leader}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CLASSNAMES[row.diplomaticStatus])}>
                      {row.diplomaticStatus === 'allied' && <Shield className="h-3 w-3" />}
                      {row.diplomaticStatus === 'hostile' && <AlertTriangle className="h-3 w-3" />}
                      {row.diplomaticStatus === 'friendly' && <Users className="h-3 w-3" />}
                      {STATUS_LABELS[row.diplomaticStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'font-semibold',
                      row.relationship >= 40 ? 'text-emerald-300' : row.relationship <= -30 ? 'text-red-300' : 'text-gray-200'
                    )}>
                      {row.relationship}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'font-semibold',
                      row.trustValue >= 70 ? 'text-emerald-300' : row.trustValue <= 30 ? 'text-red-300' : 'text-yellow-200'
                    )}>
                      {row.trustValue.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'font-semibold',
                      row.threatLevel >= 60 ? 'text-red-300' : row.threatLevel >= 30 ? 'text-amber-200' : 'text-gray-200'
                    )}>
                      {row.threatLevel.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-100">{formatNumber(Math.round(row.militaryPower))}</td>
                  <td className="px-4 py-3 text-gray-100">{formatNumber(Math.round(row.production))}</td>
                  <td className="px-4 py-3 text-gray-100">{formatNumber(Math.round(row.uranium))}</td>
                  <td className="px-4 py-3 text-gray-100">{formatNumber(Math.round(row.intel))}</td>
                  <td className="px-4 py-3 text-gray-100">{row.cities}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded bg-gray-800">
                        <div
                          className="h-full rounded bg-gradient-to-r from-cyan-400 to-cyan-600"
                          style={{ width: `${Math.min(100, row.victoryProgress).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-10 text-right">{row.victoryProgress.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border',
                      row.hasIntelCoverage
                        ? 'border-emerald-400/50 text-emerald-200 bg-emerald-500/10'
                        : 'border-yellow-400/50 text-yellow-200 bg-yellow-500/10'
                    )}>
                      <Target className="h-3 w-3" />
                      {row.hasIntelCoverage ? 'Synced' : 'Needs Recon'}
                    </span>
                  </td>
                </tr>
              );
            })}

            {!sortedRows.length && (
              <tr>
                <td colSpan={12} className="px-4 py-6 text-center text-sm text-gray-500">
                  No nations match the current filters. Try clearing the search or selecting a different chip.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

LedgerTable.displayName = 'LedgerTable';
