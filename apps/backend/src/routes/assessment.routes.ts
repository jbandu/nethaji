import { Router } from 'express';
import {
  createAssessment,
  getAssessments,
  getAssessmentById,
  getStudentAssessments,
  getStudentProgress,
  updateAssessment,
  deleteAssessment,
} from '../controllers/assessment.controller';
import { authenticate, requireAdmin, requireTeacher } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create assessment
router.post('/', requireTeacher, createAssessment);

// Get all assessments (with filters)
router.get('/', getAssessments);

// Get single assessment
router.get('/:id', getAssessmentById);

// Get student assessments with summary
router.get('/student/:studentId', getStudentAssessments);

// Get student progress over time for a metric
router.get('/student/:studentId/progress', getStudentProgress);

// Update assessment
router.put('/:id', requireTeacher, updateAssessment);

// Delete assessment (admin only)
router.delete('/:id', requireAdmin, deleteAssessment);

export default router;
