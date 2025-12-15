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
    onSuccess: async () => {
      // Invalidar todas as queries de employees
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      // Refetch imediato para garantir que a lista seja atualizada
      await queryClient.refetchQueries({ queryKey: ['employees'] });
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
    onSuccess: async (_, variables) => {
      // Invalidar todas as queries de employees
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      await queryClient.invalidateQueries({ queryKey: ['employees', variables.id] });
      // Refetch imediato
      await queryClient.refetchQueries({ queryKey: ['employees'] });
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
    onSuccess: async () => {
      // Invalidar e refetch imediato
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      await queryClient.refetchQueries({ queryKey: ['employees'] });
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
    onSuccess: async () => {
      // Invalidar e refetch imediato
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      await queryClient.refetchQueries({ queryKey: ['employees'] });
      success('Employee enabled successfully');
    },
    onError: (error: any) => {
      errorNotif(error?.response?.data?.error || 'Failed to enable employee');
    },
  });
}

// Hook para alternar status de funcionário
export function useToggleEmployeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      is_active ? employeeApi.enable(id) : employeeApi.disable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
