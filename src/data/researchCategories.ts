import type { ResearchProject } from '@/lib/gameConstants';

export const RESEARCH_CATEGORIES: readonly { id: ResearchProject['category']; label: string }[] = [
  { id: 'warhead', label: 'Warhead programs' },
  { id: 'delivery', label: 'Strategic delivery' },
  { id: 'defense', label: 'Defense systems' },
  { id: 'intel', label: 'Intelligence operations' },
  { id: 'cyber', label: 'Cyber warfare' },
  { id: 'conventional', label: 'Conventional forces' },
  { id: 'economy', label: 'Economic development' },
  { id: 'culture', label: 'Cultural influence' },
  { id: 'space', label: 'Space superiority' },
  { id: 'intelligence', label: 'Covert operations' },
];
