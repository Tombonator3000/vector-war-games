# Muzak Soundtrack Bundle

Place the bundled NORAD Vector Command MP3 soundtrack files in this directory so they can be fetched at runtime.

| File name | Suggested description |
|-----------|----------------------|
| `vector-command.mp3` | Primary command center theme used on the title screen and strategic map. |
| `night-operations.mp3` | Low-tempo synth beds for after-hours monitoring. |
| `diplomatic-channel.mp3` | Warm, hopeful underscore for diplomatic briefings. |
| `tactical-escalation.mp3` | High-energy escalation track for late-game tension. |

All files should be encoded as MP3 and are referenced relative to `/Muzak/` by the in-game audio system.  Keep the filenames exactly as listed so preloading and caching work correctly.  Additional tracks can be added following the same pattern if desired.
