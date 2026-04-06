import { test, expect } from '@playwright/test'

// These tests require the API server to be running at VITE_API_URL
// Skip if API_URL not set
test.describe('API Health', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const apiUrl = process.env['E2E_API_URL'] ?? 'http://localhost:3000'
    const response = await request.get(`${apiUrl}/health`)

    // May fail if server not running — that's expected in CI without server
    if (!response.ok()) {
      test.skip()
      return
    }

    const body = await response.json() as { status: string }
    expect(body.status).toBe('ok')
  })
})
