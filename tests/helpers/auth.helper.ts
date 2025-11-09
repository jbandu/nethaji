import { APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

export interface User {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Register a new user and return the authentication token
 */
export async function registerUser(
  request: APIRequestContext,
  user: User
): Promise<AuthResponse> {
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: user,
  });

  if (!response.ok()) {
    const error = await response.json();
    throw new Error(`Registration failed: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Login an existing user and return the authentication token
 */
export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    const error = await response.json();
    throw new Error(`Login failed: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Create a test user with a unique email
 */
export function createTestUser(role: User['role'] = 'TEACHER'): User {
  const timestamp = Date.now();
  return {
    email: `test_${role.toLowerCase()}_${timestamp}@example.com`,
    password: 'Test123!@#',
    name: `Test ${role}`,
    role,
  };
}

/**
 * Create an admin user for testing
 */
export async function createAdminUser(
  request: APIRequestContext
): Promise<AuthResponse> {
  const user = createTestUser('ADMIN');
  return await registerUser(request, user);
}

/**
 * Create a teacher user for testing
 */
export async function createTeacherUser(
  request: APIRequestContext
): Promise<AuthResponse> {
  const user = createTestUser('TEACHER');
  return await registerUser(request, user);
}

/**
 * Create a student user for testing
 */
export async function createStudentUser(
  request: APIRequestContext
): Promise<AuthResponse> {
  const user = createTestUser('STUDENT');
  return await registerUser(request, user);
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(
  request: APIRequestContext,
  token: string
) {
  const response = await request.get(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok()) {
    const error = await response.json();
    throw new Error(`Get current user failed: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Create authorization headers
 */
export function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}
