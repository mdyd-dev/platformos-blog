---
id: TASK-1.8
title: >-
  Authorization via blog.manage permission + minimal managers screen; remove
  dashboard module
status: Done
assignee:
  - claude
created_date: '2026-06-03 19:43'
updated_date: '2026-07-20 14:18'
labels:
  - platformos
  - blog
  - authorization
  - users
  - consolidation
dependencies:
  - TASK-1.5
documentation:
  - >-
    https://documentation.platformos.com/developer-guide/modules/platformos-modules.md
  - 'https://github.com/Platform-OS/pos-module-user'
parent_task_id: TASK-1
priority: high
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Part of the consolidation (parent task-1). Depends on the authentication subtask (1.5). Implements access control with pos-module-user and tears down the `dashboard` module (including dropping Google Analytics and generic settings).

Today access control lives in legacy mechanisms:
- `dashboard` module: `authorization_policies/dashboard_access.liquid`, `instance_profile_types/dashboard.yml` (admin profile), `create_first_admin.graphql`, `20190102222131_promote_users_to_admins.liquid`, plus user-management pages (`users/index`, `users/edit`), Google Analytics (`google_analytics` model, forms, page, `get_google_analytics.graphql`, the `_google_analytics` injection partial), and generic `settings` (model, form, page).
- `blog` module: `authorization_policies/instance_blog_edition.liquid` and `get_blog_user.graphql` gate blog admin/editor pages by checking the `modules/dashboard/dashboard` profile; admin UI affordances appear in header/_index/show/admin partials.

Replace all of this with a pos-module-user permission model:
- Define a `blog.manage` permission (and a role that carries it) using pos-module-user's permission mechanism. Gate every blog admin/editor page and write action (post create/update/delete, blog settings, managers screen) with the user module's permission helpers (e.g. `can_do` / `can_do_or_redirect` / `can_do_or_unauthorized`) keyed on `blog.manage`. Show admin-only UI affordances only to users with `blog.manage`.
- Build a minimal "managers" screen inside the blog admin: list users and grant/revoke `blog.manage` (assign/remove the permission/role via pos-module-user). This replaces the dashboard's `users/index` and `users/edit`. Use commands + plain `<form>` + CSRF.
- Seed an initial blog manager via a migration (replacing `create_first_admin` / `promote_users_to_admins`) so the system is usable on a fresh install. Keep it idempotent.
- Remove `blog/authorization_policies/instance_blog_edition.liquid` and `get_blog_user.graphql`.
- Drop Google Analytics and generic dashboard settings entirely: remove the GA model/forms/page/query and the `_google_analytics` injection from the blog layout, and remove the generic `settings` model/form/page. (The blog's own blog_instance settings remain, handled in the writes subtask 1.4.)
- Remove the `dashboard` module entirely once the blog no longer references it (`modules/dashboard/dashboard`, `modules/dashboard/dashboard_access`, `modules/dashboard/get_google_analytics`, `modules/dashboard/dashboard_current_user`, `modules/dashboard/stylesheets/bootstrap`). Replace the bootstrap stylesheet usage with common-styling (coordinate with templating subtask 1.6).

Access rules to preserve: anonymous visitors read the public blog; only `blog.manage` holders reach the admin/editor and managers screens and see admin affordances.

Reference: authentication reference (`references/authentication/`), commands, migrations references; pos-module-user (https://github.com/Platform-OS/pos-module-user); modules guide (documentation link).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A blog.manage permission (with a carrying role) is defined via pos-module-user and gates all blog admin/editor pages and write actions
- [x] #2 A minimal managers screen lists users and grants/revokes blog.manage (commands + plain <form> + CSRF), replacing the dashboard user-management pages
- [x] #3 An initial blog manager is seeded idempotently via migration so a fresh install is usable
- [x] #4 instance_blog_edition.liquid and get_blog_user.graphql are removed; admin affordances show only to blog.manage holders; anonymous users still read the public blog
- [x] #5 Google Analytics and generic dashboard settings are fully removed (models, forms, pages, queries, layout injection)
- [x] #6 The dashboard module is removed entirely and no modules/dashboard/* references remain
- [x] #7 platformos-check passes with 0 errors
- [x] #8 A negative test confirms a logged-in user WITHOUT blog.manage is redirected/forbidden from every admin, editor, settings, and managers page; a user WITH blog.manage is allowed
- [x] #9 pos-module-tests unit tests cover the grant/revoke-blog.manage commands (including granting to a non-existent user and revoking from a user who lacks it)
- [x] #10 The userListPage and dashboardPage e2e page objects are updated to the new managers screen and the related TestCafe tests pass (npm run test-ci)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approach (user approved "finish 1.8", 2026-07-20). Baseline: pos-cli check = 0E/8W; 1.5/1.6 already removed get_blog_user.graphql, rebuilt the dashboard bridge as pages+commands, and moved auth to /sessions/new.

1. PERMISSION MODEL: override app/modules/user/public/lib/queries/role_permissions/permissions.liquid (documented pos-module-user mechanism) — module defaults + "blog_manager": ["blog.manage"]. Grant/revoke = modules/user/commands/profiles/roles/append|remove on the PROFILE id (roles live on modules/user/profile records; can_do resolves permission via requester.roles).
2. GATING: drop authorization_policies front matter from every admin page (dashboard/blog, posts new/create/edit/update/delete, blog/settings + settings_update, new managers pages); each page inlines the user-module pattern: current_profile + include 'modules/user/helpers/can_do_or_unauthorized', do: 'blog.manage', redirect_anonymous_to_login: true, forbidden_partial: 'modules/user/components/pages/403' (anonymous → login redirect w/ session return_to; logged-in non-manager → 403). Delete blog/authorization_policies/instance_blog_edition.liquid.
3. MANAGERS SCREEN: page GET /dashboard/managers (profiles listing via modules/user/queries/profiles/search) + POST /dashboard/managers/grant + /dashboard/managers/revoke calling new blog commands lib/commands/managers/{grant,revoke} (find profile by user_id → invalid if missing; idempotent no-op if role already present/absent; else roles/append|remove 'blog_manager'). Self-revoke blocked in the revoke page handler. Managers tab added to admin navigation. Strings in translations/en/admin.yml.
4. ADMIN LAYOUT: new modules/blog/public/views/layouts/admin.liquid (common-styling init reset:false + blog admin-vendor/admin css + deferred admin js + flash/toasts partial + minimal header with home link, profile name → /edit-profile, log-out form). All admin pages switch layout: 'modules/blog/admin'; form_assets/commons include layers deleted (layout provides init + scripts — also clears more include call sites left in 1.6).
5. AFFORDANCES: public header Dashboard link + blog/index & show flying buttons switch from any-authenticated/owner-id checks to can_do 'blog.manage'.
6. GA + DASHBOARD REMOVAL: strip ga graphql/assign/render from views/layouts/blog.liquid, delete layouts/blog/google_analytics.liquid partial, rm -rf modules/dashboard (config.yml delete-on-deploy entry stays so remote files clear). grep 0 modules/dashboard references.
7. SEED: idempotent migration 20260720150000_seed_blog_manager — if no profile has blog_manager, append it to the profile of the lowest user_id (fresh install usable; on our instances that's admin@example.com). Replaces create_first_admin/promote_users_to_admins.
8. TESTS: unit managers_test (grant to nonexistent user invalid; grant/revoke happy path + idempotent re-grant/re-revoke; scratch user cleanup). E2E new tests/managers.spec.ts + playwright project: anonymous → /sessions/new redirect; logged-in non-manager 403 on blog/posts-new/settings/managers; grant → fresh user can open /dashboard/blog; revoke → 403 again; managers table badges. Old userListPage/dashboardPage (TestCafe) are gone — these are the replacements. Existing posts/admin specs keep passing (admin user seeded as manager by migration).
9. README admin/auth section updated (blog.manage + managers screen). Deploy dev+tests, full e2e, check run, finalize.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CONTEXT FROM TASK-1.1 (read before starting):
(1) platformos-check binary is deprecated — the check AC means `pos-cli check run` introduces NO NEW offenses vs the pre-task baseline. At 1.1 close the repo carried 111 pre-existing errors (59 legacy liquid in modules/blog, 25 dashboard, 20 signup, 7 utils). Removing the dashboard module here should eliminate its 25 errors — record before/after counts.
(2) Records GraphQL table names are module-namespaced (e.g. `modules/blog/blog_post`, `modules/user/profile`); bare names fail with 'Could not find Table'. The seed-initial-manager migration must use namespaced names in any records reads/writes.
(3) Smoke-test ad hoc with `pos-cli exec graphql dev '<query>'` / `pos-cli exec liquid dev '<code>'` (arg order: exec <type> <env>); errors only visible with the patched pos-cli npm-linked from ~/projects/js/pos-cli.
(4) Deploy with `pos-cli deploy dev`; app/config.yml modules_that_allow_delete_on_deploy lists dashboard, so deleted module files are removed from the instance on deploy.

LEARNINGS FROM TASK-1.2 (2026-06-08):
- baseline: platformos-check is 110 after 1.2 (was 111); removing the dashboard module should drop ~its 25 errors — record before/after.
- SEED-INITIAL-MANAGER migration: `pos-cli migrations run <ts> <env>` currently 404s — migrations run automatically on `pos-cli deploy`; to test the seed ad hoc run `pos-cli exec liquid dev -f <migration-file>`. 1.2's `migrations/20260604120100_seed_blog.liquid` is a working reference for an idempotent records-based seed migration (guard on total_entries==0 of the target table before creating). Keep idempotent.
- The `_google_analytics` layout-injection partial currently still calls {% graphql %}; removing GA here also removes that partial — 1.3's partial-graphql audit lists it as skippable once 1.8 has landed, so coordinate ordering.
- Managers screen records reads/writes: use module-namespaced tables and the records-API filters (customizations property FILTERS are broken against schema-typed tables — confirmed in 1.2; they return 0 even for matching rows). pos-module-user exposes its own user/permission queries/helpers — prefer those. value_upload note (parent) applies if any image is set. `pos-cli exec graphql dev '<q>' --params '<json>'` now supports variables for smoke-testing.

NAMING/LAYOUT (see parent task-1 'NAMING CONVENTIONS' note, 2026-06-08): the managers screen's grant/revoke writes are commands under public/views/partials/lib/commands/{resource}/{action}.liquid (e.g. managers/grant, managers/revoke — or per pos-module-user's permission API); user/permission reads via public/views/partials/lib/queries/{resource}/{action}.liquid wrapping public/graphql/{resource}/{action}.graphql (prefer pos-module-user's own queries/helpers over hand-rolled ones). Plain <form>+CSRF; render + no-underscore for new partials. NOTE on GA: 1.3 lifts the _google_analytics partial's {% graphql %} up into layouts/blog.liquid (to clear its partial-graphql audit); this task removes GA entirely, deleting that partial and the layout injection.

FROM 1.3 (2026-06-09; see parent 'OPERATIONAL LEARNINGS' note) — GA + dashboard_current_user GraphQL were LIFTED INTO THE LAYOUT in 1.3, so removing GA/dashboard here has specific touch-points:
- views/layouts/blog.liquid now starts with a {% liquid %} block containing `graphql dashboard_current_user = 'modules/dashboard/dashboard_current_user'`, `graphql ga = 'modules/dashboard/get_google_analytics'`, and `assign ga_tracking_id = ga.customizations.results.last.tracking_id`. REMOVE both graphql lines + the ga_tracking_id assign.
- The GA partial was relocated to views/partials/layouts/blog/google_analytics.liquid (no underscore) and is included from the layout as `modules/blog/layouts/blog/google_analytics`, tracking_id: ga_tracking_id. REMOVE that include line AND delete the partial file entirely.
- views/partials/layout/header.liquid no longer calls graphql — it expects `dashboard_current_user` as a passed-in LOCAL (the layout passes it). When dashboard is removed: rebuild the navbar's current-user/admin logic on pos-module-user's current-user helper + the blog.manage check, and stop passing dashboard_current_user from the layout.
- Managers screen: commands at public/lib/commands/{resource}/{action} ('modules/blog/commands/...'), queries at public/lib/queries/{resource}/{action} ('modules/blog/queries/...'); {% function %} arg discipline (pass all {% doc %} params, null unused; types string/object/number/boolean). Plain <form> CSRF = context.authenticity_token.
- AC#6 baseline now 80 errors (removing dashboard should drop ~its 25). Debug with `pos-cli fetch-logs dev -q`.

COMPLETION NOTES (2026-07-20):
- DEPLOY GOTCHA (matters for any other instance, incl. production): deleting instance_profile_types/dashboard.yml is REJECTED by the platform while user profiles of that type exist — the deploy fails with a validation error. Fix (run BEFORE deploying this change): `mutation { user_profiles_delete_all(user_profile_type_name: "modules/dashboard/dashboard") { count } }`. Done on dev + tests (1 profile each).
- Permission model: app/modules/user/public/lib/queries/role_permissions/permissions.liquid override (documented pos-module-user mechanism) defines blog_manager -> [blog.manage]. Roles live on modules/user/profile records; grant/revoke via modules/user/commands/profiles/roles/append|remove wrapped by modules/blog/commands/managers/{grant,revoke} (invalid for unknown user_id; valid no-op with .noop flag for re-grant/re-revoke).
- Gating: every admin page inlines current_profile + can_do_or_unauthorized (redirect_anonymous_to_login: true, forbidden_partial modules/user/components/pages/403). Verified live: anonymous -> 302 /sessions/new; logged-in non-manager -> HTTP 403 with the 403 partial rendered inside the page layout.
- New admin layout modules/blog/admin (common-styling init + blog admin css + deferred js + flash/toasts + minimal header with home/profile/log-out); replaced the deleted dashboard bootstrap layout on all admin pages; the form_assets/commons content_for shim partials became unnecessary and were deleted (fewer include call sites than after 1.6).
- Affordances: public header Dashboard link and the blog/index + show flying buttons now use can_do 'blog.manage' (previously any-authenticated / record-owner-id checks).
- Seed migration verified on dev: only user 1 (admin@example.com) has blog_manager; e2e users have []. Re-deploys skip (idempotent guard).
- Managers screen self-revoke is blocked in the revoke handler (flash error) and the revoke button is hidden for the current user — prevents locking out the last manager in the common case (a manager can still revoke another manager; a fresh seed only happens when NO manager exists, so full lockout requires deliberate mutual revocation — accepted for a minimal screen).
- Tests: managers_test unit suite passes on-instance; e2e suite is now 17 tests across home/auth/posts/admin/managers — all pass against the tests instance. The task's userListPage/dashboardPage TestCafe objects no longer exist; tests/managers.spec.ts + pages/auth.ts are the Playwright replacements (AC#10 satisfied in its modern form).
- pos-cli check run: 0 errors / 8 warnings (unchanged pre-existing warnings). modules/ now contains only: blog, core, user, common-styling, tests.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Authorization now runs on a `blog.manage` permission via pos-module-user; the dashboard module (and GA) is gone. The consolidation's last legacy module is removed.

**What changed**
- `blog_manager` role carrying `blog.manage` defined in the app override of the user module's `role_permissions/permissions` map (the documented extension mechanism).
- Every blog admin/editor page and write handler (posts CRUD, settings, managers) drops its legacy `authorization_policies` and gates with `can_do_or_unauthorized`: anonymous → redirected to `/sessions/new` (with session return_to), logged-in non-managers → HTTP 403. `instance_blog_edition` policy deleted (its `get_blog_user.graphql` went in 1.5).
- New minimal managers screen at `/dashboard/managers`: lists user profiles, grants/revokes `blog_manager` via plain CSRF forms → `modules/blog/commands/managers/{grant,revoke}` wrapping the user module's `profiles/roles/append|remove`. Self-revoke blocked. Managers tab added to the admin navigation.
- Idempotent migration seeds the first blog manager (lowest user id) when none exists — replaces `create_first_admin`/`promote_users_to_admins`.
- New `modules/blog/admin` layout (common-styling + blog admin assets, flash toasts, minimal header) replaces the dashboard bootstrap layout; the form_assets/commons content_for shims became redundant and were deleted.
- Admin UI affordances (header Dashboard link, settings/edit flying buttons) show only to `blog.manage` holders.
- Google Analytics removed end-to-end (layout query/injection, partial, model — data table dropped) and the `modules/dashboard` module deleted entirely; zero references remain. `modules/` is now just blog, core, user, common-styling, tests.

**Tests**
- `pos-cli check run`: 0 errors.
- Unit: `managers_test` passes (unknown user rejected, grant/revoke happy path against profile roles, idempotent no-ops, cleanup).
- E2E: suite grew to 17 tests with a new `managers` project — anonymous redirect, non-manager 403 on all four admin surfaces + no header affordance, grant → access works, revoke → 403 again, self-revoke hidden. All pass on the tests instance alongside home/auth/posts/admin.

**Deployment note (important for other instances)**
Deleting the dashboard `instance_profile_type` is rejected while profiles of that type exist. Before deploying this change anywhere else, run:
`mutation { user_profiles_delete_all(user_profile_type_name: "modules/dashboard/dashboard") { count } }`.
<!-- SECTION:FINAL_SUMMARY:END -->
