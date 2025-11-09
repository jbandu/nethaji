# Getting Started with Playwright Tests

This guide will help you set up and run Playwright tests for the Nethaji Empowerment Initiative PWA.

## Prerequisites

Before running tests, ensure you have:

1. **Node.js 20+** installed
2. **PostgreSQL** running (or access to Neon database)
3. **Project dependencies** installed: `npm install`
4. **Backend and frontend** running locally

## Initial Setup

### 1. Install Dependencies

```bash
# From project root
npm install
```

### 2. Install Playwright Browsers

```bash
# Install all browsers (Chromium, Firefox, WebKit)
npx playwright install

# Or install specific browser
npx playwright install chromium
```

### 3. Install System Dependencies (Linux only)

If you're on Linux and see browser dependency warnings:

```bash
sudo npx playwright install-deps
```

### 4. Set Up Environment Variables

Create or update `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nethaji_test"

# API
PORT=3000
JWT_SECRET=your_test_jwt_secret

# Frontend
VITE_API_URL=http://localhost:3000/api/v1
```

### 5. Set Up Test Database

```bash
# Navigate to backend
cd apps/backend

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# (Optional) Seed test data
npm run db:seed
```

## Running Tests

### Start Development Servers

Before running tests, start both backend and frontend servers:

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend
```

Wait for both servers to be ready:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### Run All Tests

```bash
# Run all Playwright tests
npm run test:e2e
```

### Run Specific Test Suites

```bash
# API tests only
npm run test:api

# PWA tests only
npm run test:pwa

# E2E tests only
npx playwright test tests/e2e

# UI component tests only
npx playwright test tests/ui
```

### Run Individual Test Files

```bash
# Run specific test file
npx playwright test tests/api/auth.spec.ts

# Run tests matching a pattern
npx playwright test --grep "authentication"
```

### Interactive Testing

#### UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:
- See all tests
- Run tests individually
- Watch tests execute
- Time-travel through test steps
- Inspect DOM at each step

#### Headed Mode

```bash
npm run test:e2e:headed
```

Run tests with visible browser windows.

#### Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### Run Tests by Browser

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit only
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"

# Mobile Safari
npx playwright test --project="Mobile Safari"
```

## Viewing Test Results

### HTML Report

After tests complete, view the HTML report:

```bash
npm run test:e2e:report
```

This opens an interactive report showing:
- Test results
- Screenshots of failures
- Videos of test runs
- Execution traces

### Console Output

Test results are also shown in the console with:
- Pass/fail status
- Execution time
- Error messages
- Stack traces

## Writing Your First Test

### 1. Create a Test File

Create a new file in the appropriate directory:

```typescript
// tests/api/my-feature.spec.ts
import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

test.describe('My Feature', () => {
  test('should do something', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/endpoint`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('field');
  });
});
```

### 2. Use Test Helpers

Leverage the helper functions:

```typescript
import { test, expect } from '@playwright/test';
import { createAdminUser } from '../helpers/auth.helper';
import { generateStudentData } from '../helpers/test-data.helper';

test.describe('Student Creation', () => {
  test('admin can create student', async ({ request }) => {
    // Create admin user
    const { token } = await createAdminUser(request);

    // Generate test data
    const studentData = generateStudentData();

    // Create student
    const response = await request.post(
      `${API_BASE_URL}/students`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: studentData,
      }
    );

    expect(response.ok()).toBeTruthy();
  });
});
```

### 3. Run Your Test

```bash
npx playwright test tests/api/my-feature.spec.ts
```

## Common Issues and Solutions

### Issue: "Cannot find module '@playwright/test'"

**Solution:**
```bash
npm install
```

### Issue: "browserType.launch: Executable doesn't exist"

**Solution:**
```bash
npx playwright install
```

### Issue: "System dependencies missing" (Linux)

**Solution:**
```bash
sudo npx playwright install-deps
```

### Issue: "Connection refused to http://localhost:3000"

**Solution:**
Ensure backend server is running:
```bash
npm run dev:backend
```

### Issue: "Database connection error"

**Solution:**
1. Check DATABASE_URL in .env
2. Ensure PostgreSQL is running
3. Run migrations: `npm run db:migrate`

### Issue: Tests are flaky

**Solutions:**
- Add proper wait conditions
- Use `page.waitForLoadState('networkidle')`
- Avoid hard-coded timeouts
- Check for race conditions

### Issue: Tests timeout

**Solutions:**
- Increase timeout in test or config
- Check if servers are running
- Verify network connectivity
- Look for infinite loops in code

## Tips for Effective Testing

### 1. Test Isolation

Each test should be independent:

```typescript
test.beforeEach(async ({ page }) => {
  // Setup clean state for each test
  await page.goto('/');
});

test.afterEach(async () => {
  // Cleanup if needed
});
```

### 2. Use Unique Test Data

Avoid conflicts by using timestamps:

```typescript
const email = `test_${Date.now()}@example.com`;
```

### 3. Proper Assertions

Use specific assertions:

```typescript
// Good
await expect(page.locator('.success-message')).toHaveText('Saved successfully');

// Avoid
await expect(page.locator('.message')).toBeVisible();
```

### 4. Wait for Network

Wait for API calls to complete:

```typescript
await page.waitForLoadState('networkidle');
```

### 5. Use Data Attributes

Add test IDs to elements:

```html
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.click('[data-testid="submit-button"]');
```

## Next Steps

- Read the [main README](./README.md) for detailed test documentation
- Browse existing tests for examples
- Check [Playwright documentation](https://playwright.dev) for advanced features
- Join our team chat for testing questions

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)

---

Happy Testing! 🎭
