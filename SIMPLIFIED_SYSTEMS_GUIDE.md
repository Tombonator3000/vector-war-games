# Simplified Gameplay Systems Guide

**Last Updated:** 2025-11-03
**Version:** 2.0

---

## Overview

Vector War Games has been streamlined to reduce complexity while maintaining strategic depth. This guide covers the **three major simplified systems** introduced in the latest update.

---

## 🤝 Unified Diplomacy System

### What Changed
- **Before:** 3 separate systems (Trust/Favors, Grievances/Claims, DIP currency)
- **After:** Single relationship score (-100 to +100) per nation

### Relationship Thresholds
| Score | Status | Meaning |
|-------|--------|---------|
| +60 to +100 | **Allied** | Can form alliance |
| +30 to +59 | **Friendly** | Open to cooperation |
| -29 to +29 | **Neutral** | Starting point |
| -59 to -30 | **Unfriendly** | Won't cooperate |
| -100 to -60 | **Hostile** | Likely to attack |

### Diplomatic Actions

#### 1. **Alliance** 🤝
- **Requirement:** +60 relationship or higher
- **Effect:** Permanent alliance, both nations +40 relationship
- **Benefits:** Won't attack each other, may defend each other

#### 2. **Truce** 🛡️
- **Duration:** 10 turns
- **Effect:** Temporary peace agreement
- **Best for:** Buying time to recover

#### 3. **Send Aid** 🎁
- **Cost:** 50 production
- **Effect:** +10 relationship with target
- **Best for:** Improving relations quickly

#### 4. **Propose Peace** ❤️
- **Availability:** When relations are hostile
- **Effect:** End active hostilities
- **Success depends on:** Target's current situation

### Relationship Modifiers
- **Positive Actions:**
  - Form alliance: +40
  - Honor treaty: +5/turn
  - Send aid: +10
  - Support in war: +15

- **Negative Actions:**
  - Break treaty: -35
  - Nuclear attack: -50
  - Bio-weapon attack: -45
  - Conventional attack: -25
  - Espionage caught: -15

- **Natural Decay:**
  - Non-allied relationships slowly drift toward neutral (±0.5/turn)

---

## 💊 Simplified Bio-Warfare

### What Changed
- **Before:** Complex evolution trees, 5 lab tiers, 7 plague types
- **After:** Simple deploy/defend model

### How It Works

#### Research Bio-Weapons (One-time)
- **Cost:** 100 Production, 50 Intel
- **Time:** 4 turns
- **Unlocks:** Ability to deploy bio-weapons

#### Deploy Bio-Weapon
- **Cost per deployment:** 50 Intel, 20 Uranium
- **Effect:** 3-5% population loss per turn
- **Duration:** 5-8 turns (random)
- **Discovery:** Depends on target's defense level

#### Bio-Defense Levels

| Level | Damage Reduction | Detection Chance | Cost |
|-------|------------------|------------------|------|
| 0 | 0% | 10% | Free (default) |
| 1 | 30% | 40% | 80 Prod, 30 Intel |
| 2 | 50% | 60% | 150 Prod, 50 Intel |
| 3 | 75% | 90% | 250 Prod, 80 Intel |

### Strategy Tips
- **Offense:** Deploy when enemy has low defense levels
- **Defense:** Prioritize upgrades if enemies research bio-weapons
- **Diplomacy:** Being caught with bio-weapons causes **-45 relationship**
- **Detection:** Higher defense = higher chance to discover attacker

---

## 🎭 Streamlined Culture System

### What Changed
- **Before:** Complex PopGroups, 5 immigration policies, 4 propaganda types, 5 wonders
- **After:** 3 propaganda types, 3 wonders, 3 immigration policies

### Cultural Power
**Formula:** `Cultural Power = Intel / 10 + (Wonder Count × 5)`

Used for determining propaganda effectiveness and cultural influence.

### Propaganda Campaigns

#### 1. **Subversion** 🔥
- **Cost:** 30 Intel
- **Duration:** 4 turns
- **Effects:**
  - +8 instability to target
  - -10 relationship
- **Discovery chance:** 30%
- **Best for:** Destabilizing enemies

#### 2. **Attraction** 🎭
- **Cost:** 25 Intel
- **Duration:** 3 turns
- **Effects:**
  - +15 relationship with target
- **Discovery chance:** 10%
- **Best for:** Improving relations

#### 3. **Demoralization** 📢
- **Cost:** 35 Intel
- **Duration:** 5 turns
- **Effects:**
  - -10 morale to target
  - -5 relationship
- **Discovery chance:** 25%
- **Best for:** Weakening enemy resolve

### Cultural Wonders (One per type)

#### 1. **Global Media Hub** 📡
- **Cost:** 80 Production, 40 Intel
- **Bonuses:**
  - +10 Production/turn
  - +15 Intel/turn
  - +10 Cultural Power

#### 2. **Elite University** 🎓
- **Cost:** 100 Production, 50 Intel
- **Bonuses:**
  - +15 Production/turn
  - +20 Intel/turn
  - +8 Cultural Power

#### 3. **National Monument** 🏛️
- **Cost:** 120 Production, 30 Intel
- **Bonuses:**
  - +20 Production/turn
  - +5 Intel/turn
  - +15 Cultural Power

### Immigration Policies

| Policy | Population Growth | Instability | Best For |
|--------|-------------------|-------------|----------|
| **Closed Borders** 🚫 | 0x | -2 | High instability situations |
| **Restricted** ⚖️ | 0.5x | 0 | Balanced approach (default) |
| **Open Borders** 🌍 | 1.5x | +3 | Rapid population growth |

**Note:** Growth is also affected by morale (0-2x multiplier)

---

## Victory Conditions (Streamlined)

### 4 Clear Paths to Victory

#### 1. **Diplomatic Victory** 🤝
- Allied with 60% of living nations
- Maintain DEFCON 4+ for 5 consecutive turns

#### 2. **Domination Victory** 💀
- Eliminate all enemy nations

#### 3. **Economic Victory** 💰
- Control 10+ cities
- Generate 200+ production per turn

#### 4. **Survival Victory** 🛡️
- Survive to turn 50
- Maintain 50M+ population

**Removed:** Cultural and Demographic victories (were unclear/impossible)

---

## Quick Reference

### Command Buttons
- **DIPLO:** Open unified diplomacy panel
- **BIO:** Open simplified bio-warfare panel
- **CULTURE:** Open streamlined culture panel
- **INTEL:** Unified intelligence operations (satellite/sabotage/cyber)

### Resource Management Priority
1. **Early Game:** Focus on production and intel generation
2. **Mid Game:** Build cultural wonders, establish alliances
3. **Late Game:** Maintain defense (cyber + bio), pursue victory condition

### Common Mistakes to Avoid
- ❌ Attacking nations without checking ally relationships
- ❌ Deploying bio-weapons without upgrading bio-defense first
- ❌ Ignoring cultural wonders (they provide permanent bonuses)
- ❌ Setting immigration to "Open" when instability is high
- ❌ Breaking treaties (severe relationship penalty: -35)

---

## Migration Notes

### Save Game Compatibility
Old save games are automatically migrated:
- **Diplomacy:** Trust/favor/grievance scores → Relationship score
- **Bio-warfare:** Existing plagues continue, but new deployments use simplified system
- **Culture:** PopGroups simplified to single population value
- **Victory:** Cultural/demographic progress ignored

### What Was Removed
- ❌ Trust records and favor balances
- ❌ Diplomatic promises system
- ❌ Bio-lab evolution trees
- ❌ Complex PopGroups management
- ❌ 2 victory paths (cultural, demographic)

### What Was Added
- ✅ Unified relationship system
- ✅ Simple bio-weapon deploy/defend
- ✅ Streamlined propaganda (3 types)
- ✅ Clear victory progress tracking

---

## Need Help?

- **In-game:** Press `/help` for command reference
- **Bug reports:** https://github.com/Tombonator3000/vector-war-games/issues
- **Strategy discussions:** Check the community forums

---

**Enjoy the streamlined gameplay! 🎮**
