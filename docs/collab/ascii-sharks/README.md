# Agent ASCII shark background — 2026-11-03

The left AI chat now has two swimming ASCII sharks, a sparse fish school and
lavender wakes on white. It replaces the welcome orb on this chat surface;
the original orb component remains available. The right research canvas is unchanged.
The effect fades when a conversation is present. Its pause control has its own
space above messages and cannot obscure the first bubble. Input, history,
strategy/tool cards and account behavior retain their existing code paths.

Source: https://github.com/stackedlol/ascii-sharks (MIT).
Pinned upstream revision and attribution: components/agent/ascii-sharks/SOURCE.md.
No new dependency, external asset service or model calls. The simulation is
purely decorative and does not represent market data or trading signals.

## Verification

- TypeScript, lint and final production build passed.
- Unit tests: 43/43; offline evaluations: 30/30 (no paid model calls).
- Final production-build desktop browser run: 7/7 passed (app, appearance, sharks).
- Verified changing canvas frames, pause/resume, reduced motion, stop/resume on
  hidden panels, Chinese/English, restored history, editable input, and no
  overlap between animation control and messages. No uncaught browser errors.
- An initial UI test reloaded the dashboard after the app removed its entry
  query, correctly returning to the house. Fixed the test to re-enter workspace.
  One intermediate dev-server run timed out waiting for the lazy canvas while
  the build was running; final production-build acceptance passed.
- PNGs here are actual local browser screenshots, with a clearly labelled
  test-account/history fixture. Market requests intentionally return unavailable.
  They are not live market or real-account verification.

## Delivery and rollback

Changes stay on the existing feat/agent-sandbox release branch for review.
No production deployment or database migration is part of this visual iteration.
Existing production tag v2026.11.02.1 and deployment remain untouched.
Revert this visual commit to restore the old welcome orb/background.
Unrelated local screenshots and generated knowledge-index changes are excluded.
