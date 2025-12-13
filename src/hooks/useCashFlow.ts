import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashFlowApi } from '../api/cashflow-api';
import dayjs from 'dayjs';

// Hook para obter resumo financeiro
export function useCashFlowSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['cashflow', 'summary', startDate, endDate],
    queryFn: () => cashFlowApi.getSummary({ startDate, endDate }),
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
    staleTime: 0, // Sempre considera dados obsoletos para refetch imediato
  });
}

// Hook para obter resumo por categorias
export function useCategorySummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['cashflow', 'categories', startDate, endDate],
    queryFn: () => cashFlowApi.getCategorySummary({ startDate, endDate }),
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
    staleTime: 0, // Sempre considera dados obsoletos para refetch imediato
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
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
    staleTime: 0, // Sempre considera dados obsoletos para refetch imediato
  });
}

// NOTA: useCreateTransaction foi REMOVIDO
// Cashflow agora é criado automaticamente através de:
// - Vendas em Ordens de Serviço (useCreateServiceOrder)
// - Compras de Estoque (useCreatePurchaseOrder)
// - Despesas Operacionais (useCreateExpense)
// Isso garante RASTREABILIDADE TOTAL de todas as transações.

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
  // Se não passar datas, usa o mês atual por padrão (sincronizado com PeriodSelector)
  const defaultEndDate = dayjs().format('YYYY-MM-DD');
  const defaultStartDate = dayjs().startOf('month').format('YYYY-MM-DD');

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
