import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useStudents } from '@/services/students.service';
import { useMarkBulkAttendance, useGeolocation } from '@/services/attendance.service';
import { format } from 'date-fns';

type ActivityType = 'classroom_session' | 'field_visit' | 'community_work' | 'sports' | 'cultural_activity';

export function BulkAttendancePage() {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activityType, setActivityType] = useState<ActivityType>('classroom_session');
  const [hours, setHours] = useState('2');
  const [checkInTime, setCheckInTime] = useState(format(new Date(), 'HH:mm'));
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: studentsData } = useStudents({ limit: 100, isDropout: false });
  const markBulkAttendance = useMarkBulkAttendance();
  const { getLocation } = useGeolocation();

  const students = studentsData?.students || [];
  const filteredStudents = students.filter((student) =>
    student.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user.phone.includes(searchTerm)
  );

  // Get location on mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = async () => {
    try {
      setLocationError('');
      const coords = await getLocation();
      setLocation(coords);
    } catch (error: any) {
      setLocationError(error.message || 'Failed to get location. Please enable location services.');
    }
  };

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAll = () => {
    setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
  };

  const clearAll = () => {
    setSelectedStudents(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudents.size === 0) {
      alert('Please select at least one student');
      return;
    }

    if (!location) {
      alert('Location is required. Please enable location services.');
      return;
    }

    try {
      await markBulkAttendance.mutateAsync({
        studentIds: Array.from(selectedStudents),
        date: new Date(date).toISOString(),
        activityType,
        hours: parseFloat(hours),
        checkInTime: new Date(`${date}T${checkInTime}`).toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        notes: notes || undefined,
      });

      // Reset form
      setSelectedStudents(new Set());
      setNotes('');
      alert(`Attendance marked successfully for ${selectedStudents.size} students!`);
    } catch (error: any) {
      alert(error.message || 'Failed to mark attendance. Please try again.');
    }
  };

  const activityTypes: { value: ActivityType; label: string }[] = [
    { value: 'classroom_session', label: 'Classroom Session' },
    { value: 'field_visit', label: 'Field Visit' },
    { value: 'community_work', label: 'Community Work' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural_activity', label: 'Cultural Activity' },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <Link
            to="/attendance/mark"
            className="px-4 py-2 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900"
          >
            Mark Attendance
          </Link>
          <Link
            to="/attendance/bulk"
            className="px-4 py-2 font-medium border-b-2 border-primary-600 text-primary-600"
          >
            Bulk Attendance
          </Link>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Attendance</h1>
          <p className="mt-2 text-gray-600">
            Mark attendance for multiple students at once
          </p>
        </div>

        {/* Location Status */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Location Status</p>
                {location ? (
                  <p className="text-sm text-green-600 mt-1">
                    Location captured ({location.latitude.toFixed(6)}, {location.longitude.toFixed(6)})
                  </p>
                ) : locationError ? (
                  <p className="text-sm text-red-600 mt-1">{locationError}</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Getting location...</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                className="btn btn-secondary"
              >
                Refresh Location
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Selection */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Select Students ({selectedStudents.size} selected)
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <input
                type="text"
                placeholder="Search students..."
                className="input mb-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 rounded"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900">{student.user.fullName}</p>
                      <p className="text-sm text-gray-500">{student.user.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Level {student.level}</p>
                      <p className="text-xs text-primary-600">🔥 {student.streakCount} days</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Attendance Form */}
          <form onSubmit={handleSubmit} className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                Attendance Details
              </h2>
            </div>
            <div className="card-body space-y-6">
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>

              {/* Activity Type */}
              <div>
                <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type *
                </label>
                <select
                  id="activityType"
                  className="input"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as ActivityType)}
                  required
                >
                  {activityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hours */}
              <div>
                <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
                  Hours *
                </label>
                <input
                  type="number"
                  id="hours"
                  className="input"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  min="0.5"
                  max="12"
                  step="0.5"
                  required
                />
              </div>

              {/* Check-in Time */}
              <div>
                <label htmlFor="checkInTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Time *
                </label>
                <input
                  type="time"
                  id="checkInTime"
                  className="input"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  className="input min-h-[100px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={markBulkAttendance.isPending || !location || selectedStudents.size === 0}
              >
                {markBulkAttendance.isPending ? (
                  <>
                    <span className="spinner mr-2"></span>
                    Marking Attendance...
                  </>
                ) : (
                  `Mark Attendance for ${selectedStudents.size} Student${selectedStudents.size !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
