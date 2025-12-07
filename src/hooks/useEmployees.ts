import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/employee-api';
import { useNotification } from './useNotification';
import type { CreateEmployeeData, UpdateEmployeeData } from '../types/employee';

// Hook para listar funcionários
export function useEmployees(is_active?: boolean) {
  return useQuery({
    queryKey: ['employees', is_active],
    queryFn: () => employeeApi.getAll(is_active !== undefined ? { is_active } : undefined),
  });
}

// Hook para obter funcionário por ID
export function useEmployee(id: string | number | undefined) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => employeeApi.getById(id!),
    enabled: !!id,
  });
}

// Hook para criar funcionário
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { success, error: errorNotif } = useNotification();

  return useMutation({
    mutationFn: (data: CreateEmployeeData) => employeeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      success('Employee created successfully');
    },
    onError: (error: any) => {
      errorNotif(error?.response?.data?.error || 'Failed to create employee');
    },
  });
}

// Hook para atualizar funcionário
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { success, error: errorNotif } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateEmployeeData }) =>
      employeeApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', variables.id] });
      success('Employee updated successfully');
    },
    onError: (error: any) => {
      errorNotif(error?.response?.data?.error || 'Failed to update employee');
    },
  });
}

// Hook para desabilitar funcionário
export function useDisableEmployee() {
  const queryClient = useQueryClient();
  const { success, error: errorNotif } = useNotification();

  return useMutation({
    mutationFn: (id: string | number) => employeeApi.disable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      success('Employee disabled successfully');
    },
    onError: (error: any) => {
      errorNotif(error?.response?.data?.error || 'Failed to disable employee');
    },
  });
}

// Hook para habilitar funcionário
export function useEnableEmployee() {
  const queryClient = useQueryClient();
  const { success, error: errorNotif } = useNotification();

  return useMutation({
    mutationFn: (id: string | number) => employeeApi.enable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      success('Employee enabled successfully');
    },
    onError: (error: any) => {
      errorNotif(error?.response?.data?.error || 'Failed to enable employee');
    },
  });
}
