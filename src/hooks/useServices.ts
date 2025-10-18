import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '../api/service-api';
import type { CreateServiceData, UpdateServiceData } from '../types/service';

export function useServices(params?: {
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => serviceApi.getAll(params),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => serviceApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceData) => serviceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceData }) =>
      serviceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => serviceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useServicesByStatus(status: string) {
  return useQuery({
    queryKey: ['services', 'status', status],
    queryFn: () => serviceApi.getByStatus(status),
    enabled: !!status,
  });
}
