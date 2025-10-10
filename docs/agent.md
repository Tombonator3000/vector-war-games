# NORAD VECTOR - AI Advisor & Agent System

## Overview
The Agent System provides intelligent, voice-enabled advisors that guide players through strategic decisions, react to game events, and provide dynamic commentary. This system uses ElevenLabs for text-to-speech and implements an adaptive personality framework.

### Operational Log Requirements
- Every session log entry **must** include an ISO-8601 timestamp (UTC) alongside the action description.
- For any repository modification, record the relative paths of all files touched in that entry.
- Summaries should highlight key outcomes, blockers, and follow-up actions to maintain continuity across shifts.

### Suggested Additions for `AGENTS.md`
To make the guide more actionable, consider capturing:
- **Mission Context:** High-level objective, current phase, and success criteria.
- **Communication Protocol:** Preferred format for updates, required approvals, and escalation paths.
- **Testing Matrix:** Mandatory checks before merging (e.g., `npm run lint`, `npm test`).
- **Tooling Credentials:** Where to find API keys, feature flags, and mock services (with security notes).
- **Glossary & Domain Notes:** Definitions of in-universe terminology to keep narratives consistent.

---

## 🎭 Advisor Personalities

### 1. General Marcus "Iron" Stone (Military Advisor)
**Voice:** Roger (EXAVITQu4vr4xnSDxMaL) - Deep, authoritative  
**Personality:** Hawkish, direct, action-oriented  
**Triggers:**
- DEFCON changes
- Military buildups detected
- Combat engagements
- Defense system failures

**Sample Lines:**
```
"DEFCON 3 confirmed, Mr. President. Recommend immediate alert posture."
"Enemy missile silos operational. We should strike first while we have the advantage."
"Our ABM systems intercepted 12 warheads. Defense grid holding... for now."
"Intelligence shows massive troop movements. This is it."
```

**Personality Traits:**
- Favors military solutions
- Impatient with diplomacy
- Respects strength
- Dislikes indecision

---

### 2. Dr. Eleanor Vance (Science Advisor)
**Voice:** Sarah (EXAVITQu4vr4xnSDxMaL) - Calm, analytical  
**Personality:** Rational, cautious, long-term thinker  
**Triggers:**
- Research completions
- Environmental catastrophes
- Radiation warnings
- Tech breakthroughs

**Sample Lines:**
```
"Research complete: Titan-Class Weaponization. I pray we never use it."
"Nuclear winter projections are... catastrophic. 80% crop failure within six months."
"Radiation levels in sector 7 are lethal. Evacuation recommended immediately."
"Our satellite network is now operational. Knowledge is our greatest weapon."
```

**Personality Traits:**
- Emphasizes consequences
- Fears nuclear escalation
- Values knowledge
- Warns of environmental collapse

---

### 3. Ambassador Katherine Wei (Diplomatic Advisor)
**Voice:** Charlotte (XB0fDUnXU5powFXDhCwa) - Diplomatic, measured  
**Personality:** Patient, persuasive, idealistic  
**Triggers:**
- Treaty negotiations
- Alliance formations
- International incidents
- UN actions

**Sample Lines:**
```
"Mr. President, the UN General Secretary is on the line. They're proposing a ceasefire."
"Breaking a treaty now would destroy our credibility. We must honor our word."
"I've secured a non-aggression pact with France. It's fragile, but it holds."
"The world is watching. How we respond here defines our legacy."
```

**Personality Traits:**
- Prefers negotiation
- Values reputation
- Builds coalitions
- Avoids unnecessary conflict

---

### 4. Director James "Shadow" Garrett (Intelligence)
**Voice:** Daniel (onwK4e9ZLuTAKqWW03F9) - Measured, cryptic  
**Personality:** Paranoid, secretive, pragmatic  
**Triggers:**
- Intel operations success/failure
- Espionage detected
- Cover ops missions
- Satellite data

**Sample Lines:**
```
"Our asset in Moscow confirms: they're preparing a first strike."
"Sir, we've been compromised. Someone leaked our launch codes."
"Satellite recon shows something... unusual. Underground construction, massive scale."
"Trust no one, Mr. President. Even our allies have secrets."
```

**Personality Traits:**
- Sees threats everywhere
- Values intelligence over force
- Distrusts everyone
- Operates in shadows

---

### 5. Secretary Hayes (Economic Advisor)
**Voice:** Bill (pqHfZKP75CvOlQylNhV4) - Practical, numbers-focused  
**Personality:** Pragmatic, cautious with resources  
**Triggers:**
- Resource shortages
- Economic warfare
- Production milestones
- Budget crises

**Sample Lines:**
```
"Mr. President, we're burning through uranium reserves at an unsustainable rate."
"The economy is in freefall. We need trade agreements, not more missiles."
"Production quotas exceeded. Our industrial might is unmatched."
"Sanctions are crippling their economy. Another month and they'll collapse."
```

**Personality Traits:**
- Bottom-line oriented
- Opposes expensive wars
- Supports economic warfare
- Warns of overextension

---

### 6. Press Secretary Morgan (Public Relations)
**Voice:** Jessica (cgSgspJ2msm6clMCkdW9) - Urgent, media-savvy  
**Personality:** Image-conscious, politically aware  
**Triggers:**
- Morale changes
- Political events
- Public protests
- Media scandals

**Sample Lines:**
```
"Mr. President, the press is going wild. We need a statement NOW."
"Public approval just dropped 15 points. The people want peace."
"Protests in every major city. They're burning flags and calling for your resignation."
"Our propaganda campaign is working. National morale is soaring."
```

**Personality Traits:**
- Obsessed with optics
- Fears public backlash
- Spins everything
- Monitors polls constantly

---

## 🧠 Adaptive Commentary System

### Dynamic Context Awareness
Advisors comment based on:
- **Game State:** DEFCON, turn number, resources, threats
- **Recent Actions:** Last 3 player decisions
- **Trends:** Rising/falling metrics
- **Personality:** Each advisor's bias filters their advice

### Interruption System
**Priority Levels:**
1. **CRITICAL:** Nuclear launch detected, capital under attack
2. **URGENT:** DEFCON change, treaty broken, resource crisis
3. **IMPORTANT:** Research done, intel report, morale event
4. **ROUTINE:** Turn summary, advisor musings

**Rules:**
- CRITICAL interrupts everything, plays immediately
- URGENT waits for current line to finish
- IMPORTANT queues (max 3)
- ROUTINE only plays during idle moments

### Conflict Resolution
When multiple advisors want to speak:
```typescript
// Priority: Military > Intel > Diplomatic > Science > Economic > PR
if (multiplePendingLines) {
  const priorityOrder = ['military', 'intel', 'diplomatic', 'science', 'economic', 'pr'];
  const selectedAdvisor = priorityOrder.find(role => hasPendingLine(role));
  playLine(selectedAdvisor);
}
```

---

## 🎙️ ElevenLabs Integration

### Voice Configuration
```typescript
const ADVISOR_VOICES = {
  military: {
    voiceId: 'CwhRBWXzGAHq8TQ4Fs17', // Roger
    model: 'eleven_turbo_v2_5',
    stability: 0.7,
    similarityBoost: 0.8,
    style: 0.6, // More expressive
  },
  science: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    model: 'eleven_turbo_v2_5',
    stability: 0.9,
    similarityBoost: 0.7,
    style: 0.3, // More neutral
  },
  diplomatic: {
    voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte
    model: 'eleven_turbo_v2_5',
    stability: 0.8,
    similarityBoost: 0.8,
    style: 0.5,
  },
  intel: {
    voiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel
    model: 'eleven_turbo_v2_5',
    stability: 0.8,
    similarityBoost: 0.6,
    style: 0.4,
  },
  economic: {
    voiceId: 'pqHfZKP75CvOlQylNhV4', // Bill
    model: 'eleven_turbo_v2_5',
    stability: 0.85,
    similarityBoost: 0.7,
    style: 0.35,
  },
  pr: {
    voiceId: 'cgSgspJ2msm6clMCkdW9', // Jessica
    model: 'eleven_turbo_v2_5',
    stability: 0.75,
    similarityBoost: 0.8,
    style: 0.7, // Very expressive
  }
};
```

### Audio Playback System
```typescript
class AdvisorVoice {
  private audioQueue: AudioBuffer[] = [];
  private currentlyPlaying: boolean = false;
  
  async speak(text: string, advisorRole: string, priority: 'critical' | 'urgent' | 'important' | 'routine') {
    const voiceConfig = ADVISOR_VOICES[advisorRole];
    
    // Generate speech via ElevenLabs API
    const audioBuffer = await this.generateSpeech(text, voiceConfig);
    
    if (priority === 'critical') {
      this.interrupt();
      this.playImmediately(audioBuffer);
    } else {
      this.enqueue(audioBuffer, priority);
    }
  }
  
  private async generateSpeech(text: string, config: VoiceConfig): Promise<AudioBuffer> {
    // Call ElevenLabs API through edge function
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      body: JSON.stringify({ text, ...config })
    });
    return await response.arrayBuffer();
  }
}
```

---

## 📊 Advice Trigger Matrix

| Event | Military | Science | Diplomatic | Intel | Economic | PR |
|-------|----------|---------|------------|-------|----------|-----|
| **DEFCON Change** | ✅ Primary | ⚠️ Warns | ⚠️ Urges calm | ℹ️ Context | ❌ | ℹ️ Public |
| **Research Done** | ℹ️ Military tech | ✅ Primary | ❌ | ℹ️ Applications | ℹ️ Costs | ❌ |
| **Treaty Signed** | ⚠️ Skeptical | ℹ️ Benefits | ✅ Primary | ⚠️ Verification | ℹ️ Trade | ✅ PR win |
| **Intel Success** | ℹ️ Strategic | ❌ | ℹ️ Diplomatic use | ✅ Primary | ❌ | ℹ️ Leak risk |
| **Resource Low** | ⚠️ Readiness | ⚠️ Limits | ℹ️ Trade | ❌ | ✅ Primary | ⚠️ Rationing |
| **Morale Drop** | ⚠️ Unrest | ℹ️ Causes | ⚠️ Stability | ℹ️ Threats | ⚠️ Economy | ✅ Primary |
| **Nuclear Launch** | ✅ Tactical | ✅ Consequences | ⚠️ War crime | ℹ️ Counterstrike | ❌ | ✅ Crisis |
| **Enemy Buildup** | ✅ Primary | ⚠️ Arms race | ℹ️ Negotiate | ✅ Primary | ℹ️ Costs | ℹ️ Spin |

Legend:
- ✅ Primary advisor for this event
- ⚠️ Strong opinion/warning
- ℹ️ Informational commentary
- ❌ Silent on this event

---

## 🎬 Dynamic Dialogue Generation

### Template System
```typescript
const DIALOGUE_TEMPLATES = {
  defconEscalation: {
    military: [
      "DEFCON ${level}. All forces on alert. Ready to strike on your command.",
      "We've moved to DEFCON ${level}. Our response time is now ${seconds} seconds.",
      "Escalation to DEFCON ${level} complete. God help us all."
    ],
    science: [
      "DEFCON ${level}... the probability of nuclear exchange just jumped to ${percent}%.",
      "We're at DEFCON ${level}. At this rate, we'll trigger nuclear winter by month's end.",
    ],
    diplomatic: [
      "DEFCON ${level} sends a dangerous message. We should pursue de-escalation immediately.",
      "Mr. President, going to DEFCON ${level} closes diplomatic doors. Reconsider."
    ]
  },
  // ... 100+ event templates
};
```

### Context Injection
Advisors reference specific game state:
```typescript
function generateAdvice(event: GameEvent, advisor: Advisor): string {
  const template = DIALOGUE_TEMPLATES[event.type][advisor.role];
  const selected = selectRandomWeighted(template, advisor.personality);
  
  // Inject dynamic data
  return selected
    .replace('${level}', event.data.defcon)
    .replace('${nation}', event.data.nationName)
    .replace('${count}', event.data.missileCount)
    .replace('${percent}', Math.round(event.data.probability * 100));
}
```

---

## 🎯 War Room Decision System

### Timed Decisions
Critical events pause game and demand immediate response:

```typescript
interface WarRoomDecision {
  id: string;
  title: string;
  description: string;
  timeLimit: number; // seconds
  options: DecisionOption[];
  stakeholders: Advisor[]; // Which advisors give input
  consequences: Record<string, any>;
}

interface DecisionOption {
  id: string;
  text: string;
  supportedBy: string[]; // Advisor roles
  opposedBy: string[];
  outcome: GameStateChange;
}
```

### Example: Nuclear Terrorist Threat
```typescript
{
  id: 'terrorist_nuke_2025',
  title: 'FLASH TRAFFIC: Nuclear Materials Stolen',
  description: 'CIA reports terrorists seized 20kg of weapons-grade plutonium from a storage facility. They threaten to detonate a device in New York City within 72 hours unless demands are met.',
  timeLimit: 90, // 90 seconds to decide
  options: [
    {
      id: 'negotiate',
      text: 'Open negotiations. Buy time.',
      supportedBy: ['diplomatic', 'pr'],
      opposedBy: ['military', 'intel'],
      outcome: {
        morale: -10,
        intel: +5,
        publicOpinion: -5,
        threatLevel: 0.7 // 70% chance of success
      }
    },
    {
      id: 'strike',
      text: 'Launch special forces raid immediately.',
      supportedBy: ['military', 'intel'],
      opposedBy: ['diplomatic', 'science'],
      outcome: {
        morale: +5,
        casualties: 0.3, // 30% civilian casualties if fails
        threatLevel: 0.5,
        internationalIncident: true
      }
    },
    {
      id: 'evacuate',
      text: 'Evacuate NYC. Prepare for worst case.',
      supportedBy: ['science', 'economic'],
      opposedBy: ['pr', 'military'],
      outcome: {
        morale: -20,
        economicDamage: 0.8,
        lives saved: 0.9,
        panic: true
      }
    },
    {
      id: 'concede',
      text: 'Meet their demands. Pay the ransom.',
      supportedBy: [],
      opposedBy: ['military', 'intel', 'diplomatic'],
      outcome: {
        morale: -30,
        economicCost: 500,
        threatNeutralized: true,
        emboldensEnemies: true
      }
    }
  ],
  stakeholders: ['military', 'intel', 'diplomatic', 'science', 'economic', 'pr']
}
```

**Advisor Input During Decision:**
- Each advisor briefly states their position (voice + text)
- Visual indicators show support/opposition
- Timer counts down with escalating tension music
- Decision recorded in permanent game history

---

## 📈 Advisor Influence System

### Trust & Credibility
```typescript
interface AdvisorState {
  role: string;
  trustLevel: number; // 0-100
  correctPredictions: number;
  wrongPredictions: number;
  timesIgnored: number;
  timesFollowed: number;
}
```

**Trust Affects:**
- Frequency of advice (high trust = more vocal)
- Tone of delivery (low trust = more desperate/defensive)
- Quality of intelligence (low trust intel = less accurate)

**Trust Changes:**
- Following advice that succeeds: +5 trust
- Following advice that fails: -10 trust
- Ignoring advice that would have succeeded: -3 trust
- Ignoring advice that would have failed: +2 trust

### Advisor Conflicts
Advisors can disagree publicly:
```
MILITARY: "We must strike now while we have superiority!"
DIPLOMATIC: "General, that's madness. Negotiations are progressing."
MILITARY: "Negotiations are stalling tactics. They're buying time to build more warheads!"
SCIENCE: "Both of you are ignoring the real threat: nuclear winter. ANY major exchange ends civilization."
```

---

## 🔊 Audio Mixing Strategy

### Layer Priority
1. **Critical alerts** (100% volume, interrupts music)
2. **Advisor voice** (80% volume, ducks music)
3. **Music** (adjusts based on context)
4. **Sound effects** (70% volume, brief)
5. **Ambient** (40% volume, constant)

### Adaptive Music System
Three simultaneous music tracks crossfade:
```typescript
const MUSIC_LAYERS = {
  strategic: 'ambient_drone.mp3', // Low threat, planning phase
  tactical: 'tension_building.mp3', // Medium threat, conflict emerging
  crisis: 'imminent_war.mp3' // High threat, war imminent
};

function updateMusicMix() {
  const threatLevel = calculateThreatLevel();
  const morale = calculateMorale();
  const defcon = S.defcon;
  
  // Crossfade based on composite danger score
  const dangerScore = (6 - defcon) * 0.4 + threatLevel * 0.4 + (1 - morale) * 0.2;
  
  setVolume('strategic', Math.max(0, 1 - dangerScore));
  setVolume('tactical', Math.max(0, Math.min(1, dangerScore * 2 - 0.5)));
  setVolume('crisis', Math.max(0, dangerScore - 0.7) * 3);
}
```

---

## 💡 Future Enhancements

### AI-Generated Dynamic Dialogue
Use Lovable AI to generate contextual advisor lines on-the-fly:
```typescript
async function generateAdvisorLine(event: GameEvent, advisor: Advisor): Promise<string> {
  const prompt = `You are ${advisor.name}, ${advisor.description}.
  
  Personality: ${advisor.personality}
  Current game state: DEFCON ${S.defcon}, Turn ${S.turn}, Threat Level ${calculateThreatLevel()}
  Recent event: ${event.description}
  
  Provide a single line of advice (max 30 words) in character. Be ${advisor.tone}.`;
  
  const response = await callLovableAI(prompt);
  return response.text;
}
```

### Player Dialogue Options
Allow player to ask advisors questions:
- "What's your assessment of Russia?"
- "Should I build more defenses?"
- "What are our chances if this goes nuclear?"

Advisors respond in real-time with voice synthesis.

### Advisor Loyalty & Betrayal
Low trust + ideological conflicts = potential betrayal:
- Leak information to press
- Sabotage operations
- Resign publicly
- Attempt coup

---

## 📝 Implementation Checklist

### Phase 1: Basic System (Week 1)
- [ ] Define 6 advisor personalities
- [ ] Create dialogue template database (100+ lines)
- [ ] Implement event → advisor trigger mapping
- [ ] Basic text-to-speech integration (ElevenLabs)
- [ ] Audio queue and priority system

### Phase 2: Integration (Week 2)
- [ ] Connect advisors to game events
- [ ] UI for advisor portraits/indicators
- [ ] Subtitle system for accessibility
- [ ] Volume controls (per-advisor)
- [ ] Mute/unmute functionality

### Phase 3: Advanced Features (Week 3)
- [ ] Trust & credibility system
- [ ] Advisor conflicts and debates
- [ ] War room timed decisions
- [ ] Historical decision log
- [ ] Adaptive music system

### Phase 4: Polish (Week 4)
- [ ] Record 200+ voice lines (or generate)
- [ ] Tune interrupt logic
- [ ] Balance advisor frequency
- [ ] A/B test advisor influence on gameplay
- [ ] Accessibility features (captions, audio descriptions)

---

**Status:** Design Complete, Awaiting Implementation  
**Dependencies:** ElevenLabs API key, Lovable Cloud enabled  
**Estimated Effort:** 4 weeks (1 developer)  
**Priority:** HIGH (Phase 3 Week 4)
