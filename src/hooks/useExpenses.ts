import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../api/expense-api';
import type {
  CreateExpenseData,
  UpdateExpenseData,
  CancelExpenseData,
} from '../types/expense';

// Hook para buscar TODAS as saídas (despesas + ordens de compra + outros)
export function useAllOutflows(params?: {
  category?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['outflows', params],
    queryFn: () => expenseApi.getAllOutflows(params),
  });
}

// Hook para buscar apenas despesas operacionais (legacy)
export function useExpenses(params?: {
  category?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expenseApi.getAll(params),
  });
}

export function useExpense(id: number | string) {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => expenseApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseData) => expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['outflows'] });
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({ 
        queryKey: ['cashflow'], 
        refetchType: 'all' // Força refetch ativo e inativo
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateExpenseData;
    }) => expenseApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', id] });
      queryClient.invalidateQueries({ queryKey: ['outflows'] });
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({ 
        queryKey: ['cashflow'], 
        refetchType: 'all' // Força refetch ativo e inativo
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outflows'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({ 
        queryKey: ['cashflow'], 
        refetchType: 'all' // Força refetch ativo e inativo
      });
    },
  });
}

export function useCancelExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: CancelExpenseData;
    }) => expenseApi.cancel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outflows'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({ 
        queryKey: ['cashflow'], 
        refetchType: 'all' // Força refetch ativo e inativo
      });
    },
  });
}

/**
 * Hook para atualizar apenas a descrição de uma despesa
 */
export function useUpdateExpenseDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, description }: { id: number | string; description: string }) => 
      expenseApi.updateDescription(id, description),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['outflows'] });
      queryClient.invalidateQueries({ queryKey: ['expense', id] });
    },
  });
}
