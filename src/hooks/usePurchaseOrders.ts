import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi } from '../api/purchase-order-api';
import type {
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
  CancelPurchaseOrderData,
} from '../types/purchase-order';

export function usePurchaseOrders(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => purchaseOrderApi.getAll(params),
  });
}

export function usePurchaseOrder(id: number | string) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrderApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderData) =>
      purchaseOrderApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['outflows'] }); // Atualizar lista de despesas
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({ 
        queryKey: ['cashflow'], 
        refetchType: 'all' // Força refetch ativo e inativo
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdatePurchaseOrderData;
    }) => purchaseOrderApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({ 
        queryKey: ['cashflow'], 
        refetchType: 'all' // Força refetch ativo e inativo
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => purchaseOrderApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({ 
        queryKey: ['cashflow'], 
        refetchType: 'all' // Força refetch ativo e inativo
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
    },
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: CancelPurchaseOrderData;
    }) => purchaseOrderApi.cancel(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] }); // Atualiza a ordem específica
      queryClient.invalidateQueries({ queryKey: ['outflows'] }); // Atualizar lista de despesas
      // Invalidar TODAS as queries do cashflow (recursivo)
      queryClient.invalidateQueries({
        queryKey: ['cashflow'],
        refetchType: 'all' // Força refetch ativo e inativo
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
    },
  });
}

/**
 * Hook para atualizar apenas as observações de uma ordem de compra
 */
export function useUpdatePurchaseOrderNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: number | string; notes: string | null }) => 
      purchaseOrderApi.updateNotes(id, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
    },
  });
}
