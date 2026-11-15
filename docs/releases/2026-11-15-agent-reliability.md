# Agent reliability production release — 2026-11-15

Production: https://omniaihello.com
Source commit: 3defeeb941c87c14ecc67cf332a66f5d01d6a903
GitHub PR: https://github.com/ninglinLiu/infent-agent/pull/4 (merged)
Release tag: v2026.11.15.1
Deployment: dpl_3jGwnzgGpK6JNdUQ4FuKAQ2sGJVf
Deployment URL: https://infent-agent-431r304he-123lkflhdskjfs-projects.vercel.app

## Changes and configuration

- Authenticated allowance remains bounded: 10 chat requests/minute and 100 per rolling 24 hours/account. A chat may invoke the provider multiple times; this is not unlimited provider usage. Database locking, ownership checks and anonymous denial remain active.
- Rate limiting is per account rather than a shared campus IP. Driver candidates are deduplicated and capped at eight rather than rejecting the observed ten-driver requests. Transient session verification failures preserve the verified workspace; backend authorization remains mandatory.
- Retry transient provider failures once before consuming a stream; report timeout/auth/balance/output failures clearly, and permit subsequent requests. Increase output budget to 2400 tokens.
- The production model environment initially pulled with an empty LLM_API_KEY. Restored the existing project credential from the previous local release configuration as a sensitive server-only Vercel production variable. A genuine provider completion returned HTTP 200; the deepseek-chat alias returned model deepseek-flash. No credential is included in source, screenshots, evidence or portable distribution.
- Local offline preset mode is disabled on Vercel. Production still uses real model calls, production Supabase and normal market providers. Production learning allow_demo remains false.
- The two quota migrations were already applied and verified during portable-package delivery. No further production schema or user-data mutation was performed during this rollout.

## Verification

- 53/53 tests, TypeScript and ESLint passed. Both isolated and production Vercel builds passed.
- Protected isolated cloud candidate used Supabase sscjolfuydqmskqzfppn and the genuine configured provider: normal browser signup, three consecutive different successful draft_strategy results, three visible strategy cards, reload restoration, zero page errors. No synthetic model or market response was used. See agent-reliability-staging.json.
- Production candidate was created with --prod --skip-domain, then checked before promotion. Candidate and apex checks passed: landing, signup form, guest entrance, production Supabase compiled configuration, anonymous API 401s, local demo API 404, zero page errors. www redirects to apex.
- Production public Auth settings confirm signup enabled and mailer_autoconfirm=true. Actual account creation and paid chat rehearsal were confined to isolated staging, not production.
- Production data counts and ordered row-content MD5 digests match exactly before and after rollout:

| Dataset | Count | Before = after digest |
| --- | ---: | --- |
| auth.users | 23 | 9b58f1fbe5b8b66b7fadd121ffe892fd |
| messages | 160 | 9c19f34acb4a11b07dd74f03e69327a7 |
| usage_events | 80 | 4b58f811451d31d563a2c615c039d8b1 |
| sandbox_executions | 5 | dd218c57d3eff2f5621a2c00272c86c6 |

These are integrity summaries, not exported user records or a database backup. Existing users were not logged into or modified during verification. External provider availability, balance and arbitrary future prompts cannot be guaranteed by this rehearsal.

## Rollback

Previous deployment dpl_9VUJTHCCkSnPKnzYpCZS6ZkWs5ey was inspected Ready before promotion.

```powershell
vercel rollback dpl_9VUJTHCCkSnPKnzYpCZS6ZkWs5ey --yes --scope 123lkflhdskjfs-projects
```

Keep the production database and user records. No reverse migration or account deletion is required. The restored server model credential remains configured. No actual rollback was performed.
