import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import {
  getDashboardOverview,
  getDropoutRisk,
  DashboardOverview,
  DropoutRiskAnalysis,
} from '@/services/analytics.service';

export function AnalyticsPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [dropoutRisk, setDropoutRisk] = useState<DropoutRiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'dropout'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const [overviewRes, dropoutRes] = await Promise.all([
        getDashboardOverview(),
        getDropoutRisk(),
      ]);

      if (overviewRes.success) {
        setOverview(overviewRes.data);
      }

      if (dropoutRes.success) {
        setDropoutRisk(dropoutRes.data);
      }
    } catch (err: any) {
      console.error('Load analytics error:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">Program insights and metrics</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('dropout')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dropout'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dropout Risk
            </button>
          </nav>
        </div>

        {/* Loading & Error */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading analytics...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {!loading && activeTab === 'overview' && overview && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Students */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Total Students</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {overview.students.total}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="text-green-600">{overview.students.active} active</span>
                  {' • '}
                  <span className="text-red-600">{overview.students.dropout} dropout</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Dropout rate: {overview.students.dropoutRate.toFixed(1)}%
                </div>
              </div>

              {/* Teachers */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Teachers</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {overview.teachers.total}
                </div>
                <div className="mt-2 text-sm text-green-600">{overview.teachers.active} active</div>
              </div>

              {/* Attendance Today */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Attendance Today</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {overview.attendance.today}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Rate: {overview.attendance.rate.toFixed(1)}%
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  This month: {overview.attendance.thisMonth}
                </div>
              </div>

              {/* Pending Incentives */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Pending Incentives</div>
                <div className="mt-2 text-3xl font-bold text-orange-600">
                  {overview.incentives.pending}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Total: ₹{overview.incentives.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🌟 Top Performers</h2>
              <div className="space-y-3">
                {overview.topPerformers.map((performer) => (
                  <div key={performer.rank} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {performer.rank === 1 ? '🥇' : performer.rank === 2 ? '🥈' : performer.rank === 3 ? '🥉' : `#${performer.rank}`}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{performer.name}</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{performer.points} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Activity Breakdown (This Month)</h2>
              <div className="space-y-3">
                {overview.activityBreakdown.map((activity) => (
                  <div key={activity.activity} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {activity.activity.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500">{activity.count} sessions</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-indigo-600">
                        {Number(activity.totalHours).toFixed(1)} hrs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Infrastructure */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🏘️ Infrastructure</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Villages</div>
                  <div className="text-2xl font-bold text-gray-900">{overview.infrastructure.villages}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Squads</div>
                  <div className="text-2xl font-bold text-gray-900">{overview.infrastructure.squads}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dropout Risk Tab */}
        {!loading && activeTab === 'dropout' && dropoutRisk && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Total Students</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {dropoutRisk.summary.totalStudents}
                </div>
              </div>

              <div className="bg-red-50 rounded-lg shadow p-6">
                <div className="text-sm font-medium text-red-700">Critical Risk</div>
                <div className="mt-2 text-3xl font-bold text-red-600">
                  {dropoutRisk.summary.criticalCount}
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg shadow p-6">
                <div className="text-sm font-medium text-orange-700">High Risk</div>
                <div className="mt-2 text-3xl font-bold text-orange-600">
                  {dropoutRisk.summary.highCount}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg shadow p-6">
                <div className="text-sm font-medium text-yellow-700">Medium Risk</div>
                <div className="mt-2 text-3xl font-bold text-yellow-600">
                  {dropoutRisk.summary.mediumCount}
                </div>
              </div>
            </div>

            {/* At-Risk Students Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">⚠️ Students At Risk</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Risk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Village
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Attendance (7d)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Attendance (30d)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Streak
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Risk Factors
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dropoutRisk.students.map((student) => (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadgeColor(
                              student.riskLevel
                            )}`}
                          >
                            {student.riskLevel.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.village || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={
                              student.attendanceLast7Days === 0 ? 'text-red-600 font-bold' : 'text-gray-900'
                            }
                          >
                            {student.attendanceLast7Days} days
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={
                              student.attendanceLast30Days < 8 ? 'text-orange-600 font-bold' : 'text-gray-900'
                            }
                          >
                            {student.attendanceLast30Days} days
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.currentStreak}
                        </td>
                        <td className="px-6 py-4">
                          <ul className="text-xs text-gray-600 space-y-1">
                            {student.riskFactors.map((factor, idx) => (
                              <li key={idx}>• {factor}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {dropoutRisk.students.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No students at risk 🎉</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
