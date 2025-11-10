import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motorcycleApi } from '../api/motorcycle-api';
import type { CreateMotorcycleData, UpdateMotorcycleData } from '../types/motorcycle';
import { useNotification } from './useNotification';

export function useVehicles(params?: { is_active?: boolean; search?: string }) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => motorcycleApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useVehicle(id: number | string | undefined) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => motorcycleApi.getById(id!),
    enabled: !!id,
  });
}

export function useVehicleStats(id: number | string | undefined) {
  return useQuery({
    queryKey: ['vehicle-stats', id],
    queryFn: () => motorcycleApi.getStats(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (data: CreateMotorcycleData) => motorcycleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      success('Veículo cadastrado com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao cadastrar veículo';
      showError(message);
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateMotorcycleData }) =>
      motorcycleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      success('Veículo atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao atualizar veículo';
      showError(message);
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (id: number | string) => motorcycleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      success('Veículo deletado com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao deletar veículo';
      showError(message);
    },
  });
}

export function useDeactivateVehicle() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (id: number | string) => motorcycleApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      success('Veículo desativado com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao desativar veículo';
      showError(message);
    },
  });
}

export function useActivateVehicle() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  return useMutation({
    mutationFn: (id: number | string) => motorcycleApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      success('Veículo ativado com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao ativar veículo';
      showError(message);
    },
  });
}

// Aliases para compatibilidade
export const useMotorcycles = useVehicles;
export const useMotorcycle = useVehicle;
export const useCreateMotorcycle = useCreateVehicle;
export const useUpdateMotorcycle = useUpdateVehicle;
export const useDeleteMotorcycle = useDeleteVehicle;
