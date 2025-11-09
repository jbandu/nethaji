import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Attendance } from '@/types';

// API endpoints
const ATTENDANCE_URL = '/attendance';

// Fetch attendance records with filters
export const useAttendance = (params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  teacherId?: string;
  startDate?: string;
  endDate?: string;
  activityType?: string;
}) => {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => api.get<{ attendance: Attendance[]; pagination: any }>(ATTENDANCE_URL, params),
  });
};

// Fetch single attendance record
export const useAttendanceRecord = (id: string) => {
  return useQuery({
    queryKey: ['attendance', id],
    queryFn: () => api.get<{ attendance: Attendance }>(`${ATTENDANCE_URL}/${id}`).then(res => res.attendance),
    enabled: !!id,
  });
};

// Mark attendance mutation
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      studentId: string;
      date: string;
      activityType: string;
      hours: number;
      checkInTime: string;
      checkOutTime?: string;
      latitude?: number;
      longitude?: number;
      photoUrl?: string;
      notes?: string;
      offlineId?: string;
    }) => api.post(`${ATTENDANCE_URL}/mark`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

// Mark bulk attendance mutation
export const useMarkBulkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      studentIds: string[];
      date: string;
      activityType: string;
      hours: number;
      checkInTime: string;
      latitude?: number;
      longitude?: number;
      photoUrl?: string;
      notes?: string;
    }) => api.post(`${ATTENDANCE_URL}/bulk`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

// Update attendance mutation
export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`${ATTENDANCE_URL}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// Delete attendance mutation
export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`${ATTENDANCE_URL}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// Custom hook to get user's geolocation
export const useGeolocation = () => {
  const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  return { getLocation };
};
