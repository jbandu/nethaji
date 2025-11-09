import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useStudents } from '@/services/students.service';
import { format } from 'date-fns';

export function StudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    isDropout: undefined as boolean | undefined,
  });

  const { data, isLoading, error } = useStudents({
    page,
    limit: 20,
    search: search || undefined,
    isDropout: filters.isDropout,
  });

  const students = data?.students || [];
  const pagination = data?.pagination;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="mt-2 text-gray-600">
              Manage and track all student records
            </p>
          </div>
          <Link to="/students/new" className="btn btn-primary">
            <span className="mr-2">+</span>
            Add Student
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  className="input w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="input w-full"
                  value={filters.isDropout === undefined ? '' : filters.isDropout.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters({
                      ...filters,
                      isDropout: value === '' ? undefined : value === 'true',
                    });
                  }}
                >
                  <option value="">All Students</option>
                  <option value="false">Active Only</option>
                  <option value="true">Dropouts Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading students...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card">
            <div className="card-body">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Failed to load students. Please try again.</p>
              </div>
            </div>
          </div>
        )}

        {/* Students Grid */}
        {!isLoading && !error && students.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <Link
                  key={student.id}
                  to={`/students/${student.id}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {student.user.fullName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {student.user.phone}
                        </p>
                      </div>
                      {student.isDropout && (
                        <span className="badge badge-danger">Dropout</span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Streak</span>
                        <span className="font-medium text-primary-700">
                          🔥 {student.streakCount} days
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Hours</span>
                        <span className="font-medium">{student.totalHours}h</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Level</span>
                        <span className="font-medium">Level {student.level}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Points</span>
                        <span className="font-medium text-yellow-600">
                          ⭐ {student.gamificationPoints}
                        </span>
                      </div>
                    </div>

                    {student.assignedTeacher && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Teacher: {student.assignedTeacher.user.fullName}
                        </p>
                      </div>
                    )}

                    {student.squad && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          Squad: {student.squad.name}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} students
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn btn-outline"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="btn btn-outline"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && students.length === 0 && (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="text-6xl mb-4">👨‍🎓</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No students found
              </h3>
              <p className="text-gray-600 mb-6">
                {search || filters.isDropout !== undefined
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first student'}
              </p>
              {!search && filters.isDropout === undefined && (
                <Link to="/students/new" className="btn btn-primary">
                  Add Student
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
