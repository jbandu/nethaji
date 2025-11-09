import { PrismaClient, UserRole, Gender, EmploymentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (careful in production!)
  await prisma.auditLog.deleteMany();
  await prisma.syncQueue.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.studentActivityDownload.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.studentChallenge.deleteMany();
  await prisma.dailyChallenge.deleteMany();
  await prisma.studentBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.incentive.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.teacherPerformanceLog.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.squad.deleteMany();
  await prisma.user.deleteMany();
  await prisma.village.deleteMany();

  console.log('✅ Cleared existing data');

  // Hash password for all users
  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Create Villages
  const village1 = await prisma.village.create({
    data: {
      name: 'Vadakku Viravanallur',
      district: 'Tirunelveli',
      state: 'Tamil Nadu',
      latitude: 8.7642,
      longitude: 77.7619,
      geofenceRadius: 200,
    },
  });

  const village2 = await prisma.village.create({
    data: {
      name: 'Kundrathur',
      district: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.0068,
      longitude: 80.0931,
      geofenceRadius: 150,
    },
  });

  console.log('✅ Created villages');

  // 2. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      phone: '+919876543210',
      email: 'admin@nethaji.org',
      passwordHash: defaultPassword,
      role: UserRole.admin,
      fullName: 'Admin User',
      language: 'en',
      villageId: village1.id,
    },
  });

  console.log('✅ Created admin user');

  // 3. Create Teachers
  const teacher1User = await prisma.user.create({
    data: {
      phone: '+919876543211',
      email: 'teacher1@nethaji.org',
      passwordHash: defaultPassword,
      role: UserRole.teacher,
      fullName: 'Rajesh Kumar',
      language: 'ta',
      villageId: village1.id,
    },
  });

  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacher1User.id,
      hireDate: new Date('2024-01-01'),
      employmentType: EmploymentType.part_time,
      specialization: 'Physical Training',
      monthlySalary: 15000,
      performanceScore: 85.5,
      bonusEligible: true,
    },
  });

  const teacher2User = await prisma.user.create({
    data: {
      phone: '+919876543212',
      email: 'teacher2@nethaji.org',
      passwordHash: defaultPassword,
      role: UserRole.teacher,
      fullName: 'Priya Sharma',
      language: 'hi',
      villageId: village2.id,
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacher2User.id,
      hireDate: new Date('2024-01-15'),
      employmentType: EmploymentType.part_time,
      specialization: 'Chess & Yoga',
      monthlySalary: 15000,
      performanceScore: 92.0,
      bonusEligible: true,
    },
  });

  console.log('✅ Created teachers');

  // 4. Create Squads
  const squad1 = await prisma.squad.create({
    data: {
      name: 'Thunder Warriors',
      villageId: village1.id,
      totalPoints: 1250,
    },
  });

  const squad2 = await prisma.squad.create({
    data: {
      name: 'Lightning Champions',
      villageId: village2.id,
      totalPoints: 980,
    },
  });

  console.log('✅ Created squads');

  // 5. Create Students
  const students = [];
  const studentNames = [
    { name: 'Arjun Patel', gender: Gender.male, village: village1, teacher: teacher1, squad: squad1 },
    { name: 'Kavya Reddy', gender: Gender.female, village: village1, teacher: teacher1, squad: squad1 },
    { name: 'Rohit Singh', gender: Gender.male, village: village1, teacher: teacher1, squad: squad1 },
    { name: 'Ananya Iyer', gender: Gender.female, village: village2, teacher: teacher2, squad: squad2 },
    { name: 'Vikram Nair', gender: Gender.male, village: village2, teacher: teacher2, squad: squad2 },
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const { name, gender, village, teacher, squad } = studentNames[i];

    const studentUser = await prisma.user.create({
      data: {
        phone: `+9198765432${20 + i}`,
        passwordHash: defaultPassword,
        role: UserRole.student,
        fullName: name,
        language: 'ta',
        villageId: village.id,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        dob: new Date('2010-05-15'),
        gender: gender,
        enrollmentDate: new Date('2024-01-10'),
        assignedTeacherId: teacher.id,
        squadId: squad.id,
        streakCount: Math.floor(Math.random() * 30),
        totalHours: Math.random() * 100,
        savingsBalance: Math.random() * 3000,
        gamificationPoints: Math.floor(Math.random() * 500),
        level: Math.floor(Math.random() * 5) + 1,
        parentPhone: `+9198765400${i}`,
        schoolName: 'Government Primary School',
      },
    });

    students.push(student);
  }

  console.log('✅ Created students');

  // 6. Create Parents
  const parent1 = await prisma.parent.create({
    data: {
      phone: '+919876540000',
      fullName: 'Ramesh Patel',
      relationship: 'father',
      whatsappEnabled: true,
      smsEnabled: true,
      language: 'ta',
    },
  });

  await prisma.studentParent.create({
    data: {
      studentId: students[0].id,
      parentId: parent1.id,
      isPrimary: true,
    },
  });

  console.log('✅ Created parents');

  // 7. Create Badges
  const badges = await Promise.all([
    prisma.badge.create({
      data: {
        name: '30-Day Streak',
        description: 'Attended for 30 consecutive days',
        badgeType: 'attendance',
        criteria: { type: 'attendance_streak', days: 30 },
        pointsValue: 100,
        rarity: 'rare',
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Chess Beginner',
        description: 'Completed 10 chess sessions',
        badgeType: 'skill',
        criteria: { type: 'activity_count', activity: 'chess', count: 10 },
        pointsValue: 50,
        rarity: 'common',
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Yoga Master',
        description: 'Mastered 20 yoga postures',
        badgeType: 'skill',
        criteria: { type: 'assessment', metric: 'yoga_postures', value: 20 },
        pointsValue: 150,
        rarity: 'epic',
      },
    }),
  ]);

  console.log('✅ Created badges');

  // 8. Create Activities (Educational Content)
  await Promise.all([
    prisma.activity.create({
      data: {
        type: 'video',
        category: 'exercise',
        title: 'Basic Pushup Tutorial',
        description: 'Learn proper pushup form',
        language: 'en',
        durationMinutes: 5,
        fileSizeMb: 8.5,
        difficultyLevel: 'beginner',
      },
    }),
    prisma.activity.create({
      data: {
        type: 'video',
        category: 'chess',
        title: 'Chess Openings for Beginners',
        description: 'Learn basic chess openings',
        language: 'ta',
        durationMinutes: 15,
        fileSizeMb: 12.0,
        difficultyLevel: 'beginner',
      },
    }),
    prisma.activity.create({
      data: {
        type: 'audio',
        category: 'meditation',
        title: 'Guided Meditation',
        description: '10-minute guided meditation session',
        language: 'hi',
        durationMinutes: 10,
        fileSizeMb: 3.5,
        difficultyLevel: 'beginner',
      },
    }),
  ]);

  console.log('✅ Created educational activities');

  // 9. Create Daily Challenges
  await prisma.dailyChallenge.create({
    data: {
      title: 'Pushup Challenge',
      description: 'Complete 20 pushups today',
      challengeType: 'activity',
      targetValue: '20',
      pointsReward: 50,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true,
    },
  });

  console.log('✅ Created daily challenges');

  console.log('');
  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('📝 Default credentials:');
  console.log('   Admin: admin@nethaji.org / password123');
  console.log('   Teacher 1: teacher1@nethaji.org / password123');
  console.log('   Teacher 2: teacher2@nethaji.org / password123');
  console.log('   Students: Use phone numbers with password123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
