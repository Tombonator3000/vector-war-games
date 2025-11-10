# Tutorial and Database System

## Overview

This document describes the comprehensive tutorial and database system for Vector War Games.

## New Features

### 1. **Game Database** (GameDatabase)

A complete reference database covering all game mechanics and systems.

#### Features:
- **40+ detailed entries** covering all game systems
- **14 categories**: Basics, Nuclear Weapons, Defense, Research, Diplomacy, Conventional Warfare, Cyber Warfare, Bio Warfare, Pandemics, Governance, Intelligence, Victory Conditions, Special Modes, and Strategy
- **Search function**: Search for mechanics, weapons, or strategies
- **Lock system**: Features unlock progressively based on game turn
- **Cross-references**: Related topics linked together
- **Practical tips**: Strategic tips and warnings for each mechanic

#### Content includes:
- Resource system (Production, Uranium, Intel)
- DEFCON system and war readiness
- Nuclear weapons (ICBMs, Bombers, Warheads, Submarines)
- Defense systems (Missile Defense, Orbital Defense, Force Fields)
- Research system and technology tree
- Diplomacy system (Alliances, Trust, Favors)
- Conventional warfare (Armies, Fleets, Territorial control)
- Cyber warfare (Hacking, Sabotage, False-flag)
- Bio warfare (Plague types, Evolution tree, DNA Points)
- Pandemic system
- Governance and morale
- Intelligence and espionage
- All 6 victory conditions
- Great Old Ones campaign
- Advanced strategies

#### Access:
Open the **Options menu** and click on **"Game Database"** under "TUTORIALS & REFERENCE".

### 2. **Comprehensive Tutorial** (ComprehensiveTutorial)

An interactive tutorial system that guides players through all game mechanics step by step.

#### Features:
- **11 main sections** with 30+ detailed lessons
- **Progressive learning**: Unlocks based on game turn
- **Progress tracking**: See which lessons you have completed
- **Practice tasks**: Exercise tasks for each lesson
- **Pro tips**: Advanced strategies and expert advice
- **Warnings**: Important things to avoid
- **Key points**: Concise summary of each lesson

#### Sections:

1. **Basic Mechanics** (Turn 1+)
   - Welcome to Vector War Games
   - Resource System
   - DEFCON System
   - Turn Structure and Timing

2. **Nuclear Weapons and Strategic Warfare** (Turn 1+)
   - ICBMs
   - Strategic Bombers
   - Nuclear Warheads
   - Nuclear Submarines

3. **Defense Systems** (Turn 1+)
   - Missile Defense
   - Orbital Defense Grid
   - Population Defense and Bunkers

4. **Research and Technology** (Turn 6+)
   - Basic Research Mechanics
   - Research Priorities

5. **Diplomacy and Alliances** (Turn 1+)
   - Basic Diplomacy
   - Alliances and Treaties
   - Trust and Favor System

6. **Conventional Warfare** (Turn 11+)
   - Introduction to Conventional Warfare
   - Territorial Control and Occupation

7. **Cyber Warfare** (Turn 11+)
   - Introduction to Cyber Operations

8. **Biological Warfare** (Turn 26+)
   - Introduction to Bio Warfare
   - Evolution Tree and DNA Points

9. **Intelligence and Espionage** (Turn 1+)
   - Basic Intelligence

10. **Victory Conditions** (Turn 1+)
    - Overview of Victory Conditions
    - Diplomatic Victory - Detailed Guide

11. **Governance and Morale** (Turn 1+)
    - Population Satisfaction and Morale

#### Access:
Open the **Options menu** and click on **"Comprehensive Tutorial"** under "TUTORIALS & REFERENCE".

### 3. **Strategic Outliner & Macro Actions**

A neon-lit control panel that shows at all times which macro systems need attention.

#### Features:
- **Grouped sections** for Production & Military, Diplomacy & Governance, and Intelligence & Crisis.
- **Macro status**: Clear indicators for BUILD, RESEARCH, INTEL, BIO, CULTURE and DIPLOMACY – especially useful in co-op when roles lock actions.
- **Live alerts** for DEFCON, governance events, pandemics and active flashpoints. Critical cards flash red.
- **Hotkeys**: `O` hides/shows the panel, while `Shift+O` opens it immediately and pulses the frame for quick orientation.
- **Conflict log**: The latest conventional engagements update continuously so you can see where forces are being depleted.

#### Access:
- The panel is mounted next to the `PoliticalStatusWidget` and Approval Queue on the top bar.
- The hotkeys work globally as long as focus is not in a text field.

### 4. **Strategic Ledger**

A data-driven register in CivilizationInfoPanel that shows all known nations in one table, allowing you to quickly compare resources, military strength and diplomatic relations.

#### Features:
- **Filterable overview**: Chips for Allies, Enemies, Neutrals and Top 5 give you a snapshot of relevant blocs.
- **Sortable columns**: Click on column headers to prioritize what matters most – production, uranium, intel or pure military power.
- **Detail linking**: A row click opens the same detailed intelligence card as the Enemy Nations tab, without leaving the ledger.
- **Status badges**: Colored badges clearly show who is allied, hostile or under truce.

#### Access:
- Open CivilizationInfoPanel and select the **"Strategic Ledger"** tab.
- Hotkey: `Shift+L` jumps directly to the ledger tab when the panel is open.

## Integration with the Game

### Options Menu
Both systems are integrated into the Options menu under a new section called **"TUTORIALS & REFERENCE"**.

- **Game Database**: Click to open the comprehensive reference database
- **Comprehensive Tutorial**: Click to start the interactive tutorial

### Progressive Unlocking
Both the database and tutorial use the game's current turn to unlock content progressively:

- **Turn 1**: Basic systems available
- **Turn 6**: Research systems unlock
- **Turn 11**: Conventional and cyber warfare
- **Turn 26**: Bio warfare systems

This ensures that players are not overwhelmed by information early in the game.

## Technical Implementation

### New Components

1. **`src/components/GameDatabase.tsx`**
   - Comprehensive database component
   - 40+ database entries
   - Search and filtering functionality
   - Responsive design with tabs and categories

2. **`src/components/ComprehensiveTutorial.tsx`**
   - Interactive tutorial system
   - 11 sections, 30+ lessons
   - Progress tracking with localStorage
   - Sidebar navigation

3. **Updated `src/components/OptionsMenu.tsx`**
   - New "TUTORIALS & REFERENCE" section
   - Integration of database and tutorial
   - Passes `currentTurn` prop for feature unlocking

### UI Components Used
- Dialog (for modals)
- Sheet (for side panels)
- Tabs (for categorization)
- Accordion (for collapsible sections)
- Progress (for progress indicators)
- ScrollArea (for scrollable areas)
- Input (for search functionality)
- Button, Badge, Separator (for UI elements)

## User Guide for Players

### For Beginners
1. Start the game
2. Open **Options** (⚙️ icon)
3. Scroll down to **"TUTORIALS & REFERENCE"**
4. Click on **"Comprehensive Tutorial"**
5. Go through the sections in order

### For Experienced Players
1. Open **Options** during gameplay
2. Click on **"Game Database"**
3. Use the search function or categories to find specific information
4. Click on a topic for detailed information

### Tips
- **Database**: Perfect as a quick reference during gameplay
- **Tutorial**: Best for learning before/between game sessions
- **Search**: Use the search function in the database for quick access
- **Related topics**: Click on related topics to explore interconnected concepts

## Future Development

Possible improvements:
- [ ] Add more lessons for Great Old Ones campaign
- [ ] Video tutorials integrated into the system
- [ ] Interactive quizzes to test knowledge
- [ ] Player notes/bookmarks in the database
- [ ] Export database to PDF/Markdown
- [ ] Multi-language support (English, Norwegian, etc.)
- [ ] In-game contextual help (hover over elements)
- [ ] Achievements for tutorial completion

## Maintenance

### Adding a New Database Entry
1. Open `src/components/GameDatabase.tsx`
2. Add new entry to `DATABASE_ENTRIES` array
3. Follow existing structure with necessary fields
4. Add to correct category

### Adding a New Tutorial Lesson
1. Open `src/components/ComprehensiveTutorial.tsx`
2. Find the correct section in `TUTORIAL_SECTIONS` array
3. Add new lesson to `lessons` array
4. Include all necessary fields (title, content, keyPoints, etc.)

## Support and Feedback

For questions, bugs, or suggestions:
- Open an issue on GitHub
- Contact the development team

---

**Version**: 1.0
**Last Updated**: 2025-11-02
**Author**: Claude AI via Vector War Games Development Team
