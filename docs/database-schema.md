# Nethaji Empowerment Initiative - Database Schema

## Tech Stack
- **Database**: PostgreSQL (Neon - serverless)
- **ORM**: Prisma (TypeScript-first)
- **Migrations**: Prisma Migrate

## Entity Relationship Diagram

```
┌─────────────┐
│    User     │◄────────┬─────────────┐
└─────────────┘         │             │
      │                 │             │
      ├─────────┬───────┴────┬────────┴────┐
      │         │            │             │
┌─────▼────┐ ┌─▼──────┐ ┌──▼─────┐ ┌─────▼──────┐
│ Student  │ │Teacher │ │ Admin  │ │   Parent   │
└──────────┘ └────────┘ └────────┘ └────────────┘
      │         │
      │         │
      ├─────────┴──────┬──────────┬──────────┬──────────┐
      │                │          │          │          │
┌─────▼──────┐  ┌──────▼────┐ ┌──▼─────┐ ┌──▼──────┐ ┌▼────────┐
│ Attendance │  │Assessment │ │Incentive│ │Badge    │ │Squad    │
└────────────┘  └───────────┘ └─────────┘ └─────────┘ └─────────┘
```

## Core Entities

### 1. users
Base table for all user types (polymorphic relationship)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | Primary identifier (India: +91) |
| email | VARCHAR(255) | UNIQUE, NULLABLE | Optional email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed |
| role | ENUM | NOT NULL | admin, teacher, student, parent |
| full_name | VARCHAR(255) | NOT NULL | Full name |
| language | VARCHAR(10) | DEFAULT 'en' | en, ta, hi |
| village_id | UUID | FK | Reference to villages |
| is_active | BOOLEAN | DEFAULT true | Account status |
| last_login | TIMESTAMP | NULLABLE | Last login time |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Update timestamp |

**Indexes**: phone, email, role, village_id, is_active

---

### 2. villages
Geographic centers for program delivery

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(255) | NOT NULL | Village name |
| district | VARCHAR(255) | NOT NULL | District |
| state | VARCHAR(100) | NOT NULL | State (Tamil Nadu, etc.) |
| latitude | DECIMAL(10,8) | NULLABLE | GPS coordinates |
| longitude | DECIMAL(11,8) | NULLABLE | GPS coordinates |
| geofence_radius | INTEGER | DEFAULT 100 | Meters for check-in |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**: name, district, state

---

### 3. students
Extended student profile

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK(users) | Links to users table |
| user_id | UUID | FK | Reference to users |
| dob | DATE | NOT NULL | Date of birth |
| gender | VARCHAR(10) | NOT NULL | male, female, other |
| enrollment_date | DATE | NOT NULL | Program start date |
| assigned_teacher_id | UUID | FK | Reference to teachers |
| squad_id | UUID | FK | Peer group |
| streak_count | INTEGER | DEFAULT 0 | Current attendance streak |
| total_hours | DECIMAL(10,2) | DEFAULT 0 | Total activity hours |
| savings_balance | DECIMAL(10,2) | DEFAULT 0 | Virtual savings (₹) |
| gamification_points | INTEGER | DEFAULT 0 | Total points |
| level | INTEGER | DEFAULT 1 | Gamification level |
| parent_phone | VARCHAR(20) | NULLABLE | Parent contact |
| school_name | VARCHAR(255) | NULLABLE | Current school |
| emergency_contact | VARCHAR(20) | NULLABLE | Emergency number |
| medical_notes | TEXT | NULLABLE | Health conditions |
| profile_photo_url | VARCHAR(500) | NULLABLE | Photo URL |
| is_dropout | BOOLEAN | DEFAULT false | Dropout flag |
| dropout_date | DATE | NULLABLE | Date of dropout |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Update timestamp |

**Indexes**: user_id, assigned_teacher_id, squad_id, enrollment_date, is_dropout

---

### 4. teachers
Extended teacher profile

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK(users) | Links to users table |
| user_id | UUID | FK | Reference to users |
| hire_date | DATE | NOT NULL | Employment start date |
| employment_type | VARCHAR(20) | NOT NULL | part_time, full_time |
| performance_score | DECIMAL(5,2) | DEFAULT 0 | 0-100 score |
| bonus_eligible | BOOLEAN | DEFAULT false | Bonus qualification |
| total_students_managed | INTEGER | DEFAULT 0 | Lifetime count |
| active_students_count | INTEGER | DEFAULT 0 | Current count |
| specialization | VARCHAR(100) | NULLABLE | chess, yoga, fitness, etc. |
| certification | TEXT | NULLABLE | Qualifications |
| bank_account | VARCHAR(50) | NULLABLE | For payments |
| ifsc_code | VARCHAR(20) | NULLABLE | Bank IFSC |
| monthly_salary | DECIMAL(10,2) | DEFAULT 0 | Base salary |
| last_bonus_date | DATE | NULLABLE | Last bonus received |
| profile_photo_url | VARCHAR(500) | NULLABLE | Photo URL |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Update timestamp |

**Indexes**: user_id, hire_date, performance_score, bonus_eligible

---

### 5. parents
Parent/guardian information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK | Reference to users (if has account) |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | Primary contact |
| full_name | VARCHAR(255) | NOT NULL | Parent name |
| relationship | VARCHAR(50) | NOT NULL | father, mother, guardian |
| whatsapp_enabled | BOOLEAN | DEFAULT false | WhatsApp notifications |
| sms_enabled | BOOLEAN | DEFAULT true | SMS notifications |
| language | VARCHAR(10) | DEFAULT 'en' | Preferred language |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**: phone, user_id

---

### 6. student_parents
Many-to-many relationship (siblings share parents)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| student_id | UUID | FK | Reference to students |
| parent_id | UUID | FK | Reference to parents |
| is_primary | BOOLEAN | DEFAULT false | Primary contact |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**: student_id, parent_id

---

### 7. squads
Peer groups for gamification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(255) | NOT NULL | Squad name |
| village_id | UUID | FK | Village location |
| captain_student_id | UUID | FK | Squad leader |
| total_points | INTEGER | DEFAULT 0 | Aggregate points |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**: village_id, captain_student_id

---

### 8. attendance
Daily activity tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| student_id | UUID | FK, NOT NULL | Reference to students |
| teacher_id | UUID | FK, NOT NULL | Who recorded it |
| date | DATE | NOT NULL | Attendance date |
| activity_type | VARCHAR(50) | NOT NULL | sports, chess, yoga, meditation, strength_training |
| hours | DECIMAL(4,2) | NOT NULL | Duration (0.5 - 8.0) |
| check_in_time | TIMESTAMP | NOT NULL | Actual check-in |
| check_out_time | TIMESTAMP | NULLABLE | Actual check-out |
| latitude | DECIMAL(10,8) | NULLABLE | GPS verification |
| longitude | DECIMAL(11,8) | NULLABLE | GPS verification |
| photo_url | VARCHAR(500) | NULLABLE | Activity proof photo |
| notes | TEXT | NULLABLE | Teacher notes |
| sync_status | VARCHAR(20) | DEFAULT 'synced' | synced, pending, failed |
| offline_id | VARCHAR(100) | NULLABLE | Client-side temp ID |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Update timestamp |

**Indexes**: student_id, teacher_id, date, activity_type, sync_status
**Unique Constraint**: (student_id, date, activity_type) - prevent duplicate entries

---

### 9. assessments
Progress measurements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| student_id | UUID | FK, NOT NULL | Reference to students |
| teacher_id | UUID | FK, NOT NULL | Who assessed |
| assessment_date | DATE | NOT NULL | Assessment date |
| category | VARCHAR(50) | NOT NULL | physical, mental, behavioral, academic |
| metric | VARCHAR(100) | NOT NULL | height, weight, chess_rating, etc. |
| value | VARCHAR(255) | NOT NULL | Measurement value |
| unit | VARCHAR(50) | NULLABLE | cm, kg, rating, etc. |
| notes | TEXT | NULLABLE | Detailed notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Physical metrics**: height, weight, bmi, pushups, running_time, flexibility
**Mental metrics**: chess_rating, yoga_postures, meditation_minutes
**Behavioral metrics**: discipline_rating, peer_collaboration, attendance_punctuality
**Academic metrics**: school_attendance_correlation

**Indexes**: student_id, teacher_id, assessment_date, category, metric

---

### 10. incentives
Milestone-based rewards

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| student_id | UUID | FK, NOT NULL | Reference to students |
| milestone_type | VARCHAR(50) | NOT NULL | 16_week_streak, etc. |
| amount | DECIMAL(10,2) | NOT NULL | ₹5000, etc. |
| weeks_completed | INTEGER | NOT NULL | Weeks at qualification |
| approval_status | VARCHAR(20) | DEFAULT 'pending' | pending, approved, disbursed, rejected |
| approved_by | UUID | FK | Admin user ID |
| approved_date | TIMESTAMP | NULLABLE | Approval timestamp |
| disbursed_date | TIMESTAMP | NULLABLE | Payment timestamp |
| disbursement_method | VARCHAR(50) | NULLABLE | bank_transfer, upi, etc. |
| transaction_id | VARCHAR(100) | NULLABLE | Payment reference |
| notes | TEXT | NULLABLE | Admin notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**: student_id, approval_status, approved_date, disbursed_date

---

### 11. badges
Achievement definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(255) | NOT NULL | Badge name |
| description | TEXT | NOT NULL | What it's for |
| icon_url | VARCHAR(500) | NULLABLE | Badge icon |
| badge_type | VARCHAR(50) | NOT NULL | attendance, skill, leadership |
| criteria | JSONB | NOT NULL | Unlock conditions |
| points_value | INTEGER | DEFAULT 0 | Points awarded |
| rarity | VARCHAR(20) | DEFAULT 'common' | common, rare, epic, legendary |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Example criteria JSON**:
```json
{
  "type": "attendance_streak",
  "days": 30
}
```

**Indexes**: badge_type, rarity

---

### 12. student_badges
Earned badges (many-to-many)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| student_id | UUID | FK, NOT NULL | Reference to students |
| badge_id | UUID | FK, NOT NULL | Reference to badges |
| earned_date | TIMESTAMP | DEFAULT NOW() | When earned |
| notified | BOOLEAN | DEFAULT false | Push notification sent |

**Indexes**: student_id, badge_id, earned_date
**Unique Constraint**: (student_id, badge_id)

---

### 13. activities
Educational content library

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| type | VARCHAR(50) | NOT NULL | video, audio, text, diagram |
| category | VARCHAR(50) | NOT NULL | exercise, chess, yoga, meditation, health |
| title | VARCHAR(255) | NOT NULL | Content title |
| description | TEXT | NULLABLE | Description |
| content_url | VARCHAR(500) | NULLABLE | S3/Cloudinary URL |
| thumbnail_url | VARCHAR(500) | NULLABLE | Preview image |
| duration_minutes | INTEGER | NULLABLE | For videos/audio |
| file_size_mb | DECIMAL(8,2) | NULLABLE | For offline download |
| language | VARCHAR(10) | NOT NULL | en, ta, hi |
| difficulty_level | VARCHAR(20) | DEFAULT 'beginner' | beginner, intermediate, advanced |
| is_premium | BOOLEAN | DEFAULT false | Unlock requirement |
| download_count | INTEGER | DEFAULT 0 | Popularity metric |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Update timestamp |

**Indexes**: type, category, language, difficulty_level, is_premium

---

### 14. student_activity_downloads
Track offline content

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| student_id | UUID | FK, NOT NULL | Reference to students |
| activity_id | UUID | FK, NOT NULL | Reference to activities |
| downloaded_at | TIMESTAMP | DEFAULT NOW() | Download timestamp |
| last_accessed | TIMESTAMP | NULLABLE | Last viewed |

**Indexes**: student_id, activity_id

---

### 15. notifications
Push/SMS notification log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK | Recipient (null for parents) |
| parent_id | UUID | FK | Parent recipient |
| type | VARCHAR(50) | NOT NULL | push, sms, email, whatsapp |
| category | VARCHAR(50) | NOT NULL | attendance, achievement, payment, reminder |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| data | JSONB | NULLABLE | Extra metadata |
| status | VARCHAR(20) | DEFAULT 'pending' | pending, sent, failed, delivered, read |
| sent_at | TIMESTAMP | NULLABLE | Send timestamp |
| delivered_at | TIMESTAMP | NULLABLE | Delivery confirmation |
| read_at | TIMESTAMP | NULLABLE | Read receipt |
| error_message | TEXT | NULLABLE | Failure reason |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**: user_id, parent_id, type, category, status, sent_at

---

### 16. sync_queue
Offline data sync management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK, NOT NULL | Who created it |
| entity_type | VARCHAR(50) | NOT NULL | attendance, assessment, etc. |
| entity_id | VARCHAR(100) | NULLABLE | Server ID after sync |
| offline_id | VARCHAR(100) | NOT NULL | Client temp ID |
| operation | VARCHAR(20) | NOT NULL | create, update, delete |
| payload | JSONB | NOT NULL | Full data |
| sync_status | VARCHAR(20) | DEFAULT 'pending' | pending, synced, failed, conflict |
| retry_count | INTEGER | DEFAULT 0 | Retry attempts |
| error_message | TEXT | NULLABLE | Failure reason |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| synced_at | TIMESTAMP | NULLABLE | Sync completion |

**Indexes**: user_id, entity_type, sync_status, created_at

---

### 17. audit_logs
Admin action tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK, NOT NULL | Who did it |
| action | VARCHAR(100) | NOT NULL | approve_incentive, delete_student, etc. |
| entity_type | VARCHAR(50) | NOT NULL | student, teacher, incentive, etc. |
| entity_id | UUID | NULLABLE | Affected record |
| old_values | JSONB | NULLABLE | Before state |
| new_values | JSONB | NULLABLE | After state |
| ip_address | VARCHAR(45) | NULLABLE | Request IP |
| user_agent | TEXT | NULLABLE | Browser info |
| timestamp | TIMESTAMP | DEFAULT NOW() | Action time |

**Indexes**: user_id, action, entity_type, entity_id, timestamp

---

### 18. daily_challenges
Gamification challenges

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| title | VARCHAR(255) | NOT NULL | Challenge title |
| description | TEXT | NOT NULL | Instructions |
| challenge_type | VARCHAR(50) | NOT NULL | activity, assessment, social |
| target_value | VARCHAR(100) | NOT NULL | "20 pushups", "1 hour chess" |
| points_reward | INTEGER | DEFAULT 0 | Points for completion |
| start_date | DATE | NOT NULL | Valid from |
| end_date | DATE | NOT NULL | Valid until |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**: challenge_type, start_date, end_date, is_active

---

### 19. student_challenges
Challenge completion tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| student_id | UUID | FK, NOT NULL | Reference to students |
| challenge_id | UUID | FK, NOT NULL | Reference to daily_challenges |
| status | VARCHAR(20) | DEFAULT 'in_progress' | in_progress, completed, failed |
| progress | VARCHAR(255) | NULLABLE | Current progress |
| completed_at | TIMESTAMP | NULLABLE | Completion time |
| points_earned | INTEGER | DEFAULT 0 | Points received |

**Indexes**: student_id, challenge_id, status

---

### 20. teacher_performance_logs
Track teacher metrics over time

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| teacher_id | UUID | FK, NOT NULL | Reference to teachers |
| month | DATE | NOT NULL | YYYY-MM-01 format |
| attendance_completion_rate | DECIMAL(5,2) | DEFAULT 0 | % of days logged |
| student_retention_rate | DECIMAL(5,2) | DEFAULT 0 | % students active |
| activity_variety_score | DECIMAL(5,2) | DEFAULT 0 | Diversity of activities |
| avg_student_progress | DECIMAL(5,2) | DEFAULT 0 | Avg student improvement |
| total_hours_logged | DECIMAL(10,2) | DEFAULT 0 | Total activity hours |
| performance_score | DECIMAL(5,2) | DEFAULT 0 | Composite score |
| bonus_earned | DECIMAL(10,2) | DEFAULT 0 | Bonus amount |
| notes | TEXT | NULLABLE | Admin notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**: teacher_id, month
**Unique Constraint**: (teacher_id, month)

---

## Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');

-- Activity types
CREATE TYPE activity_type AS ENUM ('sports', 'chess', 'yoga', 'meditation', 'strength_training');

-- Assessment categories
CREATE TYPE assessment_category AS ENUM ('physical', 'mental', 'behavioral', 'academic');

-- Incentive approval status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'disbursed', 'rejected');

-- Notification types
CREATE TYPE notification_type AS ENUM ('push', 'sms', 'email', 'whatsapp');

-- Sync status
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'failed', 'conflict');
```

## Key Relationships

1. **User → Student/Teacher/Parent** (1:1 optional, polymorphic)
2. **Student → Attendance** (1:many)
3. **Teacher → Attendance** (1:many)
4. **Student → Assessment** (1:many)
5. **Student → Incentive** (1:many)
6. **Student → StudentBadges → Badges** (many:many)
7. **Student → Squad** (many:1)
8. **Student → StudentParents → Parents** (many:many)
9. **Village → Users** (1:many)
10. **Teacher → Students** (1:many via assigned_teacher_id)

## Performance Considerations

1. **Partitioning**: Attendance table by date (monthly partitions)
2. **Archiving**: Move old audit_logs (>1 year) to cold storage
3. **Caching**: Redis for leaderboards, frequently accessed student stats
4. **Materialized Views**: Pre-computed dashboards, analytics
5. **Connection Pooling**: Neon has built-in pooling, use Prisma's connection limit

## Data Retention

- **Attendance**: Keep forever (historical analysis)
- **Notifications**: Delete after 90 days
- **Sync Queue**: Delete after successful sync + 7 days
- **Audit Logs**: Keep 2 years, then archive
- **Assessments**: Keep forever

## Security

- Row-Level Security (RLS) policies per user role
- Encrypted fields: phone, bank_account, ifsc_code
- Soft deletes for users, students (is_active flag)
- Audit logging for all admin actions

## Migration Strategy

1. Create enums first
2. Create lookup tables (villages, badges, activities)
3. Create users table
4. Create role-specific tables (students, teachers, parents)
5. Create relationship tables (squads, student_parents)
6. Create activity tables (attendance, assessments, incentives)
7. Create gamification tables (badges, challenges)
8. Create system tables (notifications, sync_queue, audit_logs)
9. Create indexes
10. Create views and functions

## Next Steps

1. Generate Prisma schema from this design
2. Create initial migration files
3. Seed database with sample data
4. Set up Neon database and apply migrations
