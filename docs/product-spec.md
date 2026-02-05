# Neon Chaos (MVP)

Neon Chaos is a mobile-first “chaotic arcade casino” decision game for groups:

- Host creates a room and shares a link
- Friends spectate instantly, optionally join with a nickname to influence
- Everyone votes (one chip) and the reveal is synchronized
- Result screen includes a shareable neon result card + rematch

## MVP mode: Roulette Vote

- Options: 2–12 labels
- Each participant places one vote on an option
- Votes influence probability (weighted randomness)
- “House Chaos” modifier adds chaos before the final outcome
- Server computes + stores winner; clients animate to it

## Non-functional requirements

- Mobile-first, thumb-friendly controls; safe-area padding
- Performance: cap devicePixelRatio to 2; pause Pixi ticker when tab hidden
- Accessibility: tap targets >= 44px; honors `prefers-reduced-motion`
- Architecture: UI separated from game engine; realtime event bus

