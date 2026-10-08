import type { Nation } from '@/types/game';
import { RESEARCH_LOOKUP, type ResearchProject } from '@/lib/gameConstants';
import { getResourceShortfall } from '@/lib/commandPresentation';

export function getResearchBlocker(player: Nation, project: ResearchProject): string | null {
  if (player.researched?.[project.id]) return 'Completed';
  const missing = (project.prerequisites ?? []).filter(id => !player.researched?.[id]);
  if (missing.length) return `Requires ${missing.map(id => RESEARCH_LOOKUP[id]?.name ?? id).join(', ')}`;
  return getResourceShortfall(player, project.cost);
}

export function matchesResearchFilter(player: Nation, project: ResearchProject, query: string, category: string, status: string): boolean {
  const text = `${project.name} ${project.description}`.toLowerCase();
  if (!text.includes(query.trim().toLowerCase()) || (category !== 'all' && project.category !== category)) return false;
  const completed = !!player.researched?.[project.id];
  const ready = !getResearchBlocker(player, project);
  return status === 'all' || (status === 'ready' && ready) || (status === 'completed' && completed) || (status === 'locked' && !completed && !ready);
}
