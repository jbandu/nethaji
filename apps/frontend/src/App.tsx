import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';

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

        {/* Placeholder routes for future pages */}
        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Students Page</h1>
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

        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Attendance Page</h1>
                <p className="mt-2 text-gray-600">Coming soon...</p>
              </div>
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
