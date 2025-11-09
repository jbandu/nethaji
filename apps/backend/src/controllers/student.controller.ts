import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { createStudentSchema, updateStudentSchema } from '../utils/validation';
import { ZodError } from 'zod';

// Get all students (with filters and pagination)
export const getAllStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      villageId,
      teacherId,
      squadId,
      isDropout,
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

    if (teacherId) {
      where.assignedTeacherId = teacherId as string;
    }

    if (squadId) {
      where.squadId = squadId as string;
    }

    if (isDropout !== undefined) {
      where.isDropout = isDropout === 'true';
    }

    if (search) {
      where.user = {
        ...where.user,
        fullName: { contains: search as string, mode: 'insensitive' },
      };
    }

    // Fetch students with pagination
    const [students, total] = await Promise.all([
      prisma.student.findMany({
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
          assignedTeacher: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
          squad: {
            select: {
              id: true,
              name: true,
              totalPoints: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.student.count({ where }),
    ]);

    res.status(200).json({
      students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// Get single student by ID
export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
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
        assignedTeacher: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                phone: true,
                email: true,
              },
            },
            specialization: true,
          },
        },
        squad: {
          select: {
            id: true,
            name: true,
            totalPoints: true,
            captainStudentId: true,
          },
        },
        studentParents: {
          include: {
            parent: {
              select: {
                id: true,
                phone: true,
                fullName: true,
                relationship: true,
                whatsappEnabled: true,
                smsEnabled: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.status(200).json({ student });
  } catch (error) {
    console.error('Get student by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

// Create new student
export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can create students
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can create students' });
      return;
    }

    // Validate input
    const validatedData = createStudentSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: validatedData.phone },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this phone already exists' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user and student in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          phone: validatedData.phone,
          passwordHash,
          role: 'student',
          fullName: validatedData.fullName,
          language: validatedData.language,
          villageId: validatedData.villageId,
        },
      });

      // Create student
      const student = await tx.student.create({
        data: {
          userId: user.id,
          dob: new Date(validatedData.dob),
          gender: validatedData.gender,
          enrollmentDate: new Date(validatedData.enrollmentDate),
          assignedTeacherId: validatedData.assignedTeacherId,
          squadId: validatedData.squadId,
          parentPhone: validatedData.parentPhone,
          schoolName: validatedData.schoolName,
          emergencyContact: validatedData.emergencyContact,
          medicalNotes: validatedData.medicalNotes,
        },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
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

      // Update teacher's active student count if assigned
      if (validatedData.assignedTeacherId) {
        await tx.teacher.update({
          where: { id: validatedData.assignedTeacherId },
          data: {
            activeStudentsCount: { increment: 1 },
            totalStudentsManaged: { increment: 1 },
          },
        });
      }

      return student;
    });

    res.status(201).json({
      message: 'Student created successfully',
      student: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
};

// Update student
export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin and assigned teacher can update
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      res.status(403).json({ error: 'Only admins and teachers can update students' });
      return;
    }

    // Validate input
    const validatedData = updateStudentSchema.partial().parse(req.body);

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingStudent) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Teachers can only update their assigned students
    if (req.user?.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.userId },
      });

      if (existingStudent.assignedTeacherId !== teacher?.id) {
        res.status(403).json({ error: 'You can only update your assigned students' });
        return;
      }
    }

    // Update in transaction
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Update user if user-related fields are present
      if (validatedData.phone || validatedData.fullName || validatedData.language || validatedData.villageId) {
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: {
            phone: validatedData.phone,
            fullName: validatedData.fullName,
            language: validatedData.language,
            villageId: validatedData.villageId,
          },
        });
      }

      // Update student
      const student = await tx.student.update({
        where: { id },
        data: {
          dob: validatedData.dob ? new Date(validatedData.dob) : undefined,
          gender: validatedData.gender,
          assignedTeacherId: validatedData.assignedTeacherId,
          squadId: validatedData.squadId,
          parentPhone: validatedData.parentPhone,
          schoolName: validatedData.schoolName,
          emergencyContact: validatedData.emergencyContact,
          medicalNotes: validatedData.medicalNotes,
        },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              fullName: true,
              language: true,
            },
          },
        },
      });

      return student;
    });

    res.status(200).json({
      message: 'Student updated successfully',
      student: updatedStudent,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

// Deactivate student (soft delete)
export const deactivateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can deactivate
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can deactivate students' });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Mark as dropout
      await tx.student.update({
        where: { id },
        data: {
          isDropout: true,
          dropoutDate: new Date(),
        },
      });

      // Deactivate user account
      await tx.user.update({
        where: { id: student.userId },
        data: { isActive: false },
      });

      // Decrement teacher's active student count
      if (student.assignedTeacherId) {
        await tx.teacher.update({
          where: { id: student.assignedTeacherId },
          data: { activeStudentsCount: { decrement: 1 } },
        });
      }
    });

    res.status(200).json({ message: 'Student deactivated successfully' });
  } catch (error) {
    console.error('Deactivate student error:', error);
    res.status(500).json({ error: 'Failed to deactivate student' });
  }
};

// Get student dashboard/progress data
export const getStudentDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            village: {
              select: { name: true },
            },
          },
        },
        squad: {
          select: {
            name: true,
            totalPoints: true,
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Get recent attendance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAttendance = await prisma.attendance.findMany({
      where: {
        studentId: id,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'desc' },
      take: 30,
    });

    // Get recent assessments
    const recentAssessments = await prisma.assessment.findMany({
      where: { studentId: id },
      orderBy: { assessmentDate: 'desc' },
      take: 10,
      include: {
        teacher: {
          select: {
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    // Get earned badges
    const badges = await prisma.studentBadge.findMany({
      where: { studentId: id },
      include: {
        badge: true,
      },
      orderBy: { earnedDate: 'desc' },
    });

    // Get active challenges
    const activeChallenges = await prisma.studentChallenge.findMany({
      where: {
        studentId: id,
        status: { in: ['in_progress', 'completed'] },
      },
      include: {
        challenge: true,
      },
    });

    // Get incentives
    const incentives = await prisma.incentive.findMany({
      where: { studentId: id },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const attendanceRate = recentAttendance.length > 0
      ? (recentAttendance.length / 30) * 100
      : 0;

    const activityBreakdown = recentAttendance.reduce((acc: any, att) => {
      acc[att.activityType] = (acc[att.activityType] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      student: {
        id: student.id,
        name: student.user.fullName,
        village: student.user.village?.name,
        squad: student.squad?.name,
        level: student.level,
        points: student.gamificationPoints,
        streakCount: student.streakCount,
        totalHours: student.totalHours,
        savingsBalance: student.savingsBalance,
      },
      stats: {
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        totalDaysAttended: recentAttendance.length,
        activityBreakdown,
      },
      recentAttendance: recentAttendance.slice(0, 10),
      recentAssessments,
      badges,
      activeChallenges,
      incentives,
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch student dashboard' });
  }
};

// Get student attendance history
export const getStudentAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate, activityType } = req.query;

    const where: any = { studentId: id };

    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate as string) };
    }

    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate as string) };
    }

    if (activityType) {
      where.activityType = activityType as string;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        teacher: {
          select: {
            user: {
              select: { fullName: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.status(200).json({ attendance });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// Get student assessments
export const getStudentAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    const where: any = { studentId: id };

    if (category) {
      where.category = category as string;
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        teacher: {
          select: {
            user: {
              select: { fullName: true },
            },
          },
        },
      },
      orderBy: { assessmentDate: 'desc' },
    });

    res.status(200).json({ assessments });
  } catch (error) {
    console.error('Get student assessments error:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
};
