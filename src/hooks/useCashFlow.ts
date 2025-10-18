import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashFlowApi } from '../api/cashflow-api';
import type { CreateTransactionData } from '../types/cashflow';
import dayjs from 'dayjs';

// Hook para obter resumo financeiro
export function useCashFlowSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['cashflow', 'summary', startDate, endDate],
    queryFn: () => cashFlowApi.getSummary({ startDate, endDate }),
  });
}

// Hook para obter resumo por categorias
export function useCategorySummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['cashflow', 'categories', startDate, endDate],
    queryFn: () => cashFlowApi.getCategorySummary({ startDate, endDate }),
  });
}

// Hook para listar transações
export function useCashFlowTransactions(params?: {
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['cashflow', 'transactions', params],
    queryFn: () => cashFlowApi.getTransactions(params),
  });
}

// Hook para criar transação
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionData) =>
      cashFlowApi.createTransaction(data),
    onSuccess: () => {
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });
}

// Hook para deletar transação
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cashFlowApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });
}

// Hook para obter dados do dashboard com período customizável
export function useDashboardData(startDate?: string, endDate?: string) {
  // Se não passar datas, usa últimos 30 dias por padrão
  const defaultEndDate = dayjs().format('YYYY-MM-DD');
  const defaultStartDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD');

  const finalStartDate = startDate || defaultStartDate;
  const finalEndDate = endDate || defaultEndDate;

  const summary = useCashFlowSummary(finalStartDate, finalEndDate);
  const categories = useCategorySummary(finalStartDate, finalEndDate);
  const transactions = useCashFlowTransactions({
    startDate: finalStartDate,
    endDate: finalEndDate
  });

  return {
    summary: summary.data,
    categories: categories.data,
    transactions: transactions.data,
    isLoading: summary.isLoading || categories.isLoading || transactions.isLoading,
    isError: summary.isError || categories.isError || transactions.isError,
  };
}
