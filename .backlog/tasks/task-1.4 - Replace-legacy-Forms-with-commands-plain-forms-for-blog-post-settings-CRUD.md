---
id: TASK-1.4
title: Replace legacy Forms with commands + plain forms for blog post/settings CRUD
status: Done
assignee:
  - claude
created_date: '2026-06-03 15:29'
updated_date: '2026-07-20 14:02'
labels:
  - platformos
  - blog
  - commands
  - forms
  - records
dependencies:
  - TASK-1.1
documentation:
  - >-
    https://documentation.platformos.com/developer-guide/modules/platformos-modules.md
parent_task_id: TASK-1
priority: high
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Part of the consolidation (parent task-1). Runs after the schema subtask (1.1); the module path is `modules/blog`.

The module currently performs all create/update/delete through legacy `form_configurations/*.liquid` Forms bound to customizations:
- `form_configurations/blog_post.liquid` (create/update a post; custom_images hero_image/author_avatar; default_payload computes blog_instance_id/slug/tags)
- `form_configurations/blog_post_delete.liquid` (delete a post)
- `form_configurations/blog_settings.liquid` (update blog_instance settings)
- `form_configurations/custom_image_form.liquid` (image upload)

Replace these with the modern approach:
- Encapsulate each write as a command following build → check → execute under `modules/blog/public/lib/commands/` (blog_post create/update/delete, blog_instance update). Validation lives in `check` and returns errors (not thrown). Persistence uses `record_create` / `record_update` / `record_delete` against the new record tables.
- Render the editing UI with a plain `<form>` including the CSRF authenticity token (no `{% form %}` / form_configuration). Pages: `views/pages/dashboard/posts/new.liquid`, `posts/edit.liquid`, `dashboard/blog/settings.liquid`; the POST/PUT/DELETE handler pages call the commands and re-render with validation errors on failure.
- Build the form with pos-module-common-styling components (the dependency declared in 1.9): use its MARKDOWN EDITOR component for the `content` field, REPLACING the vendored Trumbowyg WYSIWYG (the `data-wysiwyg=\"content\"` hook / `.trumbowyg-editor`); and use its IMAGE-UPLOAD component for hero_image/author_avatar bound to the record `upload` properties, DEPRECATING the legacy `custom_image` upload widget and `custom_image_form`. Confirm the content storage format the markdown editor expects and render accordingly on the public side (coordinate with 1.3).
- Preserve behavior: title/content/slug/excerpt/blog_instance_id/author_name required; slug auto-derived from title; tags handling; \"Publish Now\" toggle setting published_at; hero_image/author_avatar (post) and header images (instance) via the `upload` type (jpg/png/gif); flash messages; redirect to /dashboard/blog after save.

TEST IMPACT: switching from `{% form %}`/customizations to plain forms + common-styling changes field `name`/`id` attributes — the old e2e selectors `#form-properties-attributes-*`, `#form-custom-images-attributes-*-attributes-image`, `.trumbowyg-editor`, and `.simple_form` will no longer exist. The postsAdminPage and settingsPage page objects MUST be updated to the new common-styling selectors (see acceptance criteria).

Remove the blog `form_configurations/*.liquid` files once unused. Generic include/render and CSS cleanup happen in 1.6, but the markdown-editor and upload components are introduced here.

Reference: commands, forms, schema, and modules/common-styling references; modules guide (documentation link).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Blog post create, update, and delete are implemented as commands (build → check → execute) writing to the blog_post record table via record_create/update/delete
- [x] #2 Blog instance settings update is implemented as a command writing to the blog_instance record table
- [x] #3 Editing UI uses plain <form> with CSRF token (no {% form %}/form_configuration), and handler pages invoke the commands and surface validation errors
- [x] #4 Existing behavior is preserved: required fields, slug from title, tags, Publish Now toggle, image uploads via upload type, flash messages, redirect to /dashboard/blog
- [x] #5 All form_configurations/*.liquid files for the blog are removed once unused
- [x] #6 platformos-check passes with 0 errors
- [x] #7 pos-module-tests unit tests cover each command's check stage (rejecting missing required fields) and execute stage (record persisted), including the slug-from-title and Publish-Now behaviors
- [x] #8 postsAdminPage and settingsPage e2e page objects are updated to the new plain-form selectors, and addPostTest + settingsTest pass under npm run test-ci
- [x] #9 A post can be created, edited, and deleted, and blog settings updated, end-to-end against records (verified via e2e)
- [x] #10 The content field uses pos-module-common-styling's markdown editor (the Trumbowyg WYSIWYG hook/asset is no longer used in the post form); hero_image and author_avatar use common-styling's image-upload component bound to the record upload properties (legacy custom_image widget removed)
- [x] #11 postsAdminPage and settingsPage e2e page objects target the new common-styling selectors and the related TestCafe tests pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implementation plan (patterns confirmed against modules/user + modules/community references):

MUTATIONS (public/graphql/, dynamic $properties array like migration helpers — needed for conditional upload props):
- blog_posts/create.graphql, update.graphql ($id), delete.graphql; blog_instances/update.graphql
- blog_posts/presign.graphql + blog_instances/presign.graphql (property_upload_presigned_url -> upload_url, upload_url_payload)

QUERY OBJECTS (public/lib/queries/):
- blog_posts/find.liquid (by id, wraps search.graphql)
- update blog_instances/find.liquid to read .records (drop customizations alias)

COMMANDS (public/lib/commands/ -> 'modules/blog/commands/...'; build->check->execute via modules/core/commands/execute):
- blog_posts/build.liquid (slug=slugify(title); tags via cast_to_array; published_at via Publish-Now toggle; hero_image/author_avatar from upload component added[0]/current[0] -> value_upload remote_url; resolve blog_instance_id), blog_posts/check.liquid (presence: title/content/slug/excerpt/blog_instance_id/author_name), create.liquid, update.liquid, delete.liquid
- blog_instances/build.liquid (booleans enabled/sidebar/grid; tags_filter array; header_image upload), check.liquid (title/slug/scope), update.liquid

FORMS (plain <form> + authenticity_token; common-styling markdown + upload components):
- partials blog/admin/post_form.liquid, settings_form.liquid, form_assets.liquid (renders modules/common-styling/init in head_content)
- pages: dashboard/posts/new(get), edit(get), create(slug dashboard/posts post), update(slug dashboard/posts/:id put), delete(slug dashboard/posts/:id delete); dashboard/blog/settings(get) + settings update handler (put). _method hidden field for put/delete.
- update dashboard/blog.liquid delete button to plain form

CLEANUP: remove form_configurations/{blog_post,blog_post_delete,blog_settings,custom_image_form}.liquid; drop customizations alias in blog_instances/find.graphql.

TESTS: pos-module-tests _test partials for build/check (+create/delete integration); Playwright posts.spec.ts + admin/settings spec with page objects (data-tc selectors) — repo migrated TestCafe->Playwright.

VERIFY: pos-cli deploy dev; pos-cli check run (baseline 80, expect drop); pos-cli exec graphql smoke; e2e against tests env.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CONTEXT FROM TASK-1.1 (read before starting):
(1) Table names are module-namespaced: all command mutations must target `modules/blog/blog_post` / `modules/blog/blog_instance` (record_create/update/delete `table:` arg and any records reads). Bare names fail with 'Could not find Table'.
(2) MIME restriction decision: the description says uploads 'via the upload type (jpg/png/gif)' — platformOS upload schema options support NO content-type restriction, and the user decided (2026-06-04, task 1.1) that NO server-side MIME validation is needed at all. Do not add MIME checks to the command check stage; an `accept="image/*"` attribute on the file input is sufficient if desired.
(3) Upload write flow verified end-to-end in 1.1: `property_upload_presigned_url(table: "modules/blog/blog_post", property_name: "author_avatar", include_content_type: true)` → multipart POST to the returned S3 URL (all payload fields + Content-Type + file) → store the direct S3 URL as the property value via record_update (platform converts it to upload metadata and auto-generates versions; thumb served as `thumb_<filename>` on CDN). Check whether common-styling's upload component wraps this flow before hand-rolling it — either way the presign `table:` arg needs the namespaced name.
(4) Read uploads back with `property_upload(name:) { url versions }` — NOT via the plain `properties` blob (url is generated on the fly only inside property_upload).
(5) Smoke-test with `pos-cli exec graphql dev '<query>'` (arg order: exec graphql <env>); errors only visible with patched pos-cli (npm-linked ~/projects/js/pos-cli). AC 'platformos-check 0 errors' = `pos-cli check run` adds no NEW offenses vs baseline (111 pre-existing legacy errors at 1.1 close); this task removing form_configurations should DROP the count — record before/after numbers. platformos-check binary is deprecated — use `pos-cli check run`.

LEARNINGS FROM TASK-1.2 (2026-06-08):
- CORRECTION to note (3)/(4) and the description's image flow: a plain URL string does NOT set an upload property (raw value stays `{}`). There are two real mechanisms: (a) SERVER-SIDE from a URL — `value_upload: { type: image, acl: public, remote_url: <url> }` in the record_create/update properties (used by 1.2's migration/seed; platform fetches + generates versions; the `type` enum image/pdf/plain passes fine as a JSON string through a `$properties:[PropertyInputType!]!` variable); (b) BROWSER upload — the presign + multipart-POST flow in note (3), which is exactly what common-styling's image-upload component wraps. Use the common-styling component for the form; don't hand-roll the presign.
- `form_configurations/custom_image_form.liquid` is now effectively OBSOLETE — uploads no longer need a CustomImage form; bind hero_image/author_avatar straight to the record `upload` properties. Remove it with the other form_configurations (AC#5).
- CONTENT IS ALREADY MARKDOWN end-to-end on the read side: migration + seed store markdown, and show.liquid already renders it with `| markdown` (1.2). So this task's content work is WRITE-side only: adopt common-styling's markdown EDITOR for the `content` field (replacing the Trumbowyg `data-wysiwyg="content"` hook) and ensure what it SAVES stays markdown. No HTML<->markdown conversion at write time.
- Reads are already on records (1.2): after a command writes a record, the existing get_blog_* queries read it back unchanged — no read-query work here. The seed sample post (id varies) is a good fixture to edit/verify against.
- `pos-cli migrations run <ts> <env>` currently 404s; migrations run on `pos-cli deploy`, or run a file directly via `pos-cli exec liquid dev -f <file>` for ad-hoc testing (relevant if this task adds a migration). For GraphQL with variables, `pos-cli exec graphql dev '<q>' --params '<json>'` now works.
- baseline: platformos-check is 110 after 1.2 (was 111). Removing form_configurations + the Trumbowyg form hook here should drop the count — record before/after.

NAMING/LAYOUT (see parent task-1 'NAMING CONVENTIONS' note, 2026-06-08): write mutations live under public/graphql/{resource}/{action}.graphql — blog_posts/create, blog_posts/update, blog_posts/delete, blog_instances/update. Commands under public/views/partials/lib/commands/{resource}/{action}.liquid — same resource/action names — using build->check->execute. Reads reuse 1.3's lib/queries/{blog_posts/search,blog_instances/find} objects. ALIAS CLEANUP INHERITED FROM 1.3: 1.3 keeps a `customizations:` alias on graphql/blog_instances/find.graphql so the legacy form_configurations/blog_post.liquid keeps working; when you remove that form_configuration here, drop the alias from blog_instances/find.graphql (root field becomes `records`), update lib/queries/blog_instances/find.liquid to read .records, and have the new code read the instance via {% function blog = 'modules/blog/lib/queries/blog_instances/find', scope: 'blog' %}. New partials: render + no underscore prefix.

FROM 1.3 (2026-06-09; see parent 'OPERATIONAL LEARNINGS' note):
- Commands go at public/lib/commands/{resource}/{action}.liquid -> referenced 'modules/blog/commands/{resource}/{action}' (public/lib/ root, NOT views/partials/lib).
- REUSE the existing read query objects in the form/handler pages: 'modules/blog/queries/blog_instances/find' (params: scope, slug, enabled) and 'modules/blog/queries/blog_posts/search' (params: per_page, page, blog_instance_id, tags, slug, published_at_lte/_lt/_gt, except_ids). {% function %} requires ALL params passed — use `null` for unused.
- Plain <form> CSRF token = context.authenticity_token (verified live).
- {% doc %} @param types: string/object/number/boolean only (no 'array').
- ALIAS CLEANUP (inherited from 1.3): when you remove form_configurations/blog_post.liquid, drop the `customizations:` alias from graphql/blog_instances/find.graphql (root becomes `records`) and update lib/queries/blog_instances/find.liquid to read `.records`. form_configurations/blog_post.liquid currently reads the instance via {% graphql bi = 'modules/blog/blog_instances/find' %} + bi.customizations.results.first.
- AC#6 baseline is now 80 errors (removing form_configurations should drop the count). Debug runtime with `pos-cli fetch-logs dev -q`.

FINALIZATION VERIFICATION (2026-07-20, performed together with the 1.5/1.6 migration close-out):
- Implementation was already in the tree from earlier sessions; this pass verified every AC and supplied the missing test evidence.
- AC#1/#2: commands at public/lib/commands/blog_posts/{build,check,create,update,delete} and blog_instances/{build,check,update}; mutations blog_posts/{create,update,delete}.graphql + blog_instances/update.graphql all use record_create/record_update/record_delete against the namespaced tables.
- Inherited alias cleanup CONFIRMED DONE: graphql/blog_instances/find.graphql root is `records:` (no customizations alias); lib/queries/blog_instances/find.liquid reads .records.
- AC#5: zero form_configurations exist repo-wide (blog's removed by this task earlier; signup's and dashboard's removed by 1.5/1.6 on 2026-07-20).
- AC#6: pos-cli check run = 0 errors repo-wide (see 1.5/1.6 notes for the 8 pre-existing warnings).
- AC#7: blog_posts_test + blog_instances_test pass on the tests instance via /_tests/run (runner reports total_assertions:0 for all suites — known quirk; failures would show as total_errors).
- AC#8/#9/#11: FIRST REAL RUN of posts.spec.ts + admin.spec.ts happened 2026-07-20 (they previously skipped without E2E_TEST_PASSWORD; credentials were provisioned by 1.5). Both pass: create/edit/delete post end-to-end, validation errors, settings subtitle persistence + title validation. One latent bug surfaced and fixed: tests/pages/components/form.ts checkbox handling now falls back to clicking the wrapping <label> because the styled `.switch` label covers the input (Publish Now toggle). Suite is Playwright (npm test), not TestCafe — the named page objects exist as tests/pages/postsAdmin.ts + settings.ts with data-tc selectors.
- AC#10: post form uses modules/common-styling/forms/markdown for content and forms/upload for hero_image/author_avatar (settings uses it for header_image); every Trumbowyg/custom_image remnant was purged in 1.6.
- Form labels/placeholders/submit labels were moved to translations/en/admin.yml during 1.6's i18n sweep (post_form, settings_form, screens pass t-translated submit_label).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Blog post and settings CRUD run on commands + plain forms against records; all legacy Forms are gone.

**What changed (implemented across earlier sessions; verified and closed 2026-07-20)**
- Write path: `record_create/update/delete` mutations under `public/graphql/{blog_posts,blog_instances}/`, wrapped in build → check → execute commands under `public/lib/commands/` (slug-from-title, tags array casting, Publish Now → published_at, upload properties via value_upload/presign).
- UI: plain `<form>` + CSRF pages under `views/pages/dashboard/` (new/create/edit/update/delete, settings/settings_update) rendering `blog/admin/post_form` + `settings_form` partials with common-styling markdown editor (content) and image-upload components (hero_image, author_avatar, header_image); validation errors re-render via common-styling error components; flash + redirect to /dashboard/blog preserved.
- All blog `form_configurations` removed; the `customizations:` alias inherited from 1.3 dropped (`blog_instances/find` reads `records`).
- Labels/placeholders/submit labels externalized to `translations/en/admin.yml` (done in the 1.6 i18n sweep).

**Tests**
- Unit: `blog_posts_test` + `blog_instances_test` pass on-instance (check rejections, slug/Publish-Now/tags behavior, persisted create + cleanup).
- E2E (Playwright): first full run with admin credentials (provisioned in 1.5) — posts CRUD end-to-end, posts validation errors, settings persistence and validation all pass. Fixed the styled-switch checkbox interaction in the shared form component.
- `pos-cli check run`: 0 errors repo-wide.

**Follow-ups**
- Admin screens still render inside the dashboard-module bootstrap layout — replaced in task 1.8.
<!-- SECTION:FINAL_SUMMARY:END -->
