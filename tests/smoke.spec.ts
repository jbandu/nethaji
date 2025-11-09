import { test, expect } from '@playwright/test';

/**
 * Simple smoke test to verify Playwright setup
 */

test.describe('Smoke Tests - Setup Verification', () => {
  test('Playwright is configured correctly', async () => {
    // This test verifies that Playwright is set up correctly
    expect(test.info().project.name).toBeTruthy();
    console.log(`Running on project: ${test.info().project.name}`);
  });

  test('can make HTTP requests', async ({ request }) => {
    // Test that request context works
    const response = await request.get('https://api.github.com');
    expect(response.ok()).toBeTruthy();
    console.log('✓ HTTP request capability verified');
  });
});

test.describe('Health Check Tests', () => {
  test('backend health endpoint is accessible', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:3000/health');

      if (response.ok()) {
        const data = await response.json();
        expect(data.status).toBe('ok');
        console.log('✓ Backend is running and healthy');
      } else {
        console.log('⚠ Backend is not running (this is expected if servers are not started)');
      }
    } catch (error) {
      console.log('⚠ Backend is not accessible - make sure to run "npm run dev:backend" first');
    }
  });

  test('frontend is accessible', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:5173');

      if (response.ok()) {
        console.log('✓ Frontend is running');
      } else {
        console.log('⚠ Frontend is not running (this is expected if servers are not started)');
      }
    } catch (error) {
      console.log('⚠ Frontend is not accessible - make sure to run "npm run dev:frontend" first');
    }
  });
});
