# Aegis Protocol — NORAD Vector

A browser strategy game about Cold War crisis management, with nuclear and conventional warfare, diplomacy, production, research, political events and pandemic systems. Built with React, TypeScript, Vite and Three.js.

## Development

Use Node.js 20.19+ or a supported newer LTS release.

```sh
npm ci
npm run dev
```

## Verification

```sh
npm test                 # Full suite, exits when complete
npm run test:watch       # Interactive test runner
npm run build            # Production build
GITHUB_PAGES=true npm run build  # Build for /vector-war-games/
```

Vitest has its own configuration so unit tests do not start service workers or deployment plugins. CI runs the test suite and verifies the GitHub Pages build. The deployment workflow publishes changes from `main`.

## Working on the game

Read [agents.md](agents.md) before editing. Keep gameplay logic in focused modules with deterministic regression coverage; record significant changes in [log.md](log.md). The public phase-handler and state-manager interfaces support existing callers while their implementations are split into smaller modules.

See the [October 2026 gameplay audit](docs/code-audit-2026-10-08.md) for repaired behavior and remaining integration gaps.

The connected Lovable project is [available here](https://lovable.dev/projects/a89095ea-e077-4f9c-9f12-aa9ec3441a76).
