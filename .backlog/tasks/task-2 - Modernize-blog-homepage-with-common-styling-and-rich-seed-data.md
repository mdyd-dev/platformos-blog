---
id: TASK-2
title: Modernize blog homepage with common-styling and rich seed data
status: Done
assignee: []
created_date: '2026-07-20 11:37'
updated_date: '2026-07-20 12:16'
labels:
  - frontend
  - blog
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The blog should look great right after deploy. Currently the public views use legacy nearme-era CSS (o-section/c-layout in app.css) and the seed migration creates only one sample post. Rework the public blog layout and homepage to use the common-styling (pos-*) design system, and extend the seed migration so a fresh instance shows an attractive blog highlight homepage (featured post + several posts with images). Develop against the pos-cli `dev` environment.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Homepage (/) renders using common-styling components (pos-card, pos-tag, pos-pagination, pos-typography, etc.) instead of legacy app.css classes
- [x] #2 Seed migration creates multiple example posts with hero images so the homepage looks populated right after deploy
- [x] #3 Blog layout includes common-styling init (styles+JS) and drops unused legacy assets from the public layout
- [x] #4 Deployed and visually verified on the dev environment
- [x] #5 Playwright home tests pass (or are updated to the new markup)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Assets: copy 5 generated abstract hero JPGs to modules/blog/public/assets/images/posts/, add SVG favicon.
2. Schema: add m/lg resize versions to blog_post.hero_image; add hero version to blog_instance.header_image.
3. New stylesheet modules/blog/public/assets/blog/theme.css built on pos-* tokens (blog- prefixed classes: container, header, hero, featured card, posts grid, article, footer, fab); load Source Code Pro.
4. Rewrite public views on common-styling: layouts/blog.liquid (pos-app + darkEnabled + init), layout/header+footer, blog/hero, blog/post card, blog/index (featured post + tag filter row + card grid + common-styling pagination), show.liquid (pos-prose article, avatar author box, siblings cards, related grid, comments gated on facebook_app_id), restyled flash + flying buttons.
5. Seed migration: 6 posts (Getting Started + 5 platformOS-themed guides) with images, varied tags/authors, relative published_at dates; instance subtitle + tags_filter.
6. Remove legacy public-only assets (app.css/app.js/nearme/platformos dirs) and unused partials; keep admin assets (jquery/manifest/admin*).
7. Validate, deploy to dev, reset blog records + rerun seed, Playwright screenshot + home tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rebuilt all public blog views on common-styling (pos-app + pos-theme-darkEnabled on html, init partial with reset, pos-card/pos-tag/pos-button/pos-prose/pagination/avatar components) with a thin blog-specific stylesheet (assets/blog/theme.css) driven entirely by pos-* design tokens. Added platformOS branding: chameleon logomark (header + SVG favicon), Gotham woff2 shipped in module assets as --pos-font-default override, signature green→blue gradient (linear-gradient(99.03deg,#45a041,#3a8dde)) as the default hero background. Seed migration now creates 6 sample posts with hero images (1 photo + 5 generated abstract gradients in assets/images/posts/), varied tags/authors/read-times and relative published_at dates via 'now'|date:'%s'|minus. Schema: hero_image gained m/lg versions, header_image gained hero version. Removed legacy nearme/bootstrap assets and 14 dead partials; admin assets untouched.

KEY GOTCHA (also saved to auto-memory): value_upload remote_url silently never processes when the source URL has a query string — asset_url appends ?updated=..., so seeds must use `| asset_url | split: '?' | first`. S3 returns 403 (not 404) for the never-created upload objects.

Note: blog_instance.sidebar_enabled/grid_view_enabled are no longer read by the index view (single-column card grid always); social links moved to the footer, categories to the tag-filter row. Facebook comments now render only when facebook_app_id is set and load the SDK inside the comments partial. Playwright home.ts footer locator narrowed to footer.blog-footer (strict-mode fix).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Homepage (/) is now a platformOS-branded blog highlight built on common-styling: brand-gradient hero with blog title/subtitle, category tag filter, large featured card for the newest post, responsive card grid with images/tags/dates/read-time/author, design-system pagination, sticky header with logomark + RSS/dashboard/login actions, and a footer with social links. Post pages render markdown via pos-prose (highlighted code blocks), hero meta with avatar, share links, author box, prev/next cards and related articles. A fresh deploy seeds 1 blog instance + 6 illustrated sample posts with always-recent dates, so the blog looks great immediately after `pos-cli deploy` with zero manual steps. Verified on the dev instance (fresh-seed flow re-run end-to-end, desktop/mobile screenshots, both home Playwright tests green).
<!-- SECTION:FINAL_SUMMARY:END -->
