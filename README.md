# Nethaji Empowerment Initiative - PWA

A full-stack Progressive Web App for managing a rural children's education and health program in India.

## Overview

This application serves 50+ rural children (scaling to 500+) with offline-first capabilities, low-bandwidth optimization, and multi-language support (English, Tamil, Hindi).

### Key Features

- **Offline-First Architecture**: Works 90% offline with background sync
- **Multi-Role Support**: Admin, Teacher, Student, Parent roles
- **Activity Tracking**: Attendance, physical fitness, chess, yoga, meditation
- **Gamification**: Badges, leaderboards, challenges, progress tracking
- **Incentive Management**: 16-week streak milestone (₹5,000 rewards)
- **SMS Integration**: Parent notifications via MSG91
- **Low-Bandwidth Optimized**: Works on 2G/3G with 2GB RAM devices

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt
- **File Upload**: Multer + Cloudinary
- **Image Processing**: Sharp

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **PWA**: Workbox + vite-plugin-pwa
- **Charts**: Recharts
- **i18n**: react-i18next
- **Offline Storage**: IndexedDB (idb)

### Infrastructure
- **Hosting**: Vercel (frontend + serverless functions)
- **Database**: Neon PostgreSQL
- **CDN**: Cloudinary (images/videos)
- **SMS**: MSG91 (India-optimized)
- **CI/CD**: GitHub Actions

## Project Structure

```
nethaji/
├── apps/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   └── frontend/         # React PWA
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── stores/
│       │   ├── utils/
│       │   ├── i18n/
│       │   └── App.tsx
│       ├── public/
│       └── package.json
│
├── docs/                 # Documentation
│   ├── database-schema.md
│   ├── api-spec.md
│   └── deployment.md
│
└── package.json          # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL (or Neon account)
- Cloudinary account (for file storage)
- MSG91 account (for SMS)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jbandu/nethaji.git
   cd nethaji
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Initialize database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:5173

### Database Setup

The app uses Neon PostgreSQL. Your connection string is already in `.env`.

```bash
# Generate Prisma Client
cd apps/backend
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

## Development

### Backend Development

```bash
cd apps/backend
npm run dev          # Start with hot reload
npm run test         # Run tests
npm run build        # Build for production
```

### Frontend Development

```bash
cd apps/frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

### Database Commands

```bash
# Create a new migration
npm run db:migrate -- --name add_new_feature

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database
npm run db:studio
```

## API Documentation

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://your-app.vercel.app/api/v1`

### Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### Key Endpoints

#### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user

#### Students
- `GET /students` - List students (teacher/admin)
- `GET /students/:id` - Get student details
- `POST /students` - Create student (admin)
- `PUT /students/:id` - Update student
- `GET /students/:id/progress` - Get progress data

#### Attendance
- `POST /attendance` - Mark attendance
- `POST /attendance/bulk` - Bulk attendance
- `GET /attendance/student/:id` - Get student attendance
- `PUT /attendance/:id` - Update attendance

#### Teachers
- `GET /teachers` - List teachers (admin)
- `GET /teachers/:id/performance` - Get performance metrics
- `POST /teachers/:id/bonus` - Award bonus

#### Incentives
- `GET /incentives/pending` - Get pending approvals (admin)
- `PUT /incentives/:id/approve` - Approve incentive
- `PUT /incentives/:id/disburse` - Mark as disbursed

See `docs/api-spec.md` for complete API documentation.

## Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Database Migrations in Production

```bash
# Run in Vercel build
npx prisma migrate deploy
```

See `docs/deployment.md` for detailed instructions.

## Testing

### Backend Tests

```bash
cd apps/backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Frontend Tests

```bash
cd apps/frontend
npm run test              # Run all tests
npm run test:ui           # Vitest UI
```

## Performance Targets

- [ ] Teacher marks attendance for 20 kids in <2 minutes
- [ ] Student dashboard loads in <3 seconds on 2G
- [ ] Admin generates donor report in <30 seconds
- [ ] Zero data loss during offline operation
- [ ] Parents receive SMS within 24 hours

## Security

- JWT authentication with bcrypt password hashing
- Role-based access control (RBAC)
- Helmet.js for HTTP headers
- Rate limiting on all endpoints
- Input validation with Zod
- SQL injection protection via Prisma
- Encrypted sensitive fields (phone, bank details)
- Audit logging for admin actions

## Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -m 'Add new feature'`
3. Push: `git push origin feature/new-feature`
4. Create Pull Request

## Support

- **Issues**: https://github.com/jbandu/nethaji/issues
- **Email**: support@nethaji.org (update with actual email)

## License

MIT License - see LICENSE file

## Acknowledgments

Built with support from the Nethaji Empowerment Initiative team and volunteers.

---

**Status**: 🚧 In Development (MVP Target: 4-6 weeks)
