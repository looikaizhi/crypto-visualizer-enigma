import { expect, test as base } from '@playwright/test';

export { expect };

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Enigma 密码机模拟器' })
    ).toBeVisible({ timeout: 30_000 });
    await use(page);
  },
});
