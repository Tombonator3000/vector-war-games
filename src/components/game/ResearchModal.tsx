import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayerManager, GameStateManager } from '@/state';
import type { Nation } from '@/types/game';
import { RESEARCH_TREE, RESEARCH_LOOKUP } from '@/lib/gameConstants';
import { RESEARCH_CATEGORIES } from '@/data/researchCategories';
import { matchesResearchFilter } from '@/lib/researchPresentation';
import { ResourceBudget } from './ResourceBudget';
import { QueueProgress } from './QueueProgress';
import { ResearchProgramCard } from './ResearchProgramCard';

export interface ResearchModalProps {
  closeModal?: () => void;
  startResearch: (projectId: string) => void;
  nation?: Nation;
}

function ResearchFilters({ query, category, status, setQuery, setCategory, setStatus }: {
  query: string; category: string; status: string;
  setQuery: (value: string) => void; setCategory: (value: string) => void; setStatus: (value: string) => void;
}) {
  return (
    <div className="research-workspace__filters">
      <label>Search programs<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name or capability" /></label>
      <label>Research field<select value={category} onChange={event => setCategory(event.target.value)}>
        <option value="all">All fields</option>{RESEARCH_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></label>
      <label>Program status<select value={status} onChange={event => setStatus(event.target.value)}>
        <option value="all">All programs</option><option value="ready">Ready to research</option><option value="locked">Requirements missing</option><option value="completed">Completed</option>
      </select></label>
    </div>
  );
}

export function ResearchModal({ closeModal, startResearch, nation }: ResearchModalProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const player = nation ?? PlayerManager.get();
  const state = GameStateManager.getState();
  if (!player) return <p>No nation data available.</p>;
  const phaseBlocker = state.gameOver ? 'The conflict has concluded.' : state.phase !== 'PLAYER' ? 'Wait for your orders phase.' : null;
  const queue = player.researchQueue;
  const projects = RESEARCH_TREE.filter(project => matchesResearchFilter(player, project, query, category, status));
  return (
    <div className="research-workspace">
      <ResourceBudget nation={player} />
      {queue ? <QueueProgress label={RESEARCH_LOOKUP[queue.projectId]?.name ?? queue.projectId} queue={queue} /> :
        <p className="text-sm">Research idle. Choose a program to develop your next capability.</p>}
      <p className="mt-2 text-xs text-cyan-200">Research uses resources, runs one program at a time and advances after each turn.</p>
      {phaseBlocker && <p role="status" className="mt-3 text-sm text-yellow-200">{phaseBlocker}</p>}
      <ResearchFilters {...{ query, category, status, setQuery, setCategory, setStatus }} />
      <p className="research-workspace__results" role="status">{projects.length} {projects.length === 1 ? 'program' : 'programs'} shown</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {projects.map(project => <ResearchProgramCard key={project.id} player={player} project={project} phaseBlocker={phaseBlocker} startResearch={startResearch} />)}
      </div>
      {projects.length === 0 && <p className="py-4 text-sm">No matching programs. Try another field, status or search.</p>}
      {closeModal && <div className="flex justify-end mt-6"><Button onClick={closeModal}>Close</Button></div>}
    </div>
  );
}
