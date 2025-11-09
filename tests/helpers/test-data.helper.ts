/**
 * Helper functions for generating test data
 */

/**
 * Generate a unique email address for testing
 */
export function generateEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}@example.com`;
}

/**
 * Generate a unique phone number for testing
 */
export function generatePhoneNumber(): string {
  const random = Math.floor(Math.random() * 9000000000) + 1000000000;
  return random.toString();
}

/**
 * Generate student test data
 */
export function generateStudentData(overrides: Partial<StudentData> = {}): StudentData {
  const timestamp = Date.now();
  return {
    name: `Test Student ${timestamp}`,
    dateOfBirth: '2015-05-15',
    gender: 'MALE',
    phone: generatePhoneNumber(),
    address: 'Test Address, Test Village',
    school: 'Test School',
    grade: '5',
    parentName: 'Parent Name',
    parentPhone: generatePhoneNumber(),
    ...overrides,
  };
}

export interface StudentData {
  name: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  address?: string;
  school?: string;
  grade?: string;
  parentName?: string;
  parentPhone?: string;
}

/**
 * Generate attendance test data
 */
export function generateAttendanceData(
  studentId: string,
  overrides: Partial<AttendanceData> = {}
): AttendanceData {
  return {
    studentId,
    date: new Date().toISOString().split('T')[0],
    present: true,
    activityType: 'CHESS',
    notes: 'Test attendance',
    ...overrides,
  };
}

export interface AttendanceData {
  studentId: string;
  date: string;
  present: boolean;
  activityType: 'CHESS' | 'YOGA' | 'MEDITATION' | 'FITNESS';
  notes?: string;
}

/**
 * Generate teacher test data
 */
export function generateTeacherData(overrides: Partial<TeacherData> = {}): TeacherData {
  const timestamp = Date.now();
  return {
    name: `Test Teacher ${timestamp}`,
    email: generateEmail('teacher'),
    phone: generatePhoneNumber(),
    specialization: 'Chess Instructor',
    ...overrides,
  };
}

export interface TeacherData {
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
}

/**
 * Wait for a specific amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random string
 */
export function randomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a date string in YYYY-MM-DD format
 */
export function generateDateString(daysFromNow: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Generate bulk student data for testing
 */
export function generateBulkStudentData(count: number): StudentData[] {
  return Array.from({ length: count }, (_, i) => ({
    ...generateStudentData(),
    name: `Bulk Student ${i + 1}`,
  }));
}
