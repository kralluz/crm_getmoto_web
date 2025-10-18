import { customAxiosInstance } from './axios-instance';
import type { Product, CreateProductData, UpdateProductData } from '../types/product';

const BASE_URL = '/api/products';

export const productApi = {
  async getAll(params?: { active?: boolean; category?: string }) {
    return customAxiosInstance<Product[]>({
      url: BASE_URL,
      method: 'GET',
      params,
    });
  },

  async getById(id: string) {
    return customAxiosInstance<Product>({
      url: `${BASE_URL}/${id}`,
      method: 'GET',
    });
  },

  async create(data: CreateProductData) {
    return customAxiosInstance<Product>({
      url: BASE_URL,
      method: 'POST',
      data,
    });
  },

  async update(id: string, data: UpdateProductData) {
    return customAxiosInstance<Product>({
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

  async getLowStock() {
    return customAxiosInstance<Product[]>({
      url: `${BASE_URL}/low-stock`,
      method: 'GET',
    });
  },
};
