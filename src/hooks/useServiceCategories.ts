import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceCategoryApi } from '../api/service-category-api';
import type {
  CreateServiceCategoryData,
  UpdateServiceCategoryData,
  ServiceCategoryFilters,
} from '../types/service-category';
import { useNotification } from './useNotification';

export function useServiceCategories(params?: ServiceCategoryFilters) {
  return useQuery({
    queryKey: ['service-categories', params],
    queryFn: () => serviceCategoryApi.getAll(params),
  });
}

export function useServiceCategory(id: number | undefined) {
  return useQuery({
    queryKey: ['service-category', id],
    queryFn: () => serviceCategoryApi.getById(id!),
    enabled: !!id,
  });
}

export function useServiceCategoryWithStats(id: number | undefined) {
  return useQuery({
    queryKey: ['service-category-stats', id],
    queryFn: () => serviceCategoryApi.getWithStats(id!),
    enabled: !!id,
  });
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (data: CreateServiceCategoryData) => serviceCategoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      success('Categoria de serviço criada com sucesso!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.error || 'Erro ao criar categoria de serviço');
    },
  });
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServiceCategoryData }) =>
      serviceCategoryApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      queryClient.invalidateQueries({ queryKey: ['service-category', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['service-category-stats', variables.id] });
      success('Categoria de serviço atualizada com sucesso!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.error || 'Erro ao atualizar categoria de serviço');
    },
  });
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (id: number) => serviceCategoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      success('Categoria de serviço deletada com sucesso!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.error || 'Erro ao deletar categoria de serviço');
    },
  });
}
