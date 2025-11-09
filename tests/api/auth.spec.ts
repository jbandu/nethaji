import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

test.describe('Authentication API', () => {
  let authToken: string;
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User',
    role: 'TEACHER'
  };

  test('POST /auth/register - should register a new user', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: testUser
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');
    expect(data.user.email).toBe(testUser.email);

    authToken = data.token;
  });

  test('POST /auth/register - should reject duplicate email', async ({ request }) => {
    // First registration
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: testUser
    });

    // Attempt duplicate registration
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: testUser
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('already exists');
  });

  test('POST /auth/register - should validate required fields', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: 'test@example.com'
        // Missing password, name, role
      }
    });

    expect(response.status()).toBe(400);
  });

  test('POST /auth/login - should login with valid credentials', async ({ request }) => {
    // First register a user
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: testUser
    });

    // Then login
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');
    expect(data.user.email).toBe(testUser.email);
  });

  test('POST /auth/login - should reject invalid credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: testUser.email,
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('Invalid credentials');
  });

  test('POST /auth/login - should reject non-existent user', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: 'nonexistent@example.com',
        password: 'password123'
      }
    });

    expect(response.status()).toBe(401);
  });

  test('GET /auth/me - should return current user with valid token', async ({ request }) => {
    // First register and login
    const loginResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: testUser
    });
    const { token } = await loginResponse.json();

    // Get current user
    const response = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.email).toBe(testUser.email);
    expect(data.name).toBe(testUser.name);
  });

  test('GET /auth/me - should reject without token', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/auth/me`);
    expect(response.status()).toBe(401);
  });

  test('GET /auth/me - should reject with invalid token', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': 'Bearer invalid_token'
      }
    });
    expect(response.status()).toBe(401);
  });

  test('POST /auth/refresh - should refresh token', async ({ request }) => {
    // First register
    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: testUser
    });
    const { token } = await registerResponse.json();

    // Refresh token
    const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data.token).not.toBe(token);
  });
});
