# ASCII sharks production release — 2026-11-03

Production: https://omniaihello.com
Source commit: 6ae22bc9292c8e96467a121928e21b927ea1ebfb
Immutable source tag: v2026.11.03.1 (pushed to GitHub)
Vercel deployment: dpl_7JtZNDxjfBTh5YSikgooLaeofas2
Deployment URL: https://infent-agent-802c2mlqb-123lkflhdskjfs-projects.vercel.app

The left Agent chat now renders lavender ASCII sharks on white, with slower
swimming, lighter conversation backgrounds, pause, reduced-motion support and
offscreen suspension. Right-side market functionality and backend are unchanged.
Third-party source and MIT attribution are in components/agent/ascii-sharks/.

## Release verification

Deployed from a separate checkout of the pushed source commit using the existing
Vercel project. Built with production environment settings, initially without
moving domains. Vercel's authenticated CLI supplied access to the protected
candidate; access credentials were not committed. Candidate checks passed before
promotion. After promotion, inspect of omniaihello.com confirmed the new ID and
Ready status.

- Local production build/typecheck/lint passed; unit tests 43/43 and offline eval
  30/30. Desktop browser acceptance 7/7 (details in ../collab/ascii-sharks/README.md).
- Candidate and production: live landing, login page, guest entrance, anonymous
  denial (401) for sandbox/learning/profile/conversations passed.
- Production www domain redirects to omniaihello.com.
- Candidate and production UI bundle: browser-only synthetic auth/data fixtures
  verified changing shark frames, pause, editable input, and no uncaught browser
  errors. This does not claim a real-account login or a real model conversation.
- No account creation, model calls, database migration or data mutation during
  this release. No A/B/C test accounts copied to production.
- Existing dependency audit warnings remain: 9 moderate and 11 high. This visual
  release did not change dependencies or address those existing findings.

## Rollback

The previous production deployment was verified Ready before promotion:
`dpl_7AZ5o5oYZpWVFAkGpy6E8qr4qbjJ`, source tag `v2026.11.02.1`.

```powershell
vercel rollback dpl_7AZ5o5oYZpWVFAkGpy6E8qr4qbjJ --yes --scope 123lkflhdskjfs-projects
```

Rollback changes the app deployment only. Keep the existing database and user
data. No reverse migration is needed. Rollback readiness was verified, but an
actual production rollback was not performed.
