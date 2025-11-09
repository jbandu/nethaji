import { Request, Response } from 'express';
import prisma from '../config/database';
import { createAttendanceSchema, bulkAttendanceSchema } from '../utils/validation';
import { ZodError } from 'zod';

// Helper: Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Helper: Verify GPS coordinates are within geofence
async function verifyGeofence(
  latitude: number,
  longitude: number,
  villageId: string
): Promise<boolean> {
  const village = await prisma.village.findUnique({
    where: { id: villageId },
  });

  if (!village || !village.latitude || !village.longitude) {
    return true; // Skip verification if village has no coordinates
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    Number(village.latitude),
    Number(village.longitude)
  );

  return distance <= village.geofenceRadius;
}

// Helper: Update student streak
async function updateStudentStreak(studentId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if student attended yesterday
  const yesterdayAttendance = await prisma.attendance.findFirst({
    where: {
      studentId,
      date: yesterday,
    },
  });

  // Get today's attendance
  const todayAttendance = await prisma.attendance.findFirst({
    where: {
      studentId,
      date: today,
    },
  });

  if (todayAttendance) {
    // If attended today
    if (yesterdayAttendance) {
      // Continue streak
      await prisma.student.update({
        where: { id: studentId },
        data: { streakCount: { increment: 1 } },
      });
    } else {
      // Start new streak
      await prisma.student.update({
        where: { id: studentId },
        data: { streakCount: 1 },
      });
    }
  }
}

// Mark single attendance
export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only teachers and admins can mark attendance
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only teachers and admins can mark attendance' });
      return;
    }

    // Validate input
    const validatedData = createAttendanceSchema.parse(req.body);

    // Get teacher ID
    let teacherId: string;
    if (req.user.role === 'admin') {
      // Admin must provide teacher ID or we use a default
      teacherId = req.body.teacherId || req.user.userId;
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.userId },
      });

      if (!teacher) {
        res.status(404).json({ error: 'Teacher profile not found' });
        return;
      }
      teacherId = teacher.id;
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      include: { user: { include: { village: true } } },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Verify GPS if provided
    if (validatedData.latitude && validatedData.longitude && student.user.villageId) {
      const isWithinGeofence = await verifyGeofence(
        validatedData.latitude,
        validatedData.longitude,
        student.user.villageId
      );

      if (!isWithinGeofence) {
        res.status(400).json({
          error: 'Location verification failed',
          message: 'You are outside the designated area for this village',
        });
        return;
      }
    }

    // Check for duplicate attendance (same student, date, activity type)
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: validatedData.studentId,
        date: new Date(validatedData.date),
        activityType: validatedData.activityType,
      },
    });

    if (existingAttendance) {
      res.status(400).json({
        error: 'Attendance already marked',
        message: 'This student already has attendance marked for this activity today',
      });
      return;
    }

    // Create attendance record
    const attendance = await prisma.$transaction(async (tx) => {
      const record = await tx.attendance.create({
        data: {
          studentId: validatedData.studentId,
          teacherId,
          date: new Date(validatedData.date),
          activityType: validatedData.activityType,
          hours: validatedData.hours,
          checkInTime: new Date(validatedData.checkInTime),
          checkOutTime: validatedData.checkOutTime
            ? new Date(validatedData.checkOutTime)
            : null,
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          photoUrl: validatedData.photoUrl,
          notes: validatedData.notes,
          offlineId: validatedData.offlineId,
          syncStatus: 'synced',
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

      // Update student's total hours
      await tx.student.update({
        where: { id: validatedData.studentId },
        data: {
          totalHours: { increment: validatedData.hours },
        },
      });

      return record;
    });

    // Update streak (async, don't wait)
    updateStudentStreak(validatedData.studentId).catch(console.error);

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// Mark bulk attendance (multiple students at once)
export const markBulkAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only teachers and admins can mark attendance
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only teachers and admins can mark attendance' });
      return;
    }

    // Validate input
    const validatedData = bulkAttendanceSchema.parse(req.body);

    // Get teacher ID
    let teacherId: string;
    if (req.user.role === 'admin') {
      teacherId = req.body.teacherId || req.user.userId;
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.userId },
      });

      if (!teacher) {
        res.status(404).json({ error: 'Teacher profile not found' });
        return;
      }
      teacherId = teacher.id;
    }

    // Verify all students exist
    const students = await prisma.student.findMany({
      where: {
        id: { in: validatedData.studentIds },
      },
      include: { user: true },
    });

    if (students.length !== validatedData.studentIds.length) {
      res.status(400).json({ error: 'One or more students not found' });
      return;
    }

    // Create attendance records in transaction
    const results = await prisma.$transaction(async (tx) => {
      const createdRecords = [];
      const errors = [];

      for (const studentId of validatedData.studentIds) {
        try {
          // Check for duplicate
          const existing = await tx.attendance.findFirst({
            where: {
              studentId,
              date: new Date(validatedData.date),
              activityType: validatedData.activityType,
            },
          });

          if (existing) {
            errors.push({
              studentId,
              error: 'Attendance already marked for this activity',
            });
            continue;
          }

          // Create record
          const record = await tx.attendance.create({
            data: {
              studentId,
              teacherId,
              date: new Date(validatedData.date),
              activityType: validatedData.activityType,
              hours: validatedData.hours,
              checkInTime: new Date(validatedData.checkInTime),
              latitude: validatedData.latitude,
              longitude: validatedData.longitude,
              photoUrl: validatedData.photoUrl,
              notes: validatedData.notes,
              syncStatus: 'synced',
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

          // Update student hours
          await tx.student.update({
            where: { id: studentId },
            data: {
              totalHours: { increment: validatedData.hours },
            },
          });

          createdRecords.push(record);

          // Update streak (async)
          updateStudentStreak(studentId).catch(console.error);
        } catch (error) {
          errors.push({
            studentId,
            error: 'Failed to create attendance record',
          });
        }
      }

      return { createdRecords, errors };
    });

    res.status(201).json({
      message: 'Bulk attendance marked',
      summary: {
        total: validatedData.studentIds.length,
        successful: results.createdRecords.length,
        failed: results.errors.length,
      },
      attendance: results.createdRecords,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Mark bulk attendance error:', error);
    res.status(500).json({ error: 'Failed to mark bulk attendance' });
  }
};

// Get attendance records (with filters)
export const getAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '50',
      studentId,
      teacherId,
      startDate,
      endDate,
      activityType,
      syncStatus,
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

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    if (activityType) {
      where.activityType = activityType as string;
    }

    if (syncStatus) {
      where.syncStatus = syncStatus as string;
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
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
          date: 'desc',
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    res.status(200).json({
      attendance,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// Get attendance by student
export const getStudentAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, activityType } = req.query;

    const where: any = { studentId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
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
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate stats
    const totalHours = attendance.reduce((sum, a) => sum + Number(a.hours), 0);
    const activityBreakdown = attendance.reduce((acc: any, a) => {
      acc[a.activityType] = (acc[a.activityType] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      attendance,
      stats: {
        totalRecords: attendance.length,
        totalHours: Math.round(totalHours * 100) / 100,
        activityBreakdown,
      },
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch student attendance' });
  }
};

// Get attendance by teacher
export const getTeacherAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { teacherId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const attendance = await prisma.attendance.findMany({
      where,
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
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate stats
    const uniqueStudents = new Set(attendance.map((a) => a.studentId)).size;
    const totalHours = attendance.reduce((sum, a) => sum + Number(a.hours), 0);
    const activityBreakdown = attendance.reduce((acc: any, a) => {
      acc[a.activityType] = (acc[a.activityType] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      attendance,
      stats: {
        totalRecords: attendance.length,
        uniqueStudents,
        totalHours: Math.round(totalHours * 100) / 100,
        activityBreakdown,
      },
    });
  } catch (error) {
    console.error('Get teacher attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher attendance' });
  }
};

// Update attendance
export const updateAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only teachers and admins can update
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only teachers and admins can update attendance' });
      return;
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }

    // Teachers can only update their own records
    if (req.user.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.userId },
      });

      if (attendance.teacherId !== teacher?.id) {
        res.status(403).json({ error: 'You can only update your own attendance records' });
        return;
      }
    }

    const { hours, checkOutTime, photoUrl, notes } = req.body;

    const updatedAttendance = await prisma.attendance.update({
      where: { id },
      data: {
        hours: hours !== undefined ? hours : undefined,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
        photoUrl,
        notes,
      },
    });

    res.status(200).json({
      message: 'Attendance updated successfully',
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

// Delete attendance (admin only)
export const deleteAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can delete
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can delete attendance records' });
      return;
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }

    // Delete and update student hours
    await prisma.$transaction(async (tx) => {
      await tx.attendance.delete({
        where: { id },
      });

      // Deduct hours from student
      await tx.student.update({
        where: { id: attendance.studentId },
        data: {
          totalHours: { decrement: Number(attendance.hours) },
        },
      });
    });

    res.status(200).json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};
