import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sword,
  Shield,
  Brain,
  Zap,
  Shuffle,
  Home,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import type { AIPersonality } from '@/lib/regimeChange';

interface AIPersonalityCardProps {
  nationName: string;
  leaderName: string;
  personality: AIPersonality;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  currentMood: 'friendly' | 'neutral' | 'cautious' | 'hostile' | 'furious';
  militaryStrength: number; // 0-100
  relationshipScore: number; // -100 to 100
  isVisible?: boolean;
}

const PERSONALITY_DATA: Record<
  AIPersonality,
  {
    icon: React.ReactNode;
    color: string;
    name: string;
    traits: string[];
    behavior: string;
  }
> = {
  aggressive: {
    icon: <Sword className="w-5 h-5" />,
    color: 'red',
    name: 'Aggressive',
    traits: [
      '40% more likely to attack',
      'Ignores peace treaties at DEFCON ≤3',
      'Builds 50% more missiles',
      'First to declare war',
    ],
    behavior: 'Will attack when opportunity arises. Diplomacy rarely works.',
  },
  defensive: {
    icon: <Shield className="w-5 h-5" />,
    color: 'blue',
    name: 'Defensive',
    traits: [
      'Prioritizes defense systems',
      'Forms protective alliances',
      'Rarely initiates attacks',
      'Retaliates when threatened',
    ],
    behavior: 'Seeks security through defense. Open to peace agreements.',
  },
  balanced: {
    icon: <Brain className="w-5 h-5" />,
    color: 'green',
    name: 'Balanced',
    traits: [
      'Adapts to situation',
      'Mixed military/diplomatic approach',
      'Rational decision-making',
      'Predictable responses',
    ],
    behavior: 'Balanced strategy. Responds proportionally to actions.',
  },
  trickster: {
    icon: <Zap className="w-5 h-5" />,
    color: 'purple',
    name: 'Trickster',
    traits: [
      'Frequent cyber attacks',
      'Uses false-flag operations',
      'Manipulates other nations',
      'Unpredictable timing',
    ],
    behavior: 'Masters of deception. Expect sabotage and misdirection.',
  },
  chaotic: {
    icon: <Shuffle className="w-5 h-5" />,
    color: 'orange',
    name: 'Chaotic',
    traits: [
      'Random decision-making',
      'No clear strategy',
      'Sudden escalations',
      'Ignores logical outcomes',
    ],
    behavior: 'Completely unpredictable. Prepare for anything.',
  },
  isolationist: {
    icon: <Home className="w-5 h-5" />,
    color: 'gray',
    name: 'Isolationist',
    traits: [
      'Avoids conflicts',
      'Focuses on economy',
      'Minimal foreign involvement',
      'Defensive if attacked',
    ],
    behavior: 'Wants to be left alone. Will fight if cornered.',
  },
};

const MOOD_DATA: Record<
  string,
  { emoji: string; color: string; description: string }
> = {
  friendly: {
    emoji: '😊',
    color: 'text-green-400',
    description: 'Open to cooperation',
  },
  neutral: {
    emoji: '😐',
    color: 'text-gray-400',
    description: 'Indifferent',
  },
  cautious: {
    emoji: '🤨',
    color: 'text-yellow-400',
    description: 'Wary of your actions',
  },
  hostile: {
    emoji: '😠',
    color: 'text-orange-400',
    description: 'Considers you a threat',
  },
  furious: {
    emoji: '😡',
    color: 'text-red-400',
    description: 'On the brink of war',
  },
};

const THREAT_DATA: Record<
  string,
  { color: string; label: string; bgColor: string }
> = {
  low: {
    color: 'text-green-400',
    label: 'LOW THREAT',
    bgColor: 'bg-green-900/20',
  },
  medium: {
    color: 'text-yellow-400',
    label: 'MODERATE THREAT',
    bgColor: 'bg-yellow-900/20',
  },
  high: {
    color: 'text-orange-400',
    label: 'HIGH THREAT',
    bgColor: 'bg-orange-900/20',
  },
  critical: {
    color: 'text-red-400',
    label: 'CRITICAL THREAT',
    bgColor: 'bg-red-900/20',
  },
};

export function AIPersonalityCard({
  nationName,
  leaderName,
  personality,
  threatLevel,
  currentMood,
  militaryStrength,
  relationshipScore,
  isVisible = true,
}: AIPersonalityCardProps) {
  if (!isVisible) return null;

  const personalityInfo = PERSONALITY_DATA[personality];
  const moodInfo = MOOD_DATA[currentMood];
  const threatInfo = THREAT_DATA[threatLevel];

  const relationshipColor =
    relationshipScore >= 50
      ? 'text-green-400'
      : relationshipScore >= 0
      ? 'text-yellow-400'
      : relationshipScore >= -50
      ? 'text-orange-400'
      : 'text-red-400';

  return (
    <Card className="bg-black/90 border-cyan-500/60 shadow-lg p-4 w-full max-w-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-cyan-100 uppercase tracking-wider">
            {nationName}
          </h3>
          <p className="text-sm text-cyan-400">{leaderName}</p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded ${threatInfo.bgColor}`}
        >
          <AlertTriangle className={`w-4 h-4 ${threatInfo.color}`} />
          <span className={`text-xs font-bold ${threatInfo.color}`}>
            {threatInfo.label}
          </span>
        </div>
      </div>

      {/* Personality */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`text-${personalityInfo.color}-400`}>
            {personalityInfo.icon}
          </div>
          <h4 className={`text-sm font-semibold text-${personalityInfo.color}-400 uppercase`}>
            {personalityInfo.name} Personality
          </h4>
        </div>
        <p className="text-xs text-gray-400 mb-2">{personalityInfo.behavior}</p>
        <div className="space-y-1">
          {personalityInfo.traits.map((trait, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <span className={`text-${personalityInfo.color}-400`}>•</span>
              <span className="text-gray-300">{trait}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Mood */}
      <div className="mb-4 p-3 rounded bg-gray-900/50 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moodInfo.emoji}</span>
            <div>
              <p className={`text-sm font-semibold ${moodInfo.color}`}>
                {currentMood.toUpperCase()}
              </p>
              <p className="text-xs text-gray-400">{moodInfo.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Relations</p>
            <p className={`text-lg font-bold font-mono ${relationshipColor}`}>
              {relationshipScore > 0 ? '+' : ''}
              {relationshipScore}
            </p>
          </div>
        </div>
      </div>

      {/* Military Strength */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
            Military Strength
          </span>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {militaryStrength}%
          </span>
        </div>
        <Progress value={militaryStrength} className="h-2" />
      </div>

      {/* Strategic Advice */}
      {personality === 'aggressive' && threatLevel === 'high' && (
        <div className="mt-4 p-2 rounded bg-red-900/20 border border-red-500/30">
          <p className="text-xs text-red-300">
            <strong>⚠️ Warning:</strong> This nation will likely attack soon. Prepare
            defenses or strike first.
          </p>
        </div>
      )}
      {personality === 'defensive' && relationshipScore < 0 && (
        <div className="mt-4 p-2 rounded bg-yellow-900/20 border border-yellow-500/30">
          <p className="text-xs text-yellow-300">
            <strong>💡 Tip:</strong> Defensive nations respond well to peace offerings.
            Consider a non-aggression pact.
          </p>
        </div>
      )}
      {personality === 'trickster' && (
        <div className="mt-4 p-2 rounded bg-purple-900/20 border border-purple-500/30">
          <p className="text-xs text-purple-300">
            <strong>🎭 Caution:</strong> Expect cyber attacks and false-flag operations.
            Strengthen your firewalls.
          </p>
        </div>
      )}
    </Card>
  );
}
