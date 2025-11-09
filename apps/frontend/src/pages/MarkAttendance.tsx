import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useStudents } from '@/services/students.service';
import { useMarkAttendance, useGeolocation } from '@/services/attendance.service';
import { format } from 'date-fns';

type ActivityType = 'classroom_session' | 'field_visit' | 'community_work' | 'sports' | 'cultural_activity';

export function MarkAttendancePage() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activityType, setActivityType] = useState<ActivityType>('classroom_session');
  const [hours, setHours] = useState('2');
  const [checkInTime, setCheckInTime] = useState(format(new Date(), 'HH:mm'));
  const [checkOutTime, setCheckOutTime] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: studentsData } = useStudents({ limit: 100, isDropout: false });
  const markAttendance = useMarkAttendance();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    if (!location) {
      alert('Location is required. Please enable location services.');
      return;
    }

    try {
      await markAttendance.mutateAsync({
        studentId: selectedStudent,
        date: new Date(date).toISOString(),
        activityType,
        hours: parseFloat(hours),
        checkInTime: new Date(`${date}T${checkInTime}`).toISOString(),
        checkOutTime: checkOutTime ? new Date(`${date}T${checkOutTime}`).toISOString() : undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        notes: notes || undefined,
      });

      // Reset form
      setSelectedStudent('');
      setNotes('');
      setSearchTerm('');
      alert('Attendance marked successfully!');
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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <Link
            to="/attendance/mark"
            className="px-4 py-2 font-medium border-b-2 border-primary-600 text-primary-600"
          >
            Mark Attendance
          </Link>
          <Link
            to="/attendance/bulk"
            className="px-4 py-2 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900"
          >
            Bulk Attendance
          </Link>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="mt-2 text-gray-600">
            Record student attendance for various activities
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

        {/* Attendance Form */}
        <form onSubmit={handleSubmit} className="card">
          <div className="card-body space-y-6">
            {/* Student Selection */}
            <div>
              <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-2">
                Select Student *
              </label>
              <input
                type="text"
                placeholder="Search by name or phone..."
                className="input mb-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudent(student.id);
                          setSearchTerm(student.user.fullName);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                          selectedStudent === student.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <p className="font-medium text-gray-900">{student.user.fullName}</p>
                        <p className="text-sm text-gray-500">{student.user.phone}</p>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-2 text-sm text-gray-500">No students found</p>
                  )}
                </div>
              )}
            </div>

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

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label htmlFor="checkOutTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Time
                </label>
                <input
                  type="time"
                  id="checkOutTime"
                  className="input"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                />
              </div>
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
                placeholder="Add any additional notes about this attendance record..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={markAttendance.isPending || !location}
              >
                {markAttendance.isPending ? (
                  <>
                    <span className="spinner mr-2"></span>
                    Marking Attendance...
                  </>
                ) : (
                  'Mark Attendance'
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSelectedStudent('');
                  setSearchTerm('');
                  setNotes('');
                  setCheckOutTime('');
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
