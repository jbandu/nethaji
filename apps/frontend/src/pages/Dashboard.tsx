import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/stores/auth-store';

export function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's an overview of your Nethaji Empowerment Initiative dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">50</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
                  👨‍🎓
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                <span className="text-green-600 font-medium">↑ 12%</span> from last month
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">47</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                  ✅
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                94% engagement rate
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">42</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                  📝
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                84% attendance rate
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Incentives Paid</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">₹45,000</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">
                  💰
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                9 milestones achieved
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user?.role === 'admin' && (
                <>
                  <button className="btn btn-primary justify-center">
                    Add New Student
                  </button>
                  <button className="btn btn-outline justify-center">
                    View All Students
                  </button>
                  <button className="btn btn-outline justify-center">
                    Approve Incentives
                  </button>
                </>
              )}

              {user?.role === 'teacher' && (
                <>
                  <button className="btn btn-primary justify-center">
                    Mark Attendance
                  </button>
                  <button className="btn btn-outline justify-center">
                    Add Assessment
                  </button>
                  <button className="btn btn-outline justify-center">
                    View My Students
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <strong>Vikram Nair</strong> completed 7-day streak
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    New physical assessment recorded for <strong>Ananya Iyer</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    Incentive of ₹5,000 approved for student
                  </p>
                  <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
