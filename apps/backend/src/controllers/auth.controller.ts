import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { registerSchema, loginSchema, changePasswordSchema } from '../utils/validation';
import { ZodError } from 'zod';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: validatedData.phone },
          { email: validatedData.email || undefined },
        ],
      },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this phone or email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: validatedData.phone,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        fullName: validatedData.fullName,
        language: validatedData.language,
        villageId: validatedData.villageId,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        fullName: true,
        language: true,
        villageId: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { phone: validatedData.phone },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid phone or password' });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated. Please contact admin.' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(validatedData.password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid phone or password' });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    // Prepare user data based on role
    const userData: any = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      language: user.language,
      villageId: user.villageId,
    };

    if (user.role === 'student' && user.student) {
      userData.student = {
        id: user.student.id,
        streakCount: user.student.streakCount,
        totalHours: user.student.totalHours,
        savingsBalance: user.student.savingsBalance,
        gamificationPoints: user.student.gamificationPoints,
        level: user.student.level,
      };
    } else if (user.role === 'teacher' && user.teacher) {
      userData.teacher = {
        id: user.teacher.id,
        performanceScore: user.teacher.performanceScore,
        bonusEligible: user.teacher.bonusEligible,
        activeStudentsCount: user.teacher.activeStudentsCount,
      };
    }

    res.status(200).json({
      message: 'Login successful',
      user: userData,
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        fullName: true,
        language: true,
        villageId: true,
        isActive: true,
        createdAt: true,
        student: true,
        teacher: true,
        village: {
          select: {
            id: true,
            name: true,
            district: true,
            state: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate input
    const validatedData = changePasswordSchema.parse(req.body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      validatedData.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(validatedData.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const refreshTokenHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Generate new tokens
    const token = generateToken({
      userId: req.user.userId,
      role: req.user.role,
      phone: req.user.phone,
    });

    const refreshToken = generateRefreshToken({
      userId: req.user.userId,
      role: req.user.role,
      phone: req.user.phone,
    });

    res.status(200).json({
      message: 'Token refreshed successfully',
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};
