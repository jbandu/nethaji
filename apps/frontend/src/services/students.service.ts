import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Student, PaginatedResponse } from '@/types';

// API endpoints
const STUDENTS_URL = '/students';

// Fetch all students with pagination and filters
export const useStudents = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  assignedTeacherId?: string;
  isDropout?: boolean;
}) => {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () =>
      api.get<{ students: Student[]; pagination: any }>(STUDENTS_URL, params)
        .then(res => res),
  });
};

// Fetch single student by ID
export const useStudent = (id: string) => {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get<{ student: Student }>(`${STUDENTS_URL}/${id}`).then(res => res.student),
    enabled: !!id,
  });
};

// Fetch student dashboard
export const useStudentDashboard = (id: string) => {
  return useQuery({
    queryKey: ['student-dashboard', id],
    queryFn: () => api.get(`${STUDENTS_URL}/${id}/dashboard`),
    enabled: !!id,
  });
};

// Create student mutation
export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.post(STUDENTS_URL, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

// Update student mutation
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`${STUDENTS_URL}/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
    },
  });
};

// Deactivate student mutation
export const useDeactivateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`${STUDENTS_URL}/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};
