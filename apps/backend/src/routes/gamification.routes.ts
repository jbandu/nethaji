// Gamification Routes
// Routes for badges, leaderboard, and challenges

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllBadges,
  getStudentBadges,
  awardBadge,
  getLeaderboard,
  getActiveChallenges,
  getStudentChallenges,
  enrollInChallenge,
  completeChallenge,
} from '../controllers/gamification.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// BADGE ROUTES
// ============================================================================

// GET /api/v1/gamification/badges - Get all badges
router.get('/badges', getAllBadges);

// GET /api/v1/gamification/badges/student/:studentId - Get student badges
router.get('/badges/student/:studentId', getStudentBadges);

// POST /api/v1/gamification/badges/award - Award badge to student
router.post('/badges/award', awardBadge);

// ============================================================================
// LEADERBOARD ROUTES
// ============================================================================

// GET /api/v1/gamification/leaderboard - Get leaderboard
router.get('/leaderboard', getLeaderboard);

// ============================================================================
// CHALLENGE ROUTES
// ============================================================================

// GET /api/v1/gamification/challenges - Get active challenges
router.get('/challenges', getActiveChallenges);

// GET /api/v1/gamification/challenges/student/:studentId - Get student challenges
router.get('/challenges/student/:studentId', getStudentChallenges);

// POST /api/v1/gamification/challenges/:challengeId/enroll - Enroll in challenge
router.post('/challenges/:challengeId/enroll', enrollInChallenge);

// PUT /api/v1/gamification/challenges/:challengeId/complete - Complete challenge
router.put('/challenges/:challengeId/complete', completeChallenge);

export default router;
