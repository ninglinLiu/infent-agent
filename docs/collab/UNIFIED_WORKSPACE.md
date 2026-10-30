# Unified desktop workspace

## Scope and design

The supplied pastel-house screenshot is a layout reference, as confirmed by the owner. This implementation builds on the existing rainy-night scene at `3057872` and adds three working entrance cards: AI, Study Room, and Exchange. The rain, roof tree, sign destinations, camera controls, and original product page remain available.

All entrances now share one desktop shell with five navigation entries:

| Entry | Content |
| --- | --- |
| AI Agent | The existing streaming research chat, evidence, and strategy cards, with the main page devoted to conversation |
| Exchange | Markets, Workspace, Discover, Journal, Backtest, Risk, and Settings |
| Study Room | Existing onboarding, learning overview, lessons, practice, and preferences |
| About | Product overview and a link to the full existing marketing page |
| House | Return to the 3D entrance without browser history navigation |

The palette uses cream, terracotta, and amber. Charts retain muted red/green financial semantics. The AI panel occupies more than 80% of the tested desktop viewport. No mobile layout or daytime scene was added.

The composition draws on the owner's screenshot and [Framer](https://www.framer.com/) for spacing and hierarchy; it does not copy Framer assets.

## Implementation and boundaries

- `UnifiedWorkspace` owns the shared navigation and lazily mounts each section on first use. Visited sections stay mounted while hidden, preserving chat history, input drafts, and section navigation across switches and returns to the house.
- `RepositoryConsole` and `AcademyConsole` gain an embedded presentation using local horizontal tabs. Their original standalone presentation remains supported.
- `AgentChat` gains presentation hooks and an empty-conversation welcome. Language changes update the greeting without erasing existing messages. Transport, request format, tool evidence, and safe answer rendering are unchanged.
- K-line and related chart presentation use warm colors; chart calculations and market requests are unchanged.
- Changes to console composition and chat presentation are necessary for the owner's explicit request for a single AI-first interface. They extend the handoff's default front-end allowlist, without modifying its rules.
- README, Agent/RAG/MCP backend, API routes, knowledge content, shared stores, learning progress schema, dependencies, and deployment configuration are unchanged. The generated knowledge-index timestamp is excluded from the commit.
- No credentials were read or copied. No paid model evaluation, merge, or production deployment was performed.

## Validation

Passed in the isolated checkout:

- TypeScript typecheck and ESLint.
- Unit/integration tests: 21/21.
- Offline retrieval evaluation: 30/30 (21 positive and 9 negative cases).
- Production build, including build-time lint and type checking.
- `git diff --check`.
- Production HTTP response for `/dashboard`: 200.

Browser checks used the local production preview through the connected in-app browser:

- Three entrance cards and the existing 3D rainy-night scene render.
- All five shared navigation entries render; House returns to the scene and restores its keyboard focus.
- AI panel measured 82.6% of the effective 1309 × 818 CSS-pixel viewport, with no document horizontal overflow.
- Chinese/English switching preserves the typed chat draft; switching through Exchange and back to AI also preserves it.
- All seven Exchange tabs render their corresponding view.
- Study onboarding completes, the first lesson can be completed, and the next lesson opens.
- About exposes the existing product introduction link.
- No JavaScript errors were reported by the browser log during these checks.

Screenshots: [house, English](screenshots/house-en.jpg), [AI, Chinese](screenshots/ai-zh.jpg), [AI, English](screenshots/ai-en.jpg), and [Study Room, English](screenshots/study-en.jpg).

The updated Playwright specifications were not run as a standalone suite; the interaction checks above were performed through the permitted connected browser. Do not treat this record as a complete browser-suite result. Live market requests were blocked by the local network environment, and no real-model chat request was sent. End-to-end live services should be checked by the owner in the normal deployment environment.

## Review and release

Changes are submitted on `collab/frontend` for review against `main`. This document does not authorize merge or deployment. The owner controls both. Review desktop Chinese and English layouts, the scene controls, chat evidence rendering, learning progress, and live integrations before release.
