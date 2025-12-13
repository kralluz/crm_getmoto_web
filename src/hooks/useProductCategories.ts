import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productCategoryApi } from '../api/product-category-api';
import type {
  CreateProductCategoryData,
  UpdateProductCategoryData,
  ProductCategoryFilters,
} from '../types/product-category';
import { useNotification } from './useNotification';

export function useProductCategories(params?: ProductCategoryFilters) {
  return useQuery({
    queryKey: ['product-categories', params],
    queryFn: () => productCategoryApi.getAll(params),
    staleTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: true, // Revalida quando a janela ganha foco
  });
}

export function useProductCategory(id: number | undefined) {
  return useQuery({
    queryKey: ['product-category', id],
    queryFn: () => productCategoryApi.getById(id!),
    enabled: !!id,
  });
}

export function useProductCategoryWithStats(id: number | undefined) {
  return useQuery({
    queryKey: ['product-category-stats', id],
    queryFn: () => productCategoryApi.getWithStats(id!),
    enabled: !!id,
  });
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (data: CreateProductCategoryData) => productCategoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      success('Categoria de produto criada com sucesso!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.error || 'Erro ao criar categoria de produto');
    },
  });
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductCategoryData }) =>
      productCategoryApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['product-category', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['product-category-stats', variables.id] });
      success('Categoria de produto atualizada com sucesso!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.error || 'Erro ao atualizar categoria de produto');
    },
  });
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (id: number) => productCategoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      success('Categoria de produto deletada com sucesso!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.error || 'Erro ao deletar categoria de produto');
    },
  });
}
