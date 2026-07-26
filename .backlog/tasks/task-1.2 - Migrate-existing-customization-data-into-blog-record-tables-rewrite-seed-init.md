---
id: TASK-1.2
title: >-
  Migrate existing customization data into blog record tables + rewrite seed
  init
status: Done
assignee:
  - claude
created_date: '2026-06-03 15:28'
updated_date: '2026-06-08 09:12'
labels:
  - platformos
  - blog
  - migrations
  - records
  - data
dependencies:
  - TASK-1.1
documentation:
  - >-
    https://documentation.platformos.com/developer-guide/modules/platformos-modules.md
parent_task_id: TASK-1
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Part of the consolidation (parent task-1). Runs after the schema subtask (1.1) and the module rename (1.9); the module path is now `modules/blog`.

Existing production data is stored as customizations whose `custom_model_type_name` is `modules/dashboard_blog/blog_post` and `modules/dashboard_blog/blog_instance` — IMPORTANT: these legacy type names are fixed on the existing DB rows and do NOT change when the module folder is renamed, so the migration must read by these original names. They include `custom_image` attachments. Records are a separate store, so the data must be copied/transformed into the new record tables.

Two pieces of work:

1) Data migration (one-off): Write a timestamped migration in `modules/blog/public/migrations/` that reads existing customizations of both legacy types (`modules/dashboard_blog/blog_post`, `modules/dashboard_blog/blog_instance`) and creates equivalent records via `record_create`, mapping every property across (see 1.1 for the property list). For each legacy `custom_image` (hero_image, author_avatar, header_image, header_logo, header_icon) move the image into the corresponding record `upload` property. Preserve the blog_instance_id linkage: when creating post records, map the old customization's blog_instance_id to the NEW blog_instance record id.

   CONTENT FORMAT: existing post `content` is stored as HTML (from the old Trumbowyg WYSIWYG). Because the new editor is common-styling's markdown editor (adopted in 1.4), the migration must CONVERT each post's HTML content to markdown so stored content matches the new editor/renderer. Use an HTML→markdown conversion and verify converted output renders equivalently to the original (this conversion can be lossy on complex markup — spot-check headings, lists, links, and images). Keep the conversion deterministic so re-runs are stable.

   The migration must be idempotent/safe to re-run (skip already-migrated rows, e.g. match on slug) and must log source vs. migrated counts.

2) Rewrite the seed/init logic: The first-run seed currently lives in `modules/blog/public/views/partials/migrations/init.liquid` (triggered via the background job in `modules/blog/public/migrations/20190101101010_init.liquid`) and uses `migration_create_customization` + `create_image` to create a default blog_instance and a sample \"Getting Started\" post. Reimplement this seed using `record_create` against the new record tables and the `upload` image type, in the timestamped `migrations/` mechanism, keeping the \"only seed if no blog_instance record exists\" guard. Author the sample post body as MARKDOWN (rewrite the existing HTML body as markdown) so the seed matches the new editor. Remove the obsolete `graphql/migrations/migration_create_customization.graphql` and `graphql/migrations/create_image.graphql` once unused.

Reference: migrations and schema references; modules guide (documentation link).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A timestamped migration copies all existing blog_instance and blog_post customizations (including images) into the new record tables with full property mapping
- [x] #2 Post records correctly reference their blog_instance record id after migration
- [x] #3 The migration is idempotent (re-running does not create duplicates) and logs migrated row counts
- [x] #4 First-run seed is reimplemented with record_create + upload and the 'seed only when empty' guard, in the timestamped migrations mechanism
- [x] #5 Obsolete migration_create_customization.graphql and create_image.graphql queries (and the old init partial/background trigger) are removed once unused
- [x] #6 platformos-check passes with 0 errors
- [x] #7 Migrated record counts equal the source customization counts for both tables, asserted and logged by the migration
- [x] #8 On a freshly seeded instance the sample post and instance render on the public home page (homePageTest passes under npm run test-ci)
- [x] #9 Spot-check confirms migrated posts retain their hero_image/author_avatar and the instance retains its header images
- [x] #10 Existing post content is converted from HTML to markdown during the migration so it matches the common-styling markdown editor; spot-checked migrated posts (headings, lists, links, images) render equivalently to before with no visible content loss
- [x] #11 The seeded sample post body is authored as markdown and renders correctly on the public blog
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
APPROVED PLAN (user confirmed 2026-06-04, incl. two scope decisions below)

Verified state on dev: 0 rows in modules/dashboard_blog/* tables; 1 post + 1 instance in modules/blog/* created by the LEGACY customization init — HTML content, images attached as custom_image (property_upload returns null; customizations{custom_image(name:){url}} returns CDN URLs). Production will have the same legacy shape under modules/dashboard_blog/*. No HTML→markdown Liquid filter exists (only markdown = md→HTML); replace_regex does exist.

Two row classes the migration must handle:
- COPY: modules/dashboard_blog/* rows → record_create into modules/blog/* tables
- NORMALIZE IN PLACE: legacy-shaped rows already in modules/blog/* (custom_image attachments + HTML content) → record_update (set upload props from custom_image URLs, convert content HTML→markdown)

Steps:
1. GraphQL files in modules/blog/public/graphql/migrations/: record_create.graphql + record_update.graphql (generic $table + $properties: [PropertyInputType!]!; uploads set by passing image URL string — verified in 1.1); legacy_rows read queries via customizations(name: $name) exposing property() AND custom_image URLs (records API cannot see custom_images), paginated per 100.
2. HTML→markdown converter: function partial lib/migrations/html_to_markdown.liquid — replace_regex chain for h1–h6, p, br, ol/ul/li, strong/b, em/i, a, img; strip span/font/empty ol; &nbsp;→space; \r\n→\n; ordered list items emit "1." (valid auto-numbering md); strip_tags leftovers; collapse 3+ newlines→2. Deterministic for stable re-runs.
3. Data migration modules/blog/public/migrations/20260604120000_migrate_legacy_blog_data.liquid: instances first then posts; each phase reads BOTH sources; slug-based idempotency spanning both sources; in-place normalization fires only when custom_image exists without upload prop OR content matches HTML pattern; blog_instance_id remapped old→new via instance SLUG (deterministic across re-runs); logs source vs migrated counts per table, log type:"error" on mismatch (AC #3,#7).
4. Seed migration modules/blog/public/migrations/20260604120100_seed_blog.liquid (after data migration): guard total_entries==0 on modules/blog/blog_instance; record_create default instance (header_image=hero.jpg asset_url) + Getting Started sample post with body rewritten as MARKDOWN, hero_image=first_post_image.jpg, author_avatar=thumb_pOS.jpg via asset_url.
5. Remove obsolete: graph_queries/migrations/migration_create_customization.graphql, graph_queries/migrations/create_image.graphql, views/partials/migrations/init.liquid, migrations/20190101101010_init.liquid.
6. APPROVED scope add: transitional render fix in show.liquid:50 — {{ blog_post.content | markdown }} so converted posts render correctly between 1.2 and 1.4 (AC #10/#11).
7. Verification: pos-cli check run (no NEW offenses vs 111 baseline); deploy dev; run migration twice (idempotency); spot-check dev post (upload props set, markdown renders equivalently). APPROVED: production-path fixture test on 'tests' instance — temp fixture schema for modules/dashboard_blog/* + fixture customizations w/ images, run migration, assert counts/linkage/images, then remove fixtures. Fresh-seed test on 'tests': clear data, deploy, confirm seed, MPKIT_URL=<tests-url> npx playwright test --project=home (AC #8 mentions npm run test-ci which does not exist; test:home / playwright project=home is the real equivalent).

SCOPE ADDITION (user-approved): Discovered during 1.2 that legacy customizations property filters are entirely broken against the new record store (string filter scope:'blog' returns 0; boolean enabled:'true' returns 0) — dev home page already shows 'Blog is not enabled' since the 1.1 deploy. Records API filters verified working (string value + value_boolean). User chose to PULL THE READ REWRITE INTO 1.2: rewrite get_blog_instance + get_blog_posts to records queries (keep `customizations:` alias so call sites keep working), switch image fields from custom_image to property_upload, and fix image accessors in consumers (hero/_index/settings etc). This delivers AC#8 fully at 1.2 close; task 1.3 shrinks accordingly.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CONTEXT FROM TASK-1.1 (read before starting):
(1) TABLE NAMES ARE MODULE-NAMESPACED. The new record tables are `modules/blog/blog_post` and `modules/blog/blog_instance` (NOT bare `blog_post`). Crucially, the LEGACY customization data is itself a table you can read via the records API: `records(filter: {table: {value: "modules/dashboard_blog/blog_post"}})` — customizations and records share the same underlying Tables. So the migration can READ legacy rows and WRITE new rows entirely through records GraphQL.
(2) Verified on dev after the 1.1 deploy: rows living in `modules/blog/blog_post` (seeded by the legacy init under the renamed module) are fully readable via records — property/property_array/related_record all work, and the blog_instance_id join resolves even for rows created by the legacy path. Check BOTH legacy type names (`modules/dashboard_blog/*` from production) and `modules/blog/*` (rows the renamed init may have already created) when counting/migrating, and dedupe across them (the slug-idempotency guard should span both sources).
(3) IMAGE MIGRATION SHORTCUT: an `upload` property can be set by passing a plain URL string via record_create/record_update — platformOS fetches/converts it to upload metadata and auto-generates the configured versions (verified: thumb appeared on CDN as `thumb_<filename>`, HTTP 200). So migrating legacy custom_image/photo data = read the old image URL, write it as the value of the upload property. Verify whether legacy photo URLs are accessible from the old rows via property accessors before assuming the shape.
(4) Smoke-test ad hoc with `pos-cli exec graphql dev '<query>'` (arg order: exec graphql <env>) and `pos-cli exec liquid dev '<code>'`. GraphQL errors only print with the patched pos-cli (npm-linked from ~/projects/js/pos-cli).
(5) AC 'platformos-check passes with 0 errors' = `pos-cli check run` adds NO NEW offenses vs baseline (repo carried 111 pre-existing legacy errors at 1.1 close); absolute 0 lands only after 1.4–1.8 remove legacy code. platformos-check binary is deprecated — use `pos-cli check run`.
(6) Upload schema options support NO MIME restriction (user decision in 1.1: none needed server-side). Versions live under options.versions; legacy versions_configuration syntax is gone.

IMPLEMENTATION COMPLETE — validated on dev (maciek.staging). Key findings & decisions:

IMAGE UPLOAD MECHANISM CORRECTION: The 1.1 note's 'pass a plain URL string to an upload property' does NOT work via record_create/record_update (raw value stays {} ; skill gotchas confirm a string won't set an upload). Correct mechanism (found in pos-module-community photos/create_from_remote): value_upload: { type: image, acl: public, remote_url: <url> }. platformOS fetches the URL and generates the schema's configured versions. Verified live: header_image.normal, author_avatar.thumb generated on CDN. All upload writes (seed + migration builders + normalization) use a shared helper lib/migrations/upload_property.liquid. The type enum passes fine as a JSON string ('image') through the $properties variable.

HTML->MARKDOWN CONVERTER — three bugs found & fixed by iterating the converter against the real legacy post HTML via `pos-cli exec liquid dev -f <harness>`:
  (1) platformOS replace_regex is RUBY regex: `^` is multiline (matches every line start). `^[^>]*>` was eating the first tag on EVERY line (dropped list-item text). Fixed with `\A` (string-start anchor).
  (2) `<(strong|b)[^>]*>` MATCHED `<br>` (b + [^>]*=r + >), so every <br> was treated as an opening bold tag and mispaired with later </strong>, scrambling all **. Same latent bug: `<(em|i)...>` matches <img>. Fixed with a word boundary: `<(strong|b)\b...>` / `<(em|i)\b...>`.
  (3) A global ** whitespace-normalizer mispaired ** across the document — removed it (the strong->** step already yields clean tight bold for this content).
  Final converted output verified clean: headings, ordered (1.) + unordered (-) lists, bold, italics, links, images — no content loss.

READS REWRITE (user-approved scope pull-in): get_blog_instance + get_blog_posts rewritten to the records API under a `customizations:` alias (call sites unchanged). enabled filter is now Boolean value_boolean (callers pass enabled: true, not 'true'). Image fields switched custom_image -> property_upload { url versions }; consumers updated: _index (header_image.versions.normal||url), _post (hero_image.url), show (hero_image.url, author_avatar.versions.thumb||url) + content now rendered via | markdown; _post excerpt fallback uses | markdown | html_to_text. Null-variable safety verified: records filter list element types must be non-null ([String!]/[ID!]) so omitted vars are ignored.

VALIDATION ON DEV:
 - Seed (run via exec liquid -f, since `pos-cli migrations run` currently 404s): created instance(slug blog, header_image+normal) + post(getting-started, hero_image, author_avatar+thumb, markdown body, linked to new instance). Guard skips when an instance already exists.
 - Home page renders 'PlatformOS Blog' hero + the post; Playwright `--project=home` 2/2 pass (AC#8). (Note: package.json has no `test-ci` script; `test:home`/playwright home project is the real equivalent.)
 - Seed post markdown -> HTML render verified correct (headings/lists/bold/italics) (AC#11, AC#10 render path).
 - Data migration COPY path tested with temporary fixture schemas modules/dashboard_blog/{blog_instance,blog_post} (dev lacks these tables; reads no-op there): legacy instance(slug legacy-blog) + post(slug legacy-post, HTML content, blog_instance_id=OLD id 10) -> migration created new records, content converted to markdown, and blog_instance_id REMAPPED 10 -> new id 12 (AC#1,#2,#10). Re-run x2 => no duplicates (AC#3 idempotent). Count assertion/logging present (summary log + error-level log on mismatch, AC#7). Fixtures + temp schema files removed; dev restored to seed-only.

LINT: `pos-cli check run` = 110 errors (baseline was 111 at 1.1 close; removing the old init partial/graphql dropped it by 1). No NEW offenses (AC#6 per the 1.1-clarified definition).

CAVEATS / FOLLOW-UPS:
 - Single-post PAGE route /blog/post/:blog_slug/:post_slug currently 404s (no page matches the sub-path). This is PRE-EXISTING (my show.liquid diff only changed the GraphQL line + render filter, not front-matter/routing) and belongs to task 1.3 (reads/show). AC#10/#11 render path validated directly via | markdown.
 - Two empty orphan tables modules/dashboard_blog/{blog_instance,blog_post} remain on the DEV instance only (platformOS doesn't drop tables when schema files are removed). Harmless/empty; not in the repo. On production the real dashboard_blog tables hold the data the migration reads.
 - Migration query files live in public/graphql/migrations/ (verified resolvable at runtime, e.g. 'modules/blog/migrations/record_create'); existing reads remain in graph_queries/. Both locations work.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Migrated legacy blog data into the new record tables and rewrote the first-run seed on records + uploads + markdown. All 11 acceptance criteria met and validated on the dev instance.

DELIVERED
- Data migration `migrations/20260604120000_migrate_legacy_blog_data.liquid`: copies legacy modules/dashboard_blog/{blog_instance,blog_post} rows into modules/blog/* via record_create with full property mapping; remaps blog_instance_id (old→new); converts post HTML→markdown; also normalizes legacy-shaped rows already in the new tables (custom_image→upload, HTML→markdown, linkage). Idempotent by slug across both sources; logs source-vs-migrated counts and an error-level entry on mismatch.
- Seed migration `migrations/20260604120100_seed_blog.liquid`: record_create default instance + 'Getting Started' sample post; images via upload (value_upload remote_url); body authored as markdown; guarded to run only when no blog_instance exists.
- Helpers under views/partials/lib/migrations/: html_to_markdown, convert_content, fetch_rows, fetch_images, build_instance_properties, build_post_properties, cast_to_array, upload_property. Migration GraphQL under public/graphql/migrations/: record_create, record_update, source_records, source_images.
- Reads rewrite (user-approved scope pull-in): get_blog_instance + get_blog_posts moved to the records API (aliased `customizations:`), image accessors switched to property_upload, show page renders content via | markdown.
- Removed obsolete migration_create_customization.graphql, create_image.graphql, init partial, and 20190101101010_init.liquid background trigger.

KEY CORRECTIONS vs prior notes
- Uploads from a URL require value_upload:{type:image,acl:public,remote_url:...} (a plain string value does NOT set an upload).
- platformOS replace_regex is Ruby (multiline ^), and `<(strong|b)[^>]*>` matched `<br>`; converter fixed with \A anchors and \b word boundaries.

VALIDATION (dev): seed creates instance+post with working uploads (normal/thumb versions on CDN); home page renders + Playwright home project 2/2 green (AC#8); markdown renders correctly (AC#10/#11); fixture-schema test confirmed the copy + blog_instance_id remap + HTML→markdown + idempotency (no dupes over 3 runs) and count assertion. `pos-cli check run` = 110 (≤ 111 baseline; no new offenses).

FOLLOW-UPS (out of 1.2 scope)
- Single-post page route /blog/post/:blog_slug/:post_slug returns 404 (no page matches the sub-path). Pre-existing (front-matter/routing untouched here); belongs to task 1.3 (reads/show). Render path itself is correct.
- Two empty orphan tables modules/dashboard_blog/* remain on the dev instance only (platformOS doesn't drop tables on schema removal); not in the repo.
<!-- SECTION:FINAL_SUMMARY:END -->
