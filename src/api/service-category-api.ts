import api from './axios-instance';
import type {
  ServiceCategory,
  ServiceCategoryWithRelations,
  ServiceCategoryWithStats,
  CreateServiceCategoryData,
  UpdateServiceCategoryData,
  ServiceCategoryFilters,
} from '../types/service-category';

const BASE_URL = '/api/service-categories';

export const serviceCategoryApi = {
  async getAll(params?: ServiceCategoryFilters): Promise<ServiceCategory[]> {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  async getById(id: number): Promise<ServiceCategoryWithRelations> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async getWithStats(id: number): Promise<ServiceCategoryWithStats> {
    const response = await api.get(`${BASE_URL}/${id}/stats`);
    return response.data;
  },

  async create(data: CreateServiceCategoryData): Promise<ServiceCategory> {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  async update(id: number, data: UpdateServiceCategoryData): Promise<ServiceCategory> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};
