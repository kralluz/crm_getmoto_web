import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrderApi } from '../api/service-api';
import type { 
  CreateServiceOrderData, 
  UpdateServiceOrderData,
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
    },
  });
}

export function useUpdateServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServiceOrderData }) =>
      serviceOrderApi.update(id, data),
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
export const useUpdateService = useUpdateServiceOrder;
export const useDeleteService = useDeleteServiceOrder;
export const useServicesByStatus = useServiceOrdersByStatus;
