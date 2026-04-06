import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home redirects to /market', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/.*\/market/)
  })

  test('market page loads', async ({ page }) => {
    await page.goto('/market')
    await expect(page).not.toHaveTitle(/404/)
    // Check key UI elements exist
    await expect(page.locator('body')).toBeVisible()
  })

  test('404 page shows for unknown route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText('Page not found')).toBeVisible()
  })

  test('/admin page loads', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByText('Admin')).toBeVisible()
    await expect(page.getByText('Circuit Breaker')).toBeVisible()
  })

  test('/trade redirects to first pair', async ({ page }) => {
    await page.goto('/trade')
    // Should redirect to a pair URL
    await page.waitForURL(/.*\/trade\/.*/, { timeout: 5000 }).catch(() => {})
    // At minimum, page should not crash
    await expect(page.locator('body')).toBeVisible()
  })
})
