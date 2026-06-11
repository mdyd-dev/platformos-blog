---
id: TASK-1.7
title: >-
  Create the consolidated `blog` module (rename dashboard_blog) + declare
  dependencies
status: To Do
assignee: []
created_date: '2026-06-03 15:30'
updated_date: '2026-06-03 19:42'
labels:
  - platformos
  - blog
  - module-config
  - consolidation
dependencies:
  - TASK-1.4
  - TASK-1.5
  - TASK-1.6
documentation:
  - >-
    https://documentation.platformos.com/developer-guide/modules/platformos-modules.md
  - 'https://github.com/Platform-OS/pos-module-core'
  - 'https://github.com/Platform-OS/pos-module-user'
  - 'https://github.com/Platform-OS/pos-module-common-styling'
parent_task_id: TASK-1
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FIRST step of the consolidation (parent task-1). Establishes the single `blog` module everything else builds on. No other subtask should start before this lands.

Work:
- Rename `modules/dashboard_blog` to `modules/blog`. Update every internal self-reference from `modules/dashboard_blog/...` to `modules/blog/...` (partials, layouts, pages, graphql includes, form references, migrations, template-values.json — there are ~60 such references; audit with a grep for `modules/dashboard_blog`).
- Install and declare module dependencies in the module manifest/config per the modules guide: pos-module-core, pos-module-user, pos-module-common-styling.
- Adopt the module directory conventions from the modules guide (public/ structure; the modern folder names are `schema/` for data definitions and `graphql/` for queries — later subtasks move content into these).
- Do NOT yet remove the `dashboard`, `signup`, or `utils` modules: the blog still references them (admin profile/`dashboard_access`, `signup/log_out`, `utils/*` form helpers). Those cross-module references remain temporarily and are cut in the authentication (1.5), authorization (1.8), and templating (1.6) subtasks, each of which removes the module it finishes depending on. Keep the app deployable in the meantime.

Scope note: this is the rename + dependency-declaration + skeleton only. Data model, queries, auth, and cleanup are separate subtasks.

Reference: modules guide (documentation link); pos-module-core/user/common-styling repos.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 modules/dashboard_blog is renamed to modules/blog and the app still deploys
- [ ] #2 All internal modules/dashboard_blog/... references are updated to modules/blog/... (verified by grep returning none)
- [ ] #3 The module manifest declares dependencies on pos-module-core, pos-module-user, and pos-module-common-styling, and they are installed
- [ ] #4 dashboard, signup, and utils modules are left in place (still referenced) and the app remains functional
- [ ] #5 platformos-check passes with 0 errors
<!-- AC:END -->
