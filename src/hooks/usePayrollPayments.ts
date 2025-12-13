import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollPaymentApi } from '../api/payroll-payment-api';
import { useNotification } from './useNotification';
import type { CreatePayrollPaymentData, CancelPaymentData } from '../types/payroll-payment';

// Hook para listar pagamentos
export function usePayrollPayments(employee_id?: number) {
  return useQuery({
    queryKey: ['payroll-payments', employee_id],
    queryFn: () => payrollPaymentApi.getAll(employee_id ? { employee_id } : undefined),
  });
}

// Hook para obter pagamento por ID
export function usePayrollPayment(id: string | number | undefined) {
  return useQuery({
    queryKey: ['payroll-payments', id],
    queryFn: () => payrollPaymentApi.getById(id!),
    enabled: !!id,
  });
}

// Hook para criar pagamento
export function useCreatePayrollPayment() {
  const queryClient = useQueryClient();
  const { success, error: errorNotif } = useNotification();

  return useMutation({
    mutationFn: (data: CreatePayrollPaymentData) => payrollPaymentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-payments'] });
      queryClient.invalidateQueries({ queryKey: ['paid-periods'] }); // Invalida períodos pagos
      queryClient.invalidateQueries({ queryKey: ['cashflow'] }); // Invalida cashflow
      success('Payment created successfully');
    },
    onError: (error: any) => {
      errorNotif(error?.response?.data?.error || 'Failed to create payment');
    },
  });
}

// Hook para cancelar pagamento
export function useCancelPayrollPayment() {
  const queryClient = useQueryClient();
  const { success, error: errorNotif } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: CancelPaymentData }) =>
      payrollPaymentApi.cancel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-payments'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] }); // Invalida cashflow
      success('Payment cancelled successfully');
    },
    onError: (error: any) => {
      errorNotif(error?.response?.data?.error || 'Failed to cancel payment');
    },
  });
}

// Hook para obter períodos já pagos de um funcionário
export function usePaidPeriods(employee_id: number | undefined) {
  return useQuery({
    queryKey: ['paid-periods', employee_id],
    queryFn: () => payrollPaymentApi.getPaidPeriods(employee_id!),
    enabled: !!employee_id,
    staleTime: 0, // Always fetch fresh data to avoid showing incorrect paid status
    refetchOnMount: 'always', // Always refetch when component mounts
  });
}
