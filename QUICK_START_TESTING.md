# Quick Start: Testing with Playwright

**Status:** ✅ Ready to use (after fixing port 3000)

## TL;DR

```bash
# 1. Fix port 3000
pkill -f openedai && npm run dev:backend

# 2. Run tests
npm run test:api

# 3. View results
npm run test:e2e:report
```

## What's Installed

- **Playwright v1.56.1** - Test framework
- **27 API tests** - Authentication, Students, Teachers
- **100+ total test cases** - Across all browsers
- **3 GitHub Actions** - Automated CI/CD
- **Complete documentation** - 5 guide files

## Available Commands

```bash
# API Tests (backend only, no frontend needed)
npm run test:api

# All E2E Tests (needs backend + frontend)
npm run test:e2e

# Interactive UI Mode (best for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Debug mode with inspector
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

## First Time Setup

### 1. Start Backend Server

```bash
# Kill what's on port 3000
pkill -f openedai

# OR manually:
sudo fuser -k 3000/tcp

# Start your Nethaji backend
cd /home/jbandu/nethaji
npm run dev:backend
```

**Verify it's working:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Run Your First Test

```bash
# Run all API tests
npm run test:api

# Or run single test file
npx playwright test tests/api/auth.spec.ts --headed
```

### 3. View Results

```bash
# Open HTML report
npm run test:e2e:report

# Or check console output
# Tests will show ✓ (pass) or ✗ (fail)
```

## Common Issues

### Issue: Tests get HTML instead of JSON

**Problem:** Wrong app on port 3000
**Fix:** Kill Open WebUI, start Nethaji backend

### Issue: 405 Method Not Allowed

**Problem:** Backend not running or wrong port
**Fix:** Check `npm run dev:backend` is running

### Issue: Tests expect email, API uses phone

**Problem:** Test data mismatch
**Fix:** See `DIAGNOSIS_AND_FIX.md` for updates needed

## Test Structure

```
tests/
├── api/              # API endpoint tests (works now)
│   ├── auth.spec.ts
│   ├── student.spec.ts
│   └── teacher.spec.ts
├── e2e/              # Full user flows (needs frontend)
│   ├── authentication.spec.ts
│   ├── student-management.spec.ts
│   └── attendance.spec.ts
├── ui/               # Component tests (needs frontend)
│   └── components.spec.ts
├── pwa/              # Offline tests (needs frontend)
│   └── offline.spec.ts
└── helpers/          # Test utilities
    ├── auth.helper.ts
    └── test-data.helper.ts
```

## Documentation

1. **QUICK_START_TESTING.md** ← You are here
2. **DIAGNOSIS_AND_FIX.md** - Port 3000 issue & API schema fixes
3. **tests/GETTING_STARTED.md** - Detailed setup guide
4. **tests/README.md** - Complete documentation (600+ lines)
5. **TESTING_SETUP_SUMMARY.md** - Overview of everything

## GitHub Actions

Workflows run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Daily at 2 AM UTC

View results at: `https://github.com/YOUR_USERNAME/nethaji/actions`

## Quick Debug

### Test not working?

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check test in UI mode:**
   ```bash
   npm run test:e2e:ui
   ```

3. **Check logs:**
   ```bash
   npm run test:api 2>&1 | tee test-output.log
   ```

### Tests failing?

1. **Check test reports:**
   - Open `playwright-report/index.html` in browser
   - Screenshots in `test-results/`

2. **Debug single test:**
   ```bash
   npx playwright test tests/api/auth.spec.ts --debug
   ```

3. **Check API schema:**
   - Review `apps/backend/src/utils/validation.ts`
   - Compare with test data in `tests/api/*.spec.ts`

## Next Steps

### Immediate
- [ ] Fix port 3000 (kill Open WebUI)
- [ ] Start Nethaji backend
- [ ] Run `npm run test:api`
- [ ] Fix test data schemas (phone vs email)

### Short Term
- [ ] Update test fixtures to match API
- [ ] Implement frontend source code
- [ ] Run full E2E tests
- [ ] Review and fix failing tests

### Long Term
- [ ] Add more test coverage
- [ ] Set up test data seeding
- [ ] Configure CI/CD secrets
- [ ] Add visual regression tests

## Pro Tips

1. **Use UI mode for development:**
   ```bash
   npm run test:e2e:ui
   ```
   Best way to debug and understand tests

2. **Run specific browser:**
   ```bash
   npx playwright test --project=chromium
   npx playwright test --project=firefox
   ```

3. **Filter tests by name:**
   ```bash
   npx playwright test --grep "authentication"
   ```

4. **Update snapshots:**
   ```bash
   npx playwright test --update-snapshots
   ```

5. **Generate code:**
   ```bash
   npx playwright codegen http://localhost:5173
   ```
   Records your actions and generates test code!

## Support

- **Issues:** See `DIAGNOSIS_AND_FIX.md`
- **API Schema:** Check `apps/backend/src/utils/validation.ts`
- **Examples:** Look at existing test files
- **Playwright Docs:** https://playwright.dev

---

**Status:** Infrastructure complete ✅ | Backend fix needed ⚠️ | Ready to test! 🚀
