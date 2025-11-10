// Gamification Service
// API calls for badges, leaderboard, and challenges

import { apiClient } from '@/lib/api-client';

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  badgeType: 'attendance' | 'skill' | 'leadership';
  criteria: any;
  pointsValue: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  createdAt: string;
}

export interface StudentBadge {
  id: string;
  studentId: string;
  badgeId: string;
  earnedDate: string;
  notified: boolean;
  badge: Badge;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  village: string | null;
  squad: string | null;
  points: number;
  level: number;
  streak: number;
  badgeCount: number;
  legendaryBadges: number;
}

export interface SquadLeaderboardEntry {
  rank: number;
  squadId: string;
  name: string;
  village: string;
  points: number;
  memberCount: number;
  avgPointsPerMember: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challengeType: 'activity' | 'assessment' | 'social';
  targetValue: string;
  pointsReward: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface StudentChallenge {
  id: string;
  studentId: string;
  challengeId: string;
  status: 'in_progress' | 'completed' | 'failed';
  progress: string | null;
  completedAt: string | null;
  pointsEarned: number;
  challenge: Challenge;
}

// ============================================================================
// BADGES
// ============================================================================

export const getAllBadges = async (params?: {
  type?: string;
  rarity?: string;
}) => {
  const response = await apiClient.get('/gamification/badges', { params });
  return response.data;
};

export const getStudentBadges = async (studentId: string) => {
  const response = await apiClient.get(`/gamification/badges/student/${studentId}`);
  return response.data;
};

export const awardBadge = async (data: {
  studentId: string;
  badgeId: string;
}) => {
  const response = await apiClient.post('/gamification/badges/award', data);
  return response.data;
};

// ============================================================================
// LEADERBOARD
// ============================================================================

export const getLeaderboard = async (params?: {
  limit?: number;
  villageId?: string;
  squadId?: string;
  timeframe?: 'all' | 'month' | 'week';
}) => {
  const response = await apiClient.get('/gamification/leaderboard', { params });
  return response.data;
};

// ============================================================================
// CHALLENGES
// ============================================================================

export const getActiveChallenges = async (params?: {
  type?: string;
}) => {
  const response = await apiClient.get('/gamification/challenges', { params });
  return response.data;
};

export const getStudentChallenges = async (studentId: string) => {
  const response = await apiClient.get(`/gamification/challenges/student/${studentId}`);
  return response.data;
};

export const enrollInChallenge = async (challengeId: string, studentId: string) => {
  const response = await apiClient.post(`/gamification/challenges/${challengeId}/enroll`, {
    studentId,
  });
  return response.data;
};

export const completeChallenge = async (
  challengeId: string,
  data: {
    studentId: string;
    progress?: string;
  }
) => {
  const response = await apiClient.put(`/gamification/challenges/${challengeId}/complete`, data);
  return response.data;
};
