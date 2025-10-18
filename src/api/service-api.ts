import { customAxiosInstance } from './axios-instance';
import type { Service, CreateServiceData, UpdateServiceData } from '../types/service';

const BASE_URL = '/api/services';

export const serviceApi = {
  async getAll(params?: {
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return customAxiosInstance<Service[]>({
      url: BASE_URL,
      method: 'GET',
      params,
    });
  },

  async getById(id: string) {
    return customAxiosInstance<Service>({
      url: `${BASE_URL}/${id}`,
      method: 'GET',
    });
  },

  async create(data: CreateServiceData) {
    return customAxiosInstance<Service>({
      url: BASE_URL,
      method: 'POST',
      data,
    });
  },

  async update(id: string, data: UpdateServiceData) {
    return customAxiosInstance<Service>({
      url: `${BASE_URL}/${id}`,
      method: 'PUT',
      data,
    });
  },

  async delete(id: string) {
    return customAxiosInstance<void>({
      url: `${BASE_URL}/${id}`,
      method: 'DELETE',
    });
  },

  async getByStatus(status: string) {
    return customAxiosInstance<Service[]>({
      url: `${BASE_URL}/status/${status}`,
      method: 'GET',
    });
  },
};
