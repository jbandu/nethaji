import { test, expect } from '@playwright/test';

test.describe('UI Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as user
    await page.goto('/');
    const timestamp = Date.now();

    await page.click('text=Register');
    await page.fill('input[name="name"]', 'UI Test User');
    await page.fill('input[name="email"]', `ui_test_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');
    await page.selectOption('select[name="role"]', 'TEACHER');
    await page.click('button[type="submit"]');
  });

  test.describe('Navigation Component', () => {
    test('should display navigation menu', async ({ page }) => {
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should navigate between pages', async ({ page }) => {
      await page.click('nav a[href="/dashboard"]');
      await expect(page).toHaveURL(/dashboard/);

      await page.click('nav a[href="/students"]');
      await expect(page).toHaveURL(/students/);

      await page.click('nav a[href="/attendance"]');
      await expect(page).toHaveURL(/attendance/);
    });

    test('should highlight active page in navigation', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.locator('nav a[href="/dashboard"]')).toHaveClass(/active/);
    });

    test('should display user profile in header', async ({ page }) => {
      await expect(page.locator('[data-testid="user-profile"], .user-profile')).toBeVisible();
      await expect(page.locator('text=UI Test User')).toBeVisible();
    });
  });

  test.describe('Dashboard Components', () => {
    test('should display dashboard stats cards', async ({ page }) => {
      await page.goto('/dashboard');

      // Should show key metrics
      await expect(page.locator('text=/total students|attendance rate|active streaks/i')).toBeVisible();
    });

    test('should display recent activity feed', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="activity-feed"], .activity-feed')).toBeVisible();
    });

    test('should display attendance chart', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.locator('svg, canvas')).toBeVisible();
    });
  });

  test.describe('Form Components', () => {
    test('should validate required fields', async ({ page }) => {
      await page.goto('/students/new');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('.error, .field-error, [role="alert"]')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/profile');

      await page.fill('input[type="email"]', 'invalid-email');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/invalid email/i')).toBeVisible();
    });

    test('should validate phone number format', async ({ page }) => {
      await page.goto('/students/new');

      await page.fill('input[name="phone"]', '123');
      await page.blur('input[name="phone"]');

      await expect(page.locator('text=/invalid phone/i')).toBeVisible();
    });

    test('should disable submit button while submitting', async ({ page }) => {
      await page.goto('/students/new');

      // Fill form
      await page.fill('input[name="name"]', 'Test Student');
      await page.fill('input[name="dateOfBirth"]', '2015-05-15');
      await page.selectOption('select[name="gender"]', 'MALE');

      // Click submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Modal Components', () => {
    test('should open and close modal', async ({ page }) => {
      await page.goto('/students');

      // Open modal
      await page.click('button:has-text("Add Student")');
      await expect(page.locator('[role="dialog"], .modal')).toBeVisible();

      // Close modal
      await page.click('button:has-text("Cancel"), [aria-label="Close"]');
      await expect(page.locator('[role="dialog"], .modal')).not.toBeVisible();
    });

    test('should close modal on escape key', async ({ page }) => {
      await page.goto('/students');

      await page.click('button:has-text("Add Student")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });
  });

  test.describe('Table Components', () => {
    test('should sort table columns', async ({ page }) => {
      await page.goto('/students');

      // Click column header to sort
      await page.click('th:has-text("Name")');

      // Should sort ascending
      await expect(page.locator('th:has-text("Name")')).toHaveAttribute('aria-sort', 'ascending');

      // Click again to sort descending
      await page.click('th:has-text("Name")');
      await expect(page.locator('th:has-text("Name")')).toHaveAttribute('aria-sort', 'descending');
    });

    test('should paginate table data', async ({ page }) => {
      await page.goto('/students');

      // Should show pagination controls
      await expect(page.locator('.pagination, [role="navigation"]')).toBeVisible();

      // Click next page
      await page.click('button:has-text("Next"), [aria-label="Next page"]');

      // URL or page should change
      await expect(page.locator('[aria-label="Page 2"], .page-2')).toBeVisible();
    });
  });

  test.describe('Toast Notifications', () => {
    test('should display success toast', async ({ page }) => {
      await page.goto('/students/new');

      await page.fill('input[name="name"]', 'Toast Test');
      await page.fill('input[name="dateOfBirth"]', '2015-05-15');
      await page.selectOption('select[name="gender"]', 'MALE');
      await page.click('button[type="submit"]');

      // Should show success toast
      await expect(page.locator('[role="status"], .toast, .notification')).toBeVisible();
      await expect(page.locator('text=/success/i')).toBeVisible();
    });

    test('should auto-dismiss toast after timeout', async ({ page }) => {
      await page.goto('/students/new');

      await page.fill('input[name="name"]', 'Auto Dismiss');
      await page.fill('input[name="dateOfBirth"]', '2015-05-15');
      await page.selectOption('select[name="gender"]', 'MALE');
      await page.click('button[type="submit"]');

      // Toast should be visible initially
      const toast = page.locator('[role="status"], .toast');
      await expect(toast).toBeVisible();

      // Should auto-dismiss after a few seconds
      await page.waitForTimeout(5000);
      await expect(toast).not.toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading spinner while fetching data', async ({ page }) => {
      await page.goto('/students');

      // Should show loader initially
      await expect(page.locator('.loader, .spinner, [role="progressbar"]')).toBeVisible();

      // Loader should disappear after data loads
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.loader, .spinner')).not.toBeVisible();
    });

    test('should show skeleton screens during load', async ({ page }) => {
      await page.goto('/dashboard');

      // Should show skeleton loaders
      await expect(page.locator('.skeleton, [data-testid="skeleton"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Mobile menu button should be visible
      await expect(page.locator('[aria-label="Menu"], .hamburger, .mobile-menu-button')).toBeVisible();

      // Click to open mobile menu
      await page.click('[aria-label="Menu"], .hamburger, .mobile-menu-button');

      // Mobile menu should be visible
      await expect(page.locator('.mobile-menu, [role="dialog"]')).toBeVisible();
    });

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/dashboard');

      // Dashboard should adapt to tablet layout
      await expect(page).toHaveScreenshot({ maxDiffPixels: 100 });
    });
  });
});
