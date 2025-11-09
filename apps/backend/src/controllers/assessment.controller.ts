import { Request, Response } from 'express';
import prisma from '../config/database';
import { createAssessmentSchema } from '../utils/validation';
import { ZodError } from 'zod';

// Create assessment
export const createAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only teachers and admins can create assessments
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only teachers and admins can create assessments' });
      return;
    }

    // Validate input
    const validatedData = createAssessmentSchema.parse(req.body);

    // Get teacher ID
    let teacherId: string;
    if (req.user.role === 'admin') {
      // Admin must provide a teacherId or we use the student's assigned teacher
      if (req.body.teacherId) {
        teacherId = req.body.teacherId;
      } else {
        // Use student's assigned teacher if available
        const student = await prisma.student.findUnique({
          where: { id: validatedData.studentId },
        });

        if (!student) {
          res.status(404).json({ error: 'Student not found' });
          return;
        }

        if (!student.assignedTeacherId) {
          res.status(400).json({ error: 'Student has no assigned teacher. Please provide teacherId in request body.' });
          return;
        }

        teacherId = student.assignedTeacherId;
      }
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.userId },
      });

      if (!teacher) {
        res.status(404).json({ error: 'Teacher profile not found' });
        return;
      }
      teacherId = teacher.id;

      // Verify student exists for teacher role
      const student = await prisma.student.findUnique({
        where: { id: validatedData.studentId },
      });

      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }
    }

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        studentId: validatedData.studentId,
        teacherId,
        assessmentDate: new Date(validatedData.assessmentDate),
        category: validatedData.category,
        metric: validatedData.metric,
        value: validatedData.value,
        unit: validatedData.unit,
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
        teacher: {
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

    res.status(201).json({
      message: 'Assessment created successfully',
      assessment,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
};

// Get all assessments (with filters)
export const getAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '50',
      studentId,
      teacherId,
      category,
      metric,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (studentId) {
      where.studentId = studentId as string;
    }

    if (teacherId) {
      where.teacherId = teacherId as string;
    }

    if (category) {
      where.category = category as string;
    }

    if (metric) {
      where.metric = metric as string;
    }

    if (startDate || endDate) {
      where.assessmentDate = {};
      if (startDate) {
        where.assessmentDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.assessmentDate.lte = new Date(endDate as string);
      }
    }

    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        skip,
        take: limitNum,
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
          teacher: {
            select: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: {
          assessmentDate: 'desc',
        },
      }),
      prisma.assessment.count({ where }),
    ]);

    res.status(200).json({
      assessments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
};

// Get single assessment
export const getAssessmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
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
        teacher: {
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

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    res.status(200).json({ assessment });
  } catch (error) {
    console.error('Get assessment by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
};

// Get student assessments
export const getStudentAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { category, metric, startDate, endDate } = req.query;

    const where: any = { studentId };

    if (category) {
      where.category = category as string;
    }

    if (metric) {
      where.metric = metric as string;
    }

    if (startDate || endDate) {
      where.assessmentDate = {};
      if (startDate) {
        where.assessmentDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.assessmentDate.lte = new Date(endDate as string);
      }
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        teacher: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        assessmentDate: 'desc',
      },
    });

    // Group by category for summary
    const byCategory = assessments.reduce((acc: any, a) => {
      if (!acc[a.category]) {
        acc[a.category] = [];
      }
      acc[a.category].push(a);
      return acc;
    }, {});

    // Latest metrics for each category
    const latestMetrics: any = {};
    Object.keys(byCategory).forEach((cat) => {
      latestMetrics[cat] = {};
      byCategory[cat].forEach((a: any) => {
        if (!latestMetrics[cat][a.metric] ||
            new Date(a.assessmentDate) > new Date(latestMetrics[cat][a.metric].assessmentDate)) {
          latestMetrics[cat][a.metric] = {
            value: a.value,
            unit: a.unit,
            assessmentDate: a.assessmentDate,
            teacher: a.teacher.user.fullName,
          };
        }
      });
    });

    res.status(200).json({
      assessments,
      summary: {
        totalAssessments: assessments.length,
        byCategory,
        latestMetrics,
      },
    });
  } catch (error) {
    console.error('Get student assessments error:', error);
    res.status(500).json({ error: 'Failed to fetch student assessments' });
  }
};

// Get student progress over time for a specific metric
export const getStudentProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { metric, startDate, endDate } = req.query;

    if (!metric) {
      res.status(400).json({ error: 'Metric parameter is required' });
      return;
    }

    const where: any = {
      studentId,
      metric: metric as string,
    };

    if (startDate || endDate) {
      where.assessmentDate = {};
      if (startDate) {
        where.assessmentDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.assessmentDate.lte = new Date(endDate as string);
      }
    }

    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: {
        assessmentDate: 'asc',
      },
      select: {
        id: true,
        assessmentDate: true,
        value: true,
        unit: true,
        notes: true,
      },
    });

    if (assessments.length === 0) {
      res.status(404).json({ error: 'No assessments found for this metric' });
      return;
    }

    // Calculate trend
    const first = assessments[0];
    const last = assessments[assessments.length - 1];
    const trend = {
      initial: first.value,
      current: last.value,
      change: assessments.length > 1 ? 'improved' : 'no_data',
      dataPoints: assessments.length,
    };

    res.status(200).json({
      metric: metric as string,
      unit: first.unit,
      progress: assessments,
      trend,
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({ error: 'Failed to fetch student progress' });
  }
};

// Update assessment
export const updateAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only teachers and admins can update
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only teachers and admins can update assessments' });
      return;
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    // Teachers can only update their own assessments
    if (req.user.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.userId },
      });

      if (assessment.teacherId !== teacher?.id) {
        res.status(403).json({ error: 'You can only update your own assessments' });
        return;
      }
    }

    const { value, unit, notes } = req.body;

    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: {
        value: value !== undefined ? value : undefined,
        unit,
        notes,
      },
    });

    res.status(200).json({
      message: 'Assessment updated successfully',
      assessment: updatedAssessment,
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
};

// Delete assessment (admin only)
export const deleteAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can delete
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can delete assessments' });
      return;
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    await prisma.assessment.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
};
