import { expect, test } from './fixtures';

test('seed', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Enigma 密码机模拟器' })
  ).toBeVisible();
});
