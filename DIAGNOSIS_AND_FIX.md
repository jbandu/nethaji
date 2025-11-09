# Test Failure Diagnosis & Fix Guide

**Date:** 2025-11-09
**Issue:** Playwright tests failing due to incorrect backend server

## Problem Summary

### 🔴 Main Issue
**Port 3000 is occupied by "Open WebUI"** (a Svelte application), not the Nethaji backend API.

### Evidence
```bash
$ curl http://localhost:3000/api/v1/auth/register
<!doctype html>
<html lang="en">
  <head>
    <title>Open WebUI</title>
    ...
```

This returns HTML from Open WebUI, not JSON from your API.

## Root Causes

1. **Wrong application on port 3000**
   - Expected: Nethaji Express backend
   - Actual: Open WebUI (Svelte app)

2. **Backend not running**
   - The `apps/backend` server is not actually running
   - Some other Node processes detected, but not the correct backend

3. **API schema mismatch** (Secondary issue)
   - Tests expect: `{email, password, name, role}`
   - API actually uses: `{phone, email (optional), fullName, role, language, villageId}`

## How to Fix

### Step 1: Stop the Conflicting Application

```bash
# Find what's on port 3000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill <PID>

# Or use pkill
pkill -f "Open WebUI"
```

### Step 2: Start the Correct Backend

```bash
# From project root
cd /home/jbandu/nethaji

# Start the backend on port 3000
npm run dev:backend
```

You should see:
```
🚀 Nethaji API Server running
📍 Port: 3000
🌍 Environment: development
🔗 URL: http://localhost:3000
```

### Step 3: Verify Backend is Running

```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return JSON like:
# {"status":"ok","timestamp":"...","environment":"development"}
```

### Step 4: Update Tests to Match API Schema

The tests need to be updated to match your actual API schema.

#### Current API Schema (from validation.ts)

**Registration:**
```typescript
{
  phone: string,          // Required: E.164 format
  email?: string,         // Optional
  password: string,       // Min 8 chars, letter + number
  fullName: string,       // Min 2 chars
  role: 'admin' | 'teacher' | 'student' | 'parent',
  language?: 'en' | 'ta' | 'hi',  // Default: 'en'
  villageId?: string      // UUID, optional
}
```

**Login:**
```typescript
{
  phone: string,          // Required
  password: string        // Required
}
```

#### Test Updates Needed

Tests currently send:
```typescript
{
  email: "test@example.com",
  password: "Test123!@#",
  name: "Test User",
  role: "TEACHER"
}
```

Should send:
```typescript
{
  phone: "+919876543210",      // Changed
  email: "test@example.com",
  password: "Test123!@#",
  fullName: "Test User",       // Changed from 'name'
  role: "teacher",             // Changed to lowercase
  language: "en"
}
```

## Quick Fix Steps

### Option A: Kill Port 3000 and Restart Backend

```bash
# 1. Kill what's on port 3000
sudo fuser -k 3000/tcp

# 2. Start backend
cd /home/jbandu/nethaji
npm run dev:backend

# 3. Verify it's working
curl http://localhost:3000/health

# 4. Run tests
npm run test:api
```

### Option B: Use Different Port for Backend

If you need Open WebUI to stay running:

```bash
# Edit apps/backend/src/index.ts or set env var
export PORT=3001

# Start backend on port 3001
npm run dev:backend

# Update test configuration
export API_URL=http://localhost:3001/api/v1

# Run tests
npm run test:api
```

## Test Configuration Updates Needed

### 1. Update API Test Schema

Create file: `tests/fixtures/test-data.ts`
```typescript
export function generateTestUser(role: 'admin' | 'teacher' | 'student' | 'parent') {
  const timestamp = Date.now();
  return {
    phone: `+9198765${timestamp % 100000}`,  // Valid Indian mobile
    email: `test_${role}_${timestamp}@example.com`,
    password: 'Test123!@#',
    fullName: `Test ${role}`,
    role: role.toLowerCase(),
    language: 'en' as const
  };
}
```

### 2. Update Auth Tests

Replace in `tests/api/auth.spec.ts`:
```typescript
const testUser = {
  phone: `+919876543${Date.now() % 1000}`,
  email: `test_${Date.now()}@example.com`,
  password: 'Test123!@#',
  fullName: 'Test User',
  role: 'teacher',  // lowercase
  language: 'en'
};
```

### 3. Update Login Tests

```typescript
// Login uses phone, not email
const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
  data: {
    phone: testUser.phone,  // Changed from email
    password: testUser.password
  }
});
```

## Verification Checklist

After fixes, verify:

- [ ] Port 3000 shows Nethaji backend (not Open WebUI)
- [ ] `curl http://localhost:3000/health` returns JSON
- [ ] `curl http://localhost:3000/` returns Nethaji API info
- [ ] Registration endpoint accepts correct fields
- [ ] Tests use `phone` instead of `email` for login
- [ ] Tests use `fullName` instead of `name`
- [ ] Tests use lowercase role values

## Expected Test Results After Fix

Once backend is running correctly:
```
Running 27 tests using 6 workers

✓ POST /auth/register - should register a new user
✓ POST /auth/login - should login with valid credentials
✓ GET /auth/me - should return current user
... (more passing tests)
```

## Additional Notes

### API Response Format

Your API returns:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "phone": "+919876543210",
    "email": "test@example.com",
    "role": "teacher",
    "fullName": "Test User",
    "language": "en",
    "villageId": null,
    "createdAt": "2025-11-09T..."
  },
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

Tests should expect this format, not just `{token, user}`.

### Student API Considerations

Student creation requires:
- `phone`, `password`, `fullName`, `dob`, `gender`
- `enrollmentDate`, `villageId`
- Optional: `assignedTeacherId`, `squadId`, `parentPhone`, etc.

Current tests are too simplified and need updating.

## Next Steps

1. **Immediate:** Kill port 3000 and start correct backend
2. **Short term:** Update test fixtures to match API schema
3. **Medium term:** Create comprehensive API documentation
4. **Long term:** Add OpenAPI/Swagger spec for API contract

## Files to Update

1. `tests/api/auth.spec.ts` - Fix auth test data
2. `tests/api/student.spec.ts` - Fix student schema
3. `tests/api/teacher.spec.ts` - Fix teacher schema
4. `tests/helpers/test-data.helper.ts` - Update generators
5. `playwright-api.config.ts` - Verify correct port

## References

- Backend validation: `apps/backend/src/utils/validation.ts`
- Auth controller: `apps/backend/src/controllers/auth.controller.ts`
- API routes: `apps/backend/src/routes/*.routes.ts`

---

**TL;DR:** Stop Open WebUI on port 3000, start Nethaji backend, update test data to use `phone` instead of `email` and `fullName` instead of `name`.
