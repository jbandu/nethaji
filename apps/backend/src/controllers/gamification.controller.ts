// Gamification Controller
// Handles badges, leaderboard, and challenges

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ============================================================================
// BADGES
// ============================================================================

/**
 * GET /api/v1/gamification/badges
 * Get all available badges
 * Access: All authenticated users
 */
export const getAllBadges = async (req: Request, res: Response) => {
  try {
    const { type, rarity } = req.query;

    const badges = await prisma.badge.findMany({
      where: {
        ...(type && { badgeType: type as any }),
        ...(rarity && { rarity: rarity as any }),
      },
      orderBy: [
        { rarity: 'desc' },
        { pointsValue: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: badges,
      count: badges.length,
    });
  } catch (error: any) {
    console.error('Get all badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch badges',
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/gamification/badges/student/:studentId
 * Get badges earned by a specific student
 * Access: Student (own), Teacher (assigned students), Admin
 */
export const getStudentBadges = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const user = (req as any).user;

    // Authorization check
    if (user.role === 'student' && user.student?.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Can only view own badges',
      });
    }

    if (user.role === 'teacher') {
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          assignedTeacherId: user.teacher?.id,
        },
      });

      if (!student) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not your assigned student',
        });
      }
    }

    // Get student badges with badge details
    const studentBadges = await prisma.studentBadge.findMany({
      where: { studentId },
      include: {
        badge: true,
      },
      orderBy: { earnedDate: 'desc' },
    });

    // Get total points from badges
    const totalBadgePoints = studentBadges.reduce(
      (sum, sb) => sum + sb.badge.pointsValue,
      0
    );

    res.json({
      success: true,
      data: {
        badges: studentBadges,
        totalBadgePoints,
        badgeCount: studentBadges.length,
      },
    });
  } catch (error: any) {
    console.error('Get student badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student badges',
      error: error.message,
    });
  }
};

/**
 * POST /api/v1/gamification/badges/award
 * Award a badge to a student
 * Access: Teacher, Admin
 */
export const awardBadge = async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      studentId: z.string().uuid(),
      badgeId: z.string().uuid(),
    });

    const { studentId, badgeId } = schema.parse(req.body);
    const user = (req as any).user;

    // Check if badge exists
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found',
      });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Authorization for teachers
    if (user.role === 'teacher' && student.assignedTeacherId !== user.teacher?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not your assigned student',
      });
    }

    // Check if student already has this badge
    const existingBadge = await prisma.studentBadge.findUnique({
      where: {
        studentId_badgeId: {
          studentId,
          badgeId,
        },
      },
    });

    if (existingBadge) {
      return res.status(400).json({
        success: false,
        message: 'Student already has this badge',
      });
    }

    // Award badge and update student points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create student badge
      const studentBadge = await tx.studentBadge.create({
        data: {
          studentId,
          badgeId,
        },
        include: {
          badge: true,
        },
      });

      // Update student gamification points
      await tx.student.update({
        where: { id: studentId },
        data: {
          gamificationPoints: {
            increment: badge.pointsValue,
          },
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: student.userId,
          type: 'push',
          category: 'achievement',
          title: '🎖️ New Badge Earned!',
          message: `Congratulations! You've earned the "${badge.name}" badge!`,
          data: {
            badgeId: badge.id,
            badgeName: badge.name,
            points: badge.pointsValue,
          },
        },
      });

      return studentBadge;
    });

    res.status(201).json({
      success: true,
      message: 'Badge awarded successfully',
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Award badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award badge',
      error: error.message,
    });
  }
};

// ============================================================================
// LEADERBOARD
// ============================================================================

/**
 * GET /api/v1/gamification/leaderboard
 * Get leaderboard by gamification points
 * Access: All authenticated users
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const {
      limit = '50',
      villageId,
      squadId,
      timeframe = 'all', // all, month, week
    } = req.query;

    const limitNum = parseInt(limit as string);

    // Build where clause
    const where: any = {
      isDropout: false,
    };

    if (villageId) {
      where.user = { villageId: villageId as string };
    }

    if (squadId) {
      where.squadId = squadId as string;
    }

    // Get top students by points
    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        gamificationPoints: true,
        level: true,
        streakCount: true,
        user: {
          select: {
            fullName: true,
            village: {
              select: {
                name: true,
              },
            },
          },
        },
        squad: {
          select: {
            name: true,
          },
        },
        studentBadges: {
          select: {
            badge: {
              select: {
                rarity: true,
              },
            },
          },
        },
      },
      orderBy: [
        { gamificationPoints: 'desc' },
        { level: 'desc' },
        { streakCount: 'desc' },
      ],
      take: limitNum,
    });

    // Add rank to each student
    const leaderboard = students.map((student, index) => ({
      rank: index + 1,
      studentId: student.id,
      name: student.user.fullName,
      village: student.user.village?.name,
      squad: student.squad?.name,
      points: student.gamificationPoints,
      level: student.level,
      streak: student.streakCount,
      badgeCount: student.studentBadges.length,
      legendaryBadges: student.studentBadges.filter(
        (sb) => sb.badge.rarity === 'legendary'
      ).length,
    }));

    // Get squad leaderboard
    const squads = await prisma.squad.findMany({
      where: villageId ? { villageId: villageId as string } : {},
      select: {
        id: true,
        name: true,
        totalPoints: true,
        village: {
          select: {
            name: true,
          },
        },
        students: {
          where: { isDropout: false },
          select: {
            id: true,
            gamificationPoints: true,
          },
        },
      },
      orderBy: { totalPoints: 'desc' },
      take: 10,
    });

    const squadLeaderboard = squads.map((squad, index) => ({
      rank: index + 1,
      squadId: squad.id,
      name: squad.name,
      village: squad.village.name,
      points: squad.totalPoints,
      memberCount: squad.students.length,
      avgPointsPerMember: squad.students.length > 0
        ? Math.round(squad.totalPoints / squad.students.length)
        : 0,
    }));

    res.json({
      success: true,
      data: {
        students: leaderboard,
        squads: squadLeaderboard,
      },
    });
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message,
    });
  }
};

// ============================================================================
// CHALLENGES
// ============================================================================

/**
 * GET /api/v1/gamification/challenges
 * Get active challenges
 * Access: All authenticated users
 */
export const getActiveChallenges = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const challenges = await prisma.dailyChallenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: today },
        endDate: { gte: today },
        ...(type && { challengeType: type as any }),
      },
      orderBy: { startDate: 'desc' },
    });

    res.json({
      success: true,
      data: challenges,
      count: challenges.length,
    });
  } catch (error: any) {
    console.error('Get active challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenges',
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/gamification/challenges/student/:studentId
 * Get student's challenges and their progress
 * Access: Student (own), Teacher (assigned students), Admin
 */
export const getStudentChallenges = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const user = (req as any).user;

    // Authorization check
    if (user.role === 'student' && user.student?.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Can only view own challenges',
      });
    }

    if (user.role === 'teacher') {
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          assignedTeacherId: user.teacher?.id,
        },
      });

      if (!student) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not your assigned student',
        });
      }
    }

    // Get student challenges
    const studentChallenges = await prisma.studentChallenge.findMany({
      where: { studentId },
      include: {
        challenge: true,
      },
      orderBy: { challenge: { startDate: 'desc' } },
    });

    // Group by status
    const grouped = {
      in_progress: studentChallenges.filter((sc) => sc.status === 'in_progress'),
      completed: studentChallenges.filter((sc) => sc.status === 'completed'),
      failed: studentChallenges.filter((sc) => sc.status === 'failed'),
    };

    // Calculate stats
    const stats = {
      totalChallenges: studentChallenges.length,
      completed: grouped.completed.length,
      inProgress: grouped.in_progress.length,
      failed: grouped.failed.length,
      totalPointsEarned: studentChallenges.reduce((sum, sc) => sum + sc.pointsEarned, 0),
      completionRate: studentChallenges.length > 0
        ? Math.round((grouped.completed.length / studentChallenges.length) * 100)
        : 0,
    };

    res.json({
      success: true,
      data: {
        challenges: studentChallenges,
        grouped,
        stats,
      },
    });
  } catch (error: any) {
    console.error('Get student challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student challenges',
      error: error.message,
    });
  }
};

/**
 * POST /api/v1/gamification/challenges/:challengeId/enroll
 * Enroll student in a challenge
 * Access: Student (self-enrollment), Teacher, Admin
 */
export const enrollInChallenge = async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const schema = z.object({
      studentId: z.string().uuid(),
    });

    const { studentId } = schema.parse(req.body);
    const user = (req as any).user;

    // Authorization check
    if (user.role === 'student' && user.student?.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Can only enroll yourself',
      });
    }

    // Check if challenge exists and is active
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    if (!challenge.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Challenge is not active',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (challenge.endDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Challenge has ended',
      });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.studentChallenge.findFirst({
      where: {
        studentId,
        challengeId,
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this challenge',
      });
    }

    // Enroll student
    const studentChallenge = await prisma.studentChallenge.create({
      data: {
        studentId,
        challengeId,
        status: 'in_progress',
      },
      include: {
        challenge: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Enrolled in challenge successfully',
      data: studentChallenge,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Enroll in challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in challenge',
      error: error.message,
    });
  }
};

/**
 * PUT /api/v1/gamification/challenges/:challengeId/complete
 * Mark a challenge as complete
 * Access: Teacher, Admin
 */
export const completeChallenge = async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const schema = z.object({
      studentId: z.string().uuid(),
      progress: z.string().optional(),
    });

    const { studentId, progress } = schema.parse(req.body);
    const user = (req as any).user;

    // Find student challenge
    const studentChallenge = await prisma.studentChallenge.findFirst({
      where: {
        studentId,
        challengeId,
      },
      include: {
        challenge: true,
        student: true,
      },
    });

    if (!studentChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Student is not enrolled in this challenge',
      });
    }

    if (studentChallenge.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Challenge already completed',
      });
    }

    // Authorization for teachers
    if (
      user.role === 'teacher' &&
      studentChallenge.student.assignedTeacherId !== user.teacher?.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not your assigned student',
      });
    }

    // Complete challenge and update student points
    const result = await prisma.$transaction(async (tx) => {
      // Update challenge status
      const updated = await tx.studentChallenge.update({
        where: { id: studentChallenge.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          pointsEarned: studentChallenge.challenge.pointsReward,
          progress,
        },
        include: {
          challenge: true,
        },
      });

      // Update student points
      await tx.student.update({
        where: { id: studentId },
        data: {
          gamificationPoints: {
            increment: studentChallenge.challenge.pointsReward,
          },
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: studentChallenge.student.userId,
          type: 'push',
          category: 'achievement',
          title: '🏆 Challenge Completed!',
          message: `You completed "${studentChallenge.challenge.title}" and earned ${studentChallenge.challenge.pointsReward} points!`,
          data: {
            challengeId: studentChallenge.challenge.id,
            challengeTitle: studentChallenge.challenge.title,
            points: studentChallenge.challenge.pointsReward,
          },
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: 'Challenge completed successfully',
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Complete challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete challenge',
      error: error.message,
    });
  }
};
