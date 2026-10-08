import { useId } from 'react';
import { Button } from '@/components/ui/button';
import type { Nation } from '@/types/game';
import type { ResearchProject } from '@/lib/gameConstants';
import { formatResourceCost } from '@/lib/commandPresentation';
import { getResearchBlocker } from '@/lib/researchPresentation';

interface ResearchProgramCardProps {
  player: Nation;
  project: ResearchProject;
  phaseBlocker: string | null;
  startResearch: (projectId: string) => void;
}

export function ResearchProgramCard({ player, project, phaseBlocker, startResearch }: ResearchProgramCardProps) {
  const reasonId = useId();
  const completed = !!player.researched?.[project.id];
  const active = player.researchQueue?.projectId === project.id;
  const reason = getResearchBlocker(player, project) || phaseBlocker ||
    (active ? 'Research in progress' : player.researchQueue ? 'Finish the active program before starting another.' : null);
  return (
    <article className="production-card">
      <h4>{project.name}</h4>
      <p>{project.description}</p>
      <div className="production-card__cost">{formatResourceCost(project.cost)} · {project.turns} {project.turns === 1 ? 'turn' : 'turns'}</div>
      {reason && <div id={reasonId} className={completed ? 'text-green-300 text-xs' : 'production-card__reason'}>{reason}</div>}
      {!completed && <Button type="button" disabled={!!reason} aria-label={`Start ${project.name}`} aria-describedby={reason ? reasonId : undefined} onClick={() => startResearch(project.id)}>{active ? 'In progress' : 'Start research'}</Button>}
    </article>
  );
}
