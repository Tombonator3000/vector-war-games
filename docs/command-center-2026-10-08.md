# Command center and gameplay UX — 2026-10-08

The operations dock previously wrapped dozens of tiny controls around the event log, objectives and helper. The resource header could omit production and intelligence when advanced stocks were absent, and did not show the uranium used for orders.

The command center now keeps Build, Research, Intel and Diplomacy visible, groups other operations under More, separates the strike planner and anchors End turn. The compact and minimal layouts use the same component. Header and dock dimensions are measured so panels follow the actual viewport, text wrapping and safe-area padding. Objectives start collapsed above the map; briefing, events and assistance sit above the command rail.

End turn shows the phase and remaining actions, blocks during opponent/resolution/production phases and pause, reviews unused actions and retains the existing end-game reveal action. The briefing preserves the event log node while collapsed and exposes resource stocks plus research and city progress.

Production shows costs, one-action use, current stock, prerequisites and exact resource deficits. A running city order and a defense grid at capacity are disabled before the player attempts another order. Stockpile values take precedence over stale legacy uranium mirrors.

Research uses the canonical `gameConstants` programs in a searchable, filterable list, including actual costs and duration. The existing technology graph and specialized programs remain available in a collapsible section. Research is blocked outside the player phase. The empire panel uses the existing accessible dialog primitive for Escape, focus handling and viewport sizing.

Map shortcuts ignore text editing, focused buttons, open menus/dialogs, modifiers and repeats; Intel/Culture shortcuts match the dock, and Alt+7/8 open radiation/migration layers. Small screens choose map layers from a labeled menu. All gameplay prices, durations and combat balance are retained.

Notifications and the advisor panel sit above the dock so they cannot cover End turn. The strategic globe fits both viewport axes with a HUD margin and preserves manual zoom after framing.

The main-menu wordmark fits its SVG viewBox, and the introductory globe camera frames the full sphere instead of clipping its poles. Its normal/specular textures retain linear color space and rotation uses frame time.

Validation covers production affordability, stockpile mirrors, duplicate construction, defense capacity, search and research queues, unused-action review, phase/pause/end-game controls, co-op requests, event-log preservation and shortcut isolation. Chromium checks desktop, portrait and landscape across synthwave, retro80s, wargames and highcontrast, then starts a real campaign and opens research. Screenshot artifacts are attached to the Command center UX workflow. CI also runs the full Vitest suite, Pages build and existing globe rendering checks.
