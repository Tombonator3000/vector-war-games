# Vector War Games - Task Tracking

**Last Updated:** 2026-01-27
**Current Branch:** `claude/evaluate-skills-integration-B94uN`

---

## Current Session: Edge-TTS Integration

### Completed
- [x] Research clawdbot/skills repository (352 skills available)
- [x] Identify relevant skills for Vector War Games
- [x] Document findings in log.md
- [x] **Implement Edge-TTS for advisor voices (FREE development TTS)**
  - Created `server/tts-dev-server.js`
  - Created `src/config/tts.config.ts`
  - Updated `src/lib/advisorVoice.ts` for multi-provider support
  - Added `npm run tts:dev` script

### Pending Tasks
- [ ] Evaluate `elevenlabs-agents` skill for production advisor deployment
- [ ] Consider `swarm` skill for parallel game calculations
- [ ] Test advisor voices in-game with Edge-TTS

---

## Quick Start: Advisor Voice Development

```bash
# Terminal 1: Start TTS server (FREE, no API key needed)
npm run tts:dev

# Terminal 2: Start game
npm run dev
```

---

## Voice Mapping Summary

| Advisor | Edge-TTS Voice | Character |
|---------|----------------|-----------|
| Military (Gen. Stone) | en-US-GuyNeural | Deep, authoritative |
| Science (Dr. Vance) | en-US-JennyNeural | Calm, analytical |
| Diplomatic (Amb. Wei) | en-GB-SoniaNeural | Measured, British |
| Intel (Dir. Garrett) | en-US-DavisNeural | Cryptic |
| Economic (Sec. Hayes) | en-US-TonyNeural | Practical |
| PR (Press Sec. Morgan) | en-US-AriaNeural | Urgent, expressive |

---

## Backlog (From agents.md)
- [ ] Dynamic dialogue generation
- [ ] Advisor trust/credibility system
- [ ] Priority interruption system for advisors
- [ ] Production ElevenLabs backend setup

---

## Notes
- See `log.md` for detailed session logs
- See `agents.md` for development guidelines and AI Advisor specifications
- Edge-TTS requires internet to `speech.platform.bing.com`
