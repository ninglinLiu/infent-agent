# Replay recovery and onboarding update — 2026-11-06

The ordinary animated flow reproduced an undefined-price toFixed exception.
requestAnimationFrame can supply the frame-start timestamp before a later
performance.now() start time, so unclamped negative elapsed time revealed a
negative price index. Clamp animation progress to [0, 1]. A deterministic
early-frame regression also failed before the fix. Empty historical data was
a separate confirmed failure path; the original browser console was not available.

- Validate historical series before rendering: dates, finite positive prices,
  matching lengths and symbol, ordered dates and full decision-point coverage.
- Time out history requests after 12 seconds, evict failed responses, provide
  retry/back actions and contain rendering failures within the replay player.
- Add a dashboard recovery screen with retry/reload/home actions.
- Preserve valid saved replay results when reading account progress. Previously
  readAcademy discarded this existing field. No schema migration is needed.
- Skip the retired blue-shirt Lin Che intro in both languages. Persisted steps
  keep their old IDs: 0 advances to 2; saved step 1 displays 2; completion stays 3.
  Buffett's introduction and assignment remain. Other learning progress survives.

Validation: production build (including lint/types), 50/50 unit tests, 30/30
offline evaluations, and 8/8 isolated browser tests passed (six new recovery
cases plus the existing chat and bilingual learning flow). Browser tests cover
invalid HTTP-200 history -> retry, failed request -> other case/recovery, all four
replays through four decisions and reload persistence, and onboarding from saved
steps 0/1, plus animation timestamps preceding the start time. Browser auth/data are synthetic interceptors; no test users or data
were created in production. The old build failed the invalid-history regression
with the same Application error screen before the fix.

Release includes the market-overview tool from commit 6d2e9d9. No real DeepSeek
call was made in local tests. Production release/deployment and rollback evidence
will be recorded separately in docs/releases.

Verified current production rollback target:
dpl_7JtZNDxjfBTh5YSikgooLaeofas2 (Ready), source tag v2026.11.03.1.
No database migration, user deletion, credential change or quota change.
