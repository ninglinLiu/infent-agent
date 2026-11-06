# Replay recovery and market overview production release — 2026-11-06

Production: https://omniaihello.com
Source commit: 96e38715186fd841058ad019b04fcf7d781cd0ce
Source tree: bdb802e5fac9f314cf7b85ac8a9a41310fed287b
GitHub branch: feat/agent-sandbox
Vercel deployment: dpl_9VUJTHCCkSnPKnzYpCZS6ZkWs5ey
Deployment URL: https://infent-agent-5uzwe4z2y-123lkflhdskjfs-projects.vercel.app

## Changes

- Clamp historical replay animation progress to prevent negative array indexes
  when a frame timestamp precedes the animation start. This reproduced an
  undefined-price toFixed exception during the ordinary learning-room flow.
- Validate downloaded historical data, add a 12-second request timeout and
  retry/back actions, and contain replay errors rather than losing the dashboard.
- Restore saved replay records when loading learning progress.
- Remove the pictured blue-shirt Lin Che onboarding screen. Saved story step 1
  advances to the assignment without resetting lessons or changing persisted IDs.
- Include the get_market_overview tool from 6d2e9d9, using the terminal's existing
  market feed with source/timestamp/partial-coverage information.

## Verification

- Local production build, lint and types passed. Unit tests: 50/50; offline
  evaluations: 30/30; browser acceptance: 8/8.
- Browser regression coverage includes invalid/failed history recovery, all four
  replays through all decisions and reload persistence, early-frame timestamps,
  saved onboarding steps 0/1, chat rendering and the bilingual learning flow.
- Candidate built with existing production settings and --skip-domain. Candidate
  checks passed before promotion; production-domain checks passed after promotion.
- Live landing, login page and guest entrance worked. Anonymous requests to
  sandbox/learning/profile/conversations returned 401. www redirects to apex.
- Deployed UI checks used browser-only synthetic auth/data interceptors: sharks
  animate/pause, chat input works, five tools displayed, removed intro skipped,
  all four real static history files load and animate without uncaught errors.
  These checks do not claim real-account login or a real DeepSeek conversation.
- No real model call was made. No test accounts, production data writes, schema
  migration, credential/configuration change or AI quota change occurred.
- Vercel inspect confirmed omniaihello.com points to the deployment above, Ready.
- Existing dependency audit reports 9 moderate and 11 high findings; dependencies
  were unchanged in this release.

Git transport was unavailable locally. The connected GitHub Git Data API saved
the source tree and commit; the remote tree hash was compared with the tested
local index. The exact commit object was verified and restored locally before
cloning a clean release directory. No force push or main-branch merge occurred.

## Rollback

Previous production was confirmed Ready before release:
dpl_7JtZNDxjfBTh5YSikgooLaeofas2, source tag v2026.11.03.1.

```powershell
vercel rollback dpl_7JtZNDxjfBTh5YSikgooLaeofas2 --yes --scope 123lkflhdskjfs-projects
```

Rollback changes only the application deployment. Keep the existing database,
accounts and user records. No reverse migration is needed. The rollback target
was inspected; an actual production rollback was not performed.
