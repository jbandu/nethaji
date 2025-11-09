import { Router } from 'express';
import {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deactivateTeacher,
  getTeacherPerformance,
  awardBonus,
  getTeacherStudents,
  calculatePerformanceScore,
} from '../controllers/teacher.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all teachers (admin only)
router.get('/', requireAdmin, getAllTeachers);

// Get single teacher
router.get('/:id', getTeacherById);

// Create new teacher (admin only)
router.post('/', requireAdmin, createTeacher);

// Update teacher (admin only)
router.put('/:id', requireAdmin, updateTeacher);

// Deactivate teacher (admin only)
router.delete('/:id', requireAdmin, deactivateTeacher);

// Get teacher performance metrics
router.get('/:id/performance', getTeacherPerformance);

// Award bonus to teacher (admin only)
router.post('/:id/bonus', requireAdmin, awardBonus);

// Get teacher's assigned students
router.get('/:id/students', getTeacherStudents);

// Calculate and update performance score (admin only)
router.post('/:id/calculate-performance', requireAdmin, calculatePerformanceScore);

export default router;
