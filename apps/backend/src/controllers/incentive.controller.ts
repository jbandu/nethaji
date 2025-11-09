import { Request, Response } from 'express';
import prisma from '../config/database';
import { createIncentiveSchema, approveIncentiveSchema, disburseIncentiveSchema } from '../utils/validation';
import { ZodError } from 'zod';

// Create incentive request
export const createIncentive = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = createIncentiveSchema.parse(req.body);

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Check if student already has a pending/approved incentive for this milestone
    const existingIncentive = await prisma.incentive.findFirst({
      where: {
        studentId: validatedData.studentId,
        milestoneType: validatedData.milestoneType,
        approvalStatus: {
          in: ['pending', 'approved', 'disbursed'],
        },
      },
    });

    if (existingIncentive) {
      res.status(400).json({
        error: 'Incentive already exists',
        message: `Student already has a ${existingIncentive.approvalStatus} incentive for this milestone`,
      });
      return;
    }

    // Create incentive
    const incentive = await prisma.incentive.create({
      data: {
        studentId: validatedData.studentId,
        milestoneType: validatedData.milestoneType,
        amount: validatedData.amount,
        weeksCompleted: validatedData.weeksCompleted,
        approvalStatus: 'pending',
      },
      include: {
        student: {
          select: {
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'Incentive request created successfully',
      incentive,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Create incentive error:', error);
    res.status(500).json({ error: 'Failed to create incentive request' });
  }
};

// Get all incentives (with filters)
export const getIncentives = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '50',
      studentId,
      approvalStatus,
      milestoneType,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (studentId) {
      where.studentId = studentId as string;
    }

    if (approvalStatus) {
      where.approvalStatus = approvalStatus as string;
    }

    if (milestoneType) {
      where.milestoneType = milestoneType as string;
    }

    const [incentives, total] = await Promise.all([
      prisma.incentive.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          student: {
            select: {
              user: {
                select: {
                  fullName: true,
                  phone: true,
                },
              },
              enrollmentDate: true,
              streakCount: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.incentive.count({ where }),
    ]);

    res.status(200).json({
      incentives,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get incentives error:', error);
    res.status(500).json({ error: 'Failed to fetch incentives' });
  }
};

// Get pending incentives (admin view)
export const getPendingIncentives = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can view pending approvals
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can view pending incentives' });
      return;
    }

    const pendingIncentives = await prisma.incentive.findMany({
      where: {
        approvalStatus: 'pending',
      },
      include: {
        student: {
          select: {
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
            enrollmentDate: true,
            streakCount: true,
            totalHours: true,
            savingsBalance: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json({
      pendingIncentives,
      summary: {
        total: pendingIncentives.length,
        totalAmount: pendingIncentives.reduce((sum, i) => sum + Number(i.amount), 0),
      },
    });
  } catch (error) {
    console.error('Get pending incentives error:', error);
    res.status(500).json({ error: 'Failed to fetch pending incentives' });
  }
};

// Get single incentive
export const getIncentiveById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const incentive = await prisma.incentive.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
            enrollmentDate: true,
            streakCount: true,
            totalHours: true,
          },
        },
      },
    });

    if (!incentive) {
      res.status(404).json({ error: 'Incentive not found' });
      return;
    }

    res.status(200).json({ incentive });
  } catch (error) {
    console.error('Get incentive by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch incentive' });
  }
};

// Approve incentive (admin only)
export const approveIncentive = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can approve
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can approve incentives' });
      return;
    }

    const validatedData = approveIncentiveSchema.parse(req.body);

    const incentive = await prisma.incentive.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!incentive) {
      res.status(404).json({ error: 'Incentive not found' });
      return;
    }

    if (incentive.approvalStatus !== 'pending') {
      res.status(400).json({
        error: 'Invalid status',
        message: `Incentive is already ${incentive.approvalStatus}`,
      });
      return;
    }

    // Approve and update student savings balance
    const updatedIncentive = await prisma.$transaction(async (tx) => {
      // Update incentive
      const updated = await tx.incentive.update({
        where: { id },
        data: {
          approvalStatus: 'approved',
          approvedBy: req.user!.userId,
          approvedDate: new Date(),
          notes: validatedData.notes,
        },
        include: {
          student: {
            select: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      });

      // Update student savings balance
      await tx.student.update({
        where: { id: incentive.studentId },
        data: {
          savingsBalance: { increment: Number(incentive.amount) },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'approve_incentive',
          entityType: 'incentive',
          entityId: id,
          newValues: {
            studentId: incentive.studentId,
            amount: Number(incentive.amount),
            milestoneType: incentive.milestoneType,
            approvedDate: new Date().toISOString(),
          },
        },
      });

      return updated;
    });

    res.status(200).json({
      message: 'Incentive approved successfully',
      incentive: updatedIncentive,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Approve incentive error:', error);
    res.status(500).json({ error: 'Failed to approve incentive' });
  }
};

// Reject incentive (admin only)
export const rejectIncentive = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can reject
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can reject incentives' });
      return;
    }

    const { notes } = req.body;

    const incentive = await prisma.incentive.findUnique({
      where: { id },
    });

    if (!incentive) {
      res.status(404).json({ error: 'Incentive not found' });
      return;
    }

    if (incentive.approvalStatus !== 'pending') {
      res.status(400).json({
        error: 'Invalid status',
        message: `Incentive is already ${incentive.approvalStatus}`,
      });
      return;
    }

    const updatedIncentive = await prisma.incentive.update({
      where: { id },
      data: {
        approvalStatus: 'rejected',
        approvedBy: req.user.userId,
        approvedDate: new Date(),
        notes,
      },
    });

    res.status(200).json({
      message: 'Incentive rejected',
      incentive: updatedIncentive,
    });
  } catch (error) {
    console.error('Reject incentive error:', error);
    res.status(500).json({ error: 'Failed to reject incentive' });
  }
};

// Mark incentive as disbursed (admin only)
export const disburseIncentive = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can disburse
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can disburse incentives' });
      return;
    }

    const validatedData = disburseIncentiveSchema.parse(req.body);

    const incentive = await prisma.incentive.findUnique({
      where: { id },
    });

    if (!incentive) {
      res.status(404).json({ error: 'Incentive not found' });
      return;
    }

    if (incentive.approvalStatus !== 'approved') {
      res.status(400).json({
        error: 'Invalid status',
        message: 'Only approved incentives can be disbursed',
      });
      return;
    }

    const updatedIncentive = await prisma.$transaction(async (tx) => {
      const updated = await tx.incentive.update({
        where: { id },
        data: {
          approvalStatus: 'disbursed',
          disbursedDate: new Date(),
          disbursementMethod: validatedData.disbursementMethod,
          transactionId: validatedData.transactionId,
          notes: validatedData.notes || incentive.notes,
        },
        include: {
          student: {
            select: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'disburse_incentive',
          entityType: 'incentive',
          entityId: id,
          newValues: {
            amount: Number(incentive.amount),
            disbursementMethod: validatedData.disbursementMethod,
            transactionId: validatedData.transactionId,
            disbursedDate: new Date().toISOString(),
          },
        },
      });

      return updated;
    });

    res.status(200).json({
      message: 'Incentive marked as disbursed successfully',
      incentive: updatedIncentive,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Disburse incentive error:', error);
    res.status(500).json({ error: 'Failed to disburse incentive' });
  }
};

// Check student eligibility for milestone
export const checkMilestoneEligibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Check 16-week streak milestone (₹5,000)
    const eligible16Week = student.streakCount >= 112; // 16 weeks = 112 days

    // Check if already has this milestone
    const existing16Week = await prisma.incentive.findFirst({
      where: {
        studentId,
        milestoneType: '16_week_streak',
        approvalStatus: {
          in: ['pending', 'approved', 'disbursed'],
        },
      },
    });

    const eligibility = {
      studentId,
      studentName: student.user.fullName,
      currentStreak: student.streakCount,
      milestones: {
        '16_week_streak': {
          required: 112,
          current: student.streakCount,
          eligible: eligible16Week && !existing16Week,
          alreadyClaimed: !!existing16Week,
          amount: 5000,
          progress: Math.min(100, Math.round((student.streakCount / 112) * 100)),
        },
      },
    };

    res.status(200).json(eligibility);
  } catch (error) {
    console.error('Check milestone eligibility error:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
};
