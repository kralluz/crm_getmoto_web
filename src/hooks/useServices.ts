import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrderApi } from '../api/service-api';
import type { 
  CreateServiceOrderData,
  ServiceOrderListParams 
} from '../types/service-order';

export function useServiceOrders(params?: ServiceOrderListParams) {
  return useQuery({
    queryKey: ['service-orders', params],
    queryFn: () => serviceOrderApi.getAll(params),
    retry: false, // Não tentar novamente em caso de erro
    meta: {
      skipErrorNotification: true, // Pula notificação automática de erro
    },
  });
}

export function useServiceOrder(id: number) {
  return useQuery({
    queryKey: ['service-order', id],
    queryFn: () => serviceOrderApi.getById(id),
    enabled: !!id,
    retry: false,
    meta: {
      skipErrorNotification: true,
    },
  });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceOrderData) => serviceOrderApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({ 
        queryKey: ['cashflow'], 
        refetchType: 'all' // Força refetch ativo e inativo
      });
    },
  });
}

/**
 * Hook para cancelar ordem de serviço com estorno automático
 * Ordens de serviço são imutáveis por design - não podem ser editadas
 */
export function useCancelServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cancelled_by, cancellation_reason }: { 
      id: number; 
      cancelled_by: number; 
      cancellation_reason: string 
    }) => serviceOrderApi.cancel(id, { cancelled_by, cancellation_reason }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['service-order', id] });
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({ 
        queryKey: ['cashflow'], 
        refetchType: 'all' // Força refetch ativo e inativo
      });
    },
  });
}

/**
 * Hook para atualizar apenas as observações de uma ordem de serviço
 * Única exceção à regra de imutabilidade
 */
export function useUpdateServiceOrderNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string | null }) => 
      serviceOrderApi.updateNotes(id, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['service-order', id] });
    },
  });
}

/**
 * Hook para atualizar apenas a descrição do serviço de uma ordem de serviço
 */
export function useUpdateServiceOrderDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, service_description }: { id: number; service_description: string | null }) => 
      serviceOrderApi.updateDescription(id, service_description),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['service-order', id] });
    },
  });
}

export function useDeleteServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => serviceOrderApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({ 
        queryKey: ['cashflow'], 
        refetchType: 'all' // Força refetch ativo e inativo
      });
    },
    onError: (error: any) => {
      console.error('Erro ao deletar ordem de serviço:', error);
      throw error;
    },
  });
}

export function useServiceOrdersByStatus(status: string) {
  return useQuery({
    queryKey: ['service-orders', 'status', status],
    queryFn: () => serviceOrderApi.getByStatus(status),
    enabled: !!status,
  });
}

export function useServiceOrdersByCustomer(customer_name: string) {
  return useQuery({
    queryKey: ['service-orders', 'customer', customer_name],
    queryFn: () => serviceOrderApi.getByCustomer(customer_name),
    enabled: !!customer_name,
  });
}

// Backward compatibility - mantém os hooks antigos apontando para os novos
export const useServices = useServiceOrders;
export const useService = useServiceOrder;
export const useCreateService = useCreateServiceOrder;
export const useCancelService = useCancelServiceOrder;
export const useDeleteService = useDeleteServiceOrder;
export const useServicesByStatus = useServiceOrdersByStatus;
