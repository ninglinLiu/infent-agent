# Accounts and personal data

This change extends the existing Next.js app. The street remains public; research chat and the study room require a verified Supabase session. `/account` edits the user's profile and watchlist. No service-role key is required by the application.

## Configuration

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` before building. Use the project's **publishable** key, never a secret or service-role key. Both public values may appear in the browser; authorization is enforced by the API and PostgreSQL RLS.

The connected project is `infent-agent`, reference `bofqqjgdkubmjdnpalqq`, region Singapore. Both migrations in `supabase/migrations/` were applied to this project. Apply them in filename order when creating another database. Preview and production should use separate databases once real users are present.

Registration now uses email + password without a verification email, as explicitly requested by the user on 2026-10-23. The user disabled **Confirm email** in the hosted project; the public Auth settings endpoint was checked and returned `mailer_autoconfirm: true`, email login enabled, and signups enabled. A successful signup returns a session and opens the dashboard immediately. The registration form first checks that autoconfirm remains enabled, so an accidentally re-enabled confirmation setting does not trigger an unwanted email. Email addresses serve as login identifiers and are not proof of mailbox ownership.

The UI exposes only sign-in and registration; the email-based password-recovery entry is removed. SMTP and confirmation callbacks are not required for this flow. The existing callback/password-update routes remain available for a separately configured recovery flow in the future. No SMTP account, custom domain, or paid resource has been provisioned.

If email-based recovery or confirmation is introduced later, set the Supabase production Site URL to `https://infent-agent.vercel.app` and allow these redirects:

- `https://infent-agent.vercel.app/auth/callback`
- `https://infent-agent.vercel.app/auth/callback?next=/auth/reset-password`
- Equivalent callback paths for localhost and explicitly trusted preview deployments used for testing.

Future public email delivery would require a custom SMTP provider and sender setup: Supabase's default mail service only sends to project team addresses. See [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

Vercel must deploy the Next.js server build, not static export. Set the two Supabase variables in the correct Vercel environment and rebuild. Keep existing model secrets in their current server-side environment; the implementation does not copy or expose them.

## Behavior and boundaries

- `profiles`: own nickname and language. Profile updates reject user ID and role fields.
- `learning_progress`: own learning state, with atomic partial updates. Failed writes remain visibly pending and can be retried. The browser warns before unloading with unsaved changes. Existing anonymous browser progress is not silently assigned to a new account.
- `conversations` / `messages`: owned history. The server writes the user's question and a pending assistant record before generation, and stores the final text, evidence, and completion status. Abrupt server termination can leave a pending record, shown as incomplete. History lists the latest 100 conversations and latest 100 messages per conversation.
- `watchlist_items`: own symbols; add and remove from `/account`.
- `usage_events`: shared database quota of 5 requests/minute and 30/rolling 24 hours per account. Refusals and failed generations consume a request. Anonymous access is rejected before invoking the model. This quota is not a guarantee of zero AI cost, nor a global spend cap.
- Account changes remount personal UI state; sign-out preserves cloud data. The existing portfolio and trading controls remain explicitly educational simulations.
- No admin role, billing, brokerage integration, or background job queue is introduced.

Authenticated writes check request origin; data queries explicitly filter owner and retain RLS. Personalized responses use `private, no-store`. Auth callback return paths reject external redirects. Personal pages load through authenticated APIs rather than server components: the Supabase browser client and route clients refresh cookie sessions, and every account API verifies the user. There is no dependency on a client-side gate for API authorization.

`begin_chat` deliberately uses SECURITY DEFINER for atomic quota accounting. It derives the owner exclusively from `auth.uid()`, locks per user, checks ownership, and is executable only by `authenticated`. The corresponding Supabase advisory is expected and requires review if this function is changed. Trigger execution is revoked from both anonymous and authenticated clients. Leaked-password checking remains a Supabase account setting and was not enabled by this change.

## Validation

Validated locally on 2026-10-23: production build, TypeScript and ESLint passed; 25 unit/integration tests and 30 offline evaluation cases passed. All six desktop navigation/rendering scenarios passed, including WebGL failure, plus the separate real Supabase two-account scenario (login, profile/watchlist persistence, progress, conversation ownership/history, and logout). The browser checks passed across targeted runs after fixing account initialization timing and completing the WebGL failure test's context-name coverage. Temporary QA accounts and local credential files were deleted afterward. No paid model calls were made. Registration-confirmation and password-reset email delivery remain untested until SMTP and redirect settings are configured.

## Production deployment — 2026-10-23

Latest release: `dpl_fFv3j9rQoedzHybwx16MZgsYBHjb` reached READY on the original production domain with the simplified login/registration form. TypeScript and ESLint passed. Production end-to-end testing confirmed a fresh signup immediately receives a session accepted by `/api/profile`, profile edits persist across logout and password login, duplicate registration is rejected with a useful message, and logout removes access. No confirmation email or OTP was used and no browser page errors were recorded. Both temporary accounts created during verification were removed; the completed test account was signed out before deletion. Screenshot: `docs/account-validation/registration-no-email.png`.

The opt-in production regression is `node tests/signup-live.cjs` with `TEST_SUPABASE_PUBLIC_KEY` set to this project's public key. It creates an isolated test account with a random password held only in memory. Its cleanup manifest in `test-results/signup-cleanup.json` contains only the exact test email/ID; remove that account after a run, including a failed run. Do not run it as an ordinary CI check against a live user database.

Deployed the current working directory to the existing Hobby project `prj_tBZLJIuJsm1sUWPlymNz05evAPw1` using the user's existing Vercel CLI login. Deployment `dpl_D6wqFoiSGGrNNcTmP6wR4qCQP1DJ` reached READY and was aliased to https://infent-agent.vercel.app. Both public Supabase environment variables were added to Production; existing LLM configuration was retained. No paid plan or resource was enabled. This was a direct CLI deployment; the working-directory changes have not been committed, pushed, or merged into GitHub.

Production browser smoke checks passed: `/login` returns 200, the configured Supabase password endpoint rejects nonexistent test credentials correctly, all four personal-data APIs and chat reject anonymous requests with 401, personal responses are no-store, the dashboard displays its login gate, and no browser page errors occurred. This validates deployment connectivity and anonymous access control; successful two-account authentication was tested locally against the same live database. Screenshot: `docs/account-validation/production-login.png`.

Email configuration from the initial rollout has been superseded by the user's no-confirmation signup requirement described above. Existing dependency audit warnings remain, including Next.js 14.2.35 and other runtime dependencies; they require a separately validated upgrade. A successful deployment does not resolve those findings. `.vercelignore` excludes local environment files, test credentials and verification artifacts from uploads.

Account screenshots are in `docs/account-validation/` and show temporary test data only.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run eval`, and `npm run build`.

`tests/accounts.test.ts` executes the SQL migrations in embedded PostgreSQL (PGlite), including Supabase-style default function grants. It exercises two-user isolation, foreign-key ownership, anonymous denial, atomic progress merge, quota enforcement, input validation, and fail-closed behavior.

`tests/browser/accounts-live.spec.ts` is opt-in. Set `ACCOUNT_TEST_FILE` to an ignored JSON file containing two **temporary, confirmed test accounts** as `[{"email":"...","password":"..."}, ...]`. Run `npm run test:browser -- tests/browser/accounts-live.spec.ts --project=desktop`. It checks real password login, profile/watchlist persistence, progress, chat history, cross-user API denial, and logout. Its scope-refusal prompt does not call a paid model. Remove test accounts and credential files after validation.

The existing visual/navigation tests use `tests/browser/fixtures.ts` to emulate a signed-in account and persisted progress within Playwright. No authentication bypass exists in production code. The real-auth scenario runs independently, without these interceptors. If testing another Supabase project, set `E2E_SUPABASE_PROJECT_REF` for the UI fixture cookie name. For local Node networking behind an HTTPS proxy, preload `tests/network-proxy.cjs` with `NODE_OPTIONS`; this test helper is not imported by production code.

## Free-tier scope

For a personal, noncommercial course project, Vercel Hobby and Supabase Free can cover hosting, authentication and the database within their quotas. Supabase Free currently pauses inactive projects after one week. AI calls and email delivery have separate limits/costs. No paid tier should be enabled without explicit authorization.
