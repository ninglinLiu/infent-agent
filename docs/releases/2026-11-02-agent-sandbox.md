# Agent sandbox release 2026-11-02

Production https://omniaihello.com runs source `2e4b7ad47b4cbe6fefe8b2e79b1ef7a96b0a7500`, Vercel deployment `dpl_7AZ5o5oYZpWVFAkGpy6E8qr4qbjJ`. The source is tagged `v2026.11.02.1`. Previous production deployment `dpl_Et1z8Sp9pokw8YbaLPw2MMHVub5X` was verified Ready and has source tag `v2026.10.30.1`.

Rollback application without deleting or restoring database data:

```
vercel rollback dpl_Et1z8Sp9pokw8YbaLPw2MMHVub5X --yes --scope 123lkflhdskjfs-projects
```

The sandbox migration adds accounts, orders, executions, a security-invoker view and authenticated functions. It was applied to isolated staging first and then production. Staging real-account checks covered login of two existing test accounts, order persistence, idempotency, duplicate-symbol rejection, cross-account isolation and anonymous denial. PGlite tests pass 43/43, offline evaluation 30/30; lint, typecheck, production build and 10 desktop browser tests passed, with two real-account browser tests skipped. The duplicate-symbol validation was added before staging migration and production migration.

Before and after production migration, row counts and content digests matched for auth users, profiles, conversations, messages, learning attempts and learning choices. New production sandbox accounts numbered zero immediately after migration; no staging users were copied. After promotion, production root, login, guest entry, four anonymous private API denials, www redirect and browser error checks passed. This is not a production authenticated transaction test. No paid model call was made during this release.

Security advisor warns that three public SECURITY DEFINER functions are executable by authenticated users, including the new sandbox functions; these use auth.uid ownership checks but direct callers can supply simulated prices, so simulated balances must not be treated as independently verified trading performance. Existing dependency audit reports 20 alerts. The separate AI quota and global cost-cap changes from the prior worktree were not included in this release.
