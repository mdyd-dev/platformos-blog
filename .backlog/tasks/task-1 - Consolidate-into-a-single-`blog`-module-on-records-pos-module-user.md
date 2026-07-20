---
id: TASK-1
title: Consolidate into a single `blog` module on records + pos-module-user
status: In Progress
assignee:
  - claude
created_date: '2026-06-03 15:28'
updated_date: '2026-07-20 14:22'
labels:
  - platformos
  - blog
  - modernization
  - tech-debt
dependencies: []
documentation:
  - >-
    https://documentation.platformos.com/developer-guide/modules/platformos-modules.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Collapse the current four-module setup (`modules/dashboard_blog`, `modules/dashboard`, `modules/signup`, `modules/utils`) into ONE platformOS module named `blog`, modernized to current best practices per https://documentation.platformos.com/developer-guide/modules/platformos-modules.md

Target end state:
- A single `modules/blog` module. `dashboard_blog` is renamed to `blog`; `dashboard`, `signup`, and `utils` modules are removed entirely, with anything still needed absorbed into `blog` or replaced by a dependency.
- Data stored as **records** (`schema/` + `records` GraphQL), not customizations / Custom Model Types.
- **Authentication** handled by pos-module-user, with the full public auth surface rebuilt on it: sign-up, log-in, log-out, password reset, edit profile.
- **Authorization** handled by pos-module-user with a `blog.manage` permission. Admin/editor pages are gated by `blog.manage`. A minimal in-blog "managers" screen lists users and grants/revokes `blog.manage` (replacing the old dashboard user-management screens). An initial manager is seeded.
- **Dropped features**: Google Analytics and the generic site "settings" from the old dashboard module are removed. The blog keeps only its own blog_instance settings.
- Best practices throughout: GraphQL only from pages (wrapped in `lib/queries`); create/update/delete via commands (build → check → execute) + plain `<form>` with CSRF (no `form_configurations`); `upload` property type for images; `render` (not `include`) with non-underscore partial names; user-facing text in translations; UI on pos-module-common-styling.
- Module manifest declares dependencies: pos-module-core, pos-module-user, pos-module-common-styling. Legacy pos-utils is gone.

Existing production data is stored as customizations; a data migration into the new record tables is part of this work.

This parent tracks the initiative. Work is split across subtasks sequenced by dependency (see each subtask's dependencies and ordinal). Each subtask is independently reviewable as its own PR. Run `platformos-check` after every change; it must pass with 0 errors before deploy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Exactly one blog module exists (modules/blog); the dashboard_blog, dashboard, signup, and utils modules are removed
- [x] #2 All blog data is stored and queried as records; no customizations / Custom Model Types remain
- [x] #3 Authentication (sign-up, log-in, log-out, password reset, edit profile) is provided via pos-module-user
- [x] #4 Authorization uses a blog.manage permission via pos-module-user; admin pages are gated by it and a minimal managers screen can grant/revoke it; an initial manager is seeded
- [x] #5 Google Analytics and generic dashboard settings are removed; only blog_instance settings remain
- [x] #6 Module manifest depends on pos-module-core, pos-module-user, and pos-module-common-styling; pos-utils is gone
- [x] #7 Existing blog content (instance settings + posts + images) is preserved via data migration and renders correctly
- [x] #8 platformos-check passes with 0 errors across the module
- [ ] #9 All subtasks are completed, each merged as its own reviewable PR
- [ ] #10 The existing TestCafe e2e suite (npm run test-ci) passes against the consolidated module, with page objects/tests updated for changed routes and markup; the Jenkins pipeline (deploy → test) is green
- [x] #11 New business logic added during the consolidation (commands) is covered by pos-module-tests unit tests
- [x] #12 The post editor uses pos-module-common-styling's markdown editor (replacing the vendored Trumbowyg WYSIWYG) and its image-upload component (bound to upload properties); the legacy custom_image upload and the Trumbowyg assets are fully removed
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
LEARNINGS FROM TASK-1.1 (propagated to all open subtasks as 'CONTEXT FROM TASK-1.1' notes on 2026-06-04):
(1) Record tables defined in a module's public/schema/ are module-namespaced: `modules/blog/blog_post`, `modules/blog/blog_instance`. Legacy customization data is also addressable as a records table under its original name (`modules/dashboard_blog/*`).
(2) platformos-check binary is deprecated; the per-subtask 'check passes with 0 errors' AC is interpreted as '`pos-cli check run` introduces no NEW offenses vs baseline' until legacy code is gone. Baseline at 1.1 close: 111 errors (59 blog legacy liquid → fixed by 1.3/1.4/1.6, 25 dashboard → 1.8, 20 signup → 1.5, 7 utils → 1.6). Parent AC#8 (0 errors across the module) becomes absolute after 1.6/1.8 land.
(3) platformOS upload properties support NO server-side MIME restriction; user decided none is needed (parent AC#12's image handling unaffected; forms may use client-side accept attr).
(4) Upload property can be set by writing a plain URL string (platform converts + generates versions) — simplifies 1.2 image migration and 1.4 upload handling.
(5) Tooling: `pos-cli exec graphql|liquid dev '<code>'` for ad-hoc smoke tests; pos-cli is npm-linked from ~/projects/js/pos-cli where exec error-reporting was fixed during 1.1 (uncommitted there).
(6) Branch state: 1.9 rename + 1.1 schema changes are uncommitted on `modernize-blog`; AC#9 (each subtask its own PR) needs commits split per subtask — pending user direction.

LEARNINGS FROM TASK-1.2 (2026-06-08):
- CORRECTION to note (4) above: a plain URL string does NOT set an upload property (record_create/update leaves the raw value `{}`; the skill's schema gotchas confirm a string can't set an upload). The working SERVER-SIDE mechanism is `value_upload: { type: image, acl: public, remote_url: <url> }` (platform fetches the URL and generates the schema's versions — used by 1.2's migration/seed). BROWSER/form uploads use common-styling's image-upload component (presign + multipart POST). Parent AC#7/#12 image handling depends on value_upload, not a bare string.
- platformos-check baseline is now 110 (was 111 at 1.1 close). 1.2 removed the legacy init partial + migration_create_customization/create_image graphqls (−1). Use 110 as the no-new-offenses baseline for 1.3–1.8; parent AC#8 (absolute 0) still lands after 1.4/1.5/1.6/1.8 remove the legacy modules.
- READS were pulled forward into 1.2: get_blog_posts + get_blog_instance now use the records API (details in 1.3). So AC#2 (records-only) is partly done; remaining customizations usage is in WRITE/AUTH paths (1.4/1.5/1.8) and the not-yet-extracted partial {% graphql %} calls (1.3).
- Markdown is already end-to-end on the READ side: stored post content is markdown (migration + seed) and show.liquid renders it via `| markdown` (transitional, added in 1.2). 1.4 still owns adopting common-styling's markdown EDITOR for the write form (AC#12).
- KNOWN GAP surfaced in 1.2: the single-post page route /blog/post/:blog_slug/:post_slug 404s (no page matches the sub-path). Assigned to 1.3 (reads/show).

NAMING CONVENTIONS & FILE LAYOUT (platformOS module best practices) — adopted 2026-06-08, ref the Documentation link. Canonical for ALL subtasks (1.3–1.8); each subtask's notes point here.

- Pages = controllers: read context.params, fetch ALL data, pass to partials as locals. NO HTML and NO {% graphql %} in views/partials. (Query objects under lib/queries ARE partials but are the sanctioned graphql home — exempt from the 'no graphql in partials' rule; same for the lib/migrations query objects from 1.2.)
- GraphQL ops live under public/graphql/{resource}/{action}.graphql. Everything consolidates under graphql/ (legacy graph_queries/ retired). Action vocabulary: search (list+filter), find (single record), create/update/delete (mutations). Tag reference path: 'modules/blog/{resource}/{action}'.
- Wrap each GraphQL op in a Query object at public/views/partials/lib/queries/{resource}/{action}.liquid, invoked from pages via {% function %} (never from a partial). Reference path: 'modules/blog/lib/queries/{resource}/{action}'.
- Encapsulate writes as Commands at public/views/partials/lib/commands/{resource}/{action}.liquid (build → check → execute).
- Resource dirs = plural snake_case keyed to the record table: blog_posts (table modules/blog/blog_post), blog_instances (table modules/blog/blog_instance); auth resources in 1.5 (users/sessions/password_resets); permission/managers resources in 1.8. Tables stay singular & module-namespaced.
- Partials: NEW partials have NO underscore prefix and are invoked with {% render %} (not include). The wholesale rename of legacy _-prefixed presentation partials + include→render happens in 1.6 (AC#2); subtasks before 1.6 may leave existing _-prefixed names in place to limit churn, but MUST follow the conventions above for any NEW file.
- User-facing text → translations (t filter); UI → pos-module-common-styling.

OPERATIONAL LEARNINGS FROM 1.3 (2026-06-09) — reusable across 1.4/1.5/1.6/1.8; all verified live on dev. Don't re-discover these.

FILE LOCATIONS / RESOLUTION (corrects the earlier 'lib under views/partials' assumption):
- Query objects AND commands live under public/lib/ (NOT public/views/partials/lib/). public/lib/ is its own partial-resolution root: public/lib/queries/blog_posts/search.liquid is referenced as 'modules/blog/queries/blog_posts/search' (the 'lib' segment is dropped). Commands likewise: public/lib/commands/{resource}/{action}.liquid -> 'modules/blog/commands/{resource}/{action}'. Confirmed against pos-module-core; the views/partials/lib/ form is DEPRECATED (core logs a deprecation). 1.3 already placed lib/queries/blog_posts/search + blog_instances/find here — REUSE for reads, don't re-wrap.
- BOTH {% include %} and {% render %} resolve partials WITHOUT the underscore prefix; the `_` is cosmetic for files under views/partials/. All 44 blog presentation partials are now no-underscore (1.3).
- EXCEPTION: under views/layouts/<subdir>/ the `_` prefix is what marks a file as a PARTIAL vs a LAYOUT — renaming such a file in place breaks runtime ('can't find partial'). 1.3 relocated all layout fragments to views/partials/layouts/blog|admin-blog/* (no underscore); views/layouts/ now holds ONLY blog.liquid. Put any new layout fragments under views/partials/.

LINT (`pos-cli check run`):
- NEW BASELINE after 1.3 = 80 errors (was 111 at 1.1 close / 110 after 1.2) — the blog-legacy underscore MissingPartial false-positives collapsed when the rename landed. Remaining legacy: dashboard ~25 (removed 1.8), signup ~20 (removed 1.5), utils ~7 (removed 1.6), plus inherent false-positives (the `<%= &blog_path =%>` module-placeholder LiquidHTMLSyntaxError, RSS markup, cross-module modules/utils/flash_messages MissingPartial). Use 80 as the no-new-offenses baseline; absolute 0 lands as each legacy module is removed.
- {% function %} and {% render %} require EVERY variable the partial references to be passed by the caller, else PartialCallArguments 'Required parameter X must be passed'; it ALSO flags passing args the partial does NOT use. Convention: declare params with {% doc %} @param and pass ALL of them, `null` for unused (cf. core `events/search', limit:50, page:null, uuids:null`). {% include %} shares parent scope so it's laxer, but the same applies once the partial resolves. {% doc %} @param TYPES are limited to string/object/number/boolean — 'array' is rejected by ValidDocParamTypes (use {object} for arrays).

PLAIN FORMS / CSRF: the token is `context.authenticity_token` (verified: renders a real token). Use it for the csrf-token meta and the plain <form> authenticity_token hidden field.

TOOLING:
- Non-streaming logs: `pos-cli fetch-logs <env> -q` (optionally `--last-log-id <id>` for only-new entries) — capture runtime errors deterministically instead of streaming `pos-cli logs`.
- Envs: dev = https://maciek.staging.oregon.platform-os.com/ ; tests = https://maciek293232189.staging.oregon.platform-os.com/ . Playwright reads MPKIT_URL (e.g. `MPKIT_URL=<dev-url> npx playwright test --project=home`); projects are home/reads/auth/posts/admin (reads/auth/posts/admin specs added per subtask). NOTE: there is no `npm run test-ci`; the suite is Playwright (`npm test` / per-project).
- `blog` is in app/config.yml modules_that_allow_delete_on_deploy, so removed/renamed files ARE deleted from the instance on `pos-cli deploy dev`.
- Dynamic routes: page front-matter `slug: 'path/:param'` populates context.params.param (1.3 used blog/post/:blog_slug/:post_slug).

KNOWN PRE-EXISTING BUG (unowned, pending user decision): /blog/category/<tag> 404s — category.liquid slug is static 'blog/category' while _post links tags as /blog/category/<tag>. Same static-slug class 1.3 fixed for the post page; needs a dynamic slug (blog/category/:tags).

CATEGORY ROUTING FIX (2026-06-09): the pre-existing /blog/category/<tag> 404 is RESOLVED. category.liquid slug is now the optional-segment dynamic pattern `blog/category(/:tags)` (platformOS supports `(/:param)` optional segments), reading context.params.tags instead of extract_url_params. Both /blog/category (bare → all posts) and /blog/category/<tag> (filtered) now return 200; verified the tagged page shows the 'Category:' label + matching post, a non-matching tag shows 'no content', no runtime errors. Side benefits: removed the `<%= &blog_path =%>` url_template from category (cleared its LiquidHTMLSyntaxError) and switched the index presentation partial from bare `current_user` to `context.current_user` (clears a PartialCallArguments the linter raises once the include resolves — globals accessed via `context.` are not treated as required params; useful pattern for 1.6's index-page url_template removal). platformos-check now 79 errors (was 80; −32 vs the 111 baseline). NOTE: pages/blog/index.liquid (slug '/') still uses the url_template + extract_url_params and still carries that one LiquidHTMLSyntaxError + a masked current_user include-check — 1.6 can give it the same treatment if the index page is reworked.

CONSOLIDATION COMPLETE (2026-07-20) — all 8 subtasks are Done (1.4/1.5/1.6/1.8 closed today; see their final summaries). End state verified on dev + tests instances:
- modules/ contains only blog, core, user, common-styling, tests. dashboard_blog/dashboard/signup/utils and ALL form_configurations are gone (deploys removed remote artifacts).
- pos-cli check run: 0 errors / 8 warnings (was 111 errors at task open). The 8 warnings are documented one-shot-migration N+1s and 2 UnusedAssign linter false-positives.
- Auth = pos-module-user built-in pages (/sessions/new, /users/new, /passwords/reset) + blog /log-out + /edit-profile; profile backfill migration keeps existing accounts working.
- Authorization = blog.manage via blog_manager role (app override of role_permissions), can_do_or_unauthorized gates, /dashboard/managers grant/revoke screen, idempotent first-manager seed.
- Records only: blog_post/blog_instance schema tables; the last `customizations:` alias residue in blog_posts/search.graphql + its query objects was renamed to `records:` today; the customizations API remains ONLY inside the one-shot legacy-data migration helpers (they read the legacy store by design).
- E2E: Playwright suite (home/auth/posts/admin/managers, 17 tests) passes against the tests instance; unit suites blog_posts/blog_instances/auth/managers pass on-instance.
- Jenkinsfile updated: node:20, Playwright image, MPKIT_URL env, `npm run test-ci` script restored (playwright test), report artifacts; E2E_TEST_PASSWORD credential is optional (authenticated suites skip without it).

REMAINING — the two unchecked ACs need a user decision, not code:
- AC#9: all subtasks are completed, but NOT 'each merged as its own PR' — work was committed directly to modernize-blog in batches (flagged as pending user direction since 1.1). Waive or rewrite the AC to match reality.
- AC#10: the Playwright suite passes locally against the tests instance and the pipeline definition is updated, but an actual Jenkins run (deploy → test green) cannot be verified from this environment; also note the Jenkinsfile's staging URL (blog-module.staging...) is a different instance that will need the dashboard-profile cleanup mutation before its first deploy of this code (see task 1.8 deployment note).

DEPLOYMENT NOTE for any other instance (incl. production): before deploying, run `mutation { user_profiles_delete_all(user_profile_type_name: "modules/dashboard/dashboard") { count } }` — the platform refuses to delete the dashboard instance_profile_type while profiles of that type exist.
<!-- SECTION:NOTES:END -->
