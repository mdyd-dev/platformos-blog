import { test } from '@playwright/test';

/**
 * Decorator that wraps a page-object method in Playwright's `test.step()`, so the
 * method shows up as a semantic step ("ClassName.methodName") in traces/reports.
 *
 * Mirrors the `@step` decorator used in pos-module-community.
 */
export function step(target: Function, context: ClassMethodDecoratorContext) {
  return function replacementMethod(this: any, ...args: unknown[]) {
    const name = this.constructor.name + '.' + (context.name as string);
    return test.step(name, async () => {
      return await target.call(this, ...args);
    });
  };
}
