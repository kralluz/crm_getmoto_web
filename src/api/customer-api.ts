import { customAxiosInstance } from './axios-instance';
import type { Customer, CreateCustomerData, UpdateCustomerData } from '../types/customer';

const BASE_URL = '/api/customers';

export const customerApi = {
  async getAll(params?: { active?: boolean; search?: string }) {
    return customAxiosInstance<Customer[]>({
      url: BASE_URL,
      method: 'GET',
      params,
    });
  },

  async getById(id: string) {
    return customAxiosInstance<Customer>({
      url: `${BASE_URL}/${id}`,
      method: 'GET',
    });
  },

  async create(data: CreateCustomerData) {
    return customAxiosInstance<Customer>({
      url: BASE_URL,
      method: 'POST',
      data,
    });
  },

  async update(id: string, data: UpdateCustomerData) {
    return customAxiosInstance<Customer>({
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
};
