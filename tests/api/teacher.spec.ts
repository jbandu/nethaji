import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

test.describe('Teacher API', () => {
  let adminToken: string;
  let teacherToken: string;
  let teacherId: string;

  test.beforeAll(async ({ request }) => {
    // Register an admin user
    const adminResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: `admin_teacher_${Date.now()}@example.com`,
        password: 'Admin123!@#',
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
    const adminData = await adminResponse.json();
    adminToken = adminData.token;

    // Register a teacher user
    const teacherResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: `teacher_${Date.now()}@example.com`,
        password: 'Teacher123!@#',
        name: 'Test Teacher',
        role: 'TEACHER'
      }
    });
    const teacherData = await teacherResponse.json();
    teacherToken = teacherData.token;
    teacherId = teacherData.user.id;
  });

  test('GET /teachers - should list all teachers (admin only)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/teachers`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /teachers - should reject non-admin access', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/teachers`, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });

    expect(response.status()).toBe(403);
  });

  test('GET /teachers/:id/performance - should get teacher performance metrics', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/teachers/${teacherId}/performance`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('attendanceMarked');
    expect(data).toHaveProperty('studentsManaged');
    expect(data).toHaveProperty('averageAttendanceRate');
  });

  test('GET /teachers/:id/performance - should allow teacher to view own performance', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/teachers/${teacherId}/performance`, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
  });

  test('POST /teachers/:id/bonus - should award bonus to teacher (admin only)', async ({ request }) => {
    const bonusData = {
      amount: 1000,
      reason: 'Excellent performance in Q1',
      month: '2025-01'
    };

    const response = await request.post(`${API_BASE_URL}/teachers/${teacherId}/bonus`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      data: bonusData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.amount).toBe(bonusData.amount);
    expect(data.reason).toBe(bonusData.reason);
  });

  test('POST /teachers/:id/bonus - should reject non-admin from awarding bonus', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/teachers/${teacherId}/bonus`, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      },
      data: {
        amount: 1000,
        reason: 'Test'
      }
    });

    expect(response.status()).toBe(403);
  });

  test('PUT /teachers/:id - should update teacher profile', async ({ request }) => {
    const updateData = {
      name: 'Updated Teacher Name',
      phone: '9876543210',
      specialization: 'Chess Instructor'
    };

    const response = await request.put(`${API_BASE_URL}/teachers/${teacherId}`, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      },
      data: updateData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.name).toBe(updateData.name);
    expect(data.phone).toBe(updateData.phone);
  });

  test('GET /teachers/:id/students - should get assigned students', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/teachers/${teacherId}/students`, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});
