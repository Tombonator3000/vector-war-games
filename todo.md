# Vector War Games - Task Tracking

**Last Updated:** 2026-01-31
**Current Branch:** `claude/offline-pwa-support-0IcxQ`

---

## Current Session: PWA Offline Support

### Completed
- [x] **Install vite-plugin-pwa dependency**
- [x] **Configure PWA manifest with app metadata**
  - Name: "Aegis Protocol - NORAD Vector"
  - Display: Standalone, Landscape
  - Theme: Dark (#0a0a0a)
- [x] **Configure Workbox service worker for offline caching**
  - Precache: Core app assets (~4.3MB)
  - Runtime cache: Textures, music, SFX, leaders
- [x] **Create PWA icons for installability**
  - Generated radar-themed icons (192x192, 512x512)
  - Created maskable variants for Android
  - Created Apple Touch icon for iOS
- [x] **Update index.html with PWA meta tags**
- [x] **Test build successfully**

### How to Install the App
1. Open the game in Chrome/Edge/Safari
2. Look for install prompt or browser's "Install" option
3. App added to home screen/desktop
4. Works offline after first load

---

## Previous Session: Enable Advisor TTS

### Completed
- [x] Research clawdbot/skills repository (352 skills available)
- [x] Identify relevant skills for Vector War Games
- [x] Document findings in log.md
- [x] **Implement Edge-TTS for advisor voices (FREE development TTS)**
  - Created `server/tts-dev-server.js`
  - Created `src/config/tts.config.ts`
  - Updated `src/lib/advisorVoice.ts` for multi-provider support
  - Added `npm run tts:dev` script
- [x] **Add TTS status feedback to UI**
  - Added TTS availability checking on mount
  - Added warning banner when TTS server is unavailable
  - Added retry mechanism for TTS connection
  - Added status indicator in settings panel and footer

### Pending Tasks
- [ ] Evaluate `elevenlabs-agents` skill for production advisor deployment
- [ ] Consider `swarm` skill for parallel game calculations
- [ ] Test advisor voices in-game with Edge-TTS (requires running `npm run tts:dev`)

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
