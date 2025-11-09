import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { createTeacherSchema, updateTeacherSchema } from '../utils/validation';
import { ZodError } from 'zod';

// Get all teachers (with filters and pagination)
export const getAllTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      villageId,
      employmentType,
      bonusEligible,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (villageId) {
      where.user = { villageId: villageId as string };
    }

    if (employmentType) {
      where.employmentType = employmentType as string;
    }

    if (bonusEligible !== undefined) {
      where.bonusEligible = bonusEligible === 'true';
    }

    if (search) {
      where.user = {
        ...where.user,
        fullName: { contains: search as string, mode: 'insensitive' },
      };
    }

    // Fetch teachers with pagination
    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              fullName: true,
              language: true,
              isActive: true,
              village: {
                select: {
                  id: true,
                  name: true,
                  district: true,
                  state: true,
                },
              },
            },
          },
          assignedStudents: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.teacher.count({ where }),
    ]);

    res.status(200).json({
      teachers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get all teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

// Get single teacher by ID
export const getTeacherById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            fullName: true,
            language: true,
            isActive: true,
            createdAt: true,
            village: {
              select: {
                id: true,
                name: true,
                district: true,
                state: true,
              },
            },
          },
        },
        assignedStudents: {
          where: {
            isDropout: false,
          },
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
            streakCount: true,
            totalHours: true,
            gamificationPoints: true,
          },
        },
        performanceLogs: {
          orderBy: {
            month: 'desc',
          },
          take: 6,
        },
      },
    });

    if (!teacher) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }

    res.status(200).json({ teacher });
  } catch (error) {
    console.error('Get teacher by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
};

// Create new teacher
export const createTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can create teachers
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can create teachers' });
      return;
    }

    // Validate input
    const validatedData = createTeacherSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: validatedData.phone },
          { email: validatedData.email || undefined },
        ],
      },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this phone or email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user and teacher in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          phone: validatedData.phone,
          email: validatedData.email,
          passwordHash,
          role: 'teacher',
          fullName: validatedData.fullName,
          language: validatedData.language,
          villageId: validatedData.villageId,
        },
      });

      // Create teacher
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          hireDate: new Date(validatedData.hireDate),
          employmentType: validatedData.employmentType,
          specialization: validatedData.specialization,
          certification: validatedData.certification,
          bankAccount: validatedData.bankAccount,
          ifscCode: validatedData.ifscCode,
          monthlySalary: validatedData.monthlySalary,
        },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              fullName: true,
              language: true,
              village: {
                select: {
                  name: true,
                  district: true,
                },
              },
            },
          },
        },
      });

      return teacher;
    });

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
};

// Update teacher
export const updateTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can update teachers
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can update teachers' });
      return;
    }

    // Validate input
    const validatedData = updateTeacherSchema.partial().parse(req.body);

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingTeacher) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }

    // Update in transaction
    const updatedTeacher = await prisma.$transaction(async (tx) => {
      // Update user if user-related fields are present
      if (validatedData.phone || validatedData.email || validatedData.fullName || validatedData.language || validatedData.villageId) {
        await tx.user.update({
          where: { id: existingTeacher.userId },
          data: {
            phone: validatedData.phone,
            email: validatedData.email,
            fullName: validatedData.fullName,
            language: validatedData.language,
            villageId: validatedData.villageId,
          },
        });
      }

      // Update teacher
      const teacher = await tx.teacher.update({
        where: { id },
        data: {
          hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : undefined,
          employmentType: validatedData.employmentType,
          specialization: validatedData.specialization,
          certification: validatedData.certification,
          bankAccount: validatedData.bankAccount,
          ifscCode: validatedData.ifscCode,
          monthlySalary: validatedData.monthlySalary,
        },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              fullName: true,
              language: true,
            },
          },
        },
      });

      return teacher;
    });

    res.status(200).json({
      message: 'Teacher updated successfully',
      teacher: updatedTeacher,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Update teacher error:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
};

// Deactivate teacher (soft delete)
export const deactivateTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can deactivate
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can deactivate teachers' });
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Deactivate user account
      await tx.user.update({
        where: { id: teacher.userId },
        data: { isActive: false },
      });

      // Unassign all students
      await tx.student.updateMany({
        where: { assignedTeacherId: id },
        data: { assignedTeacherId: null },
      });

      // Update teacher record
      await tx.teacher.update({
        where: { id },
        data: {
          activeStudentsCount: 0,
        },
      });
    });

    res.status(200).json({ message: 'Teacher deactivated successfully' });
  } catch (error) {
    console.error('Deactivate teacher error:', error);
    res.status(500).json({ error: 'Failed to deactivate teacher' });
  }
};

// Get teacher performance metrics
export const getTeacherPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { months = '6' } = req.query;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!teacher) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }

    // Get performance logs
    const performanceLogs = await prisma.teacherPerformanceLog.findMany({
      where: { teacherId: id },
      orderBy: { month: 'desc' },
      take: parseInt(months as string),
    });

    // Get current month stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalAttendanceLogged, activeStudents] = await Promise.all([
      prisma.attendance.count({
        where: {
          teacherId: id,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.student.count({
        where: {
          assignedTeacherId: id,
          isDropout: false,
        },
      }),
    ]);

    res.status(200).json({
      teacher: {
        id: teacher.id,
        name: teacher.user.fullName,
        performanceScore: teacher.performanceScore,
        bonusEligible: teacher.bonusEligible,
        activeStudentsCount: teacher.activeStudentsCount,
        totalStudentsManaged: teacher.totalStudentsManaged,
        specialization: teacher.specialization,
      },
      currentMonth: {
        attendanceLogged: totalAttendanceLogged,
        activeStudents,
      },
      performanceHistory: performanceLogs,
    });
  } catch (error) {
    console.error('Get teacher performance error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher performance' });
  }
};

// Award bonus to teacher
export const awardBonus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;

    // Only admin can award bonuses
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can award bonuses' });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid bonus amount is required' });
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!teacher) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }

    // Update teacher with bonus date
    await prisma.teacher.update({
      where: { id },
      data: {
        lastBonusDate: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'award_teacher_bonus',
        entityType: 'teacher',
        entityId: id,
        newValues: {
          amount,
          notes,
          teacherName: teacher.user.fullName,
          date: new Date().toISOString(),
        },
      },
    });

    res.status(200).json({
      message: 'Bonus awarded successfully',
      bonus: {
        teacherId: id,
        teacherName: teacher.user.fullName,
        amount,
        date: new Date(),
        notes,
      },
    });
  } catch (error) {
    console.error('Award bonus error:', error);
    res.status(500).json({ error: 'Failed to award bonus' });
  }
};

// Get teacher's assigned students
export const getTeacherStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeDropouts = 'false' } = req.query;

    const where: any = { assignedTeacherId: id };

    if (includeDropouts !== 'true') {
      where.isDropout = false;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        squad: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    res.status(200).json({ students });
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// Calculate and update teacher performance score
export const calculatePerformanceScore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can trigger performance calculation
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can calculate performance scores' });
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }

    // Get last 30 days data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [attendanceCount, activeStudents, totalAssignedStudents] = await Promise.all([
      prisma.attendance.count({
        where: {
          teacherId: id,
          date: { gte: thirtyDaysAgo },
        },
      }),
      prisma.student.count({
        where: {
          assignedTeacherId: id,
          isDropout: false,
        },
      }),
      prisma.student.count({
        where: {
          assignedTeacherId: id,
        },
      }),
    ]);

    // Calculate metrics
    const attendanceCompletionRate = activeStudents > 0 ? (attendanceCount / (activeStudents * 30)) * 100 : 0;
    const studentRetentionRate = totalAssignedStudents > 0 ? (activeStudents / totalAssignedStudents) * 100 : 100;

    // Simple performance score: average of completion and retention
    const performanceScore = (attendanceCompletionRate * 0.6 + studentRetentionRate * 0.4);
    const finalScore = Math.min(100, Math.max(0, performanceScore));

    // Determine bonus eligibility (score >= 90)
    const bonusEligible = finalScore >= 90;

    // Update teacher
    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: {
        performanceScore: finalScore,
        bonusEligible,
        activeStudentsCount: activeStudents,
      },
    });

    res.status(200).json({
      message: 'Performance score calculated successfully',
      performance: {
        score: finalScore,
        bonusEligible,
        metrics: {
          attendanceCompletionRate: Math.round(attendanceCompletionRate * 10) / 10,
          studentRetentionRate: Math.round(studentRetentionRate * 10) / 10,
          activeStudents,
          totalAttendanceLogged: attendanceCount,
        },
      },
    });
  } catch (error) {
    console.error('Calculate performance score error:', error);
    res.status(500).json({ error: 'Failed to calculate performance score' });
  }
};
