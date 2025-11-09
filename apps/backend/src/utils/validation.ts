import { z } from 'zod';
import { UserRole, Gender, EmploymentType } from '@prisma/client';

// Common schemas
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number');
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Auth schemas
export const registerSchema = z.object({
  phone: phoneSchema,
  email: emailSchema.optional(),
  password: passwordSchema,
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole),
  language: z.enum(['en', 'ta', 'hi']).default('en'),
  villageId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// Student schemas
export const createStudentSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  fullName: z.string().min(2),
  dob: z.string().datetime(),
  gender: z.nativeEnum(Gender),
  enrollmentDate: z.string().datetime(),
  assignedTeacherId: z.string().uuid().optional(),
  squadId: z.string().uuid().optional(),
  parentPhone: phoneSchema.optional(),
  schoolName: z.string().optional(),
  emergencyContact: phoneSchema.optional(),
  medicalNotes: z.string().optional(),
  villageId: z.string().uuid(),
  language: z.enum(['en', 'ta', 'hi']).default('en'),
});

export const updateStudentSchema = createStudentSchema.partial();

// Teacher schemas
export const createTeacherSchema = z.object({
  phone: phoneSchema,
  email: emailSchema.optional(),
  password: passwordSchema,
  fullName: z.string().min(2),
  hireDate: z.string().datetime(),
  employmentType: z.nativeEnum(EmploymentType),
  specialization: z.string().optional(),
  certification: z.string().optional(),
  bankAccount: z.string().optional(),
  ifscCode: z.string().optional(),
  monthlySalary: z.number().min(0),
  villageId: z.string().uuid(),
  language: z.enum(['en', 'ta', 'hi']).default('en'),
});

export const updateTeacherSchema = createTeacherSchema.partial();

// Attendance schemas
export const createAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  date: z.string().datetime(),
  activityType: z.enum(['sports', 'chess', 'yoga', 'meditation', 'strength_training']),
  hours: z.number().min(0.5).max(8),
  checkInTime: z.string().datetime(),
  checkOutTime: z.string().datetime().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  photoUrl: z.string().url().optional(),
  notes: z.string().optional(),
  offlineId: z.string().optional(),
});

export const bulkAttendanceSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
  date: z.string().datetime(),
  activityType: z.enum(['sports', 'chess', 'yoga', 'meditation', 'strength_training']),
  hours: z.number().min(0.5).max(8),
  checkInTime: z.string().datetime(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  photoUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

// Assessment schemas
export const createAssessmentSchema = z.object({
  studentId: z.string().uuid(),
  assessmentDate: z.string().datetime(),
  category: z.enum(['physical', 'mental', 'behavioral', 'academic']),
  metric: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

// Incentive schemas
export const createIncentiveSchema = z.object({
  studentId: z.string().uuid(),
  milestoneType: z.string(),
  amount: z.number().min(0),
  weeksCompleted: z.number().min(0),
});

export const approveIncentiveSchema = z.object({
  notes: z.string().optional(),
});

export const disburseIncentiveSchema = z.object({
  disbursementMethod: z.string(),
  transactionId: z.string(),
  notes: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
