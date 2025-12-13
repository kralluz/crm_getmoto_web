import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/product-api';
import type { 
  CreateProductData, 
  UpdateProductData,
  ProductFilters,
  CreateStockMoveData,
  StockMoveFilters
} from '../types/product';
import { useNotification } from './useNotification';

export function useProducts(params?: ProductFilters) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.getAll(params),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true, // Revalida quando a janela ganha foco
  });
}

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (data: CreateProductData) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      success('Produto criado com sucesso!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.error || 'Erro ao criar produto');
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductData }) =>
      productApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      success('Produto atualizado com sucesso!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.error || 'Erro ao atualizar produto');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      success('Produto deletado com sucesso!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.error || 'Erro ao deletar produto');
    },
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: () => productApi.getLowStock(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ========== MOVIMENTAÇÕES DE ESTOQUE ==========

export function useCreateStockMove() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (data: CreateStockMoveData) => productApi.createStockMove(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
      success('Movimentação de estoque registrada com sucesso!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.error || 'Erro ao registrar movimentação');
    },
  });
}

export function useStockMoves(params?: StockMoveFilters) {
  return useQuery({
    queryKey: ['stock-moves', params],
    queryFn: () => productApi.getStockMoves(params),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true, // Revalida quando a janela ganha foco
  });
}
