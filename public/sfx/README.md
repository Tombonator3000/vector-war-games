# Sound Effects Directory

This directory contains game sound effects. All sound effects are integrated via the audioManager in `src/utils/audioManager.ts`.

## Required Sound Files

Download free sound effects from the sources below and save them with the exact filenames shown:

### UI Sounds
- `ui-click.mp3` - Button click
  - [Freesound: Button Click](https://freesound.org/people/BaggoNotes/sounds/721502/)
- `ui-hover.mp3` - Button hover
- `ui-success.mp3` - Success notification
  - [Freesound: Button Chime](https://freesound.org/people/JustinBW/sounds/80921/)
- `ui-error.mp3` - Error notification
- `ui-open.mp3` - Modal/panel open
- `ui-close.mp3` - Modal/panel close

### Explosions
- `nuclear-explosion.mp3` - Main nuclear blast
  - [Freesound: Nuclear Explosion](https://freesound.org/people/ryansnook/sounds/110114/)
- `explosion-shockwave.mp3` - Shockwave/rumble
  - [Freesound: Huge Explosion Shockwave](https://freesound.org/people/bevibeldesign/sounds/366091/)
- `explosion-blast.mp3` - Initial blast
  - [Freesound: Explosion](https://freesound.org/people/Iwiploppenisse/sounds/156031/)

### Military
- `missile-launch.mp3` - Missile/rocket launch
  - [Freesound: Rocket Launch](https://freesound.org/people/Sanderboah/sounds/803852/)
- `rocket-whoosh.mp3` - Rocket flyby
  - [Freesound: Missile Whoosh](https://freesound.org/people/zapsplat.com/sounds/719426/)
- `bomber-flyby.mp3` - Bomber aircraft

### Alerts & Warnings
- `alert-warning.mp3` - Warning alert
  - [Freesound: Warning Siren](https://freesound.org/people/vyclops/sounds/717414/)
- `alert-critical.mp3` - Critical alert
  - [Freesound: Air Raid Siren](https://freesound.org/people/vyclops/sounds/714426/)
- `defcon2-siren.mp3` - DEFCON level change
- `siren.mp3` - Emergency siren

### Game Events
- `research-complete.mp3` - Research finished
- `build-complete.mp3` - Construction complete
- `victory.mp3` - Victory fanfare
- `defeat.mp3` - Defeat sound
- `turn-start.mp3` - New turn begins

### Diplomacy
- `diplomacy-message.mp3` - Diplomatic message received
- `treaty-signed.mp3` - Treaty/agreement signed

### Economy
- `resource-gain.mp3` - Resource collected
- `construction.mp3` - Building in progress

## How to Download from Freesound.org

1. Visit the Freesound.org link
2. Click the "Download" button (requires free account)
3. Save the file with the exact filename from the list above
4. Place it in this `public/sfx/` directory

## Alternative Sources

- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) - Free, no attribution required
- [Uppbeat SFX](https://uppbeat.io/sfx) - Free with attribution
- [ZapSplat](https://www.zapsplat.com/) - Free with account
- [Freesound.org](https://freesound.org/) - Free with Creative Commons licenses

## Attribution

If using sounds from Freesound.org or other sources requiring attribution, list them here:

- [Add your sound attributions here]

## Note

The game will work without these sound files - they fail silently if missing. Add them to enhance the gameplay experience!
