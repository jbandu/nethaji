// Analytics Controller
// Handles admin analytics, reporting, and insights

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================

/**
 * GET /api/v1/analytics/overview
 * Get admin dashboard overview with key metrics
 * Access: Admin only
 */
export const getDashboardOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    // Only admin can access
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin only',
      });
    }

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    // Run all queries in parallel
    const [
      totalStudents,
      activeStudents,
      dropoutStudents,
      totalTeachers,
      activeTeachers,
      totalParents,
      attendanceToday,
      attendanceThisMonth,
      pendingIncentives,
      approvedIncentives,
      totalIncentiveAmount,
      topPerformers,
      villages,
      squads,
    ] = await Promise.all([
      // Student metrics
      prisma.student.count(),
      prisma.student.count({ where: { isDropout: false } }),
      prisma.student.count({ where: { isDropout: true } }),

      // Teacher metrics
      prisma.teacher.count(),
      prisma.teacher.count({
        where: { user: { isActive: true } },
      }),

      // Parent metrics
      prisma.parent.count(),

      // Attendance metrics
      prisma.attendance.count({
        where: { date: today },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: thisMonth },
        },
      }),

      // Incentive metrics
      prisma.incentive.count({
        where: { approvalStatus: 'pending' },
      }),
      prisma.incentive.count({
        where: { approvalStatus: 'approved' },
      }),
      prisma.incentive.aggregate({
        _sum: { amount: true },
        where: {
          approvalStatus: { in: ['approved', 'disbursed'] },
        },
      }),

      // Top performers (by points)
      prisma.student.findMany({
        where: { isDropout: false },
        select: {
          id: true,
          gamificationPoints: true,
          user: { select: { fullName: true } },
        },
        orderBy: { gamificationPoints: 'desc' },
        take: 5,
      }),

      // Village count
      prisma.village.count(),

      // Squad count
      prisma.squad.count(),
    ]);

    // Calculate dropout rate
    const dropoutRate = totalStudents > 0
      ? ((dropoutStudents / totalStudents) * 100).toFixed(2)
      : '0.00';

    // Get attendance rate for active students
    const attendanceRate = activeStudents > 0
      ? ((attendanceToday / activeStudents) * 100).toFixed(2)
      : '0.00';

    // Activity breakdown this month
    const activityBreakdown = await prisma.attendance.groupBy({
      by: ['activityType'],
      where: {
        date: { gte: thisMonth },
      },
      _count: { id: true },
      _sum: { hours: true },
    });

    const overview = {
      students: {
        total: totalStudents,
        active: activeStudents,
        dropout: dropoutStudents,
        dropoutRate: parseFloat(dropoutRate),
      },
      teachers: {
        total: totalTeachers,
        active: activeTeachers,
      },
      parents: {
        total: totalParents,
      },
      attendance: {
        today: attendanceToday,
        thisMonth: attendanceThisMonth,
        rate: parseFloat(attendanceRate),
      },
      incentives: {
        pending: pendingIncentives,
        approved: approvedIncentives,
        totalAmount: totalIncentiveAmount._sum.amount || 0,
      },
      infrastructure: {
        villages,
        squads,
      },
      topPerformers: topPerformers.map((s, idx) => ({
        rank: idx + 1,
        name: s.user.fullName,
        points: s.gamificationPoints,
      })),
      activityBreakdown: activityBreakdown.map((a) => ({
        activity: a.activityType,
        count: a._count.id,
        totalHours: a._sum.hours || 0,
      })),
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview',
      error: error.message,
    });
  }
};

// ============================================================================
// ATTENDANCE ANALYTICS
// ============================================================================

/**
 * GET /api/v1/analytics/attendance-trends
 * Get attendance trends over time
 * Access: Admin, Teacher (own students)
 */
export const getAttendanceTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const {
      days = '30',
      villageId,
      squadId,
      activityType,
    } = req.query;

    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    startDate.setHours(0, 0, 0, 0);

    // Build where clause
    const where: any = {
      date: { gte: startDate },
    };

    if (villageId) {
      where.student = {
        user: { villageId: villageId as string },
      };
    }

    if (squadId) {
      where.student = { ...where.student, squadId: squadId as string };
    }

    if (activityType) {
      where.activityType = activityType as any;
    }

    // For teachers, filter to their assigned students
    if (user.role === 'teacher') {
      where.teacherId = user.teacher?.id;
    }

    // Get daily attendance counts
    const dailyAttendance = await prisma.attendance.groupBy({
      by: ['date'],
      where,
      _count: { id: true },
      _sum: { hours: true },
      orderBy: { date: 'asc' },
    });

    // Get attendance by activity type
    const byActivity = await prisma.attendance.groupBy({
      by: ['activityType'],
      where,
      _count: { id: true },
      _sum: { hours: true },
    });

    // Get attendance by day of week
    const allAttendance = await prisma.attendance.findMany({
      where,
      select: { date: true },
    });

    const byDayOfWeek = allAttendance.reduce((acc: any, a) => {
      const day = new Date(a.date).getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[day];
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {});

    // Calculate average daily attendance
    const totalDays = dailyAttendance.length;
    const totalAttendance = dailyAttendance.reduce((sum, d) => sum + d._count.id, 0);
    const avgDailyAttendance = totalDays > 0 ? (totalAttendance / totalDays).toFixed(2) : '0';

    res.json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          days: daysNum,
        },
        daily: dailyAttendance.map((d) => ({
          date: d.date,
          count: d._count.id,
          totalHours: d._sum.hours || 0,
        })),
        byActivity: byActivity.map((a) => ({
          activity: a.activityType,
          count: a._count.id,
          totalHours: a._sum.hours || 0,
        })),
        byDayOfWeek,
        summary: {
          totalAttendance,
          avgDailyAttendance: parseFloat(avgDailyAttendance),
        },
      },
    });
  } catch (error: any) {
    console.error('Get attendance trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance trends',
      error: error.message,
    });
  }
};

// ============================================================================
// DROPOUT RISK ANALYSIS
// ============================================================================

/**
 * GET /api/v1/analytics/dropout-risk
 * Identify students at risk of dropping out
 * Access: Admin, Teacher
 */
export const getDropoutRisk = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { villageId, squadId } = req.query;

    // Calculate date ranges
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    // Build base where clause
    const studentWhere: any = {
      isDropout: false,
    };

    if (villageId) {
      studentWhere.user = { villageId: villageId as string };
    }

    if (squadId) {
      studentWhere.squadId = squadId as string;
    }

    // For teachers, filter to assigned students
    if (user.role === 'teacher') {
      studentWhere.assignedTeacherId = user.teacher?.id;
    }

    // Get all active students with attendance data
    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
            village: { select: { name: true } },
          },
        },
        squad: { select: { name: true } },
        assignedTeacher: {
          select: {
            user: { select: { fullName: true } },
          },
        },
        attendance: {
          where: {
            date: { gte: last30Days },
          },
          select: {
            date: true,
            activityType: true,
          },
        },
      },
    });

    // Analyze risk factors for each student
    const riskAnalysis = students.map((student) => {
      const attendanceLast7Days = student.attendance.filter(
        (a) => new Date(a.date) >= last7Days
      ).length;
      const attendanceLast30Days = student.attendance.length;

      // Risk factors
      const riskFactors = [];
      let riskScore = 0;

      // No attendance in last 7 days (Critical)
      if (attendanceLast7Days === 0) {
        riskFactors.push('No attendance in last 7 days');
        riskScore += 40;
      }

      // Low attendance in last 30 days (High)
      if (attendanceLast30Days < 8) { // Less than 8 days in a month
        riskFactors.push('Low attendance (< 8 days in 30 days)');
        riskScore += 30;
      }

      // Streak broken (Medium)
      if (student.streakCount === 0) {
        riskFactors.push('Zero streak');
        riskScore += 15;
      }

      // Low engagement (Medium)
      if (student.gamificationPoints < 100) {
        riskFactors.push('Low engagement (< 100 points)');
        riskScore += 15;
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore >= 60) riskLevel = 'critical';
      else if (riskScore >= 40) riskLevel = 'high';
      else if (riskScore >= 20) riskLevel = 'medium';
      else riskLevel = 'low';

      return {
        studentId: student.id,
        name: student.user.fullName,
        phone: student.user.phone,
        village: student.user.village?.name,
        squad: student.squad?.name,
        teacher: student.assignedTeacher?.user.fullName,
        attendanceLast7Days,
        attendanceLast30Days,
        currentStreak: student.streakCount,
        points: student.gamificationPoints,
        riskLevel,
        riskScore,
        riskFactors,
      };
    });

    // Filter to only at-risk students (medium or higher)
    const atRisk = riskAnalysis.filter(
      (s) => s.riskLevel !== 'low'
    );

    // Sort by risk score
    atRisk.sort((a, b) => b.riskScore - a.riskScore);

    // Group by risk level
    const grouped = {
      critical: atRisk.filter((s) => s.riskLevel === 'critical'),
      high: atRisk.filter((s) => s.riskLevel === 'high'),
      medium: atRisk.filter((s) => s.riskLevel === 'medium'),
    };

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents: students.length,
          atRiskCount: atRisk.length,
          criticalCount: grouped.critical.length,
          highCount: grouped.high.length,
          mediumCount: grouped.medium.length,
        },
        students: atRisk,
        grouped,
      },
    });
  } catch (error: any) {
    console.error('Get dropout risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dropout risk analysis',
      error: error.message,
    });
  }
};

// ============================================================================
// BUDGET TRACKING
// ============================================================================

/**
 * GET /api/v1/analytics/budget
 * Get budget tracking and financial overview
 * Access: Admin only
 */
export const getBudgetTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    // Only admin can access
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin only',
      });
    }

    const { year, month } = req.query;

    // Get current date or specified period
    const now = new Date();
    const targetYear = year ? parseInt(year as string) : now.getFullYear();
    const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth();

    const periodStart = new Date(targetYear, targetMonth, 1);
    const periodEnd = new Date(targetYear, targetMonth + 1, 0);
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31);

    // Run all queries in parallel
    const [
      // Incentive payments
      incentivesThisMonth,
      incentivesThisYear,
      incentivesPending,

      // Teacher salaries
      activeTeachers,

      // Breakdown by milestone type
      incentivesByType,
    ] = await Promise.all([
      // Monthly incentives
      prisma.incentive.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          approvalStatus: { in: ['approved', 'disbursed'] },
          approvedDate: { gte: periodStart, lte: periodEnd },
        },
      }),

      // Yearly incentives
      prisma.incentive.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          approvalStatus: { in: ['approved', 'disbursed'] },
          approvedDate: { gte: yearStart, lte: yearEnd },
        },
      }),

      // Pending incentives
      prisma.incentive.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          approvalStatus: 'pending',
        },
      }),

      // Active teachers for salary calculation
      prisma.teacher.findMany({
        where: { user: { isActive: true } },
        select: {
          monthlySalary: true,
          employmentType: true,
        },
      }),

      // Breakdown by milestone type
      prisma.incentive.groupBy({
        by: ['milestoneType'],
        where: {
          approvalStatus: { in: ['approved', 'disbursed'] },
          approvedDate: { gte: yearStart, lte: yearEnd },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Calculate teacher salaries
    const totalMonthlySalaries = activeTeachers.reduce(
      (sum, t) => sum + parseFloat(t.monthlySalary.toString()),
      0
    );
    const totalYearlySalaries = totalMonthlySalaries * 12;

    // Calculate totals
    const monthlyIncentives = incentivesThisMonth._sum.amount || 0;
    const yearlyIncentives = incentivesThisYear._sum.amount || 0;
    const pendingIncentives = incentivesPending._sum.amount || 0;

    const monthlyTotal = parseFloat(monthlyIncentives.toString()) + totalMonthlySalaries;
    const yearlyTotal = parseFloat(yearlyIncentives.toString()) + totalYearlySalaries;

    // Budget breakdown
    const budget = {
      period: {
        month: targetMonth + 1,
        year: targetYear,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      },
      monthly: {
        incentives: {
          amount: monthlyIncentives,
          count: incentivesThisMonth._count.id,
        },
        salaries: {
          amount: totalMonthlySalaries,
          teacherCount: activeTeachers.length,
        },
        pending: {
          amount: pendingIncentives,
          count: incentivesPending._count.id,
        },
        total: monthlyTotal,
      },
      yearly: {
        incentives: {
          amount: yearlyIncentives,
          count: incentivesThisYear._count.id,
        },
        salaries: {
          amount: totalYearlySalaries,
          teacherCount: activeTeachers.length,
        },
        total: yearlyTotal,
      },
      breakdown: {
        incentivesByType: incentivesByType.map((i) => ({
          type: i.milestoneType,
          amount: i._sum.amount || 0,
          count: i._count.id,
        })),
        salaryByType: {
          fullTime: activeTeachers.filter((t) => t.employmentType === 'full_time').length,
          partTime: activeTeachers.filter((t) => t.employmentType === 'part_time').length,
        },
      },
    };

    res.json({
      success: true,
      data: budget,
    });
  } catch (error: any) {
    console.error('Get budget tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget tracking',
      error: error.message,
    });
  }
};

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * GET /api/v1/analytics/performance
 * Get overall program performance metrics
 * Access: Admin only
 */
export const getPerformanceMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    // Only admin can access
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin only',
      });
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get metrics
    const [
      // Student growth
      studentsThisMonth,
      studentsLastMonth,
      dropoutsThisMonth,

      // Engagement metrics
      avgPoints,
      avgStreak,
      totalBadgesEarned,
      activeChallenges,

      // Teacher performance
      topTeachers,
    ] = await Promise.all([
      // Student counts
      prisma.student.count({
        where: {
          createdAt: { gte: thisMonth, lte: thisMonthEnd },
        },
      }),
      prisma.student.count({
        where: {
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
      prisma.student.count({
        where: {
          isDropout: true,
          dropoutDate: { gte: thisMonth, lte: thisMonthEnd },
        },
      }),

      // Engagement
      prisma.student.aggregate({
        _avg: { gamificationPoints: true, streakCount: true },
        where: { isDropout: false },
      }),
      prisma.student.aggregate({
        _avg: { streakCount: true },
        where: { isDropout: false },
      }),
      prisma.studentBadge.count({
        where: {
          earnedDate: { gte: thisMonth },
        },
      }),
      prisma.studentChallenge.count({
        where: { status: 'in_progress' },
      }),

      // Top teachers
      prisma.teacher.findMany({
        where: { user: { isActive: true } },
        select: {
          id: true,
          performanceScore: true,
          user: { select: { fullName: true } },
          activeStudentsCount: true,
        },
        orderBy: { performanceScore: 'desc' },
        take: 5,
      }),
    ]);

    const metrics = {
      studentGrowth: {
        thisMonth: studentsThisMonth,
        lastMonth: studentsLastMonth,
        growth: studentsLastMonth > 0
          ? (((studentsThisMonth - studentsLastMonth) / studentsLastMonth) * 100).toFixed(2)
          : '0',
      },
      dropouts: {
        thisMonth: dropoutsThisMonth,
      },
      engagement: {
        avgPoints: avgPoints._avg.gamificationPoints || 0,
        avgStreak: avgStreak._avg.streakCount || 0,
        badgesEarned: totalBadgesEarned,
        activeChallenges,
      },
      topTeachers: topTeachers.map((t, idx) => ({
        rank: idx + 1,
        name: t.user.fullName,
        performanceScore: t.performanceScore,
        activeStudents: t.activeStudentsCount,
      })),
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance metrics',
      error: error.message,
    });
  }
};
