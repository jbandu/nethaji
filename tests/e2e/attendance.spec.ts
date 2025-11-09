import { test, expect } from '@playwright/test';

test.describe('Attendance Marking E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher
    await page.goto('/');
    const timestamp = Date.now();

    await page.click('text=Register');
    await page.fill('input[name="name"]', 'Teacher User');
    await page.fill('input[name="email"]', `teacher_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Teacher123!@#');
    await page.fill('input[name="confirmPassword"]', 'Teacher123!@#');
    await page.selectOption('select[name="role"]', 'TEACHER');
    await page.click('button[type="submit"]');
  });

  test('should mark attendance for a single student', async ({ page }) => {
    await page.goto('/attendance');

    // Select date (today)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today);

    // Mark attendance for first student
    await page.click('[data-testid="student-attendance-checkbox"]:first-child, .attendance-checkbox:first-child');

    // Add activity details
    await page.click('text=/chess|yoga|meditation|fitness/i');

    // Save attendance
    await page.click('button:has-text("Save Attendance"), button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=/success|saved/i')).toBeVisible();
  });

  test('should mark bulk attendance', async ({ page }) => {
    await page.goto('/attendance');

    // Select all students
    await page.click('input[type="checkbox"][id*="select-all"]');

    // Select activity type
    await page.selectOption('select[name="activityType"]', 'CHESS');

    // Save bulk attendance
    await page.click('button:has-text("Save All")');

    // Should show success message
    await expect(page.locator('text=/success|attendance marked/i')).toBeVisible();
  });

  test('should view attendance history', async ({ page }) => {
    await page.goto('/attendance/history');

    // Should display attendance records
    await expect(page.locator('table, .attendance-record')).toBeVisible();

    // Should show filters
    await expect(page.locator('input[type="date"], select[name="student"]')).toBeVisible();
  });

  test('should filter attendance by date range', async ({ page }) => {
    await page.goto('/attendance/history');

    // Set date range
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    await page.fill('input[name="startDate"]', startDate);
    await page.fill('input[name="endDate"]', endDate);

    await page.click('button:has-text("Filter"), button:has-text("Apply")');

    // Should show filtered results
    await expect(page.locator('.attendance-record, tr')).toBeVisible();
  });

  test('should edit attendance record', async ({ page }) => {
    await page.goto('/attendance/history');

    // Click edit on first record
    await page.click('button:has-text("Edit"):first-child, [aria-label="Edit"]:first-child');

    // Change activity
    await page.selectOption('select[name="activityType"]', 'YOGA');

    // Save changes
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=/success|updated/i')).toBeVisible();
  });

  test('should calculate attendance streaks', async ({ page }) => {
    await page.goto('/students');

    // Click on a student
    await page.click('.student-card:first-child, tr:first-child');

    // Should display streak information
    await expect(page.locator('text=/streak/i')).toBeVisible();
    await expect(page.locator('[data-testid="streak-count"]')).toBeVisible();
  });

  test('should track attendance rate', async ({ page }) => {
    await page.goto('/dashboard');

    // Should display overall attendance rate
    await expect(page.locator('text=/attendance rate/i')).toBeVisible();
    await expect(page.locator('[data-testid="attendance-rate"]')).toBeVisible();
  });
});
