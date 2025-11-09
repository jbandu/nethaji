import { Router } from 'express';
import {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  getStudentAttendance,
  getTeacherAttendance,
  updateAttendance,
  deleteAttendance,
} from '../controllers/attendance.controller';
import { authenticate, requireAdmin, requireTeacher } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Mark single attendance
router.post('/', requireTeacher, markAttendance);

// Mark bulk attendance
router.post('/bulk', requireTeacher, markBulkAttendance);

// Get attendance records (with filters)
router.get('/', getAttendance);

// Get attendance by student
router.get('/student/:studentId', getStudentAttendance);

// Get attendance by teacher
router.get('/teacher/:teacherId', getTeacherAttendance);

// Update attendance
router.put('/:id', requireTeacher, updateAttendance);

// Delete attendance (admin only)
router.delete('/:id', requireAdmin, deleteAttendance);

export default router;
