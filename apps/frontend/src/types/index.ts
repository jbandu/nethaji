// User types
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: UserRole;
  fullName: string;
  language: 'en' | 'ta' | 'hi';
  villageId: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

// Student types
export interface Student {
  id: string;
  userId: string;
  dob: Date;
  gender: 'male' | 'female' | 'other';
  enrollmentDate: Date;
  assignedTeacherId?: string;
  squadId?: string;
  streakCount: number;
  totalHours: string;
  savingsBalance: string;
  gamificationPoints: number;
  level: number;
  parentPhone?: string;
  schoolName?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  profilePhotoUrl?: string;
  isDropout: boolean;
  user: {
    fullName: string;
    phone: string;
    email?: string;
    language: string;
    village?: {
      id: string;
      name: string;
      district: string;
      state: string;
    };
  };
  assignedTeacher?: {
    id: string;
    user: {
      fullName: string;
      phone: string;
    };
  };
  squad?: {
    id: string;
    name: string;
    totalPoints: number;
  };
}

// Teacher types
export interface Teacher {
  id: string;
  userId: string;
  hireDate: Date;
  employmentType: 'full_time' | 'part_time' | 'volunteer';
  performanceScore: number;
  bonusEligible: boolean;
  totalStudentsManaged: number;
  activeStudentsCount: number;
  specialization?: string;
  certification?: string;
  monthlySalary: number;
  user: {
    fullName: string;
    phone: string;
    email?: string;
    language: string;
  };
}

// Attendance types
export type ActivityType = 'sports' | 'chess' | 'yoga' | 'meditation' | 'strength_training';

export interface Attendance {
  id: string;
  studentId: string;
  teacherId: string;
  date: Date;
  activityType: ActivityType;
  hours: number;
  checkInTime: Date;
  checkOutTime?: Date;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  notes?: string;
  student?: {
    user: {
      fullName: string;
    };
  };
  teacher?: {
    user: {
      fullName: string;
    };
  };
}

// Assessment types
export type AssessmentCategory = 'physical' | 'mental' | 'behavioral' | 'academic';

export interface Assessment {
  id: string;
  studentId: string;
  teacherId: string;
  assessmentDate: Date;
  category: AssessmentCategory;
  metric: string;
  value: string;
  unit?: string;
  notes?: string;
  createdAt: Date;
  student?: {
    user: {
      fullName: string;
    };
  };
  teacher?: {
    user: {
      fullName: string;
    };
  };
}

// Incentive types
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'disbursed';

export interface Incentive {
  id: string;
  studentId: string;
  milestoneType: string;
  amount: string;
  weeksCompleted: number;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedDate?: Date;
  disbursedDate?: Date;
  disbursementMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  student?: {
    user: {
      fullName: string;
      phone: string;
    };
  };
}

// Dashboard types
export interface DashboardStats {
  totalStudents?: number;
  activeStudents?: number;
  totalTeachers?: number;
  todayAttendance?: number;
  avgAttendanceRate?: number;
  totalIncentivesPaid?: number;
  pendingApprovals?: number;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response types
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

export interface ApiSuccess<T = any> {
  message?: string;
  data?: T;
}
