---
id: TASK-1.5
title: >-
  Rebuild authentication on pos-module-user (full public auth); remove signup
  module
status: To Do
assignee: []
created_date: '2026-06-03 15:29'
updated_date: '2026-06-09 08:38'
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
- [ ] #1 Sign-up, log-in, log-out, and edit-profile are implemented in the blog module on pos-module-user (commands + plain <form> + lib/queries)
- [ ] #2 Password reset flow (request, recovery email, reset, confirmation) works via pos-module-user and the platformOS email mechanism
- [ ] #3 Current user is obtained through the pos-module-user helper; no custom current_user GraphQL or context.current_user usage remains
- [ ] #4 The blog no longer references modules/signup/*; the signup module is removed entirely
- [ ] #5 Existing user accounts continue to authenticate after the switch
- [ ] #6 platformos-check passes with 0 errors
- [ ] #7 pos-module-tests unit tests cover the auth commands (sign-up, password-reset request, password reset) including invalid input, duplicate email, and invalid/expired token cases
- [ ] #8 registrationPage, loginPage, recoverPasswordPage, and resetPasswordPage e2e page objects are updated to the rebuilt routes/markup, and registerTest, loginTest, and the recover/reset password e2e tests pass under npm run test-ci
- [ ] #9 The /sign-up route works (typo fixed) and a newly registered user can log in, edit their profile, reset their password, and log out end-to-end
- [ ] #10 The sign-up, log-in, and edit-profile forms are built with pos-module-common-styling form components (and its image-upload component for any avatar field) rather than the legacy signup-module markup
<!-- AC:END -->

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
<!-- SECTION:NOTES:END -->
