import { Router } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deactivateStudent,
  getStudentDashboard,
  getStudentAttendance,
  getStudentAssessments,
} from '../controllers/student.controller';
import { authenticate, requireAdmin, requireTeacher } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all students (admin and teachers)
router.get('/', requireTeacher, getAllStudents);

// Get single student
router.get('/:id', getStudentById);

// Create new student (admin only)
router.post('/', requireAdmin, createStudent);

// Update student (admin and teachers)
router.put('/:id', requireTeacher, updateStudent);

// Deactivate student (admin only)
router.delete('/:id', requireAdmin, deactivateStudent);

// Get student dashboard/progress
router.get('/:id/dashboard', getStudentDashboard);

// Get student attendance history
router.get('/:id/attendance', getStudentAttendance);

// Get student assessments
router.get('/:id/assessments', getStudentAssessments);

export default router;
