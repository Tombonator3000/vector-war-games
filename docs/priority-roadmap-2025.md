# NORAD VECTOR - Priority Roadmap 2025
**Strategic Implementation Plan**  
**Start Date**: 2025-10-12  
**Timeline**: 18 weeks to full feature completion

---

## Quick Reference

| Phase | Timeline | Focus | Status |
|-------|----------|-------|--------|
| **Phase 0** | Week 0 | Critical Hotfixes | 🔴 IN PROGRESS |
| **Phase 1** | Week 1-2 | Polish & UX | 📋 PLANNED |
| **Phase 2** | Week 3-5 | Accessibility & Performance | 📋 PLANNED |
| **Phase 3** | Week 6-9 | Strategic Depth | 📋 PLANNED |
| **Phase 4** | Week 10-14 | Content Expansion | 📋 PLANNED |
| **Phase 5** | Week 15-18 | Advanced Systems | 📋 PLANNED |

---

## Phase 0: Critical Hotfixes (Week 0)
**Duration**: 2-3 days  
**Goal**: Fix game-breaking issues and blockers

### Tasks
- [ ] **Fix Options Button** (2 hours)
  - Investigate z-index conflicts in Sheet component
  - Test pointer-events on all HUD layers
  - Verify click handlers work correctly
  - **Blocker**: Players cannot access settings

- [ ] **Fix City Lights Visibility** (4-6 hours)
  - **Option A**: Implement bloom post-processing (recommended)
  - **Option B**: Switch to instanced rendering with larger size
  - **Option C**: Add UI toggle for "Enhanced City Lights" mode
  - Test on multiple devices (desktop, mobile, tablet)
  - **User Complaint**: "Nei er fremdeles ikke lys" (repeated)

- [ ] **Quick Win: Action Confirmations** (3 hours)
  - Add toast notifications for all player actions
  - Color code: Green (success), Red (failure), Yellow (warning)
  - Include icons for action types
  - Test with all action types (launch, build, research, etc.)

### Exit Criteria
✅ All UI buttons functional  
✅ City lights clearly visible on globe  
✅ Every player action shows visual confirmation  
✅ No console errors on page load

---

## Phase 1: Polish & UX (Week 1-2)
**Duration**: 10-12 days  
**Goal**: Make game intuitive and visually polished

### Week 1: Information Architecture

#### Day 1-2: Progressive Disclosure System
- [ ] Implement "Beginner Mode" toggle
  - Hides advanced systems for first 10 turns
  - Unlocks features with on-screen announcements
  - Tutorial messages explain each unlock
- [ ] Redesign HUD layout
  - Primary info: Resources, DEFCON, Actions remaining
  - Secondary info: Collapsible panels for advanced stats
  - Tertiary info: Hidden in menus until needed

#### Day 3-4: Interactive Tutorial
- [ ] Create 5 tutorial missions
  1. **First Strike**: Launch missile + intercept incoming
  2. **Shadow War**: Deploy satellite + sabotage enemy
  3. **Hearts & Minds**: Culture bomb + meme wave
  4. **The Brink**: DEFCON management + treaty signing
  5. **Victory Paths**: Overview of all win conditions
- [ ] Add tutorial state tracking
  - Mark completed steps per save file
  - Offer to skip if player demonstrates competence

#### Day 5: Visual Hierarchy
- [ ] Implement color-coded UI sections
  - Red/Orange: Military operations
  - Blue/Cyan: Intelligence operations
  - Green/Yellow: Economic operations
  - Purple: Diplomatic operations
- [ ] Add section headers with icons
- [ ] Increase font size for critical info (+2pt)

### Week 2: Visual Feedback

#### Day 6-7: Enhanced Animations
- [ ] Resource change pop-ups
  - +/- indicators appear above resource counters
  - Animate for 1.5s with fade-out
  - Color coded: Green (+), Red (-)
- [ ] Phase transition overlays
  - Full-screen "AI TURN - STAND BY" message
  - Progress bar showing AI processing
  - Dramatic audio cue on transition

#### Day 8-9: Globe Visual Improvements
- [ ] Nation border glow on hover
  - Subtle pulse effect
  - Increase border width 1px → 2px on hover
- [ ] Missile trail enhancements
  - Increase persistence: 3s → 5s
  - Add trailing particle effect
  - Color based on warhead size
- [ ] Explosion impact marks
  - Leave scorch marks on globe for 5 turns
  - Darken affected region texture
  - Fade out gradually
- [ ] Radiation zone pulsing
  - Slow pulse animation (3s cycle)
  - Increase opacity on pulse peak

#### Day 10: Log System Enhancement
- [ ] Add log categorization icons
  - 🚀 Military, 🔍 Intelligence, 💰 Economy, 🤝 Diplomacy
- [ ] Implement log search/filter
  - Search by keyword
  - Filter by category, turn, or nation
- [ ] Add "Show Last Turn Only" toggle

### Exit Criteria
✅ New players complete tutorial without confusion  
✅ All actions have clear visual feedback  
✅ HUD information hierarchy tested with users  
✅ Globe visuals significantly improved  
✅ Log system easy to navigate

---

## Phase 2: Accessibility & Performance (Week 3-5)
**Duration**: 15-18 days  
**Goal**: Make game accessible and performant for all users

### Week 3: Accessibility Features

#### Day 11-13: Color-Blind Modes
- [ ] Implement color palette switcher
  - Normal (current colors)
  - Deuteranopia (red-green color blind)
  - Protanopia (red color blind)
  - Tritanopia (blue-yellow color blind)
- [ ] Replace red/green indicators
  - Use blue/orange instead
  - Add pattern overlays (stripes, dots)
- [ ] Test with simulation tools
  - Colorblindly Chrome extension
  - Sim Daltonism (macOS app)

#### Day 14-15: High Contrast Mode
- [ ] Create high contrast theme
  - Increase border thickness: 1px → 2px
  - Increase text weight: 400 → 600
  - Add text drop shadows (1px black)
- [ ] Increase globe contrast
  - Nation borders: More visible separation
  - Ocean: Darker to contrast with land
  - City lights: Even brighter in this mode

#### Day 16-18: Text & Keyboard Accessibility
- [ ] Add text scaling slider
  - Range: 80% - 150%
  - Convert all px to rem units
  - Test for layout breakage at all sizes
- [ ] Implement keyboard navigation
  - Tab through all interactive elements
  - Focus indicators on all buttons
  - Hotkeys: Space (end turn), 1-9 (actions), M (map)
- [ ] Screen reader support
  - ARIA labels on all interactive elements
  - Live regions for dynamic content updates
  - Test with NVDA (Windows) and VoiceOver (macOS)

### Week 4-5: Performance Optimization

#### Day 19-21: 3D Globe Optimization
- [ ] Implement instanced rendering for cities
  - Convert individual meshes to InstancedMesh
  - Expected FPS boost: 20-40%
- [ ] Add LOD (Level of Detail) system
  - Far cities: 32 vertex spheres
  - Close cities: 128 vertex spheres + glow
  - Switch distance: 2 units
- [ ] Frustum culling
  - Don't render cities outside camera view
  - Test FPS improvement (expect 10-15%)

#### Day 22-24: Particle System Optimization
- [ ] Implement particle pooling
  - Pre-create 500 particle objects
  - Reuse instead of new Object() each explosion
- [ ] Limit max particles
  - Cap at 500 simultaneous particles
  - Oldest particles removed first
- [ ] Optimize particle rendering
  - Use BufferGeometry instead of Geometry
  - Batch particles by texture

#### Day 25-27: General Performance
- [ ] Code splitting
  - Lazy load tutorial components
  - Lazy load flashpoint modal content
- [ ] Asset optimization
  - Compress textures (use WebP where supported)
  - Minify JSON data files
- [ ] Memory management
  - Dispose of unused Three.js objects
  - Clear log entries older than 100 turns
  - Profile for memory leaks

### Exit Criteria
✅ WCAG 2.1 AA compliance (95%+)  
✅ Color-blind modes tested by users  
✅ 60 FPS on desktop, 45+ FPS on mobile  
✅ Keyboard-only navigation fully functional  
✅ Load time < 3s to interactive

---

## Phase 3: Strategic Depth (Week 6-9)
**Duration**: 20-25 days  
**Goal**: Enhance gameplay depth and replayability

### Week 6-7: Game Balance Refinement

#### Playtesting Setup
- [ ] Recruit 10-15 playtesters
  - Mix of strategy game veterans and newcomers
  - Track session with analytics
- [ ] Implement telemetry
  - Track average game length
  - Track victory type distribution
  - Track AI effectiveness by personality
  - Track resource bottlenecks

#### Balance Adjustments (Data-Driven)
- [ ] Economy tweaks
  - Adjust production rate based on average game length
  - Target: 35-45 turns for average game
- [ ] AI behavior tuning
  - Increase Trickster sabotage frequency if underused
  - Verify Defensive AI actually builds defense
  - Test Aggressive AI escalation timing
- [ ] Victory condition tuning
  - Economic Victory: May need to increase city requirement
  - Cultural Victory: May need to adjust intel threshold
  - Add Diplomatic Victory path (see Week 8)

### Week 8: Advanced Diplomacy

#### Alliance System
- [ ] Implement alliance invitations
  - Cost: 50 intel
  - AI acceptance based on personality + threat level
  - Max 1 alliance at a time
- [ ] Alliance benefits
  - No attacks between allies
  - Share intel on common enemies (+10 visibility)
  - +10% production for all members
- [ ] Alliance betrayal
  - Can break alliance (costs reputation)
  - Diplomatic penalty with all AI nations

#### Trade Routes
- [ ] Implement trade route creation
  - Cost: 30 production + 20 intel
  - Choose: +2 uranium/turn OR +3 intel/turn
  - Max 2 trade routes per nation
- [ ] Trade route vulnerabilities
  - Can be sabotaged by enemies (25% chance/turn)
  - Sabotage costs enemy 40 intel
  - Destroyed route takes 3 turns to rebuild

#### Diplomatic Victory
- [ ] New victory condition
  - Requirements: Alliance with all surviving nations + 30 turn survival
  - Must not have attacked any ally during alliance
  - Counts as "Peaceful Victory" in stats

### Week 9: Audio & Polish

#### Dynamic Music System
- [ ] Compose/license 3 music tracks
  - Peace: Ambient, minimal (DEFCON 5-4)
  - Tension: Rising strings (DEFCON 3-2)
  - War: Full orchestra (DEFCON 1)
- [ ] Implement adaptive audio engine
  - Crossfade between tracks (3s fade)
  - React to threat level
  - React to DEFCON level
- [ ] Event-triggered sounds
  - Missile launch: Percussion spike
  - Nuclear explosion: Bass drop + 2s silence
  - Victory/defeat: Musical stingers

#### Final Polish
- [ ] UI animations
  - Button hover states (subtle scale)
  - Modal slide-in animations
  - Smooth scrolling in panels
- [ ] Loading screen
  - Add loading tips
  - Show random historical facts
  - Progress bar

### Exit Criteria
✅ Game balance verified by playtesting data  
✅ AI feels challenging but fair  
✅ Diplomacy adds strategic depth  
✅ Music enhances immersion  
✅ All UI interactions feel polished

---

## Phase 4: Content Expansion (Week 10-14)
**Duration**: 25-30 days  
**Goal**: Add new game modes and content for long-term engagement

### Week 10-12: Multiplayer Co-op

#### Backend Setup
- [ ] Enable Lovable Cloud / Supabase
  - Database: Game state table
  - Real-time: WebSocket channels
  - Authentication: Player accounts
- [ ] Create co-op room system
  - Room creation with unique code
  - Join room by code
  - Lobby with player list

#### Co-op Gameplay
- [ ] Shared resource pools
  - All resources shared between players
  - Both players can spend resources
- [ ] Role assignments
  - Commander: Strategic decisions (research, diplomacy)
  - Operations: Tactical execution (launches, defense)
  - Roles can be swapped mid-game
- [ ] Dual confirmation system
  - Nuclear launches require both players to confirm
  - 30s timeout if no response
- [ ] Co-op specific UI
  - Player role indicators
  - "Waiting for partner" messages
  - Synchronized turn progression

### Week 12-13: Seasonal Campaigns

#### Season System
- [ ] Implement 4 seasons (12 turns each)
  - Winter: Radar shadow, cold logistics
  - Spring: Floods, humanitarian missions
  - Summer: Storms, solar bonus
  - Autumn: Wildfires, ground transport bonus
- [ ] Season visual effects
  - Winter: Snow on globe, icy texture
  - Spring: Green vegetation
  - Summer: Heat shimmer
  - Autumn: Orange/red foliage
- [ ] Season-specific events
  - 3-5 unique events per season
  - Random chance each turn (20%)
  - Player choices affect outcomes

#### Seasonal Rewards
- [ ] Implement reward system
  - Each season offers 1 unique technology
  - Must complete season objective to unlock
  - Rewards persist across games (meta-progression)

### Week 13-14: Morale & Political Events

#### Morale System
- [ ] Implement public opinion tracking
  - 0-100 scale per nation
  - Affected by: War casualties, culture warfare, humanitarian aid
- [ ] Morale effects
  - High morale (70+): +10% production
  - Medium morale (40-69): No effect
  - Low morale (0-39): -10% production, +5% instability
- [ ] Morale UI
  - New panel showing morale graph
  - Tooltips explain recent changes

#### Political Events
- [ ] Create event generator
  - 20+ unique events
  - Triggered based on game state (war, economy, culture)
  - Events require player decisions
- [ ] Event categories
  - Domestic: "Anti-war protests", "Media criticism"
  - International: "UN Resolution", "Trade embargo"
  - Crisis: "Nuclear accident", "Refugee crisis"
- [ ] Event consequences
  - Choice A vs. Choice B
  - Each choice affects morale, resources, diplomacy

### Exit Criteria
✅ Co-op multiplayer functional and tested  
✅ Seasonal system adds variety to gameplay  
✅ Morale and events create dynamic narrative  
✅ Meta-progression encourages replays

---

## Phase 5: Advanced Systems (Week 15-18)
**Duration**: 20-25 days  
**Goal**: Add sophisticated strategic layers for advanced players

### Week 15-16: Cyber Warfare

#### Cyber Operations
- [ ] Implement cyber attacks
  - DDoS: Disable enemy defenses for 1 turn (60 intel)
  - Malware: Steal 10 intel from enemy (40 intel)
  - Hack: Reveal enemy research queue (50 intel)
- [ ] Cyber defense
  - Firewall: +25% resistance to cyber attacks (50 production)
  - Encryption: Protects intel from theft (30 production)
  - Cyber team: Can counter-attack hackers (80 production + 20 intel)
- [ ] Cyber warfare UI
  - New "Cyber Operations" panel
  - Shows active cyber attacks
  - Shows defensive status

### Week 16-17: Advanced Fog of War

#### Intelligence Uncertainty
- [ ] Implement fog of war system (using existing useFogOfWar hook)
  - Enemy resources shown with +/- margin of error
  - Margin reduced by satellite coverage
  - Deep reconnaissance reveals accurate data
- [ ] False positives
  - 10% chance of fake intel reports
  - "Enemy missile launch detected" (but it's false)
  - Can be verified with multiple intel sources
- [ ] Counterintelligence
  - AI can hide true capabilities
  - Player can invest in counterintel (60 intel)
  - Obscures player data from AI

### Week 17-18: Space Warfare & Final Polish

#### Space Layer
- [ ] Orbital weapons platform
  - Research project: "Space Defense Grid" (200 production, 8 turns)
  - Once complete: Deploy platforms (100 production each)
  - Intercept missiles from orbit (80% success rate)
- [ ] Anti-satellite weapons
  - Can destroy enemy satellites (70 intel)
  - Blinds enemy intelligence
  - Triggers diplomatic incident
- [ ] Space race victory
  - Alternative victory: First to deploy 5 orbital platforms
  - Counts as "Technological Victory"

#### Final Polish Pass
- [ ] Bug fixing
  - Fix all reported bugs from previous phases
  - Test all systems in combination
- [ ] Balance pass
  - Review all new systems for balance
  - Adjust costs and effectiveness based on data
- [ ] Documentation
  - Update in-game help with new systems
  - Create strategy guides for website
- [ ] Trailer & marketing
  - Record gameplay footage
  - Create launch trailer
  - Prepare press kit

### Exit Criteria
✅ All advanced systems functional  
✅ No critical bugs remaining  
✅ Final balance pass complete  
✅ Documentation updated  
✅ Ready for launch

---

## Post-Launch: Live Operations

### Month 1: Stabilization
- Monitor analytics and player feedback
- Hotfix critical bugs within 24 hours
- Balance patches based on data
- Community engagement (Discord, Reddit)

### Month 2-3: Content Updates
- New scenarios (historical and fictional)
- New leader personalities
- New doctrines
- Seasonal events (tie-in with real dates)

### Month 4-6: Expansion Planning
- Evaluate "We Come in Peace" mod viability
- Plan additional game modes
- Consider mobile port
- Explore monetization (cosmetics, expansions)

---

## Resource Allocation

### Full-Time Equivalent (FTE) Breakdown
- **Phase 0**: 0.5 FTE (3-4 days)
- **Phase 1**: 1.5 FTE (2 weeks)
- **Phase 2**: 2.0 FTE (3 weeks)
- **Phase 3**: 2.0 FTE (4 weeks)
- **Phase 4**: 2.5 FTE (5 weeks)
- **Phase 5**: 2.0 FTE (4 weeks)

**Total**: ~18 weeks with 2-person team  
**Alternative**: ~9 weeks with 4-person team

---

## Risk Mitigation

### Technical Risks
- **3D Performance**: Implemented instancing and LOD (Phase 2)
- **Multiplayer Sync**: Start with turn-based, not real-time (Phase 4)
- **Balance Loop**: Data-driven approach with playtesting (Phase 3)

### Scope Risks
- **Feature Creep**: Strict phase gates, no new features mid-phase
- **Timeline Slippage**: Built-in 10-15% buffer per phase
- **Quality vs. Speed**: Prioritize Phase 0-2, Phase 3+ can slip

### Team Risks
- **Burnout**: Sustainable pace, weekends off
- **Knowledge Silos**: Pair programming, code reviews
- **Turnover**: Documentation, knowledge transfer

---

## Success Metrics (KPIs)

### Tracked Per Phase
- **Phase 0**: Bug count, crash rate
- **Phase 1**: Tutorial completion %, new player retention
- **Phase 2**: FPS, accessibility score, load time
- **Phase 3**: Session length, victory type distribution, replay rate
- **Phase 4**: Co-op match completion, seasonal engagement
- **Phase 5**: Advanced feature usage rate

### Overall Goals (6 months post-launch)
- **MAU** (Monthly Active Users): 10,000+
- **DAU/MAU Ratio**: 20%+
- **Avg Session Length**: 40-60 minutes
- **D7 Retention**: 40%+
- **Review Score**: 4.5+ / 5 stars

---

## Appendix: Quick Wins List

### Can Be Done Anytime (1-2 hours each)
- [ ] Add more sound effects (explosions, UI clicks)
- [ ] Improve loading screen with tips
- [ ] Add "Report Bug" button in-game
- [ ] Create social media share feature
- [ ] Add achievements system (local, no backend)
- [ ] Implement "last played" timestamp
- [ ] Add "Continue Last Game" button on start screen
- [ ] Create dark/light mode toggle
- [ ] Add "Confirm End Turn" dialog (prevents accidents)
- [ ] Implement "Undo Last Action" (for misclicks)

---

**Document Owner**: Development Team  
**Last Updated**: 2025-10-12  
**Next Review**: End of Phase 0 (Week 1)
