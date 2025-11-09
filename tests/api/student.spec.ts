import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

test.describe('Student API', () => {
  let authToken: string;
  let studentId: string;

  test.beforeAll(async ({ request }) => {
    // Register an admin user for testing
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email: `admin_${Date.now()}@example.com`,
        password: 'Admin123!@#',
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
    const data = await response.json();
    authToken = data.token;
  });

  test('POST /students - should create a new student (admin only)', async ({ request }) => {
    const newStudent = {
      name: 'Test Student',
      dateOfBirth: '2015-05-15',
      gender: 'MALE',
      phone: '9876543210',
      address: 'Test Address, Test Village',
      school: 'Test School',
      grade: '5',
      parentName: 'Parent Name',
      parentPhone: '9876543211'
    };

    const response = await request.post(`${API_BASE_URL}/students`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: newStudent
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe(newStudent.name);
    expect(data.phone).toBe(newStudent.phone);

    studentId = data.id;
  });

  test('POST /students - should reject without authentication', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/students`, {
      data: {
        name: 'Test Student',
        dateOfBirth: '2015-05-15'
      }
    });

    expect(response.status()).toBe(401);
  });

  test('GET /students - should list all students', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/students`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('GET /students - should support pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/students?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('students');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
  });

  test('GET /students/:id - should get student by ID', async ({ request }) => {
    // First create a student
    const createResponse = await request.post(`${API_BASE_URL}/students`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        name: 'Test Student 2',
        dateOfBirth: '2015-05-15',
        gender: 'FEMALE'
      }
    });
    const student = await createResponse.json();

    // Get student by ID
    const response = await request.get(`${API_BASE_URL}/students/${student.id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.id).toBe(student.id);
    expect(data.name).toBe(student.name);
  });

  test('GET /students/:id - should return 404 for non-existent student', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/students/99999`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(404);
  });

  test('PUT /students/:id - should update student details', async ({ request }) => {
    // First create a student
    const createResponse = await request.post(`${API_BASE_URL}/students`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        name: 'Original Name',
        dateOfBirth: '2015-05-15',
        gender: 'MALE'
      }
    });
    const student = await createResponse.json();

    // Update student
    const updateData = {
      name: 'Updated Name',
      school: 'Updated School'
    };

    const response = await request.put(`${API_BASE_URL}/students/${student.id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: updateData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.name).toBe(updateData.name);
    expect(data.school).toBe(updateData.school);
  });

  test('DELETE /students/:id - should delete a student (admin only)', async ({ request }) => {
    // First create a student
    const createResponse = await request.post(`${API_BASE_URL}/students`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        name: 'To Delete',
        dateOfBirth: '2015-05-15',
        gender: 'MALE'
      }
    });
    const student = await createResponse.json();

    // Delete student
    const response = await request.delete(`${API_BASE_URL}/students/${student.id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    // Verify deletion
    const getResponse = await request.get(`${API_BASE_URL}/students/${student.id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    expect(getResponse.status()).toBe(404);
  });

  test('GET /students/:id/progress - should get student progress', async ({ request }) => {
    // First create a student
    const createResponse = await request.post(`${API_BASE_URL}/students`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        name: 'Progress Test',
        dateOfBirth: '2015-05-15',
        gender: 'MALE'
      }
    });
    const student = await createResponse.json();

    // Get progress
    const response = await request.get(`${API_BASE_URL}/students/${student.id}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('attendanceRate');
    expect(data).toHaveProperty('streakDays');
    expect(data).toHaveProperty('badges');
  });
});
