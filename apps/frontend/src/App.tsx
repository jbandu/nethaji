import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { StudentsPage } from '@/pages/Students';
import { StudentDetailPage } from '@/pages/StudentDetail';
import { MarkAttendancePage } from '@/pages/MarkAttendance';
import { BulkAttendancePage } from '@/pages/BulkAttendance';
import { LeaderboardPage } from '@/pages/Leaderboard';
import { AnalyticsPage } from '@/pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Students Routes */}
        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/new"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Add New Student</h1>
                <p className="mt-2 text-gray-600">Coming soon...</p>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <StudentDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Edit Student</h1>
                <p className="mt-2 text-gray-600">Coming soon...</p>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Teachers Page</h1>
                <p className="mt-2 text-gray-600">Coming soon...</p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Attendance Routes */}
        <Route
          path="/attendance"
          element={<Navigate to="/attendance/mark" replace />}
        />

        <Route
          path="/attendance/mark"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <MarkAttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/bulk"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <BulkAttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assessments"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Assessments Page</h1>
                <p className="mt-2 text-gray-600">Coming soon...</p>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/incentives"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Incentives Page</h1>
                <p className="mt-2 text-gray-600">Coming soon...</p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Gamification Routes */}
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />

        {/* Analytics Routes */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Unauthorized */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-red-600">403</h1>
                <p className="mt-4 text-xl text-gray-700">Unauthorized Access</p>
                <p className="mt-2 text-gray-500">
                  You don't have permission to access this page.
                </p>
                <a href="/dashboard" className="mt-6 btn btn-primary inline-flex">
                  Go to Dashboard
                </a>
              </div>
            </div>
          }
        />

        {/* Catch all - redirect to dashboard or login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
