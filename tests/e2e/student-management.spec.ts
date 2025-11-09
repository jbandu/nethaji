import { test, expect } from '@playwright/test';

test.describe('Student Management E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/');
    const timestamp = Date.now();

    await page.click('text=Register');
    await page.fill('input[name="name"]', 'Admin User');
    await page.fill('input[name="email"]', `admin_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Admin123!@#');
    await page.fill('input[name="confirmPassword"]', 'Admin123!@#');
    await page.selectOption('select[name="role"]', 'ADMIN');
    await page.click('button[type="submit"]');

    // Navigate to students page
    await page.goto('/students');
  });

  test('should display students list', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /students/i })).toBeVisible();
    await expect(page.locator('table, .student-card')).toBeVisible();
  });

  test('should add a new student', async ({ page }) => {
    // Click add student button
    await page.click('button:has-text("Add Student"), button:has-text("New Student")');

    // Fill student form
    await page.fill('input[name="name"]', 'Test Student');
    await page.fill('input[name="dateOfBirth"]', '2015-05-15');
    await page.selectOption('select[name="gender"]', 'MALE');
    await page.fill('input[name="phone"]', '9876543210');
    await page.fill('input[name="school"]', 'Test School');
    await page.fill('input[name="grade"]', '5');
    await page.fill('input[name="parentName"]', 'Parent Name');
    await page.fill('input[name="parentPhone"]', '9876543211');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=/success|created/i')).toBeVisible();

    // Should see the new student in the list
    await expect(page.locator('text=Test Student')).toBeVisible();
  });

  test('should search for students', async ({ page }) => {
    // Add a student first
    await page.click('button:has-text("Add Student"), button:has-text("New Student")');
    await page.fill('input[name="name"]', 'Searchable Student');
    await page.fill('input[name="dateOfBirth"]', '2015-05-15');
    await page.selectOption('select[name="gender"]', 'FEMALE');
    await page.click('button[type="submit"]');

    // Search for the student
    await page.fill('input[placeholder*="search" i]', 'Searchable');

    // Should display only matching results
    await expect(page.locator('text=Searchable Student')).toBeVisible();
  });

  test('should view student details', async ({ page }) => {
    // Add a student first
    await page.click('button:has-text("Add Student"), button:has-text("New Student")');
    await page.fill('input[name="name"]', 'Detail View Student');
    await page.fill('input[name="dateOfBirth"]', '2015-05-15');
    await page.selectOption('select[name="gender"]', 'MALE');
    await page.click('button[type="submit"]');

    // Click on student to view details
    await page.click('text=Detail View Student');

    // Should show student details page
    await expect(page.locator('text=Detail View Student')).toBeVisible();
    await expect(page.locator('text=/attendance|progress|badges/i')).toBeVisible();
  });

  test('should edit student information', async ({ page }) => {
    // Add a student first
    await page.click('button:has-text("Add Student"), button:has-text("New Student")');
    await page.fill('input[name="name"]', 'Original Name');
    await page.fill('input[name="dateOfBirth"]', '2015-05-15');
    await page.selectOption('select[name="gender"]', 'MALE');
    await page.click('button[type="submit"]');

    // Click edit button
    await page.click('button:has-text("Edit"), [aria-label="Edit"]');

    // Update information
    await page.fill('input[name="name"]', 'Updated Name');
    await page.fill('input[name="school"]', 'Updated School');

    // Save changes
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=/success|updated/i')).toBeVisible();

    // Should see updated information
    await expect(page.locator('text=Updated Name')).toBeVisible();
  });

  test('should delete a student', async ({ page }) => {
    // Add a student first
    await page.click('button:has-text("Add Student"), button:has-text("New Student")');
    await page.fill('input[name="name"]', 'To Delete Student');
    await page.fill('input[name="dateOfBirth"]', '2015-05-15');
    await page.selectOption('select[name="gender"]', 'FEMALE');
    await page.click('button[type="submit"]');

    // Click delete button
    await page.click('button:has-text("Delete"), [aria-label="Delete"]');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Should show success message
    await expect(page.locator('text=/success|deleted/i')).toBeVisible();

    // Student should no longer appear in list
    await expect(page.locator('text=To Delete Student')).not.toBeVisible();
  });

  test('should display student progress and badges', async ({ page }) => {
    // Navigate to student details
    await page.click('text=Test Student', { force: true });

    // Should show progress information
    await expect(page.locator('text=/attendance rate|streak|progress/i')).toBeVisible();

    // Should show badges section
    await expect(page.locator('text=/badges|achievements/i')).toBeVisible();
  });
});
