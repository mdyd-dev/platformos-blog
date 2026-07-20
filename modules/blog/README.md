# platformOS Blog Module

A single, self-contained `blog` module built on the modern platformOS stack:

- **Records** — `blog_post` and `blog_instance` are record schemas (`public/schema/`), read via GraphQL under `public/graphql/{resource}/{action}.graphql`.
- **Commands & queries** — all writes go through commands (`public/lib/commands/{resource}/{action}` — build → check → execute) invoked from plain `<form>` POST pages with CSRF tokens; reads go through query objects (`public/lib/queries/{resource}/{action}`). No legacy Forms (`form_configurations`) are used anywhere.
- **Authentication** — [pos-module-user](https://github.com/Platform-OS/pos-module-user) provides users, sessions, and password reset:
  - log in at `/sessions/new`, register at `/users/new`, password reset via the built-in `/passwords/reset` flow (authentication links delivered by email)
  - the blog module adds `/log-out` and `/edit-profile` pages on top (calling `modules/user` commands)
  - the current user is always read through `modules/user/helpers/current_profile`
  - a migration backfills `modules/user/profile` records for accounts created before the switch, so existing users keep working
- **Authorization** — a `blog.manage` permission carried by the `blog_manager` role (defined in the app override of the user module's `role_permissions/permissions` map). Every admin/editor page is gated with `modules/user/helpers/can_do_or_unauthorized`; a migration idempotently grants `blog_manager` to the first user so a fresh install is usable.
- **Styling** — [pos-module-common-styling](https://github.com/Platform-OS/pos-module-common-styling) components (`pos-*` classes, toasts for session flash messages, form error components, pagination, markdown editor and image upload in the admin).
- **Translations** — user-facing strings live in `public/translations/en/` and render via the `t` filter.

## Dependencies

Declared in `pos-module.json`:

| module | purpose |
| --- | --- |
| `core` | commands/validations/events framework, session + flash helpers |
| `user` | authentication, profiles, password reset |
| `common-styling` | UI components and theme |
| `tests` | unit-test runner for the command suite (`public/lib/test/`) |

## Development

```sh
pos-cli deploy dev          # deploy (runs migrations)
pos-cli check run           # lint — the repo is kept at 0 errors
MPKIT_URL=<url> npx playwright test   # e2e suites: home, auth, posts, admin
```

Unit tests run on the instance via the tests module (`/_tests/run`), e.g. `pos-cli tests run dev auth_test`.

## Admin

Blog management lives at `/dashboard/blog` (posts CRUD + blog settings) behind the
`blog.manage` permission. `/dashboard/managers` lists users and grants/revokes the
`blog_manager` role. Content is written in Markdown via the common-styling markdown
editor; images upload through the common-styling presigned-upload component.
