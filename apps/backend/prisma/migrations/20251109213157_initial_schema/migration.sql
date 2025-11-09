-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'teacher', 'student', 'parent');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('sports', 'chess', 'yoga', 'meditation', 'strength_training');

-- CreateEnum
CREATE TYPE "AssessmentCategory" AS ENUM ('physical', 'mental', 'behavioral', 'academic');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'disbursed', 'rejected');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('push', 'sms', 'email', 'whatsapp');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('pending', 'synced', 'failed', 'conflict');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('part_time', 'full_time');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('attendance', 'skill', 'leadership');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('common', 'rare', 'epic', 'legendary');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('video', 'audio', 'text', 'diagram');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('activity', 'assessment', 'social');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('in_progress', 'completed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "full_name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "village_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "geofence_radius" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "villages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "enrollment_date" DATE NOT NULL,
    "assigned_teacher_id" TEXT,
    "squad_id" TEXT,
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    "total_hours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "savings_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gamification_points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "parent_phone" TEXT,
    "school_name" TEXT,
    "emergency_contact" TEXT,
    "medical_notes" TEXT,
    "profile_photo_url" TEXT,
    "is_dropout" BOOLEAN NOT NULL DEFAULT false,
    "dropout_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hire_date" DATE NOT NULL,
    "employment_type" "EmploymentType" NOT NULL,
    "performance_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "bonus_eligible" BOOLEAN NOT NULL DEFAULT false,
    "total_students_managed" INTEGER NOT NULL DEFAULT 0,
    "active_students_count" INTEGER NOT NULL DEFAULT 0,
    "specialization" TEXT,
    "certification" TEXT,
    "bank_account" TEXT,
    "ifsc_code" TEXT,
    "monthly_salary" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "last_bonus_date" DATE,
    "profile_photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "phone" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_parents" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "squads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "village_id" TEXT NOT NULL,
    "captain_student_id" TEXT,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "squads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "hours" DECIMAL(4,2) NOT NULL,
    "check_in_time" TIMESTAMP(3) NOT NULL,
    "check_out_time" TIMESTAMP(3),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "photo_url" TEXT,
    "notes" TEXT,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'synced',
    "offline_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "assessment_date" DATE NOT NULL,
    "category" "AssessmentCategory" NOT NULL,
    "metric" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incentives" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "milestone_type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "weeks_completed" INTEGER NOT NULL,
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_date" TIMESTAMP(3),
    "disbursed_date" TIMESTAMP(3),
    "disbursement_method" TEXT,
    "transaction_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incentives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_url" TEXT,
    "badge_type" "BadgeType" NOT NULL,
    "criteria" JSONB NOT NULL,
    "points_value" INTEGER NOT NULL DEFAULT 0,
    "rarity" "Rarity" NOT NULL DEFAULT 'common',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_badges" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "earned_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "student_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "challenge_type" "ChallengeType" NOT NULL,
    "target_value" TEXT NOT NULL,
    "points_reward" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_challenges" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'in_progress',
    "progress" TEXT,
    "completed_at" TIMESTAMP(3),
    "points_earned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "student_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content_url" TEXT,
    "thumbnail_url" TEXT,
    "duration_minutes" INTEGER,
    "file_size_mb" DECIMAL(8,2),
    "language" TEXT NOT NULL,
    "difficulty_level" "DifficultyLevel" NOT NULL DEFAULT 'beginner',
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_activity_downloads" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed" TIMESTAMP(3),

    CONSTRAINT "student_activity_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "parent_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "offline_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'pending',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_performance_logs" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "attendance_completion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "student_retention_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activity_variety_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avg_student_progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_hours_logged" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "performance_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "bonus_earned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_performance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_village_id_idx" ON "users"("village_id");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "villages_name_idx" ON "villages"("name");

-- CreateIndex
CREATE INDEX "villages_district_idx" ON "villages"("district");

-- CreateIndex
CREATE INDEX "villages_state_idx" ON "villages"("state");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE INDEX "students_user_id_idx" ON "students"("user_id");

-- CreateIndex
CREATE INDEX "students_assigned_teacher_id_idx" ON "students"("assigned_teacher_id");

-- CreateIndex
CREATE INDEX "students_squad_id_idx" ON "students"("squad_id");

-- CreateIndex
CREATE INDEX "students_enrollment_date_idx" ON "students"("enrollment_date");

-- CreateIndex
CREATE INDEX "students_is_dropout_idx" ON "students"("is_dropout");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE INDEX "teachers_user_id_idx" ON "teachers"("user_id");

-- CreateIndex
CREATE INDEX "teachers_hire_date_idx" ON "teachers"("hire_date");

-- CreateIndex
CREATE INDEX "teachers_performance_score_idx" ON "teachers"("performance_score");

-- CreateIndex
CREATE INDEX "teachers_bonus_eligible_idx" ON "teachers"("bonus_eligible");

-- CreateIndex
CREATE UNIQUE INDEX "parents_user_id_key" ON "parents"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "parents_phone_key" ON "parents"("phone");

-- CreateIndex
CREATE INDEX "parents_phone_idx" ON "parents"("phone");

-- CreateIndex
CREATE INDEX "parents_user_id_idx" ON "parents"("user_id");

-- CreateIndex
CREATE INDEX "student_parents_student_id_idx" ON "student_parents"("student_id");

-- CreateIndex
CREATE INDEX "student_parents_parent_id_idx" ON "student_parents"("parent_id");

-- CreateIndex
CREATE INDEX "squads_village_id_idx" ON "squads"("village_id");

-- CreateIndex
CREATE INDEX "squads_captain_student_id_idx" ON "squads"("captain_student_id");

-- CreateIndex
CREATE INDEX "attendance_student_id_idx" ON "attendance"("student_id");

-- CreateIndex
CREATE INDEX "attendance_teacher_id_idx" ON "attendance"("teacher_id");

-- CreateIndex
CREATE INDEX "attendance_date_idx" ON "attendance"("date");

-- CreateIndex
CREATE INDEX "attendance_activity_type_idx" ON "attendance"("activity_type");

-- CreateIndex
CREATE INDEX "attendance_sync_status_idx" ON "attendance"("sync_status");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_student_id_date_activity_type_key" ON "attendance"("student_id", "date", "activity_type");

-- CreateIndex
CREATE INDEX "assessments_student_id_idx" ON "assessments"("student_id");

-- CreateIndex
CREATE INDEX "assessments_teacher_id_idx" ON "assessments"("teacher_id");

-- CreateIndex
CREATE INDEX "assessments_assessment_date_idx" ON "assessments"("assessment_date");

-- CreateIndex
CREATE INDEX "assessments_category_idx" ON "assessments"("category");

-- CreateIndex
CREATE INDEX "assessments_metric_idx" ON "assessments"("metric");

-- CreateIndex
CREATE INDEX "incentives_student_id_idx" ON "incentives"("student_id");

-- CreateIndex
CREATE INDEX "incentives_approval_status_idx" ON "incentives"("approval_status");

-- CreateIndex
CREATE INDEX "incentives_approved_date_idx" ON "incentives"("approved_date");

-- CreateIndex
CREATE INDEX "incentives_disbursed_date_idx" ON "incentives"("disbursed_date");

-- CreateIndex
CREATE INDEX "badges_badge_type_idx" ON "badges"("badge_type");

-- CreateIndex
CREATE INDEX "badges_rarity_idx" ON "badges"("rarity");

-- CreateIndex
CREATE INDEX "student_badges_student_id_idx" ON "student_badges"("student_id");

-- CreateIndex
CREATE INDEX "student_badges_badge_id_idx" ON "student_badges"("badge_id");

-- CreateIndex
CREATE INDEX "student_badges_earned_date_idx" ON "student_badges"("earned_date");

-- CreateIndex
CREATE UNIQUE INDEX "student_badges_student_id_badge_id_key" ON "student_badges"("student_id", "badge_id");

-- CreateIndex
CREATE INDEX "daily_challenges_challenge_type_idx" ON "daily_challenges"("challenge_type");

-- CreateIndex
CREATE INDEX "daily_challenges_start_date_idx" ON "daily_challenges"("start_date");

-- CreateIndex
CREATE INDEX "daily_challenges_end_date_idx" ON "daily_challenges"("end_date");

-- CreateIndex
CREATE INDEX "daily_challenges_is_active_idx" ON "daily_challenges"("is_active");

-- CreateIndex
CREATE INDEX "student_challenges_student_id_idx" ON "student_challenges"("student_id");

-- CreateIndex
CREATE INDEX "student_challenges_challenge_id_idx" ON "student_challenges"("challenge_id");

-- CreateIndex
CREATE INDEX "student_challenges_status_idx" ON "student_challenges"("status");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "activities_category_idx" ON "activities"("category");

-- CreateIndex
CREATE INDEX "activities_language_idx" ON "activities"("language");

-- CreateIndex
CREATE INDEX "activities_difficulty_level_idx" ON "activities"("difficulty_level");

-- CreateIndex
CREATE INDEX "activities_is_premium_idx" ON "activities"("is_premium");

-- CreateIndex
CREATE INDEX "student_activity_downloads_student_id_idx" ON "student_activity_downloads"("student_id");

-- CreateIndex
CREATE INDEX "student_activity_downloads_activity_id_idx" ON "student_activity_downloads"("activity_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_parent_id_idx" ON "notifications"("parent_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_category_idx" ON "notifications"("category");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_sent_at_idx" ON "notifications"("sent_at");

-- CreateIndex
CREATE INDEX "sync_queue_user_id_idx" ON "sync_queue"("user_id");

-- CreateIndex
CREATE INDEX "sync_queue_entity_type_idx" ON "sync_queue"("entity_type");

-- CreateIndex
CREATE INDEX "sync_queue_sync_status_idx" ON "sync_queue"("sync_status");

-- CreateIndex
CREATE INDEX "sync_queue_created_at_idx" ON "sync_queue"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "teacher_performance_logs_teacher_id_idx" ON "teacher_performance_logs"("teacher_id");

-- CreateIndex
CREATE INDEX "teacher_performance_logs_month_idx" ON "teacher_performance_logs"("month");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_performance_logs_teacher_id_month_key" ON "teacher_performance_logs"("teacher_id", "month");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_assigned_teacher_id_fkey" FOREIGN KEY ("assigned_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "squads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squads" ADD CONSTRAINT "squads_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentives" ADD CONSTRAINT "incentives_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_challenges" ADD CONSTRAINT "student_challenges_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_challenges" ADD CONSTRAINT "student_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "daily_challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_activity_downloads" ADD CONSTRAINT "student_activity_downloads_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_activity_downloads" ADD CONSTRAINT "student_activity_downloads_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_performance_logs" ADD CONSTRAINT "teacher_performance_logs_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
