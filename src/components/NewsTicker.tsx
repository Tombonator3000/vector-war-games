import { useEffect, useState, useRef } from 'react';

export interface NewsItem {
  id: string;
  text: string;
  priority:
    | 'info'
    | 'routine'
    | 'low'
    | 'medium'
    | 'important'
    | 'alert'
    | 'high'
    | 'urgent'
    | 'critical';
  timestamp: number;
  category:
    | 'military'
    | 'diplomatic'
    | 'economic'
    | 'intel'
    | 'crisis'
    | 'environment'
    | 'science'
    | 'governance'
    | 'domestic'
    | 'media'
    | 'occult'
    | 'political';
}

interface NewsTickerProps {
  items: NewsItem[];
  speed?: number;
  className?: string;
}

const PRIORITY_COLORS: Record<NewsItem['priority'], string> = {
  info: 'text-slate-300',
  routine: 'text-cyan-300',
  low: 'text-slate-200',
  medium: 'text-teal-300',
  important: 'text-yellow-300',
  alert: 'text-amber-300 font-semibold',
  high: 'text-orange-400 font-semibold',
  urgent: 'text-orange-500 font-semibold',
  critical: 'text-red-500 font-bold'
};

const CATEGORY_PREFIXES: Record<NewsItem['category'], string> = {
  military: '⚔️',
  diplomatic: '🤝',
  economic: '💰',
  intel: '🛰️',
  crisis: '⚠️',
  environment: '☢️',
  science: '🧪',
  governance: '🏛️',
  domestic: '🏠',
  media: '📰',
  occult: '🔮',
  political: '🗳️'
};

export function NewsTicker({ items, speed = 50, className }: NewsTickerProps) {
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => {
        const contentWidth = contentRef.current?.scrollWidth || 0;
        const containerWidth = containerRef.current?.clientWidth || 0;
        
        if (prev <= -(contentWidth + containerWidth)) {
          return 0;
        }
        return prev - 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [speed, items]);

  if (items.length === 0) return null;

  // Sort by priority and timestamp
  const priorityOrder: Record<NewsItem['priority'], number> = {
    critical: 0,
    urgent: 1,
    high: 2,
    alert: 3,
    important: 4,
    medium: 5,
    routine: 6,
    info: 7,
    low: 8,
  };

  const sortedItems = [...items].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.timestamp - a.timestamp;
  });

  const containerClasses = [
    'w-full bg-transparent overflow-hidden'
  ];

  if (className) {
    containerClasses.push(className);
  }

  return (
    <div
      ref={containerRef}
      className={containerClasses.join(' ')}
      style={{ height: '32px' }}
    >
      <div
        ref={contentRef}
        className="flex items-center whitespace-nowrap py-1"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {sortedItems.map((item, idx) => (
          <span
            key={`${item.id}-${idx}`}
            className={`inline-flex items-center gap-2 px-4 text-sm ${PRIORITY_COLORS[item.priority]}`}
          >
            <span className="text-base">{CATEGORY_PREFIXES[item.category]}</span>
            <span className="uppercase tracking-wide">{item.text}</span>
            <span className="text-cyan-500/40">•</span>
          </span>
        ))}
        {/* Duplicate for seamless loop */}
        {sortedItems.map((item, idx) => (
          <span
            key={`${item.id}-dup-${idx}`}
            className={`inline-flex items-center gap-2 px-4 text-sm ${PRIORITY_COLORS[item.priority]}`}
          >
            <span className="text-base">{CATEGORY_PREFIXES[item.category]}</span>
            <span className="uppercase tracking-wide">{item.text}</span>
            <span className="text-cyan-500/40">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
