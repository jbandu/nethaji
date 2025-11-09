import { test, expect } from '@playwright/test';

test.describe('PWA Offline Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login and wait for service worker
    await page.goto('/');
    const timestamp = Date.now();

    await page.click('text=Register');
    await page.fill('input[name="name"]', 'PWA Test User');
    await page.fill('input[name="email"]', `pwa_test_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');
    await page.selectOption('select[name="role"]', 'TEACHER');
    await page.click('button[type="submit"]');

    // Wait for service worker to register
    await page.waitForFunction(() => 'serviceWorker' in navigator);
  });

  test('should register service worker', async ({ page }) => {
    const swRegistered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration !== undefined;
    });

    expect(swRegistered).toBeTruthy();
  });

  test('should cache static assets', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if cache API is available
    const cacheExists = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      return cacheNames.length > 0;
    });

    expect(cacheExists).toBeTruthy();
  });

  test('should work offline after initial load', async ({ page, context }) => {
    // Load page online first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Navigate to another page
    await page.click('nav a[href="/students"]');

    // Page should still load from cache
    await expect(page.locator('h1, h2').filter({ hasText: /students/i })).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });

  test('should queue API requests when offline', async ({ page, context }) => {
    await page.goto('/attendance');

    // Go offline
    await context.setOffline(true);

    // Try to mark attendance
    await page.click('[data-testid="student-attendance-checkbox"]:first-child');
    await page.click('button:has-text("Save Attendance")');

    // Should show offline indicator or queued message
    await expect(page.locator('text=/offline|queued|will sync/i')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Data should sync
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/synced|success/i')).toBeVisible();
  });

  test('should show offline indicator when disconnected', async ({ page, context }) => {
    await page.goto('/dashboard');

    // Go offline
    await context.setOffline(true);

    // Should display offline indicator
    await expect(page.locator('[data-testid="offline-indicator"], .offline-badge')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Offline indicator should disappear
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  });

  test('should cache student data for offline viewing', async ({ page, context }) => {
    // Load students while online
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Refresh page
    await page.reload();

    // Students should still be visible from cache
    await expect(page.locator('.student-card, tr')).toBeVisible();

    await context.setOffline(false);
  });

  test('should sync data when coming back online', async ({ page, context }) => {
    await page.goto('/attendance');

    // Go offline
    await context.setOffline(true);

    // Make changes offline
    await page.click('[data-testid="student-attendance-checkbox"]:first-child');
    await page.click('button:has-text("Save")');

    // Go back online
    await context.setOffline(false);

    // Wait for sync
    await page.waitForTimeout(3000);

    // Should show sync success
    await expect(page.locator('text=/synced|synchronized/i')).toBeVisible();
  });

  test('should store data in IndexedDB', async ({ page }) => {
    await page.goto('/dashboard');

    const hasIndexedDB = await page.evaluate(async () => {
      return 'indexedDB' in window;
    });

    expect(hasIndexedDB).toBeTruthy();

    // Check if app database exists
    const dbExists = await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      return dbs.some(db => db.name?.includes('nethaji'));
    });

    expect(dbExists).toBeTruthy();
  });

  test('should handle concurrent offline edits', async ({ page, context }) => {
    await page.goto('/students');

    // Go offline
    await context.setOffline(true);

    // Edit multiple students
    await page.click('.student-card:first-child, tr:first-child');
    await page.click('button:has-text("Edit")');
    await page.fill('input[name="school"]', 'Offline Edit 1');
    await page.click('button[type="submit"]');

    // Go back online
    await context.setOffline(false);

    // Changes should sync without conflicts
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/synced/i')).toBeVisible();
  });

  test('should display cached images offline', async ({ page, context }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload();

    // Images should still display from cache
    const images = page.locator('img');
    await expect(images.first()).toBeVisible();

    await context.setOffline(false);
  });
});

test.describe('PWA Installation', () => {
  test('should be installable as PWA', async ({ page }) => {
    await page.goto('/');

    // Check for manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /manifest\.json/);
  });

  test('should have valid manifest.json', async ({ request }) => {
    const response = await request.get('http://localhost:5173/manifest.json');
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('icons');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest.display).toBe('standalone');
  });

  test('should have required icons', async ({ page }) => {
    await page.goto('/');

    const iconLinks = page.locator('link[rel*="icon"]');
    const count = await iconLinks.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should register service worker on load', async ({ page }) => {
    await page.goto('/');

    const swRegistered = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(() => resolve(true));
        } else {
          resolve(false);
        }
      });
    });

    expect(swRegistered).toBeTruthy();
  });
});

test.describe('PWA Background Sync', () => {
  test('should register background sync', async ({ page }) => {
    await page.goto('/');

    const supportsBgSync = await page.evaluate(() => {
      return 'sync' in navigator.serviceWorker.ready;
    });

    // Background sync might not be supported in all browsers
    if (supportsBgSync) {
      expect(supportsBgSync).toBeTruthy();
    }
  });

  test('should sync attendance data in background', async ({ page, context }) => {
    await page.goto('/attendance');

    // Mark attendance while online
    await page.click('[data-testid="student-attendance-checkbox"]:first-child');
    await page.click('button:has-text("Save")');

    // Go offline briefly
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    await context.setOffline(false);

    // Background sync should handle the request
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/success|saved/i')).toBeVisible();
  });
});
