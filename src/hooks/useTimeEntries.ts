import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntryApi } from '../api/time-entry-api';
import { useNotification } from './useNotification';
import type { CreateTimeEntryData, UpdateTimeEntryData } from '../types/time-entry';

// Hook para listar entradas de tempo
export function useTimeEntries(params?: { employee_id?: number; start_date?: string; end_date?: string }) {
  return useQuery({
    queryKey: ['time-entries', params],
    queryFn: () => timeEntryApi.getAll(params),
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: 'always', // Always refetch when component mounts
  });
}

// Hook para obter entrada de tempo por ID
export function useTimeEntry(id: string | number | undefined) {
  return useQuery({
    queryKey: ['time-entries', id],
    queryFn: () => timeEntryApi.getById(id!),
    enabled: !!id,
  });
}

// Hook para criar entrada de tempo
export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  const { success, error: errorNotif } = useNotification();

  return useMutation({
    mutationFn: (data: CreateTimeEntryData) => timeEntryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      success('Time entry created successfully');
    },
    onError: (error: any) => {
      errorNotif(error?.response?.data?.error || 'Failed to create time entry');
    },
  });
}

// Hook para atualizar entrada de tempo
export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  const { success, error: errorNotif } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateTimeEntryData }) =>
      timeEntryApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries', variables.id] });
      success('Time entry updated successfully');
    },
    onError: (error: any) => {
      errorNotif(error?.response?.data?.error || 'Failed to update time entry');
    },
  });
}

// Hook para deletar entrada de tempo
export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  const { success, error: errorNotif } = useNotification();

  return useMutation({
    mutationFn: (id: string | number) => timeEntryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      success('Time entry deleted successfully');
    },
    onError: (error: any) => {
      errorNotif(error?.response?.data?.error || 'Failed to delete time entry');
    },
  });
}
