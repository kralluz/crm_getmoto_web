import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motorcycleApi } from '../api/motorcycle-api';
import type { CreateMotorcycleData, UpdateMotorcycleData } from '../types/motorcycle';
import { useNotification } from './useNotification';
import { useTranslation } from 'react-i18next';

export function useVehicles(params?: { is_active?: boolean; search?: string }) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => motorcycleApi.getAll(params),
    staleTime: 1 * 60 * 1000, // 1 minuto - dados considerados frescos
    gcTime: 5 * 60 * 1000, // 5 minutos - cache mantido em memória
    refetchOnWindowFocus: true, // Recarregar quando voltar para a aba
    refetchOnMount: true, // Recarregar ao montar o componente
  });
}

export function useVehicle(id: number | string | undefined) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => motorcycleApi.getById(id!),
    enabled: !!id,
    staleTime: 0, // Sempre buscar dados atualizados
    refetchOnWindowFocus: true,
    refetchOnMount: true,
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
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateMotorcycleData) => motorcycleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      success(t('vehicles.vehicleRegisteredSuccess'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || '';
      const status = error?.response?.status;
      
      // Detecta erro de placa duplicada (409 Conflict ou mensagem contendo 'placa' e 'existe/duplicada')
      const isDuplicatePlate = 
        status === 409 || 
        errorMessage.toLowerCase().includes('placa') && 
        (errorMessage.toLowerCase().includes('existe') || 
         errorMessage.toLowerCase().includes('duplicad') ||
         errorMessage.toLowerCase().includes('already') ||
         errorMessage.toLowerCase().includes('duplicate'));
      
      const message = isDuplicatePlate 
        ? t('vehicles.plateDuplicateError')
        : errorMessage || t('vehicles.vehicleRegistrationError');
      
      showError(message);
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateMotorcycleData }) =>
      motorcycleApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar lista de veículos
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      // Invalidar veículo específico que foi atualizado
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
      // Invalidar estatísticas do veículo
      queryClient.invalidateQueries({ queryKey: ['vehicle-stats', variables.id] });
      success(t('vehicles.vehicleUpdatedSuccess'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || '';
      const status = error?.response?.status;
      
      // Detecta erro de placa duplicada
      const isDuplicatePlate = 
        status === 409 || 
        errorMessage.toLowerCase().includes('placa') && 
        (errorMessage.toLowerCase().includes('existe') || 
         errorMessage.toLowerCase().includes('duplicad') ||
         errorMessage.toLowerCase().includes('already') ||
         errorMessage.toLowerCase().includes('duplicate'));
      
      const message = isDuplicatePlate 
        ? t('vehicles.plateDuplicateError')
        : errorMessage || t('vehicles.vehicleUpdateError');
      
      showError(message);
    },
  });
}


// Aliases para compatibilidade
export const useMotorcycles = useVehicles;
export const useMotorcycle = useVehicle;
export const useCreateMotorcycle = useCreateVehicle;
export const useUpdateMotorcycle = useUpdateVehicle;
