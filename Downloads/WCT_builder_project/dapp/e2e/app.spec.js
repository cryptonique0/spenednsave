import { test, expect } from '@playwright/test';

test.describe('Wallet Connection', () => {
  test('should display app title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/WCT/);
  });

  test('should show connect wallet section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Connect Your Wallet/i)).toBeVisible();
  });

  test('should display wallet options', async ({ page }) => {
    await page.goto('/');
    const walletButtons = page.getByRole('button');
    await expect(walletButtons.first()).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test('should prompt to connect when not connected', async ({ page }) => {
    await page.goto('/');
    // Dashboard should show connect prompt when no wallet connected
    await expect(page.getByText(/Connect/i)).toBeVisible();
  });
});
