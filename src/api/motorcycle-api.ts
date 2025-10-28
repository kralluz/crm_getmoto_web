import { customAxiosInstance } from './axios-instance';
import type { Motorcycle, CreateMotorcycleData, UpdateMotorcycleData } from '../types/motorcycle';

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

  async delete(id: number | string) {
    return customAxiosInstance<{ message: string }>({
      url: `${BASE_URL}/${id}`,
      method: 'DELETE',
    });
  },
};

// Alias para manter compatibilidade
export const vehicleApi = motorcycleApi;
