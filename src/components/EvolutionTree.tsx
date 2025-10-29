import { useState } from 'react';
import { Check, Lock, Zap, Skull, Shield, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EvolutionNode, EvolutionCategory, PlagueState, PlagueTypeId } from '@/types/biowarfare';
import { TRANSMISSION_NODES, SYMPTOM_NODES, ABILITY_NODES, getPlagueTypeById } from '@/lib/evolutionData';
import { canUnlockNode } from '@/lib/evolutionData';

interface EvolutionTreeProps {
  plagueState: PlagueState;
  onEvolve: (nodeId: string) => void;
  onDevolve: (nodeId: string) => void;
}

const CATEGORY_ICONS: Record<EvolutionCategory, any> = {
  transmission: Wind,
  symptom: Skull,
  ability: Shield,
};

const CATEGORY_LABELS: Record<EvolutionCategory, string> = {
  transmission: 'TRANSMISSION',
  symptom: 'SYMPTOMS',
  ability: 'ABILITIES',
};

const CATEGORY_COLORS: Record<EvolutionCategory, string> = {
  transmission: 'cyan',
  symptom: 'red',
  ability: 'purple',
};

function EvolutionNodeCard({
  node,
  unlocked,
  canUnlock,
  dnaPoints,
  plagueTypeId,
  onEvolve,
  onDevolve,
}: {
  node: EvolutionNode;
  unlocked: boolean;
  canUnlock: boolean;
  dnaPoints: number;
  plagueTypeId: PlagueTypeId | null;
  onEvolve: () => void;
  onDevolve: () => void;
}) {
  const category = node.category;
  const color = CATEGORY_COLORS[category];

  // Calculate actual cost
  const plagueType = plagueTypeId ? getPlagueTypeById(plagueTypeId) : null;
  let actualCost = node.dnaCost;
  let disabled = false;

  if (plagueType && node.plagueTypeModifier) {
    const modifier = node.plagueTypeModifier[plagueType.id];
    if (modifier?.disabled) {
      disabled = true;
    }
    if (modifier?.dnaCostMultiplier) {
      actualCost = Math.ceil(actualCost * modifier.dnaCostMultiplier);
    }
  }

  if (plagueType) {
    if (node.category === 'transmission') {
      actualCost = Math.ceil(actualCost * plagueType.transmissionCostMultiplier);
    } else if (node.category === 'symptom') {
      actualCost = Math.ceil(actualCost * plagueType.symptomCostMultiplier);
    } else if (node.category === 'ability') {
      actualCost = Math.ceil(actualCost * plagueType.abilityCostMultiplier);
    }
  }

  const canAfford = dnaPoints >= actualCost;
  const isAvailable = canUnlock && canAfford && !disabled;

  return (
    <div
      className={`
        relative border rounded-lg p-3 transition-all
        ${unlocked
          ? `border-${color}-400/60 bg-${color}-500/10`
          : isAvailable
            ? `border-${color}-500/40 bg-${color}-500/5 hover:border-${color}-400/70 hover:bg-${color}-500/10`
            : 'border-gray-600/30 bg-gray-800/20 opacity-60'
        }
      `}
    >
      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        {unlocked ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : !canUnlock ? (
          <Lock className="h-4 w-4 text-gray-500" />
        ) : disabled ? (
          <Lock className="h-4 w-4 text-red-500" />
        ) : null}
      </div>

      {/* Node name and cost */}
      <div className="flex items-center justify-between mb-2 pr-6">
        <h4 className="text-sm font-semibold text-cyan-200 uppercase tracking-wide">
          {node.name}
        </h4>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300 tabular-nums">
            {actualCost}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] text-cyan-300/80 mb-2 leading-relaxed">
        {node.description}
      </p>

      {/* Flavor text */}
      <p className="text-[9px] text-purple-300/70 italic mb-3 leading-relaxed">
        {node.flavor}
      </p>

      {/* Effects */}
      <div className="flex flex-wrap gap-2 mb-3">
        {node.effects.infectivity && (
          <div className="text-[9px] px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
            Infectivity: {node.effects.infectivity >= 0 ? '+' : ''}{node.effects.infectivity}
          </div>
        )}
        {node.effects.severity && (
          <div className="text-[9px] px-2 py-1 rounded bg-orange-500/20 border border-orange-400/40 text-orange-300">
            Severity: {node.effects.severity >= 0 ? '+' : ''}{node.effects.severity}
          </div>
        )}
        {node.effects.lethality && (
          <div className="text-[9px] px-2 py-1 rounded bg-red-500/20 border border-red-400/40 text-red-300">
            Lethality: {node.effects.lethality >= 0 ? '+' : ''}{node.effects.lethality}
          </div>
        )}
        {node.effects.cureResistance && (
          <div className="text-[9px] px-2 py-1 rounded bg-purple-500/20 border border-purple-400/40 text-purple-300">
            Cure Resist: +{node.effects.cureResistance}
          </div>
        )}
      </div>

      {/* Visibility warning */}
      {node.increasesVisibility && (
        <div className="text-[9px] text-yellow-400/80 mb-2">
          ⚠️ Increases visibility
        </div>
      )}

      {/* Prerequisites */}
      {node.requires && node.requires.length > 0 && (
        <div className="text-[9px] text-gray-400 mb-2">
          Requires: {node.requires.join(', ')}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {unlocked ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDevolve}
            className="flex-1 text-[10px] border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
          >
            Devolve (50% refund)
          </Button>
        ) : (
          <Button
            size="sm"
            variant="default"
            onClick={onEvolve}
            disabled={!isAvailable}
            className="flex-1 text-[10px] bg-emerald-500/80 hover:bg-emerald-400 text-black disabled:opacity-40"
          >
            {disabled
              ? 'Unavailable'
              : !canUnlock
                ? 'Locked'
                : !canAfford
                  ? `Need ${actualCost - dnaPoints} DNA`
                  : 'Evolve'}
          </Button>
        )}
      </div>
    </div>
  );
}

function CategoryPanel({
  category,
  nodes,
  plagueState,
  onEvolve,
  onDevolve,
}: {
  category: EvolutionCategory;
  nodes: EvolutionNode[];
  plagueState: PlagueState;
  onEvolve: (nodeId: string) => void;
  onDevolve: (nodeId: string) => void;
}) {
  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {nodes.map((node) => {
          const unlocked = plagueState.unlockedNodes.has(node.id);
          const canUnlock = canUnlockNode(node.id, plagueState.unlockedNodes);

          return (
            <EvolutionNodeCard
              key={node.id}
              node={node}
              unlocked={unlocked}
              canUnlock={canUnlock}
              dnaPoints={plagueState.dnaPoints}
              plagueTypeId={plagueState.selectedPlagueType}
              onEvolve={() => onEvolve(node.id)}
              onDevolve={() => onDevolve(node.id)}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function EvolutionTree({ plagueState, onEvolve, onDevolve }: EvolutionTreeProps) {
  const [activeTab, setActiveTab] = useState<EvolutionCategory>('transmission');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EvolutionCategory)}>
        <TabsList className="grid w-full grid-cols-3 bg-black/60 border border-cyan-500/30">
          {(['transmission', 'symptom', 'ability'] as EvolutionCategory[]).map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const color = CATEGORY_COLORS[category];
            const activeCount = plagueState.unlockedNodes.size
              ? Array.from(plagueState.unlockedNodes).filter((id) => {
                  const node = [...TRANSMISSION_NODES, ...SYMPTOM_NODES, ...ABILITY_NODES].find((n) => n.id === id);
                  return node?.category === category;
                }).length
              : 0;

            return (
              <TabsTrigger
                key={category}
                value={category}
                className="flex items-center gap-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400/60"
              >
                <Icon className="h-4 w-4" />
                <span className="uppercase tracking-wide text-xs">
                  {CATEGORY_LABELS[category]}
                </span>
                {activeCount > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded bg-${color}-500/30 text-${color}-300`}>
                    {activeCount}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="transmission" className="mt-4">
          <CategoryPanel
            category="transmission"
            nodes={TRANSMISSION_NODES}
            plagueState={plagueState}
            onEvolve={onEvolve}
            onDevolve={onDevolve}
          />
        </TabsContent>

        <TabsContent value="symptom" className="mt-4">
          <CategoryPanel
            category="symptom"
            nodes={SYMPTOM_NODES}
            plagueState={plagueState}
            onEvolve={onEvolve}
            onDevolve={onDevolve}
          />
        </TabsContent>

        <TabsContent value="ability" className="mt-4">
          <CategoryPanel
            category="ability"
            nodes={ABILITY_NODES}
            plagueState={plagueState}
            onEvolve={onEvolve}
            onDevolve={onDevolve}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
