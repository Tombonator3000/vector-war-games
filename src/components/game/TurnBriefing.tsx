import { useState } from 'react';
import { ChevronDown, ClipboardList } from 'lucide-react';
import type { Nation } from '@/types/game';
import { RESEARCH_LOOKUP } from '@/lib/gameConstants';
import { QueueProgress } from './QueueProgress';
import { ResourceBudget } from './ResourceBudget';

interface TurnBriefingProps {
  nation: Nation | null;
  minimal?: boolean;
  onResearch: () => void;
  onBuild: () => void;
}

export function TurnBriefing({ nation, minimal, onResearch, onBuild }: TurnBriefingProps) {
  const [expanded, setExpanded] = useState(false);
  const research = nation?.researchQueue;
  const construction = nation?.cityConstructionQueue;
  return (
    <section className={`turn-briefing ${minimal ? 'turn-briefing--minimal' : ''}`} aria-label="Turn briefing">
      <button type="button" className="turn-briefing__toggle" aria-expanded={expanded} aria-controls="turn-briefing-content" onClick={() => setExpanded(value => !value)}>
        <ClipboardList className="h-4 w-4" aria-hidden="true" />
        <span>Briefing & events</span>
        <small>{research || construction ? 'Orders in progress' : 'Review your orders'}</small>
        <ChevronDown className={`h-4 w-4 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div id="turn-briefing-content" hidden={!expanded} className="turn-briefing__content">
        {nation && <ResourceBudget nation={nation} />}
        {research ? <QueueProgress label={RESEARCH_LOOKUP[research.projectId]?.name ?? research.projectId} queue={research} /> :
          <button type="button" className="turn-briefing__link" onClick={onResearch}>Research idle · choose a program →</button>}
        {construction ? <QueueProgress label={`City #${(nation?.cities ?? 1) + 1}`} queue={construction} /> :
          <button type="button" className="turn-briefing__link" onClick={onBuild}>Construction available · review production →</button>}
        <h3>Recent events</h3>
        {/* Keep this node mounted: the legacy logger appends entries directly. */}
        <div id="log" className="turn-briefing__events" role="log" aria-label="Recent events" aria-live="off" />
      </div>
    </section>
  );
}
