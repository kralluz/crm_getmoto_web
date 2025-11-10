import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockAdjustmentApi } from '../api/stock-adjustment-api';
import type { CreateStockAdjustmentData } from '../types/stock-adjustment';

export function useStockAdjustments(params?: {
  product_id?: number;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['stock-adjustments', params],
    queryFn: () => stockAdjustmentApi.getAll(params),
  });
}

export function useStockAdjustment(id: number | string) {
  return useQuery({
    queryKey: ['stock-adjustment', id],
    queryFn: () => stockAdjustmentApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateStockAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStockAdjustmentData) =>
      stockAdjustmentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteStockAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => stockAdjustmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
    },
  });
}

export function useStockAdjustmentsByProduct(productId: number) {
  return useQuery({
    queryKey: ['stock-adjustments', 'product', productId],
    queryFn: () => stockAdjustmentApi.getByProduct(productId),
    enabled: !!productId,
  });
}
