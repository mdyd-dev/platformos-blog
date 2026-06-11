---
id: TASK-1.6
title: >-
  Templating & styling cleanup; replace utils helpers with common-styling;
  remove utils module
status: To Do
assignee: []
created_date: '2026-06-03 15:30'
updated_date: '2026-06-09 08:38'
labels:
  - platformos
  - blog
  - liquid
  - styling
  - i18n
  - docs
  - consolidation
dependencies:
  - TASK-1.3
  - TASK-1.4
  - TASK-1.5
  - TASK-1.8
documentation:
  - >-
    https://documentation.platformos.com/developer-guide/modules/platformos-modules.md
  - 'https://github.com/Platform-OS/pos-module-common-styling'
parent_task_id: TASK-1
priority: medium
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Final polish pass of the consolidation (parent task-1). Best done after data, reads, writes, and auth subtasks so it touches stable templates. Removes the last legacy module (`utils`) and carries the initiative's documentation update.

The `utils` module provides form-input/flash/pagination partials used by the blog and the old forms (`modules/utils/init`, `flash_messages`, `input`, `fields/*`, `helpers/pagination`, `tags/*`). Replace these with pos-module-common-styling components (and pos-module-core helpers where appropriate), then remove the `utils` module entirely.

Work:
- Replace all `{% include 'modules/utils/...' %}` usages with common-styling components / blog-local partials; remove the `utils` module once unreferenced.
- Replace `{% include '...' %}` with `{% render '...' %}` throughout the `blog` module and remove the underscore prefix from partial filenames so `render 'blog/post'` resolves to `.../partials/blog/post.liquid`. Update every call site (partials under `views/partials/blog/`, `blog/admin/`, `blog/inputs/`, `layout/`, plus layouts).
- Move hardcoded user-facing strings into translations (`translations/` YAML) rendered via the `t` filter: public blog UI, dashboard/admin labels, flash messages, button text, auth-page text.
- Adopt pos-module-common-styling for layout/components: replace the bundled Bootstrap-like grid/util classes (`col-lg-8`, `switch`, the `assets/blog/stylesheets/{platformos,nearme}` bundles, and the old `modules/dashboard/stylesheets/bootstrap`) with `pos-*` component classes. Remove now-unused vendored CSS/JS assets — in particular the Trumbowyg WYSIWYG bundle (`wysiwyg.b90.js`, `trumbowyg-icons.svg`, any `data-wysiwyg` hooks) and the legacy custom_image upload assets, which are superseded by common-styling's markdown editor and image-upload components adopted in 1.4. If a full visual reskin is too large for one PR, deliver render/naming/translations + utils removal here and split the common-styling visual adoption into a tracked follow-up subtask under task-1.
- Update the module README to document the consolidated architecture (single `blog` module, records, pos-module-user auth + `blog.manage`, commands, common-styling components, dependencies) and remove obsolete pos-utils/WYSIWYG/dashboard/signup notes (including the WYSIWYG asset troubleshooting note).

Keep behavior and layout equivalent unless the common-styling migration intentionally restyles. Run `platformos-check` after changes.

Reference: partials, layouts, translations, and modules/common-styling references; modules guide (documentation link).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All modules/utils/* usages are replaced (common-styling / blog-local partials) and the utils module is removed
- [ ] #2 All partials are invoked with render (no include) and partial filenames have no underscore prefix; all call sites updated
- [ ] #3 User-facing strings are in translations YAML and rendered via the t filter (no hardcoded UI text in partials)
- [ ] #4 The module uses pos-module-common-styling pos-* classes; bootstrap/nearme/platformos vendored bundles are removed (or visual adoption split into a tracked follow-up subtask)
- [ ] #5 README documents the consolidated architecture and drops obsolete pos-utils/dashboard/signup notes
- [ ] #6 platformos-check passes with 0 errors
- [ ] #7 The full TestCafe e2e suite (npm run test-ci) passes after the templating/styling changes; every page-object selector affected by changed markup or CSS classes is updated
- [ ] #8 No remaining {% include %} or modules/utils/ reference exists in the module (verified by grep)
- [ ] #9 The vendored Trumbowyg WYSIWYG assets (wysiwyg.b90.js, trumbowyg-icons.svg, data-wysiwyg hooks) and legacy custom_image upload assets are removed; no references to them remain (verified by grep)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CONTEXT FROM TASK-1.1 (read before starting):
(1) platformos-check binary is deprecated — use `pos-cli check run`. This is the FINAL legacy-removal task: after it (and 1.4/1.5/1.8) the 'passes with 0 errors' AC should hold ABSOLUTELY (no interpretation needed). Baseline at 1.1 close: 111 errors total — 59 legacy liquid in modules/blog, 25 dashboard (removed in 1.8), 20 signup (removed in 1.5), 7 utils (removed here). If errors remain after this task, they are real regressions to fix, not legacy noise.
(2) Useful error-count-per-module one-liner: pos-cli check run 2>&1 | awk '/^(modules|app)\//{file=$0} /^✖/{split(file,a,"/"); print a[1]"/"a[2]}' | sort | uniq -c | sort -rn
(3) Records GraphQL table names are module-namespaced (`modules/blog/blog_post` etc.) if any template-side query is touched. Smoke-test with `pos-cli exec liquid dev '<code>'` (arg order: exec liquid <env>).
(4) Deploy with `pos-cli deploy dev`; app/config.yml modules_that_allow_delete_on_deploy lists utils, so deleted module files are removed from the instance on deploy.

LEARNINGS FROM TASK-1.2 (2026-06-08):
- baseline: platformos-check is 110 after 1.2 (the absolute-0 target still applies once 1.4/1.5/1.8 + this task remove all legacy code; this is the final legacy-removal task).
- The markdown RENDER path already exists: show.liquid renders content via `| markdown`, and _post renders its excerpt fallback via `| markdown | html_to_text` (added in 1.2). So Trumbowyg is no longer used for rendering; removing its assets (wysiwyg.b90.js, trumbowyg-icons.svg, data-wysiwyg hooks) here is still required, and adopting the markdown EDITOR is 1.4.
- If any cleanup touches Liquid regex (e.g. string munging): platformOS `replace_regex` is RUBY regex — `^`/`$` are MULTILINE (use `\A`/`\z` for string anchors), and a class like `<(strong|b)[^>]*>` will also match `<br>` (add `\b` after the tag name). Lesson from 1.2's HTML→markdown converter.
- 1.2 added helper partials under `views/partials/lib/migrations/` (no underscore prefix, invoked via `function`/`graphql`) and migration GraphQL under `public/graphql/migrations/` — these already follow the render/no-underscore + graphql-location conventions this task enforces, so they don't need rework. NOTE: the READ queries still live in `public/graph_queries/` (1.3 may consolidate them into `public/graphql/`); align with whatever 1.3 lands.

NAMING/LAYOUT (see parent task-1 'NAMING CONVENTIONS' note, 2026-06-08): this is the task that completes AC#2's render/no-underscore migration for the presentation partials earlier subtasks left _-prefixed (e.g. blog/_index, blog/_post, blog/_posts-section, blog/_siblings-nav, layout/header) — rename to non-underscore and switch every include->render call site. Also confirm all GraphQL sits under graphql/{resource}/{action} (1.3 consolidated the read queries out of graph_queries/; get_blog_user is removed by 1.8) — fix any stray legacy-located query found. lib/queries & lib/commands already follow {resource}/{action}; leave them.

UPDATE FROM 1.3 (2026-06-09): the no-underscore partial rename (AC#2, first half) is ALREADY DONE for modules/blog — all 44 `_*.liquid` partials renamed to no-underscore at the user's request during 1.3. LEARNINGS that change this task's remaining work:
- BOTH {% include %} and {% render %} resolve partials WITHOUT the underscore. So the include→render conversion (AC#2 second half) is NOT required for correctness/resolution — it's now purely a convention/lint-warning cleanup (DeprecatedTag on `include`). Reprioritise accordingly.
- Layout FRAGMENTS were relocated from views/layouts/<subdir>/ to views/partials/layouts/<subdir>/ (no underscore), because under views/layouts/ the `_` prefix is what distinguishes a partial from a layout — renaming them in place breaks runtime ('can't find partial'). views/layouts/ now holds only the real layout (blog.liquid). Keep that structure.
- Remaining for 1.6: include→render sweep (convention only), translations, common-styling adoption, utils removal. NOTE the 3 leftover PartialCallArguments on inputs/checkbox|date|text ('label' param) — these admin form-input partials are likely replaced by 1.4's common-styling form rework; if 1.4 leaves them, clear them here by passing `label` (or making it optional).

FROM 1.3 (2026-06-09; baseline + structure update; see parent 'OPERATIONAL LEARNINGS' note):
- platformos-check baseline after 1.3 = 80 errors (was 110). Inherent false-positives that remain until addressed here: the `<%= &blog_path =%>` module-placeholder LiquidHTMLSyntaxError in pages/blog/index.liquid + category.liquid (×2 — the linter can't parse the module template var; harmless), the RSS <channel>/<link> markup LiquidHTMLSyntaxError in pages/blog/rss.liquid, and the cross-module modules/utils/flash_messages MissingPartial in views/layouts/blog.liquid (clears when utils is removed here).
- Layout fragments are now at views/partials/layouts/blog/* and views/partials/layouts/admin-blog/* (no underscore); views/layouts/ holds only blog.liquid. The blog.liquid layout uses {% include %} for them; converting to {% render %} is convention-only (both resolve no-underscore).
- 3 leftover PartialCallArguments on views/partials/blog/inputs/checkbox|date|text.liquid ('label' param) — if 1.4's common-styling form rework doesn't replace these, clear them by passing `label` (or making it optional via default).
<!-- SECTION:NOTES:END -->
