import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useStudent, useStudentDashboard } from '@/services/students.service';
import { format } from 'date-fns';

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: studentData, isLoading } = useStudent(id!);
  const { data: dashboard } = useStudentDashboard(id!);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (!studentData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Student not found</h2>
          <Link to="/students" className="btn btn-primary mt-4">
            Back to Students
          </Link>
        </div>
      </Layout>
    );
  }

  const student = studentData;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <Link to="/students" className="text-gray-600 hover:text-gray-900">
                ← Back
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {student.user.fullName}
              </h1>
            </div>
            <p className="mt-2 text-gray-600">{student.user.phone}</p>
          </div>
          <Link to={`/students/${id}/edit`} className="btn btn-primary">
            Edit Profile
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-3xl font-bold text-primary-700 mt-2">
                🔥 {student.streakCount} days
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {student.totalHours}h
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-600">Level & Points</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                Level {student.level}
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                ⭐ {student.gamificationPoints} points
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-600">Savings Balance</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ₹{student.savingsBalance}
              </p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium">
                  {format(new Date(student.dob), 'MMM d, yyyy')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Gender</p>
                <p className="font-medium capitalize">{student.gender}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Enrollment Date</p>
                <p className="font-medium">
                  {format(new Date(student.enrollmentDate), 'MMM d, yyyy')}
                </p>
              </div>

              {student.schoolName && (
                <div>
                  <p className="text-sm text-gray-600">School</p>
                  <p className="font-medium">{student.schoolName}</p>
                </div>
              )}

              {student.parentPhone && (
                <div>
                  <p className="text-sm text-gray-600">Parent Contact</p>
                  <p className="font-medium">{student.parentPhone}</p>
                </div>
              )}

              {student.emergencyContact && (
                <div>
                  <p className="text-sm text-gray-600">Emergency Contact</p>
                  <p className="font-medium">{student.emergencyContact}</p>
                </div>
              )}
            </div>
          </div>

          {/* Program Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                Program Information
              </h2>
            </div>
            <div className="card-body space-y-4">
              {student.assignedTeacher && (
                <div>
                  <p className="text-sm text-gray-600">Assigned Teacher</p>
                  <p className="font-medium">
                    {student.assignedTeacher.user.fullName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {student.assignedTeacher.user.phone}
                  </p>
                </div>
              )}

              {student.squad && (
                <div>
                  <p className="text-sm text-gray-600">Squad</p>
                  <p className="font-medium">{student.squad.name}</p>
                  <p className="text-sm text-gray-500">
                    {student.squad.totalPoints} total points
                  </p>
                </div>
              )}

              {student.user.village && (
                <div>
                  <p className="text-sm text-gray-600">Village</p>
                  <p className="font-medium">{student.user.village.name}</p>
                  <p className="text-sm text-gray-500">
                    {student.user.village.district}, {student.user.village.state}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Status</p>
                {student.isDropout ? (
                  <span className="badge badge-danger">Dropout</span>
                ) : (
                  <span className="badge badge-success">Active</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {dashboard && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>
            <div className="card-body">
              {dashboard.recentAttendance && dashboard.recentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recentAttendance.slice(0, 5).map((attendance: any) => (
                    <div
                      key={attendance.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium capitalize">
                          {attendance.activityType.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(attendance.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">{attendance.hours}h</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No recent activity
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
