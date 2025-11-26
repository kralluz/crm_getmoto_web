import { customAxiosInstance } from './axios-instance';
import type { Motorcycle, CreateMotorcycleData, UpdateMotorcycleData } from '../types/motorcycle';
import type { VehicleStats } from '../types/vehicle';

const BASE_URL = '/api/vehicles';

export const motorcycleApi = {
  async getAll(params?: { is_active?: boolean; search?: string }) {
    return customAxiosInstance<Motorcycle[]>({
      url: BASE_URL,
      method: 'GET',
      params,
    });
  },

  async getById(id: number | string) {
    return customAxiosInstance<Motorcycle>({
      url: `${BASE_URL}/${id}`,
      method: 'GET',
    });
  },

  async getStats(id: number | string) {
    return customAxiosInstance<VehicleStats>({
      url: `${BASE_URL}/${id}/stats`,
      method: 'GET',
    });
  },

  async create(data: CreateMotorcycleData) {
    return customAxiosInstance<Motorcycle>({
      url: BASE_URL,
      method: 'POST',
      data,
    });
  },

  async update(id: number | string, data: UpdateMotorcycleData) {
    return customAxiosInstance<Motorcycle>({
      url: `${BASE_URL}/${id}`,
      method: 'PUT',
      data,
    });
  },
};

// Alias para manter compatibilidade
export const vehicleApi = motorcycleApi;
