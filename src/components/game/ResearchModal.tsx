import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { canAfford } from '@/lib/gameUtils';
import { PlayerManager } from '@/state';
import { RESEARCH_TREE, RESEARCH_LOOKUP, type ResourceCost, type ResearchProject } from '@/lib/gameConstants';

export interface ResearchModalProps {
  closeModal: () => void;
  startResearch: (projectId: string) => void;
}

/**
 * ResearchModal - Research tree and queue management interface
 *
 * Displays:
 * - Active research project with progress bar
 * - Available research projects organized by category
 * - Prerequisites and unlock requirements
 * - Research costs and duration
 */
export function ResearchModal({ closeModal, startResearch }: ResearchModalProps): ReactNode {
  const player = PlayerManager.get();

  if (!player) {
    return <div className="text-sm text-cyan-200">No nation data available.</div>;
  }

  const activeQueue = player.researchQueue;
  const activeProject = activeQueue ? RESEARCH_LOOKUP[activeQueue.projectId] : null;
  const progress = activeQueue && activeQueue.totalTurns > 0
    ? Math.round(((activeQueue.totalTurns - activeQueue.turnsRemaining) / activeQueue.totalTurns) * 100)
    : 0;

  const categories: { id: ResearchProject['category']; label: string }[] = [
    { id: 'warhead', label: 'Warhead Programs' },
    { id: 'delivery', label: 'Strategic Delivery Systems' },
    { id: 'defense', label: 'Defense Initiatives' },
    { id: 'intel', label: 'Intelligence Operations' },
    { id: 'cyber', label: 'Cyber Warfare' },
    { id: 'conventional', label: 'Conventional Forces' },
    { id: 'economy', label: 'Economic Development' },
    { id: 'culture', label: 'Cultural Influence' },
    { id: 'space', label: 'Space Superiority' },
    { id: 'intelligence', label: 'Covert Operations' },
  ];

  const formatCost = (cost: ResourceCost) => {
    const parts = Object.entries(cost)
      .filter(([, amount]) => (amount || 0) > 0)
      .map(([resource, amount]) => `${amount} ${resource.toUpperCase()}`);
    return parts.length > 0 ? parts.join(' • ') : 'No cost';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-cyan-300 mb-2">Research Focus</h3>
        {activeProject ? (
          <div className="border border-cyan-600/60 rounded p-4 bg-black/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-200">{activeProject.name}</span>
              <span className="text-sm text-cyan-300">{progress}%</span>
            </div>
            <p className="text-sm text-cyan-200/70">{activeProject.description}</p>
            <div className="h-2 bg-cyan-900 rounded overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="text-xs text-cyan-200/80">
              Turns remaining: {activeQueue.turnsRemaining}/{activeQueue.totalTurns}
            </div>
          </div>
        ) : (
          <div className="text-sm text-cyan-200/80">
            No active project. Select a program below to begin research.
          </div>
        )}
      </div>

      {categories.map(category => {
        const projects = RESEARCH_TREE.filter(project => project.category === category.id);
        if (projects.length === 0) return null;

        return (
          <div key={category.id} className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-cyan-400">
              {category.label}
            </h4>
            {projects.map(project => {
              const isUnlocked = !!player.researched?.[project.id];
              const prerequisitesMet = (project.prerequisites || []).every(req => player.researched?.[req]);
              const affordable = canAfford(player, project.cost);
              const disabled = isUnlocked || !prerequisitesMet || !!activeQueue || !affordable;

              return (
                <div key={project.id} className="border border-cyan-700/70 rounded p-4 bg-black/50 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-cyan-200">{project.name}</div>
                      <div className="text-xs text-cyan-200/70 uppercase">
                        {project.turns} turns • Cost: {formatCost(project.cost)}
                      </div>
                    </div>
                    {isUnlocked ? (
                      <span className="text-green-400 text-xs font-semibold">UNLOCKED</span>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-cyan-700 hover:bg-cyan-600 text-black"
                        disabled={disabled}
                        onClick={() => startResearch(project.id)}
                      >
                        START
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-cyan-100/80">{project.description}</p>
                  {project.yield ? (
                    <div className="text-xs text-cyan-200/70">
                      Unlocks deployment of {project.yield}MT warheads.
                    </div>
                  ) : null}
                  {project.prerequisites && project.prerequisites.length > 0 ? (
                    <div className="text-xs text-cyan-200/70">
                      Prerequisites:{' '}
                      {project.prerequisites.map(req => {
                        const met = !!player.researched?.[req];
                        const name = RESEARCH_LOOKUP[req]?.name || req;
                        return (
                          <span key={req} className={met ? 'text-green-400' : 'text-red-400'}>
                            {name}
                          </span>
                        );
                      }).reduce((acc, elem, idx, arr) => {
                        acc.push(elem);
                        if (idx < arr.length - 1) acc.push(<span key={`sep-${project.id}-${idx}`}> • </span>);
                        return acc;
                      }, [] as ReactNode[])}
                    </div>
                  ) : null}
                  {!isUnlocked && !prerequisitesMet ? (
                    <div className="text-xs text-yellow-300/80">
                      Complete prerequisite programs first.
                    </div>
                  ) : null}
                  {!isUnlocked && prerequisitesMet && !affordable ? (
                    <div className="text-xs text-yellow-300/80">
                      Additional resources required to begin this project.
                    </div>
                  ) : null}
                  {!isUnlocked && prerequisitesMet && affordable && activeQueue ? (
                    <div className="text-xs text-yellow-300/80">
                      Another project is currently underway.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}
      <div className="flex justify-end pt-2">
        <Button type="button" onClick={closeModal} className="bg-cyan-500 text-black hover:bg-cyan-400">
          Close [ESC]
        </Button>
      </div>
    </div>
  );
}
