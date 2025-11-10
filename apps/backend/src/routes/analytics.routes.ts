// Analytics Routes
// Routes for admin analytics, reporting, and insights

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDashboardOverview,
  getAttendanceTrends,
  getDropoutRisk,
  getBudgetTracking,
  getPerformanceMetrics,
} from '../controllers/analytics.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

// GET /api/v1/analytics/overview - Admin dashboard overview
router.get('/overview', getDashboardOverview);

// GET /api/v1/analytics/attendance-trends - Attendance trends
router.get('/attendance-trends', getAttendanceTrends);

// GET /api/v1/analytics/dropout-risk - Dropout risk analysis
router.get('/dropout-risk', getDropoutRisk);

// GET /api/v1/analytics/budget - Budget tracking
router.get('/budget', getBudgetTracking);

// GET /api/v1/analytics/performance - Performance metrics
router.get('/performance', getPerformanceMetrics);

export default router;
