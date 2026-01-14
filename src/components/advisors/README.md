# AI Advisor System

Intelligent, voice-enabled advisor system for NORAD VECTOR War Games.

## Overview

The AI Advisor System provides six distinct advisors who comment on game events with unique personalities and voice synthesis via ElevenLabs. Advisors react to strategic decisions, provide tactical guidance, and build trust relationships with the player based on prediction accuracy.

## Architecture

```
src/
├── types/advisor.types.ts          # TypeScript interfaces
├── data/
│   ├── advisors.data.ts            # Advisor configurations
│   └── dialogueTemplates.data.ts   # Event dialogue templates
├── lib/
│   ├── advisorVoice.ts             # ElevenLabs TTS integration
│   ├── advisorQueue.ts             # Priority queue system
│   └── advisorTriggers.ts          # Event trigger logic
├── hooks/
│   └── useAdvisorSystem.ts         # Main React hook
└── components/advisors/
    ├── AdvisorPanel.tsx            # Main UI panel
    ├── AdvisorAvatar.tsx           # Individual advisor display
    └── README.md                   # This file
```

## The Six Advisors

### 1. General Marcus "Iron" Stone (Military)
- **Personality:** Hawkish, direct, action-oriented
- **Voice:** Roger (deep, authoritative)
- **Triggers:** DEFCON changes, enemy buildups, combat events

### 2. Dr. Eleanor Vance (Science)
- **Personality:** Rational, cautious, consequence-focused
- **Voice:** Sarah (calm, analytical)
- **Triggers:** Research completion, environmental warnings

### 3. Ambassador Katherine Wei (Diplomatic)
- **Personality:** Patient, persuasive, idealistic
- **Voice:** Charlotte (diplomatic, measured)
- **Triggers:** Treaties, international incidents

### 4. Director James "Shadow" Garrett (Intelligence)
- **Personality:** Paranoid, secretive, pragmatic
- **Voice:** Daniel (measured, cryptic)
- **Triggers:** Intel operations, espionage, satellite data

### 5. Secretary Hayes (Economic)
- **Personality:** Pragmatic, numbers-focused
- **Voice:** Bill (practical, business-like)
- **Triggers:** Resource shortages, economic warfare

### 6. Press Secretary Morgan (PR)
- **Personality:** Image-conscious, media-savvy
- **Voice:** Jessica (urgent, expressive)
- **Triggers:** Morale changes, public events

## Quick Start

### 1. Add Advisor Panel to Your Game

```tsx
import { AdvisorPanel } from '@/components/advisors';

function GamePage() {
  return (
    <>
      {/* Your game UI */}
      <AdvisorPanel position="bottom" />
    </>
  );
}
```

### 2. Use Advisor System Hook

```tsx
import { useAdvisorSystem } from '@/hooks/useAdvisorSystem';
import { GameEvent } from '@/types/advisor.types';

function GameLogic() {
  const { processGameEvent } = useAdvisorSystem();

  // Trigger advisor commentary on events
  const handleDefconChange = (newLevel: number) => {
    const event: GameEvent = {
      type: 'defcon_change',
      data: { level: newLevel },
      timestamp: Date.now(),
      turn: currentTurn,
    };

    processGameEvent(event, gameState);
  };

  return <div>...</div>;
}
```

### 3. Configure ElevenLabs API

Add to `.env`:

```env
VITE_ELEVENLABS_API_KEY=your_api_key_here
VITE_ELEVENLABS_API_ENDPOINT=/api/tts
```

**Security Note:** For production, use a backend proxy to keep API keys secure.

## Usage Examples

### Triggering Advisor Commentary

```tsx
// DEFCON change
processGameEvent({
  type: 'defcon_change',
  data: { level: 2 },
  timestamp: Date.now(),
  turn: 42,
});

// Research complete
processGameEvent({
  type: 'research_complete',
  data: { techName: 'Titan-Class Weaponization' },
  timestamp: Date.now(),
  turn: 42,
});

// Resource warning
processGameEvent({
  type: 'resource_low',
  data: {
    resourceName: 'Uranium',
    amount: 50,
    burnRate: 10,
  },
  timestamp: Date.now(),
  turn: 42,
});

// Nuclear launch (critical priority)
processGameEvent({
  type: 'nuclear_launch',
  data: {
    nation: 'Soviet Union',
    targetCount: 12,
    minutes: 8,
  },
  timestamp: Date.now(),
  turn: 42,
});
```

### Managing Advisor Trust

```tsx
const { recordPlayerChoice, updateTrust } = useAdvisorSystem();

// When player follows military advisor's suggestion
recordPlayerChoice('military', true, success);

// When player ignores diplomatic advisor
recordPlayerChoice('diplomatic', false);

// Direct trust adjustment
updateTrust('science', 'PREDICTION_CORRECT');
```

### Integrating with Flashpoint System

```tsx
import { FlashpointOption } from '@/hooks/useFlashpoints';

function resolveFlashpoint(option: FlashpointOption, success: boolean) {
  // Record trust changes based on advisor support
  option.advisorSupport.forEach(advisor => {
    recordPlayerChoice(advisor as AdvisorRole, true, success);
  });

  option.advisorOppose.forEach(advisor => {
    recordPlayerChoice(advisor as AdvisorRole, false, success);
  });

  // Trigger resolution event
  processGameEvent({
    type: 'flashpoint_resolved',
    data: {
      flashpointTitle: flashpoint.title,
      success,
      chosenOption: option.id,
    },
    timestamp: Date.now(),
    turn: currentTurn,
  });
}
```

## Event Types

All supported game event types:

```typescript
type GameEventType =
  | 'defcon_change'
  | 'research_complete'
  | 'treaty_signed'
  | 'treaty_broken'
  | 'intel_success'
  | 'intel_failure'
  | 'resource_low'
  | 'resource_critical'
  | 'morale_drop'
  | 'morale_surge'
  | 'nuclear_launch'
  | 'enemy_buildup'
  | 'flashpoint_triggered'
  | 'flashpoint_resolved'
  | 'pandemic_stage'
  | 'economic_crisis'
  | 'diplomatic_incident'
  | 'spy_discovered'
  | 'turn_start'
  | 'turn_end';
```

## Priority System

Comments are queued by priority:

- **CRITICAL:** Nuclear launches, imminent threats (interrupts everything)
- **URGENT:** DEFCON changes, treaty violations (waits for current line)
- **IMPORTANT:** Research, intel reports (queues, max 3)
- **ROUTINE:** Turn summaries, casual remarks (only during idle)

## Adding New Dialogue

Edit `src/data/dialogueTemplates.data.ts`:

```typescript
{
  eventType: 'your_event_type',
  advisorRole: 'military',
  priority: 'urgent',
  templates: [
    "Template with ${dynamicData} placeholders",
    "Alternative template for variety",
  ],
  conditions: (event, gameState) => {
    // Optional condition check
    return event.data.someValue > threshold;
  },
}
```

## Customization

### Adjusting Voice Settings

Edit `src/data/advisors.data.ts`:

```typescript
voiceConfig: {
  voiceId: 'your_voice_id',
  model: 'eleven_turbo_v2_5',
  stability: 0.7,      // 0-1, higher = more consistent
  similarityBoost: 0.8,// 0-1, higher = closer to original voice
  style: 0.6,          // 0-1, higher = more expressive
}
```

### Modifying Personality Traits

```typescript
personality: {
  hawkish: 95,         // Military preference
  cautious: 20,        // Risk aversion
  idealistic: 15,      // Values vs pragmatism
  secretive: 40,       // Covert operations
  pragmatic: 75,       // Results-focused
  imageConscious: 30,  // Public perception
}
```

### Adding New Advisors

1. Add to `advisor.types.ts`: `type AdvisorRole = ... | 'newRole'`
2. Add config to `advisors.data.ts`: `ADVISOR_CONFIGS`
3. Add icon to `AdvisorAvatar.tsx`: `ADVISOR_ICONS`
4. Add colors to `AdvisorAvatar.tsx`: `ADVISOR_COLORS`
5. Add dialogue templates to `dialogueTemplates.data.ts`

## Testing

### Development Mode

For testing without API calls:

```typescript
// In advisorVoice.ts, the system falls back to silent audio
// if ElevenLabs API is unavailable
```

### Mock Events

```tsx
// Send test events
processGameEvent({
  type: 'defcon_change',
  data: { level: 1 },
  timestamp: Date.now(),
  turn: 1,
});
```

## Performance

- **Audio Caching:** Generated speech cached for 15 minutes
- **Queue Limits:**
  - Critical: 10
  - Urgent: 5
  - Important: 3
  - Routine: 1
- **Automatic Pruning:** Low-priority items removed when queue full

## Troubleshooting

### No Audio Playing

1. Check browser autoplay policy (requires user interaction)
2. Verify ElevenLabs API key configuration
3. Check browser console for errors
4. Ensure voice toggle is enabled

### Advisors Not Speaking

1. Verify `enabled` state in AdvisorPanel
2. Check event type is defined in dialogue templates
3. Verify trust levels (low trust = less frequent commentary)
4. Check priority queue isn't full

### Trust Not Updating

1. Ensure `recordPlayerChoice()` is called after decisions
2. Verify advisor roles match between flashpoint and system
3. Check trust modifiers in `advisors.data.ts`

## API Reference

### useAdvisorSystem Hook

```typescript
const {
  advisors,           // Current advisor states
  currentlyPlaying,   // Active audio
  enabled,            // System enabled
  voiceEnabled,       // Voice playback enabled
  volume,             // Current volume (0-1)

  processGameEvent,   // Trigger commentary
  updateTrust,        // Modify trust level
  recordPrediction,   // Track advisor accuracy
  recordPlayerChoice, // Track decisions
  toggleEnabled,      // Enable/disable system
  toggleVoice,        // Mute/unmute
  setVolume,          // Set volume
  clearQueues,        // Clear all queues
  getAdvisor,         // Get advisor config + state

  queueSize,          // Comment queue size
  audioQueueSize,     // Audio queue size
} = useAdvisorSystem();
```

## Future Enhancements

- [ ] Advisor dialogue history/replay
- [ ] Custom advisor portraits/avatars
- [ ] Localization support
- [ ] Real-time interrupt controls
- [ ] Advisor disagreement dialogues
- [ ] Player response options
- [ ] Voice recording for custom advisors
- [ ] Analytics dashboard for advisor influence

## Credits

- **Design:** Based on agents.md specifications
- **Voice Synthesis:** ElevenLabs API
- **Architecture:** Modular React + TypeScript

---

**Last Updated:** 2026-01-14
**Version:** 1.0.0
**Maintainer:** Development Team
