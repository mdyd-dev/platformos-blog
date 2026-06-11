import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from './page';
import { Form, FieldConfig } from './components/form';
import { step } from '../utils/utils';
import path from 'path';

/**
 * Data shape for the plain blog-post form (task 1.4).
 *
 * Replaces the legacy Forms/customizations payload. Field names mirror the
 * `blog_post[...]` params posted by the new plain <form>.
 */
export type PostFormData = {
  title?: string;
  content?: string;
  excerpt?: string;
  author_name?: string;
  author_biography?: string;
  tags?: string;
  publish_now?: boolean;
};

/**
 * The plain post editor form (create + edit), built with the common-styling
 * markdown editor (content) and image-upload component (hero_image / author_avatar).
 *
 * Selectors target the new `data-tc` hooks and common-styling markup — the legacy
 * `#form-properties-attributes-*`, `.trumbowyg-editor` and `.simple_form` selectors
 * no longer exist.
 */
export class PostForm extends Form<PostFormData> {
  /** EasyMDE renders the common-styling markdown textarea as a CodeMirror editor. */
  readonly contentEditor: Locator;
  readonly heroImageInput: Locator;
  readonly authorAvatarInput: Locator;

  constructor(page: Page) {
    super(page, '');
    this.form = page.getByTestId('blog-post-form');
    this.contentEditor = this.form.locator('#blog-post-content div.CodeMirror.cm-s-easymde').first();
    this.heroImageInput = this.form.locator('#blog-post-hero-image input[type="file"]').first();
    this.authorAvatarInput = this.form.locator('#blog-post-author-avatar input[type="file"]').first();
  }

  protected fieldsMapping: Partial<{ [K in keyof PostFormData]: FieldConfig }> = {
    title: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-post-title') },
    excerpt: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-post-excerpt') },
    author_name: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-post-author-name') },
    author_biography: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-post-author-biography') },
    tags: { type: 'textbox', getLocator: (p) => p.getByTestId('blog-post-tags') },
    publish_now: { type: 'checkbox', getLocator: (p) => p.getByTestId('blog-post-publish-now') },
  };

  submitButton(): Locator {
    return this.page.getByTestId('blog-post-submit');
  }

  @step
  async fillContent(markdown: string): Promise<void> {
    // EasyMDE: focus the CodeMirror surface and type the markdown body.
    await this.contentEditor.click();
    await this.page.keyboard.type(markdown);
  }

  @step
  async uploadHeroImage(fileName: string): Promise<void> {
    await this.heroImageInput.setInputFiles(path.join(__dirname, '..', 'data', 'images', fileName));
    await this.page.getByText('Upload complete').waitFor({ state: 'visible', timeout: 15000 });
  }

  @step
  async fillAndSubmit(data: PostFormData): Promise<void> {
    await this.fill(data);
    if (data.content != null) await this.fillContent(data.content);
    await this.submitButton().click();
  }
}

/**
 * The dashboard posts admin list (/dashboard/blog): the posts table plus the
 * New post / Edit / Delete actions. Mirrors the legacy `postsAdminPage` page
 * object, retargeted to the new plain-form markup.
 */
export class PostsAdminPage extends BasePage {
  readonly newPostLink: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    super(page, '/dashboard/blog');
    this.newPostLink = this.linkWithText('New post');
    this.rows = this.page.getByTestId('blog-post-row');
  }

  @step
  async open(): Promise<void> {
    await this.goto();
  }

  rowByTitle(title: string): Locator {
    return this.rows.filter({ has: this.page.getByTestId('blog-post-title-link').filter({ hasText: title }) });
  }

  @step
  async gotoNewPost(): Promise<PostForm> {
    await this.page.goto('/dashboard/posts/new', { waitUntil: 'domcontentloaded' });
    return new PostForm(this.page);
  }

  @step
  async editPost(title: string): Promise<PostForm> {
    await this.rowByTitle(title).getByTestId('blog-post-edit').click();
    await this.page.waitForLoadState('domcontentloaded');
    return new PostForm(this.page);
  }

  @step
  async deletePost(title: string): Promise<void> {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.rowByTitle(title).getByTestId('blog-post-delete').click();
    await this.page.waitForURL('**/dashboard/blog');
  }

  @step
  async expectPostListed(title: string): Promise<void> {
    await expect(this.rowByTitle(title)).toBeVisible();
  }

  @step
  async expectPostNotListed(title: string): Promise<void> {
    await expect(this.rowByTitle(title)).toHaveCount(0);
  }
}
