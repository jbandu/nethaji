import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Nethaji/);
    await expect(page.locator('h1, h2').filter({ hasText: /login|sign in/i })).toBeVisible();
  });

  test('should register a new user', async ({ page }) => {
    const timestamp = Date.now();

    // Navigate to registration
    await page.click('text=Register');

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');
    await page.selectOption('select[name="role"]', 'TEACHER');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.click('text=Register');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/required|cannot be empty/i')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // First, register a user
    const timestamp = Date.now();
    const email = `test_login_${timestamp}@example.com`;
    const password = 'Test123!@#';

    await page.click('text=Register');
    await page.fill('input[name="name"]', 'Login Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.selectOption('select[name="role"]', 'TEACHER');
    await page.click('button[type="submit"]');

    // Logout
    await page.click('text=/logout|sign out/i');

    // Login again
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should be logged in
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid credentials|login failed/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Register and login
    const timestamp = Date.now();
    await page.click('text=Register');
    await page.fill('input[name="name"]', 'Logout Test');
    await page.fill('input[name="email"]', `logout_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');
    await page.selectOption('select[name="role"]', 'TEACHER');
    await page.click('button[type="submit"]');

    // Logout
    await page.click('text=/logout|sign out/i');

    // Should redirect to login
    await expect(page).toHaveURL(/login|^\//);
    await expect(page.locator('text=/login|sign in/i')).toBeVisible();
  });

  test('should persist login after page refresh', async ({ page }) => {
    // Register and login
    const timestamp = Date.now();
    await page.click('text=Register');
    await page.fill('input[name="name"]', 'Persist Test');
    await page.fill('input[name="email"]', `persist_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');
    await page.selectOption('select[name="role"]', 'TEACHER');
    await page.click('button[type="submit"]');

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should protect dashboard route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login|^\//);
  });
});
