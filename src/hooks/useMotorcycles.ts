import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motorcycleApi } from '../api/motorcycle-api';
import type { CreateMotorcycleData, UpdateMotorcycleData } from '../types/motorcycle';
import { useNotification } from './useNotification';
import { useTranslation } from 'react-i18next';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number | string) => motorcycleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      success(t('vehicles.vehicleDeletedSuccess'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('vehicles.vehicleDeleteError');
      showError(message);
    },
  });
}

export function useDeactivateVehicle() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number | string) => motorcycleApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      success(t('vehicles.vehicleDeactivatedSuccess'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('vehicles.vehicleDeactivationError');
      showError(message);
    },
  });
}

export function useActivateVehicle() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number | string) => motorcycleApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      success(t('vehicles.vehicleActivatedSuccess'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('vehicles.vehicleActivationError');
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
