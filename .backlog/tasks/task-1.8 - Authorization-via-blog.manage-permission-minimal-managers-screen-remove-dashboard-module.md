---
id: TASK-1.8
title: >-
  Authorization via blog.manage permission + minimal managers screen; remove
  dashboard module
status: To Do
assignee: []
created_date: '2026-06-03 19:43'
updated_date: '2026-06-09 08:38'
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
- [ ] #1 A blog.manage permission (with a carrying role) is defined via pos-module-user and gates all blog admin/editor pages and write actions
- [ ] #2 A minimal managers screen lists users and grants/revokes blog.manage (commands + plain <form> + CSRF), replacing the dashboard user-management pages
- [ ] #3 An initial blog manager is seeded idempotently via migration so a fresh install is usable
- [ ] #4 instance_blog_edition.liquid and get_blog_user.graphql are removed; admin affordances show only to blog.manage holders; anonymous users still read the public blog
- [ ] #5 Google Analytics and generic dashboard settings are fully removed (models, forms, pages, queries, layout injection)
- [ ] #6 The dashboard module is removed entirely and no modules/dashboard/* references remain
- [ ] #7 platformos-check passes with 0 errors
- [ ] #8 A negative test confirms a logged-in user WITHOUT blog.manage is redirected/forbidden from every admin, editor, settings, and managers page; a user WITH blog.manage is allowed
- [ ] #9 pos-module-tests unit tests cover the grant/revoke-blog.manage commands (including granting to a non-existent user and revoking from a user who lacks it)
- [ ] #10 The userListPage and dashboardPage e2e page objects are updated to the new managers screen and the related TestCafe tests pass (npm run test-ci)
<!-- AC:END -->

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
<!-- SECTION:NOTES:END -->
