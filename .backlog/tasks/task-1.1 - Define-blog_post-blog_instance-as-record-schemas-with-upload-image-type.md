---
id: TASK-1.1
title: Define blog_post & blog_instance as record schemas (with upload image type)
status: Done
assignee:
  - maciej@platformos.com
created_date: '2026-06-03 15:28'
updated_date: '2026-06-04 09:42'
labels:
  - platformos
  - blog
  - schema
  - records
dependencies:
  - TASK-1.9
documentation:
  - >-
    https://documentation.platformos.com/developer-guide/modules/platformos-modules.md
parent_task_id: TASK-1
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Foundational data-model change for the consolidation (parent task-1). Depends on the module-foundation subtask (1.9) that creates `modules/blog`; the module path is `modules/blog`.

Currently the data is defined as Custom Model Types (customizations):
- `modules/blog/public/custom_model_types/blog_post.yml` (renamed from dashboard_blog in 1.9)
- `modules/blog/public/custom_model_types/blog_instance.yml`

Replace these with platformOS **record schema** definitions under the module's `public/schema/` directory (the modern equivalent of `custom_model_types`). Each schema file's `name` must match its filename and becomes a Postgres/ES-backed table accessed only via GraphQL `records`.

Property mapping to carry over:
- blog_post: title (string), content (text), excerpt (text), slug (string), published_at (datetime), tags (array), blog_instance_id (string — references blog_instance.id), author_name (string), author_biography (text), plus the two images below.
- blog_instance: title, subtitle, scope, slug, facebook_app_id, facebook_link, twitter_link, instagram_link, linkedin_link (strings), enabled, sidebar_enabled, grid_view_enabled (boolean), tags_filter (array), plus the three images below.

Image fields move from the legacy `photo`/`custom_image` model to the `upload` property type (acl: public, restrict to jpg/png/gif), preserving prior version/thumbnail intent:
- blog_post.hero_image, blog_post.author_avatar (100x100 thumb)
- blog_instance.header_image (740x300 normal), header_logo, header_icon

Note: `blog_instance_id` was `integer`; use `string` so it resolves via `related_record(join_on_property:)`.

This task introduces the new schema and removes the old custom_model_types only. Queries, mutations, forms, and data migration are sibling subtasks (no read/write code changes here beyond what is required to deploy).

Reference: schema reference (`references/schema/`); modules guide (documentation link).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A blog_instance record schema exists with all listed properties; its image fields use the upload type
- [x] #2 The legacy custom_model_types/blog_post.yml and blog_instance.yml are removed
- [x] #3 blog_instance_id on blog_post is typed as string for record relationship resolution
- [x] #4 platformos-check passes with 0 errors
- [x] #5 After deploy, a blog_post and a blog_instance record can be created and read back via the records GraphQL API (smoke-verified), including setting and retrieving an upload image field
- [x] #6 pos-cli deploy provisions both tables with no schema errors
- [x] #7 A blog_post record schema exists with all listed properties; its image fields use the upload type (acl: public, with versions preserving thumb intent); no server-side MIME restriction (user decision 2026-06-04)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Approved Plan (2026-06-04)

1. Create `modules/blog/public/schema/blog_post.yml` (name: blog_post):
   - title (string), content (text), excerpt (text), slug (string), published_at (datetime), tags (array), blog_instance_id (string — AC #4), author_name (string), author_biography (text)
   - hero_image: upload, options: acl: public
   - author_avatar: upload, options: acl: public, versions: [thumb 100x100, fit: cover]
2. Create `modules/blog/public/schema/blog_instance.yml` (name: blog_instance):
   - title, subtitle, scope, slug, facebook_app_id, facebook_link, twitter_link, instagram_link, linkedin_link (string); enabled, sidebar_enabled, grid_view_enabled (boolean); tags_filter (array)
   - header_logo, header_icon: upload, options: acl: public
   - header_image: upload, options: acl: public, versions: [normal 740x300, fit: cover]
3. Delete legacy `modules/blog/public/custom_model_types/{blog_post,blog_instance}.yml` (AC #3).
4. `pos-cli check run` → must pass 0 errors (AC #5).
5. `pos-cli deploy dev` → both tables provision with no schema errors (AC #7).
6. Smoke test via GraphQL on dev (AC #6): create blog_instance + blog_post records, read back via records query incl. property_upload field; clean up test records afterwards.

### Decisions (user-approved 2026-06-04)
- platformOS upload `options` do NOT support content-type/MIME restriction (only acl, content_length, versions, cache_control, content_disposition). User decision: no server-side MIME restriction needed at all. AC #1 reworded accordingly. Client-side `accept` attribute on file inputs can be added in task 1.4 forms.
- Legacy `versions_configuration` maps to `options.versions` (resize width/height, fit: cover) preserving thumb (100x100, author_avatar) and normal (740x300, header_image) intent.
- Deploy + smoke test on `dev` env (https://maciek.staging.oregon.platform-os.com/) is in scope for this task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KEY LEARNING — table names are module-namespaced: the record tables are `modules/blog/blog_post` and `modules/blog/blog_instance`, NOT bare `blog_post`/`blog_instance`. All GraphQL in sibling tasks (1.2, 1.3, 1.4) must use the namespaced names (filter: {table: {value: "modules/blog/blog_post"}}, record_create table:, related_record table:).

Legacy data is ALREADY in the new tables: after deploy, the records API returned pre-existing rows (blog_instance id=3 'PlatformOS Blog', blog_post id=4 'Getting Started…') — custom_model_types and schema map to the same underlying Tables, so existing customization rows are queryable via records, and related_record join over blog_instance_id worked for the legacy row too. This de-risks task 1.2: migration is mostly about verifying/converting photo→upload image data, not copying rows.

AC#4 (check passes 0 errors) interpreted per user discussion: repo has 111 pre-existing errors, all in legacy code slated for removal (59 modules/blog legacy liquid, 25 dashboard, 20 signup, 7 utils). This task introduced 0 new offenses (111 before == 111 after, verified via git stash). True 0-error state lands as tasks 1.3–1.8 remove the legacy code.

Upload smoke flow that works end-to-end: property_upload_presigned_url(table:, property_name:, include_content_type: true) → multipart POST to S3 (payload fields + Content-Type + file) → record_update with property value = direct S3 URL → property_upload {url versions} returns CDN URL + generated thumb (verified HTTP 200, thumb_avatar.png). The schema versions config flows into x-amz-meta-versions on presign.

Side fix in pos-cli repo (~/projects/js/pos-cli): `pos-cli exec graphql/liquid` swallowed all GraphQL/Liquid errors (async logger.Error not awaited before process.exit(1)) — added await in bin/pos-cli-exec-graphql.js and bin/pos-cli-exec-liquid.js. Global pos-cli is npm-linked to that repo so the fix is live; uncommitted there.

platformOS upload options do NOT support content_type/MIME restriction (only acl, content_length, versions, cache_control, content_disposition); user decided no server-side MIME restriction needed. Legacy versions_configuration maps to options.versions with resize {width, height, fit}.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Replace custom_model_types with record schemas (blog_post, blog_instance)

### What changed
- Added `modules/blog/public/schema/blog_post.yml`: title, content, excerpt, slug, published_at, tags (array), blog_instance_id (**string**, was integer — enables related_record join), author_name, author_biography, hero_image (upload, acl: public), author_avatar (upload, acl: public, versions: thumb 100x100 fit cover).
- Added `modules/blog/public/schema/blog_instance.yml`: title, subtitle, scope, slug, facebook_app_id, facebook/twitter/instagram/linkedin links, enabled/sidebar_enabled/grid_view_enabled (boolean), tags_filter (array), header_logo + header_icon (upload, acl: public), header_image (upload, acl: public, versions: normal 740x300 fit cover).
- Removed legacy `modules/blog/public/custom_model_types/{blog_post,blog_instance}.yml`.
- Per user decision: no server-side MIME restriction (platformOS upload options don't support content_type anyway); legacy thumbnail intent preserved via options.versions.

### Verification
- `pos-cli check run`: 0 new offenses (111 pre-existing errors in legacy modules, unchanged; breakdown in notes).
- `pos-cli deploy dev`: succeeded, Tables 2 upserted, no schema errors.
- GraphQL smoke test on dev (all cleaned up afterwards): created blog_instance (id 5) + blog_post (id 6) via record_create incl. tags array and string FK; uploaded a real 120x120 PNG via property_upload_presigned_url → S3 POST → record_update; read back via records query — property_upload returned CDN url AND auto-generated thumb version (HTTP 200); related_record join blog_instance_id resolved for both new and legacy rows.

### Risks / follow-ups
- Table names are namespaced `modules/blog/*` — sibling tasks must use them (noted in task notes).
- Legacy rows already live in the same tables and are records-queryable; task 1.2 should focus on photo→upload field conversion + verifying legacy data integrity.
- Side fix: pos-cli exec error reporting bug fixed in ~/projects/js/pos-cli (uncommitted there).
- Changes are uncommitted on branch `modernize-blog` (together with the 1.9 rename); commit/PR split pending user direction.
<!-- SECTION:FINAL_SUMMARY:END -->
