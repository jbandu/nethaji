# Quick Start Guide

## 🚀 Starting Development

### Backend Server

```bash
cd /home/jbandu/nethaji/apps/backend
npm run dev
```

Server will start at: **http://localhost:3000**

### Test the API

**Health Check**:
```bash
curl http://localhost:3000/health
```

**Login as Admin**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "password": "password123"
  }'
```

This returns a JWT token. Use it for authenticated requests:

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🗄️ Database Commands

### View Database in Prisma Studio
```bash
cd apps/backend
npm run db:studio
```
Opens GUI at: **http://localhost:5555**

### Reset Database (Caution!)
```bash
cd apps/backend
npx prisma migrate reset
```

### Re-seed Data
```bash
cd apps/backend
npx tsx prisma/seed.ts
```

---

## 📝 Test Credentials

| Role | Email | Phone | Password |
|------|-------|-------|----------|
| Admin | admin@nethaji.org | +919876543210 | password123 |
| Teacher 1 | teacher1@nethaji.org | +919876543211 | password123 |
| Teacher 2 | teacher2@nethaji.org | +919876543212 | password123 |

---

## 🔧 Useful Commands

### Install Dependencies
```bash
npm install
```

### TypeScript Check
```bash
cd apps/backend
npx tsc --noEmit
```

### Git Commands
```bash
git status
git add .
git commit -m "Your message"
git push origin main
```

---

## 🎯 Next Development Tasks

Based on project-status.md, the next priorities are:

1. **Student Management API**
   - Create `apps/backend/src/controllers/student.controller.ts`
   - Create `apps/backend/src/routes/student.routes.ts`
   - Implement CRUD operations

2. **Teacher Management API**
   - Create `apps/backend/src/controllers/teacher.controller.ts`
   - Create `apps/backend/src/routes/teacher.routes.ts`
   - Implement CRUD operations

3. **Attendance API**
   - Create `apps/backend/src/controllers/attendance.controller.ts`
   - Create `apps/backend/src/routes/attendance.routes.ts`
   - Implement marking, bulk marking, retrieval

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# OR
killall -9 node tsx
```

### Prisma Client Not Generated
```bash
cd apps/backend
npx prisma generate
```

### Database Connection Issues
Check `.env` file has correct DATABASE_URL:
```
DATABASE_URL="postgresql://neondb_owner:npg_HdXGKE0vk6QT@ep-twilight-fire-a4e35g9i-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

---

## 📂 Project Structure Reference

```
apps/backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Auth, validation, etc.
│   ├── services/         # Business logic (create as needed)
│   ├── utils/            # Helpers
│   ├── config/           # Configuration
│   └── index.ts          # Main server file
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration files
│   └── seed.ts           # Seed data
└── package.json
```

---

## 🔗 Important Links

- **GitHub Repo**: https://github.com/jbandu/nethaji
- **Neon Dashboard**: https://console.neon.tech/
- **Vercel Dashboard**: (will be set up for deployment)
- **MSG91 Dashboard**: (credentials needed)
- **Cloudinary Dashboard**: (credentials needed)
