import React, { useCallback, useMemo, useState } from 'react';
import { Nation } from '@/types/game';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown, ListTree, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortColumn =
  | 'name'
  | 'status'
  | 'militaryPower'
  | 'production'
  | 'uranium'
  | 'intel'
  | 'relationship'
  | 'morale';

type SortDirection = 'asc' | 'desc';

type FilterType = 'all' | 'allies' | 'enemies' | 'neutrals' | 'top5';

interface LedgerTableProps {
  nations: Nation[];
  player: Nation;
  selectedNationId: string | null;
  onSelectNation: (nationId: string) => void;
  calculateMilitaryPower: (nation: Nation) => number;
  playerMilitaryPower: number;
}

interface LedgerRow {
  id: string;
  name: string;
  leader: string;
  doctrine?: string;
  color: string;
  isPlayer: boolean;
  statusLabel: string;
  category: 'player' | 'ally' | 'truce' | 'enemy' | 'neutral';
  militaryPower: number;
  powerShare: number;
  production: number;
  uranium: number;
  intel: number;
  relationship: number;
  morale: number;
  truceTurns?: number;
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'allies', label: 'Allierte' },
  { value: 'enemies', label: 'Fiender' },
  { value: 'neutrals', label: 'Nøytrale' },
  { value: 'top5', label: 'Topp 5 styrke' },
];

const moraleColor = (value: number) => {
  if (value >= 75) return 'text-emerald-300';
  if (value >= 50) return 'text-sky-300';
  if (value >= 30) return 'text-amber-300';
  return 'text-red-400';
};

const relationshipColor = (value: number) => {
  if (value >= 40) return 'text-emerald-300';
  if (value <= -40) return 'text-red-400';
  return 'text-yellow-300';
};

const powerShareColor = (value: number, isPlayer: boolean) => {
  if (isPlayer) return 'text-cyan-300';
  if (value >= 120) return 'text-red-400';
  if (value <= 80) return 'text-emerald-300';
  return 'text-yellow-300';
};

const LedgerTableComponent: React.FC<LedgerTableProps> = ({
  nations,
  player,
  selectedNationId,
  onSelectNation,
  calculateMilitaryPower,
  playerMilitaryPower,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: 'militaryPower',
    direction: 'desc',
  });

  const ledgerRows = useMemo<LedgerRow[]>(() => {
    return nations.map((nation) => {
      const isPlayer = nation.id === player.id;
      const treaty = player.treaties?.[nation.id];
      const allied = Boolean(treaty?.alliance || player.alliances?.includes(nation.id));
      const truceTurns = treaty?.truceTurns ?? 0;
      const relationshipScore = isPlayer ? 100 : player.relationships?.[nation.id] ?? 0;
      const threatScore = player.threats?.[nation.id] ?? 0;
      const category: LedgerRow['category'] = isPlayer
        ? 'player'
        : allied
        ? 'ally'
        : truceTurns > 0
        ? 'truce'
        : relationshipScore <= -40 || threatScore > 0
        ? 'enemy'
        : 'neutral';

      const statusLabel = isPlayer
        ? 'Egen nasjon'
        : allied
        ? 'Alliert'
        : truceTurns > 0
        ? `Våpenhvile (${truceTurns})`
        : relationshipScore <= -40 || threatScore > 0
        ? 'Fiendtlig'
        : relationshipScore >= 40
        ? 'Vennlig'
        : 'Nøytral';

      const militaryPower = calculateMilitaryPower(nation);
      const powerShare = playerMilitaryPower > 0
        ? Math.round((militaryPower / playerMilitaryPower) * 100)
        : 100;

      return {
        id: nation.id,
        name: nation.name,
        leader: nation.leader,
        doctrine: nation.doctrine,
        color: nation.color,
        isPlayer,
        statusLabel,
        category,
        militaryPower,
        powerShare,
        production: Math.round(nation.production ?? 0),
        uranium: Math.round(nation.uranium ?? 0),
        intel: Math.round(nation.intel ?? 0),
        relationship: relationshipScore,
        morale: Math.round(nation.morale ?? 0),
        truceTurns: truceTurns > 0 ? truceTurns : undefined,
      };
    });
  }, [nations, player, calculateMilitaryPower, playerMilitaryPower]);

  const topFiveIds = useMemo(() => {
    return new Set(
      [...ledgerRows]
        .sort((a, b) => b.militaryPower - a.militaryPower)
        .slice(0, 5)
        .map((row) => row.id)
    );
  }, [ledgerRows]);

  const filteredRows = useMemo(() => {
    let rows = ledgerRows;

    if (activeFilter === 'allies') {
      rows = rows.filter((row) => row.category === 'ally');
    } else if (activeFilter === 'enemies') {
      rows = rows.filter((row) => row.category === 'enemy');
    } else if (activeFilter === 'neutrals') {
      rows = rows.filter((row) => row.category === 'neutral' || row.category === 'truce');
    } else if (activeFilter === 'top5') {
      rows = rows.filter((row) => topFiveIds.has(row.id));
    }

    const sorted = [...rows].sort((a, b) => {
      const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;
      switch (sortConfig.column) {
        case 'name':
          return directionMultiplier * a.name.localeCompare(b.name);
        case 'status':
          return directionMultiplier * a.statusLabel.localeCompare(b.statusLabel);
        case 'militaryPower':
          return directionMultiplier * (a.militaryPower - b.militaryPower);
        case 'production':
          return directionMultiplier * (a.production - b.production);
        case 'uranium':
          return directionMultiplier * (a.uranium - b.uranium);
        case 'intel':
          return directionMultiplier * (a.intel - b.intel);
        case 'relationship':
          return directionMultiplier * (a.relationship - b.relationship);
        case 'morale':
          return directionMultiplier * (a.morale - b.morale);
        default:
          return 0;
      }
    });

    return sorted;
  }, [ledgerRows, activeFilter, sortConfig, topFiveIds]);

  const handleSort = useCallback(
    (column: SortColumn) => {
      setSortConfig((prev) => {
        if (prev.column === column) {
          return {
            column,
            direction: prev.direction === 'asc' ? 'desc' : 'asc',
          };
        }

        return {
          column,
          direction: column === 'name' || column === 'status' ? 'asc' : 'desc',
        };
      });
    },
    []
  );

  const getSortIcon = (column: SortColumn) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />;
    }

    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  const renderStatusBadge = (row: LedgerRow) => {
    if (row.isPlayer) {
      return <Badge className="bg-cyan-600/40 text-cyan-200">Spiller</Badge>;
    }

    if (row.category === 'ally') {
      return <Badge className="bg-emerald-500/20 text-emerald-300">Alliert</Badge>;
    }

    if (row.category === 'truce') {
      return <Badge className="bg-blue-500/20 text-blue-300">Våpenhvile</Badge>;
    }

    if (row.category === 'enemy') {
      return <Badge className="bg-red-500/20 text-red-300">Fiendtlig</Badge>;
    }

    return <Badge variant="outline" className="border-gray-600 text-gray-300">Nøytral</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
            <ListTree className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-cyan-200">Global Ledger</h3>
            <p className="text-xs text-gray-400">Sorter og filtrer for rask makro-oversikt.</p>
          </div>
        </div>
        <Badge variant="outline" className="border-gray-700 bg-gray-900/70 text-gray-300">
          {filteredRows.length} / {ledgerRows.length} nasjoner synlig
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filtre
        </div>
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={activeFilter === option.value ? 'secondary' : 'outline'}
            className={cn(
              'border-gray-700 bg-gray-900/60 text-gray-200 hover:bg-cyan-500/10 hover:text-cyan-200',
              activeFilter === option.value && 'border-cyan-500 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
            )}
            onClick={() => setActiveFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900/60 shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-900/80">
              <TableHead className="w-56">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="flex w-full items-center gap-2 text-left text-gray-300 hover:text-cyan-200"
                >
                  Nasjon
                  {getSortIcon('name')}
                </button>
              </TableHead>
              <TableHead className="w-28">
                <button
                  type="button"
                  onClick={() => handleSort('status')}
                  className="flex w-full items-center gap-2 text-left text-gray-300 hover:text-cyan-200"
                >
                  Status
                  {getSortIcon('status')}
                </button>
              </TableHead>
              <TableHead className="w-40">
                <button
                  type="button"
                  onClick={() => handleSort('militaryPower')}
                  className="flex w-full items-center gap-2 text-left text-gray-300 hover:text-cyan-200"
                >
                  Militær styrke
                  {getSortIcon('militaryPower')}
                </button>
              </TableHead>
              <TableHead className="w-28">
                <button
                  type="button"
                  onClick={() => handleSort('production')}
                  className="flex w-full items-center gap-2 text-left text-gray-300 hover:text-cyan-200"
                >
                  Produksjon
                  {getSortIcon('production')}
                </button>
              </TableHead>
              <TableHead className="w-24">
                <button
                  type="button"
                  onClick={() => handleSort('uranium')}
                  className="flex w-full items-center gap-2 text-left text-gray-300 hover:text-cyan-200"
                >
                  Uran
                  {getSortIcon('uranium')}
                </button>
              </TableHead>
              <TableHead className="w-24">
                <button
                  type="button"
                  onClick={() => handleSort('intel')}
                  className="flex w-full items-center gap-2 text-left text-gray-300 hover:text-cyan-200"
                >
                  Intel
                  {getSortIcon('intel')}
                </button>
              </TableHead>
              <TableHead className="w-28">
                <button
                  type="button"
                  onClick={() => handleSort('relationship')}
                  className="flex w-full items-center gap-2 text-left text-gray-300 hover:text-cyan-200"
                >
                  Relasjoner
                  {getSortIcon('relationship')}
                </button>
              </TableHead>
              <TableHead className="w-24">
                <button
                  type="button"
                  onClick={() => handleSort('morale')}
                  className="flex w-full items-center gap-2 text-left text-gray-300 hover:text-cyan-200"
                >
                  Moral
                  {getSortIcon('morale')}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => {
              const isSelected = row.id === selectedNationId;
              const isTopFive = topFiveIds.has(row.id);

              return (
                <TableRow
                  key={row.id}
                  data-state={isSelected ? 'selected' : undefined}
                  className={cn(
                    'cursor-pointer bg-gray-900/40 hover:bg-cyan-500/5',
                    isSelected && 'bg-cyan-500/15 text-cyan-100'
                  )}
                  onClick={() => onSelectNation(row.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{row.name}</span>
                          {row.isPlayer && <Badge className="bg-cyan-600/30 text-cyan-200">Deg</Badge>}
                          {isTopFive && !row.isPlayer && (
                            <Badge className="bg-purple-500/20 text-purple-200">Topp 5</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {row.leader} • {row.doctrine ?? 'Ukjent doktrine'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(row)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{row.militaryPower.toLocaleString()}</span>
                      <span className={cn('text-xs', powerShareColor(row.powerShare, row.isPlayer))}>
                        {row.isPlayer
                          ? 'Referanse'
                          : playerMilitaryPower > 0
                          ? `${row.powerShare}% av din styrke`
                          : 'Ingen referanse'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-100">{row.production.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-100">{row.uranium.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-100">{row.intel.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className={cn('font-medium', relationshipColor(row.relationship))}>
                      {row.relationship}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn('font-medium', moraleColor(row.morale))}>
                      {row.morale.toFixed(0)}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-sm text-gray-400">
                  Ingen nasjoner matcher filtrene akkurat nå.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const LedgerTable = React.memo(LedgerTableComponent);

LedgerTable.displayName = 'LedgerTable';

