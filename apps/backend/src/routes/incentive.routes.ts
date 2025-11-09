import { Router } from 'express';
import {
  createIncentive,
  getIncentives,
  getPendingIncentives,
  getIncentiveById,
  approveIncentive,
  rejectIncentive,
  disburseIncentive,
  checkMilestoneEligibility,
} from '../controllers/incentive.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create incentive request
router.post('/', createIncentive);

// Get all incentives (with filters)
router.get('/', getIncentives);

// Get pending incentives (admin only)
router.get('/pending', requireAdmin, getPendingIncentives);

// Check student milestone eligibility
router.get('/eligibility/:studentId', checkMilestoneEligibility);

// Get single incentive
router.get('/:id', getIncentiveById);

// Approve incentive (admin only)
router.post('/:id/approve', requireAdmin, approveIncentive);

// Reject incentive (admin only)
router.post('/:id/reject', requireAdmin, rejectIncentive);

// Mark as disbursed (admin only)
router.post('/:id/disburse', requireAdmin, disburseIncentive);

export default router;
