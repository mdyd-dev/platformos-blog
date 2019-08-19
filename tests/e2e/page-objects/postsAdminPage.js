import {
  Selector
} from 'testcafe';

export default class PostAdminPage {
  constructor() {
    this.txt = {
      textContent: 'Sorry, no content matched your criteria.\nPlease go back to main blog page',
    };
    this.form = {
      title: Selector('#form-properties-attributes-title'),
      publishNow: Selector('.switch > label'),
      content: Selector('.trumbowyg-editor'),
      excerpt: Selector('#form-properties-attributes-excerpt'),
      author: Selector('#form-properties-attributes-author-name'),
      heroImage: Selector('#form-custom-images-attributes-hero-image-attributes-image'),
      avatar: Selector('#form-custom-images-attributes-author-avatar-attributes-image')
    };
    this.link = {
      blogPage: Selector('a').withText('Blog'),
      newPost: Selector('a').withText('New post'),
      blogPost: Selector('a').withText('Lorem ipsum'),
      home: Selector('a').withText('Home')
    };
    this.button = {
      savePost: Selector('.btn.btn-primary.btn-lg'),
      removePost: Selector('input[type="Submit"].btn.btn-link')
    };
  }
}