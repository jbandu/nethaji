// Analytics Service
// API calls for admin analytics and reporting

import { apiClient } from '@/lib/api-client';

export interface DashboardOverview {
  students: {
    total: number;
    active: number;
    dropout: number;
    dropoutRate: number;
  };
  teachers: {
    total: number;
    active: number;
  };
  parents: {
    total: number;
  };
  attendance: {
    today: number;
    thisMonth: number;
    rate: number;
  };
  incentives: {
    pending: number;
    approved: number;
    totalAmount: number;
  };
  infrastructure: {
    villages: number;
    squads: number;
  };
  topPerformers: Array<{
    rank: number;
    name: string;
    points: number;
  }>;
  activityBreakdown: Array<{
    activity: string;
    count: number;
    totalHours: number;
  }>;
}

export interface AttendanceTrends {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  daily: Array<{
    date: string;
    count: number;
    totalHours: number;
  }>;
  byActivity: Array<{
    activity: string;
    count: number;
    totalHours: number;
  }>;
  byDayOfWeek: Record<string, number>;
  summary: {
    totalAttendance: number;
    avgDailyAttendance: number;
  };
}

export interface DropoutRiskStudent {
  studentId: string;
  name: string;
  phone: string;
  village: string | null;
  squad: string | null;
  teacher: string | null;
  attendanceLast7Days: number;
  attendanceLast30Days: number;
  currentStreak: number;
  points: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: string[];
}

export interface DropoutRiskAnalysis {
  summary: {
    totalStudents: number;
    atRiskCount: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
  };
  students: DropoutRiskStudent[];
  grouped: {
    critical: DropoutRiskStudent[];
    high: DropoutRiskStudent[];
    medium: DropoutRiskStudent[];
  };
}

export interface BudgetTracking {
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
  monthly: {
    incentives: {
      amount: number;
      count: number;
    };
    salaries: {
      amount: number;
      teacherCount: number;
    };
    pending: {
      amount: number;
      count: number;
    };
    total: number;
  };
  yearly: {
    incentives: {
      amount: number;
      count: number;
    };
    salaries: {
      amount: number;
      teacherCount: number;
    };
    total: number;
  };
  breakdown: {
    incentivesByType: Array<{
      type: string;
      amount: number;
      count: number;
    }>;
    salaryByType: {
      fullTime: number;
      partTime: number;
    };
  };
}

// ============================================================================
// ANALYTICS API CALLS
// ============================================================================

export const getDashboardOverview = async () => {
  const response = await apiClient.get('/analytics/overview');
  return response.data;
};

export const getAttendanceTrends = async (params?: {
  days?: number;
  villageId?: string;
  squadId?: string;
  activityType?: string;
}) => {
  const response = await apiClient.get('/analytics/attendance-trends', { params });
  return response.data;
};

export const getDropoutRisk = async (params?: {
  villageId?: string;
  squadId?: string;
}) => {
  const response = await apiClient.get('/analytics/dropout-risk', { params });
  return response.data;
};

export const getBudgetTracking = async (params?: {
  year?: number;
  month?: number;
}) => {
  const response = await apiClient.get('/analytics/budget', { params });
  return response.data;
};

export const getPerformanceMetrics = async () => {
  const response = await apiClient.get('/analytics/performance');
  return response.data;
};
