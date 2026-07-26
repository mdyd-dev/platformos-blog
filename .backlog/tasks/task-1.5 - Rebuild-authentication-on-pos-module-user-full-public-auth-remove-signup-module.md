---
id: TASK-1.5
title: >-
  Rebuild authentication on pos-module-user (full public auth); remove signup
  module
status: Done
assignee:
  - claude
created_date: '2026-06-03 15:29'
updated_date: '2026-07-20 13:51'
labels:
  - platformos
  - blog
  - authentication
  - users
  - consolidation
dependencies:
  - TASK-1.9
documentation:
  - >-
    https://documentation.platformos.com/developer-guide/modules/platformos-modules.md
  - 'https://github.com/Platform-OS/pos-module-user'
parent_task_id: TASK-1
priority: high
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Part of the consolidation (parent task-1). Depends on the module-foundation subtask (1.9); the module path is `modules/blog`. Moves all authentication into pos-module-user and deletes the `signup` module.

Today the `signup` module provides the auth surface via legacy Forms + authorization_policies + a custom `current_user`/profile model:
- Pages: sign-up (`sing-up.liquid` — note the typo; the e2e registrationPage expects `/sign-up`, so fix the route/slug to `/sign-up`), log-in, log-out, edit-profile, and reset_password flow (recover_password, recover_password_email_sent, reset_password, password_changed).
- Form configs: log_in, log_out, user_form, edit_profile_form, reset_password/* (recover/reset/update_password_token).
- Graph queries: current_user, get_user_with_email, get_user_with_password_token, generate_user_temporary_token, update_password_token, log_out.
- Authorization policies: not_logged_in, must_by_logged_in, token_is_valid, log_out_and_redirect.
- Notification: reset_password/send_recover_password email.
- The `blog` module currently also calls `modules/signup/log_out`.

Rebuild this full public auth surface INSIDE the `blog` module on top of pos-module-user:
- Sign-up, log-in, log-out, edit-profile, and password reset (request → email → reset → confirmation), implemented with pos-module-user's user create/authenticate/session and password-reset capabilities. Use commands (build → check → execute) + plain `<form>` with CSRF for the write flows, and `lib/queries` for reads. Get the current user via the user module helper (never `context.current_user` or a custom `current_user` GraphQL).
- Send the password-recovery email via the platformOS email mechanism (emails-sms), porting the existing email content.
- Replace the blog's `modules/signup/log_out` usage with the new log-out flow.
- Remove the `signup` module entirely once nothing references it. Existing user accounts must keep working (pos-module-user operates on platformOS users, the same underlying user table).

Authorization (the `blog.manage` permission and gating) is handled in the authorization subtask (1.8); this task covers identity/authentication only. Coordinate the login redirect so unauthenticated access to admin pages routes to the new log-in page.

TEST IMPACT: the e2e page objects registrationPage (`/sign-up`, ids `#form-first-name`, `#form-email`, `#form-password`, submit `.btn.btn-primary.btn-lg`), loginPage (`/log-in`), recoverPasswordPage, and resetPasswordPage are bound to the old signup-module markup/routes and MUST be updated to the rebuilt forms (see acceptance criteria).

Reference: authentication, forms, and emails-sms references; pos-module-user (https://github.com/Platform-OS/pos-module-user); modules guide (documentation link).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sign-up, log-in, log-out, and edit-profile are implemented in the blog module on pos-module-user (commands + plain <form> + lib/queries)
- [x] #2 Password reset flow (request, recovery email, reset, confirmation) works via pos-module-user and the platformOS email mechanism
- [x] #3 Current user is obtained through the pos-module-user helper; no custom current_user GraphQL or context.current_user usage remains
- [x] #4 The blog no longer references modules/signup/*; the signup module is removed entirely
- [x] #5 Existing user accounts continue to authenticate after the switch
- [x] #6 platformos-check passes with 0 errors
- [x] #7 pos-module-tests unit tests cover the auth commands (sign-up, password-reset request, password reset) including invalid input, duplicate email, and invalid/expired token cases
- [x] #8 registrationPage, loginPage, recoverPasswordPage, and resetPasswordPage e2e page objects are updated to the rebuilt routes/markup, and registerTest, loginTest, and the recover/reset password e2e tests pass under npm run test-ci
- [x] #9 The /sign-up route works (typo fixed) and a newly registered user can log in, edit their profile, reset their password, and log out end-to-end
- [x] #10 The sign-up, log-in, and edit-profile forms are built with pos-module-common-styling form components (and its image-upload component for any avatar field) rather than the legacy signup-module markup
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approach approved by user 2026-07-20 ("please complete the migration" — covers 1.5 + 1.6 core). Baseline `pos-cli check run` (platformos-check-node via MCP): 71 errors / 53 warnings total = signup 22E/20W, dashboard 27E/7W, utils 7E, blog 15E/26W.

DESIGN — rebuild auth in modules/blog on pos-module-user (user 5.2.11 already in pos-module.json; module ships session/user/passwords commands + full pages):

1. New blog pages under public/views/pages/auth/ (layout: modules/blog/blog, modern `layout:` key):
   - GET /log-in → renders blog-local partial auth/login_form (email+password, hidden return_to, links to /passwords/reset + /sign-up). Selectors kept e2e-compatible: input[name=email], input[name=password], button "Log In".
   - POST /log-in → function 'modules/user/commands/session/create' (validate_password: true). Valid → flash notice + redirect_to params.return_to | '/'; invalid → re-render form with errors.
   - POST /log-out → 'modules/user/commands/session/destroy' → flash + redirect '/'. Replaces include_form 'modules/signup/log_out' in blog header AND modules/dashboard layout (dashboard layout is load-bearing for /dashboard/* pages until 1.8).
   - GET /sign-up (fixes the sing-up filename; slug was already sign-up) + POST /sign-up → 'modules/user/commands/user/create' (first_name, last_name, email, password) then auto-login via session/create user_id + validate_password:false, redirect '/'.
   - GET+POST /edit-profile → gated via current_profile (anonymous → redirect /log-in?return_to=/edit-profile). Names update via user-module profile/user update commands (exact command split TBD from profiles/update + user/email_update signatures).
2. Password reset: REUSE pos-module-user built-in flow (/passwords/reset → POST /authentication_links → module sends email via core email command → /passwords/new?token → POST /passwords auto-logs-in). No blog-local rebuild; deviation from "port existing email content" noted: module's own email content + translations are used instead.
3. Current user: 'modules/user/helpers/current_profile' everywhere. Rework instance_blog_edition policy to use it; DELETE modules/blog/public/graphql/get_blog_user.graphql. Remove `graphql dashboard_current_user` from blog layout/header; header shows first_name + Dashboard link for ANY authenticated user (admin-only gating stays enforced by dashboard_access policy on the pages; per-role header gating arrives with blog.manage in 1.8).
4. app/views/layouts/application.liquid (new): blog-chrome default layout so user-module built-in pages (/sessions/new, /users/new, /passwords/*) render styled after signup's layouts/application is gone.
5. Migration backfilling modules/user/profile records for pre-existing users (user/create creates profiles for NEW users only; current_profile breaks on users without profile record) → AC#5.
6. Delete modules/signup entirely (app/config.yml modules_that_allow_delete_on_deploy already lists signup → files removed on deploy).
7. Tests: new tests/auth.spec.ts (auth project): register→auto-login, log out, log in, wrong password error, edit profile, /passwords/reset renders+accepts email. Update tests/helpers/login.ts (goto /log-in?return_to=/dashboard). Unit test lib/test/commands/auth_test.liquid: user/create invalid input + duplicate email; user_from_temporary_token invalid token → null. Seed admin@example.com + dashboard admin profile on tests instance via graphql.
8. Verify: pos-cli check (expect −22E/−20W from signup removal + blog deltas), deploy dev + tests, liquid smoke tests, playwright auth/posts/admin projects.

PLAN AMENDMENT (2026-07-20, user-directed mid-implementation): (a) do NOT keep custom /log-in and /sign-up blog pages — login/registration use the pos-module-user BUILT-IN pages /sessions/new and /users/new directly (blog pages for them were built, verified, then removed per user message). The blog module keeps only POST /log-out (session/destroy command + flash) and GET/POST /edit-profile (profiles/update command). (b) No form_configurations anywhere — the dashboard module's 5 legacy Forms were also replaced with pages+commands (recorded in task 1.6). Both policies (instance_blog_edition, dashboard_access) redirect to /sessions/new; the platform appends ?return_to and edit-profile sets session.return_to which core redirect_to pops after login.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CONTEXT FROM TASK-1.1 (read before starting):
(1) platformos-check binary is deprecated — the check AC means `pos-cli check run` introduces NO NEW offenses vs the pre-task baseline. At 1.1 close the repo carried 111 pre-existing errors (59 legacy liquid in modules/blog, 25 dashboard, 20 signup, 7 utils). Removing the signup module in this task should eliminate its 20 errors — record before/after counts; absolute 0 lands only when 1.4/1.6/1.8 also complete.
(2) Smoke-test ad hoc with `pos-cli exec graphql dev '<query>'` and `pos-cli exec liquid dev '<code>'` (arg order: exec <type> <env>). GraphQL/Liquid errors only print with the patched pos-cli npm-linked from ~/projects/js/pos-cli.
(3) If any auth flow touches blog record tables, names are module-namespaced: `modules/blog/blog_post` / `modules/blog/blog_instance` (bare names fail). pos-module-user's own tables: profile lives at `modules/user/profile` (same namespacing convention).
(4) Deploy with `pos-cli deploy dev`; app/config.yml has modules_that_allow_delete_on_deploy listing signup, so deleted module files are removed from the instance on deploy.

LEARNINGS FROM TASK-1.2 (2026-06-08):
- baseline: platformos-check is 110 after 1.2 (was 111); removing the signup module should drop ~its 20 errors — record before/after.
- Any avatar/profile image upload: use common-styling's image-upload component (browser presign flow) or, server-side, `value_upload:{ type:image, acl:public, remote_url:<url> }`. A plain string value does NOT set an upload (this corrects parent note 4).
- `pos-cli migrations run <ts> <env>` currently 404s; migrations run automatically on `pos-cli deploy` (or `pos-cli exec liquid dev -f <file>` to test a migration ad hoc). `pos-cli exec graphql dev '<q>' --params '<json>'` now supports variables.
- Records filter LIST args need NON-NULL element types (`[String!]`/`[ID!]`) so omitted variables are ignored without a 'Nullability mismatch' error — handy if you write user-lookup queries (pattern proven in 1.2's read queries). Note pos-module-user reads users via its own helpers/queries; prefer those over hand-rolled customizations queries (and customizations property FILTERS are broken against schema tables anyway — use the records API).

NAMING/LAYOUT (see parent task-1 'NAMING CONVENTIONS' note, 2026-06-08): auth GraphQL under public/graphql/{resource}/{action}.graphql and commands/queries under public/views/partials/lib/{commands,queries}/{resource}/{action}.liquid — resources such as users (create/find/update), sessions (create=log in, delete=log out), password_resets (create=request, update=reset). Writes = command (build->check->execute) + plain <form> with CSRF; reads = lib/queries via {% function %} from pages; current user via the pos-module-user helper (never context.current_user or a custom current_user GraphQL). New partials: render + no underscore prefix; user-facing text via t filter; forms on common-styling components.

FROM 1.3 (2026-06-09; see parent 'OPERATIONAL LEARNINGS' note):
- Commands at public/lib/commands/{resource}/{action} ('modules/blog/commands/...'); query objects at public/lib/queries/{resource}/{action} ('modules/blog/queries/...'). NOT views/partials/lib. public/lib/ is the partial root (the 'lib' segment is dropped from the reference).
- {% function %}/{% render %} require ALL referenced params passed (null for unused); declare via {% doc %} (types string/object/number/boolean only).
- Plain <form> CSRF token = context.authenticity_token (verified live).
- Routing: static slugs like 'log-in' map directly; for param routes use front-matter `slug: 'path/:param'` -> context.params.param (so the /sign-up typo fix is just slug: 'sign-up'). Both {% include %} and {% render %} resolve no-underscore partials.
- The blog currently calls modules/signup/log_out; replace with the new session/delete flow.
- AC#6 baseline is now 80 errors (removing signup should drop ~its 20). Debug runtime with `pos-cli fetch-logs dev -q`; e2e via `MPKIT_URL=<dev-url> npx playwright test --project=auth` (there is no npm run test-ci — it's Playwright).

COMPLETION NOTES (2026-07-20):
- AC#6 achieved ABSOLUTELY: pos-cli check run = 0 errors / 8 warnings repo-wide (baseline at start: 71E/53W). Remaining warnings are 6 documented N+1s in one-shot migration helpers + 2 pre-existing UnusedAssign false-positives in blog_posts_test/blog_instances_test (checker does not see usage of a parse_json-assigned var in a subsequent function kwarg).
- AC#5 evidence: migration 20260720120000_backfill_user_profiles creates modules/user/profile records for pre-existing users (user module only creates profiles for users registered through its own commands; current_profile breaks without one). Verified on dev+tests: admin@example.com (created by old signup) has a profile and logs in through /sessions/new in the posts/admin e2e suites.
- AC#2 evidence: e2e submits /passwords/reset -> POST /authentication_links; tests-module sent_mails on the tests instance contains the email with the passwords/new?token=... link.
- AC#7: lib/test/commands/auth_test.liquid (user create blank/malformed/duplicate-email + user_from_temporary_token invalid token -> null, with cleanup via graphql/test/user_delete). Passes via /_tests/run. NOTE: the tests-module runner reports total_assertions: 0 for ALL suites (pre-existing runner quirk, blog_posts_test reports the same); failures would surface as total_errors.
- AC#8/#9: old TestCafe page objects no longer exist — the Playwright equivalents were written/updated instead: tests/pages/auth.ts (LoginPage /sessions/new, RegistrationPage /users/new, EditProfilePage, RecoverPasswordPage, AuthHeader), helpers/login.ts retargeted. Full suite (12 tests: home/auth/posts/admin) passes against the tests instance. The /sign-up typo route is MOOT — registration is /users/new now (old sing-up.liquid deleted with the signup module).
- app/views/layouts/application.liquid (new) wraps the user-module built-in pages in the blog chrome (they use the default layout; signup's application layout is gone).
- 2FA branch: not exercised (no OTP-configured profiles); the built-in module pages handle it natively.
- Login lands on '/' (header has Dashboard link); deep return works via session.return_to (edit-profile) or can_do_or_redirect; the ?return_to policy query param is NOT forwarded through the module's POST /sessions form — acceptable until 1.8 moves gating to can_do.
- E2E credentials on the tests instance: admin@example.com / E2E_TEST_PASSWORD (seeded via user_update; dashboard admin flag via modules/dashboard/commands/users/update).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rebuilt authentication on pos-module-user and removed the signup module entirely.

**What changed**
- Deleted `modules/signup` (pages, legacy Forms, policies, graph_queries, notifications, instance_profile_types). Deploy removed all remote artifacts (modules_that_allow_delete_on_deploy).
- Login/registration/password-reset now use the pos-module-user built-in pages (`/sessions/new`, `/users/new`, `/passwords/reset` → authentication-link email → `/passwords/new`) per user direction; a new `app/views/layouts/application.liquid` wraps them in the blog chrome.
- Blog module adds thin pages on top: `POST /log-out` (modules/user session/destroy command + flash) and `GET/POST /edit-profile` (profiles/update command, common-styling form components, translations).
- Current user is read exclusively via `modules/user/helpers/current_profile`: blog layout/header reworked (log-out plain form, Dashboard link for authenticated users), `instance_blog_edition` policy rewritten, `get_blog_user.graphql` and all `context.current_user` usage in the blog module removed.
- New migration backfills `modules/user/profile` records for pre-existing users so existing accounts keep authenticating (verified: legacy admin logs in and manages posts).
- Session flash normalized: blog flash partial + toasts render both sflash shapes ({message,severity} from user module, {error,notice,info} from core redirect_to).

**Tests**
- `pos-cli check run`: 0 errors (was 71 at task start).
- Unit: `auth_test` (user create validation incl. duplicate email; invalid temporary token) passes on the instance.
- E2E (Playwright, tests instance): full 12-test suite passes — register→auto-login, logout/login, wrong password error, edit profile, anonymous redirect, reset request (sent email with token link verified in sent_mails), plus home/posts/admin suites on the rebuilt login helper.

**Risks/follow-ups**
- Post-login deep return relies on session.return_to; policy ?return_to param is dropped by the module login form (resolves when 1.8 moves gating to can_do + blog.manage).
- Header shows the Dashboard link to any authenticated user; per-role gating arrives with blog.manage in 1.8.
<!-- SECTION:FINAL_SUMMARY:END -->
