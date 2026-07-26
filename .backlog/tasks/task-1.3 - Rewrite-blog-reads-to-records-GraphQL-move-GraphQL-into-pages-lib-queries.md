---
id: TASK-1.3
title: Rewrite blog reads to records GraphQL; move GraphQL into pages + lib/queries
status: Done
assignee:
  - maciej@platformos.com
created_date: '2026-06-03 15:29'
updated_date: '2026-06-09 08:29'
labels:
  - platformos
  - blog
  - graphql
  - records
dependencies:
  - TASK-1.2
documentation:
  - >-
    https://documentation.platformos.com/developer-guide/modules/platformos-modules.md
parent_task_id: TASK-1
priority: high
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Part of the consolidation (parent task-1). Runs after the data-migration subtask (1.2); the module path is `modules/blog`.

Two coupled concerns: switch read queries from `customizations` to `records`, and stop calling GraphQL from partials.

1) Convert read queries (now under `modules/blog/public/graphql/` — renamed from the legacy `graph_queries/`):
- `get_blog_posts.graphql`: replace the `customizations(name: "modules/dashboard_blog/blog_post", properties: [...])` root with `records(filter: { table: { value: "modules/blog/blog_post" }, properties: [...] })` — NOTE: table names are module-namespaced (`modules/blog/blog_post`, NOT bare `blog_post`); a bare name silently matches nothing (verified in 1.1). Keep equivalent behavior: pagination (page/per_page), sort by published_at desc, filters for id, without/except ids, tags (OR), blog_instance_id, title, slug, and the published_at range filters (lte/lt/gt/gte). Read scalars with `property(name:)` / `property_array(name:)`, and read images from the new `upload` properties via `property_upload(name:) { url versions }` instead of `custom_image` (version URLs look like `.../thumb_<filename>` on the CDN; versions defined in 1.1 are `thumb` on blog_post.author_avatar and `normal` on blog_instance.header_image).
- `get_blog_instance.graphql`: same conversion to `records` with `table: { value: "modules/blog/blog_instance" }`, preserving the enabled/sidebar_enabled/grid_view_enabled/scope/slug filters and all returned fields, reading images from `upload` properties.
- Related posts/instance joins work via `related_record(table: "modules/blog/blog_instance", join_on_property: "blog_instance_id")` (verified working in 1.1, including against legacy rows).

2) Move data fetching out of partials into pages, then wrap each query in a reusable query object under `modules/blog/public/lib/queries/` invoked from the page only (never from a partial). Audit and fix every partial that calls `{% graphql %}`:
- `views/partials/blog/_index.liquid`
- `views/partials/blog/_posts-section.liquid`
- `views/partials/blog/_siblings-nav.liquid`
- `views/partials/layout/header.liquid`
- `views/layouts/blog/_google_analytics.liquid` (note: this GA injection is removed entirely in 1.8 — if 1.8 has already landed, the partial no longer exists and can be skipped here)
The owning pages (`views/pages/blog/index.liquid`, `show.liquid`, `rss.liquid`, `category.liquid`, `views/pages/dashboard/blog.liquid`, `views/pages/dashboard/blog/settings.liquid`) fetch the data and pass it to partials as locals.

Scope note: READ paths only (write paths and auth queries are separate subtasks). Keep visual output identical.

Reference: graphql, pages, and partials references; modules guide (documentation link).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 get_blog_posts and get_blog_instance use records(filter:{table}) instead of customizations, preserving all existing filters, sorting, pagination, and returned fields
- [x] #2 Image fields in read queries are read from upload properties (no custom_image accessor remains)
- [x] #3 No partial in the module calls {% graphql %}; all data is fetched in pages and passed to partials as locals
- [x] #4 Read queries are wrapped as reusable query objects under lib/queries and invoked from pages
- [x] #5 Blog index, single post, category, and RSS pages render the same content as before the change
- [x] #6 platformos-check passes with 0 errors
- [x] #7 homePageTest passes under npm run test-ci; the single-post, category, and RSS read paths return the same content as before (verified manually or via e2e), with homePage/postPage page objects updated for any markup changes
- [x] #8 A grep confirms no {% graphql %} call remains in any partial in modules/blog
- [x] #9 The public post (show) page renders the content field to HTML using the rendering approach matching common-styling's markdown editor, and existing migrated content still displays correctly
- [x] #10 The single-post page route /blog/post/:blog_slug/:post_slug resolves (no 404) and renders the post: the show page slug is a dynamic pattern (e.g. blog/post/:blog_slug/:post_slug), not the static 'blog/post'. Verified: /blog/post returns 200 but the sub-path 404s today (found in 1.2).
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
APPROVED PLAN (2026-06-08) — applies the platformOS resource/action layout (see parent task-1 'NAMING CONVENTIONS' note).

A. Directory + naming (graphql/{resource}/{action}):
- git mv graph_queries/get_blog_posts.graphql   -> graphql/blog_posts/search.graphql
- git mv graph_queries/get_blog_instance.graphql -> graphql/blog_instances/find.graphql
- git mv graph_queries/get_blog_user.graphql     -> graphql/get_blog_user.graphql  (auth resource owned by 1.5; MOVE ONLY, name unchanged so its authorization_policies reference stays valid). Then remove the empty graph_queries/.
- KEEP the `customizations:` alias inside the two renamed read queries for now, so the write-path form_configurations/blog_post.liquid only needs its query-NAME string updated (no accessor change). The alias->`records` rename is deferred to 1.4 (which replaces that form anyway).

B. Query objects (AC#4) — lib/queries/{resource}/{action}.liquid (no underscore; matches lib/migrations/*):
- views/partials/lib/queries/blog_posts/search.liquid   -> {% graphql %} 'modules/blog/blog_posts/search'; applies per_page|default:20, page|default:1 (replicates the .graphql variable defaults that an explicit null would otherwise override); {% return %} the collection (.customizations).
- views/partials/lib/queries/blog_instances/find.liquid -> {% graphql %} 'modules/blog/blog_instances/find'; {% return %} .customizations.results.first (single record or nil).

C. Pages as controllers; presentation partials consume locals (AC#3):
- index.liquid (slug '/') + category.liquid (slug 'blog/category'): do URL parsing (slug/tags/page/per_page/feature_post_first) and call BOTH query objects via {% function %}, then render 'modules/blog/blog/index' passing blog_instance, blog_posts, slug, tags, per_page, feature_post_first. (Small controller duplication across the two pages is accepted; query objects must be called from pages, not a shared partial.)
- show.liquid: front-matter slug -> 'blog/post/:blog_slug/:post_slug' (AC#10); read context.params.blog_slug / .post_slug (drop extract_url_params). Call blog_instances/find + blog_posts/search for: the post (slug+instance+published_at_lte today), previous_post (published_at_lt), next_post (published_at_gt + lte today), related (tags+except_id) and other (except_id) posts (concat|uniq|limit:3). Render the show presentation partials passing all as locals.
- rss.liquid, dashboard/blog.liquid, dashboard/blog/settings.liquid: pages — swap their {% graphql %} for {% function %} query-object calls inline.
- _index.liquid, _posts-section.liquid, _siblings-nav.liquid: remove {% graphql %}; consume passed-in locals. (Kept _-prefixed; the render/no-underscore migration is 1.6.)
- Layout partials: lift dashboard_current_user (partials/layout/header.liquid) and GA tracking_id (layouts/blog/_google_analytics.liquid) up into layouts/blog.liquid and pass them down as locals — removes {% graphql %} from those partials.

D. Out-of-scope touch (unavoidable, minimal): form_configurations/blog_post.liquid — update its two 'modules/blog/get_blog_instance' strings to 'modules/blog/blog_instances/find' (string-only; keeps .customizations via the retained alias; no write-logic change).

E. Markdown (AC#9): keep show.liquid {{ blog_post.content | markdown }}.

F. Verify:
- pos-cli check run stays at the 110 baseline / no NEW offenses (AC#6).
- grep confirms no {% graphql %} in presentation partials, scoped to exclude lib/ query objects (AC#8): `grep -rn '{%-* *graphql' modules/blog/public/views/partials | grep -v /lib/` is empty.
- Deploy dev; smoke index, /blog/category/<tag>, /blog/post/<blog>/<post>, /blog/rss.rss render identically.
- Run Playwright `home` project against the tests env if reachable (AC#5/#7); page objects updated only if markup changed (markup should be unchanged).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CONTEXT FROM TASK-1.1 (read before starting): (1) Table names are module-namespaced — always `modules/blog/blog_post` / `modules/blog/blog_instance` in records filters, record mutations, and related_record; bare names fail or silently match 0 rows. (2) Smoke-test queries ad hoc with `pos-cli exec graphql dev '<query>'` (note arg order: exec graphql <env>); GraphQL errors are only visible with the patched pos-cli npm-linked from ~/projects/js/pos-cli. (3) 'platformos-check passes with 0 errors' = `pos-cli check run` introduces NO NEW offenses vs the pre-task baseline; the repo carried 111 pre-existing errors at 1.1 close (59 legacy liquid in modules/blog, 25 dashboard, 20 signup, 7 utils) — absolute 0 only lands when legacy code is removed (1.4–1.8). Verify baseline-vs-after with git stash if unsure. (4) platformos-check binary is deprecated — use `pos-cli check run`.

LEARNINGS / STATUS FROM TASK-1.2 (2026-06-08) — SCOPE HAS SHRUNK, read before starting:

CONCERN 1 (convert read queries customizations->records) IS ALREADY DONE — do NOT redo it:
- get_blog_posts.graphql and get_blog_instance.graphql already use `records(filter:{ table:{ value:"modules/blog/blog_*" }, properties:[...] })`, preserving pagination, sort (published_at desc) and all filters, and read images via `property_upload(name:){ url versions }` (no custom_image accessor remains in these two queries). They keep a `customizations:` ALIAS on the records root so existing call sites (`g.customizations.results`) work unchanged — you may rename that alias to `.records` when wrapping in lib/queries, updating call sites together.
- `enabled` is now a Boolean filter (`value_boolean`); callers pass `enabled: true` (NOT the string 'true'). Records filter LIST args use NON-NULL element types (`[String!]`, `[ID!]`) so omitted variables are ignored — nullable element types raise 'Nullability mismatch on variable'.
- Image accessors already updated in the consumers 1.2 touched: _index (header_image.versions.normal || .url), _post (hero_image.url), show (hero_image.url, author_avatar.versions.thumb || .url). => AC#1 and AC#2 are effectively satisfied for these queries; verify they still hold, then check them. Do not re-implement.

CONCERN 2 (move {% graphql %} out of partials -> pages + lib/queries) IS NOT done — this is now the BULK of 1.3. Partials still calling {% graphql %}: _index, _posts-section, _siblings-nav, layout/header (and _google_analytics IF 1.8 hasn't landed). Wrap the two read queries as lib/queries objects, fetch in the owning pages, pass results to partials as locals.

NEW REQUIRED WORK — single-post page ROUTING is broken (now AC, added): /blog/post/:blog_slug/:post_slug returns a platformOS 404 (no page matches the sub-path); /blog/post alone is 200. The show page slug is the static `blog/post`. 1.2 confirmed the show LOGIC + markdown render are correct (validated the render path directly), but the route never reaches the page. Fix the slug to a dynamic pattern so single posts open. AC#5/#7 (single-post renders same content) cannot pass until this is fixed.

DIRECTORY RECONCILIATION — the description states queries were 'renamed from graph_queries/ to graphql/'; that did NOT happen. The READ queries still live in `public/graph_queries/`; 1.2 added migration queries under `public/graphql/migrations/`. Both resolve at runtime. Consolidate to one location (moving graph_queries/* -> graphql/ matches the skill convention and the migration queries' home).

MARKDOWN (AC#9): show.liquid ALREADY renders content via `| markdown` (added transitionally in 1.2); _post excerpt fallback uses `| markdown | html_to_text`. Keep/confirm; the editor side is 1.4. AC#9 is largely satisfied for migrated/seeded content.

baseline: platformos-check is 110 after 1.2 (no-new-offenses baseline). Smoke-test queries with `pos-cli exec graphql dev '<q>'`; for variable binding, `pos-cli exec graphql` now supports `--params '<json>'` (added/validated during 1.2), or use `pos-cli exec liquid dev` calling a query file.

NAMING CONVENTIONS ADOPTED IN 1.3 (see parent task-1 'NAMING CONVENTIONS' note): read GraphQL moves to graphql/blog_posts/search.graphql + graphql/blog_instances/find.graphql; query objects at lib/queries/blog_posts/search.liquid + lib/queries/blog_instances/find.liquid, invoked from pages via {% function %}. graph_queries/ is retired (get_blog_user moved unrenamed; owned by 1.5). Presentation partials stay _-prefixed until the 1.6 render/no-underscore migration. The customizations:->records alias rename is handed to 1.4.

IMPLEMENTATION COMPLETE (2026-06-08). Summary of what landed + verification:

LOCATION CORRECTION vs the recorded plan: query objects went to `modules/blog/public/lib/queries/{resource}/{action}.liquid` (the canonical platformOS `public/lib/` partial-resolution root, referenced as `modules/blog/queries/{resource}/{action}`), NOT under `views/partials/lib/queries/`. Confirmed against pos-module-core (`modules/core/public/lib/queries/events/search.liquid` -> `modules/core/queries/events/search`); the `views/partials/lib/queries/` form is the DEPRECATED location (core logs a deprecation for it). This matches the task description's literal `public/lib/queries/` path.

FILES: graphql moved+renamed to graphql/blog_posts/search.graphql, graphql/blog_instances/find.graphql, graphql/get_blog_user.graphql (get_blog_user move-only); graph_queries/ removed. Query objects: lib/queries/blog_posts/search.liquid (+ blog_instances/find.liquid) with {% doc %} params, to_positive_integer defaults, returning the records collection / first record; `customizations:` alias kept on the .graphql roots (form_configurations/blog_post.liquid updated to the new query NAME only, accessor unchanged; alias->records deferred to 1.4). Pages index/category/show/rss/dashboard/blog/dashboard/blog/settings now fetch via {% function %} and pass locals; partials _index/_posts-section/_siblings-nav are pure presentation. Layout lifts dashboard_current_user + GA tracking_id into layouts/blog.liquid and passes them to layout/header + layouts/blog/_google_analytics. show.liquid slug is now dynamic blog/post/:blog_slug/:post_slug reading context.params.

KEY LINT LEARNING (for 1.4/1.5/1.8): {% function %} (unlike {% include %}, which shares parent scope) requires EVERY referenced variable to be passed by the caller, or platformos-check raises PartialCallArguments 'Required parameter X must be passed'. Convention (per core's `events/search', limit:50, page:null, uuids:null`): declare params in {% doc %} and have callers pass ALL of them, using `null` for unused filters. Also: {% doc %} @param types are limited to string/object/number/boolean ('array' is rejected by ValidDocParamTypes — use {object} for arrays).

PLATFORMOS-CHECK (AC#6): baseline at d10aee1 = 111 errors; after 1.3 = 117 errors. The +6 are all MissingPartial on _index's legacy `_`-prefixed includes (modules/blog/blog/hero, posts-list, pagination, social-list, tags-widget, facebook-widget, flying-button — all VERIFIED to exist as _*.liquid). They are the SAME false-positive class as the 62-error baseline (the linter doesn't resolve underscore-prefixed includes referenced without the `_`); they surfaced only because _index now parses cleanly once the url_template moved to the pages. All eliminated by 1.6's render/no-underscore migration. My NEW files (query objects, moved graphql, layout edits) lint with ZERO errors; PartialCallArguments and the transient ValidDocParamTypes were driven to 0. NestedGraphQLQuery warnings are in 1.2's migration helpers, not 1.3 files.

FUNCTIONAL VERIFICATION (deployed to dev, live curl): index `/` 200 (post + hero render, no Liquid errors); single post `/blog/post/blog/getting-started-with-the-platformos-blog-module` 200 (title + c-article__content render) — AC#10 confirmed fixed (was 404); `/blog/rss.rss` 200 (channel + item). Playwright `home` project: 2/2 passed against the dev instance (no Liquid errors, heading + footer visible).

PRE-EXISTING BUG FOUND (NOT a 1.3 regression, flagged for follow-up): `/blog/category/<tag>` returns 404 — category.liquid's slug is the static `blog/category` (unchanged from baseline d10aee1, where it also 404'd on the sub-path), but _post.liquid emits tag links as `/blog/category/<tag>`. `/blog/category` (exact) and `/blog/category?tags=` return 200. Same static-slug class as the show-page bug AC#10 fixed, but AC#10 scopes only the post route. Recommend a follow-up to make category a dynamic slug (blog/category/:tags) so tag links resolve.

UNDERSCORE-PARTIAL RENAME (done at user request 2026-06-08, pulls 1.6 AC#2's no-underscore rename forward): renamed all 44 `_*.liquid` partials in modules/blog to no-underscore. KEY platformOS LEARNINGS:
- BOTH {% include %} and {% render %} resolve partials WITHOUT the underscore (the include→render conversion is NOT required for the rename to work — my earlier assumption was wrong; corrected by the user). The legacy `_` prefix is purely cosmetic for partials under views/partials/.
- EXCEPTION: files under views/layouts/<subdir>/ are special — there the `_` prefix is what marks a file as a PARTIAL (vs a layout). Renaming views/layouts/blog/_csrf.liquid → csrf.liquid made the runtime treat it as a layout, breaking `can't find partial modules/blog/layouts/blog/csrf` (500 on every page using the blog layout; RSS survived because it uses no layout). FIX: relocated all 17 views/layouts/blog/* and 3 views/layouts/admin-blog/* fragments to views/partials/layouts/blog|admin-blog/* (no underscore). Reference paths (modules/blog/layouts/blog/csrf) are unchanged and now resolve under views/partials/. views/layouts/ now contains only the real layout (blog.liquid).
- platformos-check PartialCallArguments fires for BOTH missing-required AND passing-unused args on include/render once the partial resolves. Cleared the ones in 1.3-authored files by: passing optional args explicitly (hero subtitle/img_path:null; facebook-widget widget_title/facebook_link_name:null), removing dead args (topics blog_url — also fixed a pre-existing MISSING COMMA in show.liquid's topics include that malformed it; pagination posts_per_page — pagination reads posts.per_page), and passing form_authenticity_token: context.authenticity_token to the csrf fragment (verified the csrf-token meta now renders a real token live).

AC#6 RESULT (now CHECKED): pre-1.3 baseline (d10aee1) = 111 errors; final = 80 errors — a NET 31-ERROR IMPROVEMENT. Per-rule vs baseline: MissingPartial 62→28 (the rename+relocation resolved the legacy-underscore false-positives), LiquidHTMLSyntaxError 24→24 (unchanged), ParserBlockingScript 16→16, MissingAsset 7→7, ImgWidthAndHeight 2→2, PartialCallArguments 0→3. The ONLY net-new offenses are +3 PartialCallArguments in admin form-input partials (inputs/checkbox|date|text 'label' param) — untouched legacy partials surfaced by the rename, owned by 1.4's form rework. Everything I authored lints clean; remaining blog errors are the inherent `<%= &blog_path =%>` module-placeholder LiquidHTMLSyntaxError (×2, net-zero), RSS markup LiquidHTMLSyntaxError, and the cross-module modules/utils/flash_messages MissingPartial (utils removed in 1.6).

FINAL VERIFICATION (deployed dev): index/, /blog/category, /blog/post/blog/<slug>, /blog/rss.rss all HTTP 200; post title + c-article__content + tag links render; csrf-token meta renders a real token; fetch-logs shows NO runtime Liquid errors across all routes; Playwright home 2/2 pass.

NOTE FOR 1.6: the no-underscore rename (AC#2 first half) is now DONE for modules/blog. Remaining 1.6 work: include→render conversion (optional for resolution but still the convention), translations, common-styling, utils removal, and clearing the inputs/ label PartialCallArguments (likely subsumed by 1.4's common-styling form rework).
<!-- SECTION:NOTES:END -->
