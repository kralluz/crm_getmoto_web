import api from './axios-instance';
import type {
  ProductCategory,
  ProductCategoryWithStats,
  CreateProductCategoryData,
  UpdateProductCategoryData,
  ProductCategoryFilters,
} from '../types/product-category';

const BASE_URL = '/api/product-categories';

export const productCategoryApi = {
  async getAll(params?: ProductCategoryFilters): Promise<ProductCategory[]> {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  async getById(id: number): Promise<ProductCategory> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async getWithStats(id: number): Promise<ProductCategoryWithStats> {
    const response = await api.get(`${BASE_URL}/${id}/stats`);
    return response.data;
  },

  async create(data: CreateProductCategoryData): Promise<ProductCategory> {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  async update(id: number, data: UpdateProductCategoryData): Promise<ProductCategory> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};
