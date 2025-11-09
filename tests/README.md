# Playwright Test Suite

This directory contains comprehensive end-to-end and API tests for the Nethaji Empowerment Initiative PWA.

## Directory Structure

```
tests/
├── api/              # API endpoint tests
│   ├── auth.spec.ts
│   ├── student.spec.ts
│   └── teacher.spec.ts
├── e2e/              # End-to-end user flow tests
│   ├── authentication.spec.ts
│   ├── student-management.spec.ts
│   └── attendance.spec.ts
├── ui/               # UI component tests
│   └── components.spec.ts
└── pwa/              # PWA functionality tests
    └── offline.spec.ts
```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test Suites
```bash
# API tests only
npm run test:api

# PWA tests only
npm run test:pwa

# E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

### View Test Reports
```bash
npm run test:e2e:report
```

## Test Categories

### 1. API Tests (`tests/api/`)
Tests backend API endpoints directly using Playwright's request context.

**Coverage:**
- Authentication (register, login, logout, token refresh)
- Student CRUD operations
- Teacher management
- Attendance tracking
- Incentive management
- Progress tracking

**Features tested:**
- Request/response validation
- Authentication and authorization
- Error handling
- Data validation
- Pagination
- Filtering and sorting

### 2. E2E Tests (`tests/e2e/`)
Tests complete user journeys from the browser perspective.

**Coverage:**
- User registration and login flows
- Student management (create, read, update, delete)
- Attendance marking (single and bulk)
- Navigation between pages
- Protected routes
- Session persistence

**Features tested:**
- Form validation
- User interactions
- Page navigation
- Data persistence
- Error messages
- Success notifications

### 3. UI Component Tests (`tests/ui/`)
Tests individual UI components and their interactions.

**Coverage:**
- Navigation component
- Dashboard widgets
- Form components and validation
- Modal dialogs
- Table components (sorting, pagination)
- Toast notifications
- Loading states
- Responsive design

**Features tested:**
- Component rendering
- User interactions
- State management
- Accessibility
- Visual regression
- Mobile responsiveness

### 4. PWA Tests (`tests/pwa/`)
Tests Progressive Web App functionality.

**Coverage:**
- Service worker registration
- Offline functionality
- Cache management
- Background sync
- Installability
- Manifest validation

**Features tested:**
- Offline mode
- Data synchronization
- Cache strategies
- IndexedDB storage
- Network resilience
- Installation flow

## Configuration

Tests are configured in `playwright.config.ts` at the project root.

### Key Configuration Options:
- **Base URL**: `http://localhost:5173` (configurable via `BASE_URL` env var)
- **API URL**: `http://localhost:3000/api/v1` (configurable via `API_URL` env var)
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile devices**: Pixel 5, iPhone 12
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML, List, JUnit

## CI/CD Integration

Tests run automatically on GitHub Actions:

### Test Workflow (`.github/workflows/test.yml`)
Runs on every push and pull request:
- Backend unit tests
- Frontend unit tests
- E2E tests with Playwright
- API tests
- Linting
- Build verification

### Scheduled Tests (`.github/workflows/scheduled-tests.yml`)
Runs daily at 2 AM UTC:
- Comprehensive test suite
- Cross-browser testing
- Multiple device testing

## Writing New Tests

### API Test Template
```typescript
import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

test.describe('Your API Feature', () => {
  test('should do something', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/endpoint`, {
      data: { /* your data */ }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('expectedField');
  });
});
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Your Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navigate, etc.
    await page.goto('/your-page');
  });

  test('should perform action', async ({ page }) => {
    await page.click('button:has-text("Action")');
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### PWA Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('PWA Feature', () => {
  test('should work offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Test offline functionality
    await page.reload();
    await expect(page.locator('.offline-indicator')).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clean Data**: Use unique timestamps for test data to avoid conflicts
3. **Meaningful Names**: Use descriptive test names that explain what's being tested
4. **Assertions**: Include clear assertions that verify expected behavior
5. **Error Messages**: Use custom error messages in assertions for better debugging
6. **Page Objects**: Consider using page object pattern for complex pages
7. **Wait Strategies**: Use proper wait strategies instead of hard-coded timeouts
8. **Cleanup**: Clean up test data after tests when possible

## Debugging Tests

### Debug Mode
```bash
# Opens Playwright Inspector for step-by-step debugging
npm run test:e2e:debug
```

### UI Mode
```bash
# Interactive mode with time-travel debugging
npm run test:e2e:ui
```

### Headed Mode
```bash
# See the browser while tests run
npm run test:e2e:headed
```

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots
- Videos
- Traces (for debugging)

Find them in `test-results/` directory.

## Troubleshooting

### Tests failing locally but passing on CI
- Check Node.js version matches CI (20+)
- Ensure database is properly seeded
- Clear browser cache and playwright cache

### Flaky tests
- Add proper wait conditions
- Use `page.waitForLoadState('networkidle')`
- Avoid hard-coded timeouts
- Check for race conditions

### Slow tests
- Run specific test suites instead of all tests
- Use `--workers` flag to control parallelization
- Consider using API setup instead of UI for test data

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Testing Guide](https://playwright.dev/docs/api-testing)
- [Debugging Guide](https://playwright.dev/docs/debug)
